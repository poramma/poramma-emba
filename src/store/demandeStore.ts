// ============================================================
// src/store/demandeStore.ts
// ============================================================

/**
 * STORE: Demandes consulaires
 * Backend: Tables `demandes`, `demande_requirements`, `demande_documents`, `demande_histories`, `demande_comments`
 * Endpoints:
 *   - GET /api/demandes
 *   - GET /api/demandes/:id
 *   - POST /api/demandes
 *   - PATCH /api/demandes/:id/status
 *   - POST /api/demandes/:id/assign
 *   - POST /api/demandes/:id/comments
 */

import { create } from 'zustand';
import {
  Demande,
  DemandeHistory,
  DemandeComment,
  DemandeRequirement,
  DemandeFilters,
  TraitementPayload,
  AssignationPayload,
  AppStatus,
  Priority,
  RequirementStatus,
} from '../types/demande';
import { SubService } from '../types/services';
import { UserType, UserStatus, Utilisateur } from '../types/auth';

// ============================================================
// MOCK DATA
// ============================================================

const MOCK_ETUDIANT: Utilisateur = {
  id: 'usr-stu-001',
  email: 'moussa.diarra@etudiant.ma',
  phone: '+212-6XX-XXXXXX',
  emailVerified: true,
  phoneVerified: true,
  status: UserStatus.VERIFIED,
  mfaEnabled: false,
  lastLoginAt: '2025-07-01T10:00:00Z',
  createdAt: '2024-09-01T00:00:00Z',
  updatedAt: '2025-07-01T10:00:00Z',
  profile: {
    id: 'prof-stu-001',
    userId: 'usr-stu-001',
    inue: 'ML-STU-000237',
    userType: UserType.STUDENT,
    firstName: 'Moussa',
    lastName: 'DIARRA',
    dateOfBirth: '1998-05-15',
    nationality: 'Malienne',
    address: 'Rue Mohammed V, Rabat',
    city: 'Rabat',
    country: 'Maroc',
    createdAt: '2024-09-01T00:00:00Z',
    updatedAt: '2025-07-01T10:00:00Z',
  },
  roles: [],
  activeRole: undefined,
  permissions: [],
};

const MOCK_SUB_SERVICE: SubService = {
  id: 'sub-011',
  serviceId: 'cat-003',
  service: {} as any,
  name: 'Renouvellement Carte Consulaire',
  code: 'RENO_CARTE_CONS',
  description: 'Renouvellement annuel de la carte consulaire',
  active: true,
  basePrice: 80,
  currency: 'MAD',
  slaDays: 7,
  allowCustomRequest: false,
  requiresInPerson: true,
  createdAt: '2024-01-01T00:00:00Z',
  schedules: [],
  requirements: [],
};

const MOCK_DEMANDES: Demande[] = [
  {
    id: 'dem-2025-0001234',
    userId: 'usr-stu-001',
    user: MOCK_ETUDIANT,
    subServiceId: 'sub-011',
    subService: MOCK_SUB_SERVICE,
    assignedAgentId: 'agent-002-fatima',
    assignedAgent: null,
    dossierNumber: 'DEM-2025-0001234',
    status: AppStatus.IN_REVIEW,
    priority: Priority.NORMAL,
    totalAmount: 80,
    currency: 'MAD',
    customPayload: null,
    submittedAt: '2025-07-02T14:30:00Z',
    assignedAt: '2025-07-02T15:00:00Z',
    deadlineAt: '2025-07-09T14:30:00Z',
    completedAt: null,
    createdAt: '2025-07-01T10:00:00Z',
    updatedAt: '2025-07-03T09:15:00Z',
  },
  {
    id: 'dem-2025-0001235',
    userId: 'usr-stu-002',
    user: {
      ...MOCK_ETUDIANT,
      id: 'usr-stu-002',
      email: 'fatoumata.toure@etudiant.ma',
      profile: {
        ...MOCK_ETUDIANT.profile,
        id: 'prof-stu-002',
        userId: 'usr-stu-002',
        inue: 'ML-STU-000456',
        firstName: 'Fatoumata',
        lastName: 'TOURÉ',
      },
    },
    subServiceId: 'sub-012',
    subService: {
      ...MOCK_SUB_SERVICE,
      id: 'sub-012',
      name: 'Visa 3 mois',
      code: 'VISA_3M',
      basePrice: 1500,
      slaDays: 5,
    } as SubService,
    assignedAgentId: null,
    assignedAgent: null,
    dossierNumber: 'DEM-2025-0001235',
    status: AppStatus.SUBMITTED,
    priority: Priority.HIGH,
    totalAmount: 1500,
    currency: 'MAD',
    customPayload: { destination: 'Bamako', purpose: 'Famille' },
    submittedAt: '2025-07-05T08:00:00Z',
    assignedAt: null,
    deadlineAt: '2025-07-10T08:00:00Z',
    completedAt: null,
    createdAt: '2025-07-05T08:00:00Z',
    updatedAt: '2025-07-05T08:00:00Z',
  },
  {
    id: 'dem-2025-0001236',
    userId: 'usr-stu-003',
    user: {
      ...MOCK_ETUDIANT,
      id: 'usr-stu-003',
      email: 'amadou.kone@etudiant.ma',
      profile: {
        ...MOCK_ETUDIANT.profile,
        id: 'prof-stu-003',
        userId: 'usr-stu-003',
        inue: 'ML-STU-000789',
        firstName: 'Amadou',
        lastName: 'KONÉ',
      },
    },
    subServiceId: 'sub-016',
    subService: {
      ...MOCK_SUB_SERVICE,
      id: 'sub-016',
      name: 'Attestation sur l\'honneur',
      code: 'ATTEST_HONNEUR',
      basePrice: 50,
      slaDays: 1,
    } as SubService,
    assignedAgentId: 'agent-002-fatima',
    assignedAgent: null,
    dossierNumber: 'DEM-2025-0001236',
    status: AppStatus.APPROVED,
    priority: Priority.URGENT,
    totalAmount: 50,
    currency: 'MAD',
    customPayload: { objet: 'Attestation de non-paiement de bourse' },
    submittedAt: '2025-07-05T07:00:00Z',
    assignedAt: '2025-07-05T07:30:00Z',
    deadlineAt: '2025-07-06T07:00:00Z',
    completedAt: null,
    createdAt: '2025-07-05T07:00:00Z',
    updatedAt: '2025-07-05T10:00:00Z',
  },
];

const MOCK_HISTORIES: Record<string, DemandeHistory[]> = {
  'dem-2025-0001234': [
    {
      id: 'hist-001',
      demandeId: 'dem-2025-0001234',
      fromStatus: AppStatus.DRAFT,
      toStatus: AppStatus.SUBMITTED,
      actorUserId: 'usr-stu-001',
      actorRole: 'STUDENT',
      actorName: 'Moussa DIARRA',
      comment: 'Soumission de la demande',
      isVisibleToUser: true,
      createdAt: '2025-07-02T14:30:00Z',
    },
    {
      id: 'hist-002',
      demandeId: 'dem-2025-0001234',
      fromStatus: AppStatus.SUBMITTED,
      toStatus: AppStatus.IN_REVIEW,
      actorUserId: 'agent-002-fatima',
      actorRole: 'AGENT',
      actorName: 'Fatima COULIBALY',
      comment: 'Demande prise en charge',
      isVisibleToUser: true,
      createdAt: '2025-07-02T15:00:00Z',
    },
  ],
  'dem-2025-0001235': [
    {
      id: 'hist-003',
      demandeId: 'dem-2025-0001235',
      fromStatus: AppStatus.DRAFT,
      toStatus: AppStatus.SUBMITTED,
      actorUserId: 'usr-stu-002',
      actorRole: 'STUDENT',
      actorName: 'Fatoumata TOURÉ',
      comment: 'Soumission urgente - départ prévu le 15/07',
      isVisibleToUser: true,
      createdAt: '2025-07-05T08:00:00Z',
    },
  ],
};

const MOCK_COMMENTS: Record<string, DemandeComment[]> = {
  'dem-2025-0001234': [
    {
      id: 'com-001',
      demandeId: 'dem-2025-0001234',
      authorId: 'agent-002-fatima',
      authorName: 'Fatima COULIBALY',
      authorType: 'AGENT',
      content: 'Carte consulaire 2024 toujours valide, vérifier la date d\'expiration avant renouvellement',
      isInternal: true,
      attachments: null,
      createdAt: '2025-07-03T09:15:00Z',
      updatedAt: '2025-07-03T09:15:00Z',
    },
  ],
};

const MOCK_REQUIREMENTS: Record<string, DemandeRequirement[]> = {
  'dem-2025-0001234': [
    {
      id: 'req-001',
      demandeId: 'dem-2025-0001234',
      requirementId: 'req-def-001',
      label: 'Ancienne carte consulaire',
      type: 'DOCUMENT',
      status: RequirementStatus.ACCEPTED,
      providedValue: null,
      providedDocumentId: 'doc-001',
      reviewerNote: 'Carte valide, scan clair',
      reviewedBy: 'agent-002-fatima',
      reviewedAt: '2025-07-02T16:00:00Z',
    },
    {
      id: 'req-002',
      demandeId: 'dem-2025-0001234',
      requirementId: 'req-def-002',
      label: 'Passeport valide',
      type: 'DOCUMENT',
      status: RequirementStatus.ACCEPTED,
      providedValue: null,
      providedDocumentId: 'doc-002',
      reviewerNote: 'Passeport valide jusqu\'au 2028',
      reviewedBy: 'agent-002-fatima',
      reviewedAt: '2025-07-02T16:30:00Z',
    },
    {
      id: 'req-003',
      demandeId: 'dem-2025-0001234',
      requirementId: 'req-def-003',
      label: 'Certificat de scolarité',
      type: 'DOCUMENT',
      status: RequirementStatus.PENDING,
      providedValue: null,
      providedDocumentId: null,
      reviewerNote: null,
      reviewedBy: null,
      reviewedAt: null,
    },
  ],
};

// ============================================================
// INTERFACE
// ============================================================

interface DemandeState {
  demandes: Demande[];
  selectedDemande: Demande | null;
  histories: DemandeHistory[];
  comments: DemandeComment[];
  requirements: DemandeRequirement[];
  filters: DemandeFilters;
  stats: {
    total: number;
    byStatus: Record<AppStatus, number>;
    overdue: number;
    urgent: number;
  };
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchDemandes: (filters?: DemandeFilters) => Promise<void>;
  fetchDemandeById: (id: string) => Promise<Demande | null>;
  createDemande: (data: Partial<Demande>) => Promise<Demande>;
  updateStatus: (id: string, payload: TraitementPayload) => Promise<void>;
  assignAgent: (id: string, payload: AssignationPayload) => Promise<void>;
  addComment: (demandeId: string, content: string, isInternal: boolean) => Promise<void>;
  fetchHistory: (demandeId: string) => Promise<void>;
  fetchComments: (demandeId: string) => Promise<void>;
  fetchRequirements: (demandeId: string) => Promise<void>;
  validateRequirement: (requirementId: string, status: RequirementStatus, note?: string) => Promise<void>;
  setFilters: (filters: DemandeFilters) => void;
  setSelectedDemande: (demande: Demande | null) => void;
  getStats: () => void;
}

// ============================================================
// IMPLEMENTATION
// ============================================================

export const useDemandeStore = create<DemandeState>()((set, get) => ({
  // État initial
  demandes: MOCK_DEMANDES,
  selectedDemande: null,
  histories: [],
  comments: [],
  requirements: [],
  filters: {},
  stats: {
    total: 0,
    byStatus: {} as Record<AppStatus, number>,
    overdue: 0,
    urgent: 0,
  },
  isLoading: false,
  error: null,
  
  /**
   * FETCH DEMANDES
   * Backend: GET /api/demandes
   * Query: filtres (status, priority, assignedAgentId, dateFrom, dateTo, search...)
   * Response: { data: Demande[], meta: PaginationMeta }
   */
  fetchDemandes: async (filters = {}) => {
    set({ isLoading: true, error: null, filters: { ...get().filters, ...filters } });
    
    try {
      // SIMULATION DÉLAI
      await new Promise((r) => setTimeout(r, 600));
      
      // VRAIE IMPLÉMENTATION:
      // const { data } = await api.get('/demandes', { params: { ...get().filters, ...filters } });
      // set({ demandes: data.data, isLoading: false });
      
      // MOCK: Filtrage local
      let filtered = [...MOCK_DEMANDES];
      const mergedFilters = { ...get().filters, ...filters };
      
      if (mergedFilters.status) {
        filtered = filtered.filter((d) => d.status === mergedFilters.status);
      }
      if (mergedFilters.priority) {
        filtered = filtered.filter((d) => d.priority === mergedFilters.priority);
      }
      if (mergedFilters.assignedAgentId) {
        filtered = filtered.filter((d) => d.assignedAgentId === mergedFilters.assignedAgentId);
      }
      if (mergedFilters.subServiceId) {
        filtered = filtered.filter((d) => d.subServiceId === mergedFilters.subServiceId);
      }
      if (mergedFilters.search) {
        const search = mergedFilters.search.toLowerCase();
        filtered = filtered.filter(
          (d) =>
            d.dossierNumber.toLowerCase().includes(search) ||
            d.user.profile?.firstName.toLowerCase().includes(search) ||
            d.user.profile?.lastName.toLowerCase().includes(search) ||
            d.user.profile?.inue?.toLowerCase().includes(search)
        );
      }
      if (mergedFilters.isOverdue) {
        const now = new Date().toISOString();
        filtered = filtered.filter((d) => d.deadlineAt && d.deadlineAt < now && d.status !== AppStatus.COMPLETED);
      }
      
      set({ demandes: filtered, isLoading: false });
      get().getStats();
      
    } catch (err) {
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : 'Erreur de chargement des demandes',
      });
    }
  },
  
  /**
   * FETCH DEMANDE BY ID
   * Backend: GET /api/demandes/:id
   * Response: { data: Demande }
   */
  fetchDemandeById: async (id) => {
    set({ isLoading: true, error: null });
    
    try {
      await new Promise((r) => setTimeout(r, 400));
      
      // VRAIE IMPLÉMENTATION:
      // const { data } = await api.get(`/demandes/${id}`);
      // set({ selectedDemande: data.data, isLoading: false });
      // return data.data;
      
      const demande = MOCK_DEMANDES.find((d) => d.id === id) || null;
      set({ selectedDemande: demande, isLoading: false });
      
      if (demande) {
        // Charger les données liées
        get().fetchHistory(id);
        get().fetchComments(id);
        get().fetchRequirements(id);
      }
      
      return demande;
      
    } catch (err) {
      set({ isLoading: false, error: 'Demande introuvable' });
      return null;
    }
  },
  
  /**
   * CREATE DEMANDE
   * Backend: POST /api/demandes
   * Body: { userId, subServiceId, customPayload?, documents[] }
   * Auto-génère le dossierNumber (format: DEM-YYYY-XXXXXXX)
   */
  createDemande: async (data) => {
    set({ isLoading: true, error: null });
    
    try {
      await new Promise((r) => setTimeout(r, 700));
      
      // VRAIE IMPLÉMENTATION:
      // const { data: response } = await api.post('/demandes', data);
      // return response.data;
      
      const year = new Date().getFullYear();
      const seq = String(get().demandes.length + 1).padStart(7, '0');
      
      const newDemande: Demande = {
        id: `dem-${Date.now()}`,
        userId: data.userId!,
        user: MOCK_ETUDIANT, // Récupérer le vrai user
        subServiceId: data.subServiceId!,
        subService: MOCK_SUB_SERVICE, // Récupérer le vrai service
        assignedAgentId: null,
        assignedAgent: null,
        dossierNumber: `DEM-${year}-${seq}`,
        status: AppStatus.SUBMITTED,
        priority: data.priority || Priority.NORMAL,
        totalAmount: data.totalAmount ?? null,
        currency: data.currency ?? null,
        customPayload: data.customPayload ?? null,
        submittedAt: new Date().toISOString(),
        assignedAt: null,
        deadlineAt: null,
        completedAt: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      set((state) => ({
        demandes: [newDemande, ...state.demandes],
        isLoading: false,
      }));
      
      return newDemande;
      
    } catch (err) {
      set({ isLoading: false, error: 'Erreur de création' });
      throw err;
    }
  },
  
  /**
   * UPDATE STATUS (traitement par agent)
   * Backend: PATCH /api/demandes/:id/status
   * Body: { status, comment, isVisibleToUser, assignedAgentId? }
   * 
   * Workflow:
   * - SUBMITTED → IN_REVIEW: Prise en charge
   * - IN_REVIEW → ADDITIONAL_INFO_REQUIRED: Documents manquants
   * - IN_REVIEW → APPROVED: Demande approuvée
   * - IN_REVIEW → REJECTED: Rejetée
   * - APPROVED → COMPLETED: Traitée et clôturée
   */
  updateStatus: async (id, payload) => {
    set({ isLoading: true, error: null });
    
    try {
      await new Promise((r) => setTimeout(r, 500));
      
      // VRAIE IMPLÉMENTATION:
      // await api.patch(`/demandes/${id}/status`, payload);
      
      const current = get().demandes.find((d) => d.id === id);
      if (!current) throw new Error('Demande introuvable' + id);
      
      const oldStatus = current.status;
      
      // Mise à jour de la demande
      set((state) => ({
        demandes: state.demandes.map((d) =>
          d.id === id
            ? {
                ...d,
                status: payload.status,
                assignedAgentId: payload.assignedAgentId ?? d.assignedAgentId,
                assignedAt: payload.assignedAgentId ? new Date().toISOString() : d.assignedAt,
                completedAt: payload.status === AppStatus.COMPLETED ? new Date().toISOString() : d.completedAt,
                updatedAt: new Date().toISOString(),
              }
            : d
        ),
        selectedDemande:
          state.selectedDemande?.id === id
            ? {
                ...state.selectedDemande,
                status: payload.status,
                updatedAt: new Date().toISOString(),
              }
            : state.selectedDemande,
        isLoading: false,
      }));
      
      // Ajouter à l'historique
      const newHistory: DemandeHistory = {
        id: `hist-${Date.now()}`,
        demandeId: id,
        fromStatus: oldStatus,
        toStatus: payload.status,
        actorUserId: 'current-user', // Récupéré du store auth
        actorRole: 'AGENT',
        actorName: 'Agent Courant',
        comment: payload.comment || `Changement de statut: ${oldStatus} → ${payload.status}`,
        isVisibleToUser: payload.isVisibleToUser,
        createdAt: new Date().toISOString(),
      };
      
      set((state) => ({
        histories: [...state.histories, newHistory],
      }));
      
      // Notification à l'étudiant si visible
      if (payload.isVisibleToUser) {
        console.log('[MOCK] Notification envoyée à l\'étudiant:', payload.status);
      }
      
    } catch (err) {
      set({ isLoading: false, error: 'Erreur de mise à jour' });
      throw err;
    }
  },
  
  /**
   * ASSIGN AGENT
   * Backend: POST /api/demandes/:id/assign
   * Body: { agentId, note? }
   */
  assignAgent: async (id, payload) => {
    set({ isLoading: true, error: null });
    
    try {
      await new Promise((r) => setTimeout(r, 400));
      
      // VRAIE IMPLÉMENTATION:
      // await api.post(`/demandes/${id}/assign`, payload);
      
      set((state) => ({
        demandes: state.demandes.map((d) =>
          d.id === id
            ? {
                ...d,
                assignedAgentId: payload.agentId,
                assignedAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              }
            : d
        ),
        isLoading: false,
      }));
      
    } catch (err) {
      set({ isLoading: false, error: 'Erreur d\'assignation' });
      throw err;
    }
  },
  
  /**
   * ADD COMMENT
   * Backend: POST /api/demandes/:id/comments
   * Body: { content, isInternal, attachments? }
   */
  addComment: async (demandeId, content, isInternal) => {
    set({ isLoading: true, error: null });
    
    try {
      await new Promise((r) => setTimeout(r, 300));
      
      // VRAIE IMPLÉMENTATION:
      // await api.post(`/demandes/${demandeId}/comments`, { content, isInternal });
      
      const newComment: DemandeComment = {
        id: `com-${Date.now()}`,
        demandeId,
        authorId: 'current-user',
        authorName: 'Agent Courant',
        authorType: 'AGENT',
        content,
        isInternal,
        attachments: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      set((state) => ({
        comments: [...state.comments, newComment],
        isLoading: false,
      }));
      
    } catch (err) {
      set({ isLoading: false, error: 'Erreur d\'ajout de commentaire' });
      throw err;
    }
  },
  
  /**
   * FETCH HISTORY
   * Backend: GET /api/demandes/:id/history
   */
  fetchHistory: async (demandeId) => {
    try {
      await new Promise((r) => setTimeout(r, 300));
      
      // VRAIE IMPLÉMENTATION:
      // const { data } = await api.get(`/demandes/${demandeId}/history`);
      // set({ histories: data.data });
      
      set({ histories: MOCK_HISTORIES[demandeId] || [] });
      
    } catch (err) {
      console.error('Erreur chargement historique:', err);
    }
  },
  
  /**
   * FETCH COMMENTS
   * Backend: GET /api/demandes/:id/comments
   */
  fetchComments: async (demandeId) => {
    try {
      await new Promise((r) => setTimeout(r, 300));
      
      // VRAIE IMPLÉMENTATION:
      // const { data } = await api.get(`/demandes/${demandeId}/comments`);
      
      set({ comments: MOCK_COMMENTS[demandeId] || [] });
      
    } catch (err) {
      console.error('Erreur chargement commentaires:', err);
    }
  },
  
  /**
   * FETCH REQUIREMENTS
   * Backend: GET /api/demandes/:id/requirements
   */
  fetchRequirements: async (demandeId) => {
    try {
      await new Promise((r) => setTimeout(r, 300));
      
      // VRAIE IMPLÉMENTATION:
      // const { data } = await api.get(`/demandes/${demandeId}/requirements`);
      
      set({ requirements: MOCK_REQUIREMENTS[demandeId] || [] });
      
    } catch (err) {
      console.error('Erreur chargement exigences:', err);
    }
  },
  
  /**
   * VALIDATE REQUIREMENT
   * Backend: PATCH /api/demandes/:demandeId/requirements/:requirementId
   * Body: { status, note? }
   */
  validateRequirement: async (requirementId, status, note) => {
    set({ isLoading: true, error: null });
    
    try {
      await new Promise((r) => setTimeout(r, 400));
      
      // VRAIE IMPLÉMENTATION:
      // await api.patch(`/demandes/requirements/${requirementId}`, { status, note });
      
      set((state) => ({
        requirements: state.requirements.map((req) =>
          req.id === requirementId
            ? {
                ...req,
                status,
                reviewerNote: note || null,
                reviewedBy: 'current-user',
                reviewedAt: new Date().toISOString(),
              }
            : req
        ),
        isLoading: false,
      }));
      
    } catch (err) {
      set({ isLoading: false, error: 'Erreur de validation' });
      throw err;
    }
  },
  
  setFilters: (filters) => set({ filters: { ...get().filters, ...filters } }),
  setSelectedDemande: (demande) => set({ selectedDemande: demande }),
  
  /**
   * CALCUL DES STATISTIQUES
   * Backend: GET /api/demandes/stats (optionnel)
   * Ou calcul local
   */
  getStats: () => {
    const demandes = get().demandes;
    const now = new Date().toISOString();
    
    const byStatus = {} as Record<AppStatus, number>;
    Object.values(AppStatus).forEach((s) => (byStatus[s] = 0));
    demandes.forEach((d) => {
      byStatus[d.status] = (byStatus[d.status] || 0) + 1;
    });
    
    set({
      stats: {
        total: demandes.length,
        byStatus,
        overdue: demandes.filter(
          (d) => d.deadlineAt && d.deadlineAt < now && d.status !== AppStatus.COMPLETED
        ).length,
        urgent: demandes.filter((d) => d.priority === Priority.URGENT && d.status !== AppStatus.COMPLETED).length,
      },
    });
  },
}));