// ============================================================
// src/layout/AppSidebar.tsx
// ============================================================

import { useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import { useSidebar } from "../context/SidebarContext";
import { useAuthStore } from "../store/authStore";
import { usePermission } from "../hooks/usePermission";
import { useRendezVousStore } from "../store/rendezVousStore";
import { useDemandeStore } from "../store/demandeStore";
import { PROTECTED_ROUTES, canAccessRoute, getNavRoutes } from "../routes/route-definitions";
import type { RouteDefinition } from "../routes/route-definitions";
import { RoleName, RDVType, RDVStatus, AppStatus } from "../types";

import {
  LayoutDashboard,
  FileCheck,
  CalendarClock,
  Settings,
  Users,
  FolderOpen,
  Mail,
  Activity,
  BarChart3,
  User,
  ChevronDown,
  AlertTriangle,
  ShieldCheck,
  Clock,
} from "lucide-react";

// ============================================================
// MAPPING ICONS
// ============================================================

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutDashboard,
  FileCheck,
  CalendarClock,
  Settings,
  Users,
  FolderOpen,
  Mail,
  Activity,
  BarChart3,
  User,
  AlertTriangle,
  ShieldCheck,
  Clock,
};

// ============================================================
// BADGES DYNAMIQUES
// ============================================================

function useBadgeCount(badgeKey?: string): number | null {
  const { rendezVous } = useRendezVousStore();
  const { demandes } = useDemandeStore();

  if (!badgeKey) return null;

  switch (badgeKey) {
    case 'urgences-count':
      return rendezVous.filter(
        (r) => r.type === RDVType.URGENCE && r.status === RDVStatus.PENDING
      ).length;
    
    case 'demandes-pending':
      return demandes.filter(
        (d) => d.status === AppStatus.SUBMITTED || d.status === AppStatus.IN_REVIEW
      ).length;
    
    case 'docs-a-valider':
      return 0;
    
    default:
      return null;
  }
}

// ============================================================
// COMPOSANT: NAV ITEM
// ============================================================

interface SidebarNavItemProps {
  route: RouteDefinition;
  depth?: number;
}

function SidebarNavItem({ route, depth = 0 }: SidebarNavItemProps) {
  const location = useLocation();
  const {
    isExpanded,
    isMobileOpen,
    isHovered,
    openSubmenu,
    toggleSubmenu,
  } = useSidebar();

  // 🔒 Ne pas afficher les routes hidden dans la sidebar
  if (route.hidden) return null;

  // Filtrer les enfants hidden pour le sous-menu
  const visibleChildren = route.children?.filter((c) => !c.hidden) || [];
  const hasVisibleChildren = visibleChildren.length > 0;

  const isActive = location.pathname === route.path ||
    (hasVisibleChildren && visibleChildren.some((c) => location.pathname === c.path));
  const isSubmenuOpen = openSubmenu === route.path;

  const badgeCount = useBadgeCount(route.badge);
  const IconComponent = route.icon ? ICON_MAP[route.icon] : null;

  // Sous-menu
  if (hasVisibleChildren) {
    return (
      <li className={depth > 0 ? "ml-4" : ""}>
        <button
          onClick={() => toggleSubmenu(route.path)}
          className={`menu-item group w-full ${
            isActive ? "menu-item-active" : "menu-item-inactive"
          } cursor-pointer ${
            !isExpanded && !isHovered && !isMobileOpen
              ? "lg:justify-center"
              : "lg:justify-start"
          }`}
        >
          {IconComponent && (
            <span
              className={`menu-item-icon-size ${
                isActive ? "menu-item-icon-active" : "menu-item-icon-inactive"
              }`}
            >
              <IconComponent className="w-5 h-5" />
            </span>
          )}
          
          {(isExpanded || isHovered || isMobileOpen) && (
            <>
              <span className="menu-item-text flex-1 text-left">{route.label}</span>
              
              {badgeCount !== null && badgeCount > 0 && (
                <span className="ml-2 bg-red-500 text-white text-xs rounded-full px-2 py-0.5 min-w-[20px] text-center">
                  {badgeCount}
                </span>
              )}
              
              <ChevronDown
                className={`w-4 h-4 ml-2 transition-transform duration-200 ${
                  isSubmenuOpen ? "rotate-180 text-green-600" : ""
                }`}
              />
            </>
          )}
        </button>

        {/* Sous-menu animé */}
        {(isExpanded || isHovered || isMobileOpen) && (
          <div
            className={`overflow-hidden transition-all duration-300 ${
              isSubmenuOpen ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
            }`}
          >
            <ul className="mt-1 space-y-1 ml-9">
              {visibleChildren.map((child) => (
                <SidebarNavItem key={child.path} route={child} depth={depth + 1} />
              ))}
            </ul>
          </div>
        )}
      </li>
    );
  }

  // Item simple (feuille)
  return (
    <li className={depth > 0 ? "ml-4" : ""}>
      <Link
        to={route.path}
        className={`menu-item group ${
          isActive ? "menu-item-active" : "menu-item-inactive"
        } ${!isExpanded && !isHovered && !isMobileOpen ? "lg:justify-center" : "lg:justify-start"}`}
      >
        {IconComponent && (
          <span
            className={`menu-item-icon-size ${
              isActive ? "menu-item-icon-active" : "menu-item-icon-inactive"
            }`}
          >
            <IconComponent className="w-5 h-5" />
          </span>
        )}
        
        {(isExpanded || isHovered || isMobileOpen) && (
          <>
            <span className="menu-item-text">{route.label}</span>
            
            {badgeCount !== null && badgeCount > 0 && (
              <span className="ml-auto bg-red-500 text-white text-xs rounded-full px-2 py-0.5 min-w-[20px] text-center">
                {badgeCount}
              </span>
            )}
          </>
        )}
      </Link>
    </li>
  );
}

// ============================================================
// COMPOSANT PRINCIPAL: AppSidebar
// ============================================================

const AppSidebar: React.FC = () => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const { user, isAuthenticated } = useAuthStore();
  
  // 🔑 Utilise usePermission (hook existant)
  const {
    can,
    currentRole,
    currentRoleLevel,
    isAmbassador,
  } = usePermission();

  // 🔒 Filtrer les routes visibles (exclure hidden) ET appliquer RBAC
  const navRoutes = useMemo(() => {
    if (!isAuthenticated || !currentRole) return [];
    
    // D'abord filtrer par RBAC
    const rbacFiltered = PROTECTED_ROUTES.filter((route) => 
      canAccessRoute(route, can, currentRole.name, currentRoleLevel)
    );
    
    // Puis exclure les hidden
    return getNavRoutes(rbacFiltered);
  }, [isAuthenticated, currentRole, can, currentRoleLevel]);

  // Séparer en groupes
  const mainRoutes = navRoutes.filter((r) => 
    !['audit', 'stats', 'profil'].includes(r.path.replace('/', ''))
  );
  
  const otherRoutes = navRoutes.filter((r) => 
    ['audit', 'stats', 'profil'].includes(r.path.replace('/', ''))
  );

  return (
    <aside
      className={`fixed mt-16 flex flex-col lg:mt-0 top-0 px-5 left-0 bg-white dark:bg-gray-900 dark:border-gray-800 text-gray-900 h-screen transition-all duration-300 ease-in-out z-50 border-r border-gray-200 
        ${
          isExpanded || isMobileOpen
            ? "w-[290px]"
            : isHovered
            ? "w-[290px]"
            : "w-[90px]"
        }
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0`}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* LOGO */}
      <div
        className={`py-8 flex ${
          !isExpanded && !isHovered ? "lg:justify-center" : "justify-start"
        }`}
      >
        <Link to="/dashboard">
          {isExpanded || isHovered || isMobileOpen ? (
            <>
              <img
                className="dark:hidden"
                src="/images/logo/logo.svg"
                alt="Poramma - Ambassade du Mali"
                width={150}
                height={40}
              />
              <img
                className="hidden dark:block"
                src="/images/logo/logo-dark.svg"
                alt="Poramma - Ambassade du Mali"
                width={150}
                height={40}
              />
            </>
          ) : (
            <img
              src="/images/logo/logo-icon.svg"
              alt="Poramma"
              width={32}
              height={32}
            />
          )}
        </Link>
      </div>

      {/* NAVIGATION */}
      <div className="flex flex-col overflow-y-auto duration-300 ease-linear no-scrollbar flex-1">
        <nav className="mb-6">
          <div className="flex flex-col gap-4">
            {/* SECTION: MENU PRINCIPAL */}
            {mainRoutes.length > 0 && (
              <div>
                <h2
                  className={`mb-4 text-xs uppercase flex leading-[20px] text-gray-400 ${
                    !isExpanded && !isHovered
                      ? "lg:justify-center"
                      : "justify-start"
                  }`}
                >
                  {isExpanded || isHovered || isMobileOpen ? (
                    "Menu principal"
                  ) : (
                    <span className="w-6 h-0.5 bg-gray-300 rounded-full" />
                  )}
                </h2>
                <ul className="flex flex-col gap-2">
                  {mainRoutes.map((route) => (
                    <SidebarNavItem key={route.path} route={route} />
                  ))}
                </ul>
              </div>
            )}

            {/* SECTION: AUTRES */}
            {otherRoutes.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <h2
                  className={`mb-4 text-xs uppercase flex leading-[20px] text-gray-400 ${
                    !isExpanded && !isHovered
                      ? "lg:justify-center"
                      : "justify-start"
                  }`}
                >
                  {isExpanded || isHovered || isMobileOpen ? (
                    "Autres"
                  ) : (
                    <span className="w-6 h-0.5 bg-gray-300 rounded-full" />
                  )}
                </h2>
                <ul className="flex flex-col gap-2">
                  {otherRoutes.map((route) => (
                    <SidebarNavItem key={route.path} route={route} />
                  ))}
                </ul>
              </div>
            )}
          </div>
        </nav>
      </div>

      {/* PIED DE SIDEBAR: Info utilisateur */}
      {(isExpanded || isHovered || isMobileOpen) && user && (
        <div className="py-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3 px-2">
            <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center text-white text-sm font-bold">
              {user.profile?.firstName?.[0]}{user.profile?.lastName?.[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {user.profile?.firstName} {user.profile?.lastName}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {currentRole?.name === RoleName.AMBASSADOR ? 'Ambassadeur' :
                 currentRole?.name === RoleName.ADMIN ? 'Administrateur' :
                 currentRole?.name === RoleName.SENIOR_AGENT ? 'Agent Senior' :
                 currentRole?.name === RoleName.AGENT ? 'Agent Consulaire' :
                 currentRole?.name === RoleName.RECEPTIONIST ? 'Accueil' :
                 'Auditeur'}
              </p>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};

export default AppSidebar;