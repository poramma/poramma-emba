// src/hooks/useDebounce.ts

import { useState, useEffect } from 'react';

/**
 * Hook personnalisé pour débouncer une valeur
 * 
 * @param value - La valeur à débouncer
 * @param delay - Le délai en millisecondes (défaut: 500ms)
 * @returns La valeur débouncée
 * 
 * @example
 * const [searchTerm, setSearchTerm] = useState('');
 * const debouncedSearch = useDebounce(searchTerm, 300);
 * 
 * useEffect(() => {
 *   // Cette fonction ne s'exécutera que 300ms après le dernier changement de searchTerm
 *   fetchResults(debouncedSearch);
 * }, [debouncedSearch]);
 */
export function useDebounce<T>(value: T, delay: number = 500): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

export default useDebounce;