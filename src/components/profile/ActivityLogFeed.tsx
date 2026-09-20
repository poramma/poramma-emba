// src/components/profile/ActivityLogFeed.tsx
//
// « Mon activité » : les actions de l'agent connecté, lues dans le journal
// d'audit (GET /audit/me). Chaque ligne dit ce qui a été fait, sur quoi
// (numéro de dossier, ticket, nom…), quand, et si l'action a abouti.

import React, { useState } from 'react';
import { Activity, Clock, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { ActivityLogEntry } from '../../types/profile';
import { formatDateShort, timeAgo, formatDateTime } from '../../lib/date';
import { AUDIT_ACTION_VERBS, actionLabel, entityLabel } from '../../config/audit-labels';

interface ActivityLogFeedProps {
  activities?: ActivityLogEntry[];
  isLoading?: boolean;
  hasMore?: boolean;
  lastLoginAt?: string | null;
  onLoadMore?: (offset: number) => Promise<void>;
}

const dayKey = (iso: string) => {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const dayLabel = (key: string) => {
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (key === dayKey(today.toISOString())) return "Aujourd'hui";
  if (key === dayKey(yesterday.toISOString())) return 'Hier';
  return formatDateShort(`${key}T12:00:00`);
};

/** Phrase lisible : « Vous avez validé Demande · DOS-2026-0042 ». */
const sentence = (a: ActivityLogEntry) => {
  const verb = AUDIT_ACTION_VERBS[a.action] ?? `avez effectué « ${actionLabel(a.action).toLowerCase()} » sur`;
  const noTarget = a.action === 'LOGIN' || a.action === 'LOGOUT' || a.entityType === 'AUTHENTIFICATION' || a.entityType === 'SESSION';
  return { verb, target: noTarget ? null : a.targetLabel ? `${entityLabel(a.entityType).toLowerCase()} ${a.targetLabel}` : entityLabel(a.entityType).toLowerCase() };
};

export const ActivityLogFeed: React.FC<ActivityLogFeedProps> = ({ activities = [], isLoading = false, hasMore = false, lastLoginAt = null, onLoadMore }) => {
  const [loadingMore, setLoadingMore] = useState(false);

  const handleLoadMore = async () => {
    if (!onLoadMore) return;
    setLoadingMore(true);
    try {
      await onLoadMore(activities.length);
    } finally {
      setLoadingMore(false);
    }
  };

  if (isLoading && activities.length === 0) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 w-1/4 rounded bg-gray-200 dark:bg-gray-700" />
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-700" />
              <div className="flex-1">
                <div className="h-4 w-3/4 rounded bg-gray-200 dark:bg-gray-700" />
                <div className="mt-1 h-3 w-1/2 rounded bg-gray-200 dark:bg-gray-700" />
              </div>
            </div>
          ))}
        </div>
      </Card>
    );
  }

  const groups = new Map<string, ActivityLogEntry[]>();
  for (const a of activities) {
    const key = dayKey(a.at);
    groups.set(key, [...(groups.get(key) ?? []), a]);
  }

  return (
    <Card className="p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Mon activité</h4>
          <p className="text-sm text-gray-500 dark:text-gray-400">Vos actions dans le système, de la plus récente à la plus ancienne.</p>
        </div>
        {lastLoginAt && (
          <div className="text-sm text-gray-500 dark:text-gray-400">
            <Clock className="mr-1 inline h-4 w-4" />
            Dernière connexion : {formatDateTime(lastLoginAt)}
          </div>
        )}
      </div>

      {activities.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-gray-400">
          <Activity className="mb-4 h-12 w-12 opacity-50" />
          <p className="text-sm">Aucune activité enregistrée</p>
        </div>
      ) : (
        <div className="space-y-6">
          {[...groups.entries()].map(([key, items]) => (
            <div key={key}>
              <h5 className="mb-3 text-sm font-medium text-gray-500 dark:text-gray-400">{dayLabel(key)}</h5>
              <div className="space-y-1">
                {items.map((a) => {
                  const { verb, target } = sentence(a);
                  const failed = a.result === 'ERROR' || a.result === 'REJECT';
                  const Icon = failed ? XCircle : a.severity === 'WARNING' || a.severity === 'CRITICAL' ? AlertTriangle : CheckCircle2;
                  const color = failed ? 'text-red-500' : a.severity === 'CRITICAL' ? 'text-red-500' : a.severity === 'WARNING' ? 'text-amber-500' : 'text-green-600';
                  return (
                    <div key={a.id} className="flex items-start gap-3 rounded-lg p-3 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800">
                      <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${color}`} />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm text-gray-700 dark:text-gray-300">
                            Vous {verb}
                            {target && <span className="ml-1 font-medium text-gray-900 dark:text-white">{target}</span>}
                          </span>
                          {failed && (
                            <Badge color="error" variant="light" size="xs">
                              {a.result === 'REJECT' ? 'Refusé' : 'Échec'}
                            </Badge>
                          )}
                        </div>
                        <div className="text-xs text-gray-400" title={formatDateTime(a.at)}>
                          {formatDateTime(a.at)} · {timeAgo(a.at)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {hasMore && onLoadMore && (
        <div className="mt-4 border-t border-gray-200 pt-4 text-center dark:border-gray-700">
          <Button variant="ghost" onClick={handleLoadMore} disabled={loadingMore || isLoading}>
            {loadingMore ? 'Chargement...' : 'Charger plus'}
          </Button>
        </div>
      )}
    </Card>
  );
};

export default ActivityLogFeed;
