// ============================================================
// src/types/demande.ts
// ============================================================

/**
 * TYPES: Demandes consulaires
 * Backend: Tables `demandes`, `demande_requirements`, `demande_documents`, `demande_histories`
 * Endpoint: GET /api/demandes
 */

import { Utilisateur } from './auth';
import { SubService } from './services';
import { Agent } from './auth';

/**
 * DEMANDE (Demande dans le diagramme)
 * Backend: Table `demandes`
 * Cœur du workflow consulaire
 */
export interface Demande {
  id: string;
  userId: string;
  user: Utilisateur;
  subServiceId: string;
  subService: SubService;
  assignedAgentId: string | null;
  assignedAgent: Agent | null;
  dossierNumber: string;      // Ex: "DEM-2025-0001237" (numéro unique)
  status: AppStatus;
  priority: Priority;
  totalAmount: number | null; // Montant total (si payant)
  currency: string | null;
  customPayload: Record<string, unknown> | null; // Données spécifiques au service
  submittedAt: string | null; // Date de soumission
  assignedAt: string | null;  // Date d'assignation à un agent
  deadlineAt: string | null;  // Date butoir (SLA)
  completedAt: string | null; // Date de clôture
  createdAt: string;
  updatedAt: string;
  /** Présent uniquement en statut ADDITIONAL_INFO_REQUIRED : où en est le complément demandé. */
  complement?: DemandeComplement | null;
}

/**
 * ÉTAT D'UNE DEMANDE DE COMPLÉMENT (calculé par le backend).
 * « Complément requis » n'est PAS un état final : l'agent reprend le traitement
 * quand il le juge utile ; `responded` indique si l'usager a répondu depuis
 * (message public ou nouveau document) — sinon un avertissement est affiché.
 */
export interface DemandeComplement {
  requestedAt: string;
  requestMessage: string | null;
  requestedBy: string | null;
  responded: boolean;
  respondedAt: string | null;
  newMessages: number;
  newDocuments: number;
}

/**
 * STATUT DE DEMANDE (AppStatus dans le diagramme)
 * Backend: enum app_status
 * Workflow complet: DRAFT → SUBMITTED → IN_REVIEW → [APPROVED/REJECTED/COMPLETED]
 */
export enum AppStatus {
  DRAFT = 'DRAFT',                           // Brouillon (étudiant)
  SUBMITTED = 'SUBMITTED',                   // Soumise, en attente
  IN_REVIEW = 'IN_REVIEW',                   // En cours d'examen
  ADDITIONAL_INFO_REQUIRED = 'ADDITIONAL_INFO_REQUIRED', // Infos complémentaires demandées
  UNDER_VERIFICATION = 'UNDER_VERIFICATION', // Vérification approfondie
  APPROVED = 'APPROVED',                     // Approuvée (prête à être traitée/délivrée)
  REJECTED = 'REJECTED',                     // Rejetée
  COMPLETED = 'COMPLETED',                   // Traitée et clôturée
  CANCELLED = 'CANCELLED',                   // Annulée par l'étudiant
  ARCHIVED = 'ARCHIVED',                     // Archivée (historique)
}

/**
 * PRIORITÉ (Priority dans le diagramme)
 * Backend: enum priority
 */
export enum Priority {
  LOW = 'LOW',
  NORMAL = 'NORMAL',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

/**
 * EXIGENCE DE DEMANDE (DemandeRequirement dans le diagramme)
 * Backend: Table `demande_requirements`
 * Trace chaque prérequis et son statut
 */
export interface DemandeRequirement {
  id: string;
  demandeId: string;
  requirementId: string;      // Lien vers `requirements`
  label: string;              // Label du prérequis (denormalisé)
  type: string;               // Type du prérequis
  status: RequirementStatus;
  providedValue: string | null; // Valeur fournie (champ texte)
  providedDocumentId: string | null; // Document fourni
  reviewerNote: string | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
}

/**
 * STATUT D'EXIGENCE
 * Backend: enum requirement_status
 */
export enum RequirementStatus {
  PENDING = 'PENDING',       // En attente
  PROVIDED = 'PROVIDED',     // Fourni par l'étudiant
  UNDER_REVIEW = 'UNDER_REVIEW', // En cours de vérification
  ACCEPTED = 'ACCEPTED',     // Accepté
  REJECTED = 'REJECTED',     // Rejeté (non conforme)
}

/**
 * DOCUMENT DE DEMANDE (DemandeDocument dans le diagramme)
 * Backend: Table `demande_documents`
 * Lie un document uploadé à une exigence spécifique
 */
export interface DemandeDocument {
  id: string;
  demandeId: string;
  documentId: string;
  requirementId: string | null;
  isPrimary: boolean;         // Document principal vs. annexe
}

/**
 * HISTORIQUE DE DEMANDE (DemandeHistory dans le diagramme)
 * Backend: Table `demande_histories`
 * Audit trail complet du workflow
 */
export interface DemandeHistory {
  id: string;
  demandeId: string;
  action?: 'STATUS_CHANGE' | 'ASSIGNMENT'; // absent = STATUS_CHANGE (anciennes entrées)
  fromStatus: AppStatus;
  toStatus: AppStatus;
  actorUserId: string;
  actorRole: string;
  actorName: string;          // Denormalisé pour affichage
  comment: string | null;
  isVisibleToUser: boolean;   // L'étudiant voit-il cette entrée ?
  createdAt: string;
}

/**
 * COMMENTAIRE SUR DEMANDE (DemandeComment dans le diagramme)
 * Backend: Table `demande_comments`
 * Échanges entre agents et/ou avec l'étudiant
 */
export interface DemandeComment {
  id: string;
  demandeId: string;
  authorId: string;
  authorName: string;
  authorType: 'AGENT' | 'STUDENT' | 'SYSTEM';
  content: string;
  isInternal: boolean;        // true = visible uniquement agents
  attachments: string[] | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * FILTRES DE RECHERCHE DEMANDE
 * Backend: Query params sur GET /api/demandes
 */
export interface DemandeFilters {
  status?: AppStatus;
  priority?: Priority;
  subServiceId?: string;
  serviceId?: string;
  userId?: string;
  assignedAgentId?: string;
  dossierNumber?: string;
  dateFrom?: string;
  dateTo?: string;
  isOverdue?: boolean;        // SLA dépassé
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * PAYLOAD DE TRAITEMENT (action agent)
 * Backend: PATCH /api/demandes/:id/status
 */
export interface TraitementPayload {
  status: AppStatus;
  comment: string;
  isVisibleToUser: boolean;
  assignedAgentId?: string;   // Réassignation
}

/**
 * PAYLOAD D'ASSIGNATION
 * Backend: POST /api/demandes/:id/assign
 */
export interface AssignationPayload {
  agentId: string;
  note?: string;
}