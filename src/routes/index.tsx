// ============================================================
// src/routes/index.tsx
// ============================================================

/**
 * ROUTER PRINCIPAL
 * 
 * Intègre:
 * - Routes publiques (login)
 * - Routes protégées avec guards
 * - Lazy loading pour le code splitting
 * - Gestion des erreurs
 */

import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom';
import { Suspense } from 'react';
import { SidebarProvider } from '../context/SidebarContext';
import AppLayout from '../layout/AppLayout';
import { RequireAuth } from './route-guards';
import { RouteGuard } from './route-guards';
import {
  PUBLIC_ROUTES,
  PROTECTED_ROUTES,
  ERROR_ROUTES,
  flattenRoutes,
  findActiveRoute,
} from './route-definitions';

// ============================================================
// COMPOSANT DE CHARGEMENT
// ============================================================

function PageLoading() {
  return (
    <div className="flex h-[calc(100vh-200px)] items-center justify-center">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600"></div>
    </div>
  );
}

// ============================================================
// WRAPPER POUR LES ROUTES PROTÉGÉES
// ============================================================

function ProtectedLayout() {
  return (
    <RequireAuth>
      <SidebarProvider>
        <AppLayout />
      </SidebarProvider>
    </RequireAuth>
  );
}

// ============================================================
// WRAPPER POUR LES PAGES AVEC GUARD AUTOMATIQUE
// ============================================================

import { useLocation } from 'react-router-dom';

function AutoGuardOutlet() {
  const location = useLocation();
  const activeRoute = findActiveRoute(location.pathname);

  if (!activeRoute) {
    return <Outlet />;
  }

  return (
    <RouteGuard route={activeRoute}>
      <Outlet />
    </RouteGuard>
  );
}

// ============================================================
// CONSTRUCTION DU ROUTER
// ============================================================

export const router = createBrowserRouter([
  // ----------------------------------------------------------
  // ROUTES PUBLIQUES
  // ----------------------------------------------------------
  ...PUBLIC_ROUTES.map((route) => ({
    path: route.path,
    element: (
      <Suspense fallback={<PageLoading />}>
        <route.component />
      </Suspense>
    ),
  })),

  // ----------------------------------------------------------
  // ROUTES PROTÉGÉES (avec layout + sidebar)
  // ----------------------------------------------------------
  {
    path: '/',
    element: <ProtectedLayout />,
    children: [
      // Redirection par défaut
      {
        index: true,
        element: <Navigate to="/dashboard" replace />,
      },

      // Routes avec guard automatique
      ...flattenRoutes(PROTECTED_ROUTES)
        .filter((route) => !(route.children && route.children.length > 0))
        .map((route) => ({
          path: route.path,
          element: (
            <Suspense fallback={<PageLoading />}>
              <route.component />
            </Suspense>
          ),
        })),

      // Routes d'erreur
      ...ERROR_ROUTES.map((route) => ({
        path: route.path,
        element: (
          <Suspense fallback={<PageLoading />}>
            <route.component />
          </Suspense>
        ),
      })),
    ],
  },
]);

// ============================================================
// EXPORT POUR LES BADGES DYNAMIQUES
// ============================================================

/**
 * Récupère les clés de badge pour la navigation
 * Utilisé par la sidebar pour afficher les compteurs
 */
export function getBadgeKeys(): string[] {
  const allRoutes = flattenRoutes(PROTECTED_ROUTES);
  return allRoutes
    .filter((r) => r.badge)
    .map((r) => r.badge!)
    .filter((v, i, a) => a.indexOf(v) === i); // unique
}