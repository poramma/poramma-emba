// src/components/communication/CampagnePreview.tsx

import React, { useState } from 'react';
import { 
  Video, File, Maximize2
} from 'lucide-react';
import DOMPurify from 'dompurify';
import { marked } from 'marked'; // npm install marked (si pas déjà présent)
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { CampagneAttachmentType } from '../../types/communication';
import { Campagne } from '../../types/communication';
import { CampagneTypeBadge } from './CampagneTypeBadge';
import { formatDateShort } from '../../lib/date';
import { resolveMediaSrc } from '../../lib/media';

interface CampagnePreviewProps {
  campagne: Pick<Campagne, 'title' | 'content' | 'type' | 'coverImage' | 'attachments'>;
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
  showDate = false,
  createdAt,
  localPreviews,
}) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const images = campagne.attachments?.filter(a => a.type === CampagneAttachmentType.IMAGE) || [];
  const videos = campagne.attachments?.filter(a => a.type === CampagneAttachmentType.VIDEO) || [];
  const documents = campagne.attachments?.filter(a => a.type === CampagneAttachmentType.DOCUMENT) || [];

  const hasMedia = images.length > 0 || videos.length > 0;

  // Le contenu est rédigé en Markdown (cf. CampagneContentStep) — on le
  // convertit en HTML puis on sanitize AVANT de l'injecter, jamais l'inverse
  // (sanitizer du HTML déjà généré depuis du Markdown de confiance ne protège
  // pas contre du Markdown contenant des balises HTML brutes malveillantes).
  const htmlFromMarkdown = marked.parse(campagne.content || '', { async: false }) as string;
  const sanitizedContent = DOMPurify.sanitize(htmlFromMarkdown);

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
        {/* Image de couverture */}
        {campagne.coverImage && (
          <div className="rounded-lg overflow-hidden">
            <img 
              src={resolveMediaSrc(campagne.coverImage, localPreviews)}
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

        {/* Contenu — Markdown converti en HTML puis sanitizé */}
        <div 
          className="prose prose-sm dark:prose-invert max-w-none text-gray-700 dark:text-gray-300"
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
                    src={resolveMediaSrc(images[currentSlide].file, localPreviews)}
                    alt={images[currentSlide]?.caption || ''}
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