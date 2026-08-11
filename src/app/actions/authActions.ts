'use server';

import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function loginAction(emailInput: string, passwordInput: string) {
  try {
    const user = await db.user.findUnique({
      where: { email: emailInput.trim().toLowerCase() },
    });

    if (!user) {
      return { success: false, message: 'El correo electrónico ingresado no está registrado en el sistema.' };
    }

    // Validación estricta de estatus del colaborador
    if (user.estatus !== 'Activo') {
      return {
        success: false,
        message: 'Acceso Denegado: Tu cuenta de colaborador se encuentra inactiva. Comunícate con la administración para reactivar tu acceso.',
      };
    }

    const isValidPassword = await bcrypt.compare(passwordInput, user.password);
    if (!isValidPassword) {
      return { success: false, message: 'La contraseña ingresada es incorrecta.' };
    }

    // Retornar datos seguros del usuario sin la contraseña
    return {
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        telefono: user.telefono || undefined,
        estatus: user.estatus as 'Activo' | 'Inactivo',
        fechaAlta: user.fechaAlta.toISOString().split('T')[0],
        avatar: user.avatar || undefined,
      },
    };
  } catch (error: any) {
    console.error('Error en loginAction:', error);
    return { success: false, message: 'No se pudo verificar el acceso en este momento. Inténtalo más tarde.' };
  }
}
