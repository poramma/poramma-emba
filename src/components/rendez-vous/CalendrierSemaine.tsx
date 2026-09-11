// src/components/rendez-vous/CalendrierSemaine.tsx

import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Clock, User, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { DayDetailsModal } from './DayDetailsModal';
import { SlotDetailsModal } from './SlotDetailsModal';
import { useRendezVous } from '../../hooks/useRendezVous';
import { formatDateShort, isJourFerie } from '../../lib/date';
import { RDVStatus } from '../../types/rendez-vous';

interface CalendrierSemaineProps {
  date: string;
  onDateChange: (date: string) => void;
  onRdvClick?: (rdvId: string) => void;
  onDayClick?: (date: string) => void;
}

interface DayDetail {
  date: string;
  rdvs: any[];
  stats: {
    total: number;
    confirmed: number;
    inProgress: number;
    completed: number;
    urgent: number;
    pending: number;
    cancelled: number;
    missed: number;
  };
  isFerie: { isFerie: boolean; name?: string };
  isWeekend: boolean;
  isToday: boolean;
}

interface SlotDetail {
  date: string;
  hour: string;
  rdvs: any[];
}

export const CalendrierSemaine: React.FC<CalendrierSemaineProps> = ({
  date,
  onDateChange,
  onRdvClick,
  onDayClick,
}) => {
  const { rendezVous, isLoading } = useRendezVous();
  const [selectedDay, setSelectedDay] = useState<DayDetail | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<SlotDetail | null>(null);
  const [isDayModalOpen, setIsDayModalOpen] = useState(false);
  const [isSlotModalOpen, setIsSlotModalOpen] = useState(false);

  // Calculer la semaine à partir de la date
  const weekDays = useMemo(() => {
    const current = new Date(date);
    const day = current.getDay() || 7;
    const diff = day - 1;
    
    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(current);
      d.setDate(d.getDate() - diff + i);
      days.push(d.toISOString().split('T')[0]);
    }
    return days;
  }, [date]);

  /**
   * Récupère les détails d'un jour
   */
  const getDayDetails = (dayDate: string): DayDetail => {
    const rdvs = rendezVous.filter(rdv => {
      const rdvDate = rdv.slot?.date || rdv.createdAt.split('T')[0];
      return rdvDate === dayDate;
    });

    const stats = {
      total: rdvs.length,
      confirmed: rdvs.filter(r => r.status === RDVStatus.CONFIRMED).length,
      inProgress: rdvs.filter(r => [RDVStatus.CHECKED_IN, RDVStatus.IN_PROGRESS].includes(r.status)).length,
      completed: rdvs.filter(r => r.status === RDVStatus.COMPLETED).length,
      urgent: rdvs.filter(r => r.isUrgent).length,
      pending: rdvs.filter(r => r.status === RDVStatus.PENDING).length,
      cancelled: rdvs.filter(r => [RDVStatus.CANCELLED_BY_USER, RDVStatus.CANCELLED_BY_AGENT].includes(r.status)).length,
      missed: rdvs.filter(r => [RDVStatus.MISSED, RDVStatus.NO_SHOW].includes(r.status)).length,
    };

    const isFerie = isJourFerie(dayDate);
    const isWeekend = [6, 7].includes(new Date(dayDate).getDay() || 7);
    const isToday = dayDate === new Date().toISOString().split('T')[0];

    return { date: dayDate, rdvs, stats, isFerie, isWeekend, isToday };
  };

  /**
   * Gère le clic sur un jour (en-tête)
   */
  const handleDayClick = (day: string) => {
    const details = getDayDetails(day);
    setSelectedDay(details);
    setIsDayModalOpen(true);
  };

  /**
   * Gère le clic sur un créneau horaire (la case)
   * Ouvre le modal avec tous les rendez-vous de cette heure
   */
  const handleSlotClick = (day: string, hour: string, rdvs: any[]) => {
    if (rdvs.length === 0) return;
    setSelectedSlot({ date: day, hour, rdvs });
    setIsSlotModalOpen(true);
  };

  /**
   * Gère le clic sur un rendez-vous individuel dans le modal du créneau
   */
  const handleRdvClickFromSlot = (rdvId: string) => {
    setIsSlotModalOpen(false);
    if (onRdvClick) {
      onRdvClick(rdvId);
    }
  };

  /**
   * Gère le clic sur "Voir la journée"
   */
  const handleViewDay = (date: string) => {
    if (onDayClick) {
      onDayClick(date);
    }
  };

  /**
   * Récupère les rendez-vous pour un jour et une heure donnée
   */
  const getRdvForSlot = (day: string, hour: string) => {
    return rendezVous.filter(rdv => {
      const rdvDate = rdv.slot?.date || rdv.createdAt.split('T')[0];
      
      let rdvHour = -1;
      if (rdv.slot) {
        rdvHour = parseInt(rdv.slot.startTime.split(':')[0]);
      } else {
        rdvHour = parseInt(rdv.createdAt.split('T')[1].substring(0, 2));
      }
      
      return rdvDate === day && rdvHour === parseInt(hour);
    });
  };

  const getStatusColor = (status: RDVStatus) => {
    switch (status) {
      case RDVStatus.COMPLETED:
      case RDVStatus.CONFIRMED:
        return 'bg-green-100 border-green-300 dark:bg-green-900/30 dark:border-green-700';
      case RDVStatus.IN_PROGRESS:
      case RDVStatus.CHECKED_IN:
        return 'bg-blue-100 border-blue-300 dark:bg-blue-900/30 dark:border-blue-700';
      case RDVStatus.PENDING:
        return 'bg-yellow-100 border-yellow-300 dark:bg-yellow-900/30 dark:border-yellow-700';
      case RDVStatus.MISSED:
      case RDVStatus.NO_SHOW:
      case RDVStatus.CANCELLED_BY_AGENT:
      case RDVStatus.CANCELLED_BY_USER:
        return 'bg-red-100 border-red-300 dark:bg-red-900/30 dark:border-red-700';
      default:
        return 'bg-gray-100 border-gray-300 dark:bg-gray-800 dark:border-gray-700';
    }
  };

  const getStatusIcon = (status: RDVStatus) => {
    switch (status) {
      case RDVStatus.COMPLETED:
      case RDVStatus.CONFIRMED:
        return CheckCircle;
      case RDVStatus.IN_PROGRESS:
      case RDVStatus.CHECKED_IN:
        return User;
      case RDVStatus.PENDING:
        return AlertCircle;
      case RDVStatus.MISSED:
      case RDVStatus.NO_SHOW:
      case RDVStatus.CANCELLED_BY_AGENT:
      case RDVStatus.CANCELLED_BY_USER:
        return XCircle;
      default:
        return Clock;
    }
  };

  const handlePreviousWeek = () => {
    const newDate = new Date(date);
    newDate.setDate(newDate.getDate() - 7);
    onDateChange(newDate.toISOString().split('T')[0]);
  };

  const handleNextWeek = () => {
    const newDate = new Date(date);
    newDate.setDate(newDate.getDate() + 7);
    onDateChange(newDate.toISOString().split('T')[0]);
  };

  const handleToday = () => {
    onDateChange(new Date().toISOString().split('T')[0]);
  };

  const hours = Array.from({ length: 8 }, (_, i) => i + 9);

  return (
    <div className="space-y-4">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={handlePreviousWeek}>
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Semaine du {formatDateShort(weekDays[0])}
            </h2>
          </div>
          <Button variant="ghost" size="sm" onClick={handleNextWeek}>
            <ChevronRight className="w-5 h-5" />
          </Button>
          <Button variant="outline" size="sm" onClick={handleToday}>
            Aujourd'hui
          </Button>
        </div>
      </div>

      {/* Grille */}
      <Card>
        <div className="overflow-x-auto">
          <div className="min-w-[800px]">
            {/* En-tête des jours */}
            <div className="grid grid-cols-8 border-b border-gray-200 dark:border-gray-700">
              <div className="p-3 text-center text-sm font-medium text-gray-500 dark:text-gray-400 border-r border-gray-200 dark:border-gray-700">
                Horaire
              </div>
              {weekDays.map((day, index) => {
                const isToday = day === new Date().toISOString().split('T')[0];
                const isFerie = isJourFerie(day);
                const hasRdvs = rendezVous.some(rdv => {
                  const rdvDate = rdv.slot?.date || rdv.createdAt.split('T')[0];
                  return rdvDate === day;
                });

                return (
                  <div
                    key={index}
                    className={`p-3 text-center border-r border-gray-200 dark:border-gray-700 last:border-r-0 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
                      isToday ? 'bg-brand-50 dark:bg-brand-900/20' : ''
                    } ${isFerie.isFerie ? 'bg-red-50 dark:bg-red-900/20' : ''} ${
                      hasRdvs ? 'hover:border-brand-300' : ''
                    }`}
                    onClick={() => handleDayClick(day)}
                  >
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {new Date(day).toLocaleDateString('fr-FR', { weekday: 'short' })}
                    </div>
                    <div className={`text-lg font-bold ${
                      isToday ? 'text-brand-600 dark:text-brand-400' : 'text-gray-700 dark:text-gray-300'
                    }`}>
                      {new Date(day).getDate()}
                    </div>
                    {isFerie.isFerie && (
                      <div className="text-xs text-red-500 truncate">{isFerie.name}</div>
                    )}
                    {hasRdvs && (
                      <div className="mt-1 flex justify-center">
                        <div className="w-2 h-2 rounded-full bg-brand-500"></div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Corps de la grille */}
            {isLoading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500 mx-auto"></div>
                <p className="text-gray-500 mt-2">Chargement...</p>
              </div>
            ) : (
              hours.map((hour) => (
                <div key={hour} className="grid grid-cols-8 border-b border-gray-200 dark:border-gray-700 last:border-b-0">
                  {/* Colonne des heures */}
                  <div className="p-3 text-center text-sm font-medium text-gray-500 dark:text-gray-400 border-r border-gray-200 dark:border-gray-700">
                    {String(hour).padStart(2, '0')}:00
                  </div>

                  {/* Colonnes des jours */}
                  {weekDays.map((day, dayIndex) => {
                    const rdvs = getRdvForSlot(day, String(hour));
                    const isToday = day === new Date().toISOString().split('T')[0];
                    const isFerie = isJourFerie(day);
                    const isPast = new Date(day) < new Date(new Date().toISOString().split('T')[0]);
                    const isWeekend = [6, 7].includes(new Date(day).getDay() || 7);
                    const hasRdvs = rdvs.length > 0;

                    return (
                      <div
                        key={dayIndex}
                        className={`p-2 min-h-[60px] border-r border-gray-200 dark:border-gray-700 last:border-r-0 transition-all ${
                          isToday ? 'bg-brand-50/50 dark:bg-brand-900/10' : ''
                        } ${isFerie.isFerie ? 'bg-red-50/50 dark:bg-red-900/10' : ''} ${
                          isPast ? 'opacity-50' : ''
                        } ${isWeekend ? 'bg-gray-50 dark:bg-gray-800/30' : ''} ${
                          hasRdvs ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:shadow-md' : ''
                        }`}
                        onClick={() => handleSlotClick(day, String(hour), rdvs)}
                      >
                        {rdvs.length === 0 ? (
                          <div className="h-full flex items-center justify-center text-xs text-gray-400">
                            —
                          </div>
                        ) : (
                          <div className="space-y-1">
                            {rdvs.slice(0, 2).map((rdv, idx) => {
                              const StatusIcon = getStatusIcon(rdv.status);
                              return (
                                <div
                                  key={idx}
                                  className={`p-1.5 rounded-lg border text-xs ${getStatusColor(rdv.status)}`}
                                >
                                  <div className="flex items-center justify-between gap-1">
                                    <span className="font-medium text-gray-900 dark:text-white truncate text-[10px]">
                                      {rdv.user.profile?.firstName} {rdv.user.profile?.lastName}
                                    </span>
                                    <StatusIcon className="w-3 h-3 text-gray-500 flex-shrink-0" />
                                  </div>
                                  {rdv.isUrgent && (
                                    <Badge color="error" variant="solid" size="xs" className="mt-0.5">
                                      URGENT
                                    </Badge>
                                  )}
                                </div>
                              );
                            })}
                            {rdvs.length > 2 && (
                              <div className="text-xs text-gray-500 text-center">
                                +{rdvs.length - 2} autres
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))
            )}
          </div>
        </div>
      </Card>

      {/* Modal des détails du jour */}
      <DayDetailsModal
        isOpen={isDayModalOpen}
        onClose={() => setIsDayModalOpen(false)}
        dayDetail={selectedDay}
        onViewDay={handleViewDay}
        onRdvClick={onRdvClick}
      />

      {/* Modal des détails du créneau horaire */}
      <SlotDetailsModal
        isOpen={isSlotModalOpen}
        onClose={() => setIsSlotModalOpen(false)}
        slotData={selectedSlot}
        onRdvClick={handleRdvClickFromSlot}
        onDayClick={handleViewDay}
      />
    </div>
  );
};

export default CalendrierSemaine;