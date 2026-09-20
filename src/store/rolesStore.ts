// src/store/rolesStore.ts

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { Role, Permission, PermissionCode, RoleName } from '../types/auth';
import { api } from '../lib/api';

// ============================================================
// INTERFACE DU STORE
// ============================================================

interface RolesState {
  roles: Role[];
  permissions: Permission[];
  selectedRole: Role | null;
  isLoading: boolean;
  error: string | null;

  // Actions: Lecture
  fetchRoles: () => Promise<void>;
  fetchPermissions: () => Promise<void>;
  fetchRole: (id: string) => Promise<void>;
  selectRole: (role: Role | null) => void;

  // Actions: CRUD Rôles
  createRole: (data: CreateRolePayload) => Promise<Role>;
  updateRole: (id: string, data: UpdateRolePayload) => Promise<Role>;
  deleteRole: (id: string) => Promise<void>;

  // Actions: Permissions
  assignPermissionToRole: (roleId: string, permissionCode: PermissionCode) => Promise<void>;
  removePermissionFromRole: (roleId: string, permissionCode: PermissionCode) => Promise<void>;
  assignRoleToUser: (userId: string, roleId: string) => Promise<void>;
  removeRoleFromUser: (userId: string, roleId: string) => Promise<void>;

  // Computed
  getRoleById: (id: string) => Role | undefined;
  getRoleByName: (name: RoleName) => Role | undefined;
  getPermissionsByRole: (roleId: string) => Permission[];
  getInheritedPermissions: (roleId: string) => Permission[];
}

interface CreateRolePayload {
  name: string;
  description: string;
  level: number;
  isSystem?: boolean;
}

interface UpdateRolePayload extends Partial<CreateRolePayload> {
  isSystem?: boolean;
}

// ============================================================
// IMPLEMENTATION
// ============================================================

export const useRolesStore = create<RolesState>()(
  immer((set, get) => ({
    // État initial
    roles: [],
    permissions: [],
    selectedRole: null,
    isLoading: false,
    error: null,

    // ============================================================
    // ACTIONS: LECTURE
    // ============================================================

    fetchRoles: async () => {
      set((state) => { state.isLoading = true; state.error = null; });

      try {
        const { data } = await api.get('/roles');
        set((state) => { state.roles = data.data; });
      } catch (err) {
        set((state) => {
          state.error = err instanceof Error ? err.message : 'Erreur de chargement';
        });
      } finally {
        set((state) => { state.isLoading = false; });
      }
    },

    fetchPermissions: async () => {
      set((state) => { state.isLoading = true; state.error = null; });

      try {
        const { data } = await api.get('/permissions');
        set((state) => { state.permissions = data.data; });
      } catch (err) {
        set((state) => {
          state.error = err instanceof Error ? err.message : 'Erreur de chargement';
        });
      } finally {
        set((state) => { state.isLoading = false; });
      }
    },

    fetchRole: async (id: string) => {
      set((state) => { state.isLoading = true; state.error = null; });

      try {
        const { data } = await api.get(`/roles/${id}`);
        set((state) => { state.selectedRole = data.data; });
      } catch (err) {
        set((state) => {
          state.error = err instanceof Error ? err.message : 'Erreur de chargement';
        });
      } finally {
        set((state) => { state.isLoading = false; });
      }
    },

    selectRole: (role) => {
      set((state) => { state.selectedRole = role; });
    },

    // ============================================================
    // ACTIONS: CRUD RÔLES
    // ============================================================

    createRole: async (data: CreateRolePayload) => {
      set((state) => { state.isLoading = true; state.error = null; });

      try {
        const { data: response } = await api.post('/roles', data);
        const newRole: Role = response.data;

        set((state) => {
          state.roles.push(newRole);
          state.isLoading = false;
        });

        return newRole;

      } catch (err) {
        set((state) => {
          state.isLoading = false;
          state.error = err instanceof Error ? err.message : 'Erreur de création';
        });
        throw err;
      }
    },

    updateRole: async (id: string, data: UpdateRolePayload) => {
      set((state) => { state.isLoading = true; state.error = null; });

      try {
        const { data: response } = await api.patch(`/roles/${id}`, data);
        const updatedRole: Role = response.data;

        set((state) => {
          const index = state.roles.findIndex(r => r.id === id);
          if (index !== -1) state.roles[index] = updatedRole;
          state.isLoading = false;
        });

        return updatedRole;

      } catch (err) {
        set((state) => {
          state.isLoading = false;
          state.error = err instanceof Error ? err.message : 'Erreur de mise à jour';
        });
        throw err;
      }
    },

    deleteRole: async (id: string) => {
      set((state) => { state.isLoading = true; state.error = null; });

      try {
        await api.delete(`/roles/${id}`);

        set((state) => {
          state.roles = state.roles.filter(r => r.id !== id);
          if (state.selectedRole?.id === id) state.selectedRole = null;
          state.isLoading = false;
        });

      } catch (err) {
        set((state) => {
          state.isLoading = false;
          state.error = err instanceof Error ? err.message : 'Erreur de suppression';
        });
        throw err;
      }
    },

    // ============================================================
    // ACTIONS: PERMISSIONS
    // ============================================================

    assignPermissionToRole: async (roleId: string, permissionCode: PermissionCode) => {
      set((state) => { state.isLoading = true; state.error = null; });

      try {
        await api.post(`/roles/${roleId}/permissions`, { permissionCode });

        set((state) => {
          const role = state.roles.find(r => r.id === roleId);
          if (role) {
            const perm = state.permissions.find(p => p.code === permissionCode);
            if (perm && !role.permissions.some(p => p.code === permissionCode)) {
              role.permissions.push(perm);
            }
          }
          state.isLoading = false;
        });

      } catch (err) {
        set((state) => {
          state.isLoading = false;
          state.error = err instanceof Error ? err.message : 'Erreur d\'assignation';
        });
        throw err;
      }
    },

    removePermissionFromRole: async (roleId: string, permissionCode: PermissionCode) => {
      set((state) => { state.isLoading = true; state.error = null; });

      try {
        await api.delete(`/roles/${roleId}/permissions/${permissionCode}`);

        set((state) => {
          const role = state.roles.find(r => r.id === roleId);
          if (role) {
            role.permissions = role.permissions.filter(p => p.code !== permissionCode);
          }
          state.isLoading = false;
        });

      } catch (err) {
        set((state) => {
          state.isLoading = false;
          state.error = err instanceof Error ? err.message : 'Erreur de suppression';
        });
        throw err;
      }
    },

    assignRoleToUser: async (userId: string, roleId: string) => {
      set((state) => { state.isLoading = true; state.error = null; });

      try {
        await api.post(`/users/${userId}/roles`, { roleId });
        set((state) => { state.isLoading = false; });
      } catch (err) {
        set((state) => {
          state.isLoading = false;
          state.error = err instanceof Error ? err.message : 'Erreur d\'assignation';
        });
        throw err;
      }
    },

    removeRoleFromUser: async (userId: string, roleId: string) => {
      set((state) => { state.isLoading = true; state.error = null; });

      try {
        await api.delete(`/users/${userId}/roles/${roleId}`);
        set((state) => { state.isLoading = false; });
      } catch (err) {
        set((state) => {
          state.isLoading = false;
          state.error = err instanceof Error ? err.message : 'Erreur de suppression';
        });
        throw err;
      }
    },

    // ============================================================
    // COMPUTED HELPERS
    // ============================================================

    getRoleById: (id) => {
      return get().roles.find(r => r.id === id);
    },

    getRoleByName: (name) => {
      return get().roles.find(r => r.name === name);
    },

    getPermissionsByRole: (roleId) => {
      const role = get().roles.find(r => r.id === roleId);
      return role?.permissions || [];
    },

    getInheritedPermissions: (roleId) => {
      const role = get().roles.find(r => r.id === roleId);
      if (!role) return [];

      // Récupérer toutes les permissions des rôles de niveau inférieur
      const allPermissions: Permission[] = [];
      const lowerRoles = get().roles.filter(r => r.level > role.level);
      lowerRoles.forEach(r => {
        r.permissions.forEach(p => {
          if (!allPermissions.some(ap => ap.code === p.code)) {
            allPermissions.push(p);
          }
        });
      });

      return allPermissions;
    },
  }))
);
