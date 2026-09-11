// src/components/services/ServiceList.tsx

import React, { useState } from 'react';
import { 
  Search, Filter, Plus, Edit, Trash2, Eye, 
  Calendar, Clock, User, Shield, AlertCircle,
  CheckCircle, XCircle, ChevronDown, ChevronUp
} from 'lucide-react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select } from '../ui/select';
import { Badge } from '../ui/badge';
import { useServices } from '../../hooks/useServices';
import { usePermission } from '../../hooks/usePermission';
import { formatDateShort } from '../../lib/date';
import { Service, SubService } from '../../types/services';

interface ServiceListProps {
  onSelectService?: (service: Service) => void;
  onSelectSubService?: (subService: SubService) => void;
  onEdit?: (subService: SubService) => void;
  onDelete?: (subService: SubService) => void;
  showActions?: boolean;
  compact?: boolean;
}

export const ServiceList: React.FC<ServiceListProps> = ({
  onSelectService,
  onSelectSubService,
  onEdit,
  onDelete,
  showActions = true,
  compact = false,
}) => {
  const {
    services,
    subServices,
    filteredSubServices,
    selectedService,
    searchQuery,
    activeFilter,
    isLoading,
    selectService,
    setSearchQuery,
    setActiveFilter,
    resetFilters,
    toggleSubServiceActive,
    getTarifLabel,
    getServiceStats,
  } = useServices();

  const { can, canManageServices } = usePermission();
  const [expandedServices, setExpandedServices] = useState<Set<string>>(new Set());

  const stats = getServiceStats();

  const toggleExpand = (serviceId: string) => {
    setExpandedServices(prev => {
      const newSet = new Set(prev);
      if (newSet.has(serviceId)) {
        newSet.delete(serviceId);
      } else {
        newSet.add(serviceId);
      }
      return newSet;
    });
  };

  const getServiceSubServices = (serviceId: string) => {
    return subServices.filter(s => s.serviceId === serviceId);
  };

  const getStatusBadge = (active: boolean) => {
    return active ? (
      <Badge color="success" variant="light" startIcon={<CheckCircle className="w-3 h-3" />}>
        Actif
      </Badge>
    ) : (
      <Badge color="error" variant="light" startIcon={<XCircle className="w-3 h-3" />}>
        Inactif
      </Badge>
    );
  };

  const getFilterLabel = (filter: string) => {
    switch (filter) {
      case 'appointment': return 'Avec rendez-vous';
      case 'no-appointment': return 'Sans rendez-vous';
      case 'free': return 'Gratuits';
      case 'paid': return 'Payants';
      default: return 'Tous';
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Statistiques */}
      {!compact && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="p-3 text-center">
            <div className="text-xl font-bold text-gray-900 dark:text-white">{stats.total}</div>
            <div className="text-xs text-gray-500">Total services</div>
          </Card>
          <Card className="p-3 text-center">
            <div className="text-xl font-bold text-green-600">{stats.active}</div>
            <div className="text-xs text-gray-500">Actifs</div>
          </Card>
          <Card className="p-3 text-center">
            <div className="text-xl font-bold text-blue-600">{stats.withAppointment}</div>
            <div className="text-xs text-gray-500">Avec rendez-vous</div>
          </Card>
          <Card className="p-3 text-center">
            <div className="text-xl font-bold text-purple-600">{stats.free}</div>
            <div className="text-xs text-gray-500">Gratuits</div>
          </Card>
        </div>
      )}

      {/* Barre de recherche et filtres */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <Input
              placeholder="Rechercher un service..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              startIcon={<Search className="w-4 h-4" />}
              className="w-full"
            />
          </div>
          <div className="flex gap-2">
            <Select
              value={activeFilter}
              onChange={(value) => setActiveFilter(value as "all" | "appointment" | "no-appointment" | "free" | "paid")}
              options={[
                { value: 'all', label: 'Tous' },
                { value: 'appointment', label: 'Avec rendez-vous' },
                { value: 'no-appointment', label: 'Sans rendez-vous' },
                { value: 'free', label: 'Gratuits' },
                { value: 'paid', label: 'Payants' },
              ]}
              className="w-40"
            />
            <Button variant="ghost" size="sm" onClick={resetFilters}>
              Réinitialiser
            </Button>
          </div>
        </div>
      </Card>

      {/* Liste des services */}
      {compact ? (
        // Vue compacte (pour sélection rapide)
        <div className="space-y-2">
          {filteredSubServices.map((subService) => (
            <Card
              key={subService.id}
              className="p-3 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => onSelectSubService?.(subService)}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    {subService.name}
                  </div>
                  <div className="text-sm text-gray-500">{subService.code}</div>
                </div>
                <Badge color={subService.active ? 'success' : 'error'} variant="light">
                  {subService.active ? 'Actif' : 'Inactif'}
                </Badge>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        // Vue complète par catégorie
        <div className="space-y-4">
          {services.map((service) => {
            const serviceSubs = getServiceSubServices(service.id);
            const isExpanded = expandedServices.has(service.id);
            const isSelected = selectedService?.id === service.id;

            return (
              <Card
                key={service.id}
                className={`overflow-hidden transition-all ${
                  isSelected ? 'ring-2 ring-brand-500' : ''
                }`}
              >
                {/* En-tête du service */}
                <div
                  className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                  onClick={() => {
                    selectService(isSelected ? null : service.id);
                    toggleExpand(service.id);
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center text-brand-600">
                      <span className="text-lg">📁</span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {service.name}
                      </h3>
                      <p className="text-sm text-gray-500">{service.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {getStatusBadge(service.active)}
                    <Badge color="primary" variant="light">
                      {serviceSubs.length} sous-services
                    </Badge>
                    <Button
                      size="xs"
                      variant="ghost"
                      onClick={(e) => {
                        e?.stopPropagation();
                        toggleExpand(service.id);
                      }}
                    >
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>

                {/* Sous-services */}
                {isExpanded && (
                  <div className="border-t border-gray-200 dark:border-gray-700">
                    {serviceSubs.length === 0 ? (
                      <div className="p-4 text-center text-gray-500">
                        Aucun sous-service pour cette catégorie
                      </div>
                    ) : (
                      <div className="divide-y divide-gray-200 dark:divide-gray-700">
                        {serviceSubs.map((sub) => (
                          <div
                            key={sub.id}
                            className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                          >
                            <div className="flex items-start justify-between">
                              <div
                                className="flex-1 cursor-pointer"
                                onClick={() => onSelectSubService?.(sub)}
                              >
                                <div className="flex items-center gap-2">
                                  <h4 className="font-medium text-gray-900 dark:text-white">
                                    {sub.name}
                                  </h4>
                                  <Badge color="light" variant="light" size="xs">
                                    {sub.code}
                                  </Badge>
                                  {getStatusBadge(sub.active)}
                                </div>
                                {sub.description && (
                                  <p className="text-sm text-gray-500 mt-1">
                                    {sub.description}
                                  </p>
                                )}
                                <div className="flex flex-wrap gap-3 mt-2 text-sm text-gray-500">
                                  <span className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    SLA: {sub.slaDays} jours
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Shield className="w-3 h-3" />
                                    {sub.requiresInPerson ? 'Sur place' : 'À distance'}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    {sub.schedules.length} créneaux
                                  </span>
                                  <span className="flex items-center gap-1 font-medium text-gray-700 dark:text-gray-300">
                                    {getTarifLabel(sub)}
                                  </span>
                                </div>
                              </div>

                              {showActions && canManageServices() && (
                                <div className="flex gap-1 ml-4">
                                  <Button
                                    size="xs"
                                    variant="ghost"
                                    onClick={() => onEdit?.(sub)}
                                  >
                                    <Edit className="w-3 h-3" />
                                  </Button>
                                  <Button
                                    size="xs"
                                    variant="ghost"
                                    onClick={() => toggleSubServiceActive(sub.id)}
                                  >
                                    {sub.active ? (
                                      <XCircle className="w-3 h-3 text-red-500" />
                                    ) : (
                                      <CheckCircle className="w-3 h-3 text-green-500" />
                                    )}
                                  </Button>
                                  <Button
                                    size="xs"
                                    variant="ghost"
                                    onClick={() => onDelete?.(sub)}
                                  >
                                    <Trash2 className="w-3 h-3 text-red-500" />
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </Card>
            );
          })}

          {filteredSubServices.length === 0 && (
            <Card className="p-8 text-center">
              <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Aucun service trouvé
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                Aucun service ne correspond à vos critères de recherche.
              </p>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};

export default ServiceList;