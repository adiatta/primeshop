"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
// GET /api/users/me
router.get('/me', auth_1.authenticate, async (req, res) => {
    const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: { id: true, name: true, email: true, role: true, createdAt: true, addresses: true },
    });
    res.json(user);
});
// PUT /api/users/me
router.put('/me', auth_1.authenticate, async (req, res) => {
    const { name, phone } = req.body;
    const user = await prisma.user.update({
        where: { id: req.user.id },
        data: { name, phone },
        select: { id: true, name: true, email: true, phone: true },
    });
    res.json(user);
});
exports.default = router;
//# sourceMappingURL=users.js.map