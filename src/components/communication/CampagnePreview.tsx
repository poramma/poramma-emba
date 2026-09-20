// src/components/communication/CampagnePreview.tsx

import React, { useState } from 'react';
import { 
  Video, File, Maximize2
} from 'lucide-react';
import { toEditorHtml } from '../../lib/campaignHtml';
import '../ui/rich-text/rich-content.css';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { CampagneAttachmentType } from '../../types/communication';
import { Campagne } from '../../types/communication';
import { CampagneTypeBadge } from './CampagneTypeBadge';
import { BannerCarousel } from './BannerCarousel';
import { formatDateShort } from '../../lib/date';
import { resolveMediaSrc } from '../../lib/media';
import { useAuthenticatedMedia } from '../../hooks/useAuthenticatedMedia';

interface CampagnePreviewProps {
  campagne: Pick<Campagne, 'title' | 'content' | 'type' | 'coverImage' | 'attachments'>;
  /** Requis pour charger les médias déjà enregistrés côté backend (voir lib/media.ts). Absent tant que la campagne n'a pas encore été créée dans l'assistant. */
  campagneId?: string;
  showDate?: boolean;
  createdAt?: string;
  /**
   * NOUVEAU — aperçus locaux (URL.createObjectURL) générés pendant l'étape
   * d'upload de la création de campagne, avant que les fichiers n'aient un
   * chemin réel côté backend. Clé: `${originalName}_${size}` (cf. lib/media.ts).
   * Absent/vide lors de la consultation d'une campagne déjà existante (mock
   * ou réelle) — dans ce cas, resolveMediaSrc retombe sur file.path.
   */
  localPreviews?: Record<string, string>;
}

export const CampagnePreview: React.FC<CampagnePreviewProps> = ({
  campagne,
  campagneId,
  showDate = false,
  createdAt,
  localPreviews,
}) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Les médias marqués « bannière » défilent entre le titre et le contenu ; les autres restent en galerie sous le texte.
  const banner = campagne.attachments?.filter(a => a.isBanner && a.type !== CampagneAttachmentType.DOCUMENT) || [];
  const gallery = campagne.attachments?.filter(a => !banner.includes(a)) || [];
  const images = gallery.filter(a => a.type === CampagneAttachmentType.IMAGE);
  const videos = gallery.filter(a => a.type === CampagneAttachmentType.VIDEO);
  const documents = gallery.filter(a => a.type === CampagneAttachmentType.DOCUMENT);

  const hasMedia = images.length > 0 || videos.length > 0;

  const coverImageSrc = useAuthenticatedMedia(
    campagne.coverImage ? resolveMediaSrc(campagneId, campagne.coverImage, localPreviews) : undefined
  );
  const currentImage = images[currentSlide];
  const currentImageSrc = useAuthenticatedMedia(
    currentImage ? resolveMediaSrc(campagneId, currentImage.file, localPreviews) : undefined
  );

  // Le contenu est du HTML mis en forme par l'éditeur visuel (cf. CampagneContentStep) ; les
  // anciennes campagnes en Markdown / texte brut sont converties. Dans tous les cas le HTML
  // passe par la liste blanche stricte AVANT d'être injecté.
  const sanitizedContent = toEditorHtml(campagne.content);

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-lg max-w-[400px] mx-auto ${
      isFullscreen ? 'fixed inset-4 z-50 max-w-none' : ''
    }`}>
      {/* En-tête style mobile */}
      <div className="bg-gray-100 dark:bg-gray-700 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500"></div>
          <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400 font-mono">
          {showDate && createdAt ? formatDateShort(createdAt) : 'Aperçu'}
        </div>
        <Button
          size="xs"
          variant="ghost"
          onClick={() => setIsFullscreen(!isFullscreen)}
        >
          <Maximize2 className="w-3 h-3" />
        </Button>
      </div>

      <div className="p-4 space-y-4">
        {/* Image de couverture (remplacée par la bannière quand il y en a une) */}
        {campagne.coverImage && banner.length === 0 && (
          <div className="rounded-lg overflow-hidden">
            <img
              src={coverImageSrc}
              alt={campagne.title}
              className="w-full h-48 object-cover"
            />
          </div>
        )}

        {/* Badge type */}
        <div>
          <CampagneTypeBadge type={campagne.type} />
        </div>

        {/* Titre */}
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          {campagne.title}
        </h3>

        {/* Bannière : carrousel d'images et/ou de vidéos, entre le titre et le contenu */}
        <BannerCarousel campagneId={campagneId} items={banner} localPreviews={localPreviews} />

        {/* Contenu — HTML mis en forme par l'éditeur, nettoyé (liste blanche) */}
        <div
          className="rich-content text-gray-700 dark:text-gray-300"
          dangerouslySetInnerHTML={{ __html: sanitizedContent }}
        />

        {/* Galerie média */}
        {hasMedia && (
          <div className="space-y-3">
            <p className="text-xs font-medium text-gray-500 uppercase">Médias</p>
            
            {/* Images */}
            {images.length > 0 && (
              <div className="relative">
                <div className="aspect-video bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
                  <img
                    src={currentImageSrc}
                    alt={currentImage?.caption || ''}
                    className="w-full h-full object-contain"
                  />
                </div>
                {images.length > 1 && (
                  <div className="absolute inset-x-0 bottom-2 flex justify-center gap-1">
                    {images.map((_, i) => (
                      <button
                        aria-label={`Voir l'image ${i + 1}`}
                        key={i}
                        className={`w-2 h-2 rounded-full transition-colors ${
                          i === currentSlide ? 'bg-brand-500' : 'bg-gray-400'
                        }`}
                        onClick={() => setCurrentSlide(i)}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Vidéos */}
            {videos.length > 0 && (
              <div className="space-y-2">
                {videos.map((video) => (
                  <div key={video.id} className="aspect-video bg-gray-900 rounded-lg overflow-hidden flex items-center justify-center">
                    <div className="text-center text-white">
                      <Video className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p className="text-xs text-gray-400">Vidéo</p>
                      <p className="text-xs text-gray-500">{video.file.originalName}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Documents */}
            {documents.length > 0 && (
              <div className="space-y-1">
                {documents.map((doc) => (
                  <div key={doc.id} className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <File className="w-4 h-4 text-red-500" />
                    <span className="text-sm text-gray-600 dark:text-gray-300 truncate">
                      {doc.file.originalName}
                    </span>
                    <Badge color="gray" variant="light" size="xs" className="ml-auto">
                      PDF
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Pied */}
      <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-2 text-xs text-gray-400 text-center">
        Aperçu de la campagne
      </div>
    </div>
  );
};

export default CampagnePreview;