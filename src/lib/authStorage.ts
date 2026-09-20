// ============================================================
// src/lib/authStorage.ts
// ============================================================

/**
 * "Rester connecté" — un seul indicateur (`poramma_remember_me`, toujours
 * en localStorage, non sensible) décide où vivent TOUT le reste de la
 * session ct-côté (tokens JWT + l'état persisté de authStore via zustand
 * persist) : localStorage si coché (survit à la fermeture du navigateur),
 * sessionStorage sinon (effacé à la fermeture de l'onglet/navigateur).
 *
 * Les deux emplacements de persistance (tokens ici, zustand persist dans
 * authStore.ts) doivent utiliser CE MÊME indicateur pour rester cohérents —
 * sinon l'état "connecté" pourrait survivre en localStorage pendant que les
 * tokens eux, dans sessionStorage, ont disparu, laissant l'UI se croire
 * connectée jusqu'au premier appel API qui échoue.
 */

const REMEMBER_FLAG = "poramma_remember_me";

function backingStore(): Storage {
  return localStorage.getItem(REMEMBER_FLAG) === "1" ? localStorage : sessionStorage;
}

export function setRememberMe(remember: boolean): void {
  if (remember) {
    localStorage.setItem(REMEMBER_FLAG, "1");
  } else {
    localStorage.removeItem(REMEMBER_FLAG);
  }
}

export function isRemembered(): boolean {
  return localStorage.getItem(REMEMBER_FLAG) === "1";
}

export function authGetItem(key: string): string | null {
  return backingStore().getItem(key);
}

export function authSetItem(key: string, value: string): void {
  backingStore().setItem(key, value);
}

/** Removes from both stores defensively — covers a mid-session remember-me change and logout regardless of current mode. */
export function authRemoveItem(key: string): void {
  localStorage.removeItem(key);
  sessionStorage.removeItem(key);
}

export function clearAuthStorage(): void {
  localStorage.removeItem(REMEMBER_FLAG);
}
