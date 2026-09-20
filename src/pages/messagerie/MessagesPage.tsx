// src/pages/messagerie/MessagesPage.tsx

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, Plus, Users, Lock, AlertTriangle, Check } from 'lucide-react';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Modal } from '../../components/ui/modal';
import { PermissionGuard } from '../../components/auth/PermissionGuard';
import { useCommunication } from '../../hooks/useCommunication';
import { useAgents } from '../../hooks/useAgents';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { PermissionCode } from '../../types/auth';
import { ThreadStatus, ThreadType } from '../../types/communication';
import { timeAgo } from '../../lib/date';

const STATUS_CONFIG: Record<ThreadStatus, { label: string; color: 'success' | 'gray' | 'error' }> = {
  [ThreadStatus.OPEN]: { label: 'Ouverte', color: 'success' },
  [ThreadStatus.CLOSED]: { label: 'Fermée', color: 'gray' },
  [ThreadStatus.ESCALATED]: { label: 'Escaladée', color: 'error' },
};

const TYPE_LABEL: Record<ThreadType, string> = {
  [ThreadType.DEMANDE]: 'Liée à une demande',
  [ThreadType.GENERAL]: 'Générale',
  [ThreadType.URGENT]: 'Urgente',
};

const MessagesPage: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { threads, isLoading, fetchThreads, createThread } = useCommunication();
  const { agents, fetchAgents } = useAgents();

  const [showNewThread, setShowNewThread] = useState(false);
  const [subject, setSubject] = useState('');
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    fetchThreads();
  }, []);

  const handleOpenNewThread = () => {
    fetchAgents();
    setShowNewThread(true);
  };

  const toggleParticipant = (userId: string) => {
    setSelectedParticipants((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleCreate = async () => {
    if (!subject.trim()) {
      toast({ title: 'Objet requis', description: 'Donnez un objet à la conversation.', variant: 'warning' });
      return;
    }
    if (selectedParticipants.length === 0) {
      toast({ title: 'Destinataire requis', description: 'Sélectionnez au moins un destinataire.', variant: 'warning' });
      return;
    }

    setIsCreating(true);
    try {
      const thread = await createThread(null, subject, selectedParticipants);
      setShowNewThread(false);
      setSubject('');
      setSelectedParticipants([]);
      navigate(`/communication/messages/${thread.id}`);
    } catch {
      toast({ title: 'Erreur', description: 'Impossible de créer la conversation.', variant: 'error' });
    } finally {
      setIsCreating(false);
    }
  };

  const otherAgents = agents.filter((a) => a.user.id !== user?.id);

  return (
    <PermissionGuard minRoleLevel={6} permission={PermissionCode.MESSAGE_READ} title="Messagerie interne">
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Messagerie interne</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                {threads.length} conversation{threads.length > 1 ? 's' : ''}
              </p>
            </div>
            <Button variant="primary" onClick={handleOpenNewThread}>
              <Plus className="w-4 h-4 mr-2" />
              Nouvelle conversation
            </Button>
          </div>

          <div className="space-y-3">
            {isLoading ? (
              <Card className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500 mx-auto" />
              </Card>
            ) : threads.length === 0 ? (
              <Card className="p-12 text-center">
                <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Aucune conversation</h3>
                <p className="text-gray-500 dark:text-gray-400">
                  Démarrez une conversation avec un collègue pour commencer à échanger.
                </p>
              </Card>
            ) : (
              threads.map((thread) => (
                <Card
                  key={thread.id}
                  className="p-4 cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => navigate(`/communication/messages/${thread.id}`)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium text-gray-900 dark:text-white">{thread.subject}</span>
                        <Badge color={STATUS_CONFIG[thread.status].color} variant="light" size="xs">
                          {thread.status === ThreadStatus.ESCALATED && <AlertTriangle className="w-3 h-3 mr-1" />}
                          {STATUS_CONFIG[thread.status].label}
                        </Badge>
                        <Badge color="gray" variant="light" size="xs">
                          {TYPE_LABEL[thread.type]}
                        </Badge>
                      </div>
                      {thread.lastMessage && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 truncate">
                          <span className="font-medium">{thread.lastMessage.senderName} :</span> {thread.lastMessage.body}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
                        <Users className="w-3 h-3" />
                        {thread.participants.map((p) => p.userName).join(', ')}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2 flex-shrink-0">
                      <span className="text-xs text-gray-400">
                        {timeAgo(thread.lastMessage?.createdAt ?? thread.createdAt)}
                      </span>
                      {thread.unreadCount > 0 && (
                        <Badge color="primary" variant="solid" size="xs">
                          {thread.unreadCount}
                        </Badge>
                      )}
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>

        <Modal isOpen={showNewThread} onClose={() => setShowNewThread(false)} title="Nouvelle conversation" size="md">
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Objet</label>
              <Input
                placeholder="Objet de la conversation..."
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                <Lock className="w-3 h-3 inline mr-1" />
                Destinataires
              </label>
              <div className="space-y-1 max-h-60 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg p-2">
                {otherAgents.map((agent) => {
                  const isSelected = selectedParticipants.includes(agent.user.id);
                  return (
                    <div
                      key={agent.id}
                      className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${
                        isSelected ? 'bg-brand-50 dark:bg-brand-900/20' : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                      }`}
                      onClick={() => toggleParticipant(agent.user.id)}
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-xs font-medium">
                          {agent.user.profile.firstName.charAt(0)}
                          {agent.user.profile.lastName.charAt(0)}
                        </div>
                        <span className="text-sm text-gray-900 dark:text-white">
                          {agent.user.profile.firstName} {agent.user.profile.lastName}
                        </span>
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-brand-500" />}
                    </div>
                  );
                })}
                {otherAgents.length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-4">Aucun autre agent disponible</p>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button variant="ghost" onClick={() => setShowNewThread(false)}>
                Annuler
              </Button>
              <Button variant="primary" onClick={handleCreate} disabled={isCreating}>
                {isCreating ? 'Création...' : 'Créer'}
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </PermissionGuard>
  );
};

export default MessagesPage;
