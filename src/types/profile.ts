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

export interface ActivityLogEntry {
  id: string;
  action: string;
  targetType: 'demande' | 'document' | 'rendez-vous' | 'service' | 'agent';
  targetLabel: string;
  targetId: string;
  createdAt: string;
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
  activities: ActivityLogEntry[];
}