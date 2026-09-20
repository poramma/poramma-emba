// src/store/supportTicketsStore.ts
//
// Tickets de support des usagers, traités par l'administrateur
// (ambassade-api /support-tickets) : file paginée avec compteurs, fil d'un
// ticket, réponse / note interne, statut, priorité, assignation.

import { create } from 'zustand';
import { api } from '../lib/api';

export type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'WAITING_USER' | 'RESOLVED' | 'CLOSED';
export type TicketPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
export type TicketCategory = 'ACCOUNT' | 'DEMANDE' | 'RENDEZ_VOUS' | 'REGISTRATION' | 'TECHNICAL' | 'OTHER';

export interface TicketRequester {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  inue: string | null;
}

export interface SupportTicketListItem {
  id: string;
  reference: string;
  subject: string;
  category: TicketCategory;
  linkedReference: string | null;
  status: TicketStatus;
  priority: TicketPriority;
  requester: TicketRequester;
  assignee: { id: string; name: string | null } | null;
  createdAt: string;
  lastMessageAt: string;
  lastMessageBy: 'USER' | 'STAFF';
  firstResponseAt: string | null;
  resolvedAt: string | null;
  closedAt: string | null;
}

export interface TicketMessage {
  id: string;
  authorType: 'USER' | 'STAFF' | 'SYSTEM';
  authorName: string | null;
  content: string;
  isInternal: boolean;
  createdAt: string;
}

export interface SupportTicketDetail extends SupportTicketListItem {
  messages: TicketMessage[];
}

export interface TicketStats {
  open: number;
  inProgress: number;
  waitingUser: number;
  resolved: number;
  closed: number;
  unassigned: number;
  mine: number;
}

export interface TicketMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  stats: TicketStats;
}

export interface TicketFilters {
  status?: string; // un statut ou ACTIVE
  category?: string;
  priority?: string;
  assigned?: string; // me | unassigned | id
  search?: string;
  page?: number;
  limit?: number;
}

interface SupportTicketsState {
  tickets: SupportTicketListItem[];
  meta: TicketMeta | null;
  assignees: { id: string; name: string }[];
  isLoading: boolean;

  fetchTickets: (filters: TicketFilters) => Promise<void>;
  fetchAssignees: () => Promise<void>;
  getTicket: (id: string) => Promise<SupportTicketDetail>;
  reply: (id: string, content: string, isInternal: boolean) => Promise<SupportTicketDetail>;
  update: (id: string, patch: { status?: TicketStatus; priority?: TicketPriority; assignedTo?: string | null }) => Promise<SupportTicketDetail>;
}

export const useSupportTicketsStore = create<SupportTicketsState>((set, get) => ({
  tickets: [],
  meta: null,
  assignees: [],
  isLoading: false,

  fetchTickets: async (filters) => {
    set({ isLoading: true });
    try {
      const params: Record<string, unknown> = { page: filters.page ?? 1, limit: filters.limit ?? 20 };
      for (const key of ['status', 'category', 'priority', 'assigned'] as const) if (filters[key]) params[key] = filters[key];
      if (filters.search?.trim()) params.search = filters.search.trim();
      const { data } = await api.get('/support-tickets', { params });
      set({ tickets: data.data, meta: data.meta, isLoading: false });
    } catch (err) {
      console.error('Erreur chargement des tickets:', err);
      set({ isLoading: false });
    }
  },

  fetchAssignees: async () => {
    if (get().assignees.length) return;
    try {
      const { data } = await api.get('/support-tickets/assignees');
      set({ assignees: data.data });
    } catch (err) {
      console.error('Erreur chargement des administrateurs:', err);
    }
  },

  getTicket: async (id) => {
    const { data } = await api.get(`/support-tickets/${id}`);
    return data.data;
  },

  reply: async (id, content, isInternal) => {
    const { data } = await api.post(`/support-tickets/${id}/messages`, { content, isInternal });
    return data.data;
  },

  update: async (id, patch) => {
    const { data } = await api.patch(`/support-tickets/${id}`, patch);
    return data.data;
  },
}));

// ── Libellés (français, jamais de code brut affiché) ──

export const TICKET_STATUS_LABELS: Record<TicketStatus, string> = {
  OPEN: 'Ouvert',
  IN_PROGRESS: 'En cours',
  WAITING_USER: "En attente de l'usager",
  RESOLVED: 'Résolu',
  CLOSED: 'Clôturé',
};

export const TICKET_PRIORITY_LABELS: Record<TicketPriority, string> = {
  LOW: 'Basse',
  NORMAL: 'Normale',
  HIGH: 'Haute',
  URGENT: 'Urgente',
};

export const TICKET_CATEGORY_LABELS: Record<TicketCategory, string> = {
  ACCOUNT: 'Compte et connexion',
  DEMANDE: 'Une demande',
  RENDEZ_VOUS: 'Un rendez-vous',
  REGISTRATION: 'Enregistrement / INUE',
  TECHNICAL: 'Problème technique',
  OTHER: 'Autre question',
};
