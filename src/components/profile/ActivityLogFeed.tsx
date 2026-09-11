// src/components/profile/ActivityLogFeed.tsx

import React, { useState } from 'react';
import { 
  Activity, Clock, User, FileText, Calendar,
  CheckCircle, XCircle, Eye, Download, Upload,
  ChevronDown, ChevronUp, Users, Settings
} from 'lucide-react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { ActivityLogEntry } from '../../types/profile';
import { formatDateShort, timeAgo } from '../../lib/date';

interface ActivityLogFeedProps {
  activities?: ActivityLogEntry[];
  isLoading?: boolean;
  lastLoginAt?: string | null;
  onLoadMore?: (offset: number) => Promise<void>;
}

const ACTION_ICONS: Record<string, React.ReactNode> = {
  'created': <Upload className="w-4 h-4 text-green-500" />,
  'validated': <CheckCircle className="w-4 h-4 text-green-600" />,
  'rejected': <XCircle className="w-4 h-4 text-red-500" />,
  'viewed': <Eye className="w-4 h-4 text-blue-500" />,
  'downloaded': <Download className="w-4 h-4 text-purple-500" />,
  'updated': <Settings className="w-4 h-4 text-orange-500" />,
  'assigned': <Users className="w-4 h-4 text-indigo-500" />,
};

const TARGET_ICONS: Record<string, React.ReactNode> = {
  'demande': <FileText className="w-4 h-4 text-gray-400" />,
  'document': <FileText className="w-4 h-4 text-gray-400" />,
  'rendez-vous': <Calendar className="w-4 h-4 text-gray-400" />,
  'service': <Settings className="w-4 h-4 text-gray-400" />,
  'agent': <User className="w-4 h-4 text-gray-400" />,
};

const ACTION_LABELS: Record<string, string> = {
  'created': 'a créé',
  'validated': 'a validé',
  'rejected': 'a rejeté',
  'viewed': 'a consulté',
  'downloaded': 'a téléchargé',
  'updated': 'a modifié',
  'assigned': 'a assigné',
};

const TARGET_LABELS: Record<string, string> = {
  'demande': 'demande',
  'document': 'document',
  'rendez-vous': 'rendez-vous',
  'service': 'service',
  'agent': 'agent',
};

export const ActivityLogFeed: React.FC<ActivityLogFeedProps> = ({
  activities = [],
  isLoading = false,
  lastLoginAt = null,
  onLoadMore,
}) => {
  const [loadingMore, setLoadingMore] = useState(false);
  const [expandedActivities, setExpandedActivities] = useState<Set<string>>(new Set());

  // Grouper les activités par jour
  const groupedActivities = activities.reduce((acc, activity) => {
    const date = new Date(activity.createdAt);
    const key = date.toDateString();
    if (!acc[key]) acc[key] = [];
    acc[key].push(activity);
    return acc;
  }, {} as Record<string, ActivityLogEntry[]>);

  const getDateLabel = (date: Date) => {
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return "Aujourd'hui";
    if (date.toDateString() === yesterday.toDateString()) return 'Hier';
    return formatDateShort(date);
  };

  const toggleExpand = (id: string) => {
    setExpandedActivities(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      return newSet;
    });
  };

  const handleLoadMore = async () => {
    if (onLoadMore) {
      setLoadingMore(true);
      try {
        await onLoadMore(activities.length);
      } finally {
        setLoadingMore(false);
      }
    }
  };

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mt-1"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>
    );
  }

  const sortedDates = Object.keys(groupedActivities).sort((a, b) => 
    new Date(b).getTime() - new Date(a).getTime()
  );

  return (
    <Card className="p-6">
      {/* En-tête */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
            Activité récente
          </h4>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {activities.length} action{activities.length > 1 ? 's' : ''} enregistrée{activities.length > 1 ? 's' : ''}
          </p>
        </div>
        {lastLoginAt && (
          <div className="text-sm text-gray-500 dark:text-gray-400">
            <Clock className="w-4 h-4 inline mr-1" />
            Dernière connexion: {new Date(lastLoginAt).toLocaleString()}
          </div>
        )}
      </div>

      {activities.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-gray-400">
          <Activity className="w-12 h-12 mb-4 opacity-50" />
          <p className="text-sm">Aucune activité enregistrée</p>
        </div>
      ) : (
        <div className="space-y-6">
          {sortedDates.map((dateKey) => {
            const date = new Date(dateKey);
            const dayActivities = groupedActivities[dateKey];

            return (
              <div key={dateKey}>
                <h5 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
                  {getDateLabel(date)}
                </h5>
                <div className="space-y-2">
                  {dayActivities.map((activity) => {
                    const ActionIcon = ACTION_ICONS[activity.action] || <Activity className="w-4 h-4" />;
                    const TargetIcon = TARGET_ICONS[activity.targetType] || <FileText className="w-4 h-4" />;
                    const actionLabel = ACTION_LABELS[activity.action] || activity.action;
                    const targetLabel = TARGET_LABELS[activity.targetType] || activity.targetType;
                    const isExpanded = expandedActivities.has(activity.id);

                    return (
                      <div 
                        key={activity.id} 
                        className="p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors"
                      >
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5">
                            {ActionIcon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-sm text-gray-700 dark:text-gray-300">
                                Vous {actionLabel}{' '}
                                <span className="font-medium text-gray-900 dark:text-white">
                                  {activity.targetLabel}
                                </span>
                              </span>
                              <Badge color="gray" variant="light" size="xs">
                                {targetLabel}
                              </Badge>
                              <span className="text-xs text-gray-400">
                                {timeAgo(activity.createdAt)}
                              </span>
                              <button
                                className="text-gray-400 hover:text-gray-600"
                                onClick={() => toggleExpand(activity.id)}
                              >
                                {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                              </button>
                            </div>
                            {isExpanded && (
                              <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-700 rounded text-xs text-gray-500 space-y-1">
                                <p>ID: {activity.targetId}</p>
                                <p>Date: {new Date(activity.createdAt).toLocaleString()}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Charger plus */}
      {onLoadMore && activities.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 text-center">
          <Button 
            variant="ghost" 
            onClick={handleLoadMore}
            disabled={loadingMore}
          >
            {loadingMore ? 'Chargement...' : 'Charger plus'}
          </Button>
        </div>
      )}
    </Card>
  );
};

export default ActivityLogFeed;