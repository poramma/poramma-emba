// ============================================================
// src/config/navigation.ts
// ============================================================

/**
 * CONFIGURATION NAVIGATION
 * Items de sidebar dynamiques selon le rôle de l'utilisateur
 * Chaque item a une permission requise
 */

import { PermissionCode, RoleName } from '../types';

export interface NavItem {
  id: string;
  label: string;
  icon: string;
  path: string;
  permission?: PermissionCode; // Si undefined = visible pour tous
  requiredRole?: RoleName; // Si undefined = visible pour tous
  minRoleLevel?: number; // Niveau hiérarchique minimum
  badge?: string; // Badge dynamique (ex: nombre de demandes en attente)
  children?: NavItem[]; // Sous-menus
}

/**
 * NAVIGATION PAR RÔLE
 * L'Ambassadeur et l'Admin voient tout
 * Les autres rôles voient selon leurs permissions
 */
export const NAVIGATION_ITEMS: NavItem[] = [
  // ============================================================
  // DASHBOARD (tous les agents)
  // ============================================================
  {
    id: 'dashboard',
    label: 'Tableau de bord',
    icon: 'LayoutDashboard',
    path: '/dashboard',
  },

  // ============================================================
  // RENDEZ-VOUS (tous, mais sous-menus selon permissions)
  // ============================================================
  {
    id: 'rendez-vous',
    label: 'Rendez-vous',
    icon: 'Calendar',
    path: '/rendez-vous',
    children: [
      {
        id: 'calendrier',
        label: 'Calendrier',
        icon: 'CalendarDays',
        path: '/rendez-vous',
      },
      {
        id: 'urgence',
        label: 'Urgences',
        icon: 'AlertTriangle',
        path: '/rendez-vous/urgence',
        permission: PermissionCode.RDV_CREATE_URGENCE,
        badge: 'urgences-count', // Dynamique: nombre d'urgences en attente
      },
      {
        id: 'disponibilites',
        label: 'Disponibilités',
        icon: 'Clock',
        path: '/rendez-vous/disponibilites',
        permission: PermissionCode.SERVICE_ADMIN,
      },
    ],
  },

  // ============================================================
  // DEMANDES (tous les agents)
  // ============================================================
  {
    id: 'demandes',
    label: 'Demandes consulaires',
    icon: 'FileText',
    path: '/demandes',
    badge: 'demandes-pending', // Nombre de demandes en attente
    children: [
      {
        id: 'liste-demandes',
        label: 'Toutes les demandes',
        icon: 'List',
        path: '/demandes',
      },
      {
        id: 'traitement',
        label: 'En traitement',
        icon: 'Loader',
        path: '/demandes?status=IN_REVIEW',
      },
      {
        id: 'urgentes',
        label: 'Urgentes',
        icon: 'AlertCircle',
        path: '/demandes?priority=URGENT',
        badge: 'demandes-urgentes',
      },
    ],
  },

  // ============================================================
  // ÉTUDIANTS (tous les agents)
  // ============================================================
  {
    id: 'etudiants',
    label: 'Étudiants',
    icon: 'Users',
    path: '/etudiants',
    children: [
      {
        id: 'liste-etudiants',
        label: 'Liste des étudiants',
        icon: 'List',
        path: '/etudiants',
      },
      {
        id: 'validation',
        label: 'Validation documents',
        icon: 'CheckCircle',
        path: '/etudiants/validation',
        permission: PermissionCode.DOCUMENT_VALIDATE,
        badge: 'docs-a-valider',
      },
    ],
  },

  // ============================================================
  // DOCUMENTS (tous les agents)
  // ============================================================
  {
    id: 'documents',
    label: 'Documents',
    icon: 'FolderOpen',
    path: '/documents',
  },

  // ============================================================
  // COMMUNICATION (Senior Agent+)
  // ============================================================
  {
    id: 'communication',
    label: 'Communication',
    icon: 'Mail',
    path: '/communication',
    permission: PermissionCode.COMM_READ,
    children: [
      {
        id: 'campagnes',
        label: 'Campagnes',
        icon: 'Send',
        path: '/communication',
      },
      {
        id: 'nouvelle-campagne',
        label: 'Nouvelle campagne',
        icon: 'Plus',
        path: '/communication/nouvelle',
        permission: PermissionCode.COMM_SEND,
      },
    ],
  },

  // ============================================================
  // SERVICES (Admin+ uniquement)
  // ============================================================
  {
    id: 'services',
    label: 'Services & Horaires',
    icon: 'Settings',
    path: '/services',
    permission: PermissionCode.SERVICE_ADMIN,
    minRoleLevel: 2,
    children: [
      {
        id: 'gestion-services',
        label: 'Gestion des services',
        icon: 'List',
        path: '/services',
      },
      {
        id: 'horaires',
        label: 'Horaires et exceptions',
        icon: 'Clock',
        path: '/services/horaires',
      },
    ],
  },

  // ============================================================
  // UTILISATEURS (Admin+ uniquement)
  // ============================================================
  {
    id: 'utilisateurs',
    label: 'Utilisateurs',
    icon: 'UserCog',
    path: '/utilisateurs',
    permission: PermissionCode.USER_ADMIN,
    minRoleLevel: 2,
    children: [
      {
        id: 'agents',
        label: 'Agents',
        icon: 'Users',
        path: '/utilisateurs',
      },
      {
        id: 'roles',
        label: 'Rôles & Permissions',
        icon: 'Shield',
        path: '/utilisateurs/roles',
        requiredRole: RoleName.AMBASSADOR, // Seul l'ambassadeur gère les rôles
      },
    ],
  },

  // ============================================================
  // AUDIT (Admin, Ambassadeur, Auditeur)
  // ============================================================
  {
    id: 'audit',
    label: 'Journal d\'audit',
    icon: 'Activity',
    path: '/audit',
    permission: PermissionCode.AUDIT_READ,
  },

  // ============================================================
  // STATISTIQUES (Senior Agent+)
  // ============================================================
  {
    id: 'stats',
    label: 'Statistiques',
    icon: 'BarChart3',
    path: '/stats',
    permission: PermissionCode.STATS_READ,
  },
];

/**
 * Filtre la navigation selon le rôle et les permissions
 */
export function filterNavigationByRole(
  items: NavItem[],
  hasPermission: (p: PermissionCode) => boolean,
  roleLevel: number,
  roleName: RoleName
): NavItem[] {
  return items
    .filter((item) => {
      // Vérifier permission
      if (item.permission && !hasPermission(item.permission)) return false;
      
      // Vérifier niveau hiérarchique
      if (item.minRoleLevel && roleLevel > item.minRoleLevel) return false;
      
      // Vérifier rôle spécifique
      if (item.requiredRole && roleName !== item.requiredRole) return false;
      
      return true;
    })
    .map((item) => ({
      ...item,
      children: item.children
        ? filterNavigationByRole(item.children, hasPermission, roleLevel, roleName)
        : undefined,
    }))
    .filter((item) => {
      // Supprimer les items sans children si c'était un parent
      if (item.children && item.children.length === 0) return false;
      return true;
    });
}