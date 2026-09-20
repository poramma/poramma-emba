// ============================================================
// src/config/permissions.ts
// ============================================================

/**
 * MATRICE DES PERMISSIONS
 * Chaque permission a:
 * - code: identifiant unique (utilise l'enum PermissionCode de types/auth.ts)
 * - minRoleLevel: niveau hiérarchique minimum requis (1=Ambassadeur, 6=Auditeur)
 * - description: description humaine
 * - category: catégorie pour l'organisation UI
 */

import { PermissionCode } from '../types';

export interface PermissionDefinition {
  code: PermissionCode;
  minRoleLevel: number;
  description: string;
  category: string;
}

export const PERMISSIONS: PermissionDefinition[] = [
  // Demandes
  { code: PermissionCode.DEMANDE_READ, minRoleLevel: 5, description: 'Lire les demandes', category: 'Demandes' },
  { code: PermissionCode.DEMANDE_CREATE, minRoleLevel: 4, description: 'Créer une demande', category: 'Demandes' },
  { code: PermissionCode.DEMANDE_UPDATE, minRoleLevel: 4, description: 'Modifier une demande', category: 'Demandes' },
  { code: PermissionCode.DEMANDE_DELETE, minRoleLevel: 2, description: 'Supprimer une demande', category: 'Demandes' },
  { code: PermissionCode.DEMANDE_VALIDATE, minRoleLevel: 3, description: 'Valider une demande', category: 'Demandes' },
  { code: PermissionCode.DEMANDE_REJECT, minRoleLevel: 3, description: 'Rejeter une demande', category: 'Demandes' },
  { code: PermissionCode.DEMANDE_ASSIGN, minRoleLevel: 3, description: 'Assigner une demande', category: 'Demandes' },
  
  // Rendez-vous
  { code: PermissionCode.RDV_READ, minRoleLevel: 5, description: 'Lire les rendez-vous', category: 'Rendez-vous' },
  { code: PermissionCode.RDV_CREATE, minRoleLevel: 4, description: 'Créer un rendez-vous', category: 'Rendez-vous' },
  { code: PermissionCode.RDV_CREATE_URGENCE, minRoleLevel: 5, description: 'Créer un rdv d\'urgence', category: 'Rendez-vous' },
  { code: PermissionCode.RDV_UPDATE, minRoleLevel: 4, description: 'Modifier un rendez-vous', category: 'Rendez-vous' },
  { code: PermissionCode.RDV_CANCEL, minRoleLevel: 2, description: 'Annuler un rendez-vous', category: 'Rendez-vous' },
  { code: PermissionCode.RDV_PRINT_DAILY, minRoleLevel: 5, description: 'Imprimer le planning journalier', category: 'Rendez-vous' },
  // Attribuées explicitement (hors hiérarchie) : minRoleLevel 1 = ADMIN seul par la règle de niveau.
  { code: PermissionCode.RDV_CHECKIN, minRoleLevel: 1, description: 'Valider l\'arrivée d\'un usager (ticket)', category: 'Rendez-vous' },
  { code: PermissionCode.WALKIN_READ, minRoleLevel: 1, description: 'Lire le registre des demandes sur place', category: 'Accueil' },
  { code: PermissionCode.WALKIN_MANAGE, minRoleLevel: 1, description: 'Enregistrer et traiter les demandes sur place', category: 'Accueil' },
  { code: PermissionCode.CULTURE_MANAGE, minRoleLevel: 1, description: 'Gérer l\'espace culturel', category: 'Culture' },

  // Disponibilités
  { code: PermissionCode.AVAILABILITY_READ, minRoleLevel: 5, description: 'Lire les disponibilités', category: 'Disponibilités' },
  { code: PermissionCode.AVAILABILITY_CREATE, minRoleLevel: 5, description: 'Créer une disponibilité', category: 'Disponibilités' },
  { code: PermissionCode.AVAILABILITY_UPDATE, minRoleLevel: 5, description: 'Modifier une disponibilité', category: 'Disponibilités' },
  { code: PermissionCode.AVAILABILITY_DELETE, minRoleLevel: 5, description: 'Supprimer une disponibilité', category: 'Disponibilités' },
  { code: PermissionCode.AVAILABILITY_CONFIG, minRoleLevel: 2, description: 'Configurer les disponibilités', category: 'Disponibilités' },
  
  // Services
  { code: PermissionCode.SERVICE_READ, minRoleLevel: 5, description: 'Lire les services', category: 'Services' },
  { code: PermissionCode.SERVICE_CREATE, minRoleLevel: 2, description: 'Créer un service', category: 'Services' },
  { code: PermissionCode.SERVICE_UPDATE, minRoleLevel: 2, description: 'Modifier un service', category: 'Services' },
  { code: PermissionCode.SERVICE_DELETE, minRoleLevel: 2, description: 'Supprimer un service', category: 'Services' },
  { code: PermissionCode.SERVICE_ADMIN, minRoleLevel: 2, description: 'Administrer les services', category: 'Services' },
  
  // Utilisateurs / Agents
  { code: PermissionCode.USER_READ, minRoleLevel: 5, description: 'Lire les utilisateurs', category: 'Utilisateurs' },
  { code: PermissionCode.USER_CREATE, minRoleLevel: 2, description: 'Créer un utilisateur', category: 'Utilisateurs' },
  { code: PermissionCode.USER_UPDATE, minRoleLevel: 2, description: 'Modifier un utilisateur', category: 'Utilisateurs' },
  { code: PermissionCode.USER_DELETE, minRoleLevel: 1, description: 'Supprimer un utilisateur', category: 'Utilisateurs' },
  { code: PermissionCode.USER_ADMIN, minRoleLevel: 2, description: 'Administrer les utilisateurs', category: 'Utilisateurs' },
  
  // Documents
  { code: PermissionCode.DOCUMENT_READ, minRoleLevel: 5, description: 'Lire les documents', category: 'Documents' },
  { code: PermissionCode.DOCUMENT_VALIDATE, minRoleLevel: 3, description: 'Valider un document', category: 'Documents' },
  { code: PermissionCode.DOCUMENT_UPLOAD, minRoleLevel: 4, description: 'Uploader un document', category: 'Documents' },
  { code: PermissionCode.DOCUMENT_ARCHIVE, minRoleLevel: 4, description: 'Archiver un document', category: 'Documents' },
  { code: PermissionCode.DOCUMENT_SHARE, minRoleLevel: 4, description: 'Partager un document interne', category: 'Documents' },

  // Étudiants
  { code: PermissionCode.ETUDIANT_READ, minRoleLevel: 5, description: 'Lire les dossiers étudiants', category: 'Étudiants' },
  { code: PermissionCode.ETUDIANT_VALIDATE, minRoleLevel: 3, description: 'Valider, rejeter, suspendre un étudiant ou lui attribuer un INUE', category: 'Étudiants' },

  // Communication
  { code: PermissionCode.COMM_READ, minRoleLevel: 3, description: 'Lire les communications', category: 'Communication' },
  { code: PermissionCode.COMM_CREATE, minRoleLevel: 3, description: 'Créer une communication', category: 'Communication' },
  { code: PermissionCode.COMM_SEND, minRoleLevel: 3, description: 'Envoyer une communication', category: 'Communication' },

  // Messagerie interne — outil de collaboration de base, ouvert à tout le personnel.
  { code: PermissionCode.MESSAGE_READ, minRoleLevel: 6, description: 'Lire la messagerie interne', category: 'Messagerie' },
  { code: PermissionCode.MESSAGE_CREATE, minRoleLevel: 6, description: 'Envoyer un message interne', category: 'Messagerie' },

  // Audit — réservé à l'ADMIN et l'Ambassadeur (même niveau qu'audit:export).
  { code: PermissionCode.AUDIT_READ, minRoleLevel: 2, description: 'Lire le journal d\'audit', category: 'Audit' },
  { code: PermissionCode.AUDIT_EXPORT, minRoleLevel: 2, description: 'Exporter le journal d\'audit', category: 'Audit' },
  
  // Paiements
  { code: PermissionCode.PAYMENT_READ, minRoleLevel: 3, description: 'Lire les paiements', category: 'Paiements' },
  { code: PermissionCode.PAYMENT_CREATE, minRoleLevel: 2, description: 'Créer un paiement', category: 'Paiements' },
  { code: PermissionCode.PAYMENT_REFUND, minRoleLevel: 2, description: 'Rembourser un paiement', category: 'Paiements' },
  
  // Stats & Rapports
  { code: PermissionCode.STATS_READ, minRoleLevel: 3, description: 'Lire les statistiques', category: 'Statistiques' },
  { code: PermissionCode.STATS_EXPORT, minRoleLevel: 2, description: 'Exporter les statistiques', category: 'Statistiques' },
];
