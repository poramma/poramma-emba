// src/pages/messagerie/ThreadDetailPage.tsx

import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, Paperclip, Users, CheckCircle, RotateCcw, AlertTriangle, X, UserPlus } from 'lucide-react';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Modal } from '../../components/ui/modal';
import { PermissionGuard } from '../../components/auth/PermissionGuard';
import { useCommunication } from '../../hooks/useCommunication';
import { useAgents } from '../../hooks/useAgents';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { PermissionCode } from '../../types/auth';
import { ThreadStatus } from '../../types/communication';
import { formatDateShort } from '../../lib/date';

const STATUS_CONFIG: Record<ThreadStatus, { label: string; color: 'success' | 'gray' | 'error' }> = {
  [ThreadStatus.OPEN]: { label: 'Ouverte', color: 'success' },
  [ThreadStatus.CLOSED]: { label: 'Fermée', color: 'gray' },
  [ThreadStatus.ESCALATED]: { label: 'Escaladée', color: 'error' },
};

const ThreadDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const {
    threads,
    messages,
    isLoading,
    fetchThreads,
    fetchThreadMessages,
    sendMessage,
    markThreadRead,
    updateThreadStatus,
    addThreadParticipant,
  } = useCommunication();
  const { agents, fetchAgents } = useAgents();

  const [content, setContent] = useState('');
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [showAddParticipant, setShowAddParticipant] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const thread = threads.find((t) => t.id === id);

  useEffect(() => {
    if (!id) return;
    if (threads.length === 0) fetchThreads();
    fetchThreadMessages(id);
    markThreadRead(id);
  }, [id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const handleSend = async () => {
    if (!id || !content.trim()) return;
    setIsSending(true);
    try {
      await sendMessage(id, content, pendingFiles.length ? pendingFiles : undefined);
      setContent('');
      setPendingFiles([]);
    } catch {
      toast({ title: 'Erreur', description: "Impossible d'envoyer le message.", variant: 'error' });
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleStatusChange = async (status: ThreadStatus) => {
    if (!id) return;
    try {
      await updateThreadStatus(id, status);
    } catch {
      toast({ title: 'Erreur', description: 'Impossible de changer le statut.', variant: 'error' });
    }
  };

  const handleOpenAddParticipant = () => {
    fetchAgents();
    setShowAddParticipant(true);
  };

  const handleAddParticipant = async (userId: string) => {
    if (!id) return;
    try {
      await addThreadParticipant(id, userId);
      setShowAddParticipant(false);
      toast({ title: 'Participant ajouté', description: 'La conversation a été mise à jour.', variant: 'success' });
    } catch {
      toast({ title: 'Erreur', description: "Impossible d'ajouter ce participant.", variant: 'error' });
    }
  };

  if (!thread && !isLoading) {
    return (
      <PermissionGuard minRoleLevel={6} permission={PermissionCode.MESSAGE_READ} title="Conversation">
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
          <Card className="max-w-2xl mx-auto p-8 text-center">
            <p className="text-gray-500 dark:text-gray-400">Conversation introuvable.</p>
            <Button variant="outline" className="mt-4" onClick={() => navigate('/communication/messages')}>
              Retour aux conversations
            </Button>
          </Card>
        </div>
      </PermissionGuard>
    );
  }

  const nonParticipants = agents.filter((a) => !thread?.participants.some((p) => p.userId === a.user.id));

  return (
    <PermissionGuard minRoleLevel={6} permission={PermissionCode.MESSAGE_READ} title="Conversation">
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-4xl mx-auto space-y-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/communication/messages')} className="-ml-2">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour aux conversations
          </Button>

          {thread && (
            <>
              <Card className="p-4">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h1 className="text-xl font-bold text-gray-900 dark:text-white">{thread.subject}</h1>
                      <Badge color={STATUS_CONFIG[thread.status].color} variant="light" size="sm">
                        {STATUS_CONFIG[thread.status].label}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1 mt-2 text-sm text-gray-500 dark:text-gray-400">
                      <Users className="w-4 h-4" />
                      {thread.participants.map((p) => p.userName).join(', ')}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" onClick={handleOpenAddParticipant}>
                      <UserPlus className="w-4 h-4 mr-1" />
                      Ajouter
                    </Button>
                    {thread.status !== ThreadStatus.CLOSED && (
                      <Button variant="outline" size="sm" onClick={() => handleStatusChange(ThreadStatus.CLOSED)}>
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Fermer
                      </Button>
                    )}
                    {thread.status === ThreadStatus.CLOSED && (
                      <Button variant="outline" size="sm" onClick={() => handleStatusChange(ThreadStatus.OPEN)}>
                        <RotateCcw className="w-4 h-4 mr-1" />
                        Rouvrir
                      </Button>
                    )}
                    {thread.status !== ThreadStatus.ESCALATED && (
                      <Button variant="outline" size="sm" onClick={() => handleStatusChange(ThreadStatus.ESCALATED)}>
                        <AlertTriangle className="w-4 h-4 mr-1" />
                        Escalader
                      </Button>
                    )}
                  </div>
                </div>
              </Card>

              <Card className="p-4">
                <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-1">
                  {messages.length === 0 && (
                    <p className="text-sm text-gray-500 text-center py-8">Aucun message pour le moment.</p>
                  )}
                  {messages.map((msg) => {
                    const isOwn = msg.senderId === user?.id;
                    return (
                      <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[75%] ${isOwn ? 'items-end' : 'items-start'} flex flex-col`}>
                          {!isOwn && (
                            <span className="text-xs text-gray-500 dark:text-gray-400 mb-1">{msg.senderName}</span>
                          )}
                          <div
                            className={`rounded-lg px-3 py-2 text-sm ${
                              isOwn
                                ? 'bg-brand-500 text-white'
                                : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white'
                            }`}
                          >
                            {msg.body}
                          </div>
                          {msg.attachments && msg.attachments.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {msg.attachments.map((file: any) => (
                                <a
                                  key={file.id}
                                  href="#"
                                  onClick={(e) => e.preventDefault()}
                                  className="text-xs text-gray-500 underline flex items-center gap-1"
                                >
                                  <Paperclip className="w-3 h-3" />
                                  {file.originalName}
                                </a>
                              ))}
                            </div>
                          )}
                          <span className="text-xs text-gray-400 mt-1">{formatDateShort(msg.createdAt)}</span>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={bottomRef} />
                </div>
              </Card>

              {thread.status !== ThreadStatus.CLOSED ? (
                <Card className="p-3">
                  {pendingFiles.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-2">
                      {pendingFiles.map((file, i) => (
                        <Badge key={i} color="gray" variant="light" size="xs">
                          {file.name}
                          <button
                            className="ml-1"
                            onClick={() => setPendingFiles((prev) => prev.filter((_, idx) => idx !== i))}
                          >
                            <X className="w-3 h-3 inline" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                  <div className="flex items-end gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      className="hidden"
                      accept="application/pdf,image/jpeg,image/png,image/webp"
                      onChange={(e) => {
                        if (e.target.files) setPendingFiles((prev) => [...prev, ...Array.from(e.target.files!)]);
                        e.target.value = '';
                      }}
                    />
                    <Button variant="ghost" size="sm" onClick={() => fileInputRef.current?.click()}>
                      <Paperclip className="w-4 h-4" />
                    </Button>
                    <textarea
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Écrivez votre message... (Entrée pour envoyer)"
                      rows={2}
                      className="flex-1 resize-none rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                    <Button variant="primary" onClick={handleSend} disabled={isSending || !content.trim()}>
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </Card>
              ) : (
                <Card className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">
                  Cette conversation est fermée. Rouvrez-la pour continuer à échanger.
                </Card>
              )}
            </>
          )}
        </div>

        <Modal isOpen={showAddParticipant} onClose={() => setShowAddParticipant(false)} title="Ajouter un participant" size="sm">
          <div className="space-y-1 max-h-72 overflow-y-auto">
            {nonParticipants.map((agent) => (
              <div
                key={agent.id}
                className="flex items-center gap-2 p-2 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                onClick={() => handleAddParticipant(agent.user.id)}
              >
                <div className="w-7 h-7 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-xs font-medium">
                  {agent.user.profile.firstName.charAt(0)}
                  {agent.user.profile.lastName.charAt(0)}
                </div>
                <span className="text-sm text-gray-900 dark:text-white">
                  {agent.user.profile.firstName} {agent.user.profile.lastName}
                </span>
              </div>
            ))}
            {nonParticipants.length === 0 && (
              <p className="text-sm text-gray-500 text-center py-4">Tous les agents participent déjà</p>
            )}
          </div>
        </Modal>
      </div>
    </PermissionGuard>
  );
};

export default ThreadDetailPage;
