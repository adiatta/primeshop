"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importStar(require("express"));
const stripe_1 = __importDefault(require("stripe"));
const client_1 = require("@prisma/client");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
const stripe = new stripe_1.default(process.env.STRIPE_SECRET_KEY);
const prisma = new client_1.PrismaClient();
// CREATE PAYMENT INTENT
router.post('/create-intent', auth_1.authenticate, async (req, res) => {
    const { items, promoCode } = req.body;
    let total = items.reduce((s, i) => s + i.price * i.quantity, 0);
    if (promoCode) {
        const promo = await prisma.promoCode.findUnique({
            where: { code: promoCode },
        });
        if (promo?.active) {
            total =
                promo.type === 'percentage'
                    ? total * (1 - promo.discount / 100)
                    : total - promo.discount;
        }
    }
    const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(total * 100),
        currency: 'eur',
        metadata: { userId: req.user.id },
    });
    res.json({
        clientSecret: paymentIntent.client_secret,
        total,
    });
});
// WEBHOOK
router.post('/webhook', express_1.default.raw({ type: 'application/json' }), async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;
    try {
        event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    }
    catch (err) {
        return res.status(400).send('Webhook error');
    }
    if (event.type === 'payment_intent.succeeded') {
        const pi = event.data.object;
        await prisma.order.updateMany({
            where: { stripePaymentId: pi.id },
            data: { status: 'CONFIRMED' },
        });
    }
    res.json({ received: true });
});
exports.default = router;
//# sourceMappingURL=payments.js.map