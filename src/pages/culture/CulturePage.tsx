// src/pages/culture/CulturePage.tsx
//
// Espace du Conseiller Culturel : ses échanges directs avec la communauté, ses rendez-vous à venir et
// les demandes culturelles ouvertes. Accessible au Conseiller Culturel et à l'administrateur.

import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarCheck, CheckCircle, FileText, MessageCircle, Palette, XCircle } from 'lucide-react';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { WhatsAppContact } from '../../components/common/WhatsAppContact';
import { formatDateShort, formatDateTime, timeAgo } from '../../lib/date';
import { genericMessage } from '../../lib/whatsapp';
import {
  apiErrorMessage,
  cultureApi,
  THREAD_STATUS_COLOR,
  THREAD_STATUS_LABELS,
  type CultureOverview,
  type CultureThreadItem,
} from '../../lib/cultureApi';

const RDV_STATUS: Record<string, { label: string; color: 'warning' | 'success' | 'primary' | 'gray' }> = {
  PENDING: { label: 'À confirmer', color: 'warning' },
  CONFIRMED: { label: 'Confirmé', color: 'success' },
  CHECKED_IN: { label: 'Arrivé à l\'accueil', color: 'primary' },
  IN_PROGRESS: { label: 'En cours', color: 'primary' },
};

const DEMANDE_STATUS: Record<string, string> = {
  SUBMITTED: 'Nouvelle',
  IN_REVIEW: 'En cours d\'examen',
  ADDITIONAL_INFO_REQUIRED: 'Complément demandé',
};

/** Résumé lisible du contenu libre d'une demande culturelle (objet / description saisis par le membre). */
function payloadSummary(payload: Record<string, unknown> | null): string | null {
  if (!payload) return null;
  const text = [payload.objet, payload.titre, payload.description, payload.message].find((v) => typeof v === 'string' && v.trim()) as string | undefined;
  return text ? (text.length > 140 ? `${text.slice(0, 140)}…` : text) : null;
}

export const CulturePage: React.FC = () => {
  const navigate = useNavigate();
  const [overview, setOverview] = useState<CultureOverview | null>(null);
  const [threads, setThreads] = useState<CultureThreadItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [o, t] = await Promise.all([cultureApi.overview(), cultureApi.listThreads({ status: 'ACTIVE', limit: 6 })]);
      setOverview(o);
      setThreads(t.data);
      setError(null);
    } catch (e) {
      setError(apiErrorMessage(e, "Impossible de charger l'espace culturel."));
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const changeRdv = async (id: string, status: 'CONFIRMED' | 'COMPLETED' | 'CANCELLED_BY_AGENT') => {
    if (status === 'CANCELLED_BY_AGENT' && !window.confirm('Annuler ce rendez-vous ? Le membre en sera informé.')) return;
    setBusyId(id);
    try {
      await cultureApi.setRendezVousStatus(id, status);
      await load();
    } catch (e) {
      setError(apiErrorMessage(e, "Le rendez-vous n'a pas pu être mis à jour."));
    } finally {
      setBusyId(null);
    }
  };

  const stats = overview?.stats;
  const chip = (label: string, value: number | undefined, tone: string) => (
    <div className={`rounded-xl border px-4 py-3 ${tone}`}>
      <div className="text-2xl font-semibold text-gray-900 dark:text-white">{value ?? '—'}</div>
      <div className="text-xs text-gray-500 dark:text-gray-400">{label}</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6 dark:bg-gray-900">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-100 text-rose-600 dark:bg-rose-900/30">
              <Palette className="h-6 w-6" />
            </span>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Espace culturel</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Vos échanges avec la communauté se font à visage découvert : les membres voient votre nom.
              </p>
            </div>
          </div>
          <Button variant="outline" onClick={() => navigate('/culture/echanges')}>
            <MessageCircle className="mr-2 h-4 w-4" />
            Tous les échanges
          </Button>
        </div>

        {error && <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}

        {overview && overview.advisors.length === 0 && (
          <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
            Aucun Conseiller Culturel actif : les membres ne voient personne dans l'espace culturel. Créez un agent avec le rôle « Conseiller Culturel »
            puis affectez-le aux services de l'espace culturel (Services → Affectation des agents).
          </p>
        )}

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {chip('Échanges à traiter', stats?.threadsToHandle, stats && stats.threadsToHandle > 0 ? 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20' : 'border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800')}
          {chip('Rendez-vous aujourd\'hui', stats?.rendezVousToday, 'border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800')}
          {chip('Rendez-vous à venir', stats?.rendezVousUpcoming, 'border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800')}
          {chip('Demandes ouvertes', stats?.demandesOpen, 'border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800')}
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Échanges */}
          <Card className="p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="flex items-center gap-2 font-semibold text-gray-900 dark:text-white">
                <MessageCircle className="h-5 w-5 text-rose-500" /> Échanges en cours
              </h2>
              <button type="button" className="text-sm text-brand-600 hover:underline" onClick={() => navigate('/culture/echanges')}>
                Voir tout
              </button>
            </div>
            {threads.length === 0 ? (
              <p className="py-6 text-center text-sm text-gray-400">Aucun échange en cours.</p>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-gray-700">
                {threads.map((t) => (
                  <button key={t.id} type="button" onClick={() => navigate(`/culture/echanges/${t.id}`)} className="flex w-full items-start justify-between gap-3 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-gray-900 dark:text-white">{t.subject}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {t.requester.name ?? 'Membre'} · {timeAgo(t.lastMessageAt)}
                      </p>
                    </div>
                    <Badge color={THREAD_STATUS_COLOR[t.status]} variant="light" size="xs">
                      {THREAD_STATUS_LABELS[t.status]}
                    </Badge>
                  </button>
                ))}
              </div>
            )}
          </Card>

          {/* Rendez-vous */}
          <Card className="p-4">
            <h2 className="mb-3 flex items-center gap-2 font-semibold text-gray-900 dark:text-white">
              <CalendarCheck className="h-5 w-5 text-rose-500" /> Rendez-vous à venir
            </h2>
            {!overview || overview.upcomingRendezVous.length === 0 ? (
              <p className="py-6 text-center text-sm text-gray-400">Aucun rendez-vous à venir.</p>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-gray-700">
                {overview.upcomingRendezVous.map((r) => {
                  const st = RDV_STATUS[r.status] ?? { label: r.status, color: 'gray' as const };
                  return (
                    <div key={r.id} className="space-y-2 py-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900 dark:text-white">
                            {formatDateShort(r.date)}
                            {r.startTime ? ` · ${r.startTime}` : ''} — {r.requester.name ?? 'Membre'}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {r.subServiceName} · <span className="font-mono text-xs">{r.ticketId}</span>
                          </p>
                          {r.motif && <p className="mt-0.5 text-sm text-gray-600 dark:text-gray-300">« {r.motif} »</p>}
                        </div>
                        <Badge color={st.color} variant="light" size="xs">
                          {st.label}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        {r.status === 'PENDING' && (
                          <Button size="xs" variant="primary" disabled={busyId === r.id} onClick={() => changeRdv(r.id, 'CONFIRMED')}>
                            <CheckCircle className="mr-1 h-3.5 w-3.5" /> Confirmer
                          </Button>
                        )}
                        {(r.status === 'CHECKED_IN' || r.status === 'IN_PROGRESS' || r.status === 'CONFIRMED') && (
                          <Button size="xs" variant="success" disabled={busyId === r.id} onClick={() => changeRdv(r.id, 'COMPLETED')}>
                            <CheckCircle className="mr-1 h-3.5 w-3.5" /> Terminé
                          </Button>
                        )}
                        <Button size="xs" variant="outline" disabled={busyId === r.id} onClick={() => changeRdv(r.id, 'CANCELLED_BY_AGENT')}>
                          <XCircle className="mr-1 h-3.5 w-3.5" /> Annuler
                        </Button>
                        <WhatsAppContact phone={r.requester.phone} recipientName={r.requester.name ?? undefined} defaultMessage={genericMessage(r.requester.name)} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>

        {/* Demandes */}
        <Card className="p-4">
          <h2 className="mb-3 flex items-center gap-2 font-semibold text-gray-900 dark:text-white">
            <FileText className="h-5 w-5 text-rose-500" /> Demandes culturelles ouvertes
          </h2>
          {!overview || overview.openDemandes.length === 0 ? (
            <p className="py-6 text-center text-sm text-gray-400">Aucune demande ouverte.</p>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              {overview.openDemandes.map((d) => (
                <button key={d.id} type="button" onClick={() => navigate(`/demandes/${d.id}`)} className="flex w-full items-start justify-between gap-3 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900 dark:text-white">
                      {d.subServiceName} — {d.requester.name ?? 'Membre'}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      <span className="font-mono text-xs">{d.dossierNumber}</span>
                      {d.submittedAt ? ` · déposée le ${formatDateTime(d.submittedAt)}` : ''}
                    </p>
                    {payloadSummary(d.payload) && <p className="mt-0.5 text-sm text-gray-600 dark:text-gray-300">« {payloadSummary(d.payload)} »</p>}
                  </div>
                  <Badge color={d.status === 'SUBMITTED' ? 'error' : 'info'} variant="light" size="xs">
                    {DEMANDE_STATUS[d.status] ?? d.status}
                  </Badge>
                </button>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default CulturePage;
