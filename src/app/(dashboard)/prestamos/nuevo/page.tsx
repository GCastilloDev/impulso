'use client';

import React, { useState, useMemo, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Banknote, ArrowLeft, Calculator, Calendar, CheckCircle2, User, Percent, Loader2, AlertCircle } from 'lucide-react';
import { useImpulsoStore } from '@/store/useImpulsoStore';
import { calculateAmortizationSchedule } from '@/lib/financialCalculators';
import { formatCurrency, formatDate, getTodayDateString } from '@/lib/utils';
import { createLoanAction } from '@/app/actions/loanActions';
import { SearchableSelect } from '@/components/shared/SearchableSelect';

function LoanFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultClientId = searchParams.get('clienteId') || '';

  const { clients, products, users, currentUser, loadDataFromDB } = useImpulsoStore();

  const isAdmin = currentUser.role === 'Administrador';
  const isPromotor = currentUser.role === 'Promotor de Campo';

  const activeProducts = products.filter((p) => p.activo && !p.eliminado);
  
  // Si es promotor, solo puede otorgar crédito a sus clientes asignados
  const activeClients = isPromotor
    ? clients.filter((c) => c.estatus === 'Activo' && (c.promotorAsignadoId === currentUser.id || c.promotorAsignadoNombre === currentUser.name))
    : clients.filter((c) => c.estatus === 'Activo');

  const activePromotores = users.filter(
    (u) => u.estatus === 'Activo' && (u.role === 'Promotor de Campo' || u.role === 'Administrador')
  );

  // Opciones formateadas para los buscadores internos (máximo 4 iniciales)
  const clientOptions = activeClients.map((c) => ({
    id: c.id,
    label: c.nombre,
    sublabel: c.folio,
    searchValue: `${c.nombre} ${c.folio} ${c.curp || ''}`,
  }));

  const productOptions = activeProducts.map((p) => ({
    id: p.id,
    label: p.nombre,
    sublabel: `Tasa: ${p.tasaInteresGlobal}% • ${p.frecuenciaPago}`,
    searchValue: `${p.nombre} ${p.frecuenciaPago}`,
  }));

  const promoterOptions = activePromotores.map((p) => ({
    id: p.name,
    label: p.name,
    sublabel: p.role,
    searchValue: `${p.name} ${p.role}`,
  }));

  // Form State
  const [selectedClientId, setSelectedClientId] = useState(defaultClientId || '');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [montoPrincipal, setMontoPrincipal] = useState<number | ''>('');
  const [plazoCantidad, setPlazoCantidad] = useState<number | ''>('');
  const [fechaInicio, setFechaInicio] = useState<string>(getTodayDateString());
  const [promotorAsignado, setPromotorAsignado] = useState(
    currentUser.name || ''
  );

  const selectedClient = activeClients.find((c) => c.id === selectedClientId);
  const selectedProduct = activeProducts.find((p) => p.id === selectedProductId);

  // Auto-set default plazo when product changes
  useEffect(() => {
    if (selectedProduct) {
      const defaultPlazo = selectedProduct.plazo || (Array.isArray((selectedProduct as any).plazosPosibles) ? (selectedProduct as any).plazosPosibles[0] : 10);
      setPlazoCantidad(Number(defaultPlazo) || '');
    }
  }, [selectedProduct]);

  // Preselect promotorAsignado with current logged-in user in both cases (Admin can change, Promotor is locked)
  useEffect(() => {
    if (isPromotor) {
      setPromotorAsignado(currentUser.name);
    } else if (!promotorAsignado) {
      if (selectedClient && selectedClient.promotorAsignadoNombre && selectedClient.promotorAsignadoNombre !== 'Sin asignar') {
        setPromotorAsignado(selectedClient.promotorAsignadoNombre);
      } else if (currentUser?.name) {
        setPromotorAsignado(currentUser.name);
      }
    }
  }, [selectedClient, currentUser.name, isPromotor]);

  // Live Amortization Schedule calculation
  const amortizationData = useMemo(() => {
    if (!selectedProduct || !montoPrincipal || !plazoCantidad) return null;
    const numMonto = Number(montoPrincipal);
    const numPlazo = Number(plazoCantidad);
    if (isNaN(numMonto) || numMonto <= 0 || isNaN(numPlazo) || numPlazo <= 0) return null;

    return calculateAmortizationSchedule(
      numMonto,
      selectedProduct.tasaInteresGlobal,
      numPlazo,
      selectedProduct.frecuenciaPago,
      fechaInicio
    );
  }, [montoPrincipal, selectedProduct, plazoCantidad, fechaInicio]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const showErrorMsg = (msg: string) => {
    setErrorMsg(msg);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCreateLoan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setErrorMsg(null);

    // --- VALIDACIONES ESTRUCTURADAS (DE ARRIBA HACIA ABAJO SEGÚN EL FORMULARIO) ---
    // 1. Cliente Solicitante
    if (!selectedClientId || !selectedClient) {
      showErrorMsg('Debes seleccionar un cliente solicitante activo.');
      return;
    }

    // 2. Producto Financiero
    if (!selectedProductId || !selectedProduct) {
      showErrorMsg('Debes seleccionar un producto financiero activo.');
      return;
    }

    // 3. Monto del Préstamo
    if (!montoPrincipal || montoPrincipal <= 0) {
      showErrorMsg('El monto del préstamo debe ser mayor a $0 MXN.');
      return;
    }

    // 4. Plazo (Número de Cuotas)
    if (!plazoCantidad || plazoCantidad <= 0) {
      showErrorMsg('Debes seleccionar un producto financiero para cargar su plazo.');
      return;
    }

    // 5. Fecha de Inicio / Desembolso
    if (!fechaInicio) {
      showErrorMsg('La Fecha de Desembolso es obligatoria.');
      return;
    }

    if (fechaInicio < getTodayDateString()) {
      showErrorMsg('La Fecha de Desembolso no puede ser anterior a la fecha actual.');
      return;
    }

    // 6. Promotor Asignado
    if (!promotorAsignado || !promotorAsignado.trim()) {
      showErrorMsg('El nombre del promotor asignado es obligatorio.');
      return;
    }

    if (!amortizationData) {
      showErrorMsg('Verifica los datos seleccionados para calcular la tabla de pagos.');
      return;
    }

    const isPromotor = currentUser.role === 'Promotor de Campo';
    const targetStatus = isPromotor ? 'En Evaluación' : 'Activo';

    setIsSubmitting(true);
    try {
      const res = await createLoanAction({
        clienteId: selectedClient.id,
        clienteNombre: selectedClient.nombre,
        clienteTelefono: selectedClient.telefono,
        productoId: selectedProduct.id,
        productoNombre: selectedProduct.nombre,
        montoPrincipal,
        tasaInteresGlobal: selectedProduct.tasaInteresGlobal,
        plazoCantidad,
        frecuenciaPago: selectedProduct.frecuenciaPago,
        fechaInicio,
        cuotaRegular: amortizationData.cuotaRegular,
        totalAPagar: amortizationData.totalAPagar,
        saldoPendiente: amortizationData.totalAPagar,
        estatus: targetStatus,
        promotorAsignado: isPromotor ? currentUser.name : promotorAsignado.trim(),
        creadoPorRol: currentUser.role,
        tablaAmortizacion: amortizationData.tablaAmortizacion,
      });

      if (!res.success) {
        showErrorMsg(res.message || 'Error al procesar la solicitud de préstamo.');
        return;
      }

      await loadDataFromDB();
      router.push('/prestamos');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Form Inputs Column */}
      <div className="lg:col-span-5 space-y-5">
        <form onSubmit={handleCreateLoan} noValidate className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
          <h2 className="text-base font-extrabold text-white pb-2 border-b border-slate-800 flex items-center gap-2">
            <User className="w-4 h-4 text-emerald-400" /> Datos de la Solicitud
          </h2>

          {/* Error Banner */}
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/40 text-rose-300 text-xs font-semibold flex items-center gap-2.5 shadow-lg shadow-rose-500/10">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Client Select */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Cliente Solicitante *</label>
            <SearchableSelect
              options={clientOptions}
              value={selectedClientId}
              onChange={(val) => setSelectedClientId(val)}
              placeholder="Selecciona o busca un cliente..."
              searchPlaceholder="Buscar cliente por folio o nombre..."
              initialLimit={4}
            />
            {selectedClient && (
              <p className="text-[11px] text-slate-400 mt-1.5 flex justify-between">
                <span>Score: <strong className="text-emerald-400">{selectedClient.scoreCrediticio}</strong></span>
                <span>Folio: <strong className="text-slate-300">{selectedClient.folio}</strong></span>
              </p>
            )}
          </div>

          {/* Product Select */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Producto Financiero *</label>
            <SearchableSelect
              options={productOptions}
              value={selectedProductId}
              onChange={(val) => setSelectedProductId(val)}
              placeholder="Selecciona un producto..."
              searchPlaceholder="Buscar producto financiero..."
              initialLimit={4}
            />
          </div>

          {/* Monto Principal */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Monto del Préstamo ($ MXN) *</label>
            <input
              type="number"
              inputMode="decimal"
              required
              value={montoPrincipal}
              onChange={(e) => setMontoPrincipal(e.target.value === '' ? '' : Number(e.target.value))}
              placeholder="Ej: 10000"
              className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-emerald-400 font-extrabold text-lg focus:outline-none focus:border-emerald-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
          </div>

          {/* Plazo / Número de Cuotas (Informativo, no editable) */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Plazo del Préstamo (Configurado por Producto)
            </label>
            <input
              type="text"
              disabled
              readOnly
              value={
                selectedProduct
                  ? `${selectedProduct.plazo} cuotas (${selectedProduct.frecuenciaPago})`
                  : 'Selecciona un producto financiero'
              }
              className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-emerald-400 font-bold text-xs cursor-not-allowed opacity-85"
            />
          </div>

          {/* Fecha de Inicio */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Fecha Desembolso *</label>
              <input
                type="date"
                required
                min={getTodayDateString()}
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-emerald-500 [color-scheme:dark]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Promotor Asignado *</label>
              {isAdmin ? (
                <SearchableSelect
                  options={promoterOptions}
                  value={promotorAsignado}
                  onChange={(val) => setPromotorAsignado(val)}
                  placeholder="Selecciona promotor..."
                  searchPlaceholder="Buscar promotor..."
                  initialLimit={4}
                />
              ) : (
                <input
                  type="text"
                  disabled
                  value={currentUser.name || 'Promotor'}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 font-bold text-xs cursor-not-allowed opacity-75"
                />
              )}
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-3">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-sm shadow-xl shadow-emerald-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" /> Procesando...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
                  Confirmar y Generar Crédito
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Live Calculation Preview & Amortization Table */}
      <div className="lg:col-span-7 space-y-5">
        {/* Summary Cards */}
        {amortizationData && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="glass-panel p-4 rounded-2xl border border-slate-800">
              <p className="text-[11px] font-semibold text-slate-400">Total a Pagar</p>
              <p className="text-xl font-black text-emerald-400 mt-1">{formatCurrency(amortizationData.totalAPagar)}</p>
              <p className="text-[10px] text-slate-500 mt-0.5">Tasa {amortizationData.tasaInteresGlobal}% Global</p>
            </div>

            <div className="glass-panel p-4 rounded-2xl border border-slate-800">
              <p className="text-[11px] font-semibold text-slate-400">Cuota Regular</p>
              <p className="text-xl font-black text-white mt-1">{formatCurrency(amortizationData.cuotaRegular)}</p>
              <p className="text-[10px] text-emerald-400 capitalize mt-0.5">Cobro {selectedProduct?.frecuenciaPago}</p>
            </div>

            <div className="glass-panel p-4 rounded-2xl border border-slate-800">
              <p className="text-[11px] font-semibold text-slate-400">Total Intereses</p>
              <p className="text-xl font-black text-indigo-400 mt-1">{formatCurrency(amortizationData.totalInteres)}</p>
              <p className="text-[10px] text-slate-500 mt-0.5">Interés fijo estipulado</p>
            </div>
          </div>
        )}

        {/* Amortization Table Preview */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3">
          <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
            <Calendar className="w-4 h-4 text-white" />
            Tabla de Amortización Generada ({amortizationData?.tablaAmortizacion.length || 0} Pagos)
          </h3>

          <div className="overflow-x-auto max-h-[420px] overflow-y-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/90 text-slate-400 font-semibold border-b border-slate-800 sticky top-0 uppercase tracking-wider">
                <tr>
                  <th className="p-2.5">#</th>
                  <th className="p-2.5">Fecha Vencimiento</th>
                  <th className="p-2.5">Capital</th>
                  <th className="p-2.5">Interés</th>
                  <th className="p-2.5">Cuota Total</th>
                  <th className="p-2.5 text-right">Saldo Pendiente</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {amortizationData?.tablaAmortizacion.map((cuota) => (
                  <tr key={cuota.numeroCuota} className="hover:bg-slate-800/40">
                    <td className="p-2.5 font-bold text-slate-300">#{cuota.numeroCuota}</td>
                    <td className="p-2.5 text-slate-300 font-sans">{formatDate(cuota.fechaVencimiento)}</td>
                    <td className="p-2.5 text-slate-400">{formatCurrency(cuota.capital)}</td>
                    <td className="p-2.5 text-indigo-300">{formatCurrency(cuota.interes)}</td>
                    <td className="p-2.5 font-bold text-emerald-400">{formatCurrency(cuota.cuotaTotal)}</td>
                    <td className="p-2.5 text-right text-slate-400">{formatCurrency(cuota.saldoPendiente)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function NewLoanPage() {
  return (
    <div className="space-y-6">
      {/* Page Navigation */}
      <Link
        href="/prestamos"
        className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Regresar a Préstamos
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white flex items-center gap-2 tracking-tight">
            <Calculator className="w-7 h-7 text-emerald-400" />
            Originación de Préstamo & Simulador
          </h1>
          <p className="text-sm text-slate-400">
            Calculadora en tiempo real con interés global fijo y generación de tabla de amortización.
          </p>
        </div>
      </div>

      <Suspense fallback={<div className="p-12 text-center text-slate-400 text-xs">Cargando simulador de préstamo...</div>}>
        <LoanFormContent />
      </Suspense>
    </div>
  );
}
