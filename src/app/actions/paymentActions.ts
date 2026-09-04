'use server';

import { unstable_noStore as noStore } from 'next/cache';
import { db } from '@/lib/db';
import { PaymentRecord, EstatusPago, AmortizationInstallment, EstadoCuota } from '@/types';

export async function getPaymentsAction() {
  noStore();
  try {
    const payments = await db.paymentRecord.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return {
      success: true,
      payments: payments.map((p) => ({
        id: p.id,
        folioRecibo: p.folioRecibo,
        prestamoId: p.prestamoId,
        prestamoFolio: p.prestamoFolio,
        clienteId: p.clienteId,
        clienteNombre: p.clienteNombre,
        numeroCuota: p.numeroCuota,
        montoRecibido: p.montoRecibido,
        penalizacionCobrada: p.penalizacionCobrada,
        fechaPago: p.fechaPago.toISOString().split('T')[0],
        metodoPago: p.metodoPago as PaymentRecord['metodoPago'],
        cobradorNombre: p.cobradorNombre,
        esAbonoParcial: p.esAbonoParcial,
        nota: p.nota || undefined,
        estatus: (p.estatus as EstatusPago) || 'Aplicado',
        esExtemporaneo: p.esExtemporaneo,
        fechaCobroReal: p.fechaCobroReal ? p.fechaCobroReal.toISOString().split('T')[0] : undefined,
        motivoExtemporaneo: p.motivoExtemporaneo || undefined,
        autorizadoPorNombre: p.autorizadoPorNombre || undefined,
        fechaAutorizacion: p.fechaAutorizacion ? p.fechaAutorizacion.toISOString().split('T')[0] : undefined,
        motivoRechazo: p.motivoRechazo || undefined,
        esVisitaFallida: p.esVisitaFallida,
        motivoVisitaFallida: p.motivoVisitaFallida || undefined,
      })) as PaymentRecord[],
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error al obtener pagos.';
    console.error('Error fetching payments:', error);
    return { success: false, message, payments: [] };
  }
}

export async function getPendingPaymentsAction() {
  noStore();
  try {
    const pending = await db.paymentRecord.findMany({
      where: { estatus: 'Pendiente' },
      orderBy: { createdAt: 'desc' },
    });

    return {
      success: true,
      payments: pending.map((p) => ({
        id: p.id,
        folioRecibo: p.folioRecibo,
        prestamoId: p.prestamoId,
        prestamoFolio: p.prestamoFolio,
        clienteId: p.clienteId,
        clienteNombre: p.clienteNombre,
        numeroCuota: p.numeroCuota,
        montoRecibido: p.montoRecibido,
        penalizacionCobrada: p.penalizacionCobrada,
        fechaPago: p.fechaPago.toISOString().split('T')[0],
        metodoPago: p.metodoPago as PaymentRecord['metodoPago'],
        cobradorNombre: p.cobradorNombre,
        esAbonoParcial: p.esAbonoParcial,
        nota: p.nota || undefined,
        estatus: p.estatus as EstatusPago,
        esExtemporaneo: p.esExtemporaneo,
        fechaCobroReal: p.fechaCobroReal ? p.fechaCobroReal.toISOString().split('T')[0] : undefined,
        motivoExtemporaneo: p.motivoExtemporaneo || undefined,
        autorizadoPorNombre: p.autorizadoPorNombre || undefined,
        fechaAutorizacion: p.fechaAutorizacion ? p.fechaAutorizacion.toISOString().split('T')[0] : undefined,
        motivoRechazo: p.motivoRechazo || undefined,
        esVisitaFallida: p.esVisitaFallida,
        motivoVisitaFallida: p.motivoVisitaFallida || undefined,
      })) as PaymentRecord[],
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error al obtener pagos pendientes.';
    console.error('Error fetching pending payments:', error);
    return { success: false, message, payments: [] };
  }
}

export async function registerPaymentAction(params: {
  prestamoId: string;
  numeroCuota: number;
  montoRecibido: number;
  penalizacionCobrada: number;
  metodoPago: string;
  cobradorNombre: string;
  nota?: string;
  esExtemporaneo?: boolean;
  fechaCobroReal?: string;
  motivoExtemporaneo?: string;
}) {
  try {
    const loan = await db.loan.findUnique({
      where: { id: params.prestamoId },
    });

    if (!loan) {
      return { success: false, message: 'Préstamo no encontrado.' };
    }

    const count = await db.paymentRecord.count();
    const folioRecibo = `REC-2026-${String(count + 1).padStart(3, '0')}`;
    const tabla: AmortizationInstallment[] = Array.isArray(loan.tablaAmortizacion)
      ? (loan.tablaAmortizacion as unknown as AmortizationInstallment[])
      : [];

    const targetCuota = tabla.find((c) => c.numeroCuota === params.numeroCuota);
    if (!targetCuota) {
      return { success: false, message: 'Cuota no encontrada en el plan de pagos del préstamo.' };
    }

    const montoPagadoPrevio = Math.round((targetCuota.montoPagado || 0) * 100) / 100;
    const remanenteCuota = Math.max(0, Math.round((targetCuota.cuotaTotal - montoPagadoPrevio) * 100) / 100);

    if (remanenteCuota <= 0) {
      return { success: false, message: `La cuota #${params.numeroCuota} ya se encuentra totalmente liquidada.` };
    }

    const penalizacion = Math.max(0, params.penalizacionCobrada || 0);
    const totalAdeudado = Math.round((remanenteCuota + penalizacion) * 100) / 100;
    const cuotaAmortizada = Math.max(0, Math.round((params.montoRecibido - penalizacion) * 100) / 100);

    if (params.montoRecibido > totalAdeudado) {
      return {
        success: false,
        message: `El monto ingresado excede el saldo total de la cuota ($${totalAdeudado.toFixed(2)}). Máximo a recibir: $${totalAdeudado.toFixed(2)}.`,
      };
    }

    // Regla de Negocio: Abono mínimo de $100.00 (excepto si el total adeudado para liquidar es menor a $100)
    if (totalAdeudado >= 100 && params.montoRecibido < 100) {
      return {
        success: false,
        message: 'El abono mínimo permitido es de $100.00 (excepto cuando el remanente de liquidación sea menor a $100.00).',
      };
    }

    if (penalizacion > 0 && cuotaAmortizada <= 0) {
      return {
        success: false,
        message: `El monto debe ser mayor a la penalización por mora ($${penalizacion.toFixed(2)}) para amortizar la cuota.`,
      };
    }

    const nuevoMontoPagado = Math.min(targetCuota.cuotaTotal, Math.round((montoPagadoPrevio + cuotaAmortizada) * 100) / 100);
    const nuevoSaldoCuota = Math.max(0, Math.round((targetCuota.cuotaTotal - nuevoMontoPagado) * 100) / 100);
    const estaLiquidada = nuevoSaldoCuota === 0;
    const nuevoEstadoCuota: EstadoCuota = estaLiquidada ? 'Pagado' : 'Parcial';
    const esAbonoParcial = !estaLiquidada;

    if (params.esExtemporaneo) {
      // 1. Registro de Pago Extemporáneo (En espera de autorización)
      const newPayment = await db.paymentRecord.create({
        data: {
          folioRecibo,
          prestamoId: loan.id,
          prestamoFolio: loan.folio,
          clienteId: loan.clienteId,
          clienteNombre: loan.clienteNombre,
          numeroCuota: params.numeroCuota,
          montoRecibido: params.montoRecibido,
          penalizacionCobrada: 0,
          metodoPago: params.metodoPago,
          cobradorNombre: params.cobradorNombre,
          esAbonoParcial: esAbonoParcial,
          nota: params.nota || null,
          estatus: 'Pendiente',
          esExtemporaneo: true,
          fechaCobroReal: params.fechaCobroReal ? new Date(params.fechaCobroReal) : new Date(),
          motivoExtemporaneo: params.motivoExtemporaneo || null,
        },
      });

      // Poner la cuota en estado 'En Revisión'
      const updatedTabla = tabla.map((cuota) => {
        if (cuota.numeroCuota === params.numeroCuota) {
          return {
            ...cuota,
            estado: 'En Revisión' as const,
            fechaPagoReal: params.fechaCobroReal,
          };
        }
        return cuota;
      });

      await db.loan.update({
        where: { id: loan.id },
        data: {
          tablaAmortizacion: updatedTabla as unknown as object,
        },
      });

      return {
        success: true,
        message: `Solicitud de cobro extemporáneo registrada con folio ${folioRecibo}. Queda pendiente de autorización por un Administrador.`,
        paymentRecord: {
          id: newPayment.id,
          folioRecibo: newPayment.folioRecibo,
          prestamoId: newPayment.prestamoId,
          prestamoFolio: newPayment.prestamoFolio,
          clienteId: newPayment.clienteId,
          clienteNombre: newPayment.clienteNombre,
          numeroCuota: newPayment.numeroCuota,
          montoRecibido: newPayment.montoRecibido,
          penalizacionCobrada: 0,
          fechaPago: newPayment.fechaPago.toISOString().split('T')[0],
          metodoPago: newPayment.metodoPago as PaymentRecord['metodoPago'],
          cobradorNombre: newPayment.cobradorNombre,
          esAbonoParcial: newPayment.esAbonoParcial,
          nota: newPayment.nota || undefined,
          estatus: 'Pendiente',
          esExtemporaneo: true,
          fechaCobroReal: params.fechaCobroReal,
          motivoExtemporaneo: params.motivoExtemporaneo,
        } as PaymentRecord,
      };
    }

    // 2. Registro de Pago Regular / Inmediato
    const newPayment = await db.paymentRecord.create({
      data: {
        folioRecibo,
        prestamoId: loan.id,
        prestamoFolio: loan.folio,
        clienteId: loan.clienteId,
        clienteNombre: loan.clienteNombre,
        numeroCuota: params.numeroCuota,
        montoRecibido: params.montoRecibido,
        penalizacionCobrada: penalizacion,
        metodoPago: params.metodoPago,
        cobradorNombre: params.cobradorNombre,
        esAbonoParcial: esAbonoParcial,
        nota: params.nota || null,
        estatus: 'Aplicado',
      },
    });

    const updatedTabla = tabla.map((cuota) => {
      if (cuota.numeroCuota === params.numeroCuota) {
        return {
          ...cuota,
          estado: nuevoEstadoCuota,
          montoPagado: nuevoMontoPagado,
          saldoPendiente: nuevoSaldoCuota,
          fechaPago: new Date().toISOString(),
          fechaPagoReal: new Date().toISOString().split('T')[0],
          penalizacionesMora: (cuota.penalizacionesMora || 0) + penalizacion,
        };
      }
      return cuota;
    });

    const nuevoSaldoLoan = Math.max(0, Math.round((loan.saldoPendiente - cuotaAmortizada) * 100) / 100);
    const todosPagados = updatedTabla.every((c) => c.estado === 'Pagado');
    const hayMoraRestante = updatedTabla.some((c) => c.estado === 'Mora' || c.estado === 'Vencido');
    const nuevoEstatus = todosPagados
      ? 'Pagado'
      : (!hayMoraRestante && loan.estatus === 'En Mora' ? 'Activo' : loan.estatus);

    await db.loan.update({
      where: { id: loan.id },
      data: {
        saldoPendiente: nuevoSaldoLoan,
        estatus: nuevoEstatus,
        tablaAmortizacion: updatedTabla as unknown as object,
      },
    });

    const mensajeExito = esAbonoParcial
      ? `Abono parcial registrado exitosamente (${folioRecibo}). Saldo remanente de la cuota: $${nuevoSaldoCuota.toFixed(2)}.`
      : `Pago registrado exitosamente con recibo ${folioRecibo}. Cuota #${params.numeroCuota} liquidada.`;

    return {
      success: true,
      message: mensajeExito,
      paymentRecord: {
        id: newPayment.id,
        folioRecibo: newPayment.folioRecibo,
        prestamoId: newPayment.prestamoId,
        prestamoFolio: newPayment.prestamoFolio,
        clienteId: newPayment.clienteId,
        clienteNombre: newPayment.clienteNombre,
        numeroCuota: newPayment.numeroCuota,
        montoRecibido: newPayment.montoRecibido,
        penalizacionCobrada: newPayment.penalizacionCobrada,
        fechaPago: newPayment.fechaPago.toISOString().split('T')[0],
        metodoPago: newPayment.metodoPago as PaymentRecord['metodoPago'],
        cobradorNombre: newPayment.cobradorNombre,
        esAbonoParcial: newPayment.esAbonoParcial,
        nota: newPayment.nota || undefined,
        estatus: 'Aplicado',
      } as PaymentRecord,
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error al registrar el pago.';
    console.error('Error registering payment:', error);
    return { success: false, message };
  }
}

export async function registerFailedVisitAction(params: {
  prestamoId: string;
  numeroCuota: number;
  motivoCausa: string;
  detalles: string;
  promotorNombre: string;
}) {
  try {
    const loan = await db.loan.findUnique({
      where: { id: params.prestamoId },
    });

    if (!loan) {
      return { success: false, message: 'Préstamo no encontrado.' };
    }

    const count = await db.paymentRecord.count();
    const folioRecibo = `VF-2026-${String(count + 1).padStart(3, '0')}`;
    const tabla: AmortizationInstallment[] = Array.isArray(loan.tablaAmortizacion)
      ? (loan.tablaAmortizacion as unknown as AmortizationInstallment[])
      : [];

    const targetCuota = tabla.find((c) => c.numeroCuota === params.numeroCuota);
    if (!targetCuota) {
      return { success: false, message: 'Cuota no encontrada en el préstamo.' };
    }

    const motivoCompleto = `[${params.motivoCausa}] ${params.detalles.trim()}`;

    const newRecord = await db.paymentRecord.create({
      data: {
        folioRecibo,
        prestamoId: loan.id,
        prestamoFolio: loan.folio,
        clienteId: loan.clienteId,
        clienteNombre: loan.clienteNombre,
        numeroCuota: params.numeroCuota,
        montoRecibido: 0,
        penalizacionCobrada: 0,
        metodoPago: 'Efectivo',
        cobradorNombre: params.promotorNombre,
        esAbonoParcial: false,
        nota: motivoCompleto,
        estatus: 'Pendiente',
        esExtemporaneo: false,
        esVisitaFallida: true,
        motivoVisitaFallida: motivoCompleto,
      },
    });

    // Congelar la cuota colocándola en 'En Revisión' mientras el Administrador dictamina
    const updatedTabla = tabla.map((cuota) => {
      if (cuota.numeroCuota === params.numeroCuota) {
        return {
          ...cuota,
          estado: 'En Revisión' as EstadoCuota,
        };
      }
      return cuota;
    });

    await db.loan.update({
      where: { id: loan.id },
      data: {
        tablaAmortizacion: updatedTabla as unknown as object,
      },
    });

    return {
      success: true,
      message: `Reporte de visita no exitosa registrado (${folioRecibo}). Queda en revisión para autorización de exención de mora.`,
      paymentRecord: {
        id: newRecord.id,
        folioRecibo: newRecord.folioRecibo,
        prestamoId: newRecord.prestamoId,
        prestamoFolio: newRecord.prestamoFolio,
        clienteId: newRecord.clienteId,
        clienteNombre: newRecord.clienteNombre,
        numeroCuota: newRecord.numeroCuota,
        montoRecibido: 0,
        penalizacionCobrada: 0,
        fechaPago: newRecord.fechaPago.toISOString().split('T')[0],
        metodoPago: 'Efectivo',
        cobradorNombre: newRecord.cobradorNombre,
        esAbonoParcial: false,
        estatus: 'Pendiente',
        esVisitaFallida: true,
        motivoVisitaFallida: motivoCompleto,
      } as PaymentRecord,
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error al registrar visita fallida.';
    console.error('Error in registerFailedVisitAction:', error);
    return { success: false, message };
  }
}

export async function authorizePaymentAction(params: {
  paymentId: string;
  decision: 'APROBAR' | 'RECHAZAR';
  adminNombre: string;
  motivoRechazo?: string;
}) {
  try {
    const payment = await db.paymentRecord.findUnique({
      where: { id: params.paymentId },
    });

    if (!payment) {
      return { success: false, message: 'Registro de pago no encontrado.' };
    }

    if (payment.estatus !== 'Pendiente') {
      return { success: false, message: `Este registro ya fue dictaminado previamente como ${payment.estatus}.` };
    }

    const loan = await db.loan.findUnique({
      where: { id: payment.prestamoId },
    });

    if (!loan) {
      return { success: false, message: 'Préstamo asociado no encontrado.' };
    }

    const tabla: AmortizationInstallment[] = Array.isArray(loan.tablaAmortizacion)
      ? (loan.tablaAmortizacion as unknown as AmortizationInstallment[])
      : [];

    if (params.decision === 'APROBAR') {
      await db.paymentRecord.update({
        where: { id: payment.id },
        data: {
          estatus: 'Aplicado',
          autorizadoPorNombre: params.adminNombre,
          fechaAutorizacion: new Date(),
          penalizacionCobrada: 0,
        },
      });

      const fechaRealStr = payment.fechaCobroReal
        ? payment.fechaCobroReal.toISOString().split('T')[0]
        : payment.fechaPago.toISOString().split('T')[0];

      let montoCuotaAplicado = 0;
      const updatedTabla = tabla.map((cuota) => {
        if (cuota.numeroCuota === payment.numeroCuota) {
          if (payment.esVisitaFallida) {
            // Exención de mora por causa de fuerza mayor: cuota retorna a Pendiente o Parcial sin mora
            const yaTeniaAbono = cuota.montoPagado && cuota.montoPagado > 0;
            return {
              ...cuota,
              estado: (yaTeniaAbono ? 'Parcial' : 'Pendiente') as EstadoCuota,
              penalizacionesMora: 0,
              recargoPenalizacion: 0,
            };
          }

          const montoPagadoPrevio = Math.round((cuota.montoPagado || 0) * 100) / 100;
          const remanente = Math.max(0, Math.round((cuota.cuotaTotal - montoPagadoPrevio) * 100) / 100);
          const cuotaAmortizada = Math.min(remanente, Math.max(0, Math.round((payment.montoRecibido - (payment.penalizacionCobrada || 0)) * 100) / 100));
          montoCuotaAplicado = cuotaAmortizada;

          const nuevoMontoPagado = Math.min(cuota.cuotaTotal, Math.round((montoPagadoPrevio + cuotaAmortizada) * 100) / 100);
          const nuevoSaldoCuota = Math.max(0, Math.round((cuota.cuotaTotal - nuevoMontoPagado) * 100) / 100);
          const estaLiquidada = nuevoSaldoCuota === 0;

          return {
            ...cuota,
            estado: (estaLiquidada ? 'Pagado' : 'Parcial') as EstadoCuota,
            montoPagado: nuevoMontoPagado,
            saldoPendiente: nuevoSaldoCuota,
            fechaPago: payment.fechaPago.toISOString(),
            fechaPagoReal: fechaRealStr,
            penalizacionesMora: 0,
            recargoPenalizacion: 0,
          };
        }
        return cuota;
      });

      const nuevoSaldo = Math.max(0, Math.round((loan.saldoPendiente - montoCuotaAplicado) * 100) / 100);
      const todosPagados = updatedTabla.every((c) => c.estado === 'Pagado');
      const hayMoraRestante = updatedTabla.some((c) => c.estado === 'Mora' || c.estado === 'Vencido');
      const nuevoEstatus = todosPagados
        ? 'Pagado'
        : (!hayMoraRestante && loan.estatus === 'En Mora' ? 'Activo' : loan.estatus);

      await db.loan.update({
        where: { id: loan.id },
        data: {
          saldoPendiente: nuevoSaldo,
          estatus: nuevoEstatus,
          tablaAmortizacion: updatedTabla as unknown as object,
        },
      });

      const mensaje = payment.esVisitaFallida
        ? `Exención de mora ${payment.folioRecibo} aprobada exitosamente por causa de fuerza mayor.`
        : `Pago extemporáneo ${payment.folioRecibo} aprobado exitosamente. La cuota quedó registrada en fecha real sin mora.`;

      return {
        success: true,
        message: mensaje,
      };
    } else {
      await db.paymentRecord.update({
        where: { id: payment.id },
        data: {
          estatus: 'Rechazado',
          autorizadoPorNombre: params.adminNombre,
          fechaAutorizacion: new Date(),
          motivoRechazo: params.motivoRechazo || 'Rechazado por administración.',
        },
      });

      const updatedTabla = tabla.map((cuota) => {
        if (cuota.numeroCuota === payment.numeroCuota) {
          // Si se rechaza la justificación de fuerza mayor, pasa a Mora
          return {
            ...cuota,
            estado: 'Mora' as EstadoCuota,
          };
        }
        return cuota;
      });

      await db.loan.update({
        where: { id: loan.id },
        data: {
          estatus: 'En Mora',
          tablaAmortizacion: updatedTabla as unknown as object,
        },
      });

      const mensaje = payment.esVisitaFallida
        ? `Exención de mora ${payment.folioRecibo} rechazada. La cuota pasa a estado de mora con su penalización contractual.`
        : `Pago extemporáneo ${payment.folioRecibo} rechazado. La cuota continúa en mora.`;

      return {
        success: true,
        message: mensaje,
      };
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error al procesar el dictamen.';
    console.error('Error in authorizePaymentAction:', error);
    return { success: false, message };
  }
}
