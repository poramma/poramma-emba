// ============================================================
// src/hooks/useDocuments.ts
// ============================================================

import { useCallback, useMemo } from 'react';
import { useDocumentStore } from '../store/documentStore';
import {
  DocumentGED,
  DocumentVersion,
  DocumentFilters,
  DocumentUploadPayload,
  DocumentValidationPayload,
  DocStatus,
  DocumentType,
  DocumentCategory,
  DocumentStats,
  DocumentAuditLog,
  InternalDocument,
  InternalDocumentUploadPayload,
  InternalDocumentFilters,
  ConfidentialityLevel,
  GeneratedDocument,
  GeneratedDocumentPayload,
} from '../types';
import { AgentDepartment } from '../types';
import { PaginationMeta } from '../types/api';

// ============================================================
// INTERFACE DU HOOK
// ============================================================

interface UseDocumentsReturn {
  // État
  documents: DocumentGED[];
  documentsMeta: PaginationMeta | null;
  documentsPage: number;
  setDocumentsPage: (page: number) => void;
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

  // Computed
  documentsByStatus: (status: DocStatus) => DocumentGED[];
  documentsByType: (type: DocumentType) => DocumentGED[];
  documentsByCategory: (categoryId: string) => DocumentGED[];
  documentsPendingReview: DocumentGED[];
  documentsAccepted: DocumentGED[];
  documentsRejected: DocumentGED[];
  documentsExpired: DocumentGED[];
  documentsExpiringSoon: DocumentGED[]; // NOUVEAU - expiryDate dans les 30 jours
  selectedDocumentIsValid: boolean;
  selectedDocumentIsExpired: boolean;
  selectedDocumentIsExpiringSoon: boolean;
  selectedDocumentCanValidate: boolean;
  selectedDocumentCanDownload: boolean;
  totalSize: number;
  averageSize: number;

  // Actions CRUD — documents étudiants
  fetchDocuments: (filters?: DocumentFilters, page?: number) => Promise<void>;
  fetchDocumentsByDemande: (demandeId: string) => Promise<void>;
  fetchDocumentById: (id: string) => Promise<DocumentGED | null>;
  uploadDocument: (payload: DocumentUploadPayload) => Promise<DocumentGED>;
  validateDocument: (id: string, payload: DocumentValidationPayload) => Promise<void>;

  // Validation wrappers
  acceptDocument: (id: string, note?: string) => Promise<void>;
  rejectDocument: (id: string, note: string) => Promise<void>;
  requestResubmission: (id: string, note: string) => Promise<void>;

  // Versions & Download
  fetchVersions: (documentId: string) => Promise<void>;
  downloadDocument: (fileId: string) => Promise<void>;
  downloadSelected: () => Promise<void>;

  // Archive
  archiveDocument: (id: string) => Promise<void>;

  // Recherche
  searchDocuments: (query: string) => Promise<void>;
  clearSearch: () => void;

  // Filtres
  setFilters: (filters: DocumentFilters) => void;
  resetFilters: () => void;
  filterByStatus: (status: DocStatus | undefined) => void;
  filterByType: (type: DocumentType | undefined) => void;
  filterByCategory: (categoryId: string | undefined) => void; // NOUVEAU
  filterByOwner: (ownerUserId: string | undefined) => void;
  filterByReviewer: (reviewedBy: string | undefined) => void;
  filterByDateRange: (dateFrom?: string, dateTo?: string) => void;
  filterPendingReview: () => void;
  filterRejected: () => void;
  filterExpiringSoon: () => void; // NOUVEAU

  // Sélection
  setSelectedDocument: (doc: DocumentGED | null) => void;
  clearSelectedDocument: () => void;
  refreshSelectedDocument: () => Promise<void>;

  // Stats
  getCountByStatus: (status: DocStatus) => number;
  getCountByType: (type: DocumentType) => number;
  getPendingCount: () => number;
  getStorageStats: () => { totalFiles: number; totalSize: number; averageSize: number };

  // NOUVEAU — Catégories (page /documents/categories)
  fetchCategories: () => Promise<void>;
  createCategory: (payload: Omit<DocumentCategory, 'id'>) => Promise<DocumentCategory>;
  updateCategory: (id: string, payload: Partial<Omit<DocumentCategory, 'id'>>) => Promise<DocumentCategory>;
  deleteCategory: (id: string) => Promise<void>;

  // NOUVEAU — Statistiques dashboard (page /documents)
  fetchStats: () => Promise<void>;

  // NOUVEAU — Audit (page /documents/audit + onglet historique)
  fetchAuditLogs: (documentId?: string) => Promise<void>;

  // NOUVEAU — Documents internes (page /documents/internal)
  fetchInternalDocuments: (filters?: InternalDocumentFilters) => Promise<void>;
  uploadInternalDocument: (payload: InternalDocumentUploadPayload) => Promise<InternalDocument>;
  shareInternalDocument: (id: string, targetAgentIds: string[], targetRoleIds: string[]) => Promise<void>;
  downloadInternalDocument: (doc: InternalDocument) => Promise<void>;
  internalDocumentsByDepartment: (department: AgentDepartment) => InternalDocument[];
  internalDocumentsByConfidentiality: (level: ConfidentialityLevel) => InternalDocument[];

  // NOUVEAU — Documents générés (page /documents/generated)
  fetchGeneratedDocuments: (studentUserId?: string) => Promise<void>;
  generateDocument: (payload: GeneratedDocumentPayload) => Promise<GeneratedDocument>;
  revokeGeneratedDocument: (id: string, reason: string) => Promise<void>;
  activeGeneratedDocuments: GeneratedDocument[];
}

// ============================================================
// IMPLEMENTATION
// ============================================================

export const useDocuments = (): UseDocumentsReturn => {
  const store = useDocumentStore();

  const {
    documents,
    documentsMeta,
    documentsPage,
    selectedDocument,
    versions,
    filters,
    searchResults,
    categories,
    stats,
    auditLogs,
    internalDocuments,
    generatedDocuments,
    isLoading,
    error,
    uploadProgress,
    fetchDocuments: storeFetchDocuments,
    setDocumentsPage,
    fetchDocumentsByDemande: storeFetchDocumentsByDemande,
    fetchDocumentById: storeFetchDocumentById,
    uploadDocument: storeUploadDocument,
    validateDocument: storeValidateDocument,
    fetchVersions: storeFetchVersions,
    downloadDocument: storeDownloadDocument,
    archiveDocument: storeArchiveDocument,
    searchDocuments: storeSearchDocuments,
    setFilters: storeSetFilters,
    setSelectedDocument: storeSetSelectedDocument,
    fetchCategories: storeFetchCategories,
    createCategory: storeCreateCategory,
    updateCategory: storeUpdateCategory,
    deleteCategory: storeDeleteCategory,
    fetchStats: storeFetchStats,
    fetchAuditLogs: storeFetchAuditLogs,
    fetchInternalDocuments: storeFetchInternalDocuments,
    uploadInternalDocument: storeUploadInternalDocument,
    shareInternalDocument: storeShareInternalDocument,
    downloadInternalDocument: storeDownloadInternalDocument,
    fetchGeneratedDocuments: storeFetchGeneratedDocuments,
    generateDocument: storeGenerateDocument,
    revokeGeneratedDocument: storeRevokeGeneratedDocument,
  } = store;

  // ============================================================
  // COMPUTED (mémoïsés)
  // ============================================================

  const documentsPendingReview = useMemo(
    () => documents.filter((d) => d.status === DocStatus.IN_REVIEW),
    [documents]
  );

  const documentsAccepted = useMemo(
    () => documents.filter((d) => d.status === DocStatus.ACCEPTED),
    [documents]
  );

  const documentsRejected = useMemo(
    () => documents.filter((d) => d.status === DocStatus.REJECTED),
    [documents]
  );

  const documentsExpired = useMemo(() => {
    return documents.filter((d) => {
      if (!d.expiryDate) return false;
      return new Date(d.expiryDate) < new Date();
    });
  }, [documents]);

  // NOUVEAU — utile pour les alertes du dashboard et la relance des étudiants
  const documentsExpiringSoon = useMemo(() => {
    const in30Days = new Date();
    in30Days.setDate(in30Days.getDate() + 30);
    return documents.filter((d) => {
      if (!d.expiryDate) return false;
      const expiry = new Date(d.expiryDate);
      return expiry >= new Date() && expiry <= in30Days;
    });
  }, [documents]);

  const selectedDocumentIsValid = useMemo(() => {
    if (!selectedDocument) return false;
    return selectedDocument.status === DocStatus.ACCEPTED;
  }, [selectedDocument]);

  const selectedDocumentIsExpired = useMemo(() => {
    if (!selectedDocument?.expiryDate) return false;
    return new Date(selectedDocument.expiryDate) < new Date();
  }, [selectedDocument]);

  const selectedDocumentIsExpiringSoon = useMemo(() => {
    if (!selectedDocument?.expiryDate) return false;
    const in30Days = new Date();
    in30Days.setDate(in30Days.getDate() + 30);
    const expiry = new Date(selectedDocument.expiryDate);
    return expiry >= new Date() && expiry <= in30Days;
  }, [selectedDocument]);

  const selectedDocumentCanValidate = useMemo(() => {
    if (!selectedDocument) return false;
    return [DocStatus.UPLOADED, DocStatus.IN_REVIEW].includes(selectedDocument.status);
  }, [selectedDocument]);

  const selectedDocumentCanDownload = useMemo(() => {
    if (!selectedDocument) return false;
    return !!selectedDocument.fileId;
  }, [selectedDocument]);

  const totalSize = useMemo(
    () => documents.reduce((sum, d) => sum + (d.file?.size || 0), 0),
    [documents]
  );

  const averageSize = useMemo(() => {
    if (!documents.length) return 0;
    return Math.round(totalSize / documents.length);
  }, [documents.length, totalSize]);

  // NOUVEAU — documents générés non révoqués (page /documents/generated)
  const activeGeneratedDocuments = useMemo(
    () => generatedDocuments.filter((d) => !d.revoked),
    [generatedDocuments]
  );

  // ============================================================
  // HELPERS
  // ============================================================

  const documentsByStatus = useCallback(
    (status: DocStatus) => documents.filter((d) => d.status === status),
    [documents]
  );

  const documentsByType = useCallback(
    (type: DocumentType) => documents.filter((d) => d.type === type),
    [documents]
  );

  // NOUVEAU
  const documentsByCategory = useCallback(
    (categoryId: string) => documents.filter((d) => d.categoryId === categoryId),
    [documents]
  );

  // NOUVEAU
  const internalDocumentsByDepartment = useCallback(
    (department: AgentDepartment) => internalDocuments.filter((d) => d.department === department),
    [internalDocuments]
  );

  // NOUVEAU
  const internalDocumentsByConfidentiality = useCallback(
    (level: ConfidentialityLevel) => internalDocuments.filter((d) => d.confidentiality === level),
    [internalDocuments]
  );

  // ============================================================
  // ACTIONS WRAPPERS — documents étudiants
  // ============================================================

  const fetchDocuments = useCallback(
    async (filters?: DocumentFilters, page?: number) => {
      await storeFetchDocuments(filters, page);
    },
    [storeFetchDocuments]
  );

  const fetchDocumentsByDemande = useCallback(
    async (demandeId: string) => {
      await storeFetchDocumentsByDemande(demandeId);
    },
    [storeFetchDocumentsByDemande]
  );

  const fetchDocumentById = useCallback(
    async (id: string) => await storeFetchDocumentById(id),
    [storeFetchDocumentById]
  );

  const uploadDocument = useCallback(
    async (payload: DocumentUploadPayload) => {
      const doc = await storeUploadDocument(payload);
      console.log('[useDocuments] Document uploadé:', doc.id, doc.file.originalName);
      return doc;
    },
    [storeUploadDocument]
  );

  const validateDocument = useCallback(
    async (id: string, payload: DocumentValidationPayload) => {
      await storeValidateDocument(id, payload);
      console.log('[useDocuments] Document validé:', id, '→', payload.status);
    },
    [storeValidateDocument]
  );

  const acceptDocument = useCallback(
    async (id: string, note?: string) => {
      await validateDocument(id, { status: DocStatus.ACCEPTED, reviewNote: note || 'Document validé' });
    },
    [validateDocument]
  );

  const rejectDocument = useCallback(
    async (id: string, note: string) => {
      await validateDocument(id, { status: DocStatus.REJECTED, reviewNote: note });
    },
    [validateDocument]
  );

  const requestResubmission = useCallback(
    async (id: string, note: string) => {
      await validateDocument(id, { status: DocStatus.REJECTED, reviewNote: `RESOUMISSION REQUISE: ${note}` });
      console.log('[useDocuments] Resoumission demandée:', id);
    },
    [validateDocument]
  );

  const fetchVersions = useCallback(
    async (documentId: string) => await storeFetchVersions(documentId),
    [storeFetchVersions]
  );

  const downloadDocument = useCallback(
    async (fileId: string) => await storeDownloadDocument(fileId),
    [storeDownloadDocument]
  );

  const downloadSelected = useCallback(async () => {
    if (!selectedDocument?.fileId) {
      console.warn('[useDocuments] Aucun document sélectionné');
      return;
    }
    await storeDownloadDocument(selectedDocument.fileId);
  }, [selectedDocument, storeDownloadDocument]);

  const archiveDocument = useCallback(
    async (id: string) => {
      await storeArchiveDocument(id);
      console.log('[useDocuments] Document archivé:', id);
    },
    [storeArchiveDocument]
  );

  const clearSearch = useCallback(() => {
    storeSetFilters({});
    storeFetchDocuments({});
  }, [storeSetFilters, storeFetchDocuments]);

  const searchDocuments = useCallback(
    async (query: string) => {
      if (!query.trim()) {
        clearSearch();
        return;
      }
      await storeSearchDocuments(query);
    },
    [storeSearchDocuments, clearSearch]
  );

  // ============================================================
  // FILTRES WRAPPERS
  // ============================================================

  const resetFilters = useCallback(() => {
    storeSetFilters({});
    storeFetchDocuments({});
  }, [storeSetFilters, storeFetchDocuments]);

  const filterByStatus = useCallback(
    (status: DocStatus | undefined) => {
      storeSetFilters({ status });
      storeFetchDocuments({ status });
    },
    [storeSetFilters, storeFetchDocuments]
  );

  const filterByType = useCallback(
    (type: DocumentType | undefined) => {
      storeSetFilters({ type });
      storeFetchDocuments({ type });
    },
    [storeSetFilters, storeFetchDocuments]
  );

  // NOUVEAU
  const filterByCategory = useCallback(
    (categoryId: string | undefined) => {
      storeSetFilters({ categoryId });
      storeFetchDocuments({ categoryId });
    },
    [storeSetFilters, storeFetchDocuments]
  );

  const filterByOwner = useCallback(
    (ownerUserId: string | undefined) => {
      storeSetFilters({ ownerUserId });
      storeFetchDocuments({ ownerUserId });
    },
    [storeSetFilters, storeFetchDocuments]
  );

  const filterByReviewer = useCallback(
    (reviewedBy: string | undefined) => {
      storeSetFilters({ reviewedBy });
      storeFetchDocuments({ reviewedBy });
    },
    [storeSetFilters, storeFetchDocuments]
  );

  const filterByDateRange = useCallback(
    (dateFrom?: string, dateTo?: string) => {
      storeSetFilters({ dateFrom, dateTo });
      storeFetchDocuments({ dateFrom, dateTo });
    },
    [storeSetFilters, storeFetchDocuments]
  );

  const filterPendingReview = useCallback(() => {
    storeSetFilters({ status: DocStatus.IN_REVIEW });
    storeFetchDocuments({ status: DocStatus.IN_REVIEW });
  }, [storeSetFilters, storeFetchDocuments]);

  const filterRejected = useCallback(() => {
    storeSetFilters({ status: DocStatus.REJECTED });
    storeFetchDocuments({ status: DocStatus.REJECTED });
  }, [storeSetFilters, storeFetchDocuments]);

  // NOUVEAU
  const filterExpiringSoon = useCallback(() => {
    storeSetFilters({ isExpiringSoon: true });
    storeFetchDocuments({ isExpiringSoon: true });
  }, [storeSetFilters, storeFetchDocuments]);

  // ============================================================
  // SÉLECTION WRAPPERS
  // ============================================================

  const clearSelectedDocument = useCallback(() => {
    storeSetSelectedDocument(null);
  }, [storeSetSelectedDocument]);

  const refreshSelectedDocument = useCallback(async () => {
    if (!selectedDocument) return;
    await storeFetchDocumentById(selectedDocument.id);
    await storeFetchVersions(selectedDocument.id);
  }, [selectedDocument, storeFetchDocumentById, storeFetchVersions]);

  // ============================================================
  // STATS WRAPPERS (locales, sur les documents déjà chargés)
  // ============================================================

  const getCountByStatus = useCallback(
    (status: DocStatus) => documentsByStatus(status).length,
    [documentsByStatus]
  );

  const getCountByType = useCallback(
    (type: DocumentType) => documentsByType(type).length,
    [documentsByType]
  );

  const getPendingCount = useCallback(() => documentsPendingReview.length, [documentsPendingReview]);

  const getStorageStats = useCallback(
    () => ({ totalFiles: documents.length, totalSize, averageSize }),
    [documents.length, totalSize, averageSize]
  );

  // ============================================================
  // NOUVEAU — WRAPPERS Catégories / Stats / Audit / Interne / Généré
  // ============================================================

  const fetchCategories = useCallback(async () => {
    await storeFetchCategories();
  }, [storeFetchCategories]);

  const createCategory = useCallback(
    async (payload: Omit<DocumentCategory, 'id'>) => await storeCreateCategory(payload),
    [storeCreateCategory]
  );

  const updateCategory = useCallback(
    async (id: string, payload: Partial<Omit<DocumentCategory, 'id'>>) => await storeUpdateCategory(id, payload),
    [storeUpdateCategory]
  );

  const deleteCategory = useCallback(
    async (id: string) => await storeDeleteCategory(id),
    [storeDeleteCategory]
  );

  const fetchStats = useCallback(async () => {
    await storeFetchStats();
  }, [storeFetchStats]);

  const fetchAuditLogs = useCallback(
    async (documentId?: string) => {
      await storeFetchAuditLogs(documentId);
    },
    [storeFetchAuditLogs]
  );

  const fetchInternalDocuments = useCallback(
    async (filters?: InternalDocumentFilters) => {
      await storeFetchInternalDocuments(filters);
    },
    [storeFetchInternalDocuments]
  );

  const uploadInternalDocument = useCallback(
    async (payload: InternalDocumentUploadPayload) => {
      const doc = await storeUploadInternalDocument(payload);
      console.log('[useDocuments] Document interne uploadé:', doc.id, doc.title);
      return doc;
    },
    [storeUploadInternalDocument]
  );

  const shareInternalDocument = useCallback(
    async (id: string, targetAgentIds: string[], targetRoleIds: string[]) => {
      await storeShareInternalDocument(id, targetAgentIds, targetRoleIds);
    },
    [storeShareInternalDocument]
  );

  const downloadInternalDocument = useCallback(
    async (doc: InternalDocument) => await storeDownloadInternalDocument(doc),
    [storeDownloadInternalDocument]
  );

  const fetchGeneratedDocuments = useCallback(
    async (studentUserId?: string) => {
      await storeFetchGeneratedDocuments(studentUserId);
    },
    [storeFetchGeneratedDocuments]
  );

  const generateDocument = useCallback(
    async (payload: GeneratedDocumentPayload) => {
      const doc = await storeGenerateDocument(payload);
      console.log('[useDocuments] Attestation générée:', doc.id, doc.type);
      return doc;
    },
    [storeGenerateDocument]
  );

  const revokeGeneratedDocument = useCallback(
    async (id: string, reason: string) => {
      await storeRevokeGeneratedDocument(id, reason);
      console.log('[useDocuments] Attestation révoquée:', id);
    },
    [storeRevokeGeneratedDocument]
  );

  // ============================================================
  // RETOUR
  // ============================================================

  return {
    documents,
    documentsMeta,
    documentsPage,
    setDocumentsPage,
    selectedDocument,
    versions,
    filters,
    searchResults,
    categories,
    stats,
    auditLogs,
    internalDocuments,
    generatedDocuments,
    isLoading,
    error,
    uploadProgress,

    documentsByStatus,
    documentsByType,
    documentsByCategory,
    documentsPendingReview,
    documentsAccepted,
    documentsRejected,
    documentsExpired,
    documentsExpiringSoon,
    selectedDocumentIsValid,
    selectedDocumentIsExpired,
    selectedDocumentIsExpiringSoon,
    selectedDocumentCanValidate,
    selectedDocumentCanDownload,
    totalSize,
    averageSize,

    fetchDocuments,
    fetchDocumentsByDemande,
    fetchDocumentById,
    uploadDocument,
    validateDocument,

    acceptDocument,
    rejectDocument,
    requestResubmission,

    fetchVersions,
    downloadDocument,
    downloadSelected,

    archiveDocument,

    searchDocuments,
    clearSearch,

    setFilters: storeSetFilters,
    resetFilters,
    filterByStatus,
    filterByType,
    filterByCategory,
    filterByOwner,
    filterByReviewer,
    filterByDateRange,
    filterPendingReview,
    filterRejected,
    filterExpiringSoon,

    setSelectedDocument: storeSetSelectedDocument,
    clearSelectedDocument,
    refreshSelectedDocument,

    getCountByStatus,
    getCountByType,
    getPendingCount,
    getStorageStats,

    fetchCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    fetchStats,
    fetchAuditLogs,

    fetchInternalDocuments,
    uploadInternalDocument,
    shareInternalDocument,
    downloadInternalDocument,
    internalDocumentsByDepartment,
    internalDocumentsByConfidentiality,

    fetchGeneratedDocuments,
    generateDocument,
    revokeGeneratedDocument,
    activeGeneratedDocuments,
  };
};