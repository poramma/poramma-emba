// src/pages/communication/CampagneDetailPage.tsx

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { PermissionGuard } from '../../components/auth/PermissionGuard';
import { CampagneDetailHeader } from '../../components/communication/detail/CampagneDetailHeader';
import { CampagnePreview } from '../../components/communication/CampagnePreview';
import { CampagneStatsPanel } from '../../components/communication/detail/CampagneStatsPanel';
import { CampagneDeliveryTable } from '../../components/communication/detail/CampagneDeliveryTable';
import { useCommunication } from '../../hooks/useCommunication';
import { usePermission } from '../../hooks/usePermission';
import { PermissionCode } from '../../types/auth';
import { CampagneStatus } from '../../types/communication';

export const CampagneDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { 
    selectedCampagne, 
    deliveries,
    fetchCampagneById,
    fetchDeliveries,
    duplicateCampagne,
    cancelCampagne,
    resendToFailed,
    isLoading,
  } = useCommunication();
  const { can } = usePermission();

  const [isPolling, setIsPolling] = useState(false);

  const canCreate = can(PermissionCode.COMM_CREATE);
  const canSend = can(PermissionCode.COMM_SEND);

  useEffect(() => {
    if (id) {
      fetchCampagneById(id);
    }
  }, [id]);

  // Polling pour les campagnes en cours d'envoi
  useEffect(() => {
    if (selectedCampagne?.status === CampagneStatus.SENDING) {
      setIsPolling(true);
      const interval = setInterval(() => {
        if (id) {
          fetchCampagneById(id);
          fetchDeliveries(id);
        }
      }, 3000);

      return () => {
        clearInterval(interval);
        setIsPolling(false);
      };
    }
    setIsPolling(false);
  }, [selectedCampagne?.status, id]);

  const handleDuplicate = async () => {
    if (!id) return;
    const duplicated = await duplicateCampagne(id);
    navigate(`/communication/campagnes/${duplicated.id}/edit`);
  };

  const handleCancel = async () => {
    if (!id) return;
    await cancelCampagne(id);
    await fetchCampagneById(id);
  };

  const handleEdit = () => {
    if (id) {
      navigate(`/communication/campagnes/${id}/edit`);
    }
  };

  const handleBack = () => {
    navigate('/communication/campagnes');
  };

  const handleResendFailed = async () => {
    if (id) {
      await resendToFailed(id);
      await fetchDeliveries(id);
    }
  };

  if (isLoading && !selectedCampagne) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500 mx-auto mb-4"></div>
          <p className="text-gray-500">Chargement de la campagne...</p>
        </div>
      </div>
    );
  }

  if (!selectedCampagne) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <Card className="p-8 text-center">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Campagne introuvable
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            La campagne que vous recherchez n'existe pas ou a été supprimée.
          </p>
          <Button className="mt-4" variant="primary" onClick={handleBack}>
            Retour aux campagnes
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <PermissionGuard 
      minRoleLevel={4} 
      permission={PermissionCode.COMM_READ}
      title="Détail de la campagne"
    >
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* En-tête */}
          <CampagneDetailHeader
            campagne={selectedCampagne}
            onDuplicate={handleDuplicate}
            onCancel={handleCancel}
            onEdit={handleEdit}
            onBack={handleBack}
          />

          {/* Indicateur de polling */}
          {isPolling && (
            <div className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400">
              <RefreshCw className="w-4 h-4 animate-spin" />
              Mise à jour en temps réel...
            </div>
          )}

          {/* Grille principale */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Aperçu */}
            <div>
              <CampagnePreview 
                campagne={selectedCampagne}
                showDate
                createdAt={selectedCampagne.createdAt}
              />
            </div>

            {/* Statistiques */}
            <div className="lg:col-span-2">
              <CampagneStatsPanel
                stats={selectedCampagne.stats}
                status={selectedCampagne.status}
                campagneId={id}
              />
            </div>
          </div>

          {/* Livraisons */}
          {selectedCampagne.status === CampagneStatus.SENT && (
            <CampagneDeliveryTable
              deliveries={deliveries}
              isLoading={isLoading}
              onResendFailed={handleResendFailed}
            />
          )}
        </div>
      </div>
    </PermissionGuard>
  );
};

export default CampagneDetailPage;