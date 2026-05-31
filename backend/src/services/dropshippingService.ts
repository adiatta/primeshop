import axios, { AxiosInstance } from 'axios';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface CJOrder {
  orderId: string;
  trackingNumber?: string;
  status: string;
  logistics?: string;
}

export class CJDropshippingService {
  private client: AxiosInstance;
  private token: string | null = null;
  private tokenExpiry: number = 0;

  constructor() {
    this.client = axios.create({
      baseURL: 'https://developers.cjdropshipping.com/api2.0/v1',
      timeout: 10000,
    });
  }

  // ── Auth ──────────────────────────────────────────────
  async getToken(): Promise<string> {
    if (this.token && Date.now() < this.tokenExpiry) return this.token;
    const { data } = await this.client.post('/authentication/getAccessToken', {
      email: process.env.CJ_EMAIL,
      password: process.env.CJ_API_KEY,
    });
    if (!data.result) throw new Error('CJ Auth failed: ' + data.message);
    this.token = data.data.accessToken;
    this.tokenExpiry = Date.now() + (data.data.accessTokenExpiryDate - 300) * 1000;
    return this.token!;
  }

  private async headers() {
    return { 'CJ-Access-Token': await this.getToken() };
  }

  // ── Products ──────────────────────────────────────────
  async searchProducts(keyword: string, page = 1, pageSize = 20) {
    const { data } = await this.client.get('/product/list', {
      headers: await this.headers(),
      params: { productNameEn: keyword, pageNum: page, pageSize },
    });
    return data.data; // { list, total, pageNum, pageSize }
  }

  async getProductDetail(pid: string) {
    const { data } = await this.client.get('/product/query', {
      headers: await this.headers(),
      params: { pid },
    });
    return data.data;
  }

  async getProductVariants(pid: string) {
    const { data } = await this.client.get('/product/variant/query', {
      headers: await this.headers(),
      params: { pid },
    });
    return data.data;
  }

  // ── Import produit en BDD ─────────────────────────────
  async importProduct(cjProductId: string) {
    const [detail, variants] = await Promise.all([
      this.getProductDetail(cjProductId),
      this.getProductVariants(cjProductId),
    ]);

    const slug = detail.productNameEn
      .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const product = await prisma.product.upsert({
      where: { slug },
      update: {
        stock: detail.sellPrice ? 99 : 0,
        price: parseFloat(detail.sellPrice) * 2.5, // Marge x2.5
        images: detail.productImage ? [detail.productImage, ...(detail.productImages || [])] : [],
      },
      create: {
        name: detail.productNameEn,
        slug,
        description: detail.description || '',
        price: parseFloat(detail.sellPrice) * 2.5,
        comparePrice: parseFloat(detail.sellPrice) * 3,
        images: detail.productImage ? [detail.productImage] : [],
        stock: 99,
        sku: detail.productSku,
        cjProductId,
        category: detail.categoryName || 'Tech',
        tags: ['dropshipping', 'cj'],
      },
    });

    // Upsert variants
    for (const v of variants?.variants || []) {
      await prisma.variant.upsert({
        where: { id: v.vid },
        update: { stock: 99, price: parseFloat(v.variantSellPrice) * 2.5 },
        create: {
          id: v.vid,
          productId: product.id,
          name: v.variantKey,
          value: v.variantValue,
          price: parseFloat(v.variantSellPrice) * 2.5,
          stock: 99,
          sku: v.variantSku,
        },
      });
    }

    return product;
  }

  // ── Orders ────────────────────────────────────────────
  async createOrder(orderData: {
    orderId: string;
    shippingAddress: {
      firstName: string; lastName: string; phone: string;
      address: string; city: string; province: string;
      country: string; zip: string;
    };
    products: Array<{
      vid: string; quantity: number; shippingName?: string;
    }>;
  }) {
    const payload = {
      orderNumber: orderData.orderId,
      shippingCountryCode: orderData.shippingAddress.country,
      shippingCountry: orderData.shippingAddress.country,
      shippingProvince: orderData.shippingAddress.province,
      shippingCity: orderData.shippingAddress.city,
      shippingAddress: orderData.shippingAddress.address,
      shippingZip: orderData.shippingAddress.zip,
      shippingPhone: orderData.shippingAddress.phone,
      shippingFirstName: orderData.shippingAddress.firstName,
      shippingLastName: orderData.shippingAddress.lastName,
      products: orderData.products.map(p => ({
        vid: p.vid,
        quantity: p.quantity,
        shippingName: p.shippingName || 'CJPacket Ordinary',
      })),
      remark: `PrimeShop Order ${orderData.orderId}`,
    };

    const { data } = await this.client.post('/shopping/order/createOrder', payload, {
      headers: await this.headers(),
    });

    if (!data.result) throw new Error('CJ Order failed: ' + data.message);
    return data.data; // { orderId, orderNum }
  }

  // ── Tracking ──────────────────────────────────────────
  async getOrderTracking(cjOrderId: string): Promise<CJOrder> {
    const { data } = await this.client.get('/shopping/order/getOrderDetail', {
      headers: await this.headers(),
      params: { orderId: cjOrderId },
    });
    return data.data;
  }

  async getShippingTracking(trackingNumber: string, logisticName: string) {
    const { data } = await this.client.get('/logistic/query/track', {
      headers: await this.headers(),
      params: { trackNumber: trackingNumber, logisticName },
    });
    return data.data; // Array of tracking events
  }

  // ── Stock sync ────────────────────────────────────────
  async syncStock() {
    const products = await prisma.product.findMany({
      where: { cjProductId: { not: null } },
    });

    for (const p of products) {
      try {
        const detail = await this.getProductDetail(p.cjProductId!);
        const inStock = detail.productStatus === 2;
        await prisma.product.update({
          where: { id: p.id },
          data: { stock: inStock ? 99 : 0, active: inStock },
        });
      } catch (e) {
        console.error(`Stock sync error for ${p.id}:`, e);
      }
    }
    console.log(`✅ Stock synced for ${products.length} products`);
  }

  // ── Shipping methods ──────────────────────────────────
  async getShippingMethods(pid: string, vid: string, country: string, quantity = 1) {
    const { data } = await this.client.post('/logistic/freightCalculate', {
      startCountryCode: 'CN',
      endCountryCode: country,
      quantity,
      vid,
    }, { headers: await this.headers() });
    return data.data; // Array of { logisticName, price, time }
  }
}

export const cjService = new CJDropshippingService();