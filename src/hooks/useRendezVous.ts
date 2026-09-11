// ============================================================
// src/hooks/useRendezVous.ts
// ============================================================

import { useCallback, useMemo } from 'react';
import { useRendezVousStore } from '../store/rendezVousStore';
import {
  RendezVous,
  AgendaSlot,
  DailySchedulePrint,
  RDVType,
  RDVStatus,
  PrintFormat,
  PrintStatus,
  DailyScheduleContent,
} from '../types/rendez-vous';

// ============================================================
// INTERFACE DU HOOK
// ============================================================

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

interface UseRendezVousReturn {
  // ── État ──
  slots: AgendaSlot[];
  rendezVous: RendezVous[];
  selectedDate: string;
  selectedAgentId: string | null;
  selectedSubServiceId: string | null;
  printHistory: DailySchedulePrint[];
  lastPrint: DailySchedulePrint | null;
  isLoading: boolean;
  error: string | null;

  // ── Computed ──
  rendezVousDuJour: RendezVous[];
  rendezVousConfirmes: RendezVous[];
  rendezVousEnCours: RendezVous[];
  rendezVousTermines: RendezVous[];
  rendezVousUrgents: RendezVous[];
  rendezVousParAgent: (agentId: string) => RendezVous[];
  rendezVousParService: (subServiceId: string) => RendezVous[];
  rendezVousParStatut: (status: RDVStatus) => RendezVous[];
  slotsDisponibles: AgendaSlot[];
  slotsOccupes: AgendaSlot[];
  slotsBloques: AgendaSlot[];
  statsJour: {
    total: number;
    confirmes: number;
    enCours: number;
    termines: number;
    urgents: number;
    absents: number;
    annules: number;
  };
  selectedRdv: RendezVous | null;
  canCreateUrgence: boolean;
  canPrintSchedule: boolean;

  // ── CRUD Standard ──
  fetchSlots: (date: string, subServiceId?: string, agentId?: string) => Promise<void>;
  fetchRendezVous: (filters?: RdvFilters) => Promise<void>;
  createRendezVous: (data: CreateRdvPayload) => Promise<RendezVous>;
  updateRendezVousStatus: (id: string, status: RDVStatus, comment?: string) => Promise<void>;
  cancelRendezVous: (id: string, reason: string) => Promise<void>;

  // ── Workflow simplifié ──
  confirmerRdv: (id: string) => Promise<void>;
  marquerArrive: (id: string) => Promise<void>;
  demarrerTraitement: (id: string) => Promise<void>;
  terminerRdv: (id: string, notes?: string) => Promise<void>;
  marquerAbsent: (id: string) => Promise<void>;
  annulerParAgent: (id: string, reason: string) => Promise<void>;

  // ── Urgence ──
  createUrgence: (data: CreateUrgencePayload) => Promise<RendezVous>;

  // ── Impression (besoin ambassade) ──
  printDailySchedule: (params: PrintScheduleParams) => Promise<DailySchedulePrint>;
  fetchPrintHistory: (date: string) => Promise<void>;
  reprint: (printId: string) => Promise<DailySchedulePrint>;
  printToday: (format?: PrintFormat) => Promise<DailySchedulePrint>;

  // ── UI ──
  setSelectedDate: (date: string) => void;
  setSelectedAgent: (agentId: string | null) => void;
  setSelectedSubService: (subServiceId: string | null) => void;
  selectRdv: (rdv: RendezVous | null) => void;
  clearSelection: () => void;
  refreshJour: () => Promise<void>;

  // ── Helpers ──
  getRdvById: (id: string) => RendezVous | undefined;
  getRdvByTicket: (ticketId: string) => RendezVous | undefined;
  getNextRdv: () => RendezVous | null;
  getQueuePosition: (rdvId: string) => number;
  isSlotAvailable: (slotId: string) => boolean;
}

// ============================================================
// IMPLEMENTATION
// ============================================================

export const useRendezVous = (): UseRendezVousReturn => {
  const store = useRendezVousStore();

  // ── Destructuring ──
  const {
    slots,
    rendezVous,
    selectedDate,
    selectedAgentId,
    selectedSubServiceId,
    printHistory,
    lastPrint,
    isLoading,
    error,
    fetchSlots: storeFetchSlots,
    fetchRendezVous: storeFetchRendezVous,
    createRendezVous: storeCreateRendezVous,
    updateRendezVousStatus: storeUpdateRendezVousStatus,
    cancelRendezVous: storeCancelRendezVous,
    createUrgence: storeCreateUrgence,
    printDailySchedule: storePrintDailySchedule,
    fetchPrintHistory: storeFetchPrintHistory,
    reprint: storeReprint,
    setSelectedDate: storeSetSelectedDate,
    setSelectedAgent: storeSetSelectedAgent,
    setSelectedSubService: storeSetSelectedSubService,
    checkIn: storeCheckIn,
    completeRendezVous: storeCompleteRendezVous,
  } = store;

  // ═══════════════════════════════════════════════════════════
  // COMPUTED
  // ═══════════════════════════════════════════════════════════

  const rendezVousDuJour = useMemo(() => {
    return rendezVous.filter((r) => {
      const rdvDate = r.createdAt.split('T')[0];
      return rdvDate === selectedDate;
    });
  }, [rendezVous, selectedDate]);

  const rendezVousConfirmes = useMemo(
    () => rendezVous.filter((r) => r.status === RDVStatus.CONFIRMED),
    [rendezVous]
  );

  const rendezVousEnCours = useMemo(
    () => rendezVous.filter((r) => [RDVStatus.CHECKED_IN, RDVStatus.IN_PROGRESS].includes(r.status)),
    [rendezVous]
  );

  const rendezVousTermines = useMemo(
    () => rendezVous.filter((r) => r.status === RDVStatus.COMPLETED),
    [rendezVous]
  );

  const rendezVousUrgents = useMemo(
    () => rendezVous.filter((r) => r.type === RDVType.URGENCE && r.status !== RDVStatus.COMPLETED),
    [rendezVous]
  );

  const slotsDisponibles = useMemo(
    () => slots.filter((s) => !s.isBooked && !s.isBlocked),
    [slots]
  );

  const slotsOccupes = useMemo(
    () => slots.filter((s) => s.isBooked),
    [slots]
  );

  const slotsBloques = useMemo(
    () => slots.filter((s) => s.isBlocked),
    [slots]
  );

  const statsJour = useMemo(() => {
    const duJour = rendezVousDuJour;
    return {
      total: duJour.length,
      confirmes: duJour.filter((r) => r.status === RDVStatus.CONFIRMED).length,
      enCours: duJour.filter((r) => [RDVStatus.CHECKED_IN, RDVStatus.IN_PROGRESS].includes(r.status)).length,
      termines: duJour.filter((r) => r.status === RDVStatus.COMPLETED).length,
      urgents: duJour.filter((r) => r.type === RDVType.URGENCE).length,
      absents: duJour.filter((r) => [RDVStatus.MISSED, RDVStatus.NO_SHOW].includes(r.status)).length,
      annules: duJour.filter((r) => [RDVStatus.CANCELLED_BY_USER, RDVStatus.CANCELLED_BY_AGENT].includes(r.status)).length,
    };
  }, [rendezVousDuJour]);

  const canCreateUrgence = useMemo(() => {
    // TODO: Vérifier permission via useAuth
    // return hasPermission(PermissionCode.RDV_CREATE_URGENCE);
    return true; // Mock
  }, []);

  const canPrintSchedule = useMemo(() => {
    // TODO: Vérifier permission via useAuth
    // return hasPermission(PermissionCode.RDV_PRINT_DAILY);
    return true; // Mock
  }, []);

  // ═══════════════════════════════════════════════════════════
  // HELPERS
  // ═══════════════════════════════════════════════════════════

  const rendezVousParAgent = useCallback(
    (agentId: string) => rendezVous.filter((r) => r.agentId === agentId),
    [rendezVous]
  );

  const rendezVousParService = useCallback(
    (subServiceId: string) => rendezVous.filter((r) => {
      const slot = slots.find((s) => s.id === r.slotId);
      return slot?.subServiceId === subServiceId;
    }),
    [rendezVous, slots]
  );

  const rendezVousParStatut = useCallback(
    (status: RDVStatus) => rendezVous.filter((r) => r.status === status),
    [rendezVous]
  );

  const getRdvById = useCallback(
    (id: string) => rendezVous.find((r) => r.id === id),
    [rendezVous]
  );

  const getRdvByTicket = useCallback(
    (ticketId: string) => rendezVous.find((r) => r.ticketId === ticketId),
    [rendezVous]
  );

  const getNextRdv = useCallback(() => {
    // Prochain rdv confirmé ou en attente
    const pending = rendezVous
      .filter((r) => [RDVStatus.CONFIRMED, RDVStatus.PENDING].includes(r.status))
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    return pending[0] ?? null;
  }, [rendezVous]);

  const getQueuePosition = useCallback(
    (rdvId: string) => {
      const rdv = getRdvById(rdvId);
      if (!rdv) return -1;
      const queue = rendezVous
        .filter((r) => [RDVStatus.CONFIRMED, RDVStatus.CHECKED_IN].includes(r.status))
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      return queue.findIndex((r) => r.id === rdvId) + 1;
    },
    [rendezVous, getRdvById]
  );

  const isSlotAvailable = useCallback(
    (slotId: string) => {
      const slot = slots.find((s) => s.id === slotId);
      return !!slot && !slot.isBooked && !slot.isBlocked;
    },
    [slots]
  );

  // ═══════════════════════════════════════════════════════════
  // CRUD WRAPPERS
  // ═══════════════════════════════════════════════════════════

  const fetchSlots = useCallback(
    async (date: string, subServiceId?: string, agentId?: string) => {
      await storeFetchSlots(date, subServiceId, agentId);
    },
    [storeFetchSlots]
  );

  const fetchRendezVous = useCallback(
    async (filters?: RdvFilters) => {
      await storeFetchRendezVous(filters || {});
    },
    [storeFetchRendezVous]
  );

  const createRendezVous = useCallback(
    async (data: CreateRdvPayload) => {
      const rdv = await storeCreateRendezVous(data);
      console.log('[useRendezVous] RDV créé:', rdv.ticketId);
      return rdv;
    },
    [storeCreateRendezVous]
  );

  const updateRendezVousStatus = useCallback(
    async (id: string, status: RDVStatus, comment?: string) => {
      await storeUpdateRendezVousStatus(id, status, comment);
      console.log('[useRendezVous] Statut mis à jour:', id, '→', status);
    },
    [storeUpdateRendezVousStatus]
  );

  const cancelRendezVous = useCallback(
    async (id: string, reason: string) => {
      await storeCancelRendezVous(id, reason);
      console.log('[useRendezVous] RDV annulé:', id);
    },
    [storeCancelRendezVous]
  );

  // ═══════════════════════════════════════════════════════════
  // WORKFLOW SIMPLIFIÉ
  // ═══════════════════════════════════════════════════════════

  const confirmerRdv = useCallback(
    async (id: string) => {
      await updateRendezVousStatus(id, RDVStatus.CONFIRMED, 'Rendez-vous confirmé');
    },
    [updateRendezVousStatus]
  );

  const marquerArrive = useCallback(
    async (id: string) => {
      await storeCheckIn(id);
      console.log('[useRendezVous] Check-in:', id);
    },
    [storeCheckIn]
  );

  const demarrerTraitement = useCallback(
    async (id: string) => {
      await updateRendezVousStatus(id, RDVStatus.IN_PROGRESS, 'Traitement démarré');
    },
    [updateRendezVousStatus]
  );

  const terminerRdv = useCallback(
    async (id: string, notes?: string) => {
      await storeCompleteRendezVous(id, notes);
      console.log('[useRendezVous] RDV terminé:', id);
    },
    [storeCompleteRendezVous]
  );

  const marquerAbsent = useCallback(
    async (id: string) => {
      await updateRendezVousStatus(id, RDVStatus.NO_SHOW, 'Étudiant non présent');
    },
    [updateRendezVousStatus]
  );

  const annulerParAgent = useCallback(
    async (id: string, reason: string) => {
      await cancelRendezVous(id, reason);
    },
    [cancelRendezVous]
  );

  // ═══════════════════════════════════════════════════════════
  // URGENCE WRAPPER
  // ═══════════════════════════════════════════════════════════

  const createUrgence = useCallback(
    async (data: CreateUrgencePayload) => {
      const urgence = await storeCreateUrgence(data);
      console.log('[useRendezVous] Urgence créée:', urgence.ticketId);
      return urgence;
    },
    [storeCreateUrgence]
  );

  // ═══════════════════════════════════════════════════════════
  // IMPRESSION WRAPPERS (besoin ambassade)
  // ═══════════════════════════════════════════════════════════

  const printDailySchedule = useCallback(
    async (params: PrintScheduleParams) => {
      const print = await storePrintDailySchedule(params);
      console.log('[useRendezVous] Planning imprimé:', print.id, print.format);
      return print;
    },
    [storePrintDailySchedule]
  );

  const fetchPrintHistory = useCallback(
    async (date: string) => {
      await storeFetchPrintHistory(date);
    },
    [storeFetchPrintHistory]
  );

  const reprint = useCallback(
    async (printId: string) => {
      const print = await storeReprint(printId);
      console.log('[useRendezVous] Réimpression:', print.id);
      return print;
    },
    [storeReprint]
  );

  const printToday = useCallback(
    async (format: PrintFormat = PrintFormat.PDF) => {
      const today = new Date().toISOString().split('T')[0];
      return await printDailySchedule({
        date: today,
        format,
      });
    },
    [printDailySchedule]
  );

  // ═══════════════════════════════════════════════════════════
  // UI WRAPPERS
  // ═══════════════════════════════════════════════════════════

  const selectRdv = useCallback(
    (rdv: RendezVous | null) => {
      // Stockage local dans le hook (pas dans le store pour garder le store léger)
      // Ou utiliser un state local si besoin
      console.log('[useRendezVous] RDV sélectionné:', rdv?.ticketId);
    },
    []
  );

  const clearSelection = useCallback(() => {
    storeSetSelectedAgent(null);
    storeSetSelectedSubService(null);
  }, [storeSetSelectedAgent, storeSetSelectedSubService]);

  const refreshJour = useCallback(async () => {
    await fetchSlots(selectedDate, selectedSubServiceId || undefined, selectedAgentId || undefined);
    await fetchRendezVous({ date: selectedDate });
  }, [selectedDate, selectedSubServiceId, selectedAgentId, fetchSlots, fetchRendezVous]);

  // ═══════════════════════════════════════════════════════════
  // RETOUR
  // ═══════════════════════════════════════════════════════════

  return {
    // État
    slots,
    rendezVous,
    selectedDate,
    selectedAgentId,
    selectedSubServiceId,
    printHistory,
    lastPrint,
    isLoading,
    error,

    // Computed
    rendezVousDuJour,
    rendezVousConfirmes,
    rendezVousEnCours,
    rendezVousTermines,
    rendezVousUrgents,
    rendezVousParAgent,
    rendezVousParService,
    rendezVousParStatut,
    slotsDisponibles,
    slotsOccupes,
    slotsBloques,
    statsJour,
    selectedRdv: null, // Géré localement ou via store si besoin
    canCreateUrgence,
    canPrintSchedule,

    // CRUD
    fetchSlots,
    fetchRendezVous,
    createRendezVous,
    updateRendezVousStatus,
    cancelRendezVous,

    // Workflow
    confirmerRdv,
    marquerArrive,
    demarrerTraitement,
    terminerRdv,
    marquerAbsent,
    annulerParAgent,

    // Urgence
    createUrgence,

    // Impression
    printDailySchedule,
    fetchPrintHistory,
    reprint,
    printToday,

    // UI
    setSelectedDate: storeSetSelectedDate,
    setSelectedAgent: storeSetSelectedAgent,
    setSelectedSubService: storeSetSelectedSubService,
    selectRdv,
    clearSelection,
    refreshJour,

    // Helpers
    getRdvById,
    getRdvByTicket,
    getNextRdv,
    getQueuePosition,
    isSlotAvailable,
  };
};