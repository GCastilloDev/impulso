import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Sincronizando identificadores reales y expedientes en PostgreSQL...');

  const hashedPassword = await bcrypt.hash('123456', 10);

  // 1. Administrador Principal
  const adminUser = await prisma.user.upsert({
    where: { email: 'carlos.mendoza@financieraimpulso.com' },
    update: {
      id: 'usr-1',
      name: 'Carlos Mendoza',
      password: hashedPassword,
      role: 'Administrador',
      telefono: '5511223344',
      estatus: 'Activo',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
    },
    create: {
      id: 'usr-1',
      name: 'Carlos Mendoza',
      email: 'carlos.mendoza@financieraimpulso.com',
      password: hashedPassword,
      role: 'Administrador',
      telefono: '5511223344',
      estatus: 'Activo',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
    },
  });

  // 2. Promotor 1: Pedro Ramírez
  const promotor1 = await prisma.user.upsert({
    where: { email: 'pedro.ramirez@financieraimpulso.com' },
    update: {
      id: 'usr-2',
      name: 'Pedro Ramírez',
      password: hashedPassword,
      role: 'Promotor de Campo',
      telefono: '5544332211',
      estatus: 'Activo',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200',
      curp: 'RAPE880412HDFRRN09',
      fechaNacimiento: '1988-04-12',
      folioIne: 'IDMEX1988041201',
      direccionEstructurada: {
        calle: 'Av. Morelos',
        numExterior: '450',
        numInterior: '2-A',
        colonia: 'Col. Centro',
        codigoPostal: '50000',
        ciudad: 'Toluca',
        estado: 'Estado de México',
      },
      referencia1: {
        nombre: 'Guillermo Ramírez Pérez',
        parentesco: 'Familiar',
        telefono: '5511002233',
        direccionEstructurada: {
          calle: 'Calle Hidalgo',
          numExterior: '12',
          numInterior: '',
          colonia: 'Col. San Bernardino',
          codigoPostal: '50010',
          ciudad: 'Toluca',
          estado: 'Estado de México',
        },
        direccion: 'Calle Hidalgo N° Ext 12, Col. San Bernardino, Toluca, Estado de México, C.P. 50010',
      },
      referencia2: {
        nombre: 'Sofía Álvarez Garza',
        parentesco: 'Amigo',
        telefono: '5599887766',
        direccionEstructurada: {
          calle: 'Av. Lerdo de Tejada',
          numExterior: '78',
          numInterior: '3',
          colonia: 'Col. Merced',
          codigoPostal: '50080',
          ciudad: 'Toluca',
          estado: 'Estado de México',
        },
        direccion: 'Av. Lerdo de Tejada N° Ext 78 Int 3, Col. Merced, Toluca, Estado de México, C.P. 50080',
      },
    },
    create: {
      id: 'usr-2',
      name: 'Pedro Ramírez',
      email: 'pedro.ramirez@financieraimpulso.com',
      password: hashedPassword,
      role: 'Promotor de Campo',
      telefono: '5544332211',
      estatus: 'Activo',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200',
      curp: 'RAPE880412HDFRRN09',
      fechaNacimiento: '1988-04-12',
      folioIne: 'IDMEX1988041201',
      direccionEstructurada: {
        calle: 'Av. Morelos',
        numExterior: '450',
        numInterior: '2-A',
        colonia: 'Col. Centro',
        codigoPostal: '50000',
        ciudad: 'Toluca',
        estado: 'Estado de México',
      },
      referencia1: {
        nombre: 'Guillermo Ramírez Pérez',
        parentesco: 'Familiar',
        telefono: '5511002233',
        direccionEstructurada: {
          calle: 'Calle Hidalgo',
          numExterior: '12',
          numInterior: '',
          colonia: 'Col. San Bernardino',
          codigoPostal: '50010',
          ciudad: 'Toluca',
          estado: 'Estado de México',
        },
        direccion: 'Calle Hidalgo N° Ext 12, Col. San Bernardino, Toluca, Estado de México, C.P. 50010',
      },
      referencia2: {
        nombre: 'Sofía Álvarez Garza',
        parentesco: 'Amigo',
        telefono: '5599887766',
        direccionEstructurada: {
          calle: 'Av. Lerdo de Tejada',
          numExterior: '78',
          numInterior: '3',
          colonia: 'Col. Merced',
          codigoPostal: '50080',
          ciudad: 'Toluca',
          estado: 'Estado de México',
        },
        direccion: 'Av. Lerdo de Tejada N° Ext 78 Int 3, Col. Merced, Toluca, Estado de México, C.P. 50080',
      },
    },
  });

  // 3. Promotor 2: Laura Méndez
  const promotor2 = await prisma.user.upsert({
    where: { email: 'laura.mendez@financieraimpulso.com' },
    update: {
      id: 'usr-3',
      name: 'Laura Méndez',
      password: hashedPassword,
      role: 'Promotor de Campo',
      telefono: '5566778899',
      estatus: 'Activo',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200',
      curp: 'MELA921105MDFRRN04',
      fechaNacimiento: '1992-11-05',
      folioIne: 'IDMEX1992110508',
      direccionEstructurada: {
        calle: 'Paseo Tollocan',
        numExterior: '1205',
        numInterior: 'B-12',
        colonia: 'Col. Vértice',
        codigoPostal: '50150',
        ciudad: 'Toluca',
        estado: 'Estado de México',
      },
      referencia1: {
        nombre: 'Mariana Méndez Solares',
        parentesco: 'Familiar',
        telefono: '5533445566',
        direccionEstructurada: {
          calle: 'Calle Independencia',
          numExterior: '304',
          numInterior: '',
          colonia: 'Col. Santa Clara',
          codigoPostal: '50090',
          ciudad: 'Toluca',
          estado: 'Estado de México',
        },
        direccion: 'Calle Independencia N° Ext 304, Col. Santa Clara, Toluca, Estado de México, C.P. 50090',
      },
      referencia2: {
        nombre: 'Alejandro Domínguez',
        parentesco: 'Vecino',
        telefono: '5544556677',
        direccionEstructurada: {
          calle: 'Av. Primero de Mayo',
          numExterior: '512',
          numInterior: '',
          colonia: 'Col. Izcalli',
          codigoPostal: '50140',
          ciudad: 'Metepec',
          estado: 'Estado de México',
        },
        direccion: 'Av. Primero de Mayo N° Ext 512, Col. Izcalli, Metepec, Estado de México, C.P. 50140',
      },
    },
    create: {
      id: 'usr-3',
      name: 'Laura Méndez',
      email: 'laura.mendez@financieraimpulso.com',
      password: hashedPassword,
      role: 'Promotor de Campo',
      telefono: '5566778899',
      estatus: 'Activo',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200',
      curp: 'MELA921105MDFRRN04',
      fechaNacimiento: '1992-11-05',
      folioIne: 'IDMEX1992110508',
      direccionEstructurada: {
        calle: 'Paseo Tollocan',
        numExterior: '1205',
        numInterior: 'B-12',
        colonia: 'Col. Vértice',
        codigoPostal: '50150',
        ciudad: 'Toluca',
        estado: 'Estado de México',
      },
      referencia1: {
        nombre: 'Mariana Méndez Solares',
        parentesco: 'Familiar',
        telefono: '5533445566',
        direccionEstructurada: {
          calle: 'Calle Independencia',
          numExterior: '304',
          numInterior: '',
          colonia: 'Col. Santa Clara',
          codigoPostal: '50090',
          ciudad: 'Toluca',
          estado: 'Estado de México',
        },
        direccion: 'Calle Independencia N° Ext 304, Col. Santa Clara, Toluca, Estado de México, C.P. 50090',
      },
      referencia2: {
        nombre: 'Alejandro Domínguez',
        parentesco: 'Vecino',
        telefono: '5544556677',
        direccionEstructurada: {
          calle: 'Av. Primero de Mayo',
          numExterior: '512',
          numInterior: '',
          colonia: 'Col. Izcalli',
          codigoPostal: '50140',
          ciudad: 'Metepec',
          estado: 'Estado de México',
        },
        direccion: 'Av. Primero de Mayo N° Ext 512, Col. Izcalli, Metepec, Estado de México, C.P. 50140',
      },
    },
  });

  const allUsers = await prisma.user.findMany({});
  console.log(`✅ Total de colaboradores resguardados con IDs unificados: ${allUsers.length}`);
  allUsers.forEach((u, i) => {
    console.log(`   ${i + 1}. [${u.id}] ${u.name} (${u.role}) - ${u.email}`);
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Error durante la actualización:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
