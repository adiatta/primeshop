"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
// GET /api/reviews/:productId
router.get('/:productId', async (req, res) => {
    const reviews = await prisma.review.findMany({
        where: { productId: req.params.productId },
        include: { user: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
    });
    res.json(reviews);
});
// POST /api/reviews
router.post('/', auth_1.authenticate, async (req, res) => {
    const authReq = req;
    const { productId, rating, comment } = req.body;
    const existing = await prisma.review.findFirst({
        where: {
            userId: authReq.user.id,
            productId
        },
    });
    if (existing)
        return res.status(400).json({ error: 'Vous avez déjà laissé un avis' });
    const review = await prisma.review.create({
        data: {
            userId: authReq.user.id,
            productId,
            rating,
            comment
        },
    });
    res.status(201).json(review);
});
exports.default = router;
//# sourceMappingURL=reviews.js.map