// ============================================================
// src/pages/dashboard/DashboardPage.tsx
// ============================================================

import { useEffect } from 'react';
import { StatsCards } from '../../components/dashboard/StatsCards';
import { DemandesChart } from '../../components/dashboard/DemandesChart';
import { RendezVousChart } from '../../components/dashboard/RendezVousChart';
import { ActiviteRecente } from '../../components/dashboard/ActiviteRecente';
import { AlertesUrgentes } from '../../components/dashboard/AlertesUrgentes';
import { TauxSatisfaction } from '../../components/dashboard/TauxSatisfaction';
import { useAuth } from '../../hooks/useAuth';
import { PermissionCode } from '../../types/auth';
import { formatDateFR } from '../../lib/date';

export function DashboardPage() {
  const { user, isAuthenticated, isLoading: authLoading, can, requireAuth } = useAuth();

  // Redirection si non authentifié
  useEffect(() => {
    requireAuth();
  }, [requireAuth]);

  // Vérification permission dashboard
  const canViewStats = can(PermissionCode.STATS_READ);
  const canViewUrgences = can(PermissionCode.RDV_CREATE_URGENCE);

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // requireAuth gère la redirection
  }

  if (!canViewStats) {
    return (
      <div className="p-8 text-center">
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-6 max-w-md mx-auto">
          <h2 className="text-lg font-semibold text-amber-800 dark:text-amber-200 mb-2">
            Accès restreint
          </h2>
          <p className="text-amber-700 dark:text-amber-300">
            Vous n'avez pas les permissions nécessaires pour accéder au tableau de bord.
          </p>
        </div>
      </div>
    );
  }

  const userName = user?.profile 
    ? `${user.profile.firstName} ${user.profile.lastName}`
    : user?.email?.split('@')[0] || 'Utilisateur';

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Tableau de bord</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Bienvenue, <span className="font-medium text-gray-700 dark:text-gray-300">{userName}</span>
            <span className="text-xs ml-2 px-2 py-0.5 bg-primary/10 text-primary rounded-full">
              {user?.activeRole?.name}
            </span>
          </p>
        </div>
        <div className="text-sm text-gray-400">
          {formatDateFR(new Date())}
        </div>
      </div>

      {/* Alertes urgentes (conditionnel) */}
      {canViewUrgences && <AlertesUrgentes />}

      {/* Stats KPIs */}
      <StatsCards />

      {/* Charts + Activité */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <DemandesChart />
            <RendezVousChart />
          </div>
          <ActiviteRecente />
        </div>

        <div className="space-y-6">
          <TauxSatisfaction />
          {/* Widgets additionnels à venir */}
          {/* <QuickActions /> */}
          {/* <UpcomingDeadlines /> */}
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;