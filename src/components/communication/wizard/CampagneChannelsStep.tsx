// src/components/communication/wizard/CampagneChannelsStep.tsx

import React, { useState } from 'react';
import { 
  Smartphone, Mail, MessageCircle, Bell, 
  Calendar, Send, AlertCircle, XCircle
} from 'lucide-react';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Badge } from '../../ui/badge';
import { Modal } from '../../ui/modal';
import { CampagnePreview } from '../CampagnePreview';
import { NotifChannel } from '../../../types/communication';
import { useToast } from '../../../hooks/useToast';
import { formatDateTime } from '../../../lib/date';
import { htmlToText } from '../../../lib/campaignHtml';

interface CampagneChannelsStepProps {
  value: {
    channels: NotifChannel[];
    scheduledAt: string | null;
  };
  onChange: (value: Partial<{ channels: NotifChannel[]; scheduledAt: string | null }>) => void;
  campagneId?: string;
  campagnePreview: {
    title: string;
    content: string;
    type: any;
    coverImage: any;
    attachments: any[];
  };
  localMediaPreviews?: Record<string, string>;
  onSubmit: (sendNow: boolean, scheduledAt?: string) => Promise<void>;
  isSubmitting?: boolean;
}

const CHANNEL_CONFIG: Record<NotifChannel, { icon: React.ReactNode; label: string; description: string; cost?: string }> = {
  [NotifChannel.IN_APP]: {
    icon: <Smartphone className="w-5 h-5" />,
    label: 'In-app',
    description: 'Notification dans l\'application',
  },
  [NotifChannel.EMAIL]: {
    icon: <Mail className="w-5 h-5" />,
    label: 'Email',
    description: 'Envoi par email',
  },
  [NotifChannel.SMS]: {
    icon: <MessageCircle className="w-5 h-5" />,
    label: 'SMS',
    description: 'Envoi par SMS',
    cost: 'Facturé par envoi',
  },
  [NotifChannel.PUSH]: {
    icon: <Bell className="w-5 h-5" />,
    label: 'Push',
    description: 'Notification push mobile',
  },
  [NotifChannel.WHATSAPP]: {
    icon: <MessageCircle className="w-5 h-5" />,
    label: 'WhatsApp',
    description: 'Envoi via WhatsApp',
    cost: 'Facturé par envoi',
  },
};

export const CampagneChannelsStep: React.FC<CampagneChannelsStepProps> = ({
  value,
  onChange,
  campagneId,
  campagnePreview,
  localMediaPreviews,
  onSubmit,
  isSubmitting = false,
}) => {
  const { toast } = useToast();
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [sendMode, setSendMode] = useState<'now' | 'scheduled' | null>(null);
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');

  const toggleChannel = (channel: NotifChannel) => {
    if (channel === NotifChannel.IN_APP) return; // Toujours actif

    const current = value.channels;
    const newChannels = current.includes(channel)
      ? current.filter(c => c !== channel)
      : [...current, channel];
    onChange({ channels: newChannels });
  };

  const handleSendNow = () => {
    setSendMode('now');
    setShowConfirmModal(true);
  };

  const handleSchedule = () => {
    if (!scheduledDate || !scheduledTime) {
      toast({
        title: 'Date et heure requises',
        description: 'Veuillez sélectionner une date et une heure pour la programmation.',
        variant: 'warning',
      });
      return;
    }
    setSendMode('scheduled');
    setShowConfirmModal(true);
  };

  const handleConfirm = async () => {
    if (sendMode === 'now') {
      await onSubmit(true);
    } else if (sendMode === 'scheduled' && scheduledDate && scheduledTime) {
      // `${date}T${time}:00Z` traiterait à tort l'heure locale saisie par
      // l'agent comme si elle était déjà en UTC. `new Date(...)` sans
      // suffixe la parse comme heure locale ; `.toISOString()` convertit en UTC.
      const scheduledAt = new Date(`${scheduledDate}T${scheduledTime}:00`).toISOString();
      await onSubmit(false, scheduledAt);
    }
    setShowConfirmModal(false);
    setSendMode(null);
  };

  const getChannelStatus = (channel: NotifChannel) => {
    const isActive = value.channels.includes(channel);
    return isActive ? 'active' : 'inactive';
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Canaux */}
        <div>
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Canaux d'envoi
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            IN_APP est toujours activé. Sélectionnez les canaux supplémentaires.
          </p>

          <div className="space-y-3">
            {Object.entries(CHANNEL_CONFIG).map(([key, config]) => {
              const channel = key as NotifChannel;
              const isActive = value.channels.includes(channel);
              const isMandatory = channel === NotifChannel.IN_APP;

              return (
                <div
                  key={key}
                  className={`flex items-center justify-between p-4 rounded-lg border-2 transition-all ${
                    isActive
                      ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20'
                      : 'border-gray-200 dark:border-gray-700'
                  } ${isMandatory ? 'opacity-75' : ''}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${
                      isActive ? 'bg-brand-100 dark:bg-brand-900/30' : 'bg-gray-100 dark:bg-gray-700'
                    }`}>
                      {config.icon}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {config.label}
                        {isMandatory && (
                          <Badge color="gray" variant="light" size="xs" className="ml-2">
                            Obligatoire
                          </Badge>
                        )}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {config.description}
                      </p>
                      {config.cost && (
                        <p className="text-xs text-gray-400">{config.cost}</p>
                      )}
                    </div>
                  </div>
                  <button
                    aria-label={`Activer/désactiver ${config.label}`}
                    onClick={() => toggleChannel(channel)}
                    disabled={isMandatory}
                    className={`w-10 h-6 rounded-full transition-colors ${
                      isActive ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'
                    } ${isMandatory ? 'cursor-default' : 'cursor-pointer'}`}
                  >
                    <div className={`w-4 h-4 rounded-full bg-white transition-transform ${
                      isActive ? 'translate-x-5' : 'translate-x-1'
                    }`} />
                  </button>
                </div>
              );
            })}
          </div>

          {/* Programmation */}
          <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Programmation
            </p>
            <div className="flex flex-wrap items-end gap-3">
              <div>
                <label className="block text-sm text-gray-500 dark:text-gray-400 mb-1">
                  Date
                </label>
                <Input
                  type="date"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-40"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-500 dark:text-gray-400 mb-1">
                  Heure
                </label>
                <Input
                  type="time"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  className="w-32"
                />
              </div>
              <Button
                variant="outline"
                onClick={() => {
                  setScheduledDate('');
                  setScheduledTime('');
                }}
                size="sm"
              >
                <XCircle className="w-4 h-4 mr-1" />
                Effacer
              </Button>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-6 flex flex-wrap gap-3">
            <Button
              variant="success"
              size="lg"
              className="flex-1"
              onClick={handleSendNow}
              disabled={isSubmitting || !campagnePreview.title || !campagnePreview.content}
            >
              <Send className="w-4 h-4 mr-2" />
              Envoyer maintenant
            </Button>
            <Button
              variant="primary"
              size="lg"
              className="flex-1"
              onClick={handleSchedule}
              disabled={isSubmitting || !campagnePreview.title || !campagnePreview.content || !scheduledDate || !scheduledTime}
            >
              <Calendar className="w-4 h-4 mr-2" />
              Programmer l'envoi
            </Button>
          </div>
        </div>

        {/* Aperçu */}
        <div>
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Aperçu de la campagne
          </p>
          <CampagnePreview campagne={campagnePreview} campagneId={campagneId} localPreviews={localMediaPreviews} />
        </div>
      </div>

      {/* Modal de confirmation */}
      <Modal
        isOpen={showConfirmModal}
        onClose={() => {
          setShowConfirmModal(false);
          setSendMode(null);
        }}
        title="Confirmation d'envoi"
        size="lg"
      >
        <div className="space-y-6">
          <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-yellow-800 dark:text-yellow-300">
                  Vous vous apprêtez à envoyer une campagne
                </p>
                <p className="text-sm text-yellow-700 dark:text-yellow-400">
                  Veuillez vérifier les informations ci-dessous avant de confirmer.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-500">Titre</p>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {campagnePreview.title}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Type</p>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {campagnePreview.type}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Canaux</p>
              <div className="flex flex-wrap gap-1 mt-1">
                {value.channels.map((channel) => (
                  <Badge key={channel} color="primary" variant="light" size="xs">
                    {CHANNEL_CONFIG[channel]?.label || channel}
                  </Badge>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs text-gray-500">Mode d'envoi</p>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {sendMode === 'now' ? 'Immédiat' : `Programmé le ${formatDateTime(new Date(`${scheduledDate}T${scheduledTime}`))}`}
              </p>
            </div>
          </div>

          {/* Aperçu rapide */}
          <div className="max-h-48 overflow-y-auto p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <p className="text-xs text-gray-500 mb-2">Aperçu du contenu</p>
            <div className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap line-clamp-4">
              {htmlToText(campagnePreview.content)}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button variant="ghost" onClick={() => {
              setShowConfirmModal(false);
              setSendMode(null);
            }}>
              Annuler
            </Button>
            <Button
              variant={sendMode === 'now' ? 'success' : 'primary'}
              onClick={handleConfirm}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Envoi en cours...' : sendMode === 'now' ? 'Confirmer l\'envoi' : 'Confirmer la programmation'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default CampagneChannelsStep;