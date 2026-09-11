// src/components/communication/wizard/CampagneTargetingStep.tsx

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, MapPin, GraduationCap, Building, 
  CheckCircle, Plus, X,
  AlertCircle, ChevronDown, ChevronUp,
  UserPlus
} from 'lucide-react';
import { Card } from '../../ui/card';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Badge } from '../../ui/badge';
import { RecipientEstimateBadge } from '../RecipientEstimateBadge';
import { CampagneFilters } from '../../../types/communication';
import { useCommunication } from '../../../hooks/useCommunication';
import { useDebounce } from '../../../hooks/useDebounce';

interface CampagneTargetingStepProps {
  filters: CampagneFilters;
  onChange: (filters: CampagneFilters) => void;
  estimate: any;
  isEstimating?: boolean;
}

const CITIES = [
  'Casablanca', 'Rabat', 'Marrakech', 'Fès', 'Tanger',
  'Meknès', 'Agadir', 'Oujda', 'Kénitra', 'Tétouan',
  'Safi', 'Mohammédia', 'El Jadida', 'Béni Mellal', 'Nador'
];

const STUDY_LEVELS = [
  'Baccalauréat', 'Bac +1', 'Bac +2', 'Licence', 'Master 1', 
  'Master 2', 'Doctorat', 'Autre'
];

const STATUSES = ['VERIFIED', 'PENDING', 'UNVERIFIED'];

export const CampagneTargetingStep: React.FC<CampagneTargetingStepProps> = ({
  filters,
  onChange,
  estimate,
  isEstimating = false,
}) => {
  const { estimateRecipients } = useCommunication();
  const [isExpanded, setIsExpanded] = useState<Record<string, boolean>>({
    cities: true,
    statuses: true,
    studyLevels: true,
    universities: true,
    faculties: true,
    manual: false,
  });
  const [manualSearch, setManualSearch] = useState('');
  const [selectedManualUsers, setSelectedManualUsers] = useState<string[]>([]);
  const [showAllFilter, setShowAllFilter] = useState(false);

  // Debounce pour l'estimation
  const debouncedFilters = useDebounce(filters, 500);

  useEffect(() => {
    if (debouncedFilters && Object.keys(debouncedFilters).length > 0) {
      estimateRecipients(debouncedFilters);
    }
  }, [debouncedFilters]);

  const hasActiveFilters = useMemo(() => {
    return Object.entries(filters).some(([_, value]) => {
      if (Array.isArray(value)) return value.length > 0;
      if (typeof value === 'boolean') return value;
      return value !== undefined && value !== null && value !== '';
    });
  }, [filters]);

  const handleFilterChange = <K extends keyof CampagneFilters>(
    key: K,
    value: CampagneFilters[K]
  ) => {
    const newFilters = { ...filters, [key]: value };
    // Nettoyer les valeurs vides
    if (Array.isArray(value) && value.length === 0) {
      delete newFilters[key];
    }
    if (value?.toString() === '' || value === null || value === undefined) {
      delete newFilters[key];
    }
    onChange(newFilters);
  };

  const handleToggleFilter = (key: keyof CampagneFilters, value: string) => {
    const current = (filters[key] as string[]) || [];
    const newValue = current.includes(value)
      ? current.filter(v => v !== value)
      : [...current, value];
    handleFilterChange(key, newValue);
  };

  const handleAddManualUser = () => {
    if (manualSearch.trim() && !selectedManualUsers.includes(manualSearch.trim())) {
      const newUsers = [...selectedManualUsers, manualSearch.trim()];
      setSelectedManualUsers(newUsers);
      handleFilterChange('userIds', newUsers);
      setManualSearch('');
    }
  };

  const handleRemoveManualUser = (userId: string) => {
    const newUsers = selectedManualUsers.filter(id => id !== userId);
    setSelectedManualUsers(newUsers);
    handleFilterChange('userIds', newUsers);
  };

  const handleSetAllVerified = () => {
    if (!showAllFilter) {
      if (!window.confirm('Cette campagne touchera potentiellement tous les étudiants vérifiés de la base.')) {
        return;
      }
      setShowAllFilter(true);
      onChange({ statuses: ['VERIFIED'] });
    }
  };

  const toggleSection = (section: string) => {
    setIsExpanded(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const renderSection = (
    title: string,
    key: keyof CampagneFilters,
    options: string[],
    sectionKey: string,
    label: string
  ) => {
    const selected = (filters[key] as string[]) || [];
    const isOpen = isExpanded[sectionKey] !== false;

    return (
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
        <button
          className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          onClick={() => toggleSection(sectionKey)}
        >
          <div className="flex items-center gap-2">
            {title === 'Villes' && <MapPin className="w-4 h-4 text-gray-400" />}
            {title === 'Statuts' && <Users className="w-4 h-4 text-gray-400" />}
            {title === 'Niveaux d\'études' && <GraduationCap className="w-4 h-4 text-gray-400" />}
            {title === 'Universités' && <Building className="w-4 h-4 text-gray-400" />}
            {title === 'Facultés' && <Building className="w-4 h-4 text-gray-400" />}
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{title}</span>
            {selected.length > 0 && (
              <Badge color="primary" variant="light" size="xs">
                {selected.length} sélectionné{selected.length > 1 ? 's' : ''}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </button>

        {isOpen && (
          <div className="px-4 pb-4 space-y-2">
            <div className="flex flex-wrap gap-2">
              {options.map((option) => {
                const isSelected = selected.includes(option);
                return (
                  <button
                    key={option}
                    className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                      isSelected
                        ? 'bg-brand-500 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                    onClick={() => handleToggleFilter(key, option)}
                  >
                    {option}
                  </button>
                );
              })}
            </div>
            {selected.length > 0 && (
              <Button
                size="xs"
                variant="ghost"
                onClick={() => handleFilterChange(key, [])}
                className="text-red-500 hover:text-red-700"
              >
                Effacer la sélection
              </Button>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Estimation */}
      <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <div className="flex items-center gap-3">
          <Users className="w-5 h-5 text-gray-400" />
          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Destinataires estimés
            </p>
            <RecipientEstimateBadge 
              estimate={estimate} 
              isLoading={isEstimating}
            />
          </div>
        </div>
        {!hasActiveFilters && !showAllFilter && (
          <Badge color="warning" variant="light">
            <AlertCircle className="w-3 h-3 mr-1" />
            Aucun filtre actif
          </Badge>
        )}
      </div>

      {/* Bouton "Tous les étudiants vérifiés" */}
      {!hasActiveFilters && !showAllFilter && (
        <Card className="p-4 border-2 border-dashed border-brand-200 dark:border-brand-700 bg-brand-50 dark:bg-brand-900/10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-brand-700 dark:text-brand-300">
                Cibler tous les étudiants vérifiés
              </p>
              <p className="text-sm text-brand-600 dark:text-brand-400">
                Cette option enverra la campagne à l'ensemble des étudiants vérifiés
              </p>
            </div>
            <Button variant="primary" onClick={handleSetAllVerified}>
              <Users className="w-4 h-4 mr-2" />
              Sélectionner tous
            </Button>
          </div>
        </Card>
      )}

      {/* Filtres */}
      {showAllFilter ? (
        <Card className="p-4 border-2 border-green-200 dark:border-green-700 bg-green-50 dark:bg-green-900/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="text-sm font-medium text-green-700 dark:text-green-300">
                Tous les étudiants vérifiés sont ciblés
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setShowAllFilter(false);
                onChange({});
              }}
            >
              <X className="w-4 h-4" />
              Modifier
            </Button>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {renderSection('Villes', 'cities', CITIES, 'cities', 'Villes')}
          {renderSection('Statuts', 'statuses', STATUSES, 'statuses', 'Statuts')}
          {renderSection('Niveaux d\'études', 'studyLevels', STUDY_LEVELS, 'studyLevels', 'Niveaux')}
          {renderSection('Universités', 'universities', [], 'universities', 'Universités')}
          {renderSection('Facultés', 'faculties', [], 'faculties', 'Facultés')}

          {/* Ciblage manuel */}
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
            <button
              className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              onClick={() => toggleSection('manual')}
            >
              <div className="flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-gray-400" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Ciblage manuel (avancé)
                </span>
                {selectedManualUsers.length > 0 && (
                  <Badge color="primary" variant="light" size="xs">
                    {selectedManualUsers.length} sélectionné{selectedManualUsers.length > 1 ? 's' : ''}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                {isExpanded.manual ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </div>
            </button>

            {isExpanded.manual && (
              <div className="px-4 pb-4 space-y-3">
                <p className="text-xs text-gray-400">
                  Ajoutez manuellement des étudiants par leur nom ou INUE. Usage exceptionnel.
                </p>
                <div className="flex gap-2">
                  <Input
                    placeholder="Nom ou INUE..."
                    value={manualSearch}
                    onChange={(e) => setManualSearch(e.target.value)}
                    className="flex-1"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') handleAddManualUser();
                    }}
                  />
                  <Button variant="outline" onClick={handleAddManualUser}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                {selectedManualUsers.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {selectedManualUsers.map((userId) => (
                      <Badge key={userId} color="primary" variant="light" className="flex items-center gap-1">
                        {userId}
                        <button
                          aria-label="Supprimer"
                          className="hover:text-red-500"
                          onClick={() => handleRemoveManualUser(userId)}
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Résumé des filtres actifs */}
      {hasActiveFilters && !showAllFilter && (
        <Card className="p-4 bg-gray-50 dark:bg-gray-800">
          <p className="text-xs font-medium text-gray-500 uppercase mb-2">Filtres actifs</p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(filters).map(([key, value]) => {
              if (!value) return null;
              if (Array.isArray(value) && value.length === 0) return null;
              return (
                <Badge key={key} color="gray" variant="light">
                  {key}: {Array.isArray(value) ? value.join(', ') : String(value)}
                </Badge>
              );
            })}
          </div>
          <Button
            size="xs"
            variant="ghost"
            className="mt-2 text-red-500 hover:text-red-700"
            onClick={() => {
              onChange({});
              setSelectedManualUsers([]);
            }}
          >
            Réinitialiser tous les filtres
          </Button>
        </Card>
      )}

      {/* Avertissement si aucun filtre */}
      {!hasActiveFilters && !showAllFilter && (
        <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg">
          <div className="flex items-start gap-2 text-sm text-yellow-800 dark:text-yellow-200">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Aucun ciblage défini</p>
              <p>Veuillez sélectionner au moins un critère de ciblage pour continuer.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CampagneTargetingStep;