import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, isAdmin, AuthRequest } from '../middleware/auth';
import { cjService } from '../services/dropshippingService';
import { trackingService } from '../services/orderTrackingService';

const router = Router();
const prisma = new PrismaClient();

// Toutes les routes admin sont protégées
router.use(authenticate, isAdmin);

// GET /api/admin/stats
router.get('/stats', async (req, res) => {
  const [totalOrders, totalUsers, revenue, pendingOrders] = await Promise.all([
    prisma.order.count(),
    prisma.user.count(),
    prisma.order.aggregate({
      where: { status: { in: ['CONFIRMED','PROCESSING','SHIPPED','DELIVERED'] } },
      _sum: { total: true },
    }),
    prisma.order.count({ where: { status: 'PENDING' } }),
  ]);
  res.json({
    totalOrders, totalUsers,
    revenue: revenue._sum.total || 0,
    pendingOrders,
  });
});

// GET /api/admin/users
router.get('/users', async (req, res) => {
  const users = await prisma.user.findMany({
    select: {
      id: true, name: true, email: true,
      role: true, createdAt: true,
      _count: { select: { orders: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
  res.json(users);
});

// GET /api/admin/orders
router.get('/orders', async (req, res) => {
  const { status, page = '1', limit = '20' } = req.query;
  const where: any = {};
  if (status) where.status = status;
  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      include: {
        user: { select: { name: true, email: true } },
        items: { include: { product: { select: { name: true } } } },
        address: true,
      },
      orderBy: { createdAt: 'desc' },
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
    }),
    prisma.order.count({ where }),
  ]);
  res.json({ orders, total, pages: Math.ceil(total / Number(limit)) });
});

// PATCH /api/admin/orders/:id — Mettre à jour statut + tracking
router.patch('/orders/:id', async (req, res) => {
  const authReq = req as AuthRequest;
  const { status, trackingNumber } = req.body;
  const order = await prisma.order.update({
    where: { id: req.params.id as string },
    data: { ...(status && { status }), ...(trackingNumber && { trackingNumber }) },
    include: { user: true },
  });

  // Email si expédié manuellement
  if (status === 'SHIPPED' && trackingNumber) {
    // await emailService.sendShippingNotification(order.user.email, {...})
  }
  res.json(order);
});

// POST /api/admin/dropshipping/search — Chercher produit CJ
router.post('/dropshipping/search', async (req, res) => {
  const { keyword, page } = req.body;
  const results = await cjService.searchProducts(keyword, page);
  res.json(results);
});

// POST /api/admin/dropshipping/import — Importer produit CJ
router.post('/dropshipping/import', async (req, res) => {
  const { cjProductId } = req.body;
  const product = await cjService.importProduct(cjProductId);
  res.json({ message: 'Produit importé avec succès', product });
});

// POST /api/admin/dropshipping/sync-stock — Sync stock CJ
router.post('/dropshipping/sync-stock', async (req, res) => {
  await cjService.syncStock();
  res.json({ message: 'Stock synchronisé' });
});

// POST /api/admin/dropshipping/fulfill/:orderId — Passer commande CJ
router.post('/dropshipping/fulfill/:orderId', async (req, res) => {
  const result = await trackingService.fulfillOrder(req.params.orderId);
  res.json({ message: 'Commande transmise à CJ', result });
});

// POST /api/admin/dropshipping/sync-tracking — Sync tracking toutes commandes
router.post('/dropshipping/sync-tracking', async (req, res) => {
  await trackingService.syncAllTracking();
  res.json({ message: 'Tracking synchronisé' });
});


// GET /api/admin/promos
router.get('/promos', async (req, res) => {
  const promos = await prisma.promoCode.findMany({ orderBy: { createdAt: 'desc' } });
  res.json(promos);
});

// POST /api/admin/promos
router.post('/promos', async (req, res) => {
  const { code, discount, type, maxUses, expiresAt } = req.body;
  const promo = await prisma.promoCode.create({
    data: { code, discount, type: type || 'percentage', maxUses, expiresAt: expiresAt ? new Date(expiresAt) : null, active: true },
  });
  res.status(201).json(promo);
});

// PATCH /api/admin/promos/:code
router.patch('/promos/:code', async (req, res) => {
  const promo = await prisma.promoCode.update({
    where: { code: req.params.code },
    data:  req.body,
  });
  res.json(promo);
});

export default router;