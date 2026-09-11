// ============================================================
// src/components/demandes/DemandeList.tsx
// ============================================================

import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDemandes } from '../../hooks/useDemandes';
import { useAuth } from '../../hooks/useAuth';
import { AppStatus, Priority } from '../../types/demande';
import { Badge } from '../ui/badge';
import { Skeleton } from '../ui/skeleton';
import { EmptyState } from '../ui/emptyState';
import { FileText, AlertTriangle, Clock, CheckCircle, XCircle, Eye } from 'lucide-react';

const STATUS_CONFIG: Record<AppStatus, { label: string; color: string; icon: React.ElementType }> = {
  [AppStatus.DRAFT]: { label: 'Brouillon', color: 'bg-gray-100 text-gray-700', icon: FileText },
  [AppStatus.SUBMITTED]: { label: 'Soumise', color: 'bg-blue-100 text-blue-700', icon: FileText },
  [AppStatus.IN_REVIEW]: { label: 'En examen', color: 'bg-amber-100 text-amber-700', icon: Clock },
  [AppStatus.ADDITIONAL_INFO_REQUIRED]: { label: 'Infos manquantes', color: 'bg-orange-100 text-orange-700', icon: AlertTriangle },
  [AppStatus.UNDER_VERIFICATION]: { label: 'Vérification', color: 'bg-purple-100 text-purple-700', icon: Clock },
  [AppStatus.APPROVED]: { label: 'Approuvée', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle },
  [AppStatus.REJECTED]: { label: 'Rejetée', color: 'bg-red-100 text-red-700', icon: XCircle },
  [AppStatus.COMPLETED]: { label: 'Traitée', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  [AppStatus.CANCELLED]: { label: 'Annulée', color: 'bg-gray-100 text-gray-500', icon: XCircle },
  [AppStatus.ARCHIVED]: { label: 'Archivée', color: 'bg-gray-100 text-gray-400', icon: FileText },
};

const PRIORITY_CONFIG: Record<Priority, { label: string; color: string }> = {
  [Priority.LOW]: { label: 'Basse', color: 'bg-gray-100 text-gray-600' },
  [Priority.NORMAL]: { label: 'Normale', color: 'bg-blue-100 text-blue-600' },
  [Priority.HIGH]: { label: 'Haute', color: 'bg-amber-100 text-amber-600' },
  [Priority.URGENT]: { label: 'Urgente', color: 'bg-red-100 text-red-600 animate-pulse' },
};

interface DemandeListProps {
  onSelectDemande?: (id: string) => void;
}

export const DemandeList: React.FC<DemandeListProps> = ({ onSelectDemande }) => {
  const navigate = useNavigate();
  const { demandes, isLoading, error, fetchDemandes, setSelectedDemande } = useDemandes();
  const { can } = useAuth();

  useEffect(() => {
    fetchDemandes();
  }, [fetchDemandes]);

  const handleSelect = (id: string) => {
    setSelectedDemande(demandes.find(d => d.id === id) || null);
    onSelectDemande?.(id);
    navigate(`/demandes/${id}`);
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <EmptyState
        icon={AlertTriangle}
        title="Erreur de chargement"
        description={error}
        action={{ label: 'Réessayer', onClick: fetchDemandes }}
      />
    );
  }

  if (demandes.length === 0) {
    return (
      <EmptyState
        icon={FileText}
        title="Aucune demande"
        description="Aucune demande ne correspond à vos critères."
      />
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
      {/* Header desktop */}
      <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 bg-gray-50 dark:bg-gray-700/50 text-xs font-medium text-gray-500 uppercase tracking-wider">
        <div className="col-span-2">Dossier</div>
        <div className="col-span-3">Demandeur</div>
        <div className="col-span-2">Service</div>
        <div className="col-span-2">Statut</div>
        <div className="col-span-1">Priorité</div>
        <div className="col-span-1 text-right">Action</div>
      </div>

      {/* Liste */}
      <div className="divide-y divide-gray-100 dark:divide-gray-700">
        {demandes.map((demande) => {
          const statusConfig = STATUS_CONFIG[demande.status];
          const priorityConfig = PRIORITY_CONFIG[demande.priority];
          const StatusIcon = statusConfig.icon;
          const isOverdue = demande.deadlineAt && new Date(demande.deadlineAt) < new Date() && demande.status !== AppStatus.COMPLETED;

          return (
            <div
              key={demande.id}
              onClick={() => handleSelect(demande.id)}
              className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors cursor-pointer group"
            >
              {/* Dossier */}
              <div className="md:col-span-2">
                <span className="font-mono text-sm font-medium text-primary">
                  {demande.dossierNumber}
                </span>
                <p className="text-xs text-gray-400 md:hidden">
                  {new Date(demande.createdAt).toLocaleDateString('fr-FR')}
                </p>
              </div>

              {/* Demandeur */}
              <div className="md:col-span-3">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {demande.user.profile?.firstName} {demande.user.profile?.lastName}
                </p>
                <p className="text-xs text-gray-500">
                  INUE: {demande.user.profile?.inue || 'N/A'}
                </p>
              </div>

              {/* Service */}
              <div className="md:col-span-2">
                <p className="text-sm text-gray-700 dark:text-gray-300 truncate">
                  {demande.subService.name}
                </p>
                <p className="text-xs text-gray-400">
                  {demande.totalAmount ? `${demande.totalAmount} ${demande.currency}` : 'Gratuit'}
                </p>
              </div>

              {/* Statut */}
              <div className="md:col-span-2">
                <Badge className={`${statusConfig.color} border-0`}>
                  <StatusIcon className="h-3 w-3 mr-1" />
                  {statusConfig.label}
                </Badge>
              </div>

              {/* Priorité */}
              <div className="md:col-span-1">
                <Badge className={`${priorityConfig.color} border-0 text-xs`}>
                  {priorityConfig.label}
                </Badge>
              </div>

              {/* Action */}
              <div className="md:col-span-1 flex justify-end">
                <button aria-label="Voir la demande" className="p-2 text-gray-400 hover:text-primary transition-colors opacity-0 group-hover:opacity-100">
                  <Eye className="h-4 w-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};