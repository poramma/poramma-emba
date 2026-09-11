// src/components/rendez-vous/DisponibiliteForm.tsx

import React, { useState, useEffect } from 'react';
import { 
  Plus, Trash2, Edit, AlertCircle
} from 'lucide-react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select } from '../ui/select';
import { Badge } from '../ui/badge';
import { Modal } from '../ui/modal';
import { useAuth } from '../../hooks/useAuth';
import { usePermission } from '../../hooks/usePermission';
import { formatTime } from '../../lib/date';

interface DisponibiliteFormProps {
  isOpen: boolean;
  onClose: () => void;
  agentId?: string;
  onSuccess?: () => void;
}

interface Disponibilite {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
  validFrom?: string;
  validUntil?: string | null;
}

interface Exception {
  id: string;
  date: string;
  type: 'ABSENCE' | 'TRAINING' | 'MISSION' | 'OTHER';
  reason: string;
  isFullDay: boolean;
  startTime?: string;
  endTime?: string;
}

export const DisponibiliteForm: React.FC<DisponibiliteFormProps> = ({
  isOpen,
  onClose,
  agentId,
  onSuccess,
}) => {
  const { user } = useAuth();
  const { canManageServices } = usePermission();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState(agentId || '');
  const [disponibilites, setDisponibilites] = useState<Disponibilite[]>([]);
  const [exceptions, setExceptions] = useState<Exception[]>([]);
  const [editingSlot, setEditingSlot] = useState<Disponibilite | null>(null);
  const [editingException, setEditingException] = useState<Exception | null>(null);
  const [showSlotModal, setShowSlotModal] = useState(false);
  const [showExceptionModal, setShowExceptionModal] = useState(false);

  const days = [
    { value: 1, label: 'Lundi' },
    { value: 2, label: 'Mardi' },
    { value: 3, label: 'Mercredi' },
    { value: 4, label: 'Jeudi' },
    { value: 5, label: 'Vendredi' },
    { value: 6, label: 'Samedi' },
    { value: 7, label: 'Dimanche' },
  ];

  const exceptionTypes = [
    { value: 'ABSENCE', label: 'Absence' },
    { value: 'TRAINING', label: 'Formation' },
    { value: 'MISSION', label: 'Mission' },
    { value: 'OTHER', label: 'Autre' },
  ];

  // Charger les disponibilités (mock)
  useEffect(() => {
    // TODO: Appel API pour charger les disponibilités
    // const response = await api.get(`/agents/${selectedAgent}/availabilities`);
    // setDisponibilites(response.data);
    
    // Mock
    setDisponibilites([
      { id: '1', dayOfWeek: 1, startTime: '09:00', endTime: '12:00', isAvailable: true },
      { id: '2', dayOfWeek: 1, startTime: '14:00', endTime: '17:00', isAvailable: true },
      { id: '3', dayOfWeek: 2, startTime: '09:00', endTime: '12:00', isAvailable: true },
      { id: '4', dayOfWeek: 2, startTime: '14:00', endTime: '17:00', isAvailable: false },
      { id: '5', dayOfWeek: 3, startTime: '09:00', endTime: '12:00', isAvailable: true },
      { id: '6', dayOfWeek: 3, startTime: '14:00', endTime: '17:00', isAvailable: true },
      { id: '7', dayOfWeek: 4, startTime: '09:00', endTime: '12:00', isAvailable: true },
      { id: '8', dayOfWeek: 4, startTime: '14:00', endTime: '17:00', isAvailable: true },
      { id: '9', dayOfWeek: 5, startTime: '09:00', endTime: '12:00', isAvailable: true },
      { id: '10', dayOfWeek: 5, startTime: '14:00', endTime: '15:00', isAvailable: true },
    ]);
  }, [selectedAgent]);

  const handleAddSlot = () => {
    setEditingSlot({
      id: `new-${Date.now()}`,
      dayOfWeek: 1,
      startTime: '09:00',
      endTime: '12:00',
      isAvailable: true,
    });
    setShowSlotModal(true);
  };

  const handleEditSlot = (slot: Disponibilite) => {
    setEditingSlot({ ...slot });
    setShowSlotModal(true);
  };

  const handleSaveSlot = async () => {
    if (!editingSlot) return;

    setIsLoading(true);
    try {
      // TODO: Appel API pour sauvegarder la disponibilité
      // if (editingSlot.id.startsWith('new-')) {
      //   await api.post(`/agents/${selectedAgent}/availabilities`, editingSlot);
      // } else {
      //   await api.put(`/agents/${selectedAgent}/availabilities/${editingSlot.id}`, editingSlot);
      // }
      
      // Mock
      if (editingSlot.id.startsWith('new-')) {
        setDisponibilites(prev => [...prev, { ...editingSlot, id: `slot-${Date.now()}` }]);
      } else {
        setDisponibilites(prev => prev.map(s => 
          s.id === editingSlot.id ? editingSlot : s
        ));
      }
      
      setShowSlotModal(false);
      setEditingSlot(null);
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteSlot = async (slotId: string) => {
    if (!window.confirm('Supprimer ce créneau ?')) return;

    setIsLoading(true);
    try {
      // TODO: Appel API
      // await api.delete(`/agents/${selectedAgent}/availabilities/${slotId}`);
      setDisponibilites(prev => prev.filter(s => s.id !== slotId));
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddException = () => {
    setEditingException({
      id: `new-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      type: 'OTHER',
      reason: '',
      isFullDay: true,
    });
    setShowExceptionModal(true);
  };

  const handleSaveException = async () => {
    if (!editingException) return;

    setIsLoading(true);
    try {
      // TODO: Appel API
      // await api.post(`/agents/${selectedAgent}/exceptions`, editingException);
      
      // Mock
      setExceptions(prev => [...prev, { ...editingException, id: `exc-${Date.now()}` }]);
      setShowExceptionModal(false);
      setEditingException(null);
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteException = async (exceptionId: string) => {
    if (!window.confirm('Supprimer cette exception ?')) return;

    setIsLoading(true);
    try {
      // TODO: Appel API
      // await api.delete(`/agents/${selectedAgent}/exceptions/${exceptionId}`);
      setExceptions(prev => prev.filter(e => e.id !== exceptionId));
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Vérifier la permission
  if (!canManageServices()) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Accès refusé">
        <div className="p-6 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Permission insuffisante
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Vous n'avez pas les droits pour gérer les disponibilités.
          </p>
          <Button className="mt-4" variant="primary" onClick={onClose}>
            Fermer
          </Button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Gestion des disponibilités"
      size="lg"
    >
      <div className="space-y-6">
        {/* Sélection de l'agent */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Agent
          </label>
          <Select
            value={selectedAgent}
            onChange={(value) => setSelectedAgent(value)}
            options={[
              { value: '', label: 'Sélectionnez un agent' },
              // TODO: Charger depuis l'API
              { value: 'agent-002-fatima', label: 'Fatima COULIBALY' },
              { value: 'agent-003-amadou', label: 'Amadou DIALLO' },
            ]}
          />
        </div>

        {selectedAgent && (
          <>
            {/* Disponibilités hebdomadaires */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-gray-900 dark:text-white">
                  Disponibilités hebdomadaires
                </h3>
                <Button size="sm" onClick={handleAddSlot}>
                  <Plus className="w-4 h-4 mr-1" />
                  Ajouter
                </Button>
              </div>

              <div className="space-y-2">
                {disponibilites.map((slot) => (
                  <Card key={slot.id} className="p-3 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-24 font-medium text-gray-900 dark:text-white">
                        {days.find(d => d.value === slot.dayOfWeek)?.label}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-300">
                        nnn - {formatTime(slot.endTime)}
                      </div>
                      <Badge color={slot.isAvailable ? 'success' : 'error'} variant="light">
                        {slot.isAvailable ? 'Disponible' : 'Indisponible'}
                      </Badge>
                    </div>
                    <div className="flex gap-2">
                      <Button size="xs" variant="ghost" onClick={() => handleEditSlot(slot)}>
                        <Edit className="w-3 h-3" />
                      </Button>
                      <Button size="xs" variant="ghost" onClick={() => handleDeleteSlot(slot.id)}>
                        <Trash2 className="w-3 h-3 text-red-500" />
                      </Button>
                    </div>
                  </Card>
                ))}

                {disponibilites.length === 0 && (
                  <p className="text-center text-gray-500 py-4">
                    Aucune disponibilité configurée
                  </p>
                )}
              </div>
            </div>

            {/* Exceptions */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-gray-900 dark:text-white">
                  Exceptions
                </h3>
                <Button size="sm" variant="outline" onClick={handleAddException}>
                  <Plus className="w-4 h-4 mr-1" />
                  Ajouter une exception
                </Button>
              </div>

              <div className="space-y-2">
                {exceptions.map((exception) => (
                  <Card key={exception.id} className="p-3 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {new Date(exception.date).toLocaleDateString()}
                      </div>
                      <Badge color="warning" variant="light">
                        {exception.type}
                      </Badge>
                      <div className="text-sm text-gray-600 dark:text-gray-300">
                        {exception.isFullDay ? 'Journée complète' : 
                          `${formatTime(exception.startTime || '')} - ${formatTime(exception.endTime || '')}`}
                      </div>
                      <div className="text-sm text-gray-500">{exception.reason}</div>
                    </div>
                    <Button size="xs" variant="ghost" onClick={() => handleDeleteException(exception.id)}>
                      <Trash2 className="w-3 h-3 text-red-500" />
                    </Button>
                  </Card>
                ))}

                {exceptions.length === 0 && (
                  <p className="text-center text-gray-500 py-4">
                    Aucune exception
                  </p>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Modal d'édition de créneau */}
      <Modal
        isOpen={showSlotModal}
        onClose={() => setShowSlotModal(false)}
        title={editingSlot?.id.startsWith('new-') ? 'Nouveau créneau' : 'Modifier le créneau'}
        size="md"
      >
        {editingSlot && (
          <div className="space-y-4">
            <Select
              label="Jour"
              value={String(editingSlot.dayOfWeek)}
              onChange={(value) => setEditingSlot({ ...editingSlot, dayOfWeek: parseInt(value) })}
              options={days.map(d => ({ value: String(d.value), label: d.label }))}
            />
            
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Heure de début"
                type="time"
                value={editingSlot.startTime}
                onChange={(e) => setEditingSlot({ ...editingSlot, startTime: e.target.value })}
              />
              <Input
                label="Heure de fin"
                type="time"
                value={editingSlot.endTime}
                onChange={(e) => setEditingSlot({ ...editingSlot, endTime: e.target.value })}
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                <input
                  type="checkbox"
                  checked={editingSlot.isAvailable}
                  onChange={(e) => setEditingSlot({ ...editingSlot, isAvailable: e.target.checked })}
                  className="rounded text-brand-500"
                />
                Disponible
              </label>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button variant="ghost" onClick={() => setShowSlotModal(false)}>
                Annuler
              </Button>
              <Button variant="primary" onClick={handleSaveSlot} disabled={isLoading}>
                {isLoading ? 'Sauvegarde...' : 'Sauvegarder'}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal d'exception */}
      <Modal
        isOpen={showExceptionModal}
        onClose={() => setShowExceptionModal(false)}
        title="Nouvelle exception"
        size="md"
      >
        {editingException && (
          <div className="space-y-4">
            <Input
              label="Date"
              type="date"
              value={editingException.date}
              onChange={(e) => setEditingException({ ...editingException, date: e.target.value })}
            />

            <Select
              label="Type"
              value={editingException.type}
              onChange={(value) => setEditingException({ ...editingException, type: value as "ABSENCE" | "TRAINING" | "MISSION" | "OTHER" })}
              options={exceptionTypes}
            />

            <Input
              label="Raison"
              placeholder="Motif de l'exception..."
              value={editingException.reason}
              onChange={(e) => setEditingException({ ...editingException, reason: e.target.value })}
            />

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                <input
                  type="checkbox"
                  checked={editingException.isFullDay}
                  onChange={(e) => setEditingException({ ...editingException, isFullDay: e.target.checked })}
                  className="rounded text-brand-500"
                />
                Journée complète
              </label>
            </div>

            {!editingException.isFullDay && (
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Heure de début"
                  type="time"
                  value={editingException.startTime || ''}
                  onChange={(e) => setEditingException({ ...editingException, startTime: e.target.value })}
                />
                <Input
                  label="Heure de fin"
                  type="time"
                  value={editingException.endTime || ''}
                  onChange={(e) => setEditingException({ ...editingException, endTime: e.target.value })}
                />
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button variant="ghost" onClick={() => setShowExceptionModal(false)}>
                Annuler
              </Button>
              <Button variant="primary" onClick={handleSaveException} disabled={isLoading}>
                {isLoading ? 'Sauvegarde...' : 'Sauvegarder'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </Modal>
  );
};

export default DisponibiliteForm;