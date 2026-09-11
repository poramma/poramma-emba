// ============================================================
// src/components/dashboard/AlertesUrgentes.tsx
// ============================================================

import { useEffect } from 'react';
import { useRendezVousStore } from '../../store/rendezVousStore';
import { useDemandeStore } from '../../store/demandeStore';
import { AlertTriangle, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Priority, AppStatus } from '../../types/demande';
import { RDVType, RDVStatus } from '../../types/rendez-vous';

interface Alerte {
  id: string;
  type: 'RDV_URGENT' | 'DEMANDE_URGENTE' | 'SLA_DEPASSE';
  message: string;
  detail: string;
  lien: string;
  priority: 'high' | 'critical';
}

export function AlertesUrgentes() {
  const navigate = useNavigate();
  const { rendezVous, fetchRendezVous } = useRendezVousStore();
  const { demandes, fetchDemandes } = useDemandeStore();

  useEffect(() => {
    fetchRendezVous({});
    fetchDemandes();
  }, [fetchRendezVous, fetchDemandes]);

  const now = new Date().toISOString();

  const alertes: Alerte[] = [
    // Urgences RDV non traitées
    ...rendezVous
      .filter(r => r.type === RDVType.URGENCE && r.status !== RDVStatus.COMPLETED)
      .map(r => ({
        id: `rdv-urg-${r.id}`,
        type: 'RDV_URGENT' as const,
        message: `RDV urgent — ${r.user.profile?.firstName} ${r.user.profile?.lastName}`,
        detail: r.urgenceJustification || r.motif || 'Sans justification',
        lien: '/rendez-vous',
        priority: 'critical' as const,
      })),

    // Demandes avec priorité URGENT
    ...demandes
      .filter(d => d.priority === Priority.URGENT && d.status !== AppStatus.COMPLETED && d.status !== AppStatus.REJECTED)
      .map(d => ({
        id: `dem-urg-${d.id}`,
        type: 'DEMANDE_URGENTE' as const,
        message: `Demande urgente — ${d.subService.name}`,
        detail: `Dossier ${d.dossierNumber} • ${d.user.profile?.firstName} ${d.user.profile?.lastName}`,
        lien: `/demandes/${d.id}`,
        priority: 'high' as const,
      })),

    // Demandes avec SLA dépassé
    ...demandes
      .filter(d => d.deadlineAt && d.deadlineAt < now && d.status !== AppStatus.COMPLETED && d.status !== AppStatus.REJECTED)
      .map(d => ({
        id: `dem-sla-${d.id}`,
        type: 'SLA_DEPASSE' as const,
        message: `SLA dépassé — ${d.subService.name}`,
        detail: `Dossier ${d.dossierNumber} • Deadline: ${d.deadlineAt?.split('T')[0]}`,
        lien: `/demandes/${d.id}`,
        priority: 'critical' as const,
      })),
  ].slice(0, 5);

  if (alertes.length === 0) return null;

  return (
    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 animate-in slide-in-from-top-2">
      <div className="flex items-center gap-2 mb-3">
        <AlertTriangle className="h-5 w-5 text-red-600 animate-pulse" />
        <h3 className="font-semibold text-red-800 dark:text-red-200">Alertes urgentes</h3>
        <span className="ml-auto bg-red-600 text-white text-xs px-2 py-0.5 rounded-full font-medium">
          {alertes.length}
        </span>
      </div>
      
      <div className="space-y-2">
        {alertes.map((alerte) => (
          <button
            key={alerte.id}
            onClick={() => navigate(alerte.lien)}
            className={`w-full flex items-center justify-between p-3 rounded-lg 
                       transition-all text-left group
                       ${alerte.priority === 'critical' 
                         ? 'bg-white dark:bg-gray-800 border-l-4 border-red-500 hover:bg-red-50 dark:hover:bg-red-900/30' 
                         : 'bg-white dark:bg-gray-800 border-l-4 border-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20'
                       }`}
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{alerte.message}</p>
              <p className="text-xs text-gray-500 truncate">{alerte.detail}</p>
            </div>
            <ArrowRight className="h-4 w-4 text-red-500 shrink-0 ml-2 group-hover:translate-x-1 transition-transform" />
          </button>
        ))}
      </div>
    </div>
  );
}