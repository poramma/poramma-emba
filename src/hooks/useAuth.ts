// ============================================================
// src/hooks/useAuth.ts
// ============================================================

import { useCallback, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore, AuthState } from '../store/authStore';
import { PermissionCode, RoleName } from '../types/auth';

// ============================================================
// INTERFACE DU HOOK
// ============================================================

interface UseAuthReturn {
  // État
  user: AuthState['user'];
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  mfaVerified: boolean;
  
  // Rôle courant
  currentRole: RoleName | null;
  roleLevel: number;
  isAmbassador: boolean;
  isAdmin: boolean;
  isSeniorAgent: boolean;
  isAgent: boolean;
  isReceptionist: boolean;
  isAuditor: boolean;
  
  // Permissions
  can: (permission: PermissionCode) => boolean;
  canAny: (permissions: PermissionCode[]) => boolean;
  canAll: (permissions: PermissionCode[]) => boolean;
  canAccessLevel: (minLevel: number) => boolean;
  
  // Actions
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  logout: () => Promise<void>;
  verifyMFA: (code: string) => Promise<boolean>;
  switchRole: (roleId: string) => void;
  clearError: () => void;
  
  // Redirections protégées
  requireAuth: () => void;
  requirePermission: (permission: PermissionCode, fallback?: string) => boolean;
  requireRole: (role: RoleName, fallback?: string) => boolean;
  requireMinLevel: (level: number, fallback?: string) => boolean;
}

// ============================================================
// IMPLEMENTATION
// ============================================================

export const useAuth = (): UseAuthReturn => {
  const navigate = useNavigate();
  
  // Sélecteurs Zustand (optimisés, ne causent pas de re-render inutile)
  const store = useAuthStore();
  
  const {
    user,
    isAuthenticated,
    isLoading,
    error,
    mfaVerified,
    login,
    logout,
    refreshSession,
    verifyMFA,
    switchRole,
    clearError,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    canAccess,
    getIsAmbassador,
    getIsAdmin,
    getIsSeniorAgent,
    getIsAgent,
    getIsReceptionist,
    getIsAuditor,
    getCurrentRoleLevel,
  } = store;

  // ============================================================
  // COMPUTED (mémoïsés pour éviter recalculs)
  // ============================================================
  
  const currentRole = useMemo(() => user?.activeRole?.name ?? null, [user?.activeRole?.name]);
  
  const roleLevel = useMemo(() => getCurrentRoleLevel(), [getCurrentRoleLevel]);
  
  const isAmbassador = useMemo(() => getIsAmbassador(), [getIsAmbassador]);
  const isAdmin = useMemo(() => getIsAdmin(), [getIsAdmin]);
  const isSeniorAgent = useMemo(() => getIsSeniorAgent(), [getIsSeniorAgent]);
  const isAgent = useMemo(() => getIsAgent(), [getIsAgent]);
  const isReceptionist = useMemo(() => getIsReceptionist(), [getIsReceptionist]);
  const isAuditor = useMemo(() => getIsAuditor(), [getIsAuditor]);

  // ============================================================
  // WRAPPERS ACTIONS (avec navigation intégrée)
  // ============================================================

  const handleLogin = useCallback(async (email: string, password: string, rememberMe?: boolean) => {
    await login(email, password, rememberMe);
    // La navigation est gérée par le composant appelant (LoginForm)
    // car on a besoin de vérifier si MFA est requis
  }, [login]);

  const handleLogout = useCallback(async () => {
    await logout();
    navigate('/auth/login');
  }, [logout, navigate]);

  const handleVerifyMFA = useCallback(async (code: string): Promise<boolean> => {
    const valid = await verifyMFA(code);
    if (valid) {
      navigate('/dashboard');
    }
    return valid;
  }, [verifyMFA, navigate]);

  const handleSwitchRole = useCallback((roleId: string) => {
    switchRole(roleId);
    // Recharger la page pour appliquer les nouvelles permissions
    window.location.reload();
  }, [switchRole]);

  // ============================================================
  // GARDES DE NAVIGATION
  // ============================================================

  const requireAuth = useCallback(() => {
    if (!isAuthenticated && !isLoading) {
      navigate('/auth/login', { 
        state: { from: window.location.pathname } 
      });
    }
  }, [isAuthenticated, isLoading, navigate]);

  const requirePermission = useCallback((permission: PermissionCode, fallback = '/dashboard'): boolean => {
    if (!hasPermission(permission)) {
      navigate(fallback);
      return false;
    }
    return true;
  }, [hasPermission, navigate]);

  const requireRole = useCallback((role: RoleName, fallback = '/dashboard'): boolean => {
    if (currentRole !== role) {
      navigate(fallback);
      return false;
    }
    return true;
  }, [currentRole, navigate]);

  const requireMinLevel = useCallback((level: number, fallback = '/dashboard'): boolean => {
    if (!canAccess(level)) {
      navigate(fallback);
      return false;
    }
    return true;
  }, [canAccess, navigate]);

  // ============================================================
  // AUTO-REFRESH SESSION (silent token refresh)
  // ============================================================

  useEffect(() => {
    if (!isAuthenticated) return;
    
    // Refresh toutes les 14 minutes (token expire à 15min)
    const interval = setInterval(() => {
      refreshSession().catch(() => {
        // Si refresh échoue → logout géré par le store
      });
    }, 14 * 60 * 1000);

    return () => clearInterval(interval);
  }, [isAuthenticated, refreshSession]);

  // ============================================================
  // RETOUR
  // ============================================================

  return {
    // État
    user,
    isAuthenticated,
    isLoading,
    error,
    mfaVerified,
    
    // Rôle
    currentRole,
    roleLevel,
    isAmbassador,
    isAdmin,
    isSeniorAgent,
    isAgent,
    isReceptionist,
    isAuditor,
    
    // Permissions (wrappers mémoïsés)
    can: useCallback((p: PermissionCode) => hasPermission(p), [hasPermission]),
    canAny: useCallback((p: PermissionCode[]) => hasAnyPermission(p), [hasAnyPermission]),
    canAll: useCallback((p: PermissionCode[]) => hasAllPermissions(p), [hasAllPermissions]),
    canAccessLevel: useCallback((l: number) => canAccess(l), [canAccess]),
    
    // Actions
    login: handleLogin,
    logout: handleLogout,
    verifyMFA: handleVerifyMFA,
    switchRole: handleSwitchRole,
    clearError,
    
    // Gardes
    requireAuth,
    requirePermission,
    requireRole,
    requireMinLevel,
  };
};