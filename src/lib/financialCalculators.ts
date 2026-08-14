import { AmortizationInstallment, FrecuenciaPago } from '@/types';
import { addDays, addMonths } from './utils';

export interface AmortizationCalculationResult {
  montoPrincipal: number;
  tasaInteresGlobal: number;
  totalInteres: number;
  totalAPagar: number;
  cuotaRegular: number;
  plazoCantidad: number;
  frecuenciaPago: FrecuenciaPago;
  tablaAmortizacion: AmortizationInstallment[];
}

export function calculateAmortizationSchedule(
  montoPrincipal: number,
  tasaInteresGlobal: number, // Ej: 15 para 15%
  plazoCantidad: number,
  frecuenciaPago: FrecuenciaPago,
  fechaInicio: string
): AmortizationCalculationResult {
  const principal = isNaN(Number(montoPrincipal)) ? 0 : Math.max(0, Number(montoPrincipal));
  const tasaRaw = isNaN(Number(tasaInteresGlobal)) ? 0 : Math.max(0, Number(tasaInteresGlobal));
  const tasaPercent = tasaRaw / 100;
  const plazos = isNaN(Number(plazoCantidad)) || Number(plazoCantidad) <= 0 ? 10 : Math.max(1, Math.round(Number(plazoCantidad)));
  const frecuencia = frecuenciaPago || 'semanal';
  const startDate = fechaInicio && fechaInicio.trim() ? fechaInicio : new Date().toISOString().split('T')[0];

  const totalInteres = Math.round(principal * tasaPercent * 100) / 100;
  const totalAPagar = Math.round((principal + totalInteres) * 100) / 100;

  const cuotaRegular = Math.round((totalAPagar / plazos) * 100) / 100;
  const capitalPorCuota = Math.round((principal / plazos) * 100) / 100;
  const interesPorCuota = Math.round((totalInteres / plazos) * 100) / 100;

  const tablaAmortizacion: AmortizationInstallment[] = [];
  let saldoPendiente = totalAPagar;
  let fechaActual = startDate;

  for (let i = 1; i <= plazos; i++) {
    // Calcular siguiente fecha según frecuencia
    fechaActual = getNextPaymentDate(fechaActual, frecuencia);

    // Ajuste en la última cuota para evitar desfases de centavos
    const esUltimaCuota = i === plazos;
    const cuotaActual = esUltimaCuota ? saldoPendiente : cuotaRegular;
    saldoPendiente = Math.max(0, Math.round((saldoPendiente - cuotaActual) * 100) / 100);

    tablaAmortizacion.push({
      numeroCuota: i,
      fechaVencimiento: fechaActual,
      cuotaTotal: cuotaActual,
      capital: esUltimaCuota ? Math.round((principal - capitalPorCuota * (plazos - 1)) * 100) / 100 : capitalPorCuota,
      interes: esUltimaCuota ? Math.round((totalInteres - interesPorCuota * (plazos - 1)) * 100) / 100 : interesPorCuota,
      saldoPendiente,
      estado: 'Pendiente',
      montoPagado: 0,
      penalizacionesMora: 0,
    });
  }

  return {
    montoPrincipal: principal,
    tasaInteresGlobal: tasaRaw,
    totalInteres,
    totalAPagar,
    cuotaRegular,
    plazoCantidad: plazos,
    frecuenciaPago: frecuencia,
    tablaAmortizacion,
  };
}

function getNextPaymentDate(currentDate: string, frecuencia: FrecuenciaPago): string {
  switch (frecuencia) {
    case 'diario':
      return addDays(currentDate, 1);
    case 'semanal':
      return addDays(currentDate, 7);
    case 'quincenal':
      return addDays(currentDate, 15);
    case 'mensual':
      return addMonths(currentDate, 1);
    default:
      return addDays(currentDate, 7);
  }
}

/**
 * Calcula la penalización acumulada por mora por cada pago/cuota atrasada.
 * Multiplica la mora unitaria por el número de cuotas en mora según la frecuencia configurada.
 */
export function calculateLateFeeForOverduePayments(
  cuotasAtrasadas: number,
  cuotaRegular: number,
  tipoPenalizacion: 'porcentaje' | 'monto_fijo',
  valorPenalizacion: number
): number {
  if (cuotasAtrasadas <= 0 || valorPenalizacion <= 0) return 0;

  const moraUnitaria =
    tipoPenalizacion === 'monto_fijo'
      ? valorPenalizacion
      : Math.round((cuotaRegular * (valorPenalizacion / 100)) * 100) / 100;

  return Math.round((cuotasAtrasadas * moraUnitaria) * 100) / 100;
}
