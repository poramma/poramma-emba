// src/components/communication/detail/CampagneStatsPanel.tsx

import React, { useState, useEffect } from 'react';
import { 
  Eye, MousePointer, XCircle, Clock, Calendar,
} from 'lucide-react';
import { Card } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { Progress } from '../../ui/progress';
import { CampagneStats, CampagneStatus } from '../../../types/communication';
import { useCommunication } from '../../../hooks/useCommunication';

interface CampagneStatsPanelProps {
  stats: CampagneStats;
  status: CampagneStatus;
  campagneId?: string;
}

export const CampagneStatsPanel: React.FC<CampagneStatsPanelProps> = ({
  stats,
  status,
  campagneId,
}) => {
  const { fetchDeliveries, deliveries } = useCommunication();
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (status === CampagneStatus.SENDING && campagneId) {
      fetchDeliveries(campagneId);
    }
  }, [status, campagneId]);

  useEffect(() => {
    if (status === CampagneStatus.SENDING && stats.totalRecipients > 0) {
      const sent = deliveries.filter(d => d.status !== 'QUEUED').length;
      const pct = Math.round((sent / stats.totalRecipients) * 100);
      setProgress(Math.min(pct, 100));
    }
  }, [deliveries, stats.totalRecipients, status]);

  if (status === CampagneStatus.DRAFT || status === CampagneStatus.SCHEDULED) {
    return (
      <Card className="p-6 text-center">
        <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          {status === CampagneStatus.DRAFT ? 'Campagne en brouillon' : 'Campagne programmée'}
        </h4>
        <p className="text-gray-500 dark:text-gray-400">
          Les statistiques seront disponibles après l'envoi.
        </p>
        {status === CampagneStatus.SCHEDULED && stats.totalRecipients > 0 && (
          <Badge color="primary" variant="light" className="mt-2">
            {stats.totalRecipients} destinataires
          </Badge>
        )}
      </Card>
    );
  }

  if (status === CampagneStatus.SENDING) {
    return (
      <div className="space-y-4">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                Envoi en cours
              </h4>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {stats.totalRecipients} destinataires
              </p>
            </div>
            <Badge color="blue" variant="solid" className="animate-pulse">
              <Clock className="w-3 h-3 mr-1" />
              En cours...
            </Badge>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Progression</span>
              <span className="font-medium text-gray-900 dark:text-white">{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </Card>
      </div>
    );
  }

  if (status === CampagneStatus.SENT || status === CampagneStatus.FAILED) {
    return (
      <div className="space-y-4">
        {/* Métriques */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {stats.totalRecipients}
            </div>
            <div className="text-sm text-gray-500">Destinataires</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              {stats.delivered}
            </div>
            <div className="text-sm text-gray-500">Livrés</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">
              {stats.opened}
            </div>
            <div className="text-sm text-gray-500">Ouverts</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">
              {stats.clicked}
            </div>
            <div className="text-sm text-gray-500">Cliqués</div>
          </Card>
        </div>

        {/* Taux */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Taux d'ouverture</p>
                <p className={`text-2xl font-bold ${
                  stats.openRate > 60 ? 'text-green-600' : 'text-orange-600'
                }`}>
                  {stats.openRate}%
                </p>
              </div>
              <div className={`p-3 rounded-lg ${
                stats.openRate > 60 
                  ? 'bg-green-100 dark:bg-green-900/30' 
                  : 'bg-orange-100 dark:bg-orange-900/30'
              }`}>
                <Eye className={`w-6 h-6 ${
                  stats.openRate > 60 
                    ? 'text-green-600 dark:text-green-400' 
                    : 'text-orange-600 dark:text-orange-400'
                }`} />
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Taux de clic</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.clickRate}%
                </p>
              </div>
              <div className="p-3 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                <MousePointer className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Taux d'échec</p>
                <p className={`text-2xl font-bold ${
                  stats.failed > 10 ? 'text-red-600' : 'text-gray-900 dark:text-white'
                }`}>
                  {stats.totalRecipients > 0 
                    ? Math.round((stats.failed / stats.totalRecipients) * 100) 
                    : 0}%
                </p>
              </div>
              <div className={`p-3 rounded-lg ${
                stats.failed > 10 
                  ? 'bg-red-100 dark:bg-red-900/30' 
                  : 'bg-gray-100 dark:bg-gray-700'
              }`}>
                <XCircle className={`w-6 h-6 ${
                  stats.failed > 10 
                    ? 'text-red-600 dark:text-red-400' 
                    : 'text-gray-400'
                }`} />
              </div>
            </div>
          </Card>
        </div>

        {/* Graphique en entonnoir */}
        <Card className="p-4">
          <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
            Entonnoir de conversion
          </h5>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600 dark:text-gray-300">Envoyés</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {stats.sent || stats.totalRecipients}
                </span>
              </div>
              <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full">
                <div className="h-2 bg-blue-500 rounded-full" style={{ width: '100%' }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600 dark:text-gray-300">Livrés</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {stats.delivered}
                </span>
              </div>
              <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full">
                <div 
                  className="h-2 bg-green-500 rounded-full" 
                  style={{ 
                    width: stats.sent > 0 
                      ? `${(stats.delivered / (stats.sent || stats.totalRecipients)) * 100}%` 
                      : '0%' 
                  }} 
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600 dark:text-gray-300">Ouverts</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {stats.opened}
                </span>
              </div>
              <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full">
                <div 
                  className="h-2 bg-yellow-500 rounded-full" 
                  style={{ 
                    width: stats.sent > 0 
                      ? `${(stats.opened / (stats.sent || stats.totalRecipients)) * 100}%` 
                      : '0%' 
                  }} 
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600 dark:text-gray-300">Cliqués</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {stats.clicked}
                </span>
              </div>
              <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full">
                <div 
                  className="h-2 bg-purple-500 rounded-full" 
                  style={{ 
                    width: stats.sent > 0 
                      ? `${(stats.clicked / (stats.sent || stats.totalRecipients)) * 100}%` 
                      : '0%' 
                  }} 
                />
              </div>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return null;
};

export default CampagneStatsPanel;