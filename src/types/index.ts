export type UserRole = 'Administrador' | 'Promotor de Campo' | string;

export interface StructuredAddress {
  calle: string;
  numExterior: string;
  numInterior?: string;
  colonia: string;
  codigoPostal: string;
  ciudad: string;
  estado: string;
}

export interface Reference {
  nombre: string;
  parentesco: 'Familiar' | 'Amigo' | 'Vecino' | 'Compañero de Trabajo / Socio' | string;
  telefono: string;
  direccionEstructurada?: StructuredAddress;
  direccion?: string;
}

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
  // Campos específicos para Promotor de Campo
  curp?: string;
  fechaNacimiento?: string;
  folioIne?: string;
  direccionEstructurada?: StructuredAddress;
  referencia1?: Reference;
  referencia2?: Reference;
}

export type FrecuenciaPago = 'diario' | 'semanal' | 'quincenal' | 'mensual';

export type TipoPenalizacionMora = 'porcentaje' | 'monto_fijo';

export interface FinancialProduct {
  id: string;
  nombre: string;
  descripcion: string;
  frecuenciaPago: FrecuenciaPago;
  plazo: number; // Plazo único (número de cuotas, ej: 10)
  tasaInteresGlobal: number; // Porcentaje global fijo (ej. 15%)
  tipoPenalizacionMora: TipoPenalizacionMora; // 'porcentaje' o 'monto_fijo'
  valorPenalizacionMora: number; // Aplicado por cada cuota/pago atrasado según frecuencia
  activo: boolean;
  eliminado?: boolean;
}

export type ScoreCrediticio = 'Excelente' | 'Bueno' | 'Regular' | 'Alto Riesgo';

export interface Client {
  id: string;
  folio: string;
  nombre: string;
  telefono: string;
  email?: string;
  direccion: string;
  direccionEstructurada?: StructuredAddress;
  curp: string;
  folioIne: string;
  rfc?: string;
  scoreCrediticio: ScoreCrediticio;
  referencia1?: Reference;
  referencia2?: Reference;
  promotorAsignadoId?: string | null;
  promotorAsignadoNombre?: string | null;
  estatus: 'Activo' | 'Inactivo' | 'Bloqueado';
  fechaRegistro: string;
}

export type EstadoCuota = 'Pendiente' | 'Pagado' | 'Mora' | 'Parcial';

export interface AmortizationInstallment {
  numeroCuota: number;
  fechaVencimiento: string;
  capital: number;
  interes: number;
  cuotaTotal: number;
  saldoPendiente: number;
  montoPagado: number;
  estado: EstadoCuota;
  fechaPago?: string;
  fechaPagoReal?: string;
  penalizacionesMora?: number;
}

export type EstatusPrestamo = 'En Evaluación' | 'Aprobado' | 'Rechazado' | 'Activo' | 'Pagado' | 'En Mora' | 'Cancelado' | 'Liquidado' | 'Incobrable';

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
  fechaInicio: string;
  cuotaRegular: number;
  totalAPagar: number;
  saldoPendiente: number;
  estatus: EstatusPrestamo;
  promotorAsignado: string;
  motivoRechazo?: string;
  creadoPorRol?: UserRole;
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
  fechaPago: string;
  metodoPago: 'Efectivo' | 'Transferencia' | 'Tarjeta';
  cobradorNombre: string;
  esAbonoParcial: boolean;
  nota?: string;
}
