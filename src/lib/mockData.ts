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
    telefono: '55 1122 3344',
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
    telefono: '55 4433 2211',
    estatus: 'Activo',
    fechaAlta: '2025-11-15',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200',
  },
  {
    id: 'usr-3',
    name: 'Laura Méndez',
    email: 'laura.mendez@financieraimpulso.com',
    password: '123456',
    role: 'Promotor de Campo',
    telefono: '55 6677 8899',
    estatus: 'Activo',
    fechaAlta: '2026-01-10',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200',
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

export const MOCK_CLIENTS: Client[] = [
  {
    id: 'cli-101',
    folio: 'CLI-00101',
    nombre: 'Sofía Guadalupe Hernández Juárez',
    telefono: '55 4123 9876',
    email: 'sofia.hernandez@gmail.com',
    direccion: 'Av. Revolución 450, Col. Escandón, CDMX',
    curp: 'HEJS920415MDFRZZ01',
    rfc: 'HEJS920415AB1',
    scoreCrediticio: 'Excelente',
    promotorAsignadoId: 'usr-2',
    promotorAsignadoNombre: 'Pedro Ramírez',
    referencia1: {
      nombre: 'Ernesto Hernández Juárez',
      parentesco: 'Familiar',
      telefono: '55 9876 5432',
      direccion: 'CDMX',
    },
    referencia2: {
      nombre: 'Verónica Castro Solís',
      parentesco: 'Compañero de Trabajo / Socio',
      telefono: '55 3322 1100',
    },
    estatus: 'Activo',
    fechaRegistro: '2025-11-10',
    notas: 'Cliente puntual, negocio de miscelánea.',
  },
  {
    id: 'cli-102',
    folio: 'CLI-00102',
    nombre: 'Roberto Alejandro Gómez Silva',
    telefono: '55 8765 4321',
    email: 'roberto.gomez@hotmail.com',
    direccion: 'Calle Morelos 12, Col. Centro, Toluca',
    curp: 'GOSR881102HMCNLN04',
    rfc: 'GOSR881102XY9',
    scoreCrediticio: 'Bueno',
    promotorAsignadoId: 'usr-2',
    promotorAsignadoNombre: 'Pedro Ramírez',
    referencia1: {
      nombre: 'Guillermo Gómez Silva',
      parentesco: 'Familiar',
      telefono: '72 2123 4567',
    },
    referencia2: {
      nombre: 'Fernando Ruiz Medina',
      parentesco: 'Amigo',
      telefono: '55 6655 4433',
    },
    estatus: 'Activo',
    fechaRegistro: '2025-12-01',
    notas: 'Taller mecánico.',
  },
  {
    id: 'cli-103',
    folio: 'CLI-00103',
    nombre: 'María Elena Morales Castro',
    telefono: '55 2345 6789',
    email: 'elena.morales@yahoo.com',
    direccion: 'Calle Hidalgo 89, Col. Bellavista, Metepec',
    curp: 'MOCM950820MDFRRN09',
    rfc: 'MOCM950820KL4',
    scoreCrediticio: 'Alto Riesgo',
    promotorAsignadoId: 'usr-3',
    promotorAsignadoNombre: 'Laura Méndez',
    referencia1: {
      nombre: 'Patricia Morales Castro',
      parentesco: 'Familiar',
      telefono: '55 8899 0011',
    },
    referencia2: {
      nombre: 'Jorge Luis Estrada',
      parentesco: 'Vecino',
      telefono: '55 7766 5544',
    },
    estatus: 'Activo',
    fechaRegistro: '2026-01-05',
    notas: 'Presenta retrasos de 2 a 3 días habitualmente.',
  },
  {
    id: 'cli-104',
    folio: 'CLI-00104',
    nombre: 'Javier Ramírez Trejo',
    telefono: '55 9988 7766',
    email: 'j.ramirez.t@gmail.com',
    direccion: 'Calzada de Tlalpan 1200, CDMX',
    curp: 'RATJ910304HDFRRS03',
    rfc: 'RATJ910304MN7',
    scoreCrediticio: 'Excelente',
    promotorAsignadoId: 'usr-3',
    promotorAsignadoNombre: 'Laura Méndez',
    referencia1: {
      nombre: 'Andrea Ramírez Trejo',
      parentesco: 'Familiar',
      telefono: '55 1122 9988',
    },
    referencia2: {
      nombre: 'Carlos Beltrán Vaca',
      parentesco: 'Amigo',
      telefono: '55 4411 2233',
    },
    estatus: 'Activo',
    fechaRegistro: '2026-02-14',
  },
  {
    id: 'cli-105',
    folio: 'CLI-00105',
    nombre: 'Ana Lucía Ortiz Delgado',
    telefono: '55 3344 5566',
    email: 'analucia.ortiz@outlook.com',
    direccion: 'Av. Insurgentes Sur 890, CDMX',
    curp: 'OIDA970512MDFRRX02',
    rfc: 'OIDA970512PR3',
    scoreCrediticio: 'Regular',
    promotorAsignadoId: 'usr-2',
    promotorAsignadoNombre: 'Pedro Ramírez',
    referencia1: {
      nombre: 'Martha Delgado Soto',
      parentesco: 'Familiar',
      telefono: '55 6677 8899',
    },
    referencia2: {
      nombre: 'Ricardo Silva Peñaloza',
      parentesco: 'Compañero de Trabajo / Socio',
      telefono: '55 2233 4455',
    },
    estatus: 'Activo',
    fechaRegistro: '2026-03-01',
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
