// src/components/documents/students/StudentDocumentDossier.tsx

import React, { useState, useEffect } from 'react';
import { AlertCircle, Upload, ChevronUp } from 'lucide-react';
import { Card } from '../../ui/card';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { DocumentList } from '../DocumentList';
import { DocumentUpload } from '../DocumentUpload';
import { DocumentCompletionBar } from './DocumentCompletionBar';
import { BulkResubmissionModal } from './BulkResubmissionModal';
import { useDocuments } from '../../../hooks/useDocuments';
import { useAuth } from '../../../hooks/useAuth';
import { usePermission } from '../../../hooks/usePermission';
import { useToast } from '../../../hooks/useToast';
import { DocumentGED, Requirement } from '../../../types';
import { DocStatus } from '../../../types/etudiant';
import { PermissionCode } from '../../../types/auth';

interface StudentDocumentDossierProps {
  studentId: string;
  studentName?: string;
  studentINUE?: string;
  university?: string;
  requirements?: Requirement[];
  onDocumentClick?: (doc: DocumentGED) => void;
}

export const StudentDocumentDossier: React.FC<StudentDocumentDossierProps> = ({
  studentId,
  studentName,
  studentINUE,
  university,
  requirements = [],
  onDocumentClick,
}) => {
  const { 
    documents, 
    fetchDocuments, 
    isLoading,
    downloadDocument,
    selectedDocument,
  } = useDocuments();
  const { toast } = useToast();
  const { can } = usePermission();

  const [showUpload, setShowUpload] = useState(false);
  const [selectedDocs, setSelectedDocs] = useState<DocumentGED[]>([]);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState<DocStatus | 'all'>('all');

  // Charger les documents de l'étudiant
  useEffect(() => {
    if (studentId) {
      fetchDocuments({ ownerUserId: studentId });
    }
  }, [studentId]);

  const studentDocs = documents.filter(d => d.ownerUserId === studentId);
  
  const filteredDocs = filterStatus === 'all' 
    ? studentDocs 
    : studentDocs.filter(d => d.status === filterStatus);

  const handleBulkResubmission = async (note: string) => {
    // TODO: Implémenter la resoumission en masse
    toast({
      title: 'Resoumission demandée',
      description: `${selectedDocs.length} document(s) concerné(s)`,
      variant: 'success',
    });
    setSelectedDocs([]);
    setShowBulkModal(false);
    await fetchDocuments({ ownerUserId: studentId });
  };

  const handleDownload = async (doc: DocumentGED) => {
    if (doc.fileId) {
      await downloadDocument(doc.fileId);
      toast({
        title: 'Téléchargement',
        description: `Téléchargement de ${doc.file?.originalName} en cours...`,
        variant: 'info',
      });
    }
  };

  const handleUploadSuccess = () => {
    setShowUpload(false);
    fetchDocuments({ ownerUserId: studentId });
    toast({
      title: 'Document téléversé',
      description: 'Le document a été ajouté avec succès.',
      variant: 'success',
    });
  };

  const getStatusCounts = () => {
    const counts = {
      total: studentDocs.length,
      accepted: studentDocs.filter(d => d.status === DocStatus.ACCEPTED).length,
      rejected: studentDocs.filter(d => d.status === DocStatus.REJECTED).length,
      pending: studentDocs.filter(d => d.status === DocStatus.IN_REVIEW || d.status === DocStatus.UPLOADED).length,
    };
    return counts;
  };

  const counts = getStatusCounts();

  return (
    <div className="space-y-6">
      {/* En-tête étudiant */}
      <Card className="p-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center text-brand-600 font-bold text-xl">
              {studentName?.charAt(0) || '?'}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {studentName || 'Étudiant'}
              </h3>
              {studentINUE && (
                <p className="text-sm text-gray-500">INUE: {studentINUE}</p>
              )}
              {university && (
                <p className="text-sm text-gray-500">{university}</p>
              )}
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <Badge color="primary" variant="light">
              {counts.total} documents
            </Badge>
            <Badge color="success" variant="light">
              {counts.accepted} validés
            </Badge>
            <Badge color="warning" variant="light">
              {counts.pending} en attente
            </Badge>
            {counts.rejected > 0 && (
              <Badge color="error" variant="light">
                {counts.rejected} rejetés
              </Badge>
            )}
            {can(PermissionCode.DOCUMENT_UPLOAD) && (
              <Button size="sm" variant="primary" onClick={() => setShowUpload(!showUpload)}>
                {showUpload ? (
                  <>
                    <ChevronUp className="w-4 h-4 mr-1" />
                    Masquer
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-1" />
                    Téléverser
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Barre de complétion */}
      {requirements.length > 0 && (
        <DocumentCompletionBar 
          requirements={requirements} 
          documents={studentDocs} 
        />
      )}

      {/* Upload */}
      {showUpload && (
        <DocumentUpload
          ownerUserId={studentId}
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

      {/* Filtres et actions */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <Badge 
            color={filterStatus === 'all' ? 'primary' : 'gray'} 
            variant={filterStatus === 'all' ? 'solid' : 'light'}
            className="cursor-pointer"
            onClick={() => setFilterStatus('all')}
          >
            Tous ({counts.total})
          </Badge>
          <Badge 
            color={filterStatus === DocStatus.ACCEPTED ? 'success' : 'gray'} 
            variant={filterStatus === DocStatus.ACCEPTED ? 'solid' : 'light'}
            className="cursor-pointer"
            onClick={() => setFilterStatus(DocStatus.ACCEPTED)}
          >
            Validés ({counts.accepted})
          </Badge>
          <Badge 
            color={filterStatus === DocStatus.IN_REVIEW ? 'warning' : 'gray'} 
            variant={filterStatus === DocStatus.IN_REVIEW ? 'solid' : 'light'}
            className="cursor-pointer"
            onClick={() => setFilterStatus(DocStatus.IN_REVIEW)}
          >
            En cours ({studentDocs.filter(d => d.status === DocStatus.IN_REVIEW).length})
          </Badge>
          <Badge 
            color={filterStatus === DocStatus.REJECTED ? 'error' : 'gray'} 
            variant={filterStatus === DocStatus.REJECTED ? 'solid' : 'light'}
            className="cursor-pointer"
            onClick={() => setFilterStatus(DocStatus.REJECTED)}
          >
            Rejetés ({counts.rejected})
          </Badge>
        </div>

        {selectedDocs.length > 0 && (
          <Button 
            size="sm" 
            variant="warning" 
            onClick={() => setShowBulkModal(true)}
          >
            <AlertCircle className="w-4 h-4 mr-1" />
            Demander une resoumission ({selectedDocs.length})
          </Button>
        )}
      </div>

      {/* Liste des documents */}
      <DocumentList
        documents={filteredDocs}
        isLoading={isLoading}
        showOwnerColumn={false}
        emptyMessage="Aucun document pour cet étudiant"
        onRowClick={onDocumentClick}
        onDownload={handleDownload}
      />

      {/* Modal de resoumission en masse */}
      <BulkResubmissionModal
        isOpen={showBulkModal}
        onClose={() => {
          setShowBulkModal(false);
          setSelectedDocs([]);
        }}
        selectedDocuments={selectedDocs}
        onConfirm={handleBulkResubmission}
      />
    </div>
  );
};

export default StudentDocumentDossier;