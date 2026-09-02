'use server';

import { unstable_noStore as noStore } from 'next/cache';
import { db } from '@/lib/db';
import { PaymentRecord, EstatusPago } from '@/types';

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
        metodoPago: p.metodoPago as any,
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
      })) as PaymentRecord[],
    };
  } catch (error: any) {
    console.error('Error fetching payments:', error);
    return { success: false, message: error.message || 'Error al obtener pagos.', payments: [] };
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
        metodoPago: p.metodoPago as any,
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
      })) as PaymentRecord[],
    };
  } catch (error: any) {
    console.error('Error fetching pending payments:', error);
    return { success: false, message: error.message || 'Error al obtener pagos pendientes.', payments: [] };
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
    const tabla: any[] = Array.isArray(loan.tablaAmortizacion) ? (loan.tablaAmortizacion as any[]) : [];

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
            estado: 'En Revisión',
            fechaPagoReal: params.fechaCobroReal,
          };
        }
        return cuota;
      });

      await db.loan.update({
        where: { id: loan.id },
        data: {
          tablaAmortizacion: updatedTabla,
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
          metodoPago: newPayment.metodoPago as any,
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
        penalizacionCobrada: params.penalizacionCobrada,
        metodoPago: params.metodoPago,
        cobradorNombre: params.cobradorNombre,
        nota: params.nota || null,
        estatus: 'Aplicado',
      },
    });

    const updatedTabla = tabla.map((cuota) => {
      if (cuota.numeroCuota === params.numeroCuota) {
        return {
          ...cuota,
          estado: 'Pagado',
          montoPagado: params.montoRecibido,
          fechaPago: new Date().toISOString(),
          fechaPagoReal: new Date().toISOString().split('T')[0],
          penalizacionesMora: params.penalizacionCobrada,
        };
      }
      return cuota;
    });

    // Descontar la cuota regular del saldo pendiente del préstamo (sin contar recargos de mora)
    const cuotaAmortizada = Math.max(0, params.montoRecibido - params.penalizacionCobrada);
    const nuevoSaldo = Math.max(0, loan.saldoPendiente - cuotaAmortizada);
    const todosPagados = updatedTabla.every((c) => c.estado === 'Pagado');
    const nuevoEstatus = todosPagados ? 'Pagado' : loan.estatus;

    await db.loan.update({
      where: { id: loan.id },
      data: {
        saldoPendiente: nuevoSaldo,
        estatus: nuevoEstatus,
        tablaAmortizacion: updatedTabla,
      },
    });

    return {
      success: true,
      message: `Pago registrado exitosamente con recibo ${folioRecibo}.`,
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
        metodoPago: newPayment.metodoPago as any,
        cobradorNombre: newPayment.cobradorNombre,
        esAbonoParcial: newPayment.esAbonoParcial,
        nota: newPayment.nota || undefined,
        estatus: 'Aplicado',
      } as PaymentRecord,
    };
  } catch (error: any) {
    console.error('Error registering payment:', error);
    return { success: false, message: error.message || 'Error al registrar el pago.' };
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
      return { success: false, message: `Este pago ya fue dictaminado previamente como ${payment.estatus}.` };
    }

    const loan = await db.loan.findUnique({
      where: { id: payment.prestamoId },
    });

    if (!loan) {
      return { success: false, message: 'Préstamo asociado no encontrado.' };
    }

    const tabla: any[] = Array.isArray(loan.tablaAmortizacion) ? (loan.tablaAmortizacion as any[]) : [];

    if (params.decision === 'APROBAR') {
      // 1. Aprobar pago y marcar como Aplicado
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

      let montoCuotaAplicado = payment.montoRecibido;
      const updatedTabla = tabla.map((cuota) => {
        if (cuota.numeroCuota === payment.numeroCuota) {
          montoCuotaAplicado = cuota.cuotaTotal || payment.montoRecibido;
          return {
            ...cuota,
            estado: 'Pagado',
            montoPagado: payment.montoRecibido,
            fechaPago: payment.fechaPago.toISOString(),
            fechaPagoReal: fechaRealStr,
            penalizacionesMora: 0,
            recargoPenalizacion: 0,
          };
        }
        return cuota;
      });

      const nuevoSaldo = Math.max(0, loan.saldoPendiente - montoCuotaAplicado);
      const todosPagados = updatedTabla.every((c) => c.estado === 'Pagado');
      const nuevoEstatus = todosPagados ? 'Pagado' : loan.estatus;

      await db.loan.update({
        where: { id: loan.id },
        data: {
          saldoPendiente: nuevoSaldo,
          estatus: nuevoEstatus,
          tablaAmortizacion: updatedTabla,
        },
      });

      return {
        success: true,
        message: `Pago extemporáneo ${payment.folioRecibo} aprobado exitosamente. La cuota quedó registrada en fecha real sin mora.`,
      };
    } else {
      // 2. Rechazar pago
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
          return {
            ...cuota,
            estado: 'Mora',
          };
        }
        return cuota;
      });

      await db.loan.update({
        where: { id: loan.id },
        data: {
          tablaAmortizacion: updatedTabla,
        },
      });

      return {
        success: true,
        message: `Pago extemporáneo ${payment.folioRecibo} rechazado. La cuota continúa en mora.`,
      };
    }
  } catch (error: any) {
    console.error('Error in authorizePaymentAction:', error);
    return { success: false, message: error.message || 'Error al procesar el dictamen.' };
  }
}
