// ============================================================
// src/components/ui/emptyState.tsx
// ============================================================

import React from 'react';
import { cn } from '../../../lib/utils';
import { Button } from '../button';
import { LucideIcon, Search, FileX, Inbox, FolderOpen, AlertCircle } from 'lucide-react';

type EmptyIcon = 'search' | 'file' | 'inbox' | 'folder' | 'alert' | LucideIcon;

interface EmptyStateProps {
  icon?: EmptyIcon;
  title?: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    icon?: LucideIcon;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
  compact?: boolean;
}

const ICON_MAP: Record<string, LucideIcon> = {
  search: Search,
  file: FileX,
  inbox: Inbox,
  folder: FolderOpen,
  alert: AlertCircle,
};

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = 'inbox',
  title = 'Aucun résultat',
  description = 'Il n\'y a rien à afficher pour le moment.',
  action,
  secondaryAction,
  className,
  compact = false,
}) => {
  const IconComponent = typeof icon === 'string' ? ICON_MAP[icon] || Inbox : icon;

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center',
        compact ? 'py-8' : 'py-16 px-4',
        className
      )}
    >
      <div
        className={cn(
          'rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4',
          compact ? 'w-12 h-12' : 'w-16 h-16'
        )}
      >
        <IconComponent
          className={cn(
            'text-gray-400 dark:text-gray-500',
            compact ? 'w-6 h-6' : 'w-8 h-8'
          )}
        />
      </div>

      <h3
        className={cn(
          'font-semibold text-gray-900 dark:text-white',
          compact ? 'text-sm' : 'text-lg'
        )}
      >
        {title}
      </h3>

      <p
        className={cn(
          'text-gray-500 dark:text-gray-400 mt-1 max-w-sm',
          compact ? 'text-xs' : 'text-sm'
        )}
      >
        {description}
      </p>

      {(action || secondaryAction) && (
        <div className={cn('flex gap-3', compact ? 'mt-3' : 'mt-6')}>
          {action && (
            <Button onClick={action.onClick} size={compact ? 'sm' : 'md'}>
              {action.icon && <action.icon className="h-4 w-4 mr-2" />}
              {action.label}
            </Button>
          )}
          {secondaryAction && (
            <Button
              variant="outline"
              onClick={secondaryAction.onClick}
              size={compact ? 'sm' : 'md'}
            >
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

// ── Variantes prédéfinies ──

export const EmptySearch: React.FC<{
  query?: string;
  onClear?: () => void;
}> = ({ query, onClear }) => (
  <EmptyState
    icon="search"
    title={query ? `Aucun résultat pour "${query}"` : 'Aucun résultat'}
    description="Essayez de modifier vos critères de recherche ou de supprimer les filtres."
    action={onClear ? { label: 'Effacer les filtres', onClick: onClear } : undefined}
  />
);

export const EmptyData: React.FC<{
  entityName?: string;
  onCreate?: () => void;
}> = ({ entityName = 'élément', onCreate }) => (
  <EmptyState
    icon="folder"
    title={`Aucun ${entityName}`}
    description={`Commencez par créer votre premier ${entityName}.`}
    action={onCreate ? { label: `Créer un ${entityName}`, onClick: onCreate } : undefined}
  />
);

export const EmptyError: React.FC<{
  message?: string;
  onRetry?: () => void;
}> = ({ message = 'Une erreur est survenue', onRetry }) => (
  <EmptyState
    icon="alert"
    title="Oups !"
    description={message}
    action={onRetry ? { label: 'Réessayer', onClick: onRetry } : undefined}
  />
);