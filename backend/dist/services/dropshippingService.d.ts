interface CJOrder {
    orderId: string;
    trackingNumber?: string;
    status: string;
    logistics?: string;
}
export declare class CJDropshippingService {
    private client;
    private token;
    private tokenExpiry;
    constructor();
    getToken(): Promise<string>;
    private headers;
    searchProducts(keyword: string, page?: number, pageSize?: number): Promise<any>;
    getProductDetail(pid: string): Promise<any>;
    getProductVariants(pid: string): Promise<any>;
    importProduct(cjProductId: string): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        slug: string;
        category: string;
        description: string;
        price: number;
        comparePrice: number | null;
        images: string[];
        stock: number;
        sku: string | null;
        cjProductId: string | null;
        tags: string[];
        featured: boolean;
        active: boolean;
    }>;
    createOrder(orderData: {
        orderId: string;
        shippingAddress: {
            firstName: string;
            lastName: string;
            phone: string;
            address: string;
            city: string;
            province: string;
            country: string;
            zip: string;
        };
        products: Array<{
            vid: string;
            quantity: number;
            shippingName?: string;
        }>;
    }): Promise<any>;
    getOrderTracking(cjOrderId: string): Promise<CJOrder>;
    getShippingTracking(trackingNumber: string, logisticName: string): Promise<any>;
    syncStock(): Promise<void>;
    getShippingMethods(pid: string, vid: string, country: string, quantity?: number): Promise<any>;
}
export declare const cjService: CJDropshippingService;
export {};
//# sourceMappingURL=dropshippingService.d.ts.map