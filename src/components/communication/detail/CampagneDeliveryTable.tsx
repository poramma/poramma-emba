// src/components/communication/detail/CampagneDeliveryTable.tsx

import React, { useState } from 'react';
import { 
  CheckCircle, XCircle, Clock, Eye, 
  MousePointer, Search, RefreshCw, Mail
} from 'lucide-react';
import { Card } from '../../ui/card';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Badge } from '../../ui/badge';
import { Table, TableHeader, TableRow, TableBody, TableCell } from '../../ui/table';
import { CampagneDelivery, DeliveryStatus } from '../../../types/communication';
import { formatDateShort, timeAgo } from '../../../lib/date';

interface CampagneDeliveryTableProps {
  deliveries: CampagneDelivery[];
  isLoading?: boolean;
  onResendFailed: () => Promise<void>;
}

const STATUS_CONFIG: Record<DeliveryStatus, { color: 'gray' | 'blue' | 'green' | 'red' | 'orange' | 'violet'; icon: React.ReactNode; label: string }> = {
  [DeliveryStatus.QUEUED]: {
    color: 'gray',
    icon: <Clock className="w-3 h-3" />,
    label: 'En attente',
  },
  [DeliveryStatus.SENT]: {
    color: 'blue',
    icon: <Mail className="w-3 h-3" />,
    label: 'Envoyé',
  },
  [DeliveryStatus.DELIVERED]: {
    color: 'green',
    icon: <CheckCircle className="w-3 h-3" />,
    label: 'Livré',
  },
  [DeliveryStatus.FAILED]: {
    color: 'red',
    icon: <XCircle className="w-3 h-3" />,
    label: 'Échec',
  },
  [DeliveryStatus.OPENED]: {
    color: 'blue',
    icon: <Eye className="w-3 h-3" />,
    label: 'Ouvert',
  },
  [DeliveryStatus.CLICKED]: {
    color: 'violet',
    icon: <MousePointer className="w-3 h-3" />,
    label: 'Cliqué',
  },
};

const STATUS_FILTERS = [
  { value: 'all', label: 'Tous' },
  { value: DeliveryStatus.DELIVERED, label: 'Livrés' },
  { value: DeliveryStatus.OPENED, label: 'Ouverts' },
  { value: DeliveryStatus.FAILED, label: 'Échecs' },
];

export const CampagneDeliveryTable: React.FC<CampagneDeliveryTableProps> = ({
  deliveries,
  isLoading = false,
  onResendFailed,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isResending, setIsResending] = useState(false);

  const failedDeliveries = deliveries.filter(d => d.status === DeliveryStatus.FAILED);
  const hasFailedDeliveries = failedDeliveries.length > 0;

  const filteredDeliveries = deliveries.filter(d => {
    if (searchQuery && !d.userName?.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (statusFilter !== 'all' && d.status !== statusFilter) return false;
    return true;
  });

  const handleResendFailed = async () => {
    if (!window.confirm(`Relancer les ${failedDeliveries.length} envois en échec ?`)) return;
    
    setIsResending(true);
    try {
      await onResendFailed();
    } finally {
      setIsResending(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="p-4">
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-3 animate-pulse">
              <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-2"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
              </div>
              <div className="w-20 h-6 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
          ))}
        </div>
      </Card>
    );
  }

  if (deliveries.length === 0) {
    return (
      <Card className="p-8 text-center">
        <Mail className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          Aucune livraison enregistrée
        </h4>
        <p className="text-gray-500 dark:text-gray-400">
          Les données de livraison apparaîtront après l'envoi de la campagne.
        </p>
      </Card>
    );
  }

  return (
    <Card>
      {/* En-tête */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Livraisons ({deliveries.length})
            </h5>
            {hasFailedDeliveries && (
              <Badge color="error" variant="light">
                {failedDeliveries.length} échec{failedDeliveries.length > 1 ? 's' : ''}
              </Badge>
            )}
          </div>
          {hasFailedDeliveries && (
            <Button 
              size="sm" 
              variant="warning" 
              onClick={handleResendFailed}
              disabled={isResending}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isResending ? 'animate-spin' : ''}`} />
              {isResending ? 'Relance en cours...' : `Relancer les échecs (${failedDeliveries.length})`}
            </Button>
          )}
        </div>
      </div>

      {/* Filtres */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex flex-col sm:flex-row gap-3">
          <Input
            placeholder="Rechercher un destinataire..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            startIcon={<Search className="w-4 h-4" />}
            className="flex-1"
          />
          <div className="flex gap-1">
            {STATUS_FILTERS.map((filter) => (
              <button
                key={filter.value}
                className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                  statusFilter === filter.value
                    ? 'bg-brand-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
                onClick={() => setStatusFilter(filter.value)}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tableau */}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableCell isHeader>Destinataire</TableCell>
              <TableCell isHeader>Canal</TableCell>
              <TableCell isHeader>Statut</TableCell>
              <TableCell isHeader>Envoyé</TableCell>
              <TableCell isHeader>Livré</TableCell>
              <TableCell isHeader>Ouvert</TableCell>
              <TableCell isHeader>Cliqué</TableCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredDeliveries.map((delivery) => {
              const statusConfig = STATUS_CONFIG[delivery.status];
              
              return (
                <TableRow key={delivery.id}>
                  <TableCell>
                    <div className="font-medium text-gray-900 dark:text-white">
                      {delivery.userName || 'Utilisateur inconnu'}
                    </div>
                    <div className="text-xs text-gray-400">{delivery.userId}</div>
                  </TableCell>
                  <TableCell>
                    <Badge color="gray" variant="light" size="xs">
                      {delivery.channel}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      color={statusConfig.color} 
                      variant="light" 
                      size="xs"
                      startIcon={statusConfig.icon}
                    >
                      {statusConfig.label}
                    </Badge>
                    {delivery.errorMessage && (
                      <div className="mt-1 text-xs text-red-500 truncate max-w-xs" title={delivery.errorMessage}>
                        {delivery.errorMessage}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-gray-500">
                    {delivery.sentAt ? formatDateShort(delivery.sentAt) : '—'}
                  </TableCell>
                  <TableCell className="text-sm text-gray-500">
                    {delivery.deliveredAt ? formatDateShort(delivery.deliveredAt) : '—'}
                  </TableCell>
                  <TableCell className="text-sm text-gray-500">
                    {delivery.openedAt ? formatDateShort(delivery.openedAt) : '—'}
                  </TableCell>
                  <TableCell className="text-sm text-gray-500">
                    {delivery.clickedAt ? formatDateShort(delivery.clickedAt) : '—'}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {filteredDeliveries.length === 0 && (
        <div className="p-8 text-center text-gray-500">
          Aucune livraison ne correspond à vos critères.
        </div>
      )}
    </Card>
  );
};

export default CampagneDeliveryTable;