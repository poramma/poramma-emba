// src/components/ui/pagination/Pagination.tsx

import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { Button } from '../button';

interface PaginationProps {
  /** Page actuelle (1-indexée) */
  currentPage: number;
  /** Nombre total de pages */
  totalPages: number;
  /** Nombre d'éléments par page (optionnel) */
  itemsPerPage?: number;
  /** Nombre total d'éléments (optionnel) */
  totalItems?: number;
  /** Fonction appelée lors du changement de page */
  onPageChange: (page: number) => void;
  /** Nombre de pages à afficher autour de la page courante */
  siblingCount?: number;
  /** Désactiver la pagination */
  disabled?: boolean;
  /** Classes CSS supplémentaires */
  className?: string;
  /** Afficher le compteur d'éléments */
  showItemsCount?: boolean;
  /** Label pour le compteur d'éléments */
  itemsLabel?: string;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  itemsPerPage,
  totalItems,
  onPageChange,
  siblingCount = 1,
  disabled = false,
  className = '',
  showItemsCount = true,
  itemsLabel = 'éléments',
}) => {
  // Si pas de pages ou une seule page, ne rien afficher
  if (totalPages <= 1) return null;

  // Calculer la plage de pages à afficher
  const getPageRange = () => {
    const range: (number | string)[] = [];
    const start = Math.max(1, currentPage - siblingCount);
    const end = Math.min(totalPages, currentPage + siblingCount);

    // Pages avant
    if (start > 1) {
      range.push(1);
      if (start > 2) range.push('...');
    }

    // Pages autour de la page courante
    for (let i = start; i <= end; i++) {
      range.push(i);
    }

    // Pages après
    if (end < totalPages) {
      if (end < totalPages - 1) range.push('...');
      range.push(totalPages);
    }

    return range;
  };

  const pageRange = getPageRange();

  // Calculer la plage d'éléments affichés
  const getItemsRange = () => {
    if (!itemsPerPage || !totalItems) return null;
    const start = (currentPage - 1) * itemsPerPage + 1;
    const end = Math.min(currentPage * itemsPerPage, totalItems);
    return { start, end };
  };

  const itemsRange = getItemsRange();

  const handlePageChange = (page: number) => {
    if (page === currentPage || disabled || page < 1 || page > totalPages) return;
    onPageChange(page);
  };

  return (
    <div className={`flex flex-col sm:flex-row items-center justify-between gap-4 ${className}`}>
      {/* Compteur d'éléments */}
      {showItemsCount && itemsRange && totalItems && (
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {itemsRange.start} - {itemsRange.end} sur {totalItems} {itemsLabel}
        </div>
      )}

      {/* Contrôles de pagination */}
      <div className="flex items-center gap-1">
        {/* Première page */}
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => handlePageChange(1)}
          disabled={currentPage === 1 || disabled}
          aria-label="Première page"
        >
          <ChevronsLeft className="h-4 w-4" />
        </Button>

        {/* Page précédente */}
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1 || disabled}
          aria-label="Page précédente"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        {/* Pages */}
        {pageRange.map((page, index) => {
          if (page === '...') {
            return (
              <span
                key={`ellipsis-${index}`}
                className="h-8 w-8 flex items-center justify-center text-sm text-gray-400"
              >
                …
              </span>
            );
          }

          const pageNumber = page as number;
          const isActive = pageNumber === currentPage;

          return (
            <Button
              key={pageNumber}
              variant={isActive ? 'primary' : 'ghost'}
              size="sm"
              className={`h-8 w-8 p-0 min-w-[32px] ${
                isActive
                  ? 'bg-brand-500 text-white hover:bg-brand-600 dark:bg-brand-600 dark:hover:bg-brand-700'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
              onClick={() => handlePageChange(pageNumber)}
              disabled={disabled || isActive}
              aria-label={`Page ${pageNumber}`}
              aria-current={isActive ? 'page' : undefined}
            >
              {pageNumber}
            </Button>
          );
        })}

        {/* Page suivante */}
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages || disabled}
          aria-label="Page suivante"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>

        {/* Dernière page */}
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => handlePageChange(totalPages)}
          disabled={currentPage === totalPages || disabled}
          aria-label="Dernière page"
        >
          <ChevronsRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Sélecteur de page (optionnel) */}
      {totalPages > 10 && (
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <span>Aller à</span>
          <input
           
            type="number"
            min={1}
            max={totalPages}
            value={currentPage}
            onChange={(e) => {
              const val = parseInt(e.target.value);
              if (!isNaN(val) && val >= 1 && val <= totalPages) {
                handlePageChange(val);
              }
            }}
            className="w-12 px-2 py-1 text-center text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent"
          />
          <span>/ {totalPages}</span>
        </div>
      )}
    </div>
  );
};

export default Pagination;