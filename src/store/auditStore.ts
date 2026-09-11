// ============================================================
// src/store/auditStore.ts
// ============================================================

/**
 * STORE: Audit & Traçabilité
 * Backend: Table `audit_logs`
 * Endpoints:
 *   - GET /api/audit/logs
 *   - GET /api/audit/logs/:id
 *   - POST /api/audit/export
 *   - GET /api/audit/stats
 */

import { create } from 'zustand';
import { AuditLog, AuditSeverity } from '../types/audit';

// ============================================================
// MOCK DATA
// ============================================================

const MOCK_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'audit-001',
    at: '2025-07-05T08:30:00Z',
    actorUserId: 'usr-001-ambassador',
    actorInue: null,
    actorRole: 'AMBASSADOR',
    action: 'LOGIN',
    entityType: 'SESSION',
    entityId: 'session-001',
    entitySnapshot: { ip: '196.200.1.45', userAgent: 'Mozilla/5.0...' },
    result: 'SUCCESS',
    details: { method: 'password+mfa' },
    ip: '196.200.1.45',
    ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    sessionId: 'session-001',
    severity: AuditSeverity.INFO,
  },
  {
    id: 'audit-002',
    at: '2025-07-05T09:15:00Z',
    actorUserId: 'usr-003-reception',
    actorInue: null,
    actorRole: 'RECEPTIONIST',
    action: 'CREATE',
    entityType: 'RENDEZ_VOUS',
    entityId: 'rdv-002',
    entitySnapshot: { type: 'URGENCE', userId: 'usr-stu-002', motif: 'Perte de passeport' },
    result: 'SUCCESS',
    details: { ticketId: 'URG-20250705-001' },
    ip: '196.200.1.46',
    ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    sessionId: 'session-003',
    severity: AuditSeverity.INFO,
  },
  {
    id: 'audit-003',
    at: '2025-07-05T09:20:00Z',
    actorUserId: 'usr-002-agent',
    actorInue: null,
    actorRole: 'AGENT',
    action: 'UPDATE_STATUS',
    entityType: 'DEMANDE',
    entityId: 'dem-2025-0001234',
    entitySnapshot: { fromStatus: 'SUBMITTED', toStatus: 'IN_REVIEW' },
    result: 'SUCCESS',
    details: { comment: 'Demande prise en charge' },
    ip: '196.200.1.47',
    ua: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
    sessionId: 'session-002',
    severity: AuditSeverity.INFO,
  },
  {
    id: 'audit-004',
    at: '2025-07-05T10:00:00Z',
    actorUserId: 'usr-004-admin',
    actorInue: null,
    actorRole: 'ADMIN',
    action: 'CREATE_SCHEDULE',
    entityType: 'SERVICE_SCHEDULE',
    entityId: 'sched-012',
    entitySnapshot: { subServiceId: 'sub-003', dayOfWeek: 4, startTime: '09:00', endTime: '12:00' },
    result: 'SUCCESS',
    details: { reason: 'Service attestations uniquement le jeudi' },
    ip: '196.200.1.48',
    ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    sessionId: 'session-004',
    severity: AuditSeverity.WARNING, // Modification configuration système
  },
  {
    id: 'audit-005',
    at: '2025-07-05T10:30:00Z',
    actorUserId: 'usr-999-inconnu',
    actorInue: null,
    actorRole: 'UNKNOWN',
    action: 'LOGIN_ATTEMPT',
    entityType: 'SESSION',
    entityId: 'session-failed-001',
    entitySnapshot: { email: 'hacker@example.com' },
    result: 'REJECT',
    details: { reason: 'INVALID_CREDENTIALS', attemptCount: 5 },
    ip: '185.220.101.42',
    ua: 'Mozilla/5.0 (X11; Linux x86_64)',
    sessionId: 'session-failed-001',
    severity: AuditSeverity.CRITICAL,
  },
];

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

  // Actions
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
  // État initial
  logs: [],
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

  /**
   * FETCH LOGS
   * Backend: GET /api/audit/logs
   * Query: filtres (actorUserId, action, entityType, result, severity, dateFrom, dateTo, search)
   * Response: { data: AuditLog[], meta: PaginationMeta }
   *
   * Permissions: audit:read (Admin, Ambassadeur, Auditeur)
   */
  fetchLogs: async (filters = {}) => {
    set({ isLoading: true, error: null, filters: { ...get().filters, ...filters } });

    try {
      await new Promise((r) => setTimeout(r, 600));

      // VRAIE IMPLÉMENTATION:
      // const { data } = await api.get('/audit/logs', { params: { ...get().filters, ...filters } });
      // set({ logs: data.data, isLoading: false });

      // MOCK: Filtrage local
      let filtered = [...MOCK_AUDIT_LOGS];
      const mergedFilters = { ...get().filters, ...filters };

      if (mergedFilters.actorUserId) {
        filtered = filtered.filter((l) => l.actorUserId === mergedFilters.actorUserId);
      }
      if (mergedFilters.actorRole) {
        filtered = filtered.filter((l) => l.actorRole === mergedFilters.actorRole);
      }
      if (mergedFilters.action) {
        filtered = filtered.filter((l) => l.action === mergedFilters.action);
      }
      if (mergedFilters.entityType) {
        filtered = filtered.filter((l) => l.entityType === mergedFilters.entityType);
      }
      if (mergedFilters.result) {
        filtered = filtered.filter((l) => l.result === mergedFilters.result);
      }
      if (mergedFilters.severity) {
        filtered = filtered.filter((l) => l.severity === mergedFilters.severity);
      }
      if (mergedFilters.dateFrom) {
        filtered = filtered.filter((l) => l.at >= mergedFilters.dateFrom!);
      }
      if (mergedFilters.dateTo) {
        filtered = filtered.filter((l) => l.at <= mergedFilters.dateTo!);
      }
      if (mergedFilters.search) {
        const search = mergedFilters.search.toLowerCase();
        filtered = filtered.filter(
          (l) =>
            l.action.toLowerCase().includes(search) ||
            l.entityType.toLowerCase().includes(search) ||
            l.actorRole.toLowerCase().includes(search)
        );
      }

      set({ logs: filtered, isLoading: false });

    } catch (err) {
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : 'Erreur de chargement des logs',
      });
    }
  },

  /**
   * FETCH LOG BY ID
   * Backend: GET /api/audit/logs/:id
   */
  fetchLogById: async (id) => {
    set({ isLoading: true, error: null });

    try {
      await new Promise((r) => setTimeout(r, 300));

      // VRAIE IMPLÉMENTATION:
      // const { data } = await api.get(`/audit/logs/${id}`);

      const log = MOCK_AUDIT_LOGS.find((l) => l.id === id) || null;
      set({ selectedLog: log, isLoading: false });
      return log;

    } catch (err) {
      set({ isLoading: false, error: 'Log introuvable' });
      return null;
    }
  },

  /**
   * EXPORT LOGS
   * Backend: POST /api/audit/export
   * Body: { filters, format }
   * Response: Blob (fichier téléchargeable)
   *
   * Permissions: audit:export
   */
  exportLogs: async (filters, format) => {
    set({ isLoading: true, error: null });

    try {
      await new Promise((r) => setTimeout(r, 1000));

      // VRAIE IMPLÉMENTATION:
      // const response = await api.post('/audit/export', { filters, format }, { responseType: 'blob' });
      // const blob = new Blob([response.data]);
      // const url = window.URL.createObjectURL(blob);
      // const link = document.createElement('a');
      // link.href = url;
      // link.download = `audit-export-${new Date().toISOString().split('T')[0]}.${format.toLowerCase()}`;
      // link.click();

      console.log(`[MOCK] Export des logs en ${format}`, filters);
      set({ isLoading: false });

    } catch (err) {
      set({ isLoading: false, error: 'Erreur d\'export' });
      throw err;
    }
  },

  /**
   * FETCH STATS
   * Backend: GET /api/audit/stats
   * Retourne des agrégations pour le dashboard
   */
  fetchStats: async () => {
    try {
      await new Promise((r) => setTimeout(r, 400));

      // VRAIE IMPLÉMENTATION:
      // const { data } = await api.get('/audit/stats');

      const logs = get().logs.length > 0 ? get().logs : MOCK_AUDIT_LOGS;

      const bySeverity = { INFO: 0, WARNING: 0, CRITICAL: 0 };
      const byResult = { SUCCESS: 0, ERROR: 0, REJECT: 0, WARNING: 0 };

      logs.forEach((l) => {
        bySeverity[l.severity] = (bySeverity[l.severity] || 0) + 1;
        byResult[l.result] = (byResult[l.result] || 0) + 1;
      });

      set({
        stats: {
          total: logs.length,
          bySeverity,
          byResult,
          failedLogins: logs.filter((l) => l.action === 'LOGIN_ATTEMPT' && l.result === 'REJECT').length,
          criticalEvents: bySeverity.CRITICAL,
        },
      });

    } catch (err) {
      console.error('Erreur chargement stats audit:', err);
    }
  },

  setFilters: (filters) => set({ filters: { ...get().filters, ...filters } }),
  setSelectedLog: (log) => set({ selectedLog: log }),
}));