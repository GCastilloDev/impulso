import { PaymentRecord, Client, Loan } from '@/types';

export interface CommissionTier {
  minClients: number;
  maxClients: number | null;
  percentage: number;
  label: string;
}

export const COMMISSION_TIERS: CommissionTier[] = [
  { minClients: 0, maxClients: 19, percentage: 5, label: '0 a 19 clientes (5%)' },
  { minClients: 20, maxClients: 29, percentage: 6, label: '20 a 29 clientes (6%)' },
  { minClients: 30, maxClients: 49, percentage: 7, label: '30 a 49 clientes (7%)' },
  { minClients: 50, maxClients: 69, percentage: 8, label: '50 a 69 clientes (8%)' },
  { minClients: 70, maxClients: 89, percentage: 9, label: '70 a 89 clientes (9%)' },
  { minClients: 90, maxClients: null, percentage: 10, label: '90+ clientes (10%)' },
];

/**
 * Obtiene el porcentaje y escalón del tabulador correspondiente a una cantidad de clientes.
 */
export function getCommissionTier(clientCount: number): CommissionTier {
  const count = Math.max(0, clientCount);
  for (const tier of COMMISSION_TIERS) {
    if (tier.maxClients === null) {
      if (count >= tier.minClients) return tier;
    } else {
      if (count >= tier.minClients && count <= tier.maxClients) return tier;
    }
  }
  return COMMISSION_TIERS[0];
}

/**
 * Obtiene el rango de fechas [lunes, domingo] en formato YYYY-MM-DD para una fecha dada.
 */
export function getWeekDateRange(date: Date = new Date()): { start: string; end: string; label: string } {
  const current = new Date(date);
  const day = current.getDay();
  // En JS: 0 es domingo, 1 es lunes... 6 es sábado.
  // Ajustar para que lunes sea día 0 de la semana laboral
  const diffToMonday = (day + 6) % 7;
  
  const monday = new Date(current);
  monday.setDate(current.getDate() - diffToMonday);
  monday.setHours(0, 0, 0, 0);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  const start = monday.toISOString().split('T')[0];
  const end = sunday.toISOString().split('T')[0];

  const label = `Semana del ${monday.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })} al ${sunday.toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })}`;

  return { start, end, label };
}

export interface PromoterCommissionSummary {
  promotorNombre: string;
  totalClientesAsignados: number;
  totalClientesCobrados: number;
  montoCobranzaTotal: number;
  montoMoraExcluida: number;
  baseComisionable: number;
  porcentajeComision: number;
  escalonEtiqueta: string;
  montoComisionGanada: number;
  cantidadRecibos: number;
  criterioEscalon: 'cartera_asignada' | 'clientes_cobrados';
}

/**
 * Calcula las comisiones semanales de un promotor sobre cobranza ordinaria (sin mora).
 */
export function calculatePromoterCommission(params: {
  promotorNombre: string;
  clients: Client[];
  loans: Loan[];
  payments: PaymentRecord[];
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  criterioEscalon?: 'cartera_asignada' | 'clientes_cobrados';
}): PromoterCommissionSummary {
  const {
    promotorNombre,
    clients,
    loans,
    payments,
    startDate,
    endDate,
    criterioEscalon = 'cartera_asignada',
  } = params;

  // 1. Clientes asignados activos en la cartera del promotor
  const assignedClients = clients.filter(
    (c) => c.promotorAsignadoNombre === promotorNombre && c.estatus !== 'Inactivo'
  );
  const totalClientesAsignados = assignedClients.length;

  // 2. Pagos aplicados en el rango semanal para este promotor
  const weeklyPayments = payments.filter((p) => {
    if (p.cobradorNombre !== promotorNombre) return false;
    if (p.estatus && p.estatus !== 'Aplicado') return false;
    if (p.montoRecibido <= 0) return false; // Excluye visitas fallidas

    // Fecha del pago YYYY-MM-DD
    const paymentDateStr = p.fechaCobroReal || p.fechaPago.split('T')[0];
    return paymentDateStr >= startDate && paymentDateStr <= endDate;
  });

  // 3. Clientes únicos que realizaron al menos un pago en la semana
  const paidClientIds = new Set<string>();
  weeklyPayments.forEach((p) => paidClientIds.add(p.clienteId));
  const totalClientesCobrados = paidClientIds.size;

  // 4. Base comisionable: Cobranza ordinaria excluyendo la mora
  let montoCobranzaTotal = 0;
  let montoMoraExcluida = 0;
  let baseComisionable = 0;

  weeklyPayments.forEach((p) => {
    montoCobranzaTotal += p.montoRecibido;
    // Si hubo mora registrada en el pago
    const moraEnPago = p.penalizacionCobrada || 0;
    // El cobro de cuota pura comisionable es el monto recibido menos cualquier mora
    const cuotaPura = Math.max(0, p.montoRecibido - moraEnPago);

    montoMoraExcluida += moraEnPago;
    baseComisionable += cuotaPura;
  });

  // 5. Determinación del escalón del tabulador
  const baseCountForTier =
    criterioEscalon === 'cartera_asignada' ? totalClientesAsignados : totalClientesCobrados;

  const tier = getCommissionTier(baseCountForTier);
  const porcentajeComision = tier.percentage;
  const escalonEtiqueta = tier.label;

  // 6. Cálculo del monto neto de comisión ganada
  const montoComisionGanada = Math.round((baseComisionable * (porcentajeComision / 100)) * 100) / 100;

  return {
    promotorNombre,
    totalClientesAsignados,
    totalClientesCobrados,
    montoCobranzaTotal: Math.round(montoCobranzaTotal * 100) / 100,
    montoMoraExcluida: Math.round(montoMoraExcluida * 100) / 100,
    baseComisionable: Math.round(baseComisionable * 100) / 100,
    porcentajeComision,
    escalonEtiqueta,
    montoComisionGanada,
    cantidadRecibos: weeklyPayments.length,
    criterioEscalon,
  };
}
