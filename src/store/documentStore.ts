// ============================================================
// src/store/documentStore.ts
// ============================================================

/**
 * STORE: GED (Gestion Électronique des Documents)
 * Backend: Tables `stored_files`, `documents`, `document_versions`,
 *          `document_categories`, `document_audit_logs`,
 *          `internal_documents`, `generated_documents`
 * Endpoints:
 *   - GET    /api/documents
 *   - GET    /api/documents/:id
 *   - POST   /api/documents/upload
 *   - GET    /api/documents/:id/versions
 *   - GET    /api/documents/:id/download
 *   - GET    /api/documents/stats
 *   - GET    /api/document-categories
 *   - GET    /api/documents/audit
 *   - GET    /api/internal-documents
 *   - POST   /api/internal-documents
 *   - GET    /api/generated-documents
 *   - POST   /api/generated-documents
 *   - PATCH  /api/generated-documents/:id/revoke
 *
 * v2 — ajouts: categoryId sur les documents, statistiques dashboard,
 * journal d'audit, documents internes de l'ambassade, documents générés
 * (attestations avec QR/signature). Tout reste en mock en attendant le
 * backend — chaque action garde le bloc commenté "VRAIE IMPLÉMENTATION"
 * à activer tel quel une fois l'API prête.
 */

import { create } from 'zustand';
import {
  DocumentGED,
  DocumentVersion,
  DocumentFilters,
  DocumentUploadPayload,
  DocumentValidationPayload,
  DocStatus,
  DocumentType,
  StoredFile,
  DocumentCategory,
  DocumentAuditLog,
  DocumentAuditAction,
  DocumentStats,
  InternalDocument,
  InternalDocumentUploadPayload,
  InternalDocumentFilters,
  ConfidentialityLevel,
  GeneratedDocument,
  GeneratedDocumentPayload,
  GeneratedDocumentType,
} from '../types';
import { AgentDepartment } from '../types';

// ============================================================
// MOCK DATA — StoredFiles & Documents étudiants
// ============================================================

const MOCK_STORED_FILES: StoredFile[] = [
  {
    id: 'file-001',
    path: '2026/passport-moussa.pdf',
    mimeType: 'application/pdf',
    originalName: 'passeport_moussa_diarra.pdf',
    checksum: 'sha256:a1b2c3d4e5f6...',
    encryptionKeyId: 'key-001',
    size: 2457600,
    uploadedAt: '2025-07-01T10:00:00Z',
    uploadedBy: 'usr-stu-001',
    expiresAt: null,
  },
  {
    id: 'file-002',
    path: '2026/certif-scolarite-fatoumata.pdf',
    mimeType: 'application/pdf',
    originalName: 'certificat_scolarite_2025.pdf',
    checksum: 'sha256:b2c3d4e5f6a7...',
    encryptionKeyId: 'key-001',
    size: 1024000,
    uploadedAt: '2025-07-02T14:30:00Z',
    uploadedBy: 'usr-stu-002',
    expiresAt: '2025-09-30T00:00:00Z',
  },
];

// NOUVEAU — Catégories mockées, cohérentes avec DocumentCategory
const MOCK_CATEGORIES: DocumentCategory[] = [
  {
    id: 'cat-passport',
    name: 'Passeport',
    code: 'PASSPORT',
    description: 'Passeport en cours de validité',
    allowedTypes: [DocumentType.PASSPORT],
    requiresValidation: true,
    maxVersions: 5,
    retentionDays: 3650,
  },
  {
    id: 'cat-student-cert',
    name: 'Certificat de scolarité',
    code: 'STUDENT_CERT',
    description: 'Attestation de scolarité annuelle',
    allowedTypes: [DocumentType.STUDENT_CERT, DocumentType.STUDENT_CARD],
    requiresValidation: true,
    maxVersions: 3,
    retentionDays: 1825,
  },
  {
    id: 'cat-consular-card',
    name: 'Carte consulaire',
    code: 'CONSULAR_CARD',
    description: 'Carte d\'immatriculation consulaire',
    allowedTypes: [DocumentType.CONSULAR_CARD],
    requiresValidation: true,
    maxVersions: 3,
    retentionDays: 1825,
  },
];

const MOCK_DOCUMENTS: DocumentGED[] = [
  {
    id: 'doc-001',
    ownerUserId: 'usr-stu-001',
    type: DocumentType.PASSPORT,
    categoryId: 'cat-passport',
    category: MOCK_CATEGORIES[0],
    fileId: 'file-001',
    file: MOCK_STORED_FILES[0],
    status: DocStatus.ACCEPTED,
    reviewedBy: 'agent-002-fatima',
    reviewedAt: '2025-07-01T16:00:00Z',
    reviewNote: 'Passeport valide jusqu\'au 15/03/2028. Scan clair et lisible.',
    expiryDate: '2028-03-15',
    version: 1,
    previousVersionId: null,
    notes: 'Première version',
    createdAt: '2025-07-01T10:00:00Z',
    updatedAt: '2025-07-01T16:00:00Z',
  },
  {
    id: 'doc-002',
    ownerUserId: 'usr-stu-002',
    type: DocumentType.STUDENT_CERT,
    categoryId: 'cat-student-cert',
    category: MOCK_CATEGORIES[1],
    fileId: 'file-002',
    file: MOCK_STORED_FILES[1],
    status: DocStatus.IN_REVIEW,
    reviewedBy: null,
    reviewedAt: null,
    reviewNote: null,
    expiryDate: '2025-09-30',
    version: 1,
    previousVersionId: null,
    notes: 'Certificat provisoire en attendant l\'attestation officielle',
    createdAt: '2025-07-02T14:30:00Z',
    updatedAt: '2025-07-02T14:30:00Z',
  },
  {
    id: 'doc-003',
    ownerUserId: 'usr-stu-001',
    type: DocumentType.CONSULAR_CARD,
    categoryId: 'cat-consular-card',
    category: MOCK_CATEGORIES[2],
    fileId: 'file-003',
    file: {
      id: 'file-003',
      path: '2026/carte-consulaire-moussa.pdf',
      mimeType: 'application/pdf',
      originalName: 'carte_consulaire_2024.pdf',
      checksum: 'sha256:c3d4e5f6a7b8...',
      encryptionKeyId: 'key-001',
      size: 512000,
      uploadedAt: '2025-07-01T11:00:00Z',
      uploadedBy: 'usr-stu-001',
      expiresAt: '2025-12-31T00:00:00Z',
    },
    status: DocStatus.REJECTED,
    reviewedBy: 'agent-002-fatima',
    reviewedAt: '2025-07-01T17:00:00Z',
    reviewNote: 'Document flou, impossible de lire le numéro de carte. Veuillez re-scanner.',
    expiryDate: '2025-12-31',
    version: 1,
    previousVersionId: null,
    notes: 'Premier upload - qualité insuffisante',
    createdAt: '2025-07-01T11:00:00Z',
    updatedAt: '2025-07-01T17:00:00Z',
  },
];

const MOCK_VERSIONS: Record<string, DocumentVersion[]> = {
  'doc-003': [
    {
      id: 'ver-001',
      documentId: 'doc-003',
      fileId: 'file-003',
      file: MOCK_DOCUMENTS[2].file,
      version: 1,
      changeNote: 'Premier upload',
      createdBy: 'usr-stu-001',
      createdAt: '2025-07-01T11:00:00Z',
    },
  ],
  'doc-002': [
    {
      id: 'ver-001',
      documentId: 'doc-002',
      fileId: 'file-002',
      file: MOCK_DOCUMENTS[1].file,
      version: 1,
      changeNote: 'Premier upload',
      createdBy: 'usr-stu-002',
      createdAt: '2025-07-02T14:30:00Z',
    },
    {
      id: 'ver-002',
      documentId: 'doc-002',
      fileId: 'file-002',
      file: MOCK_DOCUMENTS[1].file,
      version: 2,
      changeNote: 'Correction de la qualité du document',
      createdBy: 'usr-stu-002',
      createdAt: '2025-07-03T10:00:00Z',
    }
  ]
};

// NOUVEAU — Journal d'audit mocké
const MOCK_AUDIT_LOGS: DocumentAuditLog[] = [
  {
    id: 'audit-001',
    documentId: 'doc-001',
    documentKind: 'STUDENT_DOCUMENT',
    action: DocumentAuditAction.VALIDATE,
    actorUserId: 'agent-002-fatima',
    actorName: 'Fatima Cissé',
    actorRole: 'AGENT',
    ipAddress: '196.12.45.10',
    userAgent: 'Mozilla/5.0',
    details: { status: DocStatus.ACCEPTED },
    createdAt: '2025-07-01T16:00:00Z',
  },
  {
    id: 'audit-002',
    documentId: 'doc-003',
    documentKind: 'STUDENT_DOCUMENT',
    action: DocumentAuditAction.REJECT,
    actorUserId: 'agent-002-fatima',
    actorName: 'Fatima Cissé',
    actorRole: 'AGENT',
    ipAddress: '196.12.45.10',
    userAgent: 'Mozilla/5.0',
    details: { reason: 'Document flou' },
    createdAt: '2025-07-01T17:00:00Z',
  },
];

// NOUVEAU — Documents internes mockés
const MOCK_INTERNAL_DOCUMENTS: InternalDocument[] = [
  {
    id: 'int-001',
    title: 'Note de service - Horaires Ramadan 2025',
    fileId: 'file-int-001',
    file: {
      id: 'file-int-001',
      path: '2026/note-horaires-ramadan.pdf',
      mimeType: 'application/pdf',
      originalName: 'note_horaires_ramadan.pdf',
      checksum: 'sha256:d4e5f6a7b8c9...',
      encryptionKeyId: 'key-001',
      size: 128000,
      uploadedAt: '2025-07-01T09:00:00Z',
      uploadedBy: 'agent-001-admin',
      expiresAt: null,
    },
    department: AgentDepartment.ADMINISTRATIVE,
    confidentiality: ConfidentialityLevel.INTERNAL,
    targetRoleIds: null,
    targetAgentIds: null,
    tags: ['horaires', 'note-service'],
    version: 1,
    previousVersionId: null,
    createdBy: 'agent-001-admin',
    createdAt: '2025-07-01T09:00:00Z',
    updatedAt: '2025-07-01T09:00:00Z',
    archivedAt: null,
  },

];

// NOUVEAU — Documents générés mockés (attestations)
const MOCK_GENERATED_DOCUMENTS: GeneratedDocument[] = [
  {
    id: 'gen-001',
    studentUserId: 'usr-stu-001',
    studentInue: 'ML-STU-000237',
    type: GeneratedDocumentType.ATTESTATION_INSCRIPTION,
    fileId: 'file-gen-001',
    file: {
      id: 'file-gen-001',
      path: '2026/attestation-ML-STU-000237.pdf',
      mimeType: 'application/pdf',
      originalName: 'attestation_inscription.pdf',
      checksum: 'sha256:e5f6a7b8c9d0...',
      encryptionKeyId: 'key-001',
      size: 84000,
      uploadedAt: '2025-07-05T10:00:00Z',
      uploadedBy: 'agent-002-fatima',
      expiresAt: null,
    },
    qrToken: 'qr-a1b2c3d4',
    signatureHash: 'sig-e5f6a7b8c9d0',
    issuedBy: 'agent-002-fatima',
    issuedAt: '2025-07-05T10:00:00Z',
    expiresAt: '2026-07-05T10:00:00Z',
    verificationCount: 3,
    lastVerifiedAt: '2025-07-10T08:00:00Z',
    revoked: false,
    revokedReason: null,
  },
];

// ============================================================
// INTERFACE
// ============================================================

interface DocumentState {
  documents: DocumentGED[];
  selectedDocument: DocumentGED | null;
  versions: DocumentVersion[];
  filters: DocumentFilters;
  searchResults: DocumentGED[];
  categories: DocumentCategory[];
  stats: DocumentStats | null;
  auditLogs: DocumentAuditLog[];
  internalDocuments: InternalDocument[];
  generatedDocuments: GeneratedDocument[];
  isLoading: boolean;
  error: string | null;
  uploadProgress: number;

  // Actions — documents étudiants
  fetchDocuments: (filters?: DocumentFilters) => Promise<void>;
  fetchDocumentById: (id: string) => Promise<DocumentGED | null>;
  uploadDocument: (payload: DocumentUploadPayload) => Promise<DocumentGED>;
  validateDocument: (id: string, payload: DocumentValidationPayload) => Promise<void>;
  fetchVersions: (documentId: string) => Promise<void>;
  downloadDocument: (fileId: string) => Promise<void>;
  archiveDocument: (id: string) => Promise<void>;
  searchDocuments: (query: string) => Promise<void>;
  setFilters: (filters: DocumentFilters) => void;
  setSelectedDocument: (doc: DocumentGED | null) => void;

  // NOUVEAU — catégories
  fetchCategories: () => Promise<void>;

  // NOUVEAU — statistiques dashboard
  fetchStats: () => Promise<void>;

  // NOUVEAU — audit
  fetchAuditLogs: (documentId?: string) => Promise<void>;
  logAudit: (entry: Omit<DocumentAuditLog, 'id' | 'createdAt'>) => void;

  // NOUVEAU — documents internes
  fetchInternalDocuments: (filters?: InternalDocumentFilters) => Promise<void>;
  uploadInternalDocument: (payload: InternalDocumentUploadPayload) => Promise<InternalDocument>;

  // NOUVEAU — documents générés
  fetchGeneratedDocuments: (studentUserId?: string) => Promise<void>;
  generateDocument: (payload: GeneratedDocumentPayload) => Promise<GeneratedDocument>;
  revokeGeneratedDocument: (id: string, reason: string) => Promise<void>;
}

// ============================================================
// IMPLEMENTATION
// ============================================================

export const useDocumentStore = create<DocumentState>()((set, get) => ({
  // État initial
  documents: [],
  selectedDocument: null,
  versions: [],
  filters: {},
  searchResults: [],
  categories: [],
  stats: null,
  auditLogs: [],
  internalDocuments: [],
  generatedDocuments: [],
  isLoading: false,
  error: null,
  uploadProgress: 0,

  /**
   * NOUVEAU — Ajoute une entrée au journal d'audit.
   * En mock: append local. Côté backend, cette écriture est faite
   * serveur-side sur chaque endpoint documentaire — le frontend ne fera
   * alors qu'un fetchAuditLogs() en lecture, jamais d'écriture directe.
   */
  logAudit: (entry) => {
    const newEntry: DocumentAuditLog = {
      ...entry,
      id: `audit-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    set((state) => ({ auditLogs: [newEntry, ...state.auditLogs] }));
  },

  /**
   * FETCH DOCUMENTS
   * Backend: GET /api/documents
   * Query: filtres (ownerUserId, type, categoryId, status, reviewedBy,
   *        subServiceId, isExpiringSoon, dateFrom, dateTo, search)
   */
  fetchDocuments: async (filters = {}) => {
    set({ isLoading: true, error: null, filters: { ...get().filters, ...filters } });

    try {
      await new Promise((r) => setTimeout(r, 600));

      // VRAIE IMPLÉMENTATION:
      // const { data } = await api.get('/documents', { params: { ...get().filters, ...filters } });
      // set({ documents: data.data, isLoading: false });

      let filtered = [...MOCK_DOCUMENTS];
      const mergedFilters = { ...get().filters, ...filters };

      if (mergedFilters.ownerUserId) {
        filtered = filtered.filter((d) => d.ownerUserId === mergedFilters.ownerUserId);
      }
      if (mergedFilters.type) {
        filtered = filtered.filter((d) => d.type === mergedFilters.type);
      }
      if (mergedFilters.categoryId) {
        filtered = filtered.filter((d) => d.categoryId === mergedFilters.categoryId);
      }
      if (mergedFilters.status) {
        filtered = filtered.filter((d) => d.status === mergedFilters.status);
      }
      if (mergedFilters.reviewedBy) {
        filtered = filtered.filter((d) => d.reviewedBy === mergedFilters.reviewedBy);
      }
      if (mergedFilters.isExpiringSoon) {
        const in30Days = new Date();
        in30Days.setDate(in30Days.getDate() + 30);
        filtered = filtered.filter(
          (d) => d.expiryDate && new Date(d.expiryDate) <= in30Days && new Date(d.expiryDate) >= new Date()
        );
      }
      if (mergedFilters.dateFrom) {
        filtered = filtered.filter((d) => d.createdAt >= mergedFilters.dateFrom!);
      }
      if (mergedFilters.dateTo) {
        filtered = filtered.filter((d) => d.createdAt <= mergedFilters.dateTo!);
      }
      // NOTE: subServiceId nécessite un join avec Demande/DemandeDocument,
      // non simulable proprement en mock local — à activer côté backend.

      set({ documents: filtered, isLoading: false });

    } catch (err) {
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : 'Erreur de chargement des documents',
      });
    }
  },

  /**
   * FETCH DOCUMENT BY ID
   * Backend: GET /api/documents/:id
   */
  fetchDocumentById: async (id) => {
    set({ isLoading: true, error: null });

    try {
      await new Promise((r) => setTimeout(r, 400));

      // VRAIE IMPLÉMENTATION:
      // const { data } = await api.get(`/documents/${id}`);

      const doc = MOCK_DOCUMENTS.find((d) => d.id === id) || null;
      set({ selectedDocument: doc, isLoading: false });

      if (doc) {
        get().fetchVersions(id);
        get().logAudit({
          documentId: id,
          documentKind: 'STUDENT_DOCUMENT',
          action: DocumentAuditAction.VIEW,
          actorUserId: 'current-user',
          actorName: 'Agent courant',
          actorRole: 'AGENT',
          ipAddress: null,
          userAgent: null,
          details: null,
        });
      }

      return doc;

    } catch (err) {
      set({ isLoading: false, error: 'Document introuvable' });
      return null;
    }
  },

  /**
   * UPLOAD DOCUMENT
   * Backend: POST /api/documents/upload
   */
  uploadDocument: async (payload) => {
    set({ isLoading: true, error: null, uploadProgress: 0 });

    try {
      for (let i = 0; i <= 100; i += 20) {
        await new Promise((r) => setTimeout(r, 200));
        set({ uploadProgress: i });
      }

      // VRAIE IMPLÉMENTATION:
      // const formData = new FormData();
      // formData.append('file', payload.file);
      // formData.append('type', payload.type);
      // formData.append('ownerUserId', payload.ownerUserId);
      // if (payload.expiryDate) formData.append('expiryDate', payload.expiryDate);
      // if (payload.notes) formData.append('notes', payload.notes);
      // const { data } = await api.post('/documents/upload', formData, {
      //   headers: { 'Content-Type': 'multipart/form-data' },
      //   onUploadProgress: (e) => set({ uploadProgress: Math.round((e.loaded * 100) / e.total!) }),
      // });

      const newFile: StoredFile = {
        id: `file-${Date.now()}`,
        path: `documents/${new Date().getFullYear()}/${String(new Date().getMonth() + 1).padStart(2, '0')}/${payload.file.name}`,
        mimeType: payload.file.type,
        originalName: payload.file.name,
        checksum: `sha256:${Math.random().toString(36).substring(2)}`,
        encryptionKeyId: 'key-001',
        size: payload.file.size,
        uploadedAt: new Date().toISOString(),
        uploadedBy: payload.ownerUserId,
        expiresAt: payload.expiryDate || null,
      };

      // Déduction simple de la catégorie à partir du type (le backend fera
      // l'équivalent via une table de correspondance type -> catégorie)
      const matchedCategory = MOCK_CATEGORIES.find((c) => c.allowedTypes.includes(payload.type)) || null;

      const newDocument: DocumentGED = {
        id: `doc-${Date.now()}`,
        ownerUserId: payload.ownerUserId,
        type: payload.type,
        categoryId: matchedCategory?.id ?? null,
        category: matchedCategory,
        fileId: newFile.id,
        file: newFile,
        status: DocStatus.UPLOADED,
        reviewedBy: null,
        reviewedAt: null,
        reviewNote: null,
        expiryDate: payload.expiryDate || null,
        version: 1,
        previousVersionId: null,
        notes: payload.notes || null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      set((state) => ({
        documents: [newDocument, ...state.documents],
        selectedDocument: newDocument,
        uploadProgress: 100,
        isLoading: false,
      }));

      get().logAudit({
        documentId: newDocument.id,
        documentKind: 'STUDENT_DOCUMENT',
        action: DocumentAuditAction.UPLOAD,
        actorUserId: payload.ownerUserId,
        actorName: 'Étudiant',
        actorRole: 'STUDENT',
        ipAddress: null,
        userAgent: null,
        details: { type: payload.type },
      });

      return newDocument;

    } catch (err) {
      set({ isLoading: false, error: 'Erreur d\'upload', uploadProgress: 0 });
      throw err;
    }
  },

  /**
   * VALIDATE DOCUMENT (action agent)
   * Backend: PATCH /api/documents/:id/validate
   */
  validateDocument: async (id, payload) => {
    set({ isLoading: true, error: null });

    try {
      await new Promise((r) => setTimeout(r, 400));

      // VRAIE IMPLÉMENTATION:
      // await api.patch(`/documents/${id}/validate`, payload);

      set((state) => ({
        documents: state.documents.map((d) =>
          d.id === id
            ? {
                ...d,
                status: payload.status,
                reviewNote: payload.reviewNote || null,
                reviewedBy: 'current-user',
                reviewedAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              }
            : d
        ),
        selectedDocument:
          state.selectedDocument?.id === id
            ? {
                ...state.selectedDocument,
                status: payload.status,
                reviewNote: payload.reviewNote || null,
                reviewedBy: 'current-user',
                reviewedAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              }
            : state.selectedDocument,
        isLoading: false,
      }));

      get().logAudit({
        documentId: id,
        documentKind: 'STUDENT_DOCUMENT',
        action: payload.status === DocStatus.ACCEPTED ? DocumentAuditAction.VALIDATE : DocumentAuditAction.REJECT,
        actorUserId: 'current-user',
        actorName: 'Agent courant',
        actorRole: 'AGENT',
        ipAddress: null,
        userAgent: null,
        details: { note: payload.reviewNote ?? null },
      });

    } catch (err) {
      set({ isLoading: false, error: 'Erreur de validation' });
      throw err;
    }
  },

  /**
   * FETCH VERSIONS
   * Backend: GET /api/documents/:id/versions
   */
  fetchVersions: async (documentId) => {
    try {
      await new Promise((r) => setTimeout(r, 300));

      // VRAIE IMPLÉMENTATION:
      // const { data } = await api.get(`/documents/${documentId}/versions`);

      set({ versions: MOCK_VERSIONS[documentId] || [] });

    } catch (err) {
      console.error('Erreur chargement versions:', err);
    }
  },

  /**
   * DOWNLOAD DOCUMENT
   * Backend: GET /api/documents/:id/download → URL présignée MinIO/S3
   */
  downloadDocument: async (fileId) => {
    try {
      // VRAIE IMPLÉMENTATION:
      // const { data } = await api.get(`/documents/download/${fileId}`);
      // window.open(data.url, '_blank');

      console.log(`[MOCK] Téléchargement du fichier ${fileId}`);
      const doc = get().documents.find((d) => d.fileId === fileId);
      if (doc) {
        console.log(`[MOCK] Ouverture: ${doc.file.originalName}`);
        get().logAudit({
          documentId: doc.id,
          documentKind: 'STUDENT_DOCUMENT',
          action: DocumentAuditAction.DOWNLOAD,
          actorUserId: 'current-user',
          actorName: 'Agent courant',
          actorRole: 'AGENT',
          ipAddress: null,
          userAgent: null,
          details: null,
        });
      }

    } catch (err) {
      console.error('Erreur téléchargement:', err);
    }
  },

  /**
   * ARCHIVE DOCUMENT
   * Backend: PATCH /api/documents/:id/archive
   */
  archiveDocument: async (id) => {
    set({ isLoading: true, error: null });

    try {
      await new Promise((r) => setTimeout(r, 300));

      // VRAIE IMPLÉMENTATION:
      // await api.patch(`/documents/${id}/archive`);

      set((state) => ({
        documents: state.documents.map((d) =>
          d.id === id ? { ...d, status: DocStatus.EXPIRED, updatedAt: new Date().toISOString() } : d
        ),
        isLoading: false,
      }));

    } catch (err) {
      set({ isLoading: false, error: 'Erreur d\'archivage' });
      throw err;
    }
  },

  /**
   * SEARCH DOCUMENTS (recherche plein texte)
   * Backend: GET /api/documents/search?q=...
   */
  searchDocuments: async (query) => {
    set({ isLoading: true, error: null });

    try {
      await new Promise((r) => setTimeout(r, 500));

      // VRAIE IMPLÉMENTATION:
      // const { data } = await api.get('/documents/search', { params: { q: query } });

      const results = MOCK_DOCUMENTS.filter(
        (d) =>
          d.file.originalName.toLowerCase().includes(query.toLowerCase()) ||
          d.notes?.toLowerCase().includes(query.toLowerCase()) ||
          d.reviewNote?.toLowerCase().includes(query.toLowerCase())
      );

      set({ searchResults: results, isLoading: false });

    } catch (err) {
      set({ isLoading: false, error: 'Erreur de recherche' });
    }
  },

  setFilters: (filters) => set({ filters: { ...get().filters, ...filters } }),
  setSelectedDocument: (doc) => set({ selectedDocument: doc }),

  /**
   * NOUVEAU — FETCH CATEGORIES
   * Backend: GET /api/document-categories
   * Alimente la page /documents/categories (administration)
   */
  fetchCategories: async () => {
    set({ isLoading: true, error: null });
    try {
      await new Promise((r) => setTimeout(r, 300));

      // VRAIE IMPLÉMENTATION:
      // const { data } = await api.get('/document-categories');

      set({ categories: MOCK_CATEGORIES, isLoading: false });
    } catch (err) {
      set({ isLoading: false, error: 'Erreur de chargement des catégories' });
    }
  },

  /**
   * NOUVEAU — FETCH STATS
   * Backend: GET /api/documents/stats
   * Alimente les KPI de la page /documents (dashboard)
   */
  fetchStats: async () => {
    set({ isLoading: true, error: null });
    try {
      await new Promise((r) => setTimeout(r, 400));

      // VRAIE IMPLÉMENTATION:
      // const { data } = await api.get('/documents/stats');
      // set({ stats: data, isLoading: false });

      const docs = get().documents.length ? get().documents : MOCK_DOCUMENTS;
      const byType = Object.values(DocumentType).map((type) => ({
        type,
        count: docs.filter((d) => d.type === type).length,
      })).filter((entry) => entry.count > 0);

      const byStatus = Object.values(DocStatus).map((status) => ({
        status,
        count: docs.filter((d) => d.status === status).length,
      })).filter((entry) => entry.count > 0);

      const in30Days = new Date();
      in30Days.setDate(in30Days.getDate() + 30);
      const expiringSoonCount = docs.filter(
        (d) => d.expiryDate && new Date(d.expiryDate) <= in30Days && new Date(d.expiryDate) >= new Date()
      ).length;

      const reviewed = docs.filter((d) => d.reviewedAt);
      const averageReviewTimeHours = reviewed.length
        ? reviewed.reduce((sum, d) => {
            const diffMs = new Date(d.reviewedAt!).getTime() - new Date(d.createdAt).getTime();
            return sum + diffMs / (1000 * 60 * 60);
          }, 0) / reviewed.length
        : 0;

      const stats: DocumentStats = {
        totalPending: docs.filter((d) => d.status === DocStatus.UPLOADED || d.status === DocStatus.IN_REVIEW).length,
        totalAccepted: docs.filter((d) => d.status === DocStatus.ACCEPTED).length,
        totalRejected: docs.filter((d) => d.status === DocStatus.REJECTED).length,
        averageReviewTimeHours: Math.round(averageReviewTimeHours * 10) / 10,
        expiringSoonCount,
        byType,
        byStatus,
        recentActivity: get().auditLogs.slice(0, 10).length ? get().auditLogs.slice(0, 10) : MOCK_AUDIT_LOGS,
      };

      set({ stats, isLoading: false });
    } catch (err) {
      set({ isLoading: false, error: 'Erreur de chargement des statistiques' });
    }
  },

  /**
   * NOUVEAU — FETCH AUDIT LOGS
   * Backend: GET /api/documents/audit?documentId=...
   * Alimente la page /documents/audit et l'onglet historique d'un document
   */

  fetchAuditLogs: async (documentId) => {
    set({ isLoading: true, error: null });
    try {
      await new Promise((r) => setTimeout(r, 300));

      // VRAIE IMPLÉMENTATION:
      // const { data } = await api.get('/documents/audit', { params: { documentId } });
      // set({ auditLogs: data.data, isLoading: false });

      // MOCK: Utiliser MOCK_AUDIT_LOGS directement, pas get().auditLogs
      // pour éviter la boucle infinie
      let filtered = MOCK_AUDIT_LOGS;
      if (documentId) {
        filtered = MOCK_AUDIT_LOGS.filter((a) => a.documentId === documentId);
      }

      set({ auditLogs: filtered, isLoading: false });
    } catch (err) {
      set({ isLoading: false, error: 'Erreur de chargement du journal d\'audit' });
    }
  },

  /**
   * NOUVEAU — FETCH INTERNAL DOCUMENTS
   * Backend: GET /api/internal-documents
   * Alimente la page /documents/internal
   */
  fetchInternalDocuments: async (filters = {}) => {
    set({ isLoading: true, error: null });
    try {
      await new Promise((r) => setTimeout(r, 400));

      // VRAIE IMPLÉMENTATION:
      // const { data } = await api.get('/internal-documents', { params: filters });

      let filtered = [...MOCK_INTERNAL_DOCUMENTS];
      if (filters.department) {
        filtered = filtered.filter((d) => d.department === filters.department);
      }
      if (filters.confidentiality) {
        filtered = filtered.filter((d) => d.confidentiality === filters.confidentiality);
      }
      if (filters.search) {
        const q = filters.search.toLowerCase();
        filtered = filtered.filter((d) => d.title.toLowerCase().includes(q));
      }

      set({ internalDocuments: filtered, isLoading: false });
    } catch (err) {
      set({ isLoading: false, error: 'Erreur de chargement des documents internes' });
    }
  },

  /**
   * NOUVEAU — UPLOAD INTERNAL DOCUMENT
   * Backend: POST /api/internal-documents
   */
  uploadInternalDocument: async (payload) => {
    set({ isLoading: true, error: null, uploadProgress: 0 });
    try {
      for (let i = 0; i <= 100; i += 25) {
        await new Promise((r) => setTimeout(r, 150));
        set({ uploadProgress: i });
      }

      // VRAIE IMPLÉMENTATION:
      // const formData = new FormData();
      // formData.append('file', payload.file);
      // formData.append('title', payload.title);
      // formData.append('department', payload.department);
      // formData.append('confidentiality', payload.confidentiality);
      // const { data } = await api.post('/internal-documents', formData, { ... });

      const newFile: StoredFile = {
        id: `file-int-${Date.now()}`,
        path: `internal/${new Date().getFullYear()}/${payload.file.name}`,
        mimeType: payload.file.type,
        originalName: payload.file.name,
        checksum: `sha256:${Math.random().toString(36).substring(2)}`,
        encryptionKeyId: 'key-001',
        size: payload.file.size,
        uploadedAt: new Date().toISOString(),
        uploadedBy: 'current-agent',
        expiresAt: null,
      };

      const newDoc: InternalDocument = {
        id: `int-${Date.now()}`,
        title: payload.title,
        fileId: newFile.id,
        file: newFile,
        department: payload.department,
        confidentiality: payload.confidentiality,
        targetRoleIds: payload.targetRoleIds ?? null,
        targetAgentIds: payload.targetAgentIds ?? null,
        tags: payload.tags ?? [],
        version: 1,
        previousVersionId: null,
        createdBy: 'current-agent',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        archivedAt: null,
      };

      set((state) => ({
        internalDocuments: [newDoc, ...state.internalDocuments],
        uploadProgress: 100,
        isLoading: false,
      }));

      return newDoc;
    } catch (err) {
      set({ isLoading: false, error: 'Erreur d\'upload du document interne', uploadProgress: 0 });
      throw err;
    }
  },

  /**
   * NOUVEAU — FETCH GENERATED DOCUMENTS
   * Backend: GET /api/generated-documents?studentUserId=...
   * Alimente la page /documents/generated
   */
  fetchGeneratedDocuments: async (studentUserId) => {
    set({ isLoading: true, error: null });
    try {
      await new Promise((r) => setTimeout(r, 350));

      // VRAIE IMPLÉMENTATION:
      // const { data } = await api.get('/generated-documents', { params: { studentUserId } });

      const filtered = studentUserId
        ? MOCK_GENERATED_DOCUMENTS.filter((d) => d.studentUserId === studentUserId)
        : MOCK_GENERATED_DOCUMENTS;

      set({ generatedDocuments: filtered, isLoading: false });
    } catch (err) {
      set({ isLoading: false, error: 'Erreur de chargement des documents générés' });
    }
  },

  /**
   * NOUVEAU — GENERATE DOCUMENT (attestation avec QR + signature)
   * Backend: POST /api/generated-documents
   * Le backend génère le PDF, calcule la signature et le qrToken.
   */
  generateDocument: async (payload) => {
    set({ isLoading: true, error: null });
    try {
      await new Promise((r) => setTimeout(r, 600));

      // VRAIE IMPLÉMENTATION:
      // const { data } = await api.post('/generated-documents', payload);

      const newDoc: GeneratedDocument = {
        id: `gen-${Date.now()}`,
        studentUserId: payload.studentUserId,
        studentInue: 'ML-STU-000000', // récupéré depuis la plateforme tierce en réel
        type: payload.type,
        fileId: `file-gen-${Date.now()}`,
        file: {
          id: `file-gen-${Date.now()}`,
          path: `generated/${new Date().getFullYear()}/${payload.type}-${Date.now()}.pdf`,
          mimeType: 'application/pdf',
          originalName: `${payload.type.toLowerCase()}.pdf`,
          checksum: `sha256:${Math.random().toString(36).substring(2)}`,
          encryptionKeyId: 'key-001',
          size: 80000,
          uploadedAt: new Date().toISOString(),
          uploadedBy: 'current-agent',
          expiresAt: payload.expiresAt || null,
        },
        qrToken: `qr-${Math.random().toString(36).substring(2)}`,
        signatureHash: `sig-${Math.random().toString(36).substring(2)}`,
        issuedBy: 'current-agent',
        issuedAt: new Date().toISOString(),
        expiresAt: payload.expiresAt || null,
        verificationCount: 0,
        lastVerifiedAt: null,
        revoked: false,
        revokedReason: null,
      };

      set((state) => ({
        generatedDocuments: [newDoc, ...state.generatedDocuments],
        isLoading: false,
      }));

      return newDoc;
    } catch (err) {
      set({ isLoading: false, error: 'Erreur de génération du document' });
      throw err;
    }
  },

  /**
   * NOUVEAU — REVOKE GENERATED DOCUMENT
   * Backend: PATCH /api/generated-documents/:id/revoke
   */
  revokeGeneratedDocument: async (id, reason) => {
    set({ isLoading: true, error: null });
    try {
      await new Promise((r) => setTimeout(r, 300));

      // VRAIE IMPLÉMENTATION:
      // await api.patch(`/generated-documents/${id}/revoke`, { reason });

      set((state) => ({
        generatedDocuments: state.generatedDocuments.map((d) =>
          d.id === id ? { ...d, revoked: true, revokedReason: reason } : d
        ),
        isLoading: false,
      }));
    } catch (err) {
      set({ isLoading: false, error: 'Erreur lors de la révocation' });
      throw err;
    }
  },
}));