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
      <Card className="flex flex-col items-center justify-center min-h-[400px] p-12 space-y-4 my-8 bg-card border-border shadow-sm">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
        <p className="text-base font-semibold text-muted-foreground">Consultando préstamos en tiempo real desde PostgreSQL...</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground flex items-center gap-2.5 tracking-tight">
            <Banknote className="w-8 h-8 text-primary" />
            Gestión de Préstamos y Solicitudes
          </h1>
          <p className="text-base text-muted-foreground mt-1">
            Monitoreo de cartera, aprobación de solicitudes y tablas de amortización.
          </p>
        </div>

        <Button asChild className="h-12 px-6 min-h-[44px] text-base font-bold shadow-sm">
          <Link href="/prestamos/nuevo">
            <Plus className="w-5 h-5 stroke-[2.5]" />
            Nuevo Préstamo
          </Link>
        </Button>
      </div>

      {/* Filters Toolbar */}
      <Card className="border-border shadow-sm">
        <CardContent className="p-4 flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
          <div className="relative w-full md:w-96">
            <Search className="w-5 h-5 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <Input
              type="text"
              placeholder="Buscar por Folio, Cliente o Producto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-11 h-12 text-base bg-white"
            />
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <Filter className="w-5 h-5 text-muted-foreground shrink-0" />
            <label htmlFor="loan-status-filter" className="text-base text-muted-foreground font-semibold whitespace-nowrap">
              Estatus:
            </label>
            <select
              id="loan-status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-12 min-h-[44px] px-4 py-2 rounded-xl border border-input bg-white text-foreground text-base font-medium focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-colors w-full md:w-auto"
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

      {/* Loans Table */}
      <Card className="border-border shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[180px]">Folio & Cliente</TableHead>
              <TableHead className="min-w-[170px]">Producto & Montos</TableHead>
              <TableHead className="min-w-[170px]">Solicitado por</TableHead>
              <TableHead className="min-w-[170px]">Dictaminado por</TableHead>
              <TableHead className="min-w-[190px]">Promotor</TableHead>
              <TableHead className="min-w-[130px]">Estatus</TableHead>
              <TableHead className="text-right min-w-[160px]">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredLoans.map((loan) => (
              <TableRow key={loan.id}>
                <TableCell>
                  <div className="space-y-0.5">
                    <span className="font-mono font-bold text-primary text-base block">{loan.folio}</span>
                    <p className="font-bold text-foreground text-base">{loan.clienteNombre}</p>
                    {loan.clienteTelefono ? (
                      <a
                        href={`tel:${loan.clienteTelefono.replace(/\s+/g, '')}`}
                        className="inline-flex items-center gap-1.5 text-sm text-slate-700 hover:text-primary font-mono font-bold hover:underline mt-0.5"
                        title={`Llamar a ${loan.clienteNombre}`}
                      >
                        <Phone className="w-3.5 h-3.5 text-primary shrink-0" />
                        {loan.clienteTelefono}
                      </a>
                    ) : (
                      <p className="text-sm text-muted-foreground font-mono">Sin teléfono</p>
                    )}
                  </div>
                </TableCell>

                <TableCell>
                  <div className="space-y-0.5">
                    <p className="font-bold text-foreground text-base">{loan.productoNombre}</p>
                    <p className="text-sm text-muted-foreground capitalize">
                      {loan.plazoCantidad} cuotas ({loan.frecuenciaPago})
                    </p>
                    <p className="text-sm font-semibold text-foreground mt-1">
                      Monto: {formatCurrency(loan.montoPrincipal)}
                    </p>
                    <p className="text-sm font-extrabold text-emerald-800">
                      Saldo: {formatCurrency(loan.saldoPendiente)}
                    </p>
                  </div>
                </TableCell>

                <TableCell>
                  <div className="space-y-0.5">
                    <p className="font-bold text-foreground text-sm">
                      {loan.solicitadoPorNombre || loan.promotorAsignado || 'Carlos Mendoza'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {loan.solicitadoPorRol || loan.creadoPorRol || 'Promotor de Campo'}
                    </p>
                    <p className="text-xs text-muted-foreground font-mono">
                      {loan.fechaHoraSolicitud ? formatDateWithTime(loan.fechaHoraSolicitud) : formatDate(loan.fechaInicio)}
                    </p>
                  </div>
                </TableCell>

                <TableCell>
                  <div className="space-y-0.5">
                    {loan.estatus === 'En Evaluación' ? (
                      <Badge variant="warning" className="text-xs font-bold">
                        Pendiente evaluación
                      </Badge>
                    ) : (
                      <div>
                        <p className="font-bold text-foreground text-sm">
                          {loan.aprobadoPorNombre || 'Carlos Mendoza'}
                        </p>
                        <p className="text-sm text-muted-foreground">Administrador</p>
                        <p className="text-xs text-muted-foreground font-mono">
                          {loan.fechaHoraAprobacion ? formatDateWithTime(loan.fechaHoraAprobacion) : formatDate(loan.fechaInicio)}
                        </p>
                      </div>
                    )}
                  </div>
                </TableCell>

                <TableCell>
                  <div className="space-y-1">
                    <p className="font-bold text-foreground text-sm">{loan.promotorAsignado}</p>
                    {loan.promotorAsignadoTelefono && (
                      <a
                        href={`tel:${loan.promotorAsignadoTelefono.replace(/\s+/g, '')}`}
                        className="inline-flex items-center gap-1.5 text-sm text-slate-700 hover:text-primary font-mono font-medium hover:underline"
                        title={`Llamar a ${loan.promotorAsignado}`}
                      >
                        <Phone className="w-3.5 h-3.5 text-primary shrink-0" />
                        {loan.promotorAsignadoTelefono}
                      </a>
                    )}
                    <div>
                      <Badge variant="outline" className="gap-1 bg-slate-100 text-slate-800 border-slate-300 font-bold text-xs py-0.5 px-2">
                        <Calendar className="w-3.5 h-3.5 text-primary shrink-0" />
                        Cobro: {loan.diaCobro || 'Sin asignar'}
                      </Badge>
                    </div>
                    {isAdmin && (
                      <button
                        type="button"
                        onClick={() => {
                          setReassignModalLoan(loan);
                          setSelectedNewPromoterName(loan.promotorAsignado);
                          setReassignError(null);
                        }}
                        className="inline-flex items-center gap-1 text-xs text-primary hover:text-primary/80 font-bold underline pt-1 focus:outline-none"
                      >
                        <UserCog className="w-3.5 h-3.5" />
                        Reasignar Promotor
                      </button>
                    )}
                  </div>
                </TableCell>

                <TableCell>
                  <LoanStatusBadge status={loan.estatus} />
                </TableCell>

                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2 flex-wrap">
                    {/* Botones de Dictamen para Administrador en solicitudes En Evaluación */}
                    {isAdmin && loan.estatus === 'En Evaluación' && (
                      <>
                        <Button
                          size="sm"
                          disabled={isProcessingAction}
                          onClick={() => handleApprove(loan.id)}
                          className="h-11 min-h-[44px] px-3 font-bold bg-emerald-700 hover:bg-emerald-800 text-white gap-1.5 text-xs shadow-xs"
                          title="Aprobar Solicitud y Activar Crédito"
                        >
                          <CheckCircle2 className="w-4 h-4" />
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
                          className="h-11 min-h-[44px] px-3 font-bold bg-rose-700 hover:bg-rose-800 text-white gap-1.5 text-xs shadow-xs"
                          title="Rechazar Solicitud"
                        >
                          <XCircle className="w-4 h-4" />
                          Rechazar
                        </Button>
                      </>
                    )}

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedLoanModal(loan)}
                      className="h-11 min-h-[44px] px-3.5 font-bold border-border bg-white text-foreground hover:bg-slate-100 gap-1.5 text-xs shadow-xs"
                    >
                      <Eye className="w-4 h-4 text-primary" />
                      Ver Tabla
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}

            {filteredLoans.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="p-8 text-center text-muted-foreground text-base">
                  No se encontraron préstamos con los criterios especificados.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Modal Ver Tabla de Amortización & Detalle */}
      {selectedLoanModal && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={(e) => {
            // Regla estricta: No cerrar modal al hacer click en el backdrop
            e.stopPropagation();
          }}
        >
          <div
            className="bg-card text-card-foreground w-full max-w-3xl p-6 rounded-2xl border border-border shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start border-b border-border pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-bold text-primary">{selectedLoanModal.folio}</span>
                  <LoanStatusBadge status={selectedLoanModal.estatus} />
                </div>
                <h2 className="text-xl font-extrabold text-foreground mt-1">{selectedLoanModal.clienteNombre}</h2>
                <p className="text-sm text-muted-foreground">
                  Producto: {selectedLoanModal.productoNombre} ({selectedLoanModal.plazoCantidad} cuotas {selectedLoanModal.frecuenciaPago}s) • Promotor: {selectedLoanModal.promotorAsignado}
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setSelectedLoanModal(null)}
                className="h-11 w-11 min-h-[44px] min-w-[44px] text-muted-foreground hover:text-foreground hover:bg-slate-100 rounded-xl"
                title="Cerrar modal (Esc)"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Banner de Rechazo si aplica */}
            {selectedLoanModal.estatus === 'Rechazado' && selectedLoanModal.motivoRechazo && (
              <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-sm space-y-1">
                <div className="flex items-center gap-2 font-bold text-rose-800">
                  <XCircle className="w-4 h-4 shrink-0 text-rose-700" />
                  <span>Solicitud de Crédito Rechazada</span>
                </div>
                <p className="text-slate-800 pl-6">
                  <strong>Motivo especificado por el Administrador:</strong> "{selectedLoanModal.motivoRechazo}"
                </p>
              </div>
            )}

            {/* Banner de Evaluación si aplica */}
            {selectedLoanModal.estatus === 'En Evaluación' && (
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-sm space-y-1">
                <div className="flex items-center gap-2 font-bold text-amber-800">
                  <Clock className="w-4 h-4 shrink-0 text-amber-700" />
                  <span>Solicitud Pendiente de Evaluación</span>
                </div>
                <p className="text-slate-800 pl-6">
                  Esta solicitud ingresada por un Promotor de Campo está pendiente de aprobación o rechazo por parte de un Administrador.
                </p>
              </div>
            )}

            {/* Bloque de Auditoría y Promotor Asignado */}
            <div className="p-4 rounded-xl bg-slate-50 border border-border space-y-3 text-sm">
              <h4 className="font-extrabold text-foreground uppercase tracking-wider flex items-center gap-2 text-sm">
                <ShieldCheck className="w-5 h-5 text-primary" /> Trazabilidad de Solicitud y Cobro
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 rounded-lg bg-card border border-border space-y-1">
                  <span className="text-muted-foreground block text-xs font-semibold">👤 Solicitado por:</span>
                  <p className="font-bold text-foreground text-sm">{selectedLoanModal.solicitadoPorNombre || selectedLoanModal.promotorAsignado || 'Carlos Mendoza'}</p>
                  <p className="text-xs text-muted-foreground">{selectedLoanModal.solicitadoPorRol || selectedLoanModal.creadoPorRol || 'Promotor de Campo'}</p>
                  <p className="text-xs text-muted-foreground font-mono">
                    {selectedLoanModal.fechaHoraSolicitud ? formatDateWithTime(selectedLoanModal.fechaHoraSolicitud) : formatDate(selectedLoanModal.fechaInicio)}
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-card border border-border space-y-1">
                  <span className="text-muted-foreground block text-xs font-semibold">🛡️ Dictaminado por:</span>
                  <p className="font-bold text-foreground text-sm">
                    {selectedLoanModal.aprobadoPorNombre || (selectedLoanModal.estatus === 'Activo' ? 'Carlos Mendoza' : selectedLoanModal.estatus === 'En Evaluación' ? 'Pendiente evaluación' : 'Sistema')}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {selectedLoanModal.estatus === 'En Evaluación' ? 'Pendiente' : 'Administrador'}
                  </p>
                  <p className="text-xs text-muted-foreground font-mono">
                    {selectedLoanModal.fechaHoraAprobacion ? formatDateWithTime(selectedLoanModal.fechaHoraAprobacion) : selectedLoanModal.estatus === 'En Evaluación' ? '-' : formatDate(selectedLoanModal.fechaInicio)}
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-card border border-border space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground block text-xs font-semibold">🚚 Promotor:</span>
                    {isAdmin && (
                      <button
                        type="button"
                        onClick={() => {
                          setReassignModalLoan(selectedLoanModal);
                          setSelectedNewPromoterName(selectedLoanModal.promotorAsignado);
                          setReassignError(null);
                        }}
                        className="text-xs text-primary hover:text-primary/80 font-bold underline"
                      >
                        Reasignar
                      </button>
                    )}
                  </div>
                  <p className="font-bold text-foreground text-sm">{selectedLoanModal.promotorAsignado}</p>
                  {selectedLoanModal.promotorAsignadoTelefono && (
                    <p className="text-xs text-slate-700 font-mono flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-primary shrink-0" />
                      {selectedLoanModal.promotorAsignadoTelefono}
                    </p>
                  )}
                  {selectedLoanModal.diaCobro && (
                    <Badge variant="outline" className="text-xs bg-slate-100 text-slate-800 border-slate-300 font-bold">
                      Cobro: {selectedLoanModal.diaCobro}
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-sm">
              <div className="p-3 rounded-xl bg-slate-50 border border-border">
                <span className="text-xs text-muted-foreground font-semibold block">Monto Principal:</span>
                <p className="font-bold text-foreground text-base mt-0.5">{formatCurrency(selectedLoanModal.montoPrincipal)}</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-border">
                <span className="text-xs text-muted-foreground font-semibold block">Total a Pagar:</span>
                <p className="font-bold text-foreground text-base mt-0.5">{formatCurrency(selectedLoanModal.totalAPagar)}</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-border">
                <span className="text-xs text-muted-foreground font-semibold block">Saldo Pendiente:</span>
                <p className="font-extrabold text-emerald-800 text-base mt-0.5">{formatCurrency(selectedLoanModal.saldoPendiente)}</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-border">
                <span className="text-xs text-muted-foreground font-semibold block">Día de Cobro:</span>
                <p className="font-bold text-foreground text-base mt-0.5">{selectedLoanModal.diaCobro || 'No asignado'}</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-border">
                <span className="text-xs text-muted-foreground font-semibold block">Fecha Solicitud:</span>
                <p className="font-bold text-slate-800 text-base mt-0.5">
                  {selectedLoanModal.fechaSolicitud ? formatDate(selectedLoanModal.fechaSolicitud) : 'No especificada'}
                </p>
              </div>
            </div>

            <h3 className="text-base font-bold text-foreground pt-2">Tabla de Amortización Completa</h3>

            <Card className="border-border shadow-xs overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="py-2.5">Cuota</TableHead>
                    <TableHead className="py-2.5">Día y Vencimiento</TableHead>
                    <TableHead className="py-2.5">Cuota Total</TableHead>
                    <TableHead className="py-2.5">Monto Pagado</TableHead>
                    <TableHead className="py-2.5">Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="font-mono text-sm">
                  {selectedLoanModal.tablaAmortizacion.map((c) => {
                    const isMora = c.estado === 'Mora' || c.estado === 'Vencido';
                    const isEnRevision = c.estado === 'En Revisión';
                    const isPagado = c.estado === 'Pagado';
                    return (
                      <TableRow
                        key={c.numeroCuota}
                        className={
                          isEnRevision
                            ? 'bg-indigo-50/70 border-l-4 border-l-indigo-600 font-semibold'
                            : isMora
                            ? 'bg-rose-50/80 border-l-4 border-l-rose-600 font-semibold'
                            : isPagado
                            ? 'bg-emerald-50/40'
                            : 'hover:bg-slate-50/80'
                        }
                      >
                        <TableCell className="p-3 font-bold">#{c.numeroCuota}</TableCell>
                        <TableCell className="p-3 font-sans font-medium">{formatDateWithDay(c.fechaVencimiento)}</TableCell>
                        <TableCell className="p-3 font-bold">
                          <div>
                            <span className={isMora ? 'text-rose-900 font-extrabold' : 'text-foreground'}>
                              {formatCurrency(c.cuotaTotal)}
                            </span>
                            {c.recargoPenalizacion && c.recargoPenalizacion > 0 ? (
                              <span className="block text-xs text-rose-800 font-bold font-sans">
                                ⚠️ +{formatCurrency(c.recargoPenalizacion)} recargo mora
                              </span>
                            ) : null}
                          </div>
                        </TableCell>
                        <TableCell className="p-3 text-emerald-800 font-bold">{formatCurrency(c.montoPagado)}</TableCell>
                        <TableCell className="p-3">
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
          className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={(e) => {
            // Regla estricta: No cerrar modal al hacer click en el backdrop
            e.stopPropagation();
          }}
        >
          <div
            ref={rejectModalScrollRef}
            className="bg-card text-card-foreground w-full max-w-md p-6 rounded-2xl border border-border shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center pb-2 border-b border-border">
              <h2 className="text-xl font-extrabold text-foreground flex items-center gap-2">
                <XCircle className="w-6 h-6 text-rose-700" />
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
                className="h-11 w-11 min-h-[44px] min-w-[44px] text-muted-foreground hover:text-foreground hover:bg-slate-100 rounded-xl"
                title="Cerrar modal (Esc)"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-border text-sm space-y-1">
              <p className="text-muted-foreground">Solicitud Folio: <strong className="text-primary font-mono">{rejectModalLoan.folio}</strong></p>
              <p className="text-foreground font-bold">{rejectModalLoan.clienteNombre}</p>
              <p className="text-muted-foreground">Monto: {formatCurrency(rejectModalLoan.montoPrincipal)} • Producto: {rejectModalLoan.productoNombre}</p>
            </div>

            {/* Error Banner */}
            {rejectError && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-sm font-semibold flex items-center gap-2.5">
                <AlertCircle className="w-5 h-5 shrink-0 text-rose-700" />
                <span>{rejectError}</span>
              </div>
            )}

            <form onSubmit={handleConfirmReject} noValidate className="space-y-4 text-sm">
              <div>
                <label className="block text-foreground font-semibold mb-1.5 text-base">
                  Motivo de Rechazo * <span className="text-muted-foreground font-normal">(Obligatorio)</span>
                </label>
                <textarea
                  required
                  rows={4}
                  disabled={isProcessingAction}
                  placeholder="Explique detalladamente la razón por la cual se rechaza esta solicitud de crédito..."
                  value={motivoRechazoInput}
                  onChange={(e) => setMotivoRechazoInput(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-input bg-white text-foreground text-base focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-50 transition-colors"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  disabled={isProcessingAction}
                  onClick={() => {
                    setRejectModalLoan(null);
                    setMotivoRechazoInput('');
                    setRejectError(null);
                  }}
                  className="h-12 min-h-[44px] px-5 font-semibold text-base"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  variant="destructive"
                  disabled={isProcessingAction}
                  className="h-12 min-h-[44px] px-6 font-bold text-base bg-rose-700 hover:bg-rose-800 text-white flex items-center gap-2"
                >
                  {isProcessingAction ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Procesando...
                    </>
                  ) : (
                    <>
                      <XCircle className="w-5 h-5" /> Confirmar Rechazo
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
          className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={(e) => {
            // Regla estricta: No cerrar modal al hacer click en el backdrop
            e.stopPropagation();
          }}
        >
          <div
            className="bg-card text-card-foreground w-full max-w-md p-6 rounded-2xl border border-border shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center pb-2 border-b border-border">
              <h2 className="text-xl font-extrabold text-foreground flex items-center gap-2">
                <UserCog className="w-6 h-6 text-primary" />
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
                className="h-11 w-11 min-h-[44px] min-w-[44px] text-muted-foreground hover:text-foreground hover:bg-slate-100 rounded-xl"
                title="Cerrar modal (Esc)"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-border text-sm space-y-1">
              <p className="text-muted-foreground">Préstamo Folio: <strong className="text-primary font-mono">{reassignModalLoan.folio}</strong></p>
              <p className="text-foreground font-bold">{reassignModalLoan.clienteNombre}</p>
              <p className="text-muted-foreground">Promotor Actual: <strong className="text-foreground">{reassignModalLoan.promotorAsignado}</strong> (Día: {reassignModalLoan.diaCobro || 'Sin día'})</p>
            </div>

            {/* Banner de Error */}
            {reassignError && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-sm font-semibold flex items-center gap-2.5">
                <AlertCircle className="w-5 h-5 shrink-0 text-rose-700" />
                <span>{reassignError}</span>
              </div>
            )}

            <form onSubmit={handleConfirmReassign} noValidate className="space-y-4 text-sm">
              <div>
                <label className="block text-foreground font-semibold mb-1.5 text-base">
                  Nuevo Promotor Asignado *
                </label>
                <select
                  required
                  disabled={isProcessingAction}
                  value={selectedNewPromoterName}
                  onChange={(e) => setSelectedNewPromoterName(e.target.value)}
                  className="w-full h-12 min-h-[44px] px-4 py-2 rounded-xl border border-input bg-white text-foreground font-semibold text-base focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-colors disabled:opacity-50"
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
                <div className="p-3.5 rounded-xl bg-slate-50 border border-border text-sm space-y-1 text-slate-800">
                  {(() => {
                    const sel = users.find((u) => u.name === selectedNewPromoterName);
                    if (!sel) return null;
                    return (
                      <>
                        <p className="font-bold text-foreground">Detalles del Nuevo Promotor:</p>
                        <p>👤 Nombre: {sel.name}</p>
                        <p>📞 Teléfono: {sel.telefono || 'Sin teléfono'}</p>
                        <p>🗓️ Día de Cobro Asignado: <strong>{sel.diaCobroAsignado || 'Sin asignar'}</strong></p>
                        <p className="text-xs text-muted-foreground pt-1">
                          Nota: Al reasignar, el día de cobro del crédito se actualizará a <strong>{sel.diaCobroAsignado || 'Sin asignar'}</strong>.
                        </p>
                      </>
                    );
                  })()}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-3 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  disabled={isProcessingAction}
                  onClick={() => {
                    setReassignModalLoan(null);
                    setSelectedNewPromoterName('');
                    setReassignError(null);
                  }}
                  className="h-12 min-h-[44px] px-5 font-semibold text-base"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={isProcessingAction}
                  className="h-12 min-h-[44px] px-6 font-bold text-base bg-primary hover:bg-primary/90 text-primary-foreground flex items-center gap-2"
                >
                  {isProcessingAction ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Guardando...
                    </>
                  ) : (
                    <>
                      <UserCheck className="w-5 h-5" /> Confirmar Reasignación
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
