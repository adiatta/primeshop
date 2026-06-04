import cron from 'node-cron';
import { trackingService } from '../services/orderTrackingService';
import { cjService } from '../services/dropshippingService';

export function startCronJobs() {
  // Sync tracking toutes les heures
  cron.schedule('0 * * * *', async () => {
    console.log('🔄 [CRON] Syncing order tracking...');
    await trackingService.syncAllTracking();
  });

  // Sync stock toutes les 6h
  cron.schedule('0 */6 * * *', async () => {
    console.log('🔄 [CRON] Syncing CJ stock...');
    await cjService.syncStock();
  });

  // Retry failed fulfillments toutes les 30min
  cron.schedule('*/30 * * * *', async () => {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    const retryOrders = await prisma.order.findMany({
      where: { notes: 'RETRY_FULFILLMENT' },
    });
    for (const o of retryOrders) {
      console.log(`🔁 Retrying fulfillment for order ${o.id}`);
      await prisma.order.update({ where: { id: o.id }, data: { notes: null } });
      await trackingService.fulfillOrder(o.id);
    }
  });

  console.log('⏰ Cron jobs started');
}