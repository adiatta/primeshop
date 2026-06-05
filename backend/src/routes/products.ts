import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, isAdmin, AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// GET /api/products
router.get('/', authenticate, async (req, res) => {
  const { search, category, page = '1', limit = '20' } = req.query;
  const skip = (Number(page) - 1) * Number(limit);
  const where: any = { active: true };
  if (search) where.name = { contains: String(search), mode: 'insensitive' };
  if (category) where.category = String(category);
  const [products, total] = await Promise.all([
    prisma.product.findMany({ where, skip, take: Number(limit), include: { reviews: true }, orderBy: { createdAt: 'desc' } }),
    prisma.product.count({ where }),
  ]);
  res.json({ products, total, pages: Math.ceil(total / Number(limit)) });
});

// GET /api/products/:slug
router.get('/:slug', async (req, res) => {
  const product = await prisma.product.findUnique({
    where: { slug: req.params.slug },
    include: { reviews: { include: { user: { select: { name: true } } } }, variants: true },
  });
  if (!product) return res.status(404).json({ error: 'Produit non trouvé' });
  res.json(product);
});

// POST /api/products — Admin only
router.post('/', authenticate, isAdmin, async (req, res) => {
  const product = await prisma.product.create({
    data: req.body,
  });

  res.status(201).json(product);
});

// PUT /api/products/:id
router.put('/:id', authenticate, isAdmin, async (req, res) => {
  const product = await prisma.product.update({
    where: {
  id: String(req.params.id)
},
    data: req.body,
  });

  res.json(product);
});

export default router;