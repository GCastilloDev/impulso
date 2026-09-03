'use client';

import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  Calendar,
  Users,
  ChevronLeft,
  ChevronRight,
  HelpCircle,
  Filter,
} from 'lucide-react';
import { useImpulsoStore } from '@/store/useImpulsoStore';
import { formatCurrency } from '@/lib/utils';
import {
  COMMISSION_TIERS,
  calculatePromoterCommission,
  getWeekDateRange,
  PromoterCommissionSummary,
} from '@/lib/commissionCalculators';

export default function ComisionesPage() {
  const { clients, loans, payments, users, currentUser } = useImpulsoStore();

  const isAdmin = currentUser.role === 'Administrador';

  // Control de fecha semanal (offset de semanas: 0 = actual, -1 = semana pasada, etc.)
  const [weekOffset, setWeekOffset] = useState<number>(0);
  const [criterioEscalon, setCriterioEscalon] = useState<'cartera_asignada' | 'clientes_cobrados'>(
    'cartera_asignada'
  );
  const [selectedPromoterFilter, setSelectedPromoterFilter] = useState<string>(
    isAdmin ? 'todos' : currentUser.name
  );

  // Cálculo del rango de la semana seleccionada
  const weekRange = useMemo(() => {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + weekOffset * 7);
    return getWeekDateRange(targetDate);
  }, [weekOffset]);

  // Lista de promotores activos
  const activePromoters = useMemo(() => {
    return users.filter((u) => u.estatus === 'Activo' && u.role === 'Promotor de Campo');
  }, [users]);

  // Cálculos de comisiones para todos los promotores
  const allCommissions: PromoterCommissionSummary[] = useMemo(() => {
    return activePromoters.map((p) =>
      calculatePromoterCommission({
        promotorNombre: p.name,
        clients,
        loans,
        payments,
        startDate: weekRange.start,
        endDate: weekRange.end,
        criterioEscalon,
      })
    );
  }, [activePromoters, clients, loans, payments, weekRange, criterioEscalon]);

  // Si es un promotor, enfocamos su propio resumen
  const currentPromoterSummary = useMemo(() => {
    return allCommissions.find((c) => c.promotorNombre === currentUser.name) || null;
  }, [allCommissions, currentUser.name]);

  // Filtrado para la tabla del Administrador
  const displayedCommissions = useMemo(() => {
    if (selectedPromoterFilter === 'todos') {
      return allCommissions;
    }
    return allCommissions.filter((c) => c.promotorNombre === selectedPromoterFilter);
  }, [allCommissions, selectedPromoterFilter]);

  // Totales globales consolidados para el Administrador
  const totals = useMemo(() => {
    return displayedCommissions.reduce(
      (acc, c) => ({
        cobranzaTotal: acc.cobranzaTotal + c.montoCobranzaTotal,
        moraExcluida: acc.moraExcluida + c.montoMoraExcluida,
        baseComisionable: acc.baseComisionable + c.baseComisionable,
        comisionesPagar: acc.comisionesPagar + c.montoComisionGanada,
        recibos: acc.recibos + c.cantidadRecibos,
      }),
      { cobranzaTotal: 0, moraExcluida: 0, baseComisionable: 0, comisionesPagar: 0, recibos: 0 }
    );
  }, [displayedCommissions]);

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono uppercase tracking-wider font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              Liquidación Semanal
            </span>
            <span className="text-[11px] font-mono text-slate-400">
              {criterioEscalon === 'cartera_asignada' ? 'Escalón por Cartera Total' : 'Escalón por Cobrados'}
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-white mt-1 flex items-center gap-2">
            <TrendingUp className="w-7 h-7 text-emerald-400" />
            Comisiones de Cobranza
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Tabulador institucional del 5% al 10% sobre cobranza ordinaria semanal (mora excluida).
          </p>
        </div>

        {/* Selector de Rango Semanal */}
        <div className="flex items-center gap-2 bg-slate-900 p-1.5 rounded-2xl border border-slate-800 shadow-lg">
          <button
            onClick={() => setWeekOffset((prev) => prev - 1)}
            className="p-2 rounded-xl hover:bg-slate-800 text-slate-300 hover:text-white transition-all"
            title="Semana anterior"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="px-3 text-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              {weekOffset === 0 ? 'Semana en Curso' : weekOffset === -1 ? 'Semana Pasada' : `Semana (${weekOffset})`}
            </span>
            <span className="text-xs font-bold text-white font-mono">{weekRange.label}</span>
          </div>
          <button
            disabled={weekOffset >= 0}
            onClick={() => setWeekOffset((prev) => prev + 1)}
            className="p-2 rounded-xl hover:bg-slate-800 text-slate-300 hover:text-white transition-all disabled:opacity-30 disabled:hover:bg-transparent"
            title="Semana siguiente"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Selector de Criterio de Escalón & Filtros */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-slate-400 font-bold">Criterio de Escalón:</span>
          <div className="flex rounded-xl bg-slate-900 p-1 border border-slate-800">
            <button
              onClick={() => setCriterioEscalon('cartera_asignada')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                criterioEscalon === 'cartera_asignada'
                  ? 'bg-emerald-500 text-slate-950 shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Cartera Asignada (Default)
            </button>
            <button
              onClick={() => setCriterioEscalon('clientes_cobrados')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                criterioEscalon === 'clientes_cobrados'
                  ? 'bg-emerald-500 text-slate-950 shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Clientes Cobrados en Semana
            </button>
          </div>
        </div>

        {isAdmin && (
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-400 font-semibold">Promotor:</span>
            <select
              value={selectedPromoterFilter}
              onChange={(e) => setSelectedPromoterFilter(e.target.value)}
              className="bg-slate-900 border border-slate-700 text-white rounded-xl px-3 py-1.5 focus:outline-none focus:border-emerald-500 font-medium"
            >
              <option value="todos">Todos los Promotores ({activePromoters.length})</option>
              {activePromoters.map((p) => (
                <option key={p.id} value={p.name}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Tabulador Visual de Escalones */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-slate-400 font-semibold px-1">
          <span>Tabulador Institucional de Comisiones</span>
          <span className="text-[11px] text-slate-500">Escalón activo resaltado</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
          {COMMISSION_TIERS.map((tier, idx) => {
            const isCurrentTier =
              currentPromoterSummary &&
              currentPromoterSummary.porcentajeComision === tier.percentage;

            return (
              <div
                key={idx}
                className={`p-3 rounded-2xl border text-center transition-all ${
                  isCurrentTier
                    ? 'border-emerald-500 bg-emerald-500/15 shadow-lg shadow-emerald-500/10 ring-2 ring-emerald-500/30'
                    : 'border-slate-800 bg-slate-900/60'
                }`}
              >
                <span className="text-[10px] font-mono text-slate-400 block font-semibold">
                  {tier.maxClients === null ? `${tier.minClients}+ clientes` : `${tier.minClients}-${tier.maxClients} clientes`}
                </span>
                <span
                  className={`text-xl font-black block mt-0.5 ${
                    isCurrentTier ? 'text-emerald-400' : 'text-slate-200'
                  }`}
                >
                  {tier.percentage}%
                </span>
                {isCurrentTier && (
                  <span className="inline-block mt-1 text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-500 text-slate-950 uppercase">
                    Tu Escalón
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Si es Promotor de Campo: Dashboard Personal de Ganancias */}
      {!isAdmin && currentPromoterSummary && (
        <div className="glass-panel p-6 rounded-3xl border border-emerald-500/30 bg-emerald-950/10 space-y-6 shadow-2xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 font-bold block">
                Resumen de Liquidación del Promotor
              </span>
              <h2 className="text-xl font-black text-white mt-0.5">
                {currentPromoterSummary.promotorNombre}
              </h2>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <span className="text-[10px] text-slate-400 block uppercase font-bold">Comisión Ganada</span>
                <span className="text-2xl font-black text-emerald-400 font-mono">
                  {formatCurrency(currentPromoterSummary.montoComisionGanada)}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800">
              <span className="text-slate-400 text-[11px] block">Cobranza Total Bruta:</span>
              <strong className="text-white font-mono text-base block mt-0.5">
                {formatCurrency(currentPromoterSummary.montoCobranzaTotal)}
              </strong>
              <span className="text-[10px] text-slate-500 mt-1 block">
                {currentPromoterSummary.cantidadRecibos} recibos cobrados
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800">
              <span className="text-slate-400 text-[11px] flex items-center gap-1">
                Mora Excluida:
                <span title="La mora no comisiona">
                  <HelpCircle className="w-3 h-3 text-slate-500" />
                </span>
              </span>
              <strong className="text-rose-400 font-mono text-base block mt-0.5">
                -{formatCurrency(currentPromoterSummary.montoMoraExcluida)}
              </strong>
              <span className="text-[10px] text-slate-500 mt-1 block">0% comisión sobre mora</span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800">
              <span className="text-slate-400 text-[11px] block">Base Comisionable:</span>
              <strong className="text-emerald-400 font-mono text-base block mt-0.5">
                {formatCurrency(currentPromoterSummary.baseComisionable)}
              </strong>
              <span className="text-[10px] text-slate-500 mt-1 block">Cuotas puras</span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800">
              <span className="text-slate-400 text-[11px] block">Escalón Aplicado:</span>
              <strong className="text-white font-mono text-base block mt-0.5">
                {currentPromoterSummary.porcentajeComision}%
              </strong>
              <span className="text-[10px] text-slate-400 mt-1 block truncate">
                {currentPromoterSummary.totalClientesAsignados} clientes en cartera
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Si es Administrador: Métricas Globales y Nómina de Comisiones */}
      {isAdmin && (
        <div className="space-y-6">
          {/* Tarjetas de Totales Globales */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-4 rounded-2xl glass-panel border border-slate-800">
              <span className="text-slate-400 text-[11px] block">Cobranza Total Semanal:</span>
              <strong className="text-white font-mono text-lg block mt-0.5">
                {formatCurrency(totals.cobranzaTotal)}
              </strong>
              <span className="text-[10px] text-slate-500 mt-1 block">
                {totals.recibos} recibos en total
              </span>
            </div>

            <div className="p-4 rounded-2xl glass-panel border border-slate-800">
              <span className="text-slate-400 text-[11px] block">Mora No Comisionable:</span>
              <strong className="text-rose-400 font-mono text-lg block mt-0.5">
                -{formatCurrency(totals.moraExcluida)}
              </strong>
              <span className="text-[10px] text-slate-500 mt-1 block">Excluida de comisión</span>
            </div>

            <div className="p-4 rounded-2xl glass-panel border border-slate-800">
              <span className="text-slate-400 text-[11px] block">Base Comisionable Neta:</span>
              <strong className="text-teal-400 font-mono text-lg block mt-0.5">
                {formatCurrency(totals.baseComisionable)}
              </strong>
              <span className="text-[10px] text-slate-500 mt-1 block">Cuotas ordinarias</span>
            </div>

            <div className="p-4 rounded-2xl glass-panel border border-emerald-500/30 bg-emerald-950/10">
              <span className="text-emerald-400 text-[11px] font-bold block">Total Comisiones a Pagar:</span>
              <strong className="text-emerald-400 font-mono text-xl block mt-0.5 font-black">
                {formatCurrency(totals.comisionesPagar)}
              </strong>
              <span className="text-[10px] text-emerald-500/70 mt-1 block">
                {displayedCommissions.length} promotor(es)
              </span>
            </div>
          </div>

          {/* Tabla Consolidada de Liquidación */}
          <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <h3 className="font-extrabold text-white text-sm flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-400" />
                Nómina de Comisiones por Promotor
              </h3>
              <span className="text-xs text-slate-400 font-mono">{weekRange.label}</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-900/90 text-slate-400 font-semibold border-b border-slate-800">
                  <tr>
                    <th className="p-3.5">Promotor</th>
                    <th className="p-3.5 text-center">Cartera Asignada</th>
                    <th className="p-3.5 text-center">Clientes Cobrados</th>
                    <th className="p-3.5 text-right">Cobranza Bruta</th>
                    <th className="p-3.5 text-right">Mora Excluida</th>
                    <th className="p-3.5 text-right">Base Comisionable</th>
                    <th className="p-3.5 text-center">% Comisión</th>
                    <th className="p-3.5 text-right font-bold text-emerald-400">Comisión Ganada</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {displayedCommissions.map((c, i) => (
                    <tr key={i} className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-3.5 font-bold text-white">
                        {c.promotorNombre}
                        <span className="text-[10px] text-slate-500 block font-normal">
                          {c.cantidadRecibos} pagos registrados
                        </span>
                      </td>
                      <td className="p-3.5 text-center font-mono text-slate-200">
                        {c.totalClientesAsignados}
                      </td>
                      <td className="p-3.5 text-center font-mono text-slate-200">
                        {c.totalClientesCobrados}
                      </td>
                      <td className="p-3.5 text-right font-mono text-slate-200">
                        {formatCurrency(c.montoCobranzaTotal)}
                      </td>
                      <td className="p-3.5 text-right font-mono text-rose-400">
                        {c.montoMoraExcluida > 0 ? `-${formatCurrency(c.montoMoraExcluida)}` : '$0.00'}
                      </td>
                      <td className="p-3.5 text-right font-mono font-bold text-white">
                        {formatCurrency(c.baseComisionable)}
                      </td>
                      <td className="p-3.5 text-center">
                        <span className="inline-block px-2.5 py-1 rounded-full font-black text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                          {c.porcentajeComision}%
                        </span>
                      </td>
                      <td className="p-3.5 text-right font-mono text-base font-black text-emerald-400">
                        {formatCurrency(c.montoComisionGanada)}
                      </td>
                    </tr>
                  ))}
                  {displayedCommissions.length === 0 && (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-500">
                        No se registraron cobros para los promotores en este periodo semanal.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
