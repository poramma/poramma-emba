// src/pages/rendez-vous/CalendrierPage.tsx

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Calendar, CalendarDays, CalendarRange, RefreshCw, User, Search, X } from 'lucide-react';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Select } from '../../components/ui/select';
import { Badge } from '../../components/ui/badge';
import { Tabs } from '../../components/ui/tabs';
import { CalendrierJour } from '../../components/rendez-vous/CalendrierJour';
import { CalendrierSemaine } from '../../components/rendez-vous/CalendrierSemaine';
import { CalendrierMois } from '../../components/rendez-vous/CalendrierMois';
import { RendezVousCard } from '../../components/rendez-vous/RendezVousCard';
import { RendezVousForm } from '../../components/rendez-vous/RendezVousForm';
import { PrintRdvJour } from '../../components/rendez-vous/PrintRdvJour';
import { DisponibiliteForm } from '../../components/rendez-vous/DisponibiliteForm';
import { useRendezVous } from '../../hooks/useRendezVous';
import { useAuth } from '../../hooks/useAuth';
import { usePermission } from '../../hooks/usePermission';
import { formatDateShort } from '../../lib/date';

type VueCalendrier = 'jour' | 'semaine' | 'mois';

export const CalendrierPage: React.FC = () => {
  const { user } = useAuth();
  const { canPrintDailySchedule, canManageServices } = usePermission();
  const { selectedDate, setSelectedDate, refreshJour, rendezVous } = useRendezVous();

  const [vue, setVue] = useState<VueCalendrier>('jour');
  const [showNewRdv, setShowNewRdv] = useState(false);
  const [showPrint, setShowPrint] = useState(false);
  const [showDisponibilites, setShowDisponibilites] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRdvId, setSelectedRdvId] = useState<string | null>(null);

  // Filtrer les rendez-vous par recherche
  const filteredRendezVous = useMemo(() => {
    if (!searchQuery.trim()) return [];
    
    const query = searchQuery.toLowerCase().trim();
    return rendezVous.filter((rdv: any) => {
      const firstName = rdv.user?.profile?.firstName?.toLowerCase() || '';
      const lastName = rdv.user?.profile?.lastName?.toLowerCase() || '';
      const fullName = `${firstName} ${lastName}`.toLowerCase();
      const email = rdv.user?.email?.toLowerCase() || '';
      const ticketId = rdv.ticketId?.toLowerCase() || '';
      const inue = rdv.user?.profile?.inue?.toLowerCase() || '';
      const motif = rdv.motif?.toLowerCase() || '';
      
      return (
        fullName.includes(query) ||
        firstName.includes(query) ||
        lastName.includes(query) ||
        email.includes(query) ||
        ticketId.includes(query) ||
        inue.includes(query) ||
        motif.includes(query)
      );
    });
  }, [rendezVous, searchQuery]);

  const hasSearch = searchQuery.trim().length > 0;

  const handleDateChange = useCallback((date: string) => {
    setSelectedDate(date);
  }, [setSelectedDate]);

  /**
   * Gère le clic sur un jour dans les vues mois/semaine
   * Change la vue en "jour" et sélectionne la date
   */
  const handleDayClick = useCallback((date: string) => {
    setSelectedDate(date);
    setVue('jour');
  }, [setSelectedDate]);

  /**
   * Gère le clic sur un rendez-vous individuel
   * Redirige vers la page de détails du rendez-vous
   */
  const handleRdvClick = useCallback((rdvId: string) => {
    // Navigation vers la page de détails du rendez-vous
    // Vous pouvez utiliser navigate de react-router-dom
    setSelectedRdvId(rdvId);
    // navigate(`/rendez-vous/${rdvId}`);
  }, []);

  const handleRefresh = useCallback(async () => {
    await refreshJour();
  }, [refreshJour]);

  useEffect(() => {
    refreshJour();
  }, [selectedDate]);

  const handleClearSearch = () => {
    setSearchQuery('');
  };

  const handleRdvAction = (action: string, rdv: any) => {
    refreshJour();
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* En-tête */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Agenda des rendez-vous
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Gérez tous les rendez-vous consulaires
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="primary"
              onClick={() => setShowNewRdv(true)}
            >
              <Calendar className="w-4 h-4 mr-2" />
              Nouveau RDV
            </Button>
            
            {canPrintDailySchedule() && (
              <Button
                variant="outline"
                onClick={() => setShowPrint(true)}
              >
                Imprimer planning
              </Button>
            )}
            
            {canManageServices() && (
              <Button
                variant="outline"
                onClick={() => setShowDisponibilites(true)}
              >
                Disponibilités
              </Button>
            )}
          </div>
        </div>

        {/* Barre d'outils */}
        <Card className="p-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            {/* Tabs de navigation - cachés en mode recherche */}
            {!hasSearch && (
              <div className="flex items-center gap-4">
                <Tabs
                  tabs={[
                    { id: 'jour', label: 'Jour', icon: <Calendar className="w-4 h-4 text-gray-600 dark:text-gray-400" /> },
                    { id: 'semaine', label: 'Semaine', icon: <CalendarDays className="w-4 h-4 text-gray-600 dark:text-gray-400" /> },
                    { id: 'mois', label: 'Mois', icon: <CalendarRange className="w-4 h-4 text-gray-600 dark:text-gray-400" /> },
                  ]}
                  activeTab={vue}
                  onTabChange={(id) => setVue(id as VueCalendrier)}
                />
              </div>
            )}
            
            {/* Zone de recherche et actions */}
            <div className={`flex flex-col sm:flex-row sm:items-center gap-3 ${!hasSearch ? 'lg:ml-auto' : 'w-full'}`}>
              <div className={`relative ${hasSearch ? 'w-full' : 'flex-1 sm:max-w-md'}`}>
                <Input
                  placeholder="Rechercher par étudiant, email, INUE ou ticket..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  startIcon={<Search className="w-4 h-4" />}
                  endIcon={
                    searchQuery && (
                      <button
                        aria-label="Fermer"
                        onClick={handleClearSearch}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )
                  }
                  className="w-full"
                />
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                startIcon={<RefreshCw className="w-4 h-4" />}
              >
                Rafraîchir
              </Button>
            </div>
          </div>

          {/* Indicateur de recherche */}
          {hasSearch && (
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2">
                <Badge color="info" variant="light">
                  <Search className="w-3 h-3 mr-1" />
                  Résultats de recherche
                </Badge>
                <span className="text-sm text-gray-500">
                  {filteredRendezVous.length} rendez-vous trouvé(s)
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearSearch}
                startIcon={<X className="w-4 h-4" />}
              >
                Effacer
              </Button>
            </div>
          )}
        </Card>

        {/* Contenu principal */}
        {hasSearch ? (
          // Mode recherche : afficher les résultats sous forme de liste
          <Card className="p-6">
            <div className="space-y-4">
              {filteredRendezVous.length === 0 ? (
                <div className="text-center py-12">
                  <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    Aucun résultat trouvé
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400">
                    Aucun rendez-vous ne correspond à votre recherche "{searchQuery}"
                  </p>
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={handleClearSearch}
                  >
                    Effacer la recherche
                  </Button>
                </div>
              ) : (
                filteredRendezVous.map((rdv: any) => (
                  <RendezVousCard
                    key={rdv.id}
                    rendezVous={rdv}
                    onAction={handleRdvAction}
                    onView={(rdv) => {
                      handleRdvClick(rdv.id);
                    }}
                    compact={false}
                    showActions={true}
                  />
                ))
              )}
            </div>
          </Card>
        ) : (
          // Mode normal : afficher le calendrier
          <Card className="p-6">
            {vue === 'jour' && (
              <CalendrierJour
                date={selectedDate}
                onDateChange={handleDateChange}
                onRdvClick={handleRdvClick}
              />
            )}
            {vue === 'semaine' && (
              <CalendrierSemaine
                date={selectedDate}
                onDateChange={handleDateChange}
                onDayClick={handleDayClick}
                onRdvClick={handleRdvClick}
              />
            )}
            {vue === 'mois' && (
              <CalendrierMois
                date={selectedDate}
                onDateChange={handleDateChange}
                onDayClick={handleDayClick}
                onRdvClick={handleRdvClick}
              />
            )}
          </Card>
        )}
      </div>

      {/* Modals */}
      <RendezVousForm
        isOpen={showNewRdv}
        onClose={() => setShowNewRdv(false)}
        onSuccess={() => {
          setShowNewRdv(false);
          refreshJour();
        }}
        initialData={{ date: selectedDate }}
      />

      <PrintRdvJour
        isOpen={showPrint}
        onClose={() => setShowPrint(false)}
        date={selectedDate}
      />

      <DisponibiliteForm
        isOpen={showDisponibilites}
        onClose={() => setShowDisponibilites(false)}
        agentId={user?.id}
        onSuccess={() => {
          setShowDisponibilites(false);
          refreshJour();
        }}
      />
    </div>
  );
};

export default CalendrierPage;