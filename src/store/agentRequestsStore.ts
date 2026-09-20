// src/store/agentRequestsStore.ts
//
// Demandes d'accès et signalements adressés par les agents à l'administrateur
// (ambassade-api /agent-requests). Côté agent : créer + suivre les siennes ;
// côté administrateur : liste paginée + traitement.

import { create } from 'zustand';
import { api } from '../lib/api';

export type AgentRequestKind = 'ACCESS_REQUEST' | 'REPORT';
export type AgentRequestStatus = 'PENDING' | 'IN_PROGRESS' | 'APPROVED' | 'REJECTED' | 'RESOLVED';
export type AgentRequestCategory =
  | 'SERVICE_ACCESS'
  | 'PERMISSION_CHANGE'
  | 'ROLE_CHANGE'
  | 'ASSIGNMENT_ISSUE'
  | 'PERMISSION_ISSUE'
  | 'DATA_ISSUE'
  | 'SECURITY'
  | 'OTHER';

export interface AgentRequest {
  id: string;
  kind: AgentRequestKind;
  category: AgentRequestCategory;
  subject: string;
  description: string;
  status: AgentRequestStatus;
  targetSubServiceId: string | null;
  targetPermission: string | null;
  adminResponse: string | null;
  handledAt: string | null;
  createdAt: string;
  requester: { id: string; name: string | null; email: string | null };
  handledByName: string | null;
  targetSubService: { id: string; name: string } | null;
}

export interface CreateAgentRequestPayload {
  kind: AgentRequestKind;
  category: AgentRequestCategory;
  subject: string;
  description: string;
  targetSubServiceId?: string;
  targetPermission?: string;
}

export interface AgentRequestFilters {
  status?: AgentRequestStatus | '';
  kind?: AgentRequestKind | '';
  search?: string;
  page?: number;
  limit?: number;
}

interface AgentRequestsMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  openCount?: number;
}

interface AgentRequestsState {
  mine: AgentRequest[];
  all: AgentRequest[];
  meta: AgentRequestsMeta | null;
  isLoading: boolean;

  fetchMine: () => Promise<void>;
  create: (payload: CreateAgentRequestPayload) => Promise<AgentRequest>;
  fetchAll: (filters: AgentRequestFilters) => Promise<void>;
  process: (id: string, data: { status: 'IN_PROGRESS' | 'APPROVED' | 'REJECTED' | 'RESOLVED'; response?: string; applyAssignment?: boolean }) => Promise<AgentRequest>;
}

export const useAgentRequestsStore = create<AgentRequestsState>((set) => ({
  mine: [],
  all: [],
  meta: null,
  isLoading: false,

  fetchMine: async () => {
    try {
      const { data } = await api.get('/agent-requests/mine');
      set({ mine: data.data });
    } catch (err) {
      console.error('Erreur chargement de mes demandes:', err);
    }
  },

  create: async (payload) => {
    const { data } = await api.post('/agent-requests', payload);
    const created: AgentRequest = data.data;
    set((state) => ({ mine: [created, ...state.mine] }));
    return created;
  },

  fetchAll: async (filters) => {
    set({ isLoading: true });
    try {
      const params: Record<string, unknown> = { page: filters.page ?? 1, limit: filters.limit ?? 20 };
      if (filters.status) params.status = filters.status;
      if (filters.kind) params.kind = filters.kind;
      if (filters.search?.trim()) params.search = filters.search.trim();
      const { data } = await api.get('/agent-requests', { params });
      set({ all: data.data, meta: data.meta, isLoading: false });
    } catch (err) {
      console.error('Erreur chargement des demandes des agents:', err);
      set({ isLoading: false });
    }
  },

  process: async (id, payload) => {
    const { data } = await api.patch(`/agent-requests/${id}`, payload);
    const updated: AgentRequest = data.data;
    set((state) => ({ all: state.all.map((r) => (r.id === id ? { ...r, ...updated } : r)) }));
    return updated;
  },
}));

// ── Libellés (français, jamais de code brut affiché) ──

export const REQUEST_KIND_LABELS: Record<AgentRequestKind, string> = {
  ACCESS_REQUEST: "Demande d'accès",
  REPORT: 'Signalement',
};

export const REQUEST_STATUS_LABELS: Record<AgentRequestStatus, string> = {
  PENDING: 'En attente',
  IN_PROGRESS: 'Prise en charge',
  APPROVED: 'Acceptée',
  REJECTED: 'Refusée',
  RESOLVED: 'Résolue',
};

export const REQUEST_CATEGORY_LABELS: Record<AgentRequestCategory, string> = {
  SERVICE_ACCESS: 'Accès à un service',
  PERMISSION_CHANGE: 'Modification de permissions',
  ROLE_CHANGE: 'Changement de rôle',
  ASSIGNMENT_ISSUE: "Problème d'affectation",
  PERMISSION_ISSUE: 'Problème de permissions',
  DATA_ISSUE: 'Problème de données',
  SECURITY: 'Sécurité',
  OTHER: 'Autre',
};

export const ACCESS_CATEGORIES: AgentRequestCategory[] = ['SERVICE_ACCESS', 'PERMISSION_CHANGE', 'ROLE_CHANGE', 'OTHER'];
export const REPORT_CATEGORIES: AgentRequestCategory[] = ['ASSIGNMENT_ISSUE', 'PERMISSION_ISSUE', 'DATA_ISSUE', 'SECURITY', 'OTHER'];
