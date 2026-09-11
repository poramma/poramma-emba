// src/components/communication/dashboard/CampagneDashboardStats.tsx

import React, { useMemo } from 'react';
import { 
  Send, Calendar, Eye, MousePointer
} from 'lucide-react';
import { Card } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { Campagne, CampagneStatus } from '../../../types/communication';

interface CampagneDashboardStatsProps {
  campagnes: Campagne[];
  isLoading?: boolean;
  onScheduledClick?: () => void;
}

const StatCardSkeleton: React.FC = () => (
  <Card className="p-4">
    <div className="animate-pulse">
      <div className="h-4 w-1/2 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
      <div className="h-8 w-1/3 bg-gray-200 dark:bg-gray-700 rounded"></div>
    </div>
  </Card>
);

export const CampagneDashboardStats: React.FC<CampagneDashboardStatsProps> = ({
  campagnes,
  isLoading = false,
  onScheduledClick,
}) => {
  const stats = useMemo(() => {
    const now = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const sentInLast30Days = campagnes.filter(c => 
      c.status === CampagneStatus.SENT && 
      c.sentAt && 
      new Date(c.sentAt) >= thirtyDaysAgo
    );

    const scheduledUpcoming = campagnes.filter(c => 
      c.status === CampagneStatus.SCHEDULED && 
      c.scheduledAt && 
      new Date(c.scheduledAt) > now
    );

    const avgOpenRate = sentInLast30Days.length > 0
      ? sentInLast30Days.reduce((sum, c) => sum + c.stats.openRate, 0) / sentInLast30Days.length
      : 0;

    const avgClickRate = sentInLast30Days.length > 0
      ? sentInLast30Days.reduce((sum, c) => sum + c.stats.clickRate, 0) / sentInLast30Days.length
      : 0;

    return {
      sentCount: sentInLast30Days.length,
      avgOpenRate: Math.round(avgOpenRate * 10) / 10,
      avgClickRate: Math.round(avgClickRate * 10) / 10,
      scheduledCount: scheduledUpcoming.length,
    };
  }, [campagnes]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Campagnes envoyées
            </p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {stats.sentCount}
            </p>
          </div>
          <div className="p-3 rounded-lg bg-green-100 dark:bg-green-900/30">
            <Send className="w-6 h-6 text-green-600 dark:text-green-400" />
          </div>
        </div>
        <p className="text-xs text-gray-400 mt-2">
          Derniers 30 jours
        </p>
      </Card>

      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Taux d'ouverture
            </p>
            <p className={`text-2xl font-bold ${
              stats.avgOpenRate > 60 ? 'text-green-600' : 'text-orange-600'
            }`}>
              {stats.avgOpenRate}%
            </p>
          </div>
          <div className={`p-3 rounded-lg ${
            stats.avgOpenRate > 60 
              ? 'bg-green-100 dark:bg-green-900/30' 
              : 'bg-orange-100 dark:bg-orange-900/30'
          }`}>
            <Eye className={`w-6 h-6 ${
              stats.avgOpenRate > 60 
                ? 'text-green-600 dark:text-green-400' 
                : 'text-orange-600 dark:text-orange-400'
            }`} />
          </div>
        </div>
        <p className="text-xs text-gray-400 mt-2">
          {stats.avgOpenRate > 60 ? 'Bon' : 'À améliorer'}
        </p>
      </Card>

      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Taux de clic
            </p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {stats.avgClickRate}%
            </p>
          </div>
          <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900/30">
            <MousePointer className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
        </div>
        <p className="text-xs text-gray-400 mt-2">
          Moyenne des campagnes
        </p>
      </Card>

      <Card 
        className={`p-4 ${stats.scheduledCount > 0 ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}
        onClick={stats.scheduledCount > 0 ? onScheduledClick : undefined}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Programmées à venir
            </p>
            <p className={`text-2xl font-bold ${
              stats.scheduledCount > 0 ? 'text-blue-600' : 'text-gray-900 dark:text-white'
            }`}>
              {stats.scheduledCount}
            </p>
          </div>
          <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900/30">
            <Calendar className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
        </div>
        <p className="text-xs text-gray-400 mt-2">
          {stats.scheduledCount > 0 
            ? `${stats.scheduledCount} campagne${stats.scheduledCount > 1 ? 's' : ''} programmée${stats.scheduledCount > 1 ? 's' : ''}`
            : 'Aucune campagne programmée'
          }
        </p>
        {stats.scheduledCount > 0 && (
          <Badge color="blue" variant="light" size="xs" className="mt-2">
            Cliquez pour voir
          </Badge>
        )}
      </Card>
    </div>
  );
};

export default CampagneDashboardStats;