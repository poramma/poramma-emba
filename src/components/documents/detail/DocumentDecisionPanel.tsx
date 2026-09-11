// src/components/documents/detail/DocumentDecisionPanel.tsx

import React, { useState } from 'react';
import { 
  CheckCircle, XCircle, AlertCircle, Archive
} from 'lucide-react';
import { Card } from '../../ui/card';
import { Button } from '../../ui/button';
import { TextArea } from '../../ui/textarea';
import { DocumentGED } from '../../../types/document';
import { DocStatus } from '../../../types/etudiant';
import { formatDateShort } from '../../../lib/date';
import { useToast } from '../../../hooks/useToast';

interface DocumentDecisionPanelProps {
  document: DocumentGED;
  canValidate: boolean;
  onAccept: (note?: string) => Promise<void>;
  onReject: (note: string) => Promise<void>;
  onArchive: () => Promise<void>;
  isLoading?: boolean;
}

export const DocumentDecisionPanel: React.FC<DocumentDecisionPanelProps> = ({
  document,
  canValidate,
  onAccept,
  onReject,
  onArchive,
  isLoading = false,
}) => {
  const { toast } = useToast();
  const [action, setAction] = useState<'accept' | 'reject' | 'request' | null>(null);
  const [note, setNote] = useState('');
  const [noteError, setNoteError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isCompleted = document.status === DocStatus.ACCEPTED || 
                      document.status === DocStatus.REJECTED ||
                      document.status === DocStatus.EXPIRED;

  const handleSubmit = async (type: 'accept' | 'reject' | 'request') => {
    if (type === 'reject' || type === 'request') {
      if (!note.trim()) {
        setNoteError('Une note est obligatoire pour cette action.');
        return;
      }
    }

    setIsSubmitting(true);
    setNoteError('');

    try {
      if (type === 'accept') {
        await onAccept(note || undefined);
        toast({
          title: 'Document validé',
          description: 'Le document a été validé avec succès.',
          variant: 'success',
        });
      } else if (type === 'reject') {
        await onReject(note);
        toast({
          title: 'Document rejeté',
          description: 'Le document a été rejeté.',
          variant: 'warning',
        });
      } else {
        await onReject(`RESOUMISSION REQUISE: ${note}`);
        toast({
          title: 'Complément demandé',
          description: 'Une resoumission a été demandée à l\'étudiant.',
          variant: 'info',
        });
      }
      setAction(null);
      setNote('');
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Une erreur est survenue lors de l\'action.',
        variant: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleArchive = async () => {    
    setIsSubmitting(true);
    try {
      await onArchive();
      toast({
        title: 'Document archivé',
        description: 'Le document a été archivé avec succès.',
        variant: 'success',
      });
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible d\'archiver le document.',
        variant: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Si le document est déjà traité
  if (isCompleted) {
    return (
      <Card className="p-4">
        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-lg ${
            document.status === DocStatus.ACCEPTED 
              ? 'bg-green-100 dark:bg-green-900/30' 
              : 'bg-red-100 dark:bg-red-900/30'
          }`}>
            {document.status === DocStatus.ACCEPTED ? (
              <CheckCircle className="w-5 h-5 text-green-600" />
            ) : document.status === DocStatus.REJECTED ? (
              <XCircle className="w-5 h-5 text-red-600" />
            ) : (
              <Archive className="w-5 h-5 text-gray-600" />
            )}
          </div>
          <div className="flex-1">
            <p className="font-medium text-gray-900 dark:text-white">
              {document.status === DocStatus.ACCEPTED 
                ? 'Document validé' 
                : document.status === DocStatus.REJECTED 
                  ? 'Document rejeté' 
                  : 'Document expiré'
              }
            </p>
            {document.reviewedBy && (
              <p className="text-sm text-gray-500">
                Par {document.reviewedBy} le {formatDateShort(document.reviewedAt || document.updatedAt)}
              </p>
            )}
            {document.reviewNote && (
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-300 p-2 bg-gray-50 dark:bg-gray-800 rounded">
                {document.reviewNote}
              </p>
            )}
          </div>
        </div>
        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
          <Button variant="outline" size="sm" onClick={handleArchive} disabled={isSubmitting}>
            <Archive className="w-4 h-4 mr-1" />
            Archiver
          </Button>
        </div>
      </Card>
    );
  }

  // Si l'utilisateur n'a pas la permission de valider
  if (!canValidate) {
    return (
      <Card className="p-4">
        <div className="flex items-center gap-3 text-yellow-600">
          <AlertCircle className="w-5 h-5" />
          <p className="text-sm">Vous n'avez pas les droits pour valider ce document.</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <div className="space-y-4">
        <h4 className="font-medium text-gray-700 dark:text-gray-300">
          Décision
        </h4>

        {/* Actions */}
        {!action && (
          <div className="flex flex-wrap gap-2">
            <Button 
              variant="success" 
              onClick={() => setAction('accept')}
              disabled={isSubmitting}
            >
              <CheckCircle className="w-4 h-4 mr-1" />
              Valider
            </Button>
            <Button 
              variant="error" 
              onClick={() => setAction('reject')}
              disabled={isSubmitting}
            >
              <XCircle className="w-4 h-4 mr-1" />
              Rejeter
            </Button>
            <Button 
              variant="warning" 
              onClick={() => setAction('request')}
              disabled={isSubmitting}
            >
              <AlertCircle className="w-4 h-4 mr-1" />
              Demander un complément
            </Button>
          </div>
        )}

        {/* Formulaire d'action */}
        {action && (
          <div className="space-y-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {action === 'accept' && 'Validation du document'}
              {action === 'reject' && 'Rejet du document'}
              {action === 'request' && 'Demande de complément'}
            </p>

            {(action === 'reject' || action === 'request') && (
              <div>
                <TextArea
                  placeholder={
                    action === 'reject' 
                      ? 'Motif du rejet...' 
                      : 'Informations complémentaires demandées...'
                  }
                  value={note}
                  onChange={(value) => {
                    setNote(value);
                    if (value.trim()) setNoteError('');
                  }}
                  rows={3}
                  className="resize-none"
                />
                {noteError && (
                  <p className="text-sm text-red-600 mt-1">{noteError}</p>
                )}
              </div>
            )}

            <div className="flex gap-2">
              <Button
                variant={action === 'accept' ? 'success' : action === 'reject' ? 'error' : 'warning'}
                onClick={() => handleSubmit(action)}
                disabled={isSubmitting}
                size="sm"
              >
                {isSubmitting ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white"></div>
                ) : (
                  action === 'accept' ? 'Confirmer' : 'Confirmer'
                )}
              </Button>
              <Button 
                variant="ghost" 
                onClick={() => {
                  setAction(null);
                  setNote('');
                  setNoteError('');
                }}
                disabled={isSubmitting}
                size="sm"
              >
                Annuler
              </Button>
            </div>
          </div>
        )}

        {/* Action d'archivage */}
        <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleArchive}
            disabled={isSubmitting}
          >
            <Archive className="w-4 h-4 mr-1" />
            Archiver le document
          </Button>
          <p className="text-xs text-gray-400 mt-1">
            L'archivage est une action définitive.
          </p>
        </div>
      </div>
    </Card>
  );
};

export default DocumentDecisionPanel;