import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import dotenv from 'dotenv';

dotenv.config();

// ── Vérification env au démarrage ──────────────────────────
const REQUIRED_ENV = ['DATABASE_URL', 'JWT_SECRET', 'STRIPE_SECRET_KEY'];
const missing = REQUIRED_ENV.filter(k => !process.env[k]);
if (missing.length) {
  console.error('❌ Variables d\'environnement manquantes :', missing.join(', '));
  process.exit(1);
}

import { errorHandler } from './middleware/errorHandler';
import { globalLimiter, authLimiter } from './middleware/rateLimiter';
import authRoutes     from './routes/auth';
import productRoutes  from './routes/products';
import orderRoutes    from './routes/orders';
import paymentRoutes  from './routes/payments';
import userRoutes     from './routes/users';
import reviewRoutes   from './routes/reviews';
import wishlistRoutes from './routes/wishlist';
import promoRoutes    from './routes/promo';
import adminRoutes    from './routes/admin';

const app  = express();
const PORT = parseInt(process.env.PORT || '5000', 10);

// ── Middlewares ────────────────────────────────────────────
app.use(helmet());
app.use(compression() as any);
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true,
}));

// Stripe webhook AVANT express.json (besoin du raw body)
app.use('/api/payments/webhook', express.raw({ type: 'application/json' }));
app.use(express.json({ limit: '10mb' }));

// Rate limiting
app.use('/api', globalLimiter);
app.use('/api/auth', authLimiter);

// ── Health check (Railway ping) ────────────────────────────
app.get('/health', (_, res) => res.json({ status: 'ok', env: process.env.NODE_ENV }));
app.get('/',       (_, res) => res.json({ message: 'PrimeShop API v1.0' }));

// ── Routes ─────────────────────────────────────────────────
app.use('/api/auth',     authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders',   orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/users',    userRoutes);
app.use('/api/reviews',  reviewRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/promo',    promoRoutes);
app.use('/api/admin',    adminRoutes);

// ── 404 ────────────────────────────────────────────────────
app.use((_, res) => {
  res.status(404).json({ error: 'Route introuvable' });
});

// ── Error handler ──────────────────────────────────────────
app.use(errorHandler);

// ── Start ──────────────────────────────────────────────────
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ PrimeShop API démarré sur le port ${PORT}`);
  console.log(`🌍 Environnement : ${process.env.NODE_ENV}`);
});

export default app;