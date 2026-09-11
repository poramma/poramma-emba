// ============================================================
// src/layout/AppLayout.tsx
// ============================================================

/**
 * LAYOUT GLOBAL
 * 
 * Structure:
 * - Sidebar (gauche, fixe)
 * - Header (haut, sticky)
 * - Content (scrollable)
 * - Backdrop (mobile)
 * 
 * Préserve le comportement du template avec les marges dynamiques
 */

import { Outlet } from "react-router-dom";
import { useSidebar } from "../context/SidebarContext";
import AppHeader from "./AppHeader";
import AppSidebar from "./AppSidebar";
import Breadcrumb from "./Breadcrumb";
import Backdrop from "./Backdrop";
import ScrollToTop from "./ScrollToTop";

const AppLayout: React.FC = () => {
  const { isExpanded, isHovered, isMobileOpen } = useSidebar();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <AppSidebar />
      
      {/* Backdrop mobile */}
      <Backdrop />
      
      {/* Contenu principal */}
      <div
        className={`transition-all duration-300 ease-in-out min-h-screen
          ${isExpanded || isHovered ? "lg:ml-[290px]" : "lg:ml-[90px]"}
          ${isMobileOpen ? "ml-0" : ""}
        `}
      >
        {/* Header */}
        <AppHeader />
        
        {/* Zone de contenu */}
        <main className="p-4 md:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl">
            <Breadcrumb />
            <Outlet />
          </div>
        </main>
      </div>
      
      {/* Scroll to top */}
      <ScrollToTop />
    </div>
  );
};

export default AppLayout;