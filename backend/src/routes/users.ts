import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// GET /api/users/me
router.get('/me', authenticate, async (req: AuthRequest, res) => {
  const user = await prisma.user.findUnique({
    where:  { id: req.user!.id },
    select: { id: true, name: true, email: true, role: true, createdAt: true, addresses: true },
  });
  res.json(user);
});

// PUT /api/users/me
router.put('/me', authenticate, async (req: AuthRequest, res) => {
  const { name, phone } = req.body;
  const user = await prisma.user.update({
    where:  { id: req.user!.id },
    data:   { name, phone },
    select: { id: true, name: true, email: true, phone: true },
  });
  res.json(user);
});

export default router;