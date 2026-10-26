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
  Loader2,
  ShieldCheck,
  Calendar,
  XCircle,
  FileText,
  AlertCircle,
  Receipt,
  RefreshCw,
} from 'lucide-react';
import { useImpulsoStore } from '@/store/useImpulsoStore';
import { formatCurrency, formatDateWithDay, getTodayDateString, cn } from '@/lib/utils';
import { calculateLateFeeForOverduePayments } from '@/lib/financialCalculators';
import { AmortizationInstallment, FinancialProduct, Loan, PaymentRecord, CashClosure, EstadoCuota } from '@/types';
import { registerPaymentAction, authorizePaymentAction, registerFailedVisitAction } from '@/app/actions/paymentActions';
import { getClosurePreviewAction, createCashClosureAction, reconcileCashClosureAction } from '@/app/actions/closureActions';

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { InstallmentStatusBadge } from '@/components/shared/StatusBadges';

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
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await loadDataFromDB();
    } finally {
      setIsRefreshing(false);
    }
  };

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
    pagos: Array<{
      id: string;
      folioRecibo: string;
      clienteNombre: string;
      prestamoFolio: string;
      numeroCuota: number;
      montoRecibido: number;
      penalizacionCobrada: number;
      metodoPago: string;
      esAbonoParcial: boolean;
      cobradorNombre: string;
      createdAt: string;
    }>;
    pagosSiguienteDia: {
      cantidad: number;
      total: number;
      pagos: Array<{
        id: string;
        folioRecibo: string;
        clienteNombre: string;
        prestamoFolio: string;
        numeroCuota: number;
        montoRecibido: number;
        penalizacionCobrada: number;
        metodoPago: string;
        esAbonoParcial: boolean;
        cobradorNombre: string;
        createdAt: string;
      }>;
    };
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

  // Cálculos de métricas rápidas de jornada
  const cobradoHoyPayments = payments.filter(
    (p) => p.fechaPago.startsWith(todayStr) || p.fechaCobroReal === todayStr
  );
  const totalCobradoHoy = cobradoHoyPayments.reduce((acc, p) => acc + p.montoRecibido, 0);
  const cantidadRecibosHoy = cobradoHoyPayments.length;

  const cuotasRutaPendientes = collectionList.filter(
    (i) => (i.isToday || i.isOverdue || i.installment.estado === 'Parcial') && i.installment.estado !== 'Pagado'
  );
  const totalPorCobrarHoy = cuotasRutaPendientes.reduce((acc, i) => {
    const cuotaFaltante = Math.round((i.installment.cuotaTotal - (i.installment.montoPagado || 0)) * 100) / 100;
    const recargo = getInstallmentLateFee(i.installment, i.loan, products, todayStr);
    return acc + cuotaFaltante + (i.isOverdue ? recargo : 0);
  }, 0);

  const cuotasEnMoraCount = collectionList.filter(
    (i) => i.isOverdue && i.installment.estado !== 'Pagado' && i.installment.estado !== 'Parcial'
  ).length;

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
      const cobradoHoy = item.installment.fechaPagoReal === todayStr || item.installment.fechaPago?.startsWith(todayStr);
      return item.installment.estado === 'Pagado' || (item.installment.estado === 'Parcial' && cobradoHoy);
    }
    return true;
  });

  const openPaymentModal = (item: CollectionItem) => {
    setSelectedItem(item);
    const cuotaFaltante = Math.round((item.installment.cuotaTotal - item.installment.montoPagado) * 100) / 100;
    const recargoMora = getInstallmentLateFee(item.installment, item.loan, products, todayStr);

    setMontoRecibido(Math.round((cuotaFaltante + recargoMora) * 100) / 100);
    setPenalizacionCobrada(recargoMora);
    setMetodoPago('Efectivo');
    setNota('');
    setEsCobroExtemporaneo(false);
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

    // 1. Validación de Monto Recibido y Reglas de Abonos Parciales
    const cuotaFaltante = Math.round((selectedItem.installment.cuotaTotal - (selectedItem.installment.montoPagado || 0)) * 100) / 100;
    const penalizacion = esCobroExtemporaneo ? 0 : Number(penalizacionCobrada);
    const totalEsperado = Math.round((cuotaFaltante + penalizacion) * 100) / 100;
    const abonoOrdinario = Math.max(0, Math.round((Number(montoRecibido) - penalizacion) * 100) / 100);

    if (!montoRecibido || Number(montoRecibido) <= 0) {
      errors.montoRecibido = 'El monto recibido es obligatorio y debe ser mayor a $0.';
    } else if (Number(montoRecibido) > totalEsperado) {
      errors.montoRecibido = `El monto excede el total a recaudar ($${totalEsperado.toFixed(2)}).`;
    } else if (totalEsperado >= 100 && Number(montoRecibido) < 100) {
      errors.montoRecibido = 'El abono mínimo permitido es de $100.00 (excepto cuando el saldo para liquidar sea menor a $100.00).';
    } else if (penalizacion > 0 && abonoOrdinario <= 0) {
      errors.montoRecibido = `El monto debe ser mayor a la penalización por mora ($${penalizacion.toFixed(2)}) para amortizar la cuota.`;
    }

    // 2. Validación de Cobro Extemporáneo
    if (esCobroExtemporaneo) {
      if (!fechaCobroReal || fechaCobroReal.trim() === '') {
        errors.fechaCobroReal = 'Debes seleccionar la fecha real en que recibiste el dinero mediante el calendario.';
      } else if (fechaCobroReal > todayStr) {
        errors.fechaCobroReal = `La fecha real no puede ser una fecha futura (límite máximo: hoy ${todayStr}).`;
      }

      if (!motivoExtemporaneo || motivoExtemporaneo.trim().length < 10) {
        errors.motivoExtemporaneo = 'Debes detallar la justificación del cobro extemporáneo (mínimo 10 caracteres).';
      }
    }

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
      const targetPromotor = isPromotorUser ? currentUser.name : (promotorFilter !== 'todos' ? promotorFilter : 'todos');
      const res = await getClosurePreviewAction(targetPromotor);
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
  }, [activeTab, payments, promotorFilter]);

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
    } catch (_err) {
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
    } catch (_err) {
      setClosureAuthFeedback({ id: closureId, message: 'Error al conciliar arqueo.' });
    } finally {
      setIsReconciling(false);
    }
  };

  // Manejo estricto de tecla Escape según .agents/rules/modals.md
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
      <div className="flex flex-col items-center justify-center min-h-[360px] p-12 space-y-3 bg-white border border-border rounded-[6px] shadow-2xs my-6">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <p className="text-[13px] font-medium text-text-muted">
          Consultando cobranza en tiempo real desde PostgreSQL...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Page Header (Stripe Dashboard Architecture) */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <h1 className="text-[22px] md:text-[24px] font-semibold text-foreground tracking-[-0.015em] leading-tight">
            Cobranza en Campo
          </h1>
          <p className="text-[13px] text-text-muted mt-1 font-normal">
            Ruta de recaudación diaria y cuotas vencidas asignadas por promotor.
          </p>

          {/* Quick KPI Row (Stripe Architecture: tnum font-mono) */}
          <div className="flex flex-wrap items-center gap-6 mt-4 pt-3 border-t border-border">
            <div className="flex flex-col">
              <span className="text-[11.5px] text-text-muted font-normal">Recaudado hoy</span>
              <span className="text-[15px] font-medium text-foreground font-mono mt-0.5">
                {formatCurrency(totalCobradoHoy)} <span className="text-[11px] font-sans text-text-muted">MXN</span>
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-[11.5px] text-text-muted font-normal">Recibos emitidos</span>
              <span className="text-[15px] font-medium text-foreground font-mono mt-0.5">
                {cantidadRecibosHoy} <span className="text-[11px] font-sans text-text-muted">recibos</span>
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-[11.5px] text-text-muted font-normal">Por cobrar hoy</span>
              <span className="text-[15px] font-medium text-foreground font-mono mt-0.5">
                {formatCurrency(totalPorCobrarHoy)} <span className="text-[11px] font-sans text-text-muted">MXN</span>
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-[11.5px] text-text-muted font-normal">Cuotas en mora</span>
              <span className={cn(
                "text-[15px] font-mono mt-0.5 font-medium",
                cuotasEnMoraCount > 0 ? "text-badge-danger-text" : "text-foreground"
              )}>
                {cuotasEnMoraCount} <span className="text-[11px] font-sans text-text-muted">vencidas</span>
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="gap-1.5"
            title="Sincronizar cobranza con PostgreSQL"
          >
            <RefreshCw className={cn("w-3.5 h-3.5", isRefreshing && "animate-spin")} />
            <span>Actualizar</span>
          </Button>
        </div>
      </div>

      {/* Stripe Sub-navigation Tabs */}
      <div className="flex items-center gap-1 border-b border-border overflow-x-auto scrollbar-none">
        <button
          type="button"
          onClick={() => setActiveTab('pendientes')}
          className={cn(
            "h-[36px] px-3.5 text-[13px] font-medium transition-colors border-b-2 flex items-center gap-2 whitespace-nowrap -mb-[1px] cursor-pointer",
            activeTab === 'pendientes'
              ? "border-primary text-primary font-semibold"
              : "border-transparent text-text-muted hover:text-foreground hover:border-border"
          )}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Ruta de Hoy</span>
          <Badge variant={activeTab === 'pendientes' ? 'default' : 'secondary'} className="text-[10.5px] px-1.5 py-0 font-mono">
            {collectionList.filter(i => (i.isToday || i.isOverdue || i.installment.estado === 'Parcial') && i.installment.estado !== 'Pagado').length}
          </Badge>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('mora')}
          className={cn(
            "h-[36px] px-3.5 text-[13px] font-medium transition-colors border-b-2 flex items-center gap-2 whitespace-nowrap -mb-[1px] cursor-pointer",
            activeTab === 'mora'
              ? "border-destructive text-destructive font-semibold"
              : "border-transparent text-text-muted hover:text-foreground hover:border-border"
          )}
        >
          <AlertTriangle className="w-3.5 h-3.5 text-badge-danger-text" />
          <span>En Mora</span>
          <Badge variant={activeTab === 'mora' ? 'destructive' : 'secondary'} className="text-[10.5px] px-1.5 py-0 font-mono">
            {collectionList.filter(i => i.isOverdue && i.installment.estado !== 'Pagado' && i.installment.estado !== 'Parcial').length}
          </Badge>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('pagados')}
          className={cn(
            "h-[36px] px-3.5 text-[13px] font-medium transition-colors border-b-2 flex items-center gap-2 whitespace-nowrap -mb-[1px] cursor-pointer",
            activeTab === 'pagados'
              ? "border-badge-success-text text-badge-success-text font-semibold"
              : "border-transparent text-text-muted hover:text-foreground hover:border-border"
          )}
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-badge-success-text" />
          <span>Cobrados Hoy</span>
          <Badge variant={activeTab === 'pagados' ? 'success' : 'secondary'} className="text-[10.5px] px-1.5 py-0 font-mono">
            {collectionList.filter(i => i.installment.estado === 'Pagado' || (i.installment.estado === 'Parcial' && (i.installment.fechaPagoReal === todayStr || i.installment.fechaPago?.startsWith(todayStr)))).length}
          </Badge>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('arqueo')}
          className={cn(
            "h-[36px] px-3.5 text-[13px] font-medium transition-colors border-b-2 flex items-center gap-2 whitespace-nowrap -mb-[1px] cursor-pointer",
            activeTab === 'arqueo'
              ? "border-primary text-primary font-semibold"
              : "border-transparent text-text-muted hover:text-foreground hover:border-border"
          )}
        >
          <DollarSign className="w-3.5 h-3.5" />
          <span>Arqueo y Cierre</span>
          {closures.filter(c => c.estatus === 'Pendiente').length > 0 && isAdminUser && (
            <Badge variant="warning" className="text-[10.5px] px-1.5 py-0 font-mono font-bold">
              {closures.filter(c => c.estatus === 'Pendiente').length}
            </Badge>
          )}
        </button>

        {isAdminUser && (
          <button
            type="button"
            onClick={() => setActiveTab('autorizaciones')}
            className={cn(
              "h-[36px] px-3.5 text-[13px] font-medium transition-colors border-b-2 flex items-center gap-2 whitespace-nowrap -mb-[1px] cursor-pointer",
              activeTab === 'autorizaciones'
                ? "border-primary text-primary font-semibold"
                : "border-transparent text-text-muted hover:text-foreground hover:border-border"
            )}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-badge-warning-text" />
            <span>Autorizaciones</span>
            {pendingAuthorizations.length > 0 && (
              <Badge variant="warning" className="text-[10.5px] px-1.5 py-0 font-mono font-bold">
                {pendingAuthorizations.length}
              </Badge>
            )}
          </button>
        )}
      </div>

      {/* Filters Toolbar */}
      <div className="bg-white border border-border rounded-[6px] p-3 shadow-2xs">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <Input
              type="text"
              placeholder="Buscar por cliente o folio..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-[34px] text-[13px] bg-white border-border rounded-[4px] placeholder:text-text-muted"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Filtro Promotor */}
            <div className="flex items-center gap-1.5 text-[13px]">
              <span className="text-text-muted text-[12px] font-medium">Promotor:</span>
              <select
                value={promotorFilter}
                onChange={(e) => setPromotorFilter(e.target.value)}
                className="h-[34px] rounded-[4px] border border-border bg-white text-text-secondary text-[13px] font-medium px-2.5 py-1 focus:ring-2 focus:ring-ring focus:outline-none capitalize cursor-pointer max-w-[150px] truncate"
              >
                {!isPromotorUser && <option value="todos">Todos</option>}
                {promoterCatalog.map((p) => (
                  <option key={p.name} value={p.name}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Filtro Frecuencia */}
            <div className="flex items-center gap-1.5 text-[13px]">
              <span className="text-text-muted text-[12px] font-medium">Frecuencia:</span>
              <select
                value={frecuenciaFilter}
                onChange={(e) => setFrecuenciaFilter(e.target.value as 'todas' | 'diario' | 'semanal')}
                className="h-[34px] rounded-[4px] border border-border bg-white text-text-secondary text-[13px] font-medium px-2.5 py-1 focus:ring-2 focus:ring-ring focus:outline-none cursor-pointer"
              >
                <option value="todas">Todas</option>
                <option value="diario">Diario</option>
                <option value="semanal">Semanal</option>
              </select>
            </div>

            {/* Filtro Producto */}
            <div className="flex items-center gap-1.5 text-[13px]">
              <span className="text-text-muted text-[12px] font-medium">Producto:</span>
              <select
                value={productoFilter}
                onChange={(e) => setProductoFilter(e.target.value)}
                className="h-[34px] rounded-[4px] border border-border bg-white text-text-secondary text-[13px] font-medium px-2.5 py-1 focus:ring-2 focus:ring-ring focus:outline-none cursor-pointer max-w-[150px] truncate"
              >
                <option value="todos">Todos</option>
                {activeProducts.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nombre}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* VIEW: ARQUEO Y CIERRE DE RUTA (CORTE 16:00 HRS & CUADRE 100%) */}
      {activeTab === 'arqueo' && (
        <div className="space-y-6">
          {/* Card Resumen de la Jornada Actual */}
          <Card className="border border-border rounded-[6px] shadow-2xs bg-white">
            <CardHeader className="p-5 border-b border-border">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-[11.5px] font-mono font-medium text-primary uppercase tracking-wider block">
                    Jornada de Cobranza del Día
                  </span>
                  <CardTitle className="text-[15px] font-semibold text-foreground mt-0.5">
                    Arqueo de Ruta: <span className="text-primary font-semibold">
                      {isPromotorUser ? currentUser.name : (promotorFilter !== 'todos' ? promotorFilter : 'Todos los Promotores')}
                    </span>
                  </CardTitle>
                </div>
                <div className="flex items-center gap-2 bg-badge-warning-bg px-2.5 py-1 rounded-[4px] border border-badge-warning-text/20 text-[12px]">
                  <Clock className="w-3.5 h-3.5 text-badge-warning-text shrink-0" />
                  <span className="text-badge-warning-text font-medium">Corte Contable:</span>
                  <strong className="text-badge-warning-text font-mono font-semibold">16:00 hrs</strong>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-5 space-y-6">
              {isLoadingPreview ? (
                <div className="py-12 text-center space-y-2">
                  <Loader2 className="w-6 h-6 text-primary animate-spin mx-auto" />
                  <p className="text-[13px] text-text-muted">Calculando arqueo en tiempo real...</p>
                </div>
              ) : closurePreview ? (
                <div className="space-y-6">
                  {/* Métricas de lo recaudado (Alineación contable font-mono text-right) */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3.5 rounded-[4px] bg-badge-success-bg/40 border border-badge-success-text/20">
                      <span className="text-text-muted text-[11.5px] font-medium block">Total a Depositar:</span>
                      <strong className="text-badge-success-text font-mono text-[18px] font-semibold block mt-1 text-right">
                        {formatCurrency(closurePreview.totalCobrado)}
                        <span className="text-[11px] font-sans text-text-muted ml-1">MXN</span>
                      </strong>
                    </div>
                    <div className="p-3.5 rounded-[4px] bg-surface-subtle border border-border">
                      <span className="text-text-muted text-[11.5px] font-medium block">Efectivo Físico:</span>
                      <strong className="text-foreground font-mono text-[15px] font-medium block mt-1 text-right">
                        {formatCurrency(closurePreview.totalEfectivo)}
                        <span className="text-[11px] font-sans text-text-muted ml-1">MXN</span>
                      </strong>
                    </div>
                    <div className="p-3.5 rounded-[4px] bg-surface-subtle border border-border">
                      <span className="text-text-muted text-[11.5px] font-medium block">Transferencias:</span>
                      <strong className="text-foreground font-mono text-[15px] font-medium block mt-1 text-right">
                        {formatCurrency(closurePreview.totalTransferencia)}
                        <span className="text-[11px] font-sans text-text-muted ml-1">MXN</span>
                      </strong>
                    </div>
                    <div className="p-3.5 rounded-[4px] bg-surface-subtle border border-border">
                      <span className="text-text-muted text-[11.5px] font-medium block">Cobros Realizados:</span>
                      <strong className="text-foreground font-mono text-[15px] font-medium block mt-1 text-right">
                        {closurePreview.cantidadCobros} <span className="text-[11px] font-sans text-text-muted">recibos</span>
                      </strong>
                    </div>
                  </div>

                  {/* Alerta de cobros posteriores a las 16:00 hrs */}
                  {closurePreview.pagosSiguienteDia.cantidad > 0 && (
                    <div className="p-4 rounded-[6px] bg-surface-subtle border border-border space-y-3">
                      <div className="flex items-start gap-2.5 text-[13px] text-text-secondary">
                        <Clock className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                        <div>
                          <span className="font-semibold text-foreground block text-[13px]">
                            Regla de Corte de las 16:00 hrs aplicada:
                          </span>
                          <p className="mt-0.5 text-text-muted text-[12.5px]">
                            Tienes <strong>{closurePreview.pagosSiguienteDia.cantidad} cobro(s)</strong> registrados después de las 16:00 hrs ({formatCurrency(closurePreview.pagosSiguienteDia.total)} MXN). Por política institucional, se acumularán automáticamente en el arqueo del siguiente día.
                          </p>
                        </div>
                      </div>
                      {closurePreview.pagosSiguienteDia.pagos && closurePreview.pagosSiguienteDia.pagos.length > 0 && (
                        <div className="rounded-[4px] border border-border overflow-hidden bg-white mt-2">
                          <Table>
                            <TableHeader className="bg-surface-subtle border-b border-border">
                              <TableRow className="hover:bg-transparent">
                                <TableHead className="text-[11px] py-2">Folio Recibo</TableHead>
                                <TableHead className="text-[11px] py-2">Cliente</TableHead>
                                <TableHead className="text-[11px] py-2">Cuota</TableHead>
                                <TableHead className="text-[11px] py-2 text-right">Monto</TableHead>
                                <TableHead className="text-[11px] py-2 text-center">Tipo</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {closurePreview.pagosSiguienteDia.pagos.map((p) => (
                                <TableRow key={p.id} className="hover:bg-surface-subtle/70">
                                  <TableCell className="py-2">
                                    <span className="font-mono text-[11px] px-1.5 py-0.5 rounded-[4px] bg-surface-subtle border border-border text-foreground font-medium">
                                      {p.folioRecibo}
                                    </span>
                                  </TableCell>
                                  <TableCell className="py-2 text-[12.5px] font-medium text-foreground">{p.clienteNombre}</TableCell>
                                  <TableCell className="py-2 font-mono text-text-secondary text-[12px]">#{p.numeroCuota}</TableCell>
                                  <TableCell className="py-2 text-right font-mono font-medium text-foreground text-[12.5px]">
                                    {formatCurrency(p.montoRecibido)}
                                  </TableCell>
                                  <TableCell className="py-2 text-center">
                                    {p.esAbonoParcial ? (
                                      <Badge variant="warning" className="text-[11px] px-1.5 py-0">Parcial</Badge>
                                    ) : (
                                      <Badge variant="success" className="text-[11px] px-1.5 py-0">Liquidada</Badge>
                                    )}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Desglose Detallado de Recibos en Arqueo */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-foreground text-[14px] flex items-center gap-2">
                        <Receipt className="w-4 h-4 text-primary" />
                        Recibos de la Jornada en Curso ({closurePreview.pagos?.length || 0})
                      </h4>
                      <span className="text-[12.5px] font-mono text-badge-success-text font-semibold text-right">
                        Subtotal: {formatCurrency(closurePreview.totalCobrado)} MXN
                      </span>
                    </div>

                    {closurePreview.pagos && closurePreview.pagos.length > 0 ? (
                      <div className="rounded-[4px] border border-border overflow-hidden bg-white">
                        <Table>
                          <TableHeader className="bg-surface-subtle border-b border-border">
                            <TableRow className="hover:bg-transparent">
                              <TableHead className="text-[11.5px]">Folio Recibo</TableHead>
                              <TableHead className="text-[11.5px]">Cliente / Préstamo</TableHead>
                              <TableHead className="text-[11.5px]">Cuota</TableHead>
                              <TableHead className="text-[11.5px]">Cobrador</TableHead>
                              <TableHead className="text-[11.5px]">Método</TableHead>
                              <TableHead className="text-[11.5px] text-right">Monto Recaudado</TableHead>
                              <TableHead className="text-[11.5px] text-center">Tipo</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {closurePreview.pagos.map((p) => {
                              const amortizacion = Math.max(0, Math.round((p.montoRecibido - (p.penalizacionCobrada || 0)) * 100) / 100);
                              return (
                                <TableRow key={p.id} className="hover:bg-surface-subtle/70">
                                  <TableCell className="py-2.5">
                                    <span className="font-mono text-[11px] px-1.5 py-0.5 rounded-[4px] bg-surface-subtle border border-border text-foreground font-medium">
                                      {p.folioRecibo}
                                    </span>
                                  </TableCell>
                                  <TableCell className="py-2.5">
                                    <span className="font-medium text-foreground block text-[13px]">{p.clienteNombre}</span>
                                    <span className="text-[11.5px] text-text-muted font-mono">{p.prestamoFolio}</span>
                                  </TableCell>
                                  <TableCell className="py-2.5 font-mono text-text-secondary text-[12.5px]">#{p.numeroCuota}</TableCell>
                                  <TableCell className="py-2.5 text-text-secondary text-[12.5px]">{p.cobradorNombre}</TableCell>
                                  <TableCell className="py-2.5">
                                    <Badge variant="outline" className="text-[11px]">{p.metodoPago}</Badge>
                                  </TableCell>
                                  <TableCell className="py-2.5 text-right font-mono font-medium text-foreground text-[13px]">
                                    {formatCurrency(p.montoRecibido)}
                                    {p.penalizacionCobrada > 0 && (
                                      <span className="block text-[11px] text-text-muted font-normal">
                                        (Abono: {formatCurrency(amortizacion)} + Mora: {formatCurrency(p.penalizacionCobrada)})
                                      </span>
                                    )}
                                  </TableCell>
                                  <TableCell className="py-2.5 text-center">
                                    {p.esAbonoParcial ? (
                                      <Badge variant="warning" className="text-[11px]">Parcial</Badge>
                                    ) : (
                                      <Badge variant="success" className="text-[11px]">Liquidada</Badge>
                                    )}
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </div>
                    ) : (
                      <div className="py-8 text-center text-text-muted text-[13px] border border-dashed border-border rounded-[4px]">
                        No hay recibos pendientes de corte para esta jornada.
                      </div>
                    )}
                  </div>

                  {/* Formulario de Cierre de Ruta (Promotor) */}
                  {isPromotorUser && closurePreview.cantidadCobros > 0 && (
                    <Card className="border border-border rounded-[6px] shadow-2xs bg-white">
                      <CardHeader className="p-4 border-b border-border">
                        <CardTitle className="text-[15px] font-semibold text-foreground flex items-center gap-2">
                          <ShieldCheck className="w-4 h-4 text-primary" />
                          Registro de Ficha de Depósito / Cierre de Ruta
                        </CardTitle>
                        <CardDescription className="text-[12.5px] text-text-muted font-normal">
                          Ingresa los datos del comprobante bancario para conciliar el arqueo del día.
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="p-4">
                        <form onSubmit={handleCreateClosure} className="space-y-4">
                          {closureFeedback && (
                            <div className="p-3 rounded-[4px] bg-surface-subtle border border-border text-foreground font-medium text-[13px] text-center">
                              {closureFeedback}
                            </div>
                          )}

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-foreground font-medium text-[13px] mb-1.5">
                                Folio de Depósito Bancario / Transferencia *
                              </label>
                              <Input
                                type="text"
                                required
                                placeholder="Ej. DEP-9823412 o Folio SPEI"
                                value={folioDepositoInput}
                                onChange={(e) => setFolioDepositoInput(e.target.value)}
                                className="h-[36px] text-[13px] bg-white border-border text-foreground"
                              />
                            </div>

                            <div>
                              <label className="block text-foreground font-medium text-[13px] mb-1.5">
                                Monto Depositado en Banco ($ MXN) *
                              </label>
                              <Input
                                type="number"
                                step="0.01"
                                inputMode="decimal"
                                required
                                value={montoDepositadoInput}
                                onChange={(e) => setMontoDepositadoInput(Number(e.target.value))}
                                className="h-[36px] text-[13px] font-mono text-right font-medium text-foreground bg-white border-border"
                              />
                              <span className="text-[11.5px] text-text-muted mt-1 block">
                                Debe coincidir exactamente con {formatCurrency(closurePreview.totalCobrado)} MXN (100%).
                              </span>
                            </div>
                          </div>

                          <div>
                            <label className="block text-foreground font-medium text-[13px] mb-1.5">
                              Notas u Observaciones del Cierre
                            </label>
                            <Input
                              type="text"
                              placeholder="Ej. Sucursal bancaria Centro, depósito en ventanilla..."
                              value={notaCierreInput}
                              onChange={(e) => setNotaCierreInput(e.target.value)}
                              className="h-[36px] text-[13px] bg-white border-border text-foreground"
                            />
                          </div>

                          <Button
                            type="submit"
                            variant="stripe-actions"
                            disabled={isSubmittingClosure}
                            className="w-full h-[38px] text-[13px] font-medium"
                          >
                            {isSubmittingClosure ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" /> Procesando Cierre...
                              </>
                            ) : (
                              <>
                                <CheckCircle2 className="w-4 h-4" /> Registrar Cierre de Ruta y Enviar a Conciliación ({formatCurrency(closurePreview.totalCobrado)} MXN)
                              </>
                            )}
                          </Button>
                        </form>
                      </CardContent>
                    </Card>
                  )}
                </div>
              ) : (
                <div className="py-8 text-center text-text-muted text-[13px]">
                  No hay cobros pendientes de corte para este promotor.
                </div>
              )}
            </CardContent>
          </Card>

          {/* Historial y Conciliación de Cierres de Ruta */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-[15px] font-semibold text-foreground flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" />
                Historial de Cierres y Conciliación Bancaria
              </h3>
              <span className="text-[12px] text-text-muted font-normal">
                {closures.length} corte(s) registrado(s)
              </span>
            </div>

            {closures.map((c) => {
              const isPendiente = c.estatus === 'Pendiente';
              const isConciliado = c.estatus === 'Conciliado';
              return (
                <Card
                  key={c.id}
                  className={cn(
                    "p-4 rounded-[6px] border shadow-2xs transition-colors",
                    isPendiente ? "border-badge-warning-text/40 bg-badge-warning-bg/20" : isConciliado ? "border-border bg-white" : "border-badge-danger-text/40 bg-badge-danger-bg/20"
                  )}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-border">
                    <div>
                      <span className="text-[11.5px] font-mono font-medium text-text-muted uppercase tracking-wider block">
                        {c.folioCierre} • Jornada: {c.fechaJornada} ({c.horaCorte} hrs)
                      </span>
                      <h4 className="font-semibold text-foreground text-[14px] mt-0.5">
                        Promotor: <span className="text-text-secondary font-medium">{c.promotorNombre}</span>
                      </h4>
                    </div>

                    <Badge
                      variant={isPendiente ? 'warning' : isConciliado ? 'success' : 'destructive'}
                      className="gap-1.5 py-0.5 px-2 text-[11px]"
                    >
                      {isPendiente && <Clock className="w-3 h-3" />}
                      {isConciliado && <CheckCircle2 className="w-3 h-3" />}
                      {c.estatus}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-3 p-3 rounded-[4px] bg-surface-subtle border border-border text-[12.5px]">
                    <div>
                      <span className="text-text-muted text-[11px] block font-medium">Monto Depositado:</span>
                      <strong className="text-foreground font-mono text-[14px] font-medium block text-right">
                        {formatCurrency(c.totalCobrado)} <span className="text-[11px] font-sans text-text-muted">MXN</span>
                      </strong>
                    </div>
                    <div>
                      <span className="text-text-muted text-[11px] block font-medium">Folio Banco / Depósito:</span>
                      <strong className="text-foreground font-mono text-[12px]">{c.folioDepositoBanco}</strong>
                    </div>
                    <div>
                      <span className="text-text-muted text-[11px] block font-medium">Desglose:</span>
                      <span className="text-text-secondary font-mono text-[12px]">
                        {formatCurrency(c.totalEfectivo)} efec. / {formatCurrency(c.totalTransferencia)} transf.
                      </span>
                    </div>
                    <div>
                      <span className="text-text-muted text-[11px] block font-medium">Cobros incluidos:</span>
                      <strong className="text-foreground">{c.cantidadCobros} recibos</strong>
                    </div>
                  </div>

                  {c.nota && (
                    <p className="text-[12.5px] text-text-muted italic mb-3">
                      Nota: &ldquo;{c.nota}&rdquo;
                    </p>
                  )}

                  {closureAuthFeedback?.id === c.id ? (
                    <div className="p-2.5 text-center text-badge-success-text font-medium text-[12.5px] bg-badge-success-bg rounded-[4px] border border-badge-success-text/20">
                      {closureAuthFeedback.message}
                    </div>
                  ) : isAdminUser && isPendiente ? (
                    <div className="flex gap-2.5 pt-2 border-t border-border">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={isReconciling}
                        onClick={() => setRejectingClosure(c)}
                        className="flex-1 text-badge-danger-text hover:bg-badge-danger-bg/50 border-border"
                      >
                        Rechazar Arqueo
                      </Button>
                      <Button
                        variant="stripe-actions"
                        size="sm"
                        disabled={isReconciling}
                        onClick={() => handleReconcileClosure(c.id, 'CONCILIAR')}
                        className="flex-2 gap-1.5"
                      >
                        {isReconciling ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Conciliar Depósito al 100%
                          </>
                        )}
                      </Button>
                    </div>
                  ) : null}
                </Card>
              );
            })}

            {closures.length === 0 && (
              <div className="p-8 text-center text-text-muted border border-border rounded-[6px] bg-white shadow-2xs text-[13px]">
                Aún no hay cierres de ruta registrados en el sistema.
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW: BANDEJA DE AUTORIZACIONES PENDIENTES (SOLO ADMIN) */}
      {activeTab === 'autorizaciones' && isAdminUser ? (
        <div className="space-y-4">
          {pendingAuthorizations.map((p) => (
            <Card
              key={p.id}
              className="p-5 border border-badge-warning-text/30 bg-white rounded-[6px] shadow-2xs space-y-4"
            >
              <div className="flex justify-between items-start gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px] px-1.5 py-0.5 rounded-[4px] bg-surface-subtle border border-border text-foreground font-medium">
                      {p.folioRecibo}
                    </span>
                    <span className="text-[12px] text-text-muted font-mono">
                      Préstamo: {p.prestamoFolio}
                    </span>
                    {p.esVisitaFallida && (
                      <Badge variant="warning" className="text-[10.5px]">
                        Fuerza Mayor ($0)
                      </Badge>
                    )}
                  </div>
                  <h3 className="font-semibold text-foreground text-[15px] mt-1">
                    {p.clienteNombre}
                  </h3>
                  <p className="text-[12.5px] text-text-muted mt-0.5">
                    Reportado por: <strong className="text-foreground font-medium">{p.cobradorNombre}</strong>
                  </p>
                </div>

                <Badge variant="warning" className="gap-1 py-0.5 px-2 text-[11px]">
                  <Clock className="w-3 h-3" />
                  {p.esVisitaFallida ? 'Exención en Revisión' : 'Pendiente'}
                </Badge>
              </div>

              {/* Data comparison grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3.5 rounded-[4px] bg-surface-subtle border border-border text-[12.5px]">
                <div>
                  <span className="text-text-muted text-[11px] block font-medium">Cuota Afectada:</span>
                  <strong className="text-foreground">Cuota #{p.numeroCuota}</strong>
                </div>
                <div>
                  <span className="text-text-muted text-[11px] block font-medium">Monto Recaudado:</span>
                  <strong className={cn(
                    "font-mono text-[13.5px] block text-right",
                    p.esVisitaFallida ? "text-text-muted" : "text-badge-success-text font-semibold"
                  )}>
                    {p.esVisitaFallida ? '$0.00 (Visita no exitosa)' : `${formatCurrency(p.montoRecibido)} MXN`}
                  </strong>
                </div>
                <div>
                  <span className="text-text-muted text-[11px] block font-medium">Fecha Reportada:</span>
                  <strong className="text-foreground font-mono">{p.fechaCobroReal || p.fechaPago}</strong>
                </div>
              </div>

              {/* Justification Box */}
              <div className="p-3 rounded-[4px] bg-surface-subtle border border-border text-[12.5px] space-y-1">
                <span className="text-text-muted font-medium text-[11.5px] flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-text-muted" />
                  {p.esVisitaFallida ? 'Causa de Fuerza Mayor Reportada:' : 'Justificación del Promotor:'}
                </span>
                <p className="text-foreground italic">
                  &ldquo;{p.motivoVisitaFallida || p.motivoExtemporaneo || p.nota || 'Sin motivo reportado.'}&rdquo;
                </p>
              </div>

              {authFeedback?.id === p.id ? (
                <div className="p-2.5 text-center text-badge-success-text font-medium text-[12.5px] bg-badge-success-bg rounded-[4px] border border-badge-success-text/20">
                  {authFeedback.message}
                </div>
              ) : (
                <div className="flex gap-2.5 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={isAuthorizing}
                    onClick={() => setRejectingPayment(p)}
                    className="flex-1 text-badge-danger-text hover:bg-badge-danger-bg/50 border-border"
                  >
                    {p.esVisitaFallida ? 'Rechazar Exención' : 'Rechazar'}
                  </Button>
                  <Button
                    variant="stripe-actions"
                    size="sm"
                    disabled={isAuthorizing}
                    onClick={() => handleAuthorizeDecision(p.id, 'APROBAR')}
                    className="flex-2 gap-1.5"
                  >
                    {isAuthorizing ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {p.esVisitaFallida ? 'Autorizar Exención de Mora' : 'Aprobar Cobro'}
                      </>
                    )}
                  </Button>
                </div>
              )}
            </Card>
          ))}

          {pendingAuthorizations.length === 0 && (
            <div className="p-12 text-center text-text-muted border border-border rounded-[6px] bg-white shadow-2xs text-[13px]">
              No hay solicitudes de pagos extemporáneos pendientes de autorización.
            </div>
          )}
        </div>
      ) : (
        /* VIEW: LISTADO TABULAR DE COBRANZA EN CAMPO (TABLE INSTITUCIONAL) */
        <Card className="border border-border rounded-[6px] bg-card overflow-hidden shadow-2xs">
          <Table>
            <TableHeader className="bg-surface-subtle border-b border-border">
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-[200px]">Folio & Cliente</TableHead>
                <TableHead className="w-[180px]">Producto & Cuota</TableHead>
                <TableHead className="w-[150px]">Promotor</TableHead>
                <TableHead className="w-[130px]">Vencimiento</TableHead>
                <TableHead className="w-[120px]">Estado</TableHead>
                <TableHead className="text-right w-[150px]">
                  {activeTab === 'pagados' ? 'Monto Recibido' : 'Total a Cobrar'}
                </TableHead>
                <TableHead className="text-right w-[160px]">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCollection.length > 0 ? (
                filteredCollection.map((item, idx) => {
                  const isEnRevision = item.installment.estado === 'En Revisión';
                  const recargoMoraCard = getInstallmentLateFee(item.installment, item.loan, products, todayStr);
                  const cuotaFaltanteCard = Math.round((item.installment.cuotaTotal - item.installment.montoPagado) * 100) / 100;
                  const totalACobrarCard = item.isOverdue && !isEnRevision
                    ? Math.round((cuotaFaltanteCard + recargoMoraCard) * 100) / 100
                    : cuotaFaltanteCard;

                  return (
                    <TableRow key={`${item.loan.id}-${item.installment.numeroCuota}-${idx}`} className="hover:bg-surface-subtle/70">
                      <TableCell className="py-2.5">
                        <div className="space-y-0.5">
                          <span className="font-mono text-[11px] px-1.5 py-0.5 rounded-[4px] bg-surface-subtle border border-border text-foreground font-medium">
                            {item.loan.folio}
                          </span>
                          <div className="font-medium text-foreground text-[13px] leading-snug">
                            {item.loan.clienteNombre}
                          </div>
                          {item.loan.clienteTelefono ? (
                            <a
                              href={`tel:${item.loan.clienteTelefono.replace(/\s+/g, '')}`}
                              className="inline-flex items-center gap-1 text-[11.5px] text-text-muted hover:text-primary font-mono transition-colors"
                              title={`Llamar a ${item.loan.clienteNombre}`}
                            >
                              <Phone className="w-3 h-3 text-text-muted" />
                              <span>{item.loan.clienteTelefono}</span>
                            </a>
                          ) : null}
                        </div>
                      </TableCell>

                      <TableCell className="py-2.5">
                        <div className="space-y-0.5">
                          <div className="font-medium text-foreground text-[13px]">
                            {item.loan.productoNombre}
                          </div>
                          <div className="text-[11.5px] text-text-muted capitalize">
                            Cuota #{item.installment.numeroCuota} de {item.loan.plazoCantidad} • {item.loan.frecuenciaPago}
                          </div>
                        </div>
                      </TableCell>

                      <TableCell className="py-2.5">
                        <div className="text-[13px] text-text-secondary font-medium">
                          {item.loan.promotorAsignado}
                        </div>
                      </TableCell>

                      <TableCell className="py-2.5 font-mono text-[12px]">
                        <div className={cn(item.isOverdue ? "text-badge-danger-text font-medium" : "text-text-secondary")}>
                          {formatDateWithDay(item.installment.fechaVencimiento)}
                        </div>
                        {item.isOverdue && !isEnRevision && (
                          <div className="text-[10.5px] text-badge-danger-text font-sans">
                            Vencida
                          </div>
                        )}
                      </TableCell>

                      <TableCell className="py-2.5">
                        <InstallmentStatusBadge status={item.installment.estado as EstadoCuota} />
                      </TableCell>

                      <TableCell className="py-2.5 text-right">
                        <div className={cn(
                          "font-mono font-medium text-[13px] text-right",
                          activeTab === 'pagados'
                            ? "text-badge-success-text"
                            : item.isOverdue
                            ? "text-badge-danger-text font-semibold"
                            : "text-foreground"
                        )}>
                          {formatCurrency(
                            activeTab === 'pagados'
                              ? item.installment.montoPagado || item.installment.cuotaTotal
                              : totalACobrarCard
                          )}
                          <span className="text-[10.5px] text-text-muted ml-1 font-sans">MXN</span>
                        </div>
                        {activeTab !== 'pagados' && item.isOverdue && recargoMoraCard > 0 && !isEnRevision && (
                          <div className="text-[11px] font-mono text-badge-danger-text text-right font-normal">
                            +{formatCurrency(recargoMoraCard)} mora
                          </div>
                        )}
                        {activeTab === 'pagados' && item.installment.estado === 'Parcial' && (
                          <div className="text-[11px] font-mono text-badge-warning-text text-right font-normal">
                            Restante: {formatCurrency(item.installment.saldoPendiente)}
                          </div>
                        )}
                      </TableCell>

                      <TableCell className="py-2.5 text-right">
                        {isEnRevision ? (
                          <Badge variant="outline" className="text-text-muted text-[11px] font-normal">
                            <Clock className="w-3 h-3 text-text-muted mr-1" /> En Revisión
                          </Badge>
                        ) : activeTab === 'pagados' ? (
                          item.installment.estado === 'Parcial' ? (
                            <Badge variant="warning" className="text-[11px]">
                              <Clock className="w-3 h-3 mr-1" /> Abono Parcial
                            </Badge>
                          ) : (
                            <Badge variant="success" className="text-[11px]">
                              <Check className="w-3 h-3 mr-1" /> Liquidado
                            </Badge>
                          )
                        ) : item.installment.estado !== 'Pagado' ? (
                          <div className="inline-flex items-center justify-end gap-1.5">
                            <Button
                              variant={item.isOverdue ? "destructive" : "stripe-actions"}
                              size="sm"
                              onClick={() => openPaymentModal(item)}
                              className="h-[30px] px-2.5 text-[12px] font-medium"
                            >
                              <DollarSign className="w-3.5 h-3.5" />
                              <span>Cobrar</span>
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => openFailedVisitModal(item)}
                              className="h-[30px] px-2 text-[12px] text-text-muted hover:text-text-secondary"
                              title="Reportar visita fallida ($0)"
                            >
                              <AlertTriangle className="w-3.5 h-3.5 text-badge-warning-text" />
                            </Button>
                          </div>
                        ) : (
                          <Badge variant="success" className="text-[11px]">
                            <Check className="w-3 h-3 mr-1" /> Registrado
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center text-text-muted text-[13px]">
                    No hay cobros asignados con los filtros seleccionados.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* MODAL EXPRESS DE COBRO EN CAMPO (RADIX DIALOG ESTRICTO) */}
      <Dialog
        open={!!selectedItem}
        onOpenChange={(open) => {
          if (!open && !isSubmitting) setSelectedItem(null);
        }}
      >
        <DialogContent
          onPointerDownOutside={(e) => e.preventDefault()}
          onInteractOutside={(e) => e.preventDefault()}
          className="sm:max-w-md max-h-[90vh] overflow-y-auto bg-white border border-border shadow-xl rounded-[8px] p-6 text-foreground"
        >
          <DialogHeader className="pb-3 border-b border-border">
            <DialogTitle className="text-[17px] font-semibold text-foreground">
              {selectedItem?.loan.clienteNombre}
            </DialogTitle>
            <DialogDescription className="text-[12px] text-text-muted uppercase tracking-wider font-medium">
              Recibo de Cobranza en Campo
            </DialogDescription>
          </DialogHeader>

          {paymentSuccessMessage ? (
            <div className="py-8 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-badge-success-bg text-badge-success-text flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <p className="font-semibold text-foreground text-[15px]">{paymentSuccessMessage}</p>
            </div>
          ) : selectedItem ? (
            <form onSubmit={handleRegisterPayment} noValidate className="space-y-4 text-[13px] pt-1">
              {/* Cuota details */}
              <div className="p-3.5 rounded-[4px] bg-surface-subtle border border-border space-y-2 text-[12.5px]">
                <div className="flex justify-between text-text-muted">
                  <span>Préstamo:</span>
                  <span className="font-mono text-foreground font-medium">{selectedItem.loan.folio}</span>
                </div>
                <div className="flex justify-between text-text-muted">
                  <span>Producto:</span>
                  <span className="text-foreground capitalize">{selectedItem.loan.productoNombre} ({selectedItem.loan.frecuenciaPago})</span>
                </div>
                <div className="flex justify-between text-text-muted">
                  <span>Cuota #:</span>
                  <span className="text-foreground">#{selectedItem.installment.numeroCuota} de {selectedItem.loan.plazoCantidad}</span>
                </div>
                <div className="flex justify-between text-text-muted">
                  <span>Valor Cuota Regular:</span>
                  <strong className="text-foreground font-mono font-medium text-right">
                    {formatCurrency(selectedItem.installment.cuotaTotal)}
                  </strong>
                </div>
                {selectedItem.installment.montoPagado > 0 && (
                  <>
                    <div className="flex justify-between text-badge-warning-text">
                      <span>Abonado Previamente:</span>
                      <strong className="font-mono text-right">-{formatCurrency(selectedItem.installment.montoPagado)}</strong>
                    </div>
                    <div className="flex justify-between text-foreground border-t border-border pt-1.5 font-medium">
                      <span>Saldo Remanente de Cuota:</span>
                      <strong className="font-mono text-right">
                        {formatCurrency(selectedItem.installment.cuotaTotal - selectedItem.installment.montoPagado)}
                      </strong>
                    </div>
                  </>
                )}
              </div>

              {/* Penalización por Mora NO EDITABLE */}
              {selectedItem.isOverdue && !esCobroExtemporaneo && (
                <div className="p-3 rounded-[4px] bg-badge-danger-bg/40 border border-badge-danger-text/20 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-badge-danger-text shrink-0" />
                    <div>
                      <span className="text-[12.5px] font-semibold text-badge-danger-text block">Recargo por Mora:</span>
                      <span className="text-[11px] text-text-muted">Estipulado por contrato del producto</span>
                    </div>
                  </div>
                  <strong className="text-badge-danger-text font-mono text-[15px] font-semibold text-right">
                    +{formatCurrency(penalizacionCobrada)}
                  </strong>
                </div>
              )}

              {/* Banner Total Sugerido */}
              <div className="p-3.5 rounded-[4px] bg-surface-subtle border border-border flex justify-between items-center">
                <div>
                  <span className="text-foreground font-semibold text-[13px] block">Total a Recaudar:</span>
                  {esCobroExtemporaneo ? (
                    <span className="text-[11.5px] text-primary font-medium">Cobro en fecha reportado (sin mora)</span>
                  ) : selectedItem.isOverdue ? (
                    <span className="text-[11.5px] text-badge-danger-text font-normal">Incluye penalización por mora</span>
                  ) : null}
                </div>
                <strong className="text-foreground font-semibold text-[20px] font-mono text-right">
                  {formatCurrency(Number(montoRecibido))} <span className="text-[12px] font-sans text-text-muted">MXN</span>
                </strong>
              </div>

              {/* Monto Recibido Input (font-mono text-right) */}
              <div>
                <label className="block text-foreground font-medium text-[13px] mb-1.5">
                  Monto Recibido ($ MXN) *
                </label>
                <Input
                  type="number"
                  step="0.01"
                  inputMode="decimal"
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
                  className={cn(
                    "h-[40px] text-[18px] font-mono text-right font-semibold bg-white border-border rounded-[4px]",
                    paymentFormErrors.montoRecibido ? "border-destructive ring-1 ring-destructive" : ""
                  )}
                />
                {paymentFormErrors.montoRecibido && (
                  <p className="text-[11.5px] text-destructive font-medium mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    {paymentFormErrors.montoRecibido}
                  </p>
                )}
                {(() => {
                  const cuotaFaltante = Math.round((selectedItem.installment.cuotaTotal - (selectedItem.installment.montoPagado || 0)) * 100) / 100;
                  const totalEsperado = esCobroExtemporaneo ? cuotaFaltante : cuotaFaltante + penalizacionCobrada;
                  return (
                    <div className="mt-1 space-y-0.5 text-[11.5px]">
                      <p className="text-text-muted">
                        {totalEsperado < 100
                          ? `Saldo menor a $100: abono exacto de ${formatCurrency(totalEsperado)} para liquidar.`
                          : 'Abono mínimo institucional: $100.00 (o liquidación completa).'}
                      </p>
                      {montoRecibido < totalEsperado && (
                        <p className="text-badge-warning-text font-medium">
                          Se registrará como abono parcial con congelamiento de mora en remanente.
                        </p>
                      )}
                    </div>
                  );
                })()}
              </div>

              {/* Cobro Extemporáneo */}
              {selectedItem.isOverdue && (
                <div className="p-3.5 rounded-[4px] bg-surface-subtle border border-border space-y-3">
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
                      className="mt-0.5 w-3.5 h-3.5 rounded-[2px] text-primary border-border focus:ring-ring cursor-pointer"
                    />
                    <div>
                      <span className="text-[12.5px] font-medium text-foreground block">
                        ¿Cobraste esta cuota en fecha y no pudiste registrarla?
                      </span>
                      <span className="text-[11.5px] text-text-muted block mt-0.5">
                        Indica la fecha real de cobro. Requerirá autorización del Administrador para aplicarse sin mora.
                      </span>
                    </div>
                  </label>

                  {esCobroExtemporaneo && (
                    <div className="space-y-3 pt-2.5 border-t border-border">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-[12px] font-medium text-foreground">
                            Fecha Real de Recepción del Dinero *
                          </label>
                          <span className="text-[11px] text-text-muted font-mono">
                            Límite: Hoy ({todayStr})
                          </span>
                        </div>
                        <Input
                          type="date"
                          max={todayStr}
                          value={fechaCobroReal}
                          onKeyDown={(e) => {
                            if (e.key !== 'Tab' && e.key !== 'Escape') {
                              e.preventDefault();
                            }
                          }}
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
                            if (val > todayStr) {
                              setFechaCobroReal(todayStr);
                              setPaymentFormErrors((prev) => ({
                                ...prev,
                                fechaCobroReal: `La fecha real no puede ser una fecha futura (límite: ${todayStr}).`,
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
                          className={cn(
                            "h-[36px] text-[13px] bg-white text-foreground cursor-pointer rounded-[4px]",
                            paymentFormErrors.fechaCobroReal ? "border-destructive ring-1 ring-destructive" : ""
                          )}
                        />
                        {paymentFormErrors.fechaCobroReal && (
                          <p className="text-[11.5px] text-destructive font-medium mt-1 flex items-center gap-1">
                            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                            {paymentFormErrors.fechaCobroReal}
                          </p>
                        )}
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-[12px] font-medium text-foreground">
                            Motivo o Justificación del Retraso *
                          </label>
                          <span className={cn(
                            "text-[11px] font-mono font-medium",
                            motivoExtemporaneo.trim().length >= 10 ? "text-badge-success-text" : "text-badge-warning-text"
                          )}>
                            {motivoExtemporaneo.trim().length}/10 car. mín.
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
                          className={cn(
                            "w-full px-3 py-2 rounded-[4px] bg-white border text-foreground text-[12.5px] focus:outline-none focus:ring-2 focus:ring-ring resize-none transition-colors",
                            paymentFormErrors.motivoExtemporaneo
                              ? "border-destructive ring-1 ring-destructive"
                              : motivoExtemporaneo.trim().length >= 10
                              ? "border-badge-success-text/50"
                              : "border-border"
                          )}
                        />
                        {paymentFormErrors.motivoExtemporaneo && (
                          <p className="text-[11.5px] text-destructive font-medium mt-1 flex items-center gap-1">
                            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                            {paymentFormErrors.motivoExtemporaneo}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Método de Pago */}
              <div>
                <label className="block text-foreground font-medium text-[13px] mb-1.5">Método de Pago</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Efectivo', 'Transferencia', 'Tarjeta'] as const).map((method) => (
                    <Button
                      key={method}
                      type="button"
                      variant={metodoPago === method ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setMetodoPago(method)}
                      className="h-[34px] text-[12.5px]"
                    >
                      {method}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Nota Opcional */}
              <div>
                <label className="block text-foreground font-medium text-[13px] mb-1.5">Comentario o Nota (Opcional)</label>
                <Input
                  type="text"
                  placeholder="Ej. Entregó recibo en papel"
                  value={nota}
                  onChange={(e) => setNota(e.target.value)}
                  className="h-[36px] text-[13px] bg-white border-border text-foreground rounded-[4px]"
                />
              </div>

              {paymentFormErrors.general && (
                <div className="p-3 rounded-[4px] bg-badge-danger-bg/40 border border-badge-danger-text/20 text-badge-danger-text font-medium text-[12.5px] flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-badge-danger-text" />
                  <span>{paymentFormErrors.general}</span>
                </div>
              )}

              <div className="pt-2 flex gap-2.5">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isSubmitting}
                  onClick={() => setSelectedItem(null)}
                  className="w-1/3 h-[36px]"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  variant="stripe-actions"
                  size="sm"
                  disabled={isSubmitting}
                  className="w-2/3 h-[36px]"
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
                </Button>
              </div>
            </form>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* MODAL DE RECHAZO DE PAGO EXTEMPORÁNEO (ADMINISTRADOR) */}
      <Dialog
        open={!!rejectingPayment}
        onOpenChange={(open) => {
          if (!open && !isAuthorizing) setRejectingPayment(null);
        }}
      >
        <DialogContent
          onPointerDownOutside={(e) => e.preventDefault()}
          onInteractOutside={(e) => e.preventDefault()}
          className="sm:max-w-md bg-white text-foreground border border-border shadow-xl rounded-[8px] p-6"
        >
          <DialogHeader className="pb-3 border-b border-border">
            <DialogTitle className="text-[17px] font-semibold text-destructive flex items-center gap-2">
              <XCircle className="w-4 h-4 text-destructive" />
              Rechazar Cobro Extemporáneo
            </DialogTitle>
            <DialogDescription className="text-[12.5px] text-text-muted">
              Dictamen de autorización para {rejectingPayment?.clienteNombre}
            </DialogDescription>
          </DialogHeader>

          <div className="text-[13px] space-y-3 text-text-secondary pt-1">
            <p>
              Al rechazar este pago, la cuota regresará a estado <strong>En Mora</strong> y se exigirá el pago de la penalización correspondiente.
            </p>
            <div>
              <label className="block text-foreground font-medium text-[13px] mb-1.5">
                Motivo del Rechazo *
              </label>
              <textarea
                rows={3}
                placeholder="Explica el motivo por el cual no procede la condonación..."
                value={motivoRechazoInput}
                onChange={(e) => setMotivoRechazoInput(e.target.value)}
                className="w-full px-3 py-2 rounded-[4px] bg-white border border-border text-foreground text-[13px] focus:outline-none focus:ring-2 focus:ring-ring resize-none"
              />
            </div>
          </div>

          <div className="flex gap-2.5 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isAuthorizing}
              onClick={() => setRejectingPayment(null)}
              className="w-1/3 h-[36px]"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              disabled={isAuthorizing || !motivoRechazoInput.trim()}
              onClick={() => handleAuthorizeDecision(rejectingPayment!.id, 'RECHAZAR', motivoRechazoInput)}
              className="w-2/3 h-[36px]"
            >
              {isAuthorizing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Confirmar Rechazo'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* MODAL DE REPORTE DE VISITA NO EXITOSA (FUERZA MAYOR) */}
      <Dialog
        open={!!failedVisitItem}
        onOpenChange={(open) => {
          if (!open && !isSubmittingFailedVisit) setFailedVisitItem(null);
        }}
      >
        <DialogContent
          onPointerDownOutside={(e) => e.preventDefault()}
          onInteractOutside={(e) => e.preventDefault()}
          className="sm:max-w-md max-h-[90vh] overflow-y-auto bg-white text-foreground border border-border shadow-xl rounded-[8px] p-6"
        >
          <DialogHeader className="pb-3 border-b border-border">
            <DialogTitle className="text-[17px] font-semibold text-foreground flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-badge-warning-text" />
              Reportar Visita No Exitosa
            </DialogTitle>
            <DialogDescription className="text-[12px] font-medium text-badge-warning-text uppercase tracking-wider">
              Causa de Fuerza Mayor ($0)
            </DialogDescription>
          </DialogHeader>

          {failedVisitSuccess ? (
            <div className="py-8 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-badge-success-bg text-badge-success-text flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <p className="font-semibold text-foreground text-[15px]">{failedVisitSuccess}</p>
            </div>
          ) : failedVisitItem ? (
            <form onSubmit={handleRegisterFailedVisit} noValidate className="space-y-4 text-[13px] pt-1">
              {/* Cuota reference */}
              <div className="p-3.5 rounded-[4px] bg-surface-subtle border border-border space-y-2 text-[12.5px]">
                <div className="flex justify-between text-text-muted">
                  <span>Cliente:</span>
                  <strong className="text-foreground">{failedVisitItem.loan.clienteNombre}</strong>
                </div>
                <div className="flex justify-between text-text-muted">
                  <span>Préstamo:</span>
                  <strong className="font-mono text-foreground font-medium">{failedVisitItem.loan.folio}</strong>
                </div>
                <div className="flex justify-between text-text-muted">
                  <span>Cuota #:</span>
                  <strong className="text-foreground">#{failedVisitItem.installment.numeroCuota} de {failedVisitItem.loan.plazoCantidad}</strong>
                </div>
              </div>

              {/* Explicación de regla */}
              <div className="p-3 rounded-[4px] bg-badge-warning-bg/40 border border-badge-warning-text/20 flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-badge-warning-text shrink-0 mt-0.5" />
                <p className="text-[12px] text-text-secondary leading-relaxed font-normal">
                  Esta opción congela la cuota en <strong>En Revisión</strong> y solicita la exención de mora al Administrador. El sistema auditará la causa reportada para autorizar que no se aplique penalización.
                </p>
              </div>

              {failedVisitErrors.general && (
                <div className="p-3 rounded-[4px] bg-badge-danger-bg/40 border border-badge-danger-text/20 text-badge-danger-text font-medium text-[12.5px] flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-badge-danger-text" />
                  <span>{failedVisitErrors.general}</span>
                </div>
              )}

              {/* Motivo de Fuerza Mayor Tipificado */}
              <div>
                <label className="block text-foreground font-medium text-[13px] mb-1.5">Causa Tipificada *</label>
                <select
                  value={motivoCausa}
                  onChange={(e) => setMotivoCausa(e.target.value)}
                  className="w-full h-[36px] px-3 rounded-[4px] bg-white border border-border text-foreground text-[13px] font-medium focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer"
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
                  <label className="text-foreground font-medium text-[13px]">
                    Descripción / Evidencia del Hecho *
                  </label>
                  <span className={cn(
                    "text-[11px] font-mono font-medium",
                    detallesVisita.trim().length >= 10 ? "text-badge-success-text" : "text-badge-warning-text"
                  )}>
                    {detallesVisita.trim().length}/10 car. mín.
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
                  className={cn(
                    "w-full px-3 py-2 rounded-[4px] bg-white border text-foreground text-[12.5px] focus:outline-none focus:ring-2 focus:ring-ring resize-none transition-colors",
                    failedVisitErrors.detallesVisita
                      ? "border-destructive ring-1 ring-destructive"
                      : detallesVisita.trim().length >= 10
                      ? "border-badge-success-text/50"
                      : "border-border"
                  )}
                />
                {failedVisitErrors.detallesVisita && (
                  <p className="text-[11.5px] text-destructive font-medium mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    {failedVisitErrors.detallesVisita}
                  </p>
                )}
              </div>

              {/* Botones de acción */}
              <div className="flex gap-2.5 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isSubmittingFailedVisit}
                  onClick={() => setFailedVisitItem(null)}
                  className="w-1/3 h-[36px]"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  variant="stripe-actions"
                  size="sm"
                  disabled={isSubmittingFailedVisit}
                  className="w-2/3 h-[36px]"
                >
                  {isSubmittingFailedVisit ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Registrando...
                    </>
                  ) : (
                    'Enviar a Autorización'
                  )}
                </Button>
              </div>
            </form>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* MODAL DE RECHAZO DE ARQUEO / CIERRE (ADMIN) */}
      <Dialog
        open={!!rejectingClosure}
        onOpenChange={(open) => {
          if (!open && !isReconciling) setRejectingClosure(null);
        }}
      >
        <DialogContent
          onPointerDownOutside={(e) => e.preventDefault()}
          onInteractOutside={(e) => e.preventDefault()}
          className="sm:max-w-md bg-white text-foreground border border-border shadow-xl rounded-[8px] p-6"
        >
          <DialogHeader className="pb-3 border-b border-border">
            <DialogTitle className="text-[17px] font-semibold text-destructive flex items-center gap-2">
              <XCircle className="w-4 h-4 text-destructive" />
              Rechazar Cierre ({rejectingClosure?.folioCierre})
            </DialogTitle>
            <DialogDescription className="text-[12.5px] text-text-muted">
              Discrepancia en arqueo de {rejectingClosure?.promotorNombre}
            </DialogDescription>
          </DialogHeader>

          <div className="text-[13px] space-y-3 text-text-secondary pt-1">
            <p>
              Al rechazar el arqueo, los cobros asociados serán liberados del cierre para que el promotor ({rejectingClosure?.promotorNombre}) aclare la discrepancia bancaria.
            </p>
            <div>
              <label className="block text-foreground font-medium text-[13px] mb-1.5">
                Motivo de Discrepancia *
              </label>
              <textarea
                rows={3}
                placeholder="Ej. El folio de depósito no refleja fondos en la cuenta bancaria..."
                value={motivoRechazoCierre}
                onChange={(e) => setMotivoRechazoCierre(e.target.value)}
                className="w-full px-3 py-2 rounded-[4px] bg-white border border-border text-foreground text-[13px] focus:outline-none focus:ring-2 focus:ring-ring resize-none"
              />
            </div>
          </div>

          <div className="flex gap-2.5 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isReconciling}
              onClick={() => setRejectingClosure(null)}
              className="w-1/3 h-[36px]"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              disabled={isReconciling || !motivoRechazoCierre.trim()}
              onClick={() => handleReconcileClosure(rejectingClosure!.id, 'RECHAZAR', motivoRechazoCierre)}
              className="w-2/3 h-[36px]"
            >
              {isReconciling ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Confirmar Rechazo'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
