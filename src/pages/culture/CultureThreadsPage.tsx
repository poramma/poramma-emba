// src/pages/culture/CultureThreadsPage.tsx
//
// File des échanges directs des membres avec le Conseiller Culturel : compteurs, filtre, recherche.

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Inbox, Search } from 'lucide-react';
import { Card } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Pagination } from '../../components/ui/pagination';
import { useDebouncedSearch } from '../../hooks/useDebouncedSearch';
import { formatDateTime, timeAgo } from '../../lib/date';
import { apiErrorMessage, cultureApi, THREAD_STATUS_COLOR, THREAD_STATUS_LABELS, type CultureThreadsPage as ThreadsPage } from '../../lib/cultureApi';

const PAGE_SIZE = 15;

export const CultureThreadsPage: React.FC = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState('ACTIVE');
  const [searchText, setSearchText] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<ThreadsPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useDebouncedSearch(searchText, (text) => {
    setSearch(text);
    setPage(1);
  });

  useEffect(() => {
    setLoading(true);
    cultureApi
      .listThreads({ status, search, page, limit: PAGE_SIZE })
      .then((r) => {
        setResult(r);
        setError(null);
      })
      .catch((e) => setError(apiErrorMessage(e, 'Impossible de charger les échanges.')))
      .finally(() => setLoading(false));
  }, [status, search, page]);

  const stats = result?.meta.stats;
  const chip = (label: string, count: number | undefined, value: string) => (
    <button
      key={label}
      type="button"
      onClick={() => {
        setStatus(value);
        setPage(1);
      }}
      className={`rounded-xl border px-4 py-2 text-left transition-colors ${
        status === value ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20' : 'border-gray-200 bg-white hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800'
      }`}
    >
      <div className="text-xl font-semibold text-gray-900 dark:text-white">{count ?? '—'}</div>
      <div className="text-xs text-gray-500 dark:text-gray-400">{label}</div>
    </button>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6 dark:bg-gray-900">
      <div className="mx-auto max-w-5xl space-y-6">
        <button type="button" onClick={() => navigate('/culture')} className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-brand-600 dark:text-gray-400">
          <ArrowLeft className="h-4 w-4" />
          Espace culturel
        </button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Échanges avec la communauté</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Messages directs adressés au Conseiller Culturel. Vos réponses sont signées de votre nom.</p>
        </div>

        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
          {chip('Actifs', stats ? stats.open + stats.answered : undefined, 'ACTIVE')}
          {chip('À traiter', stats?.open, 'OPEN')}
          {chip('Répondus', stats?.answered, 'ANSWERED')}
          {chip('Clos', stats?.closed, 'CLOSED')}
        </div>

        <Card className="p-4">
          <Input placeholder="Rechercher (n°, objet, nom, email)…" value={searchText} onChange={(e) => setSearchText(e.target.value)} startIcon={<Search className="h-4 w-4" />} />
        </Card>

        {error && <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}

        <Card className="p-4">
          {!result || result.data.length === 0 ? (
            <div className="flex flex-col items-center py-10 text-gray-400">
              <Inbox className="mb-2 h-10 w-10 opacity-50" />
              <p className="text-sm">{loading ? 'Chargement…' : 'Aucun échange correspondant'}</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              {result.data.map((t) => (
                <button key={t.id} type="button" onClick={() => navigate(`/culture/echanges/${t.id}`)} className="flex w-full items-start justify-between gap-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs text-gray-500">{t.reference}</span>
                      <span className="font-medium text-gray-900 dark:text-white">{t.subject}</span>
                    </div>
                    <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
                      {t.requester.name ?? t.requester.email ?? 'Membre'}
                      {t.advisor?.name ? ` · suivi par ${t.advisor.name}` : ''}
                    </p>
                    <p className="mt-0.5 text-xs text-gray-400" title={formatDateTime(t.lastMessageAt)}>
                      dernière activité {timeAgo(t.lastMessageAt)}
                    </p>
                  </div>
                  <Badge color={THREAD_STATUS_COLOR[t.status]} variant="light" size="xs">
                    {THREAD_STATUS_LABELS[t.status]}
                  </Badge>
                </button>
              ))}
            </div>
          )}
          {result && result.meta.totalPages > 1 && (
            <div className="mt-4">
              <Pagination currentPage={page} totalPages={result.meta.totalPages} totalItems={result.meta.total} itemsPerPage={PAGE_SIZE} onPageChange={setPage} showItemsCount />
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default CultureThreadsPage;
