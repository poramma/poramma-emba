// src/components/audit/LogTable.tsx

import React from 'react';
import { LogIn, ShieldAlert, FilePlus, RefreshCw, UserCog, Send, Clock, AlertTriangle, CheckCircle, XCircle, Trash2 } from 'lucide-react';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Table, TableHeader, TableRow, TableBody, TableCell } from '../ui/table';
import { Pagination } from '../ui/pagination';
import { AuditLog, AuditPageMeta, AuditSeverity } from '../../types/audit';
import { timeAgo } from '../../lib/date';
import { actionLabel, entityLabel, RESULT_LABELS } from '../../config/audit-labels';

interface LogTableProps {
  logs: AuditLog[];
  isLoading?: boolean;
  /** Pagination renvoyée par le serveur (page courante, total, nombre de pages). */
  meta?: AuditPageMeta;
  onPageChange?: (page: number) => void;
  onRowClick?: (log: AuditLog) => void;
}

const ACTION_ICONS: Record<string, React.ReactNode> = {
  LOGIN: <LogIn className="w-4 h-4 text-green-500" />,
  LOGIN_ATTEMPT: <ShieldAlert className="w-4 h-4 text-red-500" />,
  CREATE: <FilePlus className="w-4 h-4 text-blue-500" />,
  UPDATE_STATUS: <RefreshCw className="w-4 h-4 text-purple-500" />,
  UPDATE: <RefreshCw className="w-4 h-4 text-orange-500" />,
  ASSIGN_ROLE: <UserCog className="w-4 h-4 text-indigo-500" />,
  ASSIGN: <UserCog className="w-4 h-4 text-indigo-500" />,
  REMOVE_ROLE: <UserCog className="w-4 h-4 text-orange-500" />,
  SEND: <Send className="w-4 h-4 text-brand-500" />,
  SUSPEND: <ShieldAlert className="w-4 h-4 text-red-600" />,
  VALIDATE: <CheckCircle className="w-4 h-4 text-green-600" />,
  REJECT: <XCircle className="w-4 h-4 text-red-500" />,
  DELETE: <Trash2 className="w-4 h-4 text-red-600" />,
};

const RESULT_COLOR: Record<string, 'success' | 'error' | 'warning' | 'gray'> = {
  SUCCESS: 'success',
  ERROR: 'error',
  REJECT: 'error',
  WARNING: 'warning',
};

const SEVERITY_COLOR: Record<AuditSeverity, 'gray' | 'warning' | 'error'> = {
  [AuditSeverity.INFO]: 'gray',
  [AuditSeverity.WARNING]: 'warning',
  [AuditSeverity.CRITICAL]: 'error',
};

const SEVERITY_LABEL: Record<AuditSeverity, string> = {
  [AuditSeverity.INFO]: 'Information',
  [AuditSeverity.WARNING]: 'Avertissement',
  [AuditSeverity.CRITICAL]: 'Critique',
};

/** Date ET heure exactes (jj/mm/aaaa hh:mm:ss) — l'horaire fait partie de la preuve d'audit. */
const dateOf = (iso: string) => new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
const timeOf = (iso: string) => new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

export const LogTable: React.FC<LogTableProps> = ({ logs, isLoading = false, meta, onPageChange, onRowClick }) => {
  if (isLoading && logs.length === 0) {
    return (
      <Card className="p-4">
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-3 animate-pulse">
              <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded" />
              <div className="flex-1">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-2" />
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
              </div>
              <div className="w-20 h-6 bg-gray-200 dark:bg-gray-700 rounded" />
            </div>
          ))}
        </div>
      </Card>
    );
  }

  if (logs.length === 0) {
    return (
      <Card className="p-8 text-center">
        <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Aucune entrée</h3>
        <p className="text-gray-500 dark:text-gray-400">Aucune activité ne correspond à ces critères.</p>
      </Card>
    );
  }

  return (
    <Card className={isLoading ? 'opacity-70 transition-opacity' : undefined}>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableCell isHeader>Date et heure</TableCell>
              <TableCell isHeader>Acteur</TableCell>
              <TableCell isHeader>Action</TableCell>
              <TableCell isHeader>Objet</TableCell>
              <TableCell isHeader>Résultat</TableCell>
              <TableCell isHeader>Sévérité</TableCell>
              <TableCell isHeader>IP</TableCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.map((log) => (
              <TableRow key={log.id} onClick={() => onRowClick?.(log)} className={onRowClick ? 'cursor-pointer' : undefined}>
                <TableCell>
                  <div className="text-sm text-gray-900 dark:text-white">{dateOf(log.at)}</div>
                  <div className="text-xs font-mono text-gray-600 dark:text-gray-300">{timeOf(log.at)}</div>
                  <div className="text-xs text-gray-400">{timeAgo(log.at)}</div>
                </TableCell>
                <TableCell>
                  <div className="text-sm text-gray-900 dark:text-white">{log.actorName || log.actorInue || 'Anonyme'}</div>
                  {log.actorEmail && <div className="text-xs text-gray-500 break-all">{log.actorEmail}</div>}
                  {log.actorRole && <div className="text-xs text-gray-400">{log.actorRole}</div>}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {ACTION_ICONS[log.action] || <AlertTriangle className="w-4 h-4 text-gray-400" />}
                    <span className="text-sm">{actionLabel(log.action)}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm text-gray-700 dark:text-gray-300">{entityLabel(log.entityType)}</div>
                  {log.entityId !== '-' && <div className="text-xs text-gray-400 font-mono">{log.entityId.slice(0, 14)}</div>}
                </TableCell>
                <TableCell>
                  <Badge color={RESULT_COLOR[log.result] || 'gray'} variant="light" size="xs">
                    {RESULT_LABELS[log.result] ?? log.result}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge color={SEVERITY_COLOR[log.severity]} variant="light" size="xs">
                    {SEVERITY_LABEL[log.severity]}
                  </Badge>
                </TableCell>
                <TableCell>
                  <span className="text-xs text-gray-500 font-mono">{log.ip || 'N/A'}</span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {onPageChange && meta && meta.totalPages > 1 && (
        <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700">
          <Pagination
            currentPage={meta.page}
            totalPages={meta.totalPages}
            onPageChange={onPageChange}
            itemsPerPage={meta.limit}
            totalItems={meta.total}
            itemsLabel="entrées"
          />
        </div>
      )}
      {meta && (
        <p className="px-4 pb-3 text-xs text-gray-400">
          {meta.total} entrée{meta.total > 1 ? 's' : ''} au total — page {meta.page} sur {meta.totalPages}
        </p>
      )}
    </Card>
  );
};

export default LogTable;
