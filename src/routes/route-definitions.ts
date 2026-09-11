// ============================================================
// src/routes/route-definitions.ts
// ============================================================

import { lazy, ComponentType } from 'react';
import { PermissionCode, RoleName } from '../types';

// ============================================================
// LAZY IMPORTS
// ============================================================

const LoginPage = lazy(() => import('../pages/auth/LoginPage'));
const DashboardPage = lazy(() => import('../pages/dashboard/DashboardPage'));
const DemandesListPage = lazy(() => import('../pages/demandes/DemandesListPage'));
const DemandeDetailPage = lazy(() => import('../pages/demandes/DemandeDetailsPage'));
const DemandeTraitementPage = lazy(() => import('../pages/demandes/DemandeTraitementPage'));
const CalendrierPage = lazy(() => import('../pages/rendez-vous/CalendrierPage'));
const UrgencePage = lazy(() => import('../pages/rendez-vous/UrgencePage'));
const DisponibilitesPage = lazy(() => import('../pages/rendez-vous/DisponibilitesPage'));
const EtudiantsListPage = lazy(() => import('../pages/etudiants/EtudiantsListPage'));
const ValidationPage = lazy(() => import('../pages/etudiants/ValidationPage'));
const DocumentsPage = lazy(() => import('../pages/documents/DocumentsPage'));
const ArchivesPage = lazy(() => import('../pages/documents/ArchivesPage'));
const InternalDocumentsPage = lazy(() => import('../pages/documents/InternalDocumentsPage'));
const StudentDocumentsPage = lazy(() => import('../pages/documents/StudentDocumentsPage'));
const CategoriesPage = lazy(() => import('../pages/documents/CategoriesPage'));
const QueuePage = lazy(() => import('../pages/documents/QueuePage'));
const DocumentDetailPage = lazy(() => import('../pages/documents/DocumentDetailPage'));
const CampagnesPage = lazy(() => import('../pages/communication/CampagnesPage'));
const NewCampagnePage = lazy(() => import('../pages/communication/NewCampagnePage'));
const CampagneDetailPage = lazy(() => import('../pages/communication/CampagneDetailPage'));
const EditCampagnePage = lazy(() => import('../pages/communication/EditCampagnePage'));
const NotificationCenterPage = lazy(() => import('../pages/communication/NotificationCenterPage'));
const JournalPage = lazy(() => import('../pages/audit/JournalPage'));
const ServicesPage = lazy(() => import('../pages/services/ServicesPage'));
const HorairesPage = lazy(() => import('../pages/services/HorairesPage'));
const ServiceDetailPage = lazy(() => import('../pages/services/ServiceDetailPage'));
const AgentAffectationPage = lazy(() => import('../pages/services/AgentAffectationPage'));
const AgentsPage = lazy(() => import('../pages/utilisateurs/AgentsPage'));
const AgentDetailPage = lazy(() => import('../pages/utilisateurs/AgentDetailPage'));
const RolesPermissionsPage = lazy(() => import('../pages/utilisateurs/RolesPermissionsPage'));
const RapportsPage = lazy(() => import('../pages/stats/RapportsPage'));
const ProfilePage = lazy(() => import('../pages/profile/ProfilePage'));
const UnauthorizedPage = lazy(() => import('../pages/erreurs/UnauthorizedPage'));
const NotFoundPage = lazy(() => import('../pages/erreurs/NotFoundPage'));

// ============================================================
// INTERFACE
// ============================================================

export interface RouteDefinition {
  path: string;
  component: ComponentType<any>;
  permission?: PermissionCode;
  requiredRole?: RoleName;
  minRoleLevel?: number;
  badge?: string;
  label: string;
  icon?: string;
  children?: RouteDefinition[];
  /** Si true, cette route n'apparaît pas dans la navigation */
  hidden?: boolean;
  /** Si true, cette route est un détail (nécessite un ID) */
  isDetail?: boolean;
}

// ============================================================
// ROUTES PUBLIQUES
// ============================================================

export const PUBLIC_ROUTES: RouteDefinition[] = [
  {
    path: '/login',
    component: LoginPage,
    label: 'Connexion',
  },
];

// ============================================================
// ROUTES PROTÉGÉES
// ============================================================

export const PROTECTED_ROUTES: RouteDefinition[] = [
  // ----------------------------------------------------------
  // DASHBOARD
  // ----------------------------------------------------------
  {
    path: '/dashboard',
    component: DashboardPage,
    label: 'Tableau de bord',
    icon: 'LayoutDashboard',
    badge: 'dashboard-stats',
  },

  // ----------------------------------------------------------
  // DEMANDES CONSULAIRES
  // ----------------------------------------------------------
  {
    path: '/demandes',
    component: DemandesListPage,
    label: 'Demandes',
    icon: 'FileCheck',
    badge: 'demandes-pending',
    children: [
      {
        path: '/demandes',
        component: DemandesListPage,
        label: 'Toutes les demandes',
      },
      // Routes de détail — cachées dans la nav, accessibles via navigation programmatique
      {
        path: '/demandes/:id',
        component: DemandeDetailPage, // La page liste gère aussi le détail (ou redirige)
        label: 'Détail demande',
        hidden: true,
        isDetail: true,
      },
      {
        path: '/demandes/:id/traitement',
        component: DemandeTraitementPage,
        label: 'Traitement',
        permission: PermissionCode.DEMANDE_VALIDATE,
        hidden: true,
        isDetail: true,
      },
    ],
  },

  // ----------------------------------------------------------
  // RENDEZ-VOUS
  // ----------------------------------------------------------
  {
    path: '/rendez-vous',
    component: CalendrierPage,
    label: 'Agenda',
    icon: 'CalendarClock',
    children: [
      {
        path: '/rendez-vous',
        component: CalendrierPage,
        label: 'Rendez-Vous',
      },
      {
        path: '/rendez-vous/urgence',
        component: UrgencePage,
        label: 'Urgences',
        permission: PermissionCode.RDV_CREATE_URGENCE,
        badge: 'urgences-count',
      },
      {
        path: '/rendez-vous/disponibilites',
        component: DisponibilitesPage,
        label: 'Disponibilités',
        permission: PermissionCode.SERVICE_ADMIN,
        minRoleLevel: 2,
      },
    ],
  },

  // ----------------------------------------------------------
  // ÉTUDIANTS
  // ----------------------------------------------------------
  {
    path: '/etudiants',
    component: EtudiantsListPage,
    label: 'Étudiants',
    icon: 'Users',
    children: [
      {
        path: '/etudiants',
        component: EtudiantsListPage,
        label: 'Liste des étudiants',
      },
      {
        path: '/etudiants/:id',
        component: EtudiantsListPage,
        label: 'Détail étudiant',
        hidden: true,
        isDetail: true,
      },
      {
        path: '/etudiants/validation',
        component: ValidationPage,
        label: 'Validation documents',
        permission: PermissionCode.DOCUMENT_VALIDATE,
        badge: 'docs-a-valider',
      },
    ],
  },

// ----------------------------------------------------------
  // DOCUMENTS
  // ----------------------------------------------------------
  {
    path: '/documents',
    component: DocumentsPage,
    label: 'Documents',
    icon: 'FolderOpen',
    permission: PermissionCode.DOCUMENT_READ,
    minRoleLevel: 4,
    children: [
      {
        path: '/documents',
        component: DocumentsPage,
        label: 'Tableau de bord',
      },
      {
        path: '/documents/queue',
        component: QueuePage,
        label: 'File de vérification',
        permission: PermissionCode.DOCUMENT_VALIDATE,
      },
      {
        path: '/documents/archive',
        component: ArchivesPage,
        label: 'Archives',
      },
      {
        path: '/documents/internal',
        component: InternalDocumentsPage,
        label: 'Documents internes',
      },
      {
        path: '/documents/students',
        component: StudentDocumentsPage,
        label: 'Documents étudiants',
        permission: PermissionCode.DOCUMENT_READ,
        minRoleLevel: 4,
      },
      {
        path: '/documents/students/:studentId',
        component: StudentDocumentsPage,
        label: 'Dossier étudiant',
        hidden: true,
        isDetail: true,
      },
      {
        path: '/documents/categories',
        component: CategoriesPage,
        label: 'Catégories de documents',
        permission: PermissionCode.SERVICE_ADMIN,
        minRoleLevel: 2,
      },
      {
        path: '/documents/:id',
        component: DocumentDetailPage,
        label: 'Détail du document',
        hidden: true,
        isDetail: true,
      },
    ],
  },

  // ----------------------------------------------------------
  // COMMUNICATION
  // ----------------------------------------------------------
  {
    path: '/communication',
    component: CampagnesPage,
    label: 'Communication',
    icon: 'Mail',
    permission: PermissionCode.COMM_READ,
    minRoleLevel: 4,
    children: [
      {
        path: '/communication',
        component: CampagnesPage,
        label: 'Messagerie',
        
      },
      {
        path: '/communication/campagnes',
        component: CampagnesPage,
        label: 'Campagnes',
        
      },
      {
        path: '/communication/campagnes/new',
        component: NewCampagnePage,
        label: 'Nouvelle campagne',
        permission: PermissionCode.COMM_CREATE,
        hidden: true,
      },
      {
        path: '/communication/campagnes/:id',
        component: CampagneDetailPage,
        label: 'Détail de la campagne',
        hidden: true,
        isDetail: true,
      },
      {
        path: '/communication/campagnes/:id/edit',
        component: EditCampagnePage,
        label: 'Modifier la campagne',
        permission: PermissionCode.COMM_CREATE,
        hidden: true,
        isDetail: true,
      },
    ],
  },

  // ----------------------------------------------------------
  // NOTIFICATIONS
  // ----------------------------------------------------------
  {
    path: '/notifications',
    component: NotificationCenterPage,
    label: 'Notifications',
    icon: 'Bell',
    permission: PermissionCode.COMM_READ,
    minRoleLevel: 4,
    hidden: true, // Accessible via la cloche dans le header
  },

  // ----------------------------------------------------------
  // SERVICES & HORAIRES
  // ----------------------------------------------------------
  {
    path: '/services',
    component: ServicesPage,
    label: 'Services',
    icon: 'Settings',
    permission: PermissionCode.SERVICE_ADMIN,
    minRoleLevel: 2,
    children: [
      {
        path: '/services',
        component: ServicesPage,
        label: 'Gestion des services',
      },
      {
        path: '/services/horaires',
        component: HorairesPage,
        label: 'Horaires et exceptions',
      },
      {
        path: '/services/affectation',
        component: AgentAffectationPage,
        label: 'Affectation des agents',
      },
      {
        path: '/services/:id/detail',
        component: ServiceDetailPage,
        label: 'Détail du service',
        hidden: true,
        isDetail: true
      },
    ],
  },

  // ----------------------------------------------------------
  // UTILISATEURS
  // ----------------------------------------------------------
  {
    path: '/agents',
    component: AgentsPage,
    label: 'Agents',
    icon: 'Users',
    permission: PermissionCode.USER_ADMIN,
    minRoleLevel: 2,
    children: [
      {
        path: '/agents',
        component: AgentsPage,
        label: 'Agents',
      },
      {
        path: '/agents/:id',
        component: AgentDetailPage,
        label: 'Détail de l\'agent',
        hidden: true,
        isDetail: true
      },
      {
        path: '/agents/roles',
        component: RolesPermissionsPage,
        label: 'Rôles & Permissions',
        requiredRole: RoleName.AMBASSADOR,
      },
    ],
  },

  // ----------------------------------------------------------
  // AUDIT
  // ----------------------------------------------------------
  {
    path: '/audit',
    component: JournalPage,
    label: 'Journal d\'audit',
    icon: 'Activity',
    permission: PermissionCode.AUDIT_READ,
  },

  // ----------------------------------------------------------
  // STATISTIQUES
  // ----------------------------------------------------------
  {
    path: '/stats',
    component: RapportsPage,
    label: 'Statistiques',
    icon: 'BarChart3',
    permission: PermissionCode.STATS_READ,
  },

  // ----------------------------------------------------------
  // PROFIL
  // ----------------------------------------------------------
  {
    path: '/profile',
    component: ProfilePage,
    label: 'Mon profil',
    icon: 'User',
  },
];

// ============================================================
// ROUTES D'ERREUR
// ============================================================

export const ERROR_ROUTES: RouteDefinition[] = [
  {
    path: '/unauthorized',
    component: UnauthorizedPage,
    label: 'Accès refusé',
    hidden: true,
  },
  {
    path: '*',
    component: NotFoundPage,
    label: 'Page non trouvée',
    hidden: true,
  },
];

// ============================================================
// HELPERS
// ============================================================

/**
 * Aplatit les routes visibles (pour la navigation/sidebar)
 * Ignore les routes hidden et isDetail
 */
export function getNavRoutes(routes: RouteDefinition[]): RouteDefinition[] {
  const result: RouteDefinition[] = [];
  
  routes.forEach((route) => {
    if (!route.hidden) {
      const navRoute = { ...route };
      if (route.children) {
        navRoute.children = route.children.filter(c => !c.hidden);
      }
      result.push(navRoute);
    }
  });
  
  return result;
}

/**
 * Aplatit TOUTES les routes (pour le router React)
 */
export function flattenRoutes(routes: RouteDefinition[]): RouteDefinition[] {
  const result: RouteDefinition[] = [];
  
  routes.forEach((route) => {
    result.push(route);
    if (route.children) {
      result.push(...flattenRoutes(route.children));
    }
  });
  
  return result;
}

/**
 * Trouve la route active selon le pathname
 */
export function findActiveRoute(pathname: string): RouteDefinition | undefined {
  const allRoutes = flattenRoutes(PROTECTED_ROUTES);
  
  // Match exact
  let match = allRoutes.find((r) => r.path === pathname);
  if (match) return match;
  
  // Match avec paramètres
  match = allRoutes.find((r) => {
    const pattern = r.path.replace(/:\w+/g, '[^/]+');
    const regex = new RegExp(`^${pattern}$`);
    return regex.test(pathname);
  });
  
  return match;
}

/**
 * Vérifie si une route est accessible
 */
export function canAccessRoute(
  route: RouteDefinition,
  hasPermission: (p: PermissionCode) => boolean,
  roleName: RoleName,
  roleLevel: number
): boolean {
  if (roleName === RoleName.AMBASSADOR) return true;
  if (route.permission && !hasPermission(route.permission)) return false;
  if (route.requiredRole && roleName !== route.requiredRole) return false;
  if (route.minRoleLevel && roleLevel > route.minRoleLevel) return false;
  return true;
}