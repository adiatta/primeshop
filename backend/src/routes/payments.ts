import { Router } from 'express';
import Stripe from 'stripe';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const prisma = new PrismaClient();

// POST /api/payments/create-intent
router.post('/create-intent', authenticate, async (req: AuthRequest, res) => {
  const { items, promoCode } = req.body;
  let total = items.reduce((s: number, i: any) => s + i.price * i.quantity, 0);

  if (promoCode) {
    const promo = await prisma.promoCode.findUnique({ where: { code: promoCode } });
    if (promo?.active) {
      total = promo.type === 'percentage' ? total * (1 - promo.discount / 100) : total - promo.discount;
    }
  }

  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(total * 100),
    currency: 'eur',
    metadata: { userId: req.user!.id },
  });

  res.json({ clientSecret: paymentIntent.client_secret, total });
});

// POST /api/payments/webhook
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature']!;
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    return res.status(400).send('Webhook error');
  }
  if (event.type === 'payment_intent.succeeded') {
    const pi = event.data.object as Stripe.PaymentIntent;
    await prisma.order.updateMany({
      where: { stripePaymentId: pi.id },
      data: { status: 'CONFIRMED' },
    });
  }
  res.json({ received: true });
});

import express from 'express';
export default router;