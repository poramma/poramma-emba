// ============================================================
// src/components/dashboard/DemandesChart.tsx
// ============================================================

import { useEffect, useMemo } from 'react';
import { useDemandeStore } from '../../store/demandeStore';
import { FileText } from 'lucide-react';
import { AppStatus } from '../../types/demande';

const STATUS_LABELS: Record<AppStatus, string> = {
  [AppStatus.DRAFT]: 'Brouillon',
  [AppStatus.SUBMITTED]: 'Soumise',
  [AppStatus.IN_REVIEW]: 'En examen',
  [AppStatus.ADDITIONAL_INFO_REQUIRED]: 'Infos manquantes',
  [AppStatus.UNDER_VERIFICATION]: 'Vérification',
  [AppStatus.APPROVED]: 'Approuvée',
  [AppStatus.REJECTED]: 'Rejetée',
  [AppStatus.COMPLETED]: 'Traitée',
  [AppStatus.CANCELLED]: 'Annulée',
  [AppStatus.ARCHIVED]: 'Archivée',
};

const STATUS_COLORS: Record<AppStatus, string> = {
  [AppStatus.DRAFT]: 'bg-gray-400',
  [AppStatus.SUBMITTED]: 'bg-blue-400',
  [AppStatus.IN_REVIEW]: 'bg-amber-400',
  [AppStatus.ADDITIONAL_INFO_REQUIRED]: 'bg-orange-400',
  [AppStatus.UNDER_VERIFICATION]: 'bg-purple-400',
  [AppStatus.APPROVED]: 'bg-emerald-400',
  [AppStatus.REJECTED]: 'bg-red-400',
  [AppStatus.COMPLETED]: 'bg-green-500',
  [AppStatus.CANCELLED]: 'bg-gray-300',
  [AppStatus.ARCHIVED]: 'bg-gray-200',
};

export function DemandesChart() {
  const { demandes, fetchDemandes } = useDemandeStore();

  useEffect(() => {
    fetchDemandes();
  }, [fetchDemandes]);

  const data = useMemo(() => {
    const counts: Record<string, number> = {};
    demandes.forEach(d => {
      const statusLabel = STATUS_LABELS[d.status] || d.status;
      counts[statusLabel] = (counts[statusLabel] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([label, count]) => ({ label, count, status: Object.entries(STATUS_LABELS).find(([, v]) => v === label)?.[0] as AppStatus }))
      .sort((a, b) => b.count - a.count);
  }, [demandes]);

  const maxCount = Math.max(...data.map(d => d.count), 1);
  const total = demandes.length;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-gray-900 dark:text-white">Demandes par statut</h3>
        </div>
        <span className="text-sm text-gray-500">{total} total</span>
      </div>
      
      <div className="space-y-3">
        {data.map(({ label, count, status }) => (
          <div key={label} className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400 flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${STATUS_COLORS[status] || 'bg-gray-400'}`} />
                {label}
              </span>
              <span className="font-medium text-gray-900 dark:text-white">{count}</span>
            </div>
            <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${STATUS_COLORS[status] || 'bg-primary'}`}
                style={{ width: `${(count / maxCount) * 100}%` }}
              />
            </div>
          </div>
        ))}
        {data.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-4">Aucune donnée disponible</p>
        )}
      </div>
    </div>
  );
}