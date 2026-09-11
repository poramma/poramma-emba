// src/components/rendez-vous/RendezVousCard.tsx

import React, { useState } from 'react';
import { 
  Clock, User, MapPin, Phone, Mail, CheckCircle, XCircle, 
  AlertCircle, Calendar, Shield, MoreVertical, Edit, 
  Trash2, Eye, Send, FileText, ArrowRight
} from 'lucide-react';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { useRendezVous } from '../../hooks/useRendezVous';
import { useAuth } from '../../hooks/useAuth';
import { formatDateShort, formatTime } from '../../lib/date';
import { RDVStatus, RDVType } from '../../types/rendez-vous';
import { RendezVous } from '../../types/rendez-vous';

interface RendezVousCardProps {
  rendezVous: RendezVous;
  onAction?: (action: string, rdv: RendezVous) => void;
  onView?: (rdv: RendezVous) => void;
  compact?: boolean;
  showActions?: boolean;
}

export const RendezVousCard: React.FC<RendezVousCardProps> = ({
  rendezVous,
  onAction,
  onView,
  compact = false,
  showActions = true,
}) => {
  const { user } = useAuth();
  const { updateRendezVousStatus, cancelRendezVous } = useRendezVous();
  const [isLoading, setIsLoading] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const statusConfig = {
    [RDVStatus.PENDING]: { 
      color: 'warning' as const, 
      text: 'En attente', 
      icon: Clock,
      className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
    },
    [RDVStatus.CONFIRMED]: { 
      color: 'success' as const, 
      text: 'Confirmé', 
      icon: CheckCircle,
      className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
    },
    [RDVStatus.CHECKED_IN]: { 
      color: 'info' as const, 
      text: 'Présent', 
      icon: User,
      className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
    },
    [RDVStatus.IN_PROGRESS]: { 
      color: 'info' as const, 
      text: 'En cours', 
      icon: AlertCircle,
      className: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
    },
    [RDVStatus.COMPLETED]: { 
      color: 'success' as const, 
      text: 'Terminé', 
      icon: CheckCircle,
      className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
    },
    [RDVStatus.MISSED]: { 
      color: 'error' as const, 
      text: 'Absent', 
      icon: XCircle,
      className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
    },
    [RDVStatus.NO_SHOW]: { 
      color: 'error' as const, 
      text: 'Non présent', 
      icon: XCircle,
      className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
    },
    [RDVStatus.CANCELLED_BY_USER]: { 
      color: 'error' as const, 
      text: 'Annulé (utilisateur)', 
      icon: XCircle,
      className: 'bg-gray-100 text-gray-800 dark:bg-gray-700/30 dark:text-gray-300'
    },
    [RDVStatus.CANCELLED_BY_AGENT]: { 
      color: 'error' as const, 
      text: 'Annulé (agent)', 
      icon: XCircle,
      className: 'bg-gray-100 text-gray-800 dark:bg-gray-700/30 dark:text-gray-300'
    },
  };

  const typeConfig = {
    [RDVType.STANDARD]: { 
      color: 'primary' as const, 
      text: 'Standard',
      icon: Calendar
    },
    [RDVType.URGENCE]: { 
      color: 'error' as const, 
      text: 'URGENCE',
      icon: AlertCircle
    },
    [RDVType.PRIORITAIRE]: { 
      color: 'warning' as const, 
      text: 'Prioritaire',
      icon: Shield
    },
    [RDVType.SUIVI]: { 
      color: 'info' as const, 
      text: 'Suivi',
      icon: FileText
    },
  };

  const StatusIcon = statusConfig[rendezVous.status]?.icon || Clock;
  const TypeIcon = typeConfig[rendezVous.type]?.icon || Calendar;

  const handleStatusUpdate = async (status: RDVStatus) => {
    setIsLoading(true);
    try {
      await updateRendezVousStatus(rendezVous.id, status);
      if (onAction) onAction('update', rendezVous);
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = async () => {
    const reason = window.prompt('Motif de l\'annulation:');
    if (!reason) return;
    
    setIsLoading(true);
    try {
      await cancelRendezVous(rendezVous.id, reason);
      if (onAction) onAction('cancel', rendezVous);
    } catch (error) {
      console.error('Erreur lors de l\'annulation:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getActionButtons = () => {
    switch (rendezVous.status) {
      case RDVStatus.PENDING:
        return (
          <>
            <Button
              size="sm"
              variant="success"
              onClick={() => handleStatusUpdate(RDVStatus.CONFIRMED)}
              disabled={isLoading}
            >
              <CheckCircle className="w-4 h-4 mr-1" />
              Confirmer
            </Button>
            <Button
              size="sm"
              variant="error"
              onClick={handleCancel}
              disabled={isLoading}
            >
              <XCircle className="w-4 h-4 mr-1" />
              Refuser
            </Button>
          </>
        );
      case RDVStatus.CONFIRMED:
        return (
          <>
            <Button
              size="sm"
              variant="primary"
              onClick={() => handleStatusUpdate(RDVStatus.CHECKED_IN)}
              disabled={isLoading}
            >
              <User className="w-4 h-4 mr-1" />
              Arrivée
            </Button>
            <Button
              size="sm"
              variant="error"
              onClick={handleCancel}
              disabled={isLoading}
            >
              <XCircle className="w-4 h-4 mr-1" />
              Annuler
            </Button>
          </>
        );
      case RDVStatus.CHECKED_IN:
        return (
          <>
            <Button
              size="sm"
              variant="success"
              onClick={() => handleStatusUpdate(RDVStatus.IN_PROGRESS)}
              disabled={isLoading}
            >
              <AlertCircle className="w-4 h-4 mr-1" />
              Démarrer
            </Button>
            <Button
              size="sm"
              variant="error"
              onClick={() => handleStatusUpdate(RDVStatus.NO_SHOW)}
              disabled={isLoading}
            >
              <XCircle className="w-4 h-4 mr-1" />
              Absent
            </Button>
          </>
        );
      case RDVStatus.IN_PROGRESS:
        return (
          <Button
            size="sm"
            variant="success"
            onClick={() => handleStatusUpdate(RDVStatus.COMPLETED)}
            disabled={isLoading}
          >
            <CheckCircle className="w-4 h-4 mr-1" />
            Terminer
          </Button>
        );
      default:
        return null;
    }
  };

  if (compact) {
    return (
      <Card className="p-3 hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center text-brand-600 font-bold text-sm">
              {rendezVous.user.profile?.firstName?.charAt(0) || '?'}
            </div>
            <div>
              <div className="font-medium text-sm text-gray-900 dark:text-white">
                {rendezVous.user.profile?.firstName} {rendezVous.user.profile?.lastName}
              </div>
              <div className="text-xs text-gray-500">{rendezVous.ticketId}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {rendezVous.isUrgent && (
              <Badge color="error" variant="solid" size="xs">URGENT</Badge>
            )}
            <Badge color={statusConfig[rendezVous.status]?.color || 'gray'} variant="light" size="xs">
              {statusConfig[rendezVous.status]?.text}
            </Badge>
            <Button size="xs" variant="ghost" onClick={() => onView?.(rendezVous)}>
              <Eye className="w-3 h-3" />
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4 hover:shadow-md transition-shadow">
      {/* En-tête */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center text-brand-600 font-bold">
            {rendezVous.user.profile?.firstName?.charAt(0) || '?'}
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white">
              {rendezVous.user.profile?.firstName} {rendezVous.user.profile?.lastName}
            </h4>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {rendezVous.user.profile?.inue || 'N/A'} • {rendezVous.user.email}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {rendezVous.isUrgent && (
            <Badge color="error" variant="solid" size="sm">URGENT</Badge>
          )}
          <Badge color={typeConfig[rendezVous.type]?.color || 'gray'} variant="light" startIcon={<TypeIcon className="w-3 h-3" />}>
            {typeConfig[rendezVous.type]?.text}
          </Badge>
          <Badge color={statusConfig[rendezVous.status]?.color || 'gray'} variant="light" startIcon={<StatusIcon className="w-3 h-3" />}>
            {statusConfig[rendezVous.status]?.text}
          </Badge>
        </div>
      </div>

      {/* Détails */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-3 text-sm">
        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
          <Calendar className="w-4 h-4 text-gray-400" />
          {rendezVous.slot ? (
            <span>
              {formatDateShort(rendezVous.slot.date)} • {formatTime(rendezVous.slot.startTime)} - {formatTime(rendezVous.slot.endTime)}
            </span>
          ) : (
            <span className="text-yellow-600">Urgence - sans créneau</span>
          )}
        </div>
        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
          <Shield className="w-4 h-4 text-gray-400" />
          {rendezVous.agent?.user?.profile?.firstName} {rendezVous.agent?.user?.profile?.lastName}
        </div>
        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
          <FileText className="w-4 h-4 text-gray-400" />
          {rendezVous.motif || 'Sans motif'}
        </div>
        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
          <Clock className="w-4 h-4 text-gray-400" />
          Ticket: {rendezVous.ticketId}
        </div>
      </div>

      {/* Notes si présentes */}
      {rendezVous.urgenceJustification && (
        <div className="mb-3 p-2 bg-red-50 dark:bg-red-900/20 rounded-lg text-sm text-red-700 dark:text-red-300">
          <AlertCircle className="w-4 h-4 inline mr-1" />
          {rendezVous.urgenceJustification}
        </div>
      )}

      {/* Actions */}
      {showActions && (
        <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-gray-200 dark:border-gray-700">
          {getActionButtons()}
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowDetails(!showDetails)}
          >
            <Eye className="w-4 h-4 mr-1" />
            {showDetails ? 'Masquer' : 'Détails'}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onView?.(rendezVous)}
          >
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Détails étendus */}
      {showDetails && (
        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 space-y-2">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-gray-500 dark:text-gray-400">Créé par:</span>
              <span className="ml-2 text-gray-900 dark:text-white">{rendezVous.createdBy}</span>
            </div>
            <div>
              <span className="text-gray-500 dark:text-gray-400">Créé le:</span>
              <span className="ml-2 text-gray-900 dark:text-white">
                {new Date(rendezVous.createdAt).toLocaleString()}
              </span>
            </div>
            {rendezVous.checkedInAt && (
              <div>
                <span className="text-gray-500 dark:text-gray-400">Arrivée:</span>
                <span className="ml-2 text-gray-900 dark:text-white">
                  {new Date(rendezVous.checkedInAt).toLocaleString()}
                </span>
              </div>
            )}
            {rendezVous.completedAt && (
              <div>
                <span className="text-gray-500 dark:text-gray-400">Terminé:</span>
                <span className="ml-2 text-gray-900 dark:text-white">
                  {new Date(rendezVous.completedAt).toLocaleString()}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </Card>
  );
};

export default RendezVousCard;