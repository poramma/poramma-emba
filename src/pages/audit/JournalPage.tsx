// src/pages/audit/JournalPage.tsx

import React, { useEffect, useState } from 'react';
import { Activity, ShieldAlert, AlertTriangle, LogIn } from 'lucide-react';
import { Card } from '../../components/ui/card';
import { PermissionGuard } from '../../components/auth/PermissionGuard';
import { LogTable } from '../../components/audit/LogTable';
import { LogFilters, LogFiltersValue } from '../../components/audit/LogFilters';
import { LogDetail } from '../../components/audit/LogDetail';
import { ExportAudit } from '../../components/audit/ExportAudit';
import { useAudit } from '../../hooks/useAudit';
import { useAuditStore } from '../../store/auditStore';
import { AuditLog } from '../../types/audit';

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number; color: string }) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>{icon}</div>
        <div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
        </div>
      </div>
    </Card>
  );
}

const JournalPage: React.FC = () => {
  const { logs, stats, isLoading, fetchLogs, fetchStats, exportAsCSV, exportAsJSON } = useAudit();
  const meta = useAuditStore((state) => state.meta);
  const [filters, setFilters] = useState<LogFiltersValue>({});
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  useEffect(() => {
    fetchLogs();
    fetchStats();
  }, []);

  // Tout changement de filtre repart de la page 1.
  const handleFiltersChange = (value: LogFiltersValue) => {
    setFilters(value);
    fetchLogs({ ...value, page: 1 });
  };

  const handlePageChange = (page: number) => {
    fetchLogs({ ...filters, page });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleReset = () => {
    setFilters({});
    fetchLogs({ page: 1 });
  };

  // Réservé à l'ADMIN (niveau 1) et l'Ambassadeur (niveau 2) — PermissionGuard
  // ne combine pas permission+minRoleLevel (le premier défini gagne), donc on
  // ne garde que minRoleLevel ici pour que la restriction soit réellement appliquée.
  return (
    <PermissionGuard minRoleLevel={2} title="Journal d'audit">
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Journal d'audit</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Traçabilité des actions sensibles — connexions, demandes, rendez-vous, campagnes, rôles
              </p>
            </div>
            <ExportAudit onExportCSV={exportAsCSV} onExportJSON={exportAsJSON} disabled={isLoading} />
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              icon={<Activity className="w-5 h-5 text-blue-600" />}
              label="Entrées totales"
              value={stats.total}
              color="bg-blue-100 dark:bg-blue-900/30"
            />
            <StatCard
              icon={<LogIn className="w-5 h-5 text-red-600" />}
              label="Connexions échouées"
              value={stats.failedLogins}
              color="bg-red-100 dark:bg-red-900/30"
            />
            <StatCard
              icon={<AlertTriangle className="w-5 h-5 text-amber-600" />}
              label="Avertissements"
              value={stats.bySeverity.WARNING ?? 0}
              color="bg-amber-100 dark:bg-amber-900/30"
            />
            <StatCard
              icon={<ShieldAlert className="w-5 h-5 text-red-700" />}
              label="Événements critiques"
              value={stats.criticalEvents}
              color="bg-red-100 dark:bg-red-900/30"
            />
          </div>

          <LogFilters value={filters} onChange={handleFiltersChange} onReset={handleReset} />

          <LogTable logs={logs} isLoading={isLoading} meta={meta} onPageChange={handlePageChange} onRowClick={setSelectedLog} />

          <LogDetail isOpen={!!selectedLog} onClose={() => setSelectedLog(null)} log={selectedLog} />
        </div>
      </div>
    </PermissionGuard>
  );
};

export default JournalPage;
