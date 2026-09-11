// src/components/rendez-vous/CalendrierMois.tsx

import React, { useState, useMemo } from 'react';
import { 
  ChevronLeft, ChevronRight, Clock, User, CheckCircle, XCircle, 
  AlertCircle, Calendar, Eye, ChevronDown, ChevronUp,
  FileText, Shield, Phone, Mail, MapPin, X
} from 'lucide-react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Modal } from '../ui/modal';
import { useRendezVous } from '../../hooks/useRendezVous';
import { formatDateShort, formatTime, isJourFerie, formatDateFR } from '../../lib/date';
import { RDVStatus, RDVType } from '../../types/rendez-vous';
import DayDetailsModal from './DayDetailsModal';

interface CalendrierMoisProps {
  date: string;
  onDateChange: (date: string) => void;
  onDayClick?: (date: string) => void;
  onRdvClick?: (rdvId: string) => void;
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

export const CalendrierMois: React.FC<CalendrierMoisProps> = ({
  date,
  onDateChange,
  onDayClick,
  onRdvClick,
}) => {
  const { rendezVous, isLoading } = useRendezVous();
  const [hoveredDay, setHoveredDay] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<DayDetail | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [expandedRdv, setExpandedRdv] = useState<string | null>(null);

  // Calculer les jours du mois
  const monthData = useMemo(() => {
    const current = new Date(date);
    const year = current.getFullYear();
    const month = current.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    
    const startDayOfWeek = firstDay.getDay() || 7;
    
    const days = [];
    
    // Jours du mois précédent
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startDayOfWeek - 1; i > 0; i--) {
      const d = prevMonthLastDay - i + 1;
      days.push({
        date: `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
        isCurrentMonth: false,
        day: d,
      });
    }
    
    // Jours du mois courant
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({
        date: `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`,
        isCurrentMonth: true,
        day: i,
      });
    }
    
    // Jours du mois suivant
    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      days.push({
        date: `${year}-${String(month + 2).padStart(2, '0')}-${String(i).padStart(2, '0')}`,
        isCurrentMonth: false,
        day: i,
      });
    }
    
    return {
      year,
      month,
      monthName: new Date(year, month).toLocaleString('fr-FR', { month: 'long' }),
      days,
    };
  }, [date]);

  // Fonction pour récupérer les détails d'un jour
  const getDayDetails = (dayDate: string): DayDetail => {
    const rdvs = rendezVous.filter(rdv => {
      // Utiliser le slot si disponible, sinon createdAt
      if (rdv.slot) {
        return rdv.slot.date === dayDate;
      }
      return rdv.createdAt.split('T')[0] === dayDate;
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

  const getRdvCountForDay = (dayDate: string) => {
    return rendezVous.filter(rdv => {
      if (rdv.slot) {
        return rdv.slot.date === dayDate;
      }
      return rdv.createdAt.split('T')[0] === dayDate;
    });
  };

  const getStatusSummary = (rdvs: typeof rendezVous) => {
    const total = rdvs.length;
    const confirmed = rdvs.filter(r => r.status === RDVStatus.CONFIRMED).length;
    const inProgress = rdvs.filter(r => [RDVStatus.CHECKED_IN, RDVStatus.IN_PROGRESS].includes(r.status)).length;
    const completed = rdvs.filter(r => r.status === RDVStatus.COMPLETED).length;
    const urgent = rdvs.filter(r => r.isUrgent).length;
    const pending = rdvs.filter(r => r.status === RDVStatus.PENDING).length;
    const cancelled = rdvs.filter(r => [RDVStatus.CANCELLED_BY_USER, RDVStatus.CANCELLED_BY_AGENT].includes(r.status)).length;
    const missed = rdvs.filter(r => [RDVStatus.MISSED, RDVStatus.NO_SHOW].includes(r.status)).length;
    return { total, confirmed, inProgress, completed, urgent, pending, cancelled, missed };
  };

  const handleDayClick = (dayDate: string, isClickable: boolean) => {
    if (!isClickable) return;
    
    const details = getDayDetails(dayDate);
    setSelectedDay(details);
    setIsDetailModalOpen(true);
    
   
  };

    /**
   * Gère le clic sur "Voir la journée"
   */
  const handleViewDay = (date: string) => {
    if (onDayClick) {
      onDayClick(date);
    }
  };

  const handlePreviousMonth = () => {
    const newDate = new Date(date);
    newDate.setMonth(newDate.getMonth() - 1);
    onDateChange(newDate.toISOString().split('T')[0]);
  };

  const handleNextMonth = () => {
    const newDate = new Date(date);
    newDate.setMonth(newDate.getMonth() + 1);
    onDateChange(newDate.toISOString().split('T')[0]);
  };

  const handleToday = () => {
    onDateChange(new Date().toISOString().split('T')[0]);
  };



  return (
    <div className="space-y-4">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={handlePreviousMonth}>
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white capitalize">
            {monthData.monthName} {monthData.year}
          </h2>
          <Button variant="ghost" size="sm" onClick={handleNextMonth}>
            <ChevronRight className="w-5 h-5" />
          </Button>
          <Button variant="outline" size="sm" onClick={handleToday}>
            Aujourd'hui
          </Button>
        </div>
      </div>

      {/* Grille */}
      <Card>
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500 mx-auto"></div>
            <p className="text-gray-500 mt-2">Chargement...</p>
          </div>
        ) : (
          <div>
            {/* En-tête des jours de la semaine */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map((day) => (
                <div key={day} className="p-2 text-center text-sm font-medium text-gray-500 dark:text-gray-400">
                  {day}
                </div>
              ))}
            </div>

            {/* Jours du mois */}
            <div className="grid grid-cols-7 gap-1">
              {monthData.days.map((day, index) => {
                const rdvs = getRdvCountForDay(day.date);
                const stats = getStatusSummary(rdvs);
                const isToday = day.date === new Date().toISOString().split('T')[0];
                const isFerie = isJourFerie(day.date);
                const isWeekend = [6, 7].includes(new Date(day.date).getDay() || 7);
                const isHovered = hoveredDay === day.date;
                const isClickable = day.isCurrentMonth && !isWeekend && !isFerie.isFerie;
                const hasRdvs = stats.total > 0;

                return (
                  <div
                    key={index}
                    className={`min-h-[100px] p-2 rounded-lg border transition-all ${
                      day.isCurrentMonth ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-900/50'
                    } ${isToday ? 'border-brand-500 ring-2 ring-brand-500 ring-opacity-50' : 'border-gray-200 dark:border-gray-700'} ${
                      isFerie.isFerie ? 'bg-red-50 dark:bg-red-900/10 border-red-300 dark:border-red-700' : ''
                    } ${isWeekend && !day.isCurrentMonth ? 'opacity-50' : ''} ${
                      isHovered ? 'shadow-lg' : ''
                    } ${isClickable ? 'hover:shadow-md cursor-pointer' : ''} ${hasRdvs ? 'hover:border-brand-300' : ''}`}
                    onMouseEnter={() => setHoveredDay(day.date)}
                    onMouseLeave={() => setHoveredDay(null)}
                    onClick={() => handleDayClick(day.date, isClickable || hasRdvs)}
                  >
                    <div className="flex justify-between items-start">
                      <span className={`text-lg font-semibold ${
                        isToday ? 'text-brand-600 dark:text-brand-400' :
                        day.isCurrentMonth ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-600'
                      }`}>
                        {day.day}
                      </span>
                      {stats.total > 0 && (
                        <Badge color="primary" variant="light" size="xs">
                          {stats.total}
                        </Badge>
                      )}
                    </div>

                    {isFerie.isFerie && (
                      <div className="text-xs text-red-500 truncate mt-1">
                        🎉 {isFerie.name}
                      </div>
                    )}

                    {stats.total > 0 && (
                      <div className="mt-2 space-y-0.5">
                        {isHovered ? (
                          // Détails au survol
                          <div className="text-xs space-y-0.5">
                            {stats.confirmed > 0 && (
                              <div className="flex items-center gap-1 text-green-600">
                                <CheckCircle className="w-3 h-3" />
                                {stats.confirmed} confirmés
                              </div>
                            )}
                            {stats.inProgress > 0 && (
                              <div className="flex items-center gap-1 text-blue-600">
                                <User className="w-3 h-3" />
                                {stats.inProgress} en cours
                              </div>
                            )}
                            {stats.pending > 0 && (
                              <div className="flex items-center gap-1 text-yellow-600">
                                <Clock className="w-3 h-3" />
                                {stats.pending} en attente
                              </div>
                            )}
                            {stats.urgent > 0 && (
                              <div className="flex items-center gap-1 text-red-500">
                                <AlertCircle className="w-3 h-3" />
                                {stats.urgent} urgent(s)
                              </div>
                            )}
                          </div>
                        ) : (
                          // Mini indicateurs
                          <div className="flex flex-wrap gap-1">
                            {stats.urgent > 0 && (
                              <div className="w-2 h-2 rounded-full bg-red-500"></div>
                            )}
                            {stats.inProgress > 0 && (
                              <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                            )}
                            {stats.confirmed > 0 && (
                              <div className="w-2 h-2 rounded-full bg-green-500"></div>
                            )}
                            {stats.pending > 0 && (
                              <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                            )}
                            {stats.completed > 0 && (
                              <div className="w-2 h-2 rounded-full bg-gray-500"></div>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {isHovered && stats.total > 0 && (
                      <div className="mt-2 text-xs text-brand-600 font-medium">
                        {stats.total} rendez-vous • Cliquez pour détails
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </Card>

      {/* Modal de détails du jour */}
        <DayDetailsModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        dayDetail={selectedDay}
        onViewDay={handleViewDay}
        onRdvClick={onRdvClick}
        />
    </div>
  );
};

export default CalendrierMois;