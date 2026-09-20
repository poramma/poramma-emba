// src/components/audit/LogFilters.tsx

import React, { useEffect, useState } from 'react';
import { Search, Calendar, RotateCcw } from 'lucide-react';
import { useDebouncedSearch } from '../../hooks/useDebouncedSearch';
import { entityLabel } from '../../config/audit-labels';
import { Card } from '../ui/card';
import { Input } from '../ui/input';
import { Select } from '../ui/select';
import { Button } from '../ui/button';
import { AuditSeverity } from '../../types/audit';

export interface LogFiltersValue {
  entityType?: string;
  action?: string;
  result?: 'SUCCESS' | 'ERROR' | 'REJECT' | 'WARNING';
  severity?: AuditSeverity;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

interface LogFiltersProps {
  value: LogFiltersValue;
  onChange: (value: LogFiltersValue) => void;
  onReset: () => void;
}

const ENTITY_TYPE_OPTIONS = [
  { value: '', label: 'Tous les objets' },
  ...['SESSION', 'AUTHENTIFICATION', 'UTILISATEUR', 'USER', 'AGENT', 'AFFECTATION_AGENT', 'DISPONIBILITE_AGENT', 'DEMANDE_AGENT', 'TICKET_SUPPORT', 'CULTURE_ECHANGE', 'DEMANDE_SUR_PLACE', 'ROLE', 'DEMANDE', 'RENDEZ_VOUS', 'ETUDIANT', 'DOCUMENT', 'DOCUMENT_INTERNE', 'CAMPAGNE', 'SERVICE', 'SOUS_SERVICE', 'HORAIRE_SERVICE', 'MESSAGE', 'AUDIT'].map((value) => ({
    value,
    label: entityLabel(value),
  })),
];

const RESULT_OPTIONS = [
  { value: '', label: 'Tous les résultats' },
  { value: 'SUCCESS', label: 'Succès' },
  { value: 'ERROR', label: 'Erreur' },
  { value: 'REJECT', label: 'Rejeté' },
  { value: 'WARNING', label: 'Avertissement' },
];

const SEVERITY_OPTIONS = [
  { value: '', label: 'Toutes les sévérités' },
  { value: AuditSeverity.INFO, label: 'Information' },
  { value: AuditSeverity.WARNING, label: 'Avertissement' },
  { value: AuditSeverity.CRITICAL, label: 'Critique' },
];

export const LogFilters: React.FC<LogFiltersProps> = ({ value, onChange, onReset }) => {
  const hasActiveFilters = Object.values(value).some((v) => v !== undefined && v !== '');

  const set = (key: keyof LogFiltersValue, v: string) => {
    onChange({ ...value, [key]: v || undefined });
  };

  // Recherche en temps réel : texte local, appliqué peu après la dernière frappe (pas une requête par touche).
  const [searchText, setSearchText] = useState(value.search ?? '');
  useDebouncedSearch(searchText, (text) => onChange({ ...value, search: text || undefined }));
  // Réinitialisation depuis l'extérieur : vide aussi le champ.
  useEffect(() => {
    if (!value.search) setSearchText('');
  }, [value.search]);

  return (
    <Card className="p-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <Input
          placeholder="Rechercher (nom, email, action, objet)..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          startIcon={<Search className="w-4 h-4" />}
        />
        <Select
          value={value.entityType || ''}
          onChange={(v) => set('entityType', v)}
          options={ENTITY_TYPE_OPTIONS}
        />
        <Select
          value={value.result || ''}
          onChange={(v) => set('result', v)}
          options={RESULT_OPTIONS}
        />
        <Select
          value={value.severity || ''}
          onChange={(v) => set('severity', v)}
          options={SEVERITY_OPTIONS}
        />
        <Input
          type="date"
          value={value.dateFrom || ''}
          onChange={(e) => set('dateFrom', e.target.value)}
          startIcon={<Calendar className="w-4 h-4" />}
          placeholder="Date début"
        />
        <Input
          type="date"
          value={value.dateTo || ''}
          onChange={(e) => set('dateTo', e.target.value)}
          placeholder="Date fin"
        />
        {hasActiveFilters && (
          <Button variant="ghost" onClick={onReset} className="justify-self-start">
            <RotateCcw className="w-4 h-4 mr-2" />
            Réinitialiser
          </Button>
        )}
      </div>
    </Card>
  );
};

export default LogFilters;
