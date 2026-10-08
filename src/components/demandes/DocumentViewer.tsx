// ============================================================
// src/components/demandes/DocumentViewer.tsx
// ============================================================

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useDocuments } from '../../hooks/useDocuments';
import { DocumentGED, DocStatus } from '../../types';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Modal } from '../ui/modal';
import {
  Eye, Download, CheckCircle, XCircle, FileText, Image, File, ZoomIn, ZoomOut, RotateCw,
  Maximize2, Minimize2, AlertCircle, Loader2, FileWarning,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { api } from '../../lib/api';
import { formatFileSize, formatDateShort } from '../../lib/date';
import { documentTypeLabels } from '../../config/document-labels';

const MIME_TYPE_ICONS: Record<string, React.ElementType> = {
  'application/pdf': FileText,
  'image/jpeg': Image,
  'image/png': Image,
  'image/jpg': Image,
  default: File,
};

const STATUS_CONFIG: Record<DocStatus, { label: string; color: string }> = {
  [DocStatus.UPLOADED]: { label: 'Reçu', color: 'bg-blue-100 text-blue-700' },
  [DocStatus.IN_REVIEW]: { label: 'En vérification', color: 'bg-amber-100 text-amber-700' },
  [DocStatus.ACCEPTED]: { label: 'Accepté', color: 'bg-emerald-100 text-emerald-700' },
  [DocStatus.REJECTED]: { label: 'Rejeté', color: 'bg-red-100 text-red-700' },
  [DocStatus.EXPIRED]: { label: 'Expiré', color: 'bg-gray-100 text-gray-500' },
};

const MIN_ZOOM = 50;
const MAX_ZOOM = 200;
const ZOOM_STEP = 25;

/** Récupère le fichier via l'API authentifiée (le stockage n'est pas joignable directement depuis le navigateur). */
async function fetchDocumentBlob(doc: DocumentGED): Promise<Blob> {
  const { data } = await api.get(`/documents/${doc.id}/download`, { responseType: 'blob' });
  // Le type MIME du serveur est parfois générique : on force celui du document pour que l'aperçu s'affiche.
  return new Blob([data], { type: doc.file?.mimeType || (data as Blob).type || 'application/octet-stream' });
}

interface DocumentViewerProps {
  demandeId: string;
  documents?: DocumentGED[];
  canValidate?: boolean;
}

export const DocumentViewer: React.FC<DocumentViewerProps> = ({ documents: propDocuments, canValidate = false }) => {
  const { acceptDocument, rejectDocument } = useDocuments();
  const { user } = useAuth();
  const documents = propDocuments || [];

  const [previewDoc, setPreviewDoc] = useState<DocumentGED | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [review, setReview] = useState<{ doc: DocumentGED; mode: 'accept' | 'reject' } | null>(null);
  const [reviewNote, setReviewNote] = useState('');
  const [reviewBusy, setReviewBusy] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);

  const viewerRef = useRef<HTMLDivElement>(null);
  // Évite qu'une réponse tardive d'un aperçu précédent écrase le document actuellement ouvert.
  const previewToken = useRef(0);

  const revoke = useCallback(() => {
    setPreviewUrl((current) => {
      if (current) URL.revokeObjectURL(current);
      return null;
    });
  }, []);

  useEffect(() => () => revoke(), [revoke]);

  useEffect(() => {
    const onFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  const handlePreview = async (doc: DocumentGED) => {
    const token = ++previewToken.current;
    revoke();
    setPreviewDoc(doc);
    setIsLoadingPreview(true);
    setPreviewError(null);
    setZoom(100);
    setRotation(0);

    const mime = doc.file?.mimeType ?? '';
    // Seuls les PDF et les images s'affichent dans le navigateur ; le reste se télécharge.
    if (!(mime === 'application/pdf' || mime.startsWith('image/'))) {
      setIsLoadingPreview(false);
      return;
    }

    try {
      const blob = await fetchDocumentBlob(doc);
      if (token !== previewToken.current) return;
      setPreviewUrl(URL.createObjectURL(blob));
    } catch (err) {
      if (token !== previewToken.current) return;
      setPreviewError(err instanceof Error && err.message ? err.message : 'Impossible de charger le document.');
    } finally {
      if (token === previewToken.current) setIsLoadingPreview(false);
    }
  };

  const closePreview = () => {
    previewToken.current++;
    revoke();
    setPreviewDoc(null);
    if (document.fullscreenElement) document.exitFullscreen?.();
  };

  const handleDownload = async (doc: DocumentGED) => {
    setDownloadingId(doc.id);
    setActionError(null);
    try {
      const blob = await fetchDocumentBlob(doc);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = doc.file?.originalName || 'document';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err) {
      setActionError(err instanceof Error && err.message ? err.message : 'Le téléchargement a échoué.');
    } finally {
      setDownloadingId(null);
    }
  };

  const openReview = (doc: DocumentGED, mode: 'accept' | 'reject') => {
    setReview({ doc, mode });
    setReviewNote('');
    setReviewError(null);
  };

  const submitReview = async () => {
    if (!review) return;
    const note = reviewNote.trim();
    if (review.mode === 'reject' && note.length < 3) {
      setReviewError('Indiquez le motif du refus (3 caractères minimum) : il est communiqué à l\'usager.');
      return;
    }
    setReviewBusy(true);
    setReviewError(null);
    try {
      if (review.mode === 'accept') await acceptDocument(review.doc.id, note || 'Document conforme');
      else await rejectDocument(review.doc.id, note);
      setReview(null);
    } catch (err) {
      setReviewError(err instanceof Error && err.message ? err.message : "L'action a échoué. Réessayez.");
    } finally {
      setReviewBusy(false);
    }
  };

  const toggleFullscreen = () => {
    if (!viewerRef.current) return;
    if (!document.fullscreenElement) viewerRef.current.requestFullscreen?.();
    else document.exitFullscreen?.();
  };

  const mime = previewDoc?.file?.mimeType ?? '';
  const isImage = mime.startsWith('image/');
  const isPDF = mime === 'application/pdf';

  const renderWatermark = () => {
    if (!user?.profile) return null;
    const dateStr = new Date().toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' });
    return (
      <div className="absolute inset-0 pointer-events-none select-none overflow-hidden z-10">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rotate-[-45deg] opacity-[0.06] text-3xl font-bold text-gray-900 whitespace-nowrap">
          {user.profile.firstName} {user.profile.lastName} • {dateStr}
        </div>
      </div>
    );
  };

  const renderUnavailable = (text: string) => (
    <div className="flex flex-col items-center justify-center h-full text-gray-400 p-8">
      <FileWarning className="w-12 h-12 mb-3" />
      <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Aperçu non disponible</p>
      <p className="text-xs text-gray-400 mt-1 text-center">{text}</p>
      {previewDoc && (
        <Button variant="outline" className="mt-4" onClick={() => handleDownload(previewDoc)} disabled={downloadingId === previewDoc.id}>
          <Download className="w-4 h-4 mr-2" />
          Télécharger pour consulter
        </Button>
      )}
    </div>
  );

  const renderViewer = () => {
    if (!previewUrl) return renderUnavailable('Ce type de fichier ne peut pas être visualisé en ligne.');

    if (isPDF) {
      return (
        <iframe
          src={previewUrl}
          title={previewDoc?.file?.originalName || 'Document PDF'}
          className="w-full h-full border-0 bg-white"
          style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center', transition: 'transform 0.15s ease' }}
        />
      );
    }

    return (
      <img
        src={previewUrl}
        alt={previewDoc?.file?.originalName || 'Image'}
        style={{ transform: `scale(${zoom / 100}) rotate(${rotation}deg)`, transition: 'transform 0.15s ease' }}
        className="max-w-full max-h-full object-contain"
      />
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
      {actionError && (
        <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span className="flex-1">{actionError}</span>
          <button type="button" onClick={() => setActionError(null)} className="text-red-500 hover:text-red-700">
            &times;
          </button>
        </div>
      )}

      {documents.map((doc) => {
        const Icon = MIME_TYPE_ICONS[doc.file?.mimeType] || MIME_TYPE_ICONS.default;
        const status = STATUS_CONFIG[doc.status] ?? STATUS_CONFIG[DocStatus.UPLOADED];
        const reviewable = canValidate && (doc.status === DocStatus.UPLOADED || doc.status === DocStatus.IN_REVIEW);

        return (
          <div
            key={doc.id}
            className="flex items-start gap-3 p-3 rounded-lg border border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
          >
            <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center shrink-0">
              <Icon className="h-5 w-5 text-gray-500" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{doc.file?.originalName || 'Document sans nom'}</p>
                <Badge className={`${status.color} border-0 text-xs`}>{status.label}</Badge>
              </div>
              <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mt-0.5">
                {documentTypeLabels[doc.type] ?? 'Document'}
              </p>
              <p className="text-xs text-gray-500">
                {formatFileSize(doc.file?.size || 0)} • Reçu le {formatDateShort(doc.createdAt)}
              </p>
              {doc.reviewNote && (
                <p className="text-xs text-gray-600 mt-1 bg-gray-50 dark:bg-gray-700/50 rounded p-1.5">{doc.reviewNote}</p>
              )}
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <Button size="sm" variant="ghost" title="Aperçu" onClick={() => handlePreview(doc)}>
                <Eye className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="ghost" title="Télécharger" onClick={() => handleDownload(doc)} disabled={downloadingId === doc.id}>
                {downloadingId === doc.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              </Button>
              {reviewable && (
                <>
                  <Button size="sm" variant="ghost" title="Accepter" className="text-emerald-600" onClick={() => openReview(doc, 'accept')}>
                    <CheckCircle className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="ghost" title="Refuser" className="text-red-600" onClick={() => openReview(doc, 'reject')}>
                    <XCircle className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
          </div>
        );
      })}

      {/* Fenêtre d'aperçu */}
      {previewDoc && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={closePreview}>
          <div
            ref={viewerRef}
            className="bg-white dark:bg-gray-900 rounded-xl overflow-hidden max-w-6xl w-full flex flex-col"
            onClick={(e) => e.stopPropagation()}
            style={{ height: '85vh' }}
          >
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-3 min-w-0">
                <FileText className="w-4 h-4 text-gray-400 shrink-0" />
                <p className="text-sm text-gray-600 dark:text-gray-300 truncate max-w-[200px] sm:max-w-[320px]">
                  {previewDoc.file?.originalName || 'Document sans nom'}
                </p>
                {previewDoc.file && <span className="text-xs text-gray-400 hidden sm:inline">{formatFileSize(previewDoc.file.size)}</span>}
              </div>

              <div className="flex items-center gap-0.5">
                {(isImage || isPDF) && (
                  <>
                    <button type="button" title="Zoom arrière" onClick={() => setZoom((z) => Math.max(MIN_ZOOM, z - ZOOM_STEP))} disabled={zoom <= MIN_ZOOM} className="p-1.5 rounded-md text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-40">
                      <ZoomOut className="w-4 h-4" />
                    </button>
                    <span className="text-xs text-gray-400 w-10 text-center font-mono">{zoom}%</span>
                    <button type="button" title="Zoom avant" onClick={() => setZoom((z) => Math.min(MAX_ZOOM, z + ZOOM_STEP))} disabled={zoom >= MAX_ZOOM} className="p-1.5 rounded-md text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-40">
                      <ZoomIn className="w-4 h-4" />
                    </button>
                  </>
                )}
                {isImage && (
                  <button type="button" title="Pivoter" onClick={() => setRotation((r) => (r + 90) % 360)} className="p-1.5 rounded-md text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800">
                    <RotateCw className="w-4 h-4" />
                  </button>
                )}
                <button type="button" title="Plein écran" onClick={toggleFullscreen} className="p-1.5 rounded-md text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800">
                  {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </button>
                <button type="button" title="Télécharger" onClick={() => handleDownload(previewDoc)} className="p-1.5 rounded-md text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800">
                  <Download className="w-4 h-4" />
                </button>
                <button type="button" title="Fermer" onClick={closePreview} className="p-1.5 rounded-md text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-700">
                  <span className="sr-only">Fermer</span>
                  <span className="text-lg leading-none">×</span>
                </button>
              </div>
            </div>

            <div className="flex-1 relative bg-gray-50 dark:bg-gray-950 flex items-center justify-center overflow-auto">
              {isLoadingPreview ? (
                <div className="text-center">
                  <Loader2 className="w-12 h-12 text-brand-500 animate-spin mx-auto mb-4" />
                  <p className="text-sm text-gray-500">Chargement du document...</p>
                </div>
              ) : previewError ? (
                <div className="text-center p-6">
                  <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                  <p className="text-sm text-gray-600 dark:text-gray-300">{previewError}</p>
                  <Button variant="outline" className="mt-4" onClick={() => handlePreview(previewDoc)}>
                    Réessayer
                  </Button>
                </div>
              ) : (
                <>
                  {renderWatermark()}
                  <div className="w-full h-full flex items-center justify-center p-4">{renderViewer()}</div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Décision sur un document : le motif d'un refus est obligatoire et communiqué à l'usager */}
      {review && (
        <Modal
          isOpen={true}
          onClose={() => !reviewBusy && setReview(null)}
          title={review.mode === 'accept' ? 'Accepter ce document' : 'Refuser ce document'}
          size="md"
        >
          <div className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {review.doc.file?.originalName}
              {review.mode === 'reject' ? ' — l\'usager verra ce motif et pourra redéposer une pièce conforme.' : ''}
            </p>
            <textarea
              value={reviewNote}
              onChange={(e) => {
                setReviewNote(e.target.value);
                setReviewError(null);
              }}
              rows={3}
              maxLength={500}
              placeholder={review.mode === 'accept' ? 'Note (facultative)' : 'Motif du refus (obligatoire)'}
              className="w-full rounded-lg border border-gray-200 bg-white p-3 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
            {reviewError && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-300">{reviewError}</p>}
            <div className="flex justify-end gap-3 border-t border-gray-100 pt-4 dark:border-gray-700">
              <Button variant="ghost" onClick={() => setReview(null)} disabled={reviewBusy}>
                Annuler
              </Button>
              <Button
                onClick={submitReview}
                disabled={reviewBusy}
                className={review.mode === 'accept' ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'bg-red-600 hover:bg-red-700 text-white'}
              >
                {reviewBusy ? 'Enregistrement…' : review.mode === 'accept' ? 'Accepter' : 'Refuser'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default DocumentViewer;
