// ============================================================
// src/components/dashboard/StatsCards.tsx
// ============================================================

import { useEffect } from 'react';
import { useDemandeStore } from '../../store/demandeStore';
import { useRendezVousStore } from '../../store/rendezVousStore';
import { FileText, Calendar, Clock, AlertTriangle, CheckCircle, Users } from 'lucide-react';
import { AppStatus, Priority } from '../../types/demande';
import { RDVType, RDVStatus } from '../../types/rendez-vous';

export function StatsCards() {
  const { demandes, fetchDemandes } = useDemandeStore();
  const { rendezVous, fetchRendezVous } = useRendezVousStore();

  useEffect(() => {
    fetchDemandes();
    fetchRendezVous({});
  }, [fetchDemandes, fetchRendezVous]);

  const today = new Date().toISOString().split('T')[0];

  const stats = [
    {
      label: 'Demandes en cours',
      value: demandes.filter(d => 
        d.status === AppStatus.IN_REVIEW || 
        d.status === AppStatus.UNDER_VERIFICATION ||
        d.status === AppStatus.ADDITIONAL_INFO_REQUIRED
      ).length,
      icon: FileText,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      label: 'RDV aujourd\'hui',
      value: rendezVous.filter(r => r.createdAt.startsWith(today)).length,
      icon: Calendar,
      color: 'text-green-600',
      bg: 'bg-green-50',
    },
    {
      label: 'En attente',
      value: demandes.filter(d => d.status === AppStatus.SUBMITTED).length,
      icon: Clock,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
    },
    {
      label: 'Urgences',
      value: rendezVous.filter(r => r.type === RDVType.URGENCE).length,
      icon: AlertTriangle,
      color: 'text-red-600',
      bg: 'bg-red-50',
    },
    {
      label: 'Traitées ce mois',
      value: demandes.filter(d => {
        const completed = d.status === AppStatus.COMPLETED;
        const thisMonth = d.completedAt ? d.completedAt.startsWith(today.substring(0, 7)) : false;
        return completed && thisMonth;
      }).length,
      icon: CheckCircle,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
    },
    {
      label: 'Étudiants actifs',
      value: new Set(demandes.map(d => d.userId)).size,
      icon: Users,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow"
        >
          <div className={`w-10 h-10 ${stat.bg} rounded-lg flex items-center justify-center mb-3`}>
            <stat.icon className={`h-5 w-5 ${stat.color}`} />
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
          <p className="text-xs text-gray-500 mt-1">{stat.label}</p>
        </div>
      ))}
    </div>
  );
}