// ============================================================
// src/components/ui/confirmDialog.tsx
// ============================================================

import React, { useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../../../lib/utils';
import { Button } from '../button';
import { AlertTriangle, Info, CheckCircle, XCircle, X } from 'lucide-react';

export type DialogVariant = 'default' | 'destructive' | 'warning' | 'info' | 'success';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: DialogVariant;
  loading?: boolean;
  hideCancel?: boolean;
}

const VARIANT_CONFIG: Record<DialogVariant, { icon: React.ElementType; iconColor: string; buttonClass: string }> = {
  default: { 
    icon: Info, 
    iconColor: 'text-blue-600 bg-blue-100', 
    buttonClass: 'bg-primary hover:bg-primary/90' 
  },
  destructive: { 
    icon: XCircle, 
    iconColor: 'text-red-600 bg-red-100', 
    buttonClass: 'bg-red-600 hover:bg-red-700' 
  },
  warning: { 
    icon: AlertTriangle, 
    iconColor: 'text-amber-600 bg-amber-100', 
    buttonClass: 'bg-amber-600 hover:bg-amber-700' 
  },
  info: { 
    icon: Info, 
    iconColor: 'text-blue-600 bg-blue-100', 
    buttonClass: 'bg-blue-600 hover:bg-blue-700' 
  },
  success: { 
    icon: CheckCircle, 
    iconColor: 'text-emerald-600 bg-emerald-100', 
    buttonClass: 'bg-emerald-600 hover:bg-emerald-700' 
  },
};

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirmer',
  cancelLabel = 'Annuler',
  variant = 'default',
  loading = false,
  hideCancel = false,
}) => {
  const { icon: Icon, iconColor, buttonClass } = VARIANT_CONFIG[variant];

  // Fermer avec Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  const handleConfirm = useCallback(async () => {
    if (loading) return;
    await onConfirm();
    // Ne pas fermer ici — laisser le parent gérer via onClose si besoin
  }, [loading, onConfirm]);

  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !loading) onClose();
  }, [loading, onClose]);

  if (!isOpen) return null;

  // Vérifier que le body existe pour le portal
  if (typeof document === 'undefined') return null;

  const dialogContent = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={handleBackdropClick}
      role="presentation"
    >
      <div
        className={cn(
          'bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full p-6',
          'transform transition-all animate-in zoom-in-95 duration-200',
          'ring-1 ring-gray-200 dark:ring-gray-700'
        )}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        aria-describedby="dialog-description"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start gap-4">
          <div className={cn('w-12 h-12 rounded-full flex items-center justify-center shrink-0', iconColor)}>
            <Icon className="h-6 w-6" />
          </div>
          <div className="flex-1 min-w-0">
            <h3
              id="dialog-title"
              className="text-lg font-semibold text-gray-900 dark:text-white"
            >
              {title}
            </h3>
            <p
              id="dialog-description"
              className="text-sm text-gray-500 dark:text-gray-400 mt-1"
            >
              {message}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors disabled:opacity-50"
            disabled={loading}
            aria-label="Fermer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 mt-6">
          {!hideCancel && (
            <Button
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              {cancelLabel}
            </Button>
          )}
          <Button
            onClick={handleConfirm}
            disabled={loading}
            className={cn(buttonClass, 'text-white')}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Traitement...
              </span>
            ) : (
              confirmLabel
            )}
          </Button>
        </div>
      </div>
    </div>
  );

  return createPortal(dialogContent, document.body);
};
