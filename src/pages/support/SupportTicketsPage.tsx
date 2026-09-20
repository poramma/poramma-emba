// src/pages/support/SupportTicketsPage.tsx
//
// File des tickets de support des usagers (administrateur) : compteurs,
// filtres, recherche en temps réel, pagination. Un clic ouvre le fil du ticket.

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Inbox, Search, UserCheck, UserX } from 'lucide-react';
import { Card } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Select } from '../../components/ui/select';
import { Pagination } from '../../components/ui/pagination';
import { useDebouncedSearch } from '../../hooks/useDebouncedSearch';
import { formatDateTime, timeAgo } from '../../lib/date';
import {
  TICKET_CATEGORY_LABELS,
  TICKET_PRIORITY_LABELS,
  TICKET_STATUS_LABELS,
  useSupportTicketsStore,
  type TicketPriority,
  type TicketStatus,
} from '../../store/supportTicketsStore';

export const STATUS_COLOR: Record<TicketStatus, 'info' | 'primary' | 'warning' | 'success' | 'gray'> = {
  OPEN: 'info',
  IN_PROGRESS: 'primary',
  WAITING_USER: 'warning',
  RESOLVED: 'success',
  CLOSED: 'gray',
};

export const PRIORITY_COLOR: Record<TicketPriority, 'gray' | 'info' | 'warning' | 'error'> = {
  LOW: 'gray',
  NORMAL: 'info',
  HIGH: 'warning',
  URGENT: 'error',
};

const PAGE_SIZE = 15;

export const SupportTicketsPage: React.FC = () => {
  const navigate = useNavigate();
  const { tickets, meta, isLoading, fetchTickets } = useSupportTicketsStore();

  const [status, setStatus] = useState('ACTIVE');
  const [category, setCategory] = useState('');
  const [priority, setPriority] = useState('');
  const [assigned, setAssigned] = useState('');
  const [searchText, setSearchText] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  useDebouncedSearch(searchText, (text) => {
    setSearch(text);
    setPage(1);
  });

  useEffect(() => {
    fetchTickets({ status, category, priority, assigned, search, page, limit: PAGE_SIZE });
  }, [fetchTickets, status, category, priority, assigned, search, page]);

  const stats = meta?.stats;
  const chip = (label: string, count: number | undefined, apply: () => void, active: boolean) => (
    <button
      key={label}
      type="button"
      onClick={() => {
        apply();
        setPage(1);
      }}
      className={`rounded-xl border px-4 py-2 text-left transition-colors ${
        active ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20' : 'border-gray-200 bg-white hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800'
      }`}
    >
      <div className="text-xl font-semibold text-gray-900 dark:text-white">{count ?? '—'}</div>
      <div className="text-xs text-gray-500 dark:text-gray-400">{label}</div>
    </button>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6 dark:bg-gray-900">
      <div className="mx-auto max-w-7xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Tickets de support</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Messages des usagers à l'ambassade : prise en charge, réponses et suivi jusqu'à la résolution.</p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
          {chip('Ouverts', stats?.open, () => { setStatus('OPEN'); setAssigned(''); }, status === 'OPEN' && !assigned)}
          {chip('En cours', stats?.inProgress, () => { setStatus('IN_PROGRESS'); setAssigned(''); }, status === 'IN_PROGRESS' && !assigned)}
          {chip("Attente usager", stats?.waitingUser, () => { setStatus('WAITING_USER'); setAssigned(''); }, status === 'WAITING_USER' && !assigned)}
          {chip('Résolus', stats?.resolved, () => { setStatus('RESOLVED'); setAssigned(''); }, status === 'RESOLVED' && !assigned)}
          {chip('Clôturés', stats?.closed, () => { setStatus('CLOSED'); setAssigned(''); }, status === 'CLOSED' && !assigned)}
          {chip('Non assignés', stats?.unassigned, () => { setStatus('ACTIVE'); setAssigned('unassigned'); }, assigned === 'unassigned')}
          {chip('Assignés à moi', stats?.mine, () => { setStatus('ACTIVE'); setAssigned('me'); }, assigned === 'me')}
        </div>

        <Card className="p-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Input placeholder="Rechercher (n°, objet, usager, email)…" value={searchText} onChange={(e) => setSearchText(e.target.value)} startIcon={<Search className="h-4 w-4" />} />
            <Select
              value={status}
              onChange={(v) => { setStatus(v); setPage(1); }}
              options={[
                { value: 'ACTIVE', label: 'Tous les tickets actifs' },
                { value: '', label: 'Tous les statuts' },
                ...(Object.keys(TICKET_STATUS_LABELS) as TicketStatus[]).map((s) => ({ value: s, label: TICKET_STATUS_LABELS[s] })),
              ]}
            />
            <Select
              value={priority}
              onChange={(v) => { setPriority(v); setPage(1); }}
              options={[{ value: '', label: 'Toutes les priorités' }, ...(Object.keys(TICKET_PRIORITY_LABELS) as TicketPriority[]).map((p) => ({ value: p, label: TICKET_PRIORITY_LABELS[p] }))]}
            />
            <Select
              value={category}
              onChange={(v) => { setCategory(v); setPage(1); }}
              options={[{ value: '', label: 'Toutes les natures' }, ...Object.entries(TICKET_CATEGORY_LABELS).map(([value, label]) => ({ value, label }))]}
            />
          </div>
        </Card>

        <Card className="p-4">
          {tickets.length === 0 ? (
            <div className="flex flex-col items-center py-10 text-gray-400">
              <Inbox className="mb-2 h-10 w-10 opacity-50" />
              <p className="text-sm">{isLoading ? 'Chargement…' : 'Aucun ticket correspondant'}</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              {tickets.map((t) => {
                const active = t.status === 'OPEN' || t.status === 'IN_PROGRESS' || t.status === 'WAITING_USER';
                const awaitsStaff = active && t.lastMessageBy === 'USER';
                return (
                  <button key={t.id} type="button" onClick={() => navigate(`/support-tickets/${t.id}`)} className="flex w-full items-start justify-between gap-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs text-gray-500">{t.reference}</span>
                        <span className="font-medium text-gray-900 dark:text-white">{t.subject}</span>
                        {awaitsStaff && (
                          <Badge color="error" variant="light" size="xs">
                            À traiter
                          </Badge>
                        )}
                      </div>
                      <div className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
                        {t.requester.name ?? t.requester.email ?? 'Usager'} · {TICKET_CATEGORY_LABELS[t.category]}
                        {t.linkedReference ? ` · Réf. ${t.linkedReference}` : ''}
                      </div>
                      <div className="mt-0.5 flex items-center gap-1 text-xs text-gray-400" title={formatDateTime(t.lastMessageAt)}>
                        {t.assignee ? (
                          <>
                            <UserCheck className="h-3 w-3" /> {t.assignee.name}
                          </>
                        ) : (
                          <>
                            <UserX className="h-3 w-3" /> Non assigné
                          </>
                        )}
                        <span>· dernière activité {timeAgo(t.lastMessageAt)}</span>
                      </div>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <Badge color={STATUS_COLOR[t.status]} variant="light" size="xs">
                        {TICKET_STATUS_LABELS[t.status]}
                      </Badge>
                      <Badge color={PRIORITY_COLOR[t.priority]} variant="light" size="xs">
                        Priorité {TICKET_PRIORITY_LABELS[t.priority].toLowerCase()}
                      </Badge>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {meta && meta.totalPages > 1 && (
            <div className="mt-4">
              <Pagination currentPage={page} totalPages={meta.totalPages} totalItems={meta.total} itemsPerPage={PAGE_SIZE} onPageChange={setPage} showItemsCount />
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default SupportTicketsPage;
