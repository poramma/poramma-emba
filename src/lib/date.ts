// ============================================================
// src/lib/date.ts
// ============================================================

/**
 * UTILITAIRES DE DATE
 * 
 * - Formatage des dates
 * - Calcul des jours ouvrés
 * - Vérification des jours fériés (Maroc + Mali)
 * - Calcul des SLA (délais de traitement)
 * - Gestion des fuseaux horaires
 */

import { JOURS_FERIES } from '../config/services-consulaires';

// ============================================================
// CONSTANTES
// ============================================================

export const JOURS_OUVRES = [1, 2, 3, 4, 5]; // Lundi à Vendredi
export const WEEKEND = [6, 7]; // Samedi, Dimanche

// Fuseau horaire de l'ambassade
export const TIMEZONE_AMBASSADE = 'Africa/Casablanca';

// ============================================================
// FORMATAGE
// ============================================================

/**
 * Formate une taille de fichier en unités lisibles (B, KB, MB, GB, TB)
 * Exemple: 2457600 → "2.3 MB"
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const size = bytes / Math.pow(k, i);
  
  return `${size.toFixed(1)} ${units[i]}`;
}

/**
 * Formate une date en format français
 */
export function formatDateFR(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Formate une date courte (JJ/MM/AAAA)
 */
export function formatDateShort(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(d.getTime())) {
    return '--/--/----';
  }
  
  return d.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

/**
 * Formate une date au format local compact (ex: "17 sept. 2026")
 * À utiliser quand l'espace le permet, en alternative à formatDateShort.
 */
export function formatDateMedium(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;

  if (isNaN(d.getTime())) {
    return '--';
  }

  return d.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Calcule le temps écoulé depuis une date (time ago)
 */
export function timeAgo(date: string | Date): string {
  const now = new Date();
  const past = typeof date === 'string' ? new Date(date) : date;
  const diffMs = now.getTime() - past.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  const diffMonth = Math.floor(diffDay / 30);
  const diffYear = Math.floor(diffMonth / 12);

  if (diffSec < 60) {
    return 'à l\'instant';
  } else if (diffMin < 60) {
    return `il y a ${diffMin} min${diffMin > 1 ? 's' : ''}`;
  } else if (diffHour < 24) {
    return `il y a ${diffHour} h${diffHour > 1 ? 's' : ''}`;
  } else if (diffDay < 30) {
    return `il y a ${diffDay} j${diffDay > 1 ? 's' : ''}`;
  } else if (diffMonth < 12) {
    return `il y a ${diffMonth} mois`;
  } else {
    return `il y a ${diffYear} an${diffYear > 1 ? 's' : ''}`;
  }
}


/**
 * Formate une heure (HH:mm)
 * Accepte soit un objet Date, soit une chaîne "HH:mm"
 */
export function formatTime(date: Date | string): string {
  // Si c'est déjà une chaîne "HH:mm" ou "HH:mm:ss" (colonnes `time` de
  // Postgres, ex: "12:00:00"), extraire directement "HH:mm".
  if (typeof date === 'string' && /^\d{2}:\d{2}(:\d{2})?$/.test(date)) {
    return date.slice(0, 5);
  }
  
  // Si c'est une chaîne ISO, la convertir en Date
  const d = typeof date === 'string' ? new Date(date) : date;
  
  // Vérifier que la date est valide
  if (isNaN(d.getTime())) {
    return '--:--';
  }
  
  return d.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}


/**
 * Formate une date et heure complète
 */
export function formatDateTime(date: Date | string): string {
  return `${formatDateShort(date)} ${formatTime(date)}`;
}

// ============================================================
// COMPARAISONS
// ============================================================

/**
 * Vérifie si une date est aujourd'hui
 */
export function isToday(date: Date | string): boolean {
  const d = typeof date === 'string' ? new Date(date) : date;
  const today = new Date();
  return d.getFullYear() === today.getFullYear() &&
         d.getMonth() === today.getMonth() &&
         d.getDate() === today.getDate();
}

/**
 * Vérifie si deux dates sont le même jour
 */
export function isSameDay(date1: Date | string, date2: Date | string): boolean {
  const d1 = typeof date1 === 'string' ? new Date(date1) : date1;
  const d2 = typeof date2 === 'string' ? new Date(date2) : date2;
  return d1.getFullYear() === d2.getFullYear() &&
         d1.getMonth() === d2.getMonth() &&
         d1.getDate() === d2.getDate();
}


// ============================================================
// JOURS FÉRIÉS
// ============================================================

/**
 * Vérifie si une date est un jour férié
 * Vérifie à la fois les fériés fixes (MM-DD) et les variables (Aïd, etc.)
 */
export function isJourFerie(date: Date | string): { isFerie: boolean; name?: string } {
  const d = typeof date === 'string' ? new Date(date) : date;
  const monthDay = `${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  
  // Vérifier les fériés fixes
  const ferieFixe = JOURS_FERIES.find((jf) => jf.date === monthDay);
  if (ferieFixe) {
    return { isFerie: true, name: `${ferieFixe.name} (${ferieFixe.pays})` };
  }
  
  // TODO: Ajouter les fériés variables (Aïd el-Fitr, Aïd el-Adha, Mawlid...)
  // Ces dates sont calculées selon le calendrier islamique
  
  return { isFerie: false };
}

/**
 * Liste tous les jours fériés d'une année
 */
export function getJoursFeriesAnnee(annee: number): Array<{ date: string; name: string }> {
  const result: Array<{ date: string; name: string }> = [];
  
  JOURS_FERIES.forEach((jf) => {
    const [month, day] = jf.date.split('-');
    result.push({
      date: `${annee}-${month}-${day}`,
      name: `${jf.name} (${jf.pays})`,
    });
  });
  
  // TODO: Ajouter les fériés variables islamiques pour l'année donnée
  return result.sort((a, b) => a.date.localeCompare(b.date));
}

// ============================================================
// JOURS OUVRÉS
// ============================================================

/**
 * Vérifie si une date est un jour ouvré
 * (pas weekend, pas férié)
 */
export function isJourOuvre(date: Date | string): boolean {
  const d = typeof date === 'string' ? new Date(date) : date;
  const dayOfWeek = d.getDay() || 7; // 1=Lundi, 7=Dimanche
  
  // Vérifier weekend
  if (WEEKEND.includes(dayOfWeek)) return false;
  
  // Vérifier férié
  if (isJourFerie(d).isFerie) return false;
  
  return true;
}

/**
 * Compte le nombre de jours ouvrés entre deux dates
 */
export function compterJoursOuvres(debut: Date | string, fin: Date | string): number {
  const dStart = typeof debut === 'string' ? new Date(debut) : debut;
  const dEnd = typeof fin === 'string' ? new Date(fin) : fin;
  
  let count = 0;
  const current = new Date(dStart);
  
  while (current <= dEnd) {
    if (isJourOuvre(current)) {
      count++;
    }
    current.setDate(current.getDate() + 1);
  }
  
  return count;
}

/**
 * Ajoute N jours ouvrés à une date
 * Utilisé pour calculer les deadlines SLA
 */
export function ajouterJoursOuvres(date: Date | string, jours: number): Date {
  const d = typeof date === 'string' ? new Date(date) : new Date(date);
  let ajoutes = 0;
  
  while (ajoutes < jours) {
    d.setDate(d.getDate() + 1);
    if (isJourOuvre(d)) {
      ajoutes++;
    }
  }
  
  return d;
}

// ============================================================
// SLA (DÉLAIS DE TRAITEMENT)
// ============================================================

/**
 * Calcule la date butoir (deadline) pour un SLA donné
 * 
 * Backend: Le SLA est stocké en jours ouvrés pour chaque sous-service
 * Ex: "Attestation scolarité" = 2 jours ouvrés
 */
export function calculerDeadlineSLA(
  dateSoumission: Date | string,
  slaJours: number
): Date {
  return ajouterJoursOuvres(dateSoumission, slaJours);
}

/**
 * Vérifie si un SLA est respecté
 */
export function isSLARespecte(
  dateSoumission: Date | string,
  dateTraitement: Date | string,
  slaJours: number
): boolean {
  const deadline = calculerDeadlineSLA(dateSoumission, slaJours);
  const traitement = typeof dateTraitement === 'string' ? new Date(dateTraitement) : dateTraitement;
  
  return traitement <= deadline;
}

/**
 * Calcule le temps restant avant échéance
 */
export function getTempsRestantSLA(
  dateSoumission: Date | string,
  slaJours: number
): { joursRestants: number; estEnRetard: boolean; urgence: 'normal' | 'warning' | 'critical' } {
  const deadline = calculerDeadlineSLA(dateSoumission, slaJours);
  const now = new Date();
  
  const joursRestants = compterJoursOuvres(now, deadline);
  const estEnRetard = now > deadline;
  
  let urgence: 'normal' | 'warning' | 'critical' = 'normal';
  if (estEnRetard) {
    urgence = 'critical';
  } else if (joursRestants <= 1) {
    urgence = 'warning';
  }
  
  return { joursRestants, estEnRetard, urgence };
}

// ============================================================
// CRÉNEAUX HORAIRES
// ============================================================

/**
 * Génère les créneaux disponibles pour un jour donné
 * Basé sur les horaires du service et les disponibilités des agents
 */
export interface Creneau {
  start: string; // "HH:mm"
  end: string;
  available: boolean;
}

export function genererCreneaux(
  heureDebut: string,
  heureFin: string,
  dureeMinutes: number
): Creneau[] {
  const creneaux: Creneau[] = [];
  const [hDebut, mDebut] = heureDebut.split(':').map(Number);
  const [hFin, mFin] = heureFin.split(':').map(Number);
  
  let currentMinutes = hDebut * 60 + mDebut;
  const endMinutes = hFin * 60 + mFin;
  
  while (currentMinutes + dureeMinutes <= endMinutes) {
    const startH = Math.floor(currentMinutes / 60);
    const startM = currentMinutes % 60;
    const endH = Math.floor((currentMinutes + dureeMinutes) / 60);
    const endM = (currentMinutes + dureeMinutes) % 60;
    
    creneaux.push({
      start: `${String(startH).padStart(2, '0')}:${String(startM).padStart(2, '0')}`,
      end: `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`,
      available: true, // Sera mis à jour selon les réservations
    });
    
    currentMinutes += dureeMinutes;
  }
  
  return creneaux;
}

// ============================================================
// FUSEAU HORAIRE
// ============================================================

/**
 * Convertit une date UTC en heure locale de l'ambassade (Casablanca)
 */
export function toAmbassadeTime(date: Date | string): Date {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Date(d.toLocaleString('en-US', { timeZone: TIMEZONE_AMBASSADE }));
}

/**
 * Formate une date pour l'affichage dans le fuseau de l'ambassade
 */
export function formatAmbassadeDate(date: Date | string): string {
  const local = toAmbassadeTime(date);
  return formatDateTime(local);
}