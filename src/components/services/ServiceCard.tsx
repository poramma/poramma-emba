// src/components/services/ServiceCard.tsx

import React from 'react';
import { 
  Calendar, Clock, User, Shield, Edit, Trash2, 
  Eye, CheckCircle, XCircle, FileText, DollarSign,
  Users, AlertCircle
} from 'lucide-react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Service, SubService } from '../../types/services';
import { formatDateShort } from '../../lib/date';

interface ServiceCardProps {
  service: Service;
  subServices?: SubService[];
  onView?: (service: Service) => void;
  onEdit?: (service: Service) => void;
  onDelete?: (service: Service) => void;
  onSelectSubService?: (subService: SubService) => void;
  showActions?: boolean;
  compact?: boolean;
}

export const ServiceCard: React.FC<ServiceCardProps> = ({
  service,
  subServices = [],
  onView,
  onEdit,
  onDelete,
  onSelectSubService,
  showActions = true,
  compact = false,
}) => {
  const activeSubServices = subServices.filter(s => s.active);
  const totalSubServices = subServices.length;

  if (compact) {
    return (
      <Card className="p-4 hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center text-brand-600 text-xl">
               📁
            </div>
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white">{service.name}</h4>
              <p className="text-sm text-gray-500">{service.code}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge color={service.active ? 'success' : 'error'} variant="light" size="xs">
              {service.active ? 'Actif' : 'Inactif'}
            </Badge>
            <Badge color="primary" variant="light" size="xs">
              {activeSubServices.length}/{totalSubServices}
            </Badge>
            <Button size="xs" variant="ghost" onClick={() => onView?.(service)}>
              <Eye className="w-3 h-3" />
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4 hover:shadow-md transition-shadow">
      {/* En-tête */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-lg bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center text-brand-600 text-2xl">
            {service.icon || '📁'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-gray-900 dark:text-white">{service.name}</h3>
              <Badge color="light" variant="light" size="xs">{service.code}</Badge>
              {service.requiresAppointment && (
                <Badge color="warning" variant="light" size="xs">
                  <Calendar className="w-3 h-3 mr-1" />
                  RDV requis
                </Badge>
              )}
            </div>
            {service.description && (
              <p className="text-sm text-gray-500 mt-1">{service.description}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge color={service.active ? 'success' : 'error'} variant="solid" size="sm">
            {service.active ? 'Actif' : 'Inactif'}
          </Badge>
          {showActions && (
            <div className="flex gap-1">
              <Button size="xs" variant="ghost" onClick={() => onView?.(service)}>
                <Eye className="w-4 h-4" />
              </Button>
              <Button size="xs" variant="ghost" onClick={() => onEdit?.(service)}>
                <Edit className="w-4 h-4" />
              </Button>
              <Button size="xs" variant="ghost" onClick={() => onDelete?.(service)}>
                <Trash2 className="w-4 h-4 text-red-500" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
          <Users className="w-4 h-4 text-gray-400" />
          <span>{activeSubServices.length}/{totalSubServices} sous-services</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
          <Clock className="w-4 h-4 text-gray-400" />
          <span>Délai moyen: {Math.round(subServices.reduce((acc, s) => acc + s.slaDays, 0) / (subServices.length || 1))}j</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
          <DollarSign className="w-4 h-4 text-gray-400" />
          <span>
            {subServices.filter(s => s.basePrice === 0 || s.basePrice === null).length} gratuits
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
          <Shield className="w-4 h-4 text-gray-400" />
          <span>
            {subServices.filter(s => s.requiresInPerson).length} sur place
          </span>
        </div>
      </div>

      {/* Liste des sous-services */}
      {subServices.length > 0 && (
        <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
          <p className="text-xs font-medium text-gray-500 uppercase mb-2">Sous-services</p>
          <div className="space-y-1">
            {subServices.slice(0, 3).map((sub) => (
              <div
                key={sub.id}
                className="flex items-center justify-between p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded cursor-pointer"
                onClick={() => onSelectSubService?.(sub)}
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-900 dark:text-white">{sub.name}</span>
                  <Badge color={sub.active ? 'success' : 'error'} variant="light" size="xs">
                    {sub.active ? 'Actif' : 'Inactif'}
                  </Badge>
                </div>
                <span className="text-sm text-gray-500">{sub.code}</span>
              </div>
            ))}
            {subServices.length > 3 && (
              <p className="text-xs text-gray-500 text-center mt-1">
                + {subServices.length - 3} autres sous-services
              </p>
            )}
          </div>
        </div>
      )}
    </Card>
  );
};

export default ServiceCard;