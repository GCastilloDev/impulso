'use server';

import { db } from '@/lib/db';
import { FinancialProduct } from '@/types';

export async function getProductsAction() {
  try {
    const products = await db.financialProduct.findMany({
      where: { eliminado: false },
      orderBy: { createdAt: 'asc' },
    });

    return {
      success: true,
      products: products.map((p) => ({
        id: p.id,
        nombre: p.nombre,
        descripcion: p.descripcion,
        frecuenciaPago: p.frecuenciaPago as any,
        plazo: p.plazo,
        tasaInteresGlobal: p.tasaInteresGlobal,
        tipoPenalizacionMora: p.tipoPenalizacionMora as any,
        valorPenalizacionMora: p.valorPenalizacionMora,
        activo: p.activo,
        eliminado: p.eliminado,
      })) as FinancialProduct[],
    };
  } catch (error: any) {
    console.error('Error fetching products:', error);
    return { success: false, message: error.message || 'Error al obtener los productos.', products: [] };
  }
}

export async function createProductAction(data: Omit<FinancialProduct, 'id'>) {
  try {
    const newProduct = await db.financialProduct.create({
      data: {
        nombre: data.nombre,
        descripcion: data.descripcion || '',
        frecuenciaPago: data.frecuenciaPago,
        plazo: Number(data.plazo),
        tasaInteresGlobal: Number(data.tasaInteresGlobal),
        tipoPenalizacionMora: data.tipoPenalizacionMora,
        valorPenalizacionMora: Number(data.valorPenalizacionMora || 0),
        activo: data.activo ?? true,
        eliminado: false,
      },
    });

    return {
      success: true,
      product: {
        id: newProduct.id,
        nombre: newProduct.nombre,
        descripcion: newProduct.descripcion,
        frecuenciaPago: newProduct.frecuenciaPago as any,
        plazo: newProduct.plazo,
        tasaInteresGlobal: newProduct.tasaInteresGlobal,
        tipoPenalizacionMora: newProduct.tipoPenalizacionMora as any,
        valorPenalizacionMora: newProduct.valorPenalizacionMora,
        activo: newProduct.activo,
        eliminado: newProduct.eliminado,
      } as FinancialProduct,
    };
  } catch (error: any) {
    console.error('Error creating product:', error);
    return { success: false, message: error.message || 'Error al crear producto.' };
  }
}

export async function updateProductAction(id: string, data: Partial<FinancialProduct>) {
  try {
    const updated = await db.financialProduct.update({
      where: { id },
      data: {
        ...(data.nombre !== undefined && { nombre: data.nombre }),
        ...(data.descripcion !== undefined && { descripcion: data.descripcion }),
        ...(data.frecuenciaPago !== undefined && { frecuenciaPago: data.frecuenciaPago }),
        ...(data.plazo !== undefined && { plazo: Number(data.plazo) }),
        ...(data.tasaInteresGlobal !== undefined && { tasaInteresGlobal: Number(data.tasaInteresGlobal) }),
        ...(data.tipoPenalizacionMora !== undefined && { tipoPenalizacionMora: data.tipoPenalizacionMora }),
        ...(data.valorPenalizacionMora !== undefined && { valorPenalizacionMora: Number(data.valorPenalizacionMora) }),
        ...(data.activo !== undefined && { activo: data.activo }),
        ...(data.eliminado !== undefined && { eliminado: data.eliminado }),
      },
    });

    return {
      success: true,
      product: {
        id: updated.id,
        nombre: updated.nombre,
        descripcion: updated.descripcion,
        frecuenciaPago: updated.frecuenciaPago as any,
        plazo: updated.plazo,
        tasaInteresGlobal: updated.tasaInteresGlobal,
        tipoPenalizacionMora: updated.tipoPenalizacionMora as any,
        valorPenalizacionMora: updated.valorPenalizacionMora,
        activo: updated.activo,
        eliminado: updated.eliminado,
      } as FinancialProduct,
    };
  } catch (error: any) {
    console.error('Error updating product:', error);
    return { success: false, message: error.message || 'Error al actualizar producto.' };
  }
}

export async function deleteProductAction(id: string) {
  try {
    await db.financialProduct.update({
      where: { id },
      data: { activo: false, eliminado: true },
    });
    return { success: true };
  } catch (error: any) {
    console.error('Error deleting product:', error);
    return { success: false, message: error.message || 'Error al eliminar producto.' };
  }
}
