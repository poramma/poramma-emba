// ============================================================
// src/pages/demandes/DemandeTraitementPage.tsx
// ============================================================

import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DemandeDetail } from '../../components/demandes/DemandeDetail';
import { Button } from '../../components/ui/button';
import { ArrowLeft, FileCheck } from 'lucide-react';

export function DemandeTraitementPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/demandes')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour à la liste
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Traitement</h1>
          <p className="text-sm text-gray-500">Validation et traitement de la demande</p>
        </div>
      </div>

      <DemandeDetail demandeId={id} mode="traitement" />
    </div>
  );
}

export default DemandeTraitementPage;