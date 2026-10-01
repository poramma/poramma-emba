// src/pages/documents/QueuePage.tsx

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, AlertCircle, ArrowLeft,
} from 'lucide-react';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { PermissionGuard } from '../../components/auth/PermissionGuard';
import { DocumentQueueTable } from '../../components/documents/queue/DocumentQueueTable';
import { Pagination } from '../../components/ui/pagination';
import { useDocuments } from '../../hooks/useDocuments';
import { usePermission } from '../../hooks/usePermission';
import { useToast } from '../../hooks/useToast';
import { PermissionCode } from '../../types/auth';
import { DocStatus, DocumentFilters, DocumentType } from '../../types';
import DocumentQueueFilters from '../../components/documents/queue/DocumentQueueFilters';

export const QueuePage: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const {
    documents,
    documentsMeta,
    setDocumentsPage,
    stats,
    fetchDocuments,
    fetchStats,
    isLoading,
    validateDocument,
  } = useDocuments();
  const { can } = usePermission();

  // Tous les statuts par défaut — pas de filtre présélectionné.
  const [filters, setFilters] = useState<DocumentFilters>({});

  const canValidate = can(PermissionCode.DOCUMENT_VALIDATE);

  useEffect(() => {
    fetchDocuments(filters);
    // Le badge "en attente" reste correct indépendamment du filtre actif
    // (il ne vient pas de `documents`, qui reflète le filtre courant).
    fetchStats();
  }, []);

  const handleQuickAccept = async (id: string) => {
    try {
      await validateDocument(id, {
        status: DocStatus.ACCEPTED,
        reviewNote: 'Document validé en file d\'attente.',
      });
      //await fetchDocuments(filters);
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
    }
  };

  const handleQuickReject = async (id: string, note: string) => {
    try {
      await validateDocument(id, {
        status: DocStatus.REJECTED,
        reviewNote: note,
      });
      //await fetchDocuments(filters);
      toast({
        title: 'Document rejeté',
        description: 'Le document a été rejeté.',
        variant: 'warning',
      });
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de rejeter le document.',
        variant: 'error',
      });
    }
  };

  const handleViewDetail = (doc: any) => {
    navigate(`/documents/${doc.id}`);
  };

  const handleFilterChange = (newFilters: DocumentFilters) => {
    setFilters(newFilters);
    fetchDocuments(newFilters);
  };

  const handleTypeChange = (type: DocumentType | undefined) => {
    handleFilterChange({ ...filters, type });
  };

  const handleStatusChange = (status: DocStatus | undefined) => {
    handleFilterChange({ ...filters, status });
  };

  const handleDateRangeChange = (dateFrom?: string, dateTo?: string) => {
    handleFilterChange({ ...filters, dateFrom, dateTo });
  };

  const handleResetFilters = () => {
    const resetFilters: DocumentFilters = {};
    setFilters(resetFilters);
    fetchDocuments(resetFilters);
  };

  // La table reflète le filtre actif (tous les statuts par défaut) — le
  // badge "en attente" ci-dessous vient de `stats`, pas de cette liste.
  const displayedDocs = documents;

  return (
    <PermissionGuard 
      minRoleLevel={3} 
      permission={PermissionCode.DOCUMENT_VALIDATE}
      title="File de vérification"
    >
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* En-tête */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={() => navigate('/documents')}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Retour
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  File de vérification
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  {documentsMeta?.total ?? displayedDocs.length} document{(documentsMeta?.total ?? displayedDocs.length) > 1 ? 's' : ''} au total
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Badge color="warning" variant="solid" className="text-sm">
                <Clock className="w-4 h-4 mr-1" />
                {stats?.totalPending ?? 0} en attente
              </Badge>
            </div>
          </div>


          {/* Filtres */}
          <DocumentQueueFilters
            filters={filters}
            onTypeChange={handleTypeChange}
            onStatusChange={handleStatusChange}
            onDateRangeChange={handleDateRangeChange}
            onReset={handleResetFilters}
          />

          {/* Tableau */}
          <DocumentQueueTable
            documents={displayedDocs}
            isLoading={isLoading}
            onQuickAccept={handleQuickAccept}
            onQuickReject={handleQuickReject}
            onViewDetail={handleViewDetail}
          />

          {documentsMeta && documentsMeta.totalPages > 1 && (
            <Card className="px-4 py-3">
              <Pagination
                currentPage={documentsMeta.page}
                totalPages={documentsMeta.totalPages}
                onPageChange={setDocumentsPage}
                itemsPerPage={documentsMeta.limit}
                totalItems={documentsMeta.total}
              />
            </Card>
          )}

          {/* Aide */}
          {!canValidate && (
            <Card className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-yellow-800 dark:text-yellow-300">
                    Vous n'avez pas les droits de validation
                  </p>
                  <p className="text-sm text-yellow-700 dark:text-yellow-400">
                    Les boutons d'action sont désactivés. Contactez un administrateur pour obtenir les droits nécessaires.
                  </p>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </PermissionGuard>
  );
};

export default QueuePage;