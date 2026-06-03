import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// GET /api/wishlist
router.get('/', authenticate, async (req: AuthRequest, res) => {
  const items = await prisma.wishlist.findMany({
    where:   { userId: req.user!.id },
    include: { product: true },
  });
  res.json(items);
});

// POST /api/wishlist
router.post('/', authenticate, async (req: AuthRequest, res) => {
  const { productId } = req.body;
  const item = await prisma.wishlist.upsert({
    where:  { userId_productId: { userId: req.user!.id, productId } },
    update: {},
    create: { userId: req.user!.id, productId },
  });
  res.json(item);
});

// DELETE /api/wishlist/:productId
router.delete('/:productId', authenticate, async (req: AuthRequest, res) => {
  await prisma.wishlist.deleteMany({
    where: {
  userId: req.user!.id,
  productId: String(req.params.productId)
},
  });
  res.json({ success: true });
});

export default router;