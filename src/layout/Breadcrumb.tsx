// ============================================================
// src/layout/Breadcrumb.tsx
// ============================================================

/**
 * BREADCRUMB
 * 
 * Génère automatiquement le fil d'Ariane à partir de la route active
 */

import { Link, useLocation } from "react-router-dom";
import { ChevronRight, Home } from "lucide-react";
import { PROTECTED_ROUTES } from "../routes/route-definitions";
import { flattenRoutes } from "../routes/route-definitions";

const Breadcrumb: React.FC = () => {
  const location = useLocation();
  const allRoutes = flattenRoutes(PROTECTED_ROUTES);
  
  // Construire le fil d'Ariane
  const pathSegments = location.pathname.split('/').filter(Boolean);
  const breadcrumbs: Array<{ label: string; path: string }> = [{ label: 'Accueil', path: '/dashboard' }];
  
  let currentPath = '';
  pathSegments.forEach((segment) => {
    currentPath += `/${segment}`;
    const route = allRoutes.find((r) => r.path === currentPath);
    if (route) {
      breadcrumbs.push({ label: route.label, path: currentPath });
    }
  });

  return (
    <nav className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-6">
      {breadcrumbs.map((crumb, index) => (
        <div key={crumb.path} className="flex items-center gap-2">
          {index > 0 && <ChevronRight className="w-4 h-4" />}
          {index === breadcrumbs.length - 1 ? (
            <span className="font-medium text-gray-900 dark:text-white">
              {crumb.label}
            </span>
          ) : (
            <Link
              to={crumb.path}
              className="hover:text-green-600 dark:hover:text-green-400 transition-colors"
            >
              {index === 0 ? <Home className="w-4 h-4" /> : crumb.label}
            </Link>
          )}
        </div>
      ))}
    </nav>
  );
};

export default Breadcrumb;