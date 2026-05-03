import React, { useState } from 'react';
import { 
  Download, Eye, FileText, Clock, CheckCircle, XCircle, AlertCircle,
  Send, Paperclip, User, Calendar, Hash, MessageSquare, History,
  ChevronLeft, MoreVertical, Edit, Trash2, Shield, Lock
} from 'lucide-react';
import Button from '../../components/ui/button/Button';
import Badge from '../../components/ui/badge/Badge';
import Card from '../../components/ui/card/Card';
import Input from '../../components/form/input/InputField';
import Select from '../../components/form/Select';
import { Modal } from '../../components/ui/modal';
import TextArea from '../../components/form/input/TextArea';
import Label from '../../components/form/Label';

// Types et interfaces
interface Document {
  id: string;
  name: string;
  type: string;
  size: string;
  uploadedAt: string;
  uploadedBy: string;
  category: 'student' | 'embassy';
  url: string;
}

interface Message {
  id: string;
  sender: 'student' | 'agent';
  senderName: string;
  content: string;
  timestamp: string;
  documents?: Document[];
  isRead: boolean;
}

interface HistoryEntry {
  id: string;
  action: 'submitted' | 'approved' | 'rejected' | 'put_on_hold' | 'info_requested' | 'status_changed' | 'document_uploaded';
  actor: string;
  timestamp: string;
  details?: string;
  previousStatus?: string;
  newStatus?: string;
}

interface Request {
  id: string;
  dossierNumber: string;
  studentName: string;
  studentId: string;
  studentINUE: string;
  studentEmail: string;
  studentPhone: string;
  serviceType: 'passeport' | 'carte_consulaire' | 'attestation' | 'visa' | 'autre';
  status: 'pending' | 'in_progress' | 'approved' | 'rejected' | 'on_hold';
  submissionDate: string;
  lastUpdate: string;
  processingTime?: number;
  assignedAgent?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  documents: Document[];
  messages: Message[];
  history: HistoryEntry[];
  notes?: string;
}

// Données mockées
const mockRequest: Request = {
  id: '1',
  dossierNumber: 'DOSS-2024-001',
  studentName: 'Moussa Diarra',
  studentId: 'STU-001',
  studentINUE: 'INUE-2024-001',
  studentEmail: 'moussa.diarra@email.com',
  studentPhone: '+212 6 12 34 56 78',
  serviceType: 'passeport',
  status: 'in_progress',
  submissionDate: '2024-01-15T10:30:00',
  lastUpdate: '2024-01-16T14:20:00',
  processingTime: 2,
  assignedAgent: 'Agent Konaté',
  priority: 'high',
  documents: [
    {
      id: 'doc1',
      name: 'pièce_identité.pdf',
      type: 'PDF',
      size: '2.4 MB',
      uploadedAt: '2024-01-15T10:25:00',
      uploadedBy: 'Moussa Diarra',
      category: 'student',
      url: '/documents/pièce_identité.pdf'
    },
    {
      id: 'doc2',
      name: 'photo_identite.jpg',
      type: 'JPG',
      size: '1.2 MB',
      uploadedAt: '2024-01-15T10:28:00',
      uploadedBy: 'Moussa Diarra',
      category: 'student',
      url: '/documents/photo_identite.jpg'
    },
    {
      id: 'doc3',
      name: 'verification_identite.pdf',
      type: 'PDF',
      size: '1.8 MB',
      uploadedAt: '2024-01-16T09:15:00',
      uploadedBy: 'Agent Konaté',
      category: 'embassy',
      url: '/documents/verification_identite.pdf'
    }
  ],
  messages: [
    {
      id: 'msg1',
      sender: 'student',
      senderName: 'Moussa Diarra',
      content: 'Bonjour, je soumets ma demande de passeport. Merci de traiter ma demande.',
      timestamp: '2024-01-15T10:30:00',
      isRead: true
    },
    {
      id: 'msg2',
      sender: 'agent',
      senderName: 'Agent Konaté',
      content: 'Nous avons bien reçu votre dossier. Une vérification d\'identité est nécessaire.',
      timestamp: '2024-01-16T09:15:00',
      documents: [{
        id: 'doc3',
        name: 'verification_identite.pdf',
        type: 'PDF',
        size: '1.8 MB',
        uploadedAt: '2024-01-16T09:15:00',
        uploadedBy: 'Agent Konaté',
        category: 'embassy',
        url: '/documents/verification_identite.pdf'
      }],
      isRead: true
    }
  ],
  history: [
    {
      id: 'hist1',
      action: 'submitted',
      actor: 'Moussa Diarra',
      timestamp: '2024-01-15T10:30:00',
      details: 'Demande soumise avec succès'
    },
    {
      id: 'hist2',
      action: 'document_uploaded',
      actor: 'Moussa Diarra',
      timestamp: '2024-01-15T10:30:00',
      details: '2 documents téléversés'
    },
    {
      id: 'hist3',
      action: 'status_changed',
      actor: 'Agent Konaté',
      timestamp: '2024-01-16T09:15:00',
      previousStatus: 'pending',
      newStatus: 'in_progress',
      details: 'Dossier pris en charge pour vérification'
    },
    {
      id: 'hist4',
      action: 'document_uploaded',
      actor: 'Agent Konaté',
      timestamp: '2024-01-16T09:15:00',
      details: 'Document de vérification ajouté'
    }
  ],
  notes: 'Vérification d\'identité en cours. Contacter l\'université pour confirmation.'
};

// Composants réutilisables
const DocumentCard: React.FC<{ document: Document }> = ({ document }) => {
  const getFileIcon = (type: string) => {
    if (type === 'PDF') return <FileText className="w-5 h-5 text-red-500" />;
    if (type === 'JPG' || type === 'JPEG' || type === 'PNG') return <Eye className="w-5 h-5 text-blue-500" />;
    return <Paperclip className="w-5 h-5 text-gray-500" />;
  };

  return (
    <Card className="p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          {getFileIcon(document.type)}
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white">{document.name}</h4>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {document.size} • {new Date(document.uploadedAt).toLocaleDateString()}
            </p>
          </div>
        </div>
        <Badge color={document.category === 'student' ? 'primary' : 'success'} variant="light">
          {document.category === 'student' ? 'Étudiant' : 'Ambassade'}
        </Badge>
      </div>
      
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-500 dark:text-gray-400">
          Par {document.uploadedBy}
        </span>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={() => window.open(document.url, '_blank')}>
            <Eye className="w-4 h-4 mr-1" />
            Voir
          </Button>
          <Button variant="ghost" size="sm" onClick={() => {
            // Simulation de téléchargement
            const link = (document as Document).createElement('a') as HTMLAnchorElement;
            link.href = document.url;
            link.download = document.name;
            link.click();
          }}>
            <Download className="w-4 h-4 mr-1" />
            Télécharger
          </Button>
        </div>
      </div>
    </Card>
  );
};

const MessageBubble: React.FC<{ message: Message }> = ({ message }) => {
  const isAgent = message.sender === 'agent';

  return (
    <div className={`flex ${isAgent ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`max-w-md ${
        isAgent 
          ? 'bg-blue-100 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700' 
          : 'bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600'
      } rounded-lg p-4`}>
        <div className="flex items-center gap-2 mb-2">
          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
            isAgent 
              ? 'bg-blue-500 text-white' 
              : 'bg-gray-500 text-white'
          }`}>
            {message.senderName.charAt(0)}
          </div>
          <span className="text-sm font-medium text-gray-900 dark:text-white">
            {message.senderName}
          </span>
          <span className="text-xs text-gray-500">
            {new Date(message.timestamp).toLocaleString()}
          </span>
        </div>
        
        <p className="text-gray-800 dark:text-gray-200 mb-2">{message.content}</p>
        
        {message.documents && message.documents.length > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
            <p className="text-xs text-gray-500 mb-2">Documents joints:</p>
            {message.documents.map(doc => (
              <div key={doc.id} className="flex items-center gap-2 p-2 bg-white dark:bg-gray-800 rounded text-sm">
                <Paperclip className="w-3 h-3 text-gray-400" />
                <span className="text-gray-700 dark:text-gray-300">{doc.name}</span>
                <Button variant="ghost" size="xs" onClick={() => window.open(doc.url, '_blank')}>
                  <Eye className="w-3 h-3" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const HistoryItem: React.FC<{ entry: HistoryEntry }> = ({ entry }) => {
  const getActionIcon = (action: string) => {
    switch (action) {
      case 'approved': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'rejected': return <XCircle className="w-4 h-4 text-red-500" />;
      case 'put_on_hold': return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      case 'info_requested': return <MessageSquare className="w-4 h-4 text-blue-500" />;
      default: return <History className="w-4 h-4 text-gray-500" />;
    }
  };

  const getActionText = (action: string) => {
    switch (action) {
      case 'submitted': return 'a soumis la demande';
      case 'approved': return 'a approuvé la demande';
      case 'rejected': return 'a rejeté la demande';
      case 'put_on_hold': return 'a mis en attente';
      case 'info_requested': return 'a demandé des informations complémentaires';
      case 'status_changed': return 'a changé le statut';
      case 'document_uploaded': return 'a ajouté un document';
      default: return action;
    }
  };

  return (
    <div className="flex gap-3 py-3 border-b border-gray-100 dark:border-gray-700 last:border-b-0">
      <div className="flex-shrink-0">
        {getActionIcon(entry.action)}
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-900 dark:text-white">{entry.actor}</span>
          <span className="text-sm text-gray-500">{getActionText(entry.action)}</span>
        </div>
        {entry.details && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{entry.details}</p>
        )}
        {entry.previousStatus && entry.newStatus && (
          <div className="flex items-center gap-2 mt-1">
            <Badge color="gray" variant="light">{entry.previousStatus}</Badge>
            <span className="text-gray-400">→</span>
            <Badge color="primary" variant="light">{entry.newStatus}</Badge>
          </div>
        )}
        <p className="text-xs text-gray-500 mt-1">
          {new Date(entry.timestamp).toLocaleString()}
        </p>
      </div>
    </div>
  );
};

// Composant principal RequestDetailPage
const RequestDetailPage: React.FC = () => {
  const [request, setRequest] = useState<Request>(mockRequest);
  const [newMessage, setNewMessage] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [actionModal, setActionModal] = useState<'approve' | 'reject' | 'hold' | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [holdReason, setHoldReason] = useState('');

  const handleSendMessage = () => {
    if (!newMessage.trim() && selectedFiles.length === 0) return;

    const newMessageObj: Message = {
      id: `msg${Date.now()}`,
      sender: 'agent',
      senderName: 'Agent Konaté',
      content: newMessage,
      timestamp: new Date().toISOString(),
      documents: selectedFiles.map(file => ({
        id: `doc${Date.now()}_${file.name}`,
        name: file.name,
        type: file.type.split('/')[1].toUpperCase(),
        size: `${(file.size / 1024 / 1024).toFixed(1)} MB`,
        uploadedAt: new Date().toISOString(),
        uploadedBy: 'Agent Konaté',
        category: 'embassy',
        url: URL.createObjectURL(file)
      })),
      isRead: false
    };

    setRequest(prev => ({
      ...prev,
      messages: [...prev.messages, newMessageObj],
      history: [...prev.history, {
        id: `hist${Date.now()}`,
        action: selectedFiles.length > 0 ? 'document_uploaded' : 'info_requested',
        actor: 'Agent Konaté',
        timestamp: new Date().toISOString(),
        details: selectedFiles.length > 0 
          ? `${selectedFiles.length} document(s) envoyé(s) avec message` 
          : 'Message envoyé à l\'étudiant'
      }]
    }));

    setNewMessage('');
    setSelectedFiles([]);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setSelectedFiles(prev => [...prev, ...files]);
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const performAction = (action: 'approve' | 'reject' | 'hold') => {
    let newStatus: Request['status'] = 'approved';
    let actionType: HistoryEntry['action'] = 'approved';
    let details = '';

    switch (action) {
      case 'approve':
        newStatus = 'approved';
        actionType = 'approved';
        details = 'Demande approuvée avec succès';
        break;
      case 'reject':
        newStatus = 'rejected';
        actionType = 'rejected';
        details = `Demande rejetée: ${rejectionReason}`;
        break;
      case 'hold':
        newStatus = 'on_hold';
        actionType = 'put_on_hold';
        details = `Mise en attente: ${holdReason}`;
        break;
    }

    setRequest(prev => ({
      ...prev,
      status: newStatus,
      lastUpdate: new Date().toISOString(),
      history: [...prev.history, {
        id: `hist${Date.now()}`,
        action: actionType,
        actor: 'Agent Konaté',
        timestamp: new Date().toISOString(),
        details,
        previousStatus: prev.status,
        newStatus
      }]
    }));

    setActionModal(null);
    setRejectionReason('');
    setHoldReason('');
  };

  const statusConfig = {
    pending: { color: 'warning', text: 'En attente', icon: Clock },
    in_progress: { color: 'info', text: 'En cours', icon: AlertCircle },
    approved: { color: 'success', text: 'Approuvé', icon: CheckCircle },
    rejected: { color: 'error', text: 'Rejeté', icon: XCircle },
    on_hold: { color: 'warning', text: 'En attente', icon: Clock }
  };

  const { color: statusColor, text: statusText, icon: StatusIcon } = statusConfig[request.status];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Button variant="ghost" onClick={() => window.history.back()} className="mb-4">
            <ChevronLeft className="w-4 h-4 mr-2" />
            Retour aux demandes
          </Button>
          
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Détails de la demande
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Gestion complète du dossier étudiant
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <Badge color={statusColor} variant="solid" startIcon={<StatusIcon className="w-4 h-4" />}>
                {statusText}
              </Badge>
              <Button variant="outline" size="sm">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Colonne principale */}
          <div className="lg:col-span-2 space-y-6">
            {/* Informations de la demande */}
            <Card>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Informations de la demande
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                    Informations étudiant
                  </h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-900 dark:text-white">{request.studentName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Hash className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600 dark:text-gray-400">{request.studentINUE}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-600 dark:text-gray-400">{request.studentEmail}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-600 dark:text-gray-400">{request.studentPhone}</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                    Détails de la demande
                  </h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-900 dark:text-white capitalize">
                        {request.serviceType.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600 dark:text-gray-400">
                        Soumis le {new Date(request.submissionDate).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600 dark:text-gray-400">
                        Dernière mise à jour: {new Date(request.lastUpdate).toLocaleDateString()}
                      </span>
                    </div>
                    {request.assignedAgent && (
                      <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600 dark:text-gray-400">
                          Assigné à: {request.assignedAgent}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Card>

            {/* Documents */}
            <Card>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Documents ({request.documents.length})
              </h2>
              
              <div className="grid grid-cols-1 gap-3">
                {request.documents.map(document => (
                  <DocumentCard key={document.id} document={document} />
                ))}
              </div>
            </Card>

            {/* Communication */}
            <Card>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Communication avec l'étudiant
              </h2>
              
              <div className="mb-4 max-h-96 overflow-y-auto">
                {request.messages.map(message => (
                  <MessageBubble key={message.id} message={message} />
                ))}
              </div>

              {/* Input d'envoi de message */}
              <div className="border-t pt-4">
                {selectedFiles.length > 0 && (
                  <div className="mb-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Fichiers à envoyer:
                    </p>
                    {selectedFiles.map((file, index) => (
                      <div key={index} className="flex items-center justify-between py-2">
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {file.name}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex gap-2">
                  <label className="cursor-pointer p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                    <Paperclip className="w-5 h-5" />
                    <input
                      id="file-upload"
                      title="Ajouter des fichiers"
                      type="file"
                      multiple
                      className="hidden"
                      onChange={handleFileUpload}
                    />
                  </label>
                  
                  <Input
                    placeholder="Écrivez un message à l'étudiant..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    className="flex-1"
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  />
                  
                  <Button onClick={handleSendMessage} disabled={!newMessage.trim() && selectedFiles.length === 0}>
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Actions */}
            <Card>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Actions
              </h3>
              
              <div className="space-y-3">
                <Button 
                  variant="success" 
                  className="w-full justify-center"
                  onClick={() => setActionModal('approve')}
                  disabled={request.status === 'approved'}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Approuver la demande
                </Button>
                
                <Button 
                  variant="error" 
                  className="w-full justify-center"
                  onClick={() => setActionModal('reject')}
                  disabled={request.status === 'rejected'}
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Rejeter la demande
                </Button>
                
                <Button 
                  variant="warning" 
                  className="w-full justify-center"
                  onClick={() => setActionModal('hold')}
                  disabled={request.status === 'on_hold'}
                >
                  <Clock className="w-4 h-4 mr-2" />
                  Mettre en attente
                </Button>
                
                <Button variant="outline" className="w-full justify-center">
                  <Edit className="w-4 h-4 mr-2" />
                  Modifier l'assignation
                </Button>
              </div>
            </Card>

            {/* Historique */}
            <Card>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Historique des actions
              </h3>
              
              <div className="max-h-96 overflow-y-auto">
                {request.history.map(entry => (
                  <HistoryItem key={entry.id} entry={entry} />
                ))}
              </div>
            </Card>

            {/* Notes internes */}
            {request.notes && (
              <Card>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Notes internes
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg">
                  {request.notes}
                </p>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Modals d'actions - Version améliorée */}
      
      {/* Modal d'approbation */}
      <Modal
        isOpen={actionModal === 'approve'}
        onClose={() => setActionModal(null)}
        className="max-w-md mx-4"
      >
        <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
          {/* Header avec icône */}
          <div className="relative p-6 pb-4">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-500 to-green-600" />
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Approuver la demande
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Validation administrative
                </p>
              </div>
            </div>
          </div>

          {/* Contenu */}
          <div className="px-6 pb-4">
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-yellow-800 dark:text-yellow-200">
                  <p className="font-medium mb-1">⚠️ Action irréversible</p>
                  <p>Cette action validera définitivement la demande et générera l'INUE.</p>
                </div>
              </div>
            </div>

            <div className="space-y-3 mb-6">
              <p className="text-gray-700 dark:text-gray-300">
                Êtes-vous sûr de vouloir approuver cette demande ?
              </p>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1 ml-4">
                <li>• Un identifiant INUE sera automatiquement attribué</li>
                <li>• L'utilisateur recevra une notification par email</li>
                <li>• La demande sera marquée comme "Validée"</li>
              </ul>
            </div>
          </div>

          {/* Footer avec boutons */}
          <div className="flex justify-end gap-3 px-6 py-4 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700">
            <Button
              variant="outline"
              onClick={() => setActionModal(null)}
              className="px-4 py-2"
            >
              Annuler
            </Button>
            <Button
              variant="success"
              onClick={() => performAction('approve')}
              className="px-4 py-2 bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Confirmer l'approbation
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal de rejet */}
      <Modal
        isOpen={actionModal === 'reject'}
        onClose={() => setActionModal(null)}
        className="max-w-md mx-4"
      >
        <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
          {/* Header avec icône */}
          <div className="relative p-6 pb-4">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 to-red-600" />
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <XCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Rejeter la demande
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Motif obligatoire
                </p>
              </div>
            </div>
          </div>

          {/* Contenu */}
          <div className="px-6 pb-4">
            <div className="space-y-4">
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-red-800 dark:text-red-200">
                    <p className="font-medium mb-1">⚠️ Action définitive</p>
                    <p>Le rejet est irréversible. L'utilisateur devra soumettre une nouvelle demande.</p>
                  </div>
                </div>
              </div>

              <div>
                <Label className="text-gray-700 dark:text-gray-300 mb-2 block">
                  Raison du rejet <span className="text-red-500">*</span>
                </Label>
                <TextArea
                  placeholder="Expliquez clairement la raison du rejet..."
                  value={rejectionReason}
                  onChange={(value) => setRejectionReason(value)}
                  rows={4}
                  className="w-full resize-none focus:ring-2 focus:ring-red-500"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  Cette raison sera communiquée à l'utilisateur par email.
                </p>
              </div>

              {rejectionReason && rejectionReason.length < 10 && (
                <p className="text-xs text-orange-600 dark:text-orange-400 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  Veuillez fournir une raison plus détaillée (minimum 10 caractères)
                </p>
              )}
            </div>
          </div>

          {/* Footer avec boutons */}
          <div className="flex justify-end gap-3 px-6 py-4 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700">
            <Button
              variant="outline"
              onClick={() => {
                setActionModal(null);
                setRejectionReason('');
              }}
              className="px-4 py-2"
            >
              Annuler
            </Button>
            <Button
              variant="error"
              onClick={() => performAction('reject')}
              disabled={!rejectionReason.trim() || rejectionReason.length < 10}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <XCircle className="w-4 h-4 mr-2" />
              Confirmer le rejet
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal de mise en attente */}
      <Modal
        isOpen={actionModal === 'hold'}
        onClose={() => setActionModal(null)}
        className="max-w-md mx-4"
      >
        <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
          {/* Header avec icône */}
          <div className="relative p-6 pb-4">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-500 to-amber-500" />
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                <Clock className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Mettre en attente
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Saisir le motif
                </p>
              </div>
            </div>
          </div>

          {/* Contenu */}
          <div className="px-6 pb-4">
            <div className="space-y-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-blue-800 dark:text-blue-200">
                    <p className="font-medium mb-1">📋 Information</p>
                    <p>L'utilisateur sera notifié et pourra compléter son dossier après la mise en attente.</p>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-gray-700 dark:text-gray-300 mb-2 block">
                  Motif de la mise en attente <span className="text-red-500">*</span>
                </label>
                <TextArea
                  placeholder="Ex: Documents manquants, informations à compléter, etc."
                  value={holdReason}
                  onChange={(value) => setHoldReason(value)}
                  rows={4}
                  className="w-full resize-none focus:ring-2 focus:ring-orange-500"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  Précisez ce qui manque ou doit être modifié dans le dossier.
                </p>
              </div>

              {holdReason && holdReason.length < 10 && (
                <p className="text-xs text-orange-600 dark:text-orange-400 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  Veuillez fournir un motif plus détaillé (minimum 10 caractères)
                </p>
              )}
            </div>
          </div>

          {/* Footer avec boutons */}
          <div className="flex justify-end gap-3 px-6 py-4 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700">
            <Button
              variant="outline"
              onClick={() => {
                setActionModal(null);
                setHoldReason('');
              }}
              className="px-4 py-2"
            >
              Annuler
            </Button>
            <Button
              variant="warning"
              onClick={() => performAction('hold')}
              disabled={!holdReason.trim() || holdReason.length < 10}
              className="px-4 py-2 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Clock className="w-4 h-4 mr-2" />
              Confirmer la mise en attente
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default RequestDetailPage;