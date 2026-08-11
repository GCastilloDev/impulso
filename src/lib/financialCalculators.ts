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
  const principal = Math.max(0, montoPrincipal);
  const tasaPercent = Math.max(0, tasaInteresGlobal) / 100;
  const plazos = Math.max(1, plazoCantidad);

  const totalInteres = Math.round(principal * tasaPercent * 100) / 100;
  const totalAPagar = Math.round((principal + totalInteres) * 100) / 100;

  const cuotaRegular = Math.round((totalAPagar / plazos) * 100) / 100;
  const capitalPorCuota = Math.round((principal / plazos) * 100) / 100;
  const interesPorCuota = Math.round((totalInteres / plazos) * 100) / 100;

  const tablaAmortizacion: AmortizationInstallment[] = [];
  let saldoPendiente = totalAPagar;
  let fechaActual = fechaInicio;

  for (let i = 1; i <= plazos; i++) {
    // Calcular siguiente fecha según frecuencia
    if (i === 1) {
      // Primera fecha de cobro
      fechaActual = getNextPaymentDate(fechaInicio, frecuenciaPago);
    } else {
      fechaActual = getNextPaymentDate(fechaActual, frecuenciaPago);
    }

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
    tasaInteresGlobal,
    totalInteres,
    totalAPagar,
    cuotaRegular,
    plazoCantidad: plazos,
    frecuenciaPago,
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
