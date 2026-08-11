export type UserRole = 'Administrador' | 'Promotor de Campo' | string;

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  telefono?: string;
  estatus: 'Activo' | 'Inactivo';
  fechaAlta: string;
  avatar?: string;
}

export type FrecuenciaPago = 'diario' | 'semanal' | 'quincenal' | 'mensual';

export interface FinancialProduct {
  id: string;
  nombre: string;
  descripcion: string;
  frecuenciaPago: FrecuenciaPago;
  plazosPosibles: number[]; // Ej: [4, 8, 12, 16] o [6, 12]
  tasaInteresGlobal: number; // Porcentaje global fijo (ej. 15%)
  porcentajePenalizacionMora: number; // Porcentaje por pago vencido (ej. 5%)
  montoMinimo: number;
  montoMaximo: number;
  activo: boolean;
}

export type ScoreCrediticio = 'Excelente' | 'Bueno' | 'Regular' | 'Alto Riesgo';

export interface Reference {
  nombre: string;
  parentesco: 'Familiar' | 'Amigo' | 'Vecino' | 'Compañero de Trabajo / Socio' | string;
  telefono: string;
  direccion?: string;
}

export interface Client {
  id: string;
  folio: string;
  nombre: string;
  telefono: string;
  email: string;
  direccion: string;
  curp: string;
  rfc: string;
  limiteCredito?: number;
  scoreCrediticio: ScoreCrediticio;
  referencia1: Reference;
  referencia2: Reference;
  promotorAsignadoId?: string;
  promotorAsignadoNombre?: string;
  estatus: 'Activo' | 'Inactivo' | 'Bloqueado';
  fechaRegistro: string;
  notas?: string;
}

export type EstadoCuota = 'Pendiente' | 'Pagado' | 'Mora' | 'Parcial';

export interface AmortizationInstallment {
  numeroCuota: number;
  fechaVencimiento: string; // YYYY-MM-DD
  cuotaTotal: number;
  capital: number;
  interes: number;
  saldoPendiente: number;
  estado: EstadoCuota;
  montoPagado: number;
  penalizacionesMora: number;
  fechaPagoReal?: string;
}

export type EstatusPrestamo = 'Activo' | 'Liquidado' | 'En Mora' | 'Incobrable';

export interface Loan {
  id: string;
  folio: string;
  clienteId: string;
  clienteNombre: string;
  clienteTelefono?: string;
  productoId: string;
  productoNombre: string;
  montoPrincipal: number;
  tasaInteresGlobal: number;
  plazoCantidad: number;
  frecuenciaPago: FrecuenciaPago;
  fechaInicio: string; // YYYY-MM-DD
  cuotaRegular: number;
  totalAPagar: number;
  saldoPendiente: number;
  estatus: EstatusPrestamo;
  promotorAsignado: string;
  tablaAmortizacion: AmortizationInstallment[];
}

export interface PaymentRecord {
  id: string;
  folioRecibo: string;
  prestamoId: string;
  prestamoFolio: string;
  clienteId: string;
  clienteNombre: string;
  numeroCuota: number;
  montoRecibido: number;
  penalizacionCobrada: number;
  fechaPago: string; // YYYY-MM-DD HH:mm
  metodoPago: 'Efectivo' | 'Transferencia' | 'Tarjeta';
  cobradorNombre: string;
  esAbonoParcial: boolean;
  nota?: string;
}

export interface DashboardMetrics {
  totalCarteraActiva: number;
  totalCobradoHoy: number;
  metaCobroHoy: number;
  indiceMorosidad: number;
  totalClientesActivos: number;
  prestamosEnMoraCount: number;
  proyeccionIntereses: number;
}
