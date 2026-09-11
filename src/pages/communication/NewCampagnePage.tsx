// src/pages/communication/NewCampagnePage.tsx

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { PermissionGuard } from '../../components/auth/PermissionGuard';
import { CampagneWizard } from '../../components/communication/wizard/CampagneWizard';
import { PermissionCode } from '../../types/auth';

export const NewCampagnePage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <PermissionGuard 
      minRoleLevel={4} 
      permission={PermissionCode.COMM_CREATE}
      title="Nouvelle campagne"
    >
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Bouton retour */}
          <Button 
            variant="ghost" 
            onClick={() => navigate('/communication/campagnes')}
            className="mb-6 -ml-2"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour aux campagnes
          </Button>

          {/* Wizard */}
          <CampagneWizard />
        </div>
      </div>
    </PermissionGuard>
  );
};

export default NewCampagnePage;