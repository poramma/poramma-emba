// ============================================================
// src/pages/demandes/DemandeDetailPage.tsx
// ============================================================

import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DemandeDetail } from '../../components/demandes/DemandeDetail';
import { Button } from '../../components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { usePermission } from '../../hooks/usePermission';
import { PermissionCode } from '../../types/auth';

export function DemandeDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { can } = usePermission();

  // Détecter le mode via les permissions de l'agent connecté
  const canValidate = can(PermissionCode.DEMANDE_VALIDATE);
  const isTraitement = canValidate;

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/demandes')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour
        </Button>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {isTraitement ? 'Traitement de la demande' : 'Détail de la demande'}
        </h1>
      </div>

      <DemandeDetail demandeId={id} mode={isTraitement ? 'traitement' : 'view'} />
    </div>
 );
}

export default DemandeDetailsPage;
