// src/components/profile/AgentRequestDialog.tsx
//
// Demande d'accès ou signalement adressé à l'administrateur. Le traitement
// (acceptation / refus / résolution + réponse écrite) se fait côté admin ;
// l'agent est notifié de la réponse et la retrouve dans « Mes demandes ».

import React, { useEffect, useState } from 'react';
import { AlertCircle, Send } from 'lucide-react';
import { Modal } from '../ui/modal';
import { Button } from '../ui/button';
import { Select } from '../ui/select';
import { Input } from '../ui/input';
import { TextArea } from '../ui/textarea';
import { useServices } from '../../hooks/useServices';
import {
  ACCESS_CATEGORIES,
  REPORT_CATEGORIES,
  REQUEST_CATEGORY_LABELS,
  useAgentRequestsStore,
  type AgentRequestCategory,
  type AgentRequestKind,
} from '../../store/agentRequestsStore';

interface AgentRequestDialogProps {
  isOpen: boolean;
  onClose: () => void;
  kind: AgentRequestKind;
  /** Catégorie proposée à l'ouverture (ex. « Problème d'affectation » depuis la carte des services). */
  defaultCategory?: AgentRequestCategory;
  onSubmitted?: () => void;
}

export const AgentRequestDialog: React.FC<AgentRequestDialogProps> = ({ isOpen, onClose, kind, defaultCategory, onSubmitted }) => {
  const { subServices } = useServices();
  const create = useAgentRequestsStore((s) => s.create);

  const categories = kind === 'ACCESS_REQUEST' ? ACCESS_CATEGORIES : REPORT_CATEGORIES;
  const [category, setCategory] = useState<AgentRequestCategory>(defaultCategory ?? categories[0]);
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [targetSubServiceId, setTargetSubServiceId] = useState('');
  const [targetPermission, setTargetPermission] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setCategory(defaultCategory && categories.includes(defaultCategory) ? defaultCategory : categories[0]);
      setSubject('');
      setDescription('');
      setTargetSubServiceId('');
      setTargetPermission('');
      setError(null);
      setDone(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, kind, defaultCategory]);

  const needsService = category === 'SERVICE_ACCESS';

  const submit = async () => {
    setError(null);
    if (subject.trim().length < 3) return setError("Indiquez l'objet de votre demande.");
    if (description.trim().length < 10) return setError('Décrivez votre demande en quelques phrases (10 caractères minimum).');
    if (needsService && !targetSubServiceId) return setError('Choisissez le service concerné.');

    setSending(true);
    try {
      await create({
        kind,
        category,
        subject: subject.trim(),
        description: description.trim(),
        targetSubServiceId: needsService ? targetSubServiceId : undefined,
        targetPermission: category === 'PERMISSION_CHANGE' && targetPermission.trim() ? targetPermission.trim() : undefined,
      });
      setDone(true);
      onSubmitted?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : "La demande n'a pas pu être envoyée.");
    } finally {
      setSending(false);
    }
  };

  const title = kind === 'ACCESS_REQUEST' ? "Demande d'accès ou de modification" : 'Signaler un problème';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="md">
      {done ? (
        <div className="space-y-4 py-2 text-center">
          <p className="text-gray-700 dark:text-gray-200">Votre demande a été transmise à l'administrateur. Vous serez notifié(e) de sa réponse.</p>
          <Button variant="primary" onClick={onClose}>
            Fermer
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {kind === 'ACCESS_REQUEST'
              ? "Cette demande est adressée à l'administrateur, seul habilité à modifier vos accès."
              : "Le signalement est adressé à l'administrateur, qui vous répondra dans votre espace."}
          </p>

          {error && (
            <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-400">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <Select
            label="Nature"
            value={category}
            onChange={(v) => setCategory(v as AgentRequestCategory)}
            options={categories.map((c) => ({ value: c, label: REQUEST_CATEGORY_LABELS[c] }))}
          />

          {needsService && (
            <Select
              label="Service concerné"
              value={targetSubServiceId}
              onChange={setTargetSubServiceId}
              options={[{ value: '', label: 'Sélectionnez un service' }, ...subServices.map((s) => ({ value: s.id, label: s.name }))]}
            />
          )}

          {category === 'PERMISSION_CHANGE' && (
            <Input label="Permission souhaitée (optionnel)" placeholder="Ex. : imprimer le planning des rendez-vous" value={targetPermission} onChange={(e) => setTargetPermission(e.target.value)} />
          )}

          <Input label="Objet" placeholder="Résumez votre demande en une phrase" value={subject} onChange={(e) => setSubject(e.target.value)} maxLength={200} />

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Détails</label>
            <TextArea rows={5} value={description} onChange={setDescription} placeholder="Expliquez le contexte et ce que vous attendez de l'administrateur…" />
          </div>

          <div className="flex justify-end gap-3 border-t border-gray-200 pt-4 dark:border-gray-700">
            <Button variant="ghost" onClick={onClose}>
              Annuler
            </Button>
            <Button variant="primary" onClick={submit} disabled={sending}>
              <Send className="mr-2 h-4 w-4" />
              {sending ? 'Envoi…' : "Envoyer à l'administrateur"}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default AgentRequestDialog;
