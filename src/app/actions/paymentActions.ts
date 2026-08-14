'use server';

import { db } from '@/lib/db';
import { PaymentRecord } from '@/types';

export async function getPaymentsAction() {
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
        metodoPago: p.metodoPago,
        cobradorNombre: p.cobradorNombre,
        esAbonoParcial: p.esAbonoParcial,
        nota: p.nota || undefined,
      })) as PaymentRecord[],
    };
  } catch (error: any) {
    console.error('Error fetching payments:', error);
    return { success: false, message: error.message || 'Error al obtener pagos.', payments: [] };
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
}) {
  try {
    const loan = await db.loan.findUnique({
      where: { id: params.prestamoId },
    });

    if (!loan) {
      return { success: false, message: 'Préstamo no encontrado' };
    }

    const count = await db.paymentRecord.count();
    const folioRecibo = `REC-2026-${String(count + 1).padStart(3, '0')}`;

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
      },
    });

    // Actualizar tabla de amortización y saldo del préstamo
    const tabla: any[] = Array.isArray(loan.tablaAmortizacion) ? (loan.tablaAmortizacion as any[]) : [];
    const updatedTabla = tabla.map((cuota) => {
      if (cuota.numeroCuota === params.numeroCuota) {
        return { ...cuota, estatus: 'Pagado' };
      }
      return cuota;
    });

    const nuevoSaldo = Math.max(0, loan.saldoPendiente - params.montoRecibido);
    const todosPagados = updatedTabla.every((c) => c.estatus === 'Pagado');
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
        metodoPago: newPayment.metodoPago,
        cobradorNombre: newPayment.cobradorNombre,
        esAbonoParcial: newPayment.esAbonoParcial,
        nota: newPayment.nota || undefined,
      } as PaymentRecord,
    };
  } catch (error: any) {
    console.error('Error registering payment:', error);
    return { success: false, message: error.message || 'Error al registrar el pago.' };
  }
}
