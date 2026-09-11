// ============================================================
// src/config/roles.ts
// ============================================================

/**
 * CONFIGURATION RBAC : Rôles hiérarchiques
 * 
 * Hiérarchie: 1 = plus haut (Ambassadeur), 6 = plus bas (Auditeur)
 * Règle: un rôle de niveau N peut tout ce que fait le rôle N+1
 * Exception: l'Ambassadeur a carte blanche (toutes les permissions)
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
  [RoleName.AMBASSADOR]: {
    name: RoleName.AMBASSADOR,
    level: 1,
    description: 'Chef de mission diplomatique - Accès illimité',
    canManage: ['*'], // Tout
    defaultPermissions: ['*'], // Toutes les permissions
  },
  [RoleName.ADMIN]: {
    name: RoleName.ADMIN,
    level: 2,
    description: 'Administrateur système - Configuration et gestion',
    canManage: [
      'services',
      'agents',
      'roles',
      'permissions',
      'settings',
      'audit',
      'stats',
    ],
    defaultPermissions: [
      'service:admin',
      'user:admin',
      'audit:read',
      'audit:export',
      'stats:read',
      'stats:export',
      'demande:read',
      'demande:assign',
      'rdv:read',
      'rdv:print-daily',
      'document:read',
      'comm:read',
      'comm:send',
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
    description: 'Agent d\'accueil - Urgences et orientation',
    canManage: ['rdv', 'accueil'],
    defaultPermissions: [
      'rdv:read',
      'rdv:create-urgence', // SPÉCIFIQUE
      'rdv:print-daily',    // SPÉCIFIQUE
      'demande:read',
      'user:read',
      'document:read',
    ],
    maxDailyAppointments: 0, // Ne prend pas de rdv standard
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
  
  // Ambassadeur = tout
  if (role === RoleName.AMBASSADOR) return true;
  
  return config.canManage.includes(resource) || config.canManage.includes('*');
}