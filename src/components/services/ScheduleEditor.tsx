// src/components/services/ScheduleEditor.tsx

import React, { useState } from 'react';
import { 
  Clock, Calendar, Plus, Trash2, Edit, Users
} from 'lucide-react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select } from '../ui/select';
import { Badge } from '../ui/badge';
import { Modal } from '../ui/modal';
import { useServices } from '../../hooks/useServices';
import { ServiceSchedule } from '../../types/services';
import { formatTime } from '../../lib/date';

interface ScheduleEditorProps {
  subServiceId: string;
  schedules: ServiceSchedule[];
  onUpdate?: () => void;
  readOnly?: boolean;
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

export const ScheduleEditor: React.FC<ScheduleEditorProps> = ({
  subServiceId,
  schedules,
  onUpdate,
  readOnly = false,
}) => {
  const { createSchedule, updateSchedule, deleteSchedule, isLoading } = useServices();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<ServiceSchedule | null>(null);
  const [formData, setFormData] = useState({
    dayOfWeek: 1,
    startTime: '09:00',
    endTime: '12:00',
    slotDurationMinutes: 30,
    maxConcurrentSlots: 1,
    isActive: true,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getDayLabel = (day: number) => {
    return DAYS.find(d => d.value === day)?.label || day;
  };

  const handleAdd = () => {
    setEditingSchedule(null);
    setFormData({
      dayOfWeek: 1,
      startTime: '09:00',
      endTime: '12:00',
      slotDurationMinutes: 30,
      maxConcurrentSlots: 1,
      isActive: true,
    });
    setErrors({});
    setIsModalOpen(true);
  };

  const handleEdit = (schedule: ServiceSchedule) => {
    setEditingSchedule(schedule);
    setFormData({
      dayOfWeek: schedule.dayOfWeek,
      startTime: schedule.startTime,
      endTime: schedule.endTime,
      slotDurationMinutes: schedule.slotDurationMinutes,
      maxConcurrentSlots: schedule.maxConcurrentSlots,
      isActive: schedule.isActive,
    });
    setErrors({});
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Supprimer ce créneau ?')) return;
    
    try {
      await deleteSchedule(id);
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.startTime) newErrors.startTime = 'Heure de début requise';
    if (!formData.endTime) newErrors.endTime = 'Heure de fin requise';
    if (formData.startTime >= formData.endTime) {
      newErrors.endTime = 'L\'heure de fin doit être après l\'heure de début';
    }
    if (formData.slotDurationMinutes < 5) {
      newErrors.slotDurationMinutes = 'La durée doit être d\'au moins 5 minutes';
    }
    if (formData.maxConcurrentSlots < 1) {
      newErrors.maxConcurrentSlots = 'Au moins 1 créneau simultané';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      if (editingSchedule) {
        await updateSchedule(editingSchedule.id, {
          ...formData,
          validFrom: editingSchedule.validFrom,
          validUntil: editingSchedule.validUntil,
        });
      } else {
        await createSchedule(subServiceId, {
          ...formData,
          validFrom: new Date().toISOString().split('T')[0],
          validUntil: null,
        });
      }
      
      setIsModalOpen(false);
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-brand-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-gray-400" />
          <h4 className="font-medium text-gray-900 dark:text-white">Horaires</h4>
          <Badge color="primary" variant="light" size="xs">
            {schedules.length} créneaux
          </Badge>
        </div>
        {!readOnly && (
          <Button size="sm" onClick={handleAdd}>
            <Plus className="w-4 h-4 mr-1" />
            Ajouter
          </Button>
        )}
      </div>

      {/* Liste des horaires */}
      {schedules.length === 0 ? (
        <Card className="p-4 text-center">
          <Calendar className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-500">Aucun horaire configuré</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {schedules.map((schedule) => (
            <Card key={schedule.id} className="p-3 flex items-center justify-between hover:shadow-md transition-shadow">
              <div className="flex items-center gap-4">
                <div className="w-24 font-medium text-gray-900 dark:text-white">
                  {getDayLabel(schedule.dayOfWeek)}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-300">
                  {formatTime(schedule.startTime)} - {formatTime(schedule.endTime)}
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {schedule.slotDurationMinutes} min
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {schedule.maxConcurrentSlots} simultanés
                  </span>
                </div>
                <Badge color={schedule.isActive ? 'success' : 'error'} variant="light">
                  {schedule.isActive ? 'Actif' : 'Inactif'}
                </Badge>
              </div>
              {!readOnly && (
                <div className="flex gap-1">
                  <Button size="xs" variant="ghost" onClick={() => handleEdit(schedule)}>
                    <Edit className="w-3 h-3" />
                  </Button>
                  <Button size="xs" variant="ghost" onClick={() => handleDelete(schedule.id)}>
                    <Trash2 className="w-3 h-3 text-red-500" />
                  </Button>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Modal d'édition */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingSchedule ? 'Modifier le créneau' : 'Nouveau créneau'}
        size="md"
      >
        <div className="space-y-4">
          <Select
            label="Jour"
            value={String(formData.dayOfWeek)}
            onChange={(value) => setFormData({ ...formData, dayOfWeek: parseInt(value) })}
            options={DAYS.map(d => ({ value: String(d.value), label: d.label }))}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Heure de début"
              type="time"
              value={formData.startTime}
              onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
              error={!!errors.startTime}
            />
            <Input
              label="Heure de fin"
              type="time"
              value={formData.endTime}
              onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
              error={!!errors.endTime}
            />
          </div>
          {errors.startTime && <p className="text-sm text-red-600">{errors.startTime}</p>}
          {errors.endTime && <p className="text-sm text-red-600">{errors.endTime}</p>}

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Durée par créneau (minutes)"
              type="number"
              value={formData.slotDurationMinutes}
              onChange={(e) => setFormData({ ...formData, slotDurationMinutes: parseInt(e.target.value) })}
              error={!!errors.slotDurationMinutes}
              minLength={5}
              maxLength={120}
            />
            <Input
              label="Créneaux simultanés max"
              type="number"
              value={formData.maxConcurrentSlots}
              onChange={(e) => setFormData({ ...formData, maxConcurrentSlots: parseInt(e.target.value) })}
              error={!!errors.maxConcurrentSlots}
              minLength={1}
              maxLength={10}
            />
          </div>

          <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
            <input
              type="checkbox"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="rounded text-brand-500"
            />
            Actif
          </label>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="ghost" onClick={() => setIsModalOpen(false)}>
              Annuler
            </Button>
            <Button variant="primary" onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? 'Sauvegarde...' : 'Sauvegarder'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ScheduleEditor;