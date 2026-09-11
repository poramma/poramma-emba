// src/components/communication/CampagneStatusBadge.tsx

import React from 'react';
import { 
  Clock, Calendar, Send, CheckCircle, XCircle, 
  AlertCircle, Ban, Loader2
} from 'lucide-react';
import { Badge } from '../ui/badge';
import { CampagneStatus } from '../../types/communication';

interface CampagneStatusBadgeProps {
  status: CampagneStatus;
  size?: 'sm' | 'md';
}

const STATUS_CONFIG: Record<CampagneStatus, {
  color: 'gray' | 'blue' | 'success' | 'error' | 'warning';
  icon: React.ReactNode;
  label: string;
}> = {
  [CampagneStatus.DRAFT]: {
    color: 'gray',
    icon: <Clock className="w-3 h-3" />,
    label: 'Brouillon',
  },
  [CampagneStatus.SCHEDULED]: {
    color: 'blue',
    icon: <Calendar className="w-3 h-3" />,
    label: 'Programmée',
  },
  [CampagneStatus.SENDING]: {
    color: 'blue',
    icon: <Loader2 className="w-3 h-3 animate-spin" />,
    label: 'Envoi en cours',
  },
  [CampagneStatus.SENT]: {
    color: 'success',
    icon: <CheckCircle className="w-3 h-3" />,
    label: 'Envoyée',
  },
  [CampagneStatus.FAILED]: {
    color: 'error',
    icon: <XCircle className="w-3 h-3" />,
    label: 'Échec',
  },
  [CampagneStatus.CANCELLED]: {
    color: 'gray',
    icon: <Ban className="w-3 h-3" />,
    label: 'Annulée',
  },
};

export const CampagneStatusBadge: React.FC<CampagneStatusBadgeProps> = ({
  status,
  size = 'md',
}) => {
  const config = STATUS_CONFIG[status];

  if (!config) {
    return (
      <Badge color="gray" variant="light" size={size}>
        Inconnu
      </Badge>
    );
  }

  return (
    <Badge 
      color={config.color} 
      variant="light" 
      size={size}
      startIcon={config.icon}
    >
      {config.label}
    </Badge>
  );
};

export default CampagneStatusBadge;