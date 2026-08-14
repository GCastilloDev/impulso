'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Banknote, Search, Plus, Calendar, Eye, AlertTriangle, ShieldCheck, Filter, CheckCircle2, XCircle, Clock, Loader2, AlertCircle } from 'lucide-react';
import { useImpulsoStore } from '@/store/useImpulsoStore';
import { LoanStatusBadge, InstallmentStatusBadge } from '@/components/shared/StatusBadges';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Loan } from '@/types';
import { approveLoanAction, rejectLoanAction } from '@/app/actions/loanActions';

export default function LoansPage() {
  const { loans, currentUser, loadDataFromDB } = useImpulsoStore();
  const isAdmin = currentUser.role === 'Administrador';

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  const [selectedLoanModal, setSelectedLoanModal] = useState<Loan | null>(null);

  // Modal para rechazo de préstamo (Administrador)
  const [rejectModalLoan, setRejectModalLoan] = useState<Loan | null>(null);
  const [motivoRechazoInput, setMotivoRechazoInput] = useState('');
  const [rejectError, setRejectError] = useState<string | null>(null);
  const [isProcessingAction, setIsProcessingAction] = useState(false);
  const rejectModalScrollRef = useRef<HTMLDivElement>(null);

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
      await approveLoanAction(loanId);
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

    // Validar motivo obligatorio (Regla de validación de formulario)
    if (!motivoRechazoInput.trim()) {
      setRejectError('Por favor ingresa el motivo del rechazo.');
      if (rejectModalScrollRef.current) rejectModalScrollRef.current.scrollTop = 0;
      return;
    }

    setIsProcessingAction(true);
    try {
      await rejectLoanAction(rejectModalLoan.id, motivoRechazoInput.trim());
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

  const filteredLoans = loans.filter((loan) => {
    const matchesSearch =
      loan.folio.toLowerCase().includes(searchTerm.toLowerCase()) ||
      loan.clienteNombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      loan.productoNombre.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'todos' || loan.estatus === statusFilter;

    return matchesSearch && matchesStatus;
  });

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
                <th className="p-4 min-w-[180px]">Folio & Cliente</th>
                <th className="p-4 min-w-[180px]">Producto / Frecuencia</th>
                <th className="p-4 min-w-[130px]">Monto Prestado</th>
                <th className="p-4 min-w-[140px]">Saldo Pendiente</th>
                <th className="p-4 min-w-[120px]">Cuota Regular</th>
                <th className="p-4 min-w-[130px]">Estatus</th>
                <th className="p-4 text-right min-w-[210px]">Acciones & Amortización</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filteredLoans.map((loan) => (
                <tr key={loan.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="p-4">
                    <div>
                      <span className="font-mono font-bold text-emerald-400">{loan.folio}</span>
                      <p className="font-bold text-white text-sm">{loan.clienteNombre}</p>
                    </div>
                  </td>

                  <td className="p-4">
                    <p className="font-semibold text-slate-200">{loan.productoNombre}</p>
                    <p className="text-[11px] text-slate-400 capitalize">
                      {loan.plazoCantidad} cuotas ({loan.frecuenciaPago})
                    </p>
                  </td>

                  <td className="p-4 font-semibold text-slate-300">
                    {formatCurrency(loan.montoPrincipal)}
                  </td>

                  <td className="p-4">
                    <span className="font-extrabold text-emerald-400 text-sm">
                      {formatCurrency(loan.saldoPendiente)}
                    </span>
                    <p className="text-[10px] text-slate-400">Total: {formatCurrency(loan.totalAPagar)}</p>
                  </td>

                  <td className="p-4 font-bold text-white">
                    {formatCurrency(loan.cuotaRegular)}
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

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
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
            </div>

            <h3 className="text-sm font-bold text-slate-200">Tabla de Amortización Completa</h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900 text-slate-400 font-semibold border-b border-slate-800">
                  <tr>
                    <th className="p-2">Cuota</th>
                    <th className="p-2">Vencimiento</th>
                    <th className="p-2">Cuota Total</th>
                    <th className="p-2">Monto Pagado</th>
                    <th className="p-2">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {selectedLoanModal.tablaAmortizacion.map((c) => (
                    <tr key={c.numeroCuota} className="hover:bg-slate-800/40">
                      <td className="p-2 font-bold text-slate-300">#{c.numeroCuota}</td>
                      <td className="p-2 text-slate-300 font-sans">{formatDate(c.fechaVencimiento)}</td>
                      <td className="p-2 text-white font-bold">{formatCurrency(c.cuotaTotal)}</td>
                      <td className="p-2 text-emerald-400">{formatCurrency(c.montoPagado)}</td>
                      <td className="p-2">
                        <InstallmentStatusBadge status={c.estado} />
                      </td>
                    </tr>
                  ))}
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
    </div>
  );
}
