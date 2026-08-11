'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  TrendingUp,
  Banknote,
  Users,
  AlertTriangle,
  CheckCircle2,
  DollarSign,
  ArrowUpRight,
  Download,
  Calendar,
  Layers,
  Smartphone,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
} from 'recharts';
import { useImpulsoStore } from '@/store/useImpulsoStore';
import { formatCurrency, formatDate, formatDateWithTime, getTodayDateString } from '@/lib/utils';
import { LoanStatusBadge } from '@/components/shared/StatusBadges';

export default function DashboardPage() {
  const { loans, clients, payments, currentUser } = useImpulsoStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const todayStr = getTodayDateString();

  // Metrics Calculation
  const totalCarteraActiva = loans
    .filter((l) => l.estatus === 'Activo' || l.estatus === 'En Mora')
    .reduce((sum, l) => sum + l.saldoPendiente, 0);

  const prestamosEnMora = loans.filter((l) => l.estatus === 'En Mora');
  const indiceMorosidad = loans.length > 0 ? (prestamosEnMora.length / loans.length) * 100 : 0;

  const cobradoHoy = payments
    .filter((p) => p.fechaPago.startsWith(todayStr))
    .reduce((sum, p) => sum + p.montoRecibido, 0);

  const totalClientesActivos = clients.filter((c) => c.estatus === 'Activo').length;

  // Chart Data Preparation: Portfolio Distribution
  const portfolioDistribution = [
    { name: 'Activos al día', value: loans.filter((l) => l.estatus === 'Activo').length, color: '#10b981' },
    { name: 'En Mora', value: prestamosEnMora.length, color: '#f43f5e' },
    { name: 'Liquidados', value: loans.filter((l) => l.estatus === 'Liquidado').length, color: '#3b82f6' },
  ];

  // Chart Data: Weekly Projections vs Collection Real
  const weeklyCollectionData = [
    { dia: 'Lun', proyectado: 12500, real: 12000 },
    { dia: 'Mar', proyectado: 15000, real: 14800 },
    { dia: 'Mié', proyectado: 11000, real: 11200 },
    { dia: 'Jue', proyectado: 18000, real: 17500 },
    { dia: 'Vie', proyectado: 22000, real: 23500 },
    { dia: 'Sáb', proyectado: 8000, real: 7900 },
    { dia: 'Dom', proyectado: 0, real: 0 },
  ];

  const exportDataJSON = () => {
    const jsonString = `data:text/json;chatset=utf-8,${encodeURIComponent(
      JSON.stringify({ loans, clients, payments }, null, 2)
    )}`;
    const link = document.createElement('a');
    link.href = jsonString;
    link.download = `financiera-impulso-backup-${todayStr}.json`;
    link.click();
  };

  return (
    <div className="space-y-6">
      {/* Top Welcome & Actions Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight flex items-center gap-2">
            Panel Ejecutivo de Cobranza
          </h1>
          <p className="text-xs md:text-sm text-slate-400 mt-1">
            Bienvenido, <strong className="text-emerald-400">{currentUser.name}</strong> • Resumen general en tiempo real de Financiera Impulso.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={exportDataJSON}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-300 bg-slate-900 hover:bg-slate-800 border border-slate-700 transition-all"
          >
            <Download className="w-3.5 h-3.5" /> Exportar JSON
          </button>

          <Link
            href="/cobranza"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-extrabold text-xs shadow-lg shadow-emerald-500/20 transition-all"
          >
            <Smartphone className="w-4 h-4" /> Ir a Ruta de Cobro
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1 */}
        <div className="glass-panel glass-panel-hover p-5 rounded-2xl border border-slate-800 space-y-2">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Cartera Activa</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <Banknote className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-white">{formatCurrency(totalCarteraActiva)}</p>
          <p className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
            <ArrowUpRight className="w-3.5 h-3.5" /> {loans.filter((l) => l.estatus === 'Activo').length} créditos vigentes
          </p>
        </div>

        {/* KPI 2 */}
        <div className="glass-panel glass-panel-hover p-5 rounded-2xl border border-slate-800 space-y-2">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Cobrado Hoy</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-emerald-400">{formatCurrency(cobradoHoy)}</p>
          <p className="text-[11px] text-slate-400 font-medium">
            Registrado por promotores hoy
          </p>
        </div>

        {/* KPI 3 */}
        <div className="glass-panel glass-panel-hover p-5 rounded-2xl border border-slate-800 space-y-2">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Índice de Morosidad</span>
            <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-rose-400">{indiceMorosidad.toFixed(1)}%</p>
          <p className="text-[11px] text-rose-300 font-medium">
            {prestamosEnMora.length} préstamos en mora
          </p>
        </div>

        {/* KPI 4 */}
        <div className="glass-panel glass-panel-hover p-5 rounded-2xl border border-slate-800 space-y-2">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Clientes Activos</span>
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-white">{totalClientesActivos}</p>
          <p className="text-[11px] text-slate-400 font-medium">
            Expedientes registrados
          </p>
        </div>
      </div>

      {/* Analytics Charts Grid */}
      {mounted && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Area Chart: Weekly Revenue vs Target */}
          <div className="lg:col-span-8 glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-emerald-400" />
                  Comportamiento de Cobranza Semanal
                </h3>
                <p className="text-xs text-slate-400">Comparativa entre cobro proyectado vs real recabado por promotores.</p>
              </div>
            </div>

            <div className="h-72 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={weeklyCollectionData}>
                  <defs>
                    <linearGradient id="colorReal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="colorProyectado" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="dia" stroke="#64748b" fontSize={11} />
                  <YAxis stroke="#64748b" fontSize={11} tickFormatter={(v) => `$${v / 1000}k`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
                    formatter={(value: any) => formatCurrency(Number(value))}
                  />
                  <Area type="monotone" dataKey="real" name="Cobrado Real" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorReal)" />
                  <Area type="monotone" dataKey="proyectado" name="Proyectado" stroke="#6366f1" strokeWidth={2} strokeDasharray="4 4" fillOpacity={1} fill="url(#colorProyectado)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Pie Chart: Portfolio Health */}
          <div className="lg:col-span-4 glass-panel p-6 rounded-2xl border border-slate-800 space-y-4 flex flex-col justify-between">
            <div>
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                <Layers className="w-5 h-5 text-emerald-400" />
                Salud de la Cartera
              </h3>
              <p className="text-xs text-slate-400">Distribución de préstamos según estatus.</p>
            </div>

            <div className="h-56 w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={portfolioDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {portfolioDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-1.5 text-xs pt-2 border-t border-slate-800">
              {portfolioDistribution.map((item) => (
                <div key={item.name} className="flex justify-between items-center">
                  <span className="flex items-center gap-2 text-slate-300">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                    {item.name}
                  </span>
                  <span className="font-extrabold text-white">{item.value} créditos</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Recent Payments Table */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-extrabold text-white flex items-center gap-2 tracking-tight">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            Transacciones de Cobro Recientes (Zustand Persist)
          </h2>
          <Link href="/cobranza" className="text-xs font-semibold text-emerald-400 hover:underline">
            Ver Cobranza Completa →
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/90 text-slate-400 font-semibold border-b border-slate-800 uppercase tracking-wider">
              <tr>
                <th className="p-3">Recibo</th>
                <th className="p-3">Cliente</th>
                <th className="p-3">Préstamo</th>
                <th className="p-3">Cuota #</th>
                <th className="p-3">Monto Recibido</th>
                <th className="p-3">Método & Fecha</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {payments.slice(0, 5).map((payment) => (
                <tr key={payment.id} className="hover:bg-slate-800/40">
                  <td className="p-3 font-mono font-bold text-emerald-400">{payment.folioRecibo}</td>
                  <td className="p-3 font-bold text-white">{payment.clienteNombre}</td>
                  <td className="p-3 font-mono text-slate-300">{payment.prestamoFolio}</td>
                  <td className="p-3 font-bold text-slate-200">Cuota #{payment.numeroCuota}</td>
                  <td className="p-3 font-black text-emerald-400 text-sm">
                    {formatCurrency(payment.montoRecibido)}
                  </td>
                  <td className="p-3 text-slate-400 text-[11px]">
                    <span className="text-slate-200 font-semibold">{payment.metodoPago}</span> • {formatDateWithTime(payment.fechaPago)}
                  </td>
                </tr>
              ))}
              {payments.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-slate-500">
                    No se han registrado pagos en la sesión actual.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
