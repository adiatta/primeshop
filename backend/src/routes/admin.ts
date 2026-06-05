
import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, isAdmin } from '../middleware/auth';
import type { AuthRequest } from '../middleware/auth';
import { cjService } from '../services/dropshippingService';
import { trackingService } from '../services/orderTrackingService';

const router = Router();
const prisma = new PrismaClient();

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

// ── Dropshipping ─────────────────────────────────────────────
router.post('/dropshipping/search', async (req, res) => {
  try {
    const { keyword, page } = req.body;
    const results = await cjService.searchProducts(keyword, page);
    res.json(results);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/dropshipping/import', async (req, res) => {
  try {
    const { cjProductId } = req.body;
    const product = await cjService.importProduct(cjProductId);
    res.json({ message: 'Produit importé avec succès', product });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/dropshipping/sync-stock', async (req, res) => {
  try {
    await cjService.syncStock();
    res.json({ message: 'Stock synchronisé' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/dropshipping/fulfill/:orderId', async (req, res) => {
  try {
    const result = await trackingService.fulfillOrder(String(req.params.orderId));
    res.json({ message: 'Commande transmise à CJ', result });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/dropshipping/sync-tracking', async (req, res) => {
  try {
    await trackingService.syncAllTracking();
    res.json({ message: 'Tracking synchronisé' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;