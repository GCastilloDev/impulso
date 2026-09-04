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
  Layers,
  AlertCircle,
} from 'lucide-react';
import { useImpulsoStore } from '@/store/useImpulsoStore';
import { InstallmentStatusBadge } from '@/components/shared/StatusBadges';
import { formatCurrency, formatDateWithDay, getTodayDateString } from '@/lib/utils';
import { calculateLateFeeForOverduePayments } from '@/lib/financialCalculators';
import { AmortizationInstallment, FinancialProduct, Loan, PaymentRecord, CashClosure } from '@/types';
import { registerPaymentAction, authorizePaymentAction, registerFailedVisitAction } from '@/app/actions/paymentActions';
import { getClosurePreviewAction, createCashClosureAction, reconcileCashClosureAction } from '@/app/actions/closureActions';

interface CollectionItem {
  loan: Loan;
  installment: AmortizationInstallment;
  isOverdue: boolean;
  isToday: boolean;
}

/**
 * Calcula la penalización por mora de forma dinámica usando las reglas
 * reales configuradas en el producto financiero asociado al préstamo.
 */
function getInstallmentLateFee(
  installment: AmortizationInstallment,
  loan: Loan,
  productsList: FinancialProduct[],
  today: string
): number {
  if (installment.recargoPenalizacion && installment.recargoPenalizacion > 0) {
    return installment.recargoPenalizacion;
  }
  if (installment.penalizacionesMora && installment.penalizacionesMora > 0) {
    return installment.penalizacionesMora;
  }

  // REGLA DE NEGOCIO: Cuotas en estado 'Parcial' congelan la mora sobre el remanente
  if (installment.estado === 'Parcial') {
    return 0;
  }

  const isOverdue =
    installment.estado === 'Mora' ||
    installment.estado === 'Vencido' ||
    (installment.estado === 'Pendiente' && installment.fechaVencimiento < today);

  if (!isOverdue) return 0;

  const product = productsList.find(
    (p) => p.id === loan.productoId || p.nombre.toLowerCase() === loan.productoNombre.toLowerCase()
  );

  if (product) {
    return calculateLateFeeForOverduePayments(
      1,
      installment.cuotaTotal,
      product.tipoPenalizacionMora,
      product.valorPenalizacionMora
    );
  }

  return 0;
}

export default function CollectionPage() {
  const { loans, clients, users, products, payments, closures, currentUser, loadDataFromDB } = useImpulsoStore();
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

  // Catálogo de productos activos para filtro
  const activeProducts = products.filter((p) => p.activo && !p.eliminado);

  const [activeTab, setActiveTab] = useState<'pendientes' | 'mora' | 'pagados' | 'arqueo' | 'autorizaciones'>('pendientes');
  const [searchTerm, setSearchTerm] = useState('');
  const [promotorFilter, setPromotorFilter] = useState<string>(
    isPromotorUser ? currentUser.name : 'todos'
  );
  const [frecuenciaFilter, setFrecuenciaFilter] = useState<'todas' | 'diario' | 'semanal'>('todas');
  const [productoFilter, setProductoFilter] = useState<string>('todos');

  // Payment Modal State
  const [selectedItem, setSelectedItem] = useState<CollectionItem | null>(null);
  const [montoRecibido, setMontoRecibido] = useState<number>(0);
  const [penalizacionCobrada, setPenalizacionCobrada] = useState<number>(0);
  const [metodoPago, setMetodoPago] = useState<'Efectivo' | 'Transferencia' | 'Tarjeta'>('Efectivo');
  const [nota, setNota] = useState('');
  const [paymentSuccessMessage, setPaymentSuccessMessage] = useState<string | null>(null);
  const [paymentFormErrors, setPaymentFormErrors] = useState<{
    montoRecibido?: string;
    fechaCobroReal?: string;
    motivoExtemporaneo?: string;
    general?: string;
  }>({});
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

  // Failed Visit Modal State (Fuerza Mayor)
  const [failedVisitItem, setFailedVisitItem] = useState<CollectionItem | null>(null);
  const [motivoCausa, setMotivoCausa] = useState('Condiciones climáticas adversas / Inaccesibilidad en ruta');
  const [detallesVisita, setDetallesVisita] = useState('');
  const [isSubmittingFailedVisit, setIsSubmittingFailedVisit] = useState(false);
  const [failedVisitSuccess, setFailedVisitSuccess] = useState<string | null>(null);
  const [failedVisitErrors, setFailedVisitErrors] = useState<{ detallesVisita?: string; general?: string }>({});

  // Arqueo y Cierre de Ruta States
  const [closurePreview, setClosurePreview] = useState<{
    totalCobrado: number;
    totalEfectivo: number;
    totalTransferencia: number;
    cantidadCobros: number;
    pagosIds: string[];
    pagosSiguienteDia: { cantidad: number; total: number };
  } | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [folioDepositoInput, setFolioDepositoInput] = useState('');
  const [montoDepositadoInput, setMontoDepositadoInput] = useState<number | ''>('');
  const [notaCierreInput, setNotaCierreInput] = useState('');
  const [isSubmittingClosure, setIsSubmittingClosure] = useState(false);
  const [closureFeedback, setClosureFeedback] = useState<string | null>(null);

  // Admin Reject Closure Modal State
  const [rejectingClosure, setRejectingClosure] = useState<CashClosure | null>(null);
  const [motivoRechazoCierre, setMotivoRechazoCierre] = useState('');
  const [isReconciling, setIsReconciling] = useState(false);
  const [closureAuthFeedback, setClosureAuthFeedback] = useState<{ id: string; message: string } | null>(null);

  // Extract collection items
  const collectionList: CollectionItem[] = [];

  loans.forEach((loan) => {
    const client = clients.find((c) => c.id === loan.clienteId);
    const assignedPromotorName = client?.promotorAsignadoNombre || loan.promotorAsignado || 'Pedro Ramírez';

    loan.tablaAmortizacion.forEach((installment) => {
      const isParcial = installment.estado === 'Parcial';
      const isOverdue =
        installment.estado === 'Mora' ||
        installment.estado === 'Vencido' ||
        (installment.estado === 'Pendiente' && installment.fechaVencimiento < todayStr);

      const isToday = installment.fechaVencimiento === todayStr;

      // REGLA DE COBRANZA EN CAMPO:
      // Jamás mostrar cuotas futuras anticipadas (fechaVencimiento > todayStr)
      // Mostrar cuotas de hoy, en mora/vencidas, con abono parcial pendiente de liquidación o pagadas hoy
      if (
        isToday ||
        isOverdue ||
        isParcial ||
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
            estado: isOverdue && installment.estado !== 'En Revisión' && !isParcial ? 'Vencido' : installment.estado,
          },
          isOverdue: isOverdue && !isParcial,
          isToday,
        });
      }
    });
  });

  const pendingAuthorizations = payments.filter((p) => p.estatus === 'Pendiente');

  const filteredCollection = collectionList.filter((item) => {
    // 1. Filtro por Búsqueda (Cliente o Folio)
    const matchesSearch =
      item.loan.clienteNombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.loan.folio.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    // 2. Filtro por Promotor
    const matchesPromotor =
      promotorFilter === 'todos' ||
      item.loan.promotorAsignado.toLowerCase().includes(promotorFilter.toLowerCase());

    if (!matchesPromotor) return false;

    // 3. Filtro por Frecuencia de Pago (Diario / Semanal)
    if (frecuenciaFilter !== 'todas') {
      const matchesFrecuencia = item.loan.frecuenciaPago === frecuenciaFilter;
      if (!matchesFrecuencia) return false;
    }

    // 4. Filtro por Producto Financiero
    if (productoFilter !== 'todos') {
      const matchesProducto =
        item.loan.productoId === productoFilter ||
        item.loan.productoNombre.toLowerCase() === productoFilter.toLowerCase();
      if (!matchesProducto) return false;
    }

    // 5. Filtro por Pestaña
    if (activeTab === 'pendientes') {
      return (item.isToday || item.isOverdue || item.installment.estado === 'Parcial') && item.installment.estado !== 'Pagado';
    }
    if (activeTab === 'mora') {
      return item.isOverdue && item.installment.estado !== 'Pagado' && item.installment.estado !== 'Parcial';
    }
    if (activeTab === 'pagados') {
      return item.installment.estado === 'Pagado';
    }
    return true;
  });

  const openPaymentModal = (item: CollectionItem) => {
    setSelectedItem(item);
    const cuotaFaltante = Math.round((item.installment.cuotaTotal - item.installment.montoPagado) * 100) / 100;
    // Cálculo dinámico de mora desde el producto real del préstamo
    const recargoMora = getInstallmentLateFee(item.installment, item.loan, products, todayStr);

    setMontoRecibido(Math.round((cuotaFaltante + recargoMora) * 100) / 100);
    setPenalizacionCobrada(recargoMora);
    setMetodoPago('Efectivo');
    setNota('');
    setEsCobroExtemporaneo(false);
    // Para cobro extemporáneo, el límite es el vencimiento o hoy (el menor)
    const maxFecha = item.installment.fechaVencimiento <= todayStr ? item.installment.fechaVencimiento : todayStr;
    setFechaCobroReal(maxFecha);
    setMotivoExtemporaneo('');
    setPaymentSuccessMessage(null);
    setPaymentFormErrors({});
  };

  const handleRegisterPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem || isSubmitting) return;

    const errors: { montoRecibido?: string; fechaCobroReal?: string; motivoExtemporaneo?: string; general?: string } = {};

    // 1. Validación de Monto Recibido y Reglas de Abonos Parciales (Orden visual de arriba a abajo)
    if (!montoRecibido || Number(montoRecibido) <= 0) {
      errors.montoRecibido = 'El monto recibido es obligatorio y debe ser mayor a $0.';
    } else {
      const cuotaFaltante = Math.round((selectedItem.installment.cuotaTotal - (selectedItem.installment.montoPagado || 0)) * 100) / 100;
      const penalizacion = esCobroExtemporaneo ? 0 : Number(penalizacionCobrada);
      const abonoOrdinario = Math.max(0, Math.round((Number(montoRecibido) - penalizacion) * 100) / 100);

      if (abonoOrdinario <= 0) {
        errors.montoRecibido = 'El abono ordinario a la cuota debe ser mayor a $0.';
      } else if (cuotaFaltante >= 100 && abonoOrdinario < 100) {
        errors.montoRecibido = 'El abono mínimo permitido es de $100.00 (excepto cuando el remanente sea menor a $100.00).';
      } else if (abonoOrdinario > cuotaFaltante) {
        errors.montoRecibido = `El monto excede el saldo de la cuota ($${cuotaFaltante.toFixed(2)}). Máximo a recaudar: $${(cuotaFaltante + penalizacion).toFixed(2)}.`;
      }
    }

    // 2. Validación de Cobro Extemporáneo
    if (esCobroExtemporaneo) {
      const maxExtemporaneousDate = selectedItem.installment.fechaVencimiento <= todayStr
        ? selectedItem.installment.fechaVencimiento
        : todayStr;

      if (!fechaCobroReal || fechaCobroReal.trim() === '') {
        errors.fechaCobroReal = 'Debes seleccionar la fecha real en que recibiste el dinero mediante el calendario.';
      } else if (fechaCobroReal > maxExtemporaneousDate) {
        errors.fechaCobroReal = `La fecha real no puede ser posterior a ${maxExtemporaneousDate}.`;
      }

      if (!motivoExtemporaneo || motivoExtemporaneo.trim().length < 10) {
        errors.motivoExtemporaneo = 'Debes detallar la justificación del cobro extemporáneo (mínimo 10 caracteres).';
      }
    }

    // Si existen errores, no enviamos al backend y se resaltan los inputs visualmente
    if (Object.keys(errors).length > 0) {
      setPaymentFormErrors(errors);
      return;
    }

    setPaymentFormErrors({});
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
        setPaymentSuccessMessage(result.message);
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
          setPaymentSuccessMessage(null);
        }, 1500);
      } else {
        setPaymentFormErrors({ general: result.message || 'Error al registrar el pago.' });
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al procesar el pago.';
      setPaymentFormErrors({ general: message });
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

  const openFailedVisitModal = (item: CollectionItem) => {
    setFailedVisitItem(item);
    setMotivoCausa('Condiciones climáticas adversas / Inaccesibilidad en ruta');
    setDetallesVisita('');
    setFailedVisitSuccess(null);
    setFailedVisitErrors({});
  };

  const handleRegisterFailedVisit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!failedVisitItem || isSubmittingFailedVisit) return;

    if (!detallesVisita || detallesVisita.trim().length < 10) {
      setFailedVisitErrors({
        detallesVisita: 'Debes detallar la causa de fuerza mayor (mínimo 10 caracteres).',
      });
      return;
    }

    setFailedVisitErrors({});
    setIsSubmittingFailedVisit(true);
    try {
      const res = await registerFailedVisitAction({
        prestamoId: failedVisitItem.loan.id,
        numeroCuota: failedVisitItem.installment.numeroCuota,
        motivoCausa,
        detalles: detallesVisita,
        promotorNombre: currentUser.name,
      });

      if (res.success) {
        setFailedVisitSuccess(res.message);
        await loadDataFromDB();
        setTimeout(() => {
          setFailedVisitItem(null);
          setFailedVisitSuccess(null);
        }, 1600);
      } else {
        setFailedVisitErrors({ general: res.message || 'Error al reportar visita fallida.' });
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al procesar el reporte.';
      setFailedVisitErrors({ general: message });
    } finally {
      setIsSubmittingFailedVisit(false);
    }
  };

  const fetchClosurePreview = async () => {
    setIsLoadingPreview(true);
    try {
      const res = await getClosurePreviewAction(currentUser.name);
      if (res.success && res.data) {
        setClosurePreview(res.data);
        setMontoDepositadoInput(res.data.totalCobrado);
      } else {
        setClosurePreview(null);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingPreview(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'arqueo') {
      fetchClosurePreview();
    }
  }, [activeTab, payments]);

  const handleCreateClosure = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!closurePreview || isSubmittingClosure) return;

    if (!folioDepositoInput || folioDepositoInput.trim().length < 4) {
      setClosureFeedback('Debes ingresar el folio o comprobante bancario del depósito (mínimo 4 caracteres).');
      return;
    }

    if (Number(montoDepositadoInput) !== closurePreview.totalCobrado) {
      setClosureFeedback(`El depósito ($${Number(montoDepositadoInput).toFixed(2)}) debe coincidir exactamente al 100% con lo recaudado ($${closurePreview.totalCobrado.toFixed(2)}).`);
      return;
    }

    setIsSubmittingClosure(true);
    try {
      const res = await createCashClosureAction({
        promotorNombre: currentUser.name,
        folioDepositoBanco: folioDepositoInput,
        montoDepositado: Number(montoDepositadoInput),
        nota: notaCierreInput,
      });

      if (res.success) {
        setClosureFeedback(res.message);
        setFolioDepositoInput('');
        setNotaCierreInput('');
        await loadDataFromDB();
        await fetchClosurePreview();
        setTimeout(() => setClosureFeedback(null), 3000);
      } else {
        setClosureFeedback(res.message || 'Error al registrar el cierre.');
      }
    } catch (err) {
      setClosureFeedback('Error al procesar el cierre de ruta.');
    } finally {
      setIsSubmittingClosure(false);
    }
  };

  const handleReconcileClosure = async (closureId: string, decision: 'CONCILIAR' | 'RECHAZAR', motivoRechazo?: string) => {
    setIsReconciling(true);
    try {
      const res = await reconcileCashClosureAction({
        closureId,
        decision,
        adminNombre: currentUser.name,
        motivoRechazo,
      });

      if (res.success) {
        setClosureAuthFeedback({ id: closureId, message: res.message });
        await loadDataFromDB();
        setTimeout(() => {
          setClosureAuthFeedback(null);
          setRejectingClosure(null);
          setMotivoRechazoCierre('');
        }, 1500);
      } else {
        setClosureAuthFeedback({ id: closureId, message: res.message });
      }
    } catch (err) {
      setClosureAuthFeedback({ id: closureId, message: 'Error al conciliar arqueo.' });
    } finally {
      setIsReconciling(false);
    }
  };

  // Manejo de tecla Escape según .agents/rules/modals.md
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (selectedItem && !isSubmitting) setSelectedItem(null);
        if (rejectingPayment && !isAuthorizing) setRejectingPayment(null);
        if (failedVisitItem && !isSubmittingFailedVisit) setFailedVisitItem(null);
        if (rejectingClosure && !isReconciling) setRejectingClosure(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedItem, isSubmitting, rejectingPayment, isAuthorizing, failedVisitItem, isSubmittingFailedVisit, rejectingClosure, isReconciling]);

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

      {/* Filters Toolbar (Dinámico: Búsqueda, Promotor, Frecuencia y Producto) */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-800 space-y-3">
        <div className="flex flex-col md:flex-row gap-3 justify-between items-center">
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por Cliente o Folio..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-900/90 border border-slate-700 text-white text-xs focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            {/* Filtro Promotor */}
            <div className="flex items-center gap-1.5 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800 text-xs">
              <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="text-slate-400 font-medium">Promotor:</span>
              <select
                value={promotorFilter}
                onChange={(e) => setPromotorFilter(e.target.value)}
                className="bg-transparent text-white focus:outline-none capitalize cursor-pointer max-w-[130px] truncate"
              >
                {!isPromotorUser && <option value="todos" className="bg-slate-900">Todos</option>}
                {promoterCatalog.map((p) => (
                  <option key={p.name} value={p.name} className="bg-slate-900">
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Filtro Frecuencia */}
            <div className="flex items-center gap-1.5 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800 text-xs">
              <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="text-slate-400 font-medium">Frecuencia:</span>
              <select
                value={frecuenciaFilter}
                onChange={(e) => setFrecuenciaFilter(e.target.value as 'todas' | 'diario' | 'semanal')}
                className="bg-transparent text-white focus:outline-none cursor-pointer"
              >
                <option value="todas" className="bg-slate-900">Todas</option>
                <option value="diario" className="bg-slate-900">Diario</option>
                <option value="semanal" className="bg-slate-900">Semanal</option>
              </select>
            </div>

            {/* Filtro Producto Financiero */}
            <div className="flex items-center gap-1.5 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800 text-xs">
              <Layers className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="text-slate-400 font-medium">Producto:</span>
              <select
                value={productoFilter}
                onChange={(e) => setProductoFilter(e.target.value)}
                className="bg-transparent text-white focus:outline-none cursor-pointer max-w-[130px] truncate"
              >
                <option value="todos" className="bg-slate-900">Todos</option>
                {activeProducts.map((p) => (
                  <option key={p.id} value={p.id} className="bg-slate-900">
                    {p.nombre}
                  </option>
                ))}
              </select>
            </div>
          </div>
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

        <button
          onClick={() => setActiveTab('arqueo')}
          className={`flex-1 min-w-[130px] py-2.5 rounded-lg font-bold transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'arqueo'
              ? 'bg-teal-500 text-slate-950 shadow-md shadow-teal-500/20'
              : 'text-teal-400 hover:text-teal-300'
          }`}
        >
          <DollarSign className="w-3.5 h-3.5 stroke-[2.5]" /> Arqueo y Cierre
          {closures.filter(c => c.estatus === 'Pendiente').length > 0 && isAdminUser && (
            <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-slate-950 text-[10px] font-black">
              {closures.filter(c => c.estatus === 'Pendiente').length}
            </span>
          )}
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

      {/* VIEW: ARQUEO Y CIERRE DE RUTA (CORTE 16:00 HRS & CUADRE 100%) */}
      {activeTab === 'arqueo' && (
        <div className="space-y-6">
          {/* Card Resumen de la Jornada Actual */}
          <div className="glass-panel p-5 rounded-3xl border border-teal-500/30 bg-teal-950/10 space-y-4 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
              <div>
                <span className="text-[10px] font-mono font-bold text-teal-400 uppercase tracking-wider block">
                  Jornada de Cobranza del Día
                </span>
                <h3 className="text-lg font-extrabold text-white mt-0.5 flex items-center gap-2">
                  Arqueo de Ruta: <span className="text-teal-300">{currentUser.name}</span>
                </h3>
              </div>
              <div className="flex items-center gap-2 bg-slate-900/90 px-3 py-1.5 rounded-xl border border-slate-800 text-xs">
                <Clock className="w-4 h-4 text-amber-400" />
                <span className="text-slate-300">Corte Contable:</span>
                <strong className="text-amber-400 font-mono">16:00 hrs</strong>
              </div>
            </div>

            {isLoadingPreview ? (
              <div className="p-8 text-center space-y-2">
                <Loader2 className="w-6 h-6 text-teal-400 animate-spin mx-auto" />
                <p className="text-xs text-slate-400">Calculando arqueo en tiempo real...</p>
              </div>
            ) : closurePreview ? (
              <div className="space-y-4">
                {/* Métricas de lo recaudado */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800">
                    <span className="text-slate-400 text-[10px] block">Total a Depositar:</span>
                    <strong className="text-emerald-400 font-mono text-base font-black">
                      {formatCurrency(closurePreview.totalCobrado)}
                    </strong>
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800">
                    <span className="text-slate-400 text-[10px] block">Efectivo Físico:</span>
                    <strong className="text-white font-mono text-sm">
                      {formatCurrency(closurePreview.totalEfectivo)}
                    </strong>
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800">
                    <span className="text-slate-400 text-[10px] block">Transferencias:</span>
                    <strong className="text-white font-mono text-sm">
                      {formatCurrency(closurePreview.totalTransferencia)}
                    </strong>
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800">
                    <span className="text-slate-400 text-[10px] block">Cobros Realizados:</span>
                    <strong className="text-white font-mono text-sm">
                      {closurePreview.cantidadCobros} recibos
                    </strong>
                  </div>
                </div>

                {/* Alerta de cobros posteriores a las 16:00 hrs */}
                {closurePreview.pagosSiguienteDia.cantidad > 0 && (
                  <div className="p-3 rounded-xl bg-indigo-950/30 border border-indigo-500/30 text-xs text-indigo-300 flex items-start gap-2">
                    <Clock className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold block">Regla de Corte de las 16:00 hrs aplicada:</span>
                      <span>
                        Tienes <strong>{closurePreview.pagosSiguienteDia.cantidad} cobro(s)</strong> registrados después de las 16:00 hrs ({formatCurrency(closurePreview.pagosSiguienteDia.total)}). Por política institucional, se acumularán automáticamente en el arqueo del siguiente día.
                      </span>
                    </div>
                  </div>
                )}

                {/* Formulario de Cierre de Ruta (Promotor) */}
                {isPromotorUser && closurePreview.cantidadCobros > 0 && (
                  <form onSubmit={handleCreateClosure} className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
                    <h4 className="font-extrabold text-white text-xs flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-teal-400" />
                      Registro de Ficha de Depósito / Cierre de Ruta
                    </h4>

                    {closureFeedback && (
                      <div className="p-3 rounded-xl bg-teal-500/10 border border-teal-500/30 text-teal-300 font-bold text-xs text-center">
                        {closureFeedback}
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div>
                        <label className="block text-slate-300 font-semibold mb-1">
                          Folio de Depósito Bancario / Transferencia *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="Ej. DEP-9823412 o Folio SPEI"
                          value={folioDepositoInput}
                          onChange={(e) => setFolioDepositoInput(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-teal-500"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-300 font-semibold mb-1">
                          Monto Depositado en Banco ($ MXN) *
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          required
                          value={montoDepositadoInput}
                          onChange={(e) => setMontoDepositadoInput(Number(e.target.value))}
                          className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-emerald-400 font-mono font-bold text-xs focus:outline-none focus:border-teal-500"
                        />
                        <span className="text-[10px] text-slate-400 mt-0.5 block">
                          Debe coincidir exactamente con {formatCurrency(closurePreview.totalCobrado)} (100%).
                        </span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">
                        Notas u Observaciones del Cierre
                      </label>
                      <input
                        type="text"
                        placeholder="Ej. Sucursal bancaria Centro, depósito en ventanilla..."
                        value={notaCierreInput}
                        onChange={(e) => setNotaCierreInput(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-teal-500"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmittingClosure}
                      className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-black text-xs shadow-lg shadow-teal-500/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                    >
                      {isSubmittingClosure ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" /> Procesando Cierre...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4" /> Registrar Cierre de Ruta y Enviar a Conciliación ({formatCurrency(closurePreview.totalCobrado)})
                        </>
                      )}
                    </button>
                  </form>
                )}
              </div>
            ) : (
              <div className="p-6 text-center text-slate-400 text-xs">
                No hay cobros pendientes de corte para este promotor.
              </div>
            )}
          </div>

          {/* Historial y Conciliación de Cierres de Ruta */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-teal-400" />
                Historial de Cierres y Conciliación Bancaria
              </h3>
              <span className="text-xs text-slate-400">
                {closures.length} corte(s) registrado(s)
              </span>
            </div>

            {closures.map((c) => {
              const isPendiente = c.estatus === 'Pendiente';
              const isConciliado = c.estatus === 'Conciliado';
              return (
                <div
                  key={c.id}
                  className={`glass-panel p-4 rounded-2xl border transition-all ${
                    isPendiente
                      ? 'border-amber-500/40 bg-amber-950/10'
                      : isConciliado
                      ? 'border-emerald-500/30 bg-slate-900/60'
                      : 'border-rose-500/30 bg-rose-950/10'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-800/80">
                    <div>
                      <span className="text-[10px] font-mono font-bold text-teal-400 uppercase tracking-wider block">
                        {c.folioCierre} • Jornada: {c.fechaJornada} ({c.horaCorte} hrs)
                      </span>
                      <h4 className="font-extrabold text-white text-base mt-0.5">
                        Promotor: <span className="text-slate-200">{c.promotorNombre}</span>
                      </h4>
                    </div>

                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                        isPendiente
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : isConciliado
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                      }`}
                    >
                      {isPendiente && <Clock className="w-3.5 h-3.5 text-amber-400" />}
                      {isConciliado && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                      {c.estatus}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 my-3 p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs">
                    <div>
                      <span className="text-slate-400 text-[10px] block">Monto Depositado:</span>
                      <strong className="text-emerald-400 font-mono text-sm font-black">
                        {formatCurrency(c.totalCobrado)}
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] block">Folio Banco / Depósito:</span>
                      <strong className="text-white font-mono">{c.folioDepositoBanco}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] block">Desglose:</span>
                      <span className="text-slate-300">
                        {formatCurrency(c.totalEfectivo)} efec. / {formatCurrency(c.totalTransferencia)} transf.
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] block">Cobros incluidos:</span>
                      <strong className="text-white">{c.cantidadCobros} recibos</strong>
                    </div>
                  </div>

                  {c.nota && (
                    <p className="text-xs text-slate-300 italic mb-2">
                      Nota: &ldquo;{c.nota}&rdquo;
                    </p>
                  )}

                  {closureAuthFeedback?.id === c.id ? (
                    <div className="p-3 text-center text-emerald-400 font-bold text-xs bg-emerald-500/10 rounded-xl border border-emerald-500/30 animate-pulse">
                      {closureAuthFeedback.message}
                    </div>
                  ) : isAdminUser && isPendiente ? (
                    <div className="flex gap-2 pt-1 border-t border-slate-800">
                      <button
                        disabled={isReconciling}
                        onClick={() => setRejectingClosure(c)}
                        className="flex-1 py-2 px-3 rounded-xl bg-slate-800 hover:bg-rose-950/40 hover:text-rose-300 text-slate-300 border border-slate-700 font-bold text-xs transition-all disabled:opacity-50"
                      >
                        Rechazar Arqueo
                      </button>
                      <button
                        disabled={isReconciling}
                        onClick={() => handleReconcileClosure(c.id, 'CONCILIAR')}
                        className="flex-2 py-2 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
                      >
                        {isReconciling ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Conciliar Depósito al 100%
                          </>
                        )}
                      </button>
                    </div>
                  ) : null}
                </div>
              );
            })}

            {closures.length === 0 && (
              <div className="p-8 text-center text-slate-500 glass-panel rounded-2xl border border-slate-800 text-xs">
                Aún no hay cierres de ruta registrados en el sistema.
              </div>
            )}
          </div>
        </div>
      )}

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
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-bold text-amber-400 uppercase tracking-wider block">
                      {p.folioRecibo} • Préstamo: {p.prestamoFolio}
                    </span>
                    {p.esVisitaFallida && (
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        Fuerza Mayor ($0)
                      </span>
                    )}
                  </div>
                  <h3 className="font-extrabold text-white text-base leading-tight mt-0.5">
                    {p.clienteNombre}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Reportado por: <strong className="text-slate-200">{p.cobradorNombre}</strong>
                  </p>
                </div>

                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  {p.esVisitaFallida ? 'Exención en Revisión' : 'Pendiente de Aprobación'}
                </span>
              </div>

              {/* Data comparison grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-xs">
                <div>
                  <span className="text-slate-400 text-[11px] block">Cuota Afectada:</span>
                  <strong className="text-white">Cuota #{p.numeroCuota}</strong>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px] block">Monto Recaudado:</span>
                  <strong className={`font-mono text-sm ${p.esVisitaFallida ? 'text-amber-400' : 'text-emerald-400'}`}>
                    {p.esVisitaFallida ? '$0.00 (Visita no exitosa)' : formatCurrency(p.montoRecibido)}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px] block">Fecha Reportada:</span>
                  <strong className="text-amber-300 font-semibold">{p.fechaCobroReal || p.fechaPago}</strong>
                </div>
              </div>

              {/* Justification Box */}
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1">
                <span className="text-slate-400 font-bold text-[11px] flex items-center gap-1">
                  <FileText className="w-3 h-3 text-amber-400" />
                  {p.esVisitaFallida ? 'Causa de Fuerza Mayor Reportada:' : 'Justificación del Promotor:'}
                </span>
                <p className="text-slate-200 italic">
                  &ldquo;{p.motivoVisitaFallida || p.motivoExtemporaneo || p.nota || 'Sin motivo reportado.'}&rdquo;
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
                    {p.esVisitaFallida ? 'Rechazar Exención (Aplicar Mora)' : 'Rechazar'}
                  </button>
                  <button
                    disabled={isAuthorizing}
                    onClick={() => handleAuthorizeDecision(p.id, 'APROBAR')}
                    className="flex-2 py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
                  >
                    {isAuthorizing ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        {p.esVisitaFallida ? 'Autorizar Exención de Mora' : 'Aprobar Cobro'}
                      </>
                    )}
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
            // CÁLCULO DINÁMICO DE MORA SEGÚN EL PRODUCTO REAL
            const recargoMoraCard = getInstallmentLateFee(item.installment, item.loan, products, todayStr);
            const cuotaFaltanteCard = Math.round((item.installment.cuotaTotal - item.installment.montoPagado) * 100) / 100;
            // FIX CRÍTICO: Sumar cuota faltante + recargo cuando está en mora
            const totalACobrarCard = item.isOverdue && !isEnRevision
              ? Math.round((cuotaFaltanteCard + recargoMoraCard) * 100) / 100
              : cuotaFaltanteCard;

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
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <span className="text-[11px] text-emerald-400 font-semibold">
                        Promotor: {item.loan.promotorAsignado}
                      </span>
                      <span className="text-slate-600">•</span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800/80 text-slate-300 font-medium capitalize border border-slate-700/50">
                        {item.loan.productoNombre} ({item.loan.frecuenciaPago})
                      </span>
                    </div>
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
                    <div className="flex-1 flex flex-col sm:flex-row gap-2">
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
                      <button
                        type="button"
                        onClick={() => openFailedVisitModal(item)}
                        className="py-3 px-3.5 rounded-xl font-bold text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 hover:border-amber-500/50 hover:text-amber-300 transition-all flex items-center justify-center gap-1.5 shrink-0"
                        title="Reportar visita fallida por causa de fuerza mayor"
                      >
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                        Visita Fallida ($0)
                      </button>
                    </div>
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
              No hay cobros asignados con los filtros seleccionados.
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

            {paymentSuccessMessage ? (
              <div className="p-6 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto animate-bounce">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <p className="font-extrabold text-white text-base">{paymentSuccessMessage}</p>
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
                    <span>Producto:</span>
                    <strong className="text-white capitalize">{selectedItem.loan.productoNombre} ({selectedItem.loan.frecuenciaPago})</strong>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Cuota #:</span>
                    <strong>#{selectedItem.installment.numeroCuota} de {selectedItem.loan.plazoCantidad}</strong>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Valor Cuota Regular:</span>
                    <strong className="text-white">{formatCurrency(selectedItem.installment.cuotaTotal)}</strong>
                  </div>
                  {selectedItem.installment.montoPagado > 0 && (
                    <>
                      <div className="flex justify-between text-amber-400">
                        <span>Abonado Previamente:</span>
                        <strong className="font-mono">-{formatCurrency(selectedItem.installment.montoPagado)}</strong>
                      </div>
                      <div className="flex justify-between text-emerald-400 border-t border-slate-800 pt-1">
                        <span className="font-bold">Saldo Remanente de Cuota:</span>
                        <strong className="font-mono font-black">
                          {formatCurrency(selectedItem.installment.cuotaTotal - selectedItem.installment.montoPagado)}
                        </strong>
                      </div>
                    </>
                  )}
                </div>

                {/* Penalización por Mora NO EDITABLE */}
                {selectedItem.isOverdue && !esCobroExtemporaneo && (
                  <div className="p-3 rounded-xl bg-rose-950/30 border border-rose-500/30 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                      <div>
                        <span className="text-xs font-bold text-rose-300 block">Recargo por Mora:</span>
                        <span className="text-[10px] text-rose-400/80">Estipulado por contrato del producto</span>
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

                {/* Monto Recibido Input */}
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Monto Recibido ($ MXN) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={montoRecibido}
                    onChange={(e) => {
                      setMontoRecibido(Number(e.target.value));
                      setPaymentFormErrors((prev) => {
                        const next = { ...prev };
                        delete next.montoRecibido;
                        delete next.general;
                        return next;
                      });
                    }}
                    className={`w-full px-4 py-3 rounded-xl bg-slate-900 border text-emerald-400 font-black text-xl focus:outline-none transition-colors ${
                      paymentFormErrors.montoRecibido
                        ? 'border-rose-500 ring-1 ring-rose-500'
                        : 'border-slate-700 focus:border-emerald-500'
                    }`}
                  />
                  {paymentFormErrors.montoRecibido && (
                    <p className="text-xs text-rose-400 font-semibold mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      {paymentFormErrors.montoRecibido}
                    </p>
                  )}
                  {(() => {
                    const cuotaFaltante = Math.round((selectedItem.installment.cuotaTotal - (selectedItem.installment.montoPagado || 0)) * 100) / 100;
                    const totalEsperado = esCobroExtemporaneo ? cuotaFaltante : cuotaFaltante + penalizacionCobrada;
                    return (
                      <div className="mt-1 space-y-0.5">
                        <p className="text-[11px] text-slate-400">
                          {cuotaFaltante < 100
                            ? `💡 Saldo remanente menor a $100: abono exacto de ${formatCurrency(cuotaFaltante)} para liquidar la cuota.`
                            : '💡 Abono mínimo permitido: $100.00 (o liquidación completa).'}
                        </p>
                        {montoRecibido < totalEsperado && (
                          <p className="text-[11px] text-amber-400">
                            ⚠️ Se registrará como abono parcial con saldo remanente (sin mora adicional a futuro).
                          </p>
                        )}
                      </div>
                    );
                  })()}
                </div>

                {/* SECCIÓN DE COBRO EXTEMPORÁNEO */}
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
                            const maxExtemporaneousDate = selectedItem.installment.fechaVencimiento <= todayStr
                              ? selectedItem.installment.fechaVencimiento
                              : todayStr;
                            setFechaCobroReal(maxExtemporaneousDate);
                          } else {
                            setMontoRecibido(Math.round((cuotaFaltante + penalizacionCobrada) * 100) / 100);
                          }
                          setPaymentFormErrors({});
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

                    {esCobroExtemporaneo && (() => {
                      const maxExtemporaneousDate = selectedItem.installment.fechaVencimiento <= todayStr
                        ? selectedItem.installment.fechaVencimiento
                        : todayStr;

                      return (
                        <div className="space-y-3 pt-2 border-t border-indigo-500/20">
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <label className="text-[11px] font-semibold text-slate-300">
                                Fecha Real de Recepción del Dinero *
                              </label>
                              <span className="text-[10px] text-slate-400 font-mono">
                                Límite: {maxExtemporaneousDate}
                              </span>
                            </div>
                            <input
                              type="date"
                              max={maxExtemporaneousDate}
                              min={selectedItem.loan.fechaInicio || undefined}
                              value={fechaCobroReal}
                              onKeyDown={(e) => e.preventDefault()}
                              onClick={(e) => {
                                try {
                                  (e.currentTarget as HTMLInputElement).showPicker?.();
                                } catch {}
                              }}
                              onChange={(e) => {
                                const val = e.target.value;
                                if (!val) {
                                  setFechaCobroReal('');
                                  setPaymentFormErrors((prev) => ({
                                    ...prev,
                                    fechaCobroReal: 'Debes seleccionar la fecha real mediante el calendario.',
                                  }));
                                  return;
                                }
                                if (val > maxExtemporaneousDate) {
                                  setFechaCobroReal(maxExtemporaneousDate);
                                  setPaymentFormErrors((prev) => ({
                                    ...prev,
                                    fechaCobroReal: `La fecha real no puede ser posterior a ${maxExtemporaneousDate}.`,
                                  }));
                                } else {
                                  setFechaCobroReal(val);
                                  setPaymentFormErrors((prev) => {
                                    const next = { ...prev };
                                    delete next.fechaCobroReal;
                                    return next;
                                  });
                                }
                              }}
                              className={`w-full px-3 py-2 rounded-xl bg-slate-950 border text-white text-xs focus:outline-none cursor-pointer transition-colors ${
                                paymentFormErrors.fechaCobroReal
                                  ? 'border-rose-500 ring-1 ring-rose-500'
                                  : 'border-slate-700 focus:border-indigo-500'
                              }`}
                            />
                            {paymentFormErrors.fechaCobroReal ? (
                              <p className="text-[10px] text-rose-400 font-semibold mt-1 flex items-center gap-1">
                                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                                {paymentFormErrors.fechaCobroReal}
                              </p>
                            ) : (
                              <p className="text-[10px] text-slate-400 mt-1">
                                📅 Solo seleccionable mediante el calendario (fechas posteriores bloqueadas).
                              </p>
                            )}
                          </div>

                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <label className="text-[11px] font-semibold text-slate-300">
                                Motivo o Justificación del Retraso *
                              </label>
                              <span
                                className={`text-[10px] font-mono font-bold ${
                                  motivoExtemporaneo.trim().length >= 10
                                    ? 'text-emerald-400'
                                    : motivoExtemporaneo.trim().length > 0
                                    ? 'text-amber-400'
                                    : 'text-slate-400'
                                }`}
                              >
                                {motivoExtemporaneo.trim().length}/10 caracteres mín.
                              </span>
                            </div>
                            <textarea
                              rows={2}
                              placeholder="Ej. Sin señal telefónica en comunidad rural durante la ruta..."
                              value={motivoExtemporaneo}
                              onChange={(e) => {
                                const val = e.target.value;
                                setMotivoExtemporaneo(val);
                                if (val.trim().length >= 10) {
                                  setPaymentFormErrors((prev) => {
                                    const next = { ...prev };
                                    delete next.motivoExtemporaneo;
                                    return next;
                                  });
                                }
                              }}
                              className={`w-full px-3 py-2 rounded-xl bg-slate-950 border text-white text-xs focus:outline-none resize-none transition-colors ${
                                paymentFormErrors.motivoExtemporaneo
                                  ? 'border-rose-500 ring-1 ring-rose-500'
                                  : motivoExtemporaneo.trim().length >= 10
                                  ? 'border-emerald-500/60 focus:border-emerald-500'
                                  : motivoExtemporaneo.trim().length > 0
                                  ? 'border-amber-500/60 focus:border-amber-500'
                                  : 'border-slate-700 focus:border-indigo-500'
                              }`}
                            />
                            {paymentFormErrors.motivoExtemporaneo ? (
                              <p className="text-[10px] text-rose-400 font-semibold mt-1 flex items-center gap-1">
                                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                                {paymentFormErrors.motivoExtemporaneo}
                              </p>
                            ) : (
                              <p
                                className={`text-[10px] mt-1 ${
                                  motivoExtemporaneo.trim().length >= 10
                                    ? 'text-emerald-400'
                                    : 'text-slate-400'
                                }`}
                              >
                                {motivoExtemporaneo.trim().length >= 10
                                  ? '✓ Motivo suficiente para revisión del Administrador.'
                                  : `⚠️ Se requieren al menos 10 caracteres (faltan ${Math.max(
                                      0,
                                      10 - motivoExtemporaneo.trim().length
                                    )}).`}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })()}
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

                {paymentFormErrors.general && (
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 font-bold text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                    <span>{paymentFormErrors.general}</span>
                  </div>
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

      {/* MODAL DE REPORTE DE VISITA NO EXITOSA (FUERZA MAYOR) */}
      {failedVisitItem && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-md p-6 rounded-2xl border border-amber-500/40 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <div>
                <span className="text-[10px] uppercase tracking-wider font-extrabold text-amber-400 block">
                  Causa de Fuerza Mayor ($0)
                </span>
                <h2 className="text-base font-extrabold text-white">Reportar Visita No Exitosa</h2>
              </div>
              <button
                type="button"
                onClick={() => setFailedVisitItem(null)}
                className="p-1 text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {failedVisitSuccess ? (
              <div className="p-6 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto animate-bounce">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <p className="font-extrabold text-white text-sm">{failedVisitSuccess}</p>
              </div>
            ) : (
              <form onSubmit={handleRegisterFailedVisit} noValidate className="space-y-4 text-xs">
                {/* Cuota reference */}
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                  <div className="flex justify-between text-slate-300">
                    <span>Cliente:</span>
                    <strong className="text-white">{failedVisitItem.loan.clienteNombre}</strong>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Préstamo:</span>
                    <strong className="font-mono text-emerald-400">{failedVisitItem.loan.folio}</strong>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Cuota #:</span>
                    <strong>#{failedVisitItem.installment.numeroCuota} de {failedVisitItem.loan.plazoCantidad}</strong>
                  </div>
                </div>

                {/* Explicación de regla */}
                <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-500/30 flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-amber-200/90 leading-relaxed">
                    Esta opción congela la cuota en <strong>En Revisión</strong> y solicita la exención de mora al Administrador. El sistema auditará la causa reportada para autorizar que no se aplique penalización.
                  </p>
                </div>

                {failedVisitErrors.general && (
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 font-bold text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                    <span>{failedVisitErrors.general}</span>
                  </div>
                )}

                {/* Motivo de Fuerza Mayor Tipificado */}
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Causa Tipificada *</label>
                  <select
                    value={motivoCausa}
                    onChange={(e) => setMotivoCausa(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-amber-500"
                  >
                    <option value="Condiciones climáticas adversas / Inaccesibilidad en ruta">
                      Condiciones climáticas adversas / Inaccesibilidad en ruta
                    </option>
                    <option value="Enfermedad o urgencia médica del promotor">
                      Enfermedad o urgencia médica del promotor
                    </option>
                    <option value="Causa de fuerza mayor en la comunidad / Bloqueo">
                      Causa de fuerza mayor en la comunidad / Bloqueo
                    </option>
                    <option value="Cliente hospitalizado o emergencia demostrable">
                      Cliente hospitalizado o emergencia demostrable
                    </option>
                    <option value="Otro impedimento justificado">
                      Otro impedimento justificado
                    </option>
                  </select>
                </div>

                {/* Detalles y Justificación */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-slate-300 font-semibold">
                      Descripción / Evidencia del Hecho *
                    </label>
                    <span
                      className={`text-[10px] font-mono font-bold ${
                        detallesVisita.trim().length >= 10
                          ? 'text-emerald-400'
                          : 'text-amber-400'
                      }`}
                    >
                      {detallesVisita.trim().length}/10 caracteres mín.
                    </span>
                  </div>
                  <textarea
                    rows={3}
                    placeholder="Describe los hechos que impidieron el cobro (ej. inundación de camino de acceso, deslave, etc.)..."
                    value={detallesVisita}
                    onChange={(e) => {
                      const val = e.target.value;
                      setDetallesVisita(val);
                      if (val.trim().length >= 10) {
                        setFailedVisitErrors((prev) => {
                          const next = { ...prev };
                          delete next.detallesVisita;
                          return next;
                        });
                      }
                    }}
                    className={`w-full px-3 py-2 rounded-xl bg-slate-900 border text-white text-xs focus:outline-none resize-none transition-colors ${
                      failedVisitErrors.detallesVisita
                        ? 'border-rose-500 ring-1 ring-rose-500'
                        : detallesVisita.trim().length >= 10
                        ? 'border-emerald-500/60 focus:border-emerald-500'
                        : detallesVisita.trim().length > 0
                        ? 'border-amber-500/60 focus:border-amber-500'
                        : 'border-slate-700 focus:border-amber-500'
                    }`}
                  />
                  {failedVisitErrors.detallesVisita ? (
                    <p className="text-[10px] text-rose-400 font-semibold mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      {failedVisitErrors.detallesVisita}
                    </p>
                  ) : (
                    <p
                      className={`text-[10px] mt-1 ${
                        detallesVisita.trim().length >= 10
                          ? 'text-emerald-400'
                          : 'text-slate-400'
                      }`}
                    >
                      {detallesVisita.trim().length >= 10
                        ? '✓ Justificación suficiente para evaluación del Administrador.'
                        : `⚠️ Se requieren al menos 10 caracteres (faltan ${Math.max(
                            0,
                            10 - detallesVisita.trim().length
                          )}).`}
                    </p>
                  )}
                </div>

                {/* Botones de acción */}
                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    disabled={isSubmittingFailedVisit}
                    onClick={() => setFailedVisitItem(null)}
                    className="w-1/3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-all"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingFailedVisit}
                    className="w-2/3 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                  >
                    {isSubmittingFailedVisit ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" /> Registrando...
                      </>
                    ) : (
                      'Enviar a Autorización'
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
      {/* MODAL DE RECHAZO DE ARQUEO / CIERRE (ADMIN) */}
      {rejectingClosure && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-md p-6 rounded-2xl border border-rose-500/40 shadow-2xl space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                <XCircle className="w-5 h-5 text-rose-400" />
                Rechazar Cierre de Ruta ({rejectingClosure.folioCierre})
              </h3>
              <button
                type="button"
                onClick={() => setRejectingClosure(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="text-xs space-y-2 text-slate-300">
              <p>
                Al rechazar el arqueo, los cobros asociados serán liberados del cierre para que el promotor ({rejectingClosure.promotorNombre}) aclare la discrepancia bancaria.
              </p>
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Motivo de Discrepancia *</label>
                <textarea
                  rows={3}
                  placeholder="Ej. El folio de depósito no refleja fondos en la cuenta bancaria..."
                  value={motivoRechazoCierre}
                  onChange={(e) => setMotivoRechazoCierre(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-rose-500 resize-none"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                disabled={isReconciling}
                onClick={() => setRejectingClosure(null)}
                className="w-1/3 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-semibold text-xs"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isReconciling || !motivoRechazoCierre.trim()}
                onClick={() => handleReconcileClosure(rejectingClosure.id, 'RECHAZAR', motivoRechazoCierre)}
                className="w-2/3 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-400 text-white font-bold text-xs shadow-lg shadow-rose-500/20 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isReconciling ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Confirmar Rechazo'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
