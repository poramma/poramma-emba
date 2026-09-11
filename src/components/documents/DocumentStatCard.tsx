// ============================================================
// src/components/documents/DocumentStatCard.tsx
// ============================================================

/**
 * Carte KPI utilisée sur le dashboard /documents.
 * variant pilote la couleur de l'icône selon la charte Mali :
 *   - default: vert (--brand-*)
 *   - warning: or (--gold-*)
 *   - danger:  rouge (--accent-*)
 */

import React from 'react';
import { Card } from '../ui/card';
import type { LucideIcon } from 'lucide-react';

interface DocumentStatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  hint?: string;
  variant?: 'default' | 'warning' | 'danger';
  onClick?: () => void;
}

const VARIANT_STYLES: Record<NonNullable<DocumentStatCardProps['variant']>, string> = {
  default: 'text-[var(--brand-700)] bg-[var(--brand-50)]',
  warning: 'text-[var(--gold-700)] bg-[var(--gold-50)]',
  danger: 'text-[var(--accent-700)] bg-[var(--accent-50)]',
};

export const DocumentStatCard: React.FC<DocumentStatCardProps> = ({
  label,
  value,
  icon: Icon,
  hint,
  variant = 'default',
  onClick,
}) => {
  const isInteractive = !!onClick;

  return (
    <Card
      className={`p-5 flex items-start gap-4 ${
        isInteractive ? 'cursor-pointer transition-shadow hover:shadow-theme-md' : ''
      }`}
      onClick={onClick}
      role={isInteractive ? 'button' : undefined}
      tabIndex={isInteractive ? 0 : undefined}
      onKeyDown={
        isInteractive
          ? (e: React.KeyboardEvent) => {
              if (e.key === 'Enter') onClick?.();
            }
          : undefined
      }
    >
      <div
        className={`w-11 h-11 rounded-lg flex items-center justify-center shrink-0 ${VARIANT_STYLES[variant]}`}
      >
        <Icon className="w-5 h-5" />
      </div>
      <div className="min-w-0">
        <p className="text-theme-sm text-gray-500 dark:text-gray-400">{label}</p>
        <p className="text-title-sm font-semibold text-gray-900 dark:text-white mt-1">
          {value}
        </p>
        {hint && <p className="text-theme-xs text-gray-400 mt-1">{hint}</p>}
      </div>
    </Card>
  );
};

export default DocumentStatCard;