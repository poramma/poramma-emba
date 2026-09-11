// ============================================================
// src/components/demandes/DemandeTimeline.tsx
// ============================================================

import React, { useEffect } from 'react';
import { useDemandes } from '../../hooks/useDemandes';
import { DemandeHistory, AppStatus } from '../../types/demande';
import { CheckCircle, XCircle, Clock, AlertTriangle, FileText, UserCheck, RotateCcw } from 'lucide-react';

const STATUS_ICONS: Record<AppStatus, React.ElementType> = {
  [AppStatus.DRAFT]: FileText,
  [AppStatus.SUBMITTED]: FileText,
  [AppStatus.IN_REVIEW]: Clock,
  [AppStatus.ADDITIONAL_INFO_REQUIRED]: AlertTriangle,
  [AppStatus.UNDER_VERIFICATION]: Clock,
  [AppStatus.APPROVED]: CheckCircle,
  [AppStatus.REJECTED]: XCircle,
  [AppStatus.COMPLETED]: CheckCircle,
  [AppStatus.CANCELLED]: XCircle,
  [AppStatus.ARCHIVED]: FileText,
};

const STATUS_COLORS: Record<AppStatus, string> = {
  [AppStatus.DRAFT]: 'bg-gray-100 text-gray-500',
  [AppStatus.SUBMITTED]: 'bg-blue-100 text-blue-600',
  [AppStatus.IN_REVIEW]: 'bg-amber-100 text-amber-600',
  [AppStatus.ADDITIONAL_INFO_REQUIRED]: 'bg-orange-100 text-orange-600',
  [AppStatus.UNDER_VERIFICATION]: 'bg-purple-100 text-purple-600',
  [AppStatus.APPROVED]: 'bg-emerald-100 text-emerald-600',
  [AppStatus.REJECTED]: 'bg-red-100 text-red-600',
  [AppStatus.COMPLETED]: 'bg-green-100 text-green-600',
  [AppStatus.CANCELLED]: 'bg-gray-100 text-gray-400',
  [AppStatus.ARCHIVED]: 'bg-gray-100 text-gray-400',
};

interface DemandeTimelineProps {
  demandeId: string;
}

export const DemandeTimeline: React.FC<DemandeTimelineProps> = ({ demandeId }) => {
  const { histories, fetchHistory, selectedDemande } = useDemandes();

  useEffect(() => {
    if (demandeId) {
      fetchHistory(demandeId);
    }
  }, [demandeId, fetchHistory]);

  if (!histories.length) {
    return (
      <div className="text-center py-8 text-gray-400 text-sm">
        Aucun historique disponible
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Ligne verticale */}
      <div className="absolute left-4 top-0 bottom-0 w-px bg-gray-200 dark:bg-gray-700" />

      <div className="space-y-6">
        {histories.map((history, index) => {
          const Icon = STATUS_ICONS[history.toStatus] || FileText;
          const isFirst = index === 0;
          const isVisible = history.isVisibleToUser;

          return (
            <TimelineItem
              key={history.id}
              history={history}
              icon={Icon}
              isFirst={isFirst}
              colorClass={STATUS_COLORS[history.toStatus]}
              isVisible={isVisible}
            />
          );
        })}
      </div>
    </div>
  );
};

// ── Sous-composant TimelineItem ──
const TimelineItem: React.FC<{
  history: DemandeHistory;
  icon: React.ElementType;
  isFirst: boolean;
  colorClass: string;
  isVisible: boolean;
}> = ({ history, icon: Icon, isFirst, colorClass, isVisible }) => (
  <div className="relative flex gap-4">
    {/* Point sur la ligne */}
    <div className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${colorClass} ${isFirst ? 'ring-2 ring-offset-2 ring-primary' : ''}`}>
      <Icon className="h-4 w-4" />
    </div>

    {/* Contenu */}
    <div className={`flex-1 pb-2 ${!isVisible ? 'opacity-60' : ''}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-900 dark:text-white">
            {history.fromStatus} → {history.toStatus}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">
            Par <span className="font-medium">{history.actorName}</span>
            {' '}({history.actorRole})
            {!isVisible && <span className="ml-2 text-amber-600">• Interne</span>}
          </p>
          {history.comment && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg p-2">
              "{history.comment}"
            </p>
          )}
        </div>
        <span className="text-xs text-gray-400 shrink-0">
          {new Date(history.createdAt).toLocaleString('fr-FR', {
            day: '2-digit',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </span>
      </div>
    </div>
  </div>
);