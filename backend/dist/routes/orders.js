"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const auth_1 = require("../middleware/auth");
const dropshippingService_1 = require("../services/dropshippingService");
const router = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
// GET /api/orders — Mes commandes
router.get('/', auth_1.authenticate, async (req, res) => {
    const authReq = req;
    const orders = await prisma.order.findMany({
        where: { userId: authReq.user.id },
        include: {
            items: { include: { product: { select: { name: true, images: true } } } },
            address: true,
        },
        orderBy: { createdAt: 'desc' },
    });
    res.json(orders);
});
// GET /api/orders/:id — Détail commande
router.get('/:id', auth_1.authenticate, async (req, res) => {
    const authReq = req;
    const order = await prisma.order.findFirst({
        where: {
            id: String(req.params.id)
        },
        include: {
            items: { include: { product: true } },
            address: true,
        },
    });
    if (!order)
        return res.status(404).json({ error: 'Commande introuvable' });
    res.json(order);
});
// POST /api/orders — Créer commande (après paiement)
router.post('/', auth_1.authenticate, async (req, res) => {
    const { items, addressId, promoCode, stripePaymentId } = req.body;
    const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
    let discount = 0;
    if (promoCode) {
        const promo = await prisma.promoCode.findUnique({ where: { code: promoCode } });
        if (promo?.active) {
            discount = promo.type === 'percentage' ? subtotal * (promo.discount / 100) : promo.discount;
            await prisma.promoCode.update({
                where: { code: promoCode },
                data: { currentUses: { increment: 1 } },
            });
        }
    }
    const order = await prisma.order.create({
        data: {
            userId: req.user.id,
            addressId,
            subtotal,
            total: subtotal - discount,
            discount,
            promoCode,
            stripePaymentId,
            status: 'PENDING',
            items: {
                create: items.map((i) => ({
                    productId: i.productId,
                    quantity: i.quantity,
                    price: i.price,
                    variant: i.variant,
                })),
            },
        },
        include: { items: true },
    });
    // Réduire le stock
    for (const item of items) {
        await prisma.product.update({
            where: { id: item.productId },
            data: { stock: { decrement: item.quantity } },
        });
    }
    res.status(201).json(order);
});
// GET /api/orders/:id/tracking — Suivi temps réel
router.get('/:id/tracking', auth_1.authenticate, async (req, res) => {
    const order = await prisma.order.findFirst({
        where: { id: req.params.id, userId: req.user.id },
    });
    if (!order)
        return res.status(404).json({ error: 'Commande introuvable' });
    if (!order.trackingNumber) {
        return res.json({ events: [], message: 'Numéro de suivi non encore disponible' });
    }
    try {
        const tracking = await dropshippingService_1.cjService.getShippingTracking(order.trackingNumber, 'CJPacket');
        res.json({ trackingNumber: order.trackingNumber, events: tracking });
    }
    catch {
        res.status(500).json({ error: 'Impossible de récupérer le suivi' });
    }
});
// POST /api/orders/:id/cancel
router.post('/:id/cancel', auth_1.authenticate, async (req, res) => {
    const order = await prisma.order.findFirst({
        where: { id: req.params.id, userId: req.user.id },
    });
    if (!order)
        return res.status(404).json({ error: 'Commande introuvable' });
    if (!['PENDING', 'CONFIRMED'].includes(order.status)) {
        return res.status(400).json({ error: 'Commande non annulable à ce stade' });
    }
    const updated = await prisma.order.update({
        where: { id: order.id },
        data: { status: 'CANCELLED' },
    });
    res.json(updated);
});
exports.default = router;
//# sourceMappingURL=orders.js.map