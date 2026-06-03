import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import dotenv from 'dotenv';
import { errorHandler } from './middleware/errorHandler';
import { globalLimiter, authLimiter } from './middleware/rateLimiter';
import authRoutes from './routes/auth';
import productRoutes from './routes/products';
import orderRoutes from './routes/orders';
import paymentRoutes from './routes/payments';
import userRoutes from './routes/users';
import reviewRoutes from './routes/reviews';
import wishlistRoutes from './routes/wishlist';
import promoRoutes from './routes/promo';
import adminRoutes from './routes/admin';

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

app.use(helmet());
app.use(compression());
app.use(cors({ origin: process.env.FRONTEND_URL, credentials: true }));
app.use(express.json());

// Routes
app.get('/', (_, res) => {
  res.send('API running');
});
app.use('/api', globalLimiter);
app.use('/api/auth', authLimiter);
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/users', userRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/promo', promoRoutes);
app.use('/api/admin', adminRoutes);
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'PrimeShop API running'
  });
});
app.use(errorHandler);

app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
export default app;