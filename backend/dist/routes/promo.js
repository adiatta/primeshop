"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const router = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
// POST /api/promo/validate
router.post('/validate', async (req, res) => {
    const { code } = req.body;
    if (!code)
        return res.status(400).json({ error: 'Code manquant' });
    const promo = await prisma.promoCode.findUnique({ where: { code: code.toUpperCase() } });
    if (!promo || !promo.active)
        return res.status(404).json({ error: 'Code invalide ou expiré' });
    if (promo.expiresAt && new Date() > promo.expiresAt)
        return res.status(400).json({ error: 'Code expiré' });
    if (promo.maxUses && promo.currentUses >= promo.maxUses)
        return res.status(400).json({ error: 'Code épuisé' });
    res.json({ code: promo.code, discount: promo.discount, type: promo.type });
});
exports.default = router;
//# sourceMappingURL=promo.js.map