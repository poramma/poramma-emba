import React, { useState } from 'react';
import {
  Calendar, Clock, Plus, Trash2, Edit, Save, X,
  Lock, Unlock, Settings, RefreshCw, Download, Upload
} from 'lucide-react';
import Button from '../../components/ui/button/Button';
import Badge from '../../components/ui/badge/Badge';
import Card from '../../components/ui/card/Card';
import Input from '../../components/form/input/InputField';
import Select from '../../components/form/Select';
import Switch from '../../components/form/switch/Switch';

// Types et interfaces
interface TimeSlot {
  id: string;
  day: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
  startTime: string;
  endTime: string;
  enabled: boolean;
}

interface BlockedPeriod {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  reason: string;
  recurring: boolean;
}

interface DayConfig {
  day: string;
  label: string;
  enabled: boolean;
  timeSlots: TimeSlot[];
}

// Données mockées
const initialDaysConfig: DayConfig[] = [
  { day: 'monday', label: 'Lundi', enabled: true, timeSlots: [
    { id: '1', day: 'monday', startTime: '09:00', endTime: '12:00', enabled: true },
    { id: '2', day: 'monday', startTime: '14:00', endTime: '17:00', enabled: true }
  ]},
  { day: 'tuesday', label: 'Mardi', enabled: true, timeSlots: [
    { id: '3', day: 'tuesday', startTime: '09:00', endTime: '12:00', enabled: true },
    { id: '4', day: 'tuesday', startTime: '14:00', endTime: '17:00', enabled: true }
  ]},
  { day: 'wednesday', label: 'Mercredi', enabled: true, timeSlots: [
    { id: '5', day: 'wednesday', startTime: '09:00', endTime: '12:00', enabled: true },
    { id: '6', day: 'wednesday', startTime: '14:00', endTime: '17:00', enabled: true }
  ]},
  { day: 'thursday', label: 'Jeudi', enabled: true, timeSlots: [
    { id: '7', day: 'thursday', startTime: '09:00', endTime: '12:00', enabled: true },
    { id: '8', day: 'thursday', startTime: '14:00', endTime: '17:00', enabled: true }
  ]},
  { day: 'friday', label: 'Vendredi', enabled: true, timeSlots: [
    { id: '9', day: 'friday', startTime: '09:00', endTime: '12:00', enabled: true },
    { id: '10', day: 'friday', startTime: '14:00', endTime: '16:00', enabled: true }
  ]},
  { day: 'saturday', label: 'Samedi', enabled: false, timeSlots: [] },
  { day: 'sunday', label: 'Dimanche', enabled: false, timeSlots: [] }
];

const mockBlockedPeriods: BlockedPeriod[] = [
  {
    id: '1',
    title: 'Congés annuels',
    startDate: '2024-02-01',
    endDate: '2024-02-15',
    reason: 'Congés annuels',
    recurring: false
  },
  {
    id: '2',
    title: 'Formation interne',
    startDate: '2024-01-25',
    endDate: '2024-01-26',
    reason: 'Formation des agents',
    recurring: false
  }
];

// Composant TimeSlotEditor
const TimeSlotEditor: React.FC<{
  timeSlot: TimeSlot;
  onUpdate: (timeSlot: TimeSlot) => void;
  onDelete: (id: string) => void;
}> = ({ timeSlot, onUpdate, onDelete }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState(timeSlot);

  const handleSave = () => {
    onUpdate(editData);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditData(timeSlot);
    setIsEditing(false);
  };

  return (
    <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
      {isEditing ? (
        <>
          <Input
            type="time"
            value={editData.startTime}
            onChange={(e) => setEditData({ ...editData, startTime: e.target.value })}
            className="w-32"
          />
          <span className="text-gray-500">à</span>
          <Input
            type="time"
            value={editData.endTime}
            onChange={(e) => setEditData({ ...editData, endTime: e.target.value })}
            className="w-32"
          />
          <div className="flex gap-2 ml-auto">
            <Button size="sm" variant="success" onClick={handleSave}>
              <Save className="w-4 h-4" />
            </Button>
            <Button size="sm" variant="outline" onClick={handleCancel}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </>
      ) : (
        <>
          <span className="font-medium text-gray-900 dark:text-white">
            {timeSlot.startTime} - {timeSlot.endTime}
          </span>
          <Badge color={timeSlot.enabled ? 'success' : 'error'} variant="light">
            {timeSlot.enabled ? 'Actif' : 'Inactif'}
          </Badge>
          <div className="flex gap-2 ml-auto">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setIsEditing(true)}
              title="Modifier"
            >
              <Edit className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onDelete(timeSlot.id)}
              className="text-red-600 hover:text-red-800"
              title="Supprimer"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </>
      )}
    </div>
  );
};

// Composant principal MyAgendaPage
const MyAgendaPage: React.FC = () => {
  const [daysConfig, setDaysConfig] = useState<DayConfig[]>(initialDaysConfig);
  const [blockedPeriods, setBlockedPeriods] = useState<BlockedPeriod[]>(mockBlockedPeriods);
  const [newTimeSlot, setNewTimeSlot] = useState<{ day: string; startTime: string; endTime: string } | null>(null);
  const [newBlockedPeriod, setNewBlockedPeriod] = useState<Partial<BlockedPeriod> | null>(null);

  const toggleDayEnabled = (day: string) => {
    setDaysConfig(prev => prev.map(d => 
      d.day === day ? { ...d, enabled: !d.enabled } : d
    ));
  };

  const addTimeSlot = (day: string) => {
    setNewTimeSlot({ day, startTime: '09:00', endTime: '10:00' });
  };

  const saveNewTimeSlot = () => {
    if (!newTimeSlot) return;

    const newSlot: TimeSlot = {
      id: Date.now().toString(),
      day: newTimeSlot.day as TimeSlot['day'],
      startTime: newTimeSlot.startTime,
      endTime: newTimeSlot.endTime,
      enabled: true
    };

    setDaysConfig(prev => prev.map(d => 
      d.day === newTimeSlot.day 
        ? { ...d, timeSlots: [...d.timeSlots, newSlot] }
        : d
    ));

    setNewTimeSlot(null);
  };

  const updateTimeSlot = (updatedSlot: TimeSlot) => {
    setDaysConfig(prev => prev.map(d => ({
      ...d,
      timeSlots: d.timeSlots.map(slot => 
        slot.id === updatedSlot.id ? updatedSlot : slot
      )
    })));
  };

  const deleteTimeSlot = (id: string) => {
    setDaysConfig(prev => prev.map(d => ({
      ...d,
      timeSlots: d.timeSlots.filter(slot => slot.id !== id)
    })));
  };

  const addBlockedPeriod = () => {
    setNewBlockedPeriod({
      title: '',
      startDate: '',
      endDate: '',
      reason: '',
      recurring: false
    });
  };

  const saveBlockedPeriod = () => {
    if (!newBlockedPeriod || !newBlockedPeriod.title || !newBlockedPeriod.startDate || !newBlockedPeriod.endDate) return;

    const period: BlockedPeriod = {
      id: Date.now().toString(),
      title: newBlockedPeriod.title,
      startDate: newBlockedPeriod.startDate,
      endDate: newBlockedPeriod.endDate,
      reason: newBlockedPeriod.reason || '',
      recurring: newBlockedPeriod.recurring || false
    };

    setBlockedPeriods(prev => [...prev, period]);
    setNewBlockedPeriod(null);
  };

  const deleteBlockedPeriod = (id: string) => {
    setBlockedPeriods(prev => prev.filter(period => period.id !== id));
  };

  const exportAgenda = () => {
    // Simuler l'export
    const data = {
      daysConfig,
      blockedPeriods
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `agenda-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-6xl mx-auto">
        {/* En-tête */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Mon Agenda
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Configuration de vos disponibilités et plages horaires
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Configuration des jours */}
          <div className="space-y-6">
            <Card>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Configuration hebdomadaire
              </h2>
              
              <div className="space-y-4">
                {daysConfig.map(dayConfig => (
                  <div key={dayConfig.day} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-medium text-gray-900 dark:text-white">
                        {dayConfig.label}
                      </h3>
                      <Switch
                        label={dayConfig.enabled ? 'Actif' : 'Inactif'}
                        defaultChecked={dayConfig.enabled}
                        onChange={() => toggleDayEnabled(dayConfig.day)}
                        color="blue"
                      />
                    </div>

                    {dayConfig.enabled && (
                      <div className="space-y-3">
                        {dayConfig.timeSlots.map(timeSlot => (
                          <TimeSlotEditor
                            key={timeSlot.id}
                            timeSlot={timeSlot}
                            onUpdate={updateTimeSlot}
                            onDelete={deleteTimeSlot}
                          />
                        ))}
                        
                        {newTimeSlot?.day === dayConfig.day ? (
                          <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                            <Input
                              type="time"
                              value={newTimeSlot.startTime}
                              onChange={(e) => setNewTimeSlot({ ...newTimeSlot, startTime: e.target.value })}
                              className="w-32"
                            />
                            <span className="text-gray-500">à</span>
                            <Input
                              type="time"
                              value={newTimeSlot.endTime}
                              onChange={(e) => setNewTimeSlot({ ...newTimeSlot, endTime: e.target.value })}
                              className="w-32"
                            />
                            <div className="flex gap-2 ml-auto">
                              <Button size="sm" variant="success" onClick={saveNewTimeSlot}>
                                <Save className="w-4 h-4" />
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => setNewTimeSlot(null)}>
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => addTimeSlot(dayConfig.day)}
                            className="w-full"
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Ajouter un créneau
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Card>

            {/* Actions globales */}
            <Card>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Actions globales
              </h3>
              <div className="flex flex-wrap gap-3">
                <Button variant="outline" onClick={exportAgenda}>
                  <Download className="w-4 h-4 mr-2" />
                  Exporter
                </Button>
                <Button variant="outline">
                  <Upload className="w-4 h-4 mr-2" />
                  Importer
                </Button>
                <Button variant="outline">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Réinitialiser
                </Button>
              </div>
            </Card>
          </div>

          {/* Périodes bloquées */}
          <div className="space-y-6">
            <Card>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Périodes bloquées
              </h2>
              
              <div className="space-y-4 mb-4">
                {blockedPeriods.map(period => (
                  <div key={period.id} className="border rounded-lg p-4 bg-red-50 dark:bg-red-900/20">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-red-900 dark:text-red-100">
                        {period.title}
                      </h4>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deleteBlockedPeriod(period.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    
                    <div className="text-sm text-red-700 dark:text-red-300 space-y-1">
                      <p>Du {new Date(period.startDate).toLocaleDateString()} au {new Date(period.endDate).toLocaleDateString()}</p>
                      {period.reason && <p>Raison: {period.reason}</p>}
                      {period.recurring && <Badge color="red" variant="light">Récurrent</Badge>}
                    </div>
                  </div>
                ))}
              </div>

              {newBlockedPeriod ? (
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-3">
                    Nouvelle période bloquée
                  </h4>
                  
                  <div className="space-y-3">
                    <Input
                      placeholder="Titre (ex: Congés, Formation...)"
                      value={newBlockedPeriod.title || ''}
                      onChange={(e) => setNewBlockedPeriod({ ...newBlockedPeriod, title: e.target.value })}
                    />
                    
                    <div className="grid grid-cols-2 gap-3">
                      <Input
                        type="date"
                        placeholder="Date de début"
                        value={newBlockedPeriod.startDate || ''}
                        onChange={(e) => setNewBlockedPeriod({ ...newBlockedPeriod, startDate: e.target.value })}
                      />
                      <Input
                        type="date"
                        placeholder="Date de fin"
                        value={newBlockedPeriod.endDate || ''}
                        onChange={(e) => setNewBlockedPeriod({ ...newBlockedPeriod, endDate: e.target.value })}
                      />
                    </div>
                    
                    <Input
                      placeholder="Raison (optionnel)"
                      value={newBlockedPeriod.reason || ''}
                      onChange={(e) => setNewBlockedPeriod({ ...newBlockedPeriod, reason: e.target.value })}
                    />
                    
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="recurring"
                        checked={newBlockedPeriod.recurring || false}
                        onChange={(e) => setNewBlockedPeriod({ ...newBlockedPeriod, recurring: e.target.checked })}
                        className="rounded text-blue-500"
                      />
                      <label htmlFor="recurring" className="text-sm text-gray-600 dark:text-gray-400">
                        Période récurrente
                      </label>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button variant="success" onClick={saveBlockedPeriod}>
                        <Save className="w-4 h-4 mr-2" />
                        Sauvegarder
                      </Button>
                      <Button variant="outline" onClick={() => setNewBlockedPeriod(null)}>
                        <X className="w-4 h-4 mr-2" />
                        Annuler
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <Button
                  variant="outline"
                  onClick={addBlockedPeriod}
                  className="w-full"
                >
                  <Lock className="w-4 h-4 mr-2" />
                  Bloquer une période
                </Button>
              )}
            </Card>

            {/* Statistiques */}
            <Card>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Statistiques de disponibilité
              </h3>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Jours actifs par semaine:</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {daysConfig.filter(d => d.enabled).length} / 7
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Créneaux horaires:</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {daysConfig.reduce((total, day) => total + day.timeSlots.length, 0)}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Heures/semaine:</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {daysConfig.reduce((total, day) => {
                      return total + day.timeSlots.reduce((dayTotal, slot) => {
                        const start = parseInt(slot.startTime.split(':')[0]);
                        const end = parseInt(slot.endTime.split(':')[0]);
                        return dayTotal + (end - start);
                      }, 0);
                    }, 0)}h
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Périodes bloquées:</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {blockedPeriods.length}
                  </span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyAgendaPage;