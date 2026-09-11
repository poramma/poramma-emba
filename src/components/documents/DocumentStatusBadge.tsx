// src/components/documents/DocumentStatusBadge.tsx

import React from 'react';
import { 
  Upload, Clock, CheckCircle, XCircle, AlertTriangle, 
  FileText, Eye, Download, Trash2
} from 'lucide-react';
import { Badge } from '../ui/badge';
import { DocStatus } from '../../types/etudiant';

interface DocumentStatusBadgeProps {
  status: DocStatus;
  size?: 'sm' | 'md';
  showLabel?: boolean;
}

const STATUS_CONFIG: Record<DocStatus, {
  color: 'success' | 'warning' | 'error' | 'info' | 'gray';
  icon: React.ReactNode;
  label: string;
}> = {
  [DocStatus.UPLOADED]: {
    color: 'gray',
    icon: <Upload className="w-3 h-3" />,
    label: 'Téléversé',
  },
  [DocStatus.IN_REVIEW]: {
    color: 'info',
    icon: <Clock className="w-3 h-3" />,
    label: 'En cours',
  },
  [DocStatus.ACCEPTED]: {
    color: 'success',
    icon: <CheckCircle className="w-3 h-3" />,
    label: 'Validé',
  },
  [DocStatus.REJECTED]: {
    color: 'error',
    icon: <XCircle className="w-3 h-3" />,
    label: 'Rejeté',
  },
  [DocStatus.EXPIRED]: {
    color: 'warning',
    icon: <AlertTriangle className="w-3 h-3" />,
    label: 'Expiré',
  },
};

export const DocumentStatusBadge: React.FC<DocumentStatusBadgeProps> = ({
  status,
  size = 'md',
  showLabel = true,
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
      {showLabel ? config.label : null}
    </Badge>
  );
};

export default DocumentStatusBadge;