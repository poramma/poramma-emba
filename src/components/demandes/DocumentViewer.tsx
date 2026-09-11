// ============================================================
// src/components/demandes/DocumentViewer.tsx
// ============================================================

import React, { useState, useEffect, useRef } from 'react';
import { useDocuments } from '../../hooks/useDocuments';
import { DocumentGED, DocStatus } from '../../types';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Eye, Download, CheckCircle, XCircle, FileText, Image, File, ZoomIn, ZoomOut, RotateCw, Maximize2, Minimize2, ChevronLeft, ChevronRight, AlertCircle, Loader2, FileWarning } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { formatFileSize } from '../../lib/date';

const MIME_TYPE_ICONS: Record<string, React.ElementType> = {
  'application/pdf': FileText,
  'image/jpeg': Image,
  'image/png': Image,
  'image/jpg': Image,
  default: File,
};

const STATUS_CONFIG: Record<DocStatus, { label: string; color: string }> = {
  [DocStatus.UPLOADED]: { label: 'Uploadé', color: 'bg-blue-100 text-blue-700' },
  [DocStatus.IN_REVIEW]: { label: 'En vérification', color: 'bg-amber-100 text-amber-700' },
  [DocStatus.ACCEPTED]: { label: 'Accepté', color: 'bg-emerald-100 text-emerald-700' },
  [DocStatus.REJECTED]: { label: 'Rejeté', color: 'bg-red-100 text-red-700' },
  [DocStatus.EXPIRED]: { label: 'Expiré', color: 'bg-gray-100 text-gray-500' },
};

// Constantes de zoom
const MIN_ZOOM = 50;
const MAX_ZOOM = 200;
const ZOOM_STEP = 25;

interface DocumentViewerProps {
  demandeId: string;
  documents?: DocumentGED[];
  canValidate?: boolean;
}

export const DocumentViewer: React.FC<DocumentViewerProps> = ({ 
  documents: propDocuments, 
  canValidate = false 
}) => {
  const { 
    selectedDocument, 
    downloadSelected, 
    acceptDocument, 
    rejectDocument, 
    setSelectedDocument 
  } = useDocuments();

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  const viewerRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();

  const documents = propDocuments || [];

  const handlePreview = async (doc: DocumentGED) => {
    setSelectedDocument(doc);
    setShowPreviewModal(true);
    setIsLoadingPreview(true);
    setPreviewError(null);
    setZoom(100);
    setRotation(0);
    setCurrentPage(1);
    
    try {
      // TODO: Backend integration - GET /api/documents/:id/preview
      // const { data } = await api.get(`/documents/${doc.id}/preview`);
      // setPreviewUrl(data.url);
      
      // Mock: Utiliser le chemin du fichier si disponible
      if (doc.file?.path) {
        const fullUrl = `/documents/${doc.file.path}`;
        setPreviewUrl(fullUrl);
        console.log("Preview Url : ", fullUrl);
      } else {
        setPreviewError('Aucune prévisualisation disponible');
      }
      
      // Simuler le chargement
      await new Promise(resolve => setTimeout(resolve, 800));
      
      if (doc.file?.mimeType === 'application/pdf') {
        setTotalPages(3); // Mock
      }
    } catch (err) {
      setPreviewError('Impossible de charger le document');
    } finally {
      setIsLoadingPreview(false);
    }
  };

  const handleDownload = async (doc: DocumentGED) => {
    setSelectedDocument(doc);
    await downloadSelected();
  };

  const handleAccept = async (doc: DocumentGED) => {
    await acceptDocument(doc.id, 'Document conforme et validé');
  };

  const handleReject = async (doc: DocumentGED) => {
    await rejectDocument(doc.id, 'Document non conforme - resoumission requise');
  };

  const handleZoomIn = () => setZoom(prev => Math.min(MAX_ZOOM, prev + ZOOM_STEP));
  const handleZoomOut = () => setZoom(prev => Math.max(MIN_ZOOM, prev - ZOOM_STEP));
  const handleResetZoom = () => {
    setZoom(100);
    setRotation(0);
  };
  const handleRotate = () => setRotation(prev => (prev + 90) % 360);

  const toggleFullscreen = () => {
    if (!viewerRef.current) return;
    
    if (!document.fullscreenElement) {
      viewerRef.current.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) setCurrentPage(prev => prev - 1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(prev => prev + 1);
  };

  const isImage = selectedDocument?.file?.mimeType?.startsWith('image/');
  const isPDF = selectedDocument?.file?.mimeType === 'application/pdf';
  const isWord = selectedDocument?.file?.mimeType?.includes('word') || 
                  selectedDocument?.file?.mimeType?.includes('document');
  const isExcel = selectedDocument?.file?.mimeType?.includes('sheet') || 
                   selectedDocument?.file?.mimeType?.includes('excel');

  // Rendu du watermark
  const renderWatermark = () => {
    if (!user?.profile) return null;

    const dateStr = new Date().toLocaleString('fr-FR', {
      dateStyle: 'short',
      timeStyle: 'short',
    });

    return (
      <div className="absolute inset-0 pointer-events-none select-none overflow-hidden z-10">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rotate-[-45deg] opacity-[0.06] text-3xl font-bold text-gray-900 whitespace-nowrap">
          {user.profile.firstName} {user.profile.lastName} • {dateStr}
        </div>
      </div>
    );
  };

  // Rendu du viewer
  const renderViewer = () => {
    if (!previewUrl) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-gray-400 p-8">
          <FileWarning className="w-12 h-12 mb-3" />
          <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
            Aperçu non disponible
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Ce type de fichier ne peut pas être visualisé en ligne
          </p>
          <Button 
            variant="outline" 
            className="mt-4"
            onClick={() => selectedDocument && handleDownload(selectedDocument)}
          >
            <Download className="w-4 h-4 mr-2" />
            Télécharger pour consulter
          </Button>
        </div>
      );
    }

    // PDF
    if (isPDF) {
      return (
        <div 
          className="w-full h-full relative"
          style={{
            transform: `scale(${zoom / 100})`,
            transformOrigin: 'top left',
            transition: 'transform 0.15s ease',
          }}
        >
          <iframe
            src={`${previewUrl}#toolbar=0`}
            title={selectedDocument?.file?.originalName || 'Document PDF'}
            className="w-full border-0"
            style={{ 
              width: `${10000 / zoom}%`, 
              height: `${10000 / zoom}%`,
              minWidth: '100%',
              minHeight: '100%',
            }}
          />
        </div>
      );
    }

    // Image
    if (isImage) {
      return (
        <img
          src={previewUrl}
          alt={selectedDocument?.file?.originalName || 'Image'}
          style={{
            transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
            transition: 'transform 0.15s ease',
          }}
          className="max-w-full max-h-full object-contain"
        />
      );
    }

    // Word, Excel, autres
    if (isWord || isExcel) {
      const googleViewerUrl = `https://docs.google.com/gview?url=${encodeURIComponent(previewUrl)}&embedded=true`;
      
      return (
        <div 
          className="w-full h-full relative"
          style={{
            transform: `scale(${zoom / 100})`,
            transformOrigin: 'top left',
            transition: 'transform 0.15s ease',
          }}
        >
          <iframe
            src={googleViewerUrl}
            title={selectedDocument?.file?.originalName || 'Document'}
            className="w-full border-0"
            style={{ 
              width: `${10000 / zoom}%`, 
              height: `${10000 / zoom}%`,
              minWidth: '100%',
              minHeight: '100%',
            }}
          />
        </div>
      );
    }

    // Fallback
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-400 p-8">
        <FileWarning className="w-12 h-12 mb-3" />
        <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
          Aperçu non disponible
        </p>
        <p className="text-xs text-gray-400 mt-1">
          Téléchargez le fichier pour le consulter
        </p>
        <Button 
          variant="outline" 
          className="mt-4"
          onClick={() => selectedDocument && handleDownload(selectedDocument)}
        >
          <Download className="w-4 h-4 mr-2" />
          Télécharger
        </Button>
      </div>
    );
  };

  if (documents.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400">
        <FileText className="h-12 w-12 mx-auto mb-2 opacity-30" />
        <p className="text-sm">Aucun document attaché</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {documents.map((doc) => {
        const Icon = MIME_TYPE_ICONS[doc.file?.mimeType] || MIME_TYPE_ICONS.default;
        const status = STATUS_CONFIG[doc.status];

        return (
          <div
            key={doc.id}
            className="flex items-start gap-3 p-3 rounded-lg border border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
          >
            <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center shrink-0">
              <Icon className="h-5 w-5 text-gray-500" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {doc.file?.originalName || 'Document sans nom'}
                </p>
                <Badge className={`${status.color} border-0 text-xs`}>
                  {status.label}
                </Badge>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                {formatFileSize(doc.file?.size || 0)} • Uploadé le {new Date(doc.createdAt).toLocaleDateString('fr-FR')}
              </p>
              {doc.reviewNote && (
                <p className="text-xs text-gray-600 mt-1 bg-gray-50 dark:bg-gray-700/50 rounded p-1.5">
                  {doc.reviewNote}
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 shrink-0">
              <Button size="sm" variant="ghost" onClick={() => handlePreview(doc)}>
                <Eye className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="ghost" onClick={() => handleDownload(doc)}>
                <Download className="h-4 w-4" />
              </Button>
              {canValidate && doc.status === DocStatus.IN_REVIEW && (
                <>
                  <Button size="sm" variant="ghost" className="text-emerald-600" onClick={() => handleAccept(doc)}>
                    <CheckCircle className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="ghost" className="text-red-600" onClick={() => handleReject(doc)}>
                    <XCircle className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
          </div>
        );
      })}

      {/* Modal de prévisualisation complet */}
      {showPreviewModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowPreviewModal(false)}>
          <div 
            ref={viewerRef}
            className="bg-white dark:bg-gray-900 rounded-xl overflow-hidden max-w-6xl max-h-[90vh] w-full flex flex-col" 
            onClick={e => e.stopPropagation()}
            style={{ height: '85vh' }}
          >
            {/* Barre d'outils */}
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
              <div className="flex items-center gap-3 min-w-0">
                <FileText className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <p className="text-sm text-gray-600 dark:text-gray-300 truncate max-w-[200px] sm:max-w-[300px]">
                  {selectedDocument?.file?.originalName || 'Document sans nom'}
                </p>
                {selectedDocument?.file && (
                  <span className="text-xs text-gray-400 hidden sm:inline">
                    {formatFileSize(selectedDocument.file.size)}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-0.5">
                {/* Contrôles de zoom */}
                <button
                  type="button"
                  title="Zoom arrière"
                  onClick={handleZoomOut}
                  disabled={zoom <= MIN_ZOOM}
                  className="p-1.5 rounded-md text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-40 transition-colors"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <span className="text-xs text-gray-400 w-10 text-center font-mono">
                  {zoom}%
                </span>
                <button
                  type="button"
                  title="Zoom avant"
                  onClick={handleZoomIn}
                  disabled={zoom >= MAX_ZOOM}
                  className="p-1.5 rounded-md text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-40 transition-colors"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>

                {/* Rotation (images uniquement) */}
                {isImage && (
                  <button
                    type="button"
                    title="Pivoter"
                    onClick={handleRotate}
                    className="p-1.5 rounded-md text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    <RotateCw className="w-4 h-4" />
                  </button>
                )}

                {/* Réinitialiser */}
                <button
                  type="button"
                  title="Réinitialiser"
                  onClick={handleResetZoom}
                  className="p-1.5 rounded-md text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <Maximize2 className="w-4 h-4" />
                </button>

                {/* Plein écran */}
                <button
                  type="button"
                  title="Plein écran"
                  onClick={toggleFullscreen}
                  className="p-1.5 rounded-md text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </button>

                {/* Téléchargement */}
                <button
                  type="button"
                  title="Télécharger"
                  onClick={() => selectedDocument && handleDownload(selectedDocument)}
                  className="p-1.5 rounded-md text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <Download className="w-4 h-4" />
                </button>

                {/* Fermeture */}
                <button
                  type="button"
                  title="Fermer"
                  onClick={() => setShowPreviewModal(false)}
                  className="p-1.5 rounded-md text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-700 transition-colors"
                >
                  <span className="sr-only">Fermer</span>
                  <span className="text-lg leading-none">×</span>
                </button>
              </div>
            </div>

            {/* Zone d'aperçu */}
            <div className="flex-1 relative bg-gray-50 dark:bg-gray-950 flex items-center justify-center overflow-auto">
              {isLoadingPreview ? (
                <div className="text-center">
                  <Loader2 className="w-12 h-12 text-brand-500 animate-spin mx-auto mb-4" />
                  <p className="text-sm text-gray-500">Chargement du document...</p>
                </div>
              ) : previewError ? (
                <div className="text-center">
                  <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                  <p className="text-sm text-gray-600 dark:text-gray-300">{previewError}</p>
                </div>
              ) : (
                <>
                  {renderWatermark()}
                  <div className="w-full h-full flex items-center justify-center p-4">
                    {renderViewer()}
                  </div>

                  {/* Navigation PDF */}
                  {isPDF && totalPages > 1 && !isFullscreen && (
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white dark:bg-gray-800 rounded-lg shadow-lg px-3 py-1.5 flex items-center gap-3 z-20">
                      <button
                        aria-label="Précédent"
                        type="button"
                        onClick={handlePreviousPage}
                        disabled={currentPage <= 1}
                        className="p-1 rounded text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-40 transition-colors"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <span className="text-xs text-gray-600 dark:text-gray-300 font-mono">
                        {currentPage} / {totalPages}
                      </span>
                      <button
                        aria-label="Suivant"
                        type="button"
                        onClick={handleNextPage}
                        disabled={currentPage >= totalPages}
                        className="p-1 rounded text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-40 transition-colors"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentViewer;
