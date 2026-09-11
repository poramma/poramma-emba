// src/components/communication/notifications/NotificationBell.tsx

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Bell, BellOff, CheckCircle, 
  AlertCircle, Calendar, Mail,
  MessageCircle, FileText, Users
} from 'lucide-react';
import { Card } from '../../ui/card';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { useCommunication } from '../../../hooks/useCommunication';
import { NotifType } from '../../../types/communication';
import { timeAgo } from '../../../lib/date';

const NOTIF_ICONS: Record<NotifType, React.ReactNode> = {
  [NotifType.DEMANDE_UPDATE]: <FileText className="w-4 h-4 text-blue-500" />,
  [NotifType.RDV_REMINDER]: <Calendar className="w-4 h-4 text-orange-500" />,
  [NotifType.PAYMENT]: <Mail className="w-4 h-4 text-green-500" />,
  [NotifType.MESSAGE]: <MessageCircle className="w-4 h-4 text-purple-500" />,
  [NotifType.SYSTEM]: <AlertCircle className="w-4 h-4 text-gray-500" />,
  [NotifType.CAMPAGNE]: <Users className="w-4 h-4 text-brand-500" />,
  [NotifType.DOCUMENT]: <FileText className="w-4 h-4 text-blue-500" />,
  [NotifType.VALIDATION]: <CheckCircle className="w-4 h-4 text-green-500" />,
};

export const NotificationBell: React.FC = () => {
  const navigate = useNavigate();
  const { 
    notifications, 
    unreadCount, 
    fetchNotifications, 
    markAsRead 
  } = useCommunication();

  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadNotifications();
  }, []);

  useEffect(() => {
    // Polling toutes les 60s pour les notifications non lues
    const interval = setInterval(() => {
      if (isOpen) {
        fetchNotifications({ unreadOnly: true });
      }
    }, 60000);

    return () => clearInterval(interval);
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadNotifications = async () => {
    setIsLoading(true);
    await fetchNotifications({ limit: 5 });
    setIsLoading(false);
  };

  const handleNotificationClick = async (notification: any) => {
    if (notification.status !== 'READ') {
      await markAsRead(notification.id);
    }
    setIsOpen(false);
    if (notification.actionUrl) {
      navigate(notification.actionUrl);
    }
  };

  const handleViewAll = () => {
    setIsOpen(false);
    navigate('/notifications');
  };

  const truncateBody = (body: string, maxLength: number = 60) => {
    if (body.length <= maxLength) return body;
    return body.slice(0, maxLength) + '...';
  };

  const recentNotifications = notifications.slice(0, 5);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) {
            fetchNotifications({ unreadOnly: true });
          }
        }}
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5 text-gray-600 dark:text-gray-300" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <Card className="absolute right-0 mt-2 w-80 sm:w-96 max-h-96 overflow-hidden shadow-lg z-50">
          <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700">
            <h4 className="font-medium text-gray-900 dark:text-white">Notifications</h4>
            {unreadCount > 0 && (
              <Badge color="primary" variant="solid" size="xs">
                {unreadCount} non lue{unreadCount > 1 ? 's' : ''}
              </Badge>
            )}
          </div>

          <div className="max-h-72 overflow-y-auto">
            {isLoading ? (
              <div className="p-4 text-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-brand-500 mx-auto"></div>
                <p className="text-sm text-gray-500 mt-2">Chargement...</p>
              </div>
            ) : recentNotifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <BellOff className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Aucune notification</p>
              </div>
            ) : (
              recentNotifications.map((notif) => (
                <button
                  key={notif.id}
                  className={`w-full p-3 text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors border-b border-gray-100 dark:border-gray-700 ${
                    notif.status !== 'READ' ? 'bg-blue-50 dark:bg-blue-900/10' : ''
                  }`}
                  onClick={() => handleNotificationClick(notif)}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                      {NOTIF_ICONS[notif.type] || <Bell className="w-4 h-4 text-gray-400" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {notif.title}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {truncateBody(notif.body)}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-gray-400">
                          {timeAgo(notif.createdAt)}
                        </span>
                        {notif.status !== 'READ' && (
                          <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>

          <div className="p-2 border-t border-gray-200 dark:border-gray-700 text-center">
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-sm text-brand-600 hover:text-brand-700 dark:text-brand-400"
              onClick={handleViewAll}
            >
              Voir toutes les notifications
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
};

export default NotificationBell;