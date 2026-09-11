// ============================================================
// src/store/uiStore.ts
// ============================================================

/**
 * STORE UI GLOBAL
 * 
 * Gère l'état de l'interface:
 * - Sidebar (ouvert/fermé)
 * - Modales
 * - Toasts / Notifications
 * - Thème (clair/sombre)
 * - État de chargement global
 */

import { create } from 'zustand';

// ============================================================
// TYPES
// ============================================================

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export interface ModalState {
  isOpen: boolean;
  title?: string;
  content?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  onClose?: () => void;
}

// ============================================================
// INTERFACE DU STORE
// ============================================================

interface UIState {
  // Sidebar
  sidebarOpen: boolean;
  sidebarCollapsed: boolean;
  
  // Modales
  activeModal: ModalState;
  
  // Toasts
  toasts: Toast[];
  
  // Thème
  theme: 'light' | 'dark' | 'system';
  
  // Chargement global
  globalLoading: boolean;
  globalLoadingMessage?: string;
  
  // Actions
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  
  openModal: (modal: Omit<ModalState, 'isOpen'>) => void;
  closeModal: () => void;
  
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  clearToasts: () => void;
  
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  
  setGlobalLoading: (loading: boolean, message?: string) => void;
}

// ============================================================
// IMPLEMENTATION
// ============================================================

export const useUIStore = create<UIState>()((set, get) => ({
  // État initial
  sidebarOpen: true,
  sidebarCollapsed: false,
  activeModal: { isOpen: false },
  toasts: [],
  theme: 'light',
  globalLoading: false,
  globalLoadingMessage: undefined,
  
  // Sidebar
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
  
  // Modales
  openModal: (modal) => set({ activeModal: { ...modal, isOpen: true } }),
  closeModal: () => set({ activeModal: { isOpen: false } }),
  
  // Toasts
  addToast: (toast) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newToast: Toast = { ...toast, id, duration: toast.duration || 5000 };
    
    set((state) => ({ toasts: [...state.toasts, newToast] }));
    
    // Auto-suppression après duration
    if (newToast.duration !== undefined && newToast.duration > 0) {
      setTimeout(() => {
        get().removeToast(id);
      }, newToast.duration);
    }
  },
  
  removeToast: (id) => set((state) => ({
    toasts: state.toasts.filter((t) => t.id !== id),
  })),
  
  clearToasts: () => set({ toasts: [] }),
  
  // Thème
  setTheme: (theme) => {
    set({ theme });
    // Appliquer au DOM
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else if (theme === 'light') {
      root.classList.remove('dark');
    } else {
      // System
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      prefersDark ? root.classList.add('dark') : root.classList.remove('dark');
    }
  },
  
  // Chargement global
  setGlobalLoading: (loading, message) => set({
    globalLoading: loading,
    globalLoadingMessage: message,
  }),
}));

// ============================================================
// HOOKS DÉRIVÉS
// ============================================================

/**
 * Hook rapide pour les toasts
 */
export function useToast() {
  const { addToast } = useUIStore();
  
  return {
    success: (title: string, message?: string) =>
      addToast({ type: 'success', title, message }),
    
    error: (title: string, message?: string) =>
      addToast({ type: 'error', title, message }),
    
    warning: (title: string, message?: string) =>
      addToast({ type: 'warning', title, message }),
    
    info: (title: string, message?: string) =>
      addToast({ type: 'info', title, message }),
  };
}

/**
 * Hook rapide pour les modales
 */
export function useModal() {
  const { openModal, closeModal } = useUIStore();
  
  return {
    open: openModal,
    close: closeModal,
    confirm: (options: {
      title: string;
      message: string;
      onConfirm: () => void;
      onCancel?: () => void;
      confirmLabel?: string;
      cancelLabel?: string;
      variant?: 'danger' | 'warning' | 'info';
    }) => {
      openModal({
        title: options.title,
        size: 'md',
        content: null, // Sera rendu par le composant ConfirmDialog
        onClose: options.onCancel,
      });
    },
  };
}