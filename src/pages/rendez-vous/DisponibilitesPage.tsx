// src/pages/rendez-vous/DisponibilitesPage.tsx

import React, { useState, useEffect, useRef } from 'react';
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
import { formatTime, formatDateShort } from '../../lib/date';
import { useNavigate } from 'react-router-dom';
import PermissionGuard from '../../components/auth/PermissionGuard';
import { PermissionCode, RoleName } from '../../types/auth';
import { api } from '../../lib/api';
import { useAgentProfile } from '../../hooks/useAgentProfile';
import { useAgentsStore } from '../../store/agentsStore';

function todayISO(): string {
  return new Date().toISOString().split('T')[0];
}

function errorMessage(error: unknown): string {
  // ApiValidationError.message porte déjà le message serveur lisible (voir
  // lib/api.ts) ; .details ne contient que des tags internes courts
  // ("duplicate", "must be present or future") destinés au code, pas à
  // l'affichage.
  if (error instanceof Error) return error.message;
  return "Une erreur est survenue.";
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

const exceptionLabel = (type: string) => exceptionTypes.find((t) => t.value === type)?.label ?? type;

export const DisponibilitesPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { can } = usePermission();
  
  // Check if user can manage other agents' availability (Admin or Ambassador)
  const canManageOthers = can(PermissionCode.AVAILABILITY_CONFIG);
  const isAdminOrAmbassador = user?.roles?.some((role: any) => 
    role.role.name === RoleName.ADMIN || role.role.name === RoleName.AMBASSADOR
  );
  
  const { profileData, fetchProfile } = useAgentProfile();
  const { agents, fetchAgents } = useAgentsStore();

  const [isLoading, setIsLoading] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState('');

  useEffect(() => {
    if (!profileData) fetchProfile();
    if (canManageOthers && agents.length === 0) fetchAgents();
  }, []);

  // Un agent qui ne peut gérer que lui-même est verrouillé sur SON PROPRE
  // agent.id (distinct de user.id — voir agent_availabilities.agent_id).
  useEffect(() => {
    if (!canManageOthers && profileData?.agent?.id) {
      setSelectedAgent(profileData.agent.id);
    }
  }, [canManageOthers, profileData?.agent?.id]);
  const [disponibilites, setDisponibilites] = useState<Disponibilite[]>([]);
  const [exceptions, setExceptions] = useState<Exception[]>([]);
  const [editingSlot, setEditingSlot] = useState<Disponibilite | null>(null);
  const [editingException, setEditingException] = useState<Exception | null>(null);
  const [showSlotModal, setShowSlotModal] = useState(false);
  const [showExceptionModal, setShowExceptionModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [slotError, setSlotError] = useState('');
  const [exceptionError, setExceptionError] = useState('');
  const [notice, setNotice] = useState('');

  // Les disponibilités se rechargent d'elles-mêmes dès que l'agent ou la date de
  // Configuration change : ce qui est affiché correspond toujours à cette date.
  const requestSeq = useRef(0);
  useEffect(() => {
    if (selectedAgent && selectedDate) {
      loadDisponibilites();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAgent, selectedDate]);

  const loadDisponibilites = async () => {
    if (!selectedAgent || !selectedDate) return;
    const seq = ++requestSeq.current;
    setIsLoading(true);
    try {
      // `date` ne garde de l'horaire hebdomadaire que les versions effectives ce
      // jour-là (validFrom/validUntil) ; les exceptions chargées sont celles à
      // partir de cette date (celle du jour est mise en avant).
      const [{ data: avail }, { data: exc }] = await Promise.all([
        api.get(`/agents/${selectedAgent}/availabilities`, { params: { date: selectedDate } }),
        api.get(`/agents/${selectedAgent}/exceptions`, { params: { from: selectedDate } }),
      ]);
      if (seq !== requestSeq.current) return; // une réponse plus récente a pris le relais
      setDisponibilites(avail.data);
      setExceptions(exc.data);
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      if (seq === requestSeq.current) setIsLoading(false);
    }
  };

  const handleAddSlot = () => {
    setSlotError('');
    setEditingSlot({
      id: `new-${Date.now()}`,
      dayOfWeek: 1,
      startTime: '09:00',
      endTime: '12:00',
      isAvailable: true,
      // Valable à partir de la date de Configuration (le créneau ne s'applique pas avant).
      validFrom: selectedDate,
      validUntil: null,
    });
    setShowSlotModal(true);
  };

  const handleEditSlot = (slot: Disponibilite) => {
    setSlotError('');
    setEditingSlot({ ...slot });
    setShowSlotModal(true);
  };

  const handleSaveSlot = async () => {
    if (!editingSlot) return;

    setIsLoading(true);
    setSlotError('');
    try {
      const { id, ...payload } = editingSlot;
      if (id.startsWith('new-')) {
        const { data } = await api.post(`/agents/${selectedAgent}/availabilities`, payload);
        setDisponibilites(prev => [...prev, data.data]);
        if (data.data.warning) setNotice(data.data.warning);
      } else {
        const { data } = await api.put(`/agents/${selectedAgent}/availabilities/${id}`, payload);
        setDisponibilites(prev => prev.map(s => (s.id === id ? data.data : s)));
        if (data.data.warning) setNotice(data.data.warning);
      }
      setShowSlotModal(false);
      setEditingSlot(null);
    } catch (error) {
      setSlotError(errorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteSlot = async (slotId: string) => {
    if (!window.confirm('Supprimer ce créneau ?')) return;

    setIsLoading(true);
    try {
      await api.delete(`/agents/${selectedAgent}/availabilities/${slotId}`);
      setDisponibilites(prev => prev.filter(s => s.id !== slotId));
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddException = () => {
    setExceptionError('');
    setEditingException({
      id: `new-${Date.now()}`,
      // Préremplit avec la date affichée en Configuration (jamais dans le
      // passé — le champ Date a un `min` sur aujourd'hui côté modal).
      date: selectedDate < todayISO() ? todayISO() : selectedDate,
      type: 'OTHER',
      reason: '',
      isFullDay: true,
    });
    setShowExceptionModal(true);
  };

  const handleSaveException = async () => {
    if (!editingException) return;

    setIsLoading(true);
    setExceptionError('');
    try {
      const { id, ...payload } = editingException;
      const { data } = await api.post(`/agents/${selectedAgent}/exceptions`, payload);
      setExceptions(prev => [...prev, data.data]);
      if (data.data.warning) setNotice(data.data.warning);
      setShowExceptionModal(false);
      setEditingException(null);
    } catch (error) {
      setExceptionError(errorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteException = async (exceptionId: string) => {
    if (!window.confirm('Supprimer cette exception ?')) return;

    setIsLoading(true);
    try {
      await api.delete(`/agents/${selectedAgent}/exceptions/${exceptionId}`);
      setExceptions(prev => prev.filter(e => e.id !== exceptionId));
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Résumé du jour de Configuration : jour de la semaine, créneaux effectifs, exception éventuelle.
  const dayOfWeek = (() => {
    const d = new Date(`${selectedDate}T00:00:00`).getDay(); // 0 = dimanche
    return d === 0 ? 7 : d;
  })();
  const dayLabel = days.find((d) => d.value === dayOfWeek)?.label ?? '';
  const effectiveSlots = disponibilites
    .filter((s) => s.dayOfWeek === dayOfWeek && s.isAvailable)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));
  const exceptionOfDay = exceptions.find((e) => e.date === selectedDate);
  const validityLabel = (s: Disponibilite) => {
    if (s.validFrom && s.validUntil) return `Du ${formatDateShort(s.validFrom)} au ${formatDateShort(s.validUntil)}`;
    if (s.validFrom) return `Depuis le ${formatDateShort(s.validFrom)}`;
    if (s.validUntil) return `Jusqu'au ${formatDateShort(s.validUntil)}`;
    return 'Sans limite de validité';
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
                      onChange={(value) => setSelectedAgent(value)}
                      options={[
                        { value: '', label: 'Sélectionnez un agent' },
                        ...agents.map((a) => ({
                          value: a.id,
                          label: `${a.user.profile?.firstName ?? ''} ${a.user.profile?.lastName ?? ''}`.trim() || a.matricule,
                        })),
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

                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Les disponibilités affichées sont celles en vigueur à cette date ; elles se mettent à jour dès que vous la modifiez.
                </p>
                <Button variant="outline" className="w-full" onClick={loadDisponibilites} disabled={isLoading || !selectedAgent}>
                  {isLoading ? 'Chargement...' : 'Actualiser'}
                </Button>
              </div>
            </Card>

            {/* Disponibilités */}
            <Card className="lg:col-span-2 p-4">
              {selectedAgent && (
                <div className="mb-4 rounded-lg border border-brand-200 bg-brand-50 px-3 py-2 text-sm text-brand-800 dark:border-brand-900/40 dark:bg-brand-900/20 dark:text-brand-200">
                  <div className="font-medium">
                    {dayLabel} {formatDateShort(selectedDate)}
                  </div>
                  {exceptionOfDay && exceptionOfDay.isFullDay ? (
                    <div>Indisponible toute la journée — {exceptionLabel(exceptionOfDay.type)}{exceptionOfDay.reason ? ` (${exceptionOfDay.reason})` : ''}.</div>
                  ) : effectiveSlots.length > 0 ? (
                    <div>
                      Disponible : {effectiveSlots.map((s) => `${formatTime(s.startTime)} – ${formatTime(s.endTime)}`).join(' · ')}
                      {exceptionOfDay ? ` — sauf ${formatTime(exceptionOfDay.startTime || '')} – ${formatTime(exceptionOfDay.endTime || '')} (${exceptionLabel(exceptionOfDay.type)})` : ''}
                    </div>
                  ) : (
                    <div>Aucune disponibilité configurée pour ce jour.</div>
                  )}
                </div>
              )}
              {notice && (
                <div className="mb-4 flex items-start justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-900/40 dark:bg-amber-900/20 px-3 py-2 text-sm text-amber-800 dark:text-amber-300">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                    <span>{notice}</span>
                  </div>
                  <button onClick={() => setNotice('')} className="text-amber-500 hover:text-amber-700 shrink-0">
                    &times;
                  </button>
                </div>
              )}
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-gray-900 dark:text-white">
                    <Clock className="w-4 h-4 inline mr-2" />
                    Disponibilités hebdomadaires en vigueur au {formatDateShort(selectedDate)}
                  </h3>
                  <Button size="sm" onClick={handleAddSlot} disabled={!selectedAgent}>
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
                      {[...disponibilites]
                        .sort((a, b) => a.dayOfWeek - b.dayOfWeek || a.startTime.localeCompare(b.startTime))
                        .map((slot) => (
                        <Card
                          key={slot.id}
                          className={`p-3 flex items-center justify-between hover:shadow-md transition-shadow ${slot.dayOfWeek === dayOfWeek ? 'ring-1 ring-brand-300 dark:ring-brand-700' : ''}`}
                        >
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                            <div className="w-24 font-medium text-gray-900 dark:text-white">
                              {days.find(d => d.value === slot.dayOfWeek)?.label}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-300">
                              {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                            </div>
                            <div className="text-xs text-gray-400">{validityLabel(slot)}</div>
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
                          {selectedAgent ? 'Aucune disponibilité en vigueur à cette date' : 'Sélectionnez un agent pour voir ses disponibilités'}
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
                    Exceptions à partir du {formatDateShort(selectedDate)}
                  </h3>
                  <Button size="sm" variant="outline" onClick={handleAddException} disabled={!selectedAgent}>
                    <Plus className="w-4 h-4 mr-1" />
                    Ajouter une exception
                  </Button>
                </div>

                <div className="space-y-2">
                  {exceptions.map((exception) => (
                    <Card
                      key={exception.id}
                      className={`p-3 flex items-center justify-between hover:shadow-md transition-shadow ${exception.date === selectedDate ? 'ring-1 ring-amber-300 dark:ring-amber-700' : ''}`}
                    >
                      <div className="flex items-center gap-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {formatDateShort(exception.date)}
                        </div>
                        <Badge color="warning" variant="light">
                          {exceptionLabel(exception.type)}
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
                      Aucune exception à venir
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
              {slotError && (
                <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 dark:border-red-900/40 dark:bg-red-900/20 px-3 py-2 text-sm text-red-700 dark:text-red-400">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>{slotError}</span>
                </div>
              )}
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

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Valable à partir du"
                  type="date"
                  value={editingSlot.validFrom || ''}
                  onChange={(e) => setEditingSlot({ ...editingSlot, validFrom: e.target.value || undefined })}
                />
                <Input
                  label="Jusqu'au (optionnel)"
                  type="date"
                  value={editingSlot.validUntil || ''}
                  onChange={(e) => setEditingSlot({ ...editingSlot, validUntil: e.target.value || null })}
                />
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
              {exceptionError && (
                <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 dark:border-red-900/40 dark:bg-red-900/20 px-3 py-2 text-sm text-red-700 dark:text-red-400">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>{exceptionError}</span>
                </div>
              )}
              <Input
                label="Date"
                type="date"
                min={todayISO()}
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