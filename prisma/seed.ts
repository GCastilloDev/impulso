import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🧹 Limpiando toda la información semilla en PostgreSQL...');

  const deletedPayments = await prisma.paymentRecord.deleteMany({});
  const deletedClosures = await prisma.cashClosure.deleteMany({});
  const deletedLoans = await prisma.loan.deleteMany({});
  const deletedClients = await prisma.client.deleteMany({});
  const deletedProducts = await prisma.financialProduct.deleteMany({});
  const deletedUsers = await prisma.user.deleteMany({});

  console.log(`🗑️ Registros eliminados:
  - ${deletedPayments.count} pagos y recibos
  - ${deletedClosures.count} cierres y arqueos
  - ${deletedLoans.count} préstamos
  - ${deletedClients.count} clientes
  - ${deletedProducts.count} productos financieros
  - ${deletedUsers.count} usuarios`);

  console.log('🌱 Creando nuevo usuario Administrador...');
  const hashedPassword = await bcrypt.hash('Admin123$', 10);

  const adminUser = await prisma.user.create({
    data: {
      id: 'usr-1',
      name: 'Rosa Nelly Tellez',
      email: 'rosanellytellez6@gmail.com',
      password: hashedPassword,
      role: 'Administrador',
      telefono: '5587654321',
      estatus: 'Activo',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200',
    },
  });

  console.log(`✅ Administrador creado: [${adminUser.id}] ${adminUser.name} (${adminUser.email})`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Error durante la inicialización:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
