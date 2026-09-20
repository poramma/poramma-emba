// src/components/profile/RoleAndPermissionsCard.tsx

import React, { useState } from 'react';
import { 
  Shield, Key, Unlock, 
  AlertCircle, ChevronDown, ChevronUp,
  FileText, Calendar, Users, Settings
} from 'lucide-react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { UserRole, Role } from '../../types/auth';
import { ROLES_CONFIG } from '../../config/roles';

interface RoleAndPermissionsCardProps {
  roles: UserRole[];
  activeRole?: Role;
  /** Ouvre la demande d'accès / de modification adressée à l'administrateur. */
  onRequestAccess?: () => void;
}

const RESOURCE_ICONS: Record<string, React.ReactNode> = {
  'demande': <FileText className="w-4 h-4" />,
  'rdv': <Calendar className="w-4 h-4" />,
  'service': <Settings className="w-4 h-4" />,
  'user': <Users className="w-4 h-4" />,
  'document': <FileText className="w-4 h-4" />,
  'comm': <Users className="w-4 h-4" />,
  'audit': <Shield className="w-4 h-4" />,
  'payment': <FileText className="w-4 h-4" />,
  'stats': <FileText className="w-4 h-4" />,
  'availability': <Calendar className="w-4 h-4" />,
  'etudiant': <Users className="w-4 h-4" />,
  'message': <FileText className="w-4 h-4" />,
};

const RESOURCE_LABELS: Record<string, string> = {
  'demande': 'Demandes',
  'rdv': 'Rendez-vous',
  'service': 'Services',
  'user': 'Utilisateurs',
  'document': 'Documents',
  'comm': 'Communication',
  'audit': 'Audit',
  'payment': 'Paiements',
  'stats': 'Statistiques',
  'availability': 'Disponibilités',
  'etudiant': 'Étudiants',
  'message': 'Messagerie',
};

export const RoleAndPermissionsCard: React.FC<RoleAndPermissionsCardProps> = ({
  roles,
  activeRole,
  onRequestAccess,
}) => {
  const [expandedPermissions, setExpandedPermissions] = useState(false);

  if (!activeRole) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-3 text-yellow-600">
          <AlertCircle className="w-5 h-5" />
          <p className="text-sm">Aucun rôle actif configuré</p>
        </div>
      </Card>
    );
  }

  const roleConfig = ROLES_CONFIG[activeRole.name];
  
  // Grouper les permissions par ressource
  const activePermissions = activeRole.permissions ?? [];
  const groupedPermissions = activePermissions.reduce((acc, perm) => {
    const resource = perm.code.split(':')[0];
    if (!acc[resource]) acc[resource] = [];
    acc[resource].push(perm);
    return acc;
  }, {} as Record<string, typeof activePermissions>);

  const sortedResources = Object.keys(groupedPermissions).sort();

  return (
    <Card className="p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
            Rôle et permissions
          </h4>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Géré par l'administration
          </p>
        </div>
        <Badge color="primary" variant="solid">
          Niveau {activeRole.level}
        </Badge>
      </div>

      {/* Rôle actif */}
      <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg mb-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Rôle actif</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">
              {activeRole.name}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-300">{activeRole.description}</p>
          </div>
          <Shield className="w-8 h-8 text-brand-500 opacity-50" />
        </div>
        {roleConfig && (
          <div className="mt-2 text-sm text-gray-500">
            {roleConfig.maxDailyAppointments !== undefined && roleConfig.maxDailyAppointments > 0 && (
              <span>Capacité: {roleConfig.maxDailyAppointments} rendez-vous/jour</span>
            )}
          </div>
        )}
      </div>

      {/* Permissions */}
      <div>
        <button
          className="flex items-center justify-between w-full text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
          onClick={() => setExpandedPermissions(!expandedPermissions)}
        >
          <span>Permissions ({activePermissions.length})</span>
          {expandedPermissions ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {expandedPermissions && (
          <div className="mt-3 space-y-3">
            {sortedResources.map((resource) => {
              const perms = groupedPermissions[resource];
              const Icon = RESOURCE_ICONS[resource] || <Key className="w-4 h-4" />;
              const label = RESOURCE_LABELS[resource] || resource;

              return (
                <div key={resource} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                  <div className="p-3 bg-gray-50 dark:bg-gray-800 flex items-center gap-2">
                    {Icon}
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</span>
                    <Badge color="gray" variant="light" size="xs" className="ml-auto">
                      {perms.length} permission{perms.length > 1 ? 's' : ''}
                    </Badge>
                  </div>
                  <div className="p-3 space-y-1">
                    {perms.map((perm) => (
                      <div key={perm.id} className="flex items-center gap-2 text-sm">
                        <Unlock className="w-3 h-3 text-green-500" />
                        <span className="text-gray-600 dark:text-gray-300">{perm.description}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}

            {activePermissions.length === 0 && (
              <div className="text-center py-4 text-gray-500">
                Aucune permission spécifique pour ce rôle
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bouton de demande */}
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <Button variant="outline" size="sm" className="w-full" onClick={onRequestAccess} disabled={!onRequestAccess}>
          <AlertCircle className="w-4 h-4 mr-2" />
          Demander une modification d'accès
        </Button>
        <p className="text-xs text-gray-400 mt-2 text-center">
          Toute demande sera envoyée à l'administrateur pour validation
        </p>
      </div>
    </Card>
  );
};

export default RoleAndPermissionsCard;