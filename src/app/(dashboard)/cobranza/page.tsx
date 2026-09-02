'use client';

import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  CheckCircle2,
  AlertTriangle,
  Phone,
  DollarSign,
  Clock,
  Check,
  Search,
  Filter,
  Loader2,
  ShieldCheck,
  Calendar,
  XCircle,
  FileText,
} from 'lucide-react';
import { useImpulsoStore } from '@/store/useImpulsoStore';
import { InstallmentStatusBadge } from '@/components/shared/StatusBadges';
import { formatCurrency, formatDate, formatDateWithDay, getTodayDateString } from '@/lib/utils';
import { AmortizationInstallment, Loan, PaymentRecord } from '@/types';
import { registerPaymentAction, authorizePaymentAction } from '@/app/actions/paymentActions';

interface CollectionItem {
  loan: Loan;
  installment: AmortizationInstallment;
  isOverdue: boolean;
  isToday: boolean;
}

export default function CollectionPage() {
  const { loans, clients, users, payments, currentUser, loadDataFromDB } = useImpulsoStore();
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
  const isAdminUser = currentUser.role === 'Administrador';

  // Catálogo de promotores
  const promoterCatalog = users
    .filter((u) => u.estatus === 'Activo')
    .map((u) => ({
      name: u.name,
      role: u.role,
      diaCobro: u.diaCobroAsignado || 'Sin día',
    }));

  const [activeTab, setActiveTab] = useState<'pendientes' | 'mora' | 'pagados' | 'autorizaciones'>('pendientes');
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
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Extemporaneous Payment Fields
  const [esCobroExtemporaneo, setEsCobroExtemporaneo] = useState(false);
  const [fechaCobroReal, setFechaCobroReal] = useState(todayStr);
  const [motivoExtemporaneo, setMotivoExtemporaneo] = useState('');

  // Admin Reject Modal State
  const [rejectingPayment, setRejectingPayment] = useState<PaymentRecord | null>(null);
  const [motivoRechazoInput, setMotivoRechazoInput] = useState('');
  const [isAuthorizing, setIsAuthorizing] = useState(false);
  const [authFeedback, setAuthFeedback] = useState<{ id: string; message: string } | null>(null);

  // Extract collection items
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
        installment.estado === 'En Revisión' ||
        (installment.estado === 'Pagado' && (installment.fechaPagoReal === todayStr || installment.fechaPago?.startsWith(todayStr)))
      ) {
        collectionList.push({
          loan: {
            ...loan,
            promotorAsignado: assignedPromotorName,
          },
          installment: {
            ...installment,
            estado: isOverdue && installment.estado !== 'En Revisión' ? 'Vencido' : installment.estado,
          },
          isOverdue,
          isToday,
        });
      }
    });
  });

  const pendingAuthorizations = payments.filter((p) => p.estatus === 'Pendiente');

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
      return (item.isToday || item.isOverdue) && item.installment.estado !== 'Pagado';
    }
    if (activeTab === 'mora') {
      return item.isOverdue && item.installment.estado !== 'Pagado';
    }
    if (activeTab === 'pagados') {
      return item.installment.estado === 'Pagado';
    }
    return true;
  });

  const openPaymentModal = (item: CollectionItem) => {
    setSelectedItem(item);
    const cuotaFaltante = Math.round((item.installment.cuotaTotal - item.installment.montoPagado) * 100) / 100;
    const recargoMora = item.installment.recargoPenalizacion || item.installment.penalizacionesMora || (item.isOverdue ? 100 : 0);

    // FIX 1: Inicializar con el total sugerido (cuota + mora)
    setMontoRecibido(Math.round((cuotaFaltante + recargoMora) * 100) / 100);
    setPenalizacionCobrada(recargoMora);
    setMetodoPago('Efectivo');
    setNota('');
    setEsCobroExtemporaneo(false);
    setFechaCobroReal(item.installment.fechaVencimiento);
    setMotivoExtemporaneo('');
    setFeedbackMessage(null);
  };

  const handleRegisterPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem || isSubmitting) return;

    // --- VALIDACIONES SECUENCIALES VISUALES (DE ARRIBA HACIA ABAJO) ---
    // 1. Monto Recibido
    if (!montoRecibido || Number(montoRecibido) <= 0) {
      setFeedbackMessage('El Monto Recibido es obligatorio y debe ser mayor a $0.');
      return;
    }

    // 2. Validación de Cobro Extemporáneo (si está activado)
    if (esCobroExtemporaneo) {
      if (!fechaCobroReal || fechaCobroReal.trim() === '') {
        setFeedbackMessage('Debes indicar la fecha real en que recibiste el pago.');
        return;
      }
      if (fechaCobroReal > todayStr) {
        setFeedbackMessage('La fecha de cobro real no puede ser una fecha futura.');
        return;
      }
      if (!motivoExtemporaneo || motivoExtemporaneo.trim().length < 8) {
        setFeedbackMessage('El motivo o justificación del cobro extemporáneo es obligatorio (mínimo 8 caracteres).');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const result = await registerPaymentAction({
        prestamoId: selectedItem.loan.id,
        numeroCuota: selectedItem.installment.numeroCuota,
        montoRecibido: Number(montoRecibido),
        penalizacionCobrada: esCobroExtemporaneo ? 0 : Number(penalizacionCobrada),
        metodoPago,
        cobradorNombre: currentUser.name,
        nota,
        esExtemporaneo: esCobroExtemporaneo,
        fechaCobroReal: esCobroExtemporaneo ? fechaCobroReal : undefined,
        motivoExtemporaneo: esCobroExtemporaneo ? motivoExtemporaneo : undefined,
      });

      if (result.success) {
        setFeedbackMessage(result.message);
        await loadDataFromDB();

        if (!esCobroExtemporaneo) {
          confetti({
            particleCount: 80,
            spread: 60,
            origin: { y: 0.7 },
          });
        }

        setTimeout(() => {
          setSelectedItem(null);
          setFeedbackMessage(null);
        }, 1500);
      } else {
        setFeedbackMessage(result.message || 'Error al registrar el pago.');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al procesar el pago.';
      setFeedbackMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAuthorizeDecision = async (
    paymentId: string,
    decision: 'APROBAR' | 'RECHAZAR',
    motivoRechazo?: string
  ) => {
    setIsAuthorizing(true);
    try {
      const res = await authorizePaymentAction({
        paymentId,
        decision,
        adminNombre: currentUser.name,
        motivoRechazo,
      });

      if (res.success) {
        setAuthFeedback({ id: paymentId, message: res.message });
        await loadDataFromDB();
        if (decision === 'APROBAR') {
          confetti({
            particleCount: 60,
            spread: 50,
            origin: { y: 0.6 },
          });
        }
        setTimeout(() => {
          setAuthFeedback(null);
          setRejectingPayment(null);
          setMotivoRechazoInput('');
        }, 1400);
      } else {
        setAuthFeedback({ id: paymentId, message: res.message });
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al procesar dictamen.';
      setAuthFeedback({ id: paymentId, message });
    } finally {
      setIsAuthorizing(false);
    }
  };

  // Manejo estricto de tecla Escape según .agents/rules/modals.md
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (selectedItem && !isSubmitting) setSelectedItem(null);
        if (rejectingPayment && !isAuthorizing) setRejectingPayment(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedItem, isSubmitting, rejectingPayment, isAuthorizing]);

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
      <div className="flex flex-wrap rounded-xl bg-slate-900/80 p-1 border border-slate-800 text-xs gap-1">
        <button
          onClick={() => setActiveTab('pendientes')}
          className={`flex-1 min-w-[120px] py-2.5 rounded-lg font-bold transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'pendientes'
              ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Clock className="w-3.5 h-3.5" /> Ruta de Hoy ({collectionList.filter(i => (i.isToday || i.isOverdue) && i.installment.estado !== 'Pagado').length})
        </button>

        <button
          onClick={() => setActiveTab('mora')}
          className={`flex-1 min-w-[120px] py-2.5 rounded-lg font-bold transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'mora'
              ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5" /> En Mora ({collectionList.filter(i => i.isOverdue && i.installment.estado !== 'Pagado').length})
        </button>

        <button
          onClick={() => setActiveTab('pagados')}
          className={`flex-1 min-w-[120px] py-2.5 rounded-lg font-bold transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'pagados'
              ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/20'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" /> Cobrados Hoy ({collectionList.filter(i => i.installment.estado === 'Pagado').length})
        </button>

        {isAdminUser && (
          <button
            onClick={() => setActiveTab('autorizaciones')}
            className={`flex-1 min-w-[150px] py-2.5 rounded-lg font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'autorizaciones'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-amber-400 hover:text-amber-300'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            Autorizaciones ({pendingAuthorizations.length})
            {pendingAuthorizations.length > 0 && (
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping ml-0.5" />
            )}
          </button>
        )}
      </div>

      {/* VIEW: BANDEJA DE AUTORIZACIONES PENDIENTES (SOLO ADMIN) */}
      {activeTab === 'autorizaciones' && isAdminUser ? (
        <div className="space-y-3">
          {pendingAuthorizations.map((p) => (
            <div
              key={p.id}
              className="glass-panel p-4 rounded-2xl border border-amber-500/30 bg-amber-950/10 space-y-3 shadow-lg"
            >
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] font-mono font-bold text-amber-400 uppercase tracking-wider block">
                    Recibo: {p.folioRecibo} • Préstamo: {p.prestamoFolio}
                  </span>
                  <h3 className="font-extrabold text-white text-base leading-tight mt-0.5">
                    {p.clienteNombre}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Cobrado por: <strong className="text-slate-200">{p.cobradorNombre}</strong>
                  </p>
                </div>

                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  Pendiente de Aprobación
                </span>
              </div>

              {/* Data comparison grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-xs">
                <div>
                  <span className="text-slate-400 text-[11px] block">Cuota Solicitada:</span>
                  <strong className="text-white">Cuota #{p.numeroCuota}</strong>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px] block">Monto Cobrado:</span>
                  <strong className="text-emerald-400 font-mono text-sm">{formatCurrency(p.montoRecibido)}</strong>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px] block">Fecha Cobro Real:</span>
                  <strong className="text-amber-300 font-semibold">{p.fechaCobroReal || p.fechaPago}</strong>
                </div>
              </div>

              {/* Justification Box */}
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1">
                <span className="text-slate-400 font-bold text-[11px] flex items-center gap-1">
                  <FileText className="w-3 h-3 text-amber-400" /> Justificación del Promotor:
                </span>
                <p className="text-slate-200 italic">
                  &ldquo;{p.motivoExtemporaneo || 'Sin motivo reportado.'}&rdquo;
                </p>
              </div>

              {authFeedback?.id === p.id ? (
                <div className="p-3 text-center text-emerald-400 font-bold text-xs bg-emerald-500/10 rounded-xl border border-emerald-500/30 animate-pulse">
                  {authFeedback.message}
                </div>
              ) : (
                <div className="flex gap-2 pt-1">
                  <button
                    disabled={isAuthorizing}
                    onClick={() => setRejectingPayment(p)}
                    className="flex-1 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-rose-950/40 hover:text-rose-300 text-slate-300 border border-slate-700 font-bold text-xs transition-all disabled:opacity-50"
                  >
                    Rechazar
                  </button>
                  <button
                    disabled={isAuthorizing}
                    onClick={() => handleAuthorizeDecision(p.id, 'APROBAR')}
                    className="flex-2 py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
                  >
                    {isAuthorizing ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Check className="w-4 h-4 stroke-[3]" />
                    )}
                    Aprobar en Fecha (Condonar Mora)
                  </button>
                </div>
              )}
            </div>
          ))}

          {pendingAuthorizations.length === 0 && (
            <div className="p-12 text-center text-slate-500 glass-panel rounded-2xl border border-slate-800">
              No hay solicitudes de pagos extemporáneos pendientes de autorización.
            </div>
          )}
        </div>
      ) : (
        /* VIEW: LISTA NORMAL DE COBRANZA */
        <div className="space-y-3">
          {filteredCollection.map((item, idx) => {
            const isEnRevision = item.installment.estado === 'En Revisión';
            const recargoMoraCard = item.installment.recargoPenalizacion || item.installment.penalizacionesMora || (item.isOverdue ? 100 : 0);
            const cuotaFaltanteCard = Math.round((item.installment.cuotaTotal - item.installment.montoPagado) * 100) / 100;
            const totalACobrarCard = item.isOverdue && !item.installment.recargoPenalizacion ? cuotaFaltanteCard + recargoMoraCard : cuotaFaltanteCard;

            return (
              <div
                key={`${item.loan.id}-${item.installment.numeroCuota}-${idx}`}
                className={`glass-panel p-4 rounded-2xl border transition-all ${
                  isEnRevision
                    ? 'border-indigo-500/40 bg-indigo-950/20 shadow-md'
                    : item.isOverdue
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
                    {item.isOverdue && recargoMoraCard > 0 && !isEnRevision && (
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

                  {isEnRevision ? (
                    <div className="flex-1 py-3 px-3 rounded-xl bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 text-xs font-bold text-center flex items-center justify-center gap-1.5">
                      <Clock className="w-4 h-4 text-indigo-400" /> Solicitud en Revisión de Administrador
                    </div>
                  ) : item.installment.estado !== 'Pagado' ? (
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
      )}

      {/* MODAL EXPRESS DE COBRO EN CAMPO */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="glass-panel w-full max-w-md p-6 rounded-t-3xl sm:rounded-2xl border border-slate-800 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <div>
                <span className="text-[10px] uppercase tracking-wider font-extrabold text-emerald-400">
                  Recibo de Cobranza en Campo
                </span>
                <h2 className="text-lg font-extrabold text-white">{selectedItem.loan.clienteNombre}</h2>
              </div>
              <button
                type="button"
                onClick={() => setSelectedItem(null)}
                className="p-1 text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {feedbackMessage && !isSubmitting ? (
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

                {/* FIX 2: Penalización por Mora NO EDITABLE (Informativa y fija) */}
                {selectedItem.isOverdue && !esCobroExtemporaneo && (
                  <div className="p-3 rounded-xl bg-rose-950/30 border border-rose-500/30 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                      <div>
                        <span className="text-xs font-bold text-rose-300 block">Recargo por Mora:</span>
                        <span className="text-[10px] text-rose-400/80">Establecido por supervisor según contrato</span>
                      </div>
                    </div>
                    <strong className="text-rose-300 font-mono text-base font-black">
                      +{formatCurrency(penalizacionCobrada)}
                    </strong>
                  </div>
                )}

                {/* Banner Total Sugerido */}
                <div className="p-3.5 rounded-xl bg-slate-900 border border-emerald-500/40 flex justify-between items-center shadow-lg">
                  <div>
                    <span className="text-slate-200 font-extrabold text-xs block">Total a Recaudar al Cliente:</span>
                    {esCobroExtemporaneo ? (
                      <span className="text-[10px] text-indigo-400 font-bold">Cobro en fecha reportado (sin mora)</span>
                    ) : selectedItem.isOverdue ? (
                      <span className="text-[10px] text-rose-400 font-bold">⚠️ Incluye penalización por mora</span>
                    ) : null}
                  </div>
                  <strong className="text-emerald-400 font-black text-xl font-mono">
                    {formatCurrency(Number(montoRecibido))}
                  </strong>
                </div>

                {/* FIX 1: Monto Recibido Input (editable para registrar abonos o pagos completos) */}
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Monto Recibido ($ MXN)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={montoRecibido}
                    onChange={(e) => setMontoRecibido(Number(e.target.value))}
                    className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-emerald-400 font-black text-xl focus:outline-none focus:border-emerald-500"
                  />
                  {montoRecibido < (esCobroExtemporaneo ? selectedItem.installment.cuotaTotal : selectedItem.installment.cuotaTotal + penalizacionCobrada) && (
                    <p className="text-[11px] text-amber-400 mt-1">
                      ⚠️ El monto ingresado es menor al total sugerido.
                    </p>
                  )}
                </div>

                {/* SECCIÓN DE COBRO EXTEMPORÁNEO (SOLO SI TIENE MORA) */}
                {selectedItem.isOverdue && (
                  <div className="p-3.5 rounded-xl bg-slate-900/90 border border-indigo-500/40 space-y-3">
                    <label className="flex items-start gap-2.5 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={esCobroExtemporaneo}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setEsCobroExtemporaneo(checked);
                          const cuotaFaltante = Math.round((selectedItem.installment.cuotaTotal - selectedItem.installment.montoPagado) * 100) / 100;
                          if (checked) {
                            setMontoRecibido(cuotaFaltante);
                          } else {
                            setMontoRecibido(Math.round((cuotaFaltante + penalizacionCobrada) * 100) / 100);
                          }
                        }}
                        className="mt-0.5 w-4 h-4 rounded text-indigo-500 bg-slate-800 border-slate-700 focus:ring-indigo-500"
                      />
                      <div>
                        <span className="text-xs font-bold text-indigo-300 block">
                          ¿Cobraste esta cuota en fecha y no pudiste registrarla?
                        </span>
                        <span className="text-[10px] text-slate-400 block mt-0.5">
                          Indica la fecha real de cobro. Requerirá autorización del Administrador para aplicarse sin mora.
                        </span>
                      </div>
                    </label>

                    {esCobroExtemporaneo && (
                      <div className="space-y-3 pt-2 border-t border-indigo-500/20">
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                            Fecha Real de Recepción del Dinero *
                          </label>
                          <input
                            type="date"
                            max={todayStr}
                            value={fechaCobroReal}
                            onChange={(e) => setFechaCobroReal(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-indigo-500"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                            Motivo o Justificación del Retraso *
                          </label>
                          <textarea
                            rows={2}
                            placeholder="Ej. Sin señal telefónica en comunidad rural durante la ruta..."
                            value={motivoExtemporaneo}
                            onChange={(e) => setMotivoExtemporaneo(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-indigo-500 resize-none"
                          />
                        </div>
                      </div>
                    )}
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
                    placeholder="Ej. Entregó recibo en papel"
                    value={nota}
                    onChange={(e) => setNota(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs"
                  />
                </div>

                {feedbackMessage && (
                  <p className="text-rose-400 font-bold text-xs">{feedbackMessage}</p>
                )}

                <div className="pt-2 flex gap-2">
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
                    className={`w-2/3 py-3 rounded-xl font-extrabold text-xs shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                      esCobroExtemporaneo
                        ? 'bg-indigo-500 hover:bg-indigo-400 text-white shadow-indigo-500/20'
                        : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20'
                    }`}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" /> Procesando...
                      </>
                    ) : esCobroExtemporaneo ? (
                      'Enviar a Autorización'
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

      {/* MODAL DE RECHAZO DE PAGO EXTEMPORÁNEO (ADMINISTRADOR) */}
      {rejectingPayment && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-md p-6 rounded-2xl border border-rose-500/40 shadow-2xl space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                <XCircle className="w-5 h-5 text-rose-400" />
                Rechazar Cobro Extemporáneo
              </h3>
              <button
                type="button"
                onClick={() => setRejectingPayment(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="text-xs space-y-2 text-slate-300">
              <p>
                Al rechazar este pago, la cuota regresará a estado <strong>En Mora</strong> y se exigirá el pago de la penalización correspondiente.
              </p>
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Motivo del Rechazo *</label>
                <textarea
                  rows={3}
                  placeholder="Explica el motivo por el cual no procede la condonación..."
                  value={motivoRechazoInput}
                  onChange={(e) => setMotivoRechazoInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-rose-500 resize-none"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                disabled={isAuthorizing}
                onClick={() => setRejectingPayment(null)}
                className="w-1/3 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-semibold text-xs"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isAuthorizing || !motivoRechazoInput.trim()}
                onClick={() => handleAuthorizeDecision(rejectingPayment.id, 'RECHAZAR', motivoRechazoInput)}
                className="w-2/3 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-400 text-white font-bold text-xs shadow-lg shadow-rose-500/20 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isAuthorizing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Confirmar Rechazo'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
