// src/components/audit/LogDetail.tsx

import React from 'react';
import { Modal } from '../ui/modal';
import { Badge } from '../ui/badge';
import { AuditLog, AuditSeverity } from '../../types/audit';
import { CustomPayloadView } from '../demandes/CustomPayloadView';
import { actionLabel, entityLabel, RESULT_LABELS } from '../../config/audit-labels';
import { timeAgo } from '../../lib/date';

interface LogDetailProps {
  isOpen: boolean;
  onClose: () => void;
  log: AuditLog | null;
}

const SEVERITY_COLOR: Record<AuditSeverity, 'gray' | 'warning' | 'error'> = {
  [AuditSeverity.INFO]: 'gray',
  [AuditSeverity.WARNING]: 'warning',
  [AuditSeverity.CRITICAL]: 'error',
};

const SEVERITY_LABEL: Record<AuditSeverity, string> = {
  [AuditSeverity.INFO]: 'Information',
  [AuditSeverity.WARNING]: 'Avertissement',
  [AuditSeverity.CRITICAL]: 'Critique',
};

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid grid-cols-3 gap-4 py-2 border-b border-gray-100 dark:border-gray-800 last:border-0">
      <span className="text-sm text-gray-500 dark:text-gray-400">{label}</span>
      <span className="col-span-2 text-sm text-gray-900 dark:text-white break-all">{value}</span>
    </div>
  );
}

/** Champs techniques ajoutés par la journalisation automatique — sans intérêt pour un agent. */
function readableDetails(details: Record<string, unknown> | null): Record<string, unknown> | null {
  if (!details) return null;
  const { automatic, ...rest } = details;
  void automatic;
  return Object.keys(rest).length ? rest : null;
}

export const LogDetail: React.FC<LogDetailProps> = ({ isOpen, onClose, log }) => {
  if (!log) return null;

  const at = new Date(log.at);
  const details = readableDetails(log.details);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Détail de l'entrée d'audit" size="lg">
      <div className="space-y-1">
        <Row
          label="Date et heure"
          value={
            <>
              {at.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} à{' '}
              <span className="font-mono">{at.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
              <span className="ml-2 text-xs text-gray-400">({timeAgo(log.at)})</span>
            </>
          }
        />
        <Row label="Action" value={actionLabel(log.action)} />
        <Row
          label="Résultat"
          value={
            <Badge color={log.result === 'SUCCESS' ? 'success' : 'error'} variant="light" size="xs">
              {RESULT_LABELS[log.result] ?? log.result}
            </Badge>
          }
        />
        <Row
          label="Sévérité"
          value={
            <Badge color={SEVERITY_COLOR[log.severity]} variant="light" size="xs">
              {SEVERITY_LABEL[log.severity]}
            </Badge>
          }
        />
        <Row label="Acteur" value={log.actorName || 'Anonyme'} />
        <Row label="Adresse email" value={log.actorEmail || 'Non disponible'} />
        {log.actorInue && <Row label="INUE de l'acteur" value={log.actorInue} />}
        <Row label="Rôle" value={log.actorRole || 'N/A'} />
        <Row label="Objet" value={`${entityLabel(log.entityType)}${log.entityId !== '-' ? ` — ${log.entityId}` : ''}`} />
        <Row label="Session" value={log.sessionId || 'N/A'} />
        <Row label="Adresse IP" value={log.ip || 'N/A'} />
        <Row label="Appareil / navigateur" value={<span className="text-xs">{log.ua || 'N/A'}</span>} />

        {log.entitySnapshot && (
          <div className="pt-3">
            <p className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Changement enregistré</p>
            <CustomPayloadView data={log.entitySnapshot} />
          </div>
        )}
        {details && (
          <div className="pt-3">
            <p className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Détails</p>
            <CustomPayloadView data={details} />
          </div>
        )}
      </div>
    </Modal>
  );
};

export default LogDetail;
