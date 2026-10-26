'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Banknote,
  Search,
  Plus,
  Calendar,
  Eye,
  AlertTriangle,
  ShieldCheck,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  AlertCircle,
  UserCheck,
  UserCog,
  Phone,
  X,
} from 'lucide-react';
import { useImpulsoStore } from '@/store/useImpulsoStore';
import { LoanStatusBadge, InstallmentStatusBadge } from '@/components/shared/StatusBadges';
import { formatCurrency, formatDate, formatDateWithDay, formatDateWithTime } from '@/lib/utils';
import { Loan } from '@/types';
import { approveLoanAction, rejectLoanAction, reassignPromoterAction } from '@/app/actions/loanActions';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

export default function LoansPage() {
  const { loans, users, currentUser, loadDataFromDB } = useImpulsoStore();
  const isAdmin = currentUser.role === 'Administrador';

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  const [selectedLoanModal, setSelectedLoanModal] = useState<Loan | null>(null);

  // Modal para rechazo de préstamo (Administrador)
  const [rejectModalLoan, setRejectModalLoan] = useState<Loan | null>(null);
  const [motivoRechazoInput, setMotivoRechazoInput] = useState('');
  const [rejectError, setRejectError] = useState<string | null>(null);

  // Modal para reasignación de promotor de cobro (Administrador)
  const [reassignModalLoan, setReassignModalLoan] = useState<Loan | null>(null);
  const [selectedNewPromoterName, setSelectedNewPromoterName] = useState('');
  const [reassignError, setReassignError] = useState<string | null>(null);

  const [isProcessingAction, setIsProcessingAction] = useState(false);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const rejectModalScrollRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (rejectModalLoan) {
          setRejectModalLoan(null);
          setMotivoRechazoInput('');
          setRejectError(null);
        } else if (reassignModalLoan) {
          setReassignModalLoan(null);
          setSelectedNewPromoterName('');
          setReassignError(null);
        } else if (selectedLoanModal) {
          setSelectedLoanModal(null);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedLoanModal, rejectModalLoan, reassignModalLoan]);

  const handleApprove = async (loanId: string) => {
    if (isProcessingAction) return;
    setIsProcessingAction(true);
    try {
      await approveLoanAction(loanId, currentUser.name);
      await loadDataFromDB();
    } catch (err) {
      console.error('Error al aprobar préstamo:', err);
    } finally {
      setIsProcessingAction(false);
    }
  };

  const handleConfirmReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectModalLoan || isProcessingAction) return;

    if (!motivoRechazoInput.trim()) {
      setRejectError('Por favor ingresa el motivo del rechazo.');
      if (rejectModalScrollRef.current) rejectModalScrollRef.current.scrollTop = 0;
      return;
    }

    setIsProcessingAction(true);
    try {
      await rejectLoanAction(rejectModalLoan.id, motivoRechazoInput.trim(), currentUser.name);
      await loadDataFromDB();

      setRejectModalLoan(null);
      setMotivoRechazoInput('');
      setRejectError(null);
    } catch (err) {
      console.error('Error al rechazar préstamo:', err);
    } finally {
      setIsProcessingAction(false);
    }
  };

  const handleConfirmReassign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reassignModalLoan || isProcessingAction) return;

    if (!isAdmin || currentUser.role !== 'Administrador') {
      setReassignError('Acceso Denegado: Solo los usuarios administradores pueden reasignar el promotor de un crédito.');
      return;
    }

    if (!selectedNewPromoterName) {
      setReassignError('Debes seleccionar un colaborador para la reasignación.');
      return;
    }

    const newPromoterObj = users.find((u) => u.name === selectedNewPromoterName);
    if (!newPromoterObj) {
      setReassignError('El colaborador seleccionado no es válido.');
      return;
    }

    setIsProcessingAction(true);
    setReassignError(null);

    try {
      const res = await reassignPromoterAction({
        loanId: reassignModalLoan.id,
        nuevoPromotorNombre: newPromoterObj.name,
        nuevoPromotorTelefono: newPromoterObj.telefono,
        nuevoDiaCobro: newPromoterObj.diaCobroAsignado,
        requesterRole: currentUser.role,
      });

      if (!res.success) {
        setReassignError(res.message || 'Error al reasignar el promotor.');
        return;
      }

      await loadDataFromDB();
      setReassignModalLoan(null);
      setSelectedNewPromoterName('');

      // Si el modal de detalle del crédito está abierto para este mismo préstamo, actualizarlo en vivo
      if (selectedLoanModal && selectedLoanModal.id === reassignModalLoan.id) {
        setSelectedLoanModal({
          ...selectedLoanModal,
          promotorAsignado: newPromoterObj.name,
          promotorAsignadoTelefono: newPromoterObj.telefono,
          diaCobro: newPromoterObj.diaCobroAsignado,
        });
      }
    } catch (err: any) {
      console.error('Error reassigning promoter:', err);
      setReassignError('Error al reasignar el promotor.');
    } finally {
      setIsProcessingAction(false);
    }
  };

  // Cálculo de Métricas de Cartera Institucional
  const loansExcludingRejected = loans.filter((l) => l.estatus !== 'Rechazado');
  const totalColocado = loansExcludingRejected.reduce((sum, l) => sum + l.montoPrincipal, 0);

  const activeLoans = loans.filter((l) => l.estatus === 'Activo' || l.estatus === 'En Mora');
  const totalCarteraActiva = activeLoans.reduce((sum, l) => sum + l.saldoPendiente, 0);

  const moraLoans = loans.filter((l) => l.estatus === 'En Mora');
  const totalEnMora = moraLoans.reduce((sum, l) => sum + l.saldoPendiente, 0);

  const filteredLoans = loans.filter((loan) => {
    const matchesSearch =
      loan.folio.toLowerCase().includes(searchTerm.toLowerCase()) ||
      loan.clienteNombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      loan.productoNombre.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'todos' || loan.estatus === statusFilter;

    return matchesSearch && matchesStatus;
  });

  if (isPageLoading) {
    return (
      <Card className="flex flex-col items-center justify-center min-h-[400px] p-12 space-y-4 my-8 bg-card border-border shadow-2xs">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <p className="text-[13px] font-medium text-text-muted">Consultando cartera de préstamos en tiempo real...</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[22px] sm:text-[24px] font-semibold text-foreground flex items-center gap-2.5 tracking-tight">
            <Banknote className="w-6 h-6 text-primary" />
            Gestión de Préstamos y Solicitudes
          </h1>
          <p className="text-[13px] text-text-muted mt-1">
            Monitoreo de cartera, dictamen de solicitudes y tablas de amortización contables.
          </p>
        </div>

        <Button asChild variant="stripe-actions" className="h-[34px] px-3.5 text-[13px] font-medium">
          <Link href="/prestamos/nuevo">
            <Plus className="w-4 h-4 mr-1 stroke-[2.5]" />
            + Nuevo Crédito
          </Link>
        </Button>
      </div>

      {/* Tarjetas de Métricas de Cartera (Stripe Dashboard Solid Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 bg-card border border-border rounded-[6px] shadow-2xs">
          <span className="text-[11.5px] font-medium text-text-muted uppercase tracking-wider block">
            Total Colocado
          </span>
          <div className="text-[20px] font-semibold text-foreground font-mono mt-1">
            {formatCurrency(totalColocado)}
          </div>
          <span className="text-[12px] text-text-muted mt-0.5 block">
            {loansExcludingRejected.length} créditos autorizados
          </span>
        </Card>

        <Card className="p-4 bg-card border border-border rounded-[6px] shadow-2xs">
          <span className="text-[11.5px] font-medium text-text-muted uppercase tracking-wider block">
            Cartera Activa
          </span>
          <div className="text-[20px] font-semibold text-foreground font-mono mt-1">
            {formatCurrency(totalCarteraActiva)}
          </div>
          <span className="text-[12px] text-text-muted mt-0.5 block">
            {loans.filter((l) => l.estatus === 'Activo').length} créditos vigentes al día
          </span>
        </Card>

        <Card className="p-4 bg-card border border-border rounded-[6px] shadow-2xs">
          <span className="text-[11.5px] font-medium text-text-muted uppercase tracking-wider block">
            En Mora
          </span>
          <div className="text-[20px] font-semibold text-badge-danger-text font-mono mt-1">
            {formatCurrency(totalEnMora)}
          </div>
          <span className="text-[12px] text-badge-danger-text/80 font-medium mt-0.5 block">
            {moraLoans.length} créditos con pagos atrasados
          </span>
        </Card>
      </div>

      {/* Filters Toolbar */}
      <Card className="border border-border rounded-[6px] shadow-2xs">
        <CardContent className="p-3.5 flex flex-col md:flex-row gap-3 justify-between items-stretch md:items-center">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <Input
              type="text"
              placeholder="Buscar por folio, cliente o producto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-[34px] text-[13px] bg-white border-border rounded-[4px]"
            />
          </div>

          <div className="flex items-center gap-2.5 w-full md:w-auto">
            <Filter className="w-4 h-4 text-text-muted shrink-0" />
            <label htmlFor="loan-status-filter" className="text-[12px] text-text-muted font-medium whitespace-nowrap">
              Estatus:
            </label>
            <select
              id="loan-status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-[34px] px-3 py-1 rounded-[4px] border border-border bg-white text-text-secondary text-[13px] font-medium focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary transition-colors w-full md:w-auto"
            >
              <option value="todos">Todos los estatus</option>
              <option value="En Evaluación">En Evaluación (Pendientes)</option>
              <option value="Activo">Activos</option>
              <option value="En Mora">En Mora</option>
              <option value="Liquidado">Liquidados</option>
              <option value="Rechazado">Rechazados</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Tabla Contable de Préstamos */}
      <Card className="border border-border rounded-[6px] shadow-2xs overflow-hidden bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[190px]">Folio & Cliente</TableHead>
              <TableHead className="min-w-[170px]">Producto & Plazo</TableHead>
              <TableHead className="text-right min-w-[130px]">Monto Colocado</TableHead>
              <TableHead className="text-right min-w-[130px]">Saldo Pendiente</TableHead>
              <TableHead className="min-w-[180px]">Promotor & Cobro</TableHead>
              <TableHead className="min-w-[170px]">Trazabilidad</TableHead>
              <TableHead className="min-w-[120px]">Estatus</TableHead>
              <TableHead className="text-right min-w-[160px]">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredLoans.map((loan) => (
              <TableRow key={loan.id}>
                {/* Folio & Cliente */}
                <TableCell>
                  <div className="space-y-0.5">
                    <span className="inline-block font-mono text-[11px] bg-surface-subtle border border-border px-1.5 py-0.5 rounded-[4px] text-text-secondary font-medium select-all">
                      {loan.folio}
                    </span>
                    <p className="font-semibold text-foreground text-[13px] leading-tight">{loan.clienteNombre}</p>
                    {loan.clienteTelefono ? (
                      <a
                        href={`tel:${loan.clienteTelefono.replace(/\s+/g, '')}`}
                        className="inline-flex items-center gap-1 text-[11.5px] text-text-muted hover:text-link font-mono transition-colors"
                        title={`Llamar a ${loan.clienteNombre}`}
                      >
                        <Phone className="w-3 h-3 text-text-muted shrink-0" />
                        {loan.clienteTelefono}
                      </a>
                    ) : (
                      <p className="text-[11.5px] text-text-muted font-mono">Sin teléfono</p>
                    )}
                  </div>
                </TableCell>

                {/* Producto & Plazo */}
                <TableCell>
                  <div className="space-y-0.5">
                    <p className="font-semibold text-foreground text-[13px]">{loan.productoNombre}</p>
                    <p className="text-[12px] text-text-muted capitalize">
                      {loan.plazoCantidad} cuotas ({loan.frecuenciaPago})
                    </p>
                  </div>
                </TableCell>

                {/* Monto Colocado */}
                <TableCell className="text-right font-mono text-[13px] font-medium text-foreground">
                  <div>{formatCurrency(loan.montoPrincipal)}</div>
                  <span className="text-[11px] text-text-muted font-sans block">
                    Total: {formatCurrency(loan.totalAPagar)}
                  </span>
                </TableCell>

                {/* Saldo Pendiente */}
                <TableCell className="text-right font-mono text-[13px] font-semibold">
                  <span className={loan.saldoPendiente > 0 ? 'text-foreground' : 'text-text-muted'}>
                    {formatCurrency(loan.saldoPendiente)}
                  </span>
                </TableCell>

                {/* Promotor & Cobro */}
                <TableCell>
                  <div className="space-y-1">
                    <p className="font-medium text-foreground text-[13px]">{loan.promotorAsignado}</p>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="inline-flex items-center gap-1 text-[11.5px] text-text-muted bg-surface-subtle px-1.5 py-0.5 rounded-[4px] border border-border">
                        <Calendar className="w-3 h-3 text-text-muted shrink-0" />
                        Cobro: {loan.diaCobro || 'Sin asignar'}
                      </span>
                    </div>
                    {isAdmin && (
                      <button
                        type="button"
                        onClick={() => {
                          setReassignModalLoan(loan);
                          setSelectedNewPromoterName(loan.promotorAsignado);
                          setReassignError(null);
                        }}
                        className="inline-flex items-center gap-1 text-[11.5px] text-link hover:underline font-medium focus:outline-none"
                      >
                        <UserCog className="w-3 h-3" />
                        Reasignar Promotor
                      </button>
                    )}
                  </div>
                </TableCell>

                {/* Trazabilidad */}
                <TableCell>
                  <div className="space-y-0.5 text-[12px]">
                    <p className="text-text-secondary font-medium truncate max-w-[160px]">
                      {loan.solicitadoPorNombre || loan.promotorAsignado || 'Carlos Mendoza'}
                    </p>
                    <p className="text-[11px] text-text-muted font-mono">
                      {loan.fechaHoraSolicitud ? formatDateWithTime(loan.fechaHoraSolicitud) : formatDate(loan.fechaInicio)}
                    </p>
                    {loan.estatus === 'En Evaluación' ? (
                      <Badge variant="warning" className="text-[11px] px-1.5 py-0 font-medium">
                        Pendiente Dictamen
                      </Badge>
                    ) : (
                      <p className="text-[11px] text-text-muted truncate max-w-[160px]">
                        Dictamen: {loan.aprobadoPorNombre || 'Administrador'}
                      </p>
                    )}
                  </div>
                </TableCell>

                {/* Estatus */}
                <TableCell>
                  <LoanStatusBadge status={loan.estatus} />
                </TableCell>

                {/* Acciones */}
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1.5 flex-wrap">
                    {/* Botones de Dictamen para Administrador en solicitudes En Evaluación */}
                    {isAdmin && loan.estatus === 'En Evaluación' && (
                      <>
                        <Button
                          size="sm"
                          disabled={isProcessingAction}
                          onClick={() => handleApprove(loan.id)}
                          className="h-[28px] px-2.5 text-[12px] font-medium bg-[#00875a] hover:bg-[#00875a]/90 text-white gap-1 rounded-[4px]"
                          title="Aprobar Solicitud y Activar Crédito"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Aprobar
                        </Button>

                        <Button
                          size="sm"
                          variant="destructive"
                          disabled={isProcessingAction}
                          onClick={() => {
                            setRejectModalLoan(loan);
                            setMotivoRechazoInput('');
                            setRejectError(null);
                          }}
                          className="h-[28px] px-2.5 text-[12px] font-medium gap-1 rounded-[4px]"
                          title="Rechazar Solicitud"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          Rechazar
                        </Button>
                      </>
                    )}

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedLoanModal(loan)}
                      className="h-[28px] px-2.5 text-[12px] font-medium gap-1 rounded-[4px]"
                    >
                      <Eye className="w-3.5 h-3.5 text-primary" />
                      Ver Tabla
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}

            {filteredLoans.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="p-8 text-center text-text-muted text-[13px]">
                  No se encontraron préstamos con los criterios especificados.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Modal Ver Tabla de Amortización & Detalle (Stripe Styled) */}
      {selectedLoanModal && (
        <div
          className="fixed inset-0 z-50 bg-foreground/40 backdrop-blur-[2px] flex items-center justify-center p-4"
          onClick={(e) => {
            // Regla estricta: No cerrar modal al hacer click en el backdrop
            e.stopPropagation();
          }}
        >
          <div
            className="bg-card text-card-foreground w-full max-w-3xl p-6 rounded-[8px] border border-border shadow-lg space-y-4 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start border-b border-border pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[11px] bg-surface-subtle border border-border px-1.5 py-0.5 rounded-[4px] text-text-secondary font-medium">
                    {selectedLoanModal.folio}
                  </span>
                  <LoanStatusBadge status={selectedLoanModal.estatus} />
                </div>
                <h2 className="text-[18px] font-semibold text-foreground mt-1 tracking-tight">{selectedLoanModal.clienteNombre}</h2>
                <p className="text-[12.5px] text-text-muted">
                  Producto: {selectedLoanModal.productoNombre} ({selectedLoanModal.plazoCantidad} cuotas {selectedLoanModal.frecuenciaPago}s) • Promotor: {selectedLoanModal.promotorAsignado}
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setSelectedLoanModal(null)}
                className="h-8 w-8 text-text-muted hover:text-foreground rounded-[4px]"
                title="Cerrar modal (Esc)"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Banner de Rechazo si aplica */}
            {selectedLoanModal.estatus === 'Rechazado' && selectedLoanModal.motivoRechazo && (
              <div className="p-3.5 rounded-[6px] bg-badge-danger-bg border border-badge-danger-text/20 text-badge-danger-text text-[12.5px] space-y-1">
                <div className="flex items-center gap-2 font-semibold">
                  <XCircle className="w-4 h-4 shrink-0" />
                  <span>Solicitud de Crédito Rechazada</span>
                </div>
                <p className="text-text-secondary pl-6">
                  <strong>Motivo especificado por el Administrador:</strong> "{selectedLoanModal.motivoRechazo}"
                </p>
              </div>
            )}

            {/* Banner de Evaluación si aplica */}
            {selectedLoanModal.estatus === 'En Evaluación' && (
              <div className="p-3.5 rounded-[6px] bg-badge-warning-bg border border-badge-warning-text/20 text-badge-warning-text text-[12.5px] space-y-1">
                <div className="flex items-center gap-2 font-semibold">
                  <Clock className="w-4 h-4 shrink-0" />
                  <span>Solicitud Pendiente de Evaluación</span>
                </div>
                <p className="text-text-secondary pl-6">
                  Esta solicitud ingresada por un Promotor de Campo está pendiente de aprobación o rechazo por parte de un Administrador.
                </p>
              </div>
            )}

            {/* Bloque de Auditoría y Trazabilidad */}
            <div className="p-3.5 rounded-[6px] bg-surface-subtle border border-border space-y-2.5 text-[12.5px]">
              <h4 className="font-semibold text-foreground flex items-center gap-2 text-[13px]">
                <ShieldCheck className="w-4 h-4 text-primary" /> Trazabilidad de Solicitud y Cobro
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-2.5 rounded-[4px] bg-card border border-border space-y-0.5">
                  <span className="text-text-muted block text-[11px] font-medium">👤 Solicitado por:</span>
                  <p className="font-semibold text-foreground text-[12.5px]">{selectedLoanModal.solicitadoPorNombre || selectedLoanModal.promotorAsignado || 'Carlos Mendoza'}</p>
                  <p className="text-[11px] text-text-muted">{selectedLoanModal.solicitadoPorRol || selectedLoanModal.creadoPorRol || 'Promotor de Campo'}</p>
                  <p className="text-[11px] text-text-muted font-mono">
                    {selectedLoanModal.fechaHoraSolicitud ? formatDateWithTime(selectedLoanModal.fechaHoraSolicitud) : formatDate(selectedLoanModal.fechaInicio)}
                  </p>
                </div>

                <div className="p-2.5 rounded-[4px] bg-card border border-border space-y-0.5">
                  <span className="text-text-muted block text-[11px] font-medium">🛡️ Dictaminado por:</span>
                  <p className="font-semibold text-foreground text-[12.5px]">
                    {selectedLoanModal.aprobadoPorNombre || (selectedLoanModal.estatus === 'Activo' ? 'Carlos Mendoza' : selectedLoanModal.estatus === 'En Evaluación' ? 'Pendiente evaluación' : 'Sistema')}
                  </p>
                  <p className="text-[11px] text-text-muted">
                    {selectedLoanModal.estatus === 'En Evaluación' ? 'Pendiente' : 'Administrador'}
                  </p>
                  <p className="text-[11px] text-text-muted font-mono">
                    {selectedLoanModal.fechaHoraAprobacion ? formatDateWithTime(selectedLoanModal.fechaHoraAprobacion) : selectedLoanModal.estatus === 'En Evaluación' ? '-' : formatDate(selectedLoanModal.fechaInicio)}
                  </p>
                </div>

                <div className="p-2.5 rounded-[4px] bg-card border border-border space-y-0.5">
                  <div className="flex items-center justify-between">
                    <span className="text-text-muted block text-[11px] font-medium">🚚 Promotor Asignado:</span>
                    {isAdmin && (
                      <button
                        type="button"
                        onClick={() => {
                          setReassignModalLoan(selectedLoanModal);
                          setSelectedNewPromoterName(selectedLoanModal.promotorAsignado);
                          setReassignError(null);
                        }}
                        className="text-[11px] text-link hover:underline font-medium"
                      >
                        Reasignar
                      </button>
                    )}
                  </div>
                  <p className="font-semibold text-foreground text-[12.5px]">{selectedLoanModal.promotorAsignado}</p>
                  {selectedLoanModal.promotorAsignadoTelefono && (
                    <p className="text-[11px] text-text-muted font-mono flex items-center gap-1">
                      <Phone className="w-3 h-3 text-primary shrink-0" />
                      {selectedLoanModal.promotorAsignadoTelefono}
                    </p>
                  )}
                  {selectedLoanModal.diaCobro && (
                    <span className="text-[11px] text-text-muted block font-medium">
                      Cobro: {selectedLoanModal.diaCobro}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Métricas del Préstamo */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 text-[12.5px]">
              <div className="p-2.5 rounded-[6px] bg-surface-subtle border border-border">
                <span className="text-[11px] text-text-muted font-medium block">Monto Principal:</span>
                <p className="font-semibold text-foreground font-mono text-[14px] mt-0.5">{formatCurrency(selectedLoanModal.montoPrincipal)}</p>
              </div>
              <div className="p-2.5 rounded-[6px] bg-surface-subtle border border-border">
                <span className="text-[11px] text-text-muted font-medium block">Total a Pagar:</span>
                <p className="font-semibold text-foreground font-mono text-[14px] mt-0.5">{formatCurrency(selectedLoanModal.totalAPagar)}</p>
              </div>
              <div className="p-2.5 rounded-[6px] bg-surface-subtle border border-border">
                <span className="text-[11px] text-text-muted font-medium block">Saldo Pendiente:</span>
                <p className="font-semibold text-foreground font-mono text-[14px] mt-0.5">{formatCurrency(selectedLoanModal.saldoPendiente)}</p>
              </div>
              <div className="p-2.5 rounded-[6px] bg-surface-subtle border border-border">
                <span className="text-[11px] text-text-muted font-medium block">Día de Cobro:</span>
                <p className="font-semibold text-foreground text-[13px] mt-0.5">{selectedLoanModal.diaCobro || 'No asignado'}</p>
              </div>
              <div className="p-2.5 rounded-[6px] bg-surface-subtle border border-border">
                <span className="text-[11px] text-text-muted font-medium block">Fecha Solicitud:</span>
                <p className="font-semibold text-foreground text-[13px] mt-0.5">
                  {selectedLoanModal.fechaSolicitud ? formatDate(selectedLoanModal.fechaSolicitud) : 'No especificada'}
                </p>
              </div>
            </div>

            <h3 className="text-[14px] font-semibold text-foreground pt-1">Tabla de Amortización Completa</h3>

            <Card className="border border-border rounded-[6px] shadow-2xs overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="py-2">Cuota</TableHead>
                    <TableHead className="py-2">Vencimiento</TableHead>
                    <TableHead className="py-2 text-right">Cuota Total</TableHead>
                    <TableHead className="py-2 text-right">Monto Pagado</TableHead>
                    <TableHead className="py-2">Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="text-[12.5px]">
                  {selectedLoanModal.tablaAmortizacion.map((c) => {
                    const isMora = c.estado === 'Mora' || c.estado === 'Vencido';
                    const isEnRevision = c.estado === 'En Revisión';
                    const isPagado = c.estado === 'Pagado';
                    return (
                      <TableRow
                        key={c.numeroCuota}
                        className={
                          isEnRevision
                            ? 'bg-primary-subtle/50'
                            : isMora
                            ? 'bg-badge-danger-bg/40'
                            : isPagado
                            ? 'bg-badge-success-bg/30'
                            : ''
                        }
                      >
                        <TableCell className="p-2.5 font-mono font-medium">#{c.numeroCuota}</TableCell>
                        <TableCell className="p-2.5 font-sans text-text-secondary">{formatDateWithDay(c.fechaVencimiento)}</TableCell>
                        <TableCell className="p-2.5 text-right font-mono font-medium">
                          <div>
                            <span className={isMora ? 'text-badge-danger-text font-semibold' : 'text-foreground'}>
                              {formatCurrency(c.cuotaTotal)}
                            </span>
                            {c.recargoPenalizacion && c.recargoPenalizacion > 0 ? (
                              <span className="block text-[11px] text-badge-danger-text font-sans">
                                ⚠️ +{formatCurrency(c.recargoPenalizacion)} mora
                              </span>
                            ) : null}
                          </div>
                        </TableCell>
                        <TableCell className="p-2.5 text-right font-mono text-badge-success-text font-medium">
                          {formatCurrency(c.montoPagado)}
                        </TableCell>
                        <TableCell className="p-2.5">
                          <InstallmentStatusBadge status={c.estado} />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Card>
          </div>
        </div>
      )}

      {/* Modal para Rechazar Solicitud de Crédito (Con Motivo Obligatorio) */}
      {rejectModalLoan && (
        <div
          className="fixed inset-0 z-50 bg-foreground/40 backdrop-blur-[2px] flex items-center justify-center p-4"
          onClick={(e) => {
            // Regla estricta: No cerrar modal al hacer click en el backdrop
            e.stopPropagation();
          }}
        >
          <div
            ref={rejectModalScrollRef}
            className="bg-card text-card-foreground w-full max-w-md p-6 rounded-[8px] border border-border shadow-lg space-y-4 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center pb-2 border-b border-border">
              <h2 className="text-[16px] font-semibold text-foreground flex items-center gap-2">
                <XCircle className="w-5 h-5 text-badge-danger-text" />
                Rechazar Solicitud de Crédito
              </h2>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                disabled={isProcessingAction}
                onClick={() => {
                  setRejectModalLoan(null);
                  setMotivoRechazoInput('');
                  setRejectError(null);
                }}
                className="h-8 w-8 text-text-muted hover:text-foreground rounded-[4px]"
                title="Cerrar modal (Esc)"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="p-3 rounded-[6px] bg-surface-subtle border border-border text-[12.5px] space-y-1">
              <p className="text-text-muted">
                Solicitud Folio: <span className="font-mono text-[11px] bg-white border border-border px-1.5 py-0.5 rounded-[4px] text-text-secondary font-medium">{rejectModalLoan.folio}</span>
              </p>
              <p className="text-foreground font-semibold">{rejectModalLoan.clienteNombre}</p>
              <p className="text-text-muted">
                Monto: <span className="font-mono">{formatCurrency(rejectModalLoan.montoPrincipal)}</span> • Producto: {rejectModalLoan.productoNombre}
              </p>
            </div>

            {/* Error Banner */}
            {rejectError && (
              <div className="p-3 rounded-[6px] bg-badge-danger-bg border border-badge-danger-text/20 text-badge-danger-text text-[12.5px] font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{rejectError}</span>
              </div>
            )}

            <form onSubmit={handleConfirmReject} noValidate className="space-y-4 text-[13px]">
              <div>
                <label className="block text-text-secondary font-medium mb-1.5">
                  Motivo de Rechazo * <span className="text-text-muted font-normal">(Obligatorio)</span>
                </label>
                <textarea
                  required
                  rows={4}
                  disabled={isProcessingAction}
                  placeholder="Explique detalladamente la razón por la cual se rechaza esta solicitud de crédito..."
                  value={motivoRechazoInput}
                  onChange={(e) => setMotivoRechazoInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-[4px] border border-border bg-white text-foreground text-[13px] placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-primary disabled:opacity-50 transition-colors"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  disabled={isProcessingAction}
                  onClick={() => {
                    setRejectModalLoan(null);
                    setMotivoRechazoInput('');
                    setRejectError(null);
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  variant="destructive"
                  disabled={isProcessingAction}
                  className="gap-1.5"
                >
                  {isProcessingAction ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Procesando...
                    </>
                  ) : (
                    <>
                      <XCircle className="w-4 h-4" /> Confirmar Rechazo
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal para Reasignar Promotor (Administrador) */}
      {reassignModalLoan && (
        <div
          className="fixed inset-0 z-50 bg-foreground/40 backdrop-blur-[2px] flex items-center justify-center p-4"
          onClick={(e) => {
            // Regla estricta: No cerrar modal al hacer click en el backdrop
            e.stopPropagation();
          }}
        >
          <div
            className="bg-card text-card-foreground w-full max-w-md p-6 rounded-[8px] border border-border shadow-lg space-y-4 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center pb-2 border-b border-border">
              <h2 className="text-[16px] font-semibold text-foreground flex items-center gap-2">
                <UserCog className="w-5 h-5 text-primary" />
                Reasignar Promotor de Cobro
              </h2>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                disabled={isProcessingAction}
                onClick={() => {
                  setReassignModalLoan(null);
                  setSelectedNewPromoterName('');
                  setReassignError(null);
                }}
                className="h-8 w-8 text-text-muted hover:text-foreground rounded-[4px]"
                title="Cerrar modal (Esc)"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="p-3 rounded-[6px] bg-surface-subtle border border-border text-[12.5px] space-y-1">
              <p className="text-text-muted">
                Préstamo Folio: <span className="font-mono text-[11px] bg-white border border-border px-1.5 py-0.5 rounded-[4px] text-text-secondary font-medium">{reassignModalLoan.folio}</span>
              </p>
              <p className="text-foreground font-semibold">{reassignModalLoan.clienteNombre}</p>
              <p className="text-text-muted">
                Promotor Actual: <strong className="text-foreground font-medium">{reassignModalLoan.promotorAsignado}</strong> (Día: {reassignModalLoan.diaCobro || 'Sin día'})
              </p>
            </div>

            {/* Banner de Error */}
            {reassignError && (
              <div className="p-3 rounded-[6px] bg-badge-danger-bg border border-badge-danger-text/20 text-badge-danger-text text-[12.5px] font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{reassignError}</span>
              </div>
            )}

            <form onSubmit={handleConfirmReassign} noValidate className="space-y-4 text-[13px]">
              <div>
                <label className="block text-text-secondary font-medium mb-1.5">
                  Nuevo Promotor Asignado *
                </label>
                <select
                  required
                  disabled={isProcessingAction}
                  value={selectedNewPromoterName}
                  onChange={(e) => setSelectedNewPromoterName(e.target.value)}
                  className="w-full h-[36px] px-3 py-1.5 rounded-[4px] border border-border bg-white text-foreground font-normal text-[13px] focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary transition-colors disabled:opacity-50"
                >
                  <option value="">Selecciona un colaborador...</option>
                  {users
                    .filter((u) => u.estatus === 'Activo')
                    .map((u) => (
                      <option key={u.id} value={u.name}>
                        {u.name} ({u.role}) - Cobro: {u.diaCobroAsignado || 'Sin día'}
                      </option>
                    ))}
                </select>
              </div>

              {/* Vista previa del promotor seleccionado */}
              {selectedNewPromoterName && (
                <div className="p-3 rounded-[6px] bg-surface-subtle border border-border text-[12.5px] space-y-1 text-text-secondary">
                  {(() => {
                    const sel = users.find((u) => u.name === selectedNewPromoterName);
                    if (!sel) return null;
                    return (
                      <>
                        <p className="font-semibold text-foreground">Detalles del Nuevo Promotor:</p>
                        <p>👤 Nombre: {sel.name}</p>
                        <p>📞 Teléfono: {sel.telefono || 'Sin teléfono'}</p>
                        <p>🗓️ Día de Cobro Asignado: <strong>{sel.diaCobroAsignado || 'Sin asignar'}</strong></p>
                        <p className="text-[11px] text-text-muted pt-1">
                          Nota: Al reasignar, el día de cobro del crédito se actualizará a <strong>{sel.diaCobroAsignado || 'Sin asignar'}</strong>.
                        </p>
                      </>
                    );
                  })()}
                </div>
              )}

              <div className="flex justify-end gap-2.5 pt-3 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  disabled={isProcessingAction}
                  onClick={() => {
                    setReassignModalLoan(null);
                    setSelectedNewPromoterName('');
                    setReassignError(null);
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  variant="stripe-actions"
                  disabled={isProcessingAction}
                  className="gap-1.5"
                >
                  {isProcessingAction ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Guardando...
                    </>
                  ) : (
                    <>
                      <UserCheck className="w-4 h-4" /> Confirmar Reasignación
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
