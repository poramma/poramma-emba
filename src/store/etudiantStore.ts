// ============================================================
// src/store/etudiantStore.ts
// ============================================================

/**
 * STORE: Gestion des étudiants (validation consulaire, INUE)
 * Backend: services/ambassade-api/src/modules/etudiants/
 * Endpoints:
 *   - GET /etudiants
 *   - GET /etudiants/:id
 *   - GET /etudiants/search?q=
 *   - GET /etudiants/:id/documents
 *   - GET /etudiants/:id/audit
 *   - POST /etudiants/:id/validate
 *   - POST /etudiants/:id/reject
 *   - POST /etudiants/:id/suspend
 *   - POST /etudiants/:id/assign-inue
 *   - POST /etudiants/estimate
 */

import { create } from 'zustand';
import { api } from '../lib/api';
import { Etudiant, EtudiantFilters, EtudiantStatus, EtudiantsEstimate, InueAssignment } from '../types/etudiant';
import { DocumentGED } from '../types/document';
import { PaginationMeta } from '../types/api';

interface AuditLogEntry {
  id: string;
  at: string;
  actorUserId: string | null;
  actorName: string | null;
  actorRole: string | null;
  action: string;
  result: string;
  severity: string;
  details: Record<string, unknown> | null;
}

interface EtudiantStats {
  total: number;
  byStatus: Record<EtudiantStatus, number>;
  validated: number;
  pending: number;
  withBourse: number;
  withInue: number;
}

interface EtudiantState {
  etudiants: Etudiant[];
  selectedEtudiant: Etudiant | null;
  documents: DocumentGED[];
  auditLogs: AuditLogEntry[];
  isLoading: boolean;
  error: string | null;
  meta: PaginationMeta | null;
  filters: EtudiantFilters;
  stats: EtudiantStats;

  fetchEtudiants: (filters?: EtudiantFilters) => Promise<void>;
  fetchEtudiantById: (id: string) => Promise<Etudiant | null>;
  searchEtudiants: (query: string) => Promise<Etudiant[]>;
  fetchDocuments: (id: string) => Promise<void>;
  fetchAudit: (id: string) => Promise<void>;
  validateEtudiant: (id: string, comment?: string) => Promise<Etudiant>;
  rejectEtudiant: (id: string, reason: string) => Promise<Etudiant>;
  suspendEtudiant: (id: string, reason: string) => Promise<Etudiant>;
  assignInue: (id: string) => Promise<Etudiant & { inueAssignment: InueAssignment }>;
  estimateEtudiants: (filters?: Partial<EtudiantFilters>) => Promise<EtudiantsEstimate>;

  setFilters: (filters: EtudiantFilters) => void;
  resetFilters: () => void;
  setSelectedEtudiant: (etudiant: Etudiant | null) => void;
  getStats: () => void;
}

export const useEtudiantStore = create<EtudiantState>()((set, get) => ({
  etudiants: [],
  selectedEtudiant: null,
  documents: [],
  auditLogs: [],
  isLoading: false,
  error: null,
  meta: null,
  filters: {},
  stats: {
    total: 0,
    byStatus: {} as Record<EtudiantStatus, number>,
    validated: 0,
    pending: 0,
    withBourse: 0,
    withInue: 0,
  },

  fetchEtudiants: async (filters) => {
    set({ isLoading: true, error: null });
    try {
      const activeFilters = filters ?? get().filters;
      const { data } = await api.get('/etudiants', { params: activeFilters });
      set({ etudiants: data.data, meta: data.meta, filters: activeFilters, isLoading: false });
      get().getStats();
    } catch (err) {
      set({ isLoading: false, error: err instanceof Error ? err.message : 'Erreur de chargement des étudiants' });
    }
  },

  fetchEtudiantById: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await api.get(`/etudiants/${id}`);
      set({ selectedEtudiant: data.data, isLoading: false });
      get().fetchDocuments(id);
      return data.data;
    } catch (err) {
      set({ isLoading: false, error: err instanceof Error ? err.message : 'Étudiant introuvable' });
      return null;
    }
  },

  searchEtudiants: async (query: string) => {
    if (!query.trim()) return [];
    const { data } = await api.get('/etudiants/search', { params: { q: query } });
    return data.data;
  },

  fetchDocuments: async (id: string) => {
    try {
      const { data } = await api.get(`/etudiants/${id}/documents`);
      set({ documents: data.data });
    } catch (err) {
      console.error('Erreur chargement documents:', err);
    }
  },

  fetchAudit: async (id: string) => {
    try {
      const { data } = await api.get(`/etudiants/${id}/audit`);
      set({ auditLogs: data.data });
    } catch (err) {
      console.error('Erreur chargement historique:', err);
    }
  },

  validateEtudiant: async (id: string, comment?: string) => {
    const { data } = await api.post(`/etudiants/${id}/validate`, { comment });
    set((state) => ({
      selectedEtudiant: state.selectedEtudiant?.id === id ? data.data : state.selectedEtudiant,
      etudiants: state.etudiants.map((e) => (e.id === id ? data.data : e)),
    }));
    get().getStats();
    return data.data;
  },

  rejectEtudiant: async (id: string, reason: string) => {
    const { data } = await api.post(`/etudiants/${id}/reject`, { reason });
    set((state) => ({
      selectedEtudiant: state.selectedEtudiant?.id === id ? data.data : state.selectedEtudiant,
      etudiants: state.etudiants.map((e) => (e.id === id ? data.data : e)),
    }));
    get().getStats();
    return data.data;
  },

  suspendEtudiant: async (id: string, reason: string) => {
    const { data } = await api.post(`/etudiants/${id}/suspend`, { reason });
    set((state) => ({
      selectedEtudiant: state.selectedEtudiant?.id === id ? data.data : state.selectedEtudiant,
      etudiants: state.etudiants.map((e) => (e.id === id ? data.data : e)),
    }));
    get().getStats();
    return data.data;
  },

  assignInue: async (id: string) => {
    const { data } = await api.post(`/etudiants/${id}/assign-inue`);
    set((state) => ({
      selectedEtudiant: state.selectedEtudiant?.id === id ? data.data : state.selectedEtudiant,
      etudiants: state.etudiants.map((e) => (e.id === id ? data.data : e)),
    }));
    return data.data;
  },

  estimateEtudiants: async (filters) => {
    const { data } = await api.post('/etudiants/estimate', filters ?? {});
    return data.data;
  },

  setFilters: (filters) => set({ filters }),
  resetFilters: () => set({ filters: {} }),
  setSelectedEtudiant: (etudiant) => set({ selectedEtudiant: etudiant }),

  getStats: () => {
    const etudiants = get().etudiants;
    const byStatus = {} as Record<EtudiantStatus, number>;
    Object.values(EtudiantStatus).forEach((s) => (byStatus[s] = 0));
    etudiants.forEach((e) => {
      byStatus[e.status] = (byStatus[e.status] || 0) + 1;
    });

    set({
      stats: {
        total: etudiants.length,
        byStatus,
        validated: byStatus[EtudiantStatus.VALIDATED] ?? 0,
        pending: byStatus[EtudiantStatus.PENDING] ?? 0,
        withBourse: etudiants.filter((e) => !!e.bourse).length,
        withInue: etudiants.filter((e) => !!e.inue).length,
      },
    });
  },
}));
