"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const compression_1 = __importDefault(require("compression"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
// ── Vérification env au démarrage ──────────────────────────
const REQUIRED_ENV = ['DATABASE_URL', 'JWT_SECRET', 'STRIPE_SECRET_KEY'];
const missing = REQUIRED_ENV.filter(k => !process.env[k]);
if (missing.length) {
    console.error('❌ Variables d\'environnement manquantes :', missing.join(', '));
    process.exit(1);
}
const errorHandler_1 = require("./middleware/errorHandler");
const rateLimiter_1 = require("./middleware/rateLimiter");
const auth_1 = __importDefault(require("./routes/auth"));
const products_1 = __importDefault(require("./routes/products"));
const orders_1 = __importDefault(require("./routes/orders"));
const payments_1 = __importDefault(require("./routes/payments"));
const users_1 = __importDefault(require("./routes/users"));
const reviews_1 = __importDefault(require("./routes/reviews"));
const wishlist_1 = __importDefault(require("./routes/wishlist"));
const promo_1 = __importDefault(require("./routes/promo"));
const admin_1 = __importDefault(require("./routes/admin"));
const app = (0, express_1.default)();
const PORT = parseInt(process.env.PORT || '5000', 10);
// ── Middlewares ────────────────────────────────────────────
app.use((0, helmet_1.default)());
app.use((0, compression_1.default)());
app.use((0, cors_1.default)({
    origin: [
        "http://localhost:3000",
        "https://frontend-navy-omega-55.vercel.app"
    ],
    credentials: true,
}));
// Stripe webhook AVANT express.json (besoin du raw body)
app.use('/api/payments/webhook', express_1.default.raw({ type: 'application/json' }));
app.use(express_1.default.json({ limit: '10mb' }));
// Rate limiting
app.use('/api', rateLimiter_1.globalLimiter);
app.use('/api/auth', rateLimiter_1.authLimiter);
// ── Health check (Railway ping) ────────────────────────────
app.get('/health', (_, res) => res.json({ status: 'ok', env: process.env.NODE_ENV }));
app.get('/', (_, res) => res.json({ message: 'PrimeShop API v1.0' }));
// ── Routes ─────────────────────────────────────────────────
app.use('/api/auth', auth_1.default);
app.use('/api/products', products_1.default);
app.use('/api/orders', orders_1.default);
app.use('/api/payments', payments_1.default);
app.use('/api/users', users_1.default);
app.use('/api/reviews', reviews_1.default);
app.use('/api/wishlist', wishlist_1.default);
app.use('/api/promo', promo_1.default);
app.use('/api/admin', admin_1.default);
// ── 404 ────────────────────────────────────────────────────
app.use((_, res) => {
    res.status(404).json({ error: 'Route introuvable' });
});
// ── Error handler ──────────────────────────────────────────
app.use(errorHandler_1.errorHandler);
// ── Start ──────────────────────────────────────────────────
console.log("Avant app.listen");
app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ PrimeShop API démarré sur le port ${PORT}`);
    console.log(`🌍 Environnement : ${process.env.NODE_ENV}`);
});
exports.default = app;
//# sourceMappingURL=server.js.map