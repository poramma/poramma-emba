// src/pages/support/SupportTicketDetailPage.tsx
//
// Traitement d'un ticket : fil de discussion (réponses à l'usager, notes internes,
// évènements de suivi), prise en charge, statut, priorité, assignation.

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle, Lock, Play, Send, XCircle } from 'lucide-react';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Select } from '../../components/ui/select';
import { TextArea } from '../../components/ui/textarea';
import { WhatsAppContact } from '../../components/common/WhatsAppContact';
import { formatDateTime } from '../../lib/date';
import { genericMessage } from '../../lib/whatsapp';
import {
  TICKET_CATEGORY_LABELS,
  TICKET_PRIORITY_LABELS,
  TICKET_STATUS_LABELS,
  useSupportTicketsStore,
  type SupportTicketDetail,
  type TicketPriority,
  type TicketStatus,
} from '../../store/supportTicketsStore';
import { PRIORITY_COLOR, STATUS_COLOR } from './SupportTicketsPage';

const MAX_LENGTH = 3000;

export const SupportTicketDetailPage: React.FC = () => {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const { getTicket, reply, update, assignees, fetchAssignees } = useSupportTicketsStore();

  const [ticket, setTicket] = useState<SupportTicketDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [content, setContent] = useState('');
  const [internal, setInternal] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    try {
      setTicket(await getTicket(id));
      setError(null);
    } catch {
      setError('Ce ticket est introuvable ou vous n’y avez pas accès.');
    }
  }, [getTicket, id]);

  useEffect(() => {
    load();
    fetchAssignees();
  }, [load, fetchAssignees]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end' });
  }, [ticket?.messages.length]);

  const run = async (action: () => Promise<SupportTicketDetail>, success?: string) => {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      setTicket(await action());
      if (success) setNotice(success);
    } catch (e) {
      setError(e instanceof Error ? e.message : "L'action n'a pas pu être effectuée.");
    } finally {
      setBusy(false);
    }
  };

  const send = async () => {
    const text = content.trim();
    if (!text) return;
    await run(() => reply(id, text, internal), internal ? 'Note interne ajoutée.' : "Réponse envoyée à l'usager.");
    setContent('');
  };

  const closed = ticket?.status === 'CLOSED';
  const active = ticket && (ticket.status === 'OPEN' || ticket.status === 'IN_PROGRESS' || ticket.status === 'WAITING_USER');

  return (
    <div className="min-h-screen bg-gray-50 p-6 dark:bg-gray-900">
      <div className="mx-auto max-w-7xl space-y-5">
        <button type="button" onClick={() => navigate('/support-tickets')} className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-brand-600 dark:text-gray-400">
          <ArrowLeft className="h-4 w-4" />
          Retour aux tickets
        </button>

        {error && !ticket && <p className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</p>}

        {ticket && (
          <>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-mono text-xs text-gray-500">{ticket.reference}</p>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{ticket.subject}</h1>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {TICKET_CATEGORY_LABELS[ticket.category]}
                  {ticket.linkedReference ? ` · Réf. ${ticket.linkedReference}` : ''} · ouvert le {formatDateTime(ticket.createdAt)}
                  {ticket.firstResponseAt ? ` · 1re réponse le ${formatDateTime(ticket.firstResponseAt)}` : ' · pas encore de réponse'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge color={STATUS_COLOR[ticket.status]} variant="light">
                  {TICKET_STATUS_LABELS[ticket.status]}
                </Badge>
                <Badge color={PRIORITY_COLOR[ticket.priority]} variant="light">
                  Priorité {TICKET_PRIORITY_LABELS[ticket.priority].toLowerCase()}
                </Badge>
              </div>
            </div>

            {(error || notice) && (
              <p className={`rounded-lg border p-3 text-sm ${error ? 'border-red-200 bg-red-50 text-red-700' : 'border-green-200 bg-green-50 text-green-700'}`}>{error ?? notice}</p>
            )}

            <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
              {/* Fil + réponse */}
              <Card className="p-4 lg:col-span-2">
                <div className="max-h-[32rem] space-y-3 overflow-y-auto pr-1">
                  {ticket.messages.map((m) => {
                    if (m.authorType === 'SYSTEM') {
                      return (
                        <p key={m.id} className="text-center text-xs text-gray-400">
                          {m.isInternal && <Lock className="mr-1 inline h-3 w-3" />}
                          {m.content}
                          {m.authorName ? ` (${m.authorName})` : ''} · {formatDateTime(m.createdAt)}
                        </p>
                      );
                    }
                    const fromUser = m.authorType === 'USER';
                    return (
                      <div key={m.id} className={`flex ${fromUser ? 'justify-start' : 'justify-end'}`}>
                        <div
                          className={`max-w-[85%] rounded-lg p-3 text-sm ${
                            m.isInternal
                              ? 'border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20'
                              : fromUser
                                ? 'bg-gray-100 dark:bg-gray-700/60'
                                : 'bg-brand-50 dark:bg-brand-900/20'
                          }`}
                        >
                          <div className="mb-1 flex items-center justify-between gap-4">
                            <span className="font-medium text-gray-900 dark:text-white">
                              {fromUser ? ticket.requester.name ?? "L'usager" : m.authorName ?? 'Agent'}
                              {m.isInternal && (
                                <span className="ml-2 inline-flex items-center gap-1 text-xs text-amber-600">
                                  <Lock className="h-3 w-3" /> Note interne
                                </span>
                              )}
                            </span>
                            <span className="text-xs text-gray-400">{formatDateTime(m.createdAt)}</span>
                          </div>
                          <p className="whitespace-pre-wrap text-gray-700 dark:text-gray-300">{m.content}</p>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={bottomRef} />
                </div>

                <div className="mt-4 border-t border-gray-100 pt-4 dark:border-gray-700">
                  <div className="mb-2 flex gap-2">
                    <Button size="sm" variant={internal ? 'outline' : 'primary'} onClick={() => setInternal(false)} disabled={closed}>
                      <Send className="mr-1 h-4 w-4" />
                      Répondre à l'usager
                    </Button>
                    <Button size="sm" variant={internal ? 'primary' : 'outline'} onClick={() => setInternal(true)}>
                      <Lock className="mr-1 h-4 w-4" />
                      Note interne
                    </Button>
                  </div>
                  {closed && !internal ? (
                    <p className="rounded-lg bg-gray-50 p-3 text-sm text-gray-500 dark:bg-gray-800">Ce ticket est clôturé : il n'accepte plus de réponse à l'usager.</p>
                  ) : (
                    <>
                      <TextArea
                        rows={4}
                        value={content}
                        onChange={(v) => setContent(v.slice(0, MAX_LENGTH))}
                        placeholder={internal ? 'Note visible uniquement par les administrateurs…' : "Votre réponse, signée « Ambassade du Mali » : l'usager la reçoit par notification et par email…"}
                      />
                      <div className="mt-1 flex items-center justify-between text-xs text-gray-400">
                        <span>{internal ? "Ne sera jamais montré à l'usager." : "Le ticket passera « En attente de l'usager »."}</span>
                        <span>
                          {content.length}/{MAX_LENGTH}
                        </span>
                      </div>
                      <div className="mt-2 flex justify-end">
                        <Button variant="primary" size="sm" onClick={send} disabled={busy || !content.trim()}>
                          {internal ? 'Ajouter la note' : 'Envoyer la réponse'}
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              </Card>

              {/* Panneau latéral */}
              <div className="space-y-5">
                <Card className="p-4">
                  <h3 className="mb-3 font-semibold text-gray-900 dark:text-white">Usager</h3>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{ticket.requester.name ?? '—'}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{ticket.requester.email ?? '—'}</p>
                  {ticket.requester.phone && <p className="text-sm text-gray-500 dark:text-gray-400">{ticket.requester.phone}</p>}
                  <p className="mt-1 text-xs text-gray-400">INUE : {ticket.requester.inue ?? 'non attribué'}</p>
                  <div className="mt-3">
                    <WhatsAppContact phone={ticket.requester.phone} recipientName={ticket.requester.name ?? undefined} defaultMessage={genericMessage(ticket.requester.name)} />
                  </div>
                </Card>

                <Card className="space-y-4 p-4">
                  <h3 className="font-semibold text-gray-900 dark:text-white">Traitement</h3>

                  {active && !ticket.assignee && (
                    <Button variant="primary" className="w-full" disabled={busy} onClick={() => run(() => update(id, { status: 'IN_PROGRESS' }), 'Ticket pris en charge.')}>
                      <Play className="mr-1 h-4 w-4" />
                      Prendre en charge
                    </Button>
                  )}

                  <Select
                    label="Statut"
                    value={ticket.status}
                    disabled={busy || closed}
                    onChange={(v) => run(() => update(id, { status: v as TicketStatus }), 'Statut mis à jour.')}
                    options={(Object.keys(TICKET_STATUS_LABELS) as TicketStatus[])
                      .filter((s) => s !== 'CLOSED')
                      .map((s) => ({ value: s, label: TICKET_STATUS_LABELS[s] }))}
                  />
                  <Select
                    label="Priorité"
                    value={ticket.priority}
                    disabled={busy || closed}
                    onChange={(v) => run(() => update(id, { priority: v as TicketPriority }), 'Priorité mise à jour.')}
                    options={(Object.keys(TICKET_PRIORITY_LABELS) as TicketPriority[]).map((p) => ({ value: p, label: TICKET_PRIORITY_LABELS[p] }))}
                  />
                  <Select
                    label="Assigné à"
                    value={ticket.assignee?.id ?? ''}
                    disabled={busy || closed}
                    onChange={(v) => run(() => update(id, { assignedTo: v || null }), 'Assignation mise à jour.')}
                    options={[{ value: '', label: 'Non assigné' }, ...assignees.map((a) => ({ value: a.id, label: a.name }))]}
                  />

                  {!closed && (
                    <div className="flex flex-col gap-2 border-t border-gray-100 pt-3 dark:border-gray-700">
                      {ticket.status !== 'RESOLVED' && (
                        <Button variant="success" disabled={busy} onClick={() => run(() => update(id, { status: 'RESOLVED' }), 'Ticket marqué comme résolu.')}>
                          <CheckCircle className="mr-1 h-4 w-4" />
                          Marquer comme résolu
                        </Button>
                      )}
                      <Button
                        variant="error"
                        disabled={busy}
                        onClick={() => {
                          if (window.confirm('Clôturer ce ticket ? Il ne pourra plus être modifié et l’usager devra en ouvrir un nouveau pour toute nouvelle question.')) {
                            run(() => update(id, { status: 'CLOSED' }), 'Ticket clôturé.');
                          }
                        }}
                      >
                        <XCircle className="mr-1 h-4 w-4" />
                        Clôturer
                      </Button>
                    </div>
                  )}
                </Card>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default SupportTicketDetailPage;
