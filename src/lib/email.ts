// ============================================================
// src/lib/email.ts — validation des adresses email
// ============================================================
//
// Même regex que le type="email" natif des navigateurs (spec WHATWG) :
// assez stricte pour rejeter les fautes de frappe courantes (espace, deux
// @, domaine sans point...) sans tomber dans la validation RFC 5322
// complète, inutilement permissive/complexe pour un formulaire.

const EMAIL_RE =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

export function isValidEmail(value: string): boolean {
  return EMAIL_RE.test(value.trim());
}

/** Message à afficher sous le champ, ou null si valide. */
export function emailError(value: string, required = true): string | null {
  const trimmed = value.trim();
  if (!trimmed) return required ? "L'adresse email est requise." : null;
  if (!EMAIL_RE.test(trimmed)) return "Adresse email invalide.";
  return null;
}
