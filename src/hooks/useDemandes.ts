// ============================================================
// src/hooks/useDemandes.ts
// ============================================================

import { useCallback, useEffect, useMemo } from 'react';
import { useDemandeStore } from '../store/demandeStore';
import {
  Demande,
  DemandeFilters,
  DemandeHistory,
  DemandeComment,
  DemandeRequirement,
  TraitementPayload,
  AssignationPayload,
  AppStatus,
  Priority,
  RequirementStatus,
} from '../types/demande';

// ============================================================
// INTERFACE DU HOOK
// ============================================================

interface UseDemandesReturn {
  // État
  demandes: Demande[];
  selectedDemande: Demande | null;
  histories: DemandeHistory[];
  comments: DemandeComment[];
  requirements: DemandeRequirement[];
  filters: DemandeFilters;
  stats: {
    total: number;
    byStatus: Record<AppStatus, number>;
    overdue: number;
    urgent: number;
  };
  isLoading: boolean;
  error: string | null;

  // Computed
  demandesFiltered: Demande[];
  demandesOverdue: Demande[];
  demandesUrgent: Demande[];
  demandesByStatus: (status: AppStatus) => Demande[];
  demandesUnassigned: Demande[];
  demandesAssignedToMe: (agentId: string) => Demande[];
  selectedDemandeProgress: number; // % des requirements validés
  selectedDemandeIsOverdue: boolean;
  selectedDemandeCanEdit: boolean;
  selectedDemandeCanValidate: boolean;
  selectedDemandeCanAssign: boolean;

  // Actions CRUD
  fetchDemandes: (filters?: DemandeFilters) => Promise<void>;
  fetchDemandeById: (id: string) => Promise<Demande | null>;
  createDemande: (data: Partial<Demande>) => Promise<Demande>;
  updateStatus: (id: string, payload: TraitementPayload) => Promise<void>;
  assignAgent: (id: string, payload: AssignationPayload) => Promise<void>;

  // Workflow
  approveDemande: (id: string, comment?: string) => Promise<void>;
  rejectDemande: (id: string, motif: string, isVisibleToUser?: boolean) => Promise<void>;
  requestAdditionalInfo: (id: string, comment: string) => Promise<void>;
  completeDemande: (id: string, comment?: string) => Promise<void>;
  escalateDemande: (id: string, reason: string) => Promise<void>;

  // Commentaires
  addComment: (demandeId: string, content: string, isInternal: boolean) => Promise<void>;
  addPublicComment: (demandeId: string, content: string) => Promise<void>;
  addInternalNote: (demandeId: string, content: string) => Promise<void>;

  // Exigences
  fetchHistory: (demandeId: string) => Promise<void>;
  fetchComments: (demandeId: string) => Promise<void>;
  fetchRequirements: (demandeId: string) => Promise<void>;
  validateRequirement: (requirementId: string, status: RequirementStatus, note?: string) => Promise<void>;
  acceptRequirement: (requirementId: string, note?: string) => Promise<void>;
  rejectRequirement: (requirementId: string, note: string) => Promise<void>;

  // Filtres
  setFilters: (filters: DemandeFilters) => void;
  resetFilters: () => void;
  filterByStatus: (status: AppStatus | undefined) => void;
  filterByPriority: (priority: Priority | undefined) => void;
  filterBySearch: (search: string) => void;
  filterByAssignedAgent: (agentId: string | undefined) => void;
  filterOverdue: () => void;
  filterUrgent: () => void;

  // Sélection
  setSelectedDemande: (demande: Demande | null) => void;
  clearSelectedDemande: () => void;
  refreshSelectedDemande: () => Promise<void>;

  // Stats
  getStats: () => void;
  getCountByStatus: (status: AppStatus) => number;
  getOverdueCount: () => number;
  getUrgentCount: () => number;
  getAverageProcessingTime: () => number; // en heures
}

// ============================================================
// IMPLEMENTATION
// ============================================================

export const useDemandes = (): UseDemandesReturn => {
  const store = useDemandeStore();

  // ============================================================
  // DESTRUCTURING STORE
  // ============================================================

  const {
    demandes,
    selectedDemande,
    histories,
    comments,
    requirements,
    filters,
    stats,
    isLoading,
    error,
    fetchDemandes: storeFetchDemandes,
    fetchDemandeById: storeFetchDemandeById,
    createDemande: storeCreateDemande,
    updateStatus: storeUpdateStatus,
    assignAgent: storeAssignAgent,
    addComment: storeAddComment,
    fetchHistory: storeFetchHistory,
    fetchComments: storeFetchComments,
    fetchRequirements: storeFetchRequirements,
    validateRequirement: storeValidateRequirement,
    setFilters: storeSetFilters,
    setSelectedDemande: storeSetSelectedDemande,
    getStats: storeGetStats,
  } = store;

  // ============================================================
  // COMPUTED (mémoïsés)
  // ============================================================

  const demandesFiltered = useMemo(() => {
    return demandes;
  }, [demandes]);

  const demandesOverdue = useMemo(() => {
    const now = new Date().toISOString();
    return demandes.filter(
      (d) => d.deadlineAt && d.deadlineAt < now && d.status !== AppStatus.COMPLETED
    );
  }, [demandes]);

  const demandesUrgent = useMemo(() => {
    return demandes.filter(
      (d) => d.priority === Priority.URGENT && d.status !== AppStatus.COMPLETED
    );
  }, [demandes]);

  const demandesUnassigned = useMemo(() => {
    return demandes.filter(
      (d) => !d.assignedAgentId && d.status !== AppStatus.COMPLETED && d.status !== AppStatus.CANCELLED
    );
  }, [demandes]);

  const selectedDemandeProgress = useMemo(() => {
    if (!requirements.length) return 0;
    const accepted = requirements.filter((r) => r.status === RequirementStatus.ACCEPTED).length;
    return Math.round((accepted / requirements.length) * 100);
  }, [requirements]);

  const selectedDemandeIsOverdue = useMemo(() => {
    if (!selectedDemande?.deadlineAt) return false;
    const now = new Date().toISOString();
    return selectedDemande.deadlineAt < now && selectedDemande.status !== AppStatus.COMPLETED;
  }, [selectedDemande]);

  const selectedDemandeCanEdit = useMemo(() => {
    if (!selectedDemande) return false;
    return [
      AppStatus.SUBMITTED,
      AppStatus.IN_REVIEW,
      AppStatus.ADDITIONAL_INFO_REQUIRED,
    ].includes(selectedDemande.status);
  }, [selectedDemande]);

  const selectedDemandeCanValidate = useMemo(() => {
    if (!selectedDemande) return false;
    return [AppStatus.IN_REVIEW, AppStatus.UNDER_VERIFICATION].includes(selectedDemande.status);
  }, [selectedDemande]);

  const selectedDemandeCanAssign = useMemo(() => {
    if (!selectedDemande) return false;
    return !selectedDemande.assignedAgentId && selectedDemande.status === AppStatus.SUBMITTED;
  }, [selectedDemande]);

  // ============================================================
  // HELPERS
  // ============================================================

  const demandesByStatus = useCallback(
    (status: AppStatus) => demandes.filter((d) => d.status === status),
    [demandes]
  );

  const demandesAssignedToMe = useCallback(
    (agentId: string) => demandes.filter((d) => d.assignedAgentId === agentId),
    [demandes]
  );

  // ============================================================
  // ACTIONS WRAPPERS (avec logging, notifications, etc.)
  // ============================================================

  const fetchDemandes = useCallback(
    async (filters?: DemandeFilters) => {
      await storeFetchDemandes(filters);
    },
    [storeFetchDemandes]
  );

  const fetchDemandeById = useCallback(
    async (id: string) => {
      return await storeFetchDemandeById(id);
    },
    [storeFetchDemandeById]
  );

  const createDemande = useCallback(
    async (data: Partial<Demande>) => {
      const demande = await storeCreateDemande(data);
      // TODO: Notification toast succès
      console.log('[useDemandes] Demande créée:', demande.dossierNumber);
      return demande;
    },
    [storeCreateDemande]
  );

  const updateStatus = useCallback(
    async (id: string, payload: TraitementPayload) => {
      await storeUpdateStatus(id, payload);
      // TODO: Notification toast
      console.log('[useDemandes] Statut mis à jour:', id, '→', payload.status);
    },
    [storeUpdateStatus]
  );

  const assignAgent = useCallback(
    async (id: string, payload: AssignationPayload) => {
      await storeAssignAgent(id, payload);
      console.log('[useDemandes] Agent assigné:', payload.agentId);
    },
    [storeAssignAgent]
  );

  // ============================================================
  // WORKFLOW SIMPLIFIÉ (wrappers métier)
  // ============================================================

  const approveDemande = useCallback(
    async (id: string, comment?: string) => {
      await updateStatus(id, {
        status: AppStatus.APPROVED,
        comment: comment || 'Demande approuvée',
        isVisibleToUser: true,
      });
    },
    [updateStatus]
  );

  const rejectDemande = useCallback(
    async (id: string, motif: string, isVisibleToUser = true) => {
      await updateStatus(id, {
        status: AppStatus.REJECTED,
        comment: motif,
        isVisibleToUser,
      });
    },
    [updateStatus]
  );

  const requestAdditionalInfo = useCallback(
    async (id: string, comment: string) => {
      await updateStatus(id, {
        status: AppStatus.ADDITIONAL_INFO_REQUIRED,
        comment,
        isVisibleToUser: true,
      });
    },
    [updateStatus]
  );

  const completeDemande = useCallback(
    async (id: string, comment?: string) => {
      await updateStatus(id, {
        status: AppStatus.COMPLETED,
        comment: comment || 'Demande traitée et clôturée',
        isVisibleToUser: true,
      });
    },
    [updateStatus]
  );

  const escalateDemande = useCallback(
    async (id: string, reason: string) => {
      // Met à jour la priorité via le store (si dispo) ou logique locale
      await updateStatus(id, {
        status: AppStatus.IN_REVIEW,
        comment: `ESCALADE: ${reason}`,
        isVisibleToUser: false,
      });
      console.log('[useDemandes] Demande escaladée:', id, reason);
    },
    [updateStatus]
  );

  // ============================================================
  // COMMENTAIRES WRAPPERS
  // ============================================================

  const addPublicComment = useCallback(
    async (demandeId: string, content: string) => {
      await storeAddComment(demandeId, content, false);
    },
    [storeAddComment]
  );

  const addInternalNote = useCallback(
    async (demandeId: string, content: string) => {
      await storeAddComment(demandeId, content, true);
    },
    [storeAddComment]
  );

  // ============================================================
  // EXIGENCES WRAPPERS
  // ============================================================

  const acceptRequirement = useCallback(
    async (requirementId: string, note?: string) => {
      await storeValidateRequirement(requirementId, RequirementStatus.ACCEPTED, note);
    },
    [storeValidateRequirement]
  );

  const rejectRequirement = useCallback(
    async (requirementId: string, note: string) => {
      await storeValidateRequirement(requirementId, RequirementStatus.REJECTED, note);
    },
    [storeValidateRequirement]
  );

  // ============================================================
  // FILTRES WRAPPERS
  // ============================================================

  const resetFilters = useCallback(() => {
    storeSetFilters({});
    storeFetchDemandes({});
  }, [storeSetFilters, storeFetchDemandes]);

  const filterByStatus = useCallback(
    (status: AppStatus | undefined) => {
      storeSetFilters({ status });
      storeFetchDemandes({ status });
    },
    [storeSetFilters, storeFetchDemandes]
  );

  const filterByPriority = useCallback(
    (priority: Priority | undefined) => {
      storeSetFilters({ priority });
      storeFetchDemandes({ priority });
    },
    [storeSetFilters, storeFetchDemandes]
  );

  const filterBySearch = useCallback(
    (search: string) => {
      storeSetFilters({ search });
      storeFetchDemandes({ search });
    },
    [storeSetFilters, storeFetchDemandes]
  );

  const filterByAssignedAgent = useCallback(
    (agentId: string | undefined) => {
      storeSetFilters({ assignedAgentId: agentId });
      storeFetchDemandes({ assignedAgentId: agentId });
    },
    [storeSetFilters, storeFetchDemandes]
  );

  const filterOverdue = useCallback(() => {
    storeSetFilters({ isOverdue: true });
    storeFetchDemandes({ isOverdue: true });
  }, [storeSetFilters, storeFetchDemandes]);

  const filterUrgent = useCallback(() => {
    storeSetFilters({ priority: Priority.URGENT });
    storeFetchDemandes({ priority: Priority.URGENT });
  }, [storeSetFilters, storeFetchDemandes]);

  // ============================================================
  // SÉLECTION WRAPPERS
  // ============================================================

  const clearSelectedDemande = useCallback(() => {
    storeSetSelectedDemande(null);
  }, [storeSetSelectedDemande]);

  const refreshSelectedDemande = useCallback(async () => {
    if (!selectedDemande) return;
    await storeFetchDemandeById(selectedDemande.id);
  }, [selectedDemande, storeFetchDemandeById]);

  // ============================================================
  // STATS WRAPPERS
  // ============================================================

  const getCountByStatus = useCallback(
    (status: AppStatus) => stats.byStatus[status] || 0,
    [stats.byStatus]
  );

  const getOverdueCount = useCallback(() => stats.overdue, [stats.overdue]);

  const getUrgentCount = useCallback(() => stats.urgent, [stats.urgent]);

  const getAverageProcessingTime = useCallback(() => {
    const completed = demandes.filter((d) => d.status === AppStatus.COMPLETED && d.submittedAt && d.completedAt);
    if (!completed.length) return 0;
    
    const totalHours = completed.reduce((sum, d) => {
      const submitted = new Date(d.submittedAt!).getTime();
      const done = new Date(d.completedAt!).getTime();
      return sum + (done - submitted) / (1000 * 60 * 60);
    }, 0);
    
    return Math.round(totalHours / completed.length);
  }, [demandes]);

  // ============================================================
  // AUTO-REFRESH (optionnel: polling toutes les 30s si demande ouverte)
  // ============================================================

  useEffect(() => {
    if (!selectedDemande) return;
    
    const interval = setInterval(() => {
      refreshSelectedDemande().catch(() => {
        // Silencieux: la demande peut avoir été supprimée
      });
    }, 300000);

    return () => clearInterval(interval);
  }, [selectedDemande, refreshSelectedDemande]);

  // ============================================================
  // RETOUR
  // ============================================================

  return {
    // État brut
    demandes,
    selectedDemande,
    histories,
    comments,
    requirements,
    filters,
    stats,
    isLoading,
    error,

    // Computed
    demandesFiltered,
    demandesOverdue,
    demandesUrgent,
    demandesByStatus,
    demandesUnassigned,
    demandesAssignedToMe,
    selectedDemandeProgress,
    selectedDemandeIsOverdue,
    selectedDemandeCanEdit,
    selectedDemandeCanValidate,
    selectedDemandeCanAssign,

    // Actions CRUD
    fetchDemandes,
    fetchDemandeById,
    createDemande,
    updateStatus,
    assignAgent,

    // Workflow
    approveDemande,
    rejectDemande,
    requestAdditionalInfo,
    completeDemande,
    escalateDemande,

    // Commentaires
    addComment: storeAddComment,
    addPublicComment,
    addInternalNote,

    // Exigences
    fetchHistory: storeFetchHistory,
    fetchComments: storeFetchComments,
    fetchRequirements: storeFetchRequirements,
    validateRequirement: storeValidateRequirement,
    acceptRequirement,
    rejectRequirement,

    // Filtres
    setFilters: storeSetFilters,
    resetFilters,
    filterByStatus,
    filterByPriority,
    filterBySearch,
    filterByAssignedAgent,
    filterOverdue,
    filterUrgent,

    // Sélection
    setSelectedDemande: storeSetSelectedDemande,
    clearSelectedDemande,
    refreshSelectedDemande,

    // Stats
    getStats: storeGetStats,
    getCountByStatus,
    getOverdueCount,
    getUrgentCount,
    getAverageProcessingTime,
  };
};