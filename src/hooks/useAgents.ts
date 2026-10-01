// src/hooks/useAgents.ts

import { useCallback } from 'react';
import { useAgentsStore, AgentListQuery } from '../store/agentsStore';
import { Agent, AgentDepartment, UserStatus, RoleName } from '../types/auth';
import { PaginationMeta } from '../types/api';

interface UseAgentsReturn {
  // État
  agents: Agent[];
  agentsMeta: PaginationMeta | null;
  agentsPage: number;
  setAgentsPage: (page: number) => void;
  selectedAgent: Agent | null;
  isLoading: boolean;
  error: string | null;
  
  // Filtres
  searchQuery: string;
  selectedStatus: UserStatus | 'all';
  selectedDepartment: AgentDepartment | 'all';
  selectedRole: RoleName | 'all';
  
  // Computed
  filteredAgents: Agent[];
  getStats: () => any;
  
  // Actions
  fetchAgents: (query?: AgentListQuery) => Promise<void>;
  fetchAgent: (id: string) => Promise<void>;
  selectAgent: (agent: Agent | null) => void;
  createAgent: (data: any) => Promise<Agent>;
  updateAgent: (id: string, data: any) => Promise<Agent>;
  deleteAgent: (id: string) => Promise<void>;
  toggleAgentActive: (id: string) => Promise<void>;
  refreshAgents: (query?: AgentListQuery) => Promise<void>;
  
  // Filtres actions
  setSearchQuery: (query: string) => void;
  setSelectedStatus: (status: UserStatus | 'all') => void;
  setSelectedDepartment: (department: AgentDepartment | 'all') => void;
  setSelectedRole: (role: RoleName | 'all') => void;
  resetFilters: () => void;
}

export const useAgents = (): UseAgentsReturn => {
  const store = useAgentsStore();

  const {
    agents,
    agentsMeta,
    agentsPage,
    setAgentsPage,
    selectedAgent,
    isLoading,
    error,
    searchQuery,
    selectedStatus,
    selectedDepartment,
    selectedRole,
    fetchAgents,
    fetchAgent,
    selectAgent,
    createAgent,
    updateAgent,
    deleteAgent,
    toggleAgentActive,
    setSearchQuery,
    setSelectedStatus,
    setSelectedDepartment,
    setSelectedRole,
    resetFilters,
  } = store;

  // Computed
  const filteredAgents = store.filteredAgents;
  const getStats = useCallback(() => store.getStats(), [store.getStats]);

  const refreshAgents = useCallback(async (query?: AgentListQuery) => {
    await fetchAgents(query);
  }, [fetchAgents]);

  return {
    // État
    agents,
    agentsMeta,
    agentsPage,
    setAgentsPage,
    selectedAgent,
    isLoading,
    error,
    
    // Filtres
    searchQuery,
    selectedStatus,
    selectedDepartment,
    selectedRole,
    
    // Computed
    filteredAgents,
    getStats,
    
    // Actions
    fetchAgents,
    fetchAgent,
    selectAgent,
    createAgent,
    updateAgent,
    deleteAgent,
    toggleAgentActive,
    refreshAgents,
    
    // Filtres actions
    setSearchQuery,
    setSelectedStatus,
    setSelectedDepartment,
    setSelectedRole,
    resetFilters,
  };
};