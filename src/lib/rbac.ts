// ============================================================
// src/lib/rbac.ts
// ============================================================

/**
 * FONCTIONS RBAC UTILITAIRES
 * Fonctions pures pour la vérification des permissions
 * Utilisées par les hooks et les guards
 */

import { PermissionCode, RoleName } from '../types';
import { PERMISSIONS } from '../config/permissions';
import { ROLES_CONFIG } from '../config/roles';

// ============================================================
// VÉRIFICATIONS DE BASE
// ============================================================

/**
 * Vérifie si une permission existe dans la matrice
 */
export function isValidPermission(code: PermissionCode): boolean {
  return PERMISSIONS.some((p) => p.code === code);
}

/**
 * Récupère la définition d'une permission
 */
export function getPermissionDefinition(code: PermissionCode) {
  return PERMISSIONS.find((p) => p.code === code) ?? null;
}

/**
 * Vérifie si un rôle a le niveau minimum requis pour une permission
 */
export function roleCanAccessPermission(
  roleName: RoleName,
  permission: PermissionCode
): boolean {
  // Admin = carte blanche
  if (roleName === RoleName.ADMIN) return true;

  const permDef = getPermissionDefinition(permission);
  if (!permDef) return false;
  
  const roleConfig = ROLES_CONFIG[roleName];
  if (!roleConfig) return false;
  
  // Vérifier niveau hiérarchique
  return roleConfig.level <= permDef.minRoleLevel;
}

/**
 * Récupère toutes les permissions disponibles pour un rôle
 */
export function getPermissionsForRole(roleName: RoleName): PermissionCode[] {
  // Admin = toutes les permissions
  if (roleName === RoleName.ADMIN) {
    return PERMISSIONS.map((perm) => perm.code);
  }
  
  const roleConfig = ROLES_CONFIG[roleName];
  if (!roleConfig) return [];
  
  // Filtrer les permissions selon le niveau du rôle
  return PERMISSIONS
    .filter((perm) => roleConfig.level <= perm.minRoleLevel)
    .map((perm) => perm.code);
}

// ============================================================
// VÉRIFICATIONS HIÉRARCHIQUES
// ============================================================

/**
 * Vérifie si un rôle est supérieur ou égal à un autre
 * Ex: isRoleSuperior(RoleName.ADMIN, RoleName.AGENT) → true
 */
export function isRoleSuperior(
  roleA: RoleName,
  roleB: RoleName
): boolean {
  const configA = ROLES_CONFIG[roleA];
  const configB = ROLES_CONFIG[roleB];
  
  if (!configA || !configB) return false;
  
  // Plus petit niveau = plus haut dans la hiérarchie
  return configA.level <= configB.level;
}

/**
 * Vérifie si un rôle peut gérer (créer/modifier/supprimer) un autre rôle
 * Règle: on ne peut gérer que les rôles inférieurs
 * Exception: Admin a carte blanche (gestion technique complète)
 */
export function canManageRole(
  managerRole: RoleName,
  targetRole: RoleName
): boolean {
  if (managerRole === RoleName.ADMIN) return true;

  return isRoleSuperior(managerRole, targetRole);
}

/**
 * Vérifie si un agent peut voir les données d'un autre agent
 * Règle: on voit ses propres données + celles des subordonnés
 */
export function canViewAgentData(
  viewerRole: RoleName,
  viewerId: string,
  targetAgentId: string,
  targetAgentRole?: RoleName
): boolean {
  // On voit toujours ses propres données
  if (viewerId === targetAgentId) return true;
  
  // Ambassadeur et Admin voient tout
  if ([RoleName.AMBASSADOR, RoleName.ADMIN].includes(viewerRole)) return true;
  
  // Senior Agent voit les agents standards et receptionists
  if (viewerRole === RoleName.SENIOR_AGENT) {
    if (!targetAgentRole) return false;
    return [RoleName.AGENT, RoleName.RECEPTIONIST].includes(targetAgentRole);
  }
  
  // Les autres ne voient que leurs propres données
  return false;
}

// ============================================================
// VÉRIFICATIONS MÉTIER SPÉCIFIQUES
// ============================================================

/**
 * Vérifie si l'utilisateur peut créer un rdv d'urgence
 * Nécessaire pour le besoin: "rdv d'urgence à l'accueil"
 */
export function canCreateUrgence(
  permissions: PermissionCode[],
  roleName: RoleName
): boolean {
  return (
    roleName === RoleName.ADMIN ||
    permissions.includes(PermissionCode.RDV_CREATE_URGENCE)
  );
}

/**
 * Vérifie si l'utilisateur peut imprimer le planning journalier
 * Nécessaire pour le besoin: "imprimer rdv du jour pour le gardien"
 */
export function canPrintDailySchedule(
  permissions: PermissionCode[],
  roleName: RoleName
): boolean {
  return (
    roleName === RoleName.ADMIN ||
    permissions.includes(PermissionCode.RDV_PRINT_DAILY)
  );
}

/**
 * Vérifie si l'utilisateur peut administrer les services (horaires, affectations)
 * Nécessaire pour le besoin: "admin peut insérer des services avec horaires"
 */
export function canAdminServices(
  permissions: PermissionCode[],
  roleName: RoleName
): boolean {
  return (
    roleName === RoleName.ADMIN ||
    permissions.includes(PermissionCode.SERVICE_ADMIN)
  );
}

/**
 * Vérifie si l'utilisateur peut administrer les utilisateurs (rôles, permissions)
 * Nécessaire pour le besoin: "seul l'admin a la carte blanche"
 */
export function canAdminUsers(
  permissions: PermissionCode[],
  roleName: RoleName
): boolean {
  return (
    roleName === RoleName.ADMIN ||
    permissions.includes(PermissionCode.USER_ADMIN)
  );
}

// ============================================================
// BUILDERS DE REQUÊTES
// ============================================================

/**
 * Construit les headers pour une requête API avec contexte RBAC
 * Utile pour le backend qui vérifie les permissions côté serveur
 */
export function buildRbacHeaders(
  userId: string,
  roleName: RoleName,
  permissions: PermissionCode[]
): Record<string, string> {
  return {
    'X-User-Id': userId,
    'X-User-Role': roleName,
    'X-User-Permissions': permissions.join(','),
  };
}

/**
 * Parse les permissions depuis un header (côté backend)
 */
export function parsePermissionsHeader(header: string): PermissionCode[] {
  return header.split(',') as PermissionCode[];
}

// ============================================================
// MOCK HELPERS (Développement)
// ============================================================

/**
 * Génère un mock de permissions pour le développement
 */
export function generateMockPermissions(roleName: RoleName): PermissionCode[] {
  return getPermissionsForRole(roleName);
}

/**
 * Vérifie si on est en mode mock (pas de backend)
 */
export function isMockMode(): boolean {
  return import.meta.env.VITE_MOCK_MODE === 'true' || !import.meta.env.VITE_API_URL;
}