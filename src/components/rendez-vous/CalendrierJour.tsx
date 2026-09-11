// src/components/rendez-vous/CalendrierJour.tsx

import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Clock, User, CheckCircle, XCircle, AlertCircle, Calendar, Shield } from 'lucide-react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { RendezVousCard } from './RendezVousCard';
import { useRendezVous } from '../../hooks/useRendezVous';
import { usePermission } from '../../hooks/usePermission';
import { formatDateShort, isJourFerie } from '../../lib/date';
import { RDVStatus } from '../../types/rendez-vous';

interface CalendrierJourProps {
  date: string;
  onDateChange: (date: string) => void;
  onRdvClick?: (rdvId: string) => void;
}

export const CalendrierJour: React.FC<CalendrierJourProps> = ({
  date,
  onDateChange,
  onRdvClick,
}) => {
  const {
    rendezVousDuJour,
    statsJour,
    refreshJour,
    isLoading,
    updateRendezVousStatus,
    cancelRendezVous,
  } = useRendezVous();


  const [selectedRdv, setSelectedRdv] = useState<string | null>(null);

  const currentDate = new Date(date);
  const isFerie = isJourFerie(date);
  const isWeekend = [6, 7].includes(currentDate.getDay() || 7);

  const handlePreviousDay = () => {
    const newDate = new Date(date);
    newDate.setDate(newDate.getDate() - 1);
    onDateChange(newDate.toISOString().split('T')[0]);
  };

  const handleNextDay = () => {
    const newDate = new Date(date);
    newDate.setDate(newDate.getDate() + 1);
    onDateChange(newDate.toISOString().split('T')[0]);
  };

  const handleToday = () => {
    onDateChange(new Date().toISOString().split('T')[0]);
  };

  const handleStatusUpdate = async (rdvId: string, status: RDVStatus) => {
    await updateRendezVousStatus(rdvId, status);
    //await refreshJour();
  };

  const handleCancel = async (rdvId: string) => {
    const reason = window.prompt("Motif de l'annulation:");
    if (reason) {
      await cancelRendezVous(rdvId, reason);
      //await refreshJour();
    }
  };

  // Gestionnaire d'actions pour RendezVousCard
  const handleRdvAction = (action: string, rdv: any) => {
    switch (action) {
      case 'update':
        //refreshJour();
        break;
      case 'cancel':
        //refreshJour();
        break;
      default:
        break;
    }
  };

  return (
    <div className="space-y-6">
      {/* En-tête du jour */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={handlePreviousDay}>
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {formatDateShort(date)}
            </h2>
            {isFerie && (
              <Badge color="error" variant="solid" className="mt-1">
                {isFerie.name}
              </Badge>
            )}
            {isWeekend && !isFerie && (
              <Badge color="warning" variant="light" className="mt-1">
                Weekend
              </Badge>
            )}
          </div>
          <Button variant="ghost" size="sm" onClick={handleNextDay}>
            <ChevronRight className="w-5 h-5" />
          </Button>
          <Button variant="outline" size="sm" onClick={handleToday}>
            Aujourd'hui
          </Button>
        </div>


      </div>

      {/* Statistiques du jour */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        <Card className="p-3 text-center">
          <div className="text-xl font-bold text-gray-900 dark:text-white">{statsJour.total}</div>
          <div className="text-xs text-gray-500">Total</div>
        </Card>
        <Card className="p-3 text-center">
          <div className="text-xl font-bold text-yellow-600">{statsJour.confirmes}</div>
          <div className="text-xs text-gray-500">Confirmés</div>
        </Card>
        <Card className="p-3 text-center">
          <div className="text-xl font-bold text-blue-600">{statsJour.enCours}</div>
          <div className="text-xs text-gray-500">En cours</div>
        </Card>
        <Card className="p-3 text-center">
          <div className="text-xl font-bold text-green-600">{statsJour.termines}</div>
          <div className="text-xs text-gray-500">Terminés</div>
        </Card>
        <Card className="p-3 text-center">
          <div className="text-xl font-bold text-red-600">{statsJour.urgents}</div>
          <div className="text-xs text-gray-500">Urgents</div>
        </Card>
        <Card className="p-3 text-center">
          <div className="text-xl font-bold text-gray-600">{statsJour.absents}</div>
          <div className="text-xs text-gray-500">Absents</div>
        </Card>
        <Card className="p-3 text-center">
          <div className="text-xl font-bold text-gray-600">{statsJour.annules}</div>
          <div className="text-xs text-gray-500">Annulés</div>
        </Card>
      </div>

      {/* Liste des rendez-vous avec RendezVousCard réutilisé */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500 mx-auto"></div>
            <p className="text-gray-500 mt-2">Chargement...</p>
          </div>
        ) : rendezVousDuJour.length === 0 ? (
          <Card className="p-8 text-center">
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Aucun rendez-vous
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              Aucun rendez-vous prévu pour cette date.
            </p>
          </Card>
        ) : (
          rendezVousDuJour.map((rdv: any) => (
            <RendezVousCard
              key={rdv.id}
              rendezVous={rdv}
              onAction={handleRdvAction}
              onView={(rdv) => onRdvClick?.(rdv.id)}
              compact={false}
              showActions={true}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default CalendrierJour;