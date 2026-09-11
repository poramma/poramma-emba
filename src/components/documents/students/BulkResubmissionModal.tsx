// src/components/documents/students/BulkResubmissionModal.tsx

import React, { useState } from 'react';
import { 
  FileText, AlertCircle, CheckCircle, XCircle,
  Send, Clock, 
} from 'lucide-react';
import { Button } from '../../ui/button';
import { TextArea } from '../../ui/textarea';
import { Modal } from '../../ui/modal';
import { Progress } from '../../ui/progress';
import { DocumentGED } from '../../../types/document';
import { formatDateShort } from '../../../lib/date';

interface BulkResubmissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDocuments: DocumentGED[];
  onConfirm: (note: string) => Promise<void>;
}

interface ProcessingStatus {
  id: string;
  status: 'pending' | 'processing' | 'success' | 'error';
  error?: string;
}

export const BulkResubmissionModal: React.FC<BulkResubmissionModalProps> = ({
  isOpen,
  onClose,
  selectedDocuments,
  onConfirm,
}) => {
  const [note, setNote] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processStatus, setProcessStatus] = useState<ProcessingStatus[]>([]);
  const [progress, setProgress] = useState(0);

  const handleConfirm = async () => {
    if (!note.trim()) return;

    setIsProcessing(true);
    setProcessStatus(selectedDocuments.map(doc => ({
      id: doc.id,
      status: 'pending',
    })));

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < selectedDocuments.length; i++) {
      const doc = selectedDocuments[i];
      setProcessStatus(prev => prev.map(p => 
        p.id === doc.id ? { ...p, status: 'processing' } : p
      ));
      
      try {
        await onConfirm(note);
        setProcessStatus(prev => prev.map(p => 
          p.id === doc.id ? { ...p, status: 'success' } : p
        ));
        successCount++;
      } catch (error) {
        setProcessStatus(prev => prev.map(p => 
          p.id === doc.id ? { 
            ...p, 
            status: 'error', 
            error: error instanceof Error ? error.message : 'Erreur inconnue' 
          } : p
        ));
        errorCount++;
      }
      
      setProgress(((i + 1) / selectedDocuments.length) * 100);
    }

    setIsProcessing(false);
  };

  const getStatusIcon = (status: ProcessingStatus['status']) => {
    switch (status) {
      case 'success': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error': return <XCircle className="w-4 h-4 text-red-500" />;
      case 'processing': return <div className="animate-spin rounded-full h-4 w-4 border-2 border-brand-500"></div>;
      default: return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const allDone = processStatus.every(p => p.status === 'success' || p.status === 'error');
  const hasErrors = processStatus.some(p => p.status === 'error');

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Resoumission en masse"
      size="lg"
    >
      <div className="space-y-6">
        {/* Informations */}
        <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-700">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-yellow-800 dark:text-yellow-300">
                Resoumission de {selectedDocuments.length} document{selectedDocuments.length > 1 ? 's' : ''}
              </p>
              <p className="text-sm text-yellow-700 dark:text-yellow-400">
                Une demande de resoumission sera envoyée à l'étudiant pour chaque document sélectionné.
              </p>
            </div>
          </div>
        </div>

        {/* Liste des documents */}
        <div className="max-h-48 overflow-y-auto space-y-2">
          {selectedDocuments.map((doc) => (
            <div key={doc.id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="flex items-center gap-3">
                <FileText className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {doc.file?.originalName || 'Sans nom'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {doc.type} • {formatDateShort(doc.createdAt)}
                  </p>
                </div>
              </div>
              {isProcessing && (
                <div className="flex items-center gap-2">
                  {getStatusIcon(processStatus.find(p => p.id === doc.id)?.status || 'pending')}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Note */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Message pour l'étudiant *
          </label>
          <TextArea
            value={note}
            onChange={(value) => setNote(value)}
            placeholder="Expliquez les modifications ou documents supplémentaires demandés..."
            rows={3}
            disabled={isProcessing}
          />
          <p className="text-xs text-gray-400 mt-1">
            Ce message sera envoyé à l'étudiant pour chaque document concerné.
          </p>
        </div>

        {/* Progression */}
        {isProcessing && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Progression</span>
              <span className="text-gray-700 dark:text-gray-300">
                {Math.round(progress)}%
              </span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}

        {/* Résumé final */}
        {allDone && (
          <div className={`p-3 rounded-lg ${
            hasErrors 
              ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700'
              : 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700'
          }`}>
            <div className="flex items-center gap-2">
              {hasErrors ? (
                <AlertCircle className="w-5 h-5 text-red-600" />
              ) : (
                <CheckCircle className="w-5 h-5 text-green-600" />
              )}
              <span className={`text-sm font-medium ${
                hasErrors ? 'text-red-700 dark:text-red-300' : 'text-green-700 dark:text-green-300'
              }`}>
                {hasErrors 
                  ? `${processStatus.filter(p => p.status === 'success').length} envoyé(s), ${processStatus.filter(p => p.status === 'error').length} échec(s)`
                  : `Tous les ${selectedDocuments.length} documents ont été envoyés avec succès`
                }
              </span>
            </div>
            {hasErrors && (
              <div className="mt-2 space-y-1">
                {processStatus.filter(p => p.status === 'error').map(p => {
                  const doc = selectedDocuments.find(d => d.id === p.id);
                  return (
                    <p key={p.id} className="text-xs text-red-600 dark:text-red-400">
                      • {doc?.file?.originalName || 'Document'}: {p.error}
                    </p>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button 
            variant="ghost" 
            onClick={onClose}
            disabled={isProcessing}
          >
            Annuler
          </Button>
          {!allDone ? (
            <Button
              variant="primary"
              onClick={handleConfirm}
              disabled={isProcessing || !note.trim()}
              startIcon={<Send className="w-4 h-4" />}
            >
              {isProcessing ? 'Envoi en cours...' : 'Envoyer les demandes'}
            </Button>
          ) : (
            <Button
              variant={hasErrors ? 'warning' : 'success'}
              onClick={onClose}
            >
              {hasErrors ? 'Fermer (avec erreurs)' : 'Terminé'}
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default BulkResubmissionModal;