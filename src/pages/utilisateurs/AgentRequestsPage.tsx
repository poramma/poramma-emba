// src/pages/utilisateurs/AgentRequestsPage.tsx
//
// Traitement par l'administrateur des demandes d'accès et signalements des agents.
// Chaque décision est accompagnée d'une réponse écrite qui revient à l'agent
// (notification + email) ; l'acceptation d'un accès à un service peut créer
// l'affectation dans la foulée.

import React, { useEffect, useState } from 'react';
import { Search, Inbox, CheckCircle, XCircle, Play, Check } from 'lucide-react';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Select } from '../../components/ui/select';
import { Modal } from '../../components/ui/modal';
import { TextArea } from '../../components/ui/textarea';
import { Pagination } from '../../components/ui/pagination';
import { useDebouncedSearch } from '../../hooks/useDebouncedSearch';
import { formatDateTime } from '../../lib/date';
import {
  REQUEST_CATEGORY_LABELS,
  REQUEST_KIND_LABELS,
  REQUEST_STATUS_LABELS,
  useAgentRequestsStore,
  type AgentRequest,
  type AgentRequestKind,
  type AgentRequestStatus,
} from '../../store/agentRequestsStore';

const STATUS_COLOR: Record<AgentRequestStatus, 'warning' | 'info' | 'success' | 'error'> = {
  PENDING: 'warning',
  IN_PROGRESS: 'info',
  APPROVED: 'success',
  REJECTED: 'error',
  RESOLVED: 'success',
};

const FINAL: AgentRequestStatus[] = ['APPROVED', 'REJECTED', 'RESOLVED'];
const PAGE_SIZE = 15;

export const AgentRequestsPage: React.FC = () => {
  const { all, meta, isLoading, fetchAll, process } = useAgentRequestsStore();

  const [status, setStatus] = useState<AgentRequestStatus | ''>('PENDING');
  const [kind, setKind] = useState<AgentRequestKind | ''>('');
  const [searchText, setSearchText] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const [selected, setSelected] = useState<AgentRequest | null>(null);
  const [response, setResponse] = useState('');
  const [applyAssignment, setApplyAssignment] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useDebouncedSearch(searchText, (text) => {
    setSearch(text);
    setPage(1);
  });

  useEffect(() => {
    fetchAll({ status, kind, search, page, limit: PAGE_SIZE });
  }, [fetchAll, status, kind, search, page]);

  const open = (r: AgentRequest) => {
    setSelected(r);
    setResponse('');
    setApplyAssignment(true);
    setError(null);
  };

  const decide = async (next: 'IN_PROGRESS' | 'APPROVED' | 'REJECTED' | 'RESOLVED') => {
    if (!selected) return;
    if (FINAL.includes(next) && !response.trim()) {
      setError("Rédigez une réponse : l'agent la recevra avec votre décision.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const updated = await process(selected.id, {
        status: next,
        response: response.trim() || undefined,
        applyAssignment: next === 'APPROVED' && selected.category === 'SERVICE_ACCESS' ? applyAssignment : undefined,
      });
      setSelected(next === 'IN_PROGRESS' ? { ...selected, ...updated } : null);
      fetchAll({ status, kind, search, page, limit: PAGE_SIZE });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Le traitement n'a pas pu être enregistré.");
    } finally {
      setBusy(false);
    }
  };

  const isClosed = selected ? FINAL.includes(selected.status) : false;

  return (
    <div className="min-h-screen bg-gray-50 p-6 dark:bg-gray-900">
      <div className="mx-auto max-w-6xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Demandes des agents</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Demandes d'accès et signalements adressés à l'administration
            {meta?.openCount !== undefined ? ` — ${meta.openCount} en attente de traitement` : ''}.
          </p>
        </div>

        <Card className="p-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Input placeholder="Rechercher (agent, objet…)" value={searchText} onChange={(e) => setSearchText(e.target.value)} startIcon={<Search className="h-4 w-4" />} />
            <Select
              value={status}
              onChange={(v) => {
                setStatus(v as AgentRequestStatus | '');
                setPage(1);
              }}
              options={[
                { value: '', label: 'Tous les statuts' },
                ...(Object.keys(REQUEST_STATUS_LABELS) as AgentRequestStatus[]).map((s) => ({ value: s, label: REQUEST_STATUS_LABELS[s] })),
              ]}
            />
            <Select
              value={kind}
              onChange={(v) => {
                setKind(v as AgentRequestKind | '');
                setPage(1);
              }}
              options={[
                { value: '', label: 'Tous les types' },
                { value: 'ACCESS_REQUEST', label: REQUEST_KIND_LABELS.ACCESS_REQUEST },
                { value: 'REPORT', label: REQUEST_KIND_LABELS.REPORT },
              ]}
            />
          </div>
        </Card>

        <Card className="p-4">
          {all.length === 0 ? (
            <div className="flex flex-col items-center py-10 text-gray-400">
              <Inbox className="mb-2 h-10 w-10 opacity-50" />
              <p className="text-sm">{isLoading ? 'Chargement…' : 'Aucune demande correspondante'}</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              {all.map((r) => (
                <button key={r.id} type="button" onClick={() => open(r)} className="flex w-full items-start justify-between gap-3 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium text-gray-900 dark:text-white">{r.subject}</span>
                      <Badge color={STATUS_COLOR[r.status]} variant="light" size="xs">
                        {REQUEST_STATUS_LABELS[r.status]}
                      </Badge>
                      <Badge color="gray" variant="light" size="xs">
                        {REQUEST_KIND_LABELS[r.kind]} · {REQUEST_CATEGORY_LABELS[r.category]}
                      </Badge>
                    </div>
                    <div className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
                      {r.requester.name ?? r.requester.email ?? 'Agent'} · {formatDateTime(r.createdAt)}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {meta && meta.totalPages > 1 && (
            <div className="mt-4">
              <Pagination currentPage={page} totalPages={meta.totalPages} totalItems={meta.total} itemsPerPage={PAGE_SIZE} onPageChange={setPage} showItemsCount />
            </div>
          )}
        </Card>
      </div>

      <Modal isOpen={!!selected} onClose={() => setSelected(null)} title={selected?.subject ?? ''} size="lg">
        {selected && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge color={STATUS_COLOR[selected.status]} variant="light">
                {REQUEST_STATUS_LABELS[selected.status]}
              </Badge>
              <Badge color="gray" variant="light">
                {REQUEST_KIND_LABELS[selected.kind]} · {REQUEST_CATEGORY_LABELS[selected.category]}
              </Badge>
            </div>

            <div className="text-sm text-gray-600 dark:text-gray-300">
              De <span className="font-medium text-gray-900 dark:text-white">{selected.requester.name ?? '—'}</span>
              {selected.requester.email ? ` (${selected.requester.email})` : ''} · {formatDateTime(selected.createdAt)}
              {selected.targetSubService && (
                <div>
                  Service concerné : <span className="font-medium">{selected.targetSubService.name}</span>
                </div>
              )}
              {selected.targetPermission && <div>Permission souhaitée : {selected.targetPermission}</div>}
            </div>

            <p className="whitespace-pre-wrap rounded-lg bg-gray-50 p-3 text-sm text-gray-700 dark:bg-gray-800 dark:text-gray-200">{selected.description}</p>

            {isClosed || selected.adminResponse ? (
              <div className="rounded-lg border border-brand-200 p-3 text-sm dark:border-brand-900/40">
                <div className="text-xs text-gray-500">
                  Réponse{selected.handledByName ? ` de ${selected.handledByName}` : ''}
                  {selected.handledAt ? ` · ${formatDateTime(selected.handledAt)}` : ''}
                </div>
                <p className="mt-1 whitespace-pre-wrap text-gray-700 dark:text-gray-200">{selected.adminResponse ?? '—'}</p>
              </div>
            ) : null}

            {!isClosed && (
              <div className="space-y-3 border-t border-gray-200 pt-4 dark:border-gray-700">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Votre réponse à l'agent</label>
                <TextArea rows={4} value={response} onChange={setResponse} placeholder="Expliquez votre décision : l'agent la recevra par notification et par email." />

                {selected.category === 'SERVICE_ACCESS' && selected.targetSubService && (
                  <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                    <input type="checkbox" checked={applyAssignment} onChange={(e) => setApplyAssignment(e.target.checked)} className="rounded text-brand-500" />
                    En cas d'acceptation, affecter l'agent à « {selected.targetSubService.name} » immédiatement
                  </label>
                )}

                {error && <p className="text-sm text-red-600">{error}</p>}

                <div className="flex flex-wrap justify-end gap-2">
                  {selected.status === 'PENDING' && (
                    <Button variant="outline" onClick={() => decide('IN_PROGRESS')} disabled={busy}>
                      <Play className="mr-1 h-4 w-4" />
                      Prendre en charge
                    </Button>
                  )}
                  {selected.kind === 'ACCESS_REQUEST' ? (
                    <>
                      <Button variant="error" onClick={() => decide('REJECTED')} disabled={busy}>
                        <XCircle className="mr-1 h-4 w-4" />
                        Refuser
                      </Button>
                      <Button variant="success" onClick={() => decide('APPROVED')} disabled={busy}>
                        <CheckCircle className="mr-1 h-4 w-4" />
                        Accepter
                      </Button>
                    </>
                  ) : (
                    <Button variant="success" onClick={() => decide('RESOLVED')} disabled={busy}>
                      <Check className="mr-1 h-4 w-4" />
                      Marquer comme résolu
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AgentRequestsPage;
