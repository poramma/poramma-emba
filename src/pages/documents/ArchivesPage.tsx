// src/pages/documents/ArchivesPage.tsx

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Download, ArrowLeft,FileArchive,
} from 'lucide-react';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { PermissionGuard } from '../../components/auth/PermissionGuard';
import { DocumentList } from '../../components/documents/DocumentList';
import { DocumentFilterBar } from '../../components/documents/DocumentFilterBar';
import { DocumentSearch } from '../../components/documents/DocumentSearch';
import { useDocuments } from '../../hooks/useDocuments';
import { usePermission } from '../../hooks/usePermission';
import { useToast } from '../../hooks/useToast';
import { PermissionCode } from '../../types/auth';
import { DocStatus, DocumentFilters } from '../../types';

export const ArchivesPage: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const {
    documents,
    documentsMeta,
    documentsPage,
    setDocumentsPage,
    fetchDocuments,
    isLoading,
    downloadDocument,
    archiveDocument,
  } = useDocuments();
  const { can } = usePermission();

  const [filters, setFilters] = useState<DocumentFilters>({
    status: DocStatus.EXPIRED,
  });
  const [selectedDocs, setSelectedDocs] = useState<string[]>([]);
  const [isExporting, setIsExporting] = useState(false);

  const canExport = can(PermissionCode.AUDIT_EXPORT);
  const canDelete = can(PermissionCode.DOCUMENT_DELETE);

  useEffect(() => {
    fetchDocuments(filters);
  }, []);

  const handleFilterChange = (newFilters: DocumentFilters) => {
    setFilters(newFilters);
    fetchDocuments(newFilters);
  };

  const handleDocumentClick = (doc: any) => {
    navigate(`/documents/${doc.id}`);
  };

  const handleDownload = async (doc: any) => {
    if (doc.fileId) {
      await downloadDocument(doc.fileId);
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      // TODO: Appel API pour export
      // await exportDocument('/api/documents/export', filters, 'documents_archive.csv');
      
      if (documents.length > 500) {
        if (!window.confirm(`Cet export contient ${documents.length} documents. Continuer ?`)) {
          return;
        }
      }
      
      toast({
        title: 'Export en cours',
        description: `${documents.length} documents vont être exportés.`,
        variant: 'info',
      });
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible d\'exporter les documents.',
        variant: 'error',
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleDelete = async (doc: any) => {
    if (!window.confirm(`Supprimer définitivement "${doc.file?.originalName}" ?`)) return;
    
    try {
      await archiveDocument(doc.id);
      await fetchDocuments(filters);
      toast({
        title: 'Document supprimé',
        description: 'Le document a été supprimé définitivement.',
        variant: 'success',
      });
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de supprimer le document.',
        variant: 'error',
      });
    }
  };

  // Le serveur filtre déjà par status=EXPIRED (voir `filters` ci-dessus) —
  // ce filtre local est redondant mais inoffensif, gardé par prudence.
  const archivedDocs = documents.filter(
    d => d.status === DocStatus.EXPIRED
  );
  const archivedTotal = documentsMeta?.total ?? archivedDocs.length;

  return (
    <PermissionGuard 
      minRoleLevel={4} 
      permission={PermissionCode.DOCUMENT_READ}
      title="Archives"
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
                  Archives
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  {archivedTotal} document{archivedTotal > 1 ? 's' : ''} archivé{archivedTotal > 1 ? 's' : ''}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              {canExport && (
                <Button 
                  variant="outline" 
                  onClick={handleExport}
                  disabled={isExporting || documents.length === 0}
                >
                  <Download className="w-4 h-4 mr-2" />
                  {isExporting ? 'Export...' : 'Exporter'}
                </Button>
              )}
            </div>
          </div>

          {/* Filtres */}
          <DocumentFilterBar
            filters={filters}
            onChange={handleFilterChange}
            availableFilters={['type', 'category', 'date']}
            showCount
            totalCount={archivedTotal}
          />

          {/* Liste */}
          <DocumentList
            documents={archivedDocs}
            isLoading={isLoading}
            onRowClick={handleDocumentClick}
            onDownload={handleDownload}
            showOwnerColumn={true}
            emptyMessage="Aucun document archivé"
            serverPagination={{ page: documentsPage, meta: documentsMeta, onPageChange: setDocumentsPage }}
          />

          {/* Avertissement */}
          <Card className="p-4 bg-gray-50 dark:bg-gray-800">
            <div className="flex items-start gap-3 text-sm text-gray-500 dark:text-gray-400">
              <FileArchive className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Gestion des archives</p>
                <p>
                  Les documents expirés sont automatiquement déplacés vers les archives.
                  Vous pouvez les consulter, les télécharger ou les exporter.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </PermissionGuard>
  );
};

export default ArchivesPage;