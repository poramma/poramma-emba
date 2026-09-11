// src/components/communication/CampagneTypeBadge.tsx

import React from 'react';
import { 
  Info, AlertTriangle, Calendar, Clipboard, Bell
} from 'lucide-react';
import { Badge } from '../ui/badge';
import { CampagneType } from '../../types/communication';

interface CampagneTypeBadgeProps {
  type: CampagneType;
  size?: 'sm' | 'md';
}

const TYPE_CONFIG: Record<CampagneType, {
  color: 'blue' | 'red' | 'green' | 'violet' | 'orange';
  icon: React.ReactNode;
  label: string;
  isAlert?: boolean;
}> = {
  [CampagneType.INFO]: {
    color: 'blue',
    icon: <Info className="w-3 h-3" />,
    label: 'Information',
  },
  [CampagneType.ALERT]: {
    color: 'red',
    icon: <AlertTriangle className="w-3 h-3" />,
    label: 'Alerte',
    isAlert: true,
  },
  [CampagneType.EVENT]: {
    color: 'green',
    icon: <Calendar className="w-3 h-3" />,
    label: 'Événement',
  },
  [CampagneType.SURVEY]: {
    color: 'violet',
    icon: <Clipboard className="w-3 h-3" />,
    label: 'Enquête',
  },
  [CampagneType.REMINDER]: {
    color: 'orange',
    icon: <Bell className="w-3 h-3" />,
    label: 'Rappel',
  },
};

export const CampagneTypeBadge: React.FC<CampagneTypeBadgeProps> = ({
  type,
  size = 'md',
}) => {
  const config = TYPE_CONFIG[type];

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
      className={config.isAlert ? 'border-2 border-red-300 dark:border-red-700' : ''}
    >
      {config.label}
    </Badge>
  );
};

export default CampagneTypeBadge;