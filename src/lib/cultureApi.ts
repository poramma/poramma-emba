// src/lib/cultureApi.ts
//
// Espace du Conseiller Culturel (ambassade-api /culture) : tableau de bord, échanges directs
// avec les membres de la communauté (à visage découvert), rendez-vous et demandes culturels.

import { api } from './api';

export type CultureThreadStatus = 'OPEN' | 'ANSWERED' | 'CLOSED';

export interface CultureRequester {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  inue: string | null;
}

export interface CultureThreadItem {
  id: string;
  reference: string;
  subject: string;
  status: CultureThreadStatus;
  requester: CultureRequester;
  advisor: { id: string; name: string | null } | null;
  createdAt: string;
  lastMessageAt: string;
  lastMessageBy: 'USER' | 'ADVISOR';
  closedAt: string | null;
}

export interface CultureMessage {
  id: string;
  authorType: 'USER' | 'ADVISOR' | 'SYSTEM';
  authorName: string | null;
  content: string;
  isInternal: boolean;
  createdAt: string;
}

export interface CultureThreadDetail extends CultureThreadItem {
  messages: CultureMessage[];
}

export interface CultureThreadStats {
  open: number;
  answered: number;
  closed: number;
}

export interface CultureThreadsPage {
  data: CultureThreadItem[];
  meta: { page: number; limit: number; total: number; totalPages: number; stats: CultureThreadStats };
}

export interface CultureRendezVous {
  id: string;
  ticketId: string;
  date: string;
  startTime: string | null;
  status: string;
  motif: string | null;
  subServiceName: string;
  requester: CultureRequester;
}

export interface CultureDemande {
  id: string;
  dossierNumber: string;
  status: string;
  submittedAt: string | null;
  deadlineAt: string | null;
  subServiceName: string;
  requester: CultureRequester;
  payload: Record<string, unknown> | null;
}

export interface CultureOverview {
  advisors: { name: string; title: string }[];
  stats: {
    threadsToHandle: number;
    threadsAnswered: number;
    rendezVousToday: number;
    rendezVousUpcoming: number;
    demandesOpen: number;
  };
  upcomingRendezVous: CultureRendezVous[];
  openDemandes: CultureDemande[];
}

export const cultureApi = {
  async overview(): Promise<CultureOverview> {
    const { data } = await api.get('/culture/overview');
    return data.data;
  },

  async listThreads(params: { status?: string; search?: string; page?: number; limit?: number }): Promise<CultureThreadsPage> {
    const { data } = await api.get('/culture/threads', { params: { ...params, status: params.status || undefined, search: params.search || undefined } });
    return { data: data.data, meta: data.meta };
  },

  async getThread(id: string): Promise<CultureThreadDetail> {
    const { data } = await api.get(`/culture/threads/${id}`);
    return data.data;
  },

  async reply(id: string, content: string, isInternal: boolean): Promise<CultureThreadDetail> {
    const { data } = await api.post(`/culture/threads/${id}/messages`, { content, isInternal });
    return data.data;
  },

  async setStatus(id: string, status: 'OPEN' | 'CLOSED'): Promise<CultureThreadDetail> {
    const { data } = await api.patch(`/culture/threads/${id}`, { status });
    return data.data;
  },

  /** Confirme, termine ou annule un rendez-vous culturel (mêmes statuts que l'agenda). */
  async setRendezVousStatus(id: string, status: 'CONFIRMED' | 'COMPLETED' | 'CANCELLED_BY_AGENT' | 'NO_SHOW'): Promise<void> {
    await api.patch(`/rendez-vous/${id}/status`, { status });
  },
};

export const THREAD_STATUS_LABELS: Record<CultureThreadStatus, string> = {
  OPEN: 'À traiter',
  ANSWERED: 'Répondu',
  CLOSED: 'Clos',
};

export const THREAD_STATUS_COLOR: Record<CultureThreadStatus, 'error' | 'info' | 'gray'> = {
  OPEN: 'error',
  ANSWERED: 'info',
  CLOSED: 'gray',
};

/** Message d'erreur lisible d'une réponse d'API (le backend renvoie déjà des textes français). */
export const apiErrorMessage = (err: unknown, fallback: string): string =>
  (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? fallback;
