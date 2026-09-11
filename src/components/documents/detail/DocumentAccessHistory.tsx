// src/components/documents/detail/DocumentAccessHistory.tsx

import React from 'react';
import { 
  Eye, Download, Upload, CheckCircle, XCircle, 
  Share2, Printer, QrCode, Clock, Info
} from 'lucide-react';
import { Card } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { usePermission } from '../../../hooks/usePermission';
import { DocumentAuditAction, DocumentAuditLog } from '../../../types/document';
import { formatDateShort, timeAgo } from '../../../lib/date';
import { PermissionCode } from '../../../types/auth';

interface DocumentAccessHistoryProps {
  auditLogs: DocumentAuditLog[];
  isLoading?: boolean;
}

const ACTION_ICONS: Record<DocumentAuditAction, React.ReactNode> = {
  [DocumentAuditAction.VIEW]: <Eye className="w-4 h-4 text-blue-500" />,
  [DocumentAuditAction.DOWNLOAD]: <Download className="w-4 h-4 text-green-500" />,
  [DocumentAuditAction.UPLOAD]: <Upload className="w-4 h-4 text-purple-500" />,
  [DocumentAuditAction.VALIDATE]: <CheckCircle className="w-4 h-4 text-green-600" />,
  [DocumentAuditAction.REJECT]: <XCircle className="w-4 h-4 text-red-500" />,
  [DocumentAuditAction.DELETE]: <XCircle className="w-4 h-4 text-red-600" />,
  [DocumentAuditAction.SHARE]: <Share2 className="w-4 h-4 text-indigo-500" />,
  [DocumentAuditAction.PRINT]: <Printer className="w-4 h-4 text-gray-500" />,
  [DocumentAuditAction.VERIFY_QR]: <QrCode className="w-4 h-4 text-teal-500" />,
};

const ACTION_LABELS: Record<DocumentAuditAction, string> = {
  [DocumentAuditAction.VIEW]: 'Consultation',
  [DocumentAuditAction.DOWNLOAD]: 'Téléchargement',
  [DocumentAuditAction.UPLOAD]: 'Soumission',
  [DocumentAuditAction.VALIDATE]: 'Validation',
  [DocumentAuditAction.REJECT]: 'Rejet',
  [DocumentAuditAction.DELETE]: 'Suppression',
  [DocumentAuditAction.SHARE]: 'Partage',
  [DocumentAuditAction.PRINT]: 'Impression',
  [DocumentAuditAction.VERIFY_QR]: 'Vérification QR',
};

export const DocumentAccessHistory: React.FC<DocumentAccessHistoryProps> = ({
  auditLogs,
  isLoading ,
}) => {
  const { can } = usePermission();
  const canSeeIP = can(PermissionCode.AUDIT_READ) || can(PermissionCode.USER_ADMIN);


  const formatIP = (ip: string | null) => {
    if (!ip) return 'N/A';
    if (!canSeeIP) {
      const parts = ip.split('.');
      if (parts.length === 4) {
        return `${parts[0]}.${parts[1]}.***.***`;
      }
      return '***.***.***.***';
    }
    return ip;
  };


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

  if (!auditLogs || auditLogs.length === 0) {
    return (
      <Card className="p-6 text-center">
        <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          Ce document n'a pas encore été consulté
        </h4>
        <p className="text-gray-500 dark:text-gray-400">
          Aucune activité enregistrée pour ce document.
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-medium text-gray-700 dark:text-gray-300">
          Historique d'accès
        </h4>
        <Badge color="gray" variant="light">
          {auditLogs.length} action{auditLogs.length > 1 ? 's' : ''}
        </Badge>
      </div>

      <div className="space-y-3 max-h-80 overflow-y-auto">
        {auditLogs.map((log) => (
          <div key={log.id} className="flex items-start gap-3 p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors">
            <div className="mt-0.5">
              {ACTION_ICONS[log.action] || <Clock className="w-4 h-4 text-gray-400" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium text-gray-900 dark:text-white text-sm">
                  {log.actorName || 'Utilisateur inconnu'}
                </span>
                <span className="text-sm text-gray-500">
                  {ACTION_LABELS[log.action] || log.action}
                </span>
                <Badge color="gray" variant="light" size="xs">
                  {timeAgo(log.createdAt)}
                </Badge>
              </div>
              <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-gray-400">
                <span>{formatDateShort(log.createdAt)}</span>
                {log.actorRole && <span>• {log.actorRole}</span>}
                {log.ipAddress && (
                  <span 
                    className="cursor-help"
                    title={canSeeIP ? log.ipAddress : 'IP masquée (permission requise)'}
                  >
                    • IP: {formatIP(log.ipAddress)}
                  </span>
                )}
              </div>
              {log.details && (
                <div className="mt-1 text-xs text-gray-500 bg-gray-50 dark:bg-gray-800 p-1 rounded">
                  {Object.entries(log.details).map(([key, value]) => (
                    <span key={key} className="mr-2">
                      {key}: {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {!canSeeIP && (
        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-400 flex items-center gap-1">
          <Info className="w-3 h-3" />
          Les adresses IP sont masquées. Permission AUDIT_READ requise.
        </div>
      )}
    </Card>
  );
};

export default DocumentAccessHistory;