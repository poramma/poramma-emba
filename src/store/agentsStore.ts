// src/store/agentsStore.ts

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { Agent, AgentDepartment, UserStatus, RoleName, PermissionCode } from '../types/auth';
import { api } from '../lib/api';

// ============================================================
// MOCK DATA
// ============================================================

const MOCK_AGENTS: Agent[] = [
  {
    id: 'agent-001',
    userId: 'usr-001-ambassador',
    user: {
      id: 'usr-001-ambassador',
      email: 'ambassadeur@ambassade-mali.ma',
      phone: '+212-5XX-XXXXXX',
      emailVerified: true,
      phoneVerified: true,
      status: UserStatus.VERIFIED,
      mfaEnabled: true,
      lastLoginAt: '2025-07-05T08:30:00Z',
      createdAt: '2024-01-15T00:00:00Z',
      updatedAt: '2025-07-05T08:30:00Z',
      profile: {
        id: 'prof-001',
        userId: 'usr-001-ambassador',
        inue: null,
        userType: 'OTHER' as any,
        firstName: 'Moussa',
        lastName: 'TRAORÉ',
        dateOfBirth: '1965-03-15',
        nationality: 'Malienne',
        address: 'Ambassade du Mali, Rabat',
        city: 'Rabat',
        country: 'Maroc',
        createdAt: '2024-01-15T00:00:00Z',
        updatedAt: '2025-07-05T08:30:00Z',
      },
      roles: [],
      permissions: [],
      activeRole: {
        id: 'role-def-001',
        name: RoleName.AMBASSADOR,
        description: 'Chef de mission diplomatique - Accès illimité',
        level: 1,
        isSystem: true,
        permissions: [],
      },
    },
    matricule: 'AGT-001-MT',
    roleTitle: 'Ambassadeur',
    department: AgentDepartment.CONSULAR,
    officeNumber: 'A-001',
    signatureUrl: null,
    active: true,
    hiredAt: '2024-01-15T00:00:00Z',
    createdAt: '2024-01-15T00:00:00Z',
    updatedAt: '2025-07-05T08:30:00Z',
    assignments: [],
    availabilities: [],
  },
  {
    id: 'agent-002',
    userId: 'usr-002-agent',
    user: {
      id: 'usr-002-agent',
      email: 'agent.consulaire@ambassade-mali.ma',
      phone: '+212-6XX-XXXXXX',
      emailVerified: true,
      phoneVerified: true,
      status: UserStatus.VERIFIED,
      mfaEnabled: true,
      lastLoginAt: '2025-07-05T09:15:00Z',
      createdAt: '2024-03-01T00:00:00Z',
      updatedAt: '2025-07-05T09:15:00Z',
      profile: {
        id: 'prof-002',
        userId: 'usr-002-agent',
        inue: null,
        userType: 'OTHER' as any,
        firstName: 'Fatima',
        lastName: 'COULIBALY',
        dateOfBirth: '1988-07-22',
        nationality: 'Malienne',
        address: 'Ambassade du Mali, Rabat',
        city: 'Rabat',
        country: 'Maroc',
        createdAt: '2024-03-01T00:00:00Z',
        updatedAt: '2025-07-05T09:15:00Z',
      },
      roles: [],
      permissions: [],
      activeRole: {
        id: 'role-def-004',
        name: RoleName.AGENT,
        description: 'Agent consulaire - Traitement standard',
        level: 4,
        isSystem: true,
        permissions: [],
      },
    },
    matricule: 'AGT-002-FC',
    roleTitle: 'Agent Consulaire',
    department: AgentDepartment.CONSULAR,
    officeNumber: 'B-201',
    signatureUrl: null,
    active: true,
    hiredAt: '2024-03-01T00:00:00Z',
    createdAt: '2024-03-01T00:00:00Z',
    updatedAt: '2025-07-05T09:15:00Z',
    assignments: [],
    availabilities: [],
  },
  {
    id: 'agent-003',
    userId: 'usr-003-reception',
    user: {
      id: 'usr-003-reception',
      email: 'accueil@ambassade-mali.ma',
      phone: '+212-6XX-XXXXXX',
      emailVerified: true,
      phoneVerified: false,
      status: UserStatus.VERIFIED,
      mfaEnabled: false,
      lastLoginAt: '2025-07-05T07:45:00Z',
      createdAt: '2024-06-10T00:00:00Z',
      updatedAt: '2025-07-05T07:45:00Z',
      profile: {
        id: 'prof-003',
        userId: 'usr-003-reception',
        inue: null,
        userType: 'OTHER' as any,
        firstName: 'Amadou',
        lastName: 'DIALLO',
        dateOfBirth: '1992-11-05',
        nationality: 'Malienne',
        address: 'Ambassade du Mali, Rabat',
        city: 'Rabat',
        country: 'Maroc',
        createdAt: '2024-06-10T00:00:00Z',
        updatedAt: '2025-07-05T07:45:00Z',
      },
      roles: [],
      permissions: [],
      activeRole: {
        id: 'role-def-005',
        name: RoleName.RECEPTIONIST,
        description: 'Agent d\'accueil - Urgences et orientation',
        level: 5,
        isSystem: true,
        permissions: [],
      },
    },
    matricule: 'AGT-003-AD',
    roleTitle: 'Agent d\'Accueil',
    department: AgentDepartment.ADMINISTRATIVE,
    officeNumber: 'A-105',
    signatureUrl: null,
    active: true,
    hiredAt: '2024-06-10T00:00:00Z',
    createdAt: '2024-06-10T00:00:00Z',
    updatedAt: '2025-07-05T07:45:00Z',
    assignments: [],
    availabilities: [],
  },
  {
    id: 'agent-004',
    userId: 'usr-004-admin',
    user: {
      id: 'usr-004-admin',
      email: 'admin@ambassade-mali.ma',
      phone: '+212-6XX-XXXXXX',
      emailVerified: true,
      phoneVerified: true,
      status: UserStatus.VERIFIED,
      mfaEnabled: true,
      lastLoginAt: '2025-07-05T08:00:00Z',
      createdAt: '2024-01-20T00:00:00Z',
      updatedAt: '2025-07-05T08:00:00Z',
      profile: {
        id: 'prof-004',
        userId: 'usr-004-admin',
        inue: null,
        userType: 'OTHER' as any,
        firstName: 'Aïssata',
        lastName: 'KEITA',
        dateOfBirth: '1990-04-18',
        nationality: 'Malienne',
        address: 'Ambassade du Mali, Rabat',
        city: 'Rabat',
        country: 'Maroc',
        createdAt: '2024-01-20T00:00:00Z',
        updatedAt: '2025-07-05T08:00:00Z',
      },
      roles: [],
      permissions: [],
      activeRole: {
        id: 'role-def-002',
        name: RoleName.ADMIN,
        description: 'Administrateur système - Configuration et gestion',
        level: 2,
        isSystem: true,
        permissions: [],
      },
    },
    matricule: 'AGT-004-AK',
    roleTitle: 'Administrateur Système',
    department: AgentDepartment.ADMINISTRATIVE,
    officeNumber: 'C-001',
    signatureUrl: null,
    active: true,
    hiredAt: '2024-01-20T00:00:00Z',
    createdAt: '2024-01-20T00:00:00Z',
    updatedAt: '2025-07-05T08:00:00Z',
    assignments: [],
    availabilities: [],
  },
];

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
      console.log("Queries : ", searchQuery, selectedStatus, selectedDepartment, selectedRole);
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
        // ── BACKEND INTEGRATION ──
        // const { data } = await api.get('/agents');
        // set((state) => { state.agents = data.data; });
        
        // ── MOCK ──
        await new Promise((r) => setTimeout(r, 500));
        set((state) => { state.agents = MOCK_AGENTS; });
        
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
        // ── BACKEND INTEGRATION ──
        // const { data } = await api.get(`/agents/${id}`);
        // set((state) => { state.selectedAgent = data.data; });
        
        // ── MOCK ──
        await new Promise((r) => setTimeout(r, 300));
        const agent = get().agents.find(a => a.id === id);
        if (agent) {
          set((state) => { state.selectedAgent = agent; });
        }
        
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
        // ── BACKEND INTEGRATION ──
        // const { data: response } = await api.post('/agents', data);
        // const newAgent = response.data;
        
        // ── MOCK ──
        await new Promise((r) => setTimeout(r, 600));
        
        const newAgent: Agent = {
          id: `agent-${Date.now()}`,
          userId: `usr-${Date.now()}`,
          user: {
            id: `usr-${Date.now()}`,
            email: data.email,
            phone: data.phone || null,
            emailVerified: false,
            phoneVerified: false,
            status: UserStatus.PENDING,
            mfaEnabled: false,
            lastLoginAt: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            profile: {
              id: `prof-${Date.now()}`,
              userId: `usr-${Date.now()}`,
              inue: null,
              userType: 'OTHER' as any,
              firstName: data.firstName,
              lastName: data.lastName,
              dateOfBirth: null,
              nationality: 'Malienne',
              address: null,
              city: null,
              country: null,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
            roles: [],
            permissions: [],
            activeRole: undefined,
          },
          matricule: data.matricule,
          roleTitle: data.roleTitle || '',
          department: data.department,
          officeNumber: data.officeNumber || null,
          signatureUrl: null,
          active: data.active ?? true,
          hiredAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          assignments: [],
          availabilities: [],
        };
        
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
        // ── BACKEND INTEGRATION ──
        // const { data: response } = await api.patch(`/agents/${id}`, data);
        // const updatedAgent = response.data;
        
        // ── MOCK ──
        await new Promise((r) => setTimeout(r, 500));
        
        let updatedAgent: Agent | null = null;
        set((state) => {
          const index = state.agents.findIndex(a => a.id === id);
          if (index !== -1) {
            const agent = state.agents[index];
            
            // Mettre à jour les champs
            if (data.firstName) agent.user.profile.firstName = data.firstName;
            if (data.lastName) agent.user.profile.lastName = data.lastName;
            if (data.email) agent.user.email = data.email;
            if (data.phone !== undefined) agent.user.phone = data.phone;
            if (data.matricule) agent.matricule = data.matricule;
            if (data.roleTitle !== undefined && data.roleTitle !== null) agent.roleTitle = data.roleTitle;
            if (data.department) agent.department = data.department;
            if (data.officeNumber !== undefined) agent.officeNumber = data.officeNumber;
            if (data.active !== undefined) agent.active = data.active;
            
            agent.user.updatedAt = new Date().toISOString();
            agent.updatedAt = new Date().toISOString();
            
            updatedAgent = agent;
            state.isLoading = false;
          }
        });
        
        if (!updatedAgent) throw new Error('Agent non trouvé');
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
        // ── BACKEND INTEGRATION ──
        // await api.delete(`/agents/${id}`);
        
        // ── MOCK ──
        await new Promise((r) => setTimeout(r, 400));
        
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
        // ── BACKEND INTEGRATION ──
        // const agent = get().agents.find(a => a.id === id);
        // await api.patch(`/agents/${id}`, { active: !agent?.active });
        
        // ── MOCK ──
        await new Promise((r) => setTimeout(r, 300));
        
        set((state) => {
          const agent = state.agents.find(a => a.id === id);
          if (agent) {
            agent.active = !agent.active;
            agent.updatedAt = new Date().toISOString();
          }
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