import express, { Router } from 'express';
import Stripe from 'stripe';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const prisma = new PrismaClient();

// POST /api/payments/create-intent
router.post('/create-intent', authenticate, async (req: AuthRequest, res) => {
  try {
    const { items, promoCode } = req.body;
    let total = items.reduce((s: number, i: any) => s + i.price * i.quantity, 0);

    if (promoCode) {
      const promo = await prisma.promoCode.findUnique({ where: { code: promoCode, active: true } });
      if (promo) {
        total = promo.type === 'percentage'
          ? total * (1 - promo.discount / 100)
          : total - promo.discount;
      }
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount:   Math.round(total * 100),
      currency: 'eur',
      metadata: { userId: req.user!.id },
    });

    res.json({ clientSecret: paymentIntent.client_secret, total });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/payments/webhook — Raw body (configuré dans server.ts)
router.post('/webhook', async (req, res) => {
  const sig = req.headers['stripe-signature'];
  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    return res.status(400).json({ error: 'Missing signature' });
  }

  let event: any;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err: any) {
    console.error('Webhook error:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'payment_intent.succeeded') {
    const pi = event.data.object;
    await prisma.order.updateMany({
      where: { stripePaymentId: pi.id },
      data:  { status: 'CONFIRMED' },
    });
    console.log(`✅ Payment confirmed: ${pi.id}`);
  }

  res.json({ received: true });
});

export default router;