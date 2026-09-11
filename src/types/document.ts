// ============================================================
// src/types/document.ts
// ============================================================

/**
 * TYPES: GED (Gestion Électronique des Documents)
 * Backend: Tables `stored_files`, `documents`, `document_versions`,
 *          `document_categories`, `document_audit_logs`,
 *          `internal_documents`, `generated_documents`
 * Endpoint: GET /api/documents
 *
 * v2 — ajouts pour le module frontend-ambassy :
 *   - Lien Document <-> DocumentCategory
 *   - Documents internes de l'ambassade (distincts des documents étudiants)
 *   - Piste d'audit exploitable côté UI (page /documents/audit)
 *   - Documents générés (attestations, QR code, signature)
 *   - Filtres étendus + statistiques pour le dashboard
 */

import { DocumentType, DocStatus } from './etudiant';
import { AgentDepartment } from './auth';

/**
 * FICHIER STOCKÉ (StoredFile dans le diagramme)
 * Backend: Table `stored_files`
 * Stockage: MinIO/S3 avec chiffrement AES-256
 */
export interface StoredFile {
  id: string;
  path: string;              // Chemin dans le stockage (bucket/folder/filename)
  mimeType: string;          // Ex: "application/pdf", "image/jpeg"
  originalName: string;      // Nom original du fichier
  checksum: string;          // SHA-256 pour intégrité
  encryptionKeyId: string;   // ID de la clé de chiffrement
  size: number;              // Taille en octets
  uploadedAt: string;
  uploadedBy: string;        // userId
  expiresAt: string | null;  // Date d'expiration (si applicable)
}

/**
 * DOCUMENT GED (Document dans le diagramme)
 * Backend: Table `documents`
 * Un document peut avoir plusieurs versions
 *
 * NOUVEAU: categoryId — relie le document à sa DocumentCategory pour
 * appliquer les règles de rétention/validation/versions sans dupliquer
 * la logique métier dans le frontend.
 */
export interface DocumentGED {
  id: string;
  ownerUserId: string;       // Propriétaire (étudiant)
  type: DocumentType;
  categoryId: string | null; // NOUVEAU - lien vers DocumentCategory
  category?: DocumentCategory | null; // NOUVEAU - relation chargée (optionnelle)
  fileId: string;
  file: StoredFile;
  status: DocStatus;
  reviewedBy: string | null;
  reviewedAt: string | null;
  reviewNote: string | null;
  expiryDate: string | null; // Date d'expiration (passeport, carte...)
  version: number;           // Numéro de version courant
  previousVersionId: string | null; // Lien vers version précédente
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * VERSION DE DOCUMENT (DocumentVersion dans le diagramme)
 * Backend: Table `document_versions`
 * Historique complet des modifications
 */
export interface DocumentVersion {
  id: string;
  documentId: string;
  fileId: string;
  file: StoredFile;
  version: number;
  changeNote: string | null; // Note sur la modification
  createdBy: string;         // Agent qui a uploadé cette version
  createdAt: string;
}

/**
 * CATÉGORIE DE DOCUMENT (pour l'organisation)
 * Backend: Table `document_categories`
 * Utilisée par la page /documents/categories (administration)
 */
export interface DocumentCategory {
  id: string;
  name: string;
  code: string;
  description: string | null;
  allowedTypes: DocumentType[];
  requiresValidation: boolean;
  maxVersions: number;
  retentionDays: number | null; // Durée de conservation
}

/**
 * NOUVEAU — NIVEAU DE CONFIDENTIALITÉ
 * Backend: enum confidentiality_level
 * Utilisé pour les documents internes de l'ambassade
 */
export enum ConfidentialityLevel {
  PUBLIC = 'PUBLIC',           // Consultable par tout agent authentifié
  INTERNAL = 'INTERNAL',       // Consultable par tous les agents d'un département
  RESTRICTED = 'RESTRICTED',   // Consultable par rôles/agents désignés uniquement
  CONFIDENTIAL = 'CONFIDENTIAL', // Ambassadeur/Admin uniquement
}

/**
 * NOUVEAU — DOCUMENT INTERNE DE L'AMBASSADE
 * Backend: Table `internal_documents`
 * Endpoint: GET /api/internal-documents
 * Distinct de DocumentGED: pas lié à un étudiant ni à une Demande,
 * cycle de vie propre à l'administration (notes de service, courriers...)
 */
export interface InternalDocument {
  id: string;
  title: string;
  fileId: string;
  file: StoredFile;
  department: AgentDepartment;      // Service émetteur
  confidentiality: ConfidentialityLevel;
  targetRoleIds: string[] | null;   // Rôles destinataires si RESTRICTED
  targetAgentIds: string[] | null;  // Agents spécifiques destinataires
  tags: string[];
  version: number;
  previousVersionId: string | null;
  createdBy: string;                // agentId
  createdAt: string;
  updatedAt: string;
  archivedAt: string | null;
}

/**
 * NOUVEAU — PAYLOAD DE CRÉATION D'UN DOCUMENT INTERNE
 * Backend: POST /api/internal-documents
 */
export interface InternalDocumentUploadPayload {
  title: string;
  file: File;
  department: AgentDepartment;
  confidentiality: ConfidentialityLevel;
  targetRoleIds?: string[];
  targetAgentIds?: string[];
  tags?: string[];
}

/**
 * NOUVEAU — DOCUMENT GÉNÉRÉ (attestations, certificats avec QR/signature)
 * Backend: Table `generated_documents`
 * Endpoint: GET /api/generated-documents, POST /api/generated-documents
 * Alimente la page /documents/generated
 */
export interface GeneratedDocument {
  id: string;
  studentUserId: string;
  studentInue: string | null;
  type: GeneratedDocumentType;
  fileId: string;
  file: StoredFile;
  qrToken: string;            // Jeton unique encodé dans le QR code
  signatureHash: string;      // Empreinte de signature numérique
  issuedBy: string;           // agentId
  issuedAt: string;
  expiresAt: string | null;
  verificationCount: number;  // Nb de fois où le QR a été scanné/vérifié
  lastVerifiedAt: string | null;
  revoked: boolean;
  revokedReason: string | null;
}

export enum GeneratedDocumentType {
  ATTESTATION_INSCRIPTION = 'ATTESTATION_INSCRIPTION',
  CERTIFICAT_NATIONALITE = 'CERTIFICAT_NATIONALITE',
  ATTESTATION_BOURSE = 'ATTESTATION_BOURSE',
  LAISSEZ_PASSER = 'LAISSEZ_PASSER',
  AUTRE = 'AUTRE',
}

/**
 * NOUVEAU — PAYLOAD DE GÉNÉRATION D'ATTESTATION
 * Backend: POST /api/generated-documents
 */
export interface GeneratedDocumentPayload {
  studentUserId: string;
  type: GeneratedDocumentType;
  expiresAt?: string;
}

/**
 * NOUVEAU — ACTION D'AUDIT SUR UN DOCUMENT
 * Backend: enum document_audit_action
 */
export enum DocumentAuditAction {
  VIEW = 'VIEW',
  DOWNLOAD = 'DOWNLOAD',
  UPLOAD = 'UPLOAD',
  VALIDATE = 'VALIDATE',
  REJECT = 'REJECT',
  DELETE = 'DELETE',
  SHARE = 'SHARE',
  PRINT = 'PRINT',
  VERIFY_QR = 'VERIFY_QR',   // Vérification publique d'un GeneratedDocument
}

/**
 * NOUVEAU — JOURNAL D'AUDIT DOCUMENTAIRE
 * Backend: Table `document_audit_logs`
 * Endpoint: GET /api/documents/audit
 * Alimente la page /documents/audit (permission AUDIT_READ)
 */
export interface DocumentAuditLog {
  id: string;
  documentId: string;
  documentKind: 'STUDENT_DOCUMENT' | 'INTERNAL_DOCUMENT' | 'GENERATED_DOCUMENT';
  action: DocumentAuditAction;
  actorUserId: string | null;   // null si vérification publique anonyme (QR)
  actorName: string | null;
  actorRole: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  details: Record<string, unknown> | null;
  createdAt: string;
}

/**
 * NOUVEAU — STATISTIQUES DASHBOARD GED
 * Backend: GET /api/documents/stats
 * Alimente les KPI de la page /documents
 */
export interface DocumentStats {
  totalPending: number;          // UPLOADED + IN_REVIEW
  totalAccepted: number;
  totalRejected: number;
  averageReviewTimeHours: number;
  expiringSoonCount: number;     // expiryDate dans les 30 prochains jours
  byType: Array<{ type: DocumentType; count: number }>;
  byStatus: Array<{ status: DocStatus; count: number }>;
  recentActivity: DocumentAuditLog[];
}

/**
 * FILTRES DE RECHERCHE DOCUMENT
 * Backend: Query params sur GET /api/documents
 *
 * NOUVEAU: categoryId, isExpiringSoon, subServiceId (via la Demande liée)
 */
export interface DocumentFilters {
  ownerUserId?: string;
  type?: DocumentType;
  categoryId?: string;         // NOUVEAU
  status?: DocStatus;
  reviewedBy?: string;
  subServiceId?: string;       // NOUVEAU - filtre par service via la Demande liée
  isExpiringSoon?: boolean;    // NOUVEAU - expiryDate <= 30 jours
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  page?: number;
  limit?: number;
}

/**
 * NOUVEAU — FILTRES DOCUMENTS INTERNES
 * Backend: Query params sur GET /api/internal-documents
 */
export interface InternalDocumentFilters {
  department?: AgentDepartment;
  confidentiality?: ConfidentialityLevel;
  tags?: string[];
  search?: string;
  page?: number;
  limit?: number;
}

/**
 * PAYLOAD D'UPLOAD
 * Backend: POST /api/documents/upload
 * Content-Type: multipart/form-data
 */
export interface DocumentUploadPayload {
  file: File;
  type: DocumentType;
  ownerUserId: string;
  expiryDate?: string;
  notes?: string;
}

/**
 * PAYLOAD DE VALIDATION (action agent)
 * Backend: PATCH /api/documents/:id/validate
 */
export interface DocumentValidationPayload {
  status: DocStatus.ACCEPTED | DocStatus.REJECTED;
  reviewNote?: string;
}

export { DocStatus, DocumentType };