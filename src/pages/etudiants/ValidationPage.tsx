// src/pages/etudiants/ValidationPage.tsx

import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, ChevronRight } from 'lucide-react';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { PermissionGuard } from '../../components/auth/PermissionGuard';
import { useEtudiants } from '../../hooks/useEtudiants';
import { EtudiantStatus } from '../../types/etudiant';
import { PermissionCode } from '../../types/auth';
import { formatDateShort } from '../../lib/date';

/**
 * File d'attente : uniquement les dossiers PENDING — la validation elle-même
 * (une seule étape, pas de multi-niveaux) se fait sur la page de détail.
 */
const ValidationPage: React.FC = () => {
  const navigate = useNavigate();
  const { etudiants, isLoading, fetchEtudiants } = useEtudiants();

  useEffect(() => {
    fetchEtudiants({ status: EtudiantStatus.PENDING, page: 1, limit: 50 });
  }, []);

  return (
    <PermissionGuard minRoleLevel={3} permission={PermissionCode.ETUDIANT_VALIDATE} title="Validation des étudiants">
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-5xl mx-auto space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Validation des étudiants</h1>
            <p className="text-sm text-gray-500 mt-1">Dossiers en attente d'examen</p>
          </div>

          <div className="space-y-3">
            {isLoading && (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500" />
              </div>
            )}

            {!isLoading && etudiants.map((e) => (
              <Card key={e.id} className="p-4 hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate(`/etudiants/${e.id}`)}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 font-bold">
                      {(e.firstName?.charAt(0) ?? '?').toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{e.firstName} {e.lastName}</p>
                      <p className="text-sm text-gray-500">{e.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge color="warning" variant="light" size="xs">
                      <Clock className="w-3 h-3 mr-1" /> {e.registeredAt ? formatDateShort(e.registeredAt) : ''}
                    </Badge>
                    <Button variant="ghost" size="sm">
                      Examiner <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}

            {!isLoading && etudiants.length === 0 && (
              <Card className="p-8 text-center">
                <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Aucun dossier en attente</h3>
                <p className="text-gray-500 dark:text-gray-400">Tous les étudiants inscrits ont été examinés.</p>
              </Card>
            )}
          </div>
        </div>
      </div>
    </PermissionGuard>
  );
};

export default ValidationPage;
