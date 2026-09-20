// src/store/agentsStore.ts

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { Agent, AgentDepartment, UserStatus, RoleName } from '../types/auth';
import { api } from '../lib/api';

// ============================================================
// INTERFACE DU STORE
// ============================================================

interface AgentsState {
  agents: Agent[];
  selectedAgent: Agent | null;
  isLoading: boolean;
  error: string | null;

  // Filtres
  searchQuery: string;
  selectedStatus: UserStatus | 'all';
  selectedDepartment: AgentDepartment | 'all';
  selectedRole: RoleName | 'all';

  // Actions: Lecture
  fetchAgents: () => Promise<void>;
  fetchAgent: (id: string) => Promise<void>;
  selectAgent: (agent: Agent | null) => void;

  // Actions: CRUD
  createAgent: (data: CreateAgentPayload) => Promise<Agent>;
  updateAgent: (id: string, data: UpdateAgentPayload) => Promise<Agent>;
  deleteAgent: (id: string) => Promise<void>;
  toggleAgentActive: (id: string) => Promise<void>;

  // Actions: Filtres
  setSearchQuery: (query: string) => void;
  setSelectedStatus: (status: UserStatus | 'all') => void;
  setSelectedDepartment: (department: AgentDepartment | 'all') => void;
  setSelectedRole: (role: RoleName | 'all') => void;
  resetFilters: () => void;

  // Computed
  filteredAgents: Agent[];
  getStats: () => AgentStats;
}

interface CreateAgentPayload {
  email: string;
  password?: string;
  phone?: string | null;
  firstName: string;
  lastName: string;
  matricule: string;
  roleTitle?: string | null;
  department: AgentDepartment;
  officeNumber?: string | null;
  roleId: string;
  active?: boolean;
}

interface UpdateAgentPayload extends Partial<CreateAgentPayload> {
  active?: boolean;
}

interface AgentStats {
  total: number;
  active: number;
  pending: number;
  suspended: number;
  byDepartment: Record<AgentDepartment, number>;
  byRole: Record<RoleName, number>;
}

// ============================================================
// IMPLEMENTATION
// ============================================================

export const useAgentsStore = create<AgentsState>()(
  immer((set, get) => ({
    // État initial
    agents: [],
    selectedAgent: null,
    isLoading: false,
    error: null,

    // Filtres
    searchQuery: '',
    selectedStatus: 'all',
    selectedDepartment: 'all',
    selectedRole: 'all',

    // ============================================================
    // COMPUTED
    // ============================================================

    get filteredAgents() {
      const { agents, searchQuery, selectedStatus, selectedDepartment, selectedRole } = get();
      return agents.filter(agent => {
        // Recherche
        if (searchQuery) {
          const query = searchQuery.toLowerCase();
          const fullName = `${agent.user.profile.firstName} ${agent.user.profile.lastName}`.toLowerCase();
          const matchName = fullName.includes(query);
          const matchEmail = agent.user.email.toLowerCase().includes(query);
          const matchMatricule = agent.matricule.toLowerCase().includes(query);
          if (!matchName && !matchEmail && !matchMatricule) return false;
        }

        // Statut
        if (selectedStatus !== 'all' && agent.user.status !== selectedStatus) return false;

        // Département
        if (selectedDepartment !== 'all' && agent.department !== selectedDepartment) return false;

        // Rôle
        if (selectedRole !== 'all' && agent.user.activeRole?.name !== selectedRole) return false;

        return true;
      });
    },

    getStats: () => {
      const agents = get().agents;
      const stats: AgentStats = {
        total: agents.length,
        active: agents.filter(a => a.active).length,
        pending: agents.filter(a => a.user.status === UserStatus.PENDING).length,
        suspended: agents.filter(a => a.user.status === UserStatus.SUSPENDED).length,
        byDepartment: {} as Record<AgentDepartment, number>,
        byRole: {} as Record<RoleName, number>,
      };

      // Initialiser les compteurs
      Object.values(AgentDepartment).forEach(dept => stats.byDepartment[dept] = 0);
      Object.values(RoleName).forEach(role => stats.byRole[role] = 0);

      // Compter
      agents.forEach(agent => {
        stats.byDepartment[agent.department] = (stats.byDepartment[agent.department] || 0) + 1;
        if (agent.user.activeRole) {
          stats.byRole[agent.user.activeRole.name] = (stats.byRole[agent.user.activeRole.name] || 0) + 1;
        }
      });

      return stats;
    },

    // ============================================================
    // ACTIONS: LECTURE
    // ============================================================

    fetchAgents: async () => {
      set((state) => { state.isLoading = true; state.error = null; });

      try {
        const { data } = await api.get('/agents');
        set((state) => { state.agents = data.data; });
      } catch (err) {
        set((state) => {
          state.error = err instanceof Error ? err.message : 'Erreur de chargement';
        });
      } finally {
        set((state) => { state.isLoading = false; });
      }
    },

    fetchAgent: async (id: string) => {
      set((state) => { state.isLoading = true; state.error = null; });

      try {
        const { data } = await api.get(`/agents/${id}`);
        set((state) => { state.selectedAgent = data.data; });
      } catch (err) {
        set((state) => {
          state.error = err instanceof Error ? err.message : 'Erreur de chargement';
        });
      } finally {
        set((state) => { state.isLoading = false; });
      }
    },

    selectAgent: (agent) => {
      set((state) => { state.selectedAgent = agent; });
    },

    // ============================================================
    // ACTIONS: CRUD
    // ============================================================

    createAgent: async (data: CreateAgentPayload) => {
      set((state) => { state.isLoading = true; state.error = null; });

      try {
        const { data: response } = await api.post('/agents', data);
        const newAgent: Agent = response.data;

        set((state) => {
          state.agents.push(newAgent);
          state.isLoading = false;
        });

        return newAgent;

      } catch (err) {
        set((state) => {
          state.isLoading = false;
          state.error = err instanceof Error ? err.message : 'Erreur de création';
        });
        throw err;
      }
    },

    updateAgent: async (id: string, data: UpdateAgentPayload) => {
      set((state) => { state.isLoading = true; state.error = null; });

      try {
        const { data: response } = await api.patch(`/agents/${id}`, data);
        const updatedAgent: Agent = response.data;

        set((state) => {
          const index = state.agents.findIndex(a => a.id === id);
          if (index !== -1) state.agents[index] = updatedAgent;
          state.isLoading = false;
        });

        return updatedAgent;

      } catch (err) {
        set((state) => {
          state.isLoading = false;
          state.error = err instanceof Error ? err.message : 'Erreur de mise à jour';
        });
        throw err;
      }
    },

    deleteAgent: async (id: string) => {
      set((state) => { state.isLoading = true; state.error = null; });

      try {
        await api.delete(`/agents/${id}`);

        set((state) => {
          state.agents = state.agents.filter(a => a.id !== id);
          if (state.selectedAgent?.id === id) state.selectedAgent = null;
          state.isLoading = false;
        });

      } catch (err) {
        set((state) => {
          state.isLoading = false;
          state.error = err instanceof Error ? err.message : 'Erreur de suppression';
        });
        throw err;
      }
    },

    toggleAgentActive: async (id: string) => {
      set((state) => { state.isLoading = true; state.error = null; });

      try {
        const agent = get().agents.find(a => a.id === id);
        const { data } = await api.patch(`/agents/${id}`, { active: !agent?.active });
        const updatedAgent: Agent = data.data;

        set((state) => {
          const index = state.agents.findIndex(a => a.id === id);
          if (index !== -1) state.agents[index] = updatedAgent;
          state.isLoading = false;
        });

      } catch (err) {
        set((state) => {
          state.isLoading = false;
          state.error = err instanceof Error ? err.message : 'Erreur de mise à jour';
        });
        throw err;
      }
    },

    // ============================================================
    // ACTIONS: FILTRES
    // ============================================================

    setSearchQuery: (query) => {
      set((state) => { state.searchQuery = query; });
    },

    setSelectedStatus: (status) => {
      set((state) => { state.selectedStatus = status; });
    },

    setSelectedDepartment: (department) => {
      set((state) => { state.selectedDepartment = department; });
    },

    setSelectedRole: (role) => {
      set((state) => { state.selectedRole = role; });
    },

    resetFilters: () => {
      set((state) => {
        state.searchQuery = '';
        state.selectedStatus = 'all';
        state.selectedDepartment = 'all';
        state.selectedRole = 'all';
      });
    },
  }))
);
