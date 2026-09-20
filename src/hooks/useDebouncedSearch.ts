// src/hooks/useDebouncedSearch.ts

import { useEffect, useRef } from 'react';

/**
 * Recherche « en temps réel » : appelle `onSearch` quelques centaines de
 * millisecondes après la DERNIÈRE frappe (pas à chaque touche : on n'envoie pas
 * une requête par caractère). Ignore le premier rendu (pas de recherche vide
 * au chargement de la page) et ne se déclenche que si le texte a réellement changé.
 *
 * @example
 * const [q, setQ] = useState('');
 * useDebouncedSearch(q, (text) => fetchResults(text));
 */
export function useDebouncedSearch(value: string, onSearch: (value: string) => void, delay = 350) {
  const callback = useRef(onSearch);
  callback.current = onSearch;
  const last = useRef(value.trim());
  const mounted = useRef(false);

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    const next = value.trim();
    const timer = setTimeout(() => {
      if (next === last.current) return;
      last.current = next;
      callback.current(next);
    }, delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
}

export default useDebouncedSearch;
