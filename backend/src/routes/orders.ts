
import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth';
import type { AuthRequest } from '../middleware/auth';
import { cjService } from '../services/dropshippingService';

const router = Router();
const prisma = new PrismaClient();

// ── GET /api/orders — Mes commandes ──────────────────────────
router.get('/', authenticate, async (req, res) => {
  try {
    const authReq = req as AuthRequest;
    const orders = await prisma.order.findMany({
      where:   { userId: authReq.user!.id },
      include: {
        items:   { include: { product: { select: { name: true, images: true } } } },
        address: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(orders);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/orders/:id — Détail commande ────────────────────
router.get('/:id', authenticate, async (req, res) => {
  try {
    const authReq = req as AuthRequest;
    const order = await prisma.order.findFirst({
      where:   { id: String(req.params.id), userId: authReq.user!.id },
      include: {
        items:   { include: { product: true } },
        address: true,
      },
    });
    if (!order) return res.status(404).json({ error: 'Commande introuvable' });
    res.json(order);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/orders — Créer commande après paiement ─────────
router.post('/', authenticate, async (req, res) => {
  const authReq = req as AuthRequest;

  try {
    const {
      items,
      address,
      stripePaymentId,
      total,
      shipping  = 0,
      promoCode,
    } = req.body;

    // Calcul subtotal depuis les items
    const subtotal: number = items.reduce(
      (s: number, i: any) => s + i.price * i.quantity,
      0
    );

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
          data:  { currentUses: { increment: 1 } },
        }).catch(() => {});
      }
    }

    // 1. Créer l'adresse si fournie
    let addressId: string | undefined;
    if (address) {
      const savedAddr = await prisma.address.create({
        data: {
          userId:     authReq.user!.id,
          firstName:  address.firstName  ?? '',
          lastName:   address.lastName   ?? '',
          street:     address.street     ?? '',
          city:       address.city       ?? '',
          postalCode: address.postalCode ?? '',
          country:    address.country    ?? 'FR',
          phone:      address.phone      ?? '',
          isDefault:  false,
        },
      });
      addressId = savedAddr.id;
    }

    // 2. Créer la commande
    const order = await prisma.order.create({
      data: {
        userId:          authReq.user!.id,
        addressId,
        stripePaymentId: stripePaymentId ?? null,
        subtotal,
        total:           total ?? subtotal - discount,
        shipping,
        discount,
        promoCode:       promoCode ?? null,
        status:          'CONFIRMED',
        items: {
          create: items.map((i: any) => ({
            productId: i.productId,
            quantity:  i.quantity,
            price:     i.price,
            variant:   i.variant ?? null,
          })),
        },
      },
      include: {
        items:   { include: { product: { select: { name: true, images: true } } } },
        address: true,
      },
    });

    // 3. Décrémenter le stock (non bloquant)
    for (const item of items) {
      await prisma.product.update({
        where: { id: item.productId },
        data:  { stock: { decrement: item.quantity } },
      }).catch(() => {});
    }

    console.log(`✅ Order created: ${order.id} — user: ${authReq.user!.id}`);
    res.status(201).json(order);

  } catch (err: any) {
    console.error('❌ Order creation error:', err.message);
    res.status(500).json({ error: err.message || 'Erreur création commande' });
  }
});

// ── GET /api/orders/:id/tracking — Suivi temps réel ─────────
router.get('/:id/tracking', authenticate, async (req, res) => {
  try {
    const authReq = req as AuthRequest;
    const order = await prisma.order.findFirst({
      where: { id: String(req.params.id), userId: authReq.user!.id },
    });
    if (!order) return res.status(404).json({ error: 'Commande introuvable' });

    if (!order.trackingNumber) {
      return res.json({ events: [], message: 'Numéro de suivi non encore disponible' });
    }

    const tracking = await cjService.getShippingTracking(
      order.trackingNumber,
      'CJPacket'
    );
    res.json({ trackingNumber: order.trackingNumber, events: tracking });

  } catch (err: any) {
    res.status(500).json({ error: 'Impossible de récupérer le suivi' });
  }
});

// ── POST /api/orders/:id/cancel ──────────────────────────────
router.post('/:id/cancel', authenticate, async (req, res) => {
  try {
    const authReq = req as AuthRequest;
    const order = await prisma.order.findFirst({
      where: { id: String(req.params.id), userId: authReq.user!.id },
    });
    if (!order) return res.status(404).json({ error: 'Commande introuvable' });
    if (!['PENDING', 'CONFIRMED'].includes(order.status)) {
      return res.status(400).json({ error: 'Commande non annulable à ce stade' });
    }
    const updated = await prisma.order.update({
      where: { id: order.id },
      data:  { status: 'CANCELLED' },
    });
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;