// src/lib/whatsapp.ts
//
// Contact WhatsApp d'un usager depuis le backoffice. Aucune passerelle
// « WhatsApp Business » n'est branchée : le lien wa.me ouvre la conversation
// avec un message PRÉ-REMPLI que l'agent relit puis envoie lui-même — l'envoi
// est donc toujours manuel, mais le texte est généré selon le contexte.

const MOROCCO = '212';

/**
 * Numéro au format international sans « + » (ex. 2126XXXXXXXX), ou `null` si
 * inexploitable. Les usagers sont majoritairement au Maroc : un numéro local
 * (06…/07… ou 9 chiffres commençant par 6/7) est complété par l'indicatif 212 ;
 * un numéro déjà en +XXX / 00XXX est conservé tel quel (ex. +223 Mali).
 */
export function normalizePhone(raw?: string | null): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  let digits = trimmed.replace(/\D/g, '');
  if (!digits) return null;

  if (trimmed.startsWith('+')) {
    // déjà international
  } else if (digits.startsWith('00')) {
    digits = digits.slice(2);
  } else if (digits.startsWith('0') && digits.length === 10) {
    digits = MOROCCO + digits.slice(1);
  } else if (digits.length === 9 && /^[567]/.test(digits)) {
    digits = MOROCCO + digits;
  }
  return digits.length >= 9 && digits.length <= 15 ? digits : null;
}

export function buildWhatsAppUrl(phone?: string | null, message?: string): string | null {
  const number = normalizePhone(phone);
  if (!number) return null;
  return `https://wa.me/${number}${message ? `?text=${encodeURIComponent(message)}` : ''}`;
}

const SIGNATURE = "Ambassade du Mali au Maroc — Services consulaires";

const firstNameOf = (name?: string | null) => (name?.trim().split(/\s+/)[0] ?? '').trim();
const greeting = (name?: string | null) => (firstNameOf(name) ? `Bonjour ${firstNameOf(name)},` : 'Bonjour,');

const DEMANDE_STATUS_TEXT: Record<string, string> = {
  SUBMITTED: 'a bien été reçue et sera examinée prochainement.',
  IN_REVIEW: "est en cours d'examen par nos services.",
  UNDER_VERIFICATION: 'est en cours de vérification.',
  ADDITIONAL_INFO_REQUIRED: "nécessite un complément d'information. Merci de vous connecter à votre espace pour consulter notre demande et y répondre.",
  APPROVED: 'a été approuvée. Son traitement se poursuit.',
  COMPLETED: "est terminée. Vous pouvez vous rendre à l'ambassade pour la finaliser si nécessaire.",
  REJECTED: "n'a pas pu être acceptée. Le motif est consultable dans votre espace.",
  CANCELLED: 'a été annulée.',
};

/** Message type pour une demande, selon son statut actuel. */
export function demandeMessage(params: { name?: string | null; dossierNumber: string; serviceName?: string | null; status: string }): string {
  const what = params.serviceName ? `${params.dossierNumber} (${params.serviceName})` : params.dossierNumber;
  const state = DEMANDE_STATUS_TEXT[params.status] ?? 'est en cours de traitement.';
  return `${greeting(params.name)}\n\nConcernant votre demande ${what} : elle ${state}\n\n${SIGNATURE}`;
}

/** Message type pour un rendez-vous (rappel). */
export function rendezVousMessage(params: { name?: string | null; ticketId: string; serviceName?: string | null; date: string; time: string }): string {
  const day = new Date(`${params.date}T00:00:00`).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  return (
    `${greeting(params.name)}\n\nRappel de votre rendez-vous ${params.ticketId}${params.serviceName ? ` (${params.serviceName})` : ''} ` +
    `le ${day} à ${params.time} à l'ambassade. Merci de vous présenter avec votre pièce d'identité.\n\n${SIGNATURE}`
  );
}

/** Message libre de départ (dossier d'enregistrement, contact général). */
export function genericMessage(name?: string | null): string {
  return `${greeting(name)}\n\n\n\n${SIGNATURE}`;
}
