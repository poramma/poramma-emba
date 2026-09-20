// src/lib/receptionApi.ts
//
// Poste d'accueil (ambassade-api /reception) : validation des tickets de rendez-vous et registre des
// demandes formulées sur place.

import { api } from './api';

export interface ReceptionTicket {
  id: string;
  ticketId: string;
  date: string;
  startTime: string | null;
  endTime: string | null;
  status: string;
  type: string;
  isUrgent: boolean;
  motif: string | null;
  checkedInAt: string | null;
  subServiceName: string;
  citizen: { id: string | null; name: string; inue: string | null; phone: string | null; city: string | null; isVisitor: boolean };
  agentName: string | null;
}

export type WalkInStatus = 'WAITING' | 'IN_SERVICE' | 'DONE' | 'REDIRECTED' | 'ABANDONED';
export type WalkInCategory = 'INFORMATION' | 'DEPOT' | 'RETRAIT' | 'SUIVI' | 'AUTRE';

export interface WalkIn {
  id: string;
  reference: string;
  visitorName: string;
  visitorPhone: string | null;
  member: { id: string; name: string; inue: string | null } | null;
  subService: { id: string; name: string } | null;
  category: WalkInCategory;
  subject: string;
  notes: string | null;
  status: WalkInStatus;
  priority: 'NORMAL' | 'URGENT';
  outcome: string | null;
  redirectedTo: { id: string; name: string } | null;
  demande: { id: string; dossierNumber: string | null } | null;
  registeredByName: string;
  createdAt: string;
  startedAt: string | null;
  closedAt: string | null;
}

export interface ReceptionSummary {
  date: string;
  rendezVous: { expected: number; arrived: number; total: number };
  walkIns: { waiting: number; inService: number; closed: number; total: number };
}

export interface MemberHit {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  inue: string | null;
}

export interface CreateUrgencePayload {
  subServiceId: string;
  motif: string;
  urgenceJustification: string;
  /** Membre de la plateforme… */
  userId?: string | null;
  /** …ou personne sans compte : identité minimale. */
  visitor?: { lastName: string; firstName: string; phone: string; city: string } | null;
}

export interface CreateWalkInPayload {
  visitorName?: string;
  visitorPhone?: string | null;
  userId?: string | null;
  subServiceId?: string | null;
  category: WalkInCategory;
  subject: string;
  notes?: string | null;
  priority?: 'NORMAL' | 'URGENT';
}

export const receptionApi = {
  async summary(): Promise<ReceptionSummary> {
    const { data } = await api.get('/reception/summary');
    return data.data;
  },
  async appointments(params: { date?: string; q?: string } = {}): Promise<ReceptionTicket[]> {
    const { data } = await api.get('/reception/appointments', { params: { date: params.date || undefined, q: params.q || undefined } });
    return data.data;
  },
  async lookup(ticket: string): Promise<ReceptionTicket> {
    const { data } = await api.get('/reception/appointments/lookup', { params: { ticket } });
    return data.data;
  },
  async validate(id: string): Promise<ReceptionTicket> {
    const { data } = await api.post(`/reception/appointments/${id}/validate`);
    return data.data;
  },
  async walkIns(params: { date?: string; status?: string; q?: string } = {}): Promise<WalkIn[]> {
    const { data } = await api.get('/reception/walk-ins', { params: { date: params.date || undefined, status: params.status || undefined, q: params.q || undefined } });
    return data.data;
  },
  async createWalkIn(payload: CreateWalkInPayload): Promise<WalkIn> {
    const { data } = await api.post('/reception/walk-ins', payload);
    return data.data;
  },
  async updateWalkIn(id: string, patch: { status?: WalkInStatus; priority?: 'NORMAL' | 'URGENT'; notes?: string | null; outcome?: string | null; subServiceId?: string | null; redirectedSubServiceId?: string | null }): Promise<WalkIn> {
    const { data } = await api.patch(`/reception/walk-ins/${id}`, patch);
    return data.data;
  },
  async createUrgence(payload: CreateUrgencePayload): Promise<ReceptionTicket> {
    const { data } = await api.post('/reception/urgences', payload);
    return data.data;
  },
  async createDossier(id: string): Promise<WalkIn> {
    const { data } = await api.post(`/reception/walk-ins/${id}/create-dossier`);
    return data.data;
  },
  async searchMembers(q: string): Promise<MemberHit[]> {
    const { data } = await api.get('/reception/members', { params: { q } });
    return data.data;
  },
};

export const WALKIN_STATUS_LABELS: Record<WalkInStatus, string> = {
  WAITING: 'En attente',
  IN_SERVICE: 'En cours',
  DONE: 'Traité',
  REDIRECTED: 'Orienté',
  ABANDONED: 'Parti sans être servi',
};

export const WALKIN_STATUS_COLOR: Record<WalkInStatus, 'warning' | 'primary' | 'success' | 'info' | 'gray'> = {
  WAITING: 'warning',
  IN_SERVICE: 'primary',
  DONE: 'success',
  REDIRECTED: 'info',
  ABANDONED: 'gray',
};

export const WALKIN_CATEGORY_LABELS: Record<WalkInCategory, string> = {
  INFORMATION: 'Renseignement',
  DEPOT: 'Dépôt de dossier / documents',
  RETRAIT: 'Retrait de document',
  SUIVI: 'Suivi de dossier',
  AUTRE: 'Autre',
};

export const TICKET_STATUS_LABELS: Record<string, { label: string; color: 'warning' | 'success' | 'primary' | 'gray' | 'error' }> = {
  PENDING: { label: 'Attendu', color: 'warning' },
  CONFIRMED: { label: 'Attendu (confirmé)', color: 'warning' },
  CHECKED_IN: { label: 'Arrivé', color: 'success' },
  IN_PROGRESS: { label: 'En cours', color: 'primary' },
  COMPLETED: { label: 'Terminé', color: 'gray' },
  CANCELLED_BY_USER: { label: 'Annulé', color: 'error' },
  CANCELLED_BY_AGENT: { label: 'Annulé', color: 'error' },
  NO_SHOW: { label: 'Absent', color: 'error' },
  MISSED: { label: 'Manqué', color: 'error' },
};

export const apiErrorMessage = (err: unknown, fallback: string): string =>
  (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? fallback;
