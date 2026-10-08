// ============================================================
// src/components/demandes/DemandeActions.tsx
// ============================================================

import React, { useState } from 'react';
import { useDemandes } from '../../hooks/useDemandes';
import { useAuth } from '../../hooks/useAuth';
import { AppStatus, Priority } from '../../types/demande';
import { PermissionCode } from '../../types/auth';
import { Button } from '../ui/button';
import { Modal } from '../ui/modal';
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  ArrowUpCircle,
  FileCheck,
  RotateCcw,
  MessageSquareWarning,
} from 'lucide-react';
import { formatDateTime } from '../../lib/date';

interface DemandeActionsProps {
  demandeId: string;
  /** Callback appelé quand une action nécessite d'afficher un onglet spécifique */
  onNavigateToTab?: (tab: 'details' | 'workflow' | 'documents' | 'comments') => void;
}

type ActionKey = 'approve' | 'reject' | 'info' | 'reask' | 'complete' | 'escalate' | 'resume';

interface ActionSpec {
  status: AppStatus;
  title: string;
  description: string;
  confirmLabel: string;
  confirmClass: string;
  messageLabel: string;
  messagePlaceholder: string;
  /** Le message est obligatoire (motif de rejet, précision du complément…). */
  required: boolean;
  /** Texte utilisé quand l'agent ne saisit rien (message facultatif). */
  fallbackMessage?: string;
  /** L'agent peut choisir que le message reste interne (sinon il est toujours visible de l'usager). */
  canBeInternal: boolean;
  /** Toujours interne (ex. escalade). */
  alwaysInternal?: boolean;
  /** Priorité imposée au dossier par l'action (escalade). */
  priority?: Priority;
  onSuccessTab?: 'comments';
}

const ACTIONS: Record<ActionKey, ActionSpec> = {
  approve: {
    status: AppStatus.APPROVED,
    title: 'Approuver la demande',
    description: 'La demande passera en statut « Approuvée » et l\'usager en sera notifié.',
    confirmLabel: 'Approuver',
    confirmClass: 'bg-emerald-600 hover:bg-emerald-700 text-white',
    messageLabel: 'Message pour l\'usager (facultatif)',
    messagePlaceholder: 'Ex. Votre dossier est complet, le traitement commence.',
    required: false,
    fallbackMessage: 'Demande approuvée',
    canBeInternal: true,
  },
  reject: {
    status: AppStatus.REJECTED,
    title: 'Rejeter la demande',
    description: 'Le rejet est définitif : la demande ne pourra plus être modifiée. L\'usager recevra le motif ci-dessous.',
    confirmLabel: 'Rejeter définitivement',
    confirmClass: 'bg-red-600 hover:bg-red-700 text-white',
    messageLabel: 'Motif du rejet (visible par l\'usager)',
    messagePlaceholder: 'Expliquez clairement pourquoi la demande est rejetée et ce que l\'usager peut faire.',
    required: true,
    canBeInternal: false,
  },
  info: {
    status: AppStatus.ADDITIONAL_INFO_REQUIRED,
    title: 'Demander un complément d\'information',
    description: 'L\'usager sera notifié et pourra répondre (message ou document). Le dossier n\'est pas clos : vous pourrez reprendre le traitement ensuite.',
    confirmLabel: 'Envoyer la demande',
    confirmClass: 'bg-amber-600 hover:bg-amber-700 text-white',
    messageLabel: 'Que doit fournir l\'usager ?',
    messagePlaceholder: 'Ex. Merci de joindre une copie lisible de votre acte de naissance.',
    required: true,
    canBeInternal: false,
    onSuccessTab: 'comments',
  },
  reask: {
    status: AppStatus.ADDITIONAL_INFO_REQUIRED,
    title: 'Redemander un complément',
    description: 'Une nouvelle demande de complément sera envoyée à l\'usager (l\'ancienne réponse reste dans l\'historique).',
    confirmLabel: 'Redemander',
    confirmClass: 'bg-amber-600 hover:bg-amber-700 text-white',
    messageLabel: 'Précision pour l\'usager',
    messagePlaceholder: 'Ex. Le document fourni est illisible, merci de le renvoyer.',
    required: true,
    canBeInternal: false,
    onSuccessTab: 'comments',
  },
  complete: {
    status: AppStatus.COMPLETED,
    title: 'Marquer comme traitée',
    description: 'Le traitement est terminé : le statut passera à « Traitée » et l\'usager en sera notifié.',
    confirmLabel: 'Confirmer',
    confirmClass: 'bg-green-600 hover:bg-green-700 text-white',
    messageLabel: 'Message pour l\'usager (facultatif)',
    messagePlaceholder: 'Ex. Votre document est disponible au guichet, du lundi au vendredi.',
    required: false,
    fallbackMessage: 'Demande traitée et clôturée',
    canBeInternal: true,
  },
  resume: {
    status: AppStatus.IN_REVIEW,
    title: 'Reprendre le traitement',
    description: 'Le dossier repasse « En examen » pour poursuivre le traitement.',
    confirmLabel: 'Reprendre le traitement',
    confirmClass: 'bg-brand-600 hover:bg-brand-700 text-white',
    messageLabel: 'Note (facultative)',
    messagePlaceholder: 'Ex. Complément reçu, je reprends l\'examen du dossier.',
    required: false,
    fallbackMessage: 'Reprise du traitement du dossier',
    canBeInternal: true,
  },
  escalate: {
    status: AppStatus.IN_REVIEW,
    title: 'Escalader la demande',
    description: 'La demande est signalée à la hiérarchie et sa priorité passe à « Haute ». Le motif reste interne (l\'usager ne le voit pas).',
    priority: Priority.HIGH,
    confirmLabel: 'Escalader',
    confirmClass: 'bg-purple-600 hover:bg-purple-700 text-white',
    messageLabel: 'Motif de l\'escalade',
    messagePlaceholder: 'Ex. Cas particulier nécessitant l\'avis du consul.',
    required: true,
    canBeInternal: true,
    alwaysInternal: true,
  },
};

export const DemandeActions: React.FC<DemandeActionsProps> = ({ demandeId, onNavigateToTab }) => {
  const { selectedDemande, updateStatus } = useDemandes();
  const { can } = useAuth();

  const [active, setActive] = useState<ActionKey | null>(null);
  const [message, setMessage] = useState('');
  const [internalOnly, setInternalOnly] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!selectedDemande) return null;

  const status = selectedDemande.status;
  const canValidate = can(PermissionCode.DEMANDE_VALIDATE);
  const canAssign = can(PermissionCode.DEMANDE_ASSIGN);
  const canReject = can(PermissionCode.DEMANDE_REJECT);
  const canUpdate = can(PermissionCode.DEMANDE_UPDATE) || canValidate;

  const isOpenForReview = [AppStatus.SUBMITTED, AppStatus.IN_REVIEW, AppStatus.UNDER_VERIFICATION].includes(status);
  const isWaitingComplement = status === AppStatus.ADDITIONAL_INFO_REQUIRED;
  const complement = selectedDemande.complement;
  // Reprendre / approuver sans que l'usager ait répondu reste possible, mais l'agent est prévenu.
  const noResponseYet = isWaitingComplement && complement && !complement.responded;

  const open = (key: ActionKey) => {
    setActive(key);
    setMessage('');
    setInternalOnly(false);
    setError(null);
  };
  const close = () => {
    if (isProcessing) return;
    setActive(null);
    setError(null);
  };

  const spec = active ? ACTIONS[active] : null;

  const confirm = async () => {
    if (!active || !spec) return;
    const text = message.trim();
    if (spec.required && text.length < 3) {
      setError('Ce champ est obligatoire (3 caractères minimum).');
      return;
    }

    setIsProcessing(true);
    setError(null);
    try {
      const comment = active === 'escalate' ? `ESCALADE: ${text}` : text || spec.fallbackMessage || '';
      await updateStatus(demandeId, {
        status: spec.status,
        comment,
        isVisibleToUser: spec.alwaysInternal ? false : spec.canBeInternal ? !internalOnly : true,
        ...(spec.priority ? { priority: spec.priority } : {}),
      });
      setActive(null);
      if (spec.onSuccessTab) onNavigateToTab?.(spec.onSuccessTab);
    } catch (err) {
      // Le serveur explique le refus (ex. « demande déjà clôturée ») : on le montre tel quel.
      setError(err instanceof Error && err.message ? err.message : "L'action a échoué. Réessayez.");
    } finally {
      setIsProcessing(false);
    }
  };

  const warning =
    (active === 'resume' || active === 'approve') && noResponseYet
      ? `L'usager n'a pas encore répondu à votre demande de complément (envoyée le ${formatDateTime(complement!.requestedAt)}). Vous pouvez poursuivre, mais le dossier risque d'être incomplet.`
      : null;

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {/* ── Reprise du traitement (complément requis : ce n'est PAS un état final) ── */}
        {isWaitingComplement && canUpdate && (
          <Button onClick={() => open('resume')} className={ACTIONS.resume.confirmClass}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Reprendre le traitement
          </Button>
        )}

        {/* ── Approuver ── */}
        {(isOpenForReview || isWaitingComplement) && canValidate && (
          <Button onClick={() => open('approve')} className={ACTIONS.approve.confirmClass}>
            <CheckCircle className="h-4 w-4 mr-2" />
            Approuver
          </Button>
        )}

        {/* ── Infos manquantes / redemander ── */}
        {(status === AppStatus.SUBMITTED || status === AppStatus.IN_REVIEW) && canUpdate && (
          <Button variant="outline" onClick={() => open('info')} className="border-amber-300 text-amber-700 hover:bg-amber-50">
            <AlertTriangle className="h-4 w-4 mr-2" />
            Infos manquantes
          </Button>
        )}
        {isWaitingComplement && canUpdate && (
          <Button variant="outline" onClick={() => open('reask')} className="border-amber-300 text-amber-700 hover:bg-amber-50">
            <MessageSquareWarning className="h-4 w-4 mr-2" />
            Redemander un complément
          </Button>
        )}

        {/* ── Traitement terminé ── */}
        {status === AppStatus.APPROVED && canValidate && (
          <Button onClick={() => open('complete')} className={ACTIONS.complete.confirmClass}>
            <FileCheck className="h-4 w-4 mr-2" />
            Traitement terminé
          </Button>
        )}

        {/* ── Escalader ── */}
        {isOpenForReview && canAssign && (
          <Button variant="outline" onClick={() => open('escalate')} className="border-purple-300 text-purple-700 hover:bg-purple-50">
            <ArrowUpCircle className="h-4 w-4 mr-2" />
            Escalader
          </Button>
        )}

        {/* ── Rejeter ── */}
        {(isOpenForReview || isWaitingComplement || status === AppStatus.APPROVED) && canReject && (
          <Button variant="destructive" onClick={() => open('reject')}>
            <XCircle className="h-4 w-4 mr-2" />
            Rejeter
          </Button>
        )}

        {/* Dossier clos : plus d'action possible */}
        {[AppStatus.COMPLETED, AppStatus.REJECTED, AppStatus.CANCELLED, AppStatus.ARCHIVED].includes(status) && (
          <p className="text-sm text-gray-500 dark:text-gray-400 self-center">Dossier clôturé — plus d'action possible.</p>
        )}
      </div>

      {/* ── Fenêtre de saisie (message / motif) ── */}
      {spec && (
        <Modal isOpen={true} onClose={close} title={spec.title} size="md">
          <div className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-300">{spec.description}</p>

            {warning && (
              <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-300">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{warning}</span>
              </div>
            )}

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                {spec.messageLabel}
                {spec.required && <span className="ml-1 text-red-500">*</span>}
              </label>
              <textarea
                value={message}
                onChange={(e) => {
                  setMessage(e.target.value);
                  setError(null);
                }}
                rows={4}
                maxLength={1500}
                placeholder={spec.messagePlaceholder}
                className="w-full rounded-lg border border-gray-200 bg-white p-3 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
            </div>

            {spec.canBeInternal && !spec.alwaysInternal && (
              <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                <input type="checkbox" checked={internalOnly} onChange={(e) => setInternalOnly(e.target.checked)} className="rounded" />
                Note interne (non visible par l'usager)
              </label>
            )}

            {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-300">{error}</p>}

            <div className="flex justify-end gap-3 border-t border-gray-100 pt-4 dark:border-gray-700">
              <Button variant="ghost" onClick={close} disabled={isProcessing}>
                Annuler
              </Button>
              <Button onClick={confirm} disabled={isProcessing} className={spec.confirmClass}>
                {isProcessing ? 'Enregistrement…' : spec.confirmLabel}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
};
