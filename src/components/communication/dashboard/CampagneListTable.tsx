// src/components/communication/dashboard/CampagneListTable.tsx

import React, { useState } from 'react';
import { 
  MoreVertical, Eye, Edit, Copy, 
  XCircle, FileText,
  ChevronDown, ChevronUp, Search
} from 'lucide-react';
import { Card } from '../../ui/card';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Select } from '../../ui/select';
import { Table, TableHeader, TableRow, TableBody, TableCell } from '../../ui/table';
import { CampagneStatusBadge } from '../CampagneStatusBadge';
import { CampagneTypeBadge } from '../CampagneTypeBadge';
import { Campagne, CampagneStatus, CampagneType } from '../../../types/communication';
import { formatDateShort } from '../../../lib/date';

interface CampagneListTableProps {
  campagnes: Campagne[];
  isLoading?: boolean;
  onRowClick: (campagne: Campagne) => void;
  onDuplicate: (id: string) => Promise<void>;
  onCancel: (id: string) => Promise<void>;
  onEdit: (id: string) => void;
  onCreateNew: () => void;
  canCreate: boolean;
}

const STATUS_OPTIONS = [
  { value: 'all', label: 'Tous les statuts' },
  { value: CampagneStatus.DRAFT, label: 'Brouillons' },
  { value: CampagneStatus.SCHEDULED, label: 'Programmées' },
  { value: CampagneStatus.SENT, label: 'Envoyées' },
  { value: CampagneStatus.FAILED, label: 'Échecs' },
  { value: CampagneStatus.CANCELLED, label: 'Annulées' },
];

const TYPE_OPTIONS = [
  { value: 'all', label: 'Tous les types' },
  { value: CampagneType.INFO, label: 'Informations' },
  { value: CampagneType.ALERT, label: 'Alertes' },
  { value: CampagneType.EVENT, label: 'Événements' },
  { value: CampagneType.SURVEY, label: 'Enquêtes' },
  { value: CampagneType.REMINDER, label: 'Rappels' },
];

export const CampagneListTable: React.FC<CampagneListTableProps> = ({
  campagnes,
  isLoading = false,
  onRowClick,
  onDuplicate,
  onCancel,
  onEdit,
  onCreateNew,
  canCreate,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [sortField, setSortField] = useState<string>('scheduledAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const filteredCampagnes = campagnes.filter(c => {
    if (searchQuery && !c.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (statusFilter !== 'all' && c.status !== statusFilter) return false;
    if (typeFilter !== 'all' && c.type !== typeFilter) return false;
    return true;
  });

  const sortedCampagnes = [...filteredCampagnes].sort((a, b) => {
    const aVal = a[sortField as keyof Campagne] || '';
    const bVal = b[sortField as keyof Campagne] || '';
    const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
    return sortDirection === 'asc' ? comparison : -comparison;
  });

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const handleCancel = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Annuler cette campagne programmée ?')) return;
    await onCancel(id);
  };

  const handleDuplicate = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await onDuplicate(id);
  };

  const handleEdit = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit(id);
  };

  const getSortIcon = (field: string) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' 
      ? <ChevronUp className="w-4 h-4 inline ml-1" />
      : <ChevronDown className="w-4 h-4 inline ml-1" />;
  };

  const getDateLabel = (campagne: Campagne) => {
    if (campagne.status === CampagneStatus.SENT && campagne.sentAt) {
      return formatDateShort(campagne.sentAt);
    }
    if (campagne.status === CampagneStatus.SCHEDULED && campagne.scheduledAt) {
      return formatDateShort(campagne.scheduledAt);
    }
    return formatDateShort(campagne.createdAt);
  };

  if (isLoading) {
    return (
      <Card className="p-4">
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-3 animate-pulse">
              <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
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

  return (
    <div className="space-y-4">
      {/* Barre d'outils */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex flex-1 gap-3">
          <Input
            placeholder="Rechercher une campagne..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            startIcon={<Search className="w-4 h-4" />}
            className="max-w-xs"
          />
          <Select
            value={statusFilter}
            onChange={(value) => setStatusFilter(value)}
            options={STATUS_OPTIONS}
            className="w-40"
          />
          <Select
            value={typeFilter}
            onChange={(value) => setTypeFilter(value)}
            options={TYPE_OPTIONS}
            className="w-40"
          />
        </div>
        {canCreate && (
          <Button variant="primary" onClick={onCreateNew}>
            <FileText className="w-4 h-4 mr-2" />
            Nouvelle campagne
          </Button>
        )}
      </div>

      {/* Tableau */}
      <Card>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableCell isHeader className="w-10"></TableCell>
                <TableCell isHeader 
                  className="cursor-pointer hover:text-gray-700 dark:hover:text-gray-200"
                  onClick={() => handleSort('title')}
                >
                  Titre {getSortIcon('title')}
                </TableCell>
                <TableCell isHeader 
                  className="cursor-pointer hover:text-gray-700 dark:hover:text-gray-200"
                  onClick={() => handleSort('type')}
                >
                  Type {getSortIcon('type')}
                </TableCell>
                <TableCell isHeader 
                  className="cursor-pointer hover:text-gray-700 dark:hover:text-gray-200"
                  onClick={() => handleSort('status')}
                >
                  Statut {getSortIcon('status')}
                </TableCell>
                <TableCell isHeader
                  className="cursor-pointer hover:text-gray-700 dark:hover:text-gray-200"
                  onClick={() => handleSort('createdAt')}
                >
                  Date {getSortIcon('createdAt')}
                </TableCell>
                <TableCell isHeader className="text-right">Actions</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedCampagnes.map((campagne) => (
                <TableRow
                  key={campagne.id}
                  className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  onClick={() => onRowClick(campagne)}
                >
                  <TableCell>
                    {campagne.coverImage ? (
                      <img 
                        src={`/api/documents/${campagne.coverImage.id}/preview`}
                        alt=""
                        className="w-10 h-10 object-cover rounded"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded flex items-center justify-center">
                        <FileText className="w-5 h-5 text-gray-400" />
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="font-medium text-gray-900 dark:text-white truncate max-w-xs">
                      {campagne.title}
                    </div>
                  </TableCell>
                  <TableCell>
                    <CampagneTypeBadge type={campagne.type} size="sm" />
                  </TableCell>
                  <TableCell>
                    <CampagneStatusBadge status={campagne.status} size="sm" />
                  </TableCell>
                  <TableCell className="text-sm text-gray-500">
                    {getDateLabel(campagne)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end">
                      <div className="relative">
                        <Button
                          size="xs"
                          variant="ghost"
                          onClick={(e) => {
                            e?.stopPropagation();
                            setOpenMenuId(openMenuId === campagne.id ? null : campagne.id);
                          }}
                        >
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                        {openMenuId === campagne.id && (
                          <div className="absolute right-0 mt-1 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-10">
                            <div className="py-1">
                              <button
                                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onRowClick(campagne);
                                  setOpenMenuId(null);
                                }}
                              >
                                <Eye className="w-4 h-4" />
                                Voir détail
                              </button>
                              {campagne.status === CampagneStatus.DRAFT && (
                                <button
                                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                                  onClick={(e) => handleEdit(campagne.id, e)}
                                >
                                  <Edit className="w-4 h-4" />
                                  Modifier
                                </button>
                              )}
                              <button
                                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                                onClick={(e) => handleDuplicate(campagne.id, e)}
                              >
                                <Copy className="w-4 h-4" />
                                Dupliquer
                              </button>
                              {campagne.status === CampagneStatus.SCHEDULED && (
                                <button
                                  className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                                  onClick={(e) => handleCancel(campagne.id, e)}
                                >
                                  <XCircle className="w-4 h-4" />
                                  Annuler
                                </button>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {filteredCampagnes.length === 0 && (
          <div className="p-8 text-center">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Aucune campagne trouvée
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              {searchQuery || statusFilter !== 'all' || typeFilter !== 'all'
                ? 'Aucune campagne ne correspond à vos critères.'
                : 'Commencez par créer votre première campagne.'}
            </p>
            {canCreate && (
              <Button className="mt-4" variant="primary" onClick={onCreateNew}>
                <FileText className="w-4 h-4 mr-2" />
                Nouvelle campagne
              </Button>
            )}
          </div>
        )}
      </Card>
    </div>
  );
};

export default CampagneListTable;