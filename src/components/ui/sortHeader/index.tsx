// src/components/ui/sortheader/SortHeader.tsx

import React from 'react';
import { ChevronUp, ChevronDown, ArrowUpDown } from 'lucide-react';

interface SortHeaderProps {
  /** Label affiché */
  label: string;
  /** Indique si le tri est actif sur cette colonne */
  active: boolean;
  /** Direction du tri (ascendant ou descendant) */
  direction?: 'asc' | 'desc';
  /** Fonction appelée lors du clic */
  onClick: () => void;
  /** Classes CSS supplémentaires */
  className?: string;
  /** Désactiver le tri */
  disabled?: boolean;
  /** Afficher une icône personnalisée */
  icon?: React.ReactNode;
  /** Taille du texte */
  size?: 'xs' | 'sm' | 'md' | 'lg';
  /** Cacher l'icône de tri */
  hideIcon?: boolean;
  /** Alignement du texte */
  align?: 'left' | 'center' | 'right';
}

export const SortHeader: React.FC<SortHeaderProps> = ({
  label,
  active,
  direction,
  onClick,
  className = '',
  disabled = false,
  icon,
  size = 'xs',
  hideIcon = false,
  align = 'left',
}) => {
  const sizeClasses = {
    xs: 'text-xs',
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
  };

  const alignClasses = {
    left: 'justify-start',
    center: 'justify-center',
    right: 'justify-end',
  };

  const getSortIcon = () => {
    if (icon) return icon;

    if (!active) {
      return <ArrowUpDown className={`h-3 w-3 text-gray-400 dark:text-gray-500 ${hideIcon ? 'opacity-0' : ''}`} />;
    }

    if (direction === 'asc') {
      return <ChevronUp className="h-3 w-3 text-brand-600 dark:text-brand-400" />;
    }

    if (direction === 'desc') {
      return <ChevronDown className="h-3 w-3 text-brand-600 dark:text-brand-400" />;
    }

    return <ArrowUpDown className="h-3 w-3 text-gray-400 dark:text-gray-500" />;
  };

  const getSortAriaLabel = () => {
    if (!active) return `Trier par ${label}`;
    if (direction === 'asc') return `Trier par ${label} (descendant)`;
    if (direction === 'desc') return `Trier par ${label} (ascendant)`;
    return `Trier par ${label}`;
  };

  return (
    <button
      className={`
        group inline-flex items-center gap-1.5
        ${sizeClasses[size]}
        ${alignClasses[align]}
        font-medium text-gray-500 dark:text-gray-400
        hover:text-gray-700 dark:hover:text-gray-200
        transition-colors duration-200
        ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
        ${className}
      `}
      onClick={onClick}
      disabled={disabled}
      aria-label={getSortAriaLabel()}
      type="button"
    >
      <span className="select-none">{label}</span>
      
      <span className="flex-shrink-0 transition-transform duration-200 group-hover:scale-110">
        {getSortIcon()}
      </span>

      {/* Indicateur de position du tri (pour l'accessibilité) */}
      {active && (
        <span className="sr-only">
          {direction === 'asc' ? ' (tri ascendant)' : ' (tri descendant)'}
        </span>
      )}
    </button>
  );
};

export default SortHeader;