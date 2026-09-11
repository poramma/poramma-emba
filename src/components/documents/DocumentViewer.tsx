// src/components/documents/DocumentViewer.tsx

import React, { useState, useEffect, useRef } from 'react';
import { 
  Download, ZoomIn, ZoomOut, RotateCw, 
  Maximize2, Minimize2, ChevronLeft, ChevronRight,
  FileText, AlertCircle, Lock, Loader2,
  FileWarning
} from 'lucide-react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { useDocuments } from '../../hooks/useDocuments';
import { useAuth } from '../../hooks/useAuth';
import { DocumentGED } from '../../types/document';
import { formatDateShort, formatFileSize } from '../../lib/date';

interface DocumentViewerProps {
  doc: DocumentGED;
  onDownload?: () => void;
  onClose?: () => void;
  showWatermark?: boolean;
  className?: string;
  mode?: 'decision' | 'readonly';
  height?: number;
}

// Constantes de zoom
const MIN_ZOOM = 50;
const MAX_ZOOM = 200;
const ZOOM_STEP = 25;

export const DocumentViewer: React.FC<DocumentViewerProps> = ({
  doc,
  onDownload,
  onClose,
  showWatermark = true,
  className = '',
  mode = 'decision',
  height = 520,
}) => {
  const { user } = useAuth();
  const { downloadDocument } = useDocuments();
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const viewerRef = useRef<HTMLDivElement>(null);


  const isImage = doc.file?.mimeType?.startsWith('image/');
  const isPDF = doc.file?.mimeType === 'application/pdf';
  const isWord = doc.file?.mimeType?.includes('word') || 
                  doc.file?.mimeType?.includes('document');
  const isExcel = doc.file?.mimeType?.includes('sheet') || 
                   doc.file?.mimeType?.includes('excel');

  // Générer l'URL de prévisualisation
  useEffect(() => {
    const loadPreview = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // TODO: Appel API pour obtenir l'URL présignée
        // const { data } = await api.get(`/documents/${document.id}/preview`);
        // setPreviewUrl(data.url);
        
        // Mock: Utiliser le chemin du fichier
        if (doc.file?.path) {
          setPreviewUrl(doc.file.path);
        } else {
          setError('Aucune prévisualisation disponible');
        }
        
        // Simuler le chargement
        await new Promise(resolve => setTimeout(resolve, 800));
        
        if (isPDF) {
          setTotalPages(3); // Mock: À remplacer par le nombre réel de pages
        }
        
      } catch (err) {
        setError('Impossible de charger le document');
      } finally {
        setIsLoading(false);
      }
    };

    loadPreview();
  }, [doc.id, doc.file?.path, isPDF]);

  // Gestion du plein écran
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const handleZoomIn = () => setZoom(prev => Math.min(MAX_ZOOM, prev + ZOOM_STEP));
  const handleZoomOut = () => setZoom(prev => Math.max(MIN_ZOOM, prev - ZOOM_STEP));
  const handleReset = () => {
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

  const handleDownload = async () => {
    if (doc.file?.id) {
      await downloadDocument(doc.file.id);
      onDownload?.();
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) setCurrentPage(prev => prev - 1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(prev => prev + 1);
  };

  // Rendu du watermark
  const renderWatermark = () => {
    if (!showWatermark) return null;
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
          {mode === 'decision' && (
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={handleDownload}
            >
              <Download className="w-4 h-4 mr-2" />
              Télécharger pour consulter
            </Button>
          )}
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
            title={doc.file?.originalName || 'Document PDF'}
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
          alt={doc.file?.originalName || 'Image'}
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
      // Utiliser l'API Google Docs Viewer si disponible
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
            title={doc.file?.originalName || 'Document'}
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
        {mode === 'decision' && (
          <Button 
            variant="outline" 
            className="mt-4"
            onClick={handleDownload}
          >
            <Download className="w-4 h-4 mr-2" />
            Télécharger
          </Button>
        )}
      </div>
    );
  };

  // États de chargement et d'erreur
  if (isLoading) {
    return (
      <Card className={`overflow-hidden ${className}`}>
        <div className="flex items-center justify-center p-8" style={{ height }}>
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-brand-500 animate-spin mx-auto mb-4" />
            <p className="text-sm text-gray-500">Chargement du document...</p>
          </div>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={`overflow-hidden ${className}`}>
        <div className="flex flex-col items-center justify-center p-8" style={{ height }}>
          <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Impossible de charger le document
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center max-w-md">
            {error}
          </p>
          <Button 
            className="mt-4" 
            variant="primary" 
            onClick={handleDownload}
          >
            <Download className="w-4 h-4 mr-2" />
            Télécharger
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card 
      ref={viewerRef}
      className={`overflow-hidden ${className}`}
    >
      {/* Barre d'outils */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
        <div className="flex items-center gap-3 min-w-0">
          <FileText className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <p className="text-sm text-gray-600 dark:text-gray-300 truncate max-w-[200px] sm:max-w-[300px]">
            {doc.file?.originalName || 'Document sans nom'}
          </p>
          {doc.file && (
            <span className="text-xs text-gray-400 hidden sm:inline">
              {formatFileSize(doc.file.size)}
            </span>
          )}
        </div>

        <div className="flex items-center gap-0.5">
          {/* Contrôles de zoom (pour tous les types) */}
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
            onClick={handleReset}
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

          {/* Téléchargement (mode decision uniquement) */}
          {mode === 'decision' && (
            <button
              type="button"
              title="Télécharger"
              onClick={handleDownload}
              className="p-1.5 rounded-md text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <Download className="w-4 h-4" />
            </button>
          )}

          {/* Fermeture */}
          {onClose && (
            <button
              type="button"
              title="Fermer"
              onClick={onClose}
              className="p-1.5 rounded-md text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-700 transition-colors"
            >
              <span className="sr-only">Fermer</span>
              <span className="text-lg leading-none">×</span>
            </button>
          )}
        </div>
      </div>

      {/* Zone d'aperçu */}
      <div
        className={`relative bg-gray-50 dark:bg-gray-950 flex items-center justify-center overflow-auto ${
          isFullscreen ? 'fixed inset-0 z-50 bg-gray-900' : ''
        }`}
        style={{ height: isFullscreen ? '100vh' : height }}
      >
        {renderWatermark()}

        {/* Contenu du viewer */}
        <div className="w-full h-full flex items-center justify-center p-4">
          {renderViewer()}
        </div>

        {/* Badge de confidentialité */}
        {doc.category?.requiresValidation && (
          <Badge 
            color="warning" 
            variant="solid" 
            className="absolute top-4 right-4 z-20"
          >
            <Lock className="w-3 h-3 mr-1" />
            Validation requise
          </Badge>
        )}

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
      </div>

      {/* Métadonnées (mode decision uniquement) */}
      {mode === 'decision' && (
        <div className="p-3 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <div>
              <p className="text-gray-400">Taille</p>
              <p className="font-medium text-gray-700 dark:text-gray-300">
                {formatFileSize(doc.file?.size || 0)}
              </p>
            </div>
            <div>
              <p className="text-gray-400">Type</p>
              <p className="font-medium text-gray-700 dark:text-gray-300">
                {doc.type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
              </p>
            </div>
            <div>
              <p className="text-gray-400">Soumis le</p>
              <p className="font-medium text-gray-700 dark:text-gray-300">
                {formatDateShort(doc.createdAt)}
              </p>
            </div>
            <div>
              <p className="text-gray-400">Statut</p>
              <p className="font-medium text-gray-700 dark:text-gray-300">
                {doc.status}
              </p>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};

export default DocumentViewer;