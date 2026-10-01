// src/pages/utilisateurs/AgentsPage.tsx

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, User, Search, Filter } from 'lucide-react';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Select } from '../../components/ui/select';
import { Pagination } from '../../components/ui/pagination';
import { PermissionGuard } from '../../components/auth/PermissionGuard';
import { AgentList } from '../../components/utilisateurs/AgentList';
import { AgentForm } from '../../components/utilisateurs/AgentForm';
import { useAgents } from '../../hooks/useAgents';
import { usePermission } from '../../hooks/usePermission';
import { useDebouncedSearch } from '../../hooks/useDebouncedSearch';
import { PermissionCode } from '../../types/auth';
import { Agent, RoleName, AgentDepartment, UserStatus } from '../../types/auth';

const DEPARTMENT_LABELS: Record<AgentDepartment, string> = {
  [AgentDepartment.CONSULAR]: 'Consulaire',
  [AgentDepartment.ADMINISTRATIVE]: 'Administratif',
  [AgentDepartment.FINANCIAL]: 'Financier',
  [AgentDepartment.COMMUNICATION]: 'Communication',
  [AgentDepartment.SECURITY]: 'Sécurité',
  [AgentDepartment.STUDIES]: 'Études',
};

export const AgentsPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    agents,
    agentsMeta,
    setAgentsPage,
    isLoading,
    fetchAgents,
    toggleAgentActive,
    deleteAgent
  } = useAgents();
  const { can } = usePermission();

  // États pour les filtres — envoyés au serveur (voir agentsStore.fetchAgents),
  // plus de filtrage local : la page reçue est déjà la bonne, sans quoi la
  // pagination et les filtres se contrediraient (une page de 20 filtrée
  // localement peut afficher moins de résultats que le total annoncé).
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<UserStatus | 'all'>('all');
  const [selectedDepartment, setSelectedDepartment] = useState<AgentDepartment | 'all'>('all');
  const [selectedRole, setSelectedRole] = useState<RoleName | 'all'>('all');

  const [showForm, setShowForm] = useState(false);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
  const [isLoadingAction, setIsLoadingAction] = useState(false);

  const applyFilters = (patch: Partial<{ search: string; status: UserStatus | 'all'; department: AgentDepartment | 'all'; role: RoleName | 'all' }> = {}) => {
    fetchAgents({
      search: patch.search ?? searchQuery,
      status: patch.status ?? selectedStatus,
      department: patch.department ?? selectedDepartment,
      role: patch.role ?? selectedRole,
      page: 1,
      limit: 20,
    });
  };

  // Charger les agents au montage
  useEffect(() => {
    applyFilters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Recherche en temps réel : appliquée peu après la dernière frappe.
  useDebouncedSearch(searchQuery, (text) => applyFilters({ search: text }));

  const filteredAgentsList = agents;

  const handleEdit = (agent: Agent) => {
    setEditingAgent(agent);
    setShowForm(true);
  };

  const handleToggleActive = async (agent: Agent) => {
    setIsLoadingAction(true);
    try {
      await toggleAgentActive(agent.id);
      // Reste sur la page courante avec les mêmes filtres — un fetchAgents()
      // à vide écraserait la page affichée par la liste complète, non paginée.
      applyFilters();
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setIsLoadingAction(false);
    }
  };

  const handleDelete = async (agent: Agent) => {
    if (!window.confirm(`Supprimer définitivement ${agent.user.profile.firstName} ${agent.user.profile.lastName} ?`)) return;

    setIsLoadingAction(true);
    try {
      await deleteAgent(agent.id);
      applyFilters();
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setIsLoadingAction(false);
    }
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingAgent(null);
    applyFilters();
  };

  const handleSelectAgent = (agent: Agent) => {
    navigate(`/agents/${agent.id}`);
  };

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedStatus('all');
    setSelectedDepartment('all');
    setSelectedRole('all');
    applyFilters({ search: '', status: 'all', department: 'all', role: 'all' });
  };

  return (
    <PermissionGuard minRoleLevel={3} title="Gestion des agents">
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* En-tête */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Gestion des agents
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Administrez les agents consulaires de l'ambassade
              </p>
            </div>
            {can(PermissionCode.USER_CREATE) && (
              <Button variant="primary" onClick={() => setShowForm(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Nouvel agent
              </Button>
            )}
          </div>

          {/* Filtres */}
          <Card className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <Input
                placeholder="Rechercher un agent..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                startIcon={<Search className="w-4 h-4" />}
              />
              <Select
                value={selectedStatus}
                onChange={(value) => {
                  const status = value as UserStatus | 'all';
                  setSelectedStatus(status);
                  applyFilters({ status });
                }}
                options={[
                  { value: 'all', label: 'Tous les statuts' },
                  { value: UserStatus.VERIFIED, label: 'Vérifiés' },
                  { value: UserStatus.PENDING, label: 'En attente' },
                  { value: UserStatus.UNVERIFIED, label: 'Non vérifiés' },
                  { value: UserStatus.SUSPENDED, label: 'Suspendus' },
                ]}
              />
              <Select
                value={selectedDepartment}
                onChange={(value) => {
                  const department = value as AgentDepartment | 'all';
                  setSelectedDepartment(department);
                  applyFilters({ department });
                }}
                options={[
                  { value: 'all', label: 'Tous les départements' },
                  ...Object.entries(DEPARTMENT_LABELS).map(([value, label]) => ({
                    value,
                    label,
                  })),
                ]}
              />
              <Select
                value={selectedRole}
                onChange={(value) => {
                  const role = value as RoleName | 'all';
                  setSelectedRole(role);
                  applyFilters({ role });
                }}
                options={[
                  { value: 'all', label: 'Tous les rôles' },
                  { value: RoleName.AMBASSADOR, label: 'Ambassadeur' },
                  { value: RoleName.ADMIN, label: 'Administrateur' },
                  { value: RoleName.SENIOR_AGENT, label: 'Senior Agent' },
                  { value: RoleName.AGENT, label: 'Agent' },
                  { value: RoleName.RECEPTIONIST, label: 'Accueil' },
                  { value: RoleName.CULTURAL_ADVISOR, label: 'Conseiller Culturel' },
                  { value: RoleName.AUDITOR, label: 'Auditeur' },
                ]}
              />
            </div>
            <div className="flex justify-end mt-3">
              <Button variant="ghost" size="sm" onClick={resetFilters}>
                Réinitialiser les filtres
              </Button>
            </div>
          </Card>

          {/* Liste des agents */}
          <AgentList
            agents={filteredAgentsList}
            isLoading={isLoading || isLoadingAction}
            onSelect={handleSelectAgent}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onToggleActive={handleToggleActive}
            showActions={can(PermissionCode.USER_UPDATE)}
          />

          {agentsMeta && agentsMeta.totalPages > 1 && (
            <Card className="px-4 py-3">
              <Pagination
                currentPage={agentsMeta.page}
                totalPages={agentsMeta.totalPages}
                onPageChange={setAgentsPage}
                itemsPerPage={agentsMeta.limit}
                totalItems={agentsMeta.total}
              />
            </Card>
          )}
        </div>
      </div>

      {/* Modal du formulaire */}
      <AgentForm
        isOpen={showForm}
        onClose={() => {
          setShowForm(false);
          setEditingAgent(null);
        }}
        onSuccess={handleFormSuccess}
        editData={editingAgent}
      />
    </PermissionGuard>
  );
};

export default AgentsPage;