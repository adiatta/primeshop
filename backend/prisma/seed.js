"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('🌱 Seeding database...');
    // Admin user
    const adminPwd = await bcryptjs_1.default.hash('admin123456', 12);
    const admin = await prisma.user.upsert({
        where: { email: 'admin@primeshop.fr' },
        update: {},
        create: {
            email: 'admin@primeshop.fr',
            password: adminPwd,
            name: 'Admin Boss',
            role: 'ADMIN',
        },
    });
    // Test user
    const userPwd = await bcryptjs_1.default.hash('user123456', 12);
    await prisma.user.upsert({
        where: { email: 'test@primeshop.fr' },
        update: {},
        create: {
            email: 'test@primeshop.fr',
            password: userPwd,
            name: 'Test User',
            role: 'USER',
        },
    });
    // Produit principal
    const product = await prisma.product.upsert({
        where: { slug: 'primelens-pro-x1' },
        update: {},
        create: {
            name: 'PrimeLens Pro X1',
            slug: 'primelens-pro-x1',
            description: 'La caméra de poche qui redéfinit la perfection. 200MP, 8K 60fps, Night Mode AI.',
            price: 249,
            comparePrice: 399,
            images: ['https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?w=800'],
            stock: 47,
            category: 'Tech',
            tags: ['camera', 'photo', 'gadget', '8k', 'ai'],
            featured: true,
        },
    });
    // Variantes
    const variants = [
        { name: 'Couleur', value: 'Midnight Black', price: 249, stock: 20, sku: 'PLX1-BLK-256' },
        { name: 'Couleur', value: 'Storm Gray', price: 249, stock: 15, sku: 'PLX1-GRY-512' },
        { name: 'Couleur', value: 'Desert Gold', price: 249, stock: 12, sku: 'PLX1-GLD-1TB' },
        { name: 'Stockage', value: '256GB', price: 249, stock: 20, sku: 'PLX1-256' },
        { name: 'Stockage', value: '512GB', price: 279, stock: 15, sku: 'PLX1-512' },
        { name: 'Stockage', value: '1TB', price: 329, stock: 12, sku: 'PLX1-1TB' },
    ];
    for (const v of variants) {
        await prisma.variant.create({ data: { ...v, productId: product.id } });
    }
    // Codes promo
    await prisma.promoCode.upsert({
        where: { code: 'PRIME15' },
        update: {},
        create: { code: 'PRIME15', discount: 15, type: 'percentage', maxUses: 500, active: true },
    });
    await prisma.promoCode.upsert({
        where: { code: 'SUMMER10' },
        update: {},
        create: { code: 'SUMMER10', discount: 10, type: 'percentage', maxUses: 200, active: true },
    });
    console.log('✅ Seed terminé !');
    console.log('👤 Admin : admin@primeshop.fr / admin123456');
    console.log('👤 User  : test@primeshop.fr  / user123456');
}
main()
    .catch(e => { console.error(e); process.exit(1); })
    .finally(() => prisma.$disconnect());
//# sourceMappingURL=seed.js.map