// ============================================================
// src/components/demandes/DemandeDetail.tsx
// ============================================================

import React, { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useDemandes } from '../../hooks/useDemandes';
import { useAuth } from '../../hooks/useAuth';
import { useDocuments } from '../../hooks/useDocuments';
import { DemandeTimeline } from './DemandeTimeline';
import { DemandeWorkflow } from './DemandeWorkflow';
import { DemandeActions } from './DemandeActions';
import { DocumentViewer } from './DocumentViewer';
import { AppStatus, Priority } from '../../types/demande';
import { PermissionCode } from '../../types/auth';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Skeleton } from '../ui/skeleton';
import { AlertTriangle, FileText, User, DollarSign, MessageSquare } from 'lucide-react';

const PRIORITY_CONFIG: Record<Priority, { label: string; color: string; icon: React.ElementType }> = {
  [Priority.LOW]: { label: 'Basse', color: 'bg-gray-100 text-gray-600', icon: FileText },
  [Priority.NORMAL]: { label: 'Normale', color: 'bg-blue-100 text-blue-600', icon: FileText },
  [Priority.HIGH]: { label: 'Haute', color: 'bg-amber-100 text-amber-600', icon: AlertTriangle },
  [Priority.URGENT]: { label: 'Urgente', color: 'bg-red-100 text-red-600', icon: AlertTriangle },
};

const STATUS_LABELS: Record<AppStatus, string> = {
  [AppStatus.DRAFT]: 'Brouillon',
  [AppStatus.SUBMITTED]: 'Soumise',
  [AppStatus.IN_REVIEW]: 'En examen',
  [AppStatus.ADDITIONAL_INFO_REQUIRED]: 'Infos manquantes',
  [AppStatus.UNDER_VERIFICATION]: 'Vérification',
  [AppStatus.APPROVED]: 'Approuvée',
  [AppStatus.REJECTED]: 'Rejetée',
  [AppStatus.COMPLETED]: 'Traitée',
  [AppStatus.CANCELLED]: 'Annulée',
  [AppStatus.ARCHIVED]: 'Archivée',
};

interface DemandeDetailProps {
  demandeId?: string;
  mode?: 'view' | 'traitement';
}

export const DemandeDetail: React.FC<DemandeDetailProps> = ({ demandeId: propId, mode = 'traitement' }) => {
  const { id: paramId } = useParams<{ id: string }>();
  const demandeId = propId || paramId;
  
  const {
    selectedDemande,
    isLoading,
    error,
    fetchDemandeById,
    comments,
    requirements,
    fetchComments,
    addComment,
    addInternalNote,
    clearSelectedDemande,
  } = useDemandes();

  const { documents, fetchDocuments } = useDocuments();
  const { can } = useAuth();
  const [activeTab, setActiveTab] = useState<'details' | 'workflow' | 'documents' | 'comments'>('details');
  const [newComment, setNewComment] = useState('');

    // ── Callback pour naviguer vers un onglet spécifique ──
  const navigateToTab = useCallback((tab: typeof activeTab) => {
    setActiveTab(tab);
  }, []);


  useEffect(() => {
    if (demandeId) {
      fetchDemandeById(demandeId);
      fetchComments(demandeId);
      // TODO: Backend - fetch documents linked to this demande
      fetchDocuments();
    }
    return () => clearSelectedDemande();
  }, [demandeId, fetchDemandeById, fetchComments, clearSelectedDemande]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error || !selectedDemande) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="h-12 w-12 mx-auto text-red-400 mb-4" />
        <p className="text-gray-500">{error || 'Demande introuvable'}</p>
      </div>
    );
  }

  const priority = PRIORITY_CONFIG[selectedDemande.priority];
  const PriorityIcon = priority.icon;
  const isOverdue = selectedDemande.deadlineAt && new Date(selectedDemande.deadlineAt) < new Date() 
    && selectedDemande.status !== AppStatus.COMPLETED;

  const handleAddComment = async (isInternal: boolean) => {
    if (!newComment.trim()) return;
    if (isInternal) {
      await addInternalNote(selectedDemande.id, newComment);
    } else {
      await addComment(selectedDemande.id, newComment, false);
    }
    setNewComment('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                {selectedDemande.dossierNumber}
              </h1>
              <Badge className={`${priority.color} border-0`}>
                <PriorityIcon className="h-3 w-3 mr-1" />
                {priority.label}
              </Badge>
              {isOverdue && (
                <Badge className="bg-red-100 text-red-700 border-0">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  SLA dépassé
                </Badge>
              )}
            </div>
            <p className="text-sm text-gray-500">
              Soumise le {new Date(selectedDemande.submittedAt || selectedDemande.createdAt).toLocaleDateString('fr-FR')}
              {selectedDemande.deadlineAt && ` • Deadline: ${new Date(selectedDemande.deadlineAt).toLocaleDateString('fr-FR')}`}
            </p>
          </div>
          
          {/* Actions rapides — PASSER LE CALLBACK */}
          {mode === 'traitement' && (
            <DemandeActions 
              demandeId={selectedDemande.id} 
              onNavigateToTab={navigateToTab}
            />
          )}
        </div>

        {/* Info demandeur */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <InfoCard
            icon={User}
            label="Demandeur"
            value={`${selectedDemande.user.profile?.firstName} ${selectedDemande.user.profile?.lastName}`}
            subValue={selectedDemande.user.profile?.inue || 'N/A'}
          />
          <InfoCard
            icon={FileText}
            label="Service"
            value={selectedDemande.subService.name}
            subValue={selectedDemande.subService.code}
          />
          <InfoCard
            icon={DollarSign}
            label="Tarif"
            value={selectedDemande.totalAmount ? `${selectedDemande.totalAmount} ${selectedDemande.currency}` : 'Gratuit'}
            subValue={STATUS_LABELS[selectedDemande.status]}
          />
        </div>
      </div>

      {/* Tabs */}
      <div 
        id="demande-tabs"
        className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700"
        >
        <div className="flex border-b border-gray-100 dark:border-gray-700">
          {[
            { id: 'details', label: 'Détails', icon: FileText },
            { id: 'workflow', label: 'Progression', icon: AlertTriangle },
            { id: 'documents', label: 'Documents', icon: FileText },
            { id: 'comments', label: 'Commentaires', icon: MessageSquare },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-brand-700 text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
              {tab.id === 'comments' && comments.length > 0 && (
                <span className="bg-primary/10 text-primary text-xs px-1.5 py-0.5 rounded-full">
                  {comments.length}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="p-6">
          {activeTab === 'details' && (
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900 dark:text-white">Informations complémentaires</h3>
              {selectedDemande.customPayload ? (
                <pre className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 text-sm overflow-auto">
                  {JSON.stringify(selectedDemande.customPayload, null, 2)}
                </pre>
              ) : (
                <p className="text-sm text-gray-400">Aucune donnée supplémentaire</p>
              )}
              
              <div className="mt-6">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Historique</h4>
                <DemandeTimeline demandeId={selectedDemande.id} />
              </div>
            </div>
          )}

          {activeTab === 'workflow' && (
            <DemandeWorkflow demandeId={selectedDemande.id} />
          )}

          {activeTab === 'documents' && (
            <DocumentViewer 
              documents={documents}
              canValidate={can(PermissionCode.DOCUMENT_VALIDATE)} 
              demandeId={selectedDemande.id}
            />
          )}

          {activeTab === 'comments' && (
            <div className="space-y-4">
              {/* Liste des commentaires */}
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {comments.map((comment) => (
                  <div
                    key={comment.id}
                    className={`p-3 rounded-lg ${
                      comment.isInternal 
                        ? 'bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800' 
                        : 'bg-gray-50 dark:bg-gray-700/50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {comment.authorName}
                        {comment.isInternal && (
                          <span className="ml-2 text-xs text-amber-600">• Interne</span>
                        )}
                      </span>
                      <span className="text-xs text-gray-400">
                        {new Date(comment.createdAt).toLocaleString('fr-FR')}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{comment.content}</p>
                  </div>
                ))}
                {comments.length === 0 && (
                  <p className="text-sm text-gray-400 text-center py-4">Aucun commentaire</p>
                )}
              </div>

              {/* Ajouter un commentaire */}
              <div className="border-t border-gray-100 dark:border-gray-700 pt-4">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Ajouter un commentaire..."
                  className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3 text-sm min-h-[80px] resize-y"
                />
                <div className="flex gap-2 mt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleAddComment(false)}
                    disabled={!newComment.trim()}
                  >
                    Commentaire public
                  </Button>
                  {can(PermissionCode.DEMANDE_VALIDATE) && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleAddComment(true)}
                      disabled={!newComment.trim()}
                    >
                      Note interne
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ── Sous-composant InfoCard ──
const InfoCard: React.FC<{
  icon: React.ElementType;
  label: string;
  value: string;
  subValue?: string;
}> = ({ icon: Icon, label, value, subValue }) => (
  <div className="flex items-start gap-3">
    <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center shrink-0">
      <Icon className="h-5 w-5 text-gray-500" />
    </div>
    <div>
      <p className="text-xs text-gray-500 uppercase tracking-wider">{label}</p>
      <p className="text-sm font-medium text-gray-900 dark:text-white">{value}</p>
      {subValue && <p className="text-xs text-gray-400">{subValue}</p>}
    </div>
  </div>
);