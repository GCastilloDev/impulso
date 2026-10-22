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
  Receipt,
} from 'lucide-react';
import { useImpulsoStore } from '@/store/useImpulsoStore';
import { formatCurrency, formatDateWithDay, getTodayDateString } from '@/lib/utils';
import { calculateLateFeeForOverduePayments } from '@/lib/financialCalculators';
import { AmortizationInstallment, FinancialProduct, Loan, PaymentRecord, CashClosure } from '@/types';
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

/**
 * Badge accesible con contraste WCAG AAA para estados de cuotas
 */
function RenderInstallmentBadge({ status }: { status: string }) {
  switch (status) {
    case 'Pagado':
      return (
        <Badge variant="success" className="gap-1.5 py-1 px-3 text-xs font-bold shrink-0">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-800" />
          <span>Pagado</span>
        </Badge>
      );
    case 'Mora':
    case 'Vencido':
      return (
        <Badge
          variant="destructive"
          className="gap-1.5 py-1 px-3 text-xs font-extrabold bg-rose-100 text-rose-900 border-rose-300 shadow-xs shrink-0"
        >
          <AlertTriangle className="w-3.5 h-3.5 text-rose-800" />
          <span>En Mora</span>
        </Badge>
      );
    case 'Parcial':
      return (
        <Badge variant="warning" className="gap-1.5 py-1 px-3 text-xs font-bold shrink-0">
          <Clock className="w-3.5 h-3.5 text-amber-800" />
          <span>Parcial</span>
        </Badge>
      );
    case 'En Revisión':
      return (
        <Badge
          variant="warning"
          className="gap-1.5 py-1 px-3 text-xs font-bold bg-indigo-100 text-indigo-900 border-indigo-300 shrink-0"
        >
          <Clock className="w-3.5 h-3.5 text-indigo-800" />
          <span>En Revisión</span>
        </Badge>
      );
    case 'Pendiente':
    default:
      return (
        <Badge
          variant="outline"
          className="gap-1.5 py-1 px-3 text-xs font-semibold text-muted-foreground border-border bg-muted/40 shrink-0"
        >
          <Clock className="w-3.5 h-3.5 text-muted-foreground" />
          <span>Pendiente</span>
        </Badge>
      );
  }
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
      <Card className="flex flex-col items-center justify-center min-h-[400px] p-12 space-y-4 my-8 shadow-sm">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
        <p className="text-base font-semibold text-muted-foreground">
          Consultando cobranza en tiempo real desde PostgreSQL...
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-foreground flex items-center gap-3 tracking-tight">
            <span className="p-2.5 rounded-2xl bg-emerald-100 text-emerald-800 inline-flex shadow-xs">
              <DollarSign className="w-7 h-7 stroke-[2.5]" />
            </span>
            Cobranza en Campo (Día Actual)
          </h1>
          <p className="text-base text-muted-foreground font-medium mt-1">
            Ruta de recaudación diaria y cuotas vencidas asignadas por promotor.
          </p>
        </div>
      </div>

      {/* Filters Toolbar (Dinámico: Búsqueda, Promotor, Frecuencia y Producto) */}
      <Card className="p-4 shadow-sm">
        <div className="flex flex-col md:flex-row gap-3 justify-between items-center">
          <div className="relative w-full md:w-80">
            <Search className="w-5 h-5 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <Input
              type="text"
              placeholder="Buscar por cliente o folio..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-11 h-12 text-base bg-card text-foreground border-input"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
            {/* Filtro Promotor */}
            <div className="flex items-center gap-2 bg-muted/60 px-3.5 py-2 rounded-xl border border-border text-sm min-h-[44px]">
              <Filter className="w-4 h-4 text-muted-foreground shrink-0" />
              <span className="text-muted-foreground font-semibold">Promotor:</span>
              <select
                value={promotorFilter}
                onChange={(e) => setPromotorFilter(e.target.value)}
                className="bg-transparent text-foreground font-semibold focus:outline-none capitalize cursor-pointer max-w-[150px] truncate"
              >
                {!isPromotorUser && <option value="todos" className="bg-card text-foreground">Todos</option>}
                {promoterCatalog.map((p) => (
                  <option key={p.name} value={p.name} className="bg-card text-foreground">
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Filtro Frecuencia */}
            <div className="flex items-center gap-2 bg-muted/60 px-3.5 py-2 rounded-xl border border-border text-sm min-h-[44px]">
              <Calendar className="w-4 h-4 text-muted-foreground shrink-0" />
              <span className="text-muted-foreground font-semibold">Frecuencia:</span>
              <select
                value={frecuenciaFilter}
                onChange={(e) => setFrecuenciaFilter(e.target.value as 'todas' | 'diario' | 'semanal')}
                className="bg-transparent text-foreground font-semibold focus:outline-none cursor-pointer"
              >
                <option value="todas" className="bg-card text-foreground">Todas</option>
                <option value="diario" className="bg-card text-foreground">Diario</option>
                <option value="semanal" className="bg-card text-foreground">Semanal</option>
              </select>
            </div>

            {/* Filtro Producto Financiero */}
            <div className="flex items-center gap-2 bg-muted/60 px-3.5 py-2 rounded-xl border border-border text-sm min-h-[44px]">
              <Layers className="w-4 h-4 text-muted-foreground shrink-0" />
              <span className="text-muted-foreground font-semibold">Producto:</span>
              <select
                value={productoFilter}
                onChange={(e) => setProductoFilter(e.target.value)}
                className="bg-transparent text-foreground font-semibold focus:outline-none cursor-pointer max-w-[150px] truncate"
              >
                <option value="todos" className="bg-card text-foreground">Todos</option>
                {activeProducts.map((p) => (
                  <option key={p.id} value={p.id} className="bg-card text-foreground">
                    {p.nombre}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </Card>

      {/* Collection Tabs */}
      <div className="flex flex-wrap rounded-2xl bg-muted/80 p-1.5 border border-border text-sm gap-1.5">
        <button
          onClick={() => setActiveTab('pendientes')}
          className={`flex-1 min-w-[140px] min-h-[44px] px-4 py-2.5 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${
            activeTab === 'pendientes'
              ? 'bg-card text-primary shadow-sm border border-border'
              : 'text-muted-foreground hover:text-foreground hover:bg-card/50'
          }`}
        >
          <Clock className="w-4 h-4 text-primary" />
          <span>Ruta de Hoy ({collectionList.filter(i => (i.isToday || i.isOverdue) && i.installment.estado !== 'Pagado').length})</span>
        </button>

        <button
          onClick={() => setActiveTab('mora')}
          className={`flex-1 min-w-[140px] min-h-[44px] px-4 py-2.5 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${
            activeTab === 'mora'
              ? 'bg-rose-100 text-rose-900 border border-rose-300 shadow-sm font-extrabold'
              : 'text-muted-foreground hover:text-rose-900 hover:bg-card/50'
          }`}
        >
          <AlertTriangle className="w-4 h-4 text-rose-700" />
          <span>En Mora ({collectionList.filter(i => i.isOverdue && i.installment.estado !== 'Pagado').length})</span>
        </button>

        <button
          onClick={() => setActiveTab('pagados')}
          className={`flex-1 min-w-[140px] min-h-[44px] px-4 py-2.5 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${
            activeTab === 'pagados'
              ? 'bg-emerald-100 text-emerald-950 border border-emerald-300 shadow-sm font-bold'
              : 'text-muted-foreground hover:text-emerald-950 hover:bg-card/50'
          }`}
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-700" />
          <span>Cobrados Hoy ({collectionList.filter(i => i.installment.estado === 'Pagado' || (i.installment.estado === 'Parcial' && (i.installment.fechaPagoReal === todayStr || i.installment.fechaPago?.startsWith(todayStr)))).length})</span>
        </button>

        <button
          onClick={() => setActiveTab('arqueo')}
          className={`flex-1 min-w-[150px] min-h-[44px] px-4 py-2.5 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${
            activeTab === 'arqueo'
              ? 'bg-teal-100 text-teal-950 border border-teal-300 shadow-sm font-bold'
              : 'text-muted-foreground hover:text-teal-950 hover:bg-card/50'
          }`}
        >
          <DollarSign className="w-4 h-4 text-teal-700 stroke-[2.5]" />
          <span>Arqueo y Cierre</span>
          {closures.filter(c => c.estatus === 'Pendiente').length > 0 && isAdminUser && (
            <Badge variant="warning" className="px-2 py-0.5 text-xs font-black ml-1">
              {closures.filter(c => c.estatus === 'Pendiente').length}
            </Badge>
          )}
        </button>

        {isAdminUser && (
          <button
            onClick={() => setActiveTab('autorizaciones')}
            className={`flex-1 min-w-[160px] min-h-[44px] px-4 py-2.5 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'autorizaciones'
                ? 'bg-amber-100 text-amber-950 border border-amber-300 shadow-sm font-bold'
                : 'text-muted-foreground hover:text-amber-950 hover:bg-card/50'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-amber-700" />
            <span>Autorizaciones ({pendingAuthorizations.length})</span>
            {pendingAuthorizations.length > 0 && (
              <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-ping ml-1" />
            )}
          </button>
        )}
      </div>

      {/* VIEW: ARQUEO Y CIERRE DE RUTA (CORTE 16:00 HRS & CUADRE 100%) */}
      {activeTab === 'arqueo' && (
        <div className="space-y-6">
          {/* Card Resumen de la Jornada Actual */}
          <Card className="p-6 border-border shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border">
              <div>
                <span className="text-xs font-mono font-bold text-primary uppercase tracking-wider block">
                  Jornada de Cobranza del Día
                </span>
                <h3 className="text-xl font-extrabold text-foreground mt-0.5 flex items-center gap-2">
                  Arqueo de Ruta: <span className="text-primary font-bold">
                    {isPromotorUser ? currentUser.name : (promotorFilter !== 'todos' ? promotorFilter : 'Todos los Promotores')}
                  </span>
                </h3>
              </div>
              <div className="flex items-center gap-2 bg-amber-50 px-3.5 py-2 rounded-xl border border-amber-200 text-sm">
                <Clock className="w-4 h-4 text-amber-700" />
                <span className="text-amber-900 font-semibold">Corte Contable:</span>
                <strong className="text-amber-900 font-mono font-bold">16:00 hrs</strong>
              </div>
            </div>

            {isLoadingPreview ? (
              <div className="p-12 text-center space-y-3">
                <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto" />
                <p className="text-sm font-semibold text-muted-foreground">Calculando arqueo en tiempo real...</p>
              </div>
            ) : closurePreview ? (
              <div className="space-y-6">
                {/* Métricas de lo recaudado */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
                    <span className="text-emerald-900 text-xs font-bold block">Total a Depositar:</span>
                    <strong className="text-emerald-800 font-mono text-xl font-black block mt-1">
                      {formatCurrency(closurePreview.totalCobrado)}
                    </strong>
                  </div>
                  <div className="p-4 rounded-xl bg-muted/40 border border-border">
                    <span className="text-muted-foreground text-xs font-semibold block">Efectivo Físico:</span>
                    <strong className="text-foreground font-mono text-lg font-bold block mt-1">
                      {formatCurrency(closurePreview.totalEfectivo)}
                    </strong>
                  </div>
                  <div className="p-4 rounded-xl bg-muted/40 border border-border">
                    <span className="text-muted-foreground text-xs font-semibold block">Transferencias:</span>
                    <strong className="text-foreground font-mono text-lg font-bold block mt-1">
                      {formatCurrency(closurePreview.totalTransferencia)}
                    </strong>
                  </div>
                  <div className="p-4 rounded-xl bg-muted/40 border border-border">
                    <span className="text-muted-foreground text-xs font-semibold block">Cobros Realizados:</span>
                    <strong className="text-foreground font-mono text-lg font-bold block mt-1">
                      {closurePreview.cantidadCobros} recibos
                    </strong>
                  </div>
                </div>

                {/* Alerta de cobros posteriores a las 16:00 hrs */}
                {closurePreview.pagosSiguienteDia.cantidad > 0 && (
                  <div className="p-5 rounded-2xl bg-indigo-50 border border-indigo-200 space-y-3">
                    <div className="flex items-start gap-3 text-sm text-indigo-950">
                      <Clock className="w-5 h-5 text-indigo-700 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-extrabold block text-base">Regla de Corte de las 16:00 hrs aplicada:</span>
                        <p className="mt-0.5 text-indigo-900">
                          Tienes <strong>{closurePreview.pagosSiguienteDia.cantidad} cobro(s)</strong> registrados después de las 16:00 hrs ({formatCurrency(closurePreview.pagosSiguienteDia.total)}). Por política institucional, se acumularán automáticamente en el arqueo del siguiente día.
                        </p>
                      </div>
                    </div>
                    {closurePreview.pagosSiguienteDia.pagos && closurePreview.pagosSiguienteDia.pagos.length > 0 && (
                      <div className="rounded-xl border border-indigo-200 overflow-hidden bg-card mt-3">
                        <Table>
                          <TableHeader className="bg-indigo-50/70 border-b border-indigo-200">
                            <TableRow className="border-indigo-200 hover:bg-transparent">
                              <TableHead className="font-bold text-indigo-950 text-xs py-2.5">Folio Recibo</TableHead>
                              <TableHead className="font-bold text-indigo-950 text-xs py-2.5">Cliente</TableHead>
                              <TableHead className="font-bold text-indigo-950 text-xs py-2.5">Cuota</TableHead>
                              <TableHead className="font-bold text-indigo-950 text-xs py-2.5 text-right">Monto</TableHead>
                              <TableHead className="font-bold text-indigo-950 text-xs py-2.5 text-center">Tipo</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody className="divide-y divide-indigo-100">
                            {closurePreview.pagosSiguienteDia.pagos.map((p) => (
                              <TableRow key={p.id} className="border-indigo-100 hover:bg-indigo-50/30">
                                <TableCell className="py-2.5 font-mono text-indigo-900 font-bold text-xs">{p.folioRecibo}</TableCell>
                                <TableCell className="py-2.5 font-semibold text-foreground text-xs">{p.clienteNombre}</TableCell>
                                <TableCell className="py-2.5 font-mono text-foreground text-xs">#{p.numeroCuota}</TableCell>
                                <TableCell className="py-2.5 text-right font-mono font-black text-indigo-950 text-xs">{formatCurrency(p.montoRecibido)}</TableCell>
                                <TableCell className="py-2.5 text-center">
                                  {p.esAbonoParcial ? (
                                    <Badge variant="warning" className="text-[11px] px-2 py-0.5 font-bold">Parcial</Badge>
                                  ) : (
                                    <Badge variant="success" className="text-[11px] px-2 py-0.5 font-bold">Liquidada</Badge>
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
                    <h4 className="font-extrabold text-foreground text-base flex items-center gap-2">
                      <Receipt className="w-5 h-5 text-primary" />
                      Recibos de la Jornada en Curso ({closurePreview.pagos?.length || 0})
                    </h4>
                    <span className="text-sm font-mono text-emerald-800 font-black">
                      Subtotal: {formatCurrency(closurePreview.totalCobrado)}
                    </span>
                  </div>

                  {closurePreview.pagos && closurePreview.pagos.length > 0 ? (
                    <div className="rounded-xl border border-border overflow-hidden bg-card">
                      <Table>
                        <TableHeader className="bg-muted/70">
                          <TableRow className="border-border hover:bg-transparent">
                            <TableHead className="font-bold text-foreground text-sm">Folio Recibo</TableHead>
                            <TableHead className="font-bold text-foreground text-sm">Cliente / Préstamo</TableHead>
                            <TableHead className="font-bold text-foreground text-sm">Cuota</TableHead>
                            <TableHead className="font-bold text-foreground text-sm">Cobrador</TableHead>
                            <TableHead className="font-bold text-foreground text-sm">Método</TableHead>
                            <TableHead className="font-bold text-foreground text-sm text-right">Monto Recaudado</TableHead>
                            <TableHead className="font-bold text-foreground text-sm text-center">Tipo</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody className="divide-y divide-border/60">
                          {closurePreview.pagos.map((p) => {
                            const amortizacion = Math.max(0, Math.round((p.montoRecibido - (p.penalizacionCobrada || 0)) * 100) / 100);
                            return (
                              <TableRow key={p.id} className="border-border/60 hover:bg-muted/50">
                                <TableCell className="font-mono text-primary font-bold text-sm">{p.folioRecibo}</TableCell>
                                <TableCell>
                                  <span className="font-bold text-foreground block text-sm">{p.clienteNombre}</span>
                                  <span className="text-xs text-muted-foreground font-mono">{p.prestamoFolio}</span>
                                </TableCell>
                                <TableCell className="font-mono font-semibold text-foreground text-sm">#{p.numeroCuota}</TableCell>
                                <TableCell className="text-muted-foreground text-sm">{p.cobradorNombre}</TableCell>
                                <TableCell>
                                  <Badge variant="outline" className="text-xs font-semibold">{p.metodoPago}</Badge>
                                </TableCell>
                                <TableCell className="text-right font-mono font-black text-emerald-800 text-sm">
                                  {formatCurrency(p.montoRecibido)}
                                  {p.penalizacionCobrada > 0 && (
                                    <span className="block text-[11px] text-rose-700 font-normal">
                                      (Abono: {formatCurrency(amortizacion)} + Mora: {formatCurrency(p.penalizacionCobrada)})
                                    </span>
                                  )}
                                </TableCell>
                                <TableCell className="text-center">
                                  {p.esAbonoParcial ? (
                                    <Badge variant="warning" className="text-xs font-bold">Abono Parcial</Badge>
                                  ) : (
                                    <Badge variant="success" className="text-xs font-bold">Liquidada</Badge>
                                  )}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <div className="py-8 text-center text-muted-foreground text-sm border border-dashed border-border rounded-xl">
                      No hay recibos pendientes de corte para esta jornada.
                    </div>
                  )}
                </div>

                {/* Formulario de Cierre de Ruta (Promotor) */}
                {isPromotorUser && closurePreview.cantidadCobros > 0 && (
                  <Card className="border-border shadow-sm">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg font-extrabold text-foreground flex items-center gap-2">
                        <ShieldCheck className="w-5 h-5 text-primary" />
                        Registro de Ficha de Depósito / Cierre de Ruta
                      </CardTitle>
                      <CardDescription className="text-sm text-muted-foreground">
                        Ingresa los datos del comprobante bancario para conciliar el arqueo del día.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <form onSubmit={handleCreateClosure} className="space-y-4">
                        {closureFeedback && (
                          <div className="p-3.5 rounded-xl bg-primary/10 border border-primary/20 text-primary font-bold text-sm text-center">
                            {closureFeedback}
                          </div>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-foreground font-bold text-sm mb-1.5">
                              Folio de Depósito Bancario / Transferencia *
                            </label>
                            <Input
                              type="text"
                              required
                              placeholder="Ej. DEP-9823412 o Folio SPEI"
                              value={folioDepositoInput}
                              onChange={(e) => setFolioDepositoInput(e.target.value)}
                              className="h-12 text-base bg-card border-input text-foreground"
                            />
                          </div>

                          <div>
                            <label className="block text-foreground font-bold text-sm mb-1.5">
                              Monto Depositado en Banco ($ MXN) *
                            </label>
                            <Input
                              type="number"
                              step="0.01"
                              inputMode="decimal"
                              required
                              value={montoDepositadoInput}
                              onChange={(e) => setMontoDepositadoInput(Number(e.target.value))}
                              className="h-12 text-base font-mono font-bold text-emerald-800 bg-card border-input"
                            />
                            <span className="text-xs text-muted-foreground mt-1 block">
                              Debe coincidir exactamente con {formatCurrency(closurePreview.totalCobrado)} (100%).
                            </span>
                          </div>
                        </div>

                        <div>
                          <label className="block text-foreground font-bold text-sm mb-1.5">
                            Notas u Observaciones del Cierre
                          </label>
                          <Input
                            type="text"
                            placeholder="Ej. Sucursal bancaria Centro, depósito en ventanilla..."
                            value={notaCierreInput}
                            onChange={(e) => setNotaCierreInput(e.target.value)}
                            className="h-12 text-base bg-card border-input text-foreground"
                          />
                        </div>

                        <Button
                          type="submit"
                          disabled={isSubmittingClosure}
                          className="w-full h-12 min-h-[48px] bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-base shadow-sm"
                        >
                          {isSubmittingClosure ? (
                            <>
                              <Loader2 className="w-5 h-5 animate-spin" /> Procesando Cierre...
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="w-5 h-5" /> Registrar Cierre de Ruta y Enviar a Conciliación ({formatCurrency(closurePreview.totalCobrado)})
                            </>
                          )}
                        </Button>
                      </form>
                    </CardContent>
                  </Card>
                )}
              </div>
            ) : (
              <div className="p-8 text-center text-muted-foreground text-sm">
                No hay cobros pendientes de corte para este promotor.
              </div>
            )}
          </Card>

          {/* Historial y Conciliación de Cierres de Ruta */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-extrabold text-foreground flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                Historial de Cierres y Conciliación Bancaria
              </h3>
              <span className="text-sm text-muted-foreground font-semibold">
                {closures.length} corte(s) registrado(s)
              </span>
            </div>

            {closures.map((c) => {
              const isPendiente = c.estatus === 'Pendiente';
              const isConciliado = c.estatus === 'Conciliado';
              return (
                <Card
                  key={c.id}
                  className={`p-5 transition-all shadow-sm ${
                    isPendiente
                      ? 'border-amber-300 bg-amber-50/30'
                      : isConciliado
                      ? 'border-border bg-card'
                      : 'border-rose-300 bg-rose-50/30'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
                    <div>
                      <span className="text-xs font-mono font-bold text-primary uppercase tracking-wider block">
                        {c.folioCierre} • Jornada: {c.fechaJornada} ({c.horaCorte} hrs)
                      </span>
                      <h4 className="font-extrabold text-foreground text-lg mt-0.5">
                        Promotor: <span className="text-muted-foreground">{c.promotorNombre}</span>
                      </h4>
                    </div>

                    <Badge
                      variant={isPendiente ? 'warning' : isConciliado ? 'success' : 'destructive'}
                      className="gap-1.5 py-1 px-3 text-xs font-bold"
                    >
                      {isPendiente && <Clock className="w-3.5 h-3.5" />}
                      {isConciliado && <CheckCircle2 className="w-3.5 h-3.5" />}
                      {c.estatus}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-4 p-4 rounded-xl bg-muted/40 border border-border text-sm">
                    <div>
                      <span className="text-muted-foreground text-xs block font-semibold">Monto Depositado:</span>
                      <strong className="text-emerald-800 font-mono text-base font-black">
                        {formatCurrency(c.totalCobrado)}
                      </strong>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-xs block font-semibold">Folio Banco / Depósito:</span>
                      <strong className="text-foreground font-mono">{c.folioDepositoBanco}</strong>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-xs block font-semibold">Desglose:</span>
                      <span className="text-foreground font-medium">
                        {formatCurrency(c.totalEfectivo)} efec. / {formatCurrency(c.totalTransferencia)} transf.
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-xs block font-semibold">Cobros incluidos:</span>
                      <strong className="text-foreground">{c.cantidadCobros} recibos</strong>
                    </div>
                  </div>

                  {c.nota && (
                    <p className="text-sm text-muted-foreground italic mb-3">
                      Nota: &ldquo;{c.nota}&rdquo;
                    </p>
                  )}

                  {closureAuthFeedback?.id === c.id ? (
                    <div className="p-3 text-center text-emerald-800 font-bold text-sm bg-emerald-100 rounded-xl border border-emerald-300">
                      {closureAuthFeedback.message}
                    </div>
                  ) : isAdminUser && isPendiente ? (
                    <div className="flex gap-3 pt-2 border-t border-border">
                      <Button
                        variant="outline"
                        disabled={isReconciling}
                        onClick={() => setRejectingClosure(c)}
                        className="flex-1 min-h-[44px] h-12 text-sm font-bold border-destructive/40 text-destructive hover:bg-destructive/10"
                      >
                        Rechazar Arqueo
                      </Button>
                      <Button
                        disabled={isReconciling}
                        onClick={() => handleReconcileClosure(c.id, 'CONCILIAR')}
                        className="flex-2 min-h-[44px] h-12 text-sm font-bold bg-emerald-700 hover:bg-emerald-800 text-white shadow-sm"
                      >
                        {isReconciling ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <CheckCircle2 className="w-4 h-4" />
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
              <Card className="p-8 text-center text-muted-foreground border-border shadow-sm">
                <p className="text-base font-semibold">Aún no hay cierres de ruta registrados en el sistema.</p>
              </Card>
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
              className="p-5 border-amber-300 bg-amber-50/40 space-y-4 shadow-sm"
            >
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-amber-900 uppercase tracking-wider block">
                      {p.folioRecibo} • Préstamo: {p.prestamoFolio}
                    </span>
                    {p.esVisitaFallida && (
                      <Badge variant="warning" className="text-xs font-extrabold">
                        Fuerza Mayor ($0)
                      </Badge>
                    )}
                  </div>
                  <h3 className="font-extrabold text-foreground text-lg leading-tight mt-1">
                    {p.clienteNombre}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    Reportado por: <strong className="text-foreground">{p.cobradorNombre}</strong>
                  </p>
                </div>

                <Badge variant="warning" className="gap-1.5 py-1 px-3 text-xs font-bold">
                  <Clock className="w-4 h-4" />
                  {p.esVisitaFallida ? 'Exención en Revisión' : 'Pendiente de Aprobación'}
                </Badge>
              </div>

              {/* Data comparison grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 rounded-xl bg-card border border-border text-sm">
                <div>
                  <span className="text-muted-foreground text-xs block font-semibold">Cuota Afectada:</span>
                  <strong className="text-foreground">Cuota #{p.numeroCuota}</strong>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs block font-semibold">Monto Recaudado:</span>
                  <strong className={`font-mono text-base ${p.esVisitaFallida ? 'text-amber-800' : 'text-emerald-800 font-black'}`}>
                    {p.esVisitaFallida ? '$0.00 (Visita no exitosa)' : formatCurrency(p.montoRecibido)}
                  </strong>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs block font-semibold">Fecha Reportada:</span>
                  <strong className="text-foreground font-semibold">{p.fechaCobroReal || p.fechaPago}</strong>
                </div>
              </div>

              {/* Justification Box */}
              <div className="p-4 rounded-xl bg-card border border-border text-sm space-y-1">
                <span className="text-muted-foreground font-bold text-xs flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-amber-600" />
                  {p.esVisitaFallida ? 'Causa de Fuerza Mayor Reportada:' : 'Justificación del Promotor:'}
                </span>
                <p className="text-foreground italic">
                  &ldquo;{p.motivoVisitaFallida || p.motivoExtemporaneo || p.nota || 'Sin motivo reportado.'}&rdquo;
                </p>
              </div>

              {authFeedback?.id === p.id ? (
                <div className="p-3 text-center text-emerald-800 font-bold text-sm bg-emerald-100 rounded-xl border border-emerald-300">
                  {authFeedback.message}
                </div>
              ) : (
                <div className="flex gap-3 pt-2">
                  <Button
                    variant="outline"
                    disabled={isAuthorizing}
                    onClick={() => setRejectingPayment(p)}
                    className="flex-1 min-h-[44px] h-12 text-sm font-bold border-destructive/40 text-destructive hover:bg-destructive/10"
                  >
                    {p.esVisitaFallida ? 'Rechazar Exención' : 'Rechazar'}
                  </Button>
                  <Button
                    disabled={isAuthorizing}
                    onClick={() => handleAuthorizeDecision(p.id, 'APROBAR')}
                    className="flex-2 min-h-[44px] h-12 text-sm font-bold bg-emerald-700 hover:bg-emerald-800 text-white shadow-sm"
                  >
                    {isAuthorizing ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        {p.esVisitaFallida ? 'Autorizar Exención de Mora' : 'Aprobar Cobro'}
                      </>
                    )}
                  </Button>
                </div>
              )}
            </Card>
          ))}

          {pendingAuthorizations.length === 0 && (
            <Card className="p-12 text-center text-muted-foreground border-border shadow-sm">
              <p className="text-base font-semibold">No hay solicitudes de pagos extemporáneos pendientes de autorización.</p>
            </Card>
          )}
        </div>
      ) : (
        /* VIEW: LISTA NORMAL DE COBRANZA */
        <div className="space-y-4">
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
              <Card
                key={`${item.loan.id}-${item.installment.numeroCuota}-${idx}`}
                className={`p-5 transition-all shadow-sm ${
                  isEnRevision
                    ? 'border-indigo-300 bg-indigo-50/30'
                    : item.isOverdue
                    ? 'border-rose-300 bg-rose-50/40'
                    : 'border-border bg-card hover:border-primary/40'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3">
                  <div>
                    <h3 className="font-extrabold text-foreground text-xl leading-tight">
                      {item.loan.clienteNombre}
                    </h3>
                    <p className="text-sm text-muted-foreground font-mono mt-1">
                      Folio: <strong className="text-foreground">{item.loan.folio}</strong> • Cuota #{item.installment.numeroCuota} de {item.loan.plazoCantidad}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      <span className="text-xs text-primary font-bold">
                        Promotor: {item.loan.promotorAsignado}
                      </span>
                      <span className="text-muted-foreground">•</span>
                      <Badge variant="outline" className="text-xs font-semibold capitalize">
                        {item.loan.productoNombre} ({item.loan.frecuenciaPago})
                      </Badge>
                    </div>
                  </div>

                  <RenderInstallmentBadge status={item.installment.estado} />
                </div>

                {/* Installment Info */}
                <div className="grid grid-cols-2 gap-3 my-4 p-4 rounded-xl bg-muted/40 border border-border text-sm">
                  <div>
                    <span className="text-muted-foreground text-xs block font-semibold">Vencimiento:</span>
                    <p className={`font-bold mt-0.5 text-base ${item.isOverdue ? 'text-rose-700 font-extrabold' : 'text-foreground'}`}>
                      {formatDateWithDay(item.installment.fechaVencimiento)}
                    </p>
                  </div>

                  <div>
                    <span className="text-muted-foreground text-xs block font-semibold">
                      {activeTab === 'pagados'
                        ? item.installment.estado === 'Parcial'
                          ? 'Abonado Hoy (Amortizado):'
                          : 'Total Liquidado:'
                        : 'Monto a Cobrar:'}
                    </span>
                    <p className={`font-mono font-black text-lg mt-0.5 ${
                      activeTab === 'pagados'
                        ? 'text-emerald-800'
                        : item.isOverdue
                        ? 'text-rose-800'
                        : 'text-primary'
                    }`}>
                      {formatCurrency(
                        activeTab === 'pagados'
                          ? item.installment.montoPagado || item.installment.cuotaTotal
                          : totalACobrarCard
                      )}
                    </p>
                    {activeTab !== 'pagados' && item.isOverdue && recargoMoraCard > 0 && !isEnRevision && (
                      <span className="block text-xs text-rose-700 font-extrabold mt-1">
                        ⚠️ Incluye +{formatCurrency(recargoMoraCard)} recargo mora
                      </span>
                    )}
                    {activeTab === 'pagados' && item.installment.estado === 'Parcial' && (
                      <span className="block text-xs text-amber-800 font-bold mt-1">
                        Restante por cobrar: {formatCurrency(item.installment.saldoPendiente)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Touch Action Buttons */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 pt-1">
                  {item.loan.clienteTelefono && (
                    <Button
                      asChild
                      variant="outline"
                      size="icon"
                      className="h-12 w-12 min-h-[44px] min-w-[44px] rounded-xl border-border text-emerald-700 hover:bg-emerald-50 shrink-0"
                      title={`Llamar a ${item.loan.clienteNombre}`}
                    >
                      <a href={`tel:${item.loan.clienteTelefono.replace(/\s+/g, '')}`}>
                        <Phone className="w-5 h-5" />
                      </a>
                    </Button>
                  )}

                  {isEnRevision ? (
                    <div className="flex-1 min-h-[48px] py-2.5 px-4 rounded-xl bg-indigo-50 text-indigo-900 border border-indigo-200 text-sm font-bold text-center flex items-center justify-center gap-2">
                      <Clock className="w-4 h-4 text-indigo-700" /> Solicitud en Revisión de Administrador
                    </div>
                  ) : activeTab === 'pagados' ? (
                    item.installment.estado === 'Parcial' ? (
                      <div className="flex-1 min-h-[48px] py-2.5 px-4 rounded-xl bg-emerald-50 text-emerald-900 border border-emerald-200 text-sm font-bold text-center flex flex-col sm:flex-row items-center justify-between gap-2">
                        <span className="flex items-center gap-1.5 text-emerald-800 font-extrabold">
                          <Check className="w-4 h-4" /> Abono Registrado Hoy ({formatCurrency(item.installment.montoPagado)})
                        </span>
                        <span className="text-xs text-amber-900 font-semibold">
                          Saldo Restante: <strong className="font-mono text-sm">{formatCurrency(item.installment.saldoPendiente)}</strong>
                        </span>
                      </div>
                    ) : (
                      <div className="flex-1 min-h-[48px] py-2.5 px-4 rounded-xl bg-emerald-50 text-emerald-900 border border-emerald-200 text-sm font-bold text-center flex items-center justify-center gap-2">
                        <Check className="w-4 h-4 text-emerald-700" /> Cobro Liquidado ({formatCurrency(item.installment.montoPagado || item.installment.cuotaTotal)})
                      </div>
                    )
                  ) : item.installment.estado !== 'Pagado' ? (
                    <div className="flex-1 flex flex-col sm:flex-row gap-2.5">
                      <Button
                        onClick={() => openPaymentModal(item)}
                        className={`flex-1 h-12 min-h-[48px] text-base font-bold shadow-sm ${
                          item.isOverdue
                            ? 'bg-rose-700 hover:bg-rose-800 text-white'
                            : 'bg-primary hover:bg-primary/90 text-primary-foreground'
                        }`}
                      >
                        <DollarSign className="w-5 h-5 stroke-[2.5]" />
                        {item.installment.estado === 'Parcial'
                          ? `Completar Cobro (${formatCurrency(totalACobrarCard)})`
                          : `Registrar Cobro (${formatCurrency(totalACobrarCard)})`}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => openFailedVisitModal(item)}
                        className="h-12 min-h-[48px] border-amber-300 text-amber-900 hover:bg-amber-50 font-bold text-sm shrink-0"
                        title="Reportar visita fallida por causa de fuerza mayor"
                      >
                        <AlertTriangle className="w-4 h-4 text-amber-600" />
                        Visita Fallida ($0)
                      </Button>
                    </div>
                  ) : (
                    <div className="flex-1 min-h-[48px] py-2.5 px-4 rounded-xl bg-emerald-50 text-emerald-900 border border-emerald-200 text-sm font-bold text-center flex items-center justify-center gap-2">
                      <Check className="w-4 h-4 text-emerald-700" /> Cobro Registrado
                    </div>
                  )}
                </div>
              </Card>
            );
          })}

          {filteredCollection.length === 0 && (
            <Card className="p-12 text-center text-muted-foreground border-border shadow-sm">
              <p className="text-base font-semibold">No hay cobros asignados con los filtros seleccionados.</p>
            </Card>
          )}
        </div>
      )}

      {/* MODAL EXPRESS DE COBRO EN CAMPO */}
      <Dialog
        open={!!selectedItem}
        onOpenChange={(open) => {
          if (!open && !isSubmitting) setSelectedItem(null);
        }}
      >
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto bg-card text-card-foreground border-border shadow-2xl p-6">
          <DialogHeader className="pb-2 border-b border-border">
            <DialogTitle className="text-xl font-extrabold text-foreground">
              {selectedItem?.loan.clienteNombre}
            </DialogTitle>
            <DialogDescription className="text-xs font-bold text-primary uppercase tracking-wider">
              Recibo de Cobranza en Campo
            </DialogDescription>
          </DialogHeader>

          {paymentSuccessMessage ? (
            <div className="p-8 text-center space-y-3">
              <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto animate-bounce">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <p className="font-extrabold text-foreground text-lg">{paymentSuccessMessage}</p>
            </div>
          ) : selectedItem ? (
            <form onSubmit={handleRegisterPayment} noValidate className="space-y-4 text-sm pt-2">
              {/* Cuota details */}
              <div className="p-4 rounded-xl bg-muted/40 border border-border space-y-2">
                <div className="flex justify-between text-muted-foreground font-semibold">
                  <span>Préstamo:</span>
                  <strong className="font-mono text-primary font-bold">{selectedItem.loan.folio}</strong>
                </div>
                <div className="flex justify-between text-muted-foreground font-semibold">
                  <span>Producto:</span>
                  <strong className="text-foreground capitalize">{selectedItem.loan.productoNombre} ({selectedItem.loan.frecuenciaPago})</strong>
                </div>
                <div className="flex justify-between text-muted-foreground font-semibold">
                  <span>Cuota #:</span>
                  <strong className="text-foreground">#{selectedItem.installment.numeroCuota} de {selectedItem.loan.plazoCantidad}</strong>
                </div>
                <div className="flex justify-between text-muted-foreground font-semibold">
                  <span>Valor Cuota Regular:</span>
                  <strong className="text-foreground font-mono">{formatCurrency(selectedItem.installment.cuotaTotal)}</strong>
                </div>
                {selectedItem.installment.montoPagado > 0 && (
                  <>
                    <div className="flex justify-between text-amber-800 font-semibold">
                      <span>Abonado Previamente:</span>
                      <strong className="font-mono">-{formatCurrency(selectedItem.installment.montoPagado)}</strong>
                    </div>
                    <div className="flex justify-between text-emerald-900 border-t border-border pt-1.5 font-bold">
                      <span>Saldo Remanente de Cuota:</span>
                      <strong className="font-mono font-black">
                        {formatCurrency(selectedItem.installment.cuotaTotal - selectedItem.installment.montoPagado)}
                      </strong>
                    </div>
                  </>
                )}
              </div>

              {/* Penalización por Mora NO EDITABLE */}
              {selectedItem.isOverdue && !esCobroExtemporaneo && (
                <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <AlertTriangle className="w-5 h-5 text-rose-700 shrink-0" />
                    <div>
                      <span className="text-sm font-bold text-rose-900 block">Recargo por Mora:</span>
                      <span className="text-xs text-rose-700">Estipulado por contrato del producto</span>
                    </div>
                  </div>
                  <strong className="text-rose-900 font-mono text-lg font-black">
                    +{formatCurrency(penalizacionCobrada)}
                  </strong>
                </div>
              )}

              {/* Banner Total Sugerido */}
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-300 flex justify-between items-center shadow-xs">
                <div>
                  <span className="text-emerald-950 font-extrabold text-sm block">Total a Recaudar al Cliente:</span>
                  {esCobroExtemporaneo ? (
                    <span className="text-xs text-indigo-800 font-bold">Cobro en fecha reportado (sin mora)</span>
                  ) : selectedItem.isOverdue ? (
                    <span className="text-xs text-rose-700 font-bold">⚠️ Incluye penalización por mora</span>
                  ) : null}
                </div>
                <strong className="text-emerald-800 font-black text-2xl font-mono">
                  {formatCurrency(Number(montoRecibido))}
                </strong>
              </div>

              {/* Monto Recibido Input */}
              <div>
                <label className="block text-foreground font-bold text-sm mb-1.5">
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
                  className={`h-14 text-2xl font-black font-mono text-emerald-800 bg-card border-input ${
                    paymentFormErrors.montoRecibido
                      ? 'border-destructive ring-1 ring-destructive'
                      : 'border-input focus-visible:ring-emerald-700'
                  }`}
                />
                {paymentFormErrors.montoRecibido && (
                  <p className="text-xs text-destructive font-semibold mt-1.5 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {paymentFormErrors.montoRecibido}
                  </p>
                )}
                {(() => {
                  const cuotaFaltante = Math.round((selectedItem.installment.cuotaTotal - (selectedItem.installment.montoPagado || 0)) * 100) / 100;
                  const totalEsperado = esCobroExtemporaneo ? cuotaFaltante : cuotaFaltante + penalizacionCobrada;
                  return (
                    <div className="mt-1.5 space-y-0.5">
                      <p className="text-xs text-muted-foreground">
                        {totalEsperado < 100
                          ? `💡 Saldo restante menor a $100: abono exacto de ${formatCurrency(totalEsperado)} para liquidar la cuota.`
                          : '💡 Abono mínimo permitido: $100.00 (o liquidación completa).'}
                      </p>
                      {montoRecibido < totalEsperado && (
                        <p className="text-xs text-amber-800 font-semibold">
                          ⚠️ Se registrará como abono parcial con saldo remanente (sin mora adicional a futuro).
                        </p>
                      )}
                    </div>
                  );
                })()}
              </div>

              {/* SECCIÓN DE COBRO EXTEMPORÁNEO */}
              {selectedItem.isOverdue && (
                <div className="p-4 rounded-xl bg-indigo-50/60 border border-indigo-200 space-y-3">
                  <label className="flex items-start gap-3 cursor-pointer select-none">
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
                      className="mt-1 w-4 h-4 rounded text-primary border-border focus:ring-ring"
                    />
                    <div>
                      <span className="text-sm font-bold text-indigo-950 block">
                        ¿Cobraste esta cuota en fecha y no pudiste registrarla?
                      </span>
                      <span className="text-xs text-muted-foreground block mt-0.5">
                        Indica la fecha real de cobro. Requerirá autorización del Administrador para aplicarse sin mora.
                      </span>
                    </div>
                  </label>

                  {esCobroExtemporaneo && (
                    <div className="space-y-3 pt-3 border-t border-indigo-200">
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="text-xs font-bold text-foreground">
                            Fecha Real de Recepción del Dinero *
                          </label>
                          <span className="text-xs text-muted-foreground font-mono">
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
                          className={`h-12 text-base bg-card text-foreground cursor-pointer ${
                            paymentFormErrors.fechaCobroReal
                              ? 'border-destructive ring-1 ring-destructive'
                              : 'border-input focus-visible:ring-primary'
                          }`}
                        />
                        {paymentFormErrors.fechaCobroReal ? (
                          <p className="text-xs text-destructive font-semibold mt-1 flex items-center gap-1">
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            {paymentFormErrors.fechaCobroReal}
                          </p>
                        ) : (
                          <p className="text-xs text-muted-foreground mt-1">
                            📅 Fechas pasadas permitidas. Fechas futuras inhabilitadas.
                          </p>
                        )}
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="text-xs font-bold text-foreground">
                            Motivo o Justificación del Retraso *
                          </label>
                          <span
                            className={`text-xs font-mono font-bold ${
                              motivoExtemporaneo.trim().length >= 10
                                ? 'text-emerald-700'
                                : 'text-amber-700'
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
                          className={`w-full px-3.5 py-2.5 rounded-xl bg-card border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none transition-colors ${
                            paymentFormErrors.motivoExtemporaneo
                              ? 'border-destructive ring-1 ring-destructive'
                              : motivoExtemporaneo.trim().length >= 10
                              ? 'border-emerald-500 focus:border-emerald-600'
                              : 'border-input'
                          }`}
                        />
                        {paymentFormErrors.motivoExtemporaneo ? (
                          <p className="text-xs text-destructive font-semibold mt-1 flex items-center gap-1">
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            {paymentFormErrors.motivoExtemporaneo}
                          </p>
                        ) : (
                          <p
                            className={`text-xs mt-1 ${
                              motivoExtemporaneo.trim().length >= 10
                                ? 'text-emerald-700 font-semibold'
                                : 'text-muted-foreground'
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
                  )}
                </div>
              )}

              {/* Método de Pago */}
              <div>
                <label className="block text-foreground font-bold text-sm mb-1.5">Método de Pago</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Efectivo', 'Transferencia', 'Tarjeta'] as const).map((method) => (
                    <Button
                      key={method}
                      type="button"
                      variant={metodoPago === method ? 'default' : 'outline'}
                      onClick={() => setMetodoPago(method)}
                      className={`h-12 min-h-[44px] font-bold text-sm ${
                        metodoPago === method
                          ? 'bg-primary text-primary-foreground'
                          : 'border-border text-foreground hover:bg-muted'
                      }`}
                    >
                      {method}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Nota Opcional */}
              <div>
                <label className="block text-foreground font-bold text-sm mb-1.5">Comentario o Nota (Opcional)</label>
                <Input
                  type="text"
                  placeholder="Ej. Entregó recibo en papel"
                  value={nota}
                  onChange={(e) => setNota(e.target.value)}
                  className="h-12 text-sm bg-card border-input text-foreground"
                />
              </div>

              {paymentFormErrors.general && (
                <div className="p-3.5 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive font-bold text-sm flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-destructive" />
                  <span>{paymentFormErrors.general}</span>
                </div>
              )}

              <div className="pt-3 flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  disabled={isSubmitting}
                  onClick={() => setSelectedItem(null)}
                  className="w-1/3 h-12 min-h-[44px] text-sm font-semibold border-border"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className={`w-2/3 h-12 min-h-[44px] text-sm font-bold shadow-sm ${
                    esCobroExtemporaneo
                      ? 'bg-primary hover:bg-primary/90 text-primary-foreground'
                      : 'bg-emerald-700 hover:bg-emerald-800 text-white'
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Procesando...
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
        <DialogContent className="max-w-md bg-card text-card-foreground border-border shadow-2xl p-6">
          <DialogHeader className="pb-2 border-b border-border">
            <DialogTitle className="text-lg font-extrabold text-destructive flex items-center gap-2">
              <XCircle className="w-5 h-5 text-destructive" />
              Rechazar Cobro Extemporáneo
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Dictamen de autorización para {rejectingPayment?.clienteNombre}
            </DialogDescription>
          </DialogHeader>

          <div className="text-sm space-y-3 text-muted-foreground pt-2">
            <p>
              Al rechazar este pago, la cuota regresará a estado <strong>En Mora</strong> y se exigirá el pago de la penalización correspondiente.
            </p>
            <div>
              <label className="block text-foreground font-bold text-sm mb-1.5">
                Motivo del Rechazo *
              </label>
              <textarea
                rows={3}
                placeholder="Explica el motivo por el cual no procede la condonación..."
                value={motivoRechazoInput}
                onChange={(e) => setMotivoRechazoInput(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-card border border-input text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-destructive resize-none"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-3">
            <Button
              type="button"
              variant="outline"
              disabled={isAuthorizing}
              onClick={() => setRejectingPayment(null)}
              className="w-1/3 h-12 min-h-[44px] text-sm font-semibold border-border"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={isAuthorizing || !motivoRechazoInput.trim()}
              onClick={() => handleAuthorizeDecision(rejectingPayment!.id, 'RECHAZAR', motivoRechazoInput)}
              className="w-2/3 h-12 min-h-[44px] font-bold text-sm shadow-sm"
            >
              {isAuthorizing ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirmar Rechazo'}
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
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto bg-card text-card-foreground border-border shadow-2xl p-6">
          <DialogHeader className="pb-2 border-b border-border">
            <DialogTitle className="text-lg font-extrabold text-foreground flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              Reportar Visita No Exitosa
            </DialogTitle>
            <DialogDescription className="text-xs font-bold text-amber-800 uppercase tracking-wider">
              Causa de Fuerza Mayor ($0)
            </DialogDescription>
          </DialogHeader>

          {failedVisitSuccess ? (
            <div className="p-8 text-center space-y-3">
              <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto animate-bounce">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <p className="font-extrabold text-foreground text-base">{failedVisitSuccess}</p>
            </div>
          ) : failedVisitItem ? (
            <form onSubmit={handleRegisterFailedVisit} noValidate className="space-y-4 text-sm pt-2">
              {/* Cuota reference */}
              <div className="p-4 rounded-xl bg-muted/40 border border-border space-y-2">
                <div className="flex justify-between text-muted-foreground font-semibold">
                  <span>Cliente:</span>
                  <strong className="text-foreground">{failedVisitItem.loan.clienteNombre}</strong>
                </div>
                <div className="flex justify-between text-muted-foreground font-semibold">
                  <span>Préstamo:</span>
                  <strong className="font-mono text-primary font-bold">{failedVisitItem.loan.folio}</strong>
                </div>
                <div className="flex justify-between text-muted-foreground font-semibold">
                  <span>Cuota #:</span>
                  <strong className="text-foreground">#{failedVisitItem.installment.numeroCuota} de {failedVisitItem.loan.plazoCantidad}</strong>
                </div>
              </div>

              {/* Explicación de regla */}
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-900 leading-relaxed font-medium">
                  Esta opción congela la cuota en <strong>En Revisión</strong> y solicita la exención de mora al Administrador. El sistema auditará la causa reportada para autorizar que no se aplique penalización.
                </p>
              </div>

              {failedVisitErrors.general && (
                <div className="p-3.5 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive font-bold text-sm flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-destructive" />
                  <span>{failedVisitErrors.general}</span>
                </div>
              )}

              {/* Motivo de Fuerza Mayor Tipificado */}
              <div>
                <label className="block text-foreground font-bold text-sm mb-1.5">Causa Tipificada *</label>
                <select
                  value={motivoCausa}
                  onChange={(e) => setMotivoCausa(e.target.value)}
                  className="w-full h-12 px-3.5 rounded-xl bg-card border border-input text-foreground text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
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
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-foreground font-bold text-sm">
                    Descripción / Evidencia del Hecho *
                  </label>
                  <span
                    className={`text-xs font-mono font-bold ${
                      detallesVisita.trim().length >= 10
                        ? 'text-emerald-700'
                        : 'text-amber-700'
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
                  className={`w-full px-3.5 py-2.5 rounded-xl bg-card border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none transition-colors ${
                    failedVisitErrors.detallesVisita
                      ? 'border-destructive ring-1 ring-destructive'
                      : detallesVisita.trim().length >= 10
                      ? 'border-emerald-500 focus:border-emerald-600'
                      : 'border-input'
                  }`}
                />
                {failedVisitErrors.detallesVisita ? (
                  <p className="text-xs text-destructive font-semibold mt-1 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {failedVisitErrors.detallesVisita}
                  </p>
                ) : (
                  <p
                    className={`text-xs mt-1 ${
                      detallesVisita.trim().length >= 10
                        ? 'text-emerald-700 font-semibold'
                        : 'text-muted-foreground'
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
              <div className="flex gap-3 pt-3">
                <Button
                  type="button"
                  variant="outline"
                  disabled={isSubmittingFailedVisit}
                  onClick={() => setFailedVisitItem(null)}
                  className="w-1/3 h-12 min-h-[44px] text-sm font-semibold border-border"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmittingFailedVisit}
                  className="w-2/3 h-12 min-h-[44px] bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm shadow-sm"
                >
                  {isSubmittingFailedVisit ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Registrando...
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
        <DialogContent className="max-w-md bg-card text-card-foreground border-border shadow-2xl p-6">
          <DialogHeader className="pb-2 border-b border-border">
            <DialogTitle className="text-lg font-extrabold text-destructive flex items-center gap-2">
              <XCircle className="w-5 h-5 text-destructive" />
              Rechazar Cierre ({rejectingClosure?.folioCierre})
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Discrepancia en arqueo de {rejectingClosure?.promotorNombre}
            </DialogDescription>
          </DialogHeader>

          <div className="text-sm space-y-3 text-muted-foreground pt-2">
            <p>
              Al rechazar el arqueo, los cobros asociados serán liberados del cierre para que el promotor ({rejectingClosure?.promotorNombre}) aclare la discrepancia bancaria.
            </p>
            <div>
              <label className="block text-foreground font-bold text-sm mb-1.5">
                Motivo de Discrepancia *
              </label>
              <textarea
                rows={3}
                placeholder="Ej. El folio de depósito no refleja fondos en la cuenta bancaria..."
                value={motivoRechazoCierre}
                onChange={(e) => setMotivoRechazoCierre(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-card border border-input text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-destructive resize-none"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-3">
            <Button
              type="button"
              variant="outline"
              disabled={isReconciling}
              onClick={() => setRejectingClosure(null)}
              className="w-1/3 h-12 min-h-[44px] text-sm font-semibold border-border"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={isReconciling || !motivoRechazoCierre.trim()}
              onClick={() => handleReconcileClosure(rejectingClosure!.id, 'RECHAZAR', motivoRechazoCierre)}
              className="w-2/3 h-12 min-h-[44px] font-bold text-sm shadow-sm"
            >
              {isReconciling ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirmar Rechazo'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
