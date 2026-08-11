'use server';

import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { UserRole, StructuredAddress, Reference } from '@/types';

export async function getUsersAction(params?: {
  search?: string;
  role?: string;
  requesterRole?: UserRole;
}) {
  try {
    // Validación estricta de autorización backend
    if (params?.requesterRole && params.requesterRole !== 'Administrador') {
      return {
        success: false,
        users: [],
        message: 'Acceso Denegado: Esta función requiere permisos de Administrador.',
      };
    }

    const whereClause: any = {};

    if (params?.role && params.role !== 'todos') {
      whereClause.role = params.role;
    }

    if (params?.search && params.search.trim()) {
      const q = params.search.trim();
      whereClause.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
        { telefono: { contains: q, mode: 'insensitive' } },
        { curp: { contains: q, mode: 'insensitive' } },
        { folioIne: { contains: q, mode: 'insensitive' } },
      ];
    }

    const users = await db.user.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
    });

    return {
      success: true,
      users: users.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role as UserRole,
        telefono: u.telefono || undefined,
        estatus: u.estatus as 'Activo' | 'Inactivo',
        fechaAlta: u.fechaAlta.toISOString().split('T')[0],
        avatar: u.avatar || undefined,
        curp: u.curp || undefined,
        fechaNacimiento: u.fechaNacimiento || undefined,
        folioIne: u.folioIne || undefined,
        direccionEstructurada: (u.direccionEstructurada as unknown as StructuredAddress) || undefined,
        referencia1: (u.referencia1 as unknown as Reference) || undefined,
        referencia2: (u.referencia2 as unknown as Reference) || undefined,
      })),
    };
  } catch (error: any) {
    console.error('Error en getUsersAction:', error);
    return { success: false, users: [], message: 'No se pudo obtener la lista de colaboradores.' };
  }
}

export async function createUserAction(data: {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  telefono?: string;
  avatar?: string;
  curp?: string;
  fechaNacimiento?: string;
  folioIne?: string;
  direccionEstructurada?: StructuredAddress;
  referencia1?: Reference;
  referencia2?: Reference;
  requesterRole?: UserRole;
}) {
  try {
    // Validación estricta de autorización backend
    if (data.requesterRole && data.requesterRole !== 'Administrador') {
      return {
        success: false,
        message: 'Acceso Denegado: Solo los administradores pueden dar de alta a nuevos colaboradores.',
      };
    }

    const existing = await db.user.findUnique({
      where: { email: data.email.trim().toLowerCase() },
    });

    if (existing) {
      return { success: false, message: 'El correo electrónico ya se encuentra registrado' };
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const newUser = await db.user.create({
      data: {
        name: data.name.trim(),
        email: data.email.trim().toLowerCase(),
        password: hashedPassword,
        role: data.role,
        telefono: data.telefono?.trim() || null,
        avatar: data.avatar?.trim() || null,
        estatus: 'Activo',
        curp: data.curp?.trim() || null,
        fechaNacimiento: data.fechaNacimiento || null,
        folioIne: data.folioIne?.trim() || null,
        direccionEstructurada: data.direccionEstructurada ? (data.direccionEstructurada as any) : null,
        referencia1: data.referencia1 ? (data.referencia1 as any) : null,
        referencia2: data.referencia2 ? (data.referencia2 as any) : null,
      },
    });

    return {
      success: true,
      message: 'Colaborador registrado exitosamente',
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role as UserRole,
        telefono: newUser.telefono || undefined,
        estatus: newUser.estatus as 'Activo' | 'Inactivo',
        fechaAlta: newUser.fechaAlta.toISOString().split('T')[0],
        avatar: newUser.avatar || undefined,
        curp: newUser.curp || undefined,
        fechaNacimiento: newUser.fechaNacimiento || undefined,
        folioIne: newUser.folioIne || undefined,
        direccionEstructurada: (newUser.direccionEstructurada as unknown as StructuredAddress) || undefined,
        referencia1: (newUser.referencia1 as unknown as Reference) || undefined,
        referencia2: (newUser.referencia2 as unknown as Reference) || undefined,
      },
    };
  } catch (error: any) {
    console.error('Error en createUserAction:', error);
    return { success: false, message: 'No se pudo guardar el colaborador. Inténtalo de nuevo.' };
  }
}

export async function updateUserAction(data: {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  telefono?: string;
  avatar?: string;
  newPassword?: string;
  curp?: string;
  fechaNacimiento?: string;
  folioIne?: string;
  direccionEstructurada?: StructuredAddress;
  referencia1?: Reference;
  referencia2?: Reference;
  requesterRole?: UserRole;
}) {
  try {
    // Validación estricta de autorización backend
    if (data.requesterRole && data.requesterRole !== 'Administrador') {
      return {
        success: false,
        message: 'Acceso Denegado: Solo los administradores pueden editar colaboradores.',
      };
    }

    const existingUser = await db.user.findUnique({ where: { id: data.id } });
    if (!existingUser) {
      return { success: false, message: 'Colaborador no encontrado' };
    }

    // Verificar si el correo cambió y pertenece a otro usuario
    if (data.email.trim().toLowerCase() !== existingUser.email.toLowerCase()) {
      const emailConflict = await db.user.findUnique({
        where: { email: data.email.trim().toLowerCase() },
      });
      if (emailConflict) {
        return { success: false, message: 'El correo electrónico ingresado ya pertenece a otro colaborador' };
      }
    }

    const updateData: any = {
      name: data.name.trim(),
      email: data.email.trim().toLowerCase(),
      role: data.role,
      telefono: data.telefono?.trim() || null,
      avatar: data.avatar?.trim() || null,
      curp: data.curp?.trim() || null,
      fechaNacimiento: data.fechaNacimiento || null,
      folioIne: data.folioIne?.trim() || null,
      direccionEstructurada: data.direccionEstructurada ? (data.direccionEstructurada as any) : null,
      referencia1: data.referencia1 ? (data.referencia1 as any) : null,
      referencia2: data.referencia2 ? (data.referencia2 as any) : null,
    };

    if (data.newPassword && data.newPassword.trim().length > 0) {
      updateData.password = await bcrypt.hash(data.newPassword.trim(), 10);
    }

    const updatedUser = await db.user.update({
      where: { id: data.id },
      data: updateData,
    });

    return {
      success: true,
      message: 'Datos del colaborador actualizados exitosamente',
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role as UserRole,
        telefono: updatedUser.telefono || undefined,
        estatus: updatedUser.estatus as 'Activo' | 'Inactivo',
        fechaAlta: updatedUser.fechaAlta.toISOString().split('T')[0],
        avatar: updatedUser.avatar || undefined,
        curp: updatedUser.curp || undefined,
        fechaNacimiento: updatedUser.fechaNacimiento || undefined,
        folioIne: updatedUser.folioIne || undefined,
        direccionEstructurada: (updatedUser.direccionEstructurada as unknown as StructuredAddress) || undefined,
        referencia1: (updatedUser.referencia1 as unknown as Reference) || undefined,
        referencia2: (updatedUser.referencia2 as unknown as Reference) || undefined,
      },
    };
  } catch (error: any) {
    console.error('Error en updateUserAction:', error);
    return { success: false, message: 'No se pudieron actualizar los datos del colaborador.' };
  }
}

export async function toggleUserStatusAction(userId: string, requesterRole?: UserRole) {
  try {
    // Validación estricta de autorización backend
    if (requesterRole && requesterRole !== 'Administrador') {
      return {
        success: false,
        message: 'Acceso Denegado: Solo los administradores pueden cambiar el estatus de un colaborador.',
      };
    }

    const existingUser = await db.user.findUnique({ where: { id: userId } });
    if (!existingUser) return { success: false, message: 'Colaborador no encontrado' };

    const newStatus = existingUser.estatus === 'Activo' ? 'Inactivo' : 'Activo';

    const updatedUser = await db.user.update({
      where: { id: userId },
      data: { estatus: newStatus },
    });

    return {
      success: true,
      newStatus: updatedUser.estatus,
      message: `Estatus actualizado a ${updatedUser.estatus} correctamente`,
    };
  } catch (error: any) {
    console.error('Error en toggleUserStatusAction:', error);
    return { success: false, message: 'No se pudo actualizar el estatus del colaborador' };
  }
}
