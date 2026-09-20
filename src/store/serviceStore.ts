// ============================================================
// src/store/serviceStore.ts
// ============================================================

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import {
  Service,
  SubService,
  ServiceSchedule,
  ServiceException,
  Requirement,
} from '../types/services';
import {
  getTarifLabel,
  isGratuitEtudiant,
  isDelaiLong,
} from '../config/services-consulaires';
import { api } from '../lib/api';

// ============================================================
// HELPERS
// ============================================================

function flattenSubServices(services: Service[]): SubService[] {
  return services.flatMap((s) => s.subServices ?? []);
}

// ============================================================
// INTERFACE DU STORE
// ============================================================

interface ServiceState {
  // ── Données ──
  services: Service[];
  subServices: SubService[];
  exceptions: ServiceException[];
  selectedService: Service | null;
  selectedSubService: SubService | null;

  // ── Filtres & recherche ──
  searchQuery: string;
  activeFilter: 'all' | 'appointment' | 'no-appointment' | 'free' | 'paid';

  // ── État UI ──
  isLoading: boolean;
  error: string | null;

  // ── Actions: Lecture ──
  /** @deprecated alias for fetchServicesFromApi, kept for src/hooks/useServices.ts's existing signature. */
  loadServices: () => void;
  fetchServicesFromApi: () => Promise<void>;
  selectService: (serviceId: string | null) => void;
  selectSubService: (subServiceId: string | null) => void;

  // ── Actions: Filtres ──
  setSearchQuery: (query: string) => void;
  setActiveFilter: (filter: ServiceState['activeFilter']) => void;

  // ── Actions: CRUD Sous-services (Admin) ──
  createSubService: (data: Partial<SubService>) => Promise<SubService>;
  updateSubService: (id: string, data: Partial<SubService>) => Promise<SubService>;
  toggleSubServiceActive: (id: string) => void;

  // ── Actions: Horaires (Admin) ──
  createSchedule: (subServiceId: string, data: Partial<ServiceSchedule>) => Promise<ServiceSchedule>;
  updateSchedule: (id: string, data: Partial<ServiceSchedule>) => Promise<void>;
  deleteSchedule: (id: string) => Promise<void>;

  // ── Actions: Exceptions (Admin) ──
  createException: (data: Partial<ServiceException>) => Promise<ServiceException>;
  deleteException: (id: string) => Promise<void>;

  // ── Actions: Requirements ──
  addRequirement: (subServiceId: string, data: Partial<Requirement>) => Promise<Requirement>;
  updateRequirement: (id: string, data: Partial<Requirement>) => Promise<void>;
  removeRequirement: (id: string) => Promise<void>;

  // ── Helpers métier ──
  getSubServiceById: (id: string) => SubService | undefined;
  getSubServiceByCode: (code: string) => SubService | undefined;
  getServiceById: (id: string) => Service | undefined;
  getSchedulesForDay: (subServiceId: string, dayOfWeek: number) => ServiceSchedule[];
  isAvailableOnDay: (subServiceId: string, dayOfWeek: number) => boolean;
  getOpenDays: (subServiceId: string) => number[];
  getTarifLabel: (subService: SubService) => string;
  isGratuitEtudiant: (subServiceCode: string) => boolean;
  isDelaiLong: (subServiceCode: string) => boolean;
  getFilteredSubServices: () => SubService[];
  getRequirementsForSubService: (subServiceId: string) => Requirement[];
}

// ============================================================
// IMPLEMENTATION
// ============================================================

export const useServiceStore = create<ServiceState>()(
  immer((set, get) => ({
    // ═══════════════════════════════════════════════════════════
    // ÉTAT INITIAL — vide jusqu'au premier fetchServicesFromApi()
    // ═══════════════════════════════════════════════════════════

    services: [],
    subServices: [],
    exceptions: [],
    selectedService: null,
    selectedSubService: null,
    searchQuery: '',
    activeFilter: 'all',
    isLoading: false,
    error: null,

    // ═══════════════════════════════════════════════════════════
    // ACTIONS: LECTURE & SÉLECTION
    // ═══════════════════════════════════════════════════════════

    loadServices: () => {
      void get().fetchServicesFromApi();
    },

    /**
     * Backend: GET /services — arbre complet (services → subServices →
     * schedules/requirements).
     */
    fetchServicesFromApi: async () => {
      set((state) => { state.isLoading = true; state.error = null; });

      try {
        const { data } = await api.get('/services');
        set((state) => {
          state.services = data.data;
          state.subServices = flattenSubServices(data.data);
          state.isLoading = false;
        });
      } catch (err) {
        set((state) => {
          state.isLoading = false;
          state.error = err instanceof Error ? err.message : 'Erreur de chargement';
        });
      }
    },

    selectService: (serviceId) => {
      set((state) => {
        if (serviceId === null) {
          state.selectedService = null;
          return;
        }
        state.selectedService = state.services.find((s: any) => s.id === serviceId) ?? null;
      });
    },

    selectSubService: (subServiceId) => {
      set((state) => {
        if (subServiceId === null) {
          state.selectedSubService = null;
          return;
        }
        state.selectedSubService = state.subServices.find((s: any) => s.id === subServiceId) ?? null;
      });
    },

    // ═══════════════════════════════════════════════════════════
    // ACTIONS: FILTRES & RECHERCHE
    // ═══════════════════════════════════════════════════════════

    setSearchQuery: (query) => {
      set((state) => { state.searchQuery = query.toLowerCase().trim(); });
    },

    setActiveFilter: (filter) => {
      set((state) => { state.activeFilter = filter; });
    },

    getFilteredSubServices: () => {
      const { subServices, searchQuery, activeFilter, selectedService } = get();

      let filtered = [...subServices];

      if (selectedService) {
        filtered = filtered.filter((s) => s.serviceId === selectedService.id);
      }

      if (searchQuery) {
        filtered = filtered.filter(
          (s) =>
            (s.name.toLowerCase().includes(searchQuery) ||
            s.code.toLowerCase().includes(searchQuery) ||
            (s.description?.toLowerCase().includes(searchQuery) ?? false))
        );
      }

      switch (activeFilter) {
        case 'appointment':
          filtered = filtered.filter((s) => s.service.requiresAppointment);
          break;
        case 'no-appointment':
          filtered = filtered.filter((s) => !s.service.requiresAppointment);
          break;
        case 'free':
          filtered = filtered.filter((s) => s.basePrice === 0 || s.basePrice === null);
          break;
        case 'paid':
          filtered = filtered.filter((s) => s.basePrice !== null && s.basePrice > 0);
          break;
      }

      return filtered;
    },

    // ═══════════════════════════════════════════════════════════
    // ACTIONS: CRUD SOUS-SERVICES (ADMIN)
    // ═══════════════════════════════════════════════════════════

    /** Backend: POST /sub-services — Permission: service:admin */
    createSubService: async (data) => {
      set((state) => { state.isLoading = true; });

      try {
        const { data: response } = await api.post('/sub-services', data);
        const newSub: SubService = response.data;

        set((state) => {
          state.subServices.push(newSub);
          const service = state.services.find((s: any) => s.id === newSub.serviceId);
          if (service) {
            service.subServices = service.subServices ?? [];
            service.subServices.push(newSub);
          }
          state.isLoading = false;
        });

        return newSub;

      } catch (err) {
        set((state) => {
          state.isLoading = false;
          state.error = 'Erreur création sous-service';
        });
        throw err;
      }
    },

    /** Backend: PATCH /sub-services/:id */
    updateSubService: async (id, data) => {
      set((state) => { state.isLoading = true; });

      try {
        const { data: response } = await api.patch(`/sub-services/${id}`, data);
        const updated: SubService = response.data;

        set((state) => {
          const idx = state.subServices.findIndex((s: any) => s.id === id);
          if (idx !== -1) state.subServices[idx] = updated;
          for (const service of state.services) {
            const subIdx = service.subServices?.findIndex((s: any) => s.id === id) ?? -1;
            if (subIdx !== -1 && service.subServices) service.subServices[subIdx] = updated;
          }
          state.isLoading = false;
        });

        return updated;

      } catch (err) {
        set((state) => { state.isLoading = false; });
        throw err;
      }
    },

    /**
     * NOT WIRED — no backend endpoint for this (frontend never called one
     * even in the mock version). Client-side only.
     */
    toggleSubServiceActive: (id) => {
      set((state) => {
        const sub = state.subServices.find((s: any) => s.id === id);
        if (sub) {
          sub.active = !sub.active;
        }
      });
    },

    // ═══════════════════════════════════════════════════════════
    // ACTIONS: HORAIRES (ADMIN)
    // ═══════════════════════════════════════════════════════════

    /** Backend: POST /sub-services/:id/schedules — Permission: service:admin */
    createSchedule: async (subServiceId, data) => {
      set((state) => { state.isLoading = true; });

      try {
        const { data: response } = await api.post(`/sub-services/${subServiceId}/schedules`, data);
        const newSchedule: ServiceSchedule = response.data;

        set((state) => {
          const sub = state.subServices.find((s: any) => s.id === subServiceId);
          if (sub) sub.schedules.push(newSchedule);
          state.isLoading = false;
        });

        return newSchedule;

      } catch (err) {
        set((state) => { state.isLoading = false; });
        throw err;
      }
    },

    /** Backend: PATCH /schedules/:id */
    updateSchedule: async (id, data) => {
      set((state) => { state.isLoading = true; });

      try {
        await api.patch(`/schedules/${id}`, data);

        set((state) => {
          for (const sub of state.subServices) {
            const sched = sub.schedules.find((s: any) => s.id === id);
            if (sched) {
              Object.assign(sched, data);
              break;
            }
          }
          state.isLoading = false;
        });

      } catch (err) {
        set((state) => { state.isLoading = false; });
        throw err;
      }
    },

    /** Backend: DELETE /schedules/:id */
    deleteSchedule: async (id) => {
      set((state) => { state.isLoading = true; });

      try {
        await api.delete(`/schedules/${id}`);

        set((state) => {
          for (const sub of state.subServices) {
            sub.schedules = sub.schedules.filter((s: any) => s.id !== id);
          }
          state.isLoading = false;
        });

      } catch (err) {
        set((state) => { state.isLoading = false; });
        throw err;
      }
    },

    // ═══════════════════════════════════════════════════════════
    // ACTIONS: EXCEPTIONS (ADMIN)
    // ═══════════════════════════════════════════════════════════

    /** Backend: POST /sub-services/:id/exceptions — Permission: service:admin */
    createException: async (data) => {
      set((state) => { state.isLoading = true; });

      try {
        const { data: response } = await api.post(`/sub-services/${data.subServiceId}/exceptions`, data);
        const newExc: ServiceException = response.data;

        set((state) => {
          state.exceptions.push(newExc);
          state.isLoading = false;
        });

        return newExc;

      } catch (err) {
        set((state) => { state.isLoading = false; });
        throw err;
      }
    },

    /** Backend: DELETE /exceptions/:id */
    deleteException: async (id) => {
      set((state) => { state.isLoading = true; });

      try {
        await api.delete(`/exceptions/${id}`);

        set((state) => {
          state.exceptions = state.exceptions.filter((e: any) => e.id !== id);
          state.isLoading = false;
        });

      } catch (err) {
        set((state) => { state.isLoading = false; });
        throw err;
      }
    },

    // ═══════════════════════════════════════════════════════════
    // ACTIONS: REQUIREMENTS
    // ═══════════════════════════════════════════════════════════

    /** Backend: POST /sub-services/:id/requirements — Permission: service:admin */
    addRequirement: async (subServiceId, data) => {
      set((state) => { state.isLoading = true; });

      try {
        const { data: response } = await api.post(`/sub-services/${subServiceId}/requirements`, data);
        const newReq: Requirement = response.data;

        set((state) => {
          const sub = state.subServices.find((s: any) => s.id === subServiceId);
          if (sub) sub.requirements.push(newReq);
          state.isLoading = false;
        });

        return newReq;

      } catch (err) {
        set((state) => { state.isLoading = false; });
        throw err;
      }
    },

    /** Backend: PATCH /requirements/:id */
    updateRequirement: async (id, data) => {
      set((state) => { state.isLoading = true; });

      try {
        await api.patch(`/requirements/${id}`, data);

        set((state) => {
          for (const sub of state.subServices) {
            const req = sub.requirements.find((r: any) => r.id === id);
            if (req) {
              Object.assign(req, data);
              break;
            }
          }
          state.isLoading = false;
        });

      } catch (err) {
        set((state) => { state.isLoading = false; });
        throw err;
      }
    },

    /** Backend: DELETE /requirements/:id */
    removeRequirement: async (id) => {
      set((state) => { state.isLoading = true; });

      try {
        await api.delete(`/requirements/${id}`);

        set((state) => {
          for (const sub of state.subServices) {
            sub.requirements = sub.requirements.filter((r: any) => r.id !== id);
          }
          state.isLoading = false;
        });

      } catch (err) {
        set((state) => { state.isLoading = false; });
        throw err;
      }
    },

    // ═══════════════════════════════════════════════════════════
    // HELPERS & SÉLECTEURS
    // ═══════════════════════════════════════════════════════════

    getSubServiceById: (id) => {
      return get().subServices.find((s) => s.id === id);
    },

    getSubServiceByCode: (code) => {
      return get().subServices.find((s) => s.code === code);
    },

    getServiceById: (id) => {
      return get().services.find((s) => s.id === id);
    },

    getSchedulesForDay: (subServiceId, dayOfWeek) => {
      const sub = get().subServices.find((s) => s.id === subServiceId);
      return sub?.schedules.filter((s) => s.dayOfWeek === dayOfWeek && s.isActive) ?? [];
    },

    isAvailableOnDay: (subServiceId, dayOfWeek) => {
      return get().getSchedulesForDay(subServiceId, dayOfWeek).length > 0;
    },

    getOpenDays: (subServiceId) => {
      const sub = get().subServices.find((s) => s.id === subServiceId);
      const days = new Set(sub?.schedules.filter((s) => s.isActive).map((s) => s.dayOfWeek) ?? []);
      return Array.from(days).sort();
    },

    getTarifLabel: (subService) => getTarifLabel(subService),

    isGratuitEtudiant: (code) => isGratuitEtudiant(code),

    isDelaiLong: (code) => isDelaiLong(code),

    getRequirementsForSubService: (subServiceId) => {
      return get().subServices.find((s) => s.id === subServiceId)?.requirements ?? [];
    },

  }))
);

// ============================================================
// HOOKS DÉRIVÉS
// ============================================================

export function useSubServicesByService(serviceId: string | null) {
  return useServiceStore((state) =>
    serviceId ? state.subServices.filter((s) => s.serviceId === serviceId) : []
  );
}

export function useSubServiceByCode(code: string) {
  return useServiceStore((state) => state.getSubServiceByCode(code));
}

export function useServiceAvailability(subServiceId: string, dayOfWeek: number) {
  return useServiceStore((state) => state.isAvailableOnDay(subServiceId, dayOfWeek));
}
