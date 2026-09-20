// ============================================================
// src/components/demandes/DemandeFilters.tsx
// ============================================================

import React, { useState, useCallback } from 'react';
import { useDemandes } from '../../hooks/useDemandes';
import { useServices } from '../../hooks/useServices';
import { AppStatus, Priority } from '../../types/demande';
import { Input } from '../ui/input';
import { Select } from '../ui/select';
import { Button } from '../ui/button';
import { Search, Filter, X, RotateCcw } from 'lucide-react';
import { useDebouncedSearch } from '../../hooks/useDebouncedSearch';

const STATUS_OPTIONS: { value: AppStatus | ''; label: string }[] = [
  { value: '', label: 'Tous les statuts' },
  { value: AppStatus.SUBMITTED, label: 'Soumises' },
  { value: AppStatus.IN_REVIEW, label: 'En examen' },
  { value: AppStatus.ADDITIONAL_INFO_REQUIRED, label: 'Infos manquantes' },
  { value: AppStatus.UNDER_VERIFICATION, label: 'Vérification' },
  { value: AppStatus.APPROVED, label: 'Approuvées' },
  { value: AppStatus.REJECTED, label: 'Rejetées' },
  { value: AppStatus.COMPLETED, label: 'Traitées' },
];

const PRIORITY_OPTIONS: { value: Priority | ''; label: string }[] = [
  { value: '', label: 'Toutes les priorités' },
  { value: Priority.LOW, label: 'Basse' },
  { value: Priority.NORMAL, label: 'Normale' },
  { value: Priority.HIGH, label: 'Haute' },
  { value: Priority.URGENT, label: 'Urgente' },
];

interface DemandeFiltersProps {
  onFilterChange?: () => void;
}

export const DemandeFilters: React.FC<DemandeFiltersProps> = ({ onFilterChange }) => {
  const { filters, setFilters, resetFilters, filterBySearch, filterByStatus, filterByPriority } = useDemandes();
  const { subServices } = useServices();

  const [searchQuery, setSearchQuery] = useState(filters.search || '');
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Recherche en temps réel : appliquée peu après la dernière frappe, sans bouton à cliquer.
  useDebouncedSearch(searchQuery, (text) => {
    filterBySearch(text);
    onFilterChange?.();
  });

  // « Entrée » applique immédiatement (sans attendre le délai).
  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    filterBySearch(searchQuery.trim());
    onFilterChange?.();
  }, [searchQuery, filterBySearch, onFilterChange]);

  const handleStatusChange = useCallback((value: string) => {
    const status = value as AppStatus | undefined;
    filterByStatus(status);
    onFilterChange?.();
  }, [filterByStatus, onFilterChange]);

  const handlePriorityChange = useCallback((value: string) => {
    const priority = value as Priority | undefined;
    filterByPriority(priority);
    onFilterChange?.();
  }, [filterByPriority, onFilterChange]);

  const handleServiceChange = useCallback((value: string) => {
    setFilters({ subServiceId: value || undefined });
    onFilterChange?.();
  }, [setFilters, onFilterChange]);

  const handleReset = useCallback(() => {
    setSearchQuery('');
    resetFilters();
    onFilterChange?.();
  }, [resetFilters, onFilterChange]);

  const activeFiltersCount = [
    filters.status,
    filters.priority,
    filters.subServiceId,
    filters.search,
  ].filter(Boolean).length;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 space-y-4">
      {/* Barre de recherche principale */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Rechercher par n° dossier, nom, INUE..."
            value={searchQuery}
            onChange={(e : any) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={() => setShowAdvanced(!showAdvanced)}
        >
          <Filter className="h-4 w-4 mr-1" />
          Filtres
          {activeFiltersCount > 0 && (
            <span className="ml-1 bg-primary text-white text-xs px-1.5 py-0.5 rounded-full">
              {activeFiltersCount}
            </span>
          )}
        </Button>
        {activeFiltersCount > 0 && (
          <Button type="button" variant="ghost" onClick={handleReset}>
            <RotateCcw className="h-4 w-4" />
          </Button>
        )}
      </form>

      {/* Filtres avancés */}
      {showAdvanced && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-3 border-t border-gray-100 dark:border-gray-700">
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Statut</label>
            <Select 
            options={STATUS_OPTIONS}
            defaultValue={filters.status || ''}
            onChange={handleStatusChange}
            placeholder="Tous les statuts"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Priorité</label>
            <Select 
            options={PRIORITY_OPTIONS}
            defaultValue={filters.priority || ''}
            onChange={handlePriorityChange}
            placeholder="Toutes les priorités"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Service</label>
            <Select 
            options={[{ value: '', label: 'Tous les services' }, ...subServices.map(s => ({ value: s.id, label: s.name }))]}
            defaultValue={filters.subServiceId || ''}
            onChange={handleServiceChange}
            placeholder="Tous les services"
            />
          </div>
        </div>
      )}

      {/* Tags de filtres actifs */}
      {activeFiltersCount > 0 && (
        <div className="flex flex-wrap gap-2">
          {filters.status && (
            <FilterTag
              label={`Statut: ${STATUS_OPTIONS.find(o => o.value === filters.status)?.label}`}
              onRemove={() => filterByStatus(undefined)}
            />
          )}
          {filters.priority && (
            <FilterTag
              label={`Priorité: ${PRIORITY_OPTIONS.find(o => o.value === filters.priority)?.label}`}
              onRemove={() => filterByPriority(undefined)}
            />
          )}
          {filters.subServiceId && (
            <FilterTag
              label={`Service: ${subServices.find(s => s.id === filters.subServiceId)?.name}`}
              onRemove={() => setFilters({ subServiceId: undefined })}
            />
          )}
          {filters.search && (
            <FilterTag
              label={`Recherche: ${filters.search}`}
              onRemove={() => { setSearchQuery(''); filterBySearch(''); }}
            />
          )}
        </div>
      )}
    </div>
  );
};

// ── Sous-composant FilterTag ──
const FilterTag: React.FC<{ label: string; onRemove: () => void }> = ({ label, onRemove }) => (
  <span className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary text-xs rounded-full">
    {label}
    <button aria-label="Supprimer le filtre" onClick={onRemove} className="hover:bg-primary/20 rounded-full p-0.5">
      <X className="h-3 w-3" />
    </button>
  </span>
);