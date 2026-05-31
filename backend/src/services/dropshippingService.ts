import axios from 'axios';

const CJ_BASE = 'https://developers.cjdropshipping.com/api2.0/v1';

export class CJDropshippingService {
  private token: string | null = null;

  async getToken(): Promise<string> {
    if (this.token) return this.token;
    const res = await axios.post(`${CJ_BASE}/authentication/getAccessToken`, {
      email: process.env.CJ_EMAIL,
      password: process.env.CJ_API_KEY,
    });
    this.token = res.data.data.accessToken;
    return this.token!;
  }

  async searchProducts(keyword: string, page = 1) {
    const token = await this.getToken();
    const res = await axios.get(`${CJ_BASE}/product/list`, {
      headers: { 'CJ-Access-Token': token },
      params: { productNameEn: keyword, pageNum: page, pageSize: 20 },
    });
    return res.data.data;
  }

  async getProductDetail(pid: string) {
    const token = await this.getToken();
    const res = await axios.get(`${CJ_BASE}/product/query`, {
      headers: { 'CJ-Access-Token': token },
      params: { pid },
    });
    return res.data.data;
  }

  async createOrder(orderData: any) {
    const token = await this.getToken();
    const res = await axios.post(`${CJ_BASE}/shopping/order/createOrder`, orderData, {
      headers: { 'CJ-Access-Token': token },
    });
    return res.data.data;
  }

  async trackOrder(orderId: string) {
    const token = await this.getToken();
    const res = await axios.get(`${CJ_BASE}/shopping/order/getOrderDetail`, {
      headers: { 'CJ-Access-Token': token },
      params: { orderId },
    });
    return res.data.data;
  }
}

export const cjService = new CJDropshippingService();