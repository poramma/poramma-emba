// ============================================================
// src/hooks/usePermission.ts
// ============================================================

import { useCallback } from 'react';
import { useAuthStore } from '../store/authStore';
import { PermissionCode, RoleName } from '../types/auth';

/**
 * HOOK: usePermission
 * Encapsule toute la logique RBAC du frontend
 * Synchronisé avec le store Zustand
 */
export function usePermission() {
  const {
    user,
    getIsAmbassador,
    getIsAdmin,
    getIsSeniorAgent,
    getIsAgent,
    getIsReceptionist,
    getIsAuditor,
    getCurrentRoleLevel,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    canAccess,
  } = useAuthStore();

  const isAmbassador = getIsAmbassador();
  const isAdmin = getIsAdmin();
  const isSeniorAgent = getIsSeniorAgent();
  const isAgent = getIsAgent();
  const isReceptionist = getIsReceptionist();
  const isAuditor = getIsAuditor();
  const currentRoleLevel = getCurrentRoleLevel();

  /**
   * Vérifie si l'utilisateur peut effectuer une action sur une ressource
   * Usage: const { can } = usePermission(); can(PermissionCode.DEMANDE_VALIDATE)
   */
  const can = useCallback(
    (permission: PermissionCode): boolean => hasPermission(permission),
    [hasPermission]
  );

  /**
   * Vérifie si l'utilisateur a au moins un des rôles demandés
   * Usage: hasRole(RoleName.ADMIN, RoleName.AMBASSADOR)
   */
  const hasRole = useCallback(
    (...roles: RoleName[]): boolean => {
      if (!user?.activeRole) return false;
      return roles.includes(user.activeRole.name);
    },
    [user]
  );

  /**
   * Vérifie si l'utilisateur peut gérer un service (créer/modifier horaires)
   * Nécessaire pour le nouveau besoin: "admin peut insérer des services avec horaires"
   */
  const canManageServices = useCallback((): boolean => {
    return hasPermission(PermissionCode.SERVICE_ADMIN);
  }, [hasPermission]);

  /**
   * Vérifie si l'utilisateur peut créer un rdv d'urgence
   * Nécessaire pour le nouveau besoin: "rdv d'urgence à l'accueil"
   */
  const canCreateUrgence = useCallback((): boolean => {
    return hasPermission(PermissionCode.RDV_CREATE_URGENCE);
  }, [hasPermission]);

  /**
   * Vérifie si l'utilisateur peut imprimer le planning journalier
   * Nécessaire pour le nouveau besoin: "imprimer rdv du jour pour le gardien"
   */
  const canPrintDailySchedule = useCallback((): boolean => {
    return hasPermission(PermissionCode.RDV_PRINT_DAILY);
  }, [hasPermission]);

  /**
   * Vérifie si l'utilisateur peut assigner des agents aux services
   * Nécessaire pour le nouveau besoin: "affecter des agents aux services"
   */
  const canAssignAgents = useCallback((): boolean => {
    return (
      hasPermission(PermissionCode.USER_ADMIN) ||
      hasPermission(PermissionCode.SERVICE_ADMIN)
    );
  }, [hasPermission]);

  /**
   * Vérifie si l'utilisateur peut voir les données d'un autre agent
   * Règle: On peut voir ses propres données + celles des subordonnés
   */
  const canViewAgentData = useCallback(
    (targetAgentId: string): boolean => {
      if (isAmbassador || isAdmin) return true;
      if (user?.id === targetAgentId) return true;
      // Senior agent peut voir les agents standards
      if (isSeniorAgent) return true; // Simplifié, vérifier hiérarchie réelle
      return false;
    },
    [isAmbassador, isAdmin, isSeniorAgent, user]
  );

  return {
    // État brut
    user,
    currentRole: user?.activeRole ?? null,
    currentRoleLevel,
    
    // Flags rôle
    isAmbassador,
    isAdmin,
    isSeniorAgent,
    isAgent,
    isReceptionist,
    isAuditor,
    
    // Vérifications de base
    can,
    hasRole,
    hasAnyPermission,
    hasAllPermissions,
    canAccess,
    
    // Vérifications métier spécifiques (nouveaux besoins ambassade)
    canManageServices,
    canCreateUrgence,
    canPrintDailySchedule,
    canAssignAgents,
    canViewAgentData,
  };
}