// ============================================================
// src/lib/validators.ts
// ============================================================

/**
 * VALIDATEURS DE FORMULAIRES
 * 
 * - Validation des champs utilisateurs
 * - Validation des documents
 * - Validation des demandes
 * - Règles métier spécifiques
 */

import { z } from 'zod';

// ============================================================
// SCHÉMAS ZOD
// ============================================================

/**
 * Schéma de connexion
 */
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'L\'email est requis')
    .email('Format d\'email invalide')
    .regex(/@ambassade-mali\.ma$/, 'Email institutionnel requis (@ambassade-mali.ma)'),
  password: z
    .string()
    .min(8, 'Le mot de passe doit contenir au moins 8 caractères')
    .regex(/[A-Z]/, 'Au moins une majuscule')
    .regex(/[a-z]/, 'Au moins une minuscule')
    .regex(/[0-9]/, 'Au moins un chiffre')
    .regex(/[^A-Za-z0-9]/, 'Au moins un caractère spécial'),
});

/**
 * Schéma de création d'urgence (besoin ambassade)
 */
export const urgenceSchema = z.object({
  userId: z.string().uuid('Identifiant étudiant invalide'),
  subServiceId: z.string().uuid('Service requis'),
  agentId: z.string().uuid('Agent traitant requis'),
  motif: z
    .string()
    .min(5, 'Le motif doit contenir au moins 5 caractères')
    .max(500, 'Le motif ne doit pas dépasser 500 caractères'),
  urgenceJustification: z
    .string()
    .min(10, 'La justification doit contenir au moins 10 caractères')
    .max(1000, 'La justification ne doit pas dépasser 1000 caractères'),
});

/**
 * Schéma de création de service (Admin)
 */
export const serviceSchema = z.object({
  name: z
    .string()
    .min(3, 'Le nom doit contenir au moins 3 caractères')
    .max(100, 'Le nom ne doit pas dépasser 100 caractères'),
  code: z
    .string()
    .min(3, 'Le code doit contenir au moins 3 caractères')
    .max(20, 'Le code ne doit pas dépasser 20 caractères')
    .regex(/^[A-Z_]+$/, 'Le code doit être en majuscules et underscores'),
  description: z.string().max(500).optional(),
  categoryId: z.string().uuid('Catégorie requise'),
  basePrice: z
    .number()
    .min(0, 'Le prix ne peut pas être négatif')
    .nullable(),
  currency: z.enum(['MAD', 'XOF', 'EUR']).optional(),
  slaDays: z
    .number()
    .min(1, 'Le SLA minimum est 1 jour')
    .max(90, 'Le SLA maximum est 90 jours'),
  requiresAppointment: z.boolean().default(true),
  requiresInPerson: z.boolean().default(true),
});

/**
 * Schéma d'horaire de service
 */
export const scheduleSchema = z.object({
  dayOfWeek: z
    .number()
    .min(1, 'Lundi = 1')
    .max(7, 'Dimanche = 7'),
  startTime: z
    .string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Format HH:mm requis'),
  endTime: z
    .string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Format HH:mm requis'),
  slotDurationMinutes: z
    .number()
    .min(10, 'Minimum 10 minutes')
    .max(120, 'Maximum 120 minutes')
    .refine((val: any) => [10, 15, 20, 30, 45, 60, 90, 120].includes(val), {
      message: 'Durée standard requise (10, 15, 20, 30, 45, 60, 90, 120)',
    }),
  maxConcurrentSlots: z
    .number()
    .min(1, 'Minimum 1 agent')
    .max(10, 'Maximum 10 agents'),
}).refine((data: any) => {
  const [h1, m1] = data.startTime.split(':').map(Number);
  const [h2, m2] = data.endTime.split(':').map(Number);
  return h1 * 60 + m1 < h2 * 60 + m2;
}, {
  message: 'L\'heure de fin doit être après l\'heure de début',
  path: ['endTime'],
});

/**
 * Schéma d'affectation agent-service
 */
export const agentAssignmentSchema = z.object({
  agentId: z.string().uuid('Agent requis'),
  subServiceId: z.string().uuid('Service requis'),
  isPrimary: z.boolean().default(true),
  maxDailyAppointments: z
    .number()
    .min(1, 'Minimum 1 rendez-vous')
    .max(20, 'Maximum 20 rendez-vous'),
  validFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format YYYY-MM-DD'),
  validUntil: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Format YYYY-MM-DD')
    .nullable()
    .optional(),
  notes: z.string().max(500).optional(),
}).refine((data: any) => {
  if (!data.validUntil) return true;
  return data.validFrom <= data.validUntil;
}, {
  message: 'La date de fin doit être après la date de début',
  path: ['validUntil'],
});

/**
 * Schéma de validation de document
 */
export const documentValidationSchema = z.object({
  documentId: z.string().uuid(),
  status: z.enum(['ACCEPTED', 'REJECTED']),
  reviewNote: z
    .string()
    .min(5, 'Un commentaire est requis')
    .max(1000, 'Maximum 1000 caractères'),
});

/**
 * Schéma de création de demande
 */
export const demandeSchema = z.object({
  subServiceId: z.string().uuid('Service requis'),
  customPayload: z.record(z.string(), z.unknown()).optional(),
  documents: z
    .array(z.string().uuid())
    .min(1, 'Au moins un document requis')
    .refine((arr) => arr.length <= 3, {
      message: 'Au maximum 3 documents',
      path: ['documents'],
    }),
});

// ============================================================
// FONCTIONS DE VALIDATION
// ============================================================

/**
 * Valide un INUE (Identifiant Numérique Unique Étudiant)
 * Format: ML-STU-XXXXXX
 */
export function validateINUE(inue: string): { valid: boolean; error?: string } {
  const pattern = /^ML-STU-\d{6}$/;
  
  if (!pattern.test(inue)) {
    return {
      valid: false,
      error: 'Format invalide. Attendu: ML-STU-XXXXXX (6 chiffres)',
    };
  }
  
  return { valid: true };
}

/**
 * Valide un numéro de téléphone marocain
 */
export function validatePhoneMA(phone: string): { valid: boolean; error?: string } {
  const cleaned = phone.replace(/\s/g, '');
  const pattern = /^(?:\+212|0)[5-7]\d{8}$/;
  
  if (!pattern.test(cleaned)) {
    return {
      valid: false,
      error: 'Format invalide. Ex: +212 6XX XXX XXX ou 06XX XXX XXX',
    };
  }
  
  return { valid: true };
}

/**
 * Valide un numéro de passeport malien
 */
export function validatePassportNumber(numero: string): { valid: boolean; error?: string } {
  const pattern = /^[A-Z]{2}\d{7}$/;
  
  if (!pattern.test(numero)) {
    return {
      valid: false,
      error: 'Format invalide. Attendu: 2 lettres + 7 chiffres (ex: ML1234567)',
    };
  }
  
  return { valid: true };
}

/**
 * Vérifie si un fichier est une image valide
 */
export function isValidImage(file: File): { valid: boolean; error?: string } {
  const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
  const maxSize = 5 * 1024 * 1024; // 5 Mo
  
  if (!validTypes.includes(file.type)) {
    return {
      valid: false,
      error: 'Format non supporté. Utilisez JPG, PNG ou WebP',
    };
  }
  
  if (file.size > maxSize) {
    return {
      valid: false,
      error: 'Fichier trop volumineux. Maximum 5 Mo',
    };
  }
  
  return { valid: true };
}

/**
 * Vérifie si un fichier est un PDF valide
 */
export function isValidPDF(file: File): { valid: boolean; error?: string } {
  const maxSize = 10 * 1024 * 1024; // 10 Mo
  
  if (file.type !== 'application/pdf') {
    return {
      valid: false,
      error: 'Seuls les fichiers PDF sont acceptés',
    };
  }
  
  if (file.size > maxSize) {
    return {
      valid: false,
      error: 'Fichier trop volumineux. Maximum 10 Mo',
    };
  }
  
  return { valid: true };
}

// ============================================================
// TYPE EXPORTS
// ============================================================

export type LoginInput = z.infer<typeof loginSchema>;
export type UrgenceInput = z.infer<typeof urgenceSchema>;
export type ServiceInput = z.infer<typeof serviceSchema>;
export type ScheduleInput = z.infer<typeof scheduleSchema>;
export type AgentAssignmentInput = z.infer<typeof agentAssignmentSchema>;
export type DocumentValidationInput = z.infer<typeof documentValidationSchema>;
export type DemandeInput = z.infer<typeof demandeSchema>;