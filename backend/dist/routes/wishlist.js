"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
// GET /api/wishlist
router.get('/', auth_1.authenticate, async (req, res) => {
    const authReq = req;
    const items = await prisma.wishlist.findMany({
        where: { userId: authReq.user.id },
        include: { product: true },
    });
    res.json(items);
});
// POST /api/wishlist
router.post('/', auth_1.authenticate, async (req, res) => {
    const authReq = req;
    const { productId } = req.body;
    const item = await prisma.wishlist.upsert({
        where: { userId_productId: { userId: authReq.user.id, productId } },
        update: {},
        create: { userId: authReq.user.id, productId },
    });
    res.json(item);
});
// DELETE /api/wishlist/:productId
router.delete('/:productId', auth_1.authenticate, async (req, res) => {
    const authReq = req;
    await prisma.wishlist.deleteMany({
        where: {
            userId: authReq.user.id,
            productId: String(req.params.productId)
        },
    });
    res.json({ success: true });
});
exports.default = router;
//# sourceMappingURL=wishlist.js.map