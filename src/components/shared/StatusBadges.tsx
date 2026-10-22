import React from 'react';
import { EstadoCuota, EstatusPrestamo, ScoreCrediticio } from '@/types';
import { CheckCircle2, AlertTriangle, Clock, XCircle, ShieldCheck, ShieldAlert } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export function LoanStatusBadge({ status }: { status: EstatusPrestamo }) {
  switch (status) {
    case 'Activo':
      return (
        <Badge variant="success" className="gap-1.5 text-xs font-bold">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
          Activo
        </Badge>
      );
    case 'En Mora':
      return (
        <Badge variant="destructive" className="gap-1.5 text-xs font-bold bg-rose-100 text-rose-900 border-rose-300">
          <AlertTriangle className="w-3.5 h-3.5 text-rose-700" />
          En Mora
        </Badge>
      );
    case 'Liquidado':
      return (
        <Badge variant="outline" className="gap-1.5 text-xs font-bold bg-blue-50 text-blue-900 border-blue-200">
          <ShieldCheck className="w-3.5 h-3.5 text-blue-700" />
          Liquidado
        </Badge>
      );
    case 'Incobrable':
      return (
        <Badge variant="outline" className="gap-1.5 text-xs font-bold bg-slate-100 text-slate-800 border-slate-300">
          <XCircle className="w-3.5 h-3.5 text-slate-600" />
          Incobrable
        </Badge>
      );
    case 'En Evaluación':
      return (
        <Badge variant="warning" className="gap-1.5 text-xs font-bold">
          <Clock className="w-3.5 h-3.5 text-amber-700" />
          En Evaluación
        </Badge>
      );
    case 'Aprobado':
      return (
        <Badge variant="outline" className="gap-1.5 text-xs font-bold bg-indigo-50 text-indigo-900 border-indigo-200">
          <CheckCircle2 className="w-3.5 h-3.5 text-indigo-700" />
          Aprobado
        </Badge>
      );
    case 'Rechazado':
      return (
        <Badge variant="destructive" className="gap-1.5 text-xs font-bold">
          <XCircle className="w-3.5 h-3.5" />
          Rechazado
        </Badge>
      );
    default:
      return (
        <Badge variant="outline" className="gap-1.5 text-xs font-bold bg-slate-100 text-slate-800 border-slate-300">
          {status}
        </Badge>
      );
  }
}

export function InstallmentStatusBadge({ status }: { status: EstadoCuota }) {
  switch (status) {
    case 'Pagado':
      return (
        <Badge variant="success" className="gap-1 text-xs font-bold">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" /> Pagado
        </Badge>
      );
    case 'Mora':
    case 'Vencido':
      return (
        <Badge variant="destructive" className="gap-1 text-xs font-bold bg-rose-100 text-rose-900 border-rose-300">
          <AlertTriangle className="w-3.5 h-3.5 text-rose-700" /> En Mora
        </Badge>
      );
    case 'Parcial':
      return (
        <Badge variant="warning" className="gap-1 text-xs font-bold">
          <Clock className="w-3.5 h-3.5 text-amber-700" /> Parcial
        </Badge>
      );
    case 'Pendiente':
      return (
        <Badge variant="outline" className="gap-1 text-xs font-medium bg-slate-100 text-slate-700 border-slate-200">
          <Clock className="w-3.5 h-3.5 text-slate-500" /> Pendiente
        </Badge>
      );
    case 'En Revisión':
      return (
        <Badge variant="outline" className="gap-1 text-xs font-bold bg-indigo-50 text-indigo-900 border-indigo-200">
          <Clock className="w-3.5 h-3.5 text-indigo-700" /> En Revisión
        </Badge>
      );
    default:
      return (
        <Badge variant="outline" className="gap-1 text-xs font-medium bg-slate-100 text-slate-700 border-slate-200">
          {status}
        </Badge>
      );
  }
}

export function CreditScoreBadge({ score }: { score: ScoreCrediticio }) {
  switch (score) {
    case 'Excelente':
      return (
        <Badge variant="success" className="gap-1 text-xs font-bold">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" /> {score}
        </Badge>
      );
    case 'Bueno':
      return (
        <Badge variant="outline" className="gap-1 text-xs font-bold bg-blue-50 text-blue-900 border-blue-200">
          <ShieldCheck className="w-3.5 h-3.5 text-blue-700" /> {score}
        </Badge>
      );
    case 'Regular':
      return (
        <Badge variant="warning" className="gap-1 text-xs font-bold">
          <ShieldAlert className="w-3.5 h-3.5 text-amber-700" /> {score}
        </Badge>
      );
    case 'Alto Riesgo':
      return (
        <Badge variant="destructive" className="gap-1 text-xs font-bold">
          <AlertTriangle className="w-3.5 h-3.5" /> {score}
        </Badge>
      );
  }
}
