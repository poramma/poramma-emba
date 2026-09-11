// ============================================================
// src/lib/utils.ts
// ============================================================

import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Combine plusieurs classes CSS avec clsx et résout les conflits Tailwind avec twMerge.
 * 
 * Usage:
 *   cn('base-class', condition && 'conditional-class', 'override-class')
 *   → twMerge(clsx(...)) = classes fusionnées sans conflits
 * 
 * Exemple:
 *   cn('px-4 py-2', isActive && 'bg-blue-500', 'px-6') 
 *   → 'py-2 bg-blue-500 px-6' (px-6 écrase px-4)
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

// ============================================================
// HELPERS SUPPLÉMENTAIRES (optionnels mais utiles)
// ============================================================

/**
 * Formate un nombre avec séparateur de milliers
 */
export function formatNumber(num: number): string {
  return new Intl.NumberFormat('fr-FR').format(num);
}

/**
 * Formate un montant en MAD
 */
export function formatCurrency(amount: number, currency = 'MAD'): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency,
  }).format(amount);
}

/**
 * Tronque un texte avec ellipsis
 */
export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + '...';
}

/**
 * Génère un ID unique
 */
export function generateId(prefix = ''): string {
  return `${prefix}${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Debounce une fonction
 */
export function debounce<T extends (...args: any[]) => void>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

/**
 * Deep clone simple (JSON-based)
 */
export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Vérifie si une valeur est vide (null, undefined, '', [], {})
 */
export function isEmpty(value: unknown): boolean {
  if (value == null) return true;
  if (typeof value === 'string') return value.trim() === '';
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return false;
}