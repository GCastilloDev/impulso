'use server';

import { db } from '@/lib/db';
import { Loan, EstatusPrestamo, FrecuenciaPago } from '@/types';

export async function getLoansAction() {
  try {
    const loans = await db.loan.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return {
      success: true,
      loans: loans.map((l) => ({
        id: l.id,
        folio: l.folio,
        clienteId: l.clienteId,
        clienteNombre: l.clienteNombre,
        clienteTelefono: l.clienteTelefono || undefined,
        productoId: l.productoId,
        productoNombre: l.productoNombre,
        montoPrincipal: l.montoPrincipal,
        tasaInteresGlobal: l.tasaInteresGlobal,
        plazoCantidad: l.plazoCantidad,
        frecuenciaPago: l.frecuenciaPago as FrecuenciaPago,
        fechaInicio: l.fechaInicio,
        cuotaRegular: l.cuotaRegular,
        totalAPagar: l.totalAPagar,
        saldoPendiente: l.saldoPendiente,
        estatus: l.estatus as EstatusPrestamo,
        promotorAsignado: l.promotorAsignado,
        motivoRechazo: l.motivoRechazo || undefined,
        creadoPorRol: l.creadoPorRol || undefined,
        tablaAmortizacion: l.tablaAmortizacion as any,
      })) as Loan[],
    };
  } catch (error: any) {
    console.error('Error fetching loans:', error);
    return { success: false, message: error.message || 'Error al obtener los préstamos.', loans: [] };
  }
}

export async function createLoanAction(data: {
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
  creadoPorRol?: string;
  tablaAmortizacion: any;
}) {
  try {
    const count = await db.loan.count();
    const folioNumber = String(count + 1).padStart(3, '0');
    const folio = `PRES-2026-${folioNumber}`;

    const newLoan = await db.loan.create({
      data: {
        folio,
        clienteId: data.clienteId,
        clienteNombre: data.clienteNombre,
        clienteTelefono: data.clienteTelefono || null,
        productoId: data.productoId,
        productoNombre: data.productoNombre,
        montoPrincipal: data.montoPrincipal,
        tasaInteresGlobal: data.tasaInteresGlobal,
        plazoCantidad: data.plazoCantidad,
        frecuenciaPago: data.frecuenciaPago,
        fechaInicio: data.fechaInicio,
        cuotaRegular: data.cuotaRegular,
        totalAPagar: data.totalAPagar,
        saldoPendiente: data.saldoPendiente,
        estatus: data.estatus,
        promotorAsignado: data.promotorAsignado,
        creadoPorRol: data.creadoPorRol || null,
        tablaAmortizacion: data.tablaAmortizacion,
      },
    });

    return {
      success: true,
      message: data.estatus === 'En Evaluación'
        ? 'Solicitud ingresada correctamente. Queda en evaluación para revisión del Administrador.'
        : 'Crédito otorgado y activado correctamente.',
      loan: {
        id: newLoan.id,
        folio: newLoan.folio,
        clienteId: newLoan.clienteId,
        clienteNombre: newLoan.clienteNombre,
        clienteTelefono: newLoan.clienteTelefono || undefined,
        productoId: newLoan.productoId,
        productoNombre: newLoan.productoNombre,
        montoPrincipal: newLoan.montoPrincipal,
        tasaInteresGlobal: newLoan.tasaInteresGlobal,
        plazoCantidad: newLoan.plazoCantidad,
        frecuenciaPago: newLoan.frecuenciaPago as FrecuenciaPago,
        fechaInicio: newLoan.fechaInicio,
        cuotaRegular: newLoan.cuotaRegular,
        totalAPagar: newLoan.totalAPagar,
        saldoPendiente: newLoan.saldoPendiente,
        estatus: newLoan.estatus as EstatusPrestamo,
        promotorAsignado: newLoan.promotorAsignado,
        motivoRechazo: newLoan.motivoRechazo || undefined,
        creadoPorRol: newLoan.creadoPorRol || undefined,
        tablaAmortizacion: newLoan.tablaAmortizacion as any,
      } as Loan,
    };
  } catch (error: any) {
    console.error('Error creating loan:', error);
    return { success: false, message: error.message || 'Error al guardar el préstamo.' };
  }
}

export async function approveLoanAction(loanId: string) {
  try {
    const updated = await db.loan.update({
      where: { id: loanId },
      data: {
        estatus: 'Activo',
      },
    });

    return {
      success: true,
      message: 'El crédito ha sido APROBADO y activado correctamente.',
      loan: updated,
    };
  } catch (error: any) {
    console.error('Error approving loan:', error);
    return { success: false, message: error.message || 'Error al aprobar el crédito.' };
  }
}

export async function rejectLoanAction(loanId: string, motivoRechazo: string) {
  try {
    const updated = await db.loan.update({
      where: { id: loanId },
      data: {
        estatus: 'Rechazado',
        motivoRechazo: motivoRechazo.trim(),
      },
    });

    return {
      success: true,
      message: 'El crédito ha sido RECHAZADO.',
      loan: updated,
    };
  } catch (error: any) {
    console.error('Error rejecting loan:', error);
    return { success: false, message: error.message || 'Error al rechazar el crédito.' };
  }
}
