// ============================================================
// src/components/dashboard/ActiviteRecente.tsx
// ============================================================

import { useEffect } from 'react';
import { useDemandeStore } from '../../store/demandeStore';
import { useRendezVousStore } from '../../store/rendezVousStore';
import { FileText, Calendar, UserCheck, AlertCircle, Clock } from 'lucide-react';
import { formatDateShort } from '../../lib/date';
import { AppStatus, Demande } from '../../types/demande';
import { RDVType, RDVStatus, RendezVous } from '../../types/rendez-vous';

type ActiviteType = 'DEMANDE' | 'RENDEZ_VOUS' | 'VALIDATION' | 'URGENCE' | 'TRAITEMENT';

interface Activite {
  id: string;
  type: ActiviteType;
  titre: string;
  description: string;
  date: string;
  lien?: string;
}

const icons: Record<ActiviteType, React.ElementType> = {
  DEMANDE: FileText,
  RENDEZ_VOUS: Calendar,
  VALIDATION: UserCheck,
  URGENCE: AlertCircle,
  TRAITEMENT: Clock,
};

const colors: Record<ActiviteType, string> = {
  DEMANDE: 'text-blue-600 bg-blue-50',
  RENDEZ_VOUS: 'text-green-600 bg-green-50',
  VALIDATION: 'text-emerald-600 bg-emerald-50',
  URGENCE: 'text-red-600 bg-red-50',
  TRAITEMENT: 'text-amber-600 bg-amber-50',
};

function getDemandeType(demande: Demande): ActiviteType {
  if (demande.priority === 'URGENT' || demande.priority === 'HIGH') return 'URGENCE';
  if (demande.status === AppStatus.APPROVED || demande.status === AppStatus.COMPLETED) return 'VALIDATION';
  if (demande.status === AppStatus.IN_REVIEW || demande.status === AppStatus.UNDER_VERIFICATION) return 'TRAITEMENT';
  return 'DEMANDE';
}

function getRdvType(rdv: RendezVous): ActiviteType {
  if (rdv.type === RDVType.URGENCE) return 'URGENCE';
  if (rdv.status === RDVStatus.COMPLETED) return 'VALIDATION';
  return 'RENDEZ_VOUS';
}

export function ActiviteRecente() {
  const { demandes, fetchDemandes } = useDemandeStore();
  const { rendezVous, fetchRendezVous } = useRendezVousStore();

  useEffect(() => {
    fetchDemandes();
    fetchRendezVous({});
  }, [fetchDemandes, fetchRendezVous]);

  const activites: Activite[] = [
    ...demandes.map(d => ({
      id: `dem-${d.id}`,
      type: getDemandeType(d),
      titre: `${d.subService.name} — ${d.user.profile?.firstName} ${d.user.profile?.lastName}`,
      description: `Statut: ${d.status} • Dossier: ${d.dossierNumber}`,
      date: d.updatedAt,
      lien: `/demandes/${d.id}`,
    })),
    ...rendezVous.map(r => ({
      id: `rdv-${r.id}`,
      type: getRdvType(r),
      titre: `${r.type === RDVType.URGENCE ? 'Urgence' : 'RDV'} — ${r.user.profile?.firstName} ${r.user.profile?.lastName}`,
      description: `Ticket: ${r.ticketId} • ${r.motif || 'Sans motif'}`,
      date: r.updatedAt,
      lien: `/rendez-vous`,
    })),
  ]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 10);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900 dark:text-white">Activité récente</h3>
        <span className="text-xs text-gray-500">{activites.length} événements</span>
      </div>
      
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {activites.map((act) => {
          const Icon = icons[act.type];
          const colorClass = colors[act.type];
          
          return (
            <a
              key={act.id}
              href={act.lien}
              className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group"
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${colorClass}`}>
                <Icon className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate group-hover:text-primary transition-colors">
                  {act.titre}
                </p>
                <p className="text-xs text-gray-500">{act.description}</p>
              </div>
              <span className="text-xs text-gray-400 shrink-0">
                {formatDateShort(act.date)}
              </span>
            </a>
          );
        })}
        
        {activites.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-4">Aucune activité récente</p>
        )}
      </div>
    </div>
  );
}

