import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// GET /api/reviews/:productId
router.get('/:productId', async (req, res) => {
  const reviews = await prisma.review.findMany({
    where:   { productId: req.params.productId },
    include: { user: { select: { name: true } } },
    orderBy: { createdAt: 'desc' },
  });
  res.json(reviews);
});

// POST /api/reviews
router.post('/', authenticate, async (req: AuthRequest, res) => {
  const { productId, rating, comment } = req.body;
  const existing = await prisma.review.findFirst({
    where: { userId: req.user!.id, productId },
  });
  if (existing) return res.status(400).json({ error: 'Vous avez déjà laissé un avis' });

  const review = await prisma.review.create({
    data: { userId: req.user!.id, productId, rating, comment },
  });
  res.status(201).json(review);
});

export default router;