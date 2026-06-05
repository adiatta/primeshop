import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// GET /api/wishlist
router.get('/', authenticate, async (req, res) => {
  const authReq = req as AuthRequest;
  const items = await prisma.wishlist.findMany({
    where:   { userId: authReq.user!.id },
    include: { product: true },
  });
  res.json(items);
});

// POST /api/wishlist
router.post('/', authenticate, async (req, res) => {
  const authReq = req as AuthRequest;
  const { productId } = req.body;
  const item = await prisma.wishlist.upsert({
    where:  { userId_productId: { userId: authReq.user!.id, productId } },
    update: {},
    create: { userId: authReq.user!.id, productId },
  });
  res.json(item);
});

// DELETE /api/wishlist/:productId
router.delete('/:productId', authenticate, async (req, res) => {
  const authReq = req as AuthRequest;
  await prisma.wishlist.deleteMany({
    where: {
  userId: authReq.user!.id,
  productId: String(req.params.productId)
},
  });
  res.json({ success: true });
});

export default router;