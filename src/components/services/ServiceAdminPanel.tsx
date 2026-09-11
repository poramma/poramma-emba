// ============================================================
// src/components/services/ServiceAdminPanel.tsx
// ============================================================

/**
 * COMPOSANT: ServiceAdminPanel
 * Usage: Page /services (Admin/Ambassadeur uniquement)
 * Permission: service:admin
 * 
 * Permet à l'admin de l'ambassade de:
 * 1. Créer/modifier des services et sous-services
 * 2. Définir les horaires par jour (ex: "uniquement le jeudi")
 * 3. Gérer les exceptions (jours fériés, fermetures)
 * 4. Affecter des agents aux services
 */

import { useState, useEffect } from 'react';
import { useServiceStore } from '../../store/serviceStore';
import { usePermission } from '../../hooks/usePermission';
import {
  Service,
  SubService,
  ServiceSchedule,
  ServiceException,
  ServiceExceptionType,
  AgentServiceAssignment,
  PermissionCode,
} from '../../types';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select } from '../ui/select';
import { TextArea } from '../ui/textarea';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Modal } from '../ui/modal';
import { Alert } from '../ui/alert';
import { Tabs, TabPanel } from '../ui/tabs';

const DAYS_OF_WEEK = [
  { value: 1, label: 'Lundi' },
  { value: 2, label: 'Mardi' },
  { value: 3, label: 'Mercredi' },
  { value: 4, label: 'Jeudi' },
  { value: 5, label: 'Vendredi' },
  { value: 6, label: 'Samedi' },
  { value: 7, label: 'Dimanche' },
];

export function ServiceAdminPanel() {
  const { canManageServices } = usePermission();
  const {
    categories,
    services,
    subServices,
    schedules,
    exceptions,
    assignments,
    selectedSubService,
    isLoading,
    error,
    fetchCategories,
    fetchServices,
    fetchSubServices,
    fetchSchedules,
    fetchExceptions,
    fetchAssignments,
    createSubService,
    createSchedule,
    deleteSchedule,
    createException,
    deleteException,
    assignAgent,
    removeAssignment,
    setSelectedSubService,
  } = useServiceStore();

  const [activeTab, setActiveTab] = useState<'services' | 'horaires' | 'agents'>('services');
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showExceptionModal, setShowExceptionModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);

  // Formulaire horaire
  const [scheduleForm, setScheduleForm] = useState({
    dayOfWeek: 1,
    startTime: '09:00',
    endTime: '12:00',
    slotDurationMinutes: 30,
    maxConcurrentSlots: 2,
  });

  // Formulaire exception
  const [exceptionForm, setExceptionForm] = useState({
    date: '',
    type: ServiceExceptionType.CLOSED,
    startTime: '',
    endTime: '',
    reason: '',
  });

  // Formulaire affectation agent
  const [assignForm, setAssignForm] = useState({
    agentId: '',
    isPrimary: true,
    maxDailyAppointments: 8,
    validFrom: '',
    validUntil: '',
    notes: '',
  });

  useEffect(() => {
    fetchCategories();
    fetchServices();
  }, [fetchCategories, fetchServices]);

  useEffect(() => {
    if (selectedSubService) {
      fetchSchedules(selectedSubService.id);
      fetchExceptions(selectedSubService.id);
      fetchAssignments(undefined, selectedSubService.id);
    }
  }, [selectedSubService, fetchSchedules, fetchExceptions, fetchAssignments]);

  if (!canManageServices()) {
    return (
      <Alert variant="error" title="Accès refusé"
        message="Seul l'administrateur ou l'ambassadeur peut gérer les services et horaires."
      />
        
    );
  }

  const handleAddSchedule = async () => {
    if (!selectedSubService) return;
    try {
      await createSchedule({
        subServiceId: selectedSubService.id,
        ...scheduleForm,
      });
      setShowScheduleModal(false);
      setScheduleForm({
        dayOfWeek: 1,
        startTime: '09:00',
        endTime: '12:00',
        slotDurationMinutes: 30,
        maxConcurrentSlots: 2,
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddException = async () => {
    if (!selectedSubService) return;
    try {
      await createException({
        subServiceId: selectedSubService.id,
        ...exceptionForm,
        startTime: exceptionForm.startTime || null,
        endTime: exceptionForm.endTime || null,
      });
      setShowExceptionModal(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAssignAgent = async () => {
    if (!selectedSubService) return;
    try {
      await assignAgent({
        subServiceId: selectedSubService.id,
        ...assignForm,
        validUntil: assignForm.validUntil || null,
      });
      setShowAssignModal(false);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">⚙️ Administration des Services</h1>
        <Badge variant="info">Administration</Badge>
      </div>

      {error && <Alert variant="error" title="Erreur"
        message={error}
      />}

      {/* SÉLECTION DU SOUS-SERVICE */}
      <Card className="p-4">
        <label className="block text-sm font-medium mb-2">Service à configurer</label>
        <Select
          value={selectedSubService?.id ?? ''}
          onChange={(value) => {
            const sub = subServices.find((s) => s.id === value);
            setSelectedSubService(sub || null);
          }}
          options={subServices.map((s) => ({
            value: s.id,
            label: `${s.service.name} → ${s.name}`,
          }))}
          placeholder="Sélectionnez un sous-service..."
        />
      </Card>

      {selectedSubService && (
        <>
  <Tabs 
        tabs={[
        { id: 'services', label: '📋 Services', icon: null },
        { id: 'horaires', label: '🕐 Horaires & Exceptions', icon: null },
        { id: 'agents', label: '👤 Affectation des agents', icon: null }
        ]}
        activeTab={activeTab}
        onTabChange={setActiveTab}
    />
        <TabPanel id="services" label="📋 Services" activeTab={activeTab}>
            <div className="space-y-4">
              <Card className="p-4">
                <h3 className="font-semibold mb-2">{selectedSubService.name}</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Code:</span>{' '}
                    <code className="bg-gray-100 px-1 rounded">{selectedSubService.code}</code>
                  </div>
                  <div>
                    <span className="text-gray-500">Catégorie:</span>{' '}
                    {selectedSubService.service.category.name}
                  </div>
                  <div>
                    <span className="text-gray-500">Prix:</span>{' '}
                    {selectedSubService.basePrice
                      ? `${selectedSubService.basePrice} ${selectedSubService.currency}`
                      : 'Gratuit'}
                  </div>
                  <div>
                    <span className="text-gray-500">SLA:</span>{' '}
                    {selectedSubService.slaDays} jours
                  </div>
                  <div>
                    <span className="text-gray-500">Sur rendez-vous:</span>{' '}
                    {selectedSubService.service.requiresAppointment ? 'Oui' : 'Non'}
                  </div>
                  <div>
                    <span className="text-gray-500">Présence obligatoire:</span>{' '}
                    {selectedSubService.requiresInPerson ? 'Oui' : 'Non'}
                  </div>
                </div>
              </Card>
            </div>
          </TabPanel>

          {/* ===== ONGLET: HORAIRES ===== */}
          <TabPanel id="horaires" label="🕐 Horaires & Exceptions" activeTab={activeTab}>
            <div className="space-y-4">
              {/* HORAIRES RÉGULIERS */}
              <Card className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold">Horaires réguliers</h3>
                  <Button size="sm" onClick={() => setShowScheduleModal(true)}>
                    + Ajouter un horaire
                  </Button>
                </div>

                {schedules.length === 0 ? (
                  <p className="text-gray-500 text-sm italic">
                    Aucun horaire défini. Le service ne sera pas disponible à la réservation.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {DAYS_OF_WEEK.map((day) => {
                      const daySchedules = schedules.filter((s) => s.dayOfWeek === day.value);
                      return (
                        <div key={day.value} className="flex items-start gap-3 py-2 border-b">
                          <div className="w-24 font-medium text-sm">{day.label}</div>
                          <div className="flex-1">
                            {daySchedules.length === 0 ? (
                              <span className="text-gray-400 text-sm">Fermé</span>
                            ) : (
                              <div className="flex flex-wrap gap-2">
                                {daySchedules.map((sched) => (
                                  <div
                                    key={sched.id}
                                    className="flex items-center gap-2 bg-green-50 text-green-800 px-3 py-1 rounded-full text-sm"
                                  >
                                    <span>
                                      {sched.startTime} - {sched.endTime}
                                    </span>
                                    <span className="text-green-600 text-xs">
                                      ({sched.slotDurationMinutes}min, {sched.maxConcurrentSlots} agents)
                                    </span>
                                    <button
                                      onClick={() => deleteSchedule(sched.id)}
                                      className="text-red-500 hover:text-red-700 ml-1"
                                      title="Supprimer"
                                    >
                                      ×
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Info: Exemple "uniquement le jeudi" */}
                <div className="mt-4 p-3 bg-blue-50 rounded text-sm text-blue-800">
                  <strong>💡 Exemple:</strong> Pour un service disponible uniquement le jeudi,
                  ajoutez des horaires uniquement pour le jour "Jeudi" (4).
                </div>
              </Card>

              {/* EXCEPTIONS */}
              <Card className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold">Exceptions (fermetures, horaires spéciaux)</h3>
                  <Button size="sm" onClick={() => setShowExceptionModal(true)}>
                    + Ajouter une exception
                  </Button>
                </div>

                {exceptions.length === 0 ? (
                  <p className="text-gray-500 text-sm italic">Aucune exception programmée.</p>
                ) : (
                  <div className="space-y-2">
                    {exceptions.map((exc) => (
                      <div
                        key={exc.id}
                        className="flex items-center justify-between p-3 bg-amber-50 rounded"
                      >
                        <div>
                          <div className="font-medium text-sm">
                            {exc.date} — {exc.reason}
                          </div>
                          <div className="text-xs text-amber-700">
                            {exc.type === ServiceExceptionType.CLOSED
                              ? 'Fermeture complète'
                              : exc.type === ServiceExceptionType.SPECIAL_HOURS
                              ? `Horaires spéciaux: ${exc.startTime} - ${exc.endTime}`
                              : 'Capacité augmentée'}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => deleteException(exc.id)}
                        >
                          Supprimer
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>
          </TabPanel>

          {/* ===== ONGLET: AGENTS ===== */}
          <TabPanel id="agents" label="👤 Affectation des agents" activeTab={activeTab}>
            <div className="space-y-4">
              <Card className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold">Agents affectés à ce service</h3>
                  <Button size="sm" onClick={() => setShowAssignModal(true)}>
                    + Affecter un agent
                  </Button>
                </div>

                {assignments.length === 0 ? (
                  <p className="text-gray-500 text-sm italic">
                    Aucun agent affecté. Le service ne pourra pas être réservé.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {assignments.map((assign) => (
                      <div
                        key={assign.id}
                        className="flex items-center justify-between p-3 border rounded"
                      >
                        <div>
                          <div className="font-medium text-sm">
                            {assign.agentId} {/* Remplacer par nom réel */}
                            {assign.isPrimary ? (
                              <Badge variant="success" size="sm" className="ml-2">
                                Principal
                              </Badge>
                            ) : (
                              <Badge variant="secondary" size="sm" className="ml-2">
                                Backup
                              </Badge>
                            )}
                          </div>
                          <div className="text-xs text-gray-500">
                            Max {assign.maxDailyAppointments} rdv/jour |{' '}
                            Du {assign.validFrom}
                            {assign.validUntil ? ` au ${assign.validUntil}` : ' (illimité)'}
                          </div>
                          {assign.notes && (
                            <div className="text-xs text-gray-400 mt-1">{assign.notes}</div>
                          )}
                        </div>
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => removeAssignment(assign.id)}
                        >
                          Retirer
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>
          </TabPanel>
        </>
      )}

      {/* ===== MODAL: AJOUTER HORAIRE ===== */}
      <Modal
        isOpen={showScheduleModal}
        onClose={() => setShowScheduleModal(false)}
        title="Ajouter un horaire"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium">Jour de la semaine</label>
            <Select
              value={scheduleForm.dayOfWeek.toString()}
              onChange={(v) =>
                setScheduleForm((p) => ({ ...p, dayOfWeek: Number(v) }))
              }
              options={DAYS_OF_WEEK.map((day) => ({ value: day.value.toString(), label: day.label }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium">Début</label>
              <Input
                type="time"
                value={scheduleForm.startTime}
                onChange={(e) =>
                  setScheduleForm((p) => ({ ...p, startTime: e.target.value }))
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Fin</label>
              <Input
                type="time"
                value={scheduleForm.endTime}
                onChange={(e) =>
                  setScheduleForm((p) => ({ ...p, endTime: e.target.value }))
                }
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium">
                Durée créneau (minutes)
              </label>
              <Input
                type="number"
                value={scheduleForm.slotDurationMinutes}
                onChange={(e) =>
                  setScheduleForm((p) => ({
                    ...p,
                    slotDurationMinutes: Number(e.target.value),
                  }))
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium">
                Agents simultanés
              </label>
              <Input
                type="number"
                value={scheduleForm.maxConcurrentSlots}
                onChange={(e) =>
                  setScheduleForm((p) => ({
                    ...p,
                    maxConcurrentSlots: Number(e.target.value),
                  }))
                }
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button onClick={handleAddSchedule} isLoading={isLoading}>
              Enregistrer
            </Button>
            <Button variant="ghost" onClick={() => setShowScheduleModal(false)}>
              Annuler
            </Button>
          </div>
        </div>
      </Modal>

      {/* ===== MODAL: AJOUTER EXCEPTION ===== */}
      <Modal
        isOpen={showExceptionModal}
        onClose={() => setShowExceptionModal(false)}
        title="Ajouter une exception"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium">Date</label>
            <Input
              type="date"
              value={exceptionForm.date}
              onChange={(e) =>
                setExceptionForm((p) => ({ ...p, date: e.target.value }))
              }
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Type</label>
            <Select
              value={exceptionForm.type}
              onChange={(v) =>
                setExceptionForm((p) => ({ ...p, type: v as ServiceExceptionType }))
              }
              options={[
                { value: ServiceExceptionType.CLOSED, label: 'Fermeture complète' },
                { value: ServiceExceptionType.SPECIAL_HOURS, label: 'Horaires spéciaux' },
                { value: ServiceExceptionType.EXTRA_CAPACITY, label: 'Capacité augmentée' },
              ]}
            />
          </div>

          {exceptionForm.type !== ServiceExceptionType.CLOSED && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium">Début</label>
                <Input
                  type="time"
                  value={exceptionForm.startTime}
                  onChange={(e) =>
                    setExceptionForm((p) => ({ ...p, startTime: e.target.value }))
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Fin</label>
                <Input
                  type="time"
                  value={exceptionForm.endTime}
                  onChange={(e) =>
                    setExceptionForm((p) => ({ ...p, endTime: e.target.value }))
                  }
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium">Motif</label>
            <Input
              placeholder="Ex: Fête du Trône, Réunion interne..."
              value={exceptionForm.reason}
              onChange={(e) =>
                setExceptionForm((p) => ({ ...p, reason: e.target.value }))
              }
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button onClick={handleAddException} isLoading={isLoading}>
              Enregistrer
            </Button>
            <Button variant="ghost" onClick={() => setShowExceptionModal(false)}>
              Annuler
            </Button>
          </div>
        </div>
      </Modal>

      {/* ===== MODAL: AFFECTER AGENT ===== */}
      <Modal
        isOpen={showAssignModal}
        onClose={() => setShowAssignModal(false)}
        title="Affecter un agent au service"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium">Agent</label>
            <Select
              value={assignForm.agentId}
              onChange={(v) => setAssignForm((p) => ({ ...p, agentId: v }))}
              options={[
                { value: 'agent-002', label: 'Fatima COULIBALY' },
                { value: 'agent-003', label: 'Amadou DIALLO' },
                { value: 'agent-005', label: 'Aïssata KEITA' },
              ]}
              placeholder="Sélectionnez un agent..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Rôle</label>
            <Select
              value={assignForm.isPrimary ? 'primary' : 'backup'}
              onChange={(v) =>
                setAssignForm((p) => ({ ...p, isPrimary: v === 'primary' }))
              }
              options={[
                { value: 'primary', label: 'Agent principal' },
                { value: 'backup', label: 'Agent de backup' },
              ]}
            />
          </div>

          <div>
            <label className="block text-sm font-medium">
              Max rendez-vous par jour
            </label>
            <Input
              type="number"
              value={assignForm.maxDailyAppointments}
              onChange={(e) =>
                setAssignForm((p) => ({
                  ...p,
                  maxDailyAppointments: Number(e.target.value),
                }))
              }
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium">Valide du</label>
              <Input
                type="date"
                value={assignForm.validFrom}
                onChange={(e) =>
                  setAssignForm((p) => ({ ...p, validFrom: e.target.value }))
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Au (optionnel)</label>
              <Input
                type="date"
                value={assignForm.validUntil}
                onChange={(e) =>
                  setAssignForm((p) => ({ ...p, validUntil: e.target.value }))
                }
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium">Notes</label>
            <TextArea
              rows={2}
              value={assignForm.notes}
              onChange={(value) =>
                setAssignForm((p) => ({ ...p, notes: value }))
              }
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button onClick={handleAssignAgent} isLoading={isLoading}>
              Affecter
            </Button>
            <Button variant="ghost" onClick={() => setShowAssignModal(false)}>
              Annuler
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}