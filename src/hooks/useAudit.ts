// ============================================================
// src/hooks/useAudit.ts
// ============================================================

import { useCallback, useMemo } from 'react';
import { useAuditStore } from '../store/auditStore';
import { AuditLog, AuditSeverity } from '../types/audit';

// ============================================================
// INTERFACE DU HOOK
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

type ExportFormat = 'CSV' | 'PDF' | 'JSON';

interface UseAuditReturn {
  // ── État ──
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

  // ── Computed ──
  logsFiltered: AuditLog[];
  logsBySeverity: (severity: AuditSeverity) => AuditLog[];
  logsByResult: (result: string) => AuditLog[];
  logsByAction: (action: string) => AuditLog[];
  logsByEntityType: (entityType: string) => AuditLog[];
  logsByDateRange: (dateFrom: string, dateTo: string) => AuditLog[];
  criticalLogs: AuditLog[];
  warningLogs: AuditLog[];
  failedLoginLogs: AuditLog[];
  recentLogs: AuditLog[];
  hasCriticalEvents: boolean;
  hasFailedLogins: boolean;

  // ── CRUD ──
  fetchLogs: (filters?: AuditFilters) => Promise<void>;
  fetchLogById: (id: string) => Promise<AuditLog | null>;
  refreshLogs: () => Promise<void>;

  // ── Export ──
  exportLogs: (filters: AuditFilters, format: ExportFormat) => Promise<void>;
  exportAsCSV: () => Promise<void>;
  exportAsPDF: () => Promise<void>;
  exportAsJSON: () => Promise<void>;

  // ── Stats ──
  fetchStats: () => Promise<void>;
  getSeverityCount: (severity: AuditSeverity) => number;
  getResultCount: (result: string) => number;
  getActionCount: (action: string) => number;
  getEntityTypeCount: (entityType: string) => number;
  getFailedLoginCount: () => number;
  getCriticalCount: () => number;

  // ── Filtres ──
  setFilters: (filters: AuditFilters) => void;
  resetFilters: () => void;
  filterBySeverity: (severity: AuditSeverity | undefined) => void;
  filterByResult: (result: string | undefined) => void;
  filterByAction: (action: string | undefined) => void;
  filterByEntityType: (entityType: string | undefined) => void;
  filterByActor: (actorUserId: string | undefined) => void;
  filterByDateRange: (dateFrom?: string, dateTo?: string) => void;
  filterBySearch: (search: string) => void;
  filterCritical: () => void;
  filterFailedLogins: () => void;

  // ── Sélection ──
  setSelectedLog: (log: AuditLog | null) => void;
  clearSelectedLog: () => void;
  selectNextLog: () => void;
  selectPrevLog: () => void;

  // ── Helpers ──
  getLogById: (id: string) => AuditLog | undefined;
  getLogsByEntity: (entityType: string, entityId: string) => AuditLog[];
  getUserActivity: (actorUserId: string) => AuditLog[];
  getTimelineForEntity: (entityType: string, entityId: string) => AuditLog[];
  formatLogTimestamp: (log: AuditLog) => string;
  getLogDescription: (log: AuditLog) => string;
  isSecurityEvent: (log: AuditLog) => boolean;
  isDataModification: (log: AuditLog) => boolean;
}

// ============================================================
// HELPERS
// ============================================================

const SECURITY_ACTIONS = ['LOGIN_ATTEMPT', 'LOGIN', 'LOGOUT', 'PASSWORD_CHANGE', 'MFA_VERIFY'];
const DATA_ACTIONS = ['CREATE', 'UPDATE', 'DELETE', 'UPDATE_STATUS', 'CREATE_SCHEDULE', 'DELETE_SCHEDULE'];

function formatTimestamp(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function getActionDescription(action: string, entityType: string): string {
  const descriptions: Record<string, string> = {
    LOGIN: 'Connexion',
    LOGOUT: 'Déconnexion',
    LOGIN_ATTEMPT: 'Tentative de connexion',
    CREATE: `Création ${entityType.toLowerCase()}`,
    UPDATE: `Modification ${entityType.toLowerCase()}`,
    DELETE: `Suppression ${entityType.toLowerCase()}`,
    UPDATE_STATUS: `Changement de statut`,
    CREATE_SCHEDULE: `Création horaire`,
    DELETE_SCHEDULE: `Suppression horaire`,
    VALIDATE: `Validation`,
    REJECT: `Rejet`,
    EXPORT: `Export`,
    PRINT: `Impression`,
  };
  return descriptions[action] || `${action} ${entityType}`;
}

// ============================================================
// IMPLEMENTATION
// ============================================================

export const useAudit = (): UseAuditReturn => {
  const store = useAuditStore();

  // ── Destructuring ──
  const {
    logs,
    selectedLog,
    filters,
    stats,
    isLoading,
    error,
    fetchLogs: storeFetchLogs,
    fetchLogById: storeFetchLogById,
    exportLogs: storeExportLogs,
    fetchStats: storeFetchStats,
    setFilters: storeSetFilters,
    setSelectedLog: storeSetSelectedLog,
  } = store;

  // ═══════════════════════════════════════════════════════════
  // COMPUTED
  // ═══════════════════════════════════════════════════════════

  const logsFiltered = useMemo(() => logs, [logs]);

  const criticalLogs = useMemo(
    () => logs.filter((l) => l.severity === AuditSeverity.CRITICAL),
    [logs]
  );

  const warningLogs = useMemo(
    () => logs.filter((l) => l.severity === AuditSeverity.WARNING),
    [logs]
  );

  const failedLoginLogs = useMemo(
    () => logs.filter((l) => l.action === 'LOGIN_ATTEMPT' && l.result === 'REJECT'),
    [logs]
  );

  const recentLogs = useMemo(() => {
    return [...logs]
      .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
      .slice(0, 20);
  }, [logs]);

  const hasCriticalEvents = useMemo(() => criticalLogs.length > 0, [criticalLogs]);
  const hasFailedLogins = useMemo(() => failedLoginLogs.length > 0, [failedLoginLogs]);

  // ═══════════════════════════════════════════════════════════
  // HELPERS
  // ═══════════════════════════════════════════════════════════

  const logsBySeverity = useCallback(
    (severity: AuditSeverity) => logs.filter((l) => l.severity === severity),
    [logs]
  );

  const logsByResult = useCallback(
    (result: string) => logs.filter((l) => l.result === result),
    [logs]
  );

  const logsByAction = useCallback(
    (action: string) => logs.filter((l) => l.action === action),
    [logs]
  );

  const logsByEntityType = useCallback(
    (entityType: string) => logs.filter((l) => l.entityType === entityType),
    [logs]
  );

  const logsByDateRange = useCallback(
    (dateFrom: string, dateTo: string) =>
      logs.filter((l) => l.at >= dateFrom && l.at <= dateTo),
    [logs]
  );

  const getLogById = useCallback(
    (id: string) => logs.find((l) => l.id === id),
    [logs]
  );

  const getLogsByEntity = useCallback(
    (entityType: string, entityId: string) =>
      logs.filter((l) => l.entityType === entityType && l.entityId === entityId),
    [logs]
  );

  const getUserActivity = useCallback(
    (actorUserId: string) =>
      logs
        .filter((l) => l.actorUserId === actorUserId)
        .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime()),
    [logs]
  );

  const getTimelineForEntity = useCallback(
    (entityType: string, entityId: string) =>
      getLogsByEntity(entityType, entityId).sort(
        (a, b) => new Date(a.at).getTime() - new Date(b.at).getTime()
      ),
    [getLogsByEntity]
  );

  const formatLogTimestamp = useCallback(
    (log: AuditLog) => formatTimestamp(log.at),
    []
  );

  const getLogDescription = useCallback(
    (log: AuditLog) => getActionDescription(log.action, log.entityType),
    []
  );

  const isSecurityEvent = useCallback(
    (log: AuditLog) => SECURITY_ACTIONS.includes(log.action),
    []
  );

  const isDataModification = useCallback(
    (log: AuditLog) => DATA_ACTIONS.includes(log.action),
    []
  );

  // ═══════════════════════════════════════════════════════════
  // CRUD WRAPPERS
  // ═══════════════════════════════════════════════════════════

  const fetchLogs = useCallback(
    async (filters?: AuditFilters) => {
      await storeFetchLogs(filters);
    },
    [storeFetchLogs]
  );

  const fetchLogById = useCallback(
    async (id: string) => {
      return await storeFetchLogById(id);
    },
    [storeFetchLogById]
  );

  const refreshLogs = useCallback(async () => {
    await storeFetchLogs(filters);
  }, [storeFetchLogs, filters]);

  // ═══════════════════════════════════════════════════════════
  // EXPORT WRAPPERS
  // ═══════════════════════════════════════════════════════════

  const exportLogs = useCallback(
    async (filters: AuditFilters, format: ExportFormat) => {
      await storeExportLogs(filters, format);
      console.log(`[useAudit] Export ${format} lancé`);
    },
    [storeExportLogs]
  );

  const exportAsCSV = useCallback(async () => {
    await exportLogs(filters, 'CSV');
  }, [exportLogs, filters]);

  const exportAsPDF = useCallback(async () => {
    await exportLogs(filters, 'PDF');
  }, [exportLogs, filters]);

  const exportAsJSON = useCallback(async () => {
    await exportLogs(filters, 'JSON');
  }, [exportLogs, filters]);

  // ═══════════════════════════════════════════════════════════
  // STATS WRAPPERS
  // ═══════════════════════════════════════════════════════════

  const fetchStats = useCallback(async () => {
    await storeFetchStats();
  }, [storeFetchStats]);

  const getSeverityCount = useCallback(
    (severity: AuditSeverity) => stats.bySeverity[severity] || 0,
    [stats.bySeverity]
  );

  const getResultCount = useCallback(
    (result: string) => stats.byResult[result] || 0,
    [stats.byResult]
  );

  const getActionCount = useCallback(
    (action: string) => logs.filter((l) => l.action === action).length,
    [logs]
  );

  const getEntityTypeCount = useCallback(
    (entityType: string) => logs.filter((l) => l.entityType === entityType).length,
    [logs]
  );

  const getFailedLoginCount = useCallback(
    () => stats.failedLogins,
    [stats.failedLogins]
  );

  const getCriticalCount = useCallback(
    () => stats.criticalEvents,
    [stats.criticalEvents]
  );

  // ═══════════════════════════════════════════════════════════
  // FILTRES WRAPPERS
  // ═══════════════════════════════════════════════════════════

  const resetFilters = useCallback(() => {
    storeSetFilters({});
    storeFetchLogs({});
  }, [storeSetFilters, storeFetchLogs]);

  const filterBySeverity = useCallback(
    (severity: AuditSeverity | undefined) => {
      storeSetFilters({ severity });
      storeFetchLogs({ severity });
    },
    [storeSetFilters, storeFetchLogs]
  );

  const filterByResult = useCallback(
    (result: string | undefined) => {
      storeSetFilters({ result: result as any });
      storeFetchLogs({ result: result as any });
    },
    [storeSetFilters, storeFetchLogs]
  );

  const filterByAction = useCallback(
    (action: string | undefined) => {
      storeSetFilters({ action });
      storeFetchLogs({ action });
    },
    [storeSetFilters, storeFetchLogs]
  );

  const filterByEntityType = useCallback(
    (entityType: string | undefined) => {
      storeSetFilters({ entityType });
      storeFetchLogs({ entityType });
    },
    [storeSetFilters, storeFetchLogs]
  );

  const filterByActor = useCallback(
    (actorUserId: string | undefined) => {
      storeSetFilters({ actorUserId });
      storeFetchLogs({ actorUserId });
    },
    [storeSetFilters, storeFetchLogs]
  );

  const filterByDateRange = useCallback(
    (dateFrom?: string, dateTo?: string) => {
      storeSetFilters({ dateFrom, dateTo });
      storeFetchLogs({ dateFrom, dateTo });
    },
    [storeSetFilters, storeFetchLogs]
  );

  const filterBySearch = useCallback(
    (search: string) => {
      storeSetFilters({ search });
      storeFetchLogs({ search });
    },
    [storeSetFilters, storeFetchLogs]
  );

  const filterCritical = useCallback(() => {
    filterBySeverity(AuditSeverity.CRITICAL);
  }, [filterBySeverity]);

  const filterFailedLogins = useCallback(() => {
    storeSetFilters({ action: 'LOGIN_ATTEMPT', result: 'REJECT' });
    storeFetchLogs({ action: 'LOGIN_ATTEMPT', result: 'REJECT' });
  }, [storeSetFilters, storeFetchLogs]);

  // ═══════════════════════════════════════════════════════════
  // SÉLECTION WRAPPERS
  // ═══════════════════════════════════════════════════════════

  const clearSelectedLog = useCallback(() => {
    storeSetSelectedLog(null);
  }, [storeSetSelectedLog]);

  const selectNextLog = useCallback(() => {
    if (!selectedLog || logs.length === 0) return;
    const idx = logs.findIndex((l) => l.id === selectedLog.id);
    const next = logs[idx + 1];
    if (next) storeSetSelectedLog(next);
  }, [selectedLog, logs, storeSetSelectedLog]);

  const selectPrevLog = useCallback(() => {
    if (!selectedLog || logs.length === 0) return;
    const idx = logs.findIndex((l) => l.id === selectedLog.id);
    const prev = logs[idx - 1];
    if (prev) storeSetSelectedLog(prev);
  }, [selectedLog, logs, storeSetSelectedLog]);

  // ═══════════════════════════════════════════════════════════
  // RETOUR
  // ═══════════════════════════════════════════════════════════

  return {
    // État
    logs,
    selectedLog,
    filters,
    stats,
    isLoading,
    error,

    // Computed
    logsFiltered,
    logsBySeverity,
    logsByResult,
    logsByAction,
    logsByEntityType,
    logsByDateRange,
    criticalLogs,
    warningLogs,
    failedLoginLogs,
    recentLogs,
    hasCriticalEvents,
    hasFailedLogins,

    // CRUD
    fetchLogs,
    fetchLogById,
    refreshLogs,

    // Export
    exportLogs,
    exportAsCSV,
    exportAsPDF,
    exportAsJSON,

    // Stats
    fetchStats,
    getSeverityCount,
    getResultCount,
    getActionCount,
    getEntityTypeCount,
    getFailedLoginCount,
    getCriticalCount,

    // Filtres
    setFilters: storeSetFilters,
    resetFilters,
    filterBySeverity,
    filterByResult,
    filterByAction,
    filterByEntityType,
    filterByActor,
    filterByDateRange,
    filterBySearch,
    filterCritical,
    filterFailedLogins,

    // Sélection
    setSelectedLog: storeSetSelectedLog,
    clearSelectedLog,
    selectNextLog,
    selectPrevLog,

    // Helpers
    getLogById,
    getLogsByEntity,
    getUserActivity,
    getTimelineForEntity,
    formatLogTimestamp,
    getLogDescription,
    isSecurityEvent,
    isDataModification,
  };
};