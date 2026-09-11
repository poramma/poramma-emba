// src/components/utilisateurs/PermissionMatrix.tsx

import React, { useState, useEffect } from 'react';
import { 
  Shield, CheckCircle, XCircle, Search, Filter,
  ChevronDown, ChevronUp, AlertCircle
} from 'lucide-react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select } from '../ui/select';
import { Badge } from '../ui/badge';
import { usePermission } from '../../hooks/usePermission';
import { Permission, PermissionCode } from '../../types/auth';
import { PERMISSIONS } from '../../config/permissions';
import { useRoles } from '../../hooks/useRoles';

interface PermissionMatrixProps {
  selectedRoleId?: string;
  onTogglePermission?: (roleId: string, permissionCode: PermissionCode) => void;
  readOnly?: boolean;
}

export const PermissionMatrix: React.FC<PermissionMatrixProps> = ({
  selectedRoleId,
  onTogglePermission,
  readOnly = false,
}) => {
  const { roles, permissions, isLoading, fetchPermissions } = useRoles();
  const { can } = usePermission();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  const selectedRole = roles.find((r: any) => r.id === selectedRoleId);

  // ✅ Charger les permissions si elles ne sont pas déjà chargées
  useEffect(() => {
    if (permissions.length === 0 && !isLoading) {
      fetchPermissions();
    }
  }, [permissions.length, isLoading, fetchPermissions]);

  // ✅ Si permissions est vide, utiliser PERMISSIONS comme fallback
  const effectivePermissions = permissions.length > 0 ? permissions : PERMISSIONS.map((p, index) => ({
    id: `perm-${index}`,
    code: p.code,
    name: p.code,
    description: p.description,
    resource: p.code.split(':')[0],
    action: p.code.split(':')[1] || 'read',
    category: p.category || 'Autres', // ✅ Ajout de la catégorie
  }));

  console.log('Permissions effectives:', effectivePermissions.length);

  // ✅ Grouper les permissions par catégorie avec fallback
  const groupedPermissions = effectivePermissions.reduce((acc: Record<string, Permission[]>, perm: Permission) => {
    // ✅ Récupérer la catégorie depuis PERMISSIONS ou utiliser 'Autres'
    const permDef = PERMISSIONS.find(p => p.code === perm.code);
    const category = permDef?.category || perm.category || 'Autres';
    
    if (!acc[category]) acc[category] = [];
    acc[category].push({
      ...perm,
      category, // ✅ Ajouter la catégorie à la permission
    });
    return acc;
  }, {} as Record<string, Permission[]>);

  console.log('Grouped permissions categories:', Object.keys(groupedPermissions));

  const filteredPermissions = Object.entries(groupedPermissions).reduce((acc, [category, perms]) => {
    const filtered = perms.filter((perm) => {
      const matchesSearch = searchQuery === '' || 
        perm.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        perm.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        perm.name?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
    if (filtered.length > 0) {
      acc[category] = filtered;
    }
    return acc;
  }, {} as Record<string, Permission[]>);

  const hasPermission = (permissionCode: PermissionCode): boolean => {
    if (!selectedRole) return false;
    return selectedRole.permissions.some((p: any) => p.code === permissionCode);
  };

  const getPermissionLevel = (permissionCode: PermissionCode): number => {
    const def = PERMISSIONS.find(p => p.code === permissionCode);
    return def?.minRoleLevel || 6;
  };

  const togglePermission = (permissionCode: PermissionCode) => {
    if (readOnly || !selectedRoleId || !onTogglePermission) return;
    onTogglePermission(selectedRoleId, permissionCode);
  };

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500 mx-auto"></div>
        <p className="text-gray-500 mt-2">Chargement des permissions...</p>
      </div>
    );
  }

  if (!selectedRole) {
    return (
      <Card className="p-8 text-center">
        <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          Sélectionnez un rôle
        </h3>
        <p className="text-gray-500 dark:text-gray-400">
          Choisissez un rôle pour visualiser et gérer ses permissions.
        </p>
      </Card>
    );
  }

  const categories = Object.keys(groupedPermissions);

  return (
    <div className="space-y-4">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Gestion des permissions
          </h3>
          <p className="text-sm text-gray-500">
            Rôle: <span className="font-medium text-gray-700 dark:text-gray-300">{selectedRole.name}</span>
            {' '}(Niveau {selectedRole.level})
          </p>
        </div>
        <Badge color="primary" variant="solid">
          {selectedRole.permissions.length} permissions
        </Badge>
      </div>

      {/* Filtres */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Input
          placeholder="Rechercher une permission..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          startIcon={<Search className="w-4 h-4" />}
          className="flex-1"
        />
        <Select
          value={selectedCategory}
          onChange={(value) => setSelectedCategory(value)}
          options={[
            { value: 'all', label: 'Toutes les catégories' },
            ...categories.map(cat => ({ value: cat, label: cat })),
          ]}
          className="w-48"
        />
      </div>

      {/* Matrice des permissions */}
      {Object.keys(filteredPermissions).length === 0 ? (
        <Card className="p-8 text-center">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Aucune permission trouvée
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            {searchQuery 
              ? 'Aucune permission ne correspond à votre recherche.'
              : 'Aucune permission n\'est disponible pour ce rôle.'}
          </p>
        </Card>
      ) : (
        Object.entries(filteredPermissions).map(([category, perms]) => {
          const isExpanded = expandedCategory === category || expandedCategory === null;
          const hasAll = perms.every((p) => hasPermission(p.code));
          const hasSome = perms.some((p) => hasPermission(p.code));

          return (
            <Card key={category} className="overflow-hidden">
              {/* En-tête de catégorie */}
              <div
                className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                onClick={() => setExpandedCategory(expandedCategory === category ? null : category)}
              >
                <div className="flex items-center gap-3">
                  <Shield className="w-5 h-5 text-gray-400" />
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">{category}</h4>
                    <p className="text-sm text-gray-500">
                      {perms.length} permissions
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {hasAll && (
                    <Badge color="success" variant="light" size="xs">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Toutes
                    </Badge>
                  )}
                  {hasSome && !hasAll && (
                    <Badge color="warning" variant="light" size="xs">
                      <AlertCircle className="w-3 h-3 mr-1" />
                      Partielles
                    </Badge>
                  )}
                  <Button size="xs" variant="ghost">
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </Button>
                </div>
              </div>

              {/* Liste des permissions */}
              {isExpanded && (
                <div className="border-t border-gray-200 dark:border-gray-700">
                  {perms.map((perm) => {
                    const isActive = hasPermission(perm.code);
                    const minLevel = getPermissionLevel(perm.code);
                    const isInherited = selectedRole.level <= minLevel;

                    return (
                      <div
                        key={perm.code}
                        className={`flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-800 border-b border-gray-100 dark:border-gray-700 last:border-b-0 ${
                          isActive ? 'bg-green-50 dark:bg-green-900/10' : ''
                        }`}
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm text-gray-600 dark:text-gray-300">
                              {perm.code}
                            </span>
                            {isInherited && (
                              <Badge color="primary" variant="light" size="xs">
                                Hérité
                              </Badge>
                            )}
                            {isActive && (
                              <Badge color="success" variant="light" size="xs">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Actif
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-500">{perm.description}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-gray-400">
                            Niveau min: {minLevel}
                          </span>
                          <button
                            aria-label="Mettre à jour la permission"
                            onClick={() => togglePermission(perm.code)}
                            disabled={readOnly || isInherited}
                            className={`w-10 h-6 rounded-full transition-colors ${
                              isActive ? 'bg-brand-500' : 'bg-gray-300 dark:bg-gray-600'
                            } ${(readOnly || isInherited) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                          >
                            <div
                              className={`w-4 h-4 rounded-full bg-white transition-transform ${
                                isActive ? 'translate-x-5' : 'translate-x-1'
                              }`}
                            />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          );
        })
      )}

      {/* Légende */}
      <Card className="p-4 bg-gray-50 dark:bg-gray-800">
        <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-300">
          <span className="flex items-center gap-2">
            <div className="w-4 h-4 bg-brand-500 rounded-full"></div>
            Permission active
          </span>
          <span className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
            Permission inactive
          </span>
          <span className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-200 dark:bg-blue-900/30 rounded-full border border-blue-300"></div>
            Héritée (non modifiable)
          </span>
          <span className="flex items-center gap-2 text-gray-400">
            <AlertCircle className="w-4 h-4" />
            Les permissions héritées sont déterminées par le niveau hiérarchique
          </span>
        </div>
      </Card>
    </div>
  );
};

export default PermissionMatrix;