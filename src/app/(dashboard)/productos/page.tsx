'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Settings, Plus, Percent, Calendar, ShieldAlert, CheckCircle2, XCircle, Edit3, Sparkles, AlertCircle } from 'lucide-react';
import { useImpulsoStore } from '@/store/useImpulsoStore';
import { FinancialProduct, FrecuenciaPago } from '@/types';
import { formatCurrency } from '@/lib/utils';

export default function ProductsPage() {
  const { products, addProduct, updateProduct, toggleProductStatus } = useImpulsoStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
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

  // Form State
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [frecuenciaPago, setFrecuenciaPago] = useState<FrecuenciaPago>('semanal');
  const [plazosInput, setPlazosInput] = useState('4, 8, 12, 16');
  const [tasaInteresGlobal, setTasaInteresGlobal] = useState(12);
  const [porcentajePenalizacionMora, setPorcentajePenalizacionMora] = useState(4);
  const [montoMinimo, setMontoMinimo] = useState(1000);
  const [montoMaximo, setMontoMaximo] = useState(30000);

  const resetForm = () => {
    setErrorMsg(null);
    setEditingProductId(null);
    setNombre('');
    setDescripcion('');
    setFrecuenciaPago('semanal');
    setPlazosInput('4, 8, 12, 16');
    setTasaInteresGlobal(12);
    setPorcentajePenalizacionMora(4);
    setMontoMinimo(1000);
    setMontoMaximo(30000);
  };

  const openNewModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const fillDummyProductData = () => {
    setErrorMsg(null);
    setNombre('Préstamo Emprendedor Quincenal');
    setDescripcion('Financiamiento directo para capital de trabajo con pagos fijos quincenales.');
    setFrecuenciaPago('quincenal');
    setPlazosInput('4, 8, 12, 24');
    setTasaInteresGlobal(15);
    setPorcentajePenalizacionMora(5);
    setMontoMinimo(3000);
    setMontoMaximo(50000);
  };

  const openEditModal = (product: FinancialProduct) => {
    setErrorMsg(null);
    setEditingProductId(product.id);
    setNombre(product.nombre);
    setDescripcion(product.descripcion);
    setFrecuenciaPago(product.frecuenciaPago);
    setPlazosInput(product.plazosPosibles.join(', '));
    setTasaInteresGlobal(product.tasaInteresGlobal);
    setPorcentajePenalizacionMora(product.porcentajePenalizacionMora);
    setMontoMinimo(product.montoMinimo);
    setMontoMaximo(product.montoMaximo);
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // --- VALIDACIONES ESTRUCTURADAS (DE ARRIBA HACIA ABAJO SEGÚN EL FORMULARIO) ---
    if (!nombre.trim() || nombre.trim().length < 3) {
      showErrorMsg('El nombre del producto es obligatorio (mínimo 3 caracteres).');
      return;
    }

    const plazosParsed = plazosInput
      .split(',')
      .map((p) => parseInt(p.trim()))
      .filter((num) => !isNaN(num) && num > 0);

    if (plazosParsed.length === 0) {
      showErrorMsg('Ingresa al menos un plazo válido en cuotas (ej. 4, 8, 12).');
      return;
    }

    if (tasaInteresGlobal <= 0) {
      showErrorMsg('La Tasa de Interés Global debe ser un porcentaje mayor a 0.');
      return;
    }

    if (porcentajePenalizacionMora < 0) {
      showErrorMsg('El Porcentaje de Penalización por Mora no puede ser negativo.');
      return;
    }

    if (montoMinimo <= 0) {
      showErrorMsg('El Monto Mínimo debe ser mayor a $0.');
      return;
    }

    if (montoMaximo <= montoMinimo) {
      showErrorMsg('El Monto Máximo debe ser estrictamente mayor al Monto Mínimo.');
      return;
    }

    const productPayload = {
      nombre: nombre.trim(),
      descripcion: descripcion.trim(),
      frecuenciaPago,
      plazosPosibles: plazosParsed,
      tasaInteresGlobal: Number(tasaInteresGlobal),
      porcentajePenalizacionMora: Number(porcentajePenalizacionMora),
      montoMinimo: Number(montoMinimo),
      montoMaximo: Number(montoMaximo),
      activo: true,
    };

    if (editingProductId) {
      updateProduct(editingProductId, productPayload);
    } else {
      addProduct(productPayload);
    }

    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white flex items-center gap-2 tracking-tight">
            <Settings className="w-7 h-7 text-emerald-400" />
            Configuración de Productos Financieros
          </h1>
          <p className="text-sm text-slate-400">
            Define los plazos, tasas de interés global fijas y esquema de penalizaciones por mora.
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
        {products.map((product) => (
          <div
            key={product.id}
            className={`glass-panel p-6 rounded-2xl border transition-all flex flex-col justify-between ${
              product.activo ? 'border-slate-800 hover:border-emerald-500/40' : 'border-slate-800/50 opacity-60'
            }`}
          >
            <div>
              {/* Product Header */}
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <h3 className="text-lg font-bold text-white tracking-tight">{product.nombre}</h3>
                  <span className="capitalize text-xs font-semibold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    Frecuencia: {product.frecuenciaPago}
                  </span>
                </div>
                <button
                  onClick={() => toggleProductStatus(product.id)}
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

              {/* Product Metrics Grid */}
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
                  <p className="text-lg font-extrabold text-rose-300 mt-0.5">{product.porcentajePenalizacionMora}%</p>
                </div>
              </div>

              {/* Plazos & Limits */}
              <div className="space-y-2 text-xs border-t border-slate-800/80 pt-3">
                <div className="flex justify-between text-slate-300">
                  <span className="text-slate-400 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-white" /> Plazos permitidos:
                  </span>
                  <span className="font-bold text-white">{product.plazosPosibles.join(', ')} cuotas</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span className="text-slate-400">Rango de Crédito:</span>
                  <span className="font-bold text-emerald-400">
                    {formatCurrency(product.montoMinimo)} - {formatCurrency(product.montoMaximo)}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-800/60 flex justify-end">
              <button
                onClick={() => openEditModal(product)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-300 bg-slate-800/80 hover:bg-slate-700 border border-slate-700 transition-all"
              >
                <Edit3 className="w-3.5 h-3.5" /> Editar Parámetros
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Creación / Edición */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div ref={modalScrollRef} className="glass-panel w-full max-w-lg p-6 rounded-2xl border border-slate-800 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
                <Settings className="w-6 h-6 text-emerald-400" />
                {editingProductId ? 'Editar Producto Financiero' : 'Nuevo Producto Financiero'}
              </h2>

              <div className="flex items-center gap-2">
                {!editingProductId && (
                  <button
                    type="button"
                    onClick={fillDummyProductData}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/40 text-xs font-bold transition-all"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                    Prellenar Demo
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="text-slate-400 hover:text-white p-1 text-base"
                  title="Cerrar modal (Esc)"
                >
                  ✕
                </button>
              </div>
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
                <label className="block text-slate-300 font-semibold mb-1">Nombre del Producto</label>
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
                  placeholder="Resumen del público objetivo o condiciones"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Frecuencia de Pago</label>
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
                  <label className="block text-slate-300 font-semibold mb-1">Plazos (separados por coma)</label>
                  <input
                    type="text"
                    required
                    value={plazosInput}
                    onChange={(e) => setPlazosInput(e.target.value)}
                    placeholder="Ej: 4, 8, 12, 16"
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Tasa Interés Global (%)</label>
                  <input
                    type="number"
                    step="0.5"
                    required
                    value={tasaInteresGlobal}
                    onChange={(e) => setTasaInteresGlobal(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Penalización Mora (%)</label>
                  <input
                    type="number"
                    step="0.5"
                    required
                    value={porcentajePenalizacionMora}
                    onChange={(e) => setPorcentajePenalizacionMora(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Monto Mínimo ($ MXN)</label>
                  <input
                    type="number"
                    step="500"
                    value={montoMinimo}
                    onChange={(e) => setMontoMinimo(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Monto Máximo ($ MXN)</label>
                  <input
                    type="number"
                    step="1000"
                    value={montoMaximo}
                    onChange={(e) => setMontoMaximo(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 font-semibold text-xs transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-slate-950 bg-emerald-500 hover:bg-emerald-400 font-extrabold text-xs shadow-lg shadow-emerald-500/20 transition-all"
                >
                  Guardar Producto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
