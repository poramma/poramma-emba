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
 *    création de la campagne, avant tout backend réel) — prioritaire car
 *    c'est la version la plus à jour et la seule disponible avant envoi
 * 2. Chemin stocké (StoredFile.path) — correspond aux fichiers de démo
 *    placés directement dans /public (ex: mock data de communicationStore.ts),
 *    servis à la racine par le serveur de dev/prod
 *
 * Exemple: { path: 'campagnes/2026/07/cover.jpg' } → '/campagnes/2026/07/cover.jpg'
 */
export function resolveMediaSrc(
  file: { path: string; originalName: string; size: number },
  localPreviews?: Record<string, string>
): string {
  if (localPreviews) {
    const key = getPreviewKey(file.originalName, file.size);
    const localUrl = localPreviews[key];
    if (localUrl) return localUrl;
  }
  return `/${file.path}`;
}