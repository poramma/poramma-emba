// src/components/documents/DocumentFilterBar.tsx

import React, { useState, useEffect } from 'react';
import { 
  Filter, Search, X, Calendar, FileText, 
  CheckCircle, XCircle, Clock, AlertTriangle
} from 'lucide-react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select } from '../ui/select';
import { Badge } from '../ui/badge';
import { useDocuments } from '../../hooks/useDocuments';
import { DocumentType, DocStatus, DocumentFilters } from '../../types';
import { DocumentCategory } from '../../types/document';

interface DocumentFilterBarProps {
  filters: DocumentFilters;
  onChange: (filters: DocumentFilters) => void;
  availableFilters?: Array<'type' | 'status' | 'category' | 'date' | 'owner'>;
  categories?: DocumentCategory[];
  showCount?: boolean;
  totalCount?: number;
}

const DOCUMENT_TYPES = Object.entries(DocumentType).map(([key, value]) => ({
  value,
  label: key.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase()),
}));

const STATUS_OPTIONS = [
  { value: '', label: 'Tous les statuts' },
  { value: DocStatus.UPLOADED, label: 'Téléversés' },
  { value: DocStatus.IN_REVIEW, label: 'En cours' },
  { value: DocStatus.ACCEPTED, label: 'Validés' },
  { value: DocStatus.REJECTED, label: 'Rejetés' },
  { value: DocStatus.EXPIRED, label: 'Expirés' },
];

export const DocumentFilterBar: React.FC<DocumentFilterBarProps> = ({
  filters,
  onChange,
  availableFilters = ['type', 'status', 'category', 'date', 'owner'],
  categories = [],
  showCount = false,
  totalCount = 0,
}) => {
  const [searchValue, setSearchValue] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);

  // Debounce la recherche
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchValue);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchValue]);

  // Appliquer la recherche quand elle change
  useEffect(() => {
    if (debouncedSearch !== undefined) {
      onChange({ ...filters, search: debouncedSearch || undefined });
    }
  }, [debouncedSearch]);

  const handleFilterChange = (key: keyof DocumentFilters, value: any) => {
    const newFilters = { ...filters, [key]: value };
    // Si la valeur est vide, supprimer la clé
    if (value === '' || value === null || value === undefined) {
      delete newFilters[key];
    }
    onChange(newFilters);
  };

  const handleReset = () => {
    setSearchValue('');
    onChange({});
  };

  const hasActiveFilters = Object.keys(filters).length > 0;

  return (
    <Card className="p-4">
      <div className="flex flex-col gap-4">
        {/* Ligne principale */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <Input
              placeholder="Rechercher un document..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              startIcon={<Search className="w-4 h-4" />}
              endIcon={searchValue ? (
                <button
                  aria-label="Effacer"
                  onClick={() => setSearchValue('')} 
                  className="text-gray-400 hover:text-gray-600">
                  <X className="w-4 h-4" />
                </button>
              ) : undefined}
              className="w-full"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              startIcon={<Filter className="w-4 h-4" />}
            >
              Filtres {hasActiveFilters && (
                <Badge color="primary" variant="solid" size="xs" className="ml-1">
                  {Object.keys(filters).filter(k => k !== 'search' && filters[k as keyof DocumentFilters]).length}
                </Badge>
              )}
            </Button>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={handleReset}>
                <X className="w-4 h-4 mr-1" />
                Réinitialiser
              </Button>
            )}
            {showCount && (
              <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                {totalCount} résultat{totalCount > 1 ? 's' : ''}
              </div>
            )}
          </div>
        </div>

        {/* Filtres étendus */}
        {isExpanded && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-3 border-t border-gray-200 dark:border-gray-700">
            {availableFilters.includes('type') && (
              <Select
                label="Type"
                value={filters.type || ''}
                onChange={(value) => handleFilterChange('type', value || undefined)}
                options={[
                  { value: '', label: 'Tous les types' },
                  ...DOCUMENT_TYPES,
                ]}
              />
            )}

            {availableFilters.includes('status') && (
              <Select
                label="Statut"
                value={filters.status || ''}
                onChange={(value) => handleFilterChange('status', value || undefined)}
                options={STATUS_OPTIONS}
              />
            )}

            {availableFilters.includes('category') && categories.length > 0 && (
              <Select
                label="Catégorie"
                value={filters.categoryId || ''}
                onChange={(value) => handleFilterChange('categoryId', value || undefined)}
                options={[
                  { value: '', label: 'Toutes les catégories' },
                  ...categories.map(c => ({ value: c.id, label: c.name })),
                ]}
              />
            )}

            {availableFilters.includes('date') && (
              <div className="flex gap-2">
                <Input
                  label="Date début"
                  type="date"
                  value={filters.dateFrom || ''}
                  onChange={(e) => handleFilterChange('dateFrom', e.target.value || undefined)}
                />
                <Input
                  label="Date fin"
                  type="date"
                  value={filters.dateTo || ''}
                  onChange={(e) => handleFilterChange('dateTo', e.target.value || undefined)}
                />
              </div>
            )}

            {availableFilters.includes('owner') && (
              <Input
                label="Propriétaire (ID)"
                placeholder="ID utilisateur..."
                value={filters.ownerUserId || ''}
                onChange={(e) => handleFilterChange('ownerUserId', e.target.value || undefined)}
              />
            )}
          </div>
        )}
      </div>
    </Card>
  );
};

export default DocumentFilterBar;