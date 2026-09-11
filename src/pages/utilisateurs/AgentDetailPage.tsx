// src/pages/utilisateurs/AgentDetailPage.tsx

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, User, Mail, Phone, Calendar, Shield, 
  Building, Briefcase, Edit, Trash2, CheckCircle, 
  XCircle, Clock, Users
} from 'lucide-react';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Avatar } from '../../components/ui/avatar';
import { PermissionGuard } from '../../components/auth/PermissionGuard';
import { RoleSelector } from '../../components/utilisateurs/RoleSelector';
import { useAgents } from '../../hooks/useAgents';
import { useRoles } from '../../hooks/useRoles';
import { usePermission } from '../../hooks/usePermission';
import { PermissionCode, Agent, UserStatus, RoleName } from '../../types/auth';
import { formatDateShort } from '../../lib/date';

const DEPARTMENT_LABELS: Record<string, string> = {
  CONSULAR: 'Consulaire',
  ADMINISTRATIVE: 'Administratif',
  FINANCIAL: 'Financier',
  COMMUNICATION: 'Communication',
  SECURITY: 'Sécurité',
  STUDIES: 'Études',
};

const STATUS_CONFIG = {
  [UserStatus.VERIFIED]: { color: 'success' as const, label: 'Vérifié', icon: CheckCircle },
  [UserStatus.PENDING]: { color: 'warning' as const, label: 'En attente', icon: Clock },
  [UserStatus.UNVERIFIED]: { color: 'gray' as const, label: 'Non vérifié', icon: XCircle },
  [UserStatus.SUSPENDED]: { color: 'error' as const, label: 'Suspendu', icon: XCircle },
};

export const AgentDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { 
    agents, 
    fetchAgent, 
    fetchAgents,
    toggleAgentActive, 
    deleteAgent,
    isLoading 
  } = useAgents();
  const { assignRoleToUser, removeRoleFromUser } = useRoles();
  const { can } = usePermission();

  const [agent, setAgent] = useState<Agent | null>(null);
  const [isLoadingAction, setIsLoadingAction] = useState(false);

  useEffect(() => {
    if (id) {
      const found = agents.find(a => a.id === id);
      if (found) {
        setAgent(found);
      } else {
        fetchAgent(id);
      }
    }
  }, [id, agents, fetchAgent]);

  const handleToggleActive = async () => {
    if (!agent) return;
    setIsLoadingAction(true);
    try {
      await toggleAgentActive(agent.id);
      await fetchAgents();
      const updated = agents.find(a => a.id === agent.id);
      if (updated) setAgent(updated);
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setIsLoadingAction(false);
    }
  };

  const handleDelete = async () => {
    if (!agent) return;
    if (!window.confirm(`Supprimer définitivement ${agent.user.profile.firstName} ${agent.user.profile.lastName} ?`)) return;
    
    setIsLoadingAction(true);
    try {
      await deleteAgent(agent.id);
      navigate('/agents');
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setIsLoadingAction(false);
    }
  };

  const handleAssignRole = async (roleId: string) => {
    if (!agent) return;
    try {
      await assignRoleToUser(agent.userId, roleId);
      await fetchAgents();
      const updated = agents.find(a => a.id === agent.id);
      if (updated) setAgent(updated);
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const handleRemoveRole = async (roleId: string) => {
    if (!agent) return;
    try {
      await removeRoleFromUser(agent.userId, roleId);
      await fetchAgents();
      const updated = agents.find(a => a.id === agent.id);
      if (updated) setAgent(updated);
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  if (isLoading || !agent) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div>
      </div>
    );
  }

  const statusConfig = STATUS_CONFIG[agent.user.status];

  return (
    <PermissionGuard minRoleLevel={3}>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* En-tête */}
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate('/agents')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour
            </Button>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Détails de l'agent
            </h1>
          </div>

          {/* Profil */}
          <Card className="p-6">
            <div className="flex flex-col md:flex-row md:items-start gap-6">
              <Avatar 
                alt={`${agent.user.profile.firstName} ${agent.user.profile.lastName}`}
                size="xxlarge"
                status={agent.active ? 'online' : 'offline'}
                className="flex-shrink-0"
              >
                {agent.user.profile.firstName.charAt(0)}
                {agent.user.profile.lastName.charAt(0)}
              </Avatar>

              <div className="flex-1">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                      {agent.user.profile.firstName} {agent.user.profile.lastName}
                    </h2>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <Badge color="gray" variant="light">
                        {agent.matricule}
                      </Badge>
                      <Badge color={agent.active ? 'success' : 'error'} variant="light">
                        {agent.active ? 'Actif' : 'Inactif'}
                      </Badge>
                      <Badge color={statusConfig.color} variant="light" startIcon={<statusConfig.icon className="w-3 h-3" />}>
                        {statusConfig.label}
                      </Badge>
                      {agent.user.activeRole && (
                        <Badge color="primary" variant="light">
                          {agent.user.activeRole.name}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {can(PermissionCode.USER_UPDATE) && (
                      <Button variant="outline" size="sm" onClick={handleToggleActive}>
                        {agent.active ? 'Désactiver' : 'Activer'}
                      </Button>
                    )}
                    {can(PermissionCode.USER_UPDATE) && (
                      <Button variant="outline" size="sm" onClick={() => navigate(`/agents/${agent.id}/edit`)}>
                        <Edit className="w-4 h-4 mr-1" />
                        Modifier
                      </Button>
                    )}
                    {can(PermissionCode.USER_DELETE) && (
                      <Button variant="error" size="sm" onClick={handleDelete}>
                        <Trash2 className="w-4 h-4 mr-1" />
                        Supprimer
                      </Button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                      <Mail className="w-4 h-4 text-gray-400" />
                      {agent.user.email}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                      <Phone className="w-4 h-4 text-gray-400" />
                      {agent.user.phone || 'Non renseigné'}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                      <Building className="w-4 h-4 text-gray-400" />
                      {DEPARTMENT_LABELS[agent.department] || agent.department}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                      <Briefcase className="w-4 h-4 text-gray-400" />
                      {agent.roleTitle || 'Non défini'}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      Embauche: {formatDateShort(agent.hiredAt)}
                    </div>
                  </div>
                </div>

                {agent.officeNumber && (
                  <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      <span className="font-medium">Bureau:</span> {agent.officeNumber}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* Services assignés */}
          {agent.assignments && agent.assignments.length > 0 && (
            <Card className="p-4">
              <h3 className="font-medium text-gray-700 dark:text-gray-300 mb-3">
                <Users className="w-4 h-4 inline mr-2" />
                Services assignés
              </h3>
              <div className="flex flex-wrap gap-2">
                {agent.assignments.map((assignment) => (
                  <Badge key={assignment.id} color="primary" variant="light">
                    {assignment.subService?.name || 'Service inconnu'}
                    {assignment.isPrimary && ' ★'}
                    {assignment.active && ' ✓'}
                  </Badge>
                ))}
              </div>
            </Card>
          )}

          {/* Gestion des rôles */}
          <Card className="p-4">
            <h3 className="font-medium text-gray-700 dark:text-gray-300 mb-3">
              <Shield className="w-4 h-4 inline mr-2" />
              Rôles et permissions
            </h3>
            <RoleSelector
              selectedRoleId={agent.user.activeRole?.id}
              onSelect={(roleId) => {
                // Afficher les détails du rôle
              }}
              onAssign={handleAssignRole}
              onRemove={handleRemoveRole}
              readOnly={!can(PermissionCode.USER_ADMIN)}
            />
          </Card>
        </div>
      </div>
    </PermissionGuard>
  );
};

export default AgentDetailPage;