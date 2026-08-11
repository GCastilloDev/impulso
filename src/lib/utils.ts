import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount || 0);
}

export function formatDate(dateString: string): string {
  if (!dateString) return '';
  const date = new Date(dateString.includes('T') ? dateString : `${dateString}T12:00:00`);
  return new Intl.DateTimeFormat('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

export function formatDateWithTime(dateString: string): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function getTodayDateString(): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function addDays(dateString: string, days: number): string {
  const date = new Date(dateString.includes('T') ? dateString : `${dateString}T12:00:00`);
  date.setDate(date.getDate() + days);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function addMonths(dateString: string, months: number): string {
  const date = new Date(dateString.includes('T') ? dateString : `${dateString}T12:00:00`);
  date.setMonth(date.getMonth() + months);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// ----------------------------------------------------
// UTILIDADES Y REGLAS DE VALIDACIÓN DE FORMULARIOS
// ----------------------------------------------------

/**
 * Filtra el texto ingresado permitiendo únicamente dígitos numéricos (0-9).
 * Opcionalmente limita la longitud máxima de caracteres.
 */
export function onlyDigits(val: string, maxLength?: number): string {
  const digitsOnly = val.replace(/\D/g, '');
  if (maxLength && maxLength > 0) {
    return digitsOnly.slice(0, maxLength);
  }
  return digitsOnly;
}

/**
 * Regla de validación de contraseña:
 * - Mínimo 8 caracteres
 * - Al menos una letra mayúscula (A-Z)
 * - Al menos un número (0-9)
 */
export function validatePassword(password: string): { isValid: boolean; message?: string } {
  if (!password || password.length < 8) {
    return { isValid: false, message: 'La contraseña debe tener al menos 8 caracteres.' };
  }
  if (!/[A-Z]/.test(password)) {
    return { isValid: false, message: 'La contraseña debe contener al menos una letra mayúscula (A-Z).' };
  }
  if (!/[0-9]/.test(password)) {
    return { isValid: false, message: 'La contraseña debe contener al menos un número (0-9).' };
  }
  return { isValid: true };
}

/**
 * Validación de Teléfono Móvil (10 dígitos exactos)
 */
export function validatePhone(phone: string, fieldName = 'Teléfono'): { isValid: boolean; message?: string } {
  const digits = phone.replace(/\D/g, '');
  if (digits.length !== 10) {
    return { isValid: false, message: `El campo ${fieldName} debe contener exactamente 10 dígitos numéricos.` };
  }
  return { isValid: true };
}

/**
 * Validación de Código Postal (5 dígitos exactos)
 */
export function validatePostalCode(cp: string, fieldName = 'Código Postal'): { isValid: boolean; message?: string } {
  const digits = cp.replace(/\D/g, '');
  if (digits.length !== 5) {
    return { isValid: false, message: `El ${fieldName} debe tener exactamente 5 dígitos numéricos.` };
  }
  return { isValid: true };
}

/**
 * Validación de Fecha de Nacimiento
 * - Debe tener año de 4 dígitos entre 1920 y el año actual - 18
 */
export function validateBirthdate(dateStr: string): { isValid: boolean; message?: string } {
  if (!dateStr) {
    return { isValid: false, message: 'La Fecha de Nacimiento es requerida.' };
  }
  const parts = dateStr.split('-');
  if (parts.length !== 3 || parts[0].length !== 4) {
    return { isValid: false, message: 'La Fecha de Nacimiento debe tener un año válido de 4 dígitos.' };
  }
  const year = parseInt(parts[0], 10);
  const currentYear = new Date().getFullYear();

  if (year < 1920 || year > currentYear - 18) {
    return { isValid: false, message: `Año de nacimiento inválido (debe ser un año válido de 4 dígitos entre 1920 y ${currentYear - 18}).` };
  }
  return { isValid: true };
}

/**
 * Validación de Correo Electrónico
 */
export function validateEmail(email: string): boolean {
  if (!email || !email.trim()) return false;
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email.trim());
}
