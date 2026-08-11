import { Client, FinancialProduct, Loan, PaymentRecord, User } from '@/types';
import { calculateAmortizationSchedule } from './financialCalculators';
import { getTodayDateString, addDays } from './utils';

export const MOCK_USERS: User[] = [
  {
    id: 'usr-1',
    name: 'Carlos Mendoza',
    email: 'carlos.mendoza@financieraimpulso.com',
    password: '123456',
    role: 'Administrador',
    telefono: '5511223344',
    estatus: 'Activo',
    fechaAlta: '2025-10-01',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
  },
  {
    id: 'usr-2',
    name: 'Pedro Ramírez',
    email: 'pedro.ramirez@financieraimpulso.com',
    password: '123456',
    role: 'Promotor de Campo',
    telefono: '5544332211',
    estatus: 'Activo',
    fechaAlta: '2025-11-15',
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
  {
    id: 'usr-3',
    name: 'Laura Méndez',
    email: 'laura.mendez@financieraimpulso.com',
    password: '123456',
    role: 'Promotor de Campo',
    telefono: '5566778899',
    estatus: 'Activo',
    fechaAlta: '2026-01-10',
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
];

export const INITIAL_USER: User = MOCK_USERS[0];

export const MOCK_PRODUCTS: FinancialProduct[] = [
  {
    id: 'prod-1',
    nombre: 'Impulso Semanal Comercio',
    descripcion: 'Diseñado para comerciantes e independientes. Pagos semanales ágiles.',
    frecuenciaPago: 'semanal',
    plazosPosibles: [8, 12, 16, 24],
    tasaInteresGlobal: 12.0,
    porcentajePenalizacionMora: 4.0,
    montoMinimo: 3000,
    montoMaximo: 50000,
    activo: true,
  },
  {
    id: 'prod-2',
    nombre: 'Crédito Quincenal Asalariados',
    descripcion: 'Alineado al pago de nómina quincenal con tasa preferencial.',
    frecuenciaPago: 'quincenal',
    plazosPosibles: [6, 12, 18, 24],
    tasaInteresGlobal: 15.0,
    porcentajePenalizacionMora: 5.0,
    montoMinimo: 5000,
    montoMaximo: 100000,
    activo: true,
  },
  {
    id: 'prod-3',
    nombre: 'Express Diario Micro',
    descripcion: 'Microcrédito de liquidez inmediata para pequeños puestos locales.',
    frecuenciaPago: 'diario',
    plazosPosibles: [20, 30, 40],
    tasaInteresGlobal: 10.0,
    porcentajePenalizacionMora: 3.0,
    montoMinimo: 1000,
    montoMaximo: 15000,
    activo: true,
  },
];

const todayStr = getTodayDateString();
const pastDate1 = addDays(todayStr, -28);
const pastDate2 = addDays(todayStr, -45);

// Préstamo 1: Sofía (Al día)
const calc1 = calculateAmortizationSchedule(20000, 12.0, 10, 'semanal', pastDate1);
calc1.tablaAmortizacion[0].estado = 'Pagado';
calc1.tablaAmortizacion[0].montoPagado = calc1.tablaAmortizacion[0].cuotaTotal;
calc1.tablaAmortizacion[0].fechaPagoReal = addDays(pastDate1, 7);

calc1.tablaAmortizacion[1].estado = 'Pagado';
calc1.tablaAmortizacion[1].montoPagado = calc1.tablaAmortizacion[1].cuotaTotal;
calc1.tablaAmortizacion[1].fechaPagoReal = addDays(pastDate1, 14);

calc1.tablaAmortizacion[2].estado = 'Pagado';
calc1.tablaAmortizacion[2].montoPagado = calc1.tablaAmortizacion[2].cuotaTotal;
calc1.tablaAmortizacion[2].fechaPagoReal = addDays(pastDate1, 21);

calc1.tablaAmortizacion[3].fechaVencimiento = todayStr;

const loan1: Loan = {
  id: 'loan-201',
  folio: 'PRES-2026-001',
  clienteId: 'cli-101',
  clienteNombre: 'Sofía Guadalupe Hernández Juárez',
  clienteTelefono: '55 4123 9876',
  productoId: 'prod-1',
  productoNombre: 'Impulso Semanal Comercio',
  montoPrincipal: 20000,
  tasaInteresGlobal: 12.0,
  plazoCantidad: 10,
  frecuenciaPago: 'semanal',
  fechaInicio: pastDate1,
  cuotaRegular: calc1.cuotaRegular,
  totalAPagar: calc1.totalAPagar,
  saldoPendiente: calc1.totalAPagar - calc1.cuotaRegular * 3,
  estatus: 'Activo',
  promotorAsignado: 'Pedro Ramírez',
  tablaAmortizacion: calc1.tablaAmortizacion,
};

// Préstamo 2: Roberto (En Mora)
const calc2 = calculateAmortizationSchedule(15000, 15.0, 8, 'quincenal', pastDate2);
calc2.tablaAmortizacion[0].estado = 'Pagado';
calc2.tablaAmortizacion[0].montoPagado = calc2.tablaAmortizacion[0].cuotaTotal;

calc2.tablaAmortizacion[1].estado = 'Mora';
calc2.tablaAmortizacion[1].penalizacionesMora = 250;
calc2.tablaAmortizacion[1].fechaVencimiento = addDays(todayStr, -3);

const loan2: Loan = {
  id: 'loan-202',
  folio: 'PRES-2026-002',
  clienteId: 'cli-102',
  clienteNombre: 'Roberto Alejandro Gómez Silva',
  clienteTelefono: '55 8765 4321',
  productoId: 'prod-2',
  productoNombre: 'Crédito Quincenal Asalariados',
  montoPrincipal: 15000,
  tasaInteresGlobal: 15.0,
  plazoCantidad: 8,
  frecuenciaPago: 'quincenal',
  fechaInicio: pastDate2,
  cuotaRegular: calc2.cuotaRegular,
  totalAPagar: calc2.totalAPagar,
  saldoPendiente: calc2.totalAPagar - calc2.cuotaRegular,
  estatus: 'En Mora',
  promotorAsignado: 'Pedro Ramírez',
  tablaAmortizacion: calc2.tablaAmortizacion,
};

// Préstamo 3: María Elena (Pagos de hoy)
const calc3 = calculateAmortizationSchedule(8000, 10.0, 20, 'diario', addDays(todayStr, -5));
calc3.tablaAmortizacion[0].estado = 'Pagado';
calc3.tablaAmortizacion[0].montoPagado = calc3.tablaAmortizacion[0].cuotaTotal;
calc3.tablaAmortizacion[1].estado = 'Pagado';
calc3.tablaAmortizacion[1].montoPagado = calc3.tablaAmortizacion[1].cuotaTotal;
calc3.tablaAmortizacion[2].estado = 'Pagado';
calc3.tablaAmortizacion[2].montoPagado = calc3.tablaAmortizacion[2].cuotaTotal;
calc3.tablaAmortizacion[3].fechaVencimiento = todayStr;

const loan3: Loan = {
  id: 'loan-203',
  folio: 'PRES-2026-003',
  clienteId: 'cli-103',
  clienteNombre: 'María Elena Morales Castro',
  clienteTelefono: '55 2345 6789',
  productoId: 'prod-3',
  productoNombre: 'Express Diario Micro',
  montoPrincipal: 8000,
  tasaInteresGlobal: 10.0,
  plazoCantidad: 20,
  frecuenciaPago: 'diario',
  fechaInicio: addDays(todayStr, -5),
  cuotaRegular: calc3.cuotaRegular,
  totalAPagar: calc3.totalAPagar,
  saldoPendiente: calc3.totalAPagar - calc3.cuotaRegular * 3,
  estatus: 'Activo',
  promotorAsignado: 'Laura Méndez',
  tablaAmortizacion: calc3.tablaAmortizacion,
};

export const MOCK_LOANS: Loan[] = [loan1, loan2, loan3];

export const MOCK_PAYMENTS: PaymentRecord[] = [
  {
    id: 'pay-501',
    folioRecibo: 'REC-2026-089',
    prestamoId: 'loan-201',
    prestamoFolio: 'PRES-2026-001',
    clienteId: 'cli-101',
    clienteNombre: 'Sofía Guadalupe Hernández Juárez',
    numeroCuota: 3,
    montoRecibido: calc1.cuotaRegular,
    penalizacionCobrada: 0,
    fechaPago: `${addDays(todayStr, -7)} 10:30`,
    metodoPago: 'Efectivo',
    cobradorNombre: 'Pedro Ramírez',
    esAbonoParcial: false,
    nota: 'Pago puntual entregado en local.',
  },
  {
    id: 'pay-502',
    folioRecibo: 'REC-2026-088',
    prestamoId: 'loan-202',
    prestamoFolio: 'PRES-2026-002',
    clienteId: 'cli-102',
    clienteNombre: 'Roberto Alejandro Gómez Silva',
    numeroCuota: 1,
    montoRecibido: calc2.cuotaRegular,
    penalizacionCobrada: 0,
    fechaPago: `${addDays(todayStr, -15)} 16:45`,
    metodoPago: 'Transferencia',
    cobradorNombre: 'Carlos Mendoza',
    esAbonoParcial: false,
  },
];
