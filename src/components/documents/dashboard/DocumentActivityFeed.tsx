// src/components/documents/dashboard/DocumentActivityFeed.tsx

import React from 'react';
import { 
  Eye, Download, CheckCircle, XCircle, Upload, 
  Share2, Printer, QrCode, Clock, User
} from 'lucide-react';
import { Card } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { DocumentAuditLog, DocumentAuditAction } from '../../../types/document';
import { formatDateShort, timeAgo } from '../../../lib/date';

interface DocumentActivityFeedProps {
  logs: DocumentAuditLog[];
  isLoading?: boolean;
  maxItems?: number;
  onViewAll?: () => void;
}

const ACTION_CONFIG: Record<DocumentAuditAction, { icon: React.ReactNode; label: string; color: string }> = {
  [DocumentAuditAction.VIEW]: {
    icon: <Eye className="w-4 h-4" />,
    label: 'a consulté',
    color: 'text-blue-500',
  },
  [DocumentAuditAction.DOWNLOAD]: {
    icon: <Download className="w-4 h-4" />,
    label: 'a téléchargé',
    color: 'text-green-500',
  },
  [DocumentAuditAction.UPLOAD]: {
    icon: <Upload className="w-4 h-4" />,
    label: 'a soumis',
    color: 'text-purple-500',
  },
  [DocumentAuditAction.VALIDATE]: {
    icon: <CheckCircle className="w-4 h-4" />,
    label: 'a validé',
    color: 'text-green-600',
  },
  [DocumentAuditAction.REJECT]: {
    icon: <XCircle className="w-4 h-4" />,
    label: 'a rejeté',
    color: 'text-red-500',
  },
  [DocumentAuditAction.DELETE]: {
    icon: <XCircle className="w-4 h-4" />,
    label: 'a supprimé',
    color: 'text-red-600',
  },
  [DocumentAuditAction.SHARE]: {
    icon: <Share2 className="w-4 h-4" />,
    label: 'a partagé',
    color: 'text-indigo-500',
  },
  [DocumentAuditAction.PRINT]: {
    icon: <Printer className="w-4 h-4" />,
    label: 'a imprimé',
    color: 'text-gray-500',
  },
  [DocumentAuditAction.VERIFY_QR]: {
    icon: <QrCode className="w-4 h-4" />,
    label: 'a vérifié via QR',
    color: 'text-teal-500',
  },
};

export const DocumentActivityFeed: React.FC<DocumentActivityFeedProps> = ({
  logs,
  isLoading = false,
  maxItems = 10,
  onViewAll,
}) => {
  const displayLogs = logs.slice(0, maxItems);

  if (isLoading) {
    return (
      <Card className="p-4">
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 animate-pulse">
              <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mt-1"></div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    );
  }

  if (logs.length === 0) {
    return (
      <Card className="p-6 text-center">
        <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          Aucune activité récente
        </h4>
        <p className="text-gray-500 dark:text-gray-400">
          Les actions sur les documents apparaîtront ici.
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-medium text-gray-700 dark:text-gray-300">
          Activité récente
        </h4>
        {logs.length > maxItems && onViewAll && (
          <Badge color="primary" variant="light" className="cursor-pointer" onClick={onViewAll}>
            Voir tout
          </Badge>
        )}
      </div>

      <div className="space-y-3">
        {displayLogs.map((log) => {
          const config = ACTION_CONFIG[log.action];
          if (!config) return null;

          return (
            <div key={log.id} className="flex items-start gap-3">
              <div className={`mt-0.5 ${config.color}`}>
                {config.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  <span className="font-medium text-gray-900 dark:text-white">
                    {log.actorName || 'Utilisateur inconnu'}
                  </span>
                  {' '}{config.label}{' '}
                  <span className="font-medium text-brand-600 dark:text-brand-400">
                    {log.documentId}
                  </span>
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-gray-400">
                    {timeAgo(log.createdAt)}
                  </span>
                  {log.details && (
                    <Badge color="gray" variant="light" size="xs">
                      {Object.entries(log.details).map(([key, value]) => `${key}: ${value}`).join(', ')}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {onViewAll && (
        <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700 text-center">
          <button 
            onClick={onViewAll}
            className="text-sm text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300"
          >
            Voir tout le journal d'audit →
          </button>
        </div>
      )}
    </Card>
  );
};

export default DocumentActivityFeed;