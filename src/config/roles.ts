// ============================================================
// src/config/roles.ts
// ============================================================

/**
 * CONFIGURATION RBAC : Rôles hiérarchiques
 *
 * Hiérarchie: 1 = plus haut (Admin), 6 = plus bas (Auditeur)
 * Règle: un rôle de niveau N hérite des permissions des rôles de niveau N+1..6
 * Exception: l'Admin a carte blanche (toutes les permissions) — l'Ambassadeur
 * (niveau 2) supervise mais ne gère pas la technique (services/agents/rôles/
 * config), voir project memory "rbac_hierarchy_decision" côté backend.
 */

import { RoleName } from '../types';

export interface RoleConfig {
  name: RoleName;
  level: number;
  description: string;
  canManage: string[]; // Ressources gérables
  defaultPermissions: string[];
  maxDailyAppointments?: number; // Pour les agents
}

export const ROLES_CONFIG: Record<RoleName, RoleConfig> = {
  [RoleName.ADMIN]: {
    name: RoleName.ADMIN,
    level: 1,
    description: 'Administrateur système - Configuration et gestion, carte blanche',
    canManage: ['*'], // Tout
    defaultPermissions: ['*'], // Toutes les permissions
  },
  [RoleName.AMBASSADOR]: {
    name: RoleName.AMBASSADOR,
    level: 2,
    description: 'Chef de mission diplomatique - Supervision, sans gestion technique',
    canManage: ['audit', 'stats'],
    defaultPermissions: [
      'demande:read',
      'demande:create',
      'demande:update',
      'demande:delete',
      'demande:validate',
      'demande:reject',
      'demande:assign',
      'rdv:read',
      'rdv:create',
      'rdv:create-urgence',
      'rdv:update',
      'rdv:cancel',
      'rdv:print-daily',
      'availability:read',
      'availability:create',
      'availability:update',
      'availability:delete',
      'availability:config',
      'service:read',
      'user:read',
      'document:read',
      'document:validate',
      'document:upload',
      'comm:read',
      'comm:create',
      'comm:send',
      'audit:read',
      'audit:export',
      'payment:read',
      'payment:create',
      'payment:refund',
      'stats:read',
      'stats:export',
    ],
  },
  [RoleName.SENIOR_AGENT]: {
    name: RoleName.SENIOR_AGENT,
    level: 3,
    description: 'Agent consulaire senior - Validation et supervision',
    canManage: ['demandes', 'rdv', 'documents', 'etudiants'],
    defaultPermissions: [
      'demande:read',
      'demande:validate',
      'demande:reject',
      'demande:assign',
      'rdv:read',
      'rdv:create',
      'rdv:update',
      'rdv:cancel',
      'document:read',
      'document:validate',
      'comm:read',
      'comm:create',
      'stats:read',
    ],
    maxDailyAppointments: 12,
  },
  [RoleName.AGENT]: {
    name: RoleName.AGENT,
    level: 4,
    description: 'Agent consulaire - Traitement standard',
    canManage: ['demandes', 'rdv', 'documents'],
    defaultPermissions: [
      'demande:read',
      'demande:update',
      'demande:validate',
      'rdv:read',
      'rdv:create',
      'rdv:update',
      'document:read',
      'document:validate',
      'comm:read',
    ],
    maxDailyAppointments: 8,
  },
  [RoleName.RECEPTIONIST]: {
    name: RoleName.RECEPTIONIST,
    level: 5,
    description: 'Agent d\'accueil - Urgences, orientation, tickets et demandes sur place',
    canManage: ['rdv', 'accueil'],
    defaultPermissions: [
      'rdv:read',
      'rdv:create-urgence', // SPÉCIFIQUE
      'rdv:print-daily',    // SPÉCIFIQUE
      'rdv:checkin',        // SPÉCIFIQUE : valider les tickets de rendez-vous
      'walkin:read',        // SPÉCIFIQUE : registre des demandes sur place
      'walkin:manage',
      'demande:read',
      'user:read',
      'document:read',
    ],
    maxDailyAppointments: 0, // Ne prend pas de rdv standard
  },
  [RoleName.CULTURAL_ADVISOR]: {
    name: RoleName.CULTURAL_ADVISOR,
    level: 4,
    description: 'Conseiller Culturel - Espace dédié, échanges à visage découvert avec la communauté',
    canManage: ['culture'],
    defaultPermissions: [
      'culture:manage',
      'rdv:read',
      'rdv:update',
      'rdv:cancel',
      'demande:read',
      'demande:update',
      'demande:validate',
      'demande:reject',
      'service:read',
      'availability:read',
      'message:read',
      'message:create',
    ],
  },
  [RoleName.AUDITOR]: {
    name: RoleName.AUDITOR,
    level: 6,
    description: 'Auditeur - Lecture seule et contrôle',
    canManage: ['audit', 'stats'],
    defaultPermissions: [
      'audit:read',
      'audit:export',
      'stats:read',
      'stats:export',
      'demande:read',
      'rdv:read',
      'document:read',
    ],
  },
};

/**
 * Vérifie si un rôle peut gérer une ressource
 */
export function canManageResource(role: RoleName, resource: string): boolean {
  const config = ROLES_CONFIG[role];
  if (!config) return false;

  return config.canManage.includes(resource) || config.canManage.includes('*');
}
