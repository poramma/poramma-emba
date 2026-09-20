// src/hooks/useAuthenticatedMedia.ts

import { useEffect, useState } from 'react';
import { api } from '../lib/api';

/**
 * Affiche un média servi par une route API authentifiée (Authorization:
 * Bearer requis — un <img src="..."> brut ne peut pas porter ce header).
 * Télécharge le fichier en blob puis retourne une URL affichable.
 *
 * Si `src` est déjà utilisable tel quel (aperçu local `blob:`/`data:`, ou
 * absent), il est retourné sans requête réseau.
 */
export function useAuthenticatedMedia(src: string | undefined): string | undefined {
  const [objectUrl, setObjectUrl] = useState<string | undefined>();

  useEffect(() => {
    if (!src || src.startsWith('blob:') || src.startsWith('data:')) {
      setObjectUrl(src);
      return;
    }

    let cancelled = false;
    let createdUrl: string | undefined;

    api
      .get(src, { responseType: 'blob' })
      .then(({ data }) => {
        if (cancelled) return;
        createdUrl = URL.createObjectURL(data);
        setObjectUrl(createdUrl);
      })
      .catch(() => {
        if (!cancelled) setObjectUrl(undefined);
      });

    return () => {
      cancelled = true;
      if (createdUrl) URL.revokeObjectURL(createdUrl);
    };
  }, [src]);

  return objectUrl;
}
