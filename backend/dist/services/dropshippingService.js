"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cjService = exports.CJDropshippingService = void 0;
const axios_1 = __importDefault(require("axios"));
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
class CJDropshippingService {
    constructor() {
        this.token = null;
        this.tokenExpiry = 0;
        this.client = axios_1.default.create({
            baseURL: 'https://developers.cjdropshipping.com/api2.0/v1',
            timeout: 10000,
        });
    }
    // ── Auth ──────────────────────────────────────────────
    async getToken() {
        if (this.token && Date.now() < this.tokenExpiry)
            return this.token;
        const { data } = await this.client.post('/authentication/getAccessToken', {
            email: process.env.CJ_EMAIL,
            password: process.env.CJ_API_KEY,
        });
        if (!data.result)
            throw new Error('CJ Auth failed: ' + data.message);
        this.token = data.data.accessToken;
        this.tokenExpiry = Date.now() + (data.data.accessTokenExpiryDate - 300) * 1000;
        return this.token;
    }
    async headers() {
        return { 'CJ-Access-Token': await this.getToken() };
    }
    // ── Products ──────────────────────────────────────────
    async searchProducts(keyword, page = 1, pageSize = 20) {
        const { data } = await this.client.get('/product/list', {
            headers: await this.headers(),
            params: { productNameEn: keyword, pageNum: page, pageSize },
        });
        return data.data; // { list, total, pageNum, pageSize }
    }
    async getProductDetail(pid) {
        const { data } = await this.client.get('/product/query', {
            headers: await this.headers(),
            params: { pid },
        });
        return data.data;
    }
    async getProductVariants(pid) {
        const { data } = await this.client.get('/product/variant/query', {
            headers: await this.headers(),
            params: { pid },
        });
        return data.data;
    }
    // ── Import produit en BDD ─────────────────────────────
    async importProduct(cjProductId) {
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
    async createOrder(orderData) {
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
        if (!data.result)
            throw new Error('CJ Order failed: ' + data.message);
        return data.data; // { orderId, orderNum }
    }
    // ── Tracking ──────────────────────────────────────────
    async getOrderTracking(cjOrderId) {
        const { data } = await this.client.get('/shopping/order/getOrderDetail', {
            headers: await this.headers(),
            params: { orderId: cjOrderId },
        });
        return data.data;
    }
    async getShippingTracking(trackingNumber, logisticName) {
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
                const detail = await this.getProductDetail(p.cjProductId);
                const inStock = detail.productStatus === 2;
                await prisma.product.update({
                    where: { id: p.id },
                    data: { stock: inStock ? 99 : 0, active: inStock },
                });
            }
            catch (e) {
                console.error(`Stock sync error for ${p.id}:`, e);
            }
        }
        console.log(`✅ Stock synced for ${products.length} products`);
    }
    // ── Shipping methods ──────────────────────────────────
    async getShippingMethods(pid, vid, country, quantity = 1) {
        const { data } = await this.client.post('/logistic/freightCalculate', {
            startCountryCode: 'CN',
            endCountryCode: country,
            quantity,
            vid,
        }, { headers: await this.headers() });
        return data.data; // Array of { logisticName, price, time }
    }
}
exports.CJDropshippingService = CJDropshippingService;
exports.cjService = new CJDropshippingService();
//# sourceMappingURL=dropshippingService.js.map