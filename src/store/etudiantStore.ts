// ============================================================
// src/store/etudiantStore.ts
// ============================================================

/**
 * STORE: Gestion des étudiants (validation consulaire)
 * Backend: Tables `student_profiles`, `student_scholarships`, `documents`
 * Endpoints:
 *   - GET /api/etudiants
 *   - GET /api/etudiants/:id
 *   - PATCH /api/etudiants/:id/validate
 *   - PATCH /api/documents/:id/validate
 */

import { create } from 'zustand';
import {
  Etudiant,
  EtudiantProfile,
  Bourse,
  EtudiantDocument,
  EtudiantFilters,
  ValidationStatus,
  ValidationPayload,
  DocumentType,
  DocStatus,
} from '../types/etudiant';
import { UserType, UserStatus, Utilisateur } from '../types/auth';

// ============================================================
// MOCK DATA
// ============================================================

const MOCK_ETUDIANT_PROFILE: EtudiantProfile = {
  id: 'prof-stu-001',
  userId: 'usr-stu-001',
  university: 'Université Mohammed V - Rabat',
  faculty: 'Faculté des Sciences',
  studyLevel: 'Licence 3',
  studentCardNumber: 'STU-2024-001234',
  enrollmentYear: 2022,
  createdAt: '2024-09-01T00:00:00Z',
  updatedAt: '2025-07-01T00:00:00Z',
};

const MOCK_BOURSE: Bourse = {
  id: 'bourse-001',
  studentProfileId: 'prof-stu-001',
  studentProfile: MOCK_ETUDIANT_PROFILE,
  isRecipient: true,
  decisionNumber: 'DEC-2024-00156',
  promotion: '2024-2025',
  startDate: '2024-09-01',
  endDate: '2025-07-31',
};

const MOCK_ETUDIANT: Etudiant = {
  id: 'usr-stu-001',
  inue: 'ML-STU-000237',
  email: 'moussa.diarra@etudiant.ma',
  phone: '+212-6XX-XXXXXX',
  firstName: 'Moussa',
  lastName: 'Diarra',
  status: ValidationStatus.VERIFIED,
  profile: MOCK_ETUDIANT_PROFILE,
  bourse: MOCK_BOURSE,
  documents: [],
  demandes: [],
  createdAt: '2024-09-01T00:00:00Z',
  updatedAt: '2025-07-01T00:00:00Z',
};

const MOCK_ETUDIANTS: Etudiant[] = [
  MOCK_ETUDIANT,
  {
    ...MOCK_ETUDIANT,
    id: 'usr-stu-002',
    email: 'fatoumata.toure@etudiant.ma',
    inue: 'ML-STU-000456',
    firstName: 'Fatoumata',
    lastName: 'Toure',
    profile: {
      ...MOCK_ETUDIANT_PROFILE,
      id: 'prof-stu-002',
      userId: 'usr-stu-002',
      university: 'Université Hassan II - Casablanca',
      faculty: 'Faculté de Médecine',
      studyLevel: 'Master 1',
      studentCardNumber: 'STU-2023-005678',
      enrollmentYear: 2023,
    },
    bourse: null,
    status: ValidationStatus.PENDING,
  },
  {
    ...MOCK_ETUDIANT,
    id: 'usr-stu-003',
    email: 'amadou.kone@etudiant.ma',
    inue: null,
    firstName: 'Amadou',
    lastName: 'Kone',
    profile: {
      ...MOCK_ETUDIANT_PROFILE,
      id: 'prof-stu-003',
      userId: 'usr-stu-003',
      university: 'Université Cadi Ayyad - Marrakech',
      faculty: 'Faculté des Lettres',
      studyLevel: 'Licence 2',
      studentCardNumber: 'STU-2024-009012',
      enrollmentYear: 2024,
    },
    bourse: {
      ...MOCK_BOURSE,
      id: 'bourse-002',
      studentProfileId: 'prof-stu-003',
      promotion: '2024-2025',
    },
    status: ValidationStatus.UNVERIFIED,
  },
];

const MOCK_DOCUMENTS: EtudiantDocument[] = [
  {
    id: 'doc-001',
    ownerUserId: 'usr-stu-001',
    type: DocumentType.PASSPORT,
    fileId: 'file-001',
    fileUrl: '/files/passport-001.pdf',
    status: DocStatus.ACCEPTED,
    reviewedBy: 'agent-002',
    reviewedAt: '2025-07-01T10:00:00Z',
    reviewNote: 'Passeport valide jusqu\'au 2028',
    expiryDate: '2028-05-15',
    version: 1,
    notes: null,
    createdAt: '2025-06-15T00:00:00Z',
    updatedAt: '2025-07-01T10:00:00Z',
  },
  {
    id: 'doc-002',
    ownerUserId: 'usr-stu-001',
    type: DocumentType.STUDENT_CERT,
    fileId: 'file-002',
    fileUrl: '/files/certificat-001.pdf',
    status: DocStatus.ACCEPTED,
    reviewedBy: 'agent-002',
    reviewedAt: '2025-07-01T10:30:00Z',
    reviewNote: 'Certificat conforme',
    expiryDate: '2025-09-01',
    version: 1,
    notes: null,
    createdAt: '2025-06-20T00:00:00Z',
    updatedAt: '2025-07-01T10:30:00Z',
  },
];

// ============================================================
// INTERFACE
// ============================================================

interface EtudiantState {
  etudiants: Etudiant[];
  selectedEtudiant: Etudiant | null;
  documents: EtudiantDocument[];
  filters: EtudiantFilters;
  stats: {
    total: number;
    byStatus: Record<ValidationStatus, number>;
    verified: number;
    pending: number;
    unverified: number;
    withBourse: number;
  };
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchEtudiants: (filters?: EtudiantFilters) => Promise<void>;
  fetchEtudiantById: (id: string) => Promise<Etudiant | null>;
  validateEtudiant: (id: string, payload: ValidationPayload) => Promise<void>;
  validateDocument: (documentId: string, status: DocStatus, note?: string) => Promise<void>;
  fetchDocuments: (etudiantId: string) => Promise<void>;
  setFilters: (filters: EtudiantFilters) => void;
  setSelectedEtudiant: (etudiant: Etudiant | null) => void;
  getStats: () => void;
}

// ============================================================
// IMPLEMENTATION
// ============================================================

export const useEtudiantStore = create<EtudiantState>()((set, get) => ({
  // État initial
  etudiants: [],
  selectedEtudiant: null,
  documents: [],
  filters: {},
  stats: {
    total: 0,
    byStatus: {} as Record<ValidationStatus, number>,
    verified: 0,
    pending: 0,
    unverified: 0,
    withBourse: 0,
  },
  isLoading: false,
  error: null,

  /**
   * FETCH ETUDIANTS
   * Backend: GET /api/etudiants
   * Query: filtres (status, university, faculty, studyLevel, hasBourse, search...)
   * Response: { data: Etudiant[], meta: PaginationMeta }
   */
  fetchEtudiants: async (filters = {}) => {
    set({ isLoading: true, error: null, filters: { ...get().filters, ...filters } });

    try {
      // SIMULATION DÉLAI
      await new Promise((r) => setTimeout(r, 600));

      // VRAIE IMPLÉMENTATION:
      // const { data } = await api.get('/etudiants', { params: { ...get().filters, ...filters } });
      // set({ etudiants: data.data, isLoading: false });

      // MOCK: Filtrage local
      let filtered = [...MOCK_ETUDIANTS];
      const mergedFilters = { ...get().filters, ...filters };

      if (mergedFilters.status) {
        filtered = filtered.filter((e) => e.status === mergedFilters.status);
      }
      if (mergedFilters.university) {
        filtered = filtered.filter((e) => e.profile.university === mergedFilters.university);
      }
      if (mergedFilters.faculty) {
        filtered = filtered.filter((e) => e.profile.faculty === mergedFilters.faculty);
      }
      if (mergedFilters.studyLevel) {
        filtered = filtered.filter((e) => e.profile.studyLevel === mergedFilters.studyLevel);
      }
      if (mergedFilters.hasBourse !== undefined) {
        filtered = filtered.filter((e) => !!e.bourse === mergedFilters.hasBourse);
      }
      if (mergedFilters.isVerified !== undefined) {
        filtered = filtered.filter((e) => 
          mergedFilters.isVerified ? e.status === ValidationStatus.VERIFIED : e.status !== ValidationStatus.VERIFIED
        );
      }
      if (mergedFilters.search) {
        const search = mergedFilters.search.toLowerCase();
        filtered = filtered.filter(
          (e) =>
            e.email.toLowerCase().includes(search) ||
            e.firstName?.toLowerCase().includes(search) ||
            e.lastName?.toLowerCase().includes(search) ||
            e.inue?.toLowerCase().includes(search)
        );
      }

      set({ etudiants: filtered, isLoading: false });
      get().getStats();

    } catch (err) {
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : 'Erreur de chargement des étudiants',
      });
    }
  },

  /**
   * FETCH ETUDIANT BY ID
   * Backend: GET /api/etudiants/:id
   * Response: { data: Etudiant }
   */
  fetchEtudiantById: async (id) => {
    set({ isLoading: true, error: null });

    try {
      await new Promise((r) => setTimeout(r, 400));

      // VRAIE IMPLÉMENTATION:
      // const { data } = await api.get(`/etudiants/${id}`);
      // set({ selectedEtudiant: data.data, isLoading: false });
      // return data.data;

      const etudiant = MOCK_ETUDIANTS.find((e) => e.id === id) || null;
      set({ selectedEtudiant: etudiant, isLoading: false });

      if (etudiant) {
        get().fetchDocuments(id);
      }

      return etudiant;

    } catch (err) {
      set({ isLoading: false, error: 'Étudiant introuvable' });
      return null;
    }
  },

  /**
   * VALIDATE ETUDIANT
   * Backend: PATCH /api/etudiants/:id/validate
   * Body: { status, inue?, reviewNote?, missingDocuments? }
   */
  validateEtudiant: async (id, payload) => {
    set({ isLoading: true, error: null });

    try {
      await new Promise((r) => setTimeout(r, 500));

      // VRAIE IMPLÉMENTATION:
      // await api.patch(`/etudiants/${id}/validate`, payload);

      set((state) => ({
        etudiants: state.etudiants.map((e) =>
          e.id === id
            ? {
                ...e,
                status: payload.status,
                inue: payload.inue || e.inue,
                updatedAt: new Date().toISOString(),
              }
            : e
        ),
        selectedEtudiant:
          state.selectedEtudiant?.id === id
            ? {
                ...state.selectedEtudiant,
                status: payload.status,
                inue: payload.inue || state.selectedEtudiant.inue,
                updatedAt: new Date().toISOString(),
              }
            : state.selectedEtudiant,
        isLoading: false,
      }));

      get().getStats();

    } catch (err) {
      set({ isLoading: false, error: 'Erreur de validation' });
      throw err;
    }
  },

  /**
   * VALIDATE DOCUMENT
   * Backend: PATCH /api/documents/:id/validate
   * Body: { status, note }
   */
  validateDocument: async (documentId, status, note) => {
    set({ isLoading: true, error: null });

    try {
      await new Promise((r) => setTimeout(r, 400));

      // VRAIE IMPLÉMENTATION:
      // await api.patch(`/documents/${documentId}/validate`, { status, note });

      set((state) => ({
        documents: state.documents.map((doc) =>
          doc.id === documentId
            ? {
                ...doc,
                status,
                reviewNote: note || null,
                reviewedBy: 'current-user',
                reviewedAt: new Date().toISOString(),
              }
            : doc
        ),
        isLoading: false,
      }));

    } catch (err) {
      set({ isLoading: false, error: 'Erreur de validation du document' });
      throw err;
    }
  },

  /**
   * FETCH DOCUMENTS
   * Backend: GET /api/etudiants/:id/documents
   */
  fetchDocuments: async (etudiantId) => {
    try {
      await new Promise((r) => setTimeout(r, 300));

      // VRAIE IMPLÉMENTATION:
      // const { data } = await api.get(`/etudiants/${etudiantId}/documents`);
      // set({ documents: data.data });

      set({ documents: MOCK_DOCUMENTS.filter((d) => d.ownerUserId === etudiantId) });

    } catch (err) {
      console.error('Erreur chargement documents:', err);
    }
  },

  setFilters: (filters) => set({ filters: { ...get().filters, ...filters } }),
  setSelectedEtudiant: (etudiant) => set({ selectedEtudiant: etudiant }),

  /**
   * CALCUL DES STATISTIQUES
   * Backend: GET /api/etudiants/stats (optionnel)
   * Ou calcul local
   */
  getStats: () => {
    const etudiants = get().etudiants;

    const byStatus = {} as Record<ValidationStatus, number>;
    Object.values(ValidationStatus).forEach((s) => (byStatus[s] = 0));
    etudiants.forEach((e) => {
      byStatus[e.status] = (byStatus[e.status] || 0) + 1;
    });

    set({
      stats: {
        total: etudiants.length,
        byStatus,
        verified: etudiants.filter((e) => e.status === ValidationStatus.VERIFIED).length,
        pending: etudiants.filter((e) => 
          e.status === ValidationStatus.PENDING || e.status === ValidationStatus.UNDER_REVIEW
        ).length,
        unverified: etudiants.filter((e) => e.status === ValidationStatus.UNVERIFIED).length,
        withBourse: etudiants.filter((e) => !!e.bourse).length,
      },
    });
  },
}));