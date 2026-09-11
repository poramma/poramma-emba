// src/components/rendez-vous/PrintRdvJour.tsx

import React, { useState } from 'react';
import { Printer, Download, Calendar, Users, Clock, FileText, CheckCircle, AlertCircle, Search, Filter } from 'lucide-react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select } from '../ui/select';
import { Badge } from '../ui/badge';
import { Modal } from '../ui/modal';
import { useRendezVous } from '../../hooks/useRendezVous';
import { usePermission } from '../../hooks/usePermission';
import { formatDateShort, formatTime } from '../../lib/date';
import { RDVStatus, PrintFormat } from '../../types/rendez-vous';

interface PrintRdvJourProps {
  isOpen: boolean;
  onClose: () => void;
  date?: string;
}

export const PrintRdvJour: React.FC<PrintRdvJourProps> = ({
  isOpen,
  onClose,
  date,
}) => {
  const { rendezVousDuJour, printDailySchedule, isLoading } = useRendezVous();
  const { canPrintDailySchedule } = usePermission();

  const [selectedDate, setSelectedDate] = useState(date || new Date().toISOString().split('T')[0]);
  const [selectedAgent, setSelectedAgent] = useState<string>('all');
  const [selectedService, setSelectedService] = useState<string>('all');
  const [format, setFormat] = useState<PrintFormat>(PrintFormat.PDF);
  const [isPrinting, setIsPrinting] = useState(false);

  // Vérifier la permission
  if (!canPrintDailySchedule()) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Accès refusé">
        <div className="p-6 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Permission insuffisante
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Vous n'avez pas les droits pour imprimer le planning journalier.
          </p>
          <Button className="mt-4" variant="primary" onClick={onClose}>
            Fermer
          </Button>
        </div>
      </Modal>
    );
  }

  // Filtrer les rendez-vous
  const filteredRdv = rendezVousDuJour.filter(rdv => {
    if (selectedAgent !== 'all' && rdv.agentId !== selectedAgent) return false;
    // TODO: Filtrer par service
    return true;
  });

  const stats = {
    total: filteredRdv.length,
    confirmes: filteredRdv.filter(r => r.status === RDVStatus.CONFIRMED).length,
    enCours: filteredRdv.filter(r => [RDVStatus.CHECKED_IN, RDVStatus.IN_PROGRESS].includes(r.status)).length,
    termines: filteredRdv.filter(r => r.status === RDVStatus.COMPLETED).length,
    urgents: filteredRdv.filter(r => r.isUrgent).length,
  };

  const handlePrint = async () => {
    setIsPrinting(true);
    try {
      const result = await printDailySchedule({
        date: selectedDate,
        agentId: selectedAgent !== 'all' ? selectedAgent : undefined,
        subServiceId: selectedService !== 'all' ? selectedService : undefined,
        format,
      });

      // Si format PDF, ouvrir dans une nouvelle fenêtre
      if (format === PrintFormat.PDF && result.id) {
        // TODO: Appeler l'API de téléchargement
        // window.open(`/api/rendez-vous/print/${result.id}/download`, '_blank');
        console.log('PDF généré:', result);
      }

      onClose();
    } catch (error) {
      console.error('Erreur d\'impression:', error);
    } finally {
      setIsPrinting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Impression du planning journalier"
      size="lg"
    >
      <div className="space-y-6">
        {/* Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Date
            </label>
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Format
            </label>
            <Select
              value={format}
              onChange={(value) => setFormat(value as PrintFormat)}
              options={[
                { value: PrintFormat.PDF, label: 'PDF' },
                { value: PrintFormat.THERMAL, label: 'Thermique' },
              ]}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Agent
            </label>
            <Select
              value={selectedAgent}
              onChange={(value) => setSelectedAgent(value)}
              options={[
                { value: 'all', label: 'Tous les agents' },
                // TODO: Charger depuis l'API
                { value: 'agent-002-fatima', label: 'Fatima COULIBALY' },
                { value: 'agent-003-amadou', label: 'Amadou DIALLO' },
              ]}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Service
            </label>
            <Select
              value={selectedService}
              onChange={(value) => setSelectedService(value)}
              options={[
                { value: 'all', label: 'Tous les services' },
                // TODO: Charger depuis l'API
                { value: 'sub-011', label: 'Renouvellement Carte Consulaire' },
                { value: 'sub-006', label: 'Demande de Passeport' },
              ]}
            />
          </div>
        </div>

        {/* Aperçu */}
        <Card className="p-4 bg-gray-50 dark:bg-gray-800">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-medium text-gray-900 dark:text-white">
              Aperçu du planning - {formatDateShort(selectedDate)}
            </h4>
            <Badge color="primary" variant="light">
              {stats.total} rendez-vous
            </Badge>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
            <div className="text-center">
              <div className="text-lg font-bold text-gray-900 dark:text-white">{stats.total}</div>
              <div className="text-xs text-gray-500">Total</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-green-600">{stats.confirmes}</div>
              <div className="text-xs text-gray-500">Confirmés</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-blue-600">{stats.enCours}</div>
              <div className="text-xs text-gray-500">En cours</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-gray-600">{stats.termines}</div>
              <div className="text-xs text-gray-500">Terminés</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-red-600">{stats.urgents}</div>
              <div className="text-xs text-gray-500">Urgents</div>
            </div>
          </div>

          {filteredRdv.length > 0 ? (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {filteredRdv.map((rdv) => (
                <div
                  key={rdv.id}
                  className="flex items-center justify-between p-2 bg-white dark:bg-gray-700 rounded-lg text-sm"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs text-gray-500">{rdv.ticketId}</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {rdv.user.profile?.firstName} {rdv.user.profile?.lastName}
                    </span>
                    <span className="text-gray-500">
                      {rdv.slot ? formatTime(rdv.slot.startTime) : 'Urgence'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {rdv.isUrgent && (
                      <Badge color="error" variant="solid" size="xs">URGENT</Badge>
                    )}
                    <Badge color={rdv.status === RDVStatus.CONFIRMED ? 'success' : 'warning'} variant="light" size="xs">
                      {rdv.status === RDVStatus.CONFIRMED ? '✓' : '○'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500 py-4">
              Aucun rendez-vous pour cette date
            </p>
          )}
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button variant="ghost" onClick={onClose}>
            Annuler
          </Button>
          <Button
            variant="primary"
            onClick={handlePrint}
            disabled={isPrinting || filteredRdv.length === 0}
            startIcon={format === PrintFormat.PDF ? <Download className="w-4 h-4" /> : <Printer className="w-4 h-4" />}
          >
            {isPrinting ? 'Génération...' : format === PrintFormat.PDF ? 'Télécharger PDF' : 'Imprimer'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default PrintRdvJour;