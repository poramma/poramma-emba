// ============================================================
// src/routes/route-guards.tsx
// ============================================================

/**
 * GUARDS DE ROUTES
 * 
 * Composants de protection des routes avec:
 * - Authentification
 * - Permissions RBAC
 * - Niveaux hiérarchiques
 * - Redirections
 */

import { ReactNode, Suspense } from 'react';
import { Navigate, useLocation, useParams } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { usePermission } from '../hooks/usePermission';
import { PermissionCode, RoleName } from '../types';
import { canAccessRoute } from './route-definitions';
import type { RouteDefinition } from './route-definitions';

// ============================================================
// COMPOSANT: CHARGEMENT
// ============================================================

function RouteLoading() {
  return (
    <div className="flex h-screen items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      <span className="ml-3 text-gray-600">Chargement...</span>
    </div>
  );
}

// ============================================================
// GUARD: AUTHENTIFICATION
// ============================================================

interface RequireAuthProps {
  children: ReactNode;
}

export function RequireAuth({ children }: RequireAuthProps) {
  const { isAuthenticated, isLoading } = useAuthStore();
  const location = useLocation();

  if (isLoading) {
    return <RouteLoading />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}

// ============================================================
// GUARD: PERMISSION SPÉCIFIQUE
// ============================================================

interface RequirePermissionProps {
  permission: PermissionCode;
  fallback?: ReactNode;
  children: ReactNode;
}

export function RequirePermission({
  permission,
  fallback,
  children,
}: RequirePermissionProps) {
  const { isLoading } = useAuthStore();
  const { can } = usePermission();

  if (isLoading) {
    return <RouteLoading />;
  }

  if (!can(permission)) {
    return fallback ? (
      <>{fallback}</>
    ) : (
      <Navigate to="/unauthorized" replace />
    );
  }

  return <>{children}</>;
}

// ============================================================
// GUARD: PLUSIEURS PERMISSIONS (AU MOINS UNE)
// ============================================================

interface RequireAnyPermissionProps {
  permissions: PermissionCode[];
  children: ReactNode;
}

export function RequireAnyPermission({ permissions, children }: RequireAnyPermissionProps) {
  const { isLoading } = useAuthStore();
  const { hasAnyPermission } = usePermission();

  if (isLoading) {
    return <RouteLoading />;
  }

  if (!hasAnyPermission(permissions)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
}

// ============================================================
// GUARD: NIVEAU DE RÔLE MINIMUM
// ============================================================

interface RequireRoleLevelProps {
  maxLevel: number;
  children: ReactNode;
}

export function RequireRoleLevel({ maxLevel, children }: RequireRoleLevelProps) {
  const { isLoading } = useAuthStore();
  const { canAccess } = usePermission();

  if (isLoading) {
    return <RouteLoading />;
  }

  if (!canAccess(maxLevel)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
}

// ============================================================
// GUARD: RÔLE SPÉCIFIQUE
// ============================================================

interface RequireRoleProps {
  roles: RoleName[];
  children: ReactNode;
}

export function RequireRole({ roles, children }: RequireRoleProps) {
  const { isLoading } = useAuthStore();
  const { hasRole } = usePermission();

  if (isLoading) {
    return <RouteLoading />;
  }

  if (!hasRole(...roles)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
}

// ============================================================
// GUARD: ADMIN OU AMBASSADEUR (carte blanche)
// ============================================================

export function RequireAdminOrAmbassador({ children }: { children: ReactNode }) {
  const { isLoading } = useAuthStore();
  const { isAmbassador, isAdmin } = usePermission();

  if (isLoading) {
    return <RouteLoading />;
  }

  if (!isAmbassador && !isAdmin) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
}

// ============================================================
// GUARD: ROUTE DYNAMIQUE (vérifie la définition de route)
// ============================================================

interface RouteGuardProps {
  route: RouteDefinition;
  children: ReactNode;
}

export function RouteGuard({ route, children }: RouteGuardProps) {
  const { isLoading, user } = useAuthStore();
  const { can, currentRoleLevel, currentRole } = usePermission();

  if (isLoading) {
    return <RouteLoading />;
  }

  if (!user || !currentRole) {
    return <Navigate to="/login" replace />;
  }

  const canAccess = canAccessRoute(
    route,
    can,
    currentRole.name,
    currentRoleLevel
  );

  if (!canAccess) {
    return <Navigate to="/unauthorized" replace />;
  }

  return (
    <Suspense fallback={<RouteLoading />}>
      {children}
    </Suspense>
  );
}

// ============================================================
// WRAPPER: PAGE AVEC GUARD AUTOMATIQUE
// ============================================================

import { findActiveRoute } from './route-definitions';

export function withRouteGuard<P extends object>(
  Component: React.ComponentType<P>
): React.FC<P> {
  return function WrappedComponent(props: P) {
    const location = useLocation();
    const activeRoute = findActiveRoute(location.pathname);

    if (!activeRoute) {
      return <Component {...props} />;
    }

    return (
      <RouteGuard route={activeRoute}>
        <Component {...props} />
      </RouteGuard>
    );
  };
}