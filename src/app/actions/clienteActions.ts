'use server';

import { db } from '@/lib/db';
import { Client, ScoreCrediticio, StructuredAddress, Reference } from '@/types';

function safeParseJson<T>(value: any): T | undefined {
  if (!value) return undefined;
  if (typeof value === 'object') return value as T;
  if (typeof value === 'string') {
    try {
      return JSON.parse(value) as T;
    } catch {
      return undefined;
    }
  }
  return undefined;
}

export async function getClientsAction(params?: {
  search?: string;
  promotorId?: string;
}) {
  try {
    const whereClause: any = {};

    if (params?.promotorId) {
      whereClause.promotorAsignadoId = params.promotorId;
    }

    if (params?.search && params.search.trim()) {
      const q = params.search.trim();
      whereClause.OR = [
        { nombre: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
        { telefono: { contains: q, mode: 'insensitive' } },
        { curp: { contains: q, mode: 'insensitive' } },
        { folioIne: { contains: q, mode: 'insensitive' } },
        { rfc: { contains: q, mode: 'insensitive' } },
        { folio: { contains: q, mode: 'insensitive' } },
      ];
    }

    const clients = await db.client.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
    });

    return {
      success: true,
      clients: clients.map((c) => ({
        id: c.id,
        folio: c.folio,
        nombre: c.nombre,
        telefono: c.telefono,
        email: c.email || undefined,
        direccion: c.direccion,
        direccionEstructurada: safeParseJson<StructuredAddress>(c.direccionEstructurada),
        curp: c.curp,
        folioIne: c.folioIne || c.rfc || '',
        rfc: c.rfc || undefined,
        scoreCrediticio: c.scoreCrediticio as ScoreCrediticio,
        promotorAsignadoId: c.promotorAsignadoId || undefined,
        promotorAsignadoNombre: c.promotorAsignadoNombre || undefined,
        referencia1: safeParseJson<Reference>(c.referencia1),
        referencia2: safeParseJson<Reference>(c.referencia2),
        estatus: c.estatus as 'Activo' | 'Inactivo',
        fechaRegistro: c.fechaRegistro.toISOString().split('T')[0],
        notas: c.notas || undefined,
      })),
    };
  } catch (error: any) {
    console.error('Error en getClientsAction:', error);
    return { success: false, clients: [], message: 'No se pudo obtener la lista de clientes.' };
  }
}

export async function getClientByIdAction(clientId: string) {
  try {
    const c = await db.client.findUnique({
      where: { id: clientId },
    });
    if (!c) {
      return { success: false, message: 'Cliente no encontrado' };
    }

    return {
      success: true,
      client: {
        id: c.id,
        folio: c.folio,
        nombre: c.nombre,
        telefono: c.telefono,
        email: c.email || undefined,
        direccion: c.direccion,
        direccionEstructurada: safeParseJson<StructuredAddress>(c.direccionEstructurada),
        curp: c.curp,
        folioIne: c.folioIne || c.rfc || '',
        rfc: c.rfc || undefined,
        scoreCrediticio: c.scoreCrediticio as ScoreCrediticio,
        promotorAsignadoId: c.promotorAsignadoId || undefined,
        promotorAsignadoNombre: c.promotorAsignadoNombre || undefined,
        referencia1: safeParseJson<Reference>(c.referencia1),
        referencia2: safeParseJson<Reference>(c.referencia2),
        estatus: c.estatus as 'Activo' | 'Inactivo',
        fechaRegistro: c.fechaRegistro.toISOString().split('T')[0],
        notas: c.notas || undefined,
      },
    };
  } catch (error: any) {
    console.error('Error en getClientByIdAction:', error);
    return { success: false, message: 'Ocurrió un error al buscar el cliente' };
  }
}

export async function createClientAction(data: Omit<Client, 'id' | 'folio' | 'fechaRegistro'>) {
  try {
    // Verificar si CURP o INE ya existen
    const existingClient = await db.client.findFirst({
      where: {
        OR: [
          { curp: data.curp },
          { folioIne: data.folioIne },
        ]
      }
    });

    if (existingClient) {
      return {
        success: false,
        message: existingClient.curp === data.curp
          ? 'Ya existe un cliente registrado con esta CURP.'
          : 'Ya existe un cliente registrado con esta Clave / Folio INE.',
      };
    }

    // Generar Folio consecutivo (Ej. CLI-00101)
    const count = await db.client.count();
    const nextFolioNum = count + 101;
    const folio = `CLI-${nextFolioNum.toString().padStart(5, '0')}`;

    const newClient = await db.client.create({
      data: {
        folio,
        nombre: data.nombre,
        telefono: data.telefono,
        email: data.email || null,
        direccion: data.direccion,
        direccionEstructurada: data.direccionEstructurada ? (data.direccionEstructurada as any) : null,
        curp: data.curp,
        folioIne: data.folioIne,
        rfc: data.rfc || null,
        scoreCrediticio: data.scoreCrediticio,
        promotorAsignadoId: data.promotorAsignadoId || null,
        promotorAsignadoNombre: data.promotorAsignadoNombre || null,
        referencia1: data.referencia1 ? (data.referencia1 as any) : null,
        referencia2: data.referencia2 ? (data.referencia2 as any) : null,
        estatus: 'Activo',
        notas: data.notas || null,
      },
    });

    return {
      success: true,
      message: 'Cliente creado exitosamente.',
      client: {
        id: newClient.id,
        folio: newClient.folio,
        nombre: newClient.nombre,
        telefono: newClient.telefono,
        email: newClient.email || undefined,
        direccion: newClient.direccion,
        direccionEstructurada: safeParseJson<StructuredAddress>(newClient.direccionEstructurada),
        curp: newClient.curp,
        folioIne: newClient.folioIne || '',
        rfc: newClient.rfc || undefined,
        scoreCrediticio: newClient.scoreCrediticio as ScoreCrediticio,
        promotorAsignadoId: newClient.promotorAsignadoId || undefined,
        promotorAsignadoNombre: newClient.promotorAsignadoNombre || undefined,
        referencia1: safeParseJson<Reference>(newClient.referencia1),
        referencia2: safeParseJson<Reference>(newClient.referencia2),
        estatus: newClient.estatus as 'Activo' | 'Inactivo',
        fechaRegistro: newClient.fechaRegistro.toISOString().split('T')[0],
        notas: newClient.notas || undefined,
      },
    };
  } catch (error: any) {
    console.error('Error en createClientAction:', error);
    return { success: false, message: 'Ocurrió un error inesperado al crear el cliente.' };
  }
}

export async function updateClientAction(clientId: string, data: Partial<Client>) {
  try {
    const existingClient = await db.client.findUnique({
      where: { id: clientId },
    });

    if (!existingClient) {
      return {
        success: false,
        message: `No se encontró el cliente en la base de datos (ID: ${clientId}). Revisa si el registro fue eliminado.`,
      };
    }

    // Verificar si la nueva CURP o Folio INE ya pertenecen a otro cliente
    if (data.curp || data.folioIne) {
      const duplicateConditions: any[] = [];
      if (data.curp) duplicateConditions.push({ curp: data.curp });
      if (data.folioIne) duplicateConditions.push({ folioIne: data.folioIne });

      const duplicate = await db.client.findFirst({
        where: {
          id: { not: clientId },
          OR: duplicateConditions,
        },
      });

      if (duplicate) {
        return {
          success: false,
          message: duplicate.curp === data.curp
            ? 'Ya existe otro cliente registrado con esta CURP.'
            : 'Ya existe otro cliente registrado con esta Clave / Folio INE.',
        };
      }
    }

    const updateData: any = { ...data };
    
    if ('email' in data) updateData.email = data.email || null;
    if ('promotorAsignadoId' in data) updateData.promotorAsignadoId = data.promotorAsignadoId || null;
    if ('promotorAsignadoNombre' in data) updateData.promotorAsignadoNombre = data.promotorAsignadoNombre || null;
    if ('direccionEstructurada' in data) updateData.direccionEstructurada = data.direccionEstructurada ? (data.direccionEstructurada as any) : null;
    if ('referencia1' in data) updateData.referencia1 = data.referencia1 ? (data.referencia1 as any) : null;
    if ('referencia2' in data) updateData.referencia2 = data.referencia2 ? (data.referencia2 as any) : null;
    if ('notas' in data) updateData.notas = data.notas || null;

    // Remove immutable fields from being updated
    delete updateData.id;
    delete updateData.folio;
    delete updateData.fechaRegistro;
    delete updateData.createdAt;
    delete updateData.updatedAt;

    const updatedClient = await db.client.update({
      where: { id: clientId },
      data: updateData,
    });

    return {
      success: true,
      message: 'Cliente actualizado correctamente.',
      client: {
        id: updatedClient.id,
        folio: updatedClient.folio,
        nombre: updatedClient.nombre,
        telefono: updatedClient.telefono,
        email: updatedClient.email || undefined,
        direccion: updatedClient.direccion,
        direccionEstructurada: safeParseJson<StructuredAddress>(updatedClient.direccionEstructurada),
        curp: updatedClient.curp,
        folioIne: updatedClient.folioIne || '',
        rfc: updatedClient.rfc || undefined,
        scoreCrediticio: updatedClient.scoreCrediticio as ScoreCrediticio,
        promotorAsignadoId: updatedClient.promotorAsignadoId || undefined,
        promotorAsignadoNombre: updatedClient.promotorAsignadoNombre || undefined,
        referencia1: safeParseJson<Reference>(updatedClient.referencia1),
        referencia2: safeParseJson<Reference>(updatedClient.referencia2),
        estatus: updatedClient.estatus as 'Activo' | 'Inactivo',
        fechaRegistro: updatedClient.fechaRegistro.toISOString().split('T')[0],
        notas: updatedClient.notas || undefined,
      },
    };
  } catch (error: any) {
    console.error('Error en updateClientAction:', error);
    return { success: false, message: error?.message || 'Ocurrió un error al actualizar el cliente.' };
  }
}
