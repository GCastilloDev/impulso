import React from 'react';
import { EstadoCuota, EstatusPrestamo, ScoreCrediticio } from '@/types';
import { CheckCircle2, AlertTriangle, Clock, XCircle, ShieldCheck, ShieldAlert } from 'lucide-react';

export function LoanStatusBadge({ status }: { status: EstatusPrestamo }) {
  switch (status) {
    case 'Activo':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          <CheckCircle2 className="w-3.5 h-3.5" />
          Activo
        </span>
      );
    case 'En Mora':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20 animate-pulse">
          <AlertTriangle className="w-3.5 h-3.5" />
          En Mora
        </span>
      );
    case 'Liquidado':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
          <ShieldCheck className="w-3.5 h-3.5" />
          Liquidado
        </span>
      );
    case 'Incobrable':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-500/10 text-slate-400 border border-slate-500/20">
          <XCircle className="w-3.5 h-3.5" />
          Incobrable
        </span>
      );
    default:
      return null;
  }
}

export function InstallmentStatusBadge({ status }: { status: EstadoCuota }) {
  switch (status) {
    case 'Pagado':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
          <CheckCircle2 className="w-3 h-3" /> Pagado
        </span>
      );
    case 'Mora':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-rose-500/20 text-rose-300 border border-rose-500/30">
          <AlertTriangle className="w-3 h-3" /> En Mora
        </span>
      );
    case 'Parcial':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-amber-500/20 text-amber-300 border border-amber-500/30">
          <Clock className="w-3 h-3" /> Parcial
        </span>
      );
    case 'Pendiente':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-slate-700/50 text-slate-300 border border-slate-600/40">
          <Clock className="w-3 h-3" /> Pendiente
        </span>
      );
    default:
      return null;
  }
}

export function CreditScoreBadge({ score }: { score: ScoreCrediticio }) {
  switch (score) {
    case 'Excelente':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
          <ShieldCheck className="w-3 h-3" /> {score}
        </span>
      );
    case 'Bueno':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-blue-500/15 text-blue-400 border border-blue-500/30">
          <ShieldCheck className="w-3 h-3" /> {score}
        </span>
      );
    case 'Regular':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-amber-500/15 text-amber-400 border border-amber-500/30">
          <ShieldAlert className="w-3 h-3" /> {score}
        </span>
      );
    case 'Alto Riesgo':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-rose-500/15 text-rose-400 border border-rose-500/30">
          <AlertTriangle className="w-3 h-3" /> {score}
        </span>
      );
  }
}
