"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const passport_1 = __importDefault(require("../config/passport"));
const router = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
// POST /api/auth/register
router.post('/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        const exists = await prisma.user.findUnique({ where: { email } });
        if (exists)
            return res.status(400).json({ error: 'Email déjà utilisé' });
        const hash = await bcryptjs_1.default.hash(password, 12);
        const user = await prisma.user.create({ data: { name, email, password: hash } });
        const token = jsonwebtoken_1.default.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
        res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
    }
    catch (err) {
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
        const valid = await bcryptjs_1.default.compare(password, user.password);
        console.log(`🔐 Password valid: ${valid}`);
        if (!valid) {
            return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
        }
        const token = jsonwebtoken_1.default.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
        console.log(`✅ Login success: ${email} (${user.role})`);
        res.json({
            token,
            user: { id: user.id, name: user.name, email: user.email, role: user.role },
        });
    }
    catch (err) {
        console.error('❌ Login error:', err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});
// GET /api/auth/google — Lance le flow OAuth
router.get('/google', passport_1.default.authenticate('google', {
    scope: ['profile', 'email'],
    session: false,
}));
// GET /api/auth/google/callback — Google redirige ici
router.get('/google/callback', passport_1.default.authenticate('google', { session: false, failureRedirect: `${process.env.FRONTEND_URL}/auth/error` }), (req, res) => {
    const user = req.user;
    // Générer JWT
    const token = jsonwebtoken_1.default.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
    // Rediriger vers le frontend avec le token
    const userData = encodeURIComponent(JSON.stringify({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
    }));
    res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${token}&user=${userData}`);
});
// ROUTE TEMPORAIRE — À SUPPRIMER APRÈS UTILISATION
// POST /api/auth/setup-admin
router.post('/setup-admin', async (req, res) => {
    try {
        const existing = await prisma.user.findUnique({
            where: { email: 'admin@primeshop.fr' }
        });
        const adminHash = await bcryptjs_1.default.hash('admin123456', 10);
        const testHash = await bcryptjs_1.default.hash('user123456', 10);
        // Upsert admin
        const admin = await prisma.user.upsert({
            where: { email: 'admin@primeshop.fr' },
            update: { password: adminHash, role: 'ADMIN' },
            create: { name: 'Admin', email: 'admin@primeshop.fr', password: adminHash, role: 'ADMIN' },
        });
        // Upsert test user
        await prisma.user.upsert({
            where: { email: 'test@primeshop.fr' },
            update: { password: testHash },
            create: { name: 'Test User', email: 'test@primeshop.fr', password: testHash, role: 'USER' },
        });
        res.json({
            success: true,
            message: '✅ Comptes créés/réinitialisés',
            admin: { email: 'admin@primeshop.fr', password: 'admin123456', role: 'ADMIN' },
            test: { email: 'test@primeshop.fr', password: 'user123456', role: 'USER' },
        });
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
exports.default = router;
//# sourceMappingURL=auth.js.map