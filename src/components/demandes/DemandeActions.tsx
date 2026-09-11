// ============================================================
// src/components/demandes/DemandeActions.tsx
// ============================================================

import React, { useState, useCallback } from 'react';
import { useDemandes } from '../../hooks/useDemandes';
import { useAuth } from '../../hooks/useAuth';
import { AppStatus } from '../../types/demande';
import { PermissionCode } from '../../types/auth';
import { Button } from '../ui/button';
import { ConfirmDialog } from '../ui/confirmDialog';
import type { DialogVariant } from '../ui/confirmDialog';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  ArrowUpCircle, 
  UserPlus, 
  FileCheck,
} from 'lucide-react';

interface DemandeActionsProps {
  demandeId: string;
  /** Callback appelé quand une action nécessite d'afficher un onglet spécifique */
  onNavigateToTab?: (tab: 'details' | 'workflow' | 'documents' | 'comments') => void;
}

export const DemandeActions: React.FC<DemandeActionsProps> = ({ 
  demandeId,
  onNavigateToTab,
}) => {
  const {
    selectedDemande,
    approveDemande,
    rejectDemande,
    requestAdditionalInfo,
    completeDemande,
    escalateDemande,
  } = useDemandes();

  const { can } = useAuth();

  // ── État du dialog ──
type DialogConfig = {
  isOpen: boolean;
  type: 'approve' | 'reject' | 'complete' | 'escalate';
  title: string;
  message: string;
  variant: DialogVariant;
  confirmLabel: string;
};

const [dialogConfig, setDialogConfig] = useState<DialogConfig | null>(null);

  const [isProcessing, setIsProcessing] = useState(false);

  if (!selectedDemande) return null;

  const status = selectedDemande.status;

  // ── Ouvrir le dialog ──
  const openDialog = useCallback((config: Omit<DialogConfig, 'isOpen'>) => {
    setDialogConfig({ ...config, isOpen: true });
  }, []);

  // ── Fermer le dialog ──
  const closeDialog = useCallback(() => {
    setDialogConfig(null);
    setIsProcessing(false);
  }, []);

  // ── Exécuter l'action confirmée ──
  const handleConfirm = useCallback(async () => {
    if (!dialogConfig) return;
    
    setIsProcessing(true);
    
    try {
      switch (dialogConfig.type) {
        case 'approve':
          await approveDemande(demandeId);
          break;
        case 'reject':
          await rejectDemande(demandeId, 'Demande rejetée après confirmation');
          break;
        case 'complete':
          await completeDemande(demandeId);
          break;
        case 'escalate':
          await escalateDemande(demandeId, 'Demande escaladée à la hiérarchie');
          break;
      }
    } catch (err) {
      console.error('Action failed:', err);
    } finally {
      closeDialog();
    }
  }, [dialogConfig, demandeId, approveDemande, rejectDemande, completeDemande, escalateDemande, closeDialog]);

  // ── Infos manquantes : rediriger vers l'onglet commentaires ──
  const handleRequestAdditionalInfo = useCallback(async () => {
    // Exécuter l'action

    console.log('Demande ID :'+ demandeId);
    await requestAdditionalInfo(demandeId, 'Documents complémentaires requis pour finaliser le dossier.');
    // Rediriger vers l'onglet commentaires
    onNavigateToTab?.('comments');
  }, [demandeId, requestAdditionalInfo, onNavigateToTab]);

  const canValidate = can(PermissionCode.DEMANDE_VALIDATE);
  const canAssign = can(PermissionCode.DEMANDE_ASSIGN);
  const canReject = can(PermissionCode.DEMANDE_REJECT);

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {/* ── APPROUVER ── */}
        {[AppStatus.SUBMITTED, AppStatus.IN_REVIEW, AppStatus.UNDER_VERIFICATION].includes(status) && canValidate && (
          <Button
            onClick={() => openDialog({
              type: 'approve',
              title: 'Approuver la demande',
              message: 'Êtes-vous sûr de vouloir approuver cette demande ? Elle passera en statut "Approuvée" et pourra être traitée.',
              variant: 'success',
              confirmLabel: 'Approuver',
            })}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Approuver
          </Button>
        )}

        {/* ── INFOS MANQUANTES ── */}
        {[AppStatus.SUBMITTED, AppStatus.IN_REVIEW].includes(status) && canValidate && (
          <Button
            variant="outline"
            onClick={handleRequestAdditionalInfo}
            className="border-amber-300 text-amber-700 hover:bg-amber-50"
          >
            <AlertTriangle className="h-4 w-4 mr-2" />
            Infos manquantes
          </Button>
        )}

        {/* ── TRAITEMENT TERMINÉ ── */}
        {status === AppStatus.APPROVED && canValidate && (
          <Button
            onClick={() => openDialog({
              type: 'complete',
              title: 'Marquer comme traitée',
              message: 'Confirmez-vous que le traitement de cette demande est terminé ? Le statut passera à "Traitée".',
              variant: 'default',
              confirmLabel: 'Confirmer',
            })}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            <FileCheck className="h-4 w-4 mr-2" />
            Traitement terminé
          </Button>
        )}

        {/* ── ESCALADER ── */}
        {[AppStatus.SUBMITTED, AppStatus.IN_REVIEW, AppStatus.UNDER_VERIFICATION].includes(status) && canAssign && (
          <Button
            variant="outline"
            onClick={() => openDialog({
              type: 'escalate',
              title: 'Escalader la demande',
              message: 'Cette demande sera marquée comme urgente et remontée à la hiérarchie. Un motif sera requis.',
              variant: 'warning',
              confirmLabel: 'Escalader',
            })}
            className="border-purple-300 text-purple-700 hover:bg-purple-50"
          >
            <ArrowUpCircle className="h-4 w-4 mr-2" />
            Escalader
          </Button>
        )}

        {/* ── ASSIGNER AGENT ── */}
        {status === AppStatus.SUBMITTED && canAssign && (
          <Button
            variant="outline"
            onClick={() => {/* TODO: Ouvrir modal d'assignation */}}
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Assigner
          </Button>
        )}

        {/* ── REJETER ── */}
        {[AppStatus.SUBMITTED, AppStatus.IN_REVIEW, AppStatus.UNDER_VERIFICATION, AppStatus.APPROVED].includes(status) && canReject && (
          <Button
            variant="destructive"
            onClick={() => openDialog({
              type: 'reject',
              title: 'Rejeter la demande',
              message: 'Êtes-vous sûr de vouloir rejeter cette demande ? Cette action est irréversible et l\'étudiant en sera notifié.',
              variant: 'destructive',
              confirmLabel: 'Rejeter définitivement',
            })}
          >
            <XCircle className="h-4 w-4 mr-2" />
            Rejeter
          </Button>
        )}
      </div>

      {/* ── DIALOG DE CONFIRMATION ── */}
      {dialogConfig?.isOpen && (
        <ConfirmDialog
          isOpen={true}
          onClose={closeDialog}
          onConfirm={handleConfirm}
          title={dialogConfig.title}
          message={dialogConfig.message}
          confirmLabel={dialogConfig.confirmLabel}
          cancelLabel="Annuler"
          variant={dialogConfig.variant}
          loading={isProcessing}
        />
      )}
    </>
  );
};