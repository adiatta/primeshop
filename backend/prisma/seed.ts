'use strict';
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

async function main() {
  // Connexion explicite avec log
  const prisma = new PrismaClient({
    log: ['query', 'info', 'warn', 'error'],
  });

  console.log('🔗 Connexion à la BDD...');
  await prisma.$connect();
  console.log('✅ Connecté');

  const adminHash = await bcrypt.hash('admin123456', 10);
  const testHash  = await bcrypt.hash('user123456', 10);

  const admin = await prisma.user.upsert({
    where:  { email: 'admin@primeshop.fr' },
    update: { password: adminHash, role: 'ADMIN' },
    create: {
      name:     'Admin',
      email:    'admin@primeshop.fr',
      password: adminHash,
      role:     'ADMIN',
    },
  });
  console.log('✅ Admin:', admin.email);

  const testUser = await prisma.user.upsert({
    where:  { email: 'test@primeshop.fr' },
    update: { password: testHash },
    create: {
      name:     'Test User',
      email:    'test@primeshop.fr',
      password: testHash,
      role:     'USER',
    },
  });
  console.log('✅ Test user:', testUser.email);

  await prisma.promoCode.upsert({
    where:  { code: 'PRIME15' },
    update: {},
    create: { code: 'PRIME15', discount: 15, type: 'percentage', maxUses: 500, active: true },
  });
  console.log('✅ Promo PRIME15 créée');

  await prisma.$disconnect();
  console.log('🎉 Seed terminé !');
  console.log('admin@primeshop.fr / admin123456');
  console.log('test@primeshop.fr  / user123456');
}

main().catch(e => {
  console.error('❌ Erreur seed:', e);
  process.exit(1);
});