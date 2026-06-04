import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const router = Router();
const prisma = new PrismaClient();

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) return res.status(400).json({ error: 'Email déjà utilisé' });
    const hash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({ data: { name, email, password: hash } });
    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET!, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log(`🔑 Tentative login: ${email}`);

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      console.log(`❌ User not found: ${email}`);
      return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
    }

    const valid = await bcrypt.compare(password, user.password);
    console.log(`🔐 Password valid: ${valid}`);

    if (!valid) {
      return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );

    console.log(`✅ Login success: ${email} (${user.role})`);
    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err: any) {
    console.error('❌ Login error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});


// ROUTE TEMPORAIRE — À SUPPRIMER APRÈS UTILISATION
// POST /api/auth/setup-admin
router.post('/setup-admin', async (req, res) => {
  try {
    const existing = await prisma.user.findUnique({
      where: { email: 'admin@primeshop.fr' }
    });

    const adminHash = await bcrypt.hash('admin123456', 10);
    const testHash  = await bcrypt.hash('user123456', 10);

    // Upsert admin
    const admin = await prisma.user.upsert({
      where:  { email: 'admin@primeshop.fr' },
      update: { password: adminHash, role: 'ADMIN' },
      create: { name: 'Admin', email: 'admin@primeshop.fr', password: adminHash, role: 'ADMIN' },
    });

    // Upsert test user
    await prisma.user.upsert({
      where:  { email: 'test@primeshop.fr' },
      update: { password: testHash },
      create: { name: 'Test User', email: 'test@primeshop.fr', password: testHash, role: 'USER' },
    });

    res.json({
      success: true,
      message: '✅ Comptes créés/réinitialisés',
      admin:   { email: 'admin@primeshop.fr', password: 'admin123456', role: 'ADMIN' },
      test:    { email: 'test@primeshop.fr',  password: 'user123456',  role: 'USER'  },
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;