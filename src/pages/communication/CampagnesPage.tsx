// src/pages/communication/CampagnesPage.tsx

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Filter, Search, Calendar } from 'lucide-react';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { PermissionGuard } from '../../components/auth/PermissionGuard';
import { CampagneDashboardStats } from '../../components/communication/dashboard/CampagneDashboardStats';
import { CampagneListTable } from '../../components/communication/dashboard/CampagneListTable';
import { useCommunication } from '../../hooks/useCommunication';
import { usePermission } from '../../hooks/usePermission';
import { PermissionCode } from '../../types/auth';

export const CampagnesPage: React.FC = () => {
  const navigate = useNavigate();
  const { 
    campagnes, 
    fetchCampagnes, 
    isLoading,
    duplicateCampagne,
    cancelCampagne,
  } = useCommunication();
  const { can } = usePermission();

  const canCreate = can(PermissionCode.COMM_CREATE);
  const canSend = can(PermissionCode.COMM_SEND);

  useEffect(() => {
    fetchCampagnes();
  }, []);

  const handleRowClick = (campagne: any) => {
    navigate(`/communication/campagnes/${campagne.id}`);
  };

  const handleDuplicate = async (id: string) => {
    const duplicated = await duplicateCampagne(id);
    navigate(`/communication/campagnes/${duplicated.id}/edit`);
  };

  const handleCancel = async (id: string) => {
    await cancelCampagne(id);
    await fetchCampagnes();
  };

  const handleEdit = (id: string) => {
    navigate(`/communication/campagnes/${id}/edit`);
  };

  const handleCreateNew = () => {
    navigate('/communication/campagnes/new');
  };

  const handleScheduledClick = () => {
    // Filtrer les campagnes programmées
    const scheduledCampagnes = campagnes.filter(c => c.status === 'SCHEDULED');
    // TODO: Appliquer un filtre dans la table
  };

  return (
    <PermissionGuard 
      minRoleLevel={4} 
      permission={PermissionCode.COMM_READ}
      title="Campagnes de communication"
    >
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* En-tête */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Campagnes de communication
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Gérez vos campagnes d'information et de communication
              </p>
            </div>
            {canCreate && (
              <Button variant="primary" onClick={handleCreateNew}>
                <Plus className="w-4 h-4 mr-2" />
                Nouvelle campagne
              </Button>
            )}
          </div>

          {/* Statistiques */}
          <CampagneDashboardStats 
            campagnes={campagnes}
            isLoading={isLoading}
            onScheduledClick={handleScheduledClick}
          />

          {/* Liste des campagnes */}
          <CampagneListTable
            campagnes={campagnes}
            isLoading={isLoading}
            onRowClick={handleRowClick}
            onDuplicate={handleDuplicate}
            onCancel={handleCancel}
            onEdit={handleEdit}
            onCreateNew={handleCreateNew}
            canCreate={canCreate}
          />
        </div>
      </div>
    </PermissionGuard>
  );
};

export default CampagnesPage;