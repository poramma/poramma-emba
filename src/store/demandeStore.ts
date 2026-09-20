// ============================================================
// src/store/demandeStore.ts
// ============================================================

/**
 * STORE: Demandes consulaires
 * Backend: ambassade-api — tables `demandes`, `demande_requirements`,
 * `demande_documents`, `demande_histories`, `demande_comments`
 * Endpoints:
 *   - GET /demandes
 *   - GET /demandes/:id
 *   - POST /demandes
 *   - PATCH /demandes/:id/status
 *   - POST /demandes/:id/assign
 *   - GET /demandes/:id/history
 *   - GET /demandes/:id/comments
 *   - POST /demandes/:id/comments
 *   - GET /demandes/:id/requirements
 *   - PATCH /demandes/requirements/:requirementId
 */

import { create } from 'zustand';
import { api } from '../lib/api';
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
  demandes: [],
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

  /** GET /demandes */
  fetchDemandes: async (filters = {}) => {
    const mergedFilters = { ...get().filters, ...filters };
    set({ isLoading: true, error: null, filters: mergedFilters });

    try {
      const { data } = await api.get('/demandes', { params: mergedFilters });
      set({ demandes: data.data, isLoading: false });
      get().getStats();
    } catch (err) {
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : 'Erreur de chargement des demandes',
      });
    }
  },

  /** GET /demandes/:id */
  fetchDemandeById: async (id) => {
    set({ isLoading: true, error: null });

    try {
      const { data } = await api.get(`/demandes/${id}`);
      const demande: Demande = data.data;
      set({ selectedDemande: demande, isLoading: false });

      get().fetchHistory(id);
      get().fetchComments(id);
      get().fetchRequirements(id);

      return demande;
    } catch (err) {
      set({ isLoading: false, error: 'Demande introuvable' });
      return null;
    }
  },

  /** POST /demandes — le backend génère dossierNumber, deadlineAt et seed les requirements. */
  createDemande: async (data) => {
    set({ isLoading: true, error: null });

    try {
      const { data: response } = await api.post('/demandes', data);
      const newDemande: Demande = response.data;

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

  /** PATCH /demandes/:id/status */
  updateStatus: async (id, payload) => {
    set({ isLoading: true, error: null });

    try {
      const { data: response } = await api.patch(`/demandes/${id}/status`, payload);
      const updated: Demande = response.data;

      set((state) => ({
        demandes: state.demandes.map((d) => (d.id === id ? updated : d)),
        selectedDemande: state.selectedDemande?.id === id ? updated : state.selectedDemande,
        isLoading: false,
      }));

      get().fetchHistory(id);
    } catch (err) {
      set({ isLoading: false, error: 'Erreur de mise à jour' });
      throw err;
    }
  },

  /** POST /demandes/:id/assign */
  assignAgent: async (id, payload) => {
    set({ isLoading: true, error: null });

    try {
      const { data: response } = await api.post(`/demandes/${id}/assign`, payload);
      const updated: Demande = response.data;

      set((state) => ({
        demandes: state.demandes.map((d) => (d.id === id ? updated : d)),
        selectedDemande: state.selectedDemande?.id === id ? updated : state.selectedDemande,
        isLoading: false,
      }));
    } catch (err) {
      set({ isLoading: false, error: "Erreur d'assignation" });
      throw err;
    }
  },

  /** POST /demandes/:id/comments */
  addComment: async (demandeId, content, isInternal) => {
    set({ isLoading: true, error: null });

    try {
      const { data: response } = await api.post(`/demandes/${demandeId}/comments`, { content, isInternal });
      const newComment: DemandeComment = response.data;

      set((state) => ({
        comments: [...state.comments, newComment],
        isLoading: false,
      }));
    } catch (err) {
      set({ isLoading: false, error: "Erreur d'ajout de commentaire" });
      throw err;
    }
  },

  /** GET /demandes/:id/history */
  fetchHistory: async (demandeId) => {
    try {
      const { data } = await api.get(`/demandes/${demandeId}/history`);
      set({ histories: data.data });
    } catch (err) {
      console.error('Erreur chargement historique:', err);
    }
  },

  /** GET /demandes/:id/comments */
  fetchComments: async (demandeId) => {
    try {
      const { data } = await api.get(`/demandes/${demandeId}/comments`);
      set({ comments: data.data });
    } catch (err) {
      console.error('Erreur chargement commentaires:', err);
    }
  },

  /** GET /demandes/:id/requirements */
  fetchRequirements: async (demandeId) => {
    try {
      const { data } = await api.get(`/demandes/${demandeId}/requirements`);
      set({ requirements: data.data });
    } catch (err) {
      console.error('Erreur chargement exigences:', err);
    }
  },

  /** PATCH /demandes/requirements/:requirementId */
  validateRequirement: async (requirementId, status, note) => {
    set({ isLoading: true, error: null });

    try {
      const { data: response } = await api.patch(`/demandes/requirements/${requirementId}`, { status, note });
      const updated: DemandeRequirement = response.data;

      set((state) => ({
        requirements: state.requirements.map((req) => (req.id === requirementId ? updated : req)),
        isLoading: false,
      }));
    } catch (err) {
      set({ isLoading: false, error: 'Erreur de validation' });
      throw err;
    }
  },

  setFilters: (filters) => set({ filters: { ...get().filters, ...filters } }),
  setSelectedDemande: (demande) => set({ selectedDemande: demande }),

  /** Calcul local des statistiques (pas d'endpoint dédié). */
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
