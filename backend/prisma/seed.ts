const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding...');

  const adminHash = await bcrypt.hash('admin123456', 12);
  const userHash  = await bcrypt.hash('user123456', 12);

  await prisma.user.upsert({
    where:  { email: 'admin@primeshop.fr' },
    update: { password: adminHash },
    create: { email: 'admin@primeshop.fr', password: adminHash, name: 'Admin', role: 'ADMIN' },
  });

  await prisma.user.upsert({
    where:  { email: 'test@primeshop.fr' },
    update: { password: userHash },
    create: { email: 'test@primeshop.fr', password: userHash, name: 'Test User', role: 'USER' },
  });

  await prisma.product.upsert({
    where:  { slug: 'primelens-pro-x1' },
    update: {},
    create: {
      name: 'PrimeLens Pro X1', slug: 'primelens-pro-x1',
      description: 'La caméra de poche qui redéfinit la perfection.',
      price: 249, comparePrice: 399,
      images: ['https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?w=800'],
      stock: 47, category: 'Tech', tags: ['camera', 'tech'], featured: true,
    },
  });

  await prisma.promoCode.upsert({
    where:  { code: 'PRIME15' },
    update: {},
    create: { code: 'PRIME15', discount: 15, type: 'percentage', maxUses: 500, active: true },
  });

  console.log('✅ Seed OK');
  console.log('👤 admin@primeshop.fr / admin123456');
  console.log('👤 test@primeshop.fr  / user123456');
}

main().catch(console.error).finally(() => prisma.$disconnect());