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
import { formatCurrency, formatDate, getTodayDateString } from '@/lib/utils';
import { AmortizationInstallment, Loan } from '@/types';

interface CollectionItem {
  loan: Loan;
  installment: AmortizationInstallment;
  isOverdue: boolean;
  isToday: boolean;
}

export default function CollectionPage() {
  const { loans, clients, users, registerPayment, currentUser } = useImpulsoStore();
  const todayStr = getTodayDateString();

  const isPromotorUser = currentUser.role === 'Promotor de Campo';
  const activePromotores = users.filter(
    (u) => u.estatus === 'Activo' && (u.role === 'Promotor de Campo' || u.role === 'Administrador')
  );

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

  // Extract all pending and overdue collection items
  const collectionList: CollectionItem[] = [];

  loans.forEach((loan) => {
    // Find client to get assigned promotor
    const client = clients.find((c) => c.id === loan.clienteId);
    const assignedPromotorName = client?.promotorAsignadoNombre || loan.promotorAsignado || 'Pedro Ramírez';
    const assignedPromotorId = client?.promotorAsignadoId || '';

    loan.tablaAmortizacion.forEach((installment) => {
      const isOverdue =
        installment.estado === 'Mora' ||
        (installment.estado === 'Pendiente' && installment.fechaVencimiento < todayStr);
      const isToday = installment.fechaVencimiento === todayStr;

      if (
        installment.estado === 'Pendiente' ||
        installment.estado === 'Parcial' ||
        installment.estado === 'Mora' ||
        (installment.estado === 'Pagado' && installment.fechaPagoReal?.startsWith(todayStr))
      ) {
        collectionList.push({
          loan: {
            ...loan,
            promotorAsignado: assignedPromotorName,
          },
          installment,
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
      return item.installment.estado === 'Pendiente' || item.installment.estado === 'Parcial';
    }
    if (activeTab === 'mora') {
      return item.isOverdue || item.installment.estado === 'Mora';
    }
    if (activeTab === 'pagados') {
      return item.installment.estado === 'Pagado';
    }
    return true;
  });

  const openPaymentModal = (item: CollectionItem) => {
    setSelectedItem(item);
    const cuotaFaltante = item.installment.cuotaTotal - item.installment.montoPagado;
    setMontoRecibido(cuotaFaltante);
    setPenalizacionCobrada(item.installment.penalizacionesMora || (item.isOverdue ? 150 : 0));
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
      const result = registerPayment({
        prestamoId: selectedItem.loan.id,
        numeroCuota: selectedItem.installment.numeroCuota,
        montoRecibido: Number(montoRecibido),
        penalizacionCobrada: Number(penalizacionCobrada),
        metodoPago,
        cobradorNombre: currentUser.name,
        nota,
      });

      if (result.success) {
        // Trigger Confetti Effect
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.7 },
        });

        setFeedbackMessage('¡Pago registrado con éxito!');
        setTimeout(() => {
          setSelectedItem(null);
          setFeedbackMessage(null);
        }, 1200);
      } else {
        setFeedbackMessage(result.message);
      }
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

  return (
    <div className="space-y-5 max-w-3xl mx-auto">
      {/* Mobile Header Banner */}
      <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Smartphone className="w-6 h-6 text-emerald-400" />
            <h1 className="text-xl font-extrabold text-white tracking-tight">Ruta de Cobranza en Campo</h1>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Sesión: <strong className="text-emerald-400">{currentUser.name}</strong> ({currentUser.role}) • Hoy: {formatDate(todayStr)}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Promotor Selector */}
          <div className="flex items-center gap-1.5 bg-slate-900/90 p-1.5 rounded-xl border border-slate-800 text-xs">
            <UserCheck className="w-4 h-4 text-emerald-400" />
            <select
              value={promotorFilter}
              onChange={(e) => setPromotorFilter(e.target.value)}
              className="bg-transparent text-white font-bold text-xs focus:outline-none"
            >
              <option value="todos">Todos los Promotores</option>
              {activePromotores.map((p) => (
                <option key={p.id} value={p.name}>
                  Ruta de {p.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Buscar cliente en ruta..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-900 border border-slate-800 text-white text-xs focus:outline-none focus:border-emerald-500"
        />
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 p-1 rounded-xl bg-slate-900/90 border border-slate-800 text-xs">
        <button
          onClick={() => setActiveTab('pendientes')}
          className={`flex-1 py-2.5 rounded-lg font-bold transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'pendientes'
              ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Clock className="w-3.5 h-3.5" /> Pendientes
        </button>

        <button
          onClick={() => setActiveTab('mora')}
          className={`flex-1 py-2.5 rounded-lg font-bold transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'mora'
              ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5" /> En Mora
        </button>

        <button
          onClick={() => setActiveTab('pagados')}
          className={`flex-1 py-2.5 rounded-lg font-bold transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'pagados'
              ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/20'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" /> Cobrados
        </button>
      </div>

      {/* Collection Cards List */}
      <div className="space-y-3">
        {filteredCollection.map((item, idx) => (
          <div
            key={`${item.loan.id}-${item.installment.numeroCuota}-${idx}`}
            className={`glass-panel p-4 rounded-2xl border transition-all ${
              item.isOverdue
                ? 'border-rose-500/30 bg-rose-950/10'
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
                  {formatDate(item.installment.fechaVencimiento)}
                </p>
              </div>

              <div>
                <span className="text-slate-400 text-[11px]">Monto a Cobrar:</span>
                <p className="font-black text-emerald-400 text-sm">
                  {formatCurrency(item.installment.cuotaTotal - item.installment.montoPagado)}
                </p>
              </div>
            </div>

            {/* Touch Action Buttons */}
            <div className="flex items-center gap-2 pt-1">
              {item.loan.clienteTelefono && (
                <a
                  href={`tel:${item.loan.clienteTelefono}`}
                  className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 flex items-center justify-center"
                  title="Llamar al cliente"
                >
                  <Phone className="w-4 h-4 text-emerald-400" />
                </a>
              )}

              {item.installment.estado !== 'Pagado' ? (
                <button
                  onClick={() => openPaymentModal(item)}
                  className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/20 transition-all active:scale-95"
                >
                  <DollarSign className="w-4 h-4 stroke-[3]" />
                  Registrar Cobro (${formatCurrency(item.installment.cuotaTotal - item.installment.montoPagado)})
                </button>
              ) : (
                <div className="flex-1 py-2 px-3 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-bold text-center flex items-center justify-center gap-1.5">
                  <Check className="w-4 h-4" /> Cobro Registrado
                </div>
              )}
            </div>
          </div>
        ))}

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
