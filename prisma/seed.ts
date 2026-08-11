import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Inicializando sembrado de datos reales...');

  // Limpiar usuarios existentes para empezar de cero
  await prisma.user.deleteMany({});
  await prisma.client.deleteMany({});
  await prisma.loan.deleteMany({});
  await prisma.paymentRecord.deleteMany({});

  // Contraseña encriptada para el usuario Administrador de prueba
  const hashedPassword = await bcrypt.hash('123456', 10);

  const adminUser = await prisma.user.create({
    data: {
      name: 'Carlos Mendoza',
      email: 'carlos.mendoza@financieraimpulso.com',
      password: hashedPassword,
      role: 'Administrador',
      telefono: '55 1122 3344',
      estatus: 'Activo',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
    },
  });

  console.log('✅ Usuario Administrador Principal creado con éxito en PostgreSQL:');
  console.log(`   - Email: ${adminUser.email}`);
  console.log(`   - Rol: ${adminUser.role}`);
  console.log(`   - Contraseña: 123456`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Error durante el sembrado:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
