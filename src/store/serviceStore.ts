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
  ServiceExceptionType,
  Requirement,
  RequirementType,
} from '../types/services';
import {
  SERVICES,
  SUB_SERVICES,
  getTarifLabel,
  isGratuitEtudiant,
  isDelaiLong,
} from '../config/services-consulaires';
import { api } from '../lib/api';

// ============================================================
// HELPERS: Construction des relations entre les mocks
// ============================================================

/**
 * Construit les relations service ↔ sous-services à partir des données brutes
 * Cette fonction est utilisée pour initialiser le store avec les données
 * de configuration métier (services-consulaires.ts)
 */
function buildServiceHierarchy(): Service[] {
  return SERVICES.map((service) => ({
    ...service,
    // Associer les sous-services à ce service
    subServices: SUB_SERVICES.filter((sub) => sub.serviceId === service.id).map((sub) => ({
      ...sub,
      // Associer le service parent
      service: { ...service, subServices: undefined }, // Éviter la référence circulaire
      // Les schedules et requirements sont déjà dans SUB_SERVICES
    })),
  }));
}

/**
 * Récupère tous les sous-services plats (sans hiérarchie)
 * Utile pour les listes de sélection
 */
function getAllSubServicesFlat(): SubService[] {
  const services = buildServiceHierarchy();
  return services.flatMap((s) => s.subServices ?? []);
}

/**
 * Récupère un sous-service par son code
 */
function getSubServiceByCode(code: string): SubService | undefined {
  return getAllSubServicesFlat().find((sub) => sub.code === code);
}

/**
 * Récupère les sous-services par catégorie de service
 */
function getSubServicesByServiceId(serviceId: string): SubService[] {
  return getAllSubServicesFlat().filter((sub) => sub.serviceId === serviceId);
}

/**
 * Récupère les horaires d'un sous-service pour un jour donné
 */
function getSchedulesForDay(subServiceId: string, dayOfWeek: number): ServiceSchedule[] {
  const sub = getAllSubServicesFlat().find((s) => s.id === subServiceId);
  return sub?.schedules.filter((s) => s.dayOfWeek === dayOfWeek && s.isActive) ?? [];
}

/**
 * Vérifie si un sous-service est disponible un jour donné
 */
function isAvailableOnDay(subServiceId: string, dayOfWeek: number): boolean {
  return getSchedulesForDay(subServiceId, dayOfWeek).length > 0;
}

/**
 * Récupère les jours d'ouverture d'un sous-service
 */
function getOpenDays(subServiceId: string): number[] {
  const sub = getAllSubServicesFlat().find((s) => s.id === subServiceId);
  const days = new Set(sub?.schedules.filter((s) => s.isActive).map((s) => s.dayOfWeek) ?? []);
  return Array.from(days).sort();
}

// ============================================================
// MOCK EXCEPTIONS (à remplacer par données backend)
// ============================================================

const MOCK_EXCEPTIONS: ServiceException[] = [
  {
    id: 'exc-001',
    subServiceId: 'sub-001',
    date: '2025-07-30',
    type: ServiceExceptionType.CLOSED,
    startTime: null,
    endTime: null,
    reason: 'Fête du Trône (Maroc)',
    createdBy: 'usr-004-admin',
    createdAt: '2025-07-01T00:00:00Z',
  },
  {
    id: 'exc-002',
    subServiceId: 'sub-012',
    date: '2025-08-14',
    type: ServiceExceptionType.SPECIAL_HOURS,
    startTime: '09:00',
    endTime: '11:00',
    reason: 'Réunion équipe consulaire - demi-journée',
    createdBy: 'usr-004-admin',
    createdAt: '2025-08-01T00:00:00Z',
  },
];

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
  
  // ── Getters computés (via sélecteurs) ──
  
  // ── Actions: Lecture ──
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
    // ÉTAT INITIAL
    // ═══════════════════════════════════════════════════════════
    
    services: buildServiceHierarchy(),
    subServices: getAllSubServicesFlat(),
    exceptions: MOCK_EXCEPTIONS,
    selectedService: null,
    selectedSubService: null,
    searchQuery: '',
    activeFilter: 'all',
    isLoading: false,
    error: null,
    
    // ═══════════════════════════════════════════════════════════
    // ACTIONS: LECTURE & SÉLECTION
    // ═══════════════════════════════════════════════════════════
    
    /**
     * Charge les services depuis la configuration locale
     * Utilisé au démarrage de l'application
     */
    loadServices: () => {
      set((state) => {
        state.services = buildServiceHierarchy();
        state.subServices = getAllSubServicesFlat();
      });
    },
    
    /**
     * FETCH depuis le backend
     * Backend: GET /api/services
     * Response: Service[] avec subServices inclus
     * 
     * À implémenter quand le backend est prêt.
     * Pour l'instant, utilise les mocks.
     */
    fetchServicesFromApi: async () => {
      set((state) => { state.isLoading = true; state.error = null; });
      
      try {
        // ── BACKEND INTEGRATION (commenté) ──
        // const { data } = await api.get('/services');
        // set((state) => {
        //   state.services = data.data;
        //   state.subServices = data.data.flatMap((s: Service) => s.subServices ?? []);
        // });
        
        // ── MOCK: Simulation délai réseau ──
        await new Promise((r) => setTimeout(r, 300));
        
        // Les données sont déjà chargées via loadServices
        set((state) => { state.isLoading = false; });
        
      } catch (err) {
        set((state) => {
          state.isLoading = false;
          state.error = err instanceof Error ? err.message : 'Erreur de chargement';
        });
      }
    },
    
    /**
     * Sélectionne un service (catégorie)
     */
    selectService: (serviceId) => {
      set((state) => {
        if (serviceId === null) {
          state.selectedService = null;
          return;
        }
        state.selectedService = state.services.find((s: any) => s.id === serviceId) ?? null;
      });
    },
    
    /**
     * Sélectionne un sous-service (prestation concrète)
     */
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
    
    /**
     * Récupère les sous-services filtrés selon la recherche et les filtres actifs
     */
    getFilteredSubServices: () => {
      const { subServices, searchQuery, activeFilter, selectedService } = get();
      
      let filtered = [...subServices];
      
      // Filtre par service sélectionné
      if (selectedService) {
        filtered = filtered.filter((s) => s.serviceId === selectedService.id);
      }
      
      // Filtre par recherche textuelle
      if (searchQuery) {
        filtered = filtered.filter(
          (s) =>
            (s.name.toLowerCase().includes(searchQuery) ||
            s.code.toLowerCase().includes(searchQuery) ||
            (s.description?.toLowerCase().includes(searchQuery) ?? false))
        );
      }
      
      // Filtre par type
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
    
    /**
     * Crée un nouveau sous-service
     * Backend: POST /api/sub-services
     * Permission: service:create (Admin+)
     */
    createSubService: async (data) => {
      set((state) => { state.isLoading = true; });
      
      try {
        // ── BACKEND INTEGRATION ──
        // const { data: response } = await api.post('/sub-services', data);
        // const newSub = response.data;
        
        // ── MOCK ──
        await new Promise((r) => setTimeout(r, 500));
        
        const newSub: SubService = {
          id: `sub-${Date.now()}`,
          serviceId: data.serviceId!,
          service: get().getServiceById(data.serviceId!)!,
          name: data.name!,
          code: data.code!,
          description: data.description ?? null,
          active: data.active ?? true,
          basePrice: data.basePrice ?? null,
          currency: data.currency ?? 'MAD',
          slaDays: data.slaDays ?? 7,
          allowCustomRequest: data.allowCustomRequest ?? false,
          requiresInPerson: data.requiresInPerson ?? true,
          createdAt: new Date().toISOString(),
          schedules: [],
          requirements: [],
        };
        
        set((state) => {
          state.subServices.push(newSub);
          // Mettre à jour aussi dans la hiérarchie services
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
    
    /**
     * Met à jour un sous-service
     * Backend: PATCH /api/sub-services/:id
     */
    updateSubService: async (id, data) => {
      set((state) => { state.isLoading = true; });
      
      try {
        // ── BACKEND INTEGRATION ──
        // await api.patch(`/sub-services/${id}`, data);
        
        // ── MOCK ──
        await new Promise((r) => setTimeout(r, 400));
        
        set((state) => {
          const idx = state.subServices.findIndex((s: any) => s.id === id);
          if (idx !== -1) {
            state.subServices[idx] = { ...state.subServices[idx], ...data };
          }
          // Sync avec la hiérarchie
          state.services = buildServiceHierarchy(); // Rebuild
          state.isLoading = false;
        });
        
        return get().getSubServiceById(id)!;
        
      } catch (err) {
        set((state) => { state.isLoading = false; });
        throw err;
      }
    },
    
    /**
     * Active/désactive un sous-service
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
    
    /**
     * Crée un horaire pour un sous-service
     * Backend: POST /api/sub-services/:id/schedules
     * Permission: service:admin
     */
    createSchedule: async (subServiceId, data) => {
      set((state) => { state.isLoading = true; });
      
      try {
        // ── BACKEND INTEGRATION ──
        // const { data: response } = await api.post(`/sub-services/${subServiceId}/schedules`, data);
        
        // ── MOCK ──
        await new Promise((r) => setTimeout(r, 400));
        
        const newSchedule: ServiceSchedule = {
          id: `sch-${Date.now()}`,
          subServiceId,
          dayOfWeek: data.dayOfWeek!,
          startTime: data.startTime!,
          endTime: data.endTime!,
          slotDurationMinutes: data.slotDurationMinutes ?? 30,
          maxConcurrentSlots: data.maxConcurrentSlots ?? 1,
          isActive: data.isActive ?? true,
          validFrom: data.validFrom ?? new Date().toISOString().split('T')[0],
          validUntil: data.validUntil ?? null,
        };
        
        set((state) => {
          const sub = state.subServices.find((s: any) => s.id === subServiceId);
          if (sub) {
            sub.schedules.push(newSchedule);
          }
          state.isLoading = false;
        });
        
        return newSchedule;
        
      } catch (err) {
        set((state) => { state.isLoading = false; });
        throw err;
      }
    },
    
    /**
     * Met à jour un horaire
     * Backend: PATCH /api/schedules/:id
     */
    updateSchedule: async (id, data) => {
      set((state) => { state.isLoading = true; });
      
      try {
        // await api.patch(`/schedules/${id}`, data);
        await new Promise((r) => setTimeout(r, 300));
        
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
    
    /**
     * Supprime un horaire
     * Backend: DELETE /api/schedules/:id
     */
    deleteSchedule: async (id) => {
      set((state) => { state.isLoading = true; });
      
      try {
        // await api.delete(`/schedules/${id}`);
        await new Promise((r) => setTimeout(r, 300));
        
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
    
    /**
     * Crée une exception (fermeture, horaires spéciaux)
     * Backend: POST /api/sub-services/:id/exceptions
     */
    createException: async (data) => {
      set((state) => { state.isLoading = true; });
      
      try {
        // const { data: response } = await api.post(`/sub-services/${data.subServiceId}/exceptions`, data);
        await new Promise((r) => setTimeout(r, 400));
        
        const newExc: ServiceException = {
          id: `exc-${Date.now()}`,
          subServiceId: data.subServiceId!,
          date: data.date!,
          type: data.type!,
          startTime: data.startTime ?? null,
          endTime: data.endTime ?? null,
          reason: data.reason!,
          createdBy: 'current-user', // Récupéré du token JWT
          createdAt: new Date().toISOString(),
        };
        
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
    
    /**
     * Supprime une exception
     * Backend: DELETE /api/exceptions/:id
     */
    deleteException: async (id) => {
      set((state) => { state.isLoading = true; });
      
      try {
        // await api.delete(`/exceptions/${id}`);
        await new Promise((r) => setTimeout(r, 300));
        
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
    
    /**
     * Ajoute un prérequis à un sous-service
     * Backend: POST /api/sub-services/:id/requirements
     */
    addRequirement: async (subServiceId, data) => {
      set((state) => { state.isLoading = true; });
      
      try {
        // const { data: response } = await api.post(`/sub-services/${subServiceId}/requirements`, data);
        await new Promise((r) => setTimeout(r, 400));
        
        const newReq: Requirement = {
          id: `req-${Date.now()}`,
          subServiceId,
          type: data.type!,
          label: data.label!,
          key: data.key!,
          description: data.description ?? null,
          required: data.required ?? true,
          order: data.order ?? 99,
          schema: data.schema ?? null,
          createdAt: new Date().toISOString(),
        };
        
        set((state) => {
          const sub = state.subServices.find((s: any) => s.id === subServiceId);
          if (sub) {
            sub.requirements.push(newReq);
          }
          state.isLoading = false;
        });
        
        return newReq;
        
      } catch (err) {
        set((state) => { state.isLoading = false; });
        throw err;
      }
    },
    
    /**
     * Met à jour un prérequis
     * Backend: PATCH /api/requirements/:id
     */
    updateRequirement: async (id, data) => {
      set((state) => { state.isLoading = true; });
      
      try {
        // await api.patch(`/requirements/${id}`, data);
        await new Promise((r) => setTimeout(r, 300));
        
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
    
    /**
     * Supprime un prérequis
     * Backend: DELETE /api/requirements/:id
     */
    removeRequirement: async (id) => {
      set((state) => { state.isLoading = true; });
      
      try {
        // await api.delete(`/requirements/${id}`);
        await new Promise((r) => setTimeout(r, 300));
        
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
// HOOKS DÉRIVÉS (optionnels, pour React Query-like patterns)
// ============================================================

/**
 * Hook pour récupérer les sous-services d'un service
 */
export function useSubServicesByService(serviceId: string | null) {
  return useServiceStore((state) => 
    serviceId ? state.subServices.filter((s) => s.serviceId === serviceId) : []
  );
}

/**
 * Hook pour récupérer un sous-service par code
 */
export function useSubServiceByCode(code: string) {
  return useServiceStore((state) => state.getSubServiceByCode(code));
}

/**
 * Hook pour vérifier la disponibilité d'un service
 */
export function useServiceAvailability(subServiceId: string, dayOfWeek: number) {
  return useServiceStore((state) => state.isAvailableOnDay(subServiceId, dayOfWeek));
}