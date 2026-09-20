// src/pages/communication/EditCampagnePage.tsx

import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { PermissionGuard } from '../../components/auth/PermissionGuard';
import { CampagneWizard } from '../../components/communication/wizard/CampagneWizard';
import { useCommunication } from '../../hooks/useCommunication';
import { usePermission } from '../../hooks/usePermission';
import { PermissionCode } from '../../types/auth';
import { CampagneStatus } from '../../types/communication';

export const EditCampagnePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { selectedCampagne, fetchCampagneById, isLoading } = useCommunication();
  const { can } = usePermission();

  const canEdit = can(PermissionCode.COMM_CREATE);

  useEffect(() => {
    if (id) {
      fetchCampagneById(id);
    }
  }, [id]);

  // Vérifier si la campagne peut être modifiée
  const canEditCampagne = selectedCampagne &&
    [CampagneStatus.DRAFT, CampagneStatus.SCHEDULED].includes(selectedCampagne.status);

  // Si la campagne est chargée mais non modifiable, rediriger vers la page détail —
  // dans un effet, jamais pendant le rendu (React refuse un setState d'un autre
  // composant, ici RouterProvider, déclenché en plein rendu de celui-ci).
  useEffect(() => {
    if (!isLoading && selectedCampagne && !canEditCampagne) {
      navigate(`/communication/campagnes/${id}`);
    }
  }, [isLoading, selectedCampagne, canEditCampagne, id]);

  if (!isLoading && selectedCampagne && !canEditCampagne) {
    return null;
  }

  return (
    <PermissionGuard 
      minRoleLevel={4} 
      permission={PermissionCode.COMM_CREATE}
      title="Modifier la campagne"
    >
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Bouton retour */}
          <Button 
            variant="ghost" 
            onClick={() => navigate(`/communication/campagnes/${id}`)}
            className="mb-6 -ml-2"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour à la campagne
          </Button>

          {/* Avertissement si campagne non modifiable */}
          {selectedCampagne && !canEditCampagne && (
            <Card className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-yellow-800 dark:text-yellow-300">
                    Cette campagne ne peut pas être modifiée
                  </p>
                  <p className="text-sm text-yellow-700 dark:text-yellow-400">
                    Seules les campagnes en brouillon ou programmées peuvent être modifiées.
                  </p>
                </div>
              </div>
            </Card>
          )}

          {/* Wizard */}
          {canEditCampagne && (
            <CampagneWizard campagneId={id} />
          )}
        </div>
      </div>
    </PermissionGuard>
  );
};

export default EditCampagnePage;