// src/pages/rendez-vous/DisponibilitesPage.tsx

import React, { useState, useEffect } from 'react';
import { 
  Clock, Plus, Trash2, Edit,  AlertCircle, ArrowLeft, Settings
} from 'lucide-react';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Select } from '../../components/ui/select';
import { Badge } from '../../components/ui/badge';
import { Modal } from '../../components/ui/modal';
import { useAuth } from '../../hooks/useAuth';
import { usePermission } from '../../hooks/usePermission';
import { formatTime } from '../../lib/date';
import { useNavigate } from 'react-router-dom';
import PermissionGuard from '../../components/auth/PermissionGuard';
import { PermissionCode, RoleName } from '../../types/auth';

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
  type: 'ABSENCE' | 'TRAINING' | 'HOLIDAY' | 'MISSION' | 'OTHER';
  reason: string;
  isFullDay: boolean;
  startTime?: string;
  endTime?: string;
}

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
  { value: 'HOLIDAY', label: 'Congé' },
  { value: 'MISSION', label: 'Mission' },
  { value: 'OTHER', label: 'Autre' },
];

export const DisponibilitesPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { can } = usePermission();
  
  // Check if user can manage other agents' availability (Admin or Ambassador)
  const canManageOthers = can(PermissionCode.AVAILABILITY_CONFIG);
  const isAdminOrAmbassador = user?.roles?.some((role: any) => 
    role.role.name === RoleName.ADMIN || role.role.name === RoleName.AMBASSADOR
  );
  
  const [isLoading, setIsLoading] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState(user?.id || '');

  // Force selectedAgent to current user if not admin/ambassador
  useEffect(() => {
    if (!canManageOthers && user?.id) {
      setSelectedAgent(user.id);
    }
  }, [canManageOthers, user?.id]);
  const [disponibilites, setDisponibilites] = useState<Disponibilite[]>([]);
  const [exceptions, setExceptions] = useState<Exception[]>([]);
  const [editingSlot, setEditingSlot] = useState<Disponibilite | null>(null);
  const [editingException, setEditingException] = useState<Exception | null>(null);
  const [showSlotModal, setShowSlotModal] = useState(false);
  const [showExceptionModal, setShowExceptionModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  // Charger les disponibilités
  useEffect(() => {
    if (selectedAgent) {
      loadDisponibilites();
    }
  }, [selectedAgent]);

  const loadDisponibilites = async () => {
    setIsLoading(true);
    try {
      // TODO: Appel API
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
      setExceptions([
        {
          id: '1',
          date: '2025-07-10',
          type: 'ABSENCE',
          reason: 'Congé annuel',
          isFullDay: true,
        },
      ]);
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setIsLoading(false);
    }
  };

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
      // TODO: Appel API
      if (editingSlot.id.startsWith('new-')) {
        setDisponibilites(prev => [...prev, { ...editingSlot, id: `slot-${Date.now()}` }]);
      } else {
        setDisponibilites(prev => prev.map(s => 
          s.id === editingSlot.id ? editingSlot : s
        ));
      }
      setShowSlotModal(false);
      setEditingSlot(null);
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
      setExceptions(prev => [...prev, { ...editingException, id: `exc-${Date.now()}` }]);
      setShowExceptionModal(false);
      setEditingException(null);
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
      setExceptions(prev => prev.filter(e => e.id !== exceptionId));
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (

    <PermissionGuard
      permission={PermissionCode.AVAILABILITY_UPDATE}
      minRoleLevel={5}
      title="Gestion des disponibilités"
      message="Vous n'avez pas les droits pour gérer les disponibilités."
      fallbackPath="/rendez-vous"
    >
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-6xl mx-auto">
          {/* En-tête */}
          <div className="flex items-center gap-4 mb-6">
            <Button variant="ghost" onClick={() => navigate('/rendez-vous')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour
            </Button>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {canManageOthers ? 'Gestion des disponibilités' : 'Mes disponibilités'}
            </h1>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Configuration */}
            <Card className="lg:col-span-1 p-4">
              <div className="space-y-4">
                <h3 className="font-medium text-gray-900 dark:text-white">
                  <Settings className="w-4 h-4 inline mr-2" />
                  Configuration
                </h3>

                {canManageOthers && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Agent
                    </label>
                    <Select
                      value={selectedAgent}
                      onChange={(e: any) => setSelectedAgent(e.target.value)}
                      options={[
                        { value: '', label: 'Sélectionnez un agent' },
                        { value: 'agent-002-fatima', label: 'Fatima COULIBALY' },
                        { value: 'agent-003-amadou', label: 'Amadou DIALLO' },
                      ]}
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Date
                  </label>
                  <Input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                  />
                </div>

                <Button
                  variant="primary"
                  className="w-full"
                  onClick={loadDisponibilites}
                  disabled={isLoading}
                >
                  {isLoading ? 'Chargement...' : 'Charger'}
                </Button>
              </div>
            </Card>

            {/* Disponibilités */}
            <Card className="lg:col-span-2 p-4">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-gray-900 dark:text-white">
                    <Clock className="w-4 h-4 inline mr-2" />
                    Disponibilités hebdomadaires
                  </h3>
                  <Button size="sm" onClick={handleAddSlot}>
                    <Plus className="w-4 h-4 mr-1" />
                    Ajouter un créneau
                  </Button>
                </div>

                {isLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500 mx-auto"></div>
                    <p className="text-gray-500 mt-2">Chargement...</p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-2">
                      {disponibilites.map((slot) => (
                        <Card key={slot.id} className="p-3 flex items-center justify-between hover:shadow-md transition-shadow">
                          <div className="flex items-center gap-4">
                            <div className="w-24 font-medium text-gray-900 dark:text-white">
                              {days.find(d => d.value === slot.dayOfWeek)?.label}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-300">
                              {slot.startTime} - {formatTime(slot.endTime)}
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
                  </>
                )}
              </div>

              {/* Exceptions */}
              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium text-gray-900 dark:text-white">
                    <AlertCircle className="w-4 h-4 inline mr-2" />
                    Exceptions
                  </h3>
                  <Button size="sm" variant="outline" onClick={handleAddException}>
                    <Plus className="w-4 h-4 mr-1" />
                    Ajouter une exception
                  </Button>
                </div>

                <div className="space-y-2">
                  {exceptions.map((exception) => (
                    <Card key={exception.id} className="p-3 flex items-center justify-between hover:shadow-md transition-shadow">
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
            </Card>
          </div>
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
                onChange={(e: any) => setEditingSlot({ ...editingSlot, dayOfWeek: parseInt(e.target.value) })}
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

              <div className="text-sm text-gray-500 dark:text-gray-400">
              Les exceptions sont des périodes où le professionnel n'est pas disponible pour des raisons spécifiques (congé, formation, absence, etc.).
              </div>
              <Input
                label="Date"
                type="date"
                value={editingException.date}
                onChange={(e) => setEditingException({ ...editingException, date: e.target.value })}
              />

             <div className="text-sm font-medium text-gray-700 dark:text-gray-300">Type d'exception</div>
              <Select
                label="Type"
                value={editingException.type}
                onChange={(value) => setEditingException({ ...editingException, type: value as any })}
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
      </div>
    </PermissionGuard>
  );
};

export default DisponibilitesPage;