// ============================================================
// src/types/etudiant.ts
// ============================================================

/**
 * TYPES: Étudiant, INUE, Profils
 *
 * Backend: services/ambassade-api/src/modules/etudiants/ — les données
 * "brutes" (nom, université, bourse) restent dans identity.* (jamais
 * possédées par ambassade-api), le statut de validation et l'INUE sont
 * possédés par ambassade-api elle-même (voir schema.etudiants.ts).
 * Endpoint: GET /etudiants/:id
 *
 * L'id d'un étudiant, partout dans l'API, est son userId identity — il n'y
 * a pas d'id "de suivi" distinct exposé côté frontend.
 */

/**
 * PROFIL ACADÉMIQUE — sous-objet d'Etudiant, jamais retourné seul.
 */
export interface EtudiantProfile {
  university: string | null;
  faculty: string | null;
  studyLevel: string | null; // Ex: "Licence 1", "Master 2", "Doctorat"
}

/**
 * BOURSE — null si l'étudiant n'est pas boursier.
 */
export interface Bourse {
  isRecipient: true;
  decisionNumber: string | null;
  promotion: string | null; // année de promotion — sert aussi de base à l'année INUE
}

/**
 * STATUT DE VALIDATION — une seule étape, pas de workflow multi-niveaux
 * (voir project decision : validation simple, un agent habilité).
 */
export enum EtudiantStatus {
  PENDING = 'PENDING',       // Pas encore examiné par un agent (défaut, y compris avant tout contact)
  VALIDATED = 'VALIDATED',   // Dossier validé par un agent
  REJECTED = 'REJECTED',     // Rejeté (motif obligatoire)
  SUSPENDED = 'SUSPENDED',   // Suspendu (motif obligatoire)
}

/**
 * ÉTUDIANT COMPLET — forme exacte retournée par GET /etudiants et
 * GET /etudiants/:id (mergeView dans etudiants.service.ts).
 */
export interface Etudiant {
  id: string; // = userId
  userId: string;
  email: string;
  phone: string | null;
  firstName: string | null;
  lastName: string | null;
  nationality: string | null;
  city: string | null;
  country: string | null;
  registeredAt: string | null;
  accountStatus: string | null; // statut du compte identity (UNVERIFIED/VERIFIED/SUSPENDED) — distinct du statut de validation étudiant ci-dessous
  profile: EtudiantProfile;
  bourse: Bourse | null;
  status: EtudiantStatus;
  inue: string | null;
  inueAssignedAt: string | null;
  reviewNote: string | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
}

/**
 * FILTRES DE RECHERCHE ÉTUDIANT
 * Backend: Query params sur GET /etudiants
 */
export interface EtudiantFilters {
  search?: string;
  status?: EtudiantStatus;
  university?: string;
  faculty?: string;
  studyLevel?: string;
  city?: string;
  hasBourse?: boolean;
  hasInue?: boolean;
  page?: number;
  limit?: number;
  sortBy?: 'name' | 'registeredAt' | 'status';
  sortOrder?: 'asc' | 'desc';
}

/** Réponse de POST /etudiants/:id/assign-inue */
export interface InueAssignment {
  inue: string;
  year: number;
  sequence: number;
}

/** Réponse de POST /etudiants/estimate */
export interface EtudiantsEstimate {
  count: number;
  sample: { id: string; firstName: string | null; lastName: string | null }[];
}

/**
 * TYPES DE DOCUMENTS — définis ici historiquement, réutilisés par
 * types/document.ts et une dizaine de composants documents/*. Conservés tels
 * quels (ne pas déplacer sans mettre à jour tous les imports).
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

export enum DocStatus {
  UPLOADED = 'UPLOADED',       // Téléversé, non vérifié
  IN_REVIEW = 'IN_REVIEW',     // En cours de vérification
  ACCEPTED = 'ACCEPTED',       // Validé
  REJECTED = 'REJECTED',       // Rejeté (avec motif)
  EXPIRED = 'EXPIRED',         // Expiré (date dépassée)
}
