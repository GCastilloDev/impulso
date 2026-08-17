'use server';

import { unstable_noStore as noStore } from 'next/cache';
import { db } from '@/lib/db';
import { Loan, EstatusPrestamo, FrecuenciaPago } from '@/types';

export async function getLoansAction() {
  noStore();
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
        promotorAsignadoTelefono: l.promotorAsignadoTelefono || undefined,
        diaCobro: l.diaCobro || undefined,
        fechaSolicitud: l.fechaSolicitud ? l.fechaSolicitud.toISOString().split('T')[0] : undefined,
        solicitadoPorNombre: l.solicitadoPorNombre || l.promotorAsignado || 'Carlos Mendoza',
        solicitadoPorRol: l.solicitadoPorRol || l.creadoPorRol || 'Promotor de Campo',
        fechaHoraSolicitud: l.fechaHoraSolicitud ? l.fechaHoraSolicitud.toISOString() : l.createdAt.toISOString(),
        aprobadoPorNombre: l.aprobadoPorNombre || (l.estatus === 'Activo' ? 'Carlos Mendoza' : undefined),
        fechaHoraAprobacion: l.fechaHoraAprobacion ? l.fechaHoraAprobacion.toISOString() : (l.estatus === 'Activo' ? l.createdAt.toISOString() : undefined),
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
  promotorAsignadoTelefono?: string;
  diaCobro?: string;
  fechaSolicitud?: string | null;
  solicitadoPorNombre?: string;
  solicitadoPorRol?: string;
  fechaHoraSolicitud?: string;
  creadoPorRol?: string;
  tablaAmortizacion: any;
}) {
  try {
    const count = await db.loan.count();
    const folioNumber = String(count + 1).padStart(3, '0');
    const folio = `PRES-2026-${folioNumber}`;

    const reqDate = data.fechaHoraSolicitud ? new Date(data.fechaHoraSolicitud) : new Date();

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
        promotorAsignadoTelefono: data.promotorAsignadoTelefono || null,
        diaCobro: data.diaCobro || null,
        fechaSolicitud: data.fechaSolicitud && data.fechaSolicitud.trim() ? new Date(data.fechaSolicitud.includes('T') ? data.fechaSolicitud : `${data.fechaSolicitud}T12:00:00`) : null,
        solicitadoPorNombre: data.solicitadoPorNombre || null,
        solicitadoPorRol: data.solicitadoPorRol || data.creadoPorRol || null,
        fechaHoraSolicitud: reqDate,
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
        promotorAsignadoTelefono: newLoan.promotorAsignadoTelefono || undefined,
        diaCobro: newLoan.diaCobro || undefined,
        fechaSolicitud: newLoan.fechaSolicitud ? newLoan.fechaSolicitud.toISOString().split('T')[0] : undefined,
        solicitadoPorNombre: newLoan.solicitadoPorNombre || undefined,
        solicitadoPorRol: newLoan.solicitadoPorRol || undefined,
        fechaHoraSolicitud: newLoan.fechaHoraSolicitud ? newLoan.fechaHoraSolicitud.toISOString() : undefined,
        aprobadoPorNombre: newLoan.aprobadoPorNombre || undefined,
        fechaHoraAprobacion: newLoan.fechaHoraAprobacion ? newLoan.fechaHoraAprobacion.toISOString() : undefined,
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

export async function approveLoanAction(loanId: string, aprobadoPorNombre?: string) {
  try {
    const updated = await db.loan.update({
      where: { id: loanId },
      data: {
        estatus: 'Activo',
        aprobadoPorNombre: aprobadoPorNombre ? aprobadoPorNombre.trim() : null,
        fechaHoraAprobacion: new Date(),
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

export async function rejectLoanAction(loanId: string, motivoRechazo: string, aprobadoPorNombre?: string) {
  try {
    const updated = await db.loan.update({
      where: { id: loanId },
      data: {
        estatus: 'Rechazado',
        motivoRechazo: motivoRechazo.trim(),
        aprobadoPorNombre: aprobadoPorNombre ? aprobadoPorNombre.trim() : null,
        fechaHoraAprobacion: new Date(),
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

export async function reassignPromoterAction(data: {
  loanId: string;
  nuevoPromotorNombre: string;
  nuevoPromotorTelefono?: string;
  nuevoDiaCobro?: string;
  requesterRole?: string;
}) {
  try {
    if (data.requesterRole && data.requesterRole !== 'Administrador') {
      return {
        success: false,
        message: 'Acceso Denegado: Solo los administradores pueden reasignar el promotor de un crédito.',
      };
    }

    const updated = await db.loan.update({
      where: { id: data.loanId },
      data: {
        promotorAsignado: data.nuevoPromotorNombre.trim(),
        promotorAsignadoTelefono: data.nuevoPromotorTelefono?.trim() || null,
        diaCobro: data.nuevoDiaCobro?.trim() || null,
      },
    });

    return {
      success: true,
      message: `Promotor reasignado exitosamente a ${data.nuevoPromotorNombre}.`,
      loan: updated,
    };
  } catch (error: any) {
    console.error('Error reassigning promoter:', error);
    return { success: false, message: error.message || 'Error al reasignar el promotor.' };
  }
}
