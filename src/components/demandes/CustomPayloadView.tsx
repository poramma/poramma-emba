// src/components/demandes/CustomPayloadView.tsx

import React from 'react';

/**
 * Affichage LISIBLE des informations saisies par l'usager dans sa demande
 * (le champ `customPayload`, libre côté catalogue). Un agent n'a pas à lire du
 * JSON : chaque champ devient une ligne « libellé — valeur » (dates formatées,
 * oui/non, listes, blocs imbriqués).
 */

/** Libellés des champs connus ; les autres sont déduits du nom du champ. */
const KEY_LABELS: Record<string, string> = {
  nom: 'Nom complet',
  nomComplet: 'Nom complet',
  fullName: 'Nom complet',
  prenom: 'Prénom',
  prenoms: 'Prénoms',
  firstName: 'Prénom',
  lastName: 'Nom',
  dateNaissance: 'Date de naissance',
  birthDate: 'Date de naissance',
  lieuNaissance: 'Lieu de naissance',
  nationalite: 'Nationalité',
  nationality: 'Nationalité',
  sexe: 'Sexe',
  genre: 'Genre',
  adresse: 'Adresse',
  ville: 'Ville',
  pays: 'Pays',
  telephone: 'Téléphone',
  phone: 'Téléphone',
  email: 'Adresse email',
  profession: 'Profession',
  motif: 'Motif',
  motifDemande: 'Motif de la demande',
  commentaire: "Commentaire de l'usager",
  comment: "Commentaire de l'usager",
  observations: 'Observations',
  numeroPasseport: 'Numéro de passeport',
  numeroPiece: 'Numéro de la pièce',
  dateDelivrance: 'Date de délivrance',
  dateExpiration: "Date d'expiration",
  situationFamiliale: 'Situation familiale',
  nomPere: 'Nom du père',
  nomMere: 'Nom de la mère',
};

/** « dateNaissance » → « Date naissance », « lieu_de_naissance » → « Lieu de naissance ». */
function humanize(key: string): string {
  const spaced = key
    .replace(/[_-]+/g, ' ')
    .replace(/([a-zà-ÿ0-9])([A-Z])/g, '$1 $2')
    .trim()
    .toLowerCase();
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

const labelOf = (key: string) => KEY_LABELS[key] ?? humanize(key);

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const ISO_DATETIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/;

function formatScalar(value: unknown): string {
  if (value === null || value === undefined || value === '') return '—';
  if (typeof value === 'boolean') return value ? 'Oui' : 'Non';
  if (typeof value === 'number') return value.toLocaleString('fr-FR');
  const text = String(value);
  if (ISO_DATE.test(text)) return new Date(`${text}T00:00:00`).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  if (ISO_DATETIME.test(text)) return new Date(text).toLocaleString('fr-FR', { dateStyle: 'long', timeStyle: 'short' });
  return text;
}

const isPlainObject = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);

const Value: React.FC<{ value: unknown; depth?: number }> = ({ value, depth = 0 }) => {
  if (Array.isArray(value)) {
    if (value.length === 0) return <span className="text-gray-400">—</span>;
    return (
      <ul className="list-disc pl-5 space-y-0.5">
        {value.map((item, i) => (
          <li key={i}>
            <Value value={item} depth={depth + 1} />
          </li>
        ))}
      </ul>
    );
  }
  if (isPlainObject(value)) {
    const entries = Object.entries(value);
    if (entries.length === 0) return <span className="text-gray-400">—</span>;
    return (
      <dl className="mt-1 space-y-1 border-l-2 border-gray-100 dark:border-gray-700 pl-3">
        {entries.map(([k, v]) => (
          <div key={k} className="flex flex-col sm:flex-row sm:gap-3">
            <dt className="text-xs text-gray-500 sm:w-40 shrink-0">{labelOf(k)}</dt>
            <dd className="text-sm text-gray-900 dark:text-white">
              <Value value={v} depth={depth + 1} />
            </dd>
          </div>
        ))}
      </dl>
    );
  }
  return <span className="whitespace-pre-wrap break-words">{formatScalar(value)}</span>;
};

export const CustomPayloadView: React.FC<{ data: unknown }> = ({ data }) => {
  if (!isPlainObject(data) || Object.keys(data).length === 0) {
    return <p className="text-sm text-gray-400">Aucune information supplémentaire saisie par l'usager.</p>;
  }

  return (
    <dl className="divide-y divide-gray-100 dark:divide-gray-700 rounded-lg border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800">
      {Object.entries(data).map(([key, value]) => (
        <div key={key} className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:gap-4">
          <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 sm:w-56 shrink-0">{labelOf(key)}</dt>
          <dd className="text-sm text-gray-900 dark:text-white">
            <Value value={value} />
          </dd>
        </div>
      ))}
    </dl>
  );
};

export default CustomPayloadView;
