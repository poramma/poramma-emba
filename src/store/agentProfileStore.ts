// src/store/agentProfileStore.ts

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { AgentProfileData, AgentPreferences, ActivityLogEntry } from '../types/profile';
import { Agent, Utilisateur, UserProfile, UserRole, Role, AgentServiceAssignment, AgentAvailability, AgentException } from '../types/auth';
import { PermissionCode } from '../types/auth';

// ============================================================
// MOCK DATA
// ============================================================

const MOCK_PROFILE_DATA: AgentProfileData = {
  agent: {
    id: 'agent-002',
    userId: 'usr-002-agent',
    user: {} as Utilisateur,
    matricule: 'AGT-002-FC',
    roleTitle: 'Agent Consulaire',
    department: 'CONSULAR' as any,
    officeNumber: 'B-201',
    signatureUrl: null,
    active: true,
    hiredAt: '2024-03-01T00:00:00Z',
    createdAt: '2024-03-01T00:00:00Z',
    updatedAt: '2025-07-05T09:15:00Z',
  },
  user: {
    id: 'usr-002-agent',
    email: 'agent.consulaire@ambassade-mali.ma',
    phone: '+212 6 12 34 56 78',
    emailVerified: true,
    phoneVerified: true,
    status: 'VERIFIED' as any,
    mfaEnabled: false,
    lastLoginAt: '2025-07-17T08:30:00Z',
    createdAt: '2024-03-01T00:00:00Z',
    updatedAt: '2025-07-17T08:30:00Z',
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
      updatedAt: '2025-07-17T08:30:00Z',
    },
    roles: [],
    permissions: [],
  } as Utilisateur,
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
    updatedAt: '2025-07-17T08:30:00Z',
  },
  roles: [
    {
      id: 'role-002',
      userId: 'usr-002-agent',
      roleId: 'role-def-004',
      role: {
        id: 'role-def-004',
        name: 'AGENT' as any,
        description: 'Agent consulaire - Traitement standard',
        level: 4,
        isSystem: true,
        permissions: [
          { id: 'p1', code: PermissionCode.DEMANDE_READ, name: 'demande:read', description: 'Lire les demandes', resource: 'demande', action: 'read' },
          { id: 'p2', code: PermissionCode.DEMANDE_CREATE, name: 'demande:create', description: 'Créer une demande', resource: 'demande', action: 'create' },
          { id: 'p3', code: PermissionCode.DEMANDE_VALIDATE, name: 'demande:validate', description: 'Valider une demande', resource: 'demande', action: 'validate' },
          { id: 'p4', code: PermissionCode.RDV_READ, name: 'rdv:read', description: 'Lire les rendez-vous', resource: 'rdv', action: 'read' },
          { id: 'p5', code: PermissionCode.RDV_CREATE, name: 'rdv:create', description: 'Créer un rendez-vous', resource: 'rdv', action: 'create' },
          { id: 'p6', code: PermissionCode.DOCUMENT_READ, name: 'document:read', description: 'Lire les documents', resource: 'document', action: 'read' },
        ],
      },
      assignedBy: 'usr-001-ambassador',
      assignedAt: '2024-03-01T00:00:00Z',
      expiresAt: null,
      isActive: true,
    },
  ],
  activeRole: {
    id: 'role-def-004',
    name: 'AGENT' as any,
    description: 'Agent consulaire - Traitement standard',
    level: 4,
    isSystem: true,
    permissions: [
      { id: 'p1', code: PermissionCode.DEMANDE_READ, name: 'demande:read', description: 'Lire les demandes', resource: 'demande', action: 'read' },
      { id: 'p2', code: PermissionCode.DEMANDE_CREATE, name: 'demande:create', description: 'Créer une demande', resource: 'demande', action: 'create' },
      { id: 'p3', code: PermissionCode.DEMANDE_VALIDATE, name: 'demande:validate', description: 'Valider une demande', resource: 'demande', action: 'validate' },
      { id: 'p4', code: PermissionCode.RDV_READ, name: 'rdv:read', description: 'Lire les rendez-vous', resource: 'rdv', action: 'read' },
      { id: 'p5', code: PermissionCode.RDV_CREATE, name: 'rdv:create', description: 'Créer un rendez-vous', resource: 'rdv', action: 'create' },
      { id: 'p6', code: PermissionCode.DOCUMENT_READ, name: 'document:read', description: 'Lire les documents', resource: 'document', action: 'read' },
    ],
  },
  assignments: [
    {
      id: 'ass-001',
      agentId: 'agent-002',
      subServiceId: 'sub-011',
      subService: {
        id: 'sub-011',
        serviceId: 'svc-003',
        service: {} as any,
        name: 'Renouvellement Carte Consulaire',
        code: 'RENO_CARTE_CONS',
        description: 'Renouvellement annuel de la carte consulaire',
        active: true,
        basePrice: 80,
        currency: 'MAD',
        slaDays: 7,
        allowCustomRequest: false,
        requiresInPerson: true,
        createdAt: '',
        schedules: [],
        requirements: [],
      },
      isPrimary: true,
      maxDailyAppointments: 8,
      validFrom: '2024-03-01T00:00:00Z',
      validUntil: null,
      active: true,
      assignedAt: '2024-03-01T00:00:00Z',
    },
  ],
  availabilities: [
    { id: 'av1', agentId: 'agent-002', dayOfWeek: 1, startTime: '09:00', endTime: '12:00', isAvailable: true },
    { id: 'av2', agentId: 'agent-002', dayOfWeek: 1, startTime: '14:00', endTime: '17:00', isAvailable: true },
    { id: 'av3', agentId: 'agent-002', dayOfWeek: 2, startTime: '09:00', endTime: '12:00', isAvailable: true },
    { id: 'av4', agentId: 'agent-002', dayOfWeek: 2, startTime: '14:00', endTime: '17:00', isAvailable: true },
    { id: 'av5', agentId: 'agent-002', dayOfWeek: 3, startTime: '09:00', endTime: '12:00', isAvailable: true },
    { id: 'av6', agentId: 'agent-002', dayOfWeek: 3, startTime: '14:00', endTime: '17:00', isAvailable: true },
    { id: 'av7', agentId: 'agent-002', dayOfWeek: 4, startTime: '09:00', endTime: '12:00', isAvailable: true },
    { id: 'av8', agentId: 'agent-002', dayOfWeek: 4, startTime: '14:00', endTime: '17:00', isAvailable: true },
    { id: 'av9', agentId: 'agent-002', dayOfWeek: 5, startTime: '09:00', endTime: '12:00', isAvailable: true },
    { id: 'av10', agentId: 'agent-002', dayOfWeek: 5, startTime: '14:00', endTime: '16:00', isAvailable: true },
  ],
  exceptions: [
    {
      id: 'exc-001',
      agentId: 'agent-002',
      date: '2025-07-25',
      type: 'ABSENCE' as any,
      reason: 'Congé annuel',
      isFullDay: true,
      createdAt: '2025-07-10T00:00:00Z',
    },
    {
      id: 'exc-002',
      agentId: 'agent-002',
      date: '2025-08-01',
      type: 'FORMATION' as any,
      reason: 'Formation sur le nouveau système',
      isFullDay: false,
      startTime: '09:00',
      endTime: '12:00',
      createdAt: '2025-07-15T00:00:00Z',
    },
  ],
  preferences: {
    theme: 'system',
    language: 'fr',
    notificationsEmail: true,
    notificationsInApp: true,
    notificationTypes: {
      demandeAssigned: true,
      documentPending: true,
      rendezVousReminder: true,
    },
  },
  activities: [
    {
      id: 'act-001',
      action: 'validated',
      targetType: 'document',
      targetLabel: 'passeport_moussa_diarra.pdf',
      targetId: 'doc-001',
      createdAt: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
    },
    {
      id: 'act-002',
      action: 'created',
      targetType: 'rendez-vous',
      targetLabel: 'RDV-20250717-001',
      targetId: 'rdv-001',
      createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    },
    {
      id: 'act-003',
      action: 'viewed',
      targetType: 'demande',
      targetLabel: 'DEM-2025-0001234',
      targetId: 'dem-001',
      createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    },
  ],
};

// ============================================================
// INTERFACE DU STORE
// ============================================================

interface AgentProfileState {
  profileData: AgentProfileData | null;
  activities: ActivityLogEntry[];
  isLoading: boolean;
  isLoadingActivities: boolean;
  error: string | null;

  // Actions
  fetchProfile: () => Promise<void>;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
  updatePreferences: (preferences: Partial<AgentPreferences>) => Promise<void>;
  updatePassword: (data: { currentPassword: string; newPassword: string }) => Promise<void>;
  updateSignature: (file: File) => Promise<void>;
  removeSignature: () => Promise<void>;
  updateAvailability: (availabilities: AgentAvailability[]) => Promise<void>;
  fetchActivities: (offset?: number) => Promise<void>;
}

// ============================================================
// IMPLEMENTATION
// ============================================================

export const useAgentProfileStore = create<AgentProfileState>()(
  immer((set, get) => ({
    // État initial
    profileData: null,
    activities: [],
    isLoading: false,
    isLoadingActivities: false,
    error: null,

    fetchProfile: async () => {
      set((state) => { state.isLoading = true; state.error = null; });
      
      try {
        // ── BACKEND INTEGRATION ──
        // const { data } = await api.get('/profile');
        // set((state) => { state.profileData = data.data; });
        
        // ── MOCK ──
        await new Promise((r) => setTimeout(r, 600));
        set((state) => { state.profileData = MOCK_PROFILE_DATA; });
        
      } catch (err) {
        set((state) => {
          state.error = err instanceof Error ? err.message : 'Erreur de chargement du profil';
        });
      } finally {
        set((state) => { state.isLoading = false; });
      }
    },

    updateProfile: async (data) => {
      set((state) => { state.isLoading = true; state.error = null; });
      
      try {
        // ── BACKEND INTEGRATION ──
        // await api.patch('/profile', data);
        
        // ── MOCK ──
        await new Promise((r) => setTimeout(r, 500));
        set((state) => {
          if (state.profileData) {
            state.profileData.profile = { ...state.profileData.profile, ...data };
          }
        });
        
      } catch (err) {
        set((state) => {
          state.error = err instanceof Error ? err.message : 'Erreur de mise à jour';
        });
        throw err;
      } finally {
        set((state) => { state.isLoading = false; });
      }
    },

    updatePreferences: async (preferences) => {
      set((state) => { state.isLoading = true; state.error = null; });
      
      try {
        // ── BACKEND INTEGRATION ──
        // await api.patch('/profile/preferences', preferences);
        
        // ── MOCK ──
        await new Promise((r) => setTimeout(r, 300));
        set((state) => {
          if (state.profileData) {
            state.profileData.preferences = { ...state.profileData.preferences, ...preferences };
          }
        });
        
      } catch (err) {
        set((state) => {
          state.error = err instanceof Error ? err.message : 'Erreur de mise à jour';
        });
        throw err;
      } finally {
        set((state) => { state.isLoading = false; });
      }
    },

    updatePassword: async (data) => {
      set((state) => { state.isLoading = true; state.error = null; });
      
      try {
        // ── BACKEND INTEGRATION ──
        // await api.post('/profile/password', data);
        
        // ── MOCK ──
        await new Promise((r) => setTimeout(r, 600));
        
      } catch (err) {
        set((state) => {
          state.error = err instanceof Error ? err.message : 'Erreur de mise à jour';
        });
        throw err;
      } finally {
        set((state) => { state.isLoading = false; });
      }
    },

    updateSignature: async (file) => {
      set((state) => { state.isLoading = true; state.error = null; });
      
      try {
        // ── BACKEND INTEGRATION ──
        // const formData = new FormData();
        // formData.append('signature', file);
        // await api.post('/profile/signature', formData);
        
        // ── MOCK ──
        await new Promise((r) => setTimeout(r, 800));
        set((state) => {
          if (state.profileData) {
            state.profileData.agent.signatureUrl = URL.createObjectURL(file);
          }
        });
        
      } catch (err) {
        set((state) => {
          state.error = err instanceof Error ? err.message : 'Erreur de téléversement';
        });
        throw err;
      } finally {
        set((state) => { state.isLoading = false; });
      }
    },

    removeSignature: async () => {
      set((state) => { state.isLoading = true; state.error = null; });
      
      try {
        // ── BACKEND INTEGRATION ──
        // await api.delete('/profile/signature');
        
        // ── MOCK ──
        await new Promise((r) => setTimeout(r, 400));
        set((state) => {
          if (state.profileData) {
            state.profileData.agent.signatureUrl = null;
          }
        });
        
      } catch (err) {
        set((state) => {
          state.error = err instanceof Error ? err.message : 'Erreur de suppression';
        });
        throw err;
      } finally {
        set((state) => { state.isLoading = false; });
      }
    },

    updateAvailability: async (availabilities) => {
      set((state) => { state.isLoading = true; state.error = null; });
      
      try {
        // ── BACKEND INTEGRATION ──
        // await api.put('/profile/availabilities', { availabilities });
        
        // ── MOCK ──
        await new Promise((r) => setTimeout(r, 500));
        set((state) => {
          if (state.profileData) {
            state.profileData.availabilities = availabilities;
          }
        });
        
      } catch (err) {
        set((state) => {
          state.error = err instanceof Error ? err.message : 'Erreur de mise à jour';
        });
        throw err;
      } finally {
        set((state) => { state.isLoading = false; });
      }
    },

    fetchActivities: async (offset = 0) => {
      set((state) => { state.isLoadingActivities = true; state.error = null; });
      
      try {
        // ── BACKEND INTEGRATION ──
        // const { data } = await api.get('/profile/activities', { params: { offset, limit: 20 } });
        // set((state) => { state.activities = offset === 0 ? data.data : [...state.activities, ...data.data]; });
        
        // ── MOCK ──
        await new Promise((r) => setTimeout(r, 400));
        const newActivities = [
          {
            id: `act-${Date.now()}`,
            action: 'viewed',
            targetType: 'document' as any,
            targetLabel: `document_${offset + 1}.pdf`,
            targetId: `doc-${offset + 1}`,
            createdAt: new Date(Date.now() - 1000 * 60 * (offset + 1) * 5).toISOString(),
          },
          ...MOCK_PROFILE_DATA.activities.map(a => ({ ...a, id: `${a.id}-${offset}` })),
        ];
        set((state) => {
          state.activities = offset === 0 ? newActivities : [...state.activities, ...newActivities];
        });
        
      } catch (err) {
        set((state) => {
          state.error = err instanceof Error ? err.message : 'Erreur de chargement des activités';
        });
      } finally {
        set((state) => { state.isLoadingActivities = false; });
      }
    },
  }))
);