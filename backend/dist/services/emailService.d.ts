interface OrderItem {
    name: string;
    quantity: number;
    price: number;
    variant?: string;
}
export declare const emailService: {
    sendOrderConfirmation(to: string, data: {
        customerName: string;
        orderId: string;
        items: OrderItem[];
        total: number;
    }): Promise<void>;
    sendShippingNotification(to: string, data: {
        customerName: string;
        orderId: string;
        trackingNumber: string;
        trackingEvents?: any[];
    }): Promise<void>;
    sendDeliveryConfirmation(to: string, data: {
        customerName: string;
        orderId: string;
    }): Promise<void>;
    sendWelcomeEmail(to: string, data: {
        name: string;
    }): Promise<void>;
};
export {};
//# sourceMappingURL=emailService.d.ts.map