// src/components/utilisateurs/AgentList.tsx

import React from 'react';
import { Eye, Edit, Trash2, User, CheckCircle, XCircle, Clock } from 'lucide-react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Avatar } from '../ui/avatar';
import { Table, TableHeader, TableRow, TableBody, TableCell } from '../ui/table';
import { Agent, UserStatus } from '../../types/auth';
import { usePermission } from '../../hooks/usePermission';
import { PermissionCode } from '../../types/auth';

interface AgentListProps {
  agents: Agent[];
  isLoading?: boolean;
  onSelect?: (agent: Agent) => void;
  onEdit?: (agent: Agent) => void;
  onDelete?: (agent: Agent) => void;
  onToggleActive?: (agent: Agent) => void;
  showActions?: boolean;
}

export const AgentList: React.FC<AgentListProps> = ({
  agents,
  isLoading = false,
  onSelect,
  onEdit,
  onDelete,
  onToggleActive,
  showActions = true,
}) => {
  const { can } = usePermission();

  const getStatusBadge = (status: UserStatus) => {
    const config = {
      [UserStatus.VERIFIED]: { color: 'success' as const, text: 'Vérifié', icon: CheckCircle },
      [UserStatus.PENDING]: { color: 'warning' as const, text: 'En attente', icon: Clock },
      [UserStatus.UNVERIFIED]: { color: 'gray' as const, text: 'Non vérifié', icon: XCircle },
      [UserStatus.SUSPENDED]: { color: 'error' as const, text: 'Suspendu', icon: XCircle },
    };
    const { color, text, icon: Icon } = config[status];
    return <Badge color={color} variant="light" startIcon={<Icon className="w-3 h-3" />}>{text}</Badge>;
  };

  const getActiveBadge = (active: boolean) => {
    return active ? (
      <Badge color="success" variant="light" startIcon={<CheckCircle className="w-3 h-3" />}>
        Actif
      </Badge>
    ) : (
      <Badge color="error" variant="light" startIcon={<XCircle className="w-3 h-3" />}>
        Inactif
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <Card>
        <div className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500 mx-auto"></div>
          <p className="text-gray-500 mt-2">Chargement des agents...</p>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="overflow-x-auto">
        <Table bordered hover>
          <TableHeader>
            <TableRow>
              <TableCell isHeader>Agent</TableCell>
              <TableCell isHeader>Matricule</TableCell>
              <TableCell isHeader>Statut</TableCell>
              <TableCell isHeader align="right">Actions</TableCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {agents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8">
                  <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    Aucun agent trouvé
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400">
                    Aucun agent ne correspond à vos critères de recherche.
                  </p>
                </TableCell>
              </TableRow>
            ) : (
              agents.map((agent) => (
                <TableRow 
                  key={agent.id}
                  className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                  onClick={() => onSelect?.(agent)}
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar 
                        alt={`${agent.user.profile.firstName} ${agent.user.profile.lastName}`}
                        size="medium"
                        status={agent.active ? 'online' : 'offline'}
                        className="flex-shrink-0"
                      >
                        {agent.user.profile.firstName.charAt(0)}
                        {agent.user.profile.lastName.charAt(0)}
                      </Avatar>
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {agent.user.profile.firstName} {agent.user.profile.lastName}
                        </div>
                        <div className="text-sm text-gray-500">{agent.user.email}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="font-mono text-sm">{agent.matricule}</span>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap items-center gap-2">
                      {getStatusBadge(agent.user.status)}
                      {getActiveBadge(agent.active)}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button 
                        size="xs" 
                        variant="ghost"
                        onClick={(e) => {
                          e?.stopPropagation();
                          onSelect?.(agent);
                        }}
                        title="Voir les détails"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      {showActions && (
                        <>
                          <Button 
                            size="xs" 
                            variant="ghost"
                            onClick={(e) => {
                              e?.stopPropagation();
                              onEdit?.(agent);
                            }}
                            title="Modifier"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button 
                            size="xs" 
                            variant="ghost"
                            onClick={(e) => {
                              e?.stopPropagation();
                              onToggleActive?.(agent);
                            }}
                            title={agent.active ? 'Désactiver' : 'Activer'}
                          >
                            {agent.active ? (
                              <XCircle className="w-4 h-4 text-red-500" />
                            ) : (
                              <CheckCircle className="w-4 h-4 text-green-500" />
                            )}
                          </Button>
                          {can(PermissionCode.USER_DELETE) && (
                            <Button 
                              size="xs" 
                              variant="ghost"
                              onClick={(e) => {
                                e?.stopPropagation();
                                onDelete?.(agent);
                              }}
                              title="Supprimer"
                            >
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </Button>
                          )}
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
};

export default AgentList;