// src/components/documents/audit/DocumentAuditLogTable.tsx

import React, { useState } from 'react';
import { 
  Eye, Download, Upload, CheckCircle, XCircle,
  Share2, Printer, QrCode, Clock, User, Filter, Calendar,
  FileText, AlertCircle
} from 'lucide-react';
import { Card } from '../../ui/card';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Select } from '../../ui/select';
import { Badge } from '../../ui/badge';
import { Table, TableHeader, TableRow, TableBody, TableCell } from '../../ui/table';
import { Pagination } from '../../ui/pagination';
import { DocumentAuditLog, DocumentAuditAction } from '../../../types/document';
import { formatDateShort, timeAgo } from '../../../lib/date';
import { usePermission } from '../../../hooks/usePermission';
import { PermissionCode } from '../../../types/auth';

interface DocumentAuditLogTableProps {
  logs: DocumentAuditLog[];
  isLoading?: boolean;
  totalItems?: number;
  currentPage?: number;
  pageSize?: number;
  onPageChange?: (page: number) => void;
  onFilterChange?: (filters: {
    actorId?: string;
    action?: DocumentAuditAction;
    dateFrom?: string;
    dateTo?: string;
  }) => void;
  onExport?: () => void;
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

const ACTION_OPTIONS = Object.entries(DocumentAuditAction).map(([key, value]) => ({
  value,
  label: key.charAt(0) + key.slice(1).toLowerCase().replace(/_/g, ' '),
}));

export const DocumentAuditLogTable: React.FC<DocumentAuditLogTableProps> = ({
  logs,
  isLoading = false,
  totalItems = 0,
  currentPage = 1,
  pageSize = 20,
  onPageChange,
  onFilterChange,
  onExport,
}) => {
  const { can } = usePermission();
  const canExport = can(PermissionCode.AUDIT_EXPORT);
  const canSeeFullIP = can(PermissionCode.AUDIT_READ) || can(PermissionCode.USER_ADMIN);

  const [filters, setFilters] = useState<{
    actorId?: string;
    action?: DocumentAuditAction;
    dateFrom?: string;
    dateTo?: string;
  }>({});

  const [showFilters, setShowFilters] = useState(false);

  const handleFilterChange = (key: keyof typeof filters, value: any) => {
    const newFilters = { ...filters, [key]: value || undefined };
    setFilters(newFilters);
    onFilterChange?.(newFilters);
  };

  const handleResetFilters = () => {
    setFilters({});
    onFilterChange?.({});
  };

  const formatIP = (ip: string | null) => {
    if (!ip) return 'N/A';
    if (!canSeeFullIP) {
      const parts = ip.split('.');
      if (parts.length === 4) {
        return `${parts[0]}.${parts[1]}.***.***`;
      }
      return '***.***.***.***';
    }
    return ip;
  };

  const hasActiveFilters = Object.keys(filters).length > 0;

  if (isLoading) {
    return (
      <Card className="p-4">
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-3 animate-pulse">
              <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-2"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
              </div>
              <div className="w-20 h-6 bg-gray-200 dark:bg-gray-700 rounded"></div>
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
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          Aucun journal d'audit
        </h3>
        <p className="text-gray-500 dark:text-gray-400">
          Aucune activité enregistrée pour cette période.
        </p>
      </Card>
    );
  }

  return (
    <Card>
      {/* En-tête */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Journal d'audit
            </h3>
            <p className="text-sm text-gray-500">
              {totalItems} entrée{totalItems > 1 ? 's' : ''}
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="w-4 h-4 mr-1" />
              Filtres {hasActiveFilters && (
                <Badge color="primary" variant="solid" size="xs" className="ml-1">
                  {Object.keys(filters).length}
                </Badge>
              )}
            </Button>
            {canExport && onExport && (
              <Button variant="outline" size="sm" onClick={onExport}>
                <Download className="w-4 h-4 mr-1" />
                Exporter
              </Button>
            )}
          </div>
        </div>

        {/* Filtres */}
        {showFilters && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Input
              placeholder="ID de l'acteur..."
              value={filters.actorId || ''}
              onChange={(e) => handleFilterChange('actorId', e.target.value)}
              startIcon={<User className="w-4 h-4" />}
            />
            <Select
              value={filters.action || ''}
              onChange={(value) => handleFilterChange('action', value || undefined)}
              options={[
                { value: '', label: 'Toutes les actions' },
                ...ACTION_OPTIONS,
              ]}
            />
            <Input
              type="date"
              value={filters.dateFrom || ''}
              onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
              startIcon={<Calendar className="w-4 h-4" />}
              placeholder="Date début"
            />
            <div className="flex gap-2">
              <Input
                type="date"
                value={filters.dateTo || ''}
                onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                placeholder="Date fin"
                className="flex-1"
              />
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={handleResetFilters}>
                  <XCircle className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Tableau */}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableCell isHeader>Agent</TableCell>
              <TableCell isHeader>Matricule</TableCell>
              <TableCell isHeader>Département</TableCell>
              <TableCell isHeader>Rôle</TableCell>
              <TableCell isHeader>Statut</TableCell>
              <TableCell isHeader>Actif</TableCell>
              <TableCell isHeader align="right">Actions</TableCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.map((log) => (
              <TableRow key={log.id}>
                <TableCell>
                  <div className="text-sm text-gray-900 dark:text-white">
                    {formatDateShort(log.createdAt)}
                  </div>
                  <div className="text-xs text-gray-400">
                    {timeAgo(log.createdAt)}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm text-gray-900 dark:text-white">
                    {log.actorName || 'Anonyme'}
                  </div>
                  {log.actorRole && (
                    <div className="text-xs text-gray-400">{log.actorRole}</div>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {ACTION_ICONS[log.action]}
                    <span className="text-sm">
                      {log.action.charAt(0) + log.action.slice(1).toLowerCase().replace(/_/g, ' ')}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1 text-sm">
                    <FileText className="w-3 h-3 text-gray-400" />
                    <span className="font-mono text-xs">{log.documentId.slice(0, 8)}...</span>
                  </div>
                  <div className="text-xs text-gray-400">{log.documentKind}</div>
                </TableCell>
                <TableCell>
                  <div className="text-sm text-gray-600 dark:text-gray-300">
                    {formatIP(log.ipAddress)}
                  </div>
                  {log.userAgent && (
                    <div className="text-xs text-gray-400 truncate max-w-xs" title={log.userAgent}>
                      {log.userAgent.slice(0, 40)}...
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  {log.details && (
                    <div className="text-xs text-gray-500 bg-gray-50 dark:bg-gray-800 p-1 rounded">
                      {Object.entries(log.details).map(([key, value]) => (
                        <span key={key} className="mr-2">
                          {key}: {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                        </span>
                      ))}
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {onPageChange && totalItems > pageSize && (
        <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700">
          <Pagination
            currentPage={currentPage}
            totalPages={Math.ceil(totalItems / pageSize)}
            onPageChange={onPageChange}
            itemsPerPage={pageSize}
            totalItems={totalItems}
          />
        </div>
      )}

      {!canSeeFullIP && (
        <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-400 flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          Les adresses IP sont partiellement masquées. Permission AUDIT_READ requise.
        </div>
      )}
    </Card>
  );
};

export default DocumentAuditLogTable;