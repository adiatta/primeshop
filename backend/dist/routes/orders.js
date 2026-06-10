"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const auth_1 = require("../middleware/auth");
const dropshippingService_1 = require("../services/dropshippingService");
const router = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
// GET /api/orders/:id/tracking — Suivi en temps réel
router.get('/:id/tracking', auth_1.authenticate, async (req, res) => {
    try {
        const authReq = req;
        const order = await prisma.order.findFirst({
            where: { id: String(req.params.id), userId: authReq.user.id },
            include: { address: true },
        });
        if (!order)
            return res.status(404).json({ error: 'Commande introuvable' });
        // Étapes calculées depuis le statut
        const statusTimeline = buildTimeline(order);
        if (!order.trackingNumber) {
            return res.json({
                orderId: order.id,
                status: order.status,
                trackingNumber: null,
                timeline: statusTimeline,
                events: [],
                message: 'Numéro de suivi disponible après expédition',
            });
        }
        // Fetch tracking CJ en temps réel
        let events = [];
        try {
            events = await dropshippingService_1.cjService.getShippingTracking(order.trackingNumber, 'CJPacket');
        }
        catch {
            // CJ indisponible — on retourne quand même le statut
        }
        res.json({
            orderId: order.id,
            status: order.status,
            trackingNumber: order.trackingNumber,
            timeline: statusTimeline,
            events,
        });
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
function buildTimeline(order) {
    const steps = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'];
    const labels = {
        PENDING: 'Commande reçue',
        CONFIRMED: 'Commande confirmée',
        PROCESSING: 'En préparation',
        SHIPPED: 'Expédiée',
        DELIVERED: 'Livrée',
    };
    const curIdx = steps.indexOf(order.status);
    return steps.map((s, i) => ({
        status: s,
        label: labels[s],
        done: i <= curIdx,
        active: i === curIdx,
        date: i <= curIdx ? order.updatedAt : null,
    }));
}
// ── GET /api/orders — Mes commandes ──────────────────────────
router.get('/', auth_1.authenticate, async (req, res) => {
    try {
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
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// ── GET /api/orders/:id — Détail commande ────────────────────
router.get('/:id', auth_1.authenticate, async (req, res) => {
    try {
        const authReq = req;
        const order = await prisma.order.findFirst({
            where: { id: String(req.params.id), userId: authReq.user.id },
            include: {
                items: { include: { product: true } },
                address: true,
            },
        });
        if (!order)
            return res.status(404).json({ error: 'Commande introuvable' });
        res.json(order);
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// ── POST /api/orders — Créer commande après paiement ─────────
router.post('/', auth_1.authenticate, async (req, res) => {
    const authReq = req;
    try {
        const { items, address, stripePaymentId, total, shipping = 0, promoCode, } = req.body;
        // Calcul subtotal depuis les items
        const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
        // Calcul réduction promo
        let discount = 0;
        if (promoCode) {
            const promo = await prisma.promoCode.findUnique({
                where: { code: promoCode, active: true },
            });
            if (promo) {
                discount = promo.type === 'percentage'
                    ? subtotal * (promo.discount / 100)
                    : promo.discount;
                await prisma.promoCode.update({
                    where: { code: promoCode },
                    data: { currentUses: { increment: 1 } },
                }).catch(() => { });
            }
        }
        // 1. Créer l'adresse si fournie
        let addressId;
        if (address) {
            const savedAddr = await prisma.address.create({
                data: {
                    userId: authReq.user.id,
                    firstName: address.firstName ?? '',
                    lastName: address.lastName ?? '',
                    street: address.street ?? '',
                    city: address.city ?? '',
                    postalCode: address.postalCode ?? '',
                    country: address.country ?? 'FR',
                    phone: address.phone ?? '',
                    isDefault: false,
                },
            });
            addressId = savedAddr.id;
        }
        // 2. Créer la commande
        const order = await prisma.order.create({
            data: {
                userId: authReq.user.id,
                addressId,
                stripePaymentId: stripePaymentId ?? null,
                subtotal,
                total: total ?? subtotal - discount,
                shipping,
                discount,
                promoCode: promoCode ?? null,
                status: 'CONFIRMED',
                items: {
                    create: items.map((i) => ({
                        productId: i.productId,
                        quantity: i.quantity,
                        price: i.price,
                        variant: i.variant ?? null,
                    })),
                },
            },
            include: {
                items: { include: { product: { select: { name: true, images: true } } } },
                address: true,
            },
        });
        // 3. Décrémenter le stock (non bloquant)
        for (const item of items) {
            await prisma.product.update({
                where: { id: item.productId },
                data: { stock: { decrement: item.quantity } },
            }).catch(() => { });
        }
        console.log(`✅ Order created: ${order.id} — user: ${authReq.user.id}`);
        res.status(201).json(order);
    }
    catch (err) {
        console.error('❌ Order creation error:', err.message);
        res.status(500).json({ error: err.message || 'Erreur création commande' });
    }
});
// ── GET /api/orders/:id/tracking — Suivi temps réel ─────────
router.get('/:id/tracking', auth_1.authenticate, async (req, res) => {
    try {
        const authReq = req;
        const order = await prisma.order.findFirst({
            where: { id: String(req.params.id), userId: authReq.user.id },
        });
        if (!order)
            return res.status(404).json({ error: 'Commande introuvable' });
        if (!order.trackingNumber) {
            return res.json({ events: [], message: 'Numéro de suivi non encore disponible' });
        }
        const tracking = await dropshippingService_1.cjService.getShippingTracking(order.trackingNumber, 'CJPacket');
        res.json({ trackingNumber: order.trackingNumber, events: tracking });
    }
    catch (err) {
        res.status(500).json({ error: 'Impossible de récupérer le suivi' });
    }
});
// ── POST /api/orders/:id/cancel ──────────────────────────────
router.post('/:id/cancel', auth_1.authenticate, async (req, res) => {
    try {
        const authReq = req;
        const order = await prisma.order.findFirst({
            where: { id: String(req.params.id), userId: authReq.user.id },
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
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
exports.default = router;
//# sourceMappingURL=orders.js.map