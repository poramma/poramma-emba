// src/pages/utilisateurs/RolesPermissionsPage.tsx

import React, { useState } from 'react';
import { 
  Shield, Plus, Edit, Trash2
} from 'lucide-react';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { TextArea } from '../../components/ui/textarea';
import { Badge } from '../../components/ui/badge';
import { Modal } from '../../components/ui/modal';
import { PermissionGuard } from '../../components/auth/PermissionGuard';
import { PermissionMatrix } from '../../components/utilisateurs/PermissionMatrix';
import { useRoles } from '../../hooks/useRoles';
import { usePermission } from '../../hooks/usePermission';
import { Role, PermissionCode } from '../../types/auth';
import { ROLES_CONFIG } from '../../config/roles';

export const RolesPermissionsPage: React.FC = () => {
  const { 
    roles, 
    permissions, 
    isLoading,
    createRole,
    updateRole,
    deleteRole,
    assignPermissionToRole,
    removePermissionFromRole,
    refreshRoles,
  } = useRoles();

  const { can, canAccess } = usePermission();
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    level: 4,
    isSystem: false,
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const handleSelectRole = (role: Role) => {
    console.log("Selected role : "+role);
    setSelectedRole(role);
  };

  const handleCreate = () => {
    setEditingRole(null);
    setFormData({
      name: '',
      description: '',
      level: 4,
      isSystem: false,
    });
    setFormErrors({});
    setShowForm(true);
  };

  const handleEdit = (role: Role) => {
    setEditingRole(role);
    setFormData({
      name: role.name,
      description: role.description,
      level: role.level,
      isSystem: role.isSystem,
    });
    setFormErrors({});
    setShowForm(true);
  };

  const handleDelete = async (role: Role) => {
    if (!window.confirm(`Supprimer définitivement le rôle "${role.name}" ?`)) return;
    if (role.isSystem) {
      alert('Les rôles système ne peuvent pas être supprimés.');
      return;
    }
    try {
      await deleteRole(role.id);
      //await refreshRoles();
      if (selectedRole?.id === role.id) setSelectedRole(null);
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.name.trim()) errors.name = 'Le nom du rôle est requis';
    if (formData.level < 1 || formData.level > 6) errors.level = 'Le niveau doit être entre 1 et 6';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      if (editingRole) {
        await updateRole(editingRole.id, formData);
      } else {
        await createRole(formData);
      }
      //await refreshRoles();
      setShowForm(false);
      setEditingRole(null);
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTogglePermission = async (roleId: string, permissionCode: PermissionCode) => {
    const role = roles.find((r: any) => r.id === roleId);
    if (!role) return;
    
    const hasPerm = role.permissions.some((p: any) => p.code === permissionCode);
    try {
      if (hasPerm) {
        await removePermissionFromRole(roleId, permissionCode);
      } else {
        await assignPermissionToRole(roleId, permissionCode);
      }
      //await refreshRoles();
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const canManageRoles = canAccess(2);

  return (
    <PermissionGuard minRoleLevel={3} title="Gestion des rôles et permissions">
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* En-tête */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Rôles et Permissions
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Gérez les rôles hiérarchiques et leurs permissions
              </p>
            </div>
            {canManageRoles && (
              <Button variant="primary" onClick={handleCreate}>
                <Plus className="w-4 h-4 mr-2" />
                Nouveau rôle
              </Button>
            )}
          </div>

          {/* Hiérarchie des rôles */}
          <Card className="p-4">
            <h3 className="font-medium text-gray-700 dark:text-gray-300 mb-3">
              <Shield className="w-4 h-4 inline mr-2" />
              Hiérarchie des rôles
            </h3>
            <div className="flex flex-wrap items-center gap-2">
              {Object.entries(ROLES_CONFIG)
                .sort(([, a], [, b]) => a.level - b.level)
                .map(([name, config]) => (
                  <Badge key={name} color={config.level <= 2 ? 'error' : config.level <= 3 ? 'warning' : 'info'} variant="solid">
                    {name} (Niv. {config.level})
                  </Badge>
                ))}
            </div>
            <p className="text-xs text-gray-400 mt-2">
              Niveau 1 = Plus haut (Ambassadeur) • Niveau 6 = Plus bas (Auditeur)
            </p>
          </Card>

          {/* Grille principale */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Liste des rôles */}
            <div className="lg:col-span-1">
              <Card className="p-4">
                <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Rôles disponibles
                </h4>
                {isLoading ? (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-brand-500 mx-auto"></div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {roles.map((role: Role) => (
                      <div
                        key={role.id}
                        className={`p-3 rounded-lg cursor-pointer transition-all hover:shadow-md ${
                          selectedRole?.id === role.id ? 'bg-brand-50 dark:bg-brand-900/20 ring-2 ring-brand-500' : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                        }`}
                        onClick={() => handleSelectRole(role)}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-900 dark:text-white">{role.name}</span>
                              {role.isSystem && (
                                <Badge color="light" variant="light" size="xs">
                                  Système                                
                                </Badge>
                              )}
                            </div>
                            <p 
                              className="text-sm text-gray-500 truncate max-w-[200px]" 
                              title={role.description}
                            >
                              {role.description}
                            </p>
                          </div>
                          {canManageRoles && !role.isSystem && (
                            <div className="flex gap-1">
                              <Button size="xs" variant="ghost" onClick={(e) => { e?.stopPropagation(); handleEdit(role); }}>
                                <Edit className="w-3 h-3" />
                              </Button>
                              <Button size="xs" variant="ghost" onClick={(e) => { e?.stopPropagation(); handleDelete(role); }}>
                                <Trash2 className="w-3 h-3 text-red-500" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>

            {/* Matrice des permissions */}
            <div className="lg:col-span-2">
              <PermissionMatrix
                selectedRoleId={selectedRole?.id}
                onTogglePermission={handleTogglePermission}
                readOnly={!canManageRoles}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Modal de formulaire */}
      <Modal
        isOpen={showForm}
        onClose={() => {
          setShowForm(false);
          setEditingRole(null);
        }}
        title={editingRole ? 'Modifier le rôle' : 'Nouveau rôle'}
        size="md"
      >
        <div className="space-y-4">
          {editingRole?.isSystem && (
            <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <p className="text-sm text-yellow-700 dark:text-yellow-300">
                ⚠️ Les rôles système ne peuvent pas être modifiés.
              </p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Nom *
            </label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value.toUpperCase() })}
              placeholder="NOM_DU_ROLE"
              disabled={editingRole?.isSystem}
              error={!!formErrors.name}
            />
            {formErrors.name && (
              <p className="text-sm text-red-600 mt-1">{formErrors.name}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description *
            </label>
            <TextArea
              value={formData.description}
              onChange={(value) => setFormData({ ...formData, description: value })}
              placeholder="Description du rôle..."
              rows={2}
              disabled={editingRole?.isSystem}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Niveau hiérarchique (1-6) *
            </label>
            <Input
              type="number"
              value={formData.level}
              onChange={(e) => setFormData({ ...formData, level: parseInt(e.target.value) || 4 })}
              minLength={1}
              maxLength={6}
              disabled={editingRole?.isSystem}
              error={!!formErrors.level}
            />
            {formErrors.level && (
              <p className="text-sm text-red-600 mt-1">{formErrors.level}</p>
            )}
            <p className="text-xs text-gray-400 mt-1">
              1 = Plus haut (Ambassadeur) • 6 = Plus bas (Auditeur)
            </p>
          </div>

          {!editingRole && (
            <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
              <input
                type="checkbox"
                checked={formData.isSystem}
                onChange={(e) => setFormData({ ...formData, isSystem: e.target.checked })}
                className="rounded text-brand-500"
              />
              Rôle système (ne peut pas être supprimé)
            </label>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="ghost" onClick={() => setShowForm(false)}>
              Annuler
            </Button>
            <Button 
              variant="primary" 
              onClick={handleSubmit} 
              disabled={isSubmitting || editingRole?.isSystem}
            >
              {isSubmitting ? 'Sauvegarde...' : editingRole ? 'Mettre à jour' : 'Créer'}
            </Button>
          </div>
        </div>
      </Modal>
    </PermissionGuard>
  );
};

export default RolesPermissionsPage;