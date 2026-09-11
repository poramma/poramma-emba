// src/components/documents/dashboard/DocumentDashboardStats.tsx

import React from 'react';
import { 
  Clock,  AlertTriangle, FileText, TrendingUp, TrendingDown
} from 'lucide-react';
import { Card } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { DocumentStats } from '../../../types/document';

interface DocumentDashboardStatsProps {
  stats: DocumentStats | null;
  isLoading?: boolean;
  onExpiringClick?: () => void;
}

const StatCardSkeleton: React.FC = () => (
  <Card className="p-4">
    <div className="animate-pulse">
      <div className="h-4 w-1/2 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
      <div className="h-8 w-1/3 bg-gray-200 dark:bg-gray-700 rounded"></div>
    </div>
  </Card>
);

export const DocumentDashboardStats: React.FC<DocumentDashboardStatsProps> = ({
  stats,
  isLoading = false,
  onExpiringClick,
}) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  const rejectionRate = stats.totalAccepted + stats.totalRejected > 0
    ? Math.round((stats.totalRejected / (stats.totalAccepted + stats.totalRejected)) * 100)
    : 0;

  const formatReviewTime = (hours: number) => {
    if (hours < 1) return `${Math.round(hours * 60)} min`;
    if (hours < 24) return `${hours.toFixed(1)} h`;
    const days = Math.floor(hours / 24);
    const remainingHours = Math.round(hours % 24);
    return `${days}j ${remainingHours}h`;
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* En attente */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">En attente</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {stats.totalPending}
            </p>
          </div>
          <div className="p-3 rounded-lg bg-gray-100 dark:bg-gray-700">
            <Clock className="w-6 h-6 text-gray-600 dark:text-gray-300" />
          </div>
        </div>
        <p className="text-xs text-gray-400 mt-2">
          Documents en cours de validation
        </p>
      </Card>

      {/* Taux de rejet */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Taux de rejet</p>
            <p className={`text-2xl font-bold ${
              rejectionRate > 20 ? 'text-red-600' : 'text-gray-900 dark:text-white'
            }`}>
              {rejectionRate}%
            </p>
          </div>
          <div className={`p-3 rounded-lg ${
            rejectionRate > 20 ? 'bg-red-100 dark:bg-red-900/30' : 'bg-gray-100 dark:bg-gray-700'
          }`}>
            {rejectionRate > 20 ? (
              <TrendingDown className="w-6 h-6 text-red-600" />
            ) : (
              <TrendingUp className="w-6 h-6 text-green-600" />
            )}
          </div>
        </div>
        <p className="text-xs text-gray-400 mt-2">
          {stats.totalRejected} rejetés / {stats.totalAccepted + stats.totalRejected} traités
        </p>
      </Card>

      {/* Délai moyen */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Délai moyen</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {formatReviewTime(stats.averageReviewTimeHours)}
            </p>
          </div>
          <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900/30">
            <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
        </div>
        <p className="text-xs text-gray-400 mt-2">
          Temps moyen de validation
        </p>
      </Card>

      {/* Expirent bientôt */}
      <Card 
        className={`p-4 ${stats.expiringSoonCount > 0 ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}
        onClick={stats.expiringSoonCount > 0 ? onExpiringClick : undefined}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Expirent bientôt</p>
            <p className={`text-2xl font-bold ${
              stats.expiringSoonCount > 0 ? 'text-orange-600' : 'text-gray-900 dark:text-white'
            }`}>
              {stats.expiringSoonCount}
            </p>
          </div>
          <div className="p-3 rounded-lg bg-orange-100 dark:bg-orange-900/30">
            <AlertTriangle className="w-6 h-6 text-orange-600 dark:text-orange-400" />
          </div>
        </div>
        <p className="text-xs text-gray-400 mt-2">
          {stats.expiringSoonCount > 0 
            ? `${stats.expiringSoonCount} document(s) expirent dans les 30 jours`
            : 'Aucun document proche de l\'expiration'
          }
        </p>
        {stats.expiringSoonCount > 0 && (
          <Badge color="warning" variant="light" size="xs" className="mt-2">
            Cliquez pour filtrer
          </Badge>
        )}
      </Card>
    </div>
  );
};

export default DocumentDashboardStats;