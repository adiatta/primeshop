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
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
app.use((0, helmet_1.default)());
app.use((0, compression_1.default)());
app.use((0, cors_1.default)({ origin: process.env.FRONTEND_URL, credentials: true }));
app.use(express_1.default.json());
// Routes
app.get('/', (_, res) => {
    res.send('API running');
});
app.use('/api', rateLimiter_1.globalLimiter);
app.use('/api/auth', rateLimiter_1.authLimiter);
app.use('/api/auth', auth_1.default);
app.use('/api/products', products_1.default);
app.use('/api/orders', orders_1.default);
app.use('/api/payments', payments_1.default);
app.use('/api/users', users_1.default);
app.use('/api/reviews', reviews_1.default);
app.use('/api/wishlist', wishlist_1.default);
app.use('/api/promo', promo_1.default);
app.use('/api/admin', admin_1.default);
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        message: 'PrimeShop API running'
    });
});
app.use(errorHandler_1.errorHandler);
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
exports.default = app;
//# sourceMappingURL=server.js.map