'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Banknote, Search, Plus, Calendar, Eye, AlertTriangle, ShieldCheck, Filter, CheckCircle2, XCircle, Clock, Loader2, AlertCircle, UserCheck, UserCog, Phone, User as UserIcon } from 'lucide-react';
import { useImpulsoStore } from '@/store/useImpulsoStore';
import { LoanStatusBadge, InstallmentStatusBadge } from '@/components/shared/StatusBadges';
import { formatCurrency, formatDate, formatDateWithDay, formatDateWithTime } from '@/lib/utils';
import { Loan } from '@/types';
import { approveLoanAction, rejectLoanAction, reassignPromoterAction } from '@/app/actions/loanActions';

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
        } else if (selectedLoanModal) {
          setSelectedLoanModal(null);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedLoanModal, rejectModalLoan]);

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
      <div className="flex flex-col items-center justify-center min-h-[400px] p-12 space-y-4 glass-panel rounded-3xl border border-slate-800 my-8">
        <Loader2 className="w-10 h-10 text-emerald-400 animate-spin" />
        <p className="text-sm font-semibold text-slate-300">Consultando préstamos en tiempo real desde PostgreSQL...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white flex items-center gap-2 tracking-tight">
            <Banknote className="w-7 h-7 text-emerald-400" />
            Gestión de Préstamos y Solicitudes
          </h1>
          <p className="text-sm text-slate-400">
            Monitoreo de cartera, aprobación de solicitudes y tablas de amortización.
          </p>
        </div>

        <Link
          href="/prestamos/nuevo"
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-extrabold text-sm shadow-lg shadow-emerald-500/20 transition-all"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          Nuevo Préstamo
        </Link>
      </div>

      {/* Filters Toolbar */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex flex-col md:flex-row gap-3 justify-between items-center">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por Folio, Cliente o Producto..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-900/90 border border-slate-700 text-white text-xs focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-xs text-slate-400 font-medium">Estatus:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-emerald-500"
          >
            <option value="todos">Todos los estatus</option>
            <option value="En Evaluación">En Evaluación (Pendientes)</option>
            <option value="Activo">Activos</option>
            <option value="En Mora">En Mora</option>
            <option value="Liquidado">Liquidados</option>
            <option value="Rechazado">Rechazados</option>
          </select>
        </div>
      </div>

      {/* Loans Table */}
      <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[950px]">
            <thead className="bg-slate-900/90 text-slate-400 font-semibold border-b border-slate-800 uppercase tracking-wider whitespace-nowrap">
              <tr>
                <th className="p-4 min-w-[170px]">Folio & Cliente</th>
                <th className="p-4 min-w-[160px]">Producto & Montos</th>
                <th className="p-4 min-w-[160px]">Solicitado por</th>
                <th className="p-4 min-w-[160px]">Dictaminado por</th>
                <th className="p-4 min-w-[180px]">Promotor</th>
                <th className="p-4 min-w-[120px]">Estatus</th>
                <th className="p-4 text-right min-w-[150px]">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filteredLoans.map((loan) => (
                <tr key={loan.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="p-4">
                    <div>
                      <span className="font-mono font-bold text-emerald-400">{loan.folio}</span>
                      <p className="font-bold text-white text-sm">{loan.clienteNombre}</p>
                      {loan.clienteTelefono ? (
                        <a
                          href={`tel:${loan.clienteTelefono.replace(/\s+/g, '')}`}
                          className="inline-flex items-center gap-1 text-[11px] text-emerald-400 hover:text-emerald-300 font-mono font-bold hover:underline mt-0.5"
                          title={`Llamar a ${loan.clienteNombre}`}
                        >
                          <Phone className="w-3 h-3 text-emerald-400 shrink-0" />
                          {loan.clienteTelefono}
                        </a>
                      ) : (
                        <p className="text-[11px] text-slate-500 font-mono">Sin teléfono</p>
                      )}
                    </div>
                  </td>

                  <td className="p-4">
                    <p className="font-semibold text-slate-200">{loan.productoNombre}</p>
                    <p className="text-[11px] text-slate-400 capitalize">
                      {loan.plazoCantidad} cuotas ({loan.frecuenciaPago})
                    </p>
                    <p className="text-xs font-bold text-white mt-1">
                      Monto: {formatCurrency(loan.montoPrincipal)}
                    </p>
                    <p className="text-[11px] font-extrabold text-emerald-400">
                      Saldo: {formatCurrency(loan.saldoPendiente)}
                    </p>
                  </td>

                  <td className="p-4 space-y-0.5">
                    <p className="font-bold text-white text-xs">
                      {loan.solicitadoPorNombre || loan.promotorAsignado || 'Carlos Mendoza'}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      {loan.solicitadoPorRol || loan.creadoPorRol || 'Promotor de Campo'}
                    </p>
                    <p className="text-[10px] text-slate-500 font-mono">
                      {loan.fechaHoraSolicitud ? formatDateWithTime(loan.fechaHoraSolicitud) : formatDate(loan.fechaInicio)}
                    </p>
                  </td>

                  <td className="p-4 space-y-0.5">
                    {loan.estatus === 'En Evaluación' ? (
                      <div>
                        <span className="inline-block text-[10px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded">
                          Pendiente evaluación
                        </span>
                      </div>
                    ) : (
                      <div>
                        <p className="font-bold text-white text-xs">
                          {loan.aprobadoPorNombre || 'Carlos Mendoza'}
                        </p>
                        <p className="text-[11px] text-slate-400">Administrador</p>
                        <p className="text-[10px] text-slate-500 font-mono">
                          {loan.fechaHoraAprobacion ? formatDateWithTime(loan.fechaHoraAprobacion) : formatDate(loan.fechaInicio)}
                        </p>
                      </div>
                    )}
                  </td>

                  <td className="p-4 space-y-1">
                    <p className="font-extrabold text-white text-xs">{loan.promotorAsignado}</p>
                    {loan.promotorAsignadoTelefono && (
                      <a
                        href={`tel:${loan.promotorAsignadoTelefono.replace(/\s+/g, '')}`}
                        className="inline-flex items-center gap-1 text-[11px] text-slate-300 hover:text-emerald-400 font-mono font-medium hover:underline"
                        title={`Llamar a ${loan.promotorAsignado}`}
                      >
                        <Phone className="w-3 h-3 text-emerald-400 shrink-0" />
                        {loan.promotorAsignadoTelefono}
                      </a>
                    )}
                    <div>
                      <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-extrabold shadow-sm">
                        <Calendar className="w-3 h-3 text-emerald-400 shrink-0" />
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
                        className="inline-flex items-center gap-1 text-[10px] text-indigo-400 hover:text-indigo-300 font-bold underline pt-0.5"
                      >
                        <UserCog className="w-3 h-3" />
                        Reasignar Promotor
                      </button>
                    )}
                  </td>

                  <td className="p-4">
                    <LoanStatusBadge status={loan.estatus} />
                  </td>

                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {/* Botones de Dictamen para Administrador en solicitudes En Evaluación */}
                      {isAdmin && loan.estatus === 'En Evaluación' && (
                        <>
                          <button
                            disabled={isProcessingAction}
                            onClick={() => handleApprove(loan.id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30 transition-all disabled:opacity-50"
                            title="Aprobar Solicitud y Activar Crédito"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Aprobar
                          </button>

                          <button
                            disabled={isProcessingAction}
                            onClick={() => {
                              setRejectModalLoan(loan);
                              setMotivoRechazoInput('');
                              setRejectError(null);
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30 transition-all disabled:opacity-50"
                            title="Rechazar Solicitud"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            Rechazar
                          </button>
                        </>
                      )}

                      <button
                        onClick={() => setSelectedLoanModal(loan)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 transition-all"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Ver Tabla
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredLoans.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">
                    No se encontraron préstamos con los criterios especificados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Ver Tabla de Amortización & Detalle */}
      {selectedLoanModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-3xl p-6 rounded-2xl border border-slate-800 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start border-b border-slate-800 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-emerald-400">{selectedLoanModal.folio}</span>
                  <LoanStatusBadge status={selectedLoanModal.estatus} />
                </div>
                <h2 className="text-xl font-extrabold text-white mt-1">{selectedLoanModal.clienteNombre}</h2>
                <p className="text-xs text-slate-400">
                  Producto: {selectedLoanModal.productoNombre} ({selectedLoanModal.plazoCantidad} cuotas {selectedLoanModal.frecuenciaPago}s) • Promotor: {selectedLoanModal.promotorAsignado}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedLoanModal(null)}
                className="px-3 py-1 rounded-lg text-slate-400 hover:text-white bg-slate-800 text-xs"
                title="Cerrar modal (Esc)"
              >
                ✕
              </button>
            </div>

            {/* Banner de Rechazo si aplica */}
            {selectedLoanModal.estatus === 'Rechazado' && selectedLoanModal.motivoRechazo && (
              <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/40 text-rose-300 text-xs space-y-1">
                <div className="flex items-center gap-2 font-bold text-rose-400">
                  <XCircle className="w-4 h-4 shrink-0" />
                  <span>Solicitud de Crédito Rechazada</span>
                </div>
                <p className="text-slate-300 pl-6">
                  <strong>Motivo especificado por el Administrador:</strong> "{selectedLoanModal.motivoRechazo}"
                </p>
              </div>
            )}

            {/* Banner de Evaluación si aplica */}
            {selectedLoanModal.estatus === 'En Evaluación' && (
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/40 text-amber-300 text-xs space-y-1">
                <div className="flex items-center gap-2 font-bold text-amber-400">
                  <Clock className="w-4 h-4 shrink-0" />
                  <span>Solicitud Pendiente de Evaluación</span>
                </div>
                <p className="text-slate-300 pl-6">
                  Esta solicitud ingresada por un Promotor de Campo está pendiente de aprobación o rechazo por parte de un Administrador.
                </p>
              </div>
            )}

            {/* Bloque de Auditoría y Promotor Asignado */}
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3 text-xs">
              <h4 className="font-extrabold text-white uppercase tracking-wider flex items-center gap-1.5 text-xs">
                <ShieldCheck className="w-4 h-4 text-emerald-400" /> Trazabilidad de Solicitud y Cobro
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 space-y-1">
                  <span className="text-slate-400 block text-[11px] font-semibold">👤 Solicitado por:</span>
                  <p className="font-bold text-white text-xs">{selectedLoanModal.solicitadoPorNombre || selectedLoanModal.promotorAsignado || 'Carlos Mendoza'}</p>
                  <p className="text-[11px] text-slate-400">{selectedLoanModal.solicitadoPorRol || selectedLoanModal.creadoPorRol || 'Promotor de Campo'}</p>
                  <p className="text-[10px] text-slate-500 font-mono">
                    {selectedLoanModal.fechaHoraSolicitud ? formatDateWithTime(selectedLoanModal.fechaHoraSolicitud) : formatDate(selectedLoanModal.fechaInicio)}
                  </p>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 space-y-1">
                  <span className="text-slate-400 block text-[11px] font-semibold">🛡️ Dictaminado por:</span>
                  <p className="font-bold text-white text-xs">
                    {selectedLoanModal.aprobadoPorNombre || (selectedLoanModal.estatus === 'Activo' ? 'Carlos Mendoza' : selectedLoanModal.estatus === 'En Evaluación' ? 'Pendiente evaluación' : 'Sistema')}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    {selectedLoanModal.estatus === 'En Evaluación' ? 'Pendiente' : 'Administrador'}
                  </p>
                  <p className="text-[10px] text-slate-500 font-mono">
                    {selectedLoanModal.fechaHoraAprobacion ? formatDateWithTime(selectedLoanModal.fechaHoraAprobacion) : selectedLoanModal.estatus === 'En Evaluación' ? '-' : formatDate(selectedLoanModal.fechaInicio)}
                  </p>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 block text-[11px] font-semibold">🚚 Promotor:</span>
                    {isAdmin && (
                      <button
                        type="button"
                        onClick={() => {
                          setReassignModalLoan(selectedLoanModal);
                          setSelectedNewPromoterName(selectedLoanModal.promotorAsignado);
                          setReassignError(null);
                        }}
                        className="text-[10px] text-indigo-400 hover:text-indigo-300 font-bold underline"
                      >
                        Reasignar
                      </button>
                    )}
                  </div>
                  <p className="font-extrabold text-emerald-400 text-xs">{selectedLoanModal.promotorAsignado}</p>
                  {selectedLoanModal.promotorAsignadoTelefono && (
                    <p className="text-[11px] text-slate-300 font-mono flex items-center gap-1">
                      <Phone className="w-3 h-3 text-emerald-400 shrink-0" />
                      {selectedLoanModal.promotorAsignadoTelefono}
                    </p>
                  )}
                  {selectedLoanModal.diaCobro && (
                    <span className="inline-block text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold">
                      Cobro: {selectedLoanModal.diaCobro}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-slate-400">Monto Principal:</span>
                <p className="font-bold text-white">{formatCurrency(selectedLoanModal.montoPrincipal)}</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-slate-400">Total a Pagar:</span>
                <p className="font-bold text-white">{formatCurrency(selectedLoanModal.totalAPagar)}</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-slate-400">Saldo Pendiente:</span>
                <p className="font-bold text-emerald-400">{formatCurrency(selectedLoanModal.saldoPendiente)}</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-slate-400">Día de Cobro:</span>
                <p className="font-bold text-emerald-400">{selectedLoanModal.diaCobro || 'No asignado'}</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-slate-400">Fecha Solicitud:</span>
                <p className="font-bold text-slate-300">
                  {selectedLoanModal.fechaSolicitud ? formatDate(selectedLoanModal.fechaSolicitud) : 'No especificada'}
                </p>
              </div>
            </div>

            <h3 className="text-sm font-bold text-slate-200">Tabla de Amortización Completa</h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900 text-slate-400 font-semibold border-b border-slate-800">
                  <tr>
                    <th className="p-2">Cuota</th>
                    <th className="p-2">Día y Vencimiento</th>
                    <th className="p-2">Cuota Total</th>
                    <th className="p-2">Monto Pagado</th>
                    <th className="p-2">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {selectedLoanModal.tablaAmortizacion.map((c) => {
                    const isMora = c.estado === 'Mora' || c.estado === 'Vencido';
                    const isEnRevision = c.estado === 'En Revisión';
                    const isPagado = c.estado === 'Pagado';
                    return (
                      <tr
                        key={c.numeroCuota}
                        className={
                          isEnRevision
                            ? 'bg-indigo-500/15 border-l-4 border-l-indigo-500 hover:bg-indigo-500/25 transition-all text-indigo-200 font-semibold'
                            : isMora
                            ? 'bg-rose-500/15 border-l-4 border-l-rose-500 hover:bg-rose-500/25 transition-all text-rose-200 font-semibold'
                            : isPagado
                            ? 'bg-emerald-500/5 hover:bg-slate-800/40 text-slate-300'
                            : 'hover:bg-slate-800/40 text-slate-300'
                        }
                      >
                        <td className="p-2.5 font-bold">#{c.numeroCuota}</td>
                        <td className="p-2.5 font-sans font-medium">{formatDateWithDay(c.fechaVencimiento)}</td>
                        <td className="p-2.5 font-bold">
                          <div>
                            <span className={isMora ? 'text-rose-300 font-extrabold' : 'text-white'}>
                              {formatCurrency(c.cuotaTotal)}
                            </span>
                            {c.recargoPenalizacion && c.recargoPenalizacion > 0 ? (
                              <span className="block text-[10px] text-rose-400 font-bold font-sans">
                                ⚠️ +{formatCurrency(c.recargoPenalizacion)} recargo mora
                              </span>
                            ) : null}
                          </div>
                        </td>
                        <td className="p-2.5 text-emerald-400 font-bold">{formatCurrency(c.montoPagado)}</td>
                        <td className="p-2.5">
                          <InstallmentStatusBadge status={c.estado} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modal para Rechazar Solicitud de Crédito (Con Motivo Obligatorio) */}
      {rejectModalLoan && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div ref={rejectModalScrollRef} className="glass-panel w-full max-w-md p-6 rounded-2xl border border-slate-800 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <h2 className="text-lg font-extrabold text-white flex items-center gap-2">
                <XCircle className="w-5 h-5 text-rose-400" />
                Rechazar Solicitud de Crédito
              </h2>
              <button
                type="button"
                disabled={isProcessingAction}
                onClick={() => {
                  setRejectModalLoan(null);
                  setMotivoRechazoInput('');
                  setRejectError(null);
                }}
                className="text-slate-400 hover:text-white p-1 text-base disabled:opacity-50"
                title="Cerrar modal (Esc)"
              >
                ✕
              </button>
            </div>

            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs space-y-1">
              <p className="text-slate-400">Solicitud Folio: <strong className="text-emerald-400 font-mono">{rejectModalLoan.folio}</strong></p>
              <p className="text-white font-bold">{rejectModalLoan.clienteNombre}</p>
              <p className="text-slate-400">Monto: {formatCurrency(rejectModalLoan.montoPrincipal)} • Producto: {rejectModalLoan.productoNombre}</p>
            </div>

            {/* Error Banner */}
            {rejectError && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/40 text-rose-300 text-xs font-semibold flex items-center gap-2.5 shadow-lg shadow-rose-500/10">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{rejectError}</span>
              </div>
            )}

            <form onSubmit={handleConfirmReject} noValidate className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Motivo de Rechazo * <span className="text-slate-400 font-normal">(Obligatorio)</span>
                </label>
                <textarea
                  required
                  rows={4}
                  disabled={isProcessingAction}
                  placeholder="Explique detalladamente la razón por la cual se rechaza esta solicitud de crédito..."
                  value={motivoRechazoInput}
                  onChange={(e) => setMotivoRechazoInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-rose-500 disabled:opacity-50"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  disabled={isProcessingAction}
                  onClick={() => {
                    setRejectModalLoan(null);
                    setMotivoRechazoInput('');
                    setRejectError(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold text-xs disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isProcessingAction}
                  className="px-5 py-2 rounded-xl bg-rose-500 hover:bg-rose-400 text-white font-extrabold text-xs shadow-lg shadow-rose-500/20 flex items-center gap-2 disabled:opacity-50"
                >
                  {isProcessingAction ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Procesando...
                    </>
                  ) : (
                    <>
                      <XCircle className="w-3.5 h-3.5" /> Confirmar Rechazo
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal para Reasignar Promotor (Administrador) */}
      {reassignModalLoan && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-md p-6 rounded-2xl border border-slate-800 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <h2 className="text-lg font-extrabold text-white flex items-center gap-2">
                <UserCog className="w-5 h-5 text-indigo-400" />
                Reasignar Promotor de Cobro
              </h2>
              <button
                type="button"
                disabled={isProcessingAction}
                onClick={() => {
                  setReassignModalLoan(null);
                  setSelectedNewPromoterName('');
                  setReassignError(null);
                }}
                className="text-slate-400 hover:text-white p-1 text-base disabled:opacity-50"
                title="Cerrar modal (Esc)"
              >
                ✕
              </button>
            </div>

            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs space-y-1">
              <p className="text-slate-400">Préstamo Folio: <strong className="text-emerald-400 font-mono">{reassignModalLoan.folio}</strong></p>
              <p className="text-white font-bold">{reassignModalLoan.clienteNombre}</p>
              <p className="text-slate-400">Promotor Actual: <strong className="text-slate-200">{reassignModalLoan.promotorAsignado}</strong> (Día: {reassignModalLoan.diaCobro || 'Sin día'})</p>
            </div>

            {/* Banner de Error */}
            {reassignError && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/40 text-rose-300 text-xs font-semibold flex items-center gap-2.5 shadow-lg shadow-rose-500/10">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{reassignError}</span>
              </div>
            )}

            <form onSubmit={handleConfirmReassign} noValidate className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Nuevo Promotor Asignado *
                </label>
                <select
                  required
                  disabled={isProcessingAction}
                  value={selectedNewPromoterName}
                  onChange={(e) => setSelectedNewPromoterName(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-bold text-xs focus:outline-none focus:border-indigo-500 disabled:opacity-50"
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
                <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-xs space-y-1 text-indigo-300">
                  {(() => {
                    const sel = users.find((u) => u.name === selectedNewPromoterName);
                    if (!sel) return null;
                    return (
                      <>
                        <p className="font-bold text-white">Detalles del Nuevo Promotor:</p>
                        <p>👤 Nombre: {sel.name}</p>
                        <p>📞 Teléfono: {sel.telefono || 'Sin teléfono'}</p>
                        <p>🗓️ Día de Cobro Asignado: <strong>{sel.diaCobroAsignado || 'Sin asignar'}</strong></p>
                        <p className="text-[10px] text-slate-400 pt-1">
                          Nota: Al reasignar, el día de cobro del crédito se actualizará a <strong>{sel.diaCobroAsignado || 'Sin asignar'}</strong>.
                        </p>
                      </>
                    );
                  })()}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  disabled={isProcessingAction}
                  onClick={() => {
                    setReassignModalLoan(null);
                    setSelectedNewPromoterName('');
                    setReassignError(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold text-xs disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isProcessingAction}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs shadow-lg shadow-indigo-500/20 flex items-center gap-2 disabled:opacity-50"
                >
                  {isProcessingAction ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Guardando...
                    </>
                  ) : (
                    <>
                      <UserCheck className="w-3.5 h-3.5" /> Confirmar Reasignación
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
