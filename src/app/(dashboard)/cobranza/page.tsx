'use client';

import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  Smartphone,
  CheckCircle2,
  AlertTriangle,
  Phone,
  DollarSign,
  Calendar,
  Clock,
  Check,
  Search,
  Receipt,
  UserCheck,
  Filter,
  Loader2,
} from 'lucide-react';
import { useImpulsoStore } from '@/store/useImpulsoStore';
import { InstallmentStatusBadge } from '@/components/shared/StatusBadges';
import { formatCurrency, formatDate, formatDateWithDay, getTodayDateString } from '@/lib/utils';
import { AmortizationInstallment, Loan } from '@/types';
import { registerPaymentAction } from '@/app/actions/paymentActions';

interface CollectionItem {
  loan: Loan;
  installment: AmortizationInstallment;
  isOverdue: boolean;
  isToday: boolean;
}

export default function CollectionPage() {
  const { loans, clients, users, currentUser, loadDataFromDB } = useImpulsoStore();
  const [isPageLoading, setIsPageLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    setIsPageLoading(true);
    loadDataFromDB().finally(() => {
      if (isMounted) setIsPageLoading(false);
    });
    return () => {
      isMounted = false;
    };
  }, [loadDataFromDB]);

  const todayStr = getTodayDateString();

  const isPromotorUser = currentUser.role === 'Promotor de Campo';

  // Catálogo estricto de promotores (obtenido directamente de los usuarios en la BD)
  const promoterCatalog = users
    .filter((u) => u.estatus === 'Activo')
    .map((u) => ({
      name: u.name,
      role: u.role,
      diaCobro: u.diaCobroAsignado || 'Sin día',
    }));

  const [activeTab, setActiveTab] = useState<'pendientes' | 'mora' | 'pagados'>('pendientes');
  const [searchTerm, setSearchTerm] = useState('');
  const [promotorFilter, setPromotorFilter] = useState<string>(
    isPromotorUser ? currentUser.name : 'todos'
  );

  // Payment Modal State
  const [selectedItem, setSelectedItem] = useState<CollectionItem | null>(null);
  const [montoRecibido, setMontoRecibido] = useState<number>(0);
  const [penalizacionCobrada, setPenalizacionCobrada] = useState<number>(0);
  const [metodoPago, setMetodoPago] = useState<'Efectivo' | 'Transferencia' | 'Tarjeta'>('Efectivo');
  const [nota, setNota] = useState('');
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  // Extract collection items strictly for today's due date, overdue items, or today's paid items
  const collectionList: CollectionItem[] = [];

  loans.forEach((loan) => {
    const client = clients.find((c) => c.id === loan.clienteId);
    const assignedPromotorName = client?.promotorAsignadoNombre || loan.promotorAsignado || 'Pedro Ramírez';

    loan.tablaAmortizacion.forEach((installment) => {
      const isOverdue =
        installment.estado === 'Mora' ||
        installment.estado === 'Vencido' ||
        ((installment.estado === 'Pendiente' || installment.estado === 'Parcial') && installment.fechaVencimiento < todayStr);

      const isToday = installment.fechaVencimiento === todayStr;

      // REGLA DE COBRANZA EN CAMPO:
      // Jamás mostrar cuotas futuras (fechaVencimiento > todayStr)
      if (
        isToday ||
        isOverdue ||
        (installment.estado === 'Pagado' && (installment.fechaPagoReal === todayStr || installment.fechaPago?.startsWith(todayStr)))
      ) {
        collectionList.push({
          loan: {
            ...loan,
            promotorAsignado: assignedPromotorName,
          },
          installment: {
            ...installment,
            estado: isOverdue ? 'Vencido' : installment.estado,
          },
          isOverdue,
          isToday,
        });
      }
    });
  });

  const filteredCollection = collectionList.filter((item) => {
    const matchesSearch =
      item.loan.clienteNombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.loan.folio.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    // Filter by Promotor
    const matchesPromotor =
      promotorFilter === 'todos' ||
      item.loan.promotorAsignado.toLowerCase().includes(promotorFilter.toLowerCase());

    if (!matchesPromotor) return false;

    if (activeTab === 'pendientes') {
      // Pestaña Ruta de Cobro de Hoy: Cuotas del día de hoy MÁS todas las cuotas en mora pendientes
      return (item.isToday || item.isOverdue) && item.installment.estado !== 'Pagado';
    }
    if (activeTab === 'mora') {
      // Pestaña En Mora: SOLO cuotas vencidas/en mora que siguen pendientes
      return item.isOverdue && item.installment.estado !== 'Pagado';
    }
    if (activeTab === 'pagados') {
      // Pestaña Cobrados: Cuotas cobradas el día de hoy
      return item.installment.estado === 'Pagado';
    }
    return true;
  });

  const openPaymentModal = (item: CollectionItem) => {
    setSelectedItem(item);
    const cuotaFaltante = item.installment.cuotaTotal - item.installment.montoPagado;
    const recargoMora = item.installment.recargoPenalizacion || item.installment.penalizacionesMora || (item.isOverdue ? 100 : 0);
    setMontoRecibido(cuotaFaltante);
    setPenalizacionCobrada(recargoMora);
    setMetodoPago('Efectivo');
    setNota('');
    setFeedbackMessage(null);
  };

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRegisterPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem || isSubmitting) return;

    // --- VALIDACIONES ESTRUCTURADAS (DE ARRIBA HACIA ABAJO SEGÚN EL FORMULARIO) ---
    // 1. Monto Recibido
    if (!montoRecibido || Number(montoRecibido) <= 0) {
      setFeedbackMessage('El Monto Recibido es obligatorio y debe ser mayor a $0.');
      return;
    }

    // 2. Penalización por Mora
    if (penalizacionCobrada < 0) {
      setFeedbackMessage('La penalización por mora no puede ser un monto negativo.');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await registerPaymentAction({
        prestamoId: selectedItem.loan.id,
        numeroCuota: selectedItem.installment.numeroCuota,
        montoRecibido: Number(montoRecibido),
        penalizacionCobrada: Number(penalizacionCobrada),
        metodoPago,
        cobradorNombre: currentUser.name,
        nota,
      });

      if (result.success) {
        setFeedbackMessage(result.message);
        await loadDataFromDB();
        // Trigger Confetti Effect
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.7 },
        });

        setTimeout(() => {
          setSelectedItem(null);
          setFeedbackMessage(null);
        }, 1200);
      } else {
        setFeedbackMessage(result.message || 'Error al registrar pago.');
      }
    } catch (err: any) {
      setFeedbackMessage(err.message || 'Error al procesar el pago.');
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selectedItem && !isSubmitting) {
        setSelectedItem(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedItem, isSubmitting]);

  if (isPageLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] p-12 space-y-4 glass-panel rounded-3xl border border-slate-800 my-8">
        <Loader2 className="w-10 h-10 text-emerald-400 animate-spin" />
        <p className="text-sm font-semibold text-slate-300">Consultando cobranza en tiempo real desde PostgreSQL...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white flex items-center gap-2 tracking-tight">
            <DollarSign className="w-7 h-7 text-emerald-400" />
            Cobranza en Campo (Día Actual)
          </h1>
          <p className="text-sm text-slate-400">
            Ruta de recaudación diaria y cuotas vencidas asignadas por promotor.
          </p>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex flex-col md:flex-row gap-3 justify-between items-center">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por Cliente o Folio..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-900/90 border border-slate-700 text-white text-xs focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-xs text-slate-400 font-medium">Promotor:</span>
          <select
            value={promotorFilter}
            onChange={(e) => setPromotorFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-emerald-500 capitalize"
          >
            {!isPromotorUser && <option value="todos">Todos los Promotores</option>}
            {promoterCatalog.map((p) => (
              <option key={p.name} value={p.name}>
                {p.name} ({p.role}) - Cobro: {p.diaCobro}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Collection Tabs */}
      <div className="flex rounded-xl bg-slate-900/80 p-1 border border-slate-800 text-xs">
        <button
          onClick={() => setActiveTab('pendientes')}
          className={`flex-1 py-2.5 rounded-lg font-bold transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'pendientes'
              ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Clock className="w-3.5 h-3.5" /> Ruta de Hoy ({collectionList.filter(i => (i.isToday || i.isOverdue) && i.installment.estado !== 'Pagado').length})
        </button>

        <button
          onClick={() => setActiveTab('mora')}
          className={`flex-1 py-2.5 rounded-lg font-bold transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'mora'
              ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5" /> En Mora ({collectionList.filter(i => i.isOverdue && i.installment.estado !== 'Pagado').length})
        </button>

        <button
          onClick={() => setActiveTab('pagados')}
          className={`flex-1 py-2.5 rounded-lg font-bold transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'pagados'
              ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/20'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" /> Cobrados Hoy ({collectionList.filter(i => i.installment.estado === 'Pagado').length})
        </button>
      </div>

      {/* Collection Cards List */}
      <div className="space-y-3">
        {filteredCollection.map((item, idx) => {
          const recargoMoraCard = item.installment.recargoPenalizacion || item.installment.penalizacionesMora || (item.isOverdue ? 100 : 0);
          const cuotaFaltanteCard = item.installment.cuotaTotal - item.installment.montoPagado;
          const totalACobrarCard = item.isOverdue && !item.installment.recargoPenalizacion ? cuotaFaltanteCard + recargoMoraCard : cuotaFaltanteCard;

          return (
            <div
              key={`${item.loan.id}-${item.installment.numeroCuota}-${idx}`}
              className={`glass-panel p-4 rounded-2xl border transition-all ${
                item.isOverdue
                  ? 'border-rose-500/40 bg-rose-950/20 shadow-lg shadow-rose-950/20'
                  : 'border-slate-800 hover:border-emerald-500/40'
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-extrabold text-white text-base leading-tight">
                    {item.loan.clienteNombre}
                  </h3>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">
                    Folio: {item.loan.folio} • Cuota #{item.installment.numeroCuota} de {item.loan.plazoCantidad}
                  </p>
                  <p className="text-[11px] text-emerald-400 font-semibold mt-0.5">
                    Promotor Asignado: {item.loan.promotorAsignado}
                  </p>
                </div>

                <InstallmentStatusBadge status={item.installment.estado} />
              </div>

              {/* Installment Info */}
              <div className="grid grid-cols-2 gap-2 my-3 p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs">
                <div>
                  <span className="text-slate-400 text-[11px]">Vencimiento:</span>
                  <p className={`font-bold ${item.isOverdue ? 'text-rose-400' : 'text-slate-200'}`}>
                    {formatDateWithDay(item.installment.fechaVencimiento)}
                  </p>
                </div>

                <div>
                  <span className="text-slate-400 text-[11px]">Monto a Cobrar:</span>
                  <p className={`font-black text-sm ${item.isOverdue ? 'text-rose-300' : 'text-emerald-400'}`}>
                    {formatCurrency(totalACobrarCard)}
                  </p>
                  {item.isOverdue && recargoMoraCard > 0 && (
                    <span className="block text-[10px] text-rose-400 font-extrabold mt-0.5">
                      ⚠️ Incluye +{formatCurrency(recargoMoraCard)} recargo mora
                    </span>
                  )}
                </div>
              </div>

              {/* Touch Action Buttons */}
              <div className="flex items-center gap-2 pt-1">
                {item.loan.clienteTelefono && (
                  <a
                    href={`tel:${item.loan.clienteTelefono.replace(/\s+/g, '')}`}
                    className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 flex items-center justify-center"
                    title={`Llamar a ${item.loan.clienteNombre}`}
                  >
                    <Phone className="w-4 h-4 text-emerald-400" />
                  </a>
                )}

                {item.installment.estado !== 'Pagado' ? (
                  <button
                    onClick={() => openPaymentModal(item)}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-black text-xs shadow-lg transition-all active:scale-95 ${
                      item.isOverdue
                        ? 'bg-rose-500 hover:bg-rose-400 text-white shadow-rose-500/20'
                        : 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 shadow-emerald-500/20'
                    }`}
                  >
                    <DollarSign className="w-4 h-4 stroke-[3]" />
                    Registrar Cobro ({formatCurrency(totalACobrarCard)})
                  </button>
                ) : (
                  <div className="flex-1 py-2 px-3 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-bold text-center flex items-center justify-center gap-1.5">
                    <Check className="w-4 h-4" /> Cobro Registrado
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {filteredCollection.length === 0 && (
          <div className="p-12 text-center text-slate-500 glass-panel rounded-2xl border border-slate-800">
            No hay cobros asignados a esta ruta/promotor.
          </div>
        )}
      </div>

      {/* Modal Express de Cobro en Campo */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="glass-panel w-full max-w-md p-6 rounded-t-3xl sm:rounded-2xl border border-slate-800 shadow-2xl space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <div>
                <span className="text-[10px] uppercase tracking-wider font-extrabold text-emerald-400">
                  Recibo de Cobranza en Campo
                </span>
                <h2 className="text-lg font-extrabold text-white">{selectedItem.loan.clienteNombre}</h2>
              </div>
              <button
                onClick={() => setSelectedItem(null)}
                className="p-1 text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {feedbackMessage ? (
              <div className="p-6 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto animate-bounce">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <p className="font-extrabold text-white text-base">{feedbackMessage}</p>
              </div>
            ) : (
              <form onSubmit={handleRegisterPayment} noValidate className="space-y-4 text-xs">
                {/* Cuota details */}
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                  <div className="flex justify-between text-slate-300">
                    <span>Préstamo:</span>
                    <strong className="font-mono text-emerald-400">{selectedItem.loan.folio}</strong>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Cuota #:</span>
                    <strong>#{selectedItem.installment.numeroCuota}</strong>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Valor Cuota Regular:</span>
                    <strong className="text-white">{formatCurrency(selectedItem.installment.cuotaTotal)}</strong>
                  </div>
                </div>

                {/* Total Sugerido a Recaudar Banner */}
                <div className="p-3.5 rounded-xl bg-slate-900 border border-emerald-500/40 flex justify-between items-center shadow-lg">
                  <div>
                    <span className="text-slate-200 font-extrabold text-xs block">Total a Recaudar al Cliente:</span>
                    {selectedItem.isOverdue && (
                      <span className="text-[10px] text-rose-400 font-bold">⚠️ Incluye penalización por mora</span>
                    )}
                  </div>
                  <strong className="text-emerald-400 font-black text-xl font-mono">
                    {formatCurrency(Number(montoRecibido) + Number(penalizacionCobrada))}
                  </strong>
                </div>

                {/* Monto Recibido Input */}
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Monto Recibido ($ MXN)</label>
                  <input
                    type="number"
                    step="50"
                    required
                    value={montoRecibido}
                    onChange={(e) => setMontoRecibido(Number(e.target.value))}
                    className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-emerald-400 font-black text-xl focus:outline-none focus:border-emerald-500"
                  />
                  {montoRecibido < selectedItem.installment.cuotaTotal && (
                    <p className="text-[11px] text-amber-400 mt-1">
                      ⚠️ Se registrará como un Abono Parcial a la cuota.
                    </p>
                  )}
                </div>

                {/* Penalización por Mora */}
                {selectedItem.isOverdue && (
                  <div>
                    <label className="block text-rose-300 font-semibold mb-1 flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-400" /> Penalización por Mora ($ MXN)
                    </label>
                    <input
                      type="number"
                      step="50"
                      value={penalizacionCobrada}
                      onChange={(e) => setPenalizacionCobrada(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-rose-500/40 text-rose-300 font-bold focus:outline-none"
                    />
                  </div>
                )}

                {/* Método de Pago */}
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Método de Pago</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['Efectivo', 'Transferencia', 'Tarjeta'] as const).map((method) => (
                      <button
                        key={method}
                        type="button"
                        onClick={() => setMetodoPago(method)}
                        className={`py-2 px-2 rounded-xl font-bold text-xs transition-all border ${
                          metodoPago === method
                            ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                            : 'bg-slate-900 text-slate-400 border-slate-800'
                        }`}
                      >
                        {method}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Nota Opcional */}
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Comentario o Nota (Opcional)</label>
                  <input
                    type="text"
                    placeholder="Ej. Entregó recibo impreso a mano"
                    value={nota}
                    onChange={(e) => setNota(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs"
                  />
                </div>

                <div className="pt-3 flex gap-2">
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => setSelectedItem(null)}
                    className="w-1/3 py-3 rounded-xl bg-slate-800 text-slate-300 font-semibold text-xs disabled:opacity-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-2/3 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" /> Registrando...
                      </>
                    ) : (
                      'Confirmar Cobro'
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
