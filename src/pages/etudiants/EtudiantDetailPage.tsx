// src/pages/etudiants/EtudiantDetailPage.tsx

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, CheckCircle, XCircle, Ban, Award, Mail, Phone, MapPin,
  GraduationCap, Calendar, FileText, History, AlertCircle,
} from 'lucide-react';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Modal } from '../../components/ui/modal';
import { TextArea } from '../../components/ui/textarea';
import { Skeleton } from '../../components/ui/skeleton';
import { PermissionGuard } from '../../components/auth/PermissionGuard';
import { usePermission } from '../../hooks/usePermission';
import { useEtudiants } from '../../hooks/useEtudiants';
import { useToast } from '../../hooks/useToast';
import { EtudiantStatus } from '../../types/etudiant';
import { PermissionCode } from '../../types/auth';
import { formatDateShort, formatDateTime } from '../../lib/date';

const STATUS_CONFIG: Record<EtudiantStatus, { label: string; color: 'warning' | 'success' | 'error' | 'gray' }> = {
  [EtudiantStatus.PENDING]: { label: 'En attente', color: 'warning' },
  [EtudiantStatus.VALIDATED]: { label: 'Validé', color: 'success' },
  [EtudiantStatus.REJECTED]: { label: 'Rejeté', color: 'error' },
  [EtudiantStatus.SUSPENDED]: { label: 'Suspendu', color: 'gray' },
};

const EtudiantDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { can } = usePermission();
  const {
    selectedEtudiant, documents, auditLogs, isLoading,
    fetchEtudiantById, fetchAudit, validateEtudiant, rejectEtudiant, suspendEtudiant, assignInue,
  } = useEtudiants();

  const canValidate = can(PermissionCode.ETUDIANT_VALIDATE);

  const [reasonModal, setReasonModal] = useState<'reject' | 'suspend' | null>(null);
  const [reason, setReason] = useState('');
  const [isActing, setIsActing] = useState(false);

  useEffect(() => {
    if (id) {
      fetchEtudiantById(id);
      fetchAudit(id);
    }
  }, [id]);

  if (isLoading && !selectedEtudiant) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-5xl mx-auto space-y-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-40 w-full" />
        </div>
      </div>
    );
  }

  if (!selectedEtudiant) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <Card className="max-w-xl mx-auto p-8 text-center">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Étudiant introuvable</h3>
          <Button className="mt-4" variant="primary" onClick={() => navigate('/etudiants')}>
            Retour à la liste
          </Button>
        </Card>
      </div>
    );
  }

  const e = selectedEtudiant;

  const handleValidate = async () => {
    setIsActing(true);
    try {
      await validateEtudiant(e.id);
      toast({ title: 'Dossier validé', variant: 'success' });
      if (id) fetchAudit(id);
    } catch {
      toast({ title: 'Erreur', description: 'Impossible de valider ce dossier.', variant: 'error' });
    } finally {
      setIsActing(false);
    }
  };

  const handleConfirmReason = async () => {
    if (!reason.trim() || !reasonModal) return;
    setIsActing(true);
    try {
      if (reasonModal === 'reject') {
        await rejectEtudiant(e.id, reason);
        toast({ title: 'Dossier rejeté', variant: 'warning' });
      } else {
        await suspendEtudiant(e.id, reason);
        toast({ title: 'Étudiant suspendu', variant: 'warning' });
      }
      if (id) fetchAudit(id);
      setReasonModal(null);
      setReason('');
    } catch {
      toast({ title: 'Erreur', description: 'Action impossible.', variant: 'error' });
    } finally {
      setIsActing(false);
    }
  };

  const handleAssignInue = async () => {
    setIsActing(true);
    try {
      await assignInue(e.id);
      toast({ title: 'INUE attribué', variant: 'success' });
      if (id) fetchAudit(id);
    } catch (err: any) {
      toast({ title: 'Erreur', description: err?.response?.data?.error ?? 'Attribution impossible.', variant: 'error' });
    } finally {
      setIsActing(false);
    }
  };

  return (
    <PermissionGuard minRoleLevel={5} permission={PermissionCode.ETUDIANT_READ} title="Détail étudiant">
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate('/etudiants')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour
            </Button>
          </div>

          <Card className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center text-brand-600 font-bold text-2xl">
                  {(e.firstName?.charAt(0) ?? '?').toUpperCase()}
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {e.firstName} {e.lastName}
                  </h1>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    <Badge color={STATUS_CONFIG[e.status].color} variant="light">{STATUS_CONFIG[e.status].label}</Badge>
                    {e.inue && (
                      <Badge color="primary" variant="solid">
                        <Award className="w-3 h-3 mr-1" /> INUE {e.inue}
                      </Badge>
                    )}
                    {e.bourse && <Badge color="gray" variant="light">Boursier</Badge>}
                  </div>
                </div>
              </div>

              {canValidate && (
                <div className="flex flex-wrap gap-2">
                  {(e.status === EtudiantStatus.PENDING || e.status === EtudiantStatus.REJECTED) && (
                    <Button variant="primary" size="sm" onClick={handleValidate} disabled={isActing}>
                      <CheckCircle className="w-4 h-4 mr-1" /> Valider
                    </Button>
                  )}
                  {e.status !== EtudiantStatus.REJECTED && (
                    <Button variant="error" size="sm" onClick={() => setReasonModal('reject')} disabled={isActing}>
                      <XCircle className="w-4 h-4 mr-1" /> Rejeter
                    </Button>
                  )}
                  {e.status !== EtudiantStatus.SUSPENDED && (
                    <Button variant="outline" size="sm" onClick={() => setReasonModal('suspend')} disabled={isActing}>
                      <Ban className="w-4 h-4 mr-1" /> Suspendre
                    </Button>
                  )}
                  {e.status === EtudiantStatus.VALIDATED && !e.inue && (
                    <Button variant="primary" size="sm" onClick={handleAssignInue} disabled={isActing}>
                      <Award className="w-4 h-4 mr-1" /> Attribuer un INUE
                    </Button>
                  )}
                </div>
              )}
            </div>

            {e.reviewNote && (
              <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-sm text-gray-600 dark:text-gray-300">
                <span className="font-medium">Note de l'agent :</span> {e.reviewNote}
              </div>
            )}
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-5">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Informations</h3>
              <dl className="space-y-3 text-sm">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <dt className="text-gray-500 w-24">Email</dt>
                  <dd className="text-gray-900 dark:text-white">{e.email}</dd>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <dt className="text-gray-500 w-24">Téléphone</dt>
                  <dd className="text-gray-900 dark:text-white">{e.phone ?? '—'}</dd>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <dt className="text-gray-500 w-24">Ville</dt>
                  <dd className="text-gray-900 dark:text-white">{e.city ?? '—'} {e.country ? `(${e.country})` : ''}</dd>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <dt className="text-gray-500 w-24">Inscrit le</dt>
                  <dd className="text-gray-900 dark:text-white">{e.registeredAt ? formatDateShort(e.registeredAt) : '—'}</dd>
                </div>
              </dl>
            </Card>

            <Card className="p-5">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <GraduationCap className="w-4 h-4" /> Profil académique
              </h3>
              <dl className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <dt className="text-gray-500">Université</dt>
                  <dd className="text-gray-900 dark:text-white text-right">{e.profile.university ?? '—'}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">Faculté</dt>
                  <dd className="text-gray-900 dark:text-white text-right">{e.profile.faculty ?? '—'}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">Niveau</dt>
                  <dd className="text-gray-900 dark:text-white text-right">{e.profile.studyLevel ?? '—'}</dd>
                </div>
                {e.bourse && (
                  <div className="flex justify-between pt-2 border-t border-gray-100 dark:border-gray-800">
                    <dt className="text-gray-500">Bourse</dt>
                    <dd className="text-gray-900 dark:text-white text-right">
                      {e.bourse.promotion ?? '—'} {e.bourse.decisionNumber ? `• ${e.bourse.decisionNumber}` : ''}
                    </dd>
                  </div>
                )}
              </dl>
            </Card>
          </div>

          <Card className="p-5">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <FileText className="w-4 h-4" /> Documents ({documents.length})
            </h3>
            {documents.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">Aucun document soumis.</p>
            ) : (
              <div className="space-y-2">
                {documents.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center gap-3">
                      <FileText className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{doc.type}</p>
                        <p className="text-xs text-gray-400">{formatDateShort(doc.createdAt)}</p>
                      </div>
                    </div>
                    <Badge
                      color={doc.status === 'ACCEPTED' ? 'success' : doc.status === 'REJECTED' ? 'error' : 'warning'}
                      variant="light"
                      size="xs"
                    >
                      {doc.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card className="p-5">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <History className="w-4 h-4" /> Historique
            </h3>
            {auditLogs.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">Aucune action enregistrée.</p>
            ) : (
              <div className="space-y-2">
                {auditLogs.map((log) => (
                  <div key={log.id} className="flex items-center justify-between text-sm py-2 border-b border-gray-100 dark:border-gray-800 last:border-0">
                    <div>
                      <span className="font-medium text-gray-900 dark:text-white">{log.action}</span>
                      <span className="text-gray-400 ml-2">{log.actorName ?? 'Système'}</span>
                    </div>
                    <span className="text-xs text-gray-400">{formatDateTime(log.at)}</span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>

      <Modal
        isOpen={reasonModal !== null}
        onClose={() => { setReasonModal(null); setReason(''); }}
        title={reasonModal === 'reject' ? 'Motif du rejet' : 'Motif de la suspension'}
        size="sm"
      >
        <div className="space-y-4">
          <TextArea
            value={reason}
            onChange={(value) => setReason(value)}
            placeholder="Motif obligatoire..."
            rows={4}
          />
          <div className="flex justify-end gap-3 pt-2 border-t">
            <Button variant="ghost" onClick={() => { setReasonModal(null); setReason(''); }}>Annuler</Button>
            <Button variant="error" onClick={handleConfirmReason} disabled={!reason.trim() || isActing}>
              Confirmer
            </Button>
          </div>
        </div>
      </Modal>
    </PermissionGuard>
  );
};

export default EtudiantDetailPage;
