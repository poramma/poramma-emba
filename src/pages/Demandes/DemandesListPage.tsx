// ============================================================
// src/pages/demandes/DemandesListPage.tsx
// ============================================================

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { DemandeFilters } from '../../components/demandes/DemandeFilters';
import { DemandeList } from '../../components/demandes/DemandeList';
import { Button } from '../../components/ui/button';
import { Plus } from 'lucide-react';

export function DemandesListPage() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Demandes consulaires</h1>
          <p className="text-gray-500 mt-1">Gestion des demandes et traitements</p>
        </div>
        {/**
         * <Button onClick={() => navigate('/demandes')}>
          <Plus className="h-4 w-4 mr-2" />
          Nouvelle demande
        </Button>
         */}
        
      </div>

      <DemandeFilters />
      <DemandeList />
    </div>
  );
}

export default DemandesListPage;