// src/pages/documents/CategoriesPage.tsx

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FolderOpen, Plus, Edit, Trash2, Save, X,
  ArrowLeft, AlertCircle, CheckCircle, Search,
  FileText, Lock, Unlock
} from 'lucide-react';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { PermissionGuard } from '../../components/auth/PermissionGuard';
import { DocumentCategoryManager } from '../../components/documents/admin/DocumentCategoryManager';
import { useDocuments } from '../../hooks/useDocuments';
import { usePermission } from '../../hooks/usePermission';
import { useToast } from '../../hooks/useToast';
import { PermissionCode } from '../../types/auth';

export const CategoriesPage: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { categories, fetchCategories, isLoading } = useDocuments();
  const { can } = usePermission();

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleUpdate = () => {
    fetchCategories();
    toast({
      title: 'Catégories mises à jour',
      description: 'La liste des catégories a été actualisée.',
      variant: 'success',
    });
  };

  return (
    <PermissionGuard 
      minRoleLevel={2} 
      permission={PermissionCode.SERVICE_ADMIN}
      title="Gestion des catégories"
    >
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* En-tête */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={() => navigate('/documents')}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Retour
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  Catégories de documents
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  {categories.length} catégorie{categories.length > 1 ? 's' : ''} configurée{categories.length > 1 ? 's' : ''}
                </p>
              </div>
            </div>
          </div>

          {/* Gestionnaire */}
          <DocumentCategoryManager
            categories={categories}
            onUpdate={handleUpdate}
          />

          {/* Documentation */}
          <Card className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700">
            <div className="flex items-start gap-3">
              <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-800 dark:text-blue-300">
                  À quoi servent les catégories ?
                </p>
                <p className="text-sm text-blue-700 dark:text-blue-400">
                  Les catégories permettent d'organiser les documents et d'appliquer des règles de validation,
                  de versioning et de rétention. Chaque document peut être associé à une catégorie.
                </p>
                <ul className="mt-2 text-sm text-blue-700 dark:text-blue-400 list-disc list-inside space-y-1">
                  <li><strong>Validation requise</strong> : Les documents doivent être validés par un agent</li>
                  <li><strong>Versions max</strong> : Nombre maximum de versions autorisées</li>
                  <li><strong>Rétention</strong> : Durée de conservation des documents</li>
                </ul>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </PermissionGuard>
  );
};

export default CategoriesPage;