// src/pages/etudiants/EtudiantsListPage.tsx

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Search, UserCheck, UserX, Award, Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Select } from '../../components/ui/select';
import { Badge } from '../../components/ui/badge';
import { PermissionGuard } from '../../components/auth/PermissionGuard';
import { usePermission } from '../../hooks/usePermission';
import { useEtudiants } from '../../hooks/useEtudiants';
import { EtudiantStatus } from '../../types/etudiant';
import { PermissionCode } from '../../types/auth';
import { formatDateShort } from '../../lib/date';
import { EnrollStudentModal } from '../../components/etudiants/EnrollStudentModal';
import { useDebouncedSearch } from '../../hooks/useDebouncedSearch';

const STATUS_CONFIG: Record<EtudiantStatus, { label: string; color: 'warning' | 'success' | 'error' | 'gray' }> = {
  [EtudiantStatus.PENDING]: { label: 'En attente', color: 'warning' },
  [EtudiantStatus.VALIDATED]: { label: 'Validé', color: 'success' },
  [EtudiantStatus.REJECTED]: { label: 'Rejeté', color: 'error' },
  [EtudiantStatus.SUSPENDED]: { label: 'Suspendu', color: 'gray' },
};

const EtudiantsListPage: React.FC = () => {
  const navigate = useNavigate();
  const { can } = usePermission();
  const { etudiants, isLoading, meta, filters, stats, fetchEtudiants, setFilters } = useEtudiants();

  const [searchInput, setSearchInput] = useState(filters.search ?? '');
  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false);

  const canValidate = can(PermissionCode.ETUDIANT_VALIDATE);

  useEffect(() => {
    fetchEtudiants({ page: 1, limit: 20 });
  }, []);

  const applyFilters = (patch: Partial<typeof filters>) => {
    const next = { ...filters, ...patch, page: 1 };
    setFilters(next);
    fetchEtudiants(next);
  };

  // Recherche en temps réel : appliquée peu après la dernière frappe.
  useDebouncedSearch(searchInput, (text) => applyFilters({ search: text || undefined }));

  const goToPage = (page: number) => {
    const next = { ...filters, page };
    setFilters(next);
    fetchEtudiants(next);
  };

  return (
    <PermissionGuard minRoleLevel={5} permission={PermissionCode.ETUDIANT_READ} title="Étudiants">
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Étudiants</h1>
              <p className="text-sm text-gray-500 mt-1">Consultation, validation et attribution INUE</p>
            </div>
            {canValidate && (
              <Button variant="primary" onClick={() => setIsEnrollModalOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Enrôler un étudiant
              </Button>
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="p-3 text-center">
              <div className="text-xl font-bold text-gray-900 dark:text-white">{stats.total}</div>
              <div className="text-xs text-gray-500 flex items-center justify-center gap-1"><Users className="w-3 h-3" /> Total</div>
            </Card>
            <Card className="p-3 text-center">
              <div className="text-xl font-bold text-amber-600">{stats.pending}</div>
              <div className="text-xs text-gray-500">En attente</div>
            </Card>
            <Card className="p-3 text-center">
              <div className="text-xl font-bold text-green-600">{stats.validated}</div>
              <div className="text-xs text-gray-500 flex items-center justify-center gap-1"><UserCheck className="w-3 h-3" /> Validés</div>
            </Card>
            <Card className="p-3 text-center">
              <div className="text-xl font-bold text-purple-600">{stats.withInue}</div>
              <div className="text-xs text-gray-500 flex items-center justify-center gap-1"><Award className="w-3 h-3" /> Avec INUE</div>
            </Card>
          </div>

          <Card className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-2">
                <Input
                  placeholder="Rechercher (nom, email, INUE)..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && applyFilters({ search: searchInput })}
                  startIcon={<Search className="w-4 h-4" />}
                />
              </div>
              <Select
                value={filters.status ?? ''}
                onChange={(value) => applyFilters({ status: (value || undefined) as EtudiantStatus | undefined })}
                options={[
                  { value: '', label: 'Tous les statuts' },
                  ...Object.entries(STATUS_CONFIG).map(([value, cfg]) => ({ value, label: cfg.label })),
                ]}
              />
              <Select
                value={filters.hasInue === undefined ? '' : String(filters.hasInue)}
                onChange={(value) => applyFilters({ hasInue: value === '' ? undefined : value === 'true' })}
                options={[
                  { value: '', label: 'INUE : tous' },
                  { value: 'true', label: 'Avec INUE' },
                  { value: 'false', label: 'Sans INUE' },
                ]}
              />
            </div>
          </Card>

          <div className="space-y-3">
            {isLoading && (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500" />
              </div>
            )}

            {!isLoading && etudiants.map((e) => (
              <Card
                key={e.id}
                className="p-4 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => navigate(`/etudiants/${e.id}`)}
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center text-brand-600 font-bold text-lg">
                      {(e.firstName?.charAt(0) ?? '?').toUpperCase()}
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="font-semibold text-gray-900 dark:text-white">
                          {e.firstName} {e.lastName}
                        </h4>
                        <Badge color={STATUS_CONFIG[e.status].color} variant="light" size="xs">
                          {STATUS_CONFIG[e.status].label}
                        </Badge>
                        {e.inue && <Badge color="primary" variant="light" size="xs">INUE {e.inue}</Badge>}
                        {e.bourse && <Badge color="gray" variant="light" size="xs">Boursier</Badge>}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-300">{e.email}</p>
                      {e.profile.university && (
                        <p className="text-xs text-gray-400 mt-0.5">
                          {e.profile.university} • {e.profile.studyLevel}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-xs text-gray-400 shrink-0">
                    {e.registeredAt ? `Inscrit le ${formatDateShort(e.registeredAt)}` : ''}
                  </div>
                </div>
              </Card>
            ))}

            {!isLoading && etudiants.length === 0 && (
              <Card className="p-8 text-center">
                <UserX className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Aucun étudiant trouvé</h3>
                <p className="text-gray-500 dark:text-gray-400">Ajustez vos filtres ou attendez de nouvelles inscriptions.</p>
              </Card>
            )}
          </div>

          {meta && meta.totalPages > 1 && (
            <div className="flex items-center justify-center gap-3">
              <Button variant="outline" size="sm" disabled={!meta.hasPrev} onClick={() => goToPage(meta.page - 1)}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-sm text-gray-500">Page {meta.page} / {meta.totalPages}</span>
              <Button variant="outline" size="sm" disabled={!meta.hasNext} onClick={() => goToPage(meta.page + 1)}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </div>

      <EnrollStudentModal
        isOpen={isEnrollModalOpen}
        onClose={() => setIsEnrollModalOpen(false)}
        onSuccess={() => fetchEtudiants(filters)}
      />
    </PermissionGuard>
  );
};

export default EtudiantsListPage;
