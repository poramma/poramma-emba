// src/pages/services/ServiceDetailPage.tsx

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Edit, Trash2, Calendar, Clock, Users, 
  DollarSign, FileText, CheckCircle, XCircle, 
  Shield, AlertCircle, Plus, Eye
} from 'lucide-react';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Tabs } from '../../components/ui/tabs';
import { PermissionGuard } from '../../components/auth/PermissionGuard';
import { useServices } from '../../hooks/useServices';
import { usePermission } from '../../hooks/usePermission';
import { ScheduleEditor } from '../../components/services/ScheduleEditor';
import { RequirementForm } from '../../components/services/RequirementForm';
import { formatDateShort, formatTime } from '../../lib/date';
import { SubService, Requirement } from '../../types/services';

type TabType = 'info' | 'schedules' | 'requirements' | 'agents';

export const ServiceDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { 
    subServices, 
    getSubServiceById,
    getTarifLabel,
    getRequirementsForSubService,
    updateSubService,
    toggleSubServiceActive,
    deleteSubService,
    isLoading 
  } = useServices();
  const { canManageServices } = usePermission();

  const [subService, setSubService] = useState<SubService | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('info');
  const [showRequirementForm, setShowRequirementForm] = useState(false);
  const [editingRequirement, setEditingRequirement] = useState<Requirement | null>(null);

  useEffect(() => {
    if (id) {
      const found = getSubServiceById(id);
      setSubService(found || null);
    }
  }, [id, getSubServiceById, subServices]);

  const handleToggleActive = async () => {
    if (!subService) return;
    await toggleSubServiceActive(subService.id);
    const updated = getSubServiceById(subService.id);
    setSubService(updated || null);
  };

  const handleDelete = async () => {
    if (!subService) return;
    if (!window.confirm(`Supprimer définitivement "${subService.name}" ?`)) return;
    
    try {
      // TODO: Appel API
      // await api.delete(`/sub-services/${subService.id}`);
      await deleteSubService(subService.id);
      navigate('/services');
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const handleRequirementSuccess = () => {
    setShowRequirementForm(false);
    setEditingRequirement(null);
    // Rafraîchir les données
    if (id) {
      const updated = getSubServiceById(id);
      setSubService(updated || null);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div>
      </div>
    );
  }

  if (!subService) {
    return (
      <PermissionGuard minRoleLevel={3}>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
          <div className="max-w-4xl mx-auto">
            <Card className="p-8 text-center">
              <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Service introuvable
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                Le service demandé n'existe pas ou a été supprimé.
              </p>
              <Button className="mt-4" variant="primary" onClick={() => navigate('/services')}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Retour aux services
              </Button>
            </Card>
          </div>
        </div>
      </PermissionGuard>
    );
  }

  const requirements = getRequirementsForSubService(subService.id);

  return (
    <PermissionGuard minRoleLevel={3}>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* En-tête */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={() => navigate('/services')}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Retour
              </Button>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {subService.name}
                  </h1>
                  <Badge color="light" variant="light" size="sm">
                    {subService.code}
                  </Badge>
                  <Badge color={subService.active ? 'success' : 'error'} variant="solid" size="sm">
                    {subService.active ? 'Actif' : 'Inactif'}
                  </Badge>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  {subService.description || 'Aucune description'}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {canManageServices() && (
                <>
                  <Button variant="outline" onClick={handleToggleActive}>
                    {subService.active ? (
                      <>
                        <XCircle className="w-4 h-4 mr-2" />
                        Désactiver
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Activer
                      </>
                    )}
                  </Button>
                  <Button variant="outline" onClick={() => navigate(`/services/${subService.id}/edit`)}>
                    <Edit className="w-4 h-4 mr-2" />
                    Modifier
                  </Button>
                  <Button variant="error" onClick={handleDelete}>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Supprimer
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Statistiques rapides */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="p-3 text-center">
              <div className="text-sm text-gray-500">Tarif</div>
              <div className="font-semibold text-gray-900 dark:text-white">
                {getTarifLabel(subService)}
              </div>
            </Card>
            <Card className="p-3 text-center">
              <div className="text-sm text-gray-500">SLA</div>
              <div className="font-semibold text-gray-900 dark:text-white">
                {subService.slaDays} jours
              </div>
            </Card>
            <Card className="p-3 text-center">
              <div className="text-sm text-gray-500">Sur place</div>
              <div className="font-semibold text-gray-900 dark:text-white">
                {subService.requiresInPerson ? 'Oui' : 'Non'}
              </div>
            </Card>
            <Card className="p-3 text-center">
              <div className="text-sm text-gray-500">Personnalisable</div>
              <div className="font-semibold text-gray-900 dark:text-white">
                {subService.allowCustomRequest ? 'Oui' : 'Non'}
              </div>
            </Card>
          </div>

          {/* Onglets */}
          <Card className="p-4">
            <Tabs
              tabs={[
                { id: 'info', label: 'Informations', icon: <FileText className="w-4 h-4" /> },
                { id: 'schedules', label: 'Horaires', icon: <Calendar className="w-4 h-4" /> },
                { id: 'requirements', label: 'Documents requis', icon: <Shield className="w-4 h-4" /> },
                { id: 'agents', label: 'Agents', icon: <Users className="w-4 h-4" /> },
              ]}
              activeTab={activeTab}
              onTabChange={(id) => setActiveTab(id as TabType)}
            />
          </Card>

          {/* Contenu des onglets */}
          {activeTab === 'info' && (
            <Card className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Informations générales
                  </h4>
                  <dl className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-gray-500">Code</dt>
                      <dd className="font-medium text-gray-900 dark:text-white">{subService.code}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-500">Catégorie</dt>
                      <dd className="font-medium text-gray-900 dark:text-white">
                        {subService.service?.name || 'Non catégorisé'}
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-500">Date de création</dt>
                      <dd className="font-medium text-gray-900 dark:text-white">
                        {formatDateShort(subService.createdAt)}
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-500">Statut</dt>
                      <dd>
                        <Badge color={subService.active ? 'success' : 'error'} variant="light">
                          {subService.active ? 'Actif' : 'Inactif'}
                        </Badge>
                      </dd>
                    </div>
                  </dl>
                </div>
                <div>
                  <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Description
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    {subService.description || 'Aucune description disponible.'}
                  </p>
                  <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <p className="text-sm text-gray-500">
                      <strong>SLA:</strong> {subService.slaDays} jours ouvrés
                    </p>
                    <p className="text-sm text-gray-500">
                      <strong>Tarif:</strong> {getTarifLabel(subService)}
                    </p>
                    <p className="text-sm text-gray-500">
                      <strong>Présence requise:</strong> {subService.requiresInPerson ? 'Oui' : 'Non'}
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {activeTab === 'schedules' && (
            <Card className="p-6">
              <ScheduleEditor
                subServiceId={subService.id}
                schedules={subService.schedules}
                readOnly={!canManageServices()}
                onUpdate={() => {
                  const updated = getSubServiceById(subService.id);
                  setSubService(updated || null);
                }}
              />
            </Card>
          )}

          {activeTab === 'requirements' && (
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-medium text-gray-700 dark:text-gray-300">
                  Documents et prérequis
                </h4>
                {canManageServices() && (
                  <Button size="sm" onClick={() => {
                    setEditingRequirement(null);
                    setShowRequirementForm(true);
                  }}>
                    <Plus className="w-4 h-4 mr-1" />
                    Ajouter un document
                  </Button>
                )}
              </div>

              {requirements.length === 0 ? (
                <div className="text-center py-8">
                  <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Aucun document requis pour ce service</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {requirements.map((req) => (
                    <Card key={req.id} className="p-4 flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-gray-400" />
                          <span className="font-medium text-gray-900 dark:text-white">
                            {req.label}
                          </span>
                          <Badge color={req.required ? 'warning' : 'light'} variant="light" size="xs">
                            {req.required ? 'Obligatoire' : 'Optionnel'}
                          </Badge>
                          <Badge color="light" variant="light" size="xs">
                            {req.type}
                          </Badge>
                        </div>
                        {req.description && (
                          <p className="text-sm text-gray-500 mt-1">{req.description}</p>
                        )}
                        <p className="text-xs text-gray-400 mt-1">Clé: {req.key}</p>
                      </div>
                      {canManageServices() && (
                        <div className="flex gap-1">
                          <Button
                            size="xs"
                            variant="ghost"
                            onClick={() => {
                              setEditingRequirement(req);
                              setShowRequirementForm(true);
                            }}
                          >
                            <Edit className="w-3 h-3" />
                          </Button>
                          <Button
                            size="xs"
                            variant="ghost"
                            onClick={() => {
                              if (window.confirm(`Supprimer "${req.label}" ?`)) {
                                // TODO: Appel API
                                // await api.delete(`/requirements/${req.id}`);
                              }
                            }}
                          >
                            <Trash2 className="w-3 h-3 text-red-500" />
                          </Button>
                        </div>
                      )}
                    </Card>
                  ))}
                </div>
              )}
            </Card>
          )}

          {activeTab === 'agents' && (
            <Card className="p-6">
              <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-4">
                Agents assignés
              </h4>
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Aucun agent assigné à ce service</p>
                {canManageServices() && (
                  <Button className="mt-4" variant="outline" onClick={() => navigate('/services/affectation')}>
                    Gérer les affectations
                  </Button>
                )}
              </div>
            </Card>
          )}
        </div>

        {/* Modal de formulaire de document */}
        <RequirementForm
          isOpen={showRequirementForm}
          onClose={() => {
            setShowRequirementForm(false);
            setEditingRequirement(null);
          }}
          onSuccess={handleRequirementSuccess}
          subServiceId={subService.id}
          editData={editingRequirement}
        />
      </div>
    </PermissionGuard>
  );
};

export default ServiceDetailPage;