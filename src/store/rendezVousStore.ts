// ============================================================
// src/store/rendezVousStore.ts
// ============================================================

/**
 * STORE: Rendez-vous
 * Backend: ambassade-api — tables `rendez_vous`, `daily_schedule_prints`
 * (créneaux `agenda_slots` calculés à la volée, jamais matérialisés)
 * Endpoints:
 *   - GET  /agenda-slots
 *   - GET  /agenda-slots/:slotId
 *   - GET  /rendez-vous
 *   - POST /rendez-vous
 *   - POST /rendez-vous/urgence
 *   - PATCH /rendez-vous/:id/status
 *   - POST /rendez-vous/:id/check-in
 *   - POST /rendez-vous/:id/complete
 *   - POST /rendez-vous/:id/cancel
 *   - POST /rendez-vous/print-daily
 *   - GET  /rendez-vous/print-history
 *   - POST /rendez-vous/print/:id/reprint
 *   - GET  /rendez-vous/:id/notes
 *   - POST /rendez-vous/:id/notes
 */

import { create } from 'zustand';
import { api } from '../lib/api';
import { RendezVous, AgendaSlot, DailySchedulePrint, RendezVousNote, RDVType, RDVStatus, PrintFormat } from '../types';

// ============================================================
// INTERFACE DU STORE
// ============================================================

interface RendezVousState {
  slots: AgendaSlot[];
  rendezVous: RendezVous[];
  selectedDate: string;
  selectedAgentId: string | null;
  selectedSubServiceId: string | null;
  printHistory: DailySchedulePrint[];
  lastPrint: DailySchedulePrint | null;
  notes: RendezVousNote[];
  isLoading: boolean;
  error: string | null;

  fetchNotes: (rendezVousId: string) => Promise<void>;
  addNote: (rendezVousId: string, content: string, isInternal: boolean) => Promise<void>;

  fetchSlots: (date: string, subServiceId?: string, agentId?: string) => Promise<void>;
  fetchSlotById: (slotId: string) => Promise<AgendaSlot | undefined>;
  fetchRendezVous: (filters: RdvFilters) => Promise<void>;
  createRendezVous: (data: CreateRdvPayload) => Promise<RendezVous>;
  updateRendezVousStatus: (id: string, status: RDVStatus, comment?: string) => Promise<void>;
  cancelRendezVous: (id: string, reason: string) => Promise<void>;

  createUrgence: (data: CreateUrgencePayload) => Promise<RendezVous>;

  printDailySchedule: (params: PrintScheduleParams) => Promise<DailySchedulePrint>;
  fetchPrintHistory: (date: string) => Promise<void>;
  reprint: (printId: string) => Promise<DailySchedulePrint>;

  setSelectedDate: (date: string) => void;
  setSelectedAgent: (agentId: string | null) => void;
  setSelectedSubService: (subServiceId: string | null) => void;
  checkIn: (rdvId: string) => Promise<void>;
  completeRendezVous: (rdvId: string, notes?: string) => Promise<void>;
}

interface RdvFilters {
  date?: string;
  agentId?: string;
  subServiceId?: string;
  status?: RDVStatus;
  type?: RDVType;
  userId?: string;
  fromDate?: string;
  toDate?: string;
}

interface CreateRdvPayload {
  userId: string;
  subServiceId: string;
  // Le RDV se prend pour un service, pas un agent précis — l'agent réel est
  // dérivé server-side du slotId (voir memory poramma-backend-phase1).
  agentId?: string;
  slotId: string;
  motif?: string;
  demandeId?: string;
}

interface CreateUrgencePayload {
  userId: string;
  subServiceId: string;
  agentId: string;
  motif: string;
  urgenceJustification: string;
  demandeId?: string;
}

interface PrintScheduleParams {
  date: string;
  agentId?: string;
  subServiceId?: string;
  format: PrintFormat;
}

// ============================================================
// IMPLEMENTATION
// ============================================================

export const useRendezVousStore = create<RendezVousState>()((set, get) => ({
  slots: [],
  rendezVous: [],
  selectedDate: new Date().toISOString().split('T')[0],
  selectedAgentId: null,
  selectedSubServiceId: null,
  printHistory: [],
  lastPrint: null,
  notes: [],
  isLoading: false,
  error: null,

  /** GET /rendez-vous/:id/notes — espace d'échange demandeur ↔ agents (même modèle que les commentaires de demande). */
  fetchNotes: async (rendezVousId) => {
    try {
      const { data } = await api.get(`/rendez-vous/${rendezVousId}/notes`);
      set({ notes: data.data });
    } catch (err) {
      console.error('Erreur chargement notes:', err);
    }
  },

  /** POST /rendez-vous/:id/notes */
  addNote: async (rendezVousId, content, isInternal) => {
    set({ isLoading: true, error: null });

    try {
      const { data } = await api.post(`/rendez-vous/${rendezVousId}/notes`, { content, isInternal });
      const newNote: RendezVousNote = data.data;

      set((state) => ({ notes: [...state.notes, newNote], isLoading: false }));
    } catch (err) {
      set({ isLoading: false, error: "Erreur d'ajout de note" });
      throw err;
    }
  },

  /** GET /agenda-slots — croise service_schedules + agent_availabilities/exceptions + rendez_vous existants. */
  fetchSlots: async (date, subServiceId, agentId) => {
    set({ isLoading: true, error: null });

    try {
      const { data } = await api.get('/agenda-slots', { params: { date, subServiceId, agentId } });
      set({ slots: data.data, isLoading: false });
    } catch (err) {
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : 'Erreur de chargement des créneaux',
      });
    }
  },

  fetchSlotById: async (slotId) => {
    set({ isLoading: true, error: null });

    try {
      const { data } = await api.get(`/agenda-slots/${encodeURIComponent(slotId)}`);
      set({ isLoading: false });
      return data.data;
    } catch (err) {
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : 'Erreur de chargement du créneau',
      });
      return undefined;
    }
  },

  /** GET /rendez-vous */
  fetchRendezVous: async (filters) => {
    set({ isLoading: true, error: null });

    try {
      const { data } = await api.get('/rendez-vous', { params: filters });
      set({ rendezVous: data.data, isLoading: false });
    } catch (err) {
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : 'Erreur de chargement',
      });
    }
  },

  /** POST /rendez-vous */
  createRendezVous: async (data) => {
    set({ isLoading: true, error: null });

    try {
      const { data: response } = await api.post('/rendez-vous', data);
      const newRdv: RendezVous = response.data;

      set((state) => ({ rendezVous: [...state.rendezVous, newRdv], isLoading: false }));
      return newRdv;
    } catch (err) {
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : 'Erreur de création',
      });
      throw err;
    }
  },

  /** POST /rendez-vous/urgence — perm rdv:create-urgence */
  createUrgence: async (data) => {
    set({ isLoading: true, error: null });

    try {
      const { data: response } = await api.post('/rendez-vous/urgence', data);
      const newUrgence: RendezVous = response.data;

      set((state) => ({ rendezVous: [...state.rendezVous, newUrgence], isLoading: false }));
      return newUrgence;
    } catch (err) {
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : 'Erreur création urgence',
      });
      throw err;
    }
  },

  /** PATCH /rendez-vous/:id/status */
  updateRendezVousStatus: async (id, status, comment) => {
    set({ isLoading: true, error: null });

    try {
      const { data: response } = await api.patch(`/rendez-vous/${id}/status`, { status, comment });
      const updated: RendezVous = response.data;

      set((state) => ({
        rendezVous: state.rendezVous.map((r) => (r.id === id ? updated : r)),
        isLoading: false,
      }));
    } catch (err) {
      set({ isLoading: false, error: err instanceof Error ? err.message : 'Erreur' });
      throw err;
    }
  },

  /** POST /rendez-vous/:id/check-in */
  checkIn: async (rdvId) => {
    set({ isLoading: true, error: null });

    try {
      const { data: response } = await api.post(`/rendez-vous/${rdvId}/check-in`);
      const updated: RendezVous = response.data;

      set((state) => ({
        rendezVous: state.rendezVous.map((r) => (r.id === rdvId ? updated : r)),
        isLoading: false,
      }));
    } catch (err) {
      set({ isLoading: false, error: err instanceof Error ? err.message : 'Erreur' });
      throw err;
    }
  },

  /** POST /rendez-vous/:id/complete */
  completeRendezVous: async (rdvId, notes) => {
    set({ isLoading: true, error: null });

    try {
      const { data: response } = await api.post(`/rendez-vous/${rdvId}/complete`, { notes });
      const updated: RendezVous = response.data;

      set((state) => ({
        rendezVous: state.rendezVous.map((r) => (r.id === rdvId ? updated : r)),
        isLoading: false,
      }));
    } catch (err) {
      set({ isLoading: false, error: err instanceof Error ? err.message : 'Erreur' });
      throw err;
    }
  },

  /** POST /rendez-vous/:id/cancel */
  cancelRendezVous: async (id, reason) => {
    set({ isLoading: true, error: null });

    try {
      const { data: response } = await api.post(`/rendez-vous/${id}/cancel`, { reason, cancelledBy: 'AGENT' });
      const updated: RendezVous = response.data;

      set((state) => ({
        rendezVous: state.rendezVous.map((r) => (r.id === id ? updated : r)),
        isLoading: false,
      }));
    } catch (err) {
      set({ isLoading: false, error: err instanceof Error ? err.message : 'Erreur' });
      throw err;
    }
  },

  /** POST /rendez-vous/print-daily — perm rdv:print-daily */
  printDailySchedule: async (params) => {
    set({ isLoading: true, error: null });

    try {
      const { data } = await api.post('/rendez-vous/print-daily', params);
      const newPrint: DailySchedulePrint = data.data;

      set((state) => ({
        printHistory: [newPrint, ...state.printHistory],
        lastPrint: newPrint,
        isLoading: false,
      }));
      return newPrint;
    } catch (err) {
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : 'Erreur impression',
      });
      throw err;
    }
  },

  /** GET /rendez-vous/print-history?date= */
  fetchPrintHistory: async (date) => {
    set({ isLoading: true, error: null });

    try {
      const { data } = await api.get('/rendez-vous/print-history', { params: { date } });
      set({ printHistory: data.data, isLoading: false });
    } catch (err) {
      set({ isLoading: false, error: err instanceof Error ? err.message : 'Erreur' });
    }
  },

  /** POST /rendez-vous/print/:id/reprint */
  reprint: async (printId) => {
    set({ isLoading: true, error: null });

    try {
      const { data } = await api.post(`/rendez-vous/print/${printId}/reprint`);
      const reprint: DailySchedulePrint = data.data;

      set((state) => ({
        printHistory: [reprint, ...state.printHistory],
        lastPrint: reprint,
        isLoading: false,
      }));
      return reprint;
    } catch (err) {
      set({ isLoading: false, error: err instanceof Error ? err.message : 'Erreur' });
      throw err;
    }
  },

  // UI Actions
  setSelectedDate: (date) => set({ selectedDate: date }),
  setSelectedAgent: (agentId) => set({ selectedAgentId: agentId }),
  setSelectedSubService: (subServiceId) => set({ selectedSubServiceId: subServiceId }),
}));
