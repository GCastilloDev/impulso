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
import { formatCurrency, cn } from '@/lib/utils';
import {
  COMMISSION_TIERS,
  calculatePromoterCommission,
  getWeekDateRange,
  PromoterCommissionSummary,
} from '@/lib/commissionCalculators';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

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
            <Badge variant="success" className="font-semibold uppercase tracking-wider text-[11px]">
              Liquidación Semanal
            </Badge>
            <span className="text-[12px] font-mono text-text-muted">
              {criterioEscalon === 'cartera_asignada' ? 'Escalón por Cartera Total' : 'Escalón por Cobrados'}
            </span>
          </div>
          <h1 className="text-[22px] md:text-[24px] font-semibold text-foreground mt-1 flex items-center gap-2.5 tracking-tight">
            <TrendingUp className="w-6 h-6 text-primary" />
            Comisiones de Cobranza
          </h1>
          <p className="text-[13px] text-text-muted mt-1">
            Tabulador institucional del 5% al 10% sobre cobranza ordinaria semanal (mora excluida).
          </p>
        </div>

        {/* Selector de Rango Semanal */}
        <div className="flex items-center gap-1.5 bg-card p-1.5 rounded-[6px] border border-border shadow-2xs">
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => setWeekOffset((prev) => prev - 1)}
            className="h-[32px] w-[32px]"
            title="Semana anterior"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <div className="px-3 text-center min-w-[150px]">
            <span className="text-[10px] font-medium text-text-muted uppercase tracking-wider block">
              {weekOffset === 0 ? 'Semana en Curso' : weekOffset === -1 ? 'Semana Pasada' : `Semana (${weekOffset})`}
            </span>
            <span className="text-[12px] font-semibold text-foreground font-mono">{weekRange.label}</span>
          </div>
          <Button
            type="button"
            variant="outline"
            size="icon"
            disabled={weekOffset >= 0}
            onClick={() => setWeekOffset((prev) => prev + 1)}
            className="h-[32px] w-[32px]"
            title="Semana siguiente"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Selector de Criterio de Escalón & Filtros */}
      <Card className="p-3.5 bg-card border-border rounded-[6px] shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-[13px]">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-text-muted font-medium text-[12px]">Criterio de Escalón:</span>
          <div className="flex items-center gap-1 p-1 bg-surface-subtle rounded-[6px] border border-border">
            <Button
              type="button"
              variant={criterioEscalon === 'cartera_asignada' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setCriterioEscalon('cartera_asignada')}
              className={cn(
                'h-[28px] text-[12px] font-medium px-3',
                criterioEscalon === 'cartera_asignada' && 'shadow-xs'
              )}
            >
              Cartera Asignada (Default)
            </Button>
            <Button
              type="button"
              variant={criterioEscalon === 'clientes_cobrados' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setCriterioEscalon('clientes_cobrados')}
              className={cn(
                'h-[28px] text-[12px] font-medium px-3',
                criterioEscalon === 'clientes_cobrados' && 'shadow-xs'
              )}
            >
              Clientes Cobrados en Semana
            </Button>
          </div>
        </div>

        {isAdmin && (
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-text-muted" />
            <span className="text-text-muted font-medium text-[12px]">Promotor:</span>
            <div className="w-[230px]">
              <Select
                value={selectedPromoterFilter}
                onValueChange={(val) => setSelectedPromoterFilter(val)}
              >
                <SelectTrigger className="h-[32px] text-[12px]">
                  <SelectValue placeholder="Seleccionar promotor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos los Promotores ({activePromoters.length})</SelectItem>
                  {activePromoters.map((p) => (
                    <SelectItem key={p.id} value={p.name}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
      </Card>

      {/* Tabulador Visual de Escalones */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-[12px] text-text-muted font-medium px-1">
          <span>Tabulador Institucional de Comisiones</span>
          <span className="text-[11px] text-text-muted">Escalón activo resaltado</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
          {COMMISSION_TIERS.map((tier, idx) => {
            const isCurrentTier =
              currentPromoterSummary &&
              currentPromoterSummary.porcentajeComision === tier.percentage;

            return (
              <Card
                key={idx}
                className={cn(
                  'p-3 rounded-[6px] border text-center transition-all shadow-2xs',
                  isCurrentTier
                    ? 'border-primary bg-primary/5 ring-1 ring-primary'
                    : 'border-border bg-card'
                )}
              >
                <span className="text-[11px] font-mono text-text-muted block font-medium">
                  {tier.maxClients === null ? `${tier.minClients}+ clientes` : `${tier.minClients}-${tier.maxClients} clientes`}
                </span>
                <span
                  className={cn(
                    'text-[20px] font-semibold block mt-0.5 font-mono tabular-nums',
                    isCurrentTier ? 'text-primary' : 'text-foreground'
                  )}
                >
                  {tier.percentage}%
                </span>
                {isCurrentTier && (
                  <Badge variant="success" className="mt-1 text-[10px] px-1.5 py-0 uppercase">
                    Tu Escalón
                  </Badge>
                )}
              </Card>
            );
          })}
        </div>
      </div>

      {/* Si es Promotor de Campo: Dashboard Personal de Ganancias */}
      {!isAdmin && currentPromoterSummary && (
        <Card className="rounded-[6px] border-border bg-card shadow-2xs">
          <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 border-b border-border">
            <div>
              <Badge variant="success" className="mb-1 text-[10px] uppercase font-semibold">
                Resumen de Liquidación del Promotor
              </Badge>
              <CardTitle className="text-[18px]">
                {currentPromoterSummary.promotorNombre}
              </CardTitle>
              <CardDescription>
                Semana evaluada: {weekRange.label}
              </CardDescription>
            </div>
            <div className="text-left sm:text-right">
              <span className="text-[11px] text-text-muted block uppercase font-semibold">Comisión Ganada</span>
              <span className="text-[24px] font-semibold text-primary font-mono tabular-nums">
                {formatCurrency(currentPromoterSummary.montoComisionGanada)}
              </span>
            </div>
          </CardHeader>

          <CardContent className="p-5">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[13px]">
              <div className="p-3.5 rounded-[4px] bg-surface-subtle border border-border">
                <span className="text-text-muted text-[11.5px] block font-medium">Cobranza Total Bruta:</span>
                <strong className="text-foreground font-mono tabular-nums text-[16px] block mt-0.5 font-semibold">
                  {formatCurrency(currentPromoterSummary.montoCobranzaTotal)}
                </strong>
                <span className="text-[11px] text-text-muted mt-1 block">
                  {currentPromoterSummary.cantidadRecibos} recibos cobrados
                </span>
              </div>

              <div className="p-3.5 rounded-[4px] bg-surface-subtle border border-border">
                <span className="text-text-muted text-[11.5px] flex items-center gap-1 font-medium">
                  Mora Excluida:
                  <span title="La mora no comisiona">
                    <HelpCircle className="w-3.5 h-3.5 text-text-muted" />
                  </span>
                </span>
                <strong className="text-badge-danger-text font-mono tabular-nums text-[16px] block mt-0.5 font-semibold">
                  -{formatCurrency(currentPromoterSummary.montoMoraExcluida)}
                </strong>
                <span className="text-[11px] text-text-muted mt-1 block">0% comisión sobre mora</span>
              </div>

              <div className="p-3.5 rounded-[4px] bg-surface-subtle border border-border">
                <span className="text-text-muted text-[11.5px] block font-medium">Base Comisionable:</span>
                <strong className="text-primary font-mono tabular-nums text-[16px] block mt-0.5 font-semibold">
                  {formatCurrency(currentPromoterSummary.baseComisionable)}
                </strong>
                <span className="text-[11px] text-text-muted mt-1 block">Cuotas puras</span>
              </div>

              <div className="p-3.5 rounded-[4px] bg-surface-subtle border border-border">
                <span className="text-text-muted text-[11.5px] block font-medium">Escalón Aplicado:</span>
                <strong className="text-foreground font-mono tabular-nums text-[16px] block mt-0.5 font-semibold">
                  {currentPromoterSummary.porcentajeComision}%
                </strong>
                <span className="text-[11px] text-text-muted mt-1 block truncate">
                  {currentPromoterSummary.totalClientesAsignados} clientes en cartera
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Si es Administrador: Métricas Globales y Nómina de Comisiones */}
      {isAdmin && (
        <div className="space-y-6">
          {/* Tarjetas de Totales Globales */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-4 bg-card border-border rounded-[6px] shadow-2xs">
              <span className="text-[11.5px] font-medium text-text-muted uppercase tracking-wider block">
                Cobranza Total Semanal
              </span>
              <div className="text-[20px] font-semibold text-foreground font-mono tabular-nums mt-1">
                {formatCurrency(totals.cobranzaTotal)}
              </div>
              <span className="text-[12px] text-text-muted mt-0.5 block">
                {totals.recibos} recibos en total
              </span>
            </Card>

            <Card className="p-4 bg-card border-border rounded-[6px] shadow-2xs">
              <span className="text-[11.5px] font-medium text-text-muted uppercase tracking-wider block">
                Mora No Comisionable
              </span>
              <div className="text-[20px] font-semibold text-badge-danger-text font-mono tabular-nums mt-1">
                -{formatCurrency(totals.moraExcluida)}
              </div>
              <span className="text-[12px] text-text-muted mt-0.5 block">
                Excluida de comisión
              </span>
            </Card>

            <Card className="p-4 bg-card border-border rounded-[6px] shadow-2xs">
              <span className="text-[11.5px] font-medium text-text-muted uppercase tracking-wider block">
                Base Comisionable Neta
              </span>
              <div className="text-[20px] font-semibold text-foreground font-mono tabular-nums mt-1">
                {formatCurrency(totals.baseComisionable)}
              </div>
              <span className="text-[12px] text-text-muted mt-0.5 block">
                Cuotas ordinarias
              </span>
            </Card>

            <Card className="p-4 bg-card border-border rounded-[6px] shadow-2xs">
              <span className="text-[11.5px] font-semibold text-primary uppercase tracking-wider block">
                Total Comisiones a Pagar
              </span>
              <div className="text-[20px] font-semibold text-primary font-mono tabular-nums mt-1">
                {formatCurrency(totals.comisionesPagar)}
              </div>
              <span className="text-[12px] text-text-muted mt-0.5 block">
                {displayedCommissions.length} promotor(es)
              </span>
            </Card>
          </div>

          {/* Tabla Consolidada de Liquidación */}
          <Card className="rounded-[6px] border-border bg-card shadow-2xs overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between p-4 border-b border-border space-y-0">
              <CardTitle className="text-[15px] flex items-center gap-2 font-semibold">
                <Users className="w-4 h-4 text-primary" />
                Nómina de Comisiones por Promotor
              </CardTitle>
              <Badge variant="outline" className="font-mono text-[11.5px]">
                {weekRange.label}
              </Badge>
            </CardHeader>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[160px]">Promotor</TableHead>
                  <TableHead className="text-center min-w-[120px]">Cartera Asignada</TableHead>
                  <TableHead className="text-center min-w-[120px]">Clientes Cobrados</TableHead>
                  <TableHead className="text-right min-w-[130px]">Cobranza Bruta</TableHead>
                  <TableHead className="text-right min-w-[130px]">Mora Excluida</TableHead>
                  <TableHead className="text-right min-w-[130px]">Base Comisionable</TableHead>
                  <TableHead className="text-center min-w-[100px]">% Comisión</TableHead>
                  <TableHead className="text-right min-w-[140px]">Comisión Ganada</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayedCommissions.map((c, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-semibold text-foreground">
                      <div>{c.promotorNombre}</div>
                      <span className="text-[11px] text-text-muted block font-normal">
                        {c.cantidadRecibos} pagos registrados
                      </span>
                    </TableCell>
                    <TableCell className="text-center font-mono tabular-nums text-text-secondary">
                      {c.totalClientesAsignados}
                    </TableCell>
                    <TableCell className="text-center font-mono tabular-nums text-text-secondary">
                      {c.totalClientesCobrados}
                    </TableCell>
                    <TableCell className="text-right font-mono tabular-nums text-foreground">
                      {formatCurrency(c.montoCobranzaTotal)}
                    </TableCell>
                    <TableCell className="text-right font-mono tabular-nums text-badge-danger-text">
                      {c.montoMoraExcluida > 0 ? `-${formatCurrency(c.montoMoraExcluida)}` : '$0.00'}
                    </TableCell>
                    <TableCell className="text-right font-mono tabular-nums font-semibold text-foreground">
                      {formatCurrency(c.baseComisionable)}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="success" className="font-mono text-[11px]">
                        {c.porcentajeComision}%
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono tabular-nums text-[14px] font-semibold text-primary">
                      {formatCurrency(c.montoComisionGanada)}
                    </TableCell>
                  </TableRow>
                ))}
                {displayedCommissions.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="p-8 text-center text-text-muted">
                      No se registraron cobros para los promotores en este periodo semanal.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </div>
      )}
    </div>
  );
}
