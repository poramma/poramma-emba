// src/components/rendez-vous/RendezVousExchange.tsx
//
// Espace d'échange d'un rendez-vous entre l'agent et l'usager.
//  - message public  : visible par l'usager dans son espace (et notifié par email / in-app)
//  - note interne    : réservée aux agents
// Le contact WhatsApp reste disponible en parallèle (message pré-rempli).

import React, { useEffect, useRef, useState } from 'react';
import { Lock, MessageSquare, Send } from 'lucide-react';
import { Modal } from '../ui/modal';
import { Button } from '../ui/button';
import { WhatsAppContact } from '../common/WhatsAppContact';
import { useRendezVous } from '../../hooks/useRendezVous';
import { formatDateTime, formatTime } from '../../lib/date';
import { rendezVousMessage } from '../../lib/whatsapp';
import type { RendezVous } from '../../types/rendez-vous';

interface RendezVousExchangeProps {
  rendezVous: RendezVous | null;
  isOpen: boolean;
  onClose: () => void;
}

const MAX_LENGTH = 1000;

export const RendezVousExchange: React.FC<RendezVousExchangeProps> = ({ rendezVous, isOpen, onClose }) => {
  const { notes, fetchNotes, addNote } = useRendezVous();
  const [content, setContent] = useState('');
  const [sending, setSending] = useState<'public' | 'internal' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && rendezVous) {
      setContent('');
      setError(null);
      fetchNotes(rendezVous.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, rendezVous?.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end' });
  }, [notes.length, isOpen]);

  if (!rendezVous) return null;

  const usagerName = [rendezVous.user?.profile?.firstName, rendezVous.user?.profile?.lastName].filter(Boolean).join(' ') || 'l’usager';
  const time = rendezVous.slot?.startTime ?? rendezVous.slotId?.split('|')[4] ?? '';

  const send = async (isInternal: boolean) => {
    const text = content.trim();
    if (!text) return;
    setSending(isInternal ? 'internal' : 'public');
    setError(null);
    try {
      await addNote(rendezVous.id, text, isInternal);
      setContent('');
    } catch {
      setError("Le message n'a pas pu être envoyé. Réessayez.");
    } finally {
      setSending(null);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Échanges — ${rendezVous.ticketId}`} size="lg">
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="text-sm text-gray-600 dark:text-gray-300">
            <span className="font-medium text-gray-900 dark:text-white">{usagerName}</span>
            {rendezVous.subService?.name ? ` • ${rendezVous.subService.name}` : ''}
          </div>
          <WhatsAppContact
            phone={rendezVous.user?.phone}
            recipientName={usagerName}
            defaultMessage={rendezVousMessage({
              name: usagerName,
              ticketId: rendezVous.ticketId,
              serviceName: rendezVous.subService?.name,
              date: rendezVous.date,
              time: time ? formatTime(time) : '',
            })}
          />
        </div>

        <div className="max-h-80 space-y-3 overflow-y-auto rounded-lg border border-gray-100 p-3 dark:border-gray-700">
          {notes.length === 0 && (
            <p className="py-6 text-center text-sm text-gray-400">
              Aucun échange pour ce rendez-vous. Un message public sera visible par l'usager dans son espace.
            </p>
          )}
          {notes.map((note) => {
            const fromUser = note.authorType === 'STUDENT';
            return (
              <div key={note.id} className={`flex ${fromUser ? 'justify-start' : 'justify-end'}`}>
                <div
                  className={`max-w-[85%] rounded-lg p-3 text-sm ${
                    note.isInternal
                      ? 'border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20'
                      : fromUser
                        ? 'bg-gray-100 dark:bg-gray-700/60'
                        : 'bg-brand-50 dark:bg-brand-900/20'
                  }`}
                >
                  <div className="mb-1 flex items-center justify-between gap-3">
                    <span className="font-medium text-gray-900 dark:text-white">
                      {fromUser ? usagerName : note.authorName || 'Ambassade'}
                      {note.isInternal && (
                        <span className="ml-2 inline-flex items-center gap-1 text-xs text-amber-600">
                          <Lock className="h-3 w-3" /> Interne
                        </span>
                      )}
                    </span>
                    <span className="text-xs text-gray-400">{formatDateTime(note.createdAt)}</span>
                  </div>
                  <p className="whitespace-pre-wrap text-gray-700 dark:text-gray-300">{note.content}</p>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        <div>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value.slice(0, MAX_LENGTH))}
            placeholder="Écrire à l'usager (message public) ou consigner une note interne…"
            className="min-h-[80px] w-full resize-y rounded-lg border border-gray-200 bg-white p-3 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          />
          <div className="mt-1 flex items-center justify-between text-xs text-gray-400">
            <span>{error ? <span className="text-red-600">{error}</span> : 'Le message public notifie l’usager par email et dans son espace.'}</span>
            <span>
              {content.length}/{MAX_LENGTH}
            </span>
          </div>
          <div className="mt-2 flex flex-wrap justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => send(true)} disabled={!content.trim() || sending !== null}>
              <Lock className="mr-1 h-4 w-4" />
              Note interne
            </Button>
            <Button variant="primary" size="sm" onClick={() => send(false)} disabled={!content.trim() || sending !== null}>
              {sending === 'public' ? <MessageSquare className="mr-1 h-4 w-4" /> : <Send className="mr-1 h-4 w-4" />}
              {sending === 'public' ? 'Envoi…' : "Envoyer à l'usager"}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default RendezVousExchange;
