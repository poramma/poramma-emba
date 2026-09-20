// src/pages/documents/DocumentDetailPage.tsx

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, FileText, Download, Eye, 
  Clock, AlertTriangle,
  Info, Trash2, Archive,
  Calendar
} from 'lucide-react';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Tabs } from '../../components/ui/tabs';
import { PermissionGuard } from '../../components/auth/PermissionGuard';
import { DocumentViewer } from '../../components/documents/DocumentViewer';
import { DocumentStatusBadge } from '../../components/documents/DocumentStatusBadge';
import { DocumentVersion } from '../../components/documents/DocumentVersion';
import { DocumentMetadataPanel } from '../../components/documents/detail/DocumentMetadataPanel';
import { DocumentDecisionPanel } from '../../components/documents/detail/DocumentDecisionPanel';
import { formatDateShort, formatDateTime } from '../../lib/date';
import { DocumentAccessHistory } from '../../components/documents/detail/DocumentAccessHistory';
import { useDocuments } from '../../hooks/useDocuments';
import { usePermission } from '../../hooks/usePermission';
import { useToast } from '../../hooks/useToast';
import { PermissionCode } from '../../types/auth';
import { DocStatus } from '../../types/etudiant';
import { documentTypeLabels } from '../../config/document-labels';
import { Skeleton } from '../../components/ui/skeleton';

type TabType = 'viewer' | 'metadata' | 'versions' | 'history';

export const DocumentDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { 
    selectedDocument, 
    versions, 
    auditLogs,
    isLoading,
    fetchDocumentById,
    fetchVersions,
    fetchAuditLogs,
    validateDocument,
    archiveDocument,
    downloadDocument,
    selectedDocumentCanValidate,
  } = useDocuments();
  const { can } = usePermission();

  const [activeTab, setActiveTab] = useState<TabType>('viewer');

  const canValidate = can(PermissionCode.DOCUMENT_VALIDATE);
  const canDelete = can(PermissionCode.DOCUMENT_DELETE);
  const canArchive = can(PermissionCode.DOCUMENT_UPDATE);

  useEffect(() => {
    if (id) {
      fetchDocumentById(id);
      fetchVersions(id);
      fetchAuditLogs(id);
    }
  }, [id]);

  const handleAccept = async (note?: string) => {
    if (!id) return;
    try {
      await validateDocument(id, {
        status: DocStatus.ACCEPTED,
        reviewNote: note,
      });
      //await fetchDocumentById(id);
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

  const handleReject = async (note: string) => {
    if (!id) return;
    try {
      await validateDocument(id, {
        status: DocStatus.REJECTED,
        reviewNote: note,
      });
      //await fetchDocumentById(id);
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

  const handleArchive = async () => {
    if (!id) return;    
    try {
      await archiveDocument(id);
      //await fetchDocumentById(id);
      toast({
        title: 'Document archivé',
        description: 'Le document a été archivé avec succès.',
        variant: 'success',
      });
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible d\'archiver le document.',
        variant: 'error',
      });
    }
  };

  const handleDownload = async () => {
    if (selectedDocument?.fileId) {
      await downloadDocument(selectedDocument.fileId);
    }
  };

  if (isLoading && !selectedDocument) {
    return (
      <div className="p-6 grid grid-cols-1 xl:grid-cols-3 gap-5">
        <Skeleton className="h-96 rounded-2xl xl:col-span-2" />
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    );
  }

  if (!selectedDocument) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-4xl mx-auto">
          <Card className="p-8 text-center">
            <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Document introuvable
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              Le document que vous recherchez n'existe pas ou a été supprimé.
            </p>
            <Button className="mt-4" variant="primary" onClick={() => navigate('/documents')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour aux documents
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <PermissionGuard 
      minRoleLevel={4} 
      permission={PermissionCode.DOCUMENT_READ}
      title="Détail du document"
    >
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* En-tête */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={() => navigate(-1)}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Retour
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white truncate max-w-md">
                  {selectedDocument.file?.originalName || 'Document sans nom'}
                </h1>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <Badge color="gray" variant="light">
                    {documentTypeLabels[selectedDocument.type]}
                  </Badge>
                  <DocumentStatusBadge status={selectedDocument.status} />
                  {selectedDocument.expiryDate && (
                    <Badge color="warning" variant="light">
                      <Calendar className="w-3 h-3 mr-1" />
                      Expire le {formatDateShort(selectedDocument.expiryDate)}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={handleDownload}>
                <Download className="w-4 h-4 mr-1" />
                Télécharger
              </Button>
              {canArchive && (
                <Button variant="outline" size="sm" onClick={handleArchive}>
                  <Archive className="w-4 h-4 mr-1" />
                  Archiver
                </Button>
              )}
              {canDelete && (
                <Button variant="error" size="sm">
                  <Trash2 className="w-4 h-4 mr-1" />
                  Supprimer
                </Button>
              )}
            </div>
          </div>

          {/* Metadata Panel */}
          <DocumentMetadataPanel 
            document={selectedDocument}
            onStudentClick={(userId) => navigate(`/documents/students/${userId}`)}
          />

          {/* Onglets */}
          <Card className="p-4">
            <Tabs
              tabs={[
                { id: 'viewer', label: 'Visualiseur', icon: <Eye className="w-4 h-4" /> },
                { id: 'metadata', label: 'Métadonnées', icon: <Info className="w-4 h-4" /> },
                { id: 'versions', label: 'Versions', icon: <Clock className="w-4 h-4" /> },
                { id: 'history', label: 'Historique', icon: <FileText className="w-4 h-4" /> },
              ]}
              activeTab={activeTab}
              onTabChange={(id) => setActiveTab(id as TabType)}
            />
          </Card>

          {/* Contenu des onglets */}
          {activeTab === 'viewer' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <DocumentViewer
                  doc={selectedDocument}
                  onDownload={handleDownload}
                  showWatermark={selectedDocument.type === 'PASSPORT' || selectedDocument.type === 'ID_CARD'}
                />
              </div>
              <div>
                <DocumentDecisionPanel
                  document={selectedDocument}
                  canValidate={selectedDocumentCanValidate && canValidate}
                  onAccept={handleAccept}
                  onReject={handleReject}
                  onArchive={handleArchive}
                  isLoading={isLoading}
                />
              </div>
            </div>
          )}

          {activeTab === 'metadata' && (
            <Card className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Informations générales
                  </h4>
                  <dl className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-gray-500">Type</dt>
                      <dd className="text-gray-700 dark:text-gray-300">{documentTypeLabels[selectedDocument.type]}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-500">Catégorie</dt>
                      <dd className="text-gray-700 dark:text-gray-300">
                        {selectedDocument.category?.name || 'Non catégorisé'}
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-500">Statut</dt>
                      <dd>
                        <DocumentStatusBadge status={selectedDocument.status} size="sm" />
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-500">Version</dt>
                      <dd className="text-gray-700 dark:text-gray-300">v{selectedDocument.version}</dd>
                    </div>
                  </dl>
                </div>
                <div>
                  <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Dates
                  </h4>
                  <dl className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-gray-500">Soumis le</dt>
                      <dd className="text-gray-700 dark:text-gray-300">
                        {formatDateTime(selectedDocument.createdAt)}
                      </dd>
                    </div>
                    {selectedDocument.reviewedAt && (
                      <div className="flex justify-between">
                        <dt className="text-gray-500">Validé le</dt>
                        <dd className="text-gray-700 dark:text-gray-300">
                          {formatDateTime(selectedDocument.reviewedAt)}
                        </dd>
                      </div>
                    )}
                    {selectedDocument.expiryDate && (
                      <div className="flex justify-between">
                        <dt className="text-gray-500">Expire le</dt>
                        <dd className="text-gray-700 dark:text-gray-300">
                          {formatDateShort(selectedDocument.expiryDate)}
                        </dd>
                      </div>
                    )}
                  </dl>
                  {selectedDocument.reviewNote && (
                    <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <p className="text-sm text-gray-500">Note de validation</p>
                      <p className="text-sm text-gray-700 dark:text-gray-300">{selectedDocument.reviewNote}</p>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          )}

          {activeTab === 'versions' && (
            <DocumentVersion
              documentId={selectedDocument.id}
              versions={versions}
              currentVersion={selectedDocument.version}
            />
          )}

          {activeTab === 'history' && (
            <DocumentAccessHistory auditLogs={auditLogs} isLoading={isLoading} />
          )}
        </div>
      </div>
    </PermissionGuard>
  );
};

export default DocumentDetailPage;