// ============================================================
// src/hooks/useServices.ts
// ============================================================

import { useCallback, useMemo } from 'react';
import { useServiceStore } from '../store/serviceStore';
import {
  Service,
  SubService,
  ServiceSchedule,
  ServiceException,
  ServiceExceptionType,
  Requirement,
  RequirementType,
} from '../types/services';

// ============================================================
// INTERFACE DU HOOK
// ============================================================

interface UseServicesReturn {
  // ── État ──
  services: Service[];
  subServices: SubService[];
  exceptions: ServiceException[];
  selectedService: Service | null;
  selectedSubService: SubService | null;
  searchQuery: string;
  activeFilter: 'all' | 'appointment' | 'no-appointment' | 'free' | 'paid';
  isLoading: boolean;
  error: string | null;

  // ── Computed ──
  filteredSubServices: SubService[];
  activeServices: Service[];
  activeSubServices: SubService[];
  servicesWithAppointments: Service[];
  freeServices: SubService[];
  paidServices: SubService[];
  selectedServiceSubServices: SubService[];
  selectedSubServiceSchedules: ServiceSchedule[];
  selectedSubServiceRequirements: Requirement[];
  selectedSubServiceExceptions: ServiceException[];
  selectedSubServiceOpenDays: number[];
  selectedSubServiceIsAvailableToday: boolean;
  selectedSubServiceNextAvailableDate: Date | null;

  // ── Lecture & Sélection ──
  loadServices: () => void;
  fetchServicesFromApi: () => Promise<void>;
  selectService: (serviceId: string | null) => void;
  selectSubService: (subServiceId: string | null) => void;
  clearSelection: () => void;

  // ── Recherche & Filtres ──
  setSearchQuery: (query: string) => void;
  setActiveFilter: (filter: UseServicesReturn['activeFilter']) => void;
  resetFilters: () => void;
  searchServices: (query: string) => SubService[];

  // ── CRUD Sous-services (Admin) ──
  createSubService: (data: Partial<SubService>) => Promise<SubService>;
  updateSubService: (id: string, data: Partial<SubService>) => Promise<SubService>;
  toggleSubServiceActive: (id: string) => void;
  deleteSubService: (id: string) => void;

  // ── Horaires (Admin) ──
  createSchedule: (subServiceId: string, data: Partial<ServiceSchedule>) => Promise<ServiceSchedule>;
  updateSchedule: (id: string, data: Partial<ServiceSchedule>) => Promise<void>;
  deleteSchedule: (id: string) => Promise<void>;
  getSchedulesForDay: (subServiceId: string, dayOfWeek: number) => ServiceSchedule[];
  getOpenDays: (subServiceId: string) => number[];
  isAvailableOnDay: (subServiceId: string, dayOfWeek: number) => boolean;

  // ── Exceptions (Admin) ──
  createException: (data: Partial<ServiceException>) => Promise<ServiceException>;
  deleteException: (id: string) => Promise<void>;
  getExceptionsForDate: (subServiceId: string, date: string) => ServiceException[];
  isExceptionDay: (subServiceId: string, date: string) => boolean;

  // ── Requirements ──
  addRequirement: (subServiceId: string, data: Partial<Requirement>) => Promise<Requirement>;
  updateRequirement: (id: string, data: Partial<Requirement>) => Promise<void>;
  removeRequirement: (id: string) => Promise<void>;
  getRequirementsForSubService: (subServiceId: string) => Requirement[];

  // ── Helpers métier ──
  getSubServiceById: (id: string) => SubService | undefined;
  getSubServiceByCode: (code: string) => SubService | undefined;
  getServiceById: (id: string) => Service | undefined;
  getTarifLabel: (subService: SubService) => string;
  isGratuitEtudiant: (subServiceCode: string) => boolean;
  isDelaiLong: (subServiceCode: string) => boolean;
  getServiceStats: () => { total: number; active: number; withAppointment: number; free: number };

  // ── Disponibilités (pour Rendez-vous) ──
  getCreneauxDisponibles: (subServiceId: string, date: Date) => string[];
  getProchainCreneau: (subServiceId: string, date?: Date) => { date: Date; heure: string } | null;
}

// ============================================================
// HELPERS
// ============================================================

const DAY_NAMES = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

function generateCreneaux(startTime: string, endTime: string, durationMinutes: number): string[] {
  const creneaux: string[] = [];
  const [startH, startM] = startTime.split(':').map(Number);
  const [endH, endM] = endTime.split(':').map(Number);
  
  let current = startH * 60 + startM;
  const end = endH * 60 + endM;
  
  while (current + durationMinutes <= end) {
    const h = Math.floor(current / 60);
    const m = current % 60;
    creneaux.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
    current += durationMinutes;
  }
  
  return creneaux;
}

// ============================================================
// IMPLEMENTATION
// ============================================================

export const useServices = (): UseServicesReturn => {
  const store = useServiceStore();

  // ── Destructuring ──
  const {
    services,
    subServices,
    exceptions,
    selectedService,
    selectedSubService,
    searchQuery,
    activeFilter,
    isLoading,
    error,
    loadServices: storeLoadServices,
    fetchServicesFromApi: storeFetchServicesFromApi,
    selectService: storeSelectService,
    selectSubService: storeSelectSubService,
    setSearchQuery: storeSetSearchQuery,
    setActiveFilter: storeSetActiveFilter,
    createSubService: storeCreateSubService,
    updateSubService: storeUpdateSubService,
    toggleSubServiceActive: storeToggleSubServiceActive,
    createSchedule: storeCreateSchedule,
    updateSchedule: storeUpdateSchedule,
    deleteSchedule: storeDeleteSchedule,
    createException: storeCreateException,
    deleteException: storeDeleteException,
    addRequirement: storeAddRequirement,
    updateRequirement: storeUpdateRequirement,
    removeRequirement: storeRemoveRequirement,
    getSubServiceById: storeGetSubServiceById,
    getSubServiceByCode: storeGetSubServiceByCode,
    getServiceById: storeGetServiceById,
    getSchedulesForDay: storeGetSchedulesForDay,
    isAvailableOnDay: storeIsAvailableOnDay,
    getOpenDays: storeGetOpenDays,
    getTarifLabel: storeGetTarifLabel,
    isGratuitEtudiant: storeIsGratuitEtudiant,
    isDelaiLong: storeIsDelaiLong,
    getRequirementsForSubService: storeGetRequirementsForSubService,
    getFilteredSubServices: storeGetFilteredSubServices,
  } = store;

  // ═══════════════════════════════════════════════════════════
  // COMPUTED
  // ═══════════════════════════════════════════════════════════

  const filteredSubServices = useMemo(() => storeGetFilteredSubServices(), [
    subServices,
    searchQuery,
    activeFilter,
    selectedService,
    storeGetFilteredSubServices,
  ]);

  const activeServices = useMemo(() => services.filter((s) => s.active), [services]);
  
  const activeSubServices = useMemo(() => subServices.filter((s) => s.active), [subServices]);
  
  const servicesWithAppointments = useMemo(
    () => services.filter((s) => s.requiresAppointment),
    [services]
  );
  
  const freeServices = useMemo(
    () => subServices.filter((s) => s.basePrice === 0 || s.basePrice === null),
    [subServices]
  );
  
  const paidServices = useMemo(
    () => subServices.filter((s) => s.basePrice !== null && s.basePrice > 0),
    [subServices]
  );

  const selectedServiceSubServices = useMemo(() => {
    if (!selectedService) return [];
    return subServices.filter((s) => s.serviceId === selectedService.id);
  }, [selectedService, subServices]);

  const selectedSubServiceSchedules = useMemo(() => {
    return selectedSubService?.schedules ?? [];
  }, [selectedSubService]);

  const selectedSubServiceRequirements = useMemo(() => {
    return selectedSubService?.requirements ?? [];
  }, [selectedSubService]);

  const selectedSubServiceExceptions = useMemo(() => {
    if (!selectedSubService) return [];
    return exceptions.filter((e) => e.subServiceId === selectedSubService.id);
  }, [selectedSubService, exceptions]);

  const selectedSubServiceOpenDays = useMemo(() => {
    if (!selectedSubService) return [];
    return storeGetOpenDays(selectedSubService.id);
  }, [selectedSubService, storeGetOpenDays]);

  const selectedSubServiceIsAvailableToday = useMemo(() => {
    if (!selectedSubService) return false;
    const today = new Date().getDay(); // 0=Dimanche, 1=Lundi...
    // Convertir au format 1-7 (Lundi=1)
    const dayOfWeek = today === 0 ? 7 : today;
    return storeIsAvailableOnDay(selectedSubService.id, dayOfWeek);
  }, [selectedSubService, storeIsAvailableOnDay]);

  const selectedSubServiceNextAvailableDate = useMemo(() => {
    if (!selectedSubService) return null;
    const openDays = storeGetOpenDays(selectedSubService.id);
    if (!openDays.length) return null;
    
    const today = new Date();
    for (let i = 0; i < 14; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const dayOfWeek = date.getDay() === 0 ? 7 : date.getDay();
      if (openDays.includes(dayOfWeek)) {
        // Vérifier s'il n'y a pas d'exception ce jour-là
        const dateStr = date.toISOString().split('T')[0];
        const hasException = exceptions.some(
          (e) => e.subServiceId === selectedSubService.id && e.date === dateStr && e.type === ServiceExceptionType.CLOSED
        );
        if (!hasException) return date;
      }
    }
    return null;
  }, [selectedSubService, storeGetOpenDays, exceptions]);

  // ═══════════════════════════════════════════════════════════
  // SÉLECTION WRAPPERS
  // ═══════════════════════════════════════════════════════════

  const clearSelection = useCallback(() => {
    storeSelectService(null);
    storeSelectSubService(null);
  }, [storeSelectService, storeSelectSubService]);

  // ═══════════════════════════════════════════════════════════
  // RECHERCHE & FILTRES WRAPPERS
  // ═══════════════════════════════════════════════════════════

  const resetFilters = useCallback(() => {
    storeSetSearchQuery('');
    storeSetActiveFilter('all');
  }, [storeSetSearchQuery, storeSetActiveFilter]);

  const searchServices = useCallback(
    (query: string) => {
      storeSetSearchQuery(query);
      return storeGetFilteredSubServices();
    },
    [storeSetSearchQuery, storeGetFilteredSubServices]
  );

  // ═══════════════════════════════════════════════════════════
  // CRUD WRAPPERS (avec logging & notifications)
  // ═══════════════════════════════════════════════════════════

  const createSubService = useCallback(
    async (data: Partial<SubService>) => {
      const sub = await storeCreateSubService(data);
      console.log('[useServices] Sous-service créé:', sub.code, sub.name);
      return sub;
    },
    [storeCreateSubService]
  );

  const updateSubService = useCallback(
    async (id: string, data: Partial<SubService>) => {
      const sub = await storeUpdateSubService(id, data);
      console.log('[useServices] Sous-service mis à jour:', id);
      return sub;
    },
    [storeUpdateSubService]
  );

  const deleteSubService = useCallback(
    (id: string) => {
      // Soft delete via toggle active
      storeToggleSubServiceActive(id);
      console.log('[useServices] Sous-service désactivé:', id);
    },
    [storeToggleSubServiceActive]
  );

  // ═══════════════════════════════════════════════════════════
  // HORAIRES WRAPPERS
  // ═══════════════════════════════════════════════════════════

  const createSchedule = useCallback(
    async (subServiceId: string, data: Partial<ServiceSchedule>) => {
      const schedule = await storeCreateSchedule(subServiceId, data);
      console.log('[useServices] Horaire créé:', schedule.dayOfWeek, schedule.startTime, '-', schedule.endTime);
      return schedule;
    },
    [storeCreateSchedule]
  );

  // ═══════════════════════════════════════════════════════════
  // EXCEPTIONS WRAPPERS
  // ═══════════════════════════════════════════════════════════

  const getExceptionsForDate = useCallback(
    (subServiceId: string, date: string) => {
      return exceptions.filter((e) => e.subServiceId === subServiceId && e.date === date);
    },
    [exceptions]
  );

  const isExceptionDay = useCallback(
    (subServiceId: string, date: string) => {
      return exceptions.some(
        (e) => e.subServiceId === subServiceId && e.date === date
      );
    },
    [exceptions]
  );

  // ═══════════════════════════════════════════════════════════
  // REQUIREMENTS WRAPPERS
  // ═══════════════════════════════════════════════════════════

  const addRequirement = useCallback(
    async (subServiceId: string, data: Partial<Requirement>) => {
      const req = await storeAddRequirement(subServiceId, data);
      console.log('[useServices] Prérequis ajouté:', req.label);
      return req;
    },
    [storeAddRequirement]
  );

  // ═══════════════════════════════════════════════════════════
  // HELPERS MÉTIER
  // ═══════════════════════════════════════════════════════════

  const getServiceStats = useCallback(() => {
    return {
      total: subServices.length,
      active: activeSubServices.length,
      withAppointment: servicesWithAppointments.length,
      free: freeServices.length,
    };
  }, [subServices.length, activeSubServices.length, servicesWithAppointments.length, freeServices.length]);

  // ═══════════════════════════════════════════════════════════
  // DISPONIBILITÉS (pour module Rendez-vous)
  // ═══════════════════════════════════════════════════════════

  const getCreneauxDisponibles = useCallback(
    (subServiceId: string, date: Date): string[] => {
      const dayOfWeek = date.getDay() === 0 ? 7 : date.getDay();
      const dateStr = date.toISOString().split('T')[0];
      
      // Vérifier exception
      const exception = exceptions.find(
        (e) => e.subServiceId === subServiceId && e.date === dateStr
      );
      
      if (exception?.type === ServiceExceptionType.CLOSED) return [];
      
      const schedules = storeGetSchedulesForDay(subServiceId, dayOfWeek);
      if (!schedules.length) return [];
      
      // Si exception avec horaires spéciaux
      if (exception?.type === ServiceExceptionType.SPECIAL_HOURS && exception.startTime && exception.endTime) {
        return generateCreneaux(exception.startTime, exception.endTime, 30);
      }
      
      // Horaires normaux
      const allCreneaux: string[] = [];
      for (const sched of schedules) {
        allCreneaux.push(...generateCreneaux(sched.startTime, sched.endTime, sched.slotDurationMinutes));
      }
      
      return [...new Set(allCreneaux)].sort();
    },
    [exceptions, storeGetSchedulesForDay]
  );

  const getProchainCreneau = useCallback(
    (subServiceId: string, date?: Date): { date: Date; heure: string } | null => {
      const startDate = date ? new Date(date) : new Date();
      startDate.setHours(0, 0, 0, 0);
      
      for (let i = 0; i < 30; i++) {
        const checkDate = new Date(startDate);
        checkDate.setDate(startDate.getDate() + i);
        
        const creneaux = getCreneauxDisponibles(subServiceId, checkDate);
        if (creneaux.length > 0) {
          return { date: checkDate, heure: creneaux[0] };
        }
      }
      return null;
    },
    [getCreneauxDisponibles]
  );

  // ═══════════════════════════════════════════════════════════
  // RETOUR
  // ═══════════════════════════════════════════════════════════

  return {
    // État
    services,
    subServices,
    exceptions,
    selectedService,
    selectedSubService,
    searchQuery,
    activeFilter,
    isLoading,
    error,

    // Computed
    filteredSubServices,
    activeServices,
    activeSubServices,
    servicesWithAppointments,
    freeServices,
    paidServices,
    selectedServiceSubServices,
    selectedSubServiceSchedules,
    selectedSubServiceRequirements,
    selectedSubServiceExceptions,
    selectedSubServiceOpenDays,
    selectedSubServiceIsAvailableToday,
    selectedSubServiceNextAvailableDate,

    // Lecture & Sélection
    loadServices: storeLoadServices,
    fetchServicesFromApi: storeFetchServicesFromApi,
    selectService: storeSelectService,
    selectSubService: storeSelectSubService,
    clearSelection,

    // Recherche & Filtres
    setSearchQuery: storeSetSearchQuery,
    setActiveFilter: storeSetActiveFilter,
    resetFilters,
    searchServices,

    // CRUD Sous-services
    createSubService,
    updateSubService,
    toggleSubServiceActive: storeToggleSubServiceActive,
    deleteSubService,

    // Horaires
    createSchedule,
    updateSchedule: storeUpdateSchedule,
    deleteSchedule: storeDeleteSchedule,
    getSchedulesForDay: storeGetSchedulesForDay,
    getOpenDays: storeGetOpenDays,
    isAvailableOnDay: storeIsAvailableOnDay,

    // Exceptions
    createException: storeCreateException,
    deleteException: storeDeleteException,
    getExceptionsForDate,
    isExceptionDay,

    // Requirements
    addRequirement,
    updateRequirement: storeUpdateRequirement,
    removeRequirement: storeRemoveRequirement,
    getRequirementsForSubService: storeGetRequirementsForSubService,

    // Helpers
    getSubServiceById: storeGetSubServiceById,
    getSubServiceByCode: storeGetSubServiceByCode,
    getServiceById: storeGetServiceById,
    getTarifLabel: storeGetTarifLabel,
    isGratuitEtudiant: storeIsGratuitEtudiant,
    isDelaiLong: storeIsDelaiLong,
    getServiceStats,

    // Disponibilités
    getCreneauxDisponibles,
    getProchainCreneau,
  };
};