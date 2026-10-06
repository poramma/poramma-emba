// ============================================================
// src/routes/route-definitions.ts
// ============================================================

import { lazy, ComponentType } from 'react';
import { PermissionCode, RoleName } from '../types';

// ============================================================
// LAZY IMPORTS
// ============================================================

const LoginPage = lazy(() => import('../pages/auth/LoginPage'));
const ForgotPasswordPage = lazy(() => import('../pages/auth/ForgotPasswordPage'));
const DashboardPage = lazy(() => import('../pages/Dashboard/DashboardPage'));
const DemandesListPage = lazy(() => import('../pages/Demandes/DemandesListPage'));
const DemandeDetailPage = lazy(() => import('../pages/Demandes/DemandeDetailsPage'));
const DemandeTraitementPage = lazy(() => import('../pages/Demandes/DemandeTraitementPage'));
const CalendrierPage = lazy(() => import('../pages/rendez-vous/CalendrierPage'));
const DisponibilitesPage = lazy(() => import('../pages/rendez-vous/DisponibilitesPage'));
const EtudiantsListPage = lazy(() => import('../pages/etudiants/EtudiantsListPage'));
const EtudiantDetailPage = lazy(() => import('../pages/etudiants/EtudiantDetailPage'));
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
const MessagesPage = lazy(() => import('../pages/messagerie/MessagesPage'));
const ThreadDetailPage = lazy(() => import('../pages/messagerie/ThreadDetailPage'));
const JournalPage = lazy(() => import('../pages/audit/JournalPage'));
const ServicesPage = lazy(() => import('../pages/services/ServicesPage'));
const HorairesPage = lazy(() => import('../pages/services/HorairesPage'));
const ServiceDetailPage = lazy(() => import('../pages/services/ServiceDetailPage'));
const AgentAffectationPage = lazy(() => import('../pages/services/AgentAffectationPage'));
const AgentsPage = lazy(() => import('../pages/utilisateurs/AgentsPage'));
const AgentDetailPage = lazy(() => import('../pages/utilisateurs/AgentDetailPage'));
const RolesPermissionsPage = lazy(() => import('../pages/utilisateurs/RolesPermissionsPage'));
const AgentRequestsPage = lazy(() => import('../pages/utilisateurs/AgentRequestsPage'));
const AccueilPage = lazy(() => import('../pages/accueil/AccueilPage'));
const CulturePage = lazy(() => import('../pages/culture/CulturePage'));
const CultureThreadsPage = lazy(() => import('../pages/culture/CultureThreadsPage'));
const CultureThreadPage = lazy(() => import('../pages/culture/CultureThreadPage'));
const SupportTicketsPage = lazy(() => import('../pages/support/SupportTicketsPage'));
const SupportTicketDetailPage = lazy(() => import('../pages/support/SupportTicketDetailPage'));
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
  {
    path: '/reset-password',
    component: ForgotPasswordPage,
    label: 'Mot de passe oublié',
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
  // ACCUEIL — poste de l'agent d'accueil : tickets de rendez-vous,
  // registre des demandes sur place (walkin:read, attribuée à l'accueil
  // et à l'administrateur).
  // ----------------------------------------------------------
  {
    path: '/accueil',
    component: AccueilPage,
    label: 'Accueil',
    icon: 'ConciergeBell',
    permission: PermissionCode.WALKIN_READ,
  },

  // ----------------------------------------------------------
  // ESPACE CULTUREL — Conseiller Culturel (et administrateur) :
  // échanges à visage découvert avec la communauté.
  // ----------------------------------------------------------
  {
    path: '/culture',
    component: CulturePage,
    label: 'Espace culturel',
    icon: 'Palette',
    permission: PermissionCode.CULTURE_MANAGE,
    children: [
      {
        path: '/culture',
        component: CulturePage,
        label: 'Tableau de bord',
      },
      {
        path: '/culture/echanges',
        component: CultureThreadsPage,
        label: 'Échanges',
      },
      {
        path: '/culture/echanges/:id',
        component: CultureThreadPage,
        label: 'Échange',
        hidden: true,
        isDetail: true,
      },
    ],
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
    permission: PermissionCode.ETUDIANT_READ,
    minRoleLevel: 5,
    children: [
      {
        path: '/etudiants',
        component: EtudiantsListPage,
        label: 'Liste des étudiants',
        permission: PermissionCode.ETUDIANT_READ,
        minRoleLevel: 5,
      },
      {
        path: '/etudiants/:id',
        component: EtudiantDetailPage,
        label: 'Détail étudiant',
        permission: PermissionCode.ETUDIANT_READ,
        minRoleLevel: 5,
        hidden: true,
        isDetail: true,
      },
      {
        path: '/etudiants/validation',
        component: ValidationPage,
        label: 'Validation',
        permission: PermissionCode.ETUDIANT_VALIDATE,
        minRoleLevel: 3,
        badge: 'etudiants-en-attente',
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
        component: NotificationCenterPage,
        label: 'Notifications',
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
  // MESSAGERIE INTERNE — entrée de premier niveau distincte de
  // Communication : ouverte à TOUT le personnel (message:read, niveau 6),
  // contrairement à Communication (comm:read, niveau 3+) — imbriquer
  // Messagerie sous Communication l'aurait masquée pour un agent/réceptionniste
  // sans comm:read (canAccessRoute/le filtre du sidebar ne descend pas dans
  // les enfants d'un parent déjà refusé).
  // ----------------------------------------------------------
  {
    path: '/communication/messages',
    component: MessagesPage,
    label: 'Messagerie',
    icon: 'MessageSquare',
    permission: PermissionCode.MESSAGE_READ,
    minRoleLevel: 6,
    children: [
      {
        path: '/communication/messages',
        component: MessagesPage,
        label: 'Conversations',
      },
      {
        path: '/communication/messages/:id',
        component: ThreadDetailPage,
        label: 'Conversation',
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
        path: '/agents/demandes',
        component: AgentRequestsPage,
        label: 'Demandes des agents',
        requiredRole: RoleName.ADMIN,
      },
      {
        path: '/agents/roles',
        component: RolesPermissionsPage,
        label: 'Rôles & Permissions',
        requiredRole: RoleName.ADMIN,
      },
    ],
  },

  // ----------------------------------------------------------
  // TICKETS DE SUPPORT (administrateur)
  // ----------------------------------------------------------
  {
    path: '/support-tickets',
    component: SupportTicketsPage,
    label: 'Tickets support',
    icon: 'LifeBuoy',
    permission: PermissionCode.USER_ADMIN,
    requiredRole: RoleName.ADMIN,
    children: [
      {
        path: '/support-tickets',
        component: SupportTicketsPage,
        label: 'Tickets de support',
      },
      {
        path: '/support-tickets/:id',
        component: SupportTicketDetailPage,
        label: 'Détail du ticket',
        hidden: true,
        isDetail: true,
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
    minRoleLevel: 2, // ADMIN + Ambassadeur uniquement
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
  if (roleName === RoleName.ADMIN) return true;
  if (route.permission && !hasPermission(route.permission)) return false;
  if (route.requiredRole && roleName !== route.requiredRole) return false;
  if (route.minRoleLevel && roleLevel > route.minRoleLevel) return false;
  return true;
}