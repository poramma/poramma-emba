// src/components/documents/queue/DocumentQueueTable.tsx

import React, { useState } from 'react';
import { 
  CheckCircle, XCircle, Eye, FileText, User, Calendar,
  File, Image, ChevronDown, ChevronUp
} from 'lucide-react';
import { Card } from '../../ui/card';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Badge } from '../../ui/badge';
import { Table, TableHeader, TableRow, TableBody, TableCell } from '../../ui/table';
import { DocumentStatusBadge } from '../DocumentStatusBadge';
import { DocumentGED } from '../../../types/document';
import { DocStatus } from '../../../types/etudiant';
import { formatDateShort } from '../../../lib/date';
import { useDocuments } from '../../../hooks/useDocuments';
import { useToast } from '../../../hooks/useToast';

interface DocumentQueueTableProps {
  documents: DocumentGED[];
  isLoading?: boolean;
  onQuickAccept: (id: string) => Promise<void>;
  onQuickReject: (id: string, note: string) => Promise<void>;
  onViewDetail: (doc: DocumentGED) => void;
}

export const DocumentQueueTable: React.FC<DocumentQueueTableProps> = ({
  documents,
  isLoading = false,
  onQuickAccept,
  onQuickReject,
  onViewDetail,
}) => {
  const { toast } = useToast();
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectNote, setRejectNote] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [pendingConfirm, setPendingConfirm] = useState<string | null>(null);
  const [sortField, setSortField] = useState<keyof DocumentGED>('createdAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const getFileIcon = (mimeType: string) => {
    if (mimeType?.startsWith('image/')) return <Image className="w-5 h-5 text-blue-500" />;
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

  const sortedDocs = [...documents].sort((a, b) => {
    let aVal = a[sortField];
    let bVal = b[sortField];
    
    if (typeof aVal === 'string') aVal = aVal.toLowerCase();
    if (typeof bVal === 'string') bVal = bVal.toLowerCase();
    
    if (aVal! < bVal!) return sortDirection === 'asc' ? -1 : 1;
    if (aVal! > bVal!) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const handleQuickAccept = async (id: string) => {
    if (pendingConfirm === id) {
      setActionLoading(id);
      try {
        await onQuickAccept(id);
        toast({
          title: 'Document validé',
          description: 'Le document a été validé avec succès.',
          variant: 'success',
        });
      } catch (error) {
        toast({
          title: 'Erreur',
          description: 'Impossible de valider le document.',
          variant: 'error',
        });
      } finally {
        setActionLoading(null);
        setPendingConfirm(null);
      }
    } else {
      setPendingConfirm(id);
      // Annuler automatiquement après 5 secondes
      setTimeout(() => {
        if (pendingConfirm === id) setPendingConfirm(null);
      }, 5000);
    }
  };

  const handleReject = async (id: string) => {
    if (!rejectNote.trim()) return;
    
    setActionLoading(id);
    try {
      await onQuickReject(id, rejectNote);
      setRejectingId(null);
      setRejectNote('');
      toast({
        title: 'Document rejeté',
        description: 'Le document a été rejeté avec succès.',
        variant: 'success',
      });
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de rejeter le document.',
        variant: 'error',
      });
    } finally {
      setActionLoading(null);
    }
  };

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

  if (documents.length === 0) {
    return (
      <Card className="p-8 text-center">
        <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          File d'attente vide
        </h3>
        <p className="text-gray-500 dark:text-gray-400">
          Tous les documents ont été traités.
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
              <TableCell 
                isHeader
                className="cursor-pointer hover:text-gray-700 dark:hover:text-gray-200"
                onClick={() => handleSort('fileId')}
              >
                <div className="flex items-center gap-1">
                  Document
                  {sortField === 'fileId' && (
                    sortDirection === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                  )}
                </div>
              </TableCell>
              <TableCell 
                isHeader
                className="cursor-pointer hover:text-gray-700 dark:hover:text-gray-200"
                onClick={() => handleSort('ownerUserId')}
              >
                <div className="flex items-center gap-1">
                  Étudiant
                  {sortField === 'ownerUserId' && (
                    sortDirection === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                  )}
                </div>
              </TableCell>
              <TableCell 
                isHeader
                className="cursor-pointer hover:text-gray-700 dark:hover:text-gray-200"
                onClick={() => handleSort('type')}
              >
                <div className="flex items-center gap-1">
                  Type
                  {sortField === 'type' && (
                    sortDirection === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                  )}
                </div>
              </TableCell>
              <TableCell 
                isHeader
                className="cursor-pointer hover:text-gray-700 dark:hover:text-gray-200"
                onClick={() => handleSort('status')}
              >
                <div className="flex items-center gap-1">
                  Statut
                  {sortField === 'status' && (
                    sortDirection === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                  )}
                </div>
              </TableCell>
              <TableCell 
                isHeader
                className="cursor-pointer hover:text-gray-700 dark:hover:text-gray-200"
                onClick={() => handleSort('expiryDate')}
              >
                <div className="flex items-center gap-1">
                  Expiration
                  {sortField === 'expiryDate' && (
                    sortDirection === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                  )}
                </div>
              </TableCell>
              <TableCell isHeader className="text-right">Actions</TableCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedDocs.map((doc) => (
              <TableRow key={doc.id} className={doc.status === DocStatus.IN_REVIEW ? 'bg-blue-50 dark:bg-blue-900/10' : ''}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    {getFileIcon(doc.file?.mimeType || '')}
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white truncate max-w-xs">
                        {doc.file?.originalName || 'Sans nom'}
                      </p>
                      <p className="text-xs text-gray-400">
                        {formatDateShort(doc.createdAt)}
                      </p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1 text-sm">
                    <User className="w-3 h-3 text-gray-400" />
                    <span>{doc.ownerUserId}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge color="gray" variant="light" size="xs">
                    {doc.type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
                  </Badge>
                </TableCell>
                <TableCell>
                  <DocumentStatusBadge status={doc.status} size="sm" />
                </TableCell>
                <TableCell>
                  {doc.expiryDate ? (
                    <div className="flex items-center gap-1 text-sm">
                      <Calendar className="w-3 h-3 text-gray-400" />
                      <span>{formatDateShort(doc.expiryDate)}</span>
                    </div>
                  ) : (
                    <span className="text-sm text-gray-400">N/A</span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  {doc.status === DocStatus.IN_REVIEW || doc.status === DocStatus.UPLOADED ? (
                    <div className="flex items-center justify-end gap-2">
                      {/* Bouton Valider avec confirmation */}
                      <Button
                        size="sm"
                        variant={pendingConfirm === doc.id ? 'success' : 'outline'}
                        className={`min-w-[80px] ${
                          pendingConfirm === doc.id ? 'animate-pulse' : ''
                        }`}
                        onClick={() => handleQuickAccept(doc.id)}
                        disabled={actionLoading === doc.id}
                      >
                        {actionLoading === doc.id ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white"></div>
                        ) : pendingConfirm === doc.id ? (
                          'Confirmer ?'
                        ) : (
                          <>
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Valider
                          </>
                        )}
                      </Button>

                      {/* Bouton Rejeter avec note */}
                      {rejectingId === doc.id ? (
                        <div className="flex items-center gap-1">
                          <Input
                            placeholder="Motif du rejet..."
                            value={rejectNote}
                            onChange={(e) => setRejectNote(e.target.value)}
                            className="w-40 h-8"
                          />
                          <Button
                            size="sm"
                            variant="error"
                            onClick={() => handleReject(doc.id)}
                            disabled={actionLoading === doc.id || !rejectNote.trim()}
                          >
                            {actionLoading === doc.id ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white"></div>
                            ) : (
                              'Rejeter'
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setRejectingId(null);
                              setRejectNote('');
                            }}
                          >
                            <XCircle className="w-4 h-4" />
                          </Button>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-red-500 hover:text-red-700"
                          onClick={() => setRejectingId(doc.id)}
                        >
                          <XCircle className="w-4 h-4" />
                        </Button>
                      )}

                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onViewDetail(doc)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onViewDetail(doc)}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      Voir
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {documents.length > 0 && (
        <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 text-sm text-gray-500">
          {documents.length} document{documents.length > 1 ? 's' : ''} en attente
        </div>
      )}
    </Card>
  );
};

export default DocumentQueueTable;