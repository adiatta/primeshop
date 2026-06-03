"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const stripe_1 = __importDefault(require("stripe"));
const client_1 = require("@prisma/client");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
const stripe = new stripe_1.default(process.env.STRIPE_SECRET_KEY);
const prisma = new client_1.PrismaClient();
// POST /api/payments/create-intent
router.post('/create-intent', auth_1.authenticate, async (req, res) => {
    try {
        const { items, promoCode } = req.body;
        let total = items.reduce((s, i) => s + i.price * i.quantity, 0);
        if (promoCode) {
            const promo = await prisma.promoCode.findUnique({ where: { code: promoCode, active: true } });
            if (promo) {
                total = promo.type === 'percentage'
                    ? total * (1 - promo.discount / 100)
                    : total - promo.discount;
            }
        }
        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(total * 100),
            currency: 'eur',
            metadata: { userId: req.user.id },
        });
        res.json({ clientSecret: paymentIntent.client_secret, total });
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// POST /api/payments/webhook — Raw body (configuré dans server.ts)
router.post('/webhook', async (req, res) => {
    const sig = req.headers['stripe-signature'];
    if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
        return res.status(400).json({ error: 'Missing signature' });
    }
    let event;
    try {
        event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    }
    catch (err) {
        console.error('Webhook error:', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }
    if (event.type === 'payment_intent.succeeded') {
        const pi = event.data.object;
        await prisma.order.updateMany({
            where: { stripePaymentId: pi.id },
            data: { status: 'CONFIRMED' },
        });
        console.log(`✅ Payment confirmed: ${pi.id}`);
    }
    res.json({ received: true });
});
exports.default = router;
//# sourceMappingURL=payments.js.map