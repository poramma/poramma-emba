// src/components/profile/MyAgentRequests.tsx
//
// Les demandes et signalements de l'agent connecté, avec la réponse de l'administrateur.

import React, { useEffect } from 'react';
import { Inbox } from 'lucide-react';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { formatDateTime } from '../../lib/date';
import {
  REQUEST_CATEGORY_LABELS,
  REQUEST_KIND_LABELS,
  REQUEST_STATUS_LABELS,
  useAgentRequestsStore,
  type AgentRequestStatus,
} from '../../store/agentRequestsStore';

const STATUS_COLOR: Record<AgentRequestStatus, 'warning' | 'info' | 'success' | 'error' | 'gray'> = {
  PENDING: 'warning',
  IN_PROGRESS: 'info',
  APPROVED: 'success',
  REJECTED: 'error',
  RESOLVED: 'success',
};

export const MyAgentRequests: React.FC = () => {
  const { mine, fetchMine } = useAgentRequestsStore();

  useEffect(() => {
    fetchMine();
  }, [fetchMine]);

  return (
    <Card className="p-6">
      <div className="mb-4">
        <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Mes demandes et signalements</h4>
        <p className="text-sm text-gray-500 dark:text-gray-400">Suivi de ce que vous avez adressé à l'administrateur.</p>
      </div>

      {mine.length === 0 ? (
        <div className="flex flex-col items-center py-6 text-gray-400">
          <Inbox className="mb-2 h-10 w-10 opacity-50" />
          <p className="text-sm">Aucune demande pour le moment</p>
        </div>
      ) : (
        <div className="space-y-3">
          {mine.map((r) => (
            <div key={r.id} className="rounded-lg bg-gray-50 p-3 dark:bg-gray-800">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium text-gray-900 dark:text-white">{r.subject}</span>
                <Badge color={STATUS_COLOR[r.status]} variant="light" size="xs">
                  {REQUEST_STATUS_LABELS[r.status]}
                </Badge>
                <Badge color="gray" variant="light" size="xs">
                  {REQUEST_KIND_LABELS[r.kind]} · {REQUEST_CATEGORY_LABELS[r.category]}
                </Badge>
              </div>
              <p className="mt-1 whitespace-pre-wrap text-sm text-gray-600 dark:text-gray-300">{r.description}</p>
              {r.targetSubService && <p className="mt-1 text-xs text-gray-500">Service concerné : {r.targetSubService.name}</p>}
              {r.adminResponse && (
                <div className="mt-2 rounded-md border border-brand-200 bg-white p-2 text-sm dark:border-brand-900/40 dark:bg-gray-900">
                  <div className="text-xs text-gray-500">
                    Réponse{r.handledByName ? ` de ${r.handledByName}` : " de l'administrateur"}
                    {r.handledAt ? ` · ${formatDateTime(r.handledAt)}` : ''}
                  </div>
                  <p className="mt-1 whitespace-pre-wrap text-gray-700 dark:text-gray-200">{r.adminResponse}</p>
                </div>
              )}
              <div className="mt-1 text-xs text-gray-400">Envoyée le {formatDateTime(r.createdAt)}</div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};

export default MyAgentRequests;
