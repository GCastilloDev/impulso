'use server';

import { unstable_noStore as noStore } from 'next/cache';
import { db } from '@/lib/db';
import { CashClosure, EstatusCierre } from '@/types';

/**
 * Obtiene el desglose previo del arqueo para un promotor, aplicando la
 * regla de corte contable a las 16:00 hrs y separando pagos para el día siguiente.
 */
function getMexicoCityTime(date: Date) {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Mexico_City',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  const parts = formatter.formatToParts(date);
  const map: Record<string, string> = {};
  parts.forEach((p) => {
    map[p.type] = p.value;
  });
  return {
    dateStr: `${map.year}-${map.month}-${map.day}`,
    hours: parseInt(map.hour || '0', 10),
    minutes: parseInt(map.minute || '0', 10),
  };
}

/**
 * Obtiene el desglose previo del arqueo para un promotor, aplicando la
 * regla de corte contable a las 16:00 hrs en zona horaria de México y separando pagos para el día siguiente.
 */
export async function getClosurePreviewAction(promotorNombre: string) {
  noStore();
  try {
    const whereCondition: Record<string, unknown> = {
      estatus: 'Aplicado',
      cierreId: null,
      montoRecibido: { gt: 0 },
    };

    if (promotorNombre && promotorNombre !== 'todos') {
      whereCondition.cobradorNombre = promotorNombre;
    }

    // Pagos aplicados que aún no han sido incluidos en un cierre
    const unclosedPayments = await db.paymentRecord.findMany({
      where: whereCondition,
      orderBy: { createdAt: 'asc' },
    });

    const nowMexico = getMexicoCityTime(new Date());
    const todayStr = nowMexico.dateStr;

    // Clasificación por horario de corte (16:00 hrs México)
    const pagosCorteActual: typeof unclosedPayments = [];
    const pagosSiguienteDia: typeof unclosedPayments = [];

    unclosedPayments.forEach((payment) => {
      const paymentMexico = getMexicoCityTime(new Date(payment.createdAt));
      const isPast16hrs = paymentMexico.hours > 16 || (paymentMexico.hours === 16 && paymentMexico.minutes > 0);
      const isPaymentToday = paymentMexico.dateStr === todayStr;

      if (isPaymentToday && isPast16hrs) {
        pagosSiguienteDia.push(payment);
      } else {
        pagosCorteActual.push(payment);
      }
    });

    let totalCobrado = 0;
    let totalEfectivo = 0;
    let totalTransferencia = 0;

    pagosCorteActual.forEach((p) => {
      totalCobrado += p.montoRecibido;
      if (p.metodoPago === 'Efectivo') {
        totalEfectivo += p.montoRecibido;
      } else {
        totalTransferencia += p.montoRecibido;
      }
    });

    const totalPost16hrs = pagosSiguienteDia.reduce((acc, p) => acc + p.montoRecibido, 0);

    return {
      success: true,
      data: {
        totalCobrado: Math.round(totalCobrado * 100) / 100,
        totalEfectivo: Math.round(totalEfectivo * 100) / 100,
        totalTransferencia: Math.round(totalTransferencia * 100) / 100,
        cantidadCobros: pagosCorteActual.length,
        pagosIds: pagosCorteActual.map((p) => p.id),
        pagos: pagosCorteActual.map((p) => ({
          id: p.id,
          folioRecibo: p.folioRecibo,
          clienteNombre: p.clienteNombre,
          prestamoFolio: p.prestamoFolio,
          numeroCuota: p.numeroCuota,
          montoRecibido: p.montoRecibido,
          penalizacionCobrada: p.penalizacionCobrada,
          metodoPago: p.metodoPago,
          esAbonoParcial: p.esAbonoParcial,
          cobradorNombre: p.cobradorNombre,
          createdAt: p.createdAt.toISOString(),
        })),
        pagosSiguienteDia: {
          cantidad: pagosSiguienteDia.length,
          total: Math.round(totalPost16hrs * 100) / 100,
          pagos: pagosSiguienteDia.map((p) => ({
            id: p.id,
            folioRecibo: p.folioRecibo,
            clienteNombre: p.clienteNombre,
            prestamoFolio: p.prestamoFolio,
            numeroCuota: p.numeroCuota,
            montoRecibido: p.montoRecibido,
            penalizacionCobrada: p.penalizacionCobrada,
            metodoPago: p.metodoPago,
            esAbonoParcial: p.esAbonoParcial,
            cobradorNombre: p.cobradorNombre,
            createdAt: p.createdAt.toISOString(),
          })),
        },
      },
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error al calcular arqueo previo.';
    console.error('Error in getClosurePreviewAction:', error);
    return { success: false, message, data: null };
  }
}

/**
 * Registra el Cierre de Ruta / Arqueo Diario con cuadre íntegro al 100%.
 */
export async function createCashClosureAction(params: {
  promotorNombre: string;
  folioDepositoBanco: string;
  montoDepositado: number;
  comprobanteUrl?: string;
  nota?: string;
}) {
  try {
    const preview = await getClosurePreviewAction(params.promotorNombre);
    if (!preview.success || !preview.data) {
      return { success: false, message: 'No se pudo obtener el desglose de cobranza para el cierre.' };
    }

    const { totalCobrado, totalEfectivo, totalTransferencia, cantidadCobros, pagosIds } = preview.data;

    if (cantidadCobros === 0) {
      return {
        success: false,
        message: 'No tienes cobros pendientes de corte en este momento para generar un cierre.',
      };
    }

    // Regla de Negocio Estricta: Depósito al 100% exacto de lo recaudado
    const montoEsperado = Math.round(totalCobrado * 100) / 100;
    const montoReportado = Math.round(Number(params.montoDepositado) * 100) / 100;

    if (montoReportado !== montoEsperado) {
      return {
        success: false,
        message: `El monto reportado en la ficha ($${montoReportado.toFixed(2)}) no coincide con el total recaudado ($${montoEsperado.toFixed(2)}). La política institucional exige cuadre exacto al 100% sin cierres parciales.`,
      };
    }

    if (!params.folioDepositoBanco || params.folioDepositoBanco.trim().length < 4) {
      return {
        success: false,
        message: 'El folio de depósito o comprobante de transferencia bancaria es obligatorio (mínimo 4 caracteres).',
      };
    }

    const count = await db.cashClosure.count();
    const folioCierre = `CORTE-2026-${String(count + 1).padStart(3, '0')}`;
    const now = new Date();
    const fechaJornada = now.toISOString().split('T')[0];
    const horaCorte = now.toTimeString().split(' ')[0];

    const closure = await db.cashClosure.create({
      data: {
        folioCierre,
        promotorNombre: params.promotorNombre,
        fechaJornada,
        horaCorte,
        totalCobrado: montoEsperado,
        totalEfectivo,
        totalTransferencia,
        cantidadCobros,
        folioDepositoBanco: params.folioDepositoBanco.trim(),
        comprobanteUrl: params.comprobanteUrl || null,
        nota: params.nota || null,
        estatus: 'Pendiente',
      },
    });

    // Vincular todos los cobros correspondientes a este cierre
    await db.paymentRecord.updateMany({
      where: {
        id: { in: pagosIds },
      },
      data: {
        cierreId: closure.id,
      },
    });

    return {
      success: true,
      message: `Cierre de ruta ${folioCierre} registrado exitosamente por $${montoEsperado.toFixed(2)}. Queda pendiente de conciliación bancaria por el Administrador.`,
      closure: {
        id: closure.id,
        folioCierre: closure.folioCierre,
        promotorNombre: closure.promotorNombre,
        fechaJornada: closure.fechaJornada,
        horaCorte: closure.horaCorte,
        totalCobrado: closure.totalCobrado,
        totalEfectivo: closure.totalEfectivo,
        totalTransferencia: closure.totalTransferencia,
        cantidadCobros: closure.cantidadCobros,
        folioDepositoBanco: closure.folioDepositoBanco,
        comprobanteUrl: closure.comprobanteUrl || undefined,
        nota: closure.nota || undefined,
        estatus: closure.estatus as EstatusCierre,
        createdAt: closure.createdAt.toISOString(),
      } as CashClosure,
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error al registrar el cierre de ruta.';
    console.error('Error in createCashClosureAction:', error);
    return { success: false, message };
  }
}

/**
 * Obtiene la lista histórica de cierres de ruta.
 */
export async function getCashClosuresAction() {
  noStore();
  try {
    const closures = await db.cashClosure.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return {
      success: true,
      closures: closures.map((c) => ({
        id: c.id,
        folioCierre: c.folioCierre,
        promotorNombre: c.promotorNombre,
        fechaJornada: c.fechaJornada,
        horaCorte: c.horaCorte,
        totalCobrado: c.totalCobrado,
        totalEfectivo: c.totalEfectivo,
        totalTransferencia: c.totalTransferencia,
        cantidadCobros: c.cantidadCobros,
        folioDepositoBanco: c.folioDepositoBanco,
        comprobanteUrl: c.comprobanteUrl || undefined,
        nota: c.nota || undefined,
        estatus: c.estatus as EstatusCierre,
        conciliadoPorNombre: c.conciliadoPorNombre || undefined,
        fechaConciliacion: c.fechaConciliacion ? c.fechaConciliacion.toISOString().split('T')[0] : undefined,
        motivoRechazo: c.motivoRechazo || undefined,
        createdAt: c.createdAt.toISOString(),
      })) as CashClosure[],
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error al obtener cierres de ruta.';
    console.error('Error fetching cash closures:', error);
    return { success: false, message, closures: [] };
  }
}

/**
 * Conciliación bancaria por parte del Administrador.
 */
export async function reconcileCashClosureAction(params: {
  closureId: string;
  decision: 'CONCILIAR' | 'RECHAZAR';
  adminNombre: string;
  motivoRechazo?: string;
}) {
  try {
    const closure = await db.cashClosure.findUnique({
      where: { id: params.closureId },
    });

    if (!closure) {
      return { success: false, message: 'Cierre de ruta no encontrado.' };
    }

    if (closure.estatus !== 'Pendiente') {
      return { success: false, message: `Este cierre ya fue dictaminado previamente como ${closure.estatus}.` };
    }

    if (params.decision === 'CONCILIAR') {
      await db.cashClosure.update({
        where: { id: closure.id },
        data: {
          estatus: 'Conciliado',
          conciliadoPorNombre: params.adminNombre,
          fechaConciliacion: new Date(),
        },
      });

      return {
        success: true,
        message: `Cierre ${closure.folioCierre} conciliado exitosamente contra el banco por $${closure.totalCobrado.toFixed(2)}.`,
      };
    } else {
      await db.cashClosure.update({
        where: { id: closure.id },
        data: {
          estatus: 'Rechazado',
          conciliadoPorNombre: params.adminNombre,
          fechaConciliacion: new Date(),
          motivoRechazo: params.motivoRechazo || 'Discrepancia bancaria reportada por administración.',
        },
      });

      // Si se rechaza, desvinculamos los cobros para que puedan ser re-sometidos o corregidos
      await db.paymentRecord.updateMany({
        where: { cierreId: closure.id },
        data: { cierreId: null },
      });

      return {
        success: true,
        message: `Cierre ${closure.folioCierre} rechazado. Los cobros fueron liberados para su re-cotejo y aclaración.`,
      };
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error al procesar la conciliación del arqueo.';
    console.error('Error in reconcileCashClosureAction:', error);
    return { success: false, message };
  }
}
