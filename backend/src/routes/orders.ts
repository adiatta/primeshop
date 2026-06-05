import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth';
import type { AuthRequest } from '../middleware/auth';
import { trackingService } from '../services/orderTrackingService';
import { cjService } from '../services/dropshippingService';

const router = Router();
const prisma = new PrismaClient();

// GET /api/orders — Mes commandes
router.get('/', authenticate, async (req, res) => {
  const authReq = req as AuthRequest;
  const orders = await prisma.order.findMany({
    where: { userId: authReq.user!.id },
    include: {
      items: { include: { product: { select: { name: true, images: true } } } },
      address: true,
    },
    orderBy: { createdAt: 'desc' },
  });
  res.json(orders);
});

// GET /api/orders/:id — Détail commande
router.get('/:id', authenticate, async (req, res) => {
  const authReq = req as AuthRequest;
  const order = await prisma.order.findFirst({
    where: {
  id: String(req.params.id)
},
    include: {
      items: { include: { product: true } },
      address: true,
    },
  });
  if (!order) return res.status(404).json({ error: 'Commande introuvable' });
  res.json(order);
});

// POST /api/orders — Créer commande (après paiement)
router.post('/', authenticate, async (req, res) => {
  const authReq = req as AuthRequest;
  const { items, addressId, promoCode, stripePaymentId } = req.body;

  const subtotal = items.reduce((s: number, i: any) => s + i.price * i.quantity, 0);
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
      userId: authReq.user!.id,
      addressId,
      subtotal,
      total: subtotal - discount,
      discount,
      promoCode,
      stripePaymentId,
      status: 'PENDING',
      items: {
        create: items.map((i: any) => ({
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
router.get('/:id/tracking', authenticate, async (req, res) => {
  const authReq = req as AuthRequest;
  const order = await prisma.order.findFirst({
    where: {
  id: String(req.params.id)
},
  });
  if (!order) return res.status(404).json({ error: 'Commande introuvable' });

  if (!order.trackingNumber) {
    return res.json({ events: [], message: 'Numéro de suivi non encore disponible' });
  }

  try {
    const tracking = await cjService.getShippingTracking(order.trackingNumber, 'CJPacket');
    res.json({ trackingNumber: order.trackingNumber, events: tracking });
  } catch {
    res.status(500).json({ error: 'Impossible de récupérer le suivi' });
  }
});

// POST /api/orders/:id/cancel
router.post('/:id/cancel', authenticate, async (req, res) => {
  const authReq = req as AuthRequest;
  const order = await prisma.order.findFirst({
    where: {
  id: String(req.params.id)
},
  });
  if (!order) return res.status(404).json({ error: 'Commande introuvable' });
  if (!['PENDING', 'CONFIRMED'].includes(order.status)) {
    return res.status(400).json({ error: 'Commande non annulable à ce stade' });
  }
  const updated = await prisma.order.update({
    where: { id: order.id },
    data: { status: 'CANCELLED' },
  });
  res.json(updated);
});

export default router;