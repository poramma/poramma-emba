// src/components/documents/internal/InternalDocumentList.tsx

import React, { useState } from 'react';
import { 
  FileText, Eye, Download, Lock, Search
} from 'lucide-react';
import { Card } from '../../ui/card';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Select } from '../../ui/select';
import { Badge } from '../../ui/badge';
import { Table, TableHeader, TableRow, TableBody, TableCell } from '../../ui/table';
import { InternalDocument, ConfidentialityLevel } from '../../../types/document';
import { AgentDepartment } from '../../../types/auth';
import { formatDateShort, formatFileSize } from '../../../lib/date';
import { confidentialityLabels, departmentLabels } from '../../../config/document-labels';

interface InternalDocumentListProps {
  documents: InternalDocument[];
  isLoading?: boolean;
  onRowClick?: (doc: InternalDocument) => void;
  onDownload?: (doc: InternalDocument) => void;
}

const CONFIDENTIALITY_COLORS: Record<ConfidentialityLevel, string> = {
  [ConfidentialityLevel.PUBLIC]: 'gray',
  [ConfidentialityLevel.INTERNAL]: 'info',
  [ConfidentialityLevel.RESTRICTED]: 'warning',
  [ConfidentialityLevel.CONFIDENTIAL]: 'error',
};

export const InternalDocumentList: React.FC<InternalDocumentListProps> = ({
  documents,
  isLoading = false,
  onRowClick,
  onDownload,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState<AgentDepartment | 'all'>('all');
  const [selectedConfidentiality, setSelectedConfidentiality] = useState<ConfidentialityLevel | 'all'>('all');

  const filteredDocs = documents.filter(doc => {
    if (searchQuery && !doc.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !doc.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()))) {
      return false;
    }
    if (selectedDepartment !== 'all' && doc.department !== selectedDepartment) return false;
    if (selectedConfidentiality !== 'all' && doc.confidentiality !== selectedConfidentiality) return false;
    return true;
  });

  if (isLoading) {
    return (
      <Card className="p-4">
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
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

  if (documents.length === 0) {
    return (
      <Card className="p-8 text-center">
        <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          Aucun document interne
        </h3>
        <p className="text-gray-500 dark:text-gray-400">
          Aucun document interne n'est disponible.
        </p>
      </Card>
    );
  }

  return (
    <Card>
      {/* Filtres */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Input
            placeholder="Rechercher un document..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            startIcon={<Search className="w-4 h-4" />}
          />
          <Select
            value={selectedDepartment}
            onChange={(value) => setSelectedDepartment(value as AgentDepartment | 'all')}
            options={[
              { value: 'all', label: 'Tous les services' },
              ...Object.entries(departmentLabels).map(([value, label]) => ({ value, label })),
            ]}
          />
          <Select
            value={selectedConfidentiality}
            onChange={(value) => setSelectedConfidentiality(value as ConfidentialityLevel | 'all')}
            options={[
              { value: 'all', label: 'Tous les niveaux' },
              ...Object.entries(confidentialityLabels).map(([value, label]) => ({ value, label })),
            ]}
          />
        </div>
      </div>

      {/* Tableau */}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableCell isHeader>Titre</TableCell>
              <TableCell isHeader>Service</TableCell>
              <TableCell isHeader>Confidentialité</TableCell>
              <TableCell isHeader>Date</TableCell>
              <TableCell isHeader className="text-right">Actions</TableCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredDocs.map((doc) => {
              const confColor = CONFIDENTIALITY_COLORS[doc.confidentiality];

              return (
                <TableRow 
                  key={doc.id}
                  className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                  onClick={() => onRowClick?.(doc)}
                >
                  <TableCell>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {doc.title}
                      </p>
                      <p className="text-xs text-gray-400">
                        {formatFileSize(doc.file.size)} • v{doc.version}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge color="gray" variant="light">
                      {departmentLabels[doc.department] ?? doc.department}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge color={confColor as any} variant="light" startIcon={<Lock className="w-3 h-3" />}>
                      {confidentialityLabels[doc.confidentiality]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-gray-600 dark:text-gray-300">
                      {formatDateShort(doc.createdAt)}
                    </div>
                    <div className="text-xs text-gray-400">
                      par {doc.createdByUser?.profile ? `${doc.createdByUser.profile.firstName} ${doc.createdByUser.profile.lastName}` : doc.createdBy}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                      <Button size="xs" variant="ghost" onClick={() => onRowClick?.(doc)}>
                        <Eye className="w-4 h-4" />
                      </Button>
                      {onDownload && (
                        <Button size="xs" variant="ghost" onClick={() => onDownload(doc)}>
                          <Download className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {filteredDocs.length === 0 && (
        <div className="p-8 text-center">
          <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Aucun résultat
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            Aucun document ne correspond à vos critères.
          </p>
        </div>
      )}
    </Card>
  );
};

export default InternalDocumentList;