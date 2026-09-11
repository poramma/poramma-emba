// ============================================================
// src/store/authStore.ts
// ============================================================

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import {
  Utilisateur,
  RoleName,
  PermissionCode,
  Agent,
  AgentDepartment,
  UserType,
  UserStatus,
} from '../types/auth';
import { PERMISSIONS } from '../config/permissions';

// ============================================================
// MOCK DATA PROFESSIONNELS
// ============================================================

/**
 * MOCK: Agent Ambassadeur (carte blanche)
 * Scénario: Connexion initiale, accès total au système
 */
const MOCK_AMBASSADEUR: Utilisateur = {
  id: 'usr-001-ambassador',
  email: 'ambassadeur@ambassade-mali.ma',
  phone: '+212-5XX-XXXXXX',
  emailVerified: true,
  phoneVerified: true,
  status: UserStatus.VERIFIED,
  mfaEnabled: true,
  lastLoginAt: '2025-07-05T08:30:00Z',
  createdAt: '2024-01-15T00:00:00Z',
  updatedAt: '2025-07-05T08:30:00Z',
  profile: {
    id: 'prof-001',
    userId: 'usr-001-ambassador',
    inue: null, // L'ambassadeur n'a pas d'INUE (pas étudiant)
    userType: UserType.OTHER,
    firstName: 'Fafré',
    lastName: 'CAMARA',
    dateOfBirth: '1965-03-15',
    nationality: 'Malienne',
    address: 'Ambassade du Mali, Rabat',
    city: 'Rabat',
    country: 'Maroc',
    createdAt: '2024-01-15T00:00:00Z',
    updatedAt: '2025-07-05T08:30:00Z',
  },
  roles: [
    {
      id: 'role-001',
      userId: 'usr-001-ambassador',
      roleId: 'role-def-001',
      role: {
        id: 'role-def-001',
        name: RoleName.AMBASSADOR,
        description: 'Chef de mission diplomatique - Accès illimité',
        level: 1,
        isSystem: true,
        permissions: [], // Toutes les permissions implicites
      },
      assignedBy: 'system',
      assignedAt: '2024-01-15T00:00:00Z',
      expiresAt: null,
      isActive: true,
    },
  ],
  activeRole: {
    id: 'role-def-001',
    name: RoleName.AMBASSADOR,
    description: 'Chef de mission diplomatique - Accès illimité',
    level: 1,
    isSystem: true,
    permissions: [],
  },
  // L'ambassadeur a TOUTES les permissions (carte blanche)
  permissions: PERMISSIONS.map((p) => p.code),
};

/**
 * MOCK: Agent Consulaire Standard
 * Scénario: Traitement quotidien des demandes, pas d'accès admin
 */
const MOCK_AGENT_STANDARD: Utilisateur = {
  id: 'usr-002-agent',
  email: 'agent.consulaire@ambassade-mali.ma',
  phone: '+212-6XX-XXXXXX',
  emailVerified: true,
  phoneVerified: true,
  status: UserStatus.VERIFIED,
  mfaEnabled: true,
  lastLoginAt: '2025-07-05T09:15:00Z',
  createdAt: '2024-03-01T00:00:00Z',
  updatedAt: '2025-07-05T09:15:00Z',
  profile: {
    id: 'prof-002',
    userId: 'usr-002-agent',
    inue: null,
    userType: UserType.OTHER,
    firstName: 'Fatima',
    lastName: 'COULIBALY',
    dateOfBirth: '1988-07-22',
    nationality: 'Malienne',
    address: 'Ambassade du Mali, Rabat',
    city: 'Rabat',
    country: 'Maroc',
    createdAt: '2024-03-01T00:00:00Z',
    updatedAt: '2025-07-05T09:15:00Z',
  },
  roles: [
    {
      id: 'role-002',
      userId: 'usr-002-agent',
      roleId: 'role-def-004',
      role: {
        id: 'role-def-004',
        name: RoleName.AGENT,
        description: 'Agent consulaire - Traitement standard',
        level: 4,
        isSystem: true,
        permissions: [],
      },
      assignedBy: 'usr-001-ambassador',
      assignedAt: '2024-03-01T00:00:00Z',
      expiresAt: null,
      isActive: true,
    },
  ],
  activeRole: {
    id: 'role-def-004',
    name: RoleName.AGENT,
    description: 'Agent consulaire - Traitement standard',
    level: 4,
    isSystem: true,
    permissions: [],
  },
  permissions: [
    PermissionCode.DEMANDE_READ,
    PermissionCode.DEMANDE_CREATE,
    PermissionCode.DEMANDE_UPDATE,
    PermissionCode.DEMANDE_VALIDATE,
    PermissionCode.DEMANDE_REJECT,
    PermissionCode.RDV_READ,
    PermissionCode.RDV_CREATE,
    PermissionCode.RDV_UPDATE,
    PermissionCode.RDV_CANCEL,
    PermissionCode.AVAILABILITY_CREATE,
    PermissionCode.AVAILABILITY_READ,
    PermissionCode.AVAILABILITY_UPDATE,
    PermissionCode.AVAILABILITY_DELETE,
    PermissionCode.DOCUMENT_READ,
    PermissionCode.DOCUMENT_VALIDATE,
    PermissionCode.COMM_READ,
    PermissionCode.COMM_CREATE,
    PermissionCode.STATS_READ,
  ],
};

/**
 * MOCK: Agent d'Accueil
 * Scénario: Peut créer des rdv d'urgence et imprimer le planning
 */
const MOCK_RECEPTIONIST: Utilisateur = {
  id: 'usr-003-reception',
  email: 'accueil@ambassade-mali.ma',
  phone: '+212-6XX-XXXXXX',
  emailVerified: true,
  phoneVerified: false,
  status: UserStatus.VERIFIED,
  mfaEnabled: false,
  lastLoginAt: '2025-07-05T07:45:00Z',
  createdAt: '2024-06-10T00:00:00Z',
  updatedAt: '2025-07-05T07:45:00Z',
  profile: {
    id: 'prof-003',
    userId: 'usr-003-reception',
    inue: null,
    userType: UserType.OTHER,
    firstName: 'Amadou',
    lastName: 'DIALLO',
    dateOfBirth: '1992-11-05',
    nationality: 'Malienne',
    address: 'Ambassade du Mali, Rabat',
    city: 'Rabat',
    country: 'Maroc',
    createdAt: '2024-06-10T00:00:00Z',
    updatedAt: '2025-07-05T07:45:00Z',
  },
  roles: [
    {
      id: 'role-003',
      userId: 'usr-003-reception',
      roleId: 'role-def-005',
      role: {
        id: 'role-def-005',
        name: RoleName.RECEPTIONIST,
        description: 'Agent d\'accueil - Urgences et orientation',
        level: 5,
        isSystem: true,
        permissions: [],
      },
      assignedBy: 'usr-001-ambassador',
      assignedAt: '2024-06-10T00:00:00Z',
      expiresAt: null,
      isActive: true,
    },
  ],
  activeRole: {
    id: 'role-def-005',
    name: RoleName.RECEPTIONIST,
    description: 'Agent d\'accueil - Urgences et orientation',
    level: 5,
    isSystem: true,
    permissions: [],
  },
  permissions: [
    PermissionCode.RDV_READ,
    PermissionCode.RDV_CREATE_URGENCE,  // SPÉCIFIQUE: rdv d'urgence
    PermissionCode.RDV_PRINT_DAILY,      // SPÉCIFIQUE: impression planning
    PermissionCode.DEMANDE_READ,
    PermissionCode.USER_READ,
    PermissionCode.DOCUMENT_READ,
    PermissionCode.AVAILABILITY_CREATE,
    PermissionCode.AVAILABILITY_READ,
    PermissionCode.AVAILABILITY_UPDATE,
    PermissionCode.AVAILABILITY_DELETE,
  ],
};

/**
 * MOCK: Administrateur Système
 * Scénario: Gestion des services, horaires, agents
 */
const MOCK_ADMIN: Utilisateur = {
  id: 'usr-004-admin',
  email: 'admin@ambassade-mali.ma',
  phone: '+212-6XX-XXXXXX',
  emailVerified: true,
  phoneVerified: true,
  status: UserStatus.VERIFIED,
  mfaEnabled: true,
  lastLoginAt: '2025-07-05T08:00:00Z',
  createdAt: '2024-01-20T00:00:00Z',
  updatedAt: '2025-07-05T08:00:00Z',
  profile: {
    id: 'prof-004',
    userId: 'usr-004-admin',
    inue: null,
    userType: UserType.OTHER,
    firstName: 'Aïssata',
    lastName: 'KEITA',
    dateOfBirth: '1990-04-18',
    nationality: 'Malienne',
    address: 'Ambassade du Mali, Rabat',
    city: 'Rabat',
    country: 'Maroc',
    createdAt: '2024-01-20T00:00:00Z',
    updatedAt: '2025-07-05T08:00:00Z',
  },
  roles: [
    {
      id: 'role-004',
      userId: 'usr-004-admin',
      roleId: 'role-def-002',
      role: {
        id: 'role-def-002',
        name: RoleName.ADMIN,
        description: 'Administrateur système - Configuration et gestion',
        level: 2,
        isSystem: true,
        permissions: [],
      },
      assignedBy: 'usr-001-ambassador',
      assignedAt: '2024-01-20T00:00:00Z',
      expiresAt: null,
      isActive: true,
    },
  ],
  activeRole: {
    id: 'role-def-002',
    name: RoleName.ADMIN,
    description: 'Administrateur système - Configuration et gestion',
    level: 2,
    isSystem: true,
    permissions: [],
  },
  permissions: [
    PermissionCode.DEMANDE_READ,
    PermissionCode.DEMANDE_ASSIGN,
    PermissionCode.RDV_READ,
    PermissionCode.RDV_CREATE,
    PermissionCode.RDV_UPDATE,
    PermissionCode.RDV_CANCEL,
    PermissionCode.RDV_PRINT_DAILY,
    PermissionCode.SERVICE_READ,
    PermissionCode.SERVICE_CREATE,
    PermissionCode.SERVICE_UPDATE,
    PermissionCode.SERVICE_DELETE,
    PermissionCode.SERVICE_ADMIN,
    PermissionCode.USER_READ,
    PermissionCode.USER_CREATE,
    PermissionCode.USER_UPDATE,
    PermissionCode.USER_DELETE,
    PermissionCode.USER_ADMIN,
    PermissionCode.DOCUMENT_READ,
    PermissionCode.AUDIT_READ,
    PermissionCode.AUDIT_EXPORT,
    PermissionCode.STATS_READ,
    PermissionCode.STATS_EXPORT,
  ],
};

// ============================================================
// INTERFACE DU STORE
// ============================================================

export interface AuthState {
  // État
  user: Utilisateur | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  mfaVerified: boolean;
  
  // Actions
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
  switchRole: (roleId: string) => void;
  verifyMFA: (code: string) => Promise<boolean>;
  clearError: () => void;
  hasPermission: (permission: PermissionCode) => boolean;
  hasAnyPermission: (permissions: PermissionCode[]) => boolean;
  hasAllPermissions: (permissions: PermissionCode[]) => boolean;
  canAccess: (minRoleLevel: number) => boolean;
  
  // Computed getters
  getIsAmbassador: () => boolean;
  getIsAdmin: () => boolean;
  getIsSeniorAgent: () => boolean;
  getIsAgent: () => boolean;
  getIsReceptionist: () => boolean;
  getIsAuditor: () => boolean;
  getCurrentRoleLevel: () => number;
}

// ============================================================
// IMPLEMENTATION
// ============================================================

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // État initial
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      mfaVerified: false,
      
      // Computed getters
      getIsAmbassador: () => {
        const user = get().user;
        return user?.activeRole?.name === RoleName.AMBASSADOR;
      },
      getIsAdmin: () => {
        const user = get().user;
        return user?.activeRole?.name === RoleName.ADMIN;
      },
      getIsSeniorAgent: () => {
        const user = get().user;
        return user?.activeRole?.name === RoleName.SENIOR_AGENT;
      },
      getIsAgent: () => {
        const user = get().user;
        return user?.activeRole?.name === RoleName.AGENT;
      },
      getIsReceptionist: () => {
        const user = get().user;
        return user?.activeRole?.name === RoleName.RECEPTIONIST;
      },
      getIsAuditor: () => {
        const user = get().user;
        return user?.activeRole?.name === RoleName.AUDITOR;
      },
      getCurrentRoleLevel: () => {
        return get().user?.activeRole?.level ?? 999;
      },
      
      /**
       * LOGIN
       * Backend: POST /api/auth/login
       * Body: { email: string, password: string, mfaCode?: string }
       * Response: { token: string, refreshToken: string, user: Utilisateur }
       * 
       * MOCK: Simulation délai réseau + sélection profil selon email
       */
      login: async (email: string, password: string, rememberMe?: boolean) => {
        set({ isLoading: true, error: null });
        
        try {
          // SIMULATION DÉLAI RÉSEAU
          await new Promise((resolve) => setTimeout(resolve, 800));
          
          // MOCK: Sélection du profil selon l'email (dev only)
          let mockUser: Utilisateur;
          const lowerEmail = email.toLowerCase();
          
          if (lowerEmail.includes('ambassador') || lowerEmail.includes('ambassadeur')) {
            mockUser = MOCK_AMBASSADEUR;
          } else if (lowerEmail.includes('admin')) {
            mockUser = MOCK_ADMIN;
          } else if (lowerEmail.includes('reception') || lowerEmail.includes('accueil')) {
            mockUser = MOCK_RECEPTIONIST;
          } else {
            mockUser = MOCK_AGENT_STANDARD;
          }
          
          // VÉRIFICATION MOT DE PASSE MOCK (dev only)
          if (password !== 'Poramma2026!') {
            throw new Error('Identifiants incorrects. Veuillez réessayer.');
          }
          
          // SIMULATION: Stockage token (dans la vraie app, HTTP-only cookie)
          // Backend retourne: { accessToken, refreshToken }
          // const { data } = await api.post('/auth/login', { email, password });
          // localStorage.setItem('access_token', data.token);
          // localStorage.setItem('refresh_token', data.refreshToken);
          
          set({
            user: mockUser,
            isAuthenticated: true,
            isLoading: false,
            error: null,
            mfaVerified: false,
          });
          
        } catch (err) {
          set({
            isLoading: false,
            error: err instanceof Error ? err.message : 'Erreur de connexion',
          });
          throw err;
        }
      },
      
      /**
       * LOGOUT
       * Backend: POST /api/auth/logout
       * Headers: Authorization: Bearer {token}
       * Action: Révocation côté serveur + suppression cookies
       */
      logout: async () => {
        set({ isLoading: true });
        
        try {
          // SIMULATION DÉLAI
          await new Promise((resolve) => setTimeout(resolve, 300));
          
          // VRAIE IMPLÉMENTATION:
          // await api.post('/auth/logout');
          // localStorage.removeItem('access_token');
          // localStorage.removeItem('refresh_token');
          
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          });
          
        } catch (err) {
          set({ isLoading: false });
          throw err;
        }
      },
      
      /**
       * REFRESH SESSION
       * Backend: POST /api/auth/refresh
       * Body: { refreshToken: string }
       * Response: { token: string, user: Utilisateur }
       * Déclenché automatiquement par l'intercepteur Axios quand 401
       */
      refreshSession: async () => {
        try {
          // SIMULATION
          await new Promise((resolve) => setTimeout(resolve, 500));
          
          // VRAIE IMPLÉMENTATION:
          // const refreshToken = localStorage.getItem('refresh_token');
          // const { data } = await api.post('/auth/refresh', { refreshToken });
          // localStorage.setItem('access_token', data.token);
          // set({ user: data.user });
          
          const currentUser = get().user;
          if (currentUser) {
            set({ user: { ...currentUser } }); // Refresh des données
          }
          
        } catch (err) {
          // Si refresh échoue → déconnexion forcée
          get().logout();
          throw err;
        }
      },
      
      /**
       * VERIFY MFA
       * Backend: POST /api/auth/mfa/verify
       * Body: { code: string }
       * Response: { valid: boolean }
       * 
       * MOCK: Simulation vérification code
       */
      verifyMFA: async (code: string): Promise<boolean> => {
        set({ isLoading: true, error: null });
        
        try {
          await new Promise((resolve) => setTimeout(resolve, 500));
          
          // MOCK: Accepte n'importe quel code à 6 chiffres
          const isValid = code.length === 6 && /^\d+$/.test(code);
          
          if (!isValid) {
            set({
              isLoading: false,
              error: 'Code invalide. Veuillez réessayer.',
            });
            return false;
          }
          
          set({
            isLoading: false,
            mfaVerified: true,
            error: null,
          });
          
          return true;
          
        } catch (err) {
          set({
            isLoading: false,
            error: err instanceof Error ? err.message : 'Erreur de vérification',
          });
          return false;
        }
      },
      
      /**
       * CLEAR ERROR
       * Réinitialise le message d'erreur
       */
      clearError: () => {
        set({ error: null });
      },
      
      /**
       * SWITCH ROLE (Ambassadeur/Admin peut changer de rôle actif)
       * Backend: POST /api/auth/switch-role
       * Body: { roleId: string }
       * Utilisé quand un utilisateur a plusieurs rôles
       */
      switchRole: (roleId: string) => {
        const user = get().user;
        if (!user) return;
        
        const targetRole = user.roles.find((ur : any) => ur.roleId === roleId);
        if (!targetRole) return;
        
        // VRAIE IMPLÉMENTATION:
        // await api.post('/auth/switch-role', { roleId });
        // const { data } = await api.get('/auth/me');
        
        set({
          user: {
            ...user,
            activeRole: targetRole.role,
            permissions: targetRole.role.name === RoleName.AMBASSADOR 
              ? PERMISSIONS.map((p) => p.code)
              : user.permissions, // Recalculer selon le nouveau rôle
          },
        });
      },
      
      /**
       * VÉRIFICATION PERMISSION (RBAC)
       * L'Ambassadeur (level 1) passe toujours
       * Les autres sont vérifiés contre leur liste de permissions
       */
      hasPermission: (permission: PermissionCode): boolean => {
        const user = get().user;
        if (!user) return false;
        
        // AMBASSADEUR = carte blanche
        if (user.activeRole?.name === RoleName.AMBASSADOR) return true;

        return user.permissions.includes(permission);
      },
      
      hasAnyPermission: (permissions: PermissionCode[]): boolean => {
        return permissions.some((p) => get().hasPermission(p));
      },
      
      hasAllPermissions: (permissions: PermissionCode[]): boolean => {
        return permissions.every((p) => get().hasPermission(p));
      },
      
      /**
       * VÉRIFICATION HIÉRARCHIQUE
       * Vérifie si le rôle courant est >= au niveau requis
       * Ex: canAccess(2) → Admin (2) et supérieurs OK, Agent (4) KO
       */
      canAccess: (minRoleLevel: number): boolean => {
        const level = get().getCurrentRoleLevel();
        return level <= minRoleLevel; // Plus petit = plus haut dans la hiérarchie
      },
    }),
    {
      name: 'poramma-auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state: AuthState) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        mfaVerified: state.mfaVerified,
      }),
    }
  )
);