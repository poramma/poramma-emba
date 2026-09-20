// ============================================================
// src/store/authStore.ts
// ============================================================

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Utilisateur, RoleName, PermissionCode } from '../types/auth';
import { api } from '../lib/api';
import { authGetItem, authSetItem, authRemoveItem, setRememberMe, clearAuthStorage } from '../lib/authStorage';

// ============================================================
// INTERFACE DU STORE
// ============================================================

export interface AuthState {
  // État
  user: Utilisateur | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  mfaVerified: boolean;

  // Actions
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
  switchRole: (roleId: string) => Promise<void>;
  verifyMFA: (code: string) => Promise<boolean>;
  clearError: () => void;
  hasPermission: (permission: PermissionCode) => boolean;
  hasAnyPermission: (permissions: PermissionCode[]) => boolean;
  hasAllPermissions: (permissions: PermissionCode[]) => boolean;
  canAccess: (minRoleLevel: number) => boolean;

  // Computed getters
  getIsAmbassador: () => boolean;
  getIsAdmin: () => boolean;
  getIsSeniorAgent: () => boolean;
  getIsAgent: () => boolean;
  getIsReceptionist: () => boolean;
  getIsAuditor: () => boolean;
  getCurrentRoleLevel: () => number;
}

// ============================================================
// IMPLEMENTATION
// ============================================================

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // État initial
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      mfaVerified: false,

      // Computed getters
      getIsAmbassador: () => {
        const user = get().user;
        return user?.activeRole?.name === RoleName.AMBASSADOR;
      },
      getIsAdmin: () => {
        const user = get().user;
        return user?.activeRole?.name === RoleName.ADMIN;
      },
      getIsSeniorAgent: () => {
        const user = get().user;
        return user?.activeRole?.name === RoleName.SENIOR_AGENT;
      },
      getIsAgent: () => {
        const user = get().user;
        return user?.activeRole?.name === RoleName.AGENT;
      },
      getIsReceptionist: () => {
        const user = get().user;
        return user?.activeRole?.name === RoleName.RECEPTIONIST;
      },
      getIsAuditor: () => {
        const user = get().user;
        return user?.activeRole?.name === RoleName.AUDITOR;
      },
      getCurrentRoleLevel: () => {
        return get().user?.activeRole?.level ?? 999;
      },

      /**
       * LOGIN
       * Backend: POST /auth/login — body { email, password }
       * Response: { accessToken, refreshToken, user: Utilisateur }
       */
      login: async (email: string, password: string, rememberMe = false) => {
        set({ isLoading: true, error: null });

        try {
          // Décide où vit toute la session AVANT d'écrire quoi que ce soit
          // (tokens ci-dessous, et l'état persisté de ce store lui-même,
          // voir le storage custom du persist() en bas de fichier).
          setRememberMe(rememberMe);

          const { data } = await api.post('/auth/login', { email, password, rememberMe });
          const { accessToken, refreshToken, user } = data.data;

          authSetItem('poramma_access_token', accessToken);
          authSetItem('poramma_refresh_token', refreshToken);

          set({
            user,
            isAuthenticated: true,
            isLoading: false,
            error: null,
            mfaVerified: false,
          });

        } catch (err) {
          set({
            isLoading: false,
            error: err instanceof Error ? err.message : 'Erreur de connexion',
          });
          throw err;
        }
      },

      /**
       * LOGOUT
       * Backend: POST /auth/logout
       */
      logout: async () => {
        set({ isLoading: true });

        try {
          await api.post('/auth/logout');
        } catch {
          // Logging out client-side regardless of server outcome is fine —
          // the token becomes useless either way once cleared below.
        } finally {
          authRemoveItem('poramma_access_token');
          authRemoveItem('poramma_refresh_token');
          clearAuthStorage();
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          });
        }
      },

      /**
       * REFRESH SESSION
       * Backend: POST /auth/refresh — body { refreshToken }
       * Note: the axios interceptor (src/lib/api.ts) already handles 401
       * retries transparently. This action is for an explicit manual
       * refresh (e.g. app bootstrap) and re-fetches /auth/me afterward
       * since /auth/refresh itself doesn't return the user.
       */
      refreshSession: async () => {
        try {
          const refreshToken = authGetItem('poramma_refresh_token');
          if (!refreshToken) throw new Error('Pas de session à rafraîchir');

          const { data } = await api.post('/auth/refresh', { refreshToken });
          authSetItem('poramma_access_token', data.data.accessToken);
          authSetItem('poramma_refresh_token', data.data.refreshToken);

          const me = await api.get('/auth/me');
          set({ user: me.data.data, isAuthenticated: true });

        } catch (err) {
          get().logout();
          throw err;
        }
      },

      /**
       * VERIFY MFA
       * Not implemented server-side yet (see mission prompt: MFA is
       * explicitly deferred). Kept as a client-side no-op that always
       * succeeds for a well-formed 6-digit code, gated off in practice by
       * VITE_ENABLE_MFA=false.
       */
      verifyMFA: async (code: string): Promise<boolean> => {
        set({ isLoading: true, error: null });

        const isValid = code.length === 6 && /^\d+$/.test(code);
        if (!isValid) {
          set({ isLoading: false, error: 'Code invalide. Veuillez réessayer.' });
          return false;
        }

        set({ isLoading: false, mfaVerified: true, error: null });
        return true;
      },

      /**
       * CLEAR ERROR
       * Réinitialise le message d'erreur
       */
      clearError: () => {
        set({ error: null });
      },

      /**
       * SWITCH ROLE
       * Backend: POST /auth/switch-role — body { roleId }
       * Response: { accessToken, user: Utilisateur } — no new refresh
       * token (see identity-api's switchRole: the plaintext refresh token
       * isn't retained server-side to re-sign one). A subsequent
       * /auth/refresh reverts to the user's most senior role.
       */
      switchRole: async (roleId: string) => {
        const { data } = await api.post('/auth/switch-role', { roleId });
        authSetItem('poramma_access_token', data.data.accessToken);
        set({ user: data.data.user });
      },

      /**
       * VÉRIFICATION PERMISSION (RBAC)
       * Client-side convenience only — the server is the real authority
       * and re-checks every request regardless of what this returns.
       * ADMIN (level 1) is the blanket-access role; AMBASSADOR (level 2)
       * is checked against its real permission list like everyone else
       * (see project memory rbac_hierarchy_decision).
       */
      hasPermission: (permission: PermissionCode): boolean => {
        const user = get().user;
        if (!user) return false;

        if (user.activeRole?.name === RoleName.ADMIN) return true;

        return user.permissions.includes(permission);
      },

      hasAnyPermission: (permissions: PermissionCode[]): boolean => {
        return permissions.some((p) => get().hasPermission(p));
      },

      hasAllPermissions: (permissions: PermissionCode[]): boolean => {
        return permissions.every((p) => get().hasPermission(p));
      },

      /**
       * VÉRIFICATION HIÉRARCHIQUE
       * Vérifie si le rôle courant est >= au niveau requis
       * Ex: canAccess(2) → Admin (2) et supérieurs OK, Agent (4) KO
       */
      canAccess: (minRoleLevel: number): boolean => {
        const level = get().getCurrentRoleLevel();
        return level <= minRoleLevel; // Plus petit = plus haut dans la hiérarchie
      },
    }),
    {
      name: 'poramma-auth-storage',
      // Même bascule localStorage/sessionStorage que les tokens (voir
      // lib/authStorage.ts) — sinon l'UI pourrait se croire connectée
      // (user + isAuthenticated persistés en localStorage) alors que les
      // tokens, eux en sessionStorage, ont disparu à la fermeture du
      // navigateur.
      storage: createJSONStorage(() => ({
        getItem: authGetItem,
        setItem: authSetItem,
        removeItem: authRemoveItem,
      })),
      partialize: (state: AuthState) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        mfaVerified: state.mfaVerified,
      }),
    }
  )
);
