// ============================================================
// src/components/documents/DocumentDecisionModal.tsx
// ============================================================

/**
 * Modale de décision — réutilisée sur DocumentQueueTable (actions rapides)
 * ET sur DocumentDecisionPanel (page /documents/:id).
 * La note est obligatoire pour 'reject' et 'resubmission', optionnelle
 * pour 'accept'.
 */

import React, { useState } from 'react';
import { Modal } from '../ui/modal';
import { Button } from '../ui/button';
import { TextArea } from '../ui/textarea';
import { CheckCircle2, XCircle, MessageSquareWarning, type LucideIcon } from 'lucide-react';

export type DocumentDecisionMode = 'accept' | 'reject' | 'resubmission';

interface DocumentDecisionModalProps {
  isOpen: boolean;
  mode: DocumentDecisionMode;
  documentLabel?: string;
  isSubmitting?: boolean;
  onClose: () => void;
  onConfirm: (note: string) => void | Promise<void>;
}

interface ModeConfig {
  title: string;
  icon: LucideIcon;
  confirmLabel: string;
  confirmVariant: 'primary' | 'destructive';
  noteRequired: boolean;
  notePlaceholder: string;
}

const MODE_CONFIG: Record<DocumentDecisionMode, ModeConfig> = {
  accept: {
    title: 'Accepter le document',
    icon: CheckCircle2,
    confirmLabel: 'Accepter',
    confirmVariant: 'primary',
    noteRequired: false,
    notePlaceholder: 'Note optionnelle (ex. remarque pour le dossier)',
  },
  reject: {
    title: 'Rejeter le document',
    icon: XCircle,
    confirmLabel: 'Rejeter',
    confirmVariant: 'destructive',
    noteRequired: true,
    notePlaceholder: "Motif du rejet (obligatoire, visible par l'étudiant)",
  },
  resubmission: {
    title: 'Demander un complément',
    icon: MessageSquareWarning,
    confirmLabel: 'Envoyer la demande',
    confirmVariant: 'primary',
    noteRequired: true,
    notePlaceholder: 'Précisez ce qui doit être resoumis (obligatoire)',
  },
};

export const DocumentDecisionModal: React.FC<DocumentDecisionModalProps> = ({
  isOpen,
  mode,
  documentLabel,
  isSubmitting,
  onClose,
  onConfirm,
}) => {
  const [note, setNote] = useState('');
  const config = MODE_CONFIG[mode];
  const Icon = config.icon;
  const canSubmit = !config.noteRequired || note.trim().length > 0;

  const handleClose = () => {
    setNote('');
    onClose();
  };

  const handleConfirm = async () => {
    if (!canSubmit) return;
    await onConfirm(note.trim());
    setNote('');
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={config.title}>
      <div className="flex flex-col gap-4">
        {documentLabel && (
          <p className="text-theme-sm text-gray-500 dark:text-gray-400">
            Document concerné :{' '}
            <span className="font-medium text-gray-700 dark:text-gray-300">{documentLabel}</span>
          </p>
        )}

        <TextArea
          value={note}
          onChange={(value) => setNote(value)}
          placeholder={config.notePlaceholder}
          rows={4}
        />

        {config.noteRequired && !canSubmit && (
          <p className="text-theme-xs text-error-600">Une note est obligatoire pour cette action.</p>
        )}

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={handleClose}>
            Annuler
          </Button>
          <Button
            variant={config.confirmVariant}
            onClick={handleConfirm}
            disabled={!canSubmit || isSubmitting}
            startIcon={<Icon className="w-4 h-4" />}
          >
            {config.confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default DocumentDecisionModal;