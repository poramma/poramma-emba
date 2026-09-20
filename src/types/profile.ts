// src/types/profile.ts

import { Agent, Utilisateur, UserProfile, UserRole, Role, AgentServiceAssignment, AgentAvailability, AgentException } from './auth';

export interface AgentPreferences {
  theme: 'light' | 'dark' | 'system';
  language: 'fr' | 'bm';
  notificationsEmail: boolean;
  notificationsInApp: boolean;
  notificationTypes: {
    demandeAssigned: boolean;
    documentPending: boolean;
    rendezVousReminder: boolean;
  };
}

/** Une ligne de « Mon activité » — GET /audit/me (journal d'audit filtré sur l'agent connecté). */
export interface ActivityLogEntry {
  id: string;
  at: string;
  action: string;        // code d'action (VALIDATE, UPDATE_STATUS…) — voir config/audit-labels
  entityType: string;    // DEMANDE, RENDEZ_VOUS…
  entityId: string;
  targetLabel: string | null; // dossier / ticket / nom lisible, quand il est connu
  result: string;
  severity: string;
}

export interface AgentProfileData {
  agent: Agent;
  user: Utilisateur;
  profile: UserProfile;
  roles: UserRole[];
  activeRole?: Role;
  assignments: AgentServiceAssignment[];
  availabilities: AgentAvailability[];
  exceptions: AgentException[];
  preferences: AgentPreferences;
  activities?: unknown[];
}