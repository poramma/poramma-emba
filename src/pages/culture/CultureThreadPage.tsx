// src/pages/culture/CultureThreadPage.tsx
//
// Un échange avec un membre : fil de discussion, réponse signée du nom du conseiller, notes internes,
// clôture / réouverture.

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Lock, RotateCcw, Send, XCircle } from 'lucide-react';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { TextArea } from '../../components/ui/textarea';
import { WhatsAppContact } from '../../components/common/WhatsAppContact';
import { formatDateTime } from '../../lib/date';
import { genericMessage } from '../../lib/whatsapp';
import { apiErrorMessage, cultureApi, THREAD_STATUS_COLOR, THREAD_STATUS_LABELS, type CultureThreadDetail } from '../../lib/cultureApi';

const MAX_LENGTH = 3000;

export const CultureThreadPage: React.FC = () => {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const [thread, setThread] = useState<CultureThreadDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [content, setContent] = useState('');
  const [internal, setInternal] = useState(false);
  const [busy, setBusy] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    try {
      setThread(await cultureApi.getThread(id));
      setError(null);
    } catch {
      setError('Cet échange est introuvable ou vous n’y avez pas accès.');
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end' });
  }, [thread?.messages.length]);

  const run = async (action: () => Promise<CultureThreadDetail>, success: string) => {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      setThread(await action());
      setNotice(success);
      return true;
    } catch (e) {
      setError(apiErrorMessage(e, "L'action n'a pas pu être effectuée."));
      return false;
    } finally {
      setBusy(false);
    }
  };

  const send = async () => {
    const text = content.trim();
    if (!text) return;
    const done = await run(() => cultureApi.reply(id, text, internal), internal ? 'Note interne ajoutée.' : 'Réponse envoyée au membre.');
    if (done) setContent('');
  };

  const closed = thread?.status === 'CLOSED';

  return (
    <div className="min-h-screen bg-gray-50 p-6 dark:bg-gray-900">
      <div className="mx-auto max-w-6xl space-y-5">
        <button type="button" onClick={() => navigate('/culture/echanges')} className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-brand-600 dark:text-gray-400">
          <ArrowLeft className="h-4 w-4" />
          Retour aux échanges
        </button>

        {error && !thread && <p className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</p>}

        {thread && (
          <>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-mono text-xs text-gray-500">{thread.reference}</p>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{thread.subject}</h1>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Ouvert le {formatDateTime(thread.createdAt)}
                  {thread.advisor?.name ? ` · suivi par ${thread.advisor.name}` : ' · pas encore de réponse'}
                </p>
              </div>
              <Badge color={THREAD_STATUS_COLOR[thread.status]} variant="light">
                {THREAD_STATUS_LABELS[thread.status]}
              </Badge>
            </div>

            {(error || notice) && (
              <p className={`rounded-lg border p-3 text-sm ${error ? 'border-red-200 bg-red-50 text-red-700' : 'border-green-200 bg-green-50 text-green-700'}`}>{error ?? notice}</p>
            )}

            <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
              <Card className="p-4 lg:col-span-2">
                <div className="max-h-[32rem] space-y-3 overflow-y-auto pr-1">
                  {thread.messages.map((m) => {
                    if (m.authorType === 'SYSTEM') {
                      return (
                        <p key={m.id} className="text-center text-xs text-gray-400">
                          {m.content} · {formatDateTime(m.createdAt)}
                        </p>
                      );
                    }
                    const fromMember = m.authorType === 'USER';
                    return (
                      <div key={m.id} className={`flex ${fromMember ? 'justify-start' : 'justify-end'}`}>
                        <div
                          className={`max-w-[85%] rounded-lg p-3 text-sm ${
                            m.isInternal
                              ? 'border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20'
                              : fromMember
                                ? 'bg-gray-100 dark:bg-gray-700/60'
                                : 'bg-rose-50 dark:bg-rose-900/20'
                          }`}
                        >
                          <div className="mb-1 flex items-center justify-between gap-4">
                            <span className="font-medium text-gray-900 dark:text-white">
                              {m.authorName ?? (fromMember ? thread.requester.name : 'Conseiller')}
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
                      Répondre au membre
                    </Button>
                    <Button size="sm" variant={internal ? 'primary' : 'outline'} onClick={() => setInternal(true)}>
                      <Lock className="mr-1 h-4 w-4" />
                      Note interne
                    </Button>
                  </div>
                  {closed && !internal ? (
                    <p className="rounded-lg bg-gray-50 p-3 text-sm text-gray-500 dark:bg-gray-800">Cet échange est clos : rouvrez-le pour répondre au membre.</p>
                  ) : (
                    <>
                      <TextArea
                        rows={4}
                        value={content}
                        onChange={(v) => setContent(v.slice(0, MAX_LENGTH))}
                        placeholder={internal ? 'Note visible uniquement par le personnel…' : 'Votre réponse, signée de votre nom : le membre la reçoit par notification et par email…'}
                      />
                      <div className="mt-1 flex items-center justify-between text-xs text-gray-400">
                        <span>{internal ? 'Ne sera jamais montré au membre.' : 'Le membre voit votre nom et votre fonction.'}</span>
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

              <div className="space-y-5">
                <Card className="p-4">
                  <h3 className="mb-3 font-semibold text-gray-900 dark:text-white">Membre</h3>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{thread.requester.name ?? '—'}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{thread.requester.email ?? '—'}</p>
                  {thread.requester.phone && <p className="text-sm text-gray-500 dark:text-gray-400">{thread.requester.phone}</p>}
                  <p className="mt-1 text-xs text-gray-400">INUE : {thread.requester.inue ?? 'non attribué'}</p>
                  <div className="mt-3">
                    <WhatsAppContact phone={thread.requester.phone} recipientName={thread.requester.name ?? undefined} defaultMessage={genericMessage(thread.requester.name)} />
                  </div>
                </Card>

                <Card className="space-y-3 p-4">
                  <h3 className="font-semibold text-gray-900 dark:text-white">Suivi</h3>
                  {closed ? (
                    <Button variant="outline" className="w-full" disabled={busy} onClick={() => run(() => cultureApi.setStatus(id, 'OPEN'), 'Échange rouvert.')}>
                      <RotateCcw className="mr-1 h-4 w-4" />
                      Rouvrir l'échange
                    </Button>
                  ) : (
                    <Button
                      variant="error"
                      className="w-full"
                      disabled={busy}
                      onClick={() => {
                        if (window.confirm('Clore cet échange ? Le membre sera prévenu et devra en ouvrir un nouveau pour vous réécrire.')) {
                          run(() => cultureApi.setStatus(id, 'CLOSED'), 'Échange clos.');
                        }
                      }}
                    >
                      <XCircle className="mr-1 h-4 w-4" />
                      Clore l'échange
                    </Button>
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

export default CultureThreadPage;
