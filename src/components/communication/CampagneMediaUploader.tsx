// src/components/communication/CampagneMediaUploader.tsx

import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  Upload, X, Image, Video, File, Star, StarOff,
  GripVertical, AlertCircle, Download, Loader2, GalleryHorizontal
} from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { CampagneAttachment, CampagneAttachmentType, UploadCampagneMediaPayload, MAX_BANNER_ITEMS } from '../../types/communication';
import { StoredFile } from '../../types/document';
import { formatFileSize } from '../../lib/date';
import { getPreviewKey, resolveMediaSrc } from '../../lib/media';
import { useAuthenticatedMedia } from '../../hooks/useAuthenticatedMedia';
import { api } from '../../lib/api';

interface CampagneMediaUploaderProps {
  campagneId: string;
  attachments: CampagneAttachment[];
  coverImage: StoredFile | null;
  onUpload: (payload: UploadCampagneMediaPayload) => Promise<void>;
  onSetCover: (attachmentId: string) => void;
  onRemove: (attachmentId: string) => Promise<void>;
  onReorder: (orderedIds: string[]) => Promise<void>;
  /** Ajoute / retire un média du carrousel « bannière ». */
  onToggleBanner?: (attachmentId: string, isBanner: boolean) => Promise<void>;
  uploadProgress?: number;
  isLoading?: boolean;
  /**
   * NOUVEAU — remonte la map des aperçus locaux au composant parent
   * (CampagneWizard), pour que CampagnePreview (utilisé dans une autre étape
   * du wizard) puisse afficher les mêmes images avant qu'un backend réel
   * n'existe.
   */
  onLocalPreviewsChange?: (previews: Record<string, string>) => void;
}

const MAX_ATTACHMENTS = 10;
const MAX_IMAGE_SIZE = 8 * 1024 * 1024; // 8 Mo
const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100 Mo
const MAX_DOCUMENT_SIZE = 15 * 1024 * 1024; // 15 Mo

const ACCEPTED_TYPES = {
  [CampagneAttachmentType.IMAGE]: ['image/jpeg', 'image/png', 'image/webp'],
  [CampagneAttachmentType.VIDEO]: ['video/mp4', 'video/webm'],
  [CampagneAttachmentType.DOCUMENT]: ['application/pdf'],
};

/** Extrait en sous-composant pour pouvoir appeler le hook (règle des hooks — `getThumbnail` est invoqué dans une boucle .map()). */
const AttachmentThumbnail: React.FC<{ src: string | undefined; alt: string }> = ({ src, alt }) => {
  const resolvedSrc = useAuthenticatedMedia(src);
  return <img src={resolvedSrc} alt={alt} className="w-full h-full object-cover" />;
};

export const CampagneMediaUploader: React.FC<CampagneMediaUploaderProps> = ({
  campagneId,
  attachments,
  coverImage,
  onUpload,
  onSetCover,
  onRemove,
  onReorder,
  onToggleBanner,
  uploadProgress = 0,
  isLoading = false,
  onLocalPreviewsChange,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  // Les images / vidéos importées à partir de maintenant rejoignent directement le carrousel bannière.
  const [addToBanner, setAddToBanner] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [uploadingFiles, setUploadingFiles] = useState<Record<string, number>>({});
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Aperçus locaux (blob URLs) — clé: `${originalName}_${size}`, cf. lib/media.ts
  const [previewUrls, setPreviewUrls] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Remonte toute mise à jour des aperçus locaux au parent
  useEffect(() => {
    onLocalPreviewsChange?.(previewUrls);
  }, [previewUrls, onLocalPreviewsChange]);

  // Libère la mémoire des object URLs à la destruction du composant
  useEffect(() => {
    return () => {
      Object.values(previewUrls).forEach(url => URL.revokeObjectURL(url));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getAttachmentType = (file: File): CampagneAttachmentType | null => {
    if (ACCEPTED_TYPES[CampagneAttachmentType.IMAGE].includes(file.type)) {
      return CampagneAttachmentType.IMAGE;
    }
    if (ACCEPTED_TYPES[CampagneAttachmentType.VIDEO].includes(file.type)) {
      return CampagneAttachmentType.VIDEO;
    }
    if (ACCEPTED_TYPES[CampagneAttachmentType.DOCUMENT].includes(file.type)) {
      return CampagneAttachmentType.DOCUMENT;
    }
    return null;
  };

  const validateFile = (file: File): { valid: boolean; error?: string } => {
    const type = getAttachmentType(file);
    if (!type) {
      return { valid: false, error: 'Format de fichier non supporté. Utilisez JPG, PNG, WEBP, MP4, WEBM ou PDF.' };
    }

    switch (type) {
      case CampagneAttachmentType.IMAGE:
        if (file.size > MAX_IMAGE_SIZE) {
          return { valid: false, error: `L'image dépasse la taille maximale de ${formatFileSize(MAX_IMAGE_SIZE)}.` };
        }
        break;
      case CampagneAttachmentType.VIDEO:
        if (file.size > MAX_VIDEO_SIZE) {
          return { valid: false, error: `La vidéo dépasse la taille maximale de ${formatFileSize(MAX_VIDEO_SIZE)}.` };
        }
        break;
      case CampagneAttachmentType.DOCUMENT:
        if (file.size > MAX_DOCUMENT_SIZE) {
          return { valid: false, error: `Le document dépasse la taille maximale de ${formatFileSize(MAX_DOCUMENT_SIZE)}.` };
        }
        break;
    }

    return { valid: true };
  };

  const handleFiles = async (files: FileList) => {
    setError(null);
    const fileArray = Array.from(files);

    if (attachments.length + fileArray.length > MAX_ATTACHMENTS) {
      setError(`Limite de ${MAX_ATTACHMENTS} pièces jointes atteinte.`);
      return;
    }

    const validFiles = fileArray.filter(file => {
      const result = validateFile(file);
      if (!result.valid) {
        setError(result.error || 'Fichier invalide');
        return false;
      }
      return true;
    });

    let bannerCount = attachments.filter(a => a.isBanner).length;
    let bannerFull = false;

    for (const file of validFiles) {
      const type = getAttachmentType(file);
      if (!type) continue;

      // Aperçu local immédiat, avant même la fin de l'upload — visible tout
      // de suite dans la galerie ET réutilisable ensuite dans CampagnePreview
      // (les vidéos aussi : l'URL locale ne copie pas le fichier en mémoire).
      if (type === CampagneAttachmentType.IMAGE || type === CampagneAttachmentType.VIDEO) {
        const key = getPreviewKey(file.name, file.size);
        const objectUrl = URL.createObjectURL(file);
        setPreviewUrls(prev => ({ ...prev, [key]: objectUrl }));
      }

      // Bannière : images et vidéos seulement, dans la limite du carrousel.
      const wantsBanner = addToBanner && type !== CampagneAttachmentType.DOCUMENT;
      const asBanner = wantsBanner && bannerCount < MAX_BANNER_ITEMS;
      if (wantsBanner && !asBanner) bannerFull = true;
      if (asBanner) bannerCount += 1;

      setUploadingFiles(prev => ({ ...prev, [file.name]: 0 }));

      try {
        await onUpload({ file, type, isBanner: asBanner });
        setUploadingFiles(prev => {
          const newState = { ...prev };
          delete newState[file.name];
          return newState;
        });
      } catch (err) {
        setError(`Erreur lors de l'upload de ${file.name}`);
        setUploadingFiles(prev => {
          const newState = { ...prev };
          delete newState[file.name];
          return newState;
        });
      }
    }

    if (bannerFull) setError(`Le carrousel bannière est limité à ${MAX_BANNER_ITEMS} médias : les suivants ont été ajoutés sans bannière.`);
  };

  const handleToggleBanner = async (attachment: CampagneAttachment) => {
    if (!onToggleBanner) return;
    const next = !attachment.isBanner;
    if (next && attachments.filter(a => a.isBanner).length >= MAX_BANNER_ITEMS) {
      setError(`Le carrousel bannière est limité à ${MAX_BANNER_ITEMS} médias.`);
      return;
    }
    setError(null);
    setTogglingId(attachment.id);
    try {
      await onToggleBanner(attachment.id, next);
    } catch {
      setError('Impossible de modifier la bannière pour le moment.');
    } finally {
      setTogglingId(null);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      handleFiles(e.dataTransfer.files);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDownload = async (attachment: CampagneAttachment) => {
    // Route inexistante auparavant (`/api/campagnes/.../download`) et de
    // toute façon window.open() ne porte pas l'en-tête Authorization requis
    // par l'API — on passe par un fetch authentifié puis un lien blob.
    const { data } = await api.get(`/communication/campagnes/${campagneId}/files/${attachment.file.id}`, {
      responseType: 'blob',
    });
    const url = URL.createObjectURL(data);
    const link = document.createElement('a');
    link.href = url;
    link.download = attachment.file.originalName;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleRemove = async (attachmentId: string) => {
    setRemovingId(attachmentId);
    try {
      await onRemove(attachmentId);
    } finally {
      setRemovingId(null);
    }
  };

  const handleReorder = (fromIndex: number, toIndex: number) => {
    const newAttachments = [...attachments];
    const [moved] = newAttachments.splice(fromIndex, 1);
    newAttachments.splice(toIndex, 0, moved);
    onReorder(newAttachments.map(a => a.id));
  };

  const getThumbnail = (attachment: CampagneAttachment) => {
    if (attachment.type === CampagneAttachmentType.IMAGE) {
      return (
        <AttachmentThumbnail
          src={resolveMediaSrc(campagneId, attachment.file, previewUrls)}
          alt={attachment.file.originalName}
        />
      );
    }
    if (attachment.type === CampagneAttachmentType.VIDEO) {
      return (
        <div className="w-full h-full flex items-center justify-center bg-gray-900 text-white">
          <Video className="w-8 h-8" />
          <span className="text-xs mt-1">Vidéo</span>
        </div>
      );
    }
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-700">
        <File className="w-8 h-8 text-gray-400" />
      </div>
    );
  };

  const isCoverImage = (attachment: CampagneAttachment) => {
    return coverImage && coverImage.id === attachment.fileId;
  };

  return (
    <div className="space-y-4">
      {/* Zone de dépôt */}
      <div
        className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          isDragging 
            ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20' 
            : 'border-gray-300 dark:border-gray-600'
        } ${error ? 'border-red-500' : ''}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <input
          aria-label="Charger un fichier"
          ref={fileInputRef}
          type="file"
          className="hidden"
          multiple
          accept={Object.values(ACCEPTED_TYPES).flat().join(',')}
          onChange={(e) => {
            if (e.target.files) handleFiles(e.target.files);
            e.target.value = '';
          }}
        />

        <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600 dark:text-gray-300">
          Glissez-déposez vos fichiers ici, ou
        </p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => fileInputRef.current?.click()}
          disabled={isLoading}
        >
          Parcourir
        </Button>
        <p className="text-xs text-gray-400 mt-2">
          Images: JPG, PNG, WEBP (max 8 Mo) • Vidéos: MP4, WEBM (max 100 Mo) • Documents: PDF (max 15 Mo)
        </p>
        <p className="text-xs text-gray-400">
          Limite: {MAX_ATTACHMENTS} fichiers par campagne ({attachments.length} utilisé{attachments.length > 1 ? 's' : ''})
        </p>

        {onToggleBanner && (
          <label className="mx-auto mt-4 flex w-fit cursor-pointer items-center gap-2 rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-700 dark:bg-gray-800 dark:text-gray-300">
            <input type="checkbox" checked={addToBanner} onChange={(e) => setAddToBanner(e.target.checked)} />
            <GalleryHorizontal className="h-4 w-4 text-brand-500" />
            Afficher les images et vidéos importées dans la bannière
          </label>
        )}

        {error && (
          <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg text-red-700 dark:text-red-300 text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}

        {attachments.length >= MAX_ATTACHMENTS && (
          <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg text-yellow-700 dark:text-yellow-300 text-sm">
            <AlertCircle className="w-4 h-4 inline mr-1" />
            Limite de {MAX_ATTACHMENTS} pièces jointes atteinte.
          </div>
        )}
      </div>

      {/* Barre de progression globale */}
      {Object.keys(uploadingFiles).length > 0 && (
        <div className="space-y-2">
          <p className="text-sm text-gray-500">Téléversement en cours...</p>
          <Progress value={uploadProgress} className="h-2" />
        </div>
      )}

      {/* Galerie */}
      {attachments.length > 0 && (
        <div>
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Pièces jointes ({attachments.length})
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {attachments.map((attachment, index) => (
              <div
                key={attachment.id}
                className={`relative group border rounded-lg overflow-hidden ${
                  isCoverImage(attachment) ? 'ring-2 ring-brand-500' : 'border-gray-200 dark:border-gray-700'
                }`}
                draggable
                onDragStart={() => setDragIndex(index)}
                onDragOver={(e) => {
                  e.preventDefault();
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  if (dragIndex !== null && dragIndex !== index) {
                    handleReorder(dragIndex, index);
                    setDragIndex(null);
                  }
                }}
                onDragEnd={() => setDragIndex(null)}
              >
                <div className="aspect-square bg-gray-100 dark:bg-gray-800">
                  {getThumbnail(attachment)}
                </div>

                {/* Badge de couverture */}
                {isCoverImage(attachment) && (
                  <Badge
                    color="primary"
                    variant="solid"
                    size="xs"
                    className="absolute top-2 left-2"
                  >
                    <Star className="w-3 h-3 mr-1" />
                    Couverture
                  </Badge>
                )}

                {/* Actions */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  {attachment.type === CampagneAttachmentType.IMAGE && (
                    <Button
                      size="xs"
                      variant={isCoverImage(attachment) ? 'primary' : 'outline'}
                      className="text-white border-white hover:bg-white/20"
                      onClick={() => onSetCover(attachment.id)}
                    >
                      {isCoverImage(attachment) ? (
                        <StarOff className="w-4 h-4" />
                      ) : (
                        <Star className="w-4 h-4" />
                      )}
                    </Button>
                  )}
                  <Button
                    size="xs"
                    variant="outline"
                    className="text-white border-white hover:bg-white/20"
                    onClick={() => handleDownload(attachment)}
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                  <Button
                    size="xs"
                    variant="outline"
                    className="text-white border-white hover:bg-red-500/40"
                    onClick={() => handleRemove(attachment.id)}
                    disabled={removingId === attachment.id}
                  >
                    {removingId === attachment.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <X className="w-4 h-4" />
                    )}
                  </Button>
                </div>

                {/* Handle pour le drag */}
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab">
                  <GripVertical className="w-4 h-4 text-white drop-shadow-md" />
                </div>

                {/* Bannière : simple case à cocher, à côté du média (images et vidéos) */}
                {onToggleBanner && attachment.type !== CampagneAttachmentType.DOCUMENT && (
                  <label
                    className="flex cursor-pointer items-center gap-2 border-t border-gray-200 bg-white px-2 py-1.5 text-xs text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {togglingId === attachment.id ? (
                      <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                    ) : (
                      <input
                        type="checkbox"
                        checked={attachment.isBanner}
                        onChange={() => handleToggleBanner(attachment)}
                        className="h-4 w-4 rounded border-gray-300 accent-brand-600"
                      />
                    )}
                    <span>Bannière</span>
                  </label>
                )}

                {/* Légende */}
                {attachment.caption && (
                  <div className="p-1 text-xs text-gray-500 truncate">
                    {attachment.caption}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CampagneMediaUploader;