"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startCronJobs = startCronJobs;
const node_cron_1 = __importDefault(require("node-cron"));
const orderTrackingService_1 = require("../services/orderTrackingService");
const dropshippingService_1 = require("../services/dropshippingService");
function startCronJobs() {
    // Sync tracking toutes les heures
    node_cron_1.default.schedule('0 * * * *', async () => {
        console.log('🔄 [CRON] Syncing order tracking...');
        await orderTrackingService_1.trackingService.syncAllTracking();
    });
    // Sync stock toutes les 6h
    node_cron_1.default.schedule('0 */6 * * *', async () => {
        console.log('🔄 [CRON] Syncing CJ stock...');
        await dropshippingService_1.cjService.syncStock();
    });
    // Retry failed fulfillments toutes les 30min
    node_cron_1.default.schedule('*/30 * * * *', async () => {
        const { PrismaClient } = require('@prisma/client');
        const prisma = new PrismaClient();
        const retryOrders = await prisma.order.findMany({
            where: { notes: 'RETRY_FULFILLMENT' },
        });
        for (const o of retryOrders) {
            console.log(`🔁 Retrying fulfillment for order ${o.id}`);
            await prisma.order.update({ where: { id: o.id }, data: { notes: null } });
            await orderTrackingService_1.trackingService.fulfillOrder(o.id);
        }
    });
    console.log('⏰ Cron jobs started');
}
//# sourceMappingURL=cronJobs.js.map