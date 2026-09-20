// ============================================================
// src/types/communication.ts
// ============================================================

/**
 * TYPES: Communication institutionnelle & Notifications
 * Backend: Tables `campagnes`, `campagne_deliveries`, `campagne_attachments`,
 *          `notifications`
 * Endpoint: GET /api/communication/campagnes
 *
 * v2 — ajouts: pièces jointes de campagne (images, vidéos, documents),
 * image de couverture, estimation de destinataires en temps réel.
 */

import { StoredFile, DocumentUserSummary } from './document';

/**
 * CAMPAGNE DE COMMUNICATION (Campagne dans le diagramme)
 * Backend: Table `campagnes`
 * Envoyée à une cible filtrée d'étudiants
 *
 * NOUVEAU: coverImageId/coverImage — image d'illustration principale,
 * utilisée pour l'affichage en carte côté frontend-community.
 * NOUVEAU: attachments — pièces jointes secondaires (galerie, vidéo,
 * document annexe).
 */
export interface Campagne {
  id: string;
  title: string;
  content: string;           // Contenu HTML ou Markdown
  type: CampagneType;
  coverImageId: string | null;      // NOUVEAU
  coverImage?: StoredFile | null;   // NOUVEAU - relation chargée
  attachments: CampagneAttachment[]; // NOUVEAU
  targetFilters: CampagneFilters;
  scheduledAt: string | null;
  sentAt: string | null;
  status: CampagneStatus;
  sentBy: string;
  sentByUser?: DocumentUserSummary | null;
  stats: CampagneStats;
  interactions?: CampagneInteractions;
  createdAt: string;
}

export enum CampagneType {
  INFO = 'INFO',
  ALERT = 'ALERT',
  EVENT = 'EVENT',
  SURVEY = 'SURVEY',
  REMINDER = 'REMINDER',
}

export enum CampagneStatus {
  DRAFT = 'DRAFT',
  SCHEDULED = 'SCHEDULED',
  SENDING = 'SENDING',
  SENT = 'SENT',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED', // NOUVEAU - annulation d'une campagne SCHEDULED
}

export interface CampagneFilters {
  cities?: string[];
  statuses?: string[];
  studyLevels?: string[];
  faculties?: string[];
  hasBourse?: boolean;
  universities?: string[];
  userIds?: string[];
}

/**
 * Interactions des citoyens avec l'annonce (agrégats anonymes) — alimentées par
 * frontend-community via communaute-api : vues, clics (par média/lien), « j'aime »
 * et participations (événements).
 */
export interface CampagneInteractions {
  views: number;
  uniqueViewers: number;
  clicks: number;
  uniqueClickers: number;
  likes: number;
  participants: number;
  /** `targetId` = id d'une pièce jointe, ou « link:<url> » pour un lien du texte. */
  clicksByTarget: { targetId: string; count: number }[];
}

export interface CampagneStats {
  totalRecipients: number;
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  failed: number;
  openRate: number;
  clickRate: number;
}

/**
 * NOUVEAU — TYPE DE PIÈCE JOINTE
 * Backend: enum campagne_attachment_type
 */
export enum CampagneAttachmentType {
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO',
  DOCUMENT = 'DOCUMENT',
}

/**
 * NOUVEAU — PIÈCE JOINTE DE CAMPAGNE
 * Backend: Table `campagne_attachments`
 * Endpoint: POST /api/communication/campagnes/:id/attachments
 * Réutilise StoredFile (même pipeline de stockage/chiffrement que la GED)
 */
export interface CampagneAttachment {
  id: string;
  campagneId: string;
  fileId: string;
  file: StoredFile;
  type: CampagneAttachmentType;
  order: number;             // Ordre d'affichage dans la galerie
  caption: string | null;
  /** Affiché dans le carrousel « bannière », entre le titre et le contenu (image ou vidéo uniquement). */
  isBanner: boolean;
  createdAt: string;
}

/**
 * NOUVEAU — PAYLOAD D'UPLOAD D'UNE PIÈCE JOINTE
 * Backend: POST /api/communication/campagnes/:id/attachments
 * Content-Type: multipart/form-data
 */
export interface UploadCampagneMediaPayload {
  file: File;
  type: CampagneAttachmentType;
  caption?: string;
  /** Ajoute directement le média au carrousel « bannière ». */
  isBanner?: boolean;
}

/** Nombre maximum de médias dans le carrousel bannière (miroir du plafond serveur). */
export const MAX_BANNER_ITEMS = 8;

/**
 * NOUVEAU — ESTIMATION DE DESTINATAIRES (ciblage en temps réel)
 * Backend: POST /api/communication/campagnes/estimate
 * Body: CampagneFilters
 */
export interface RecipientEstimate {
  estimatedCount: number;
  breakdown: {
    byCity?: Record<string, number>;
    byStatus?: Record<string, number>;
  };
}

export interface CampagneDelivery {
  id: string;
  campagneId: string;
  userId: string;
  userName?: string;          // NOUVEAU - dénormalisé pour affichage table
  channel: NotifChannel;
  status: DeliveryStatus;
  sentAt: string | null;
  deliveredAt: string | null;
  openedAt: string | null;
  clickedAt: string | null;
  errorMessage: string | null;
}

export enum DeliveryStatus {
  QUEUED = 'QUEUED',
  SENT = 'SENT',
  DELIVERED = 'DELIVERED',
  FAILED = 'FAILED',
  OPENED = 'OPENED',
  CLICKED = 'CLICKED',
}

export interface Notif {
  id: string;
  userId: string;
  type: NotifType;
  title: string;
  body: string;
  payload: Record<string, unknown> | null;
  channel: NotifChannel;
  status: NotifStatus;
  actionUrl: string | null;
  createdAt: string;
  sentAt: string | null;
  readAt: string | null;
}

export enum NotifType {
  DEMANDE_UPDATE = 'DEMANDE_UPDATE',
  RDV_REMINDER = 'RDV_REMINDER',
  PAYMENT = 'PAYMENT',
  MESSAGE = 'MESSAGE',
  SYSTEM = 'SYSTEM',
  CAMPAGNE = 'CAMPAGNE',
  DOCUMENT = 'DOCUMENT',
  VALIDATION = 'VALIDATION',
}

export enum NotifChannel {
  IN_APP = 'IN_APP',
  EMAIL = 'EMAIL',
  SMS = 'SMS',
  PUSH = 'PUSH',
  WHATSAPP = 'WHATSAPP',
}

export enum NotifStatus {
  QUEUED = 'QUEUED',
  SENT = 'SENT',
  DELIVERED = 'DELIVERED',
  READ = 'READ',
  FAILED = 'FAILED',
}

/**
 * NOUVEAU — FILTRES DE RECHERCHE NOTIFICATION
 * Backend: Query params sur GET /api/notifications
 * Alimente la page /notifications (centre de notifications)
 */
export interface NotificationFilters {
  type?: NotifType;
  status?: NotifStatus;
  unreadOnly?: boolean;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}

export interface CreateCampagnePayload {
  title: string;
  content: string;
  type: CampagneType;
  coverImageFileId?: string;       // NOUVEAU
  targetFilters: CampagneFilters;
  scheduledAt?: string;
  channels: NotifChannel[];
}

export interface Message {
  id: string;
  threadId: string;
  senderId: string;
  senderName: string;
  senderRole: 'AGENT' | 'STUDENT' | 'SYSTEM';
  body: string;
  attachments: string[] | null;
  status: MsgStatus;
  readAt: string | null;
  createdAt: string;
}

export enum MsgStatus {
  SENT = 'SENT',
  DELIVERED = 'DELIVERED',
  READ = 'READ',
}

export interface Thread {
  id: string;
  demandeId: string | null;
  subject: string;
  type: ThreadType;
  status: ThreadStatus;
  participants: ThreadParticipant[];
  lastMessage: Message | null;
  unreadCount: number;
  createdAt: string;
  closedAt: string | null;
}

export enum ThreadType {
  DEMANDE = 'DEMANDE',
  GENERAL = 'GENERAL',
  URGENT = 'URGENT',
}

export enum ThreadStatus {
  OPEN = 'OPEN',
  CLOSED = 'CLOSED',
  ESCALATED = 'ESCALATED',
}

export interface ThreadParticipant {
  id: string;
  threadId: string;
  userId: string;
  userName: string;
  role: 'OWNER' | 'AGENT' | 'OBSERVER';
  joinedAt: string;
}