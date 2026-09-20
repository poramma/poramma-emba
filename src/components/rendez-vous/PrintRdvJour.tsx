// src/components/rendez-vous/PrintRdvJour.tsx
//
// Impression du planning d'UNE date (PDF ou ticket thermique 80 mm).
// L'aperçu et l'impression viennent du serveur pour la date choisie : seuls les
// rendez-vous actifs de ce jour, regroupés par service et ordonnés par créneau.

import React, { useState, useEffect, useCallback } from 'react';
import { Printer, Download, AlertCircle, Loader2 } from 'lucide-react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select } from '../ui/select';
import { Badge } from '../ui/badge';
import { Modal } from '../ui/modal';
import { useRendezVous } from '../../hooks/useRendezVous';
import { usePermission } from '../../hooks/usePermission';
import { useAuth } from '../../hooks/useAuth';
import { formatDateShort } from '../../lib/date';
import { api } from '../../lib/api';
import { generateSchedulePdf, printThermalSchedule } from '../../lib/print-schedule';
import { PrintFormat } from '../../types/rendez-vous';
import type { DailyScheduleContent } from '../../types/rendez-vous';
import { useServices } from '../../hooks/useServices';
import { useAgentsStore } from '../../store/agentsStore';

interface PrintRdvJourProps {
  isOpen: boolean;
  onClose: () => void;
  date?: string;
}

const todayIso = () => new Date().toISOString().split('T')[0];

export const PrintRdvJour: React.FC<PrintRdvJourProps> = ({ isOpen, onClose, date }) => {
  const { printDailySchedule } = useRendezVous();
  const { canPrintDailySchedule } = usePermission();
  const { user } = useAuth();
  const { subServices } = useServices();
  const { agents, fetchAgents } = useAgentsStore();

  const [selectedDate, setSelectedDate] = useState(date || todayIso());
  const [selectedAgent, setSelectedAgent] = useState<string>('all');
  const [selectedService, setSelectedService] = useState<string>('all');
  const [format, setFormat] = useState<PrintFormat>(PrintFormat.PDF);
  const [isPrinting, setIsPrinting] = useState(false);
  const [preview, setPreview] = useState<DailyScheduleContent | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (agents.length === 0) fetchAgents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // La date suit celle du calendrier à chaque ouverture de la fenêtre.
  useEffect(() => {
    if (isOpen && date) setSelectedDate(date);
  }, [isOpen, date]);

  const agentId = selectedAgent !== 'all' ? selectedAgent : undefined;
  const subServiceId = selectedService !== 'all' ? selectedService : undefined;

  // Aperçu rechargé à chaque changement de date / filtre : on voit exactement ce qui sera imprimé.
  const loadPreview = useCallback(async () => {
    if (!selectedDate) return;
    setIsLoadingPreview(true);
    setError(null);
    try {
      const { data } = await api.get('/rendez-vous', { params: { date: selectedDate, agentId, subServiceId } });
      const rows: Array<Record<string, any>> = data.data ?? [];
      const active = rows.filter((r) => r.date === selectedDate && !String(r.status).startsWith('CANCELLED') && r.status !== 'MISSED');
      const byService = new Map<string, DailyScheduleContent['byService'][number]>();
      for (const r of active) {
        const group: DailyScheduleContent['byService'][number] =
          byService.get(r.subServiceId) ?? { subServiceId: r.subServiceId, subServiceName: r.subService?.name ?? '—', appointments: [] };
        group.appointments.push({
          time: r.slotId?.split('|')[4] ?? '--:--',
          endTime: r.slot?.endTime ?? null,
          ticketId: r.ticketId,
          studentName: [r.user?.profile?.firstName, r.user?.profile?.lastName].filter(Boolean).join(' ') || '—',
          studentInue: r.user?.profile?.inue ?? 'N/A',
          studentPhone: r.user?.phone ?? null,
          motif: r.motif ?? '',
          status: r.status,
          agentName: '',
          isUrgent: !!r.isUrgent,
        });
        byService.set(r.subServiceId, group);
      }
      const groups = [...byService.values()]
        .sort((a, b) => a.subServiceName.localeCompare(b.subServiceName, 'fr'))
        .map((g) => ({ ...g, appointments: g.appointments.sort((a, b) => a.time.localeCompare(b.time)) }));
      setPreview({ date: selectedDate, generatedAt: new Date().toISOString(), totalAppointments: active.length, byService: groups });
    } catch {
      setPreview(null);
      setError("Impossible de charger les rendez-vous de cette date.");
    } finally {
      setIsLoadingPreview(false);
    }
  }, [selectedDate, agentId, subServiceId]);

  useEffect(() => {
    if (isOpen) loadPreview();
  }, [isOpen, loadPreview]);

  if (!canPrintDailySchedule()) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Accès refusé">
        <div className="p-6 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Permission insuffisante</h3>
          <p className="text-gray-600 dark:text-gray-400">Vous n'avez pas les droits pour imprimer le planning journalier.</p>
          <Button className="mt-4" variant="primary" onClick={onClose}>
            Fermer
          </Button>
        </div>
      </Modal>
    );
  }

  const agentLabel = agentId
    ? (() => {
        const a = agents.find((x) => x.id === agentId);
        return a ? `${a.user.profile?.firstName ?? ''} ${a.user.profile?.lastName ?? ''}`.trim() || a.matricule : undefined;
      })()
    : undefined;
  const serviceLabel = subServiceId ? subServices.find((s) => s.id === subServiceId)?.name : undefined;
  const printedBy = user?.profile ? `${user.profile.firstName ?? ''} ${user.profile.lastName ?? ''}`.trim() : undefined;

  const handlePrint = async () => {
    setIsPrinting(true);
    setError(null);
    try {
      // Le serveur produit le contenu final (et garde la trace de l'impression dans l'historique).
      const result = await printDailySchedule({ date: selectedDate, agentId, subServiceId, format });
      const content = result.content;
      if (format === PrintFormat.PDF) {
        generateSchedulePdf(content, { agentLabel, serviceLabel, printedBy });
      } else if (!printThermalSchedule(content, { agentLabel, serviceLabel })) {
        setError("Le navigateur a bloqué la fenêtre d'impression. Autorisez les fenêtres pop-up pour ce site puis réessayez.");
        return;
      }
      onClose();
    } catch {
      setError("L'impression a échoué. Réessayez dans un instant.");
    } finally {
      setIsPrinting(false);
    }
  };

  const total = preview?.totalAppointments ?? 0;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Impression du planning journalier" size="lg">
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date</label>
            <Input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Format</label>
            <Select
              value={format}
              onChange={(value) => setFormat(value as PrintFormat)}
              options={[
                { value: PrintFormat.PDF, label: 'PDF (A4)' },
                { value: PrintFormat.THERMAL, label: 'Ticket thermique (80 mm)' },
              ]}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Agent</label>
            <Select
              value={selectedAgent}
              onChange={(value) => setSelectedAgent(value)}
              options={[
                { value: 'all', label: 'Tous les agents' },
                ...agents.map((a) => ({
                  value: a.id,
                  label: `${a.user.profile?.firstName ?? ''} ${a.user.profile?.lastName ?? ''}`.trim() || a.matricule,
                })),
              ]}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Service</label>
            <Select
              value={selectedService}
              onChange={(value) => setSelectedService(value)}
              options={[{ value: 'all', label: 'Tous les services' }, ...subServices.map((s) => ({ value: s.id, label: s.name }))]}
            />
          </div>
        </div>

        <Card className="p-4 bg-gray-50 dark:bg-gray-800">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-medium text-gray-900 dark:text-white">Aperçu — {formatDateShort(selectedDate)}</h4>
            <div className="flex items-center gap-2">
              {isLoadingPreview && <Loader2 className="w-4 h-4 animate-spin text-gray-400" />}
              <Badge color="primary" variant="light">
                {total} rendez-vous
              </Badge>
            </div>
          </div>

          {preview && preview.byService.length > 0 ? (
            <div className="space-y-4 max-h-72 overflow-y-auto">
              {preview.byService.map((group) => (
                <div key={group.subServiceId}>
                  <div className="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-1">
                    {group.subServiceName} <span className="text-gray-500 font-normal">({group.appointments.length})</span>
                  </div>
                  <div className="space-y-1">
                    {group.appointments.map((a) => (
                      <div key={a.ticketId} className="flex items-center justify-between p-2 bg-white dark:bg-gray-700 rounded-lg text-sm">
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="font-mono text-xs text-gray-600 dark:text-gray-300 w-12 shrink-0">{a.time}</span>
                          <span className="font-medium text-gray-900 dark:text-white truncate">{a.studentName}</span>
                          <span className="font-mono text-xs text-gray-500 hidden sm:inline">{a.ticketId}</span>
                        </div>
                        {a.isUrgent && (
                          <Badge color="error" variant="solid" size="xs">
                            URGENT
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500 py-4">{isLoadingPreview ? 'Chargement…' : 'Aucun rendez-vous actif pour cette date'}</p>
          )}
        </Card>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button variant="ghost" onClick={onClose}>
            Annuler
          </Button>
          <Button
            variant="primary"
            onClick={handlePrint}
            disabled={isPrinting || isLoadingPreview || total === 0}
            startIcon={format === PrintFormat.PDF ? <Download className="w-4 h-4" /> : <Printer className="w-4 h-4" />}
          >
            {isPrinting ? 'Génération...' : format === PrintFormat.PDF ? 'Télécharger le PDF' : 'Imprimer le ticket'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default PrintRdvJour;
