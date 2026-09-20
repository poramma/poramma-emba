// ============================================================
// src/hooks/useCommunication.ts
// ============================================================

import { useCallback, useMemo } from 'react';
import { useCommunicationStore } from '../store/communicationStore';
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
  DeliveryStatus,
  Notif,
  NotifType,
  NotifStatus,
  NotificationFilters,
  CreateCampagnePayload,
  Thread,
  Message,
} from '../types/communication';

// ============================================================
// INTERFACE DU HOOK
// ============================================================

interface UseCommunicationReturn {
  // État brut
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

  // Computed — campagnes
  campagnesByStatus: (status: CampagneStatus) => Campagne[];
  campagnesByType: (type: CampagneType) => Campagne[];
  draftCampagnes: Campagne[];
  scheduledCampagnes: Campagne[];
  sentCampagnes: Campagne[];
  upcomingScheduledCampagnes: Campagne[]; // scheduledAt dans le futur uniquement
  averageOpenRate: number;
  averageClickRate: number;
  selectedCampagneCanEdit: boolean;   // DRAFT ou SCHEDULED uniquement
  selectedCampagneCanCancel: boolean; // SCHEDULED uniquement
  selectedCampagneCanSend: boolean;   // DRAFT ou SCHEDULED, contenu non vide

  // Computed — livraisons
  failedDeliveries: CampagneDelivery[];
  hasFailedDeliveries: boolean;

  // Computed — notifications
  notificationsByType: (type: NotifType) => Notif[];
  unreadNotifications: Notif[];

  // Actions — campagnes CRUD
  fetchCampagnes: () => Promise<void>;
  fetchCampagneById: (id: string) => Promise<Campagne | null>;
  createCampagne: (payload: CreateCampagnePayload) => Promise<Campagne>;
  updateCampagne: (id: string, payload: Partial<CreateCampagnePayload>) => Promise<void>;
  saveDraft: (id: string | undefined, payload: CreateCampagnePayload) => Promise<Campagne>;

  // Actions — cycle de vie d'envoi
  sendCampagne: (id: string) => Promise<void>;
  scheduleCampagne: (id: string, scheduledAt: string) => Promise<void>;
  cancelCampagne: (id: string) => Promise<void>;
  duplicateCampagne: (id: string) => Promise<Campagne>;

  // Actions — livraisons
  fetchDeliveries: (campagneId: string) => Promise<void>;
  resendToFailed: (campagneId: string) => Promise<void>;

  // Actions — pièces jointes
  uploadCampagneMedia: (campagneId: string, payload: UploadCampagneMediaPayload) => Promise<CampagneAttachment>;
  removeCampagneAttachment: (campagneId: string, attachmentId: string) => Promise<void>;
  reorderCampagneAttachments: (campagneId: string, orderedAttachmentIds: string[]) => Promise<void>;
  updateCampagneAttachment: (campagneId: string, attachmentId: string, patch: { isBanner?: boolean; caption?: string | null }) => Promise<void>;
  setCoverImage: (campagneId: string, attachmentId: string) => Promise<void>;

  // Actions — ciblage
  estimateRecipients: (filters: CampagneFilters) => Promise<RecipientEstimate>;

  // Actions — notifications
  fetchNotifications: (filters?: NotificationFilters) => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;

  // Actions — messagerie (base posée, pages non développées dans cette phase)
  fetchThreads: (filters?: { userId?: string; demandeId?: string }) => Promise<void>;
  fetchThreadMessages: (threadId: string) => Promise<void>;
  sendMessage: (threadId: string, content: string, attachments?: File[]) => Promise<void>;
  createThread: (demandeId: string | null, subject: string, participantIds: string[]) => Promise<Thread>;
  markThreadRead: (threadId: string) => Promise<void>;
  updateThreadStatus: (threadId: string, status: string) => Promise<void>;
  addThreadParticipant: (threadId: string, userId: string) => Promise<void>;

  // Sélection
  setSelectedCampagne: (campagne: Campagne | null) => void;
  setSelectedThread: (thread: Thread | null) => void;
}

// ============================================================
// IMPLEMENTATION
// ============================================================

export const useCommunication = (): UseCommunicationReturn => {
  const store = useCommunicationStore();

  const {
    campagnes,
    selectedCampagne,
    deliveries,
    recipientEstimate,
    attachmentUploadProgress,
    notifications,
    unreadCount,
    threads,
    selectedThread,
    messages,
    isLoading,
    error,
    fetchCampagnes: storeFetchCampagnes,
    fetchCampagneById: storeFetchCampagneById,
    createCampagne: storeCreateCampagne,
    updateCampagne: storeUpdateCampagne,
    sendCampagne: storeSendCampagne,
    scheduleCampagne: storeScheduleCampagne,
    cancelCampagne: storeCancelCampagne,
    duplicateCampagne: storeDuplicateCampagne,
    fetchDeliveries: storeFetchDeliveries,
    resendToFailed: storeResendToFailed,
    uploadCampagneMedia: storeUploadCampagneMedia,
    removeCampagneAttachment: storeRemoveCampagneAttachment,
    reorderCampagneAttachments: storeReorderCampagneAttachments,
    updateCampagneAttachment: storeUpdateCampagneAttachment,
    estimateRecipients: storeEstimateRecipients,
    fetchNotifications: storeFetchNotifications,
    markAsRead: storeMarkAsRead,
    markAllAsRead: storeMarkAllAsRead,
    fetchThreads: storeFetchThreads,
    fetchThreadMessages: storeFetchThreadMessages,
    sendMessage: storeSendMessage,
    createThread: storeCreateThread,
    markThreadRead: storeMarkThreadRead,
    updateThreadStatus: storeUpdateThreadStatus,
    addThreadParticipant: storeAddThreadParticipant,
    setSelectedCampagne: storeSetSelectedCampagne,
    setSelectedThread: storeSetSelectedThread,
  } = store;

  // ============================================================
  // COMPUTED — campagnes
  // ============================================================

  const campagnesByStatus = useCallback(
    (status: CampagneStatus) => campagnes.filter((c) => c.status === status),
    [campagnes]
  );

  const campagnesByType = useCallback(
    (type: CampagneType) => campagnes.filter((c) => c.type === type),
    [campagnes]
  );

  const draftCampagnes = useMemo(
    () => campagnes.filter((c) => c.status === CampagneStatus.DRAFT),
    [campagnes]
  );

  const scheduledCampagnes = useMemo(
    () => campagnes.filter((c) => c.status === CampagneStatus.SCHEDULED),
    [campagnes]
  );

  const sentCampagnes = useMemo(
    () => campagnes.filter((c) => c.status === CampagneStatus.SENT),
    [campagnes]
  );

  const upcomingScheduledCampagnes = useMemo(() => {
    const now = new Date();
    return scheduledCampagnes.filter((c) => c.scheduledAt && new Date(c.scheduledAt) > now);
  }, [scheduledCampagnes]);

  const averageOpenRate = useMemo(() => {
    if (!sentCampagnes.length) return 0;
    const total = sentCampagnes.reduce((sum, c) => sum + c.stats.openRate, 0);
    return Math.round((total / sentCampagnes.length) * 10) / 10;
  }, [sentCampagnes]);

  const averageClickRate = useMemo(() => {
    if (!sentCampagnes.length) return 0;
    const total = sentCampagnes.reduce((sum, c) => sum + c.stats.clickRate, 0);
    return Math.round((total / sentCampagnes.length) * 10) / 10;
  }, [sentCampagnes]);

  const selectedCampagneCanEdit = useMemo(() => {
    if (!selectedCampagne) return false;
    return [CampagneStatus.DRAFT, CampagneStatus.SCHEDULED].includes(selectedCampagne.status);
  }, [selectedCampagne]);

  const selectedCampagneCanCancel = useMemo(() => {
    return selectedCampagne?.status === CampagneStatus.SCHEDULED;
  }, [selectedCampagne]);

  const selectedCampagneCanSend = useMemo(() => {
    if (!selectedCampagne) return false;
    const statusOk = [CampagneStatus.DRAFT, CampagneStatus.SCHEDULED].includes(selectedCampagne.status);
    const contentOk = selectedCampagne.title.trim().length > 0 && selectedCampagne.content.trim().length > 0;
    return statusOk && contentOk;
  }, [selectedCampagne]);

  // ============================================================
  // COMPUTED — livraisons
  // ============================================================

  const failedDeliveries = useMemo(
    () => deliveries.filter((d) => d.status === DeliveryStatus.FAILED),
    [deliveries]
  );

  const hasFailedDeliveries = useMemo(() => failedDeliveries.length > 0, [failedDeliveries]);

  // ============================================================
  // COMPUTED — notifications
  // ============================================================

  const notificationsByType = useCallback(
    (type: NotifType) => notifications.filter((n) => n.type === type),
    [notifications]
  );

  const unreadNotifications = useMemo(
    () => notifications.filter((n) => n.status !== NotifStatus.READ),
    [notifications]
  );

  // ============================================================
  // ACTIONS WRAPPERS — campagnes CRUD
  // ============================================================

  const fetchCampagnes = useCallback(async () => {
    await storeFetchCampagnes();
  }, [storeFetchCampagnes]);

  const fetchCampagneById = useCallback(
    async (id: string) => await storeFetchCampagneById(id),
    [storeFetchCampagneById]
  );

  const createCampagne = useCallback(
    async (payload: CreateCampagnePayload) => {
      const campagne = await storeCreateCampagne(payload);
      console.log('[useCommunication] Campagne créée:', campagne.id, campagne.title);
      return campagne;
    },
    [storeCreateCampagne]
  );

  const updateCampagne = useCallback(
    async (id: string, payload: Partial<CreateCampagnePayload>) => {
      await storeUpdateCampagne(id, payload);
    },
    [storeUpdateCampagne]
  );

  /**
   * SAVE DRAFT — wrapper unique pour l'auto-sauvegarde du wizard.
   * Crée la campagne si aucun id n'existe encore (première frappe),
   * sinon met à jour la campagne existante. Évite au composant wizard
   * de gérer lui-même la distinction create/update.
   */
  const saveDraft = useCallback(
    async (id: string | undefined, payload: CreateCampagnePayload) => {
      if (!id) {
        return await createCampagne(payload);
      }
      await updateCampagne(id, payload);
      return (
        campagnes.find((c) => c.id === id) ??
        ({ ...payload, id, status: CampagneStatus.DRAFT } as unknown as Campagne)
      );
    },
    [createCampagne, updateCampagne, campagnes]
  );

  // ============================================================
  // ACTIONS WRAPPERS — cycle de vie d'envoi
  // ============================================================

  const sendCampagne = useCallback(
    async (id: string) => {
      await storeSendCampagne(id);
      console.log('[useCommunication] Campagne envoyée:', id);
    },
    [storeSendCampagne]
  );

  const scheduleCampagne = useCallback(
    async (id: string, scheduledAt: string) => {
      await storeScheduleCampagne(id, scheduledAt);
    },
    [storeScheduleCampagne]
  );

  const cancelCampagne = useCallback(
    async (id: string) => {
      await storeCancelCampagne(id);
      console.log('[useCommunication] Campagne annulée:', id);
    },
    [storeCancelCampagne]
  );

  const duplicateCampagne = useCallback(
    async (id: string) => {
      const duplicated = await storeDuplicateCampagne(id);
      console.log('[useCommunication] Campagne dupliquée:', duplicated.id);
      return duplicated;
    },
    [storeDuplicateCampagne]
  );

  // ============================================================
  // ACTIONS WRAPPERS — livraisons
  // ============================================================

  const fetchDeliveries = useCallback(
    async (campagneId: string) => await storeFetchDeliveries(campagneId),
    [storeFetchDeliveries]
  );

  const resendToFailed = useCallback(
    async (campagneId: string) => {
      await storeResendToFailed(campagneId);
      console.log('[useCommunication] Relance des échecs:', campagneId);
    },
    [storeResendToFailed]
  );

  // ============================================================
  // ACTIONS WRAPPERS — pièces jointes
  // ============================================================

  const uploadCampagneMedia = useCallback(
    async (campagneId: string, payload: UploadCampagneMediaPayload) => {
      const attachment = await storeUploadCampagneMedia(campagneId, payload);
      console.log('[useCommunication] Média ajouté:', attachment.id, attachment.type);
      return attachment;
    },
    [storeUploadCampagneMedia]
  );

  const removeCampagneAttachment = useCallback(
    async (campagneId: string, attachmentId: string) => {
      await storeRemoveCampagneAttachment(campagneId, attachmentId);
    },
    [storeRemoveCampagneAttachment]
  );

  const reorderCampagneAttachments = useCallback(
    async (campagneId: string, orderedAttachmentIds: string[]) => {
      await storeReorderCampagneAttachments(campagneId, orderedAttachmentIds);
    },
    [storeReorderCampagneAttachments]
  );

  const updateCampagneAttachment = useCallback(
    async (campagneId: string, attachmentId: string, patch: { isBanner?: boolean; caption?: string | null }) => {
      await storeUpdateCampagneAttachment(campagneId, attachmentId, patch);
    },
    [storeUpdateCampagneAttachment]
  );

  /**
   * SET COVER IMAGE — désigne une pièce jointe existante (de type IMAGE)
   * comme image de couverture. Implémenté ici comme un cas particulier
   * d'updateCampagne plutôt que comme une action de store dédiée, car il
   * ne fait que réassigner coverImageId à partir d'un attachment déjà
   * uploadé.
   */
  const setCoverImage = useCallback(
    async (campagneId: string, attachmentId: string) => {
      const campagne = campagnes.find((c) => c.id === campagneId) ?? selectedCampagne;
      const attachment = campagne?.attachments.find((a) => a.id === attachmentId);
      if (!attachment) {
        console.warn('[useCommunication] Pièce jointe introuvable pour la couverture:', attachmentId);
        return;
      }
      if (attachment.type !== CampagneAttachmentType.IMAGE) {
        console.warn('[useCommunication] Seule une image peut être définie comme couverture');
        return;
      }
      await storeUpdateCampagne(campagneId, { coverImageFileId: attachment.fileId });
    },
    [campagnes, selectedCampagne, storeUpdateCampagne]
  );

  // ============================================================
  // ACTIONS WRAPPERS — ciblage
  // ============================================================

  const estimateRecipients = useCallback(
    async (filters: CampagneFilters) => await storeEstimateRecipients(filters),
    [storeEstimateRecipients]
  );

  // ============================================================
  // ACTIONS WRAPPERS — notifications
  // ============================================================

  const fetchNotifications = useCallback(
    async (filters?: NotificationFilters) => {
      await storeFetchNotifications(filters);
    },
    [storeFetchNotifications]
  );

  const markAsRead = useCallback(
    async (notificationId: string) => await storeMarkAsRead(notificationId),
    [storeMarkAsRead]
  );

  const markAllAsRead = useCallback(async () => {
    await storeMarkAllAsRead();
  }, [storeMarkAllAsRead]);

  // ============================================================
  // ACTIONS WRAPPERS — messagerie (base)
  // ============================================================

  const fetchThreads = useCallback(
    async (filters?: { userId?: string; demandeId?: string }) => {
      await storeFetchThreads(filters);
    },
    [storeFetchThreads]
  );

  const fetchThreadMessages = useCallback(
    async (threadId: string) => await storeFetchThreadMessages(threadId),
    [storeFetchThreadMessages]
  );

  const sendMessage = useCallback(
    async (threadId: string, content: string, attachments?: File[]) => {
      await storeSendMessage(threadId, content, attachments);
    },
    [storeSendMessage]
  );

  const createThread = useCallback(
    async (demandeId: string | null, subject: string, participantIds: string[]) => {
      return await storeCreateThread(demandeId, subject, participantIds);
    },
    [storeCreateThread]
  );

  const markThreadRead = useCallback(
    async (threadId: string) => await storeMarkThreadRead(threadId),
    [storeMarkThreadRead]
  );

  const updateThreadStatus = useCallback(
    async (threadId: string, status: string) => await storeUpdateThreadStatus(threadId, status),
    [storeUpdateThreadStatus]
  );

  const addThreadParticipant = useCallback(
    async (threadId: string, userId: string) => await storeAddThreadParticipant(threadId, userId),
    [storeAddThreadParticipant]
  );

  // ============================================================
  // RETOUR
  // ============================================================

  return {
    campagnes,
    selectedCampagne,
    deliveries,
    recipientEstimate,
    attachmentUploadProgress,
    notifications,
    unreadCount,
    threads,
    selectedThread,
    messages,
    isLoading,
    error,

    campagnesByStatus,
    campagnesByType,
    draftCampagnes,
    scheduledCampagnes,
    sentCampagnes,
    upcomingScheduledCampagnes,
    averageOpenRate,
    averageClickRate,
    selectedCampagneCanEdit,
    selectedCampagneCanCancel,
    selectedCampagneCanSend,

    failedDeliveries,
    hasFailedDeliveries,

    notificationsByType,
    unreadNotifications,

    fetchCampagnes,
    fetchCampagneById,
    createCampagne,
    updateCampagne,
    saveDraft,

    sendCampagne,
    scheduleCampagne,
    cancelCampagne,
    duplicateCampagne,

    fetchDeliveries,
    resendToFailed,

    uploadCampagneMedia,
    removeCampagneAttachment,
    reorderCampagneAttachments,
    updateCampagneAttachment,
    setCoverImage,

    estimateRecipients,

    fetchNotifications,
    markAsRead,
    markAllAsRead,

    fetchThreads,
    fetchThreadMessages,
    sendMessage,
    createThread,
    markThreadRead,
    updateThreadStatus,
    addThreadParticipant,

    setSelectedCampagne: storeSetSelectedCampagne,
    setSelectedThread: storeSetSelectedThread,
  };
};