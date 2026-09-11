// ============================================================
// src/types/services.ts
// ============================================================


/**
 * SERVICE
 * Backend: Table `services`
 * Endpoint: GET /api/services
 * 
 * Fusion de ServiceCategory + Service
 * Une catégorie est un service parent qui peut avoir des sous-services
 */
export interface Service {
  id: string;
  name: string;
  code: string;
  description: string | null;
  icon: string | null;
  order: number;
  active: boolean;
  requiresAppointment: boolean;
  createdAt: string;
  
  // Propriétés spécifiques au service (ex-category)
  // Plus besoin de categoryId ni de category
  
  // Relations
  subServices?: SubService[];
}

/**
 * SOUS-SERVICE (prestation concrète)
 * Backend: Table `sub_services`
 * Endpoint: GET /api/services/:id/sub-services
 */
export interface SubService {
  id: string;
  serviceId: string;
  service: Service;
  name: string;
  code: string;
  description: string | null;
  active: boolean;
  basePrice: number | null;
  currency: string | null;
  slaDays: number;
  allowCustomRequest: boolean;
  requiresInPerson: boolean;
  createdAt: string;
  
  // Relations
  schedules: ServiceSchedule[];
  requirements: Requirement[];
}

/**
 * HORAIRE DE SERVICE (nouveau - besoin ambassade)
 * Backend: Table `service_schedules`
 * Endpoint: GET /api/sub-services/:id/schedules
 * Permet de définir les jours/heures d'ouverture par service
 * Ex: Service X disponible uniquement le jeudi 9h-12h
 */
export interface ServiceSchedule {
  id: string;
  subServiceId: string;
  dayOfWeek: number;           // 1=Lundi, 7=Dimanche
  startTime: string;           // "HH:mm"
  endTime: string;
  slotDurationMinutes: number; // Durée standard créneau (ex: 30min)
  maxConcurrentSlots: number;  // Nb agents simultanés pour ce service
  isActive: boolean;
  validFrom: string;
  validUntil: string | null;
}

/**
 * EXCEPTION DE SERVICE (fermeture, horaires spéciaux...)
 * Backend: Table `service_exceptions`
 * Endpoint: POST /api/sub-services/:id/exceptions
 */
export interface ServiceException {
  id: string;
  subServiceId: string;
  date: string;
  type: ServiceExceptionType;
  startTime: string | null;
  endTime: string | null;
  reason: string;
  createdBy: string;
  createdAt: string;
}

export enum ServiceExceptionType {
  CLOSED = 'CLOSED',
  SPECIAL_HOURS = 'SPECIAL_HOURS',
  EXTRA_CAPACITY = 'EXTRA_CAPACITY',
}

/**
 * PRÉREQUIS D'UNE DEMANDE
 * Backend: Table `requirements`
 * Endpoint: GET /api/sub-services/:id/requirements
 */
export interface Requirement {
  id: string;
  subServiceId: string;
  type: RequirementType;
  label: string;
  key: string;
  description: string | null;
  required: boolean;
  order: number;
  schema: Record<string, unknown> | null;  // JSON Schema pour validation
  createdAt: string;
}

export enum RequirementType {
  DOCUMENT = 'DOCUMENT',
  FIELD = 'FIELD',
  FEE = 'FEE',
  PHOTO = 'PHOTO',
  SIGNATURE = 'SIGNATURE',
}