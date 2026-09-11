// src/components/documents/internal/InternalDocumentShareModal.tsx

import React, { useState, useEffect } from 'react';
import { 
  User, Users, Search,  Check, Shield, AlertCircle, 
} from 'lucide-react';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Badge } from '../../ui/badge';
import { Modal } from '../../ui/modal';
import { InternalDocument, ConfidentialityLevel } from '../../../types/document';
import { RoleName, AgentDepartment } from '../../../types/auth';
import { useRoles } from '../../../hooks/useRoles';
import { useAgents } from '../../../hooks/useAgents';
import { usePermission } from '../../../hooks/usePermission';
import { useToast } from '../../../hooks/useToast';

interface InternalDocumentShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: InternalDocument;
  onShare: (targetAgentIds: string[], targetRoleIds: string[]) => Promise<void>;
}

export const InternalDocumentShareModal: React.FC<InternalDocumentShareModalProps> = ({
  isOpen,
  onClose,
  document,
  onShare,
}) => {
  const { toast } = useToast();
  const { roles, fetchRoles } = useRoles();
  const { agents, fetchAgents } = useAgents();
  const { canAccess } = usePermission();

  const [activeTab, setActiveTab] = useState<'roles' | 'agents'>('roles');
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([]);
  const [selectedAgentIds, setSelectedAgentIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  
  // Charger les rôles et agents quand le modal s'ouvre
  useEffect(() => {
    if (isOpen) {
      fetchRoles();
      fetchAgents();
    }
  }, [isOpen, fetchRoles, fetchAgents]);

  // Filtrer les agents accessibles
  const accessibleAgents = agents.filter(agent => {
    // Pour CONFIDENTIAL, seulement Ambassadeur et Admin
    if (document.confidentiality === ConfidentialityLevel.CONFIDENTIAL) {
      const role = agent.user.activeRole;
      return role && (role.name === RoleName.AMBASSADOR || role.name === RoleName.ADMIN);
    }
    return true;
  });

  // Filtrer les rôles accessibles
  const accessibleRoles = roles.filter(role => {
    // Pour CONFIDENTIAL, seulement Ambassadeur et Admin
    if (document.confidentiality === ConfidentialityLevel.CONFIDENTIAL) {
      return role.name === RoleName.AMBASSADOR || role.name === RoleName.ADMIN;
    }
    return true;
  });

  const filteredAgents = accessibleAgents.filter(agent => {
    if (!searchQuery) return true;
    const search = searchQuery.toLowerCase();
    const fullName = `${agent.user.profile.firstName} ${agent.user.profile.lastName}`.toLowerCase();
    return fullName.includes(search) || 
           agent.matricule.toLowerCase().includes(search) ||
           agent.user.email.toLowerCase().includes(search);
  });

  const toggleRole = (roleId: string) => {
    setSelectedRoleIds(prev => 
      prev.includes(roleId) 
        ? prev.filter(id => id !== roleId) 
        : [...prev, roleId]
    );
  };

  const toggleAgent = (agentId: string) => {
    setSelectedAgentIds(prev => 
      prev.includes(agentId) 
        ? prev.filter(id => id !== agentId) 
        : [...prev, agentId]
    );
  };

  const handleShare = async () => {
    if (selectedRoleIds.length === 0 && selectedAgentIds.length === 0) {
      toast({
        title: 'Aucun destinataire',
        description: 'Veuillez sélectionner au moins un rôle ou un agent.',
        variant: 'warning',
      });
      return;
    }

    setIsLoading(true);
    try {
      await onShare(selectedAgentIds, selectedRoleIds);
      toast({
        title: 'Partage mis à jour',
        description: `Document partagé avec ${selectedRoleIds.length + selectedAgentIds.length} destinataire(s).`,
        variant: 'success',
      });
      onClose();
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de partager le document.',
        variant: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Récupérer les destinataires actuels
  const currentRoleIds = document.targetRoleIds || [];
  const currentAgentIds = document.targetAgentIds || [];


  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Partager le document"
      size="lg"
    >
      <div className="space-y-6">
        {/* Informations */}
        <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <p className="font-medium text-gray-900 dark:text-white">{document.title}</p>
          <p className="text-sm text-gray-500">
            Confidentialité: <Badge color="warning" variant="light">
              {document.confidentiality}
            </Badge>
          </p>
        </div>

        {/* Onglets */}
        <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
          <button
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === 'roles'
                ? 'text-brand-600 border-b-2 border-brand-500'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('roles')}
          >
            <Users className="w-4 h-4 inline mr-2" />
            Par rôle
          </button>
          <button
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === 'agents'
                ? 'text-brand-600 border-b-2 border-brand-500'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('agents')}
          >
            <User className="w-4 h-4 inline mr-2" />
            Par agent
          </button>
        </div>

        {document.confidentiality === ConfidentialityLevel.CONFIDENTIAL && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-700">
            <div className="flex items-start gap-2 text-sm text-red-700 dark:text-red-300">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <p>
                Document confidentiel. Seuls l'Ambassadeur et les Administrateurs peuvent y accéder.
              </p>
            </div>
          </div>
        )}

        {/* Contenu des onglets */}
        {activeTab === 'roles' && (
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {accessibleRoles.map((role) => {
              const isSelected = selectedRoleIds.includes(role.id);
              const isCurrent = currentRoleIds.includes(role.id);
              
              return (
                <div
                  key={role.id}
                  className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${
                    isSelected ? 'bg-brand-50 dark:bg-brand-900/20' : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                  onClick={() => toggleRole(role.id)}
                >
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-900 dark:text-white">{role.name}</span>
                    {isCurrent && !isSelected && (
                      <Badge color="gray" variant="light" size="xs">
                        Actuel
                      </Badge>
                    )}
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-brand-500" />}
                </div>
              );
            })}
          </div>
        )}

        {activeTab === 'agents' && (
          <div className="space-y-3">
            <Input
              placeholder="Rechercher un agent..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              startIcon={<Search className="w-4 h-4" />}
            />

            <div className="space-y-2 max-h-60 overflow-y-auto">
              {filteredAgents.map((agent) => {
                const isSelected = selectedAgentIds.includes(agent.id);
                const isCurrent = currentAgentIds.includes(agent.id);
                
                return (
                  <div
                    key={agent.id}
                    className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${
                      isSelected ? 'bg-brand-50 dark:bg-brand-900/20' : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                    onClick={() => toggleAgent(agent.id)}
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-xs font-medium">
                        {agent.user.profile.firstName.charAt(0)}
                        {agent.user.profile.lastName.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {agent.user.profile.firstName} {agent.user.profile.lastName}
                        </p>
                        <p className="text-xs text-gray-500">{agent.matricule}</p>
                      </div>
                      {isCurrent && !isSelected && (
                        <Badge color="gray" variant="light" size="xs">
                          Actuel
                        </Badge>
                      )}
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-brand-500" />}
                  </div>
                );
              })}

              {filteredAgents.length === 0 && (
                <div className="text-center py-4 text-gray-500">
                  Aucun agent disponible
                </div>
              )}
            </div>
          </div>
        )}

        {/* Résumé */}
        <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            <span className="font-medium">Destinataires:</span>{' '}
            {selectedRoleIds.length + selectedAgentIds.length === 0 ? (
              'Aucun sélectionné'
            ) : (
              <>
                {selectedRoleIds.length > 0 && (
                  <span>{selectedRoleIds.length} rôle{selectedRoleIds.length > 1 ? 's' : ''}</span>
                )}
                {selectedRoleIds.length > 0 && selectedAgentIds.length > 0 && ' et '}
                {selectedAgentIds.length > 0 && (
                  <span>{selectedAgentIds.length} agent{selectedAgentIds.length > 1 ? 's' : ''}</span>
                )}
              </>
            )}
          </p>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button variant="ghost" onClick={onClose}>
            Annuler
          </Button>
          <Button 
            variant="primary" 
            onClick={handleShare}
            disabled={isLoading || (selectedRoleIds.length === 0 && selectedAgentIds.length === 0)}
          >
            {isLoading ? 'Partage en cours...' : 'Partager'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default InternalDocumentShareModal;