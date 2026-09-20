// src/components/documents/DocumentAuditTrailTab.tsx

import React from 'react';
import { DocumentAuditLog } from '../../types';
import { EmptyState } from '../ui/emptyState';
import { formatDateTime } from '../../lib/date';

const ACTION_LABELS: Record<string, string> = {
  VIEW: 'Consultation',
  DOWNLOAD: 'Téléchargement',
  UPLOAD: 'Téléversement',
  VALIDATE: 'Validation',
  REJECT: 'Rejet',
  DELETE: 'Suppression',
  SHARE: 'Partage',
  PRINT: 'Impression',
  VERIFY_QR: 'Vérification QR',
};

interface DocumentAuditTrailTabProps {
  logs: DocumentAuditLog[];
  isLoading?: boolean;
}

export const DocumentAuditTrailTab: React.FC<DocumentAuditTrailTabProps> = ({ logs, isLoading }) => {
  if (isLoading) {
    return <p className="text-theme-sm text-gray-400 py-6">Chargement de l'historique...</p>;
  }

  if (logs.length === 0) {
    return (
      <EmptyState
        title="Aucun accès enregistré"
        description="L'historique de consultation de ce document apparaîtra ici."
      />
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
        <thead>
          <tr>
            <th className="px-4 py-3 text-left text-theme-xs font-medium text-gray-500 dark:text-gray-400">Action</th>
            <th className="px-4 py-3 text-left text-theme-xs font-medium text-gray-500 dark:text-gray-400">Agent</th>
            <th className="px-4 py-3 text-left text-theme-xs font-medium text-gray-500 dark:text-gray-400">Date</th>
            <th className="px-4 py-3 text-left text-theme-xs font-medium text-gray-500 dark:text-gray-400">IP</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
          {logs.map((log) => (
            <tr key={log.id}>
              <td className="px-4 py-3 text-theme-sm text-gray-700 dark:text-gray-300">
                {ACTION_LABELS[log.action] ?? log.action}
              </td>
              <td className="px-4 py-3 text-theme-sm text-gray-700 dark:text-gray-300">
                {log.actorName ?? 'Système / Anonyme'}
              </td>
              <td className="px-4 py-3 text-theme-sm text-gray-500 dark:text-gray-400">
                {formatDateTime(log.createdAt)}
              </td>
              <td className="px-4 py-3 text-theme-sm text-gray-500 dark:text-gray-400">
                {log.ipAddress ?? '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DocumentAuditTrailTab;