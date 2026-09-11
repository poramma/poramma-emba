// src/components/profile/AvailabilitySchedule.tsx

import React, { useState } from 'react';
import { 
  Clock
} from 'lucide-react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { AgentAvailability, AgentException } from '../../types/auth';
import { formatDateShort, formatTime } from '../../lib/date';

interface AvailabilityScheduleProps {
  availabilities: AgentAvailability[];
  exceptions: AgentException[];
  onAvailabilityUpdate?: (availabilities: AgentAvailability[]) => void;
  isLoading?: boolean;
}

const DAYS = [
  { value: 1, label: 'Lundi' },
  { value: 2, label: 'Mardi' },
  { value: 3, label: 'Mercredi' },
  { value: 4, label: 'Jeudi' },
  { value: 5, label: 'Vendredi' },
  { value: 6, label: 'Samedi' },
  { value: 7, label: 'Dimanche' },
];

export const AvailabilitySchedule: React.FC<AvailabilityScheduleProps> = ({
  availabilities,
  exceptions,
  onAvailabilityUpdate,
  isLoading = false,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [localAvailabilities, setLocalAvailabilities] = useState(availabilities);

  const getAvailabilityForDay = (dayOfWeek: number) => {
    return localAvailabilities.find(a => a.dayOfWeek === dayOfWeek);
  };

  const handleToggleDay = (dayOfWeek: number) => {
    const existing = getAvailabilityForDay(dayOfWeek);
    if (existing) {
      setLocalAvailabilities(prev => 
        prev.map(a => 
          a.dayOfWeek === dayOfWeek 
            ? { ...a, isAvailable: !a.isAvailable }
            : a
        )
      );
    } else {
      setLocalAvailabilities(prev => [
        ...prev,
        {
          id: `temp-${dayOfWeek}`,
          agentId: '',
          dayOfWeek,
          startTime: '09:00',
          endTime: '17:00',
          isAvailable: true,
        },
      ]);
    }
  };

  const handleTimeChange = (dayOfWeek: number, field: 'startTime' | 'endTime', value: string) => {
    setLocalAvailabilities(prev => 
      prev.map(a => 
        a.dayOfWeek === dayOfWeek 
          ? { ...a, [field]: value }
          : a
      )
    );
  };

  const handleSave = () => {
    if (onAvailabilityUpdate) {
      onAvailabilityUpdate(localAvailabilities);
    }
    setIsEditing(false);
  };

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
          <div className="space-y-2">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="h-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </Card>
    );
  }

  const upcomingExceptions = exceptions
    .filter(e => new Date(e.date) >= new Date())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 5);

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
            Disponibilités
          </h4>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Vos horaires de travail hebdomadaires
          </p>
        </div>
        {!isEditing ? (
          <Button variant="outline" onClick={() => setIsEditing(true)}>
            Modifier
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => {
              setLocalAvailabilities(availabilities);
              setIsEditing(false);
            }}>
              Annuler
            </Button>
            <Button variant="primary" onClick={handleSave}>
              Enregistrer
            </Button>
          </div>
        )}
      </div>

      {/* Grille des disponibilités */}
      <div className="space-y-2">
        {DAYS.map((day) => {
          const availability = getAvailabilityForDay(day.value);
          const isAvailable = availability?.isAvailable ?? false;

          return (
            <div 
              key={day.value} 
              className={`flex items-center gap-4 p-3 rounded-lg transition-colors ${
                isAvailable 
                  ? 'bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800' 
                  : 'bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700'
              }`}
            >
              <div className="w-24 font-medium text-gray-700 dark:text-gray-300">
                {day.label}
              </div>

              {!isEditing ? (
                // Mode lecture
                <>
                  {isAvailable ? (
                    <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
                      <Clock className="w-4 h-4 text-green-500" />
                      <span>
                        {availability?.startTime} - {availability?.endTime}
                      </span>
                      <Badge color="success" variant="light" size="xs">
                        Disponible
                      </Badge>
                    </div>
                  ) : (
                    <span className="text-sm text-gray-400">Indisponible</span>
                  )}
                </>
              ) : (
                // Mode édition
                <div className="flex items-center gap-3 flex-1">
                  <button
                    aria-label={`Toggle ${day.label} availability`}
                    onClick={() => handleToggleDay(day.value)}
                    className={`w-10 h-6 rounded-full transition-colors ${
                      isAvailable ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full bg-white transition-transform ${
                      isAvailable ? 'translate-x-5' : 'translate-x-1'
                    }`} />
                  </button>

                  {isAvailable && (
                    <>
                      <input
                        aria-label={`Start time for ${day.label}`}
                        type="time"
                        value={availability?.startTime || '09:00'}
                        onChange={(e) => handleTimeChange(day.value, 'startTime', e.target.value)}
                        className="px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700"
                      />
                      <span className="text-gray-400">—</span>
                      <input
                        aria-label={`End time for ${day.label}`}
                        type="time"
                        value={availability?.endTime || '17:00'}
                        onChange={(e) => handleTimeChange(day.value, 'endTime', e.target.value)}
                        className="px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700"
                      />
                    </>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Exceptions */}
      <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-3">
          <h5 className="font-medium text-gray-700 dark:text-gray-300">
            Exceptions à venir
          </h5>
          <Badge color="gray" variant="light">
            {exceptions.length} exception{exceptions.length > 1 ? 's' : ''}
          </Badge>
        </div>

        {upcomingExceptions.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Aucune exception prévue
          </p>
        ) : (
          <div className="space-y-2">
            {upcomingExceptions.map((exception) => (
              <div key={exception.id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded-lg text-sm">
                <div className="flex items-center gap-3">
                  <Badge color="warning" variant="light" size="xs">
                    {exception.type}
                  </Badge>
                  <span className="text-gray-600 dark:text-gray-300">
                    {formatDateShort(exception.date)}
                  </span>
                  {!exception.isFullDay && exception.startTime && exception.endTime && (
                    <span className="text-gray-500">
                      {formatTime(exception.startTime)} - {formatTime(exception.endTime)}
                    </span>
                  )}
                  <span className="text-gray-500">{exception.reason}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {exceptions.length > upcomingExceptions.length && (
          <p className="text-xs text-gray-400 mt-2">
            + {exceptions.length - upcomingExceptions.length} autre{exceptions.length - upcomingExceptions.length > 1 ? 's' : ''} exception{exceptions.length - upcomingExceptions.length > 1 ? 's' : ''}
          </p>
        )}
      </div>
    </Card>
  );
};

export default AvailabilitySchedule;