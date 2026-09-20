// ============================================================
// src/store/communicationStore.ts
// ============================================================

/**
 * STORE: Communication institutionnelle
 * Backend: Tables `campagnes`, `campagne_deliveries`, `campagne_attachments`,
 *          `notifications`, `threads`, `thread_participants`, `messages`
 *          (ambassade-api)
 */

import { create } from 'zustand';
import { api } from '../lib/api';
import {
  Campagne,
  CampagneFilters,
  CampagneAttachment,
  UploadCampagneMediaPayload,
  RecipientEstimate,
  CampagneDelivery,
  Notif,
  NotifStatus,
  NotificationFilters,
  CreateCampagnePayload,
  Thread,
  Message,
} from '../types/communication';

// ============================================================
// INTERFACE
// ============================================================

interface CommunicationState {
  campagnes: Campagne[];
  selectedCampagne: Campagne | null;
  deliveries: CampagneDelivery[];
  recipientEstimate: RecipientEstimate | null;
  attachmentUploadProgress: number;
  notifications: Notif[];
  unreadCount: number;
  threads: Thread[];
  selectedThread: Thread | null;
  messages: Message[];
  isLoading: boolean;
  error: string | null;

  // Campagnes
  fetchCampagnes: () => Promise<void>;
  fetchCampagneById: (id: string) => Promise<Campagne | null>;
  createCampagne: (payload: CreateCampagnePayload) => Promise<Campagne>;
  updateCampagne: (id: string, payload: Partial<CreateCampagnePayload>) => Promise<void>;
  sendCampagne: (id: string) => Promise<void>;
  scheduleCampagne: (id: string, scheduledAt: string) => Promise<void>;
  cancelCampagne: (id: string) => Promise<void>;
  duplicateCampagne: (id: string) => Promise<Campagne>;
  fetchDeliveries: (campagneId: string) => Promise<void>;
  resendToFailed: (campagneId: string) => Promise<void>;

  uploadCampagneMedia: (campagneId: string, payload: UploadCampagneMediaPayload) => Promise<CampagneAttachment>;
  removeCampagneAttachment: (campagneId: string, attachmentId: string) => Promise<void>;
  reorderCampagneAttachments: (campagneId: string, orderedAttachmentIds: string[]) => Promise<void>;
  updateCampagneAttachment: (campagneId: string, attachmentId: string, patch: { isBanner?: boolean; caption?: string | null }) => Promise<void>;

  estimateRecipients: (filters: CampagneFilters) => Promise<RecipientEstimate>;

  // Notifications
  fetchNotifications: (filters?: NotificationFilters) => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;

  // Messagerie interne
  fetchThreads: (filters?: { userId?: string; demandeId?: string }) => Promise<void>;
  fetchThreadMessages: (threadId: string) => Promise<void>;
  sendMessage: (threadId: string, content: string, attachments?: File[]) => Promise<void>;
  createThread: (demandeId: string | null, subject: string, participantIds: string[]) => Promise<Thread>;
  markThreadRead: (threadId: string) => Promise<void>;
  updateThreadStatus: (threadId: string, status: string) => Promise<void>;
  addThreadParticipant: (threadId: string, userId: string) => Promise<void>;

  setSelectedCampagne: (campagne: Campagne | null) => void;
  setSelectedThread: (thread: Thread | null) => void;
}

// ============================================================
// IMPLEMENTATION
// ============================================================

export const useCommunicationStore = create<CommunicationState>()((set, get) => ({
  campagnes: [],
  selectedCampagne: null,
  deliveries: [],
  recipientEstimate: null,
  attachmentUploadProgress: 0,
  notifications: [],
  unreadCount: 0,
  threads: [],
  selectedThread: null,
  messages: [],
  isLoading: false,
  error: null,

  fetchCampagnes: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await api.get('/communication/campagnes');
      set({ campagnes: data.data, isLoading: false });
    } catch (err) {
      set({ isLoading: false, error: 'Erreur de chargement des campagnes' });
    }
  },

  fetchCampagneById: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await api.get(`/communication/campagnes/${id}`);
      set({ selectedCampagne: data.data, isLoading: false });
      get().fetchDeliveries(id);
      return data.data;
    } catch (err) {
      set({ isLoading: false, error: 'Campagne introuvable' });
      return null;
    }
  },

  createCampagne: async (payload) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await api.post('/communication/campagnes', payload);
      set((state) => ({
        campagnes: [data.data, ...state.campagnes],
        selectedCampagne: data.data,
        isLoading: false,
      }));
      return data.data;
    } catch (err) {
      set({ isLoading: false, error: 'Erreur de création de campagne' });
      throw err;
    }
  },

  updateCampagne: async (id, payload) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await api.patch(`/communication/campagnes/${id}`, payload);
      set((state) => ({
        campagnes: state.campagnes.map((c) => (c.id === id ? data.data : c)),
        selectedCampagne: state.selectedCampagne?.id === id ? data.data : state.selectedCampagne,
        isLoading: false,
      }));
    } catch (err) {
      set({ isLoading: false, error: 'Erreur de mise à jour de la campagne' });
      throw err;
    }
  },

  sendCampagne: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await api.post(`/communication/campagnes/${id}/send`);
      set((state) => ({
        campagnes: state.campagnes.map((c) => (c.id === id ? data.data : c)),
        selectedCampagne: state.selectedCampagne?.id === id ? data.data : state.selectedCampagne,
        isLoading: false,
      }));
    } catch (err) {
      set({ isLoading: false, error: "Erreur d'envoi de la campagne" });
      throw err;
    }
  },

  scheduleCampagne: async (id, scheduledAt) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await api.patch(`/communication/campagnes/${id}/schedule`, { scheduledAt });
      set((state) => ({
        campagnes: state.campagnes.map((c) => (c.id === id ? data.data : c)),
        isLoading: false,
      }));
    } catch (err) {
      set({ isLoading: false, error: 'Erreur de programmation' });
      throw err;
    }
  },

  cancelCampagne: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await api.patch(`/communication/campagnes/${id}/cancel`);
      set((state) => ({
        campagnes: state.campagnes.map((c) => (c.id === id ? data.data : c)),
        isLoading: false,
      }));
    } catch (err) {
      set({ isLoading: false, error: "Erreur d'annulation" });
      throw err;
    }
  },

  duplicateCampagne: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await api.post(`/communication/campagnes/${id}/duplicate`);
      set((state) => ({ campagnes: [data.data, ...state.campagnes], isLoading: false }));
      return data.data;
    } catch (err) {
      set({ isLoading: false, error: 'Erreur de duplication' });
      throw err;
    }
  },

  fetchDeliveries: async (campagneId) => {
    try {
      const { data } = await api.get(`/communication/campagnes/${campagneId}/deliveries`);
      set({ deliveries: data.data });
    } catch (err) {
      console.error('Erreur chargement deliveries:', err);
    }
  },

  resendToFailed: async (campagneId) => {
    set({ isLoading: true, error: null });
    try {
      await api.post(`/communication/campagnes/${campagneId}/resend-failed`);
      await get().fetchDeliveries(campagneId);
      set({ isLoading: false });
    } catch (err) {
      set({ isLoading: false, error: 'Erreur lors de la relance' });
      throw err;
    }
  },

  uploadCampagneMedia: async (campagneId, payload) => {
    set({ attachmentUploadProgress: 0, error: null });
    try {
      const formData = new FormData();
      formData.append('file', payload.file);
      formData.append('type', payload.type);
      if (payload.caption) formData.append('caption', payload.caption);
      if (payload.isBanner) formData.append('isBanner', 'true');

      const { data } = await api.post(`/communication/campagnes/${campagneId}/attachments`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (e) => set({ attachmentUploadProgress: e.total ? Math.round((e.loaded * 100) / e.total) : 0 }),
      });

      const newAttachment: CampagneAttachment = data.data;

      set((state) => {
        if (state.selectedCampagne?.id === campagneId) {
          return {
            selectedCampagne: { ...state.selectedCampagne, attachments: [...state.selectedCampagne.attachments, newAttachment] },
            campagnes: state.campagnes.map((c) =>
              c.id === campagneId ? { ...c, attachments: [...c.attachments, newAttachment] } : c
            ),
            attachmentUploadProgress: 100,
          };
        }
        return { attachmentUploadProgress: 100 };
      });

      return newAttachment;
    } catch (err) {
      set({ error: "Erreur d'upload du média", attachmentUploadProgress: 0 });
      throw err;
    }
  },

  removeCampagneAttachment: async (campagneId, attachmentId) => {
    try {
      await api.delete(`/communication/campagnes/${campagneId}/attachments/${attachmentId}`);
      set((state) => ({
        selectedCampagne:
          state.selectedCampagne?.id === campagneId
            ? { ...state.selectedCampagne, attachments: state.selectedCampagne.attachments.filter((a) => a.id !== attachmentId) }
            : state.selectedCampagne,
      }));
    } catch (err) {
      console.error('Erreur suppression pièce jointe:', err);
      throw err;
    }
  },

  reorderCampagneAttachments: async (campagneId, orderedAttachmentIds) => {
    try {
      await api.patch(`/communication/campagnes/${campagneId}/attachments/reorder`, { orderedAttachmentIds });
      set((state) => {
        if (state.selectedCampagne?.id !== campagneId) return state;
        const reordered = orderedAttachmentIds
          .map((id, index) => {
            const att = state.selectedCampagne!.attachments.find((a) => a.id === id);
            return att ? { ...att, order: index } : null;
          })
          .filter((a): a is CampagneAttachment => a !== null);
        return { selectedCampagne: { ...state.selectedCampagne, attachments: reordered } };
      });
    } catch (err) {
      console.error('Erreur réordonnancement:', err);
      throw err;
    }
  },

  updateCampagneAttachment: async (campagneId, attachmentId, patch) => {
    try {
      const { data } = await api.patch(`/communication/campagnes/${campagneId}/attachments/${attachmentId}`, patch);
      const updated: CampagneAttachment = data.data;
      set((state) => {
        if (state.selectedCampagne?.id !== campagneId) return state;
        return {
          selectedCampagne: {
            ...state.selectedCampagne,
            attachments: state.selectedCampagne.attachments.map((a) => (a.id === attachmentId ? { ...a, isBanner: updated.isBanner, caption: updated.caption } : a)),
          },
        };
      });
    } catch (err) {
      console.error('Erreur mise à jour pièce jointe:', err);
      throw err;
    }
  },

  estimateRecipients: async (filters) => {
    try {
      const { data } = await api.post('/communication/campagnes/estimate', filters);
      set({ recipientEstimate: data.data });
      return data.data;
    } catch (err) {
      console.error('Erreur estimation destinataires:', err);
      throw err;
    }
  },

  fetchNotifications: async (filters = {}) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await api.get('/notifications', { params: filters });
      set({
        notifications: data.data.notifications,
        unreadCount: data.data.unreadCount,
        isLoading: false,
      });
    } catch (err) {
      set({ isLoading: false, error: 'Erreur de chargement des notifications' });
    }
  },

  markAsRead: async (notificationId) => {
    try {
      await api.patch(`/notifications/${notificationId}/read`);
      set((state) => ({
        notifications: state.notifications.map((n) =>
          n.id === notificationId ? { ...n, status: NotifStatus.READ, readAt: new Date().toISOString() } : n
        ),
        unreadCount: Math.max(0, state.unreadCount - 1),
      }));
    } catch (err) {
      console.error('Erreur marquage lu:', err);
    }
  },

  markAllAsRead: async () => {
    try {
      await api.patch('/notifications/read-all');
      set((state) => ({
        notifications: state.notifications.map((n) =>
          n.status === NotifStatus.SENT ? { ...n, status: NotifStatus.READ, readAt: new Date().toISOString() } : n
        ),
        unreadCount: 0,
      }));
    } catch (err) {
      console.error('Erreur marquage tout lu:', err);
    }
  },

  // ── Messagerie interne ──

  fetchThreads: async (filters = {}) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await api.get('/threads', { params: filters.demandeId ? { demandeId: filters.demandeId } : {} });
      set({ threads: data.data, isLoading: false });
    } catch (err) {
      set({ isLoading: false, error: 'Erreur de chargement des conversations' });
    }
  },

  fetchThreadMessages: async (threadId) => {
    try {
      const { data } = await api.get(`/threads/${threadId}/messages`);
      set({ messages: data.data });
    } catch (err) {
      console.error('Erreur chargement messages:', err);
    }
  },

  sendMessage: async (threadId, content, attachments) => {
    set({ isLoading: true, error: null });
    try {
      const formData = new FormData();
      formData.append('body', content);
      (attachments ?? []).forEach((file) => formData.append('files', file));

      const { data } = await api.post(`/threads/${threadId}/messages`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      set((state) => ({ messages: [...state.messages, data.data], isLoading: false }));
    } catch (err) {
      set({ isLoading: false, error: "Erreur d'envoi du message" });
      throw err;
    }
  },

  createThread: async (demandeId, subject, participantIds) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await api.post('/threads', { demandeId: demandeId ?? undefined, subject, participantIds });
      const newThread: Thread = data.data;
      set((state) => ({ threads: [newThread, ...state.threads], selectedThread: newThread, isLoading: false }));
      return newThread;
    } catch (err) {
      set({ isLoading: false, error: 'Erreur de création de conversation' });
      throw err;
    }
  },

  markThreadRead: async (threadId) => {
    try {
      await api.patch(`/threads/${threadId}/read`);
      set((state) => ({
        threads: state.threads.map((t) => (t.id === threadId ? { ...t, unreadCount: 0 } : t)),
      }));
    } catch (err) {
      console.error('Erreur marquage conversation lue:', err);
    }
  },

  updateThreadStatus: async (threadId, status) => {
    const { data } = await api.patch(`/threads/${threadId}/status`, { status });
    set((state) => ({
      threads: state.threads.map((t) => (t.id === threadId ? data.data : t)),
      selectedThread: state.selectedThread?.id === threadId ? data.data : state.selectedThread,
    }));
  },

  addThreadParticipant: async (threadId, userId) => {
    const { data } = await api.post(`/threads/${threadId}/participants`, { userId });
    set((state) => ({
      threads: state.threads.map((t) => (t.id === threadId ? data.data : t)),
      selectedThread: state.selectedThread?.id === threadId ? data.data : state.selectedThread,
    }));
  },

  setSelectedCampagne: (campagne) => set({ selectedCampagne: campagne }),
  setSelectedThread: (thread) => set({ selectedThread: thread }),
}));
