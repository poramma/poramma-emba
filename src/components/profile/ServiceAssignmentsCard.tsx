// src/components/profile/ServiceAssignmentsCard.tsx

import React from 'react';
import { 
  Briefcase, Calendar, Clock, Users, 
  CheckCircle, XCircle, AlertCircle
} from 'lucide-react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { AgentServiceAssignment } from '../../types/auth';
import { formatDateShort } from '../../lib/date';

interface ServiceAssignmentsCardProps {
  assignments: AgentServiceAssignment[];
  /** Demande l'accès à un service (adressée à l'administrateur). */
  onRequestAccess?: () => void;
  /** Signale un problème d'affectation (adressé à l'administrateur). */
  onReport?: () => void;
}

export const ServiceAssignmentsCard: React.FC<ServiceAssignmentsCardProps> = ({
  assignments,
  onRequestAccess,
  onReport,
}) => {
  if (assignments.length === 0) {
    return (
      <Card className="p-6">
        <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Services assignés
        </h4>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Géré par l'administration
        </p>
        <div className="flex flex-col items-center justify-center py-8 text-gray-400">
          <Briefcase className="w-12 h-12 mb-4 opacity-50" />
          <p className="text-sm">Aucun service assigné</p>
        </div>
        {onRequestAccess && (
          <div className="mt-2 border-t border-gray-200 pt-4 dark:border-gray-700">
            <Button variant="outline" size="sm" className="w-full" onClick={onRequestAccess}>
              <AlertCircle className="w-4 h-4 mr-2" />
              Demander l'accès à un service
            </Button>
          </div>
        )}
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
            Services assignés
          </h4>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Géré par l'administration
          </p>
        </div>
        <Badge color="primary" variant="light">
          {assignments.length} service{assignments.length > 1 ? 's' : ''}
        </Badge>
      </div>

      <div className="space-y-3">
        {assignments.map((assignment) => (
          <div key={assignment.id} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-gray-400" />
                  <span className="font-medium text-gray-900 dark:text-white">
                    {assignment.subService?.name || 'Service inconnu'}
                  </span>
                  {assignment.isPrimary ? (
                    <Badge color="primary" variant="solid" size="xs">
                      Principal
                    </Badge>
                  ) : (
                    <Badge color="gray" variant="light" size="xs">
                      Suppléant
                    </Badge>
                  )}
                  {assignment.active ? (
                    <Badge color="success" variant="light" size="xs">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Actif
                    </Badge>
                  ) : (
                    <Badge color="error" variant="light" size="xs">
                      <XCircle className="w-3 h-3 mr-1" />
                      Inactif
                    </Badge>
                  )}
                </div>
                {assignment.subService?.description && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {assignment.subService.description}
                  </p>
                )}
                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-sm text-gray-500">
                  {assignment.maxDailyAppointments && (
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {assignment.maxDailyAppointments} RDV/jour
                    </span>
                  )}
                  {assignment.validFrom && (
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      Depuis le {formatDateShort(assignment.validFrom)}
                    </span>
                  )}
                  {assignment.validUntil && (
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Jusqu'au {formatDateShort(assignment.validUntil)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex flex-col gap-2 sm:flex-row">
          {onRequestAccess && (
            <Button variant="outline" size="sm" className="flex-1" onClick={onRequestAccess}>
              <Briefcase className="w-4 h-4 mr-2" />
              Demander un autre service
            </Button>
          )}
          <Button variant="outline" size="sm" className="flex-1" onClick={onReport} disabled={!onReport}>
            <AlertCircle className="w-4 h-4 mr-2" />
            Signaler un problème d'affectation
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default ServiceAssignmentsCard;