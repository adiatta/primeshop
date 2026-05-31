export declare class OrderTrackingService {
    fulfillOrder(orderId: string): Promise<any>;
    syncAllTracking(): Promise<void>;
    syncOrderTracking(orderId: string): Promise<{
        status: import("@prisma/client").$Enums.OrderStatus;
        events: any;
    } | undefined>;
    private queueRetry;
}
export declare const trackingService: OrderTrackingService;
//# sourceMappingURL=orderTrackingService.d.ts.map