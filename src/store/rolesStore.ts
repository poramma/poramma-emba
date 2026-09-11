// src/store/rolesStore.ts

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { Role, Permission, PermissionCode, RoleName } from '../types/auth';
import { PERMISSIONS } from '../config/permissions';
import { ROLES_CONFIG } from '../config/roles';
import { api } from '../lib/api';

// ============================================================
// MOCK DATA
// ============================================================

const MOCK_ROLES: Role[] = Object.entries(ROLES_CONFIG).map(([name, config]) => ({
  id: `role-def-${name}`,
  name: name as RoleName,
  description: config.description,
  level: config.level,
  isSystem: true,
  permissions: [],
}));

const MOCK_PERMISSIONS: Permission[] = PERMISSIONS.map((p, index) => ({
  id: `perm-${index}`,
  code: p.code,
  name: p.code,
  description: p.description,
  resource: p.code.split(':')[0],
  action: p.code.split(':')[1] || 'read',
  category: p.category,
}));

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
        // ── BACKEND INTEGRATION ──
        // const { data } = await api.get('/roles');
        // set((state) => { state.roles = data.data; });
        
        // ── MOCK ──
        await new Promise((r) => setTimeout(r, 400));
        set((state) => { state.roles = MOCK_ROLES; });
        
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
        // ── BACKEND INTEGRATION ──
        // const { data } = await api.get('/permissions');
        // set((state) => { state.permissions = data.data; });
        
        // ── MOCK ──
        await new Promise((r) => setTimeout(r, 300));
        set((state) => { state.permissions = MOCK_PERMISSIONS; });
        
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
        // ── BACKEND INTEGRATION ──
        // const { data } = await api.get(`/roles/${id}`);
        // set((state) => { state.selectedRole = data.data; });
        
        // ── MOCK ──
        await new Promise((r) => setTimeout(r, 300));
        const role = get().roles.find(r => r.id === id);
        if (role) {
          set((state) => { state.selectedRole = role; });
        }
        
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
        // ── BACKEND INTEGRATION ──
        // const { data: response } = await api.post('/roles', data);
        // const newRole = response.data;
        
        // ── MOCK ──
        await new Promise((r) => setTimeout(r, 500));
        
        const newRole: Role = {
          id: `role-${Date.now()}`,
          name: data.name as RoleName,
          description: data.description,
          level: data.level,
          isSystem: data.isSystem || false,
          permissions: [],
        };
        
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
        // ── BACKEND INTEGRATION ──
        // const { data: response } = await api.patch(`/roles/${id}`, data);
        // const updatedRole = response.data;
        
        // ── MOCK ──
        await new Promise((r) => setTimeout(r, 400));
        
        let updatedRole: Role | null = null;
        set((state) => {
          const index = state.roles.findIndex(r => r.id === id);
          if (index !== -1) {
            const role = state.roles[index];
            if (role.isSystem) {
              state.error = 'Les rôles système ne peuvent pas être modifiés';
              state.isLoading = false;
              return;
            }
            if (data.name) role.name = data.name as RoleName;
            if (data.description) role.description = data.description;
            if (data.level !== undefined) role.level = data.level;
            updatedRole = role;
            state.isLoading = false;
          }
        });
        
        if (!updatedRole) throw new Error('Rôle non trouvé');
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
        // ── BACKEND INTEGRATION ──
        // await api.delete(`/roles/${id}`);
        
        // ── MOCK ──
        await new Promise((r) => setTimeout(r, 400));
        
        set((state) => {
          const role = state.roles.find(r => r.id === id);
          if (role?.isSystem) {
            state.error = 'Les rôles système ne peuvent pas être supprimés';
            state.isLoading = false;
            return;
          }
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
        // ── BACKEND INTEGRATION ──
        // await api.post(`/roles/${roleId}/permissions`, { permissionCode });
        
        // ── MOCK ──
        await new Promise((r) => setTimeout(r, 300));
        
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
        // ── BACKEND INTEGRATION ──
        // await api.delete(`/roles/${roleId}/permissions/${permissionCode}`);
        
        // ── MOCK ──
        await new Promise((r) => setTimeout(r, 300));
        
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
        // ── BACKEND INTEGRATION ──
        // await api.post(`/users/${userId}/roles`, { roleId });
        
        // ── MOCK ──
        await new Promise((r) => setTimeout(r, 400));
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
        // ── BACKEND INTEGRATION ──
        // await api.delete(`/users/${userId}/roles/${roleId}`);
        
        // ── MOCK ──
        await new Promise((r) => setTimeout(r, 400));
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