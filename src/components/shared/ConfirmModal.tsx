'use client';

import React, { useEffect } from 'react';
import { AlertTriangle, Trash2, HelpCircle, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
  isLoading?: boolean;
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  variant = 'danger',
  isLoading = false,
}: ConfirmModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const iconMap = {
    danger: <Trash2 className="w-5 h-5 text-badge-danger-text" />,
    warning: <AlertTriangle className="w-5 h-5 text-badge-warning-text" />,
    info: <HelpCircle className="w-5 h-5 text-link" />,
  };

  const iconBgMap = {
    danger: 'bg-badge-danger-bg border-badge-danger-text/20',
    warning: 'bg-badge-warning-bg border-badge-warning-text/20',
    info: 'bg-badge-info-bg border-badge-info-text/20',
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-foreground/40 backdrop-blur-[2px] flex items-center justify-center p-4"
      onClick={(e) => {
        // Regla estricta: No cerrar modal al hacer click en el backdrop
        e.stopPropagation();
      }}
    >
      {/* Container - Preserva la regla de no cerrar por clic en backdrop */}
      <div
        className="bg-card text-card-foreground w-full max-w-md p-6 rounded-[8px] border border-border shadow-lg space-y-4 animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-[6px] border shrink-0 ${iconBgMap[variant]}`}>
              {iconMap[variant]}
            </div>
            <div>
              <h3 className="text-[15px] font-semibold text-foreground tracking-tight">{title}</h3>
            </div>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8 text-text-muted hover:text-foreground rounded-[4px]"
            title="Cerrar modal (Esc)"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        <p className="text-[13px] text-text-secondary leading-relaxed">{message}</p>

        <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-border">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
          >
            {cancelText}
          </Button>

          <Button
            type="button"
            variant={variant === 'danger' ? 'destructive' : 'default'}
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> Procesando...
              </>
            ) : (
              confirmText
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
