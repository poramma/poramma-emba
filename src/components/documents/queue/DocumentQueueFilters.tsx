// ============================================================
// src/components/documents/DocumentQueueFilters.tsx
// ============================================================

/**
 * Barre de filtres — /documents/queue
 * Câblée directement sur les wrappers de filtres du hook useDocuments().
 */

import React from 'react';
import { Select } from '../../ui/select';
import { DatePicker } from '../../ui/date-picker';
import { Button } from '../../ui/button';
import { RotateCcw } from 'lucide-react';
import { DocStatus, DocumentType, DocumentFilters } from '../../../types';
import { documentTypeLabels } from '../../../config/document-labels';

interface DocumentQueueFiltersProps {
  filters: DocumentFilters;
  onTypeChange: (type: DocumentType | undefined) => void;
  onStatusChange: (status: DocStatus | undefined) => void;
  onDateRangeChange: (dateFrom?: string, dateTo?: string) => void;
  onReset: () => void;
}

const STATUS_OPTIONS = [
  { value: DocStatus.UPLOADED, label: 'Téléversé' },
  { value: DocStatus.IN_REVIEW, label: 'En vérification' },
];

const TYPE_OPTIONS = Object.values(DocumentType).map((type) => ({
  value: type,
  label: documentTypeLabels[type],
}));

export const DocumentQueueFilters: React.FC<DocumentQueueFiltersProps> = ({
  filters,
  onTypeChange,
  onStatusChange,
  onDateRangeChange,
  onReset,
}) => {
  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="min-w-[180px]">
        <Select
          label="Type de document"
          placeholder="Tous les types"
          value={filters.type}
          options={TYPE_OPTIONS}
          onChange={(value) => onTypeChange(value as DocumentType | undefined)}
        />
      </div>

      <div className="min-w-[180px]">
        <Select
          label="Statut"
          placeholder="Tous les statuts"
          value={filters.status}
          options={STATUS_OPTIONS}
          onChange={(value) => onStatusChange(value as DocStatus | undefined)}
        />
      </div>

      <div className="min-w-[160px]">
        <DatePicker
          label="Du"
          value={filters.dateFrom}
          onChange={(date) => onDateRangeChange(date, filters.dateTo)}
        />
      </div>

      <div className="min-w-[160px]">
        <DatePicker
          label="Au"
          value={filters.dateTo}
          onChange={(date) => onDateRangeChange(filters.dateFrom, date)}
        />
      </div>

      <Button variant="outline" onClick={onReset} startIcon={<RotateCcw className="w-4 h-4" />}>
        Réinitialiser
      </Button>
    </div>
  );
};

export default DocumentQueueFilters;