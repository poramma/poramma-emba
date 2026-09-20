// src/lib/media.ts

/**
 * Génère une clé stable pour associer un aperçu local (URL.createObjectURL)
 * à une pièce jointe mockée, avant que celle-ci ait un id réel côté "backend".
 * Basée sur nom + taille du fichier plutôt que sur l'id, qui n'existe pas
 * encore au moment où le fichier local est disponible pour l'aperçu.
 */
export function getPreviewKey(name: string, size: number): string {
  return `${name}_${size}`;
}

/**
 * Détermine la source d'affichage d'un média, dans cet ordre de priorité :
 *
 * 1. Aperçu local (fichier tout juste sélectionné/uploadé pendant la
 *    création de la campagne, avant tout backend réel) — une URL `blob:`,
 *    affichable directement dans un <img>, prioritaire car c'est la version
 *    la plus à jour.
 * 2. Route API authentifiée `/communication/campagnes/:id/files/:fileId` —
 *    MinIO n'est joignable que depuis le réseau Docker (voir
 *    packages/storage), le navigateur ne peut donc pas charger `file.path`
 *    directement ; le chemin retourné ici doit passer par
 *    useAuthenticatedMedia() pour être transformé en blob affichable.
 */
export function resolveMediaSrc(
  campagneId: string | undefined,
  file: { id: string; path: string; originalName: string; size: number },
  localPreviews?: Record<string, string>
): string | undefined {
  if (localPreviews) {
    const key = getPreviewKey(file.originalName, file.size);
    const localUrl = localPreviews[key];
    if (localUrl) return localUrl;
  }
  if (!campagneId) return undefined;
  return `/communication/campagnes/${campagneId}/files/${file.id}`;
}
