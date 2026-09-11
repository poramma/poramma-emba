// src/pages/communication/NotificationCenter.tsx

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Bell, BellOff, CheckCircle, XCircle, 
  AlertCircle, Calendar, Mail,
  MessageCircle, FileText, Users,
  Search, ArrowLeft, CheckCheck
} from 'lucide-react';
import { Card } from '../../ui/card';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Select } from '../../ui/select';
import { Badge } from '../../ui/badge';
import { PermissionGuard } from '../../auth/PermissionGuard';
import { useCommunication } from '../../../hooks/useCommunication';
import { NotifType, NotifStatus, Notif } from '../../../types/communication';
import { formatDateShort, timeAgo } from '../../../lib/date';

const NOTIF_ICONS: Record<NotifType, React.ReactNode> = {
  [NotifType.DEMANDE_UPDATE]: <FileText className="w-5 h-5 text-blue-500" />,
  [NotifType.RDV_REMINDER]: <Calendar className="w-5 h-5 text-orange-500" />,
  [NotifType.PAYMENT]: <Mail className="w-5 h-5 text-green-500" />,
  [NotifType.MESSAGE]: <MessageCircle className="w-5 h-5 text-purple-500" />,
  [NotifType.SYSTEM]: <AlertCircle className="w-5 h-5 text-gray-500" />,
  [NotifType.CAMPAGNE]: <Users className="w-5 h-5 text-brand-500" />,
  [NotifType.DOCUMENT]: <FileText className="w-5 h-5 text-blue-500" />,
  [NotifType.VALIDATION]: <CheckCircle className="w-5 h-5 text-green-500" />,
};

const TYPE_OPTIONS = [
  { value: 'all', label: 'Tous les types' },
  ...Object.entries(NotifType).map(([key, value]) => ({
    value,
    label: key.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase()),
  })),
];

const STATUS_OPTIONS = [
  { value: 'all', label: 'Tous les statuts' },
  { value: NotifStatus.READ, label: 'Lues' },
  { value: NotifStatus.SENT, label: 'Non lues' },
];

export const NotificationCenter: React.FC = () => {
  const navigate = useNavigate();
  const { 
    notifications, 
    unreadCount,
    fetchNotifications, 
    markAsRead, 
    markAllAsRead,
    isLoading 
  } = useCommunication();

  const [filters, setFilters] = useState({
    type: 'all',
    status: 'all',
    search: '',
    dateFrom: '',
    dateTo: '',
  });

  const [expandedNotif, setExpandedNotif] = useState<string | null>(null);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    await fetchNotifications({
      ...(filters.type !== 'all' && { type: filters.type as NotifType }),
      ...(filters.status !== 'all' && { status: filters.status as NotifStatus }),
      ...(filters.status === 'unread' && { unreadOnly: true }),
    });
  };

  const handleFilterChange = (key: keyof typeof filters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleApplyFilters = () => {
    loadNotifications();
  };

  const handleResetFilters = () => {
    setFilters({
      type: 'all',
      status: 'all',
      search: '',
      dateFrom: '',
      dateTo: '',
    });
    setTimeout(loadNotifications, 100);
  };

  const handleNotificationClick = async (notification: any) => {
    if (notification.status !== NotifStatus.READ) {
      await markAsRead(notification.id);
    }
    if (notification.actionUrl) {
      navigate(notification.actionUrl);
    } else {
      setExpandedNotif(expandedNotif === notification.id ? null : notification.id);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (unreadCount === 0) return;
    if (!window.confirm(`Marquer toutes les notifications (${unreadCount}) comme lues ?`)) return;
    await markAllAsRead();
    loadNotifications();
  };

  // Grouper les notifications par jour
  const groupedNotifications = notifications.reduce((acc: any, notif: any) => {
    const date = new Date(notif.createdAt);
    const key = date.toDateString();
    if (!acc[key]) acc[key] = [];
    acc[key].push(notif);
    return acc;
  }, {} as Record<string, typeof notifications>);

  const getDateLabel = (date: Date) => {
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return "Aujourd'hui";
    if (date.toDateString() === yesterday.toDateString()) return 'Hier';
    return formatDateShort(date);
  };

  const filteredNotifications = notifications.filter(n => {
    if (filters.search && !n.title.toLowerCase().includes(filters.search.toLowerCase()) &&
        !n.body.toLowerCase().includes(filters.search.toLowerCase())) return false;
    return true;
  });

  return (
    <PermissionGuard minRoleLevel={4} title="Centre de notifications">
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* En-tête */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={() => navigate(-1)}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Retour
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Centre de notifications
                </h1>
                <p className="text-gray-500 dark:text-gray-400">
                  {notifications.length} notification{notifications.length > 1 ? 's' : ''}
                  {unreadCount > 0 && ` • ${unreadCount} non lue${unreadCount > 1 ? 's' : ''}`}
                </p>
              </div>
            </div>
            {unreadCount > 0 && (
              <Button variant="outline" onClick={handleMarkAllAsRead}>
                <CheckCheck className="w-4 h-4 mr-2" />
                Tout marquer comme lu
              </Button>
            )}
          </div>

          {/* Filtres */}
          <Card className="p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <Select
                value={filters.type}
                onChange={(value) => handleFilterChange('type', value)}
                options={TYPE_OPTIONS}
                label="Type"
              />
              <Select
                value={filters.status}
                onChange={(value) => handleFilterChange('status', value)}
                options={STATUS_OPTIONS}
                label="Statut"
              />
              <Input
                placeholder="Rechercher..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                startIcon={<Search className="w-4 h-4" />}
                label="Recherche"
              />
              <div className="flex items-end gap-2">
                <Button variant="primary" onClick={handleApplyFilters} className="flex-1">
                  Appliquer
                </Button>
                <Button variant="ghost" onClick={handleResetFilters} size="sm">
                  <XCircle className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </Card>

          {/* Liste */}
          <div className="space-y-4">
            {isLoading ? (
              <Card className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500 mx-auto"></div>
                <p className="text-gray-500 mt-2">Chargement...</p>
              </Card>
            ) : filteredNotifications.length === 0 ? (
              <Card className="p-8 text-center">
                <BellOff className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Aucune notification
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  {filters.search || filters.type !== 'all' || filters.status !== 'all'
                    ? 'Aucune notification ne correspond à vos filtres.'
                    : 'Vous n\'avez pas encore de notifications.'}
                </p>
              </Card>
            ) : (
              Object.entries(groupedNotifications).map(([dateKey, dayNotifications]) => {
                const date = new Date(dateKey);
                return (
                  <div key={dateKey}>
                    <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                      {getDateLabel(date)}
                    </h4>
                    <div className="space-y-2">
                      {(dayNotifications as Array<Notif>).map((notif: Notif) => {
                        const isExpanded = expandedNotif === notif.id;
                        const isUnread = notif.status !== NotifStatus.READ;

                        return (
                          <Card
                            key={notif.id}
                            className={`p-4 cursor-pointer transition-all hover:shadow-md ${
                              isUnread ? 'border-l-4 border-brand-500 bg-blue-50 dark:bg-blue-900/10' : ''
                            }`}
                            onClick={() => handleNotificationClick(notif)}
                          >
                            <div className="flex items-start gap-4">
                              <div className="flex-shrink-0 mt-1">
                                {NOTIF_ICONS[notif.type as NotifType] || <Bell className="w-5 h-5 text-gray-400" />}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="font-medium text-gray-900 dark:text-white">
                                    {notif.title}
                                  </span>
                                  <Badge color="gray" variant="light" size="xs">
                                    {notif.type}
                                  </Badge>
                                  {!isUnread && (
                                    <Badge color="gray" variant="light" size="xs">
                                      Lu
                                    </Badge>
                                  )}
                                </div>
                                <p className={`text-sm text-gray-600 dark:text-gray-300 ${!isExpanded ? 'line-clamp-2' : ''}`}>
                                  {notif.body}
                                </p>
                                <div className="flex items-center gap-3 mt-1">
                                  <span className="text-xs text-gray-400">
                                    {timeAgo(notif.createdAt)}
                                  </span>
                                  {notif.channel && (
                                    <Badge color="gray" variant="light" size="xs">
                                      {notif.channel}
                                    </Badge>
                                  )}
                                </div>
                                {isExpanded && notif.payload && (
                                  <div className="mt-3 p-2 bg-gray-50 dark:bg-gray-800 rounded text-xs text-gray-500">
                                    <pre className="whitespace-pre-wrap">
                                      {JSON.stringify(notif.payload, null, 2)}
                                    </pre>
                                  </div>
                                )}
                              </div>
                              {isUnread && (
                                <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 mt-2"></div>
                              )}
                            </div>
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </PermissionGuard>
  );
};

export default NotificationCenter;