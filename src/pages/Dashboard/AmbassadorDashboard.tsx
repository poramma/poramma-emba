import React, { useState, useEffect } from 'react';
import { 
  BarChart3, Users, FileText, Clock, CheckCircle, XCircle, AlertCircle, 
  Download, Filter, Search, Bell, Calendar, TrendingUp, Shield,
  Mail, MessageSquare, Settings, LogOut, User, PieChart
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/ui/button/Button';
import Badge from '../../components/ui/badge/Badge';
import Input from '../../components/form/input/InputField';
import Select from '../../components/form/Select';
import Card from '../../components/ui/card/Card';

// Types et interfaces
interface Request {
  id: string;
  studentName: string;
  studentId: string;
  serviceType: 'passeport' | 'carte_consulaire' | 'attestation' | 'visa' | 'autre';
  status: 'pending' | 'in_progress' | 'approved' | 'rejected' | 'on_hold';
  submissionDate: string;
  processingTime?: number;
  documents: string[];
  assignedAgent?: string;
}

interface Stats {
  totalRequests: number;
  pending: number;
  inProgress: number;
  approved: number;
  rejected: number;
  averageProcessingTime: number;
}

interface Alert {
  id: string;
  type: 'warning' | 'error' | 'info' | 'success';
  message: string;
  timestamp: string;
  read: boolean;
}

interface ServiceMetric {
  service: string;
  count: number;
  percentage: number;
}

// Données mockées (à remplacer par l'API réelle)
const mockRequests: Request[] = [
  {
    id: 'REQ-001',
    studentName: 'Moussa Diarra',
    studentId: 'INUE-2024-001',
    serviceType: 'passeport',
    status: 'pending',
    submissionDate: '2024-01-15T10:30:00',
    documents: ['pièce_identité.pdf', 'photo.jpg']
  },
  {
    id: 'REQ-002',
    studentName: 'Aïcha Traoré',
    studentId: 'INUE-2024-002',
    serviceType: 'carte_consulaire',
    status: 'in_progress',
    submissionDate: '2024-01-14T09:15:00',
    processingTime: 3,
    assignedAgent: 'Agent Konaté',
    documents: ['certificat_scolarite.pdf', 'photo_identite.jpg']
  },
  {
    id: 'REQ-003',
    studentName: 'Amadou Keita',
    studentId: 'INUE-2024-003',
    serviceType: 'attestation',
    status: 'approved',
    submissionDate: '2024-01-10T14:20:00',
    processingTime: 2,
    documents: ['demande_attestation.pdf']
  }
];

const mockStats: Stats = {
  totalRequests: 156,
  pending: 23,
  inProgress: 15,
  approved: 98,
  rejected: 20,
  averageProcessingTime: 3.2
};

const mockAlerts: Alert[] = [
  {
    id: 'ALT-001',
    type: 'warning',
    message: '15 demandes en attente depuis plus de 48h',
    timestamp: '2024-01-15T09:00:00',
    read: false
  },
  {
    id: 'ALT-002',
    type: 'error',
    message: 'Problème de connexion avec le service des passeports',
    timestamp: '2024-01-15T08:30:00',
    read: true
  }
];

const serviceMetrics: ServiceMetric[] = [
  { service: 'Passeport', count: 45, percentage: 28.8 },
  { service: 'Carte consulaire', count: 38, percentage: 24.4 },
  { service: 'Attestation', count: 52, percentage: 33.3 },
  { service: 'Visa', count: 12, percentage: 7.7 },
  { service: 'Autre', count: 9, percentage: 5.8 }
];

// Composant StatCard réutilisable
const StatCard: React.FC<{
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: number;
  color?: 'primary' | 'success' | 'warning' | 'error' | 'info';
}> = ({ title, value, icon, trend, color = 'primary' }) => {
  const colorClasses = {
    primary: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20',
    success: 'text-green-600 bg-green-50 dark:bg-green-900/20',
    warning: 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20',
    error: 'text-red-600 bg-red-50 dark:bg-red-900/20',
    info: 'text-purple-600 bg-purple-50 dark:bg-purple-900/20'
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-300">{title}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
          {trend && (
            <div className={`flex items-center mt-1 text-sm ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
              <TrendingUp className="w-4 h-4 mr-1" />
              {trend > 0 ? '+' : ''}{trend}%
            </div>
          )}
        </div>
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          {icon}
        </div>
      </div>
    </Card>
  );
};

// Composant RequestCard réutilisable
const RequestCard: React.FC<{ request: Request }> = ({ request }) => {
  const statusConfig = {
    pending: { color: 'warning', text: 'En attente', icon: Clock },
    in_progress: { color: 'info', text: 'En cours', icon: BarChart3 },
    approved: { color: 'success', text: 'Approuvé', icon: CheckCircle },
    rejected: { color: 'error', text: 'Rejeté', icon: XCircle },
    on_hold: { color: 'warning', text: 'En attente', icon: AlertCircle }
  };
  const navigate = useNavigate();

  const { color, text, icon: Icon } = statusConfig[request.status];

  return (
    <Card className="p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h4 className="font-semibold text-gray-900 dark:text-white">{request.studentName}</h4>
          <p className="text-sm text-gray-600 dark:text-gray-300">{request.studentId}</p>
        </div>
        <Badge color={color } variant="light" startIcon={<Icon className="w-4 h-4" />}>
          {text}
        </Badge>
      </div>
      
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Service:</span>
          <span className="font-medium capitalize">{request.serviceType.replace('_', ' ')}</span>
        </div>
        
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Soumis le:</span>
          <span>{new Date(request.submissionDate).toLocaleDateString()}</span>
        </div>

        {request.assignedAgent && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Agent:</span>
            <span>{request.assignedAgent}</span>
          </div>
        )}

        {request.processingTime && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Temps de traitement:</span>
            <span>{request.processingTime} jours</span>
          </div>
        )}

        {request.documents.length > 0 && (
          <div className="pt-2">
            <p className="text-sm text-gray-500 mb-1">Documents:</p>
            <div className="flex flex-wrap gap-1">
              {request.documents.map((doc, index) => (
                <span key={index} className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs">
                  {doc}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-2 mt-4">
        <Button size="sm" variant="outline" className="flex-1"
        onClick={() => navigate(`/service/demandes/${request.id}`)}>
          Voir détails
        </Button>
        <Button size="sm" className="flex-1"
        onClick={() => navigate(`/service/demandes/${request.id}`)}>
          Traiter
        </Button>
      </div>
    </Card>

  );
};

// Composant AlertItem réutilisable
const AlertItem: React.FC<{ alert: Alert }> = ({ alert }) => {
  const iconConfig = {
    warning: AlertCircle,
    error: XCircle,
    info: Bell,
    success: CheckCircle
  };

  const Icon = iconConfig[alert.type];

  return (
    <div className={`p-3 rounded-lg border-l-4 ${
      alert.type === 'warning' ? 'border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20' :
      alert.type === 'error' ? 'border-red-400 bg-red-50 dark:bg-red-900/20' :
      alert.type === 'info' ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20' :
      'border-green-400 bg-green-50 dark:bg-green-900/20'
    }`}>
      <div className="flex items-start gap-3">
        <Icon className={`w-5 h-5 mt-0.5 ${
          alert.type === 'warning' ? 'text-yellow-600' :
          alert.type === 'error' ? 'text-red-600' :
          alert.type === 'info' ? 'text-blue-600' :
          'text-green-600'
        }`} />
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-900 dark:text-white">{alert.message}</p>
          <p className="text-xs text-gray-500 mt-1">
            {new Date(alert.timestamp).toLocaleString()}
          </p>
        </div>
        {!alert.read && (
          <div className="w-2 h-2 bg-red-500 rounded-full"></div>
        )}
      </div>
    </div>
  );
};

// Composant principal Dashboard
const EmbassyDashboard: React.FC = () => {
  const [requests, setRequests] = useState<Request[]>(mockRequests);
  const [stats, setStats] = useState<Stats>(mockStats);
  const [alerts, setAlerts] = useState<Alert[]>(mockAlerts);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const navigate = useNavigate();

  const filteredRequests = requests.filter(request => {
    const matchesStatus = selectedStatus === 'all' || request.status === selectedStatus;
    const matchesSearch = request.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         request.studentId.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const markAlertAsRead = (alertId: string) => {
    setAlerts(alerts.map(alert => 
      alert.id === alertId ? { ...alert, read: true } : alert
    ));
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <BarChart3 className="w-8 h-8 text-blue-600 mr-3" />
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Tableau de Bord Administratif</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm">
                <Bell className="w-5 h-5" />
                <span className="ml-2">Notifications</span>
                {alerts.filter(a => !a.read).length > 0 && (
                  <span className="ml-2 bg-red-500 text-white rounded-full px-2 py-1 text-xs">
                    {alerts.filter(a => !a.read).length}
                  </span>
                )}
              </Button>
              
              <Button variant="ghost" size="sm">
                <Settings className="w-5 h-5" />
              </Button>
              
              <Button variant="ghost" size="sm">
                <LogOut className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Section Statistiques */}
        <section className="mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Total des demandes"
              value={stats.totalRequests}
              icon={<FileText className="w-6 h-6" />}
              trend={12}
              color="primary"
            />
            <StatCard
              title="En attente"
              value={stats.pending}
              icon={<Clock className="w-6 h-6" />}
              trend={-5}
              color="warning"
            />
            <StatCard
              title="Approuvées"
              value={stats.approved}
              icon={<CheckCircle className="w-6 h-6" />}
              trend={8}
              color="success"
            />
            <StatCard
              title="Délai moyen"
              value={`${stats.averageProcessingTime}j`}
              icon={<TrendingUp className="w-6 h-6" />}
              trend={-15}
              color="info"
            />
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Colonne principale */}
          <div className="lg:col-span-2">
            {/* En-tête des demandes */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Demandes récentes
              </h2>
              
              <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                <Input
                  placeholder="Rechercher..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full sm:w-64"
                />
                
                <Select
                  onChange={(value) => setSelectedStatus(value)}
                  options={[
                    { value: 'all', label: 'Tous les statuts' },
                    { value: 'pending', label: 'En attente' },
                    { value: 'in_progress', label: 'En cours' },
                    { value: 'approved', label: 'Approuvé' },
                    { value: 'rejected', label: 'Rejeté' },
                    { value: 'on_hold', label: 'En attente' }
                  ]}
                  className="w-full sm:w-48"
                />
              </div>
            </div>

            {/* Liste des demandes */}
            <div className="space-y-4">
              {/* Option pour voir toutes demandes */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/service/demandes')}
              >
                Toutes les demandes
              </Button>
              
              {filteredRequests.map((request) => (
                <RequestCard key={request.id} request={request} />
              ))}
              
              {filteredRequests.length === 0 && (
                <Card className="p-8 text-center">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    Aucune demande trouvée
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400">
                    Aucune demande ne correspond à vos critères de recherche.
                  </p>
                </Card>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Alertes importantes */}
            <Card className="p-2">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900 dark:text-white">Alertes importantes</h3>
                <Badge color="error" variant="solid">
                  {alerts.filter(a => !a.read).length} non lues
                </Badge>
              </div>
              
              <div className="space-y-3">
                {alerts.map((alert) => (
                  <div key={alert.id} onClick={() => markAlertAsRead(alert.id)}>
                    <AlertItem alert={alert} />
                  </div>
                ))}
                
                {alerts.length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-4">
                    Aucune alerte en ce moment
                  </p>
                )}
              </div>
            </Card>

            {/* Répartition des services */}
            <Card className="p-2">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
                Répartition par service
              </h3>
              
              <div className="space-y-3">
                {serviceMetrics.map((metric, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-300">{metric.service}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className="h-2 rounded-full bg-blue-500"
                          style={{ width: `${metric.percentage}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium w-8">{metric.percentage}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Actions rapides */}
            <Card className="p-2">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
                Actions rapides
              </h3>
              
              <div className="space-y-2">
                <Button variant="outline" className="w-full justify-start"
                onClick={() => navigate('/service/utilisateurs')}>
                  <User className="w-4 h-4 mr-2" />
                  Gérer les utilisateurs
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <PieChart className="w-4 h-4 mr-2" />
                  Générer un rapport
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Settings className="w-4 h-4 mr-2" />
                  Paramètres des services
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Mail className="w-4 h-4 mr-2" />
                  Envoyer une annonce
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmbassyDashboard;