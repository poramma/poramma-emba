// src/pages/documents/DocumentsPage.tsx

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FolderOpen, FileText, Clock, CheckCircle, XCircle,
  AlertTriangle, Upload, Search, Filter, Plus,
  BarChart3, Activity, Users
} from 'lucide-react';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Tabs } from '../../components/ui/tabs';
import { PermissionGuard } from '../../components/auth/PermissionGuard';
import { DocumentDashboardStats } from '../../components/documents/dashboard/DocumentDashboardStats';
import { DocumentTypeChart } from '../../components/documents/dashboard/DocumentTypeChart';
import { DocumentActivityFeed } from '../../components/documents/dashboard/DocumentActivityFeed';
import { DocumentUpload } from '../../components/documents/DocumentUpload';
import { DocumentList } from '../../components/documents/DocumentList';
import { useDocuments } from '../../hooks/useDocuments';
import { usePermission } from '../../hooks/usePermission';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { PermissionCode } from '../../types/auth';
import { DocStatus } from '../../types/etudiant';

type TabType = 'overview' | 'recent' | 'upload';

export const DocumentsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const { 
    documents, 
    stats, 
    auditLogs,
    isLoading,
    fetchStats,
    fetchDocuments,
    fetchAuditLogs,
    fetchCategories,
    fetchGeneratedDocuments,
    downloadDocument,
  } = useDocuments();
  const { can } = usePermission();

  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [showUpload, setShowUpload] = useState(false);

  const canUpload = can(PermissionCode.DOCUMENT_UPLOAD);

  // Chargement initial
  useEffect(() => {
    fetchStats();
    fetchDocuments({ status: DocStatus.IN_REVIEW });
    fetchAuditLogs();
    fetchCategories();
    fetchGeneratedDocuments();
  }, []);

  const handleDocumentClick = (doc: any) => {
    navigate(`/documents/${doc.id}`);
  };

  const handleUploadSuccess = () => {
    setShowUpload(false);
    fetchDocuments();
    fetchStats();
    toast({
      title: 'Document téléversé',
      description: 'Le document a été ajouté avec succès.',
      variant: 'success',
    });
  };

  const handleDownload = async (doc: any) => {
    if (doc.fileId) {
      await downloadDocument(doc.fileId);
    }
  };

  const handleExpiringClick = () => {
    navigate('/documents/queue');
  };

  const recentDocuments = documents.slice(0, 5);

  return (
    <PermissionGuard 
      minRoleLevel={4} 
      permission={PermissionCode.DOCUMENT_READ}
      title="Gestion des documents"
    >
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* En-tête */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Gestion des documents
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Gérez tous les documents de la plateforme
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button 
                variant="outline" 
                onClick={() => navigate('/documents/queue')}
              >
                <Clock className="w-4 h-4 mr-2" />
                File d'attente
              </Button>
              <Button 
                variant="outline" 
                onClick={() => navigate('/documents/archive')}
              >
                <FolderOpen className="w-4 h-4 mr-2" />
                Archives
              </Button>
              {canUpload && (
                <Button 
                  variant="primary" 
                  onClick={() => setShowUpload(!showUpload)}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Téléverser
                </Button>
              )}
            </div>
          </div>

          {/* Upload panel */}
          {showUpload && (
            <DocumentUpload
              ownerUserId={user?.id || ''}
              onUploadSuccess={handleUploadSuccess}
              onUploadError={(error) => {
                toast({
                  title: 'Erreur',
                  description: error,
                  variant: 'error',
                });
              }}
              onClose={() => setShowUpload(false)}
            />
          )}

          {/* Statistiques */}
          <DocumentDashboardStats 
            stats={stats} 
            isLoading={isLoading}
            onExpiringClick={handleExpiringClick}
          />

          {/* Onglets */}
          <Card className="p-4">
            <Tabs
              tabs={[
                { id: 'overview', label: 'Vue d\'ensemble', icon: <BarChart3 /> },
                { id: 'recent', label: 'Documents récents', icon: <FileText /> },
                { id: 'upload', label: 'Téléverser', icon: <Upload /> },
              ]}
              activeTab={activeTab}
              onTabChange={(id) => setActiveTab(id as TabType)}
            />
          </Card>

          {/* Contenu des onglets */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Graphique */}
              <div className="lg:col-span-2">
                <DocumentTypeChart 
                  data={stats?.byType || []} 
                  isLoading={isLoading}
                />
              </div>

              {/* Activité récente */}
              <div className="lg:col-span-1">
                <DocumentActivityFeed 
                  logs={auditLogs || []} 
                  isLoading={isLoading}
                  maxItems={5}
                  onViewAll={() => navigate('/documents/audit')}
                />
              </div>

              {/* Actions rapides */}
              <div className="lg:col-span-3">
                <Card className="p-4">
                  <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Actions rapides
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <Button 
                      variant="outline" 
                      className="h-auto py-3 flex-col gap-1"
                      onClick={() => navigate('/documents/queue')}
                    >
                      <Clock className="w-5 h-5" />
                      <span className="text-xs">File d'attente</span>
                      {stats && stats.totalPending > 0 && (
                        <Badge color="warning" variant="solid" size="xs" className="mt-1">
                          {stats.totalPending}
                        </Badge>
                      )}
                    </Button>
                    <Button 
                      variant="outline" 
                      className="h-auto py-3 flex-col gap-1"
                      onClick={() => navigate('/documents/archive')}
                    >
                      <FolderOpen className="w-5 h-5" />
                      <span className="text-xs">Archives</span>
                    </Button>
                    <Button 
                      variant="outline" 
                      className="h-auto py-3 flex-col gap-1"
                      onClick={() => navigate('/documents/internal')}
                    >
                      <Users className="w-5 h-5" />
                      <span className="text-xs">Documents internes</span>
                    </Button>
                    <Button 
                      variant="outline" 
                      className="h-auto py-3 flex-col gap-1"
                      onClick={() => navigate('/documents/categories')}
                    >
                      <FolderOpen className="w-5 h-5" />
                      <span className="text-xs">Catégories</span>
                    </Button>
                  </div>
                </Card>
              </div>
            </div>
          )}

          {activeTab === 'recent' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Documents récents
                </h3>
                <Button variant="ghost" size="sm" onClick={() => navigate('/documents/queue')}>
                  Voir tout →
                </Button>
              </div>
              <DocumentList
                documents={recentDocuments}
                isLoading={isLoading}
                onRowClick={handleDocumentClick}
                onDownload={handleDownload}
                showOwnerColumn={true}
                emptyMessage="Aucun document récent"
              />
            </div>
          )}

          {activeTab === 'upload' && canUpload && (
            <DocumentUpload
              ownerUserId={user?.id || ''}
              onUploadSuccess={handleUploadSuccess}
              onUploadError={(error) => {
                toast({
                  title: 'Erreur',
                  description: error,
                  variant: 'error',
                });
              }}
            />
          )}
        </div>
      </div>
    </PermissionGuard>
  );
};

export default DocumentsPage;