// ============================================================
// src/types/rendez-vous.ts
// ============================================================

import { SubService } from "./services";
import { Agent } from "./auth";
import { Demande } from "./demande";
import { Utilisateur } from "./auth";

/**
 * CRÉNEAU D'AGENDA
 * Backend: Table `agenda_slots`
 * Endpoint: GET /api/agenda-slots?subServiceId=&date=&agentId=
 * Généré automatiquement par le backend selon ServiceSchedule + AgentAvailability
 */
export interface AgendaSlot {
  id: string;
  subServiceId: string;
  subService: SubService;
  agentId: string;
  agent: Agent;
  date: string;              // Format ISO date
  startTime: string;         // "HH:mm"
  endTime: string;
  tz: string;                // "Africa/Casablanca"
  isBooked: boolean;
  isBlocked: boolean;        // Bloqué manuellement par un agent
  blockReason: string | null;
  createdAt: string;
}

/**
 * TYPE DE RENDEZ-VOUS (nouveau)
 * Backend: enum rdv_type { STANDARD, URGENCE, PRIORITAIRE, SUIVI }
 */
export enum RDVType {
  STANDARD = 'STANDARD',
  URGENCE = 'URGENCE',           // Prise à l'accueil, sans créneau préalable
  PRIORITAIRE = 'PRIORITAIRE',   // Saut de file
  SUIVI = 'SUIVI',               // Après traitement demande
}

/**
 * STATUT DE RENDEZ-VOUS (étendu)
 * Backend: enum rdv_status
 */
export enum RDVStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  CHECKED_IN = 'CHECKED_IN',           // L'étudiant est arrivé
  IN_PROGRESS = 'IN_PROGRESS',         // En cours de traitement
  COMPLETED = 'COMPLETED',
  MISSED = 'MISSED',
  CANCELLED_BY_USER = 'CANCELLED_BY_USER',
  CANCELLED_BY_AGENT = 'CANCELLED_BY_AGENT',
  NO_SHOW = 'NO_SHOW',
}

/**
 * RENDEZ-VOUS (modèle étendu)
 * Backend: Table `rendez_vous`
 * Endpoints:
 *   - GET /api/rendez-vous
 *   - POST /api/rendez-vous (standard)
 *   - POST /api/rendez-vous/urgence (URGENCE - permission rdv:create-urgence)
 *   - PATCH /api/rendez-vous/:id/status
 */
export interface RendezVous {
  id: string;
  demandeId: string | null;
  demande: Demande | null;
  userId: string;
  user: Utilisateur;
  agentId: string;
  agent: Agent;
  slotId: string | null;     // null pour les urgences (pas de créneau pré-réservé)
  slot?: AgendaSlot | null;
  ticketId: string;          // Numéro de ticket affiché (ex: "RDV-20250705-001")
  type: RDVType;
  status: RDVStatus;
  motif: string | null;
  
  // Spécifique URGENCE
  isUrgent: boolean;
  urgenceJustification: string | null;
  
  createdBy: string;         // Agent qui a créé le rdv
  createdAt: string;
  updatedAt: string;
  remindedAt: string | null;
  checkedInAt: string | null;
  completedAt: string | null;
}

/**
 * NOTE SUR RENDEZ-VOUS
 * Backend: Table `rendez_vous_notes`
 * Endpoint: POST /api/rendez-vous/:id/notes
 */
export interface RendezVousNote {
  id: string;
  rendezVousId: string;
  authorUserId: string;
  author: Utilisateur;
  content: string;
  isInternal: boolean;       // Visible uniquement agents
  createdAt: string;
}

/**
 * IMPRESSION PLANNING JOURNALIER (nouveau - besoin ambassade)
 * Backend: Table `daily_schedule_prints`
 * Endpoint: POST /api/rendez-vous/print-daily
 * Permission requise: rdv:print-daily
 * Format: PDF ou imprimante thermique (ticket)
 */
export interface DailySchedulePrint {
  id: string;
  date: string;
  agentId: string | null;      // null = tous les agents
  agent: Agent | null;
  subServiceId: string | null; // null = tous les services
  subService: SubService | null;
  printedBy: string;
  printedByAgent: Agent;
  printedAt: string;
  format: PrintFormat;
  content: DailyScheduleContent;  // Données sérialisées
  status: PrintStatus;
}

export enum PrintFormat {
  PDF = 'PDF',
  THERMAL = 'THERMAL',
}

export enum PrintStatus {
  GENERATED = 'GENERATED',
  PRINTED = 'PRINTED',
  REPRINTED = 'REPRINTED',
}

export interface DailyScheduleContent {
  date: string;
  generatedAt: string;
  totalAppointments: number;
  byService: Array<{
    subServiceId: string;
    subServiceName: string;
    appointments: Array<{
      time: string;
      ticketId: string;
      studentName: string;
      studentInue: string;
      motif: string;
      status: string;
      agentName: string;
      isUrgent: boolean;
    }>;
  }>;
}