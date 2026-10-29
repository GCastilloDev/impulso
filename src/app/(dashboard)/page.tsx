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
  Loader2,
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
} from 'recharts';
import { useImpulsoStore } from '@/store/useImpulsoStore';
import { formatCurrency, formatDateWithTime, getTodayDateString } from '@/lib/utils';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export default function DashboardPage() {
  const { loans, clients, payments, currentUser, loadDataFromDB } = useImpulsoStore();
  const [mounted, setMounted] = useState(false);
  const [isPageLoading, setIsPageLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    setMounted(true);
    setIsPageLoading(true);
    loadDataFromDB().finally(() => {
      if (isMounted) setIsPageLoading(false);
    });
    return () => {
      isMounted = false;
    };
  }, [loadDataFromDB]);

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
    { name: 'Activos al día', value: loans.filter((l) => l.estatus === 'Activo').length, color: '#00875a' },
    { name: 'En Mora', value: prestamosEnMora.length, color: '#de350b' },
    { name: 'Liquidados', value: loans.filter((l) => l.estatus === 'Liquidado').length, color: '#635bff' },
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
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify({ loans, clients, payments }, null, 2)
    )}`;
    const link = document.createElement('a');
    link.href = jsonString;
    link.download = `financiera-impulso-backup-${todayStr}.json`;
    link.click();
  };

  if (isPageLoading || !mounted) {
    return (
      <Card className="flex flex-col items-center justify-center min-h-[400px] p-12 space-y-4 rounded-[6px] border-border bg-card my-8 shadow-2xs">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <p className="text-[13px] font-medium text-text-muted">
          Consultando métricas en tiempo real desde PostgreSQL...
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Welcome & Actions Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-[22px] md:text-[24px] font-semibold text-foreground tracking-tight flex items-center gap-2.5">
            Panel Ejecutivo de Cobranza
          </h1>
          <p className="text-[13px] text-text-muted mt-1">
            Bienvenido, <strong className="text-foreground font-semibold">{currentUser.name}</strong> • Resumen general en tiempo real de Financiera Impulso.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            type="button"
            variant="outline"
            onClick={exportDataJSON}
            className="h-[34px] text-[13px]"
          >
            <Download className="w-3.5 h-3.5 mr-1" /> Exportar JSON
          </Button>

          <Button asChild variant="stripe-actions" className="h-[34px] text-[13px]">
            <Link href="/cobranza">
              <Smartphone className="w-3.5 h-3.5 mr-1" /> Ir a Ruta de Cobro
            </Link>
          </Button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Cartera Activa */}
        <Card className="p-4 bg-card border-border rounded-[6px] shadow-2xs space-y-1.5">
          <div className="flex justify-between items-center text-text-muted">
            <span className="text-[11.5px] font-medium uppercase tracking-wider">Cartera Activa</span>
            <div className="w-7 h-7 rounded-[4px] bg-primary/10 text-primary flex items-center justify-center">
              <Banknote className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-[22px] font-semibold text-foreground font-mono tabular-nums">
            {formatCurrency(totalCarteraActiva)}
          </p>
          <p className="text-[12px] text-text-muted font-medium flex items-center gap-1">
            <ArrowUpRight className="w-3.5 h-3.5 text-primary" /> {loans.filter((l) => l.estatus === 'Activo').length} créditos vigentes
          </p>
        </Card>

        {/* KPI 2: Cobrado Hoy */}
        <Card className="p-4 bg-card border-border rounded-[6px] shadow-2xs space-y-1.5">
          <div className="flex justify-between items-center text-text-muted">
            <span className="text-[11.5px] font-medium uppercase tracking-wider">Cobrado Hoy</span>
            <div className="w-7 h-7 rounded-[4px] bg-badge-success-bg text-badge-success-text flex items-center justify-center">
              <DollarSign className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-[22px] font-semibold text-badge-success-text font-mono tabular-nums">
            {formatCurrency(cobradoHoy)}
          </p>
          <p className="text-[12px] text-text-muted font-medium">
            Registrado por promotores hoy
          </p>
        </Card>

        {/* KPI 3: Índice de Morosidad */}
        <Card className="p-4 bg-card border-border rounded-[6px] shadow-2xs space-y-1.5">
          <div className="flex justify-between items-center text-text-muted">
            <span className="text-[11.5px] font-medium uppercase tracking-wider">Índice de Morosidad</span>
            <div className="w-7 h-7 rounded-[4px] bg-badge-danger-bg text-badge-danger-text flex items-center justify-center">
              <AlertTriangle className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-[22px] font-semibold text-badge-danger-text font-mono tabular-nums">
            {indiceMorosidad.toFixed(1)}%
          </p>
          <p className="text-[12px] text-badge-danger-text font-medium">
            {prestamosEnMora.length} préstamos en mora
          </p>
        </Card>

        {/* KPI 4: Clientes Activos */}
        <Card className="p-4 bg-card border-border rounded-[6px] shadow-2xs space-y-1.5">
          <div className="flex justify-between items-center text-text-muted">
            <span className="text-[11.5px] font-medium uppercase tracking-wider">Clientes Activos</span>
            <div className="w-7 h-7 rounded-[4px] bg-badge-info-bg text-badge-info-text flex items-center justify-center">
              <Users className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-[22px] font-semibold text-foreground font-mono tabular-nums">
            {totalClientesActivos}
          </p>
          <p className="text-[12px] text-text-muted font-medium">
            Expedientes registrados
          </p>
        </Card>
      </div>

      {/* Analytics Charts Grid */}
      {mounted && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Area Chart: Weekly Revenue vs Target */}
          <Card className="lg:col-span-8 rounded-[6px] border-border bg-card shadow-2xs">
            <CardHeader className="p-4 border-b border-border space-y-0.5">
              <CardTitle className="text-[15px] font-semibold text-foreground flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                Comportamiento de Cobranza Semanal
              </CardTitle>
              <CardDescription>
                Comparativa entre cobro proyectado vs real recabado por promotores.
              </CardDescription>
            </CardHeader>

            <CardContent className="p-4">
              <div className="h-72 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={weeklyCollectionData}>
                    <defs>
                      <linearGradient id="colorReal" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#635bff" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#635bff" stopOpacity={0.0} />
                      </linearGradient>
                      <linearGradient id="colorProyectado" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#94a3b8" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e3e8ee" />
                    <XAxis dataKey="dia" stroke="#697386" fontSize={11} tickLine={false} />
                    <YAxis
                      stroke="#697386"
                      fontSize={11}
                      tickLine={false}
                      tickFormatter={(v) => `$${v / 1000}k`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#ffffff',
                        borderColor: '#e3e8ee',
                        borderRadius: '6px',
                        color: '#1a1f36',
                        fontSize: '12px',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.08)',
                      }}
                      formatter={(value: any) => formatCurrency(Number(value))}
                    />
                    <Area
                      type="monotone"
                      dataKey="real"
                      name="Cobrado Real"
                      stroke="#635bff"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#colorReal)"
                    />
                    <Area
                      type="monotone"
                      dataKey="proyectado"
                      name="Proyectado"
                      stroke="#94a3b8"
                      strokeWidth={1.5}
                      strokeDasharray="4 4"
                      fillOpacity={1}
                      fill="url(#colorProyectado)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Pie Chart: Portfolio Health */}
          <Card className="lg:col-span-4 rounded-[6px] border-border bg-card shadow-2xs flex flex-col justify-between">
            <CardHeader className="p-4 border-b border-border space-y-0.5">
              <CardTitle className="text-[15px] font-semibold text-foreground flex items-center gap-2">
                <Layers className="w-4 h-4 text-primary" />
                Salud de la Cartera
              </CardTitle>
              <CardDescription>Distribución de préstamos según estatus.</CardDescription>
            </CardHeader>

            <CardContent className="p-4 flex-1 flex flex-col justify-between">
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
                      contentStyle={{
                        backgroundColor: '#ffffff',
                        borderColor: '#e3e8ee',
                        borderRadius: '6px',
                        color: '#1a1f36',
                        fontSize: '12px',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.08)',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="space-y-1.5 text-[12px] pt-3 border-t border-border">
                {portfolioDistribution.map((item) => (
                  <div key={item.name} className="flex justify-between items-center">
                    <span className="flex items-center gap-2 text-text-secondary">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                      {item.name}
                    </span>
                    <span className="font-semibold text-foreground font-mono tabular-nums">{item.value} créditos</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Recent Payments Table */}
      <Card className="rounded-[6px] border-border bg-card shadow-2xs overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between p-4 border-b border-border space-y-0">
          <CardTitle className="text-[15px] font-semibold text-foreground flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-primary" />
            Transacciones de Cobro Recientes
          </CardTitle>
          <Button asChild variant="ghost" size="sm" className="text-primary hover:text-primary-hover text-[12px] h-[30px] px-2.5">
            <Link href="/cobranza">
              Ver Cobranza Completa →
            </Link>
          </Button>
        </CardHeader>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[120px]">Recibo</TableHead>
              <TableHead className="min-w-[180px]">Cliente</TableHead>
              <TableHead className="min-w-[130px]">Préstamo</TableHead>
              <TableHead className="min-w-[110px]">Cuota #</TableHead>
              <TableHead className="text-right min-w-[130px]">Monto Recibido</TableHead>
              <TableHead className="min-w-[180px]">Método & Fecha</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payments.slice(0, 5).map((payment) => (
              <TableRow key={payment.id}>
                <TableCell>
                  <span className="inline-block font-mono text-[11px] bg-surface-subtle border border-border px-1.5 py-0.5 rounded-[4px] text-primary font-medium select-all">
                    {payment.folioRecibo}
                  </span>
                </TableCell>
                <TableCell className="font-semibold text-foreground text-[13px]">
                  {payment.clienteNombre}
                </TableCell>
                <TableCell className="font-mono text-[12px] text-text-secondary">
                  {payment.prestamoFolio}
                </TableCell>
                <TableCell className="font-medium text-foreground text-[13px]">
                  Cuota #{payment.numeroCuota}
                </TableCell>
                <TableCell className="text-right font-mono tabular-nums text-[14px] font-semibold text-primary">
                  {formatCurrency(payment.montoRecibido)}
                </TableCell>
                <TableCell className="text-[12px] text-text-muted">
                  <span className="text-text-secondary font-medium">{payment.metodoPago}</span> • {formatDateWithTime(payment.fechaPago)}
                </TableCell>
              </TableRow>
            ))}
            {payments.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="p-8 text-center text-text-muted">
                  No se han registrado pagos en la sesión actual.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
