// src/components/rendez-vous/DayDetailsModal.tsx

import React, { useState } from 'react';
import { 
  Calendar, Clock, User, CheckCircle, XCircle, AlertCircle, 
  Eye, ChevronDown, ChevronUp, Calendar as CalendarIcon
} from 'lucide-react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Modal } from '../ui/modal';
import { formatDateFR, formatDateTime } from '../../lib/date';
import { RDVStatus, RDVType, RendezVous } from '../../types/rendez-vous';

interface DayDetail {
  date: string;
  rdvs: RendezVous[];
  stats: {
    total: number;
    confirmed: number;
    inProgress: number;
    completed: number;
    urgent: number;
    pending: number;
    cancelled: number;
    missed: number;
  };
  isFerie: { isFerie: boolean; name?: string };
  isWeekend: boolean;
  isToday: boolean;
}

interface DayDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  dayDetail: DayDetail | null;
  onViewDay: (date: string) => void;
  onRdvClick?: (rdvId: string) => void;
}

export const DayDetailsModal: React.FC<DayDetailsModalProps> = ({
  isOpen,
  onClose,
  dayDetail,
  onViewDay,
  onRdvClick,
}) => {
  const [expandedRdv, setExpandedRdv] = useState<string | null>(null);

  if (!dayDetail) return null;

  const getStatusBadge = (status: RDVStatus) => {
    const config = {
      [RDVStatus.PENDING]: { color: 'warning' as const, text: 'En attente', icon: Clock },
      [RDVStatus.CONFIRMED]: { color: 'success' as const, text: 'Confirmé', icon: CheckCircle },
      [RDVStatus.CHECKED_IN]: { color: 'info' as const, text: 'Présent', icon: User },
      [RDVStatus.IN_PROGRESS]: { color: 'info' as const, text: 'En cours', icon: AlertCircle },
      [RDVStatus.COMPLETED]: { color: 'success' as const, text: 'Terminé', icon: CheckCircle },
      [RDVStatus.MISSED]: { color: 'error' as const, text: 'Absent', icon: XCircle },
      [RDVStatus.NO_SHOW]: { color: 'error' as const, text: 'Non présent', icon: XCircle },
      [RDVStatus.CANCELLED_BY_USER]: { color: 'error' as const, text: 'Annulé (user)', icon: XCircle },
      [RDVStatus.CANCELLED_BY_AGENT]: { color: 'error' as const, text: 'Annulé (agent)', icon: XCircle },
    };
    return config[status] || { color: 'gray' as const, text: status, icon: Clock };
  };

  const getTypeBadge = (type: RDVType) => {
    const config = {
      [RDVType.STANDARD]: { color: 'primary' as const, text: 'Standard' },
      [RDVType.URGENCE]: { color: 'error' as const, text: 'URGENCE' },
      [RDVType.PRIORITAIRE]: { color: 'warning' as const, text: 'Prioritaire' },
      [RDVType.SUIVI]: { color: 'info' as const, text: 'Suivi' },
    };
    return config[type] || { color: 'gray' as const, text: type };
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      titleComponent={
        <div className="flex items-center gap-3">
          <Calendar className="w-5 h-5 text-brand-500" />
          <span>{formatDateFR(dayDetail.date)}</span>
          {dayDetail.isFerie.isFerie && (
            <Badge color="error" variant="solid">
              🎉 {dayDetail.isFerie.name}
            </Badge>
          )}
          {dayDetail.isWeekend && (
            <Badge color="warning" variant="light">
              Weekend
            </Badge>
          )}
          {dayDetail.isToday && (
            <Badge color="primary" variant="solid">
              Aujourd'hui
            </Badge>
          )}
        </div>
      }
      size="lg"
    >
      <div className="space-y-6">
        {/* Statistiques du jour */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="p-3 text-center bg-gray-50 dark:bg-gray-800">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {dayDetail.stats.total}
            </div>
            <div className="text-xs text-gray-500">Total</div>
          </Card>
          <Card className="p-3 text-center bg-green-50 dark:bg-green-900/20">
            <div className="text-2xl font-bold text-green-600">
              {dayDetail.stats.confirmed}
            </div>
            <div className="text-xs text-gray-500">Confirmés</div>
          </Card>
          <Card className="p-3 text-center bg-blue-50 dark:bg-blue-900/20">
            <div className="text-2xl font-bold text-blue-600">
              {dayDetail.stats.inProgress}
            </div>
            <div className="text-xs text-gray-500">En cours</div>
          </Card>
          <Card className="p-3 text-center bg-red-50 dark:bg-red-900/20">
            <div className="text-2xl font-bold text-red-600">
              {dayDetail.stats.urgent}
            </div>
            <div className="text-xs text-gray-500">Urgents</div>
          </Card>
        </div>

        {/* Liste des rendez-vous */}
        {dayDetail.rdvs.length > 0 ? (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {dayDetail.rdvs.map((rdv) => {
              const statusConfig = getStatusBadge(rdv.status);
              const typeConfig = getTypeBadge(rdv.type);
              const StatusIcon = statusConfig.icon;
              const isExpanded = expandedRdv === rdv.id;

              return (
                <Card
                  key={rdv.id}
                  className={`p-4 transition-all ${isExpanded ? 'border-brand-300 shadow-md' : 'hover:shadow-md'}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center text-brand-600 font-bold text-sm">
                          {rdv.user?.profile?.firstName?.charAt(0) || '?'}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">
                            {rdv.user?.profile?.firstName} {rdv.user?.profile?.lastName}
                          </div>
                          <div className="text-sm text-gray-500">{rdv.user?.profile?.inue}</div>
                        </div>
                      </div>

                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <Badge color={typeConfig.color} variant="light">
                          {typeConfig.text}
                        </Badge>
                        <Badge color={statusConfig.color} variant="light" startIcon={<StatusIcon className="w-3 h-3" />}>
                          {statusConfig.text}
                        </Badge>
                        {rdv.isUrgent && (
                          <Badge color="error" variant="solid">URGENT</Badge>
                        )}
                        <span className="text-sm text-gray-400">•</span>
                        <span className="text-sm text-gray-500">{rdv.ticketId}</span>
                      </div>

                      {rdv.slot && (
                        <div className="mt-2 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                          <Clock className="w-4 h-4" />
                          {rdv.slot.startTime} - {rdv.slot.endTime}
                        </div>
                      )}

                      {rdv.motif && (
                        <div className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                          {rdv.motif}
                        </div>
                      )}

                      {rdv.urgenceJustification && (
                        <div className="mt-1 p-2 bg-red-50 dark:bg-red-900/20 rounded text-sm text-red-700 dark:text-red-300">
                          <AlertCircle className="w-4 h-4 inline mr-1" />
                          {rdv.urgenceJustification}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col items-end gap-2 ml-4">
                      <Button
                        size="xs"
                        variant="ghost"
                        onClick={() => {
                          if (onRdvClick) onRdvClick(rdv.id);
                          onClose();
                        }}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        size="xs"
                        variant="ghost"
                        onClick={() => setExpandedRdv(isExpanded ? null : rdv.id)}
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>

                  {/* Détails étendus */}
                  {isExpanded && (
                    <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 space-y-2">
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-gray-500">Agent:</span>
                          <span className="ml-2 text-gray-900 dark:text-white">
                            {rdv.agent?.user?.profile?.firstName} {rdv.agent?.user?.profile?.lastName}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500">Créé le:</span>
                          <span className="ml-2 text-gray-900 dark:text-white">
                            {formatDateTime(rdv.createdAt)}
                          </span>
                        </div>
                        {rdv.checkedInAt && (
                          <div>
                            <span className="text-gray-500">Arrivée:</span>
                            <span className="ml-2 text-gray-900 dark:text-white">
                              {formatDateTime(rdv.checkedInAt)}
                            </span>
                          </div>
                        )}
                        {rdv.completedAt && (
                          <div>
                            <span className="text-gray-500">Terminé:</span>
                            <span className="ml-2 text-gray-900 dark:text-white">
                              {formatDateTime(rdv.completedAt)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8">
            <CalendarIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Aucun rendez-vous
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              Aucun rendez-vous prévu pour cette date.
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button variant="ghost" onClick={onClose}>
            Fermer
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              onClose();
              onViewDay(dayDetail.date);
            }}
          >
            Voir la journée
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default DayDetailsModal;