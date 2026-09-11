// src/components/auth/PermissionGuard.tsx

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, Shield, Home, ArrowLeft } from 'lucide-react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { usePermission } from '../../hooks/usePermission';
import { useAuth } from '../../hooks/useAuth';
import { PermissionCode, RoleName } from '../../types/auth';

interface PermissionGuardProps {
  // Permission requise (une seule)
  permission?: PermissionCode;
  // Permissions multiples (au moins une)
  anyPermission?: PermissionCode[];
  // Permissions multiples (toutes requises)
  allPermissions?: PermissionCode[];
  // Rôle minimum requis (niveau hiérarchique)
  minRoleLevel?: number;
  // Rôle spécifique requis
  role?: RoleName;
  // Message personnalisé
  message?: string;
  // Titre personnalisé
  title?: string;
  // Redirection personnalisée
  fallbackPath?: string;
  // Enfants à afficher si l'accès est autorisé
  children: React.ReactNode;
  // Afficher le composant enfant même sans permission (pour debug)
  debug?: boolean;
}

export const PermissionGuard: React.FC<PermissionGuardProps> = ({
  permission,
  anyPermission,
  allPermissions,
  minRoleLevel,
  role,
  message,
  title,
  fallbackPath = '/',
  children,
  debug = false,
}) => {
  const navigate = useNavigate();
  const { can, hasRole } = usePermission();
  const { canAny, canAll, canAccessLevel, currentRole } = useAuth();

  // Vérification des permissions
  const hasAccess = React.useMemo(() => {
    // Mode debug: toujours autorisé
    if (debug) return true;

    // Vérification par permission unique
    if (permission) {
      return can(permission);
    }

    // Vérification par permission multiple (au moins une)
    if (anyPermission && anyPermission.length > 0) {
      return canAny(anyPermission);
    }

    // Vérification par permission multiple (toutes)
    if (allPermissions && allPermissions.length > 0) {
      return canAll(allPermissions);
    }

    // Vérification par niveau hiérarchique minimum
    if (minRoleLevel !== undefined) {
      return canAccessLevel(minRoleLevel);
    }

    // Vérification par rôle spécifique
    if (role) {
      return hasRole(role);
    }

    // Si aucune vérification n'est configurée, refuser l'accès par défaut
    return false;
  }, [permission, anyPermission, allPermissions, minRoleLevel, role, can, canAny, canAll, canAccessLevel, hasRole, debug]);

  // Si l'accès est autorisé, afficher les enfants
  if (hasAccess) {
    return <>{children}</>;
  }

  // Sinon, afficher la page d'accès refusé
  return (
    <AccessDenied
      title={title}
      message={message}
      fallbackPath={fallbackPath}
      roleName={currentRole ?? undefined}
    />
  );
};

// ============================================================
// Composant AccessDenied (page d'accès refusé)
// ============================================================

interface AccessDeniedProps {
  title?: string;
  message?: string;
  fallbackPath?: string;
  roleName?: RoleName | null;
}

export const AccessDenied: React.FC<AccessDeniedProps> = ({
  title = 'Accès refusé',
  message = "Vous n'avez pas les droits nécessaires pour accéder à cette page.",
  fallbackPath = '/',
  roleName,
}) => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6 flex items-center justify-center">
      <Card className="max-w-md w-full p-8 text-center">
        {/* Icône */}
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
          <Shield className="w-10 h-10 text-red-500" />
        </div>

        {/* Titre */}
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          {title}
        </h2>

        {/* Message */}
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          {message}
        </p>

        {/* Rôle actuel (si disponible) */}
        {roleName && (
          <div className="mb-6 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Votre rôle actuel : <span className="font-medium text-gray-700 dark:text-gray-300">{roleName}</span>
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            variant="primary"
            onClick={() => navigate(-1)}
            startIcon={<ArrowLeft className="w-4 h-4" />}
          >
            Retour
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate(fallbackPath)}
            startIcon={<Home className="w-4 h-4" />}
          >
            Accueil
          </Button>
        </div>

        {/* Code d'erreur */}
        <p className="mt-6 text-xs text-gray-400">
          Code d'erreur : 403 - Forbidden
        </p>
      </Card>
    </div>
  );
};

// ============================================================
// HOC (Higher-Order Component) pour protéger les pages
// ============================================================

interface WithPermissionProps {
  permission?: PermissionCode;
  anyPermission?: PermissionCode[];
  allPermissions?: PermissionCode[];
  minRoleLevel?: number;
  role?: RoleName;
  fallbackPath?: string;
}

export function withPermission<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  options: WithPermissionProps
): React.FC<P> {
  const displayName = WrappedComponent.displayName || WrappedComponent.name || 'Component';

  const WithPermissionComponent: React.FC<P> = (props) => {
    return (
      <PermissionGuard {...options}>
        <WrappedComponent {...props} />
      </PermissionGuard>
    );
  };

  WithPermissionComponent.displayName = `withPermission(${displayName})`;

  return WithPermissionComponent;
}

export default PermissionGuard;