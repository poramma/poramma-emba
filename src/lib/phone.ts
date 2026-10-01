// ============================================================
// src/lib/phone.ts — validation et formatage des numéros de téléphone
// ============================================================
//
// L'ambassade du Mali au Maroc traite presque exclusivement des numéros
// marocains ou maliens : on valide ces deux plans de numérotation
// précisément (indicatif + longueur), plutôt qu'une forme générique.
// Miroir de frontend-community/src/lib/phone.ts et de packages/dto (zod,
// backend) — les trois doivent rester synchronisés si la règle change.

// Maroc (+212) : indicatif international +212 OU préfixe national 0, suivi
// de 9 chiffres commençant par 5 (fixe), 6 ou 7 (mobile).
// Ex : +212612345678, 0612345678.
const MOROCCO_RE = /^(?:\+212|0)[5-7]\d{8}$/;

// Mali (+223) : indicatif +223 (facultatif — pas de préfixe national "0" au
// Mali, un numéro s'y compose localement de 8 chiffres), commençant par un
// chiffre de 2 à 9. Ex : +22365123456, 65123456.
const MALI_RE = /^(?:\+223)?[2-9]\d{7}$/;

/** Retire tout sauf les chiffres et un éventuel + initial. */
export function sanitizePhone(raw: string): string {
  const trimmed = raw.trim();
  const plus = trimmed.startsWith('+') ? '+' : '';
  return plus + trimmed.replace(/[^\d]/g, '');
}

/**
 * Formate pendant la saisie : groupes de 2 chiffres ("+212 6 12 34 56 78"),
 * garde le + international s'il est présent. À utiliser dans un onChange,
 * jamais de reformatage destructif du curseur (pas de déplacement forcé).
 */
export function formatPhoneInput(raw: string): string {
  const cleaned = sanitizePhone(raw);
  const plus = cleaned.startsWith('+') ? '+' : '';
  const digits = cleaned.slice(plus.length);
  const grouped = digits.replace(/(\d{2})(?=\d)/g, '$1 ');
  return plus + grouped;
}

/** Vrai si le numéro respecte le format marocain OU malien. */
export function isValidPhone(value: string): boolean {
  const compact = sanitizePhone(value);
  return MOROCCO_RE.test(compact) || MALI_RE.test(compact);
}

/**
 * Message à afficher sous le champ, ou null si valide. Un champ vide n'est
 * une erreur que si `required` — à l'appelant de savoir si le téléphone est
 * obligatoire dans CE formulaire.
 */
export function phoneError(value: string, required = false): string | null {
  const trimmed = value.trim();
  if (!trimmed) return required ? 'Le numéro de téléphone est requis.' : null;
  if (!/^\+?[\d\s()-]+$/.test(trimmed)) {
    return 'Le numéro ne doit contenir que des chiffres (espaces, tirets et + acceptés).';
  }
  if (isValidPhone(trimmed)) return null;
  return 'Numéro invalide : format attendu Maroc (+212 6/7 puis 8 chiffres, ou 06/07…) ou Mali (+223 puis 8 chiffres).';
}
