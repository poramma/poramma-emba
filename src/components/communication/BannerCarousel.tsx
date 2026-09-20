// src/components/communication/BannerCarousel.tsx
//
// Aperçu (backoffice) du carrousel « bannière » affiché entre le titre et le contenu de l'annonce
// dans le portail de la communauté : images et/ou vidéos, une à la fois, avec flèches et pastilles.

import React, { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Video } from 'lucide-react';
import { CampagneAttachment, CampagneAttachmentType } from '../../types/communication';
import { resolveMediaSrc } from '../../lib/media';
import { useAuthenticatedMedia } from '../../hooks/useAuthenticatedMedia';

interface BannerCarouselProps {
  campagneId?: string;
  items: CampagneAttachment[];
  localPreviews?: Record<string, string>;
  className?: string;
}

const ImageSlide: React.FC<{ src: string | undefined; alt: string }> = ({ src, alt }) => {
  const resolved = useAuthenticatedMedia(src);
  return <img src={resolved} alt={alt} className="h-full w-full object-cover" />;
};

const Slide: React.FC<{ item: CampagneAttachment; campagneId?: string; localPreviews?: Record<string, string> }> = ({ item, campagneId, localPreviews }) => {
  const src = resolveMediaSrc(campagneId, item.file, localPreviews);
  if (item.type === CampagneAttachmentType.IMAGE) return <ImageSlide src={src} alt={item.caption || item.file.originalName} />;

  // Vidéo : lisible tout de suite quand le fichier vient d'être choisi (aperçu local) ; sinon la vidéo
  // est servie authentifiée et très volumineuse — on montre un repère plutôt que de la charger en mémoire.
  if (src?.startsWith('blob:')) return <video src={src} controls preload="metadata" className="h-full w-full bg-black object-contain" />;
  return (
    <div className="flex h-full w-full flex-col items-center justify-center bg-gray-900 text-white">
      <Video className="mb-1 h-9 w-9 opacity-60" />
      <p className="text-xs opacity-70">Vidéo</p>
      <p className="max-w-[80%] truncate text-[11px] opacity-50">{item.file.originalName}</p>
    </div>
  );
};

export const BannerCarousel: React.FC<BannerCarouselProps> = ({ campagneId, items, localPreviews, className = '' }) => {
  const [index, setIndex] = useState(0);

  // Une suppression peut laisser l'index hors limites.
  useEffect(() => {
    if (index >= items.length) setIndex(Math.max(0, items.length - 1));
  }, [items.length, index]);

  if (items.length === 0) return null;
  const current = items[Math.min(index, items.length - 1)];
  const many = items.length > 1;
  const go = (delta: number) => setIndex((i) => (i + delta + items.length) % items.length);

  return (
    <div className={`relative aspect-video w-full overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-700 ${className}`}>
      <Slide key={current.id} item={current} campagneId={campagneId} localPreviews={localPreviews} />

      {many && (
        <>
          <button type="button" aria-label="Média précédent" onClick={() => go(-1)} className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/40 p-1.5 text-white hover:bg-black/60">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button type="button" aria-label="Média suivant" onClick={() => go(1)} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/40 p-1.5 text-white hover:bg-black/60">
            <ChevronRight className="h-4 w-4" />
          </button>
          <div className="absolute inset-x-0 bottom-2 flex justify-center gap-1.5">
            {items.map((it, i) => (
              <button
                key={it.id}
                type="button"
                aria-label={`Voir le média ${i + 1}`}
                onClick={() => setIndex(i)}
                className={`h-2 w-2 rounded-full transition-colors ${i === index ? 'bg-white' : 'bg-white/50'}`}
              />
            ))}
          </div>
        </>
      )}
      {current.caption && <p className="absolute inset-x-0 bottom-6 truncate bg-black/40 px-3 py-1 text-center text-xs text-white">{current.caption}</p>}
    </div>
  );
};

export default BannerCarousel;
