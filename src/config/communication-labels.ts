// ============================================================
// src/config/communication-labels.ts
// ============================================================

/**
 * Labels français centralisés pour les enums du module Communication —
 * même convention que config/document-labels.ts.
 */

import { NotifType, NotifChannel, NotifStatus, DeliveryStatus, CampagneAttachmentType } from '../types/communication';

export const notifTypeLabels: Record<NotifType, string> = {
  [NotifType.DEMANDE_UPDATE]: 'Mise à jour de demande',
  [NotifType.RDV_REMINDER]: 'Rappel de rendez-vous',
  [NotifType.PAYMENT]: 'Paiement',
  [NotifType.MESSAGE]: 'Message',
  [NotifType.SYSTEM]: 'Système',
  [NotifType.CAMPAGNE]: 'Campagne',
  [NotifType.DOCUMENT]: 'Document',
  [NotifType.VALIDATION]: 'Validation',
};

export const notifChannelLabels: Record<NotifChannel, string> = {
  [NotifChannel.IN_APP]: 'Application',
  [NotifChannel.EMAIL]: 'Email',
  [NotifChannel.SMS]: 'SMS',
  [NotifChannel.PUSH]: 'Push',
  [NotifChannel.WHATSAPP]: 'WhatsApp',
};

export const notifStatusLabels: Record<NotifStatus, string> = {
  [NotifStatus.QUEUED]: 'En attente',
  [NotifStatus.SENT]: 'Envoyée',
  [NotifStatus.DELIVERED]: 'Livrée',
  [NotifStatus.READ]: 'Lue',
  [NotifStatus.FAILED]: 'Échec',
};

export const deliveryStatusLabels: Record<DeliveryStatus, string> = {
  [DeliveryStatus.QUEUED]: 'En attente',
  [DeliveryStatus.SENT]: 'Envoyée',
  [DeliveryStatus.DELIVERED]: 'Livrée',
  [DeliveryStatus.FAILED]: 'Échec',
  [DeliveryStatus.OPENED]: 'Ouverte',
  [DeliveryStatus.CLICKED]: 'Cliquée',
};

export const campagneAttachmentTypeLabels: Record<CampagneAttachmentType, string> = {
  [CampagneAttachmentType.IMAGE]: 'Image',
  [CampagneAttachmentType.VIDEO]: 'Vidéo',
  [CampagneAttachmentType.DOCUMENT]: 'Document',
};
