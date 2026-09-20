// ============================================================
// src/config/document-labels.ts
// ============================================================

/**
 * Labels français centralisés pour les enums du module Documents.
 * Évite de dupliquer des switch/map de traduction dans chaque composant
 * (DocumentTypeChart, DocumentList, DocumentQueueTable, StudentDocumentGrid...).
 */

import { DocumentType, ConfidentialityLevel } from '../types';
import { AgentDepartment } from '../types/auth';

export const documentTypeLabels: Record<DocumentType, string> = {
  [DocumentType.ID_CARD]: "Carte d'identité",
  [DocumentType.PASSPORT]: 'Passeport',
  [DocumentType.STUDENT_CERT]: 'Certificat de scolarité',
  [DocumentType.CONSULAR_CARD]: 'Carte consulaire',
  [DocumentType.STUDENT_CARD]: "Carte d'étudiant",
  [DocumentType.PHOTO]: 'Photo',
  [DocumentType.PROOF_ADDRESS]: 'Justificatif de domicile',
  [DocumentType.BIRTH_CERT]: 'Acte de naissance',
  [DocumentType.NATIONALITY_CERT]: 'Certificat de nationalité',
  [DocumentType.SCHOLARSHIP_PROOF]: 'Preuve de bourse',
  [DocumentType.OTHER]: 'Autre',
};

export const confidentialityLabels: Record<ConfidentialityLevel, string> = {
  [ConfidentialityLevel.PUBLIC]: 'Public',
  [ConfidentialityLevel.INTERNAL]: 'Interne',
  [ConfidentialityLevel.RESTRICTED]: 'Restreint',
  [ConfidentialityLevel.CONFIDENTIAL]: 'Confidentiel',
};

export const departmentLabels: Record<AgentDepartment, string> = {
  [AgentDepartment.CONSULAR]: 'Consulaire',
  [AgentDepartment.ADMINISTRATIVE]: 'Administratif',
  [AgentDepartment.FINANCIAL]: 'Financier',
  [AgentDepartment.COMMUNICATION]: 'Communication',
  [AgentDepartment.SECURITY]: 'Sécurité',
  [AgentDepartment.STUDIES]: 'Études',
};

/** Statut de vérification d'un compte étudiant (données mock — voir StudentDocumentsPage). */
export const studentVerificationLabels: Record<string, string> = {
  VERIFIED: 'Vérifié',
  PENDING: 'En attente',
};