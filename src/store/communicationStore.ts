// ============================================================
// src/store/communicationStore.ts
// ============================================================

/**
 * STORE: Communication institutionnelle
 * Backend: Tables `campagnes`, `campagne_deliveries`, `campagne_attachments`,
 *          `notifications`
 * Endpoints:
 *   - GET    /api/communication/campagnes
 *   - GET    /api/communication/campagnes/:id
 *   - POST   /api/communication/campagnes
 *   - PATCH  /api/communication/campagnes/:id
 *   - POST   /api/communication/campagnes/:id/send
 *   - PATCH  /api/communication/campagnes/:id/cancel
 *   - POST   /api/communication/campagnes/:id/duplicate
 *   - POST   /api/communication/campagnes/:id/attachments
 *   - DELETE /api/communication/campagnes/:id/attachments/:attachmentId
 *   - PATCH  /api/communication/campagnes/:id/attachments/reorder
 *   - POST   /api/communication/campagnes/estimate
 *   - GET    /api/notifications
 *
 * v2 — ajouts: gestion des pièces jointes (upload/suppression/réordonnancement),
 * estimation de destinataires en temps réel, annulation/duplication de campagne.
 */

import { create } from 'zustand';
import {
  Campagne,
  CampagneType,
  CampagneStatus,
  CampagneFilters,
  CampagneAttachment,
  CampagneAttachmentType,
  UploadCampagneMediaPayload,
  RecipientEstimate,
  CampagneDelivery,
  Notif,
  NotifType,
  NotifChannel,
  NotifStatus,
  NotificationFilters,
  DeliveryStatus,
  CreateCampagnePayload,
  Thread,
  ThreadType,
  ThreadStatus,
  Message,
  MsgStatus,
} from '../types/communication';
import { StoredFile } from '../types/document';

// ============================================================
// MOCK DATA
// ============================================================

const MOCK_CAMPAGNES: Campagne[] = [
  {
    id: 'camp-001',
    title: 'Journée culturelle malienne - 15 août 2026',
    content: '<p>Chers étudiants,</p><p>L\'ambassade organise une journée culturelle...</p>',
    type: CampagneType.EVENT,
    coverImageId: 'file-cover-001',
    coverImage: {
      id: 'file-cover-001',
      path: 'campagnes/2026/07/cover-journee-culturelle.jpg',
      mimeType: 'image/jpeg',
      originalName: 'journee_culturelle.jpg',
      checksum: 'sha256:f1a2b3...',
      encryptionKeyId: 'key-001',
      size: 850000,
      uploadedAt: '2026-07-05T13:50:00Z',
      uploadedBy: 'usr-004-admin',
      expiresAt: null,
    },
    attachments: [
      {
        id: 'att-001',
        campagneId: 'camp-001',
        fileId: 'filr-001',
        file: {
          id: 'file-001',
          path: 'campagnes/2026/07/cover-journee-culturelle.jpg',
          mimeType: 'image/jpeg',
          originalName: 'photo_journee_culturelle.jpg',
          checksum: 'sha256:f1a2b3...',
          encryptionKeyId: 'key-001',
          size: 850000,
          uploadedAt: '2026-07-05T13:50:00Z',
          uploadedBy: 'usr-004-admin',
          expiresAt: null,
        },
        type: CampagneAttachmentType.IMAGE,
        caption: 'Photo de la journée culturelle',
        order: 0,
        createdAt: '2026-07-05T14:00:00Z',
      },
      {
        id: 'att-002',
        campagneId: 'camp-001',
        fileId: 'file-002',
        file: {
          id: 'file-002',
          path: 'campagnes/2026/07/autre-photo.jpg',
          mimeType: 'image/jpeg',
          originalName: 'autre_photo.jpg',
          checksum: 'sha256:f1a2b3...',
          encryptionKeyId: 'key-001',
          size: 850000,
          uploadedAt: '2026-07-05T13:50:00Z',
          uploadedBy: 'usr-004-admin',
          expiresAt: null,
        },
        type: CampagneAttachmentType.IMAGE,
        caption: 'Autre photo',
        order: 1,
        createdAt: '2026-07-05T14:00:00Z',
      },
    ],
    targetFilters: {
      cities: ['Rabat', 'Casablanca', 'Marrakech'],
      statuses: ['VERIFIED'],
    },
    scheduledAt: '2026-07-10T09:00:00Z',
    sentAt: '2026-07-10T09:00:00Z',
    status: CampagneStatus.SENT,
    sentBy: 'usr-004-admin',
    stats: {
      totalRecipients: 450,
      sent: 450,
      delivered: 445,
      opened: 320,
      clicked: 180,
      failed: 5,
      openRate: 71.9,
      clickRate: 40.4,
    },
    createdAt: '2026-07-05T14:00:00Z',
  },
  {
    id: 'camp-002',
    title: 'Alerte: Changement horaires ambassade Ramadan',
    content: '<p>Attention: Pendant le mois de Ramadan, les horaires...</p>',
    type: CampagneType.ALERT,
    coverImageId: null,
    coverImage: null,
    attachments: [],
    targetFilters: { statuses: ['VERIFIED', 'PENDING'] },
    scheduledAt: null,
    sentAt: '2025-03-01T08:00:00Z',
    status: CampagneStatus.SENT,
    sentBy: 'usr-004-admin',
    stats: {
      totalRecipients: 600,
      sent: 600,
      delivered: 598,
      opened: 550,
      clicked: 120,
      failed: 2,
      openRate: 91.9,
      clickRate: 20.0,
    },
    createdAt: '2026-02-28T16:00:00Z',
  },
  {
    id: 'camp-003',
    title: 'Enquête de satisfaction 2026',
    content: '<p>Votre avis compte! Merci de répondre à cette courte enquête...</p>',
    type: CampagneType.SURVEY,
    coverImageId: null,
    coverImage: null,
    attachments: [],
    targetFilters: {
      cities: ['Rabat'],
      studyLevels: ['Licence 3', 'Master 1', 'Master 2', 'Doctorat'],
    },
    scheduledAt: '2026-07-15T10:00:00Z',
    sentAt: null,
    status: CampagneStatus.SCHEDULED,
    sentBy: 'usr-004-admin',
    stats: {
      totalRecipients: 0, sent: 0, delivered: 0, opened: 0, clicked: 0,
      failed: 0, openRate: 0, clickRate: 0,
    },
    createdAt: '2026-07-05T10:00:00Z',
  },
];

const MOCK_DELIVERIES: CampagneDelivery[] = [
  {
    id: 'del-001', campagneId: 'camp-001', userId: 'usr-stu-001', userName: 'Moussa Diarra',
    channel: NotifChannel.EMAIL, status: DeliveryStatus.OPENED,
    sentAt: '2026-07-10T09:00:05Z', deliveredAt: '2026-07-10T09:00:10Z',
    openedAt: '2026-07-10T09:30:00Z', clickedAt: '2026-07-10T09:35:00Z', errorMessage: null,
  },
  {
    id: 'del-002', campagneId: 'camp-001', userId: 'usr-stu-002', userName: 'Fatoumata Traoré',
    channel: NotifChannel.EMAIL, status: DeliveryStatus.DELIVERED,
    sentAt: '2026-07-10T09:00:05Z', deliveredAt: '2025-07-10T09:00:10Z',
    openedAt: null, clickedAt: null, errorMessage: null,
  },
];

const MOCK_NOTIFICATIONS: Notif[] = [
  {
    id: 'notif-001', userId: 'usr-stu-001', type: NotifType.DEMANDE_UPDATE,
    title: 'Mise à jour de votre demande',
    body: 'Votre demande DEM-2025-0001234 est en cours d\'examen.',
    payload: { demandeId: 'dem-2025-0001234', newStatus: 'IN_REVIEW' },
    channel: NotifChannel.IN_APP, status: NotifStatus.READ,
    actionUrl: '/demandes/dem-2025-0001234',
    createdAt: '2026-07-02T15:00:00Z', sentAt: '2026-07-02T15:00:00Z', readAt: '2026-07-02T16:00:00Z',
  },
  {
    id: 'notif-002', userId: 'usr-stu-001', type: NotifType.RDV_REMINDER,
    title: 'Rappel: Rendez-vous demain',
    body: 'Vous avez un rendez-vous demain à 09:30 pour le renouvellement de votre carte consulaire.',
    payload: { rdvId: 'rdv-001', date: '2025-07-06', time: '09:30' },
    channel: NotifChannel.IN_APP, status: NotifStatus.SENT,
    actionUrl: '/rendez-vous',
    createdAt: '2026-07-05T08:00:00Z', sentAt: '2026-07-05T08:00:00Z', readAt: null,
  },
];

const MOCK_THREADS: Thread[] = [
  {
    id: 'thread-001', demandeId: 'dem-2025-0001234',
    subject: 'Demande DEM-2025-0001234 - Carte consulaire',
    type: ThreadType.DEMANDE, status: ThreadStatus.OPEN,
    participants: [], lastMessage: null, unreadCount: 2,
    createdAt: '2025-07-02T14:30:00Z', closedAt: null,
  },
];

const MOCK_MESSAGES: Record<string, Message[]> = {
  'thread-001': [
    {
      id: 'msg-001', threadId: 'thread-001', senderId: 'usr-stu-001', senderName: 'Moussa DIARRA',
      senderRole: 'STUDENT',
      body: 'Bonjour, j\'ai soumis ma demande de renouvellement. Quand puis-je venir retirer ma carte?',
      attachments: null, status: MsgStatus.READ, readAt: '2025-07-02T15:00:00Z', createdAt: '2025-07-02T14:35:00Z',
    },
  ],
};

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

  // NOUVEAU — Pièces jointes
  uploadCampagneMedia: (campagneId: string, payload: UploadCampagneMediaPayload) => Promise<CampagneAttachment>;
  removeCampagneAttachment: (campagneId: string, attachmentId: string) => Promise<void>;
  reorderCampagneAttachments: (campagneId: string, orderedAttachmentIds: string[]) => Promise<void>;

  // NOUVEAU — Estimation de ciblage
  estimateRecipients: (filters: CampagneFilters) => Promise<RecipientEstimate>;

  // Notifications
  fetchNotifications: (filters?: NotificationFilters) => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;

  // Messagerie (base posée, développement complet ultérieur)
  fetchThreads: (filters?: { userId?: string; demandeId?: string }) => Promise<void>;
  fetchThreadMessages: (threadId: string) => Promise<void>;
  sendMessage: (threadId: string, content: string, attachments?: File[]) => Promise<void>;
  createThread: (demandeId: string | null, subject: string, participantIds: string[]) => Promise<Thread>;

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
      await new Promise((r) => setTimeout(r, 500));
      // VRAIE IMPLÉMENTATION:
      // const { data } = await api.get('/communication/campagnes');
      set({ campagnes: MOCK_CAMPAGNES, isLoading: false });
    } catch (err) {
      set({ isLoading: false, error: 'Erreur de chargement des campagnes' });
    }
  },

  fetchCampagneById: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await new Promise((r) => setTimeout(r, 400));
      // VRAIE IMPLÉMENTATION:
      // const { data } = await api.get(`/communication/campagnes/${id}`);
      
      // Chercher d'abord dans la liste du store (pour les campagnes nouvellement créées)
      const campagne = get().campagnes.find((c) => c.id === id) || 
                      MOCK_CAMPAGNES.find((c) => c.id === id) || null;
      
      set({ selectedCampagne: campagne, isLoading: false });
      if (campagne) get().fetchDeliveries(id);
      return campagne;
    } catch (err) {
      set({ isLoading: false, error: 'Campagne introuvable' });
      return null;
    }
  },

  createCampagne: async (payload) => {
    set({ isLoading: true, error: null });
    try {
      await new Promise((r) => setTimeout(r, 700));
      // VRAIE IMPLÉMENTATION:
      // const { data } = await api.post('/communication/campagnes', payload);

      const newCampagne: Campagne = {
        id: `camp-${Date.now()}`,
        title: payload.title,
        content: payload.content,
        type: payload.type,
        coverImageId: payload.coverImageFileId || null,
        coverImage: null, // résolu par le backend en réel
        attachments: [],
        targetFilters: payload.targetFilters,
        scheduledAt: payload.scheduledAt || null,
        sentAt: null,
        status: payload.scheduledAt ? CampagneStatus.SCHEDULED : CampagneStatus.DRAFT,
        sentBy: 'current-user',
        stats: {
          totalRecipients: 0, sent: 0, delivered: 0, opened: 0, clicked: 0,
          failed: 0, openRate: 0, clickRate: 0,
        },
        createdAt: new Date().toISOString(),
      };

      set((state) => ({
        campagnes: [newCampagne, ...state.campagnes],
        selectedCampagne: newCampagne,
        isLoading: false,
      }));

      return newCampagne;
    } catch (err) {
      set({ isLoading: false, error: 'Erreur de création de campagne' });
      throw err;
    }
  },

  /**
   * NOUVEAU — UPDATE CAMPAGNE (édition d'un brouillon ou d'une campagne programmée)
   * Backend: PATCH /api/communication/campagnes/:id
   * Refusé côté backend si status === SENT/SENDING
   */
  updateCampagne: async (id, payload) => {
    set({ isLoading: true, error: null });
    try {
      await new Promise((r) => setTimeout(r, 500));
      // VRAIE IMPLÉMENTATION:
      // await api.patch(`/communication/campagnes/${id}`, payload);

      set((state) => ({
        campagnes: state.campagnes.map((c) => (c.id === id ? { ...c, ...payload } as Campagne : c)),
        selectedCampagne:
          state.selectedCampagne?.id === id
            ? ({ ...state.selectedCampagne, ...payload } as Campagne)
            : state.selectedCampagne,
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
      await new Promise((r) => setTimeout(r, 1000));
      // VRAIE IMPLÉMENTATION:
      // await api.post(`/communication/campagnes/${id}/send`);

      set((state) => ({
        campagnes: state.campagnes.map((c) =>
          c.id === id
            ? { ...c, status: CampagneStatus.SENDING, sentAt: new Date().toISOString(),
                stats: { ...c.stats, totalRecipients: 450, sent: 450 } }
            : c
        ),
        isLoading: false,
      }));

      setTimeout(() => {
        set((state) => ({
          campagnes: state.campagnes.map((c) =>
            c.id === id
              ? { ...c, status: CampagneStatus.SENT,
                  stats: { ...c.stats, delivered: 445, opened: 320, clicked: 180, failed: 5, openRate: 71.9, clickRate: 40.4 } }
              : c
          ),
        }));
      }, 2000);
    } catch (err) {
      set({ isLoading: false, error: 'Erreur d\'envoi de la campagne' });
      throw err;
    }
  },

  scheduleCampagne: async (id, scheduledAt) => {
    set({ isLoading: true, error: null });
    try {
      await new Promise((r) => setTimeout(r, 400));
      // VRAIE IMPLÉMENTATION:
      // await api.patch(`/communication/campagnes/${id}/schedule`, { scheduledAt });
      set((state) => ({
        campagnes: state.campagnes.map((c) =>
          c.id === id ? { ...c, scheduledAt, status: CampagneStatus.SCHEDULED } : c
        ),
        isLoading: false,
      }));
    } catch (err) {
      set({ isLoading: false, error: 'Erreur de programmation' });
      throw err;
    }
  },

  /**
   * NOUVEAU — CANCEL CAMPAGNE (annule une campagne SCHEDULED avant envoi)
   * Backend: PATCH /api/communication/campagnes/:id/cancel
   */
  cancelCampagne: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await new Promise((r) => setTimeout(r, 300));
      // VRAIE IMPLÉMENTATION:
      // await api.patch(`/communication/campagnes/${id}/cancel`);
      set((state) => ({
        campagnes: state.campagnes.map((c) =>
          c.id === id ? { ...c, status: CampagneStatus.CANCELLED, scheduledAt: null } : c
        ),
        isLoading: false,
      }));
    } catch (err) {
      set({ isLoading: false, error: 'Erreur d\'annulation' });
      throw err;
    }
  },

  /**
   * NOUVEAU — DUPLICATE CAMPAGNE (repart d'un brouillon identique)
   * Backend: POST /api/communication/campagnes/:id/duplicate
   */
  duplicateCampagne: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await new Promise((r) => setTimeout(r, 400));
      // VRAIE IMPLÉMENTATION:
      // const { data } = await api.post(`/communication/campagnes/${id}/duplicate`);

      const source = get().campagnes.find((c) => c.id === id);
      if (!source) throw new Error('Campagne source introuvable');

      const duplicated: Campagne = {
        ...source,
        id: `camp-${Date.now()}`,
        title: `${source.title} (copie)`,
        status: CampagneStatus.DRAFT,
        scheduledAt: null,
        sentAt: null,
        stats: { totalRecipients: 0, sent: 0, delivered: 0, opened: 0, clicked: 0, failed: 0, openRate: 0, clickRate: 0 },
        createdAt: new Date().toISOString(),
      };

      set((state) => ({ campagnes: [duplicated, ...state.campagnes], isLoading: false }));
      return duplicated;
    } catch (err) {
      set({ isLoading: false, error: 'Erreur de duplication' });
      throw err;
    }
  },

  fetchDeliveries: async (campagneId) => {
    try {
      await new Promise((r) => setTimeout(r, 400));
      // VRAIE IMPLÉMENTATION:
      // const { data } = await api.get(`/communication/campagnes/${campagneId}/deliveries`);
      set({ deliveries: MOCK_DELIVERIES.filter((d) => d.campagneId === campagneId) });
    } catch (err) {
      console.error('Erreur chargement deliveries:', err);
    }
  },

  /**
   * NOUVEAU — RESEND TO FAILED (relance uniquement les envois en échec)
   * Backend: POST /api/communication/campagnes/:id/resend-failed
   */
  resendToFailed: async (campagneId) => {
    set({ isLoading: true, error: null });
    try {
      await new Promise((r) => setTimeout(r, 600));
      // VRAIE IMPLÉMENTATION:
      // await api.post(`/communication/campagnes/${campagneId}/resend-failed`);
      set((state) => ({
        deliveries: state.deliveries.map((d) =>
          d.status === DeliveryStatus.FAILED ? { ...d, status: DeliveryStatus.SENT, sentAt: new Date().toISOString() } : d
        ),
        isLoading: false,
      }));
    } catch (err) {
      set({ isLoading: false, error: 'Erreur lors de la relance' });
      throw err;
    }
  },

  /**
   * NOUVEAU — UPLOAD CAMPAGNE MEDIA
   * Backend: POST /api/communication/campagnes/:id/attachments
   * Réutilise le même pipeline de stockage chiffré que la GED (StoredFile)
   */
  uploadCampagneMedia: async (campagneId, payload) => {
    set({ attachmentUploadProgress: 0, error: null });
    try {
      for (let i = 0; i <= 100; i += 20) {
        await new Promise((r) => setTimeout(r, 150));
        set({ attachmentUploadProgress: i });
      }

      // VRAIE IMPLÉMENTATION:
      // const formData = new FormData();
      // formData.append('file', payload.file);
      // formData.append('type', payload.type);
      // if (payload.caption) formData.append('caption', payload.caption);
      // const { data } = await api.post(`/communication/campagnes/${campagneId}/attachments`, formData, {
      //   onUploadProgress: (e) => set({ attachmentUploadProgress: Math.round((e.loaded * 100) / e.total!) }),
      // });

      const file: StoredFile = {
        id: `file-att-${Date.now()}`,
        path: `campagnes/${campagneId}/${payload.file.name}`,
        mimeType: payload.file.type,
        originalName: payload.file.name,
        checksum: `sha256:${Math.random().toString(36).substring(2)}`,
        encryptionKeyId: 'key-001',
        size: payload.file.size,
        uploadedAt: new Date().toISOString(),
        uploadedBy: 'current-user',
        expiresAt: null,
      };

      const newAttachment: CampagneAttachment = {
        id: `att-${Date.now()}`,
        campagneId,
        fileId: file.id,
        file,
        type: payload.type,
        order: (get().selectedCampagne?.attachments.length ?? 0) + 1,
        caption: payload.caption || null,
        createdAt: new Date().toISOString(),
      };

      set((state) => {
        // Si selectedCampagne existe et correspond, mettre à jour ses attachments
        if (state.selectedCampagne?.id === campagneId) {
          return {
            selectedCampagne: {
              ...state.selectedCampagne,
              attachments: [...state.selectedCampagne.attachments, newAttachment],
            },
            campagnes: state.campagnes.map((c) =>
            c.id === campagneId ? { ...c, attachments: [...c.attachments, newAttachment] } : c
      ),
            attachmentUploadProgress: 100,
          };
        }
        // Sinon, juste mettre à jour la progression
        return { attachmentUploadProgress: 100 };
      });

      return newAttachment;
    } catch (err) {
      set({ error: 'Erreur d\'upload du média', attachmentUploadProgress: 0 });
      throw err;
    }
  },

  /**
   * NOUVEAU — REMOVE CAMPAGNE ATTACHMENT
   * Backend: DELETE /api/communication/campagnes/:id/attachments/:attachmentId
   */
  removeCampagneAttachment: async (campagneId, attachmentId) => {
    try {
      await new Promise((r) => setTimeout(r, 250));
      // VRAIE IMPLÉMENTATION:
      // await api.delete(`/communication/campagnes/${campagneId}/attachments/${attachmentId}`);
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

  /**
   * NOUVEAU — REORDER CAMPAGNE ATTACHMENTS
   * Backend: PATCH /api/communication/campagnes/:id/attachments/reorder
   * Body: { orderedAttachmentIds: string[] }
   */
  reorderCampagneAttachments: async (campagneId, orderedAttachmentIds) => {
    try {
      // VRAIE IMPLÉMENTATION:
      // await api.patch(`/communication/campagnes/${campagneId}/attachments/reorder`, { orderedAttachmentIds });
      set((state) => {
        if (state.selectedCampagne?.id !== campagneId) return state;
        const reordered = orderedAttachmentIds
          .map((id, index) => {
            const att = state.selectedCampagne!.attachments.find((a) => a.id === id);
            return att ? { ...att, order: index + 1 } : null;
          })
          .filter((a): a is CampagneAttachment => a !== null);
        return { selectedCampagne: { ...state.selectedCampagne, attachments: reordered } };
      });
    } catch (err) {
      console.error('Erreur réordonnancement:', err);
      throw err;
    }
  },

  /**
   * NOUVEAU — ESTIMATE RECIPIENTS
   * Backend: POST /api/communication/campagnes/estimate
   * Appelé à chaque changement de filtre dans l'étape "Ciblage" du wizard
   * (debounce recommandé côté composant, pas ici)
   */
  estimateRecipients: async (filters) => {
    try {
      await new Promise((r) => setTimeout(r, 350));
      // VRAIE IMPLÉMENTATION:
      // const { data } = await api.post('/communication/campagnes/estimate', filters);

      // MOCK: estimation grossière basée sur le nombre de critères actifs
      const activeFilterCount = Object.values(filters).filter(
        (v) => v !== undefined && (!Array.isArray(v) || v.length > 0)
      ).length;
      const estimate: RecipientEstimate = {
        estimatedCount: Math.max(50, 800 - activeFilterCount * 120),
        breakdown: {
          byCity: filters.cities?.reduce((acc, city) => ({ ...acc, [city]: Math.floor(Math.random() * 150) + 20 }), {}),
        },
      };

      set({ recipientEstimate: estimate });
      return estimate;
    } catch (err) {
      console.error('Erreur estimation destinataires:', err);
      throw err;
    }
  },

  fetchNotifications: async (filters = {}) => {
    set({ isLoading: true, error: null });
    try {
      await new Promise((r) => setTimeout(r, 400));
      // VRAIE IMPLÉMENTATION:
      // const { data } = await api.get('/notifications', { params: filters });

      let notifs = [...MOCK_NOTIFICATIONS];
      if (filters.type) notifs = notifs.filter((n) => n.type === filters.type);
      if (filters.unreadOnly) notifs = notifs.filter((n) => n.status !== NotifStatus.READ);

      set({
        notifications: notifs,
        unreadCount: notifs.filter((n) => n.status === NotifStatus.SENT).length,
        isLoading: false,
      });
    } catch (err) {
      set({ isLoading: false, error: 'Erreur de chargement des notifications' });
    }
  },

  markAsRead: async (notificationId) => {
    try {
      await new Promise((r) => setTimeout(r, 200));
      // VRAIE IMPLÉMENTATION:
      // await api.patch(`/notifications/${notificationId}/read`);
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
      await new Promise((r) => setTimeout(r, 300));
      // VRAIE IMPLÉMENTATION:
      // await api.patch('/notifications/read-all');
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

  fetchThreads: async (filters = {}) => {
    set({ isLoading: true, error: null });
    try {
      await new Promise((r) => setTimeout(r, 400));
      let filtered = [...MOCK_THREADS];
      if (filters.demandeId) filtered = filtered.filter((t) => t.demandeId === filters.demandeId);
      set({ threads: filtered, isLoading: false });
    } catch (err) {
      set({ isLoading: false, error: 'Erreur de chargement des conversations' });
    }
  },

  fetchThreadMessages: async (threadId) => {
    try {
      await new Promise((r) => setTimeout(r, 300));
      set({ messages: MOCK_MESSAGES[threadId] || [] });
    } catch (err) {
      console.error('Erreur chargement messages:', err);
    }
  },

  sendMessage: async (threadId, content) => {
    set({ isLoading: true, error: null });
    try {
      await new Promise((r) => setTimeout(r, 400));
      const newMessage: Message = {
        id: `msg-${Date.now()}`, threadId, senderId: 'current-user', senderName: 'Agent Courant',
        senderRole: 'AGENT', body: content, attachments: null, status: MsgStatus.SENT,
        readAt: null, createdAt: new Date().toISOString(),
      };
      set((state) => ({ messages: [...state.messages, newMessage], isLoading: false }));
    } catch (err) {
      set({ isLoading: false, error: 'Erreur d\'envoi du message' });
      throw err;
    }
  },

  createThread: async (demandeId, subject) => {
    set({ isLoading: true, error: null });
    try {
      await new Promise((r) => setTimeout(r, 500));
      const newThread: Thread = {
        id: `thread-${Date.now()}`, demandeId, subject,
        type: demandeId ? ThreadType.DEMANDE : ThreadType.GENERAL, status: ThreadStatus.OPEN,
        participants: [], lastMessage: null, unreadCount: 0,
        createdAt: new Date().toISOString(), closedAt: null,
      };
      set((state) => ({ threads: [newThread, ...state.threads], selectedThread: newThread, isLoading: false }));
      return newThread;
    } catch (err) {
      set({ isLoading: false, error: 'Erreur de création de conversation' });
      throw err;
    }
  },

  setSelectedCampagne: (campagne) => set({ selectedCampagne: campagne }),
  setSelectedThread: (thread) => set({ selectedThread: thread }),
}));