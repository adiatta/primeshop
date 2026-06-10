
import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, isAdmin } from '../middleware/auth';
import type { AuthRequest } from '../middleware/auth';
import { cjService } from '../services/dropshippingService';
import { trackingService } from '../services/orderTrackingService';
import Stripe from 'stripe';


const router = Router();
const prisma = new PrismaClient();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? '');


// Toutes les routes admin sont protégées
router.use(authenticate, isAdmin);

// ── GET /api/admin/stats ─────────────────────────────────────
router.get('/stats', async (req, res) => {
  try {
    const [totalOrders, totalUsers, pendingOrders, revenueData] = await Promise.all([
      prisma.order.count(),
      prisma.user.count(),
      prisma.order.count({ where: { status: 'PENDING' } }),
      prisma.order.aggregate({
        where: { status: { in: ['CONFIRMED','PROCESSING','SHIPPED','DELIVERED'] } },
        _sum:  { total: true },
      }),
    ]);
    res.json({
      totalOrders,
      totalUsers,
      pendingOrders,
      revenue: revenueData._sum.total ?? 0,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/admin/orders ────────────────────────────────────
router.get('/orders', async (req, res) => {
  try {
    const { status, page = '1', limit = '50' } = req.query;
    const where: any = {};
    if (status && status !== 'ALL') where.status = String(status);

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          user:    { select: { id: true, name: true, email: true } },
          items:   { include: { product: { select: { name: true, images: true } } } },
          address: true,
        },
        orderBy: { createdAt: 'desc' },
        skip:    (Number(page) - 1) * Number(limit),
        take:    Number(limit),
      }),
      prisma.order.count({ where }),
    ]);

    res.json({ orders, total, pages: Math.ceil(total / Number(limit)) });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ── PATCH /api/admin/orders/:id — Mettre à jour statut ───────
router.patch('/orders/:id', async (req, res) => {
  try {
    const { status, trackingNumber } = req.body;
    const order = await prisma.order.update({
      where: { id: String(req.params.id) },
      data: {
        ...(status        && { status }),
        ...(trackingNumber && { trackingNumber }),
      },
      include: { user: true },
    });
    res.json(order);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/admin/users ─────────────────────────────────────
router.get('/users', async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true, name: true, email: true,
        role: true, createdAt: true,
        _count: { select: { orders: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(users);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/admin/promos ────────────────────────────────────
router.get('/promos', async (req, res) => {
  try {
    const promos = await prisma.promoCode.findMany({
      orderBy: { createdAt: 'desc' },
    });
    res.json(promos);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/admin/promos ───────────────────────────────────
router.post('/promos', async (req, res) => {
  try {
    const { code, discount, type, maxUses, expiresAt } = req.body;
    const promo = await prisma.promoCode.create({
      data: {
        code,
        discount:  Number(discount),
        type:      type || 'percentage',
        maxUses:   maxUses ? Number(maxUses) : null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        active:    true,
      },
    });
    res.status(201).json(promo);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ── PATCH /api/admin/promos/:code ────────────────────────────
router.patch('/promos/:code', async (req, res) => {
  try {
    const promo = await prisma.promoCode.update({
      where: { code: String(req.params.code) },
      data:  req.body,
    });
    res.json(promo);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});


// ── GET /api/admin/payments — Historique Stripe ──────────────
router.get('/payments', async (req, res) => {
  try {
    const { limit = '20', starting_after } = req.query;

    const params: {
      limit: number;
      starting_after?: string;
    } = {
      limit: Number(limit),
    };

    if (starting_after) {
      params.starting_after = String(starting_after);
    }


const intents = await stripe.paymentIntents.list(params);
    // Enrichir avec les données de commande en BDD
    const enriched = await Promise.all(
      intents.data.map(async (pi) => {
        const order = await prisma.order.findFirst({
          where:  { stripePaymentId: pi.id },
          include:{ user: { select: { name: true, email: true } } },
        });
        return {
          id:          pi.id,
          amount:      pi.amount / 100,
          currency:    pi.currency.toUpperCase(),
          status:      pi.status,
          created:     new Date(pi.created * 1000).toISOString(),
          customer:    order?.user?.name ?? pi.metadata?.userId ?? 'Inconnu',
          email:       order?.user?.email ?? '',
          orderId:     order?.id ?? null,
          orderStatus: order?.status ?? null,
          refunded:    pi.amount_received < pi.amount,
        };
      })
    );

    res.json({
      payments:    enriched,
      hasMore:     intents.has_more,
      lastId:      intents.data[intents.data.length - 1]?.id,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/admin/payments/refund — Rembourser ─────────────
router.post('/payments/refund', async (req, res) => {
  try {
    const { paymentIntentId, amount, reason = 'requested_by_customer' } = req.body;
    if (!paymentIntentId) return res.status(400).json({ error: 'paymentIntentId requis' });

    const pi = await stripe.paymentIntents.retrieve(paymentIntentId);
    if (!pi.latest_charge) return res.status(400).json({ error: 'Aucune charge trouvée' });

    const refundParams: {
  charge: string;
  reason: "duplicate" | "fraudulent" | "requested_by_customer";
  amount?: number;
} = {
  charge: String(pi.latest_charge),
  reason: reason as
    | "duplicate"
    | "fraudulent"
    | "requested_by_customer",
};

if (amount) {
  refundParams.amount = Math.round(Number(amount) * 100);
}

    const refund = await stripe.refunds.create(refundParams);

    // Mettre à jour le statut commande
    if (refund.status === 'succeeded') {
      await prisma.order.updateMany({
        where: { stripePaymentId: paymentIntentId },
        data:  { status: 'REFUNDED' },
      });
    }

    res.json({
      success: true,
      refundId: refund.id,
      amount:   refund.amount / 100,
      status:   refund.status,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/admin/payments/stats — Stats Stripe ─────────────
router.get('/payments/stats', async (req, res) => {
  try {
    const thirtyDaysAgo = Math.floor(Date.now() / 1000) - 30 * 24 * 3600;
    const intents = await stripe.paymentIntents.list({
      limit:    100,
      created: { gte: thirtyDaysAgo },
    });

    const succeeded = intents.data.filter(p => p.status === 'succeeded');
    const revenue   = succeeded.reduce((s, p) => s + p.amount_received, 0) / 100;
    const refunded  = intents.data.filter(p => p.amount_received < p.amount).length;

    res.json({
      total:       intents.data.length,
      succeeded:   succeeded.length,
      revenue,
      refunded,
      avgTicket:   succeeded.length ? revenue / succeeded.length : 0,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});


// ── Dropshipping ─────────────────────────────────────────────
// ── Statut API CJ ────────────────────────────────────────────
router.get('/dropshipping/status', async (req, res) => {
  try {
    const token = await cjService.getToken();
    res.json({ connected: !!token, message: token ? 'CJ API connectée' : 'Non connectée' });
  } catch (err: any) {
    res.json({ connected: false, message: err.message });
  }
});

// ── Recherche produits CJ ────────────────────────────────────
router.post('/dropshipping/search', async (req, res) => {
  try {
    const { keyword, page = 1 } = req.body;
    if (!keyword) return res.status(400).json({ error: 'Mot-clé requis' });
    const results = await cjService.searchProducts(String(keyword), Number(page));
    res.json(results);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ── Import produit CJ → BDD ──────────────────────────────────
router.post('/dropshipping/import', async (req, res) => {
  try {
    const { cjProductId } = req.body;
    if (!cjProductId) return res.status(400).json({ error: 'cjProductId requis' });
    const product = await cjService.importProduct(String(cjProductId));
    res.json({ success: true, product });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ── Sync stock tous les produits CJ ─────────────────────────
router.post('/dropshipping/sync-stock', async (req, res) => {
  try {
    await cjService.syncStock();
    const count = await prisma.product.count({ where: { cjProductId: { not: null } } });
    res.json({ success: true, message: `${count} produits synchronisés` });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ── Liste produits importés ──────────────────────────────────
router.get('/dropshipping/products', async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      where:   { cjProductId: { not: null } },
      select:  { id: true, name: true, price: true, stock: true, cjProductId: true, active: true, images: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json(products);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ── Fulfillment commande via CJ ──────────────────────────────
router.post('/dropshipping/fulfill/:orderId', async (req, res) => {
  try {
    const result = await trackingService.fulfillOrder(String(req.params.orderId));
    res.json({ success: true, result });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ── Sync tracking toutes les commandes en transit ────────────
router.post('/dropshipping/sync-tracking', async (req, res) => {
  try {
    await trackingService.syncAllTracking();
    const count = await prisma.order.count({
      where: { status: { in: ['CONFIRMED','PROCESSING','SHIPPED'] } },
    });
    res.json({ success: true, message: `${count} commandes mises à jour` });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ── Méthodes de livraison CJ ─────────────────────────────────
router.post('/dropshipping/shipping-methods', async (req, res) => {
  try {
    const { pid, vid, country = 'FR', quantity = 1 } = req.body;
    const methods = await cjService.getShippingMethods(pid, vid, country, quantity);
    res.json(methods);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;