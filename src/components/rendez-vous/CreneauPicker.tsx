// src/components/rendez-vous/CreneauPicker.tsx

import React, { useState, useEffect, useMemo } from 'react';
import { Clock, User, CheckCircle, XCircle, AlertCircle, Loader2 } from 'lucide-react';
import {Button} from '../ui/button';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Select } from '../ui/select';
import { useRendezVous } from '../../hooks/useRendezVous';
import { useAuth } from '../../hooks/useAuth';
import { formatTime, formatDateShort } from '../../lib/date';
import { SUB_SERVICES } from '../../config/services-consulaires';

interface CreneauPickerProps {
  date: string;
  subServiceId?: string;
  agentId?: string;
  onSlotSelect: (slotId: string) => void;
  selectedSlotId?: string;
  disabled?: boolean;
}

export const CreneauPicker: React.FC<CreneauPickerProps> = ({
  date,
  subServiceId: initialSubServiceId,
  agentId: initialAgentId,
  onSlotSelect,
  selectedSlotId,
  disabled = false,
}) => {
  const { slots, fetchSlots, isLoading } = useRendezVous();
  const { user } = useAuth();
  const [selectedSubService, setSelectedSubService] = useState(initialSubServiceId || '');
  const [selectedAgent, setSelectedAgent] = useState(initialAgentId || '');

  useEffect(() => {
    if (selectedSubService || selectedAgent) {
      fetchSlots(date, selectedSubService || undefined, selectedAgent || undefined);
    }
  }, [date, selectedSubService, selectedAgent]);

  const availableSlots = useMemo(() => {
    return slots.filter(slot => !slot.isBooked && !slot.isBlocked);
  }, [slots]);

  const serviceOptions = useMemo(() => {
    return [
      { value: '', label: 'Tous les services' },
      ...SUB_SERVICES.map(s => ({ value: s.id, label: s.name }))
    ];
  }, []);

  const getSlotStatus = (slot: any) => {
    if (slot.isBlocked) return 'blocked';
    if (slot.isBooked) return 'booked';
    return 'available';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'available':
        return { color: 'success' as const, text: 'Disponible' };
      case 'booked':
        return { color: 'error' as const, text: 'Réservé' };
      case 'blocked':
        return { color: 'warning' as const, text: 'Bloqué' };
      default:
        return { color: 'gray' as const, text: 'Indisponible' };
    }
  };

  return (
    <div className="space-y-4">
      {/* Filtres */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Select
          label="Service"
          value={selectedSubService}
          onChange={(e: any) => setSelectedSubService(e.target.value)}
          options={serviceOptions}
          disabled={disabled}
        />
        <Select
          label="Agent"
          value={selectedAgent}
          onChange={(e: any) => setSelectedAgent(e.target.value)}
          options={[
            { value: '', label: 'Tous les agents' },
            // TODO: Charger les agents depuis l'API
          ]}
          disabled={disabled}
        />
      </div>

      {/* Liste des créneaux */}
      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
        </div>
      ) : availableSlots.length === 0 ? (
        <Card className="p-8 text-center">
          <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Aucun créneau disponible
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            Aucun créneau disponible pour le {formatDateShort(date)}.
            {!selectedSubService && !selectedAgent && ' Veuillez sélectionner un service ou un agent.'}
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {availableSlots.map((slot) => {
            const status = getSlotStatus(slot);
            const statusConfig = getStatusBadge(status);
            const isSelected = selectedSlotId === slot.id;

            return (
              <Card
                key={slot.id}
                className={`p-4 cursor-pointer transition-all hover:shadow-md ${
                  isSelected ? 'ring-2 ring-brand-500 ring-offset-2' : ''
                } ${status === 'available' ? '' : 'opacity-50 cursor-not-allowed'}`}
                onClick={() => {
                  if (status === 'available' && !disabled) {
                    onSlotSelect(slot.id);
                  }
                }}
              >
                <div className="text-center">
                  <div className="text-lg font-bold text-gray-900 dark:text-white">
                    {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {slot.subService?.name || 'Service non spécifié'}
                  </div>
                  <Badge
                    color={statusConfig.color}
                    variant="light"
                    className="mt-2"
                  >
                    {statusConfig.text}
                  </Badge>
                  {slot.agent && (
                    <div className="text-xs text-gray-400 mt-1">
                      {slot.agent.user?.profile?.firstName} {slot.agent.user?.profile?.lastName}
                    </div>
                  )}
                  {slot.isBlocked && slot.blockReason && (
                    <div className="text-xs text-yellow-600 mt-1 truncate">
                      {slot.blockReason}
                    </div>
                  )}
                  {isSelected && (
                    <div className="mt-2">
                      <CheckCircle className="w-4 h-4 text-brand-500 mx-auto" />
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CreneauPicker;