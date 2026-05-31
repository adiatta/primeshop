import rateLimit from 'express-rate-limit';

export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Trop de requêtes, réessayez dans 15 minutes.' },
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Trop de tentatives de connexion, réessayez dans 15 minutes.' },
});

export const paymentLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 heure
  max: 20,
  message: { error: 'Trop de tentatives de paiement.' },
});