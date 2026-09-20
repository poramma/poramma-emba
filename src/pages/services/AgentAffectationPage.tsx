// src/pages/services/AgentAffectationPage.tsx

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Users, User, Shield, Plus, Trash2, 
  CheckCircle, XCircle, Search, Calendar,
  Edit, Eye, Save, X, AlertCircle, Clock
} from 'lucide-react';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Select } from '../../components/ui/select';
import { Badge } from '../../components/ui/badge';
import { Modal } from '../../components/ui/modal';
import { PermissionGuard } from '../../components/auth/PermissionGuard';
import { useServices } from '../../hooks/useServices';
import { useAgents } from '../../hooks/useAgents';
import { usePermission } from '../../hooks/usePermission';
import { useAuth } from '../../hooks/useAuth';
import { formatDateShort } from '../../lib/date';
import { api } from '../../lib/api';
import { Agent } from '../../types/auth';

// ============================================================
// TYPES
// ============================================================

interface AgentAssignment {
  id: string;
  agentId: string;
  agentName: string;
  agentMatricule: string;
  subServiceId: string;
  subServiceName: string;
  isPrimary: boolean;
  maxDailyAppointments: number;
  assignedAt: string;
  validFrom: string;
  validUntil: string | null;
  active: boolean;
}

function agentDisplayName(agent: Agent): string {
  return `${agent.user.profile?.firstName ?? ''} ${agent.user.profile?.lastName ?? ''}`.trim() || agent.matricule;
}

// ============================================================
// COMPOSANT PRINCIPAL
// ============================================================

export const AgentAffectationPage: React.FC = () => {
  const navigate = useNavigate();
  const { services, subServices } = useServices();
  const { agents, fetchAgents } = useAgents();
  const { canManageServices, canAssignAgents } = usePermission();
  const { user } = useAuth();

  // États
  const [assignments, setAssignments] = useState<AgentAssignment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedService, setSelectedService] = useState<string>('all');
  const [selectedAgent, setSelectedAgent] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  // États pour les modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<AgentAssignment | null>(null);

  // État du formulaire
  const [formData, setFormData] = useState({
    agentId: '',
    subServiceId: '',
    isPrimary: false,
    maxDailyAppointments: 5,
    validFrom: new Date().toISOString().split('T')[0],
    validUntil: '',
    active: true,
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const canManage = canManageServices() || canAssignAgents();

  // ============================================================
  // CHARGEMENT — pas d'endpoint "toutes les affectations" côté backend
  // (seulement GET /agents/:id/assignments, par agent) ; on charge la
  // liste réelle des agents puis on agrège leurs affectations.
  // ============================================================

  useEffect(() => {
    fetchAgents();
  }, [fetchAgents]);

  const loadAssignments = async (agentList: Agent[]) => {
    setIsLoading(true);
    try {
      const results = await Promise.all(
        agentList.map((agent) =>
          api.get(`/agents/${agent.id}/assignments`).then(({ data }) =>
            (data.data as any[]).map((a): AgentAssignment => ({
              id: a.id,
              agentId: a.agentId,
              agentName: agentDisplayName(agent),
              agentMatricule: agent.matricule,
              subServiceId: a.subServiceId,
              subServiceName: a.subService?.name ?? 'Service inconnu',
              isPrimary: a.isPrimary,
              maxDailyAppointments: a.maxDailyAppointments ?? 0,
              assignedAt: a.assignedAt,
              validFrom: a.validFrom,
              validUntil: a.validUntil,
              active: a.active,
            }))
          )
        )
      );
      setAssignments(results.flat());
    } catch (error) {
      console.error('Erreur lors du chargement des affectations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (agents.length > 0) loadAssignments(agents);
  }, [agents]);

  // ============================================================
  // FILTRAGE
  // ============================================================

  const filteredAssignments = assignments.filter(ass => {
    if (selectedService !== 'all' && ass.subServiceId !== selectedService) return false;
    if (selectedAgent !== 'all' && ass.agentId !== selectedAgent) return false;
    if (selectedStatus !== 'all' && ass.active !== (selectedStatus === 'active')) return false;
    if (searchQuery && !ass.agentName.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !ass.subServiceName.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  // ============================================================
  // ACTIONS CRUD
  // ============================================================

  // Création
  const handleCreate = () => {
    setFormData({
      agentId: '',
      subServiceId: '',
      isPrimary: false,
      maxDailyAppointments: 5,
      validFrom: new Date().toISOString().split('T')[0],
      validUntil: '',
      active: true,
    });
    setFormErrors({});
    setIsCreateModalOpen(true);
  };

  const handleCreateSubmit = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      await api.post(`/agents/${formData.agentId}/assignments`, {
        subServiceId: formData.subServiceId,
        isPrimary: formData.isPrimary,
        maxDailyAppointments: formData.maxDailyAppointments,
        validFrom: formData.validFrom || null,
        validUntil: formData.validUntil || null,
      });
      await loadAssignments(agents);
      setIsCreateModalOpen(false);
    } catch (error) {
      console.error('Erreur lors de la création:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Édition
  const handleEdit = (assignment: AgentAssignment) => {
    setSelectedAssignment(assignment);
    setFormData({
      agentId: assignment.agentId,
      subServiceId: assignment.subServiceId,
      isPrimary: assignment.isPrimary,
      maxDailyAppointments: assignment.maxDailyAppointments,
      validFrom: assignment.validFrom.split('T')[0],
      validUntil: assignment.validUntil ? assignment.validUntil.split('T')[0] : '',
      active: assignment.active,
    });
    setFormErrors({});
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async () => {
    if (!validateForm() || !selectedAssignment) return;

    setIsLoading(true);
    try {
      // Le backend n'autorise pas de déplacer une affectation vers un autre
      // agent (agentId n'est pas dans updateAssignmentDto) — seul le service
      // et les modalités de l'affectation sont modifiables.
      await api.patch(`/assignments/${selectedAssignment.id}`, {
        subServiceId: formData.subServiceId,
        isPrimary: formData.isPrimary,
        maxDailyAppointments: formData.maxDailyAppointments,
        validFrom: formData.validFrom || null,
        validUntil: formData.validUntil || null,
        active: formData.active,
      });
      await loadAssignments(agents);
      setIsEditModalOpen(false);
      setSelectedAssignment(null);
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Suppression
  const handleDelete = (assignment: AgentAssignment) => {
    setSelectedAssignment(assignment);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedAssignment) return;

    setIsLoading(true);
    try {
      await api.delete(`/assignments/${selectedAssignment.id}`);
      setAssignments(prev => prev.filter(ass => ass.id !== selectedAssignment.id));
      setIsDeleteModalOpen(false);
      setSelectedAssignment(null);
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Activation/Désactivation
  const handleToggleActive = async (assignment: AgentAssignment) => {
    setIsLoading(true);
    try {
      const newStatus = !assignment.active;
      await api.patch(`/assignments/${assignment.id}`, { active: newStatus });
      setAssignments(prev => prev.map(ass =>
        ass.id === assignment.id ? { ...ass, active: newStatus } : ass
      ));
    } catch (error) {
      console.error('Erreur lors du changement de statut:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // ============================================================
  // VALIDATION
  // ============================================================

  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    if (!formData.agentId) errors.agentId = 'Veuillez sélectionner un agent';
    if (!formData.subServiceId) errors.subServiceId = 'Veuillez sélectionner un service';
    if (formData.maxDailyAppointments < 1) {
      errors.maxDailyAppointments = 'Minimum 1 rendez-vous par jour';
    }
    if (formData.maxDailyAppointments > 20) {
      errors.maxDailyAppointments = 'Maximum 20 rendez-vous par jour';
    }
    if (formData.validFrom && formData.validUntil && formData.validFrom > formData.validUntil) {
      errors.validUntil = 'La date de fin doit être postérieure à la date de début';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // ============================================================
  // RENDU
  // ============================================================

  return (
    <PermissionGuard minRoleLevel={3} title="Gestion des affectations">
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* En-tête */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={() => navigate('/services')}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Retour
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Affectation des agents
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                  Gérez les agents assignés aux services consulaires
                </p>
              </div>
            </div>
            {canManage && (
              <Button variant="primary" onClick={handleCreate}>
                <Plus className="w-4 h-4 mr-2" />
                Nouvelle affectation
              </Button>
            )}
          </div>

          {/* Statistiques */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="p-3 text-center">
              <div className="text-xl font-bold text-gray-900 dark:text-white">{assignments.length}</div>
              <div className="text-xs text-gray-500">Total affectations</div>
            </Card>
            <Card className="p-3 text-center">
              <div className="text-xl font-bold text-green-600">
                {assignments.filter(a => a.active).length}
              </div>
              <div className="text-xs text-gray-500">Actives</div>
            </Card>
            <Card className="p-3 text-center">
              <div className="text-xl font-bold text-blue-600">
                {assignments.filter(a => a.isPrimary).length}
              </div>
              <div className="text-xs text-gray-500">Principales</div>
            </Card>
            <Card className="p-3 text-center">
              <div className="text-xl font-bold text-purple-600">
                {new Set(assignments.map(a => a.agentId)).size}
              </div>
              <div className="text-xs text-gray-500">Agents affectés</div>
            </Card>
          </div>

          {/* Filtres */}
          <Card className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Input
                placeholder="Rechercher un agent ou service..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                startIcon={<Search className="w-4 h-4" />}
              />
              <Select
                value={selectedService}
                onChange={(value) => setSelectedService(value)}
                options={[
                  { value: 'all', label: 'Tous les services' },
                  ...subServices.map(s => ({ value: s.id, label: s.name })),
                ]}
              />
              <Select
                value={selectedAgent}
                onChange={(value) => setSelectedAgent(value)}
                options={[
                  { value: 'all', label: 'Tous les agents' },
                  ...agents.map(a => ({ value: a.id, label: agentDisplayName(a) })),
                ]}
              />
              <Select
                value={selectedStatus}
                onChange={(value) => setSelectedStatus(value)}
                options={[
                  { value: 'all', label: 'Tous les statuts' },
                  { value: 'active', label: 'Actifs' },
                  { value: 'inactive', label: 'Inactifs' },
                ]}
              />
            </div>
          </Card>

          {/* Liste des affectations */}
          <div className="space-y-4">
            {isLoading && (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div>
              </div>
            )}

            {!isLoading && filteredAssignments.map((assignment) => (
              <Card key={assignment.id} className="p-4 hover:shadow-md transition-shadow">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center text-brand-600 font-bold text-lg">
                      {assignment.agentName.charAt(0)}
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="font-semibold text-gray-900 dark:text-white">
                          {assignment.agentName}
                        </h4>
                        <Badge color="light" variant="light" size="xs">
                          {assignment.agentMatricule}
                        </Badge>
                        {assignment.isPrimary && (
                          <Badge color="primary" variant="solid" size="xs">
                            Principal
                          </Badge>
                        )}
                        <Badge 
                          color={assignment.active ? 'success' : 'error'} 
                          variant="light" 
                          size="xs"
                          className="cursor-pointer"
                        >
                          {assignment.active ? 'Actif' : 'Inactif'}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        {assignment.subServiceName}
                      </p>
                      <div className="flex flex-wrap gap-3 mt-1 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {assignment.maxDailyAppointments} RDV/jour
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Depuis {formatDateShort(assignment.assignedAt)}
                        </span>
                        {assignment.validUntil && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Jusqu'au {formatDateShort(assignment.validUntil)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  {canManage && (
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleEdit(assignment)}
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Modifier
                      </Button>
                      <Button 
                        size="sm" 
                        variant="error"
                        onClick={() => handleDelete(assignment)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            ))}

            {!isLoading && filteredAssignments.length === 0 && (
              <Card className="p-8 text-center">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Aucune affectation trouvée
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  Aucun agent n'est actuellement assigné à ce service.
                </p>
                {canManage && (
                  <Button className="mt-4" variant="primary" onClick={handleCreate}>
                    <Plus className="w-4 h-4 mr-2" />
                    Créer une affectation
                  </Button>
                )}
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* ============================================================
          MODAL DE CRÉATION
          ============================================================ */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Nouvelle affectation"
        size="md"
      >
        <div className="space-y-4">
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              Assignez un agent à un service consulaire.
            </p>
          </div>

         <p className="text-sm text-gray-600 dark:text-gray-400">
            Sélectionnez un service pour l'assigner à l'agent.
          </p>
          <Select
            label="Service *"
            value={formData.subServiceId}
            onChange={(value) => setFormData({ ...formData, subServiceId: value })}
            options={[
              { value: '', label: 'Sélectionnez un service' },
              ...subServices.map(s => ({ value: s.id, label: s.name })),
            ]}
            error={!!formErrors.subServiceId}
            helperText={formErrors.subServiceId}
          />

          <p className="text-sm text-gray-600 dark:text-gray-400">
            Sélectionnez un agent pour l'assigner au service consulaire.
          </p>
          <Select
            label="Agent *"
            value={formData.agentId}
            onChange={(value) => setFormData({ ...formData, agentId: value })}
            options={[
              { value: '', label: 'Sélectionnez un agent' },
              ...agents.filter(a => a.active).map(a => ({
                value: a.id,
                label: `${agentDisplayName(a)} (${a.matricule})`
              })),
            ]}
            error={!!formErrors.agentId}
            helperText={formErrors.agentId}
          />
          

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="RDV maximum par jour"
              type="number"
              value={formData.maxDailyAppointments}
              onChange={(e) => setFormData({ ...formData, maxDailyAppointments: parseInt(e.target.value) || 0 })}
              minLength={1}
              maxLength={20}
              error={!!formErrors.maxDailyAppointments}
              helperText={formErrors.maxDailyAppointments}
            />
            <div className="flex items-end pb-1">
              <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                <input
                  type="checkbox"
                  checked={formData.isPrimary}
                  onChange={(e) => setFormData({ ...formData, isPrimary: e.target.checked })}
                  className="rounded text-brand-500"
                />
                Agent principal
              </label>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Date de début"
              type="date"
              value={formData.validFrom}
              onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
            />
            <Input
              label="Date de fin (optionnel)"
              type="date"
              value={formData.validUntil}
              onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
              error={!!formErrors.validUntil}
              helperText={formErrors.validUntil}
            />
          </div>

          <div className="flex items-center gap-2 pt-2">
            <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
              <input
                type="checkbox"
                checked={formData.active}
                onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                className="rounded text-brand-500"
              />
              Actif immédiatement
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="ghost" onClick={() => setIsCreateModalOpen(false)}>
              Annuler
            </Button>
            <Button variant="primary" onClick={handleCreateSubmit} disabled={isLoading}>
              {isLoading ? 'Création...' : 'Créer l\'affectation'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* ============================================================
          MODAL D'ÉDITION
          ============================================================ */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Modifier l'affectation"
        size="md"
      >
        <div className="space-y-4">
          {selectedAssignment && (
            <>
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Agent:</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {selectedAssignment.agentName}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm mt-1">
                  <span className="text-gray-500">Service:</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {selectedAssignment.subServiceName}
                  </span>
                </div>
              </div>

              {/* L'agent d'une affectation existante n'est pas modifiable
                  (updateAssignmentDto côté backend n'accepte pas agentId) —
                  pour réaffecter à un autre agent, supprimer puis recréer. */}

              <p className="text-sm text-gray-600 dark:text-gray-400">
                Sélectionnez un service pour l'assigner à l'agent.
              </p>
              <Select
                label="Service *"
                value={formData.subServiceId}
                onChange={(value) => setFormData({ ...formData, subServiceId: value })}
                options={[
                  { value: '', label: 'Sélectionnez un service' },
                  ...subServices.map(s => ({ value: s.id, label: s.name })),
                ]}
                error={!!formErrors.subServiceId}
                helperText={formErrors.subServiceId}
              />

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="RDV maximum par jour"
                  type="number"
                  value={formData.maxDailyAppointments}
                  onChange={(e) => setFormData({ ...formData, maxDailyAppointments: parseInt(e.target.value) || 0 })}
                  minLength={1}
                  maxLength={20}
                  error={!!formErrors.maxDailyAppointments}
                  helperText={formErrors.maxDailyAppointments}
                />
                <div className="flex items-end pb-1">
                  <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                    <input
                      type="checkbox"
                      checked={formData.isPrimary}
                      onChange={(e) => setFormData({ ...formData, isPrimary: e.target.checked })}
                      className="rounded text-brand-500"
                    />
                    Agent principal
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Date de début"
                  type="date"
                  value={formData.validFrom}
                  onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
                />
                <Input
                  label="Date de fin (optionnel)"
                  type="date"
                  value={formData.validUntil}
                  onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                  error={!!formErrors.validUntil}
                  helperText={formErrors.validUntil}
                />
              </div>

              <div className="flex items-center gap-2">
                <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                  <input
                    type="checkbox"
                    checked={formData.active}
                    onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                    className="rounded text-brand-500"
                  />
                  Actif
                </label>
              </div>
            </>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="ghost" onClick={() => setIsEditModalOpen(false)}>
              Annuler
            </Button>
            <Button variant="primary" onClick={handleEditSubmit} disabled={isLoading}>
              {isLoading ? 'Mise à jour...' : 'Mettre à jour'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* ============================================================
          MODAL DE CONFIRMATION DE SUPPRESSION
          ============================================================ */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Confirmer la suppression"
        size="sm"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <AlertCircle className="w-6 h-6 text-red-500 flex-shrink-0" />
            <div>
              <p className="text-sm text-red-700 dark:text-red-300 font-medium">
                Supprimer cette affectation ?
              </p>
              {selectedAssignment && (
                <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                  Agent: <strong>{selectedAssignment.agentName}</strong><br />
                  Service: <strong>{selectedAssignment.subServiceName}</strong>
                </p>
              )}
            </div>
          </div>

          <p className="text-sm text-gray-500 dark:text-gray-400">
            Cette action est irréversible. L'agent ne sera plus assigné à ce service.
          </p>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="ghost" onClick={() => setIsDeleteModalOpen(false)}>
              Annuler
            </Button>
            <Button variant="error" onClick={handleDeleteConfirm} disabled={isLoading}>
              {isLoading ? 'Suppression...' : 'Supprimer'}
            </Button>
          </div>
        </div>
      </Modal>
    </PermissionGuard>
  );
};

export default AgentAffectationPage;