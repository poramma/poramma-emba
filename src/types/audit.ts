// ============================================================
// src/types/audit.ts
// ============================================================

export enum AuditSeverity {
  INFO = 'INFO',
  WARNING = 'WARNING',
  CRITICAL = 'CRITICAL',
}

export interface AuditLog {
  id: string;
  at: string;
  actorUserId: string;
  actorInue: string | null;
  actorRole: string;
  action: string;
  entityType: string;
  entityId: string;
  entitySnapshot: Record<string, unknown> | null;
  result: 'SUCCESS' | 'ERROR' | 'REJECT' | 'WARNING';
  details: Record<string, unknown> | null;
  ip: string;
  ua: string;
  sessionId: string | null;
  severity: AuditSeverity;
}
