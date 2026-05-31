"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.trackingService = exports.OrderTrackingService = void 0;
const client_1 = require("@prisma/client");
const dropshippingService_1 = require("./dropshippingService");
const emailService_1 = require("./emailService");
const prisma = new client_1.PrismaClient();
// Map CJ status → notre OrderStatus
const CJ_STATUS_MAP = {
    'CREATED': 'CONFIRMED',
    'IN_PROCESS': 'PROCESSING',
    'SHIPPED': 'SHIPPED',
    'DELIVERED': 'DELIVERED',
    'CANCELLED': 'CANCELLED',
};
class OrderTrackingService {
    // Appelé après paiement Stripe réussi
    async fulfillOrder(orderId) {
        const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: {
                items: { include: { product: true } },
                address: true,
                user: true,
            },
        });
        if (!order || !order.address)
            throw new Error('Order/address not found');
        // 1. Créer la commande CJ
        const cjPayload = {
            orderId: order.id,
            shippingAddress: {
                firstName: order.address.firstName,
                lastName: order.address.lastName,
                phone: order.address.phone || '',
                address: order.address.street,
                city: order.address.city,
                province: order.address.city,
                country: order.address.country,
                zip: order.address.postalCode,
            },
            products: order.items.map(item => ({
                vid: item.variant || item.productId,
                quantity: item.quantity,
                shippingName: 'CJPacket Ordinary',
            })),
        };
        try {
            const cjOrder = await dropshippingService_1.cjService.createOrder(cjPayload);
            // 2. Mettre à jour le statut
            await prisma.order.update({
                where: { id: orderId },
                data: {
                    status: 'CONFIRMED',
                    stripePaymentId: order.stripePaymentId,
                },
            });
            // 3. Email confirmation
            await emailService_1.emailService.sendOrderConfirmation(order.user.email, {
                customerName: order.user.name,
                orderId: order.id,
                items: order.items.map((item) => ({
                    name: item.product.name,
                    quantity: item.quantity,
                    price: item.price,
                })),
                total: order.total,
            });
            console.log(`✅ Order ${orderId} fulfilled with CJ order ${cjOrder.orderId}`);
            return cjOrder;
        }
        catch (err) {
            console.error('❌ CJ fulfillment error:', err);
            // Mettre en file d'attente pour retry
            await this.queueRetry(orderId);
        }
    }
    // Sync tracking pour toutes les commandes en transit
    async syncAllTracking() {
        const orders = await prisma.order.findMany({
            where: {
                status: { in: ['CONFIRMED', 'PROCESSING', 'SHIPPED'] },
                stripePaymentId: { not: null },
            },
            include: { user: true },
        });
        console.log(`🔄 Syncing tracking for ${orders.length} orders...`);
        for (const order of orders) {
            await this.syncOrderTracking(order.id);
        }
    }
    async syncOrderTracking(orderId) {
        const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: { user: true },
        });
        if (!order || !order.trackingNumber)
            return;
        try {
            const tracking = await dropshippingService_1.cjService.getShippingTracking(order.trackingNumber, 'CJPacket');
            if (!tracking?.length)
                return;
            // Déduire le statut depuis les events
            const latest = tracking[0];
            let newStatus = order.status;
            if (latest.context?.includes('delivered'))
                newStatus = 'DELIVERED';
            else if (latest.context?.includes('out for delivery'))
                newStatus = 'SHIPPED';
            else if (latest.context?.includes('departed'))
                newStatus = 'SHIPPED';
            if (newStatus !== order.status) {
                await prisma.order.update({
                    where: { id: orderId },
                    data: { status: newStatus },
                });
                // Email si livré
                if (newStatus === 'DELIVERED') {
                    await emailService_1.emailService.sendDeliveryConfirmation(order.user.email, { customerName: order.user.name, orderId: order.id });
                }
                // Email si expédié
                if (newStatus === 'SHIPPED') {
                    await emailService_1.emailService.sendShippingNotification(order.user.email, {
                        customerName: order.user.name,
                        orderId: order.id,
                        trackingNumber: order.trackingNumber,
                        trackingEvents: tracking,
                    });
                }
            }
            return { status: newStatus, events: tracking };
        }
        catch (err) {
            console.error(`Tracking sync error for order ${orderId}:`, err);
        }
    }
    async queueRetry(orderId) {
        // Simple : on re-essaie au prochain cycle cron
        await prisma.order.update({
            where: { id: orderId },
            data: { notes: 'RETRY_FULFILLMENT' },
        });
    }
}
exports.OrderTrackingService = OrderTrackingService;
exports.trackingService = new OrderTrackingService();
//# sourceMappingURL=orderTrackingService.js.map