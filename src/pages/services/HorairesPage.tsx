// src/pages/services/HorairesPage.tsx

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Calendar, Clock, Plus, Edit, Trash2, 
  CheckCircle, XCircle, Users, Filter, Search
} from 'lucide-react';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Select } from '../../components/ui/select';
import { Badge } from '../../components/ui/badge';
import { PermissionGuard } from '../../components/auth/PermissionGuard';
import { useServices } from '../../hooks/useServices';
import { usePermission } from '../../hooks/usePermission';
import { ScheduleEditor } from '../../components/services/ScheduleEditor';
import { formatTime } from '../../lib/date';
import { ServiceSchedule } from '../../types/services';

const DAYS = [
  { value: 'all', label: 'Tous les jours' },
  { value: '1', label: 'Lundi' },
  { value: '2', label: 'Mardi' },
  { value: '3', label: 'Mercredi' },
  { value: '4', label: 'Jeudi' },
  { value: '5', label: 'Vendredi' },
  { value: '6', label: 'Samedi' },
  { value: '7', label: 'Dimanche' },
];

export const HorairesPage: React.FC = () => {
  const navigate = useNavigate();
  const { services, subServices, getSubServiceById, isLoading } = useServices();
  const { canManageServices } = usePermission();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedService, setSelectedService] = useState<string>('all');
  const [selectedDay, setSelectedDay] = useState<string>('all');
  const [selectedSubService, setSelectedSubService] = useState<string | null>(null);
  const [showScheduleEditor, setShowScheduleEditor] = useState(false);

  // Filtrer les sous-services
  const filteredSubServices = subServices.filter(sub => {
    if (selectedService !== 'all' && sub.serviceId !== selectedService) return false;
    if (searchQuery && !sub.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const selectedSub = selectedSubService ? getSubServiceById(selectedSubService) : null;

  const handleSelectSubService = (id: string) => {
    setSelectedSubService(id);
    setShowScheduleEditor(true);
  };

  return (
    <PermissionGuard minRoleLevel={3} title="Gestion des horaires">
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* En-tête */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={() => navigate('/services')}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Retour
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Gestion des horaires
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                  Configurez les plages horaires par service
                </p>
              </div>
            </div>
            {canManageServices() && selectedSubService && (
              <Button variant="primary" onClick={() => setShowScheduleEditor(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Ajouter un créneau
              </Button>
            )}
          </div>

          {/* Filtres */}
          <Card className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                placeholder="Rechercher un service..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                startIcon={<Search className="w-4 h-4" />}
              />
              <Select
                value={selectedService}
                onChange={(value) => setSelectedService(value)}
                options={[
                  { value: 'all', label: 'Toutes les catégories' },
                  ...services.map(s => ({ value: s.id, label: s.name })),
                ]}
              />
              <Select
                value={selectedDay}
                onChange={(value) => setSelectedDay(value)}
                options={DAYS}
              />
            </div>
          </Card>

          {/* Liste des services avec horaires */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredSubServices.map((sub) => {
              const filteredSchedules = sub.schedules.filter(s => {
                if (selectedDay !== 'all' && s.dayOfWeek !== parseInt(selectedDay)) return false;
                return true;
              });

              return (
                <Card
                  key={sub.id}
                  className={`p-4 hover:shadow-md transition-shadow cursor-pointer ${
                    selectedSubService === sub.id ? 'ring-2 ring-brand-500' : ''
                  }`}
                  onClick={() => handleSelectSubService(sub.id)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        {sub.name}
                      </h4>
                      <p className="text-sm text-gray-500">{sub.code}</p>
                    </div>
                    <Badge color={sub.active ? 'success' : 'error'} variant="light" size="xs">
                      {sub.active ? 'Actif' : 'Inactif'}
                    </Badge>
                  </div>

                  {filteredSchedules.length === 0 ? (
                    <div className="text-sm text-gray-500 text-center py-4">
                      <Clock className="w-5 h-5 mx-auto mb-1 text-gray-400" />
                      Aucun horaire configuré
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {filteredSchedules.map((schedule) => (
                        <div key={schedule.id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded-lg text-sm">
                          <div className="flex items-center gap-3">
                            <span className="font-medium text-gray-700 dark:text-gray-300">
                              {DAYS.find(d => parseInt(d.value) === schedule.dayOfWeek)?.label}
                            </span>
                            <span className="text-gray-600 dark:text-gray-400">
                              {formatTime(schedule.startTime)} - {formatTime(schedule.endTime)}
                            </span>
                            <Badge color={schedule.isActive ? 'success' : 'error'} variant="light" size="xs">
                              {schedule.isActive ? 'Actif' : 'Inactif'}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {schedule.slotDurationMinutes} min
                            </span>
                            <span className="flex items-center gap-1">
                              <Users className="w-3 h-3" />
                              {schedule.maxConcurrentSlots}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              );
            })}

            {filteredSubServices.length === 0 && (
              <div className="col-span-full">
                <Card className="p-8 text-center">
                  <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    Aucun service trouvé
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400">
                    Aucun service ne correspond à vos critères de recherche.
                  </p>
                </Card>
              </div>
            )}
          </div>
        </div>

        {/* Modal d'édition des horaires */}
        {selectedSubService && selectedSub && (
          <ScheduleEditor
            subServiceId={selectedSubService}
            schedules={selectedSub.schedules}
            readOnly={!canManageServices()}
            onUpdate={() => {
              // Rafraîchir les données
              const updated = getSubServiceById(selectedSubService);
              if (updated) {
                // Mettre à jour l'état local
              }
            }}
          />
        )}
      </div>
    </PermissionGuard>
  );
};

export default HorairesPage;