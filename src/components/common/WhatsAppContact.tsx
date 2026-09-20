// src/components/common/WhatsAppContact.tsx

import React, { useState } from 'react';
import { Copy, ExternalLink } from 'lucide-react';
import { WhatsAppIcon } from '../ui/icons/WhatsAppIcon';
import { Modal } from '../ui/modal';
import { Button } from '../ui/button';
import { buildWhatsAppUrl, normalizePhone } from '../../lib/whatsapp';

interface WhatsAppContactProps {
  /** Téléphone de l'usager tel qu'enregistré (formats libres acceptés). */
  phone?: string | null;
  /** Nom affiché dans la fenêtre (« Contacter Moussa Diarra »). */
  recipientName?: string;
  /** Message proposé — généré selon le contexte (demande, rendez-vous…), modifiable avant l'envoi. */
  defaultMessage: string;
  className?: string;
  /** Libellé du bouton. */
  label?: string;
}

/**
 * Bouton « Contacter par WhatsApp » : ouvre une fenêtre avec le message
 * pré-rempli (modifiable), puis la conversation wa.me — l'agent envoie
 * lui-même. Sans numéro exploitable, le bouton est désactivé et l'explique.
 */
export const WhatsAppContact: React.FC<WhatsAppContactProps> = ({ phone, recipientName, defaultMessage, className = '', label = 'WhatsApp' }) => {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState(defaultMessage);
  const [copied, setCopied] = useState(false);
  const usable = !!normalizePhone(phone);

  const openModal = () => {
    setMessage(defaultMessage); // repart du message adapté à l'état actuel du dossier
    setCopied(false);
    setOpen(true);
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  const pill =
    'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors ' +
    (usable
      ? 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-300'
      : 'cursor-not-allowed border-gray-200 bg-gray-50 text-gray-400 dark:border-gray-700 dark:bg-gray-800');

  return (
    <>
      <button
        type="button"
        onClick={usable ? openModal : undefined}
        disabled={!usable}
        title={usable ? `Contacter ${recipientName ?? "l'usager"} par WhatsApp` : "Aucun numéro de téléphone exploitable pour cet usager"}
        className={`${pill} ${className}`}
      >
        <WhatsAppIcon className="h-3.5 w-3.5" />
        {usable ? label : 'Numéro indisponible'}
      </button>

      <Modal isOpen={open} onClose={() => setOpen(false)} title={`Contacter ${recipientName ?? "l'usager"} par WhatsApp`} size="md">
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Relisez le message puis ouvrez WhatsApp : la conversation s'ouvre avec ce texte, vous l'envoyez vous-même.
          </p>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={8}
            className="w-full rounded-lg border border-gray-200 bg-white p-3 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          />
          <div className="flex flex-wrap justify-end gap-2">
            <Button variant="outline" onClick={copy}>
              <Copy className="mr-2 h-4 w-4" />
              {copied ? 'Copié' : 'Copier le message'}
            </Button>
            <a
              href={buildWhatsAppUrl(phone, message) ?? '#'}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setOpen(false)}
              className="inline-flex items-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              Ouvrir WhatsApp
            </a>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default WhatsAppContact;
