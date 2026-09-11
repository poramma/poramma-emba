// src/hooks/useRoles.ts

import { useCallback, useMemo } from 'react';
import { useRolesStore } from '../store/rolesStore';
import { Role, Permission, PermissionCode, RoleName } from '../types/auth';

interface UseRolesReturn {
  // État
  roles: Role[];
  permissions: Permission[];
  selectedRole: Role | null;
  isLoading: boolean;
  error: string | null;
  
  // Computed
  getRoleById: (id: string) => Role | undefined;
  getRoleByName: (name: RoleName) => Role | undefined;
  getPermissionsByRole: (roleId: string) => Permission[];
  getInheritedPermissions: (roleId: string) => Permission[];
  
  // Actions
  fetchRoles: () => Promise<void>;
  fetchPermissions: () => Promise<void>;
  fetchRole: (id: string) => Promise<void>;
  selectRole: (role: Role | null) => void;
  createRole: (data: any) => Promise<Role>;
  updateRole: (id: string, data: any) => Promise<Role>;
  deleteRole: (id: string) => Promise<void>;
  
  // Permissions actions
  assignPermissionToRole: (roleId: string, permissionCode: PermissionCode) => Promise<void>;
  removePermissionFromRole: (roleId: string, permissionCode: PermissionCode) => Promise<void>;
  assignRoleToUser: (userId: string, roleId: string) => Promise<void>;
  removeRoleFromUser: (userId: string, roleId: string) => Promise<void>;
  
  // Helpers
  refreshRoles: () => Promise<void>;
  refreshPermissions: () => Promise<void>;
}

export const useRoles = (): UseRolesReturn => {
  const store = useRolesStore();

  const {
    roles,
    permissions,
    selectedRole,
    isLoading,
    error,
    fetchRoles,
    fetchPermissions,
    fetchRole,
    selectRole,
    createRole,
    updateRole,
    deleteRole,
    assignPermissionToRole,
    removePermissionFromRole,
    assignRoleToUser,
    removeRoleFromUser,
    getRoleById,
    getRoleByName,
    getPermissionsByRole,
    getInheritedPermissions,
  } = store;

  const refreshRoles = useCallback(async () => {
    await fetchRoles();
  }, [fetchRoles]);

  const refreshPermissions = useCallback(async () => {
    await fetchPermissions();
  }, [fetchPermissions]);

  return {
    // État
    roles,
    permissions,
    selectedRole,
    isLoading,
    error,
    
    // Computed
    getRoleById,
    getRoleByName,
    getPermissionsByRole,
    getInheritedPermissions,
    
    // Actions
    fetchRoles,
    fetchPermissions,
    fetchRole,
    selectRole,
    createRole,
    updateRole,
    deleteRole,
    
    // Permissions actions
    assignPermissionToRole,
    removePermissionFromRole,
    assignRoleToUser,
    removeRoleFromUser,
    
    // Helpers
    refreshRoles,
    refreshPermissions,
  };
};