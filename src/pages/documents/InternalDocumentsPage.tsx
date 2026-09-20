// src/pages/documents/InternalDocumentsPage.tsx

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, Lock, Upload, Download,
  ArrowLeft
} from 'lucide-react';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { PermissionGuard } from '../../components/auth/PermissionGuard';
import { InternalDocumentList } from '../../components/documents/internal/InternalDocumentList';
import { InternalDocumentUpload } from '../../components/documents/internal/InternalDocumentUpload';
import { InternalDocumentShareModal } from '../../components/documents/internal/InternalDocumentShareModal';
import { useDocuments } from '../../hooks/useDocuments';
import { usePermission } from '../../hooks/usePermission';
import { useToast } from '../../hooks/useToast';
import { PermissionCode } from '../../types/auth';
import { InternalDocument, ConfidentialityLevel } from '../../types/document';
import { confidentialityLabels, departmentLabels } from '../../config/document-labels';

export const InternalDocumentsPage: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const {
    internalDocuments,
    fetchInternalDocuments,
    isLoading,
    downloadInternalDocument,
    shareInternalDocument,
  } = useDocuments();
  const { can } = usePermission();

  const [showUpload, setShowUpload] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<InternalDocument | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);

  const canUpload = can(PermissionCode.DOCUMENT_UPLOAD);

  useEffect(() => {
    fetchInternalDocuments();
  }, []);

  const handleDocumentClick = (doc: InternalDocument) => {
    setSelectedDocument(doc);
    // Pour les documents restreints ou confidentiels, vérifier l'accès
    if (doc.confidentiality === ConfidentialityLevel.CONFIDENTIAL) {
      // TODO: Vérifier si l'utilisateur a accès
    }
  };

  const handleDownload = async (doc: InternalDocument) => {
    await downloadInternalDocument(doc);
    toast({
      title: 'Téléchargement',
      description: `Téléchargement de ${doc.title} en cours...`,
      variant: 'info',
    });
  };

  const handleUploadSuccess = () => {
    setShowUpload(false);
    fetchInternalDocuments();
    toast({
      title: 'Document interne téléversé',
      description: 'Le document a été ajouté avec succès.',
      variant: 'success',
    });
  };

  const handleShare = async (targetAgentIds: string[], targetRoleIds: string[]) => {
    if (!selectedDocument) return;
    await shareInternalDocument(selectedDocument.id, targetAgentIds, targetRoleIds);
  };

  const canShare = can(PermissionCode.DOCUMENT_SHARE) || can(PermissionCode.SERVICE_ADMIN);

  return (
    <PermissionGuard 
      minRoleLevel={3} 
      permission={PermissionCode.DOCUMENT_READ}
      title="Documents internes"
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
                  Documents internes
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  {internalDocuments.length} document{internalDocuments.length > 1 ? 's' : ''} interne{internalDocuments.length > 1 ? 's' : ''}
                </p>
              </div>
            </div>
            {canUpload && (
              <Button variant="primary" onClick={() => setShowUpload(!showUpload)}>
                <Upload className="w-4 h-4 mr-2" />
                {showUpload ? 'Masquer' : 'Téléverser'}
              </Button>
            )}
          </div>

          {/* Upload panel */}
          {showUpload && (
            <InternalDocumentUpload
              onUploadSuccess={handleUploadSuccess}
              onUploadError={(error) => {
                toast({
                  title: 'Erreur',
                  description: error,
                  variant: 'error',
                });
              }}
              onClose={() => setShowUpload(false)}
            />
          )}

          {/* Liste */}
          <InternalDocumentList
            documents={internalDocuments}
            isLoading={isLoading}
            onRowClick={handleDocumentClick}
            onDownload={handleDownload}
          />

          {/* Détail du document sélectionné */}
          {selectedDocument && (
            <Card className="p-4">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white">
                    {selectedDocument.title}
                  </h4>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    <Badge color="gray" variant="light">
                      v{selectedDocument.version}
                    </Badge>
                    <Badge color="gray" variant="light">
                      {departmentLabels[selectedDocument.department] ?? selectedDocument.department}
                    </Badge>
                    <Badge color="warning" variant="light">
                      <Lock className="w-3 h-3 mr-1" />
                      {confidentialityLabels[selectedDocument.confidentiality]}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {selectedDocument.tags.map((tag) => (
                      <Badge key={tag} color="gray" variant="light" size="xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  {canShare && (
                    <Button size="sm" variant="outline" onClick={() => setShowShareModal(true)}>
                      <Users className="w-4 h-4 mr-1" />
                      Partager
                    </Button>
                  )}
                  <Button size="sm" variant="outline" onClick={() => handleDownload(selectedDocument)}>
                    <Download className="w-4 h-4 mr-1" />
                    Télécharger
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setSelectedDocument(null)}>
                    Fermer
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {/* Modal de partage */}
          {selectedDocument && (
            <InternalDocumentShareModal
              isOpen={showShareModal}
              onClose={() => {
                setShowShareModal(false);
                setSelectedDocument(null);
              }}
              document={selectedDocument}
              onShare={handleShare}
            />
          )}
        </div>
      </div>
    </PermissionGuard>
  );
};

export default InternalDocumentsPage;