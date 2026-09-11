// ============================================================
// src/components/demandes/DemandeWorkflow.tsx
// ============================================================

import React from 'react';
import { useDemandes } from '../../hooks/useDemandes';
import { useAuth } from '../../hooks/useAuth';
import { AppStatus, RequirementStatus } from '../../types/demande';
import { PermissionCode } from '../../types/auth';
import { DemandeActions } from './DemandeActions';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';
import { CheckCircle, XCircle, Clock, FileCheck } from 'lucide-react';

const WORKFLOW_STEPS: { status: AppStatus; label: string; description: string }[] = [
  { status: AppStatus.SUBMITTED, label: 'Soumise', description: 'Demande reçue' },
  { status: AppStatus.IN_REVIEW, label: 'En examen', description: 'Analyse en cours' },
  { status: AppStatus.UNDER_VERIFICATION, label: 'Vérification', description: 'Vérification approfondie' },
  { status: AppStatus.APPROVED, label: 'Approuvée', description: 'Prête à traiter' },
  { status: AppStatus.COMPLETED, label: 'Traitée', description: 'Demande clôturée' },
];

interface DemandeWorkflowProps {
  demandeId: string;
  /** Callback pour naviguer vers un onglet spécifique (ex: comments pour "Infos manquantes") */
  onNavigateToTab?: (tab: 'details' | 'workflow' | 'documents' | 'comments') => void;
}

export const DemandeWorkflow: React.FC<DemandeWorkflowProps> = ({ 
  demandeId,
  onNavigateToTab,
}) => {
  const {
    selectedDemande,
    requirements,
    selectedDemandeProgress,
    selectedDemandeCanValidate,
    acceptRequirement,
    rejectRequirement,
  } = useDemandes();

  const { can } = useAuth();

  if (!selectedDemande) return null;

  const currentStepIndex = WORKFLOW_STEPS.findIndex(s => s.status === selectedDemande.status);
  const isRejected = selectedDemande.status === AppStatus.REJECTED;
  const isCompleted = selectedDemande.status === AppStatus.COMPLETED;

  return (
    <div className="space-y-6">
      {/* ── Barre de progression du workflow ── */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Progression du workflow</h3>
        
        {/* Steps */}
        <div className="relative">
          <div className="absolute top-4 left-0 right-0 h-1 bg-gray-200 dark:bg-gray-700 rounded-full" />
          <div
            className="absolute top-4 left-0 h-1 bg-primary rounded-full transition-all duration-500"
            style={{ width: `${isRejected ? 0 : ((currentStepIndex + 1) / WORKFLOW_STEPS.length) * 100}%` }}
          />
          
          <div className="relative flex justify-between">
            {WORKFLOW_STEPS.map((step, index) => {
              const isActive = index <= currentStepIndex && !isRejected;
              const isCurrent = index === currentStepIndex && !isRejected;
              
              return (
                <div key={step.status} className="flex flex-col items-center gap-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-brand-500 text-white'
                      : isRejected && index === 0
                      ? 'bg-red-500 text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-500'
                  } ${isCurrent ? 'ring-4 ring-primary/20' : ''}`}>
                    {isRejected && index === 0 ? <XCircle className="h-4 w-4" /> : index + 1}
                  </div>
                  <div className="text-center">
                    <p className={`text-xs font-medium ${isActive ? 'text-primary' : 'text-gray-500'}`}>
                      {step.label}
                    </p>
                    <p className="text-[10px] text-gray-400 hidden md:block">{step.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {isRejected && (
          <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-700 dark:text-red-300 font-medium">Demande rejetée</p>
          </div>
        )}
      </div>

      {/* ── Exigences / Documents ── */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">Exigences</h3>
            <p className="text-sm text-gray-500">{selectedDemandeProgress}% complété</p>
          </div>
          <Progress value={selectedDemandeProgress} className="w-32" />
        </div>

        <div className="space-y-3">
          {requirements.map((req) => (
            <RequirementItem
              key={req.id}
              requirement={req}
              canValidate={can(PermissionCode.DEMANDE_VALIDATE) && selectedDemandeCanValidate}
              onAccept={(note) => acceptRequirement(req.id, note)}
              onReject={(note) => rejectRequirement(req.id, note)}
            />
          ))}
          {requirements.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-4">Aucune exigence définie</p>
          )}
        </div>
      </div>

      {/* ── Actions de workflow (via DemandeActions) ── */}
      {selectedDemandeCanValidate && can(PermissionCode.DEMANDE_VALIDATE) && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Actions</h3>
          <DemandeActions 
            demandeId={demandeId} 
            onNavigateToTab={onNavigateToTab}
          />
        </div>
      )}
    </div>
  );
};

// ── Sous-composant RequirementItem ──
const RequirementItem: React.FC<{
  requirement: any; // DemandeRequirement
  canValidate: boolean;
  onAccept: (note?: string) => void;
  onReject: (note: string) => void;
}> = ({ requirement, canValidate, onAccept, onReject }) => {
  const [note, setNote] = React.useState('');

  const statusConfig = {
    [RequirementStatus.PENDING]: { label: 'En attente', color: 'bg-gray-100 text-gray-600', icon: Clock },
    [RequirementStatus.PROVIDED]: { label: 'Fourni', color: 'bg-blue-100 text-blue-600', icon: FileCheck },
    [RequirementStatus.UNDER_REVIEW]: { label: 'En vérification', color: 'bg-amber-100 text-amber-600', icon: Clock },
    [RequirementStatus.ACCEPTED]: { label: 'Accepté', color: 'bg-emerald-100 text-emerald-600', icon: CheckCircle },
    [RequirementStatus.REJECTED]: { label: 'Rejeté', color: 'bg-red-100 text-red-600', icon: XCircle },
  };

  const config = statusConfig[requirement.status as RequirementStatus] || statusConfig[RequirementStatus.PENDING];
  const StatusIcon = config.icon;

  return (
    <div className="flex items-start gap-3 p-3 rounded-lg border border-gray-100 dark:border-gray-700">
      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${config.color}`}>
        <StatusIcon className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-gray-900 dark:text-white">{requirement.label}</p>
          <Badge className={`${config.color} border-0 text-xs`}>{config.label}</Badge>
        </div>
        {requirement.type && (
          <p className="text-xs text-gray-500">Type: {requirement.type}</p>
        )}
        {requirement.reviewerNote && (
          <p className="text-xs text-gray-600 mt-1 bg-gray-50 dark:bg-gray-700/50 rounded p-1.5">
            Note: {requirement.reviewerNote}
          </p>
        )}
        {canValidate && requirement.status === RequirementStatus.PROVIDED && (
          <div className="flex gap-2 mt-2">
            <Button size="sm" variant="outline" onClick={() => onAccept(note)}>
              <CheckCircle className="h-3 w-3 mr-1" />
              Accepter
            </Button>
            <Button size="sm" variant="destructive" onClick={() => onReject(note || 'Non conforme')}>
              <XCircle className="h-3 w-3 mr-1" />
              Rejeter
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};