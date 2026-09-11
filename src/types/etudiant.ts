// ============================================================
// src/types/etudiant.ts
// ============================================================

/**
 * TYPES: Étudiant, INUE, Profils
 * Backend: Tables `user_profiles`, `student_profiles`, `student_scholarships`
 * Endpoint: GET /api/etudiants/:id
 */

/**
 * PROFIL ÉTUDIANT (StudentProfile dans le diagramme)
 * Backend: Table `student_profiles`
 * Lié à `utilisateurs` via userId
 */
export interface EtudiantProfile {
  id: string;
  userId: string;
  university: string;
  faculty: string;
  studyLevel: string; // Ex: "Licence 1", "Master 2", "Doctorat"
  studentCardNumber: string | null;
  enrollmentYear: number | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * BOURSE (StudentScholarship dans le diagramme)
 * Backend: Table `student_scholarships`
 * Lié à `student_profiles` via studentProfileId
 */
export interface Bourse {
  id: string;
  studentProfileId: string;
  studentProfile: EtudiantProfile;
  isRecipient: boolean;
  decisionNumber: string | null; // Numéro de décision d'attribution
  promotion: string | null; // Ex: "2023-2024"
  startDate: string | null;
  endDate: string | null;
}

/**
 * STATUT DE VALIDATION CONSULAIRE
 * Backend: enum validation_status
 */
export enum ValidationStatus {
  UNVERIFIED = 'UNVERIFIED',      // Compte créé, pas encore soumis
  PENDING = 'PENDING',            // Documents soumis, en attente de vérification
  UNDER_REVIEW = 'UNDER_REVIEW',  // En cours de vérification par un agent
  ADDITIONAL_INFO = 'ADDITIONAL_INFO', // Informations complémentaires demandées
  VERIFIED = 'VERIFIED',          // Validé, INUE attribué
  REJECTED = 'REJECTED',          // Rejeté (documents non conformes)
  SUSPENDED = 'SUSPENDED',        // Suspendu (fraude, etc.)
}

/**
 * ÉTUDIANT COMPLET (agrégation de tous les profils)
 * Backend: JOIN de `utilisateurs` + `user_profiles` + `student_profiles` + `student_scholarships`
 * Endpoint: GET /api/etudiants/:id (vue complète)
 */
export interface Etudiant {
  id: string; // = userId
  inue: string | null; // Attribué après validation
  email: string;
  phone: string | null;
  firstName: string;
  lastName: string;
  status: ValidationStatus;
  profile: EtudiantProfile;
  bourse: Bourse | null;
  documents: EtudiantDocument[];
  demandes: string[]; // IDs des demandes
  createdAt: string;
  updatedAt: string;
}

/**
 * DOCUMENT SOUMIS PAR L'ÉTUDIANT (pour validation)
 * Backend: Table `documents` liée à `utilisateurs`
 * Endpoint: GET /api/etudiants/:id/documents
 */
export interface EtudiantDocument {
  id: string;
  ownerUserId: string;
  type: DocumentType;
  fileId: string;
  fileUrl: string;
  status: DocStatus;
  reviewedBy: string | null; // Agent qui a validé
  reviewedAt: string | null;
  reviewNote: string | null;
  expiryDate: string | null;
  version: number;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * TYPES DE DOCUMENTS (Document.type dans le diagramme)
 * Backend: enum document_type
 */
export enum DocumentType {
  ID_CARD = 'ID_CARD',
  PASSPORT = 'PASSPORT',
  STUDENT_CERT = 'STUDENT_CERT',       // Certificat de scolarité
  CONSULAR_CARD = 'CONSULAR_CARD',     // Carte consulaire
  STUDENT_CARD = 'STUDENT_CARD',       // Carte d'étudiant
  PHOTO = 'PHOTO',
  PROOF_ADDRESS = 'PROOF_ADDRESS',     // Justificatif de domicile
  BIRTH_CERT = 'BIRTH_CERT',           // Acte de naissance
  NATIONALITY_CERT = 'NATIONALITY_CERT', // Certificat de nationalité
  SCHOLARSHIP_PROOF = 'SCHOLARSHIP_PROOF', // Preuve de bourse
  OTHER = 'OTHER',
}

/**
 * STATUT DE DOCUMENT (Document.status dans le diagramme)
 * Backend: enum doc_status
 */
export enum DocStatus {
  UPLOADED = 'UPLOADED',       // Téléversé, non vérifié
  IN_REVIEW = 'IN_REVIEW',     // En cours de vérification
  ACCEPTED = 'ACCEPTED',       // Validé
  REJECTED = 'REJECTED',       // Rejeté (avec motif)
  EXPIRED = 'EXPIRED',         // Expiré (date dépassée)
}

/**
 * FILTRES DE RECHERCHE ÉTUDIANT
 * Backend: Query params sur GET /api/etudiants
 */
export interface EtudiantFilters {
  search?: string;           // Recherche texte (nom, email, INUE)
  status?: ValidationStatus;
  university?: string;
  faculty?: string;
  studyLevel?: string;
  city?: string;
  hasBourse?: boolean;
  isVerified?: boolean;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * PAYLOAD DE VALIDATION (action agent)
 * Backend: POST /api/etudiants/:id/validate
 */
export interface ValidationPayload {
  status: ValidationStatus.VERIFIED | ValidationStatus.REJECTED | ValidationStatus.ADDITIONAL_INFO;
  inue?: string;             // Attribué si VERIFIED
  reviewNote?: string;       // Motif si REJECTED ou ADDITIONAL_INFO
  missingDocuments?: DocumentType[]; // Documents manquants si ADDITIONAL_INFO
}