// src/components/documents/DocumentList.tsx

import React, { useState } from 'react';
import { 
  File, FileText, Image, Eye, Download, ChevronDown, ChevronUp, 
} from 'lucide-react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Table, TableHeader, TableRow, TableBody, TableCell } from '../ui/table';
import { Pagination } from '../ui/pagination';
import { DocumentStatusBadge } from './DocumentStatusBadge';
import { DocumentGED } from '../../types/document';
import { formatDateShort, formatFileSize } from '../../lib/date';

interface DocumentListProps {
  documents: DocumentGED[];
  isLoading?: boolean;
  onRowClick?: (doc: DocumentGED) => void;
  showOwnerColumn?: boolean;
  emptyMessage?: string;
  showActions?: boolean;
  onDownload?: (doc: DocumentGED) => void;
  onView?: (doc: DocumentGED) => void;
}

const ITEMS_PER_PAGE = 10;

export const DocumentList: React.FC<DocumentListProps> = ({
  documents,
  isLoading = false,
  onRowClick,
  showOwnerColumn = true,
  emptyMessage = 'Aucun document trouvé',
  showActions = true,
  onDownload,
  onView,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<keyof DocumentGED>('createdAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return <Image className="w-5 h-5 text-blue-500" />;
    if (mimeType === 'application/pdf') return <FileText className="w-5 h-5 text-red-500" />;
    return <File className="w-5 h-5 text-gray-500" />;
  };

  const handleSort = (field: keyof DocumentGED) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedDocuments = [...documents].sort((a, b) => {
    let aVal = a[sortField];
    let bVal = b[sortField];
    
    if (typeof aVal === 'string') aVal = aVal.toLowerCase();
    if (typeof bVal === 'string') bVal = bVal.toLowerCase();
    
    if (aVal! < bVal!) return sortDirection === 'asc' ? -1 : 1;
    if (aVal! > bVal!) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const paginatedDocs = sortedDocuments.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  if (isLoading) {
    return (
      <Card className="p-4">
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-3 animate-pulse">
              <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-2"></div>
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
        <File className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          {emptyMessage}
        </h3>
        <p className="text-gray-500 dark:text-gray-400">
          Aucun document ne correspond à vos critères.
        </p>
      </Card>
    );
  }

  return (
    <Card>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableCell isHeader className="w-10">#</TableCell>
              <TableCell 
                className="cursor-pointer hover:text-gray-700 dark:hover:text-gray-200"
                onClick={() => handleSort('fileId')}
              >
                <div className="flex items-center gap-1">
                  Nom du fichier
                  {sortField === 'fileId' && (
                    sortDirection === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                  )}
                </div>
              </TableCell>
              <TableCell 
                className="cursor-pointer hover:text-gray-700 dark:hover:text-gray-200"
                onClick={() => handleSort('type')}
              >
                Type
              </TableCell>
              {showOwnerColumn && (
                <TableCell 
                  className="cursor-pointer hover:text-gray-700 dark:hover:text-gray-200"
                  onClick={() => handleSort('ownerUserId')}
                >
                  Propriétaire
                </TableCell>
              )}
             <TableCell 
                className="cursor-pointer hover:text-gray-700 dark:hover:text-gray-200"
                onClick={() => handleSort('status')}
              >
                Statut
              </TableCell>
              <TableCell 
                className="cursor-pointer hover:text-gray-700 dark:hover:text-gray-200"
                onClick={() => handleSort('createdAt')}
              >
                Date
              </TableCell>
              {showActions && <TableCell className="text-right">Actions</TableCell>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedDocs.map((doc, index) => (
              <TableRow 
                key={doc.id}
                className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                onClick={() => onRowClick?.(doc)}
              >
                <TableCell className="text-gray-400 text-sm">
                  <div className="flex items-center gap-2">
                    {(currentPage - 1) * ITEMS_PER_PAGE + index + 1}
                    {getFileIcon(doc.file?.mimeType || '')}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="font-medium text-gray-900 dark:text-white truncate max-w-xs">
                    {doc.file?.originalName || 'Sans nom'}
                  </div>
                  <div className="text-xs text-gray-400">
                    {formatFileSize(doc.file?.size || 0)}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge color="gray" variant="light" size="xs">
                    {doc.type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
                  </Badge>
                </TableCell>
                {showOwnerColumn && (
                  <TableCell className="text-sm text-gray-600 dark:text-gray-300">
                    {doc.ownerUserId}
                  </TableCell>
                )}
                <TableCell>
                  <DocumentStatusBadge status={doc.status} size="sm" />
                </TableCell>
                <TableCell className="text-sm text-gray-500">
                  {formatDateShort(doc.createdAt)}
                </TableCell>
                {showActions && (
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                      {onView && (
                        <Button size="xs" variant="ghost" onClick={() => onView(doc)}>
                          <Eye className="w-4 h-4" />
                        </Button>
                      )}
                      {onDownload && doc.fileId && (
                        <Button size="xs" variant="ghost" onClick={() => onDownload(doc)}>
                          <Download className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {documents.length > ITEMS_PER_PAGE && (
        <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700">
          <Pagination
            currentPage={currentPage}
            totalPages={Math.ceil(documents.length / ITEMS_PER_PAGE)}
            onPageChange={setCurrentPage}
            itemsPerPage={ITEMS_PER_PAGE}
            totalItems={documents.length}
          />
        </div>
      )}
    </Card>
  );
};

export default DocumentList;