// src/pages/services/ServicesPage.tsx

import React, { useState } from 'react';
import { Plus, FileText, BarChart3, Settings, DollarSign, CheckCircle, Eye, Calendar } from 'lucide-react';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Tabs } from '../../components/ui/tabs';
import { ServiceList } from '../../components/services/ServiceList';
import { ServiceForm } from '../../components/services/ServiceForm';
import { PermissionGuard } from '../../components/auth/PermissionGuard';
import { useServices } from '../../hooks/useServices';
import { usePermission } from '../../hooks/usePermission';
import { useNavigate } from 'react-router-dom';
import { PermissionCode } from '../../types/auth';
import { SubService } from '../../types/services';

type TabType = 'list' | 'stats' | 'settings';

export const ServicesPage: React.FC = () => {
  const navigate = useNavigate();
  const { 
    services, 
    subServices, 
    selectedSubService, 
    selectSubService, 
    getTarifLabel 
  } = useServices();
  const { canManageServices } = usePermission();

  const [activeTab, setActiveTab] = useState<TabType>('list');
  const [showForm, setShowForm] = useState(false);
  const [editingSubService, setEditingSubService] = useState<SubService | null>(null);

  const selectedSub = selectedSubService || subServices[0];

  const getServiceStats = () => {
    const total = subServices.length;
    const active = subServices.filter(s => s.active).length;
    const withAppointment = services.filter(s => s.requiresAppointment).length;
    const free = subServices.filter(s => s.basePrice === 0 || s.basePrice === null).length;
    return { total, active, withAppointment, free };
  };

  const stats = getServiceStats();

  const handleSelectSubService = (subService: SubService) => {
    selectSubService(subService.id);
  };

  const handleEditSubService = (subService: SubService) => {
    setEditingSubService(subService);
    setShowForm(true);
  };

  const handleAdd = () => {
    setEditingSubService(null);
    setShowForm(true);
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingSubService(null);
  };

  return (
    <PermissionGuard minRoleLevel={3} title="Accès restreint">
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* En-tête */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Services consulaires
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Gestion des services et prestations consulaires
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {canManageServices() && (
                <Button variant="primary" onClick={handleAdd}>
                  <Plus className="w-4 h-4 mr-2" />
                  Nouveau service
                </Button>
              )}
              <Button variant="outline" onClick={() => navigate('/services/horaires')}>
                <Calendar className="w-4 h-4 mr-2" />
                Horaires
              </Button>
              <Button variant="outline" onClick={() => navigate('/services/affectation')}>
                <Eye className="w-4 h-4 mr-2" />
                Agents
              </Button>
            </div>
          </div>

          {/* Statistiques */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="p-4 text-center">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</div>
              <div className="text-sm text-gray-500">Total services</div>
            </Card>
            <Card className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{stats.active}</div>
              <div className="text-sm text-gray-500">Actifs</div>
            </Card>
            <Card className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.withAppointment}</div>
              <div className="text-sm text-gray-500">Avec rendez-vous</div>
            </Card>
            <Card className="p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">{stats.free}</div>
              <div className="text-sm text-gray-500">Gratuits</div>
            </Card>
          </div>

          {/* Onglets */}
          <Card className="p-4">
<Tabs
            tabs={[
              { id: 'list', label: 'Liste des services', icon:  <FileText /> },
              { id: 'stats', label: 'Statistiques', icon: <BarChart3 /> },
              { id: 'settings', label: 'Configuration', icon: <Settings /> },
            ]}
            activeTab={activeTab}
            onTabChange={(id) => setActiveTab(id as TabType)}
          />
          </Card>

          {/* Contenu */}
          {activeTab === 'list' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <ServiceList
                  onSelectSubService={handleSelectSubService}
                  onEdit={handleEditSubService}
                  showActions={canManageServices()}
                />
              </div>

              {/* Détail minimal du service sélectionné */}
              <div>
                {selectedSub ? (
                  <Card className="p-4 sticky top-4">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
                      Résumé du service
                    </h3>
                    
                    <div className="space-y-3">
                      <div>
                        <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                          {selectedSub.name}
                        </h4>
                        <p className="text-sm text-gray-500">{selectedSub.code}</p>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-gray-500">Tarif:</span>
                          <span className="ml-2 font-medium">
                            {getTarifLabel(selectedSub)}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500">SLA:</span>
                          <span className="ml-2 font-medium">{selectedSub.slaDays} jours</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${selectedSub.active ? 'bg-green-500' : 'bg-red-500'}`}></span>
                        <span className="text-sm text-gray-600 dark:text-gray-300">
                          {selectedSub.active ? 'Actif' : 'Inactif'}
                        </span>
                      </div>

                      {/* Documents requis - résumé */}
                      {selectedSub.requirements && selectedSub.requirements.length > 0 && (
                        <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                          <p className="text-xs text-gray-500 font-medium">Documents requis</p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {selectedSub.requirements.slice(0, 3).map((req) => (
                              <span key={req.id} className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs">
                                {req.label}
                              </span>
                            ))}
                            {selectedSub.requirements.length > 3 && (
                              <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs">
                                +{selectedSub.requirements.length - 3}
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      <div className="flex flex-col gap-2 pt-3 border-t border-gray-200 dark:border-gray-700">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="w-full justify-center"
                          onClick={() => navigate(`/services/${selectedSub.id}/detail`)}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          Voir les détails complets
                        </Button>
                        {canManageServices() && (
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="w-full justify-center"
                            onClick={() => handleEditSubService(selectedSub)}
                          >
                            Modifier
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card>
                ) : (
                  <Card className="p-8 text-center">
                    <p className="text-gray-500 dark:text-gray-400">
                      Sélectionnez un service pour voir ses détails
                    </p>
                  </Card>
                )}
              </div>
            </div>
          )}

          {activeTab === 'stats' && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Statistiques des services
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                      <FileText className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Total sous-services</div>
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">
                        {subServices.length}
                      </div>
                    </div>
                  </div>
                </Card>
                <Card className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Actifs</div>
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">
                        {subServices.filter(s => s.active).length}
                      </div>
                    </div>
                  </div>
                </Card>
                <Card className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                      <DollarSign className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Gratuits</div>
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">
                        {subServices.filter(s => s.basePrice === 0 || s.basePrice === null).length}
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            </Card>
          )}

          {activeTab === 'settings' && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Configuration
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                Paramètres avancés des services consulaires.
              </p>
            </Card>
          )}
        </div>

        {/* Modal de formulaire */}
        <ServiceForm
          isOpen={showForm}
          onClose={() => {
            setShowForm(false);
            setEditingSubService(null);
          }}
          onSuccess={handleFormSuccess}
          editData={editingSubService}
        />
      </div>
    </PermissionGuard>
  );
};

export default ServicesPage;