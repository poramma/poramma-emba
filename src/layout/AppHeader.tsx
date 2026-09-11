// ============================================================
// src/layout/AppHeader.tsx
// ============================================================

/**
 * HEADER ADAPTÉ
 * 
 * Préserve:
 * - Toggle sidebar
 * - Recherche (Ctrl+K)
 * - Notifications
 * - Profil utilisateur
 * - Theme toggle
 * 
 * Ajoute:
 * - Badge du rôle actuel
 * - Indicateur de connexion
 * - NotificationBell intégré
 */

import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSidebar } from "../context/SidebarContext";
import { useAuthStore } from "../store/authStore";
import { usePermission } from "../hooks/usePermission";
import { useUIStore } from "../store/uiStore";
import { RoleName } from "../types";
import { ThemeToggleButton } from "../components/common/ThemeToggleButton";
import { NotificationBell } from "../components/communication/notifications/NotificationBell";
import { Search, Menu, X, LogOut, User } from "lucide-react";

const AppHeader: React.FC = () => {
  const { isMobileOpen, toggleSidebar, toggleMobileSidebar } = useSidebar();
  const { user, logout } = useAuthStore();
  const { currentRole } = usePermission();
  const { addToast } = useUIStore();
  const navigate = useNavigate();

  const [showUserMenu, setShowUserMenu] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleToggle = () => {
    if (window.innerWidth >= 1024) {
      toggleSidebar();
    } else {
      toggleMobileSidebar();
    }
  };

  // Raccourci clavier Ctrl+K pour recherche
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === "k") {
        event.preventDefault();
        inputRef.current?.focus();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      addToast({
        type: 'success',
        title: 'Déconnexion réussie',
        message: 'À bientôt !',
      });
      navigate('/login');
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Erreur',
        message: 'Impossible de se déconnecter',
      });
    }
  };

  // Couleur du badge selon le rôle
  const getRoleBadgeColor = () => {
    switch (currentRole?.name) {
      case RoleName.AMBASSADOR: return 'bg-red-100 text-red-800 border-red-200';
      case RoleName.ADMIN: return 'bg-purple-100 text-purple-800 border-purple-200';
      case RoleName.SENIOR_AGENT: return 'bg-blue-100 text-blue-800 border-blue-200';
      case RoleName.AGENT: return 'bg-green-100 text-green-800 border-green-200';
      case RoleName.RECEPTIONIST: return 'bg-amber-100 text-amber-800 border-amber-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getRoleLabel = () => {
    switch (currentRole?.name) {
      case RoleName.AMBASSADOR: return 'Ambassadeur';
      case RoleName.ADMIN: return 'Admin';
      case RoleName.SENIOR_AGENT: return 'Agent Senior';
      case RoleName.AGENT: return 'Agent';
      case RoleName.RECEPTIONIST: return 'Accueil';
      case RoleName.AUDITOR: return 'Auditeur';
      default: return 'Utilisateur';
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-white/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 dark:bg-gray-900/80">
      <div className="flex items-center justify-between h-16 px-4 lg:px-6">
        {/* Gauche: Toggle + Logo mobile */}
        <div className="flex items-center gap-3">
          <button
            className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 lg:flex"
            onClick={handleToggle}
            aria-label="Toggle Sidebar"
          >
            {isMobileOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>

          {/* Logo mobile */}
          <Link to="/dashboard" className="lg:hidden flex items-center gap-2">
            <img src="/images/logo/logo-icon.svg" alt="Poramma" className="w-8 h-8" />
            <span className="font-bold text-green-700 dark:text-green-400">Poramma</span>
          </Link>
        </div>

        {/* Centre: Recherche */}
        <div className="hidden lg:flex flex-1 max-w-xl mx-8">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Rechercher un étudiant, une demande..."
              className="w-full h-10 pl-10 pr-12 rounded-lg border border-gray-200 bg-gray-50 text-sm text-gray-800 placeholder:text-gray-400 focus:border-green-500 focus:ring-2 focus:ring-green-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-500 dark:focus:border-green-400"
            />
            <kbd className="absolute right-3 top-1/2 -translate-y-1/2 hidden sm:inline-flex items-center gap-0.5 rounded border border-gray-200 bg-white px-1.5 py-0.5 text-xs text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400">
              <span>⌘</span>
              <span>K</span>
            </kbd>
          </div>
        </div>

        {/* Droite: Actions */}
        <div className="flex items-center gap-2">
          {/* Theme toggle */}
          <ThemeToggleButton />

          {/* NotificationBell intégré */}
          <NotificationBell />

          {/* Séparateur */}
          <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1" />

          {/* Profil utilisateur */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-3 p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center text-white text-sm font-bold">
                {user?.profile?.firstName?.[0]}{user?.profile?.lastName?.[0]}
              </div>
              <div className="hidden md:block text-left">
                <p className="text-sm font-medium leading-tight">
                  {user?.profile?.firstName} {user?.profile?.lastName}
                </p>
                <span className={`inline-block text-xs px-2 py-0.5 rounded-full border ${getRoleBadgeColor()}`}>
                  {getRoleLabel()}
                </span>
              </div>
            </button>

            {/* Dropdown profil */}
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2">
                <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                  <p className="font-medium text-sm">{user?.profile?.firstName} {user?.profile?.lastName}</p>
                  <p className="text-xs text-gray-500">{user?.email}</p>
                </div>
                <Link
                  to="/profile"
                  className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700"
                  onClick={() => setShowUserMenu(false)}
                >
                  <User className="w-4 h-4" />
                  Mon profil
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                >
                  <LogOut className="w-4 h-4" />
                  Déconnexion
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default AppHeader;