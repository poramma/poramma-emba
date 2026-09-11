// ============================================================
// src/types/auth.ts
// ============================================================

import { SubService } from "./services";

/**
 * STATUTS UTILISATEUR
 * Backend: enum user_status { UNVERIFIED, PENDING, VERIFIED, SUSPENDED }
 * Endpoint: GET /api/users/:id/status
 */
export enum UserStatus {
  UNVERIFIED = 'UNVERIFIED',
  PENDING = 'PENDING',
  VERIFIED = 'VERIFIED',
  SUSPENDED = 'SUSPENDED',
}

/**
 * TYPES D'UTILISATEUR
 * Backend: enum user_type { STUDENT, WORKER, MIGRANT, OTHER }
 * Endpoint: GET /api/users/:id/profile
 */
export enum UserType {
  STUDENT = 'STUDENT',
  WORKER = 'WORKER',
  MIGRANT = 'MIGRANT',
  OTHER = 'OTHER',
}

/**
 * RÔLES SYSTÈME (RBAC hiérarchique)
 * Backend: Table `roles` avec champ `level`
 * Endpoint: GET /api/auth/roles
 * Hiérarchie: 1=Ambassadeur (carte blanche) → 6=Auditeur (lecture seule)
 */
export enum RoleName {
  AMBASSADOR = 'AMBASSADOR',           // level: 1 - Carte blanche
  ADMIN = 'ADMIN',                     // level: 2 - Config système, gestion services
  SENIOR_AGENT = 'SENIOR_AGENT',      // level: 3 - Validation, supervision
  AGENT = 'AGENT',                     // level: 4 - Traitement standard
  RECEPTIONIST = 'RECEPTIONIST',       // level: 5 - Accueil, urgences, impression
  AUDITOR = 'AUDITOR',                 // level: 6 - Lecture seule, audit
}

/**
 * PERMISSIONS GRANULAIRES
 * Backend: Table `permissions` liée à `role_permissions`
 * Endpoint: GET /api/auth/permissions (pour l'utilisateur courant)
 * Format: {resource}:{action} (ex: "demande:validate")
 */
export enum PermissionCode {
  // Demandes
  DEMANDE_READ = 'demande:read',
  DEMANDE_CREATE = 'demande:create',
  DEMANDE_UPDATE = 'demande:update',
  DEMANDE_VALIDATE = 'demande:validate',
  DEMANDE_REJECT = 'demande:reject',
  DEMANDE_DELETE = 'demande:delete',
  DEMANDE_ASSIGN = 'demande:assign',
  
  // Rendez-vous
  RDV_READ = 'rdv:read',
  RDV_CREATE = 'rdv:create',
  RDV_CREATE_URGENCE = 'rdv:create-urgence',  // Spécifique accueil
  RDV_UPDATE = 'rdv:update',
  RDV_CANCEL = 'rdv:cancel',
  RDV_PRINT_DAILY = 'rdv:print-daily',         // Impression planning gardien

  // Disponibilités
  AVAILABILITY_READ = 'availability:read',
  AVAILABILITY_CREATE = 'availability:create',
  AVAILABILITY_UPDATE = 'availability:update',
  AVAILABILITY_DELETE = 'availability:delete',
  AVAILABILITY_CONFIG = 'availability:config',
  
  // Services
  SERVICE_READ = 'service:read',
  SERVICE_CREATE = 'service:create',
  SERVICE_UPDATE = 'service:update',
  SERVICE_DELETE = 'service:delete',
  SERVICE_ADMIN = 'service:admin',             // Gestion horaires, exceptions
  
  // Utilisateurs / Agents
  USER_READ = 'user:read',
  USER_CREATE = 'user:create',
  USER_UPDATE = 'user:update',
  USER_DELETE = 'user:delete',
  USER_ADMIN = 'user:admin',                   // Gestion rôles, permissions
  
  // Documents
  DOCUMENT_READ = 'document:read',
  DOCUMENT_VALIDATE = 'document:validate',
  DOCUMENT_UPDATE = 'document:update',
  DOCUMENT_UPLOAD = 'document:upload',
  DOCUMENT_DELETE = 'document:delete',
  DOCUMENT_SHARE = 'document:share',
  DOCUMENT_ARCHIVE = 'document:archive',
  DOCUMENT_GENERATE = 'document:generate',
  
  // Communication
  COMM_READ = 'comm:read',
  COMM_CREATE = 'comm:create',
  COMM_SEND = 'comm:send',
  
  // Audit
  AUDIT_READ = 'audit:read',
  AUDIT_EXPORT = 'audit:export',
  
  // Paiements
  PAYMENT_READ = 'payment:read',
  PAYMENT_CREATE = 'payment:create',
  PAYMENT_REFUND = 'payment:refund',
  
  // Stats & Rapports
  STATS_READ = 'stats:read',
  STATS_EXPORT = 'stats:export',
}

/**
 * UTILISATEUR (modèle complet)
 * Backend: Table `utilisateurs` + `user_profiles` + `user_roles` + `roles`
 * Endpoint: GET /api/auth/me
 */
export interface Utilisateur {
  id: string;
  email: string;
  phone: string | null;
  emailVerified: boolean;
  phoneVerified: boolean;
  status: UserStatus;
  mfaEnabled: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
  
  // Relations (chargées eager ou via join)
  profile: UserProfile;
  roles: UserRole[];
  activeRole?: Role;  // Rôle courant (switch possible pour Ambassadeur/Admin)
  permissions: PermissionCode[];  // Permissions dénormalisées pour le front
}

export interface UserProfile {
  id: string;
  userId: string;
  inue: string | null;
  userType: UserType;
  firstName: string;
  lastName: string;
  dateOfBirth: string | null;
  nationality: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Role {
  id: string;
  name: RoleName;
  description: string;
  level: number;
  isSystem: boolean;
  permissions: Permission[];
}

export interface Permission {
  id: string;
  roleId?: string;
  code: PermissionCode;
  name: string;
  description: string;
  resource: string;
  action: string;
  category?: string;
}

export interface UserRole {
  id: string;
  userId: string;
  roleId: string;
  role: Role;
  assignedBy: string;
  assignedAt: string;
  expiresAt: string | null;
  isActive: boolean;
}

/**
 * AGENT CONSULAIRE
 * Backend: Table `agents` liée à `utilisateurs`
 * Endpoint: GET /api/agents/:id
 */
export interface Agent {
  id: string;
  userId: string;
  user: Utilisateur;
  matricule: string;
  roleTitle: string;
  department: AgentDepartment;
  officeNumber: string | null;
  signatureUrl: string | null;
  active: boolean;
  hiredAt: string;
  createdAt: string;
  updatedAt: string;
  
  // Relations calculées
  assignments?: AgentServiceAssignment[];
  availabilities?: AgentAvailability[];
}

export enum AgentDepartment {
  CONSULAR = 'CONSULAR',
  ADMINISTRATIVE = 'ADMINISTRATIVE',
  FINANCIAL = 'FINANCIAL',
  COMMUNICATION = 'COMMUNICATION',
  SECURITY = 'SECURITY',
  STUDIES = 'STUDIES',
}

/**
 * AFFECTATION AGENT ↔ SERVICE
 * Backend: Table `agent_service_assignments`
 * Endpoint: POST /api/agents/:id/assignments
 * Permet de savoir quels agents traitent quels services + période de validité
 */
export interface AgentServiceAssignment {
  id: string;
  agentId: string;
  subServiceId: string;
  subService: SubService;
  assignedBy?: string;
  assignedAt: string;
  validFrom?: string;
  validUntil?: string | null;
  isPrimary: boolean;      // Agent principal vs. backup
  maxDailyAppointments?: number;
  notes?: string | null;
  active: boolean;
}

/**
 * DISPONIBILITÉ HEBDOMADAIRE AGENT
 * Backend: Table `agent_availabilities`
 * Endpoint: GET /api/agents/:id/availabilities
 */
export interface AgentAvailability {
  id: string;
  agentId: string;
  dayOfWeek: number;       // 1=Lundi, 7=Dimanche
  startTime?: string;       // Format "HH:mm"
  endTime?: string;
  isAvailable: boolean;
  validFrom?: string;
  validUntil?: string | null;
}

/**
 * EXCEPTION DE DISPONIBILITÉ (absence, formation, mission...)
 * Backend: Table `agent_exceptions`
 * Endpoint: POST /api/agents/:id/exceptions
 */
export interface AgentException {
  id: string;
  agentId: string;
  date: string;
  type: ExceptionType;
  reason: string;
  isFullDay: boolean;
  startTime?: string | null;
  endTime?: string | null;
  createdBy?: string;
  createdAt: string;
}

export enum ExceptionType {
  ABSENCE = 'ABSENCE',
  TRAINING = 'TRAINING',
  MISSION = 'MISSION',
  OTHER = 'OTHER',
}