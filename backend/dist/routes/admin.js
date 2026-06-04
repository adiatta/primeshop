"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const auth_1 = require("../middleware/auth");
const dropshippingService_1 = require("../services/dropshippingService");
const orderTrackingService_1 = require("../services/orderTrackingService");
const router = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
// Toutes les routes admin sont protégées
router.use(auth_1.authenticate, auth_1.isAdmin);
// GET /api/admin/stats
router.get('/stats', async (req, res) => {
    const [totalOrders, totalUsers, revenue, pendingOrders] = await Promise.all([
        prisma.order.count(),
        prisma.user.count(),
        prisma.order.aggregate({
            where: { status: { in: ['CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'] } },
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
    const where = {};
    if (status)
        where.status = status;
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
    const { status, trackingNumber } = req.body;
    const order = await prisma.order.update({
        where: { id: req.params.id },
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
    const results = await dropshippingService_1.cjService.searchProducts(keyword, page);
    res.json(results);
});
// POST /api/admin/dropshipping/import — Importer produit CJ
router.post('/dropshipping/import', async (req, res) => {
    const { cjProductId } = req.body;
    const product = await dropshippingService_1.cjService.importProduct(cjProductId);
    res.json({ message: 'Produit importé avec succès', product });
});
// POST /api/admin/dropshipping/sync-stock — Sync stock CJ
router.post('/dropshipping/sync-stock', async (req, res) => {
    await dropshippingService_1.cjService.syncStock();
    res.json({ message: 'Stock synchronisé' });
});
// POST /api/admin/dropshipping/fulfill/:orderId — Passer commande CJ
router.post('/dropshipping/fulfill/:orderId', async (req, res) => {
    const result = await orderTrackingService_1.trackingService.fulfillOrder(req.params.orderId);
    res.json({ message: 'Commande transmise à CJ', result });
});
// POST /api/admin/dropshipping/sync-tracking — Sync tracking toutes commandes
router.post('/dropshipping/sync-tracking', async (req, res) => {
    await orderTrackingService_1.trackingService.syncAllTracking();
    res.json({ message: 'Tracking synchronisé' });
});
exports.default = router;
//# sourceMappingURL=admin.js.map