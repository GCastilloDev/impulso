'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Settings, Plus, Percent, Calendar, ShieldAlert, CheckCircle2, XCircle, Edit3, Sparkles, AlertCircle, Trash2, Loader2 } from 'lucide-react';
import { useImpulsoStore } from '@/store/useImpulsoStore';
import { FinancialProduct, FrecuenciaPago, TipoPenalizacionMora } from '@/types';
import { formatCurrency } from '@/lib/utils';
import { ConfirmModal } from '@/components/shared/ConfirmModal';

import { createProductAction, updateProductAction, deleteProductAction } from '@/app/actions/productActions';

export default function ProductsPage() {
  const { products, currentUser, loadDataFromDB } = useImpulsoStore();
  const isAdmin = currentUser.role === 'Administrador';

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<FinancialProduct | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const modalScrollRef = useRef<HTMLDivElement>(null);

  const showErrorMsg = (msg: string) => {
    setErrorMsg(msg);
    if (modalScrollRef.current) {
      modalScrollRef.current.scrollTop = 0;
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isModalOpen) {
        setIsModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen]);

  // Si no es Administrador, bloquear acceso
  if (!isAdmin) {
    return (
      <div className="glass-panel p-8 rounded-2xl border border-slate-800 text-center space-y-4 max-w-xl mx-auto my-12">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-extrabold text-white">Acceso Restringido</h2>
        <p className="text-sm text-slate-400">
          Únicamente los usuarios con rol de <strong>Administrador</strong> tienen autorización para configurar y gestionar los productos financieros.
        </p>
        <Link
          href="/"
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs border border-slate-700 transition-all"
        >
          Regresar al Inicio
        </Link>
      </div>
    );
  }

  const activeVisibleProducts = products.filter((p) => !p.eliminado);

  const handleToggleStatus = async (p: FinancialProduct) => {
    await updateProductAction(p.id, { activo: !p.activo });
    await loadDataFromDB();
  };

  const handleDelete = async () => {
    if (!deletingProduct) return;
    await deleteProductAction(deletingProduct.id);
    setDeletingProduct(null);
    await loadDataFromDB();
  };

  // Form State
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [frecuenciaPago, setFrecuenciaPago] = useState<FrecuenciaPago>('semanal');
  const [plazo, setPlazo] = useState<number | string>('');
  const [tasaInteresGlobal, setTasaInteresGlobal] = useState<number | string>('');
  const [tipoPenalizacionMora, setTipoPenalizacionMora] = useState<TipoPenalizacionMora>('porcentaje');
  const [valorPenalizacionMora, setValorPenalizacionMora] = useState<number | string>('');

  const resetForm = () => {
    setErrorMsg(null);
    setEditingProductId(null);
    setNombre('');
    setDescripcion('');
    setFrecuenciaPago('semanal');
    setPlazo('');
    setTasaInteresGlobal('');
    setTipoPenalizacionMora('porcentaje');
    setValorPenalizacionMora('');
  };

  const openNewModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const openEditModal = (product: FinancialProduct) => {
    setErrorMsg(null);
    setEditingProductId(product.id);
    setNombre(product.nombre);
    setDescripcion(product.descripcion);
    setFrecuenciaPago(product.frecuenciaPago);
    setPlazo(product.plazo);
    setTasaInteresGlobal(product.tasaInteresGlobal);
    setTipoPenalizacionMora(product.tipoPenalizacionMora || 'porcentaje');
    setValorPenalizacionMora(product.valorPenalizacionMora ?? 5);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // --- VALIDACIONES ESTRUCTURADAS (DE ARRIBA HACIA ABAJO SEGÚN EL FORMULARIO) ---
    // 1. Nombre del producto
    if (!nombre.trim() || nombre.trim().length < 3) {
      showErrorMsg('El nombre del producto es obligatorio (mínimo 3 caracteres).');
      return;
    }

    // 2. Plazo (Número de cuotas)
    if (plazo === '' || plazo === undefined || plazo === null) {
      showErrorMsg('El Plazo del producto es obligatorio (ingresa el número de cuotas).');
      return;
    }
    const numPlazo = Number(plazo);
    if (isNaN(numPlazo) || numPlazo <= 0) {
      showErrorMsg('El Plazo del producto debe ser un número entero mayor a 0 cuotas.');
      return;
    }

    // 3. Tasa de Interés Global (%)
    if (tasaInteresGlobal === '' || tasaInteresGlobal === undefined || tasaInteresGlobal === null) {
      showErrorMsg('La Tasa de Interés Global es obligatoria.');
      return;
    }
    const numTasa = Number(tasaInteresGlobal);
    if (isNaN(numTasa) || numTasa <= 0) {
      showErrorMsg('La Tasa de Interés Global debe ser un número mayor a 0%.');
      return;
    }

    // 4. Valor Penalización por Mora
    if (valorPenalizacionMora === '' || valorPenalizacionMora === undefined || valorPenalizacionMora === null) {
      showErrorMsg('El valor de la penalización por mora es obligatorio.');
      return;
    }
    const numPenalizacion = Number(valorPenalizacionMora);
    if (isNaN(numPenalizacion) || numPenalizacion < 0) {
      showErrorMsg('El valor de la penalización por mora no puede ser un número negativo.');
      return;
    }

    const productPayload = {
      nombre: nombre.trim(),
      descripcion: descripcion.trim(),
      frecuenciaPago,
      plazo: Math.round(numPlazo),
      tasaInteresGlobal: numTasa,
      tipoPenalizacionMora,
      valorPenalizacionMora: numPenalizacion,
      activo: true,
      eliminado: false,
    };

    setIsSaving(true);
    try {
      let res;
      if (editingProductId) {
        res = await updateProductAction(editingProductId, productPayload);
      } else {
        res = await createProductAction(productPayload);
      }

      if (!res || !res.success) {
        showErrorMsg(res?.message || 'No se pudo guardar el producto. Inténtalo de nuevo.');
        return;
      }

      await loadDataFromDB();
      setIsModalOpen(false);
      resetForm();
    } catch (err: any) {
      showErrorMsg(err?.message || 'Error de conexión al guardar el producto.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white flex items-center gap-2 tracking-tight">
            <Settings className="w-7 h-7 text-emerald-400" />
            Configuración de Productos Financieros
          </h1>
          <p className="text-sm text-slate-400">
            Definición de tasas de interés global, plazos únicos en cuotas y penalizaciones por mora.
          </p>
        </div>

        <button
          onClick={openNewModal}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-extrabold text-sm shadow-lg shadow-emerald-500/20 transition-all"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          Nuevo Producto
        </button>
      </div>

      {/* Grid of Financial Products */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {activeVisibleProducts.map((product) => (
          <div
            key={product.id}
            className={`glass-panel p-6 rounded-2xl border transition-all flex flex-col justify-between ${
              product.activo ? 'border-slate-800 hover:border-emerald-500/40' : 'border-slate-800/50 opacity-60'
            }`}
          >
            <div>
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <h3 className="text-lg font-bold text-white tracking-tight">{product.nombre}</h3>
                  <span className="capitalize text-xs font-semibold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    Frecuencia: {product.frecuenciaPago}
                  </span>
                </div>
                <button
                  onClick={() => handleToggleStatus(product)}
                  className={`p-1.5 rounded-lg border transition-all ${
                    product.activo
                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                      : 'bg-slate-800 text-slate-500 border-slate-700'
                  }`}
                  title={product.activo ? 'Desactivar producto' : 'Activar producto'}
                >
                  {product.activo ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                </button>
              </div>

              <p className="text-xs text-slate-400 mb-4 line-clamp-2">{product.descripcion}</p>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                  <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-400">
                    <Percent className="w-3.5 h-3.5 text-emerald-400" /> Tasa Interés Global
                  </div>
                  <p className="text-lg font-extrabold text-white mt-0.5">{product.tasaInteresGlobal}%</p>
                </div>

                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                  <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-400">
                    <ShieldAlert className="w-3.5 h-3.5 text-rose-400" /> Recargo por Mora
                  </div>
                  <p className="text-sm font-extrabold text-rose-300 mt-1">
                    {product.tipoPenalizacionMora === 'monto_fijo'
                      ? `${formatCurrency(product.valorPenalizacionMora || 0)}`
                      : `${product.valorPenalizacionMora ?? 0}%`}
                  </p>
                </div>
              </div>

              <div className="space-y-2 text-xs border-t border-slate-800/80 pt-3">
                <div className="flex justify-between text-slate-300">
                  <span className="text-slate-400 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-white" /> Plazo:
                  </span>
                  <span className="font-bold text-white">{product.plazo} cuotas ({product.frecuenciaPago})</span>
                </div>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-800/60 flex items-center justify-between gap-2">
              <button
                onClick={() => setDeletingProduct(product)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 transition-all"
                title="Eliminar producto"
              >
                <Trash2 className="w-3.5 h-3.5" /> Eliminar
              </button>

              <button
                onClick={() => openEditModal(product)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-300 bg-slate-800/80 hover:bg-slate-700 border border-slate-700 transition-all"
              >
                <Edit3 className="w-3.5 h-3.5" /> Editar
              </button>
            </div>
          </div>
        ))}

        {activeVisibleProducts.length === 0 && (
          <div className="col-span-full glass-panel p-8 text-center text-slate-400 text-xs rounded-2xl border border-slate-800">
            No hay productos financieros activos registrados.
          </div>
        )}
      </div>

      {/* Modal de Confirmación */}
      <ConfirmModal
        isOpen={!!deletingProduct}
        onClose={() => setDeletingProduct(null)}
        onConfirm={handleDelete}
        title="Deshabilitar Producto Financiero"
        message={`¿Estás seguro de deshabilitar el producto "${deletingProduct?.nombre}"? No estará disponible para nuevas solicitudes.`}
        confirmText="Sí, Deshabilitar"
        cancelText="Cancelar"
        variant="danger"
      />

      {/* Modal Creación / Edición */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div ref={modalScrollRef} className="glass-panel w-full max-w-lg p-6 rounded-2xl border border-slate-800 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
                <Settings className="w-6 h-6 text-emerald-400" />
                {editingProductId ? 'Editar Producto Financiero' : 'Nuevo Producto Financiero'}
              </h2>

              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 text-base"
                title="Cerrar modal (Esc)"
              >
                ✕
              </button>
            </div>

            {/* Error Banner */}
            {errorMsg && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/40 text-rose-300 text-xs font-semibold flex items-center gap-2.5 shadow-lg shadow-rose-500/10">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSave} noValidate className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Nombre del Producto *</label>
                <input
                  type="text"
                  required
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Ej: Impulso Quincenal Negocio"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Descripción</label>
                <textarea
                  rows={2}
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  placeholder="Resumen del público objetivo o condiciones..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Frecuencia de Pago *</label>
                  <select
                    value={frecuenciaPago}
                    onChange={(e) => setFrecuenciaPago(e.target.value as FrecuenciaPago)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-emerald-500"
                  >
                    <option value="diario">Diario</option>
                    <option value="semanal">Semanal</option>
                    <option value="quincenal">Quincenal</option>
                    <option value="mensual">Mensual</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Plazo (Número de Cuotas) *</label>
                  <input
                    type="number"
                    inputMode="numeric"
                    required
                    value={plazo}
                    onChange={(e) => setPlazo(e.target.value)}
                    placeholder="Ej: 10"
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-emerald-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Tasa de Interés Global (%) *</label>
                <input
                  type="number"
                  inputMode="decimal"
                  required
                  value={tasaInteresGlobal}
                  onChange={(e) => setTasaInteresGlobal(e.target.value)}
                  placeholder="Ej: 15"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-emerald-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
              </div>

              {/* Penalización por Mora Configurable */}
              <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3">
                <label className="block text-slate-300 font-semibold">Penalización por Mora (Por Pago Atrasado) *</label>
                
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setTipoPenalizacionMora('porcentaje')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                      tipoPenalizacionMora === 'porcentaje'
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                    }`}
                  >
                    <Percent className="w-3.5 h-3.5" /> Porcentaje (%)
                  </button>

                  <button
                    type="button"
                    onClick={() => setTipoPenalizacionMora('monto_fijo')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                      tipoPenalizacionMora === 'monto_fijo'
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                    }`}
                  >
                    <span>$</span> Monto Fijo ($ MXN)
                  </button>
                </div>

                <div>
                  <label className="block text-slate-400 text-[11px] font-medium mb-1">
                    {tipoPenalizacionMora === 'porcentaje'
                      ? 'Porcentaje por cuota vencida (%):'
                      : 'Monto fijo en pesos por cuota vencida ($ MXN):'}
                  </label>
                  <input
                    type="number"
                    inputMode="decimal"
                    required
                    value={valorPenalizacionMora}
                    onChange={(e) => setValorPenalizacionMora(e.target.value)}
                    placeholder={tipoPenalizacionMora === 'porcentaje' ? 'Ej: 5' : 'Ej: 50'}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-emerald-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    Aplica acumulativamente por cada pago atrasado según la frecuencia del producto.
                  </p>
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-800">
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 font-semibold text-xs transition-all disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 rounded-xl text-slate-950 bg-emerald-500 hover:bg-emerald-400 font-extrabold text-xs shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Guardando...
                    </>
                  ) : (
                    'Guardar Producto'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
