// src/components/utilisateurs/RoleSelector.tsx

import React, { useState } from 'react';
import { Shield, CheckCircle, XCircle, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { useRoles } from '../../hooks/useRoles';
import { usePermission } from '../../hooks/usePermission';
import { Role, RoleName, PermissionCode } from '../../types/auth';
import { ROLES_CONFIG } from '../../config/roles';

interface RoleSelectorProps {
  selectedRoleId?: string;
  onSelect: (roleId: string) => void;
  onAssign?: (roleId: string) => void;
  onRemove?: (roleId: string) => void;
  readOnly?: boolean;
  compact?: boolean;
}

export const RoleSelector: React.FC<RoleSelectorProps> = ({
  selectedRoleId,
  onSelect,
  onAssign,
  onRemove,
  readOnly = false,
  compact = false,
}) => {
  const { roles, isLoading } = useRoles();
  const { can, canAccess } = usePermission();
  const [expandedRole, setExpandedRole] = useState<string | null>(null);

  const toggleExpand = (roleId: string) => {
    setExpandedRole(expandedRole === roleId ? null : roleId);
  };

  const getRoleLevelLabel = (level: number) => {
    const labels: Record<number, string> = {
      1: '🔴 Niveau 1 - Carte blanche',
      2: '🟠 Niveau 2 - Administration',
      3: '🟡 Niveau 3 - Supervision',
      4: '🟢 Niveau 4 - Standard',
      5: '🔵 Niveau 5 - Accueil',
      6: '⚪ Niveau 6 - Lecture seule',
    };
    return labels[level] || `Niveau ${level}`;
  };

  const getRoleColor = (level: number) => {
    if (level <= 2) return 'error';
    if (level <= 3) return 'warning';
    if (level <= 4) return 'info';
    return 'success';
  };

  if (compact) {
    return (
      <div className="space-y-2">
        {roles.map((role: any) => (
          <Card
            key={role.id}
            className={`p-3 cursor-pointer transition-all hover:shadow-md ${
              selectedRoleId === role.id ? 'ring-2 ring-brand-500' : ''
            }`}
            onClick={() => onSelect(role.id)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className={`w-4 h-4 text-${getRoleColor(role.level)}-500`} />
                <span className="font-medium text-gray-900 dark:text-white">{role.name}</span>
              </div>
              <Badge color={getRoleColor(role.level)} variant="light">
                Niv. {role.level}
              </Badge>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {isLoading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500 mx-auto"></div>
          <p className="text-gray-500 mt-2">Chargement des rôles...</p>
        </div>
      ) : roles.length === 0 ? (
        <div className="text-center py-8">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">Aucun rôle disponible</p>
        </div>
      ) : (
        roles.map((role: any) => {
          const config = ROLES_CONFIG[role.name as RoleName];
          const isSelected = selectedRoleId === role.id;
          const isExpanded = expandedRole === role.id;
          const canManage = canAccess(role.level);

          return (
            <Card
              key={role.id}
              className={`overflow-hidden transition-all ${
                isSelected ? 'ring-2 ring-brand-500' : ''
              } ${!canManage && !readOnly ? 'opacity-50' : ''}`}
            >
              {/* En-tête du rôle */}
              <div
                className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                onClick={() => {
                  if (!readOnly && canManage) {
                    onSelect(role.id);
                  }
                }}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg bg-${getRoleColor(role.level)}-100 dark:bg-${getRoleColor(role.level)}-900/30 flex items-center justify-center`}>
                    <Shield className={`w-5 h-5 text-${getRoleColor(role.level)}-600`} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-gray-900 dark:text-white">
                        {role.name}
                      </h4>
                      <Badge color={getRoleColor(role.level)} variant="light">
                        Niveau {role.level}
                      </Badge>
                      {role.isSystem && (
                        <Badge color="light" variant="light" size="xs">
                          Système
                        </Badge>
                      )}
                      {isSelected && (
                        <Badge color="success" variant="solid" size="xs">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Sélectionné
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">{role.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {!readOnly && canManage && onAssign && !isSelected && (
                    <Button
                      size="xs"
                      variant="primary"
                      onClick={(e) => {
                        e?.stopPropagation();
                        onAssign(role.id);
                        console.log('Assigning role:', role.id);
                      }}
                    >
                      Assigner
                    </Button>
                  )}
                  {!readOnly && canManage && onRemove && isSelected && (
                    <Button
                      size="xs"
                      variant="error"
                      onClick={(e) => {
                        e?.stopPropagation();
                        onRemove(role.id);
                        console.log('Removing role:', role.id);
                      }}
                    >
                      Retirer
                    </Button>
                  )}
                  <Button
                    size="xs"
                    variant="ghost"
                    onClick={(e) => {
                      e?.stopPropagation();
                      toggleExpand(role.id);
                    }}
                  >
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </Button>
                </div>
              </div>

              {/* Détails du rôle (expandé) */}
              {isExpanded && (
                <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-800/50">
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase">Permissions</p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {role.permissions.length === 0 ? (
                          <span className="text-sm text-gray-500">Aucune permission spécifique</span>
                        ) : (
                          role.permissions.map((perm: any) => (
                            <Badge key={perm.id} color="light" variant="light" size="xs">
                              {perm.code}
                            </Badge>
                          ))
                        )}
                      </div>
                    </div>
                    {config && (
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase">Ressources gérées</p>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {config.canManage.map((resource) => (
                            <Badge key={resource} color="primary" variant="light" size="xs">
                              {resource === '*' ? 'Toutes les ressources' : resource}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {config?.maxDailyAppointments !== undefined && config.maxDailyAppointments > 0 && (
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase">Capacité</p>
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                          {config.maxDailyAppointments} rendez-vous maximum par jour
                        </p>
                      </div>
                    )}
                    <div className="pt-2">
                      <p className="text-xs text-gray-400">
                        Niveau hiérarchique: {role.level} 
                        {role.level === 1 ? ' (Plus haut - Carte blanche)' : 
                         role.level === 6 ? ' (Plus bas - Lecture seule)' : ''}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </Card>
          );
        })
      )}
    </div>
  );
};

export default RoleSelector;