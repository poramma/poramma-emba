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
import { api } from '../lib/api';
import {
  DocumentGED,
  DocumentVersion,
  DocumentFilters,
  DocumentUploadPayload,
  DocumentValidationPayload,
  DocumentCategory,
  DocumentAuditLog,
  DocumentStats,
  InternalDocument,
  InternalDocumentUploadPayload,
  InternalDocumentFilters,
  GeneratedDocument,
  GeneratedDocumentPayload,
  GeneratedDocumentType,
} from '../types';

// ============================================================
// MOCK DATA — Documents générés uniquement (pas encore câblés au backend —
// GED citoyen et documents internes ci-dessus utilisent les vrais
// endpoints).
// ============================================================

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
  fetchDocumentsByDemande: (demandeId: string) => Promise<void>;
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
  createCategory: (payload: Omit<DocumentCategory, 'id'>) => Promise<DocumentCategory>;
  updateCategory: (id: string, payload: Partial<Omit<DocumentCategory, 'id'>>) => Promise<DocumentCategory>;
  deleteCategory: (id: string) => Promise<void>;

  // NOUVEAU — statistiques dashboard
  fetchStats: () => Promise<void>;

  // NOUVEAU — audit
  fetchAuditLogs: (documentId?: string) => Promise<void>;
  logAudit: (entry: Omit<DocumentAuditLog, 'id' | 'createdAt'>) => void;

  // NOUVEAU — documents internes
  fetchInternalDocuments: (filters?: InternalDocumentFilters) => Promise<void>;
  uploadInternalDocument: (payload: InternalDocumentUploadPayload) => Promise<InternalDocument>;
  shareInternalDocument: (id: string, targetAgentIds: string[], targetRoleIds: string[]) => Promise<void>;
  downloadInternalDocument: (doc: InternalDocument) => Promise<void>;

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
    // Remplace intégralement les filtres actifs — chaque appelant passe déjà
    // l'objet de filtres complet (page de filtres locale) ; fusionner avec
    // `get().filters` empêchait un `fetchDocuments({})` (réinitialisation)
    // d'effacer un filtre déjà actif, puisque `{}` ne "retire" aucune clé.
    const mergedFilters = filters;
    set({ isLoading: true, error: null, filters: mergedFilters });

    try {
      // isExpiringSoon/reviewedBy/dateFrom/dateTo/subServiceId ne sont pas
      // (encore) des filtres serveur — le backend ne supporte que status/
      // type/categoryId/ownerUserId/search pour l'instant (voir
      // documents.service.ts listDocuments) ; le reste se filtre ici sur le
      // résultat en attendant.
      const { data } = await api.get('/documents', {
        params: {
          status: mergedFilters.status,
          type: mergedFilters.type,
          categoryId: mergedFilters.categoryId,
          ownerUserId: mergedFilters.ownerUserId,
        },
      });
      let filtered = data.data as DocumentGED[];

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

      set({ documents: filtered, isLoading: false });

    } catch (err) {
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : 'Erreur de chargement des documents',
      });
    }
  },

  /**
   * FETCH DOCUMENTS D'UNE DEMANDE
   * Backend: GET /demandes/:id/documents — les pièces réellement jointes au
   * dossier (par le demandeur), pas tous les documents de l'ambassade.
   */
  fetchDocumentsByDemande: async (demandeId: string) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await api.get(`/demandes/${demandeId}/documents`);
      set({ documents: data.data as DocumentGED[], isLoading: false });
    } catch (err) {
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : 'Erreur de chargement des documents du dossier',
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
      // Le backend journalise déjà l'action VIEW server-side sur ce même
      // appel (voir documents.controller.ts's getDocument) — pas besoin de
      // logAudit() local ici, fetchAuditLogs() ira la relire.
      const { data } = await api.get(`/documents/${id}`);
      const doc = data.data as DocumentGED;
      set({ selectedDocument: doc, isLoading: false });
      get().fetchVersions(id);
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
      const formData = new FormData();
      formData.append('file', payload.file);
      formData.append('type', payload.type);
      formData.append('ownerUserId', payload.ownerUserId);
      if (payload.expiryDate) formData.append('expiryDate', payload.expiryDate);
      if (payload.notes) formData.append('notes', payload.notes);

      const { data } = await api.post('/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (e) => set({ uploadProgress: e.total ? Math.round((e.loaded * 100) / e.total) : 0 }),
      });
      const newDocument = data.data as DocumentGED;

      set((state) => ({
        documents: [newDocument, ...state.documents],
        selectedDocument: newDocument,
        uploadProgress: 100,
        isLoading: false,
      }));

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
      const { data } = await api.patch(`/documents/${id}/validate`, payload);
      const updated = data.data as DocumentGED;

      set((state) => ({
        documents: state.documents.map((d) => (d.id === id ? updated : d)),
        selectedDocument: state.selectedDocument?.id === id ? updated : state.selectedDocument,
        isLoading: false,
      }));

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
      const { data } = await api.get(`/documents/${documentId}/versions`);
      set({ versions: data.data });

    } catch (err) {
      console.error('Erreur chargement versions:', err);
    }
  },

  /**
   * DOWNLOAD DOCUMENT
   * Backend: GET /api/documents/:id/download → URL présignée MinIO/S3
   */
  downloadDocument: async (fileId) => {
    // MinIO n'est joignable que depuis le réseau Docker interne — pas d'URL
    // présignée utilisable par le navigateur, le fichier transite donc par
    // notre propre API authentifiée (voir documents.controller.ts).
    const doc = get().documents.find((d) => d.fileId === fileId) || get().selectedDocument;
    if (!doc || doc.fileId !== fileId) {
      console.error('Document introuvable pour ce fileId:', fileId);
      return;
    }
    try {
      const response = await api.get(`/documents/${doc.id}/download`, { responseType: 'blob' });
      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = doc.file.originalName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

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
      const { data } = await api.patch(`/documents/${id}/archive`);
      const updated = data.data as DocumentGED;

      set((state) => ({
        documents: state.documents.map((d) => (d.id === id ? updated : d)),
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
      // Le backend recherche sur nom/prénom/INUE du propriétaire et le nom
      // de fichier (voir documents.service.ts listDocuments) — pas sur
      // notes/reviewNote comme le faisait le mock.
      const { data } = await api.get('/documents', { params: { search: query } });
      set({ searchResults: data.data, isLoading: false });

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
      const { data } = await api.get('/document-categories');
      set({ categories: data.data, isLoading: false });
    } catch (err) {
      set({ isLoading: false, error: 'Erreur de chargement des catégories' });
    }
  },

  /** Backend: POST /api/document-categories (ADMIN — service:admin) */
  createCategory: async (payload) => {
    const { data } = await api.post('/document-categories', payload);
    const category = data.data as DocumentCategory;
    set((state) => ({ categories: [...state.categories, category] }));
    return category;
  },

  /** Backend: PATCH /api/document-categories/:id (ADMIN — service:admin) */
  updateCategory: async (id, payload) => {
    const { data } = await api.patch(`/document-categories/${id}`, payload);
    const updated = data.data as DocumentCategory;
    set((state) => ({ categories: state.categories.map((c) => (c.id === id ? updated : c)) }));
    return updated;
  },

  /** Backend: DELETE /api/document-categories/:id (ADMIN — service:admin) */
  deleteCategory: async (id) => {
    await api.delete(`/document-categories/${id}`);
    set((state) => ({ categories: state.categories.filter((c) => c.id !== id) }));
  },

  /**
   * NOUVEAU — FETCH STATS
   * Backend: GET /api/documents/stats
   * Alimente les KPI de la page /documents (dashboard)
   */
  fetchStats: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await api.get('/documents/stats');
      set({ stats: data.data, isLoading: false });
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
      const { data } = await api.get('/documents/audit', { params: { documentId } });
      set({ auditLogs: data.data, isLoading: false });
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
      const { data } = await api.get('/internal-documents', {
        params: { department: filters.department, confidentiality: filters.confidentiality, search: filters.search },
      });
      set({ internalDocuments: data.data, isLoading: false });
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
      const formData = new FormData();
      formData.append('file', payload.file);
      formData.append('title', payload.title);
      formData.append('department', payload.department);
      formData.append('confidentiality', payload.confidentiality);
      if (payload.tags?.length) formData.append('tags', JSON.stringify(payload.tags));

      const { data } = await api.post('/internal-documents', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (e) => set({ uploadProgress: e.total ? Math.round((e.loaded * 100) / e.total) : 0 }),
      });
      const newDoc = data.data as InternalDocument;

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

  /** Backend: PATCH /api/internal-documents/:id/share */
  shareInternalDocument: async (id, targetAgentIds, targetRoleIds) => {
    const { data } = await api.patch(`/internal-documents/${id}/share`, { targetAgentIds, targetRoleIds });
    const updated = data.data as InternalDocument;
    set((state) => ({ internalDocuments: state.internalDocuments.map((d) => (d.id === id ? updated : d)) }));
  },

  /**
   * Backend: GET /api/internal-documents/:id/download — même contrainte que
   * downloadDocument (pas d'URL MinIO directe, on proxy via notre API).
   */
  downloadInternalDocument: async (doc) => {
    try {
      const response = await api.get(`/internal-documents/${doc.id}/download`, { responseType: 'blob' });
      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = doc.file.originalName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Erreur téléchargement:', err);
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