// ============================================================
// src/store/auditStore.ts
// ============================================================

/**
 * STORE: Audit & Traçabilité
 * Backend: Table `audit.audit_logs` (ambassade-api)
 * Endpoints:
 *   - GET /api/audit/logs
 *   - GET /api/audit/logs/:id
 *   - POST /api/audit/export
 *   - GET /api/audit/stats
 */

import { create } from 'zustand';
import { api } from '../lib/api';
import { AuditLog, AuditPageMeta, AuditSeverity } from '../types/audit';

// ============================================================
// INTERFACE
// ============================================================

interface AuditFilters {
  actorUserId?: string;
  actorRole?: string;
  action?: string;
  entityType?: string;
  entityId?: string;
  result?: 'SUCCESS' | 'ERROR' | 'REJECT' | 'WARNING';
  severity?: AuditSeverity;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  page?: number;
  limit?: number;
}

interface AuditState {
  logs: AuditLog[];
  /** Pagination de la dernière liste chargée (total, pages…). */
  meta: AuditPageMeta;
  selectedLog: AuditLog | null;
  filters: AuditFilters;
  stats: {
    total: number;
    bySeverity: Record<AuditSeverity, number>;
    byResult: Record<string, number>;
    failedLogins: number;
    criticalEvents: number;
  };
  isLoading: boolean;
  error: string | null;

  fetchLogs: (filters?: AuditFilters) => Promise<void>;
  fetchLogById: (id: string) => Promise<AuditLog | null>;
  exportLogs: (filters: AuditFilters, format: 'CSV' | 'PDF' | 'JSON') => Promise<void>;
  fetchStats: () => Promise<void>;
  setFilters: (filters: AuditFilters) => void;
  setSelectedLog: (log: AuditLog | null) => void;
}

// ============================================================
// IMPLEMENTATION
// ============================================================

export const useAuditStore = create<AuditState>()((set, get) => ({
  logs: [],
  meta: { page: 1, limit: 25, total: 0, totalPages: 1 },
  selectedLog: null,
  filters: {},
  stats: {
    total: 0,
    bySeverity: { INFO: 0, WARNING: 0, CRITICAL: 0 },
    byResult: { SUCCESS: 0, ERROR: 0, REJECT: 0, WARNING: 0 },
    failedLogins: 0,
    criticalEvents: 0,
  },
  isLoading: false,
  error: null,

  fetchLogs: async (filters = {}) => {
    const mergedFilters = { ...get().filters, ...filters };
    set({ isLoading: true, error: null, filters: mergedFilters });

    try {
      const { data } = await api.get('/audit/logs', { params: mergedFilters });
      set({
        logs: data.data,
        meta: data.meta ?? { page: 1, limit: data.data.length, total: data.data.length, totalPages: 1 },
        isLoading: false,
      });
    } catch (err) {
      set({ isLoading: false, error: err instanceof Error ? err.message : 'Erreur de chargement des logs' });
    }
  },

  fetchLogById: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await api.get(`/audit/logs/${id}`);
      set({ selectedLog: data.data, isLoading: false });
      return data.data;
    } catch (err) {
      set({ isLoading: false, error: 'Log introuvable' });
      return null;
    }
  },

  exportLogs: async (filters, format) => {
    // Aucun générateur PDF côté backend (voir audit.controller.ts) — un export
    // "PDF" est en réalité livré en CSV, on aligne l'extension du fichier
    // téléchargé sur le contenu réel plutôt que sur la demande initiale.
    const effectiveFormat = format === 'PDF' ? 'CSV' : format;

    set({ isLoading: true, error: null });
    try {
      const response = await api.post('/audit/export', { filters, format: effectiveFormat }, { responseType: 'blob' });
      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `audit-export-${new Date().toISOString().split('T')[0]}.${effectiveFormat.toLowerCase()}`;
      link.click();
      window.URL.revokeObjectURL(url);
      set({ isLoading: false });
    } catch (err) {
      set({ isLoading: false, error: "Erreur d'export" });
      throw err;
    }
  },

  fetchStats: async () => {
    try {
      const { data } = await api.get('/audit/stats');
      set({ stats: data.data });
    } catch (err) {
      console.error('Erreur chargement stats audit:', err);
    }
  },

  setFilters: (filters) => set({ filters: { ...get().filters, ...filters } }),
  setSelectedLog: (log) => set({ selectedLog: log }),
}));
