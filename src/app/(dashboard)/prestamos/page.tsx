'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Banknote, Search, Plus, Calendar, Eye, AlertTriangle, ShieldCheck, Filter } from 'lucide-react';
import { useImpulsoStore } from '@/store/useImpulsoStore';
import { LoanStatusBadge, InstallmentStatusBadge } from '@/components/shared/StatusBadges';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Loan } from '@/types';

export default function LoansPage() {
  const { loans } = useImpulsoStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  const [selectedLoanModal, setSelectedLoanModal] = useState<Loan | null>(null);

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
            Gestión de Préstamos Activos
          </h1>
          <p className="text-sm text-slate-400">
            Monitoreo de cartera, tablas de amortización y estado de saldos pendientes.
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
            <option value="Activo">Activos</option>
            <option value="En Mora">En Mora</option>
            <option value="Liquidado">Liquidados</option>
          </select>
        </div>
      </div>

      {/* Loans Table */}
      <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/90 text-slate-400 font-semibold border-b border-slate-800 uppercase tracking-wider">
              <tr>
                <th className="p-4">Folio & Cliente</th>
                <th className="p-4">Producto / Frecuencia</th>
                <th className="p-4">Monto Prestado</th>
                <th className="p-4">Saldo Pendiente</th>
                <th className="p-4">Cuota Regular</th>
                <th className="p-4">Estatus</th>
                <th className="p-4 text-right">Tabla Amortización</th>
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
                    <button
                      onClick={() => setSelectedLoanModal(loan)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 transition-all"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Ver Tabla
                    </button>
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

      {/* Modal Ver Tabla de Amortización */}
      {selectedLoanModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-3xl p-6 rounded-2xl border border-slate-800 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start border-b border-slate-800 pb-3">
              <div>
                <span className="font-mono text-xs font-bold text-emerald-400">{selectedLoanModal.folio}</span>
                <h2 className="text-xl font-extrabold text-white">{selectedLoanModal.clienteNombre}</h2>
                <p className="text-xs text-slate-400">
                  Producto: {selectedLoanModal.productoNombre} ({selectedLoanModal.plazoCantidad} cuotas {selectedLoanModal.frecuenciaPago}s)
                </p>
              </div>
              <button
                onClick={() => setSelectedLoanModal(null)}
                className="px-3 py-1 rounded-lg text-slate-400 hover:text-white bg-slate-800 text-xs"
              >
                Cerrar ✕
              </button>
            </div>

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
    </div>
  );
}
