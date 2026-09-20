// src/components/communication/detail/CampagneDetailHeader.tsx

import React from 'react';
import { 
  Users, User, Clock, Edit, Copy, 
  XCircle, AlertCircle, ChevronLeft
} from 'lucide-react';
import { Card } from '../../ui/card';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { CampagneStatusBadge } from '../CampagneStatusBadge';
import { CampagneTypeBadge } from '../CampagneTypeBadge';
import { Campagne, CampagneStatus } from '../../../types/communication';
import { formatDateShort } from '../../../lib/date';

interface CampagneDetailHeaderProps {
  campagne: Campagne;
  onDuplicate: () => Promise<void>;
  onCancel: () => Promise<void>;
  onEdit: () => void;
  onBack: () => void;
}

export const CampagneDetailHeader: React.FC<CampagneDetailHeaderProps> = ({
  campagne,
  onDuplicate,
  onCancel,
  onEdit,
  onBack,
}) => {
  const getStatusActions = () => {
    switch (campagne.status) {
      case CampagneStatus.DRAFT:
        return (
          <>
            <Button variant="outline" onClick={onEdit}>
              <Edit className="w-4 h-4 mr-2" />
              Modifier
            </Button>
            <Button variant="outline" onClick={onDuplicate}>
              <Copy className="w-4 h-4 mr-2" />
              Dupliquer
            </Button>
          </>
        );
      case CampagneStatus.SCHEDULED:
        return (
          <>
            <Button variant="outline" onClick={onEdit}>
              <Edit className="w-4 h-4 mr-2" />
              Modifier
            </Button>
            <Button variant="outline" onClick={onDuplicate}>
              <Copy className="w-4 h-4 mr-2" />
              Dupliquer
            </Button>
            <Button variant="error" onClick={onCancel}>
              <XCircle className="w-4 h-4 mr-2" />
              Annuler
            </Button>
          </>
        );
      case CampagneStatus.SENT:
        return (
          <Button variant="outline" onClick={onDuplicate}>
            <Copy className="w-4 h-4 mr-2" />
            Dupliquer
          </Button>
        );
      case CampagneStatus.FAILED:
        return (
          <>
            <Button variant="outline" onClick={onDuplicate}>
              <Copy className="w-4 h-4 mr-2" />
              Dupliquer
            </Button>
            {campagne.stats?.failed > 0 && (
              <Badge color="error" variant="light" className="ml-2">
                <AlertCircle className="w-3 h-3 mr-1" />
                {campagne.stats.failed} échec{campagne.stats.failed > 1 ? 's' : ''}
              </Badge>
            )}
          </>
        );
      default:
        return (
          <Button variant="outline" onClick={onDuplicate}>
            <Copy className="w-4 h-4 mr-2" />
            Dupliquer
          </Button>
        );
    }
  };

  const getDateLabel = () => {
    if (campagne.status === CampagneStatus.SENT && campagne.sentAt) {
      return `Envoyée le ${formatDateShort(campagne.sentAt)}`;
    }
    if (campagne.status === CampagneStatus.SCHEDULED && campagne.scheduledAt) {
      return `Programmée le ${formatDateShort(campagne.scheduledAt)}`;
    }
    return `Créée le ${formatDateShort(campagne.createdAt)}`;
  };

  return (
    <Card className="p-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex-1">
          {/* Retour */}
          <Button variant="ghost" size="sm" onClick={onBack} className="mb-3 -ml-2">
            <ChevronLeft className="w-4 h-4 mr-1" />
            Retour aux campagnes
          </Button>

          {/* Titre et badges */}
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {campagne.title}
            </h1>
            <CampagneStatusBadge status={campagne.status} />
            <CampagneTypeBadge type={campagne.type} />
          </div>

          {/* Métadonnées */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-sm text-gray-500 dark:text-gray-400">
            <span className="flex items-center gap-1">
              <User className="w-4 h-4" />
              {campagne.sentByUser?.profile
                ? [campagne.sentByUser.profile.firstName, campagne.sentByUser.profile.lastName].filter(Boolean).join(' ')
                : 'Créateur inconnu'}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {getDateLabel()}
            </span>
            {campagne.stats?.totalRecipients > 0 && (
              <>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  {campagne.stats.totalRecipients} destinataires
                </span>
              </>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-2">
          {getStatusActions()}
        </div>
      </div>
    </Card>
  );
};

export default CampagneDetailHeader;