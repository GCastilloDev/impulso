import React from 'react';
import { EstadoCuota, EstatusPrestamo, ScoreCrediticio } from '@/types';
import {
  CheckCircle2,
  AlertTriangle,
  Clock,
  XCircle,
  ShieldCheck,
  ShieldAlert,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export function LoanStatusBadge({
  status,
  className,
}: {
  status: EstatusPrestamo;
  className?: string;
}) {
  switch (status) {
    case 'Activo':
      return (
        <Badge variant="success" className={className}>
          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
          Activo
        </Badge>
      );
    case 'En Mora':
      return (
        <Badge variant="destructive" className={className}>
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
          En Mora
        </Badge>
      );
    case 'Liquidado':
      return (
        <Badge variant="default" className={className}>
          <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
          Liquidado
        </Badge>
      );
    case 'En Evaluación':
      return (
        <Badge variant="warning" className={className}>
          <Clock className="w-3.5 h-3.5 shrink-0" />
          En Evaluación
        </Badge>
      );
    case 'Aprobado':
      return (
        <Badge variant="default" className={className}>
          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
          Aprobado
        </Badge>
      );
    case 'Rechazado':
      return (
        <Badge variant="destructive" className={className}>
          <XCircle className="w-3.5 h-3.5 shrink-0" />
          Rechazado
        </Badge>
      );
    case 'Incobrable':
      return (
        <Badge variant="outline" className={className}>
          <XCircle className="w-3.5 h-3.5 shrink-0" />
          Incobrable
        </Badge>
      );
    default:
      return (
        <Badge variant="outline" className={className}>
          {status}
        </Badge>
      );
  }
}

export function InstallmentStatusBadge({
  status,
  className,
}: {
  status: EstadoCuota;
  className?: string;
}) {
  switch (status) {
    case 'Pagado':
      return (
        <Badge variant="success" className={className}>
          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
          Pagado
        </Badge>
      );
    case 'Mora':
    case 'Vencido':
      return (
        <Badge variant="destructive" className={className}>
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
          {status === 'Vencido' ? 'Vencido' : 'En Mora'}
        </Badge>
      );
    case 'Parcial':
      return (
        <Badge variant="warning" className={className}>
          <Clock className="w-3.5 h-3.5 shrink-0" />
          Parcial
        </Badge>
      );
    case 'Pendiente':
      return (
        <Badge variant="outline" className={className}>
          <Clock className="w-3.5 h-3.5 shrink-0" />
          Pendiente
        </Badge>
      );
    case 'En Revisión':
      return (
        <Badge variant="default" className={className}>
          <Clock className="w-3.5 h-3.5 shrink-0" />
          En Revisión
        </Badge>
      );
    default:
      return (
        <Badge variant="outline" className={className}>
          {status}
        </Badge>
      );
  }
}

export function CreditScoreBadge({
  score,
  className,
}: {
  score: ScoreCrediticio;
  className?: string;
}) {
  switch (score) {
    case 'Excelente':
      return (
        <Badge variant="success" className={className}>
          <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
          {score}
        </Badge>
      );
    case 'Bueno':
      return (
        <Badge variant="default" className={className}>
          <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
          {score}
        </Badge>
      );
    case 'Regular':
      return (
        <Badge variant="warning" className={className}>
          <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
          {score}
        </Badge>
      );
    case 'Alto Riesgo':
      return (
        <Badge variant="destructive" className={className}>
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
          {score}
        </Badge>
      );
    default:
      return (
        <Badge variant="outline" className={className}>
          {score}
        </Badge>
      );
  }
}
