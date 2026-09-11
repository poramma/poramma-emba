// src/hooks/useToast.ts

import { useState, useCallback } from 'react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

interface ToastOptions {
  title?: string;
  description?: string;
  variant?: ToastType;
  duration?: number;
}

export const useToast = () => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((type: ToastType, message: string, duration: number = 3000) => {
    const id = Date.now().toString();
    const toast: Toast = { id, type, message, duration };
    
    setToasts(prev => [...prev, toast]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const success = useCallback((message: string, duration?: number) => {
    addToast('success', message, duration);
  }, [addToast]);

  const error = useCallback((message: string, duration?: number) => {
    addToast('error', message, duration);
  }, [addToast]);

  const warning = useCallback((message: string, duration?: number) => {
    addToast('warning', message, duration);
  }, [addToast]);

  const info = useCallback((message: string, duration?: number) => {
    addToast('info', message, duration);
  }, [addToast]);

  // ✅ Méthode `toast` pour la compatibilité avec l'interface attendue
  const toast = useCallback((options: ToastOptions) => {
    const { title, description, variant = 'info', duration } = options;
    const message = description ? `${title}: ${description}` : (title || '');
    addToast(variant, message, duration);
  }, [addToast]);

  return {
    toasts,
    addToast,
    removeToast,
    success,
    error,
    warning,
    info,
    toast, // ✅ Ajout de la méthode toast
  };
};

export default useToast;