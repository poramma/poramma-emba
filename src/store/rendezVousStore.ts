// ============================================================
// src/store/rendezVousStore.ts
// ============================================================

import { create } from 'zustand';
import {
  RendezVous,
  AgendaSlot,
  DailySchedulePrint,
  RDVType,
  RDVStatus,
  PrintFormat,
  PrintStatus,
  DailyScheduleContent,
  SubService,
  Agent,
  Utilisateur,
  Demande,
  AgentDepartment,
  Priority,
  AppStatus,
} from '../types';
import { useAuthStore } from './authStore';
import { SUB_SERVICES } from '../config/services-consulaires';

// ============================================================
// MOCK DATA: Rendez-Vous
// ============================================================

/**
 * MOCK: Agents pour les rendez-vous
 * Backend: GET /api/agents
 */
const MOCK_AGENTS: Record<string, Agent> = {
  'agent-002-fatima': {
    id: 'agent-002-fatima',
    userId: 'usr-002-agent',
    user: {
      id: 'usr-002-agent',
      email: 'fatima.coulibaly@ambassade-mali.ma',
      phone: null,
      emailVerified: true,
      phoneVerified: false,
      status: 'VERIFIED' as any,
      mfaEnabled: false,
      lastLoginAt: '2026-07-05T08:00:00Z',
      createdAt: '2025-01-15T00:00:00Z',
      updatedAt: '2025-07-05T08:00:00Z',
      profile: {
        id: 'prof-002',
        userId: 'usr-002-agent',
        inue: null,
        userType: 'OTHER' as any,
        firstName: 'Fatima',
        lastName: 'COULIBALY',
        dateOfBirth: null,
        nationality: null,
        address: null,
        city: null,
        country: null,
        createdAt: '2025-01-15T00:00:00Z',
        updatedAt: '2025-07-05T08:00:00Z',
      },
      roles: [],
      permissions: [],
    } as Utilisateur,
    matricule: 'AGT-002-FC',
    roleTitle: 'Agent Consulaire',
    department: AgentDepartment.CONSULAR,
    officeNumber: 'B-201',
    signatureUrl: null,
    active: true,
    hiredAt: '2025-01-15T00:00:00Z',
    createdAt: '2025-01-15T00:00:00Z',
    updatedAt: '2025-07-05T08:00:00Z',
    assignments: [],
    availabilities: [],
  },
  'agent-003-amadou': {
    id: 'agent-003-amadou',
    userId: 'usr-003-agent',
    user: {
      id: 'usr-003-agent',
      email: 'amadou.diallo@ambassade-mali.ma',
      phone: null,
      emailVerified: true,
      phoneVerified: false,
      status: 'VERIFIED' as any,
      mfaEnabled: false,
      lastLoginAt: '2026-07-05T08:00:00Z',
      createdAt: '2026-02-01T00:00:00Z',
      updatedAt: '2026-07-05T08:00:00Z',
      profile: {
        id: 'prof-003',
        userId: 'usr-003-agent',
        inue: null,
        userType: 'OTHER' as any,
        firstName: 'Amadou',
        lastName: 'DIALLO',
        dateOfBirth: null,
        nationality: null,
        address: null,
        city: null,
        country: null,
        createdAt: '2026-02-01T00:00:00Z',
        updatedAt: '2026-07-05T08:00:00Z',
      },
      roles: [],
      permissions: [],
    } as Utilisateur,
    matricule: 'AGT-003-AD',
    roleTitle: 'Agent Etudes',
    department: AgentDepartment.STUDIES,
    officeNumber: 'C-105',
    signatureUrl: null,
    active: true,
    hiredAt: '2026-02-01T00:00:00Z',
    createdAt: '2026-02-01T00:00:00Z',
    updatedAt: '2026-07-05T08:00:00Z',
    assignments: [],
    availabilities: [],
  },
};

/**
 * MOCK: Créneaux disponibles pour aujourd'hui
 * Backend: GET /api/agenda-slots?date=2025-07-05&subServiceId=...
 * Générés automatiquement par le backend selon ServiceSchedule + AgentAvailability
 */
const MOCK_SLOTS: AgendaSlot[] = [
  {
    id: 'slot-001',
    subServiceId: 'sub-011', // RENO_CARTE_CONSULAIRE
    subService: SUB_SERVICES.find((s) => s.id === 'sub-011') || {} as SubService,
    agentId: 'agent-002-fatima',
    agent: MOCK_AGENTS['agent-002-fatima'],
    date: '2026-07-10',
    startTime: '09:00',
    endTime: '09:30',
    tz: 'Africa/Casablanca',
    isBooked: false,
    isBlocked: false,
    blockReason: null,
    createdAt: '2026-07-10T00:00:00Z',
  },
  {
    id: 'slot-002',
    subServiceId: 'sub-011', // RENO_CARTE_CONSULAIRE
    subService: SUB_SERVICES.find((s) => s.id === 'sub-011') || {} as SubService,
    agentId: 'agent-002-fatima',
    agent: MOCK_AGENTS['agent-002-fatima'],
    date: '2026-07-10',
    startTime: '09:30',
    endTime: '10:00',
    tz: 'Africa/Casablanca',
    isBooked: true,
    isBlocked: false,
    blockReason: null,
    createdAt: '2026-07-10T00:00:00Z',
  },
  {
    id: 'slot-003',
    subServiceId: 'sub-025', // ACTE_NAISSANCE
    subService: SUB_SERVICES.find((s) => s.id === 'sub-025') || {} as SubService,
    agentId: 'agent-003-amadou',
    agent: MOCK_AGENTS['agent-003-amadou'],
    date: '2026-07-10',
    startTime: '10:00',
    endTime: '10:30',
    tz: 'Africa/Casablanca',
    isBooked: false,
    isBlocked: false,
    blockReason: null,
    createdAt: '2026-07-10T00:00:00Z',
  },
  {
    id: 'slot-004',
    subServiceId: 'sub-006', // DEM_PASSEPORT
    subService: SUB_SERVICES.find((s) => s.id === 'sub-006') || {} as SubService,
    agentId: 'agent-002-fatima',
    agent: MOCK_AGENTS['agent-002-fatima'],
    date: '2026-07-10',
    startTime: '14:00',
    endTime: '14:30',
    tz: 'Africa/Casablanca',
    isBooked: false,
    isBlocked: true, // Créneau bloqué manuellement
    blockReason: 'Réunion interne',
    createdAt: '2026-07-01T00:00:00Z',
  },
];

// Ajouter une fonction utilitaire pour récupérer le slot
const getSlotById = (slotId: string | null): AgendaSlot | null => {
  if (!slotId) return null;
  return MOCK_SLOTS.find(s => s.id === slotId) || null;
};

/**
 * MOCK: Demande liée aux rendez-vous
 * Backend: GET /api/demandes/:id
 */
const MOCK_DEMANDE: Demande = {
  id: 'dem-2025-0001234',
  userId: 'usr-stu-001',
  user: {
    id: 'usr-stu-001',
    email: 'moussa.diarra@etudiant.ma',
    phone: null,
    emailVerified: true,
    phoneVerified: false,
    status: 'VERIFIED' as any,
    mfaEnabled: false,
    lastLoginAt: '2026-07-05T08:00:00Z',
    createdAt: '2026-01-15T00:00:00Z',
    updatedAt: '2026-07-05T08:00:00Z',
    profile: {
      id: 'prof-001',
      userId: 'usr-stu-001',
      inue: 'ML-STU-000237',
      userType: 'STUDENT' as any,
      firstName: 'Moussa',
      lastName: 'DIARRA',
      dateOfBirth: null,
      nationality: null,
      address: null,
      city: null,
      country: null,
      createdAt: '2026-01-15T00:00:00Z',
      updatedAt: '2026-07-05T08:00:00Z',
    },
    roles: [],
    permissions: [],
  } as Utilisateur,
  subServiceId: 'sub-011', // RENO_CARTE_CONSULAIRE
  subService: SUB_SERVICES.find((s) => s.id === 'sub-011') || {} as SubService,
  assignedAgentId: 'agent-002-fatima',
  assignedAgent: MOCK_AGENTS['agent-002-fatima'],
  dossierNumber: 'DEM-2025-0001234',
  status: AppStatus.IN_REVIEW,
  priority: Priority.NORMAL,
  totalAmount: null,
  currency: null,
  customPayload: null,
  submittedAt: '2025-07-02T09:30:00Z',
  assignedAt: '2025-07-02T10:00:00Z',
  deadlineAt: null,
  completedAt: null,
  createdAt: '2025-07-02T09:30:00Z',
  updatedAt: '2025-07-02T10:30:00Z',
};

/**
 * MOCK: Rendez-vous existants pour aujourd'hui
 * Backend: GET /api/rendez-vous?date=2025-07-05&agentId=...
 */
const MOCK_RENDEZ_VOUS: RendezVous[] = [
  {
    id: 'rdv-001',
    demandeId: 'dem-2025-0001234',
    demande: MOCK_DEMANDE,
    userId: 'usr-stu-001',
    user: {
      id: 'usr-stu-001',
      email: 'moussa.diarra@etudiant.ma',
      phone: null,
      emailVerified: true,
      phoneVerified: false,
      status: 'VERIFIED' as any,
      mfaEnabled: false,
      lastLoginAt: '2026-07-05T08:00:00Z',
      createdAt: '2026-01-15T00:00:00Z',
      updatedAt: '2026-07-05T08:00:00Z',
      profile: {
        id: 'prof-001',
        userId: 'usr-stu-001',
        inue: 'ML-STU-000237',
        userType: 'STUDENT' as any,
        firstName: 'Moussa',
        lastName: 'DIARRA',
        dateOfBirth: null,
        nationality: null,
        address: null,
        city: null,
        country: null,
        createdAt: '2026-01-15T00:00:00Z',
        updatedAt: '2026-07-05T08:00:00Z',
      },
      roles: [],
      permissions: [],
    } as Utilisateur,
    agentId: 'agent-002-fatima',
    agent: MOCK_AGENTS['agent-002-fatima'],
    slotId: 'slot-002',
    slot: getSlotById('slot-002'),
    ticketId: 'RDV-20250705-001',
    type: RDVType.STANDARD,
    status: RDVStatus.CONFIRMED,
    motif: 'Renouvellement carte consulaire',
    isUrgent: false,
    urgenceJustification: null,
    createdBy: 'usr-stu-001',
    createdAt: '2026-07-10T10:30:00Z',
    updatedAt: '2026-07-10T10:30:00Z',
    remindedAt: '2026-07-10T08:00:00Z',
    checkedInAt: null,
    completedAt: null,
  },
  {
    id: 'rdv-002',
    demandeId: null, // Pas de demande préalable = urgence
    demande: null,
    userId: 'usr-stu-002',
    user: {
      id: 'usr-stu-002',
      email: 'fatoumata.toure@etudiant.ma',
      phone: null,
      emailVerified: true,
      phoneVerified: false,
      status: 'VERIFIED' as any,
      mfaEnabled: false,
      lastLoginAt: '2026-07-05T08:00:00Z',
      createdAt: '2026-02-01T00:00:00Z',
      updatedAt: '2026-07-05T08:00:00Z',
      profile: {
        id: 'prof-002',
        userId: 'usr-stu-002',
        inue: 'ML-STU-000456',
        userType: 'STUDENT' as any,
        firstName: 'Fatoumata',
        lastName: 'TOURÉ',
        dateOfBirth: null,
        nationality: null,
        address: null,
        city: null,
        country: null,
        createdAt: '2026-02-01T00:00:00Z',
        updatedAt: '2026-07-05T08:00:00Z',
      },
      roles: [],
      permissions: [],
    } as Utilisateur,
    agentId: 'agent-003-amadou',
    agent: MOCK_AGENTS['agent-003-amadou'],
    slotId: null, // Pas de créneau = urgence directe
    ticketId: 'URG-20250705-001',
    type: RDVType.URGENCE,
    status: RDVStatus.CHECKED_IN,
    motif: 'Perte de passeport - déclaration urgente',
    isUrgent: true,
    urgenceJustification: 'Départ imminent, vol prévu dans 48h',
    createdBy: 'usr-003-reception', // Créé par l'agent d'accueil
    createdAt: '2026-07-05T09:15:00Z',
    updatedAt: '2026-07-05T09:15:00Z',
    remindedAt: null,
    checkedInAt: '2026-07-05T09:20:00Z',
    completedAt: null,
  },
  {
    id: 'rdv-003',
    demandeId: 'dem-2025-0001235',
    demande: {
      ...MOCK_DEMANDE,
      id: 'dem-2025-0001235',
      userId: 'usr-stu-003',
      dossierNumber: 'DEM-2025-0001235',
      subServiceId: 'sub-032', // CERTIF_CELIBAT (exemple)
      subService: SUB_SERVICES.find((s) => s.id === 'sub-032') || {} as SubService,
      customPayload: {
        title: 'Problème bourse - non-paiement',
        description: 'Non-paiement de la bourse depuis 3 mois',
      },
    },
    userId: 'usr-stu-003',
    user: {
      id: 'usr-stu-003',
      email: 'amadou.kone@etudiant.ma',
      phone: null,
      emailVerified: true,
      phoneVerified: false,
      status: 'VERIFIED' as any,
      mfaEnabled: false,
      lastLoginAt: '2026-07-05T08:00:00Z',
      createdAt: '2026-03-01T00:00:00Z',
      updatedAt: '2026-07-05T08:00:00Z',
      profile: {
        id: 'prof-003',
        userId: 'usr-stu-003',
        inue: 'ML-STU-000789',
        userType: 'STUDENT' as any,
        firstName: 'Amadou',
        lastName: 'KONÉ',
        dateOfBirth: null,
        nationality: null,
        address: null,
        city: null,
        country: null,
        createdAt: '2026-06-09T00:00:00Z',
        updatedAt: '2026-06-15T08:00:00Z',
      },
      roles: [],
      permissions: [],
    } as Utilisateur,
    agentId: 'agent-002-fatima',
    agent: MOCK_AGENTS['agent-002-fatima'],
    slotId: 'slot-005',
    slot: getSlotById('slot-005'),
    ticketId: 'RDV-20250705-002',
    type: RDVType.PRIORITAIRE,
    status: RDVStatus.IN_PROGRESS,
    motif: 'Problème bourse - non-paiement 3 mois',
    isUrgent: false,
    urgenceJustification: null,
    createdBy: 'usr-004-admin',
    createdAt: '2026-07-03T14:00:00Z',
    updatedAt: '2026-07-05T09:45:00Z',
    remindedAt: '2026-07-05T08:00:00Z',
    checkedInAt: '2026-07-05T09:30:00Z',
    completedAt: null,
  },
];

/**
 * MOCK: Historique d'impressions du planning
 * Backend: GET /api/rendez-vous/print-history?date=2026-07-05
 */
const MOCK_PRINT_HISTORY: DailySchedulePrint[] = [
  {
    id: 'print-001',
    date: '2026-07-05',
    agentId: null, // Tous les agents
    agent: null,
    subServiceId: null, // Tous les services
    subService: null,
    printedBy: 'usr-003-reception',
    printedByAgent: MOCK_AGENTS['agent-002-fatima'],
    printedAt: '2026-07-05T07:30:00Z',
    format: PrintFormat.PDF,
    content: {
      date: '2026-07-05',
      generatedAt: '2026-07-05T07:30:00Z',
      totalAppointments: 12,
      byService: [
        {
          subServiceId: 'sub-001',
          subServiceName: 'Renouvellement carte consulaire',
          appointments: [
            {
              time: '09:30',
              ticketId: 'RDV-20250705-001',
              studentName: 'Moussa DIARRA',
              studentInue: 'ML-STU-000237',
              motif: 'Renouvellement carte consulaire',
              status: 'CONFIRMED',
              agentName: 'Fatima COULIBALY',
              isUrgent: false,
            },
          ],
        },
        {
          subServiceId: 'sub-002',
          subServiceName: 'Attestation de scolarité',
          appointments: [
            {
              time: '10:00',
              ticketId: 'RDV-20250705-003',
              studentName: 'Aïssata KEITA',
              studentInue: 'ML-STU-000321',
              motif: 'Attestation pour renouvellement titre séjour',
              status: 'PENDING',
              agentName: 'Amadou DIALLO',
              isUrgent: false,
            },
          ],
        },
      ],
    },
    status: PrintStatus.PRINTED,
  },
];

// ============================================================
// INTERFACE DU STORE
// ============================================================

interface RendezVousState {
  // État
  slots: AgendaSlot[];
  rendezVous: RendezVous[];
  selectedDate: string;
  selectedAgentId: string | null;
  selectedSubServiceId: string | null;
  printHistory: DailySchedulePrint[];
  lastPrint: DailySchedulePrint | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions: CRUD standard
  fetchSlots: (date: string, subServiceId?: string, agentId?: string) => Promise<void>;
  fetchSlotById:(slotId:string) => Promise<AgendaSlot | undefined> ;
  fetchRendezVous: (filters: RdvFilters) => Promise<void>;
  createRendezVous: (data: CreateRdvPayload) => Promise<RendezVous>;
  updateRendezVousStatus: (id: string, status: RDVStatus, comment?: string) => Promise<void>;
  cancelRendezVous: (id: string, reason: string) => Promise<void>;
  
  // Actions: Urgence (nouveau besoin ambassade)
  createUrgence: (data: CreateUrgencePayload) => Promise<RendezVous>;
  
  // Actions: Impression (nouveau besoin ambassade)
  printDailySchedule: (params: PrintScheduleParams) => Promise<DailySchedulePrint>;
  fetchPrintHistory: (date: string) => Promise<void>;
  reprint: (printId: string) => Promise<DailySchedulePrint>;
  
  // Actions: UI
  setSelectedDate: (date: string) => void;
  setSelectedAgent: (agentId: string | null) => void;
  setSelectedSubService: (subServiceId: string | null) => void;
  checkIn: (rdvId: string) => Promise<void>;
  completeRendezVous: (rdvId: string, notes?: string) => Promise<void>;
}

interface RdvFilters {
  date?: string;
  agentId?: string;
  subServiceId?: string;
  status?: RDVStatus;
  type?: RDVType;
  userId?: string;
  fromDate?: string;
  toDate?: string;
}

interface CreateRdvPayload {
  userId: string;
  subServiceId: string;
  agentId: string;
  slotId: string;
  motif?: string;
  demandeId?: string;
}

interface CreateUrgencePayload {
  userId: string;
  subServiceId: string;
  agentId: string;
  motif: string;
  urgenceJustification: string;
  demandeId?: string;
}

interface PrintScheduleParams {
  date: string;
  agentId?: string;
  subServiceId?: string;
  format: PrintFormat;
}

// ============================================================
// IMPLEMENTATION
// ============================================================

export const useRendezVousStore = create<RendezVousState>()((set, get) => ({
  // État initial
  slots: MOCK_SLOTS,
  rendezVous: MOCK_RENDEZ_VOUS,
  selectedDate: new Date().toISOString().split('T')[0],
  selectedAgentId: null,
  selectedSubServiceId: null,
  printHistory: [],
  lastPrint: null,
  isLoading: false,
  error: null,
  
  /**
   * FETCH SLOTS (créneaux disponibles)
   * Backend: GET /api/agenda-slots
   * Query: ?date=YYYY-MM-DD&subServiceId=&agentId=
   * 
   * Les créneaux sont générés automatiquement par le backend
   * en croisant:
   * - ServiceSchedule (horaires du service)
   * - AgentAvailability (dispo de l'agent)
   * - AgentException (absences)
   * - ServiceException (fermetures)
   * - RendezVous existants (isBooked)
   */
  fetchSlots: async (date, subServiceId, agentId) => {
    set({ isLoading: true, error: null });
    
    try {
      // SIMULATION DÉLAI RÉSEAU
      await new Promise((resolve) => setTimeout(resolve, 600));
      
      // VRAIE IMPLÉMENTATION:
      // const { data } = await api.get('/agenda-slots', {
      //   params: { date, subServiceId, agentId }
      // });
      // set({ slots: data.data, isLoading: false });
      
      // MOCK: Filtrage local
      let filtered = MOCK_SLOTS.filter((s) => s.date === date);
      if (subServiceId) {
        filtered = filtered.filter((s) => s.subServiceId === subServiceId);
      }
      if (agentId) {
        filtered = filtered.filter((s) => s.agentId === agentId);
      }
      
      set({ slots: filtered, isLoading: false });
      
    } catch (err) {
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : 'Erreur de chargement des créneaux',
      });
    }
  },

  fetchSlotById: async (slotId) => {
    set({ isLoading: true, error: null });
    
    try {
      // SIMULATION DÉLAI RÉSEAU
      await new Promise((resolve) => setTimeout(resolve, 600));
      
      // VRAIE IMPLÉMENTATION:
      // const { data } = await api.get(`/agenda-slots/${slotId}`);
      // set({ selectedSlot: data.data, isLoading: false });
      
      // MOCK: Recherche local
      const selectedSlot = MOCK_SLOTS.find((s) => s.id === slotId);
      
      return selectedSlot;
      
    } catch (err) {
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : 'Erreur de chargement du créneau',
      });
    }
  },
  
  /**
   * FETCH RENDEZ-VOUS
   * Backend: GET /api/rendez-vous
   * Query: filtres variés (date, agent, service, statut...)
   * 
   * Pour l'agent connecté: /api/rendez-vous?agentId={currentUserId}
   * Pour l'admin: /api/rendez-vous (tous)
   */
  fetchRendezVous: async (filters) => {
    set({ isLoading: true, error: null });
    
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      
      // VRAIE IMPLÉMENTATION:
      // const { data } = await api.get('/rendez-vous', { params: filters });
      
      // MOCK: Filtrage local
      let filtered = [...MOCK_RENDEZ_VOUS];
      if (filters.date) {
        // Simulation: tous les mocks sont pour aujourd'hui
      }
      if (filters.agentId) {
        filtered = filtered.filter((r) => r.agentId === filters.agentId);
      }
      if (filters.status) {
        filtered = filtered.filter((r) => r.status === filters.status);
      }
      if (filters.type) {
        filtered = filtered.filter((r) => r.type === filters.type);
      }
      
      set({ rendezVous: filtered, isLoading: false });
      
    } catch (err) {
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : 'Erreur de chargement',
      });
    }
  },
  
  /**
   * CREATE RENDEZ-VOUS (standard)
   * Backend: POST /api/rendez-vous
   * Body: { userId, subServiceId, agentId, slotId, motif?, demandeId? }
   * 
   * Vérifie que le slot est disponible (isBooked: false)
   * Génère un ticketId unique (ex: RDV-YYYYMMDD-XXX)
   * Envoie notification à l'étudiant
   */
  createRendezVous: async (data) => {
    set({ isLoading: true, error: null });
    
    try {
      await new Promise((resolve) => setTimeout(resolve, 700));
      
      // VRAIE IMPLÉMENTATION:
      // const { data: response } = await api.post('/rendez-vous', data);
      // return response.data;
      
      // MOCK: Création locale
      const newRdv: RendezVous = {
        id: `rdv-${Date.now()}`,
        demandeId: data.demandeId ?? null,
        demande: null,
        userId: data.userId,
        user: {
          id: data.userId,
          email: 'user@example.com',
          phone: null,
          emailVerified: true,
          phoneVerified: false,
          status: 'VERIFIED' as any,
          mfaEnabled: false,
          lastLoginAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          profile: {
            id: `prof-${data.userId}`,
            userId: data.userId,
            inue: null,
            userType: 'STUDENT' as any,
            firstName: 'User',
            lastName: 'Mock',
            dateOfBirth: null,
            nationality: null,
            address: null,
            city: null,
            country: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          roles: [],
          permissions: [],
        } as Utilisateur,
        agentId: data.agentId,
        agent: MOCK_AGENTS[data.agentId] || MOCK_AGENTS['agent-002-fatima'],
        slotId: data.slotId,
        ticketId: `RDV-${get().selectedDate.replace(/-/g, '')}-${String(get().rendezVous.length + 1).padStart(3, '0')}`,
        type: RDVType.STANDARD,
        status: RDVStatus.PENDING,
        motif: data.motif ?? null,
        isUrgent: false,
        urgenceJustification: null,
        createdBy: useAuthStore.getState().user?.id ?? 'unknown',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        remindedAt: null,
        checkedInAt: null,
        completedAt: null,
      };
      
      set((state) => ({
        rendezVous: [...state.rendezVous, newRdv],
        isLoading: false,
      }));
      
      return newRdv;
      
    } catch (err) {
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : 'Erreur de création',
      });
      throw err;
    }
  },
  
  /**
   * CREATE URGENCE (nouveau besoin ambassade)
   * Backend: POST /api/rendez-vous/urgence
   * Permission requise: rdv:create-urgence (RECEPTIONIST et supérieurs)
   * 
   * Différence avec standard:
   * - Pas de slotId (pas de créneau pré-réservé)
   * - isUrgent: true
   * - ticketId préfixé par URG-
   * - Peut être créé sans demande préalable
   * - Notification immédiate à l'agent concerné
   */
  createUrgence: async (data) => {
    set({ isLoading: true, error: null });
    
    try {
      await new Promise((resolve) => setTimeout(resolve, 600));
      
      // VRAIE IMPLÉMENTATION:
      // const { data: response } = await api.post('/rendez-vous/urgence', data);
      // Vérifie côté backend: hasPermission('rdv:create-urgence')
      
      // MOCK
      const newUrgence: RendezVous = {
        id: `rdv-urg-${Date.now()}`,
        demandeId: data.demandeId ?? null,
        demande: null,
        userId: data.userId,
        user: {
          id: data.userId,
          email: 'user@example.com',
          phone: null,
          emailVerified: true,
          phoneVerified: false,
          status: 'VERIFIED' as any,
          mfaEnabled: false,
          lastLoginAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          profile: {
            id: `prof-${data.userId}`,
            userId: data.userId,
            inue: null,
            userType: 'STUDENT' as any,
            firstName: 'User',
            lastName: 'Mock',
            dateOfBirth: null,
            nationality: null,
            address: null,
            city: null,
            country: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          roles: [],
          permissions: [],
        } as Utilisateur,
        agentId: data.agentId,
        agent: MOCK_AGENTS[data.agentId] || MOCK_AGENTS['agent-002-fatima'],
        slotId: null, // PAS DE CRÉNEAU
        ticketId: `URG-${get().selectedDate.replace(/-/g, '')}-${String(get().rendezVous.filter((r) => r.type === RDVType.URGENCE).length + 1).padStart(3, '0')}`,
        type: RDVType.URGENCE,
        status: RDVStatus.CONFIRMED, // Auto-confirmé
        motif: data.motif,
        isUrgent: true,
        urgenceJustification: data.urgenceJustification,
        createdBy: useAuthStore.getState().user?.id ?? 'unknown',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        remindedAt: null,
        checkedInAt: null,
        completedAt: null,
      };
      
      set((state) => ({
        rendezVous: [...state.rendezVous, newUrgence],
        isLoading: false,
      }));
      
      return newUrgence;
      
    } catch (err) {
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : 'Erreur création urgence',
      });
      throw err;
    }
  },
  
  /**
   * UPDATE STATUS
   * Backend: PATCH /api/rendez-vous/:id/status
   * Body: { status, comment? }
   * 
   * Workflow: PENDING → CONFIRMED → CHECKED_IN → IN_PROGRESS → COMPLETED
   * ou annulations
   */
  updateRendezVousStatus: async (id, status, comment) => {
    set({ isLoading: true, error: null });
    
    try {
      await new Promise((resolve) => setTimeout(resolve, 400));
      
      // VRAIE IMPLÉMENTATION:
      // await api.patch(`/rendez-vous/${id}/status`, { status, comment });
      
      set((state) => ({
        rendezVous: state.rendezVous.map((r) =>
          r.id === id
            ? {
                ...r,
                status,
                updatedAt: new Date().toISOString(),
                ...(status === RDVStatus.CHECKED_IN && { checkedInAt: new Date().toISOString() }),
                ...(status === RDVStatus.COMPLETED && { completedAt: new Date().toISOString() }),
                ...(comment && { motif: comment }), // Stocker le commentaire dans motif pour le mock
              }
            : r
        ),
        isLoading: false,
      }));
      
    } catch (err) {
      set({ isLoading: false, error: err instanceof Error ? err.message : 'Erreur' });
      throw err;
    }
  },
  
  /**
   * CHECK-IN (arrivée de l'étudiant)
   * Backend: POST /api/rendez-vous/:id/check-in
   * Déclenche: mise à jour file d'attente, notification agent
   */
  checkIn: async (rdvId) => {
    await get().updateRendezVousStatus(rdvId, RDVStatus.CHECKED_IN);
  },
  
  /**
   * COMPLETE (fin du rendez-vous)
   * Backend: POST /api/rendez-vous/:id/complete
   * Body: { notes? }
   */
  completeRendezVous: async (rdvId, notes) => {
    await get().updateRendezVousStatus(rdvId, RDVStatus.COMPLETED, notes);
  },
  
  /**
   * CANCEL
   * Backend: POST /api/rendez-vous/:id/cancel
   * Body: { reason, cancelledBy: 'USER' | 'AGENT' }
   */
  cancelRendezVous: async (id, reason) => {
    set({ isLoading: true, error: null });
    
    try {
      await new Promise((resolve) => setTimeout(resolve, 400));
      
      // VRAIE IMPLÉMENTATION:
      // await api.post(`/rendez-vous/${id}/cancel`, { reason, cancelledBy: 'AGENT' });
      
      set((state) => ({
        rendezVous: state.rendezVous.map((r) =>
          r.id === id
            ? {
                ...r,
                status: RDVStatus.CANCELLED_BY_AGENT,
                updatedAt: new Date().toISOString(),
                ...(reason && { motif: reason }), // Stocker la raison dans motif pour le mock
              }
            : r
        ),
        isLoading: false,
      }));
      
    } catch (err) {
      set({ isLoading: false, error: err instanceof Error ? err.message : 'Erreur' });
      throw err;
    }
  },
  
  /**
   * PRINT DAILY SCHEDULE (nouveau besoin ambassade)
   * Backend: POST /api/rendez-vous/print-daily
   * Permission requise: rdv:print-daily
   * 
   * Génère un document (PDF ou format thermique) avec:
   * - Liste des rdv du jour par service
   * - Numéros de ticket
   * - Noms et INUE des étudiants
   * - Agents assignés
   * - Flags urgence
   * 
   * Le document est destiné au gardien de l'ambassade
   * pour contrôle des accès
   */
  printDailySchedule: async (params) => {
    set({ isLoading: true, error: null });
    
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      // VRAIE IMPLÉMENTATION:
      // const { data } = await api.post('/rendez-vous/print-daily', params);
      // Le backend génère le PDF et retourne l'URL de téléchargement
      // ou les données pour impression thermique
      
      // MOCK: Génération du contenu
      const rdvDuJour = get().rendezVous.filter(
        (r) => r.createdAt.startsWith(params.date) || true // Simplifié
      );
      
      const content: DailyScheduleContent = {
        date: params.date,
        generatedAt: new Date().toISOString(),
        totalAppointments: rdvDuJour.length,
        byService: [
          {
            subServiceId: 'sub-011',
            subServiceName: 'Renouvellement Carte Consulaire',
            appointments: rdvDuJour
              .filter((r) => r.motif?.toLowerCase().includes('carte'))
              .map((r) => ({
                time: r.createdAt.split('T')[1].substring(0, 5),
                ticketId: r.ticketId,
                studentName: `${r.user.profile?.firstName} ${r.user.profile?.lastName}`,
                studentInue: r.user.profile?.inue ?? 'N/A',
                motif: r.motif ?? 'Non spécifié',
                status: r.status,
                agentName: r.agent?.user?.profile ? `${r.agent.user.profile.firstName} ${r.agent.user.profile.lastName}` : 'Agent assigné',
                isUrgent: r.isUrgent,
              })),
          },
          {
            subServiceId: 'sub-006',
            subServiceName: 'Demande de Passeport',
            appointments: rdvDuJour
              .filter((r) => r.motif?.toLowerCase().includes('passeport'))
              .map((r) => ({
                time: r.createdAt.split('T')[1].substring(0, 5),
                ticketId: r.ticketId,
                studentName: `${r.user.profile?.firstName} ${r.user.profile?.lastName}`,
                studentInue: r.user.profile?.inue ?? 'N/A',
                motif: r.motif ?? 'Non spécifié',
                status: r.status,
                agentName: r.agent?.user?.profile ? `${r.agent.user.profile.firstName} ${r.agent.user.profile.lastName}` : 'Agent assigné',
                isUrgent: r.isUrgent,
              })),
          },
        ],
      };
      
      const newPrint: DailySchedulePrint = {
        id: `print-${Date.now()}`,
        date: params.date,
        agentId: params.agentId ?? null,
        agent: null,
        subServiceId: params.subServiceId ?? null,
        subService: null,
        printedBy: useAuthStore.getState().user?.id ?? 'unknown',
        printedByAgent: MOCK_AGENTS['agent-002-fatima'],
        printedAt: new Date().toISOString(),
        format: params.format,
        content,
        status: PrintStatus.GENERATED,
      };
      
      set((state) => ({
        printHistory: [newPrint, ...state.printHistory],
        lastPrint: newPrint,
        isLoading: false,
      }));
      
      // Simulation: ouverture dans nouvelle fenêtre pour impression
      if (params.format === PrintFormat.PDF) {
        console.log('[MOCK] Ouverture PDF pour impression:', newPrint);
        // window.open(`/api/rendez-vous/print/${newPrint.id}/download`, '_blank');
      }
      
      return newPrint;
      
    } catch (err) {
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : 'Erreur impression',
      });
      throw err;
    }
  },
  
  /**
   * FETCH PRINT HISTORY
   * Backend: GET /api/rendez-vous/print-history?date=YYYY-MM-DD
   */
  fetchPrintHistory: async (date) => {
    set({ isLoading: true, error: null });
    
    try {
      await new Promise((resolve) => setTimeout(resolve, 400));
      
      // VRAIE IMPLÉMENTATION:
      // const { data } = await api.get('/rendez-vous/print-history', { params: { date } });
      
      set({
        printHistory: MOCK_PRINT_HISTORY.filter((p) => p.date === date),
        isLoading: false,
      });
      
    } catch (err) {
      set({ isLoading: false, error: err instanceof Error ? err.message : 'Erreur' });
    }
  },
  
  /**
   * REPRINT
   * Backend: POST /api/rendez-vous/print/:id/reprint
   * Génère une nouvelle copie du même planning
   */
  reprint: async (printId) => {
    set({ isLoading: true, error: null });
    
    try {
      await new Promise((resolve) => setTimeout(resolve, 600));
      
      const original = get().printHistory.find((p) => p.id === printId);
      if (!original) throw new Error('Document introuvable');
      
      const reprint: DailySchedulePrint = {
        ...original,
        id: `print-${Date.now()}`,
        printedAt: new Date().toISOString(),
        status: PrintStatus.REPRINTED,
      };
      
      set((state) => ({
        printHistory: [reprint, ...state.printHistory],
        lastPrint: reprint,
        isLoading: false,
      }));
      
      return reprint;
      
    } catch (err) {
      set({ isLoading: false, error: err instanceof Error ? err.message : 'Erreur' });
      throw err;
    }
  },
  
  // UI Actions
  setSelectedDate: (date) => set({ selectedDate: date }),
  setSelectedAgent: (agentId) => set({ selectedAgentId: agentId }),
  setSelectedSubService: (subServiceId) => set({ selectedSubServiceId: subServiceId }),
}));