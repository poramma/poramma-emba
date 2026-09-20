// src/pages/accueil/AccueilPage.tsx
//
// Poste d'accueil (agent d'accueil) : validation des tickets de rendez-vous des usagers qui se présentent,
// rendez-vous attendus du jour, et registre des demandes formulées sur place.

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle, ClipboardList, FilePlus2, Plus, QrCode, Search, UserPlus, UserRoundSearch, X } from 'lucide-react';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Select } from '../../components/ui/select';
import { TextArea } from '../../components/ui/textarea';
import { Modal } from '../../components/ui/modal';
import { api } from '../../lib/api';
import { formatDateShort, timeAgo } from '../../lib/date';
import {
  apiErrorMessage,
  receptionApi,
  TICKET_STATUS_LABELS,
  WALKIN_CATEGORY_LABELS,
  WALKIN_STATUS_COLOR,
  WALKIN_STATUS_LABELS,
  type CreateUrgencePayload,
  type CreateWalkInPayload,
  type MemberHit,
  type ReceptionSummary,
  type ReceptionTicket,
  type WalkIn,
  type WalkInCategory,
} from '../../lib/receptionApi';

type Tab = 'rdv' | 'walkins';
interface SubServiceOption {
  value: string;
  label: string;
}

const canValidate = (t: ReceptionTicket) => t.status === 'PENDING' || t.status === 'CONFIRMED';

// ------------------------------------------------------------------ ticket

const TicketCard: React.FC<{ ticket: ReceptionTicket; busy: boolean; onValidate: (t: ReceptionTicket) => void; onClose?: () => void }> = ({ ticket, busy, onValidate, onClose }) => {
  const st = TICKET_STATUS_LABELS[ticket.status] ?? { label: ticket.status, color: 'gray' as const };
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-mono text-xs text-gray-500">{ticket.ticketId}</p>
          <p className="text-lg font-semibold text-gray-900 dark:text-white">{ticket.citizen.name}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {ticket.citizen.isVisitor ? 'Personne sans compte' : ticket.citizen.inue ? `INUE ${ticket.citizen.inue}` : 'INUE non attribué'}
            {ticket.citizen.phone ? ` · ${ticket.citizen.phone}` : ''}
            {ticket.citizen.city ? ` · ${ticket.citizen.city}` : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge color={st.color} variant="light">
            {st.label}
          </Badge>
          {onClose && (
            <button type="button" aria-label="Fermer" onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
      <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
        <dt className="text-gray-500">Service</dt>
        <dd className="text-gray-900 dark:text-white">{ticket.subServiceName}</dd>
        <dt className="text-gray-500">Date et heure</dt>
        <dd className="text-gray-900 dark:text-white">
          {formatDateShort(ticket.date)}
          {ticket.startTime ? ` à ${ticket.startTime}` : ''}
        </dd>
        {ticket.agentName && (
          <>
            <dt className="text-gray-500">Agent</dt>
            <dd className="text-gray-900 dark:text-white">{ticket.agentName}</dd>
          </>
        )}
        {ticket.motif && (
          <>
            <dt className="text-gray-500">Motif</dt>
            <dd className="text-gray-900 dark:text-white">{ticket.motif}</dd>
          </>
        )}
      </dl>
      {canValidate(ticket) && (
        <Button variant="primary" className="mt-4 w-full" disabled={busy} onClick={() => onValidate(ticket)}>
          <CheckCircle className="mr-2 h-4 w-4" />
          Valider l'arrivée
        </Button>
      )}
    </div>
  );
};

// ------------------------------------------------------------------ nouvelle demande sur place

const EMPTY_FORM = { visitorName: '', visitorPhone: '', category: 'INFORMATION' as WalkInCategory, subServiceId: '', subject: '', notes: '', urgent: false };

const NewWalkInModal: React.FC<{ isOpen: boolean; onClose: () => void; onCreated: (w: WalkIn) => void; subServices: SubServiceOption[] }> = ({ isOpen, onClose, onCreated, subServices }) => {
  const [form, setForm] = useState(EMPTY_FORM);
  const [member, setMember] = useState<MemberHit | null>(null);
  const [query, setQuery] = useState('');
  const [hits, setHits] = useState<MemberHit[]>([]);
  const [searching, setSearching] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setForm(EMPTY_FORM);
      setMember(null);
      setQuery('');
      setHits([]);
      setError(null);
    }
  }, [isOpen]);

  const search = async () => {
    if (query.trim().length < 2) return;
    setSearching(true);
    try {
      setHits(await receptionApi.searchMembers(query.trim()));
    } catch (e) {
      setError(apiErrorMessage(e, 'Recherche impossible.'));
    } finally {
      setSearching(false);
    }
  };

  const pick = (m: MemberHit) => {
    setMember(m);
    setHits([]);
    setQuery('');
    setForm((f) => ({ ...f, visitorName: m.name, visitorPhone: m.phone ?? f.visitorPhone }));
  };

  const submit = async () => {
    setError(null);
    if (!form.visitorName.trim() && !member) return setError('Indiquez le nom du visiteur.');
    if (form.subject.trim().length < 3) return setError('Décrivez la demande en quelques mots.');
    const payload: CreateWalkInPayload = {
      visitorName: form.visitorName.trim() || undefined,
      visitorPhone: form.visitorPhone.trim() || null,
      userId: member?.id ?? null,
      subServiceId: form.subServiceId || null,
      category: form.category,
      subject: form.subject.trim(),
      notes: form.notes.trim() || null,
      priority: form.urgent ? 'URGENT' : 'NORMAL',
    };
    setSaving(true);
    try {
      onCreated(await receptionApi.createWalkIn(payload));
      onClose();
    } catch (e) {
      setError(apiErrorMessage(e, "La demande n'a pas pu être enregistrée."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Nouvelle demande sur place" size="lg">
      <div className="space-y-4 p-6">
        {error && <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}

        <div className="rounded-lg border border-gray-200 p-3 dark:border-gray-700">
          <p className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            <UserRoundSearch className="h-4 w-4" /> Le visiteur a un compte Poramma ? (facultatif)
          </p>
          {member ? (
            <div className="flex items-center justify-between rounded-lg bg-green-50 p-2 text-sm dark:bg-green-900/20">
              <span>
                <b>{member.name}</b> · {member.email}
                {member.inue ? ` · INUE ${member.inue}` : ''}
              </span>
              <button type="button" className="text-xs text-gray-500 hover:text-red-600" onClick={() => setMember(null)}>
                Détacher
              </button>
            </div>
          ) : (
            <>
              <div className="flex gap-2">
                <div className="flex-1">
                  <Input
                    placeholder="Nom, email, téléphone ou INUE…"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        search();
                      }
                    }}
                    startIcon={<Search className="h-4 w-4" />}
                  />
                </div>
                <Button variant="outline" onClick={search} disabled={searching || query.trim().length < 2}>
                  Chercher
                </Button>
              </div>
              {hits.length > 0 && (
                <ul className="mt-2 divide-y divide-gray-100 rounded-lg border border-gray-200 dark:divide-gray-700 dark:border-gray-700">
                  {hits.map((h) => (
                    <li key={h.id}>
                      <button type="button" className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-800" onClick={() => pick(h)}>
                        <b>{h.name}</b> · {h.email}
                        {h.inue ? ` · INUE ${h.inue}` : ''}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Input label="Nom du visiteur" value={form.visitorName} onChange={(e) => setForm({ ...form, visitorName: e.target.value })} placeholder="Nom et prénom" />
          <Input label="Téléphone" value={form.visitorPhone} onChange={(e) => setForm({ ...form, visitorPhone: e.target.value })} placeholder="+212 6…" />
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Nature</label>
            <Select
              label="Nature"
              value={form.category}
              onChange={(v) => setForm({ ...form, category: v as WalkInCategory })}
              options={(Object.keys(WALKIN_CATEGORY_LABELS) as WalkInCategory[]).map((c) => ({ value: c, label: WALKIN_CATEGORY_LABELS[c] }))}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Service concerné</label>
            <Select
              label="Service concerné"
              placeholder="Non précisé"
              value={form.subServiceId}
              onChange={(v) => setForm({ ...form, subServiceId: v })}
              options={subServices}
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Objet de la demande</label>
          <TextArea rows={3} value={form.subject} onChange={(v) => setForm({ ...form, subject: v.slice(0, 1000) })} placeholder="Ce que le visiteur demande, en quelques mots" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Notes internes (facultatif)</label>
          <TextArea rows={2} value={form.notes} onChange={(v) => setForm({ ...form, notes: v.slice(0, 2000) })} placeholder="Pièces présentées, remarques…" />
        </div>

        <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
          <input type="checkbox" checked={form.urgent} onChange={(e) => setForm({ ...form, urgent: e.target.checked })} />
          Situation urgente (passe en tête de file)
        </label>

        <div className="flex justify-end gap-2 border-t border-gray-100 pt-4 dark:border-gray-700">
          <Button variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button variant="primary" onClick={submit} disabled={saving}>
            <UserPlus className="mr-2 h-4 w-4" />
            {saving ? 'Enregistrement…' : 'Enregistrer'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

// ------------------------------------------------------------------ rendez-vous d'urgence

const EMPTY_URGENCE = { lastName: '', firstName: '', phone: '', city: '', subServiceId: '', motif: '', urgenceJustification: '' };

/**
 * Nouveau rendez-vous d'urgence : reçu sans créneau, avec ou sans compte Poramma. Sans compte, on saisit
 * seulement nom, prénom, téléphone et ville. Les agents du service choisi sont prévenus.
 */
const UrgenceModal: React.FC<{ isOpen: boolean; onClose: () => void; onCreated: (t: ReceptionTicket) => void; subServices: SubServiceOption[] }> = ({ isOpen, onClose, onCreated, subServices }) => {
  const [mode, setMode] = useState<'visitor' | 'member'>('visitor');
  const [form, setForm] = useState(EMPTY_URGENCE);
  const [member, setMember] = useState<MemberHit | null>(null);
  const [query, setQuery] = useState('');
  const [hits, setHits] = useState<MemberHit[]>([]);
  const [searching, setSearching] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setMode('visitor');
      setForm(EMPTY_URGENCE);
      setMember(null);
      setQuery('');
      setHits([]);
      setError(null);
    }
  }, [isOpen]);

  const search = async () => {
    if (query.trim().length < 2) return;
    setSearching(true);
    try {
      setHits(await receptionApi.searchMembers(query.trim()));
    } catch (e) {
      setError(apiErrorMessage(e, 'Recherche impossible.'));
    } finally {
      setSearching(false);
    }
  };

  const submit = async () => {
    setError(null);
    if (mode === 'member' && !member) return setError('Recherchez et sélectionnez le membre.');
    if (mode === 'visitor') {
      if (!form.lastName.trim() || !form.firstName.trim()) return setError('Le nom et le prénom sont obligatoires.');
      if (form.phone.trim().length < 6) return setError('Le téléphone est obligatoire.');
      if (!form.city.trim()) return setError('La ville est obligatoire.');
    }
    if (!form.subServiceId) return setError('Choisissez le service concerné.');
    if (form.motif.trim().length < 3) return setError('Indiquez le motif du rendez-vous.');
    if (form.urgenceJustification.trim().length < 3) return setError("Justifiez l'urgence.");

    const payload: CreateUrgencePayload = {
      subServiceId: form.subServiceId,
      motif: form.motif.trim(),
      urgenceJustification: form.urgenceJustification.trim(),
      ...(mode === 'member'
        ? { userId: member!.id }
        : { visitor: { lastName: form.lastName.trim(), firstName: form.firstName.trim(), phone: form.phone.trim(), city: form.city.trim() } }),
    };
    setSaving(true);
    try {
      onCreated(await receptionApi.createUrgence(payload));
      onClose();
    } catch (e) {
      setError(apiErrorMessage(e, "Le rendez-vous d'urgence n'a pas pu être créé."));
    } finally {
      setSaving(false);
    }
  };

  const label = 'mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Nouveau rendez-vous (urgence)" size="lg">
      <div className="space-y-4 p-6">
        <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-700 dark:bg-red-900/20 dark:text-red-300">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
          <p>La personne est reçue sans créneau préalable. Tous les agents du service choisi sont prévenus immédiatement.</p>
        </div>

        {error && <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}

        <div className="flex gap-2">
          <Button size="sm" variant={mode === 'visitor' ? 'primary' : 'outline'} onClick={() => setMode('visitor')}>
            Personne sans compte
          </Button>
          <Button size="sm" variant={mode === 'member' ? 'primary' : 'outline'} onClick={() => setMode('member')}>
            Membre Poramma
          </Button>
        </div>

        {mode === 'visitor' ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Input label="Nom *" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} placeholder="Nom de famille" />
            <Input label="Prénom *" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} placeholder="Prénom" />
            <Input label="Téléphone *" type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+212 6…" />
            <Input label="Ville *" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="Ville de résidence" />
          </div>
        ) : member ? (
          <div className="flex items-center justify-between rounded-lg bg-green-50 p-2 text-sm dark:bg-green-900/20">
            <span>
              <b>{member.name}</b> · {member.email}
              {member.inue ? ` · INUE ${member.inue}` : ''}
            </span>
            <button type="button" className="text-xs text-gray-500 hover:text-red-600" onClick={() => setMember(null)}>
              Changer
            </button>
          </div>
        ) : (
          <div>
            <div className="flex gap-2">
              <div className="flex-1">
                <Input
                  placeholder="Nom, email, téléphone ou INUE…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      search();
                    }
                  }}
                  startIcon={<Search className="h-4 w-4" />}
                />
              </div>
              <Button variant="outline" onClick={search} disabled={searching || query.trim().length < 2}>
                Chercher
              </Button>
            </div>
            {hits.length > 0 && (
              <ul className="mt-2 divide-y divide-gray-100 rounded-lg border border-gray-200 dark:divide-gray-700 dark:border-gray-700">
                {hits.map((h) => (
                  <li key={h.id}>
                    <button
                      type="button"
                      className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-800"
                      onClick={() => {
                        setMember(h);
                        setHits([]);
                      }}
                    >
                      <b>{h.name}</b> · {h.email}
                      {h.inue ? ` · INUE ${h.inue}` : ''}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        <div>
          <label className={label}>Service concerné *</label>
          <Select label="Service concerné" placeholder="Sélectionnez un service" value={form.subServiceId} onChange={(v) => setForm({ ...form, subServiceId: v })} options={subServices} />
        </div>
        <Input label="Motif du rendez-vous *" value={form.motif} onChange={(e) => setForm({ ...form, motif: e.target.value })} placeholder="Raison du rendez-vous…" />
        <div>
          <label className={label}>Justification de l'urgence *</label>
          <TextArea rows={3} value={form.urgenceJustification} onChange={(v) => setForm({ ...form, urgenceJustification: v.slice(0, 1000) })} placeholder="Pourquoi cette personne doit-elle être reçue en urgence ?" />
        </div>

        <div className="flex justify-end gap-2 border-t border-gray-100 pt-4 dark:border-gray-700">
          <Button variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button variant="error" onClick={submit} disabled={saving}>
            <AlertTriangle className="mr-2 h-4 w-4" />
            {saving ? 'Création…' : "Créer l'urgence"}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

// ------------------------------------------------------------------ orientation vers un autre service

const RedirectModal: React.FC<{ walkIn: WalkIn | null; onClose: () => void; onConfirm: (w: WalkIn, subServiceId: string, note: string) => void; subServices: SubServiceOption[]; busy: boolean }> = ({ walkIn, onClose, onConfirm, subServices, busy }) => {
  const [target, setTarget] = useState('');
  const [note, setNote] = useState('');

  useEffect(() => {
    if (walkIn) {
      setTarget('');
      setNote('');
    }
  }, [walkIn]);

  // Le service déjà concerné par la demande n'est pas proposé : on oriente vers un AUTRE service.
  const options = subServices.filter((s) => s.value !== walkIn?.subService?.id);

  return (
    <Modal isOpen={!!walkIn} onClose={onClose} title="Orienter le visiteur" size="md">
      {walkIn && (
        <div className="space-y-4 p-6">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            <b>{walkIn.visitorName}</b> — {walkIn.subject}
          </p>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Orienté vers le service *</label>
            <Select label="Service d'orientation" placeholder="Sélectionnez le service" value={target} onChange={setTarget} options={options} />
            <p className="mt-1 text-xs text-gray-500">Les agents de ce service sont prévenus.</p>
          </div>
          <Input label="Précision (facultatif)" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Bureau, personne à voir…" />
          <div className="flex justify-end gap-2 border-t border-gray-100 pt-4 dark:border-gray-700">
            <Button variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button variant="primary" disabled={!target || busy} onClick={() => onConfirm(walkIn, target, note)}>
              Orienter
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
};

// ------------------------------------------------------------------ page

export const AccueilPage: React.FC = () => {
  const [tab, setTab] = useState<Tab>('rdv');
  const [summary, setSummary] = useState<ReceptionSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // tickets
  const [ticketInput, setTicketInput] = useState('');
  const [found, setFound] = useState<ReceptionTicket | null>(null);
  const [looking, setLooking] = useState(false);
  const [validatingId, setValidatingId] = useState<string | null>(null);
  const [appointments, setAppointments] = useState<ReceptionTicket[]>([]);
  const [rdvSearch, setRdvSearch] = useState('');

  // registre
  const [walkIns, setWalkIns] = useState<WalkIn[]>([]);
  const [walkStatus, setWalkStatus] = useState('ACTIVE');
  const [showNew, setShowNew] = useState(false);
  const [showUrgence, setShowUrgence] = useState(false);
  const [redirecting, setRedirecting] = useState<WalkIn | null>(null);
  const [subServices, setSubServices] = useState<SubServiceOption[]>([]);
  const [busyWalkId, setBusyWalkId] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const [s, a, w] = await Promise.all([receptionApi.summary(), receptionApi.appointments(), receptionApi.walkIns({ status: walkStatus })]);
      setSummary(s);
      setAppointments(a);
      setWalkIns(w);
    } catch (e) {
      setError(apiErrorMessage(e, "Impossible de charger le poste d'accueil."));
    }
  }, [walkStatus]);

  useEffect(() => {
    refresh();
    const timer = window.setInterval(refresh, 30000); // la file bouge : rafraîchissement discret
    return () => window.clearInterval(timer);
  }, [refresh]);

  useEffect(() => {
    api
      .get('/services')
      .then(({ data }) => {
        const options: SubServiceOption[] = (data.data as { name: string; subServices?: { id: string; name: string; active?: boolean }[] }[]).flatMap((svc) =>
          (svc.subServices ?? []).filter((s) => s.active !== false).map((s) => ({ value: s.id, label: `${svc.name} — ${s.name}` }))
        );
        setSubServices(options);
      })
      .catch(() => undefined);
  }, []);

  const lookup = async () => {
    const value = ticketInput.trim();
    if (!value) return;
    setLooking(true);
    setError(null);
    setNotice(null);
    setFound(null);
    try {
      setFound(await receptionApi.lookup(value));
    } catch (e) {
      setError(apiErrorMessage(e, 'Ticket introuvable.'));
    } finally {
      setLooking(false);
    }
  };

  const validate = async (t: ReceptionTicket) => {
    setValidatingId(t.id);
    setError(null);
    setNotice(null);
    try {
      const updated = await receptionApi.validate(t.id);
      setNotice(`Arrivée validée : ${updated.citizen.name} (${updated.subServiceName}). L'agent est prévenu.`);
      setFound((f) => (f && f.id === t.id ? updated : f));
      setTicketInput('');
      await refresh();
    } catch (e) {
      setError(apiErrorMessage(e, "Le ticket n'a pas pu être validé."));
    } finally {
      setValidatingId(null);
    }
  };

  const filteredAppointments = useMemo(() => {
    const q = rdvSearch.trim().toLowerCase();
    if (!q) return appointments;
    return appointments.filter((t) => [t.ticketId, t.citizen.name, t.citizen.inue, t.citizen.phone, t.subServiceName].some((x) => x?.toLowerCase().includes(q)));
  }, [appointments, rdvSearch]);

  const updateWalk = async (id: string, patch: Parameters<typeof receptionApi.updateWalkIn>[1], success: string) => {
    setBusyWalkId(id);
    setError(null);
    try {
      await receptionApi.updateWalkIn(id, patch);
      setNotice(success);
      await refresh();
    } catch (e) {
      setError(apiErrorMessage(e, "La demande n'a pas pu être mise à jour."));
    } finally {
      setBusyWalkId(null);
    }
  };

  /** Clôture directe, sans question : « Traité » et « Parti » ne demandent aucune confirmation. */
  const finish = (w: WalkIn, status: 'DONE' | 'ABANDONED') => {
    updateWalk(w.id, { status }, status === 'DONE' ? 'Demande traitée.' : 'Demande clôturée.');
  };

  /** Orientation vers un AUTRE service (précisé dans la fenêtre) : les agents de ce service sont prévenus. */
  const redirect = async (w: WalkIn, subServiceId: string, note: string) => {
    await updateWalk(w.id, { status: 'REDIRECTED', redirectedSubServiceId: subServiceId, outcome: note.trim() || null }, 'Visiteur orienté : les agents du service sont prévenus.');
    setRedirecting(null);
  };

  const createDossier = async (w: WalkIn) => {
    setBusyWalkId(w.id);
    setError(null);
    try {
      const updated = await receptionApi.createDossier(w.id);
      setNotice(`Dossier ${updated.demande?.dossierNumber ?? ''} créé : il apparaît dans l'espace de ${updated.member?.name ?? 'le membre'}.`);
      await refresh();
    } catch (e) {
      setError(apiErrorMessage(e, "Le dossier n'a pas pu être créé."));
    } finally {
      setBusyWalkId(null);
    }
  };

  const chip = (label: string, value: number | string | undefined, tone = 'border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800') => (
    <div className={`rounded-xl border px-4 py-3 ${tone}`}>
      <div className="text-2xl font-semibold text-gray-900 dark:text-white">{value ?? '—'}</div>
      <div className="text-xs text-gray-500 dark:text-gray-400">{label}</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6 dark:bg-gray-900">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Poste d'accueil</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Validez les tickets de rendez-vous et enregistrez les demandes des usagers qui se présentent.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="error" onClick={() => setShowUrgence(true)}>
              <AlertTriangle className="mr-2 h-4 w-4" />
              Nouveau rendez-vous
            </Button>
            <Button variant="primary" onClick={() => setShowNew(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Nouvelle demande sur place
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {chip('Rendez-vous attendus', summary?.rendezVous.expected)}
          {chip('Arrivés', summary?.rendezVous.arrived, 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20')}
          {chip('Demandes en attente', summary?.walkIns.waiting, summary && summary.walkIns.waiting > 0 ? 'border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20' : undefined)}
          {chip('Demandes traitées', summary?.walkIns.closed)}
        </div>

        {(error || notice) && (
          <p className={`rounded-lg border p-3 text-sm ${error ? 'border-red-200 bg-red-50 text-red-700' : 'border-green-200 bg-green-50 text-green-700'}`}>{error ?? notice}</p>
        )}

        {/* Validation d'un ticket */}
        <Card className="p-4">
          <h2 className="mb-3 flex items-center gap-2 font-semibold text-gray-900 dark:text-white">
            <QrCode className="h-5 w-5 text-brand-500" /> Valider un ticket de rendez-vous
          </h2>
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="flex-1">
              <Input
                placeholder="Numéro du ticket (RDV-20260920-001) — saisissez-le ou scannez le QR code"
                value={ticketInput}
                autoFocus
                onChange={(e) => setTicketInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    lookup();
                  }
                }}
                startIcon={<QrCode className="h-4 w-4" />}
              />
            </div>
            <Button variant="primary" onClick={lookup} disabled={looking || !ticketInput.trim()}>
              {looking ? 'Recherche…' : 'Vérifier le ticket'}
            </Button>
          </div>
          {found && (
            <div className="mt-4 max-w-2xl">
              <TicketCard ticket={found} busy={validatingId === found.id} onValidate={validate} onClose={() => setFound(null)} />
            </div>
          )}
        </Card>

        {/* Onglets */}
        <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
          {(
            [
              ['rdv', 'Rendez-vous du jour', ClipboardList],
              ['walkins', 'Demandes sur place', FilePlus2],
            ] as const
          ).map(([key, label, Icon]) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={`-mb-px flex items-center gap-2 border-b-2 px-4 py-2 text-sm font-medium ${
                tab === key ? 'border-brand-500 text-brand-600' : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>

        {tab === 'rdv' && (
          <Card className="p-4">
            <div className="mb-3 max-w-md">
              <Input placeholder="Filtrer (ticket, nom, INUE, service)…" value={rdvSearch} onChange={(e) => setRdvSearch(e.target.value)} startIcon={<Search className="h-4 w-4" />} />
            </div>
            {filteredAppointments.length === 0 ? (
              <p className="py-8 text-center text-sm text-gray-400">Aucun rendez-vous aujourd'hui.</p>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-gray-700">
                {filteredAppointments.map((t) => {
                  const st = TICKET_STATUS_LABELS[t.status] ?? { label: t.status, color: 'gray' as const };
                  return (
                    <div key={t.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 dark:text-white">
                          <span className="mr-2 tabular-nums text-brand-600">{t.startTime ?? '--:--'}</span>
                          {t.citizen.name}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {t.subServiceName} · <span className="font-mono text-xs">{t.ticketId}</span>
                          {t.agentName ? ` · ${t.agentName}` : ''}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {t.isUrgent && (
                          <Badge color="error" variant="solid" size="xs">
                            Urgent
                          </Badge>
                        )}
                        <Badge color={st.color} variant="light" size="xs">
                          {st.label}
                        </Badge>
                        {canValidate(t) && (
                          <Button size="sm" variant="primary" disabled={validatingId === t.id} onClick={() => validate(t)}>
                            <CheckCircle className="mr-1 h-4 w-4" />
                            Valider
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        )}

        {tab === 'walkins' && (
          <Card className="p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <div className="w-64">
                <Select
                  value={walkStatus}
                  onChange={setWalkStatus}
                  options={[
                    { value: 'ACTIVE', label: 'En attente et en cours' },
                    { value: '', label: 'Toutes (300 dernières)' },
                    { value: 'DONE', label: 'Traitées' },
                    { value: 'REDIRECTED', label: 'Orientées' },
                    { value: 'ABANDONED', label: 'Parties sans être servies' },
                  ]}
                />
              </div>
              <p className="text-sm text-gray-500">{walkIns.length} demande(s)</p>
            </div>
            {walkIns.length === 0 ? (
              <p className="py-8 text-center text-sm text-gray-400">Aucune demande dans cette liste.</p>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-gray-700">
                {walkIns.map((w) => {
                  const active = w.status === 'WAITING' || w.status === 'IN_SERVICE';
                  return (
                    <div key={w.id} className="space-y-2 py-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded bg-gray-100 px-2 py-0.5 font-mono text-xs text-gray-700 dark:bg-gray-700 dark:text-gray-200">{w.reference}</span>
                            <span className="font-semibold text-gray-900 dark:text-white">{w.visitorName}</span>
                            {w.priority === 'URGENT' && (
                              <Badge color="error" variant="solid" size="xs">
                                Urgent
                              </Badge>
                            )}
                            {w.member && (
                              <Badge color="success" variant="light" size="xs">
                                Compte Poramma
                              </Badge>
                            )}
                          </div>
                          <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">{w.subject}</p>
                          <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                            {WALKIN_CATEGORY_LABELS[w.category]}
                            {w.subService ? ` · ${w.subService.name}` : ''}
                            {w.visitorPhone ? ` · ${w.visitorPhone}` : ''} · {timeAgo(w.createdAt)} par {w.registeredByName}
                          </p>
                          {w.outcome && <p className="mt-0.5 text-xs italic text-gray-500">Résultat : {w.outcome}</p>}
                          {w.demande && <p className="mt-0.5 text-xs text-green-700">Dossier {w.demande.dossierNumber} créé</p>}
                        </div>
                        <Badge color={WALKIN_STATUS_COLOR[w.status]} variant="light" size="xs">
                          {WALKIN_STATUS_LABELS[w.status]}
                        </Badge>
                      </div>
                      {active && (
                        <div className="flex flex-wrap gap-2">
                          {w.status === 'WAITING' && (
                            <Button size="xs" variant="primary" disabled={busyWalkId === w.id} onClick={() => updateWalk(w.id, { status: 'IN_SERVICE' }, 'Demande prise en charge.')}>
                              Prendre en charge
                            </Button>
                          )}
                          <Button size="xs" variant="success" disabled={busyWalkId === w.id} onClick={() => finish(w, 'DONE')}>
                            Traité
                          </Button>
                          <Button size="xs" variant="outline" disabled={busyWalkId === w.id} onClick={() => setRedirecting(w)}>
                            Orienter
                          </Button>
                          <Button size="xs" variant="outline" disabled={busyWalkId === w.id} onClick={() => finish(w, 'ABANDONED')}>
                            Parti
                          </Button>
                          {w.member && w.subService && !w.demande && (
                            <Button size="xs" variant="outline" disabled={busyWalkId === w.id} onClick={() => createDossier(w)}>
                              <FilePlus2 className="mr-1 h-3.5 w-3.5" />
                              Créer le dossier
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        )}
      </div>

      <UrgenceModal
        isOpen={showUrgence}
        onClose={() => setShowUrgence(false)}
        subServices={subServices}
        onCreated={(t) => {
          setNotice(`Rendez-vous d'urgence créé — ticket ${t.ticketId} pour ${t.citizen.name}. Les agents du service sont prévenus.`);
          setTab('rdv');
          refresh();
        }}
      />

      <RedirectModal walkIn={redirecting} onClose={() => setRedirecting(null)} subServices={subServices} onConfirm={redirect} busy={busyWalkId !== null} />

      <NewWalkInModal
        isOpen={showNew}
        onClose={() => setShowNew(false)}
        subServices={subServices}
        onCreated={(w) => {
          setNotice(`Demande enregistrée — numéro d'ordre ${w.reference}.`);
          setTab('walkins');
          refresh();
        }}
      />
    </div>
  );
};

export default AccueilPage;
