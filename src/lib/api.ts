// ============================================================
// src/lib/api.ts
// ============================================================

/**
 * INSTANCE AXIOS CONFIGURÉE
 * 
 * - Base URL depuis les variables d'environnement
 * - Intercepteur requête: ajoute le token JWT
 * - Intercepteur réponse: gère le refresh token et les erreurs
 * - Headers par défaut: Content-Type, Accept
 */

import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '../store/authStore';

// ============================================================
// CONFIGURATION
// ============================================================

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
const REQUEST_TIMEOUT = 30000; // 30 secondes

// ============================================================
// INSTANCE
// ============================================================

export const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: REQUEST_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// ============================================================
// INTERCEPTEUR REQUÊTE
// ============================================================

/**
 * Ajoute le token JWT à chaque requête
 * Le token est stocké dans le Zustand store (persisté en localStorage)
 * 
 * Backend attend: Authorization: Bearer {token}
 */
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Récupérer le token depuis le store Zustand
    const token = useAuthStore.getState().user?.id 
      ? localStorage.getItem('poramma_access_token') 
      : null;
    
    // MOCK: En développement, utiliser un token fictif
    const mockToken = 'mock-jwt-token-' + Date.now();
    
    if (token || import.meta.env.DEV) {
      config.headers.Authorization = `Bearer ${token || mockToken}`;
    }
    
    // Ajouter l'ID de session pour l'audit
    const sessionId = localStorage.getItem('poramma_session_id');
    if (sessionId) {
      config.headers['X-Session-Id'] = sessionId;
    }
    
    // Log en développement
    if (import.meta.env.DEV) {
      console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`, config.params || config.data);
    }
    
    return config;
  },
  (error: any) => {
    console.error('[API] Erreur requête:', error);
    return Promise.reject(error);
  }
);

// ============================================================
// INTERCEPTEUR RÉPONSE
// ============================================================

/**
 * Gère:
 * - 401 Unauthorized → refresh token ou déconnexion
 * - 403 Forbidden → redirection page non autorisée
 * - 422 Validation → extraction des erreurs de formulaire
 * - 500+ → erreur serveur
 */
api.interceptors.response.use(
  (response) => {
    // Log en développement
    if (import.meta.env.DEV) {
      console.log(`[API] ${response.config.url} → ${response.status}`, response.data);
    }
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    
    if (!error.response) {
      // Erreur réseau (offline, timeout)
      console.error('[API] Erreur réseau:', error.message);
      return Promise.reject(new ApiNetworkError('Impossible de contacter le serveur. Vérifiez votre connexion.'));
    }
    
    const status = error.response.status;
    
    switch (status) {
      case 401:
        // Token expiré → tentative de refresh
        if (!originalRequest._retry) {
          originalRequest._retry = true;
          
          try {
            const refreshToken = localStorage.getItem('poramma_refresh_token');
            if (!refreshToken) throw new Error('No refresh token');
            
            // Appel au endpoint de refresh
            // const { data } = await axios.post(`${API_BASE_URL}/auth/refresh`, { refreshToken });
            // localStorage.setItem('poramma_access_token', data.token);
            
            // MOCK: Simuler le refresh
            await new Promise((r) => setTimeout(r, 500));
            localStorage.setItem('poramma_access_token', 'new-mock-token-' + Date.now());
            
            // Réessayer la requête originale
            return api(originalRequest);
            
          } catch (refreshError) {
            // Refresh échoué → déconnexion
            useAuthStore.getState().logout();
            window.location.href = '/login?reason=session_expired';
            return Promise.reject(refreshError);
          }
        }
        break;
        
      case 403:
        // Permission insuffisante
        console.error('[API] 403 Forbidden:', error.response.data);
        window.location.href = '/unauthorized';
        break;
        
      case 422:
        // Erreurs de validation
        const validationErrors = (error.response.data as any)?.details;
        console.error('[API] 422 Validation:', validationErrors);
        return Promise.reject(new ApiValidationError('Validation échouée', validationErrors));
        
      case 429:
        // Rate limiting
        console.error('[API] 429 Too Many Requests');
        return Promise.reject(new ApiRateLimitError('Trop de requêtes. Veuillez réessayer plus tard.'));
        
      case 500:
      case 502:
      case 503:
      case 504:
        // Erreurs serveur
        console.error('[API] Erreur serveur:', status, error.response.data);
        return Promise.reject(new ApiServerError('Erreur serveur. Veuillez réessayer plus tard.'));
    }
    
    return Promise.reject(error);
  }
);

// ============================================================
// CLASSES D'ERREUR CUSTOM
// ============================================================

export class ApiNetworkError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ApiNetworkError';
  }
}

export class ApiValidationError extends Error {
  details: Record<string, string[]>;
  
  constructor(message: string, details: Record<string, string[]>) {
    super(message);
    this.name = 'ApiValidationError';
    this.details = details;
  }
}

export class ApiRateLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ApiRateLimitError';
  }
}

export class ApiServerError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ApiServerError';
  }
}

// ============================================================
// HELPERS API
// ============================================================

/**
 * Upload de fichier avec progression
 * Backend: POST /api/upload
 */
export async function uploadFile(
  file: File,
  onProgress?: (progress: number) => void
): Promise<{ fileId: string; url: string }> {
  const formData = new FormData();
  formData.append('file', file);
  
  const { data } = await api.post('/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (progressEvent) => {
      if (onProgress && progressEvent.total) {
        const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        onProgress(progress);
      }
    },
  });
  
  return data.data;
}

/**
 * Export PDF/Excel
 * Backend: GET /api/export/:type
 */
export async function exportDocument(
  endpoint: string,
  params: Record<string, unknown>,
  filename: string
): Promise<void> {
  const response = await api.get(endpoint, {
    params,
    responseType: 'blob',
  });
  
  const blob = new Blob([response.data]);
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}