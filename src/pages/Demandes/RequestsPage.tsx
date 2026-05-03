import React, { useState, useEffect } from 'react';
import { 
  Search, Filter, Download, MoreVertical, Eye, Edit, FileText, 
  Calendar, User, Hash, Clock, CheckCircle, XCircle, AlertCircle,
  BarChart3, ChevronDown, ChevronUp, ExternalLink
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/ui/button/Button';
import Input from '../../components/form/input/InputField';
import Select from '../../components/form/Select';
import Badge from '../../components/ui/badge/Badge';
import Card from '../../components/ui/card/Card';
import { Modal } from '../../components/ui/modal';
import Pagination from '../../components/common/Pagination';


// Types et interfaces
interface Request {
  id: string;
  dossierNumber: string;
  studentName: string;
  studentId: string;
  studentINUE: string;
  serviceType: 'passeport' | 'carte_consulaire' | 'attestation' | 'visa' | 'autre';
  status: 'pending' | 'in_progress' | 'approved' | 'rejected' | 'on_hold';
  submissionDate: string;
  lastUpdate: string;
  processingTime?: number;
  assignedAgent?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  documents: {
    name: string;
    type: string;
    size: string;
    uploadedAt: string;
  }[];
  notes?: string;
}

interface FilterState {
  search: string;
  serviceType: string;
  status: string;
  priority: string;
  dateRange: {
    start: string;
    end: string;
  };
  assignedAgent: string;
  studentINUE: string;
  dossierNumber: string;
}

interface SortConfig {
  key: keyof Request;
  direction: 'asc' | 'desc';
}

// Données mockées
const mockRequests: Request[] = [
  {
    id: '1',
    dossierNumber: 'DOSS-2024-001',
    studentName: 'Moussa Diarra',
    studentId: 'STU-001',
    studentINUE: 'INUE-2024-001',
    serviceType: 'passeport',
    status: 'pending',
    submissionDate: '2024-01-15T10:30:00',
    lastUpdate: '2024-01-15T10:30:00',
    priority: 'high',
    documents: [
      { name: 'pièce_identité.pdf', type: 'PDF', size: '2.4 MB', uploadedAt: '2024-01-15T10:25:00' },
      { name: 'photo_identite.jpg', type: 'JPG', size: '1.2 MB', uploadedAt: '2024-01-15T10:28:00' }
    ]
  },
  {
    id: '2',
    dossierNumber: 'DOSS-2024-002',
    studentName: 'Aïcha Traoré',
    studentId: 'STU-002',
    studentINUE: 'INUE-2024-002',
    serviceType: 'carte_consulaire',
    status: 'in_progress',
    submissionDate: '2024-01-14T09:15:00',
    lastUpdate: '2024-01-15T14:20:00',
    processingTime: 3,
    assignedAgent: 'Agent Konaté',
    priority: 'medium',
    documents: [
      { name: 'certificat_scolarite.pdf', type: 'PDF', size: '3.1 MB', uploadedAt: '2024-01-14T09:10:00' },
      { name: 'photo_identite.jpg', type: 'JPG', size: '1.1 MB', uploadedAt: '2024-01-14T09:12:00' }
    ],
    notes: 'En attente de vérification du certificat de scolarité'
  },
  {
    id: '3',
    dossierNumber: 'DOSS-2024-003',
    studentName: 'Amadou Keita',
    studentId: 'STU-003',
    studentINUE: 'INUE-2024-003',
    serviceType: 'attestation',
    status: 'approved',
    submissionDate: '2024-01-10T14:20:00',
    lastUpdate: '2024-01-12T11:45:00',
    processingTime: 2,
    assignedAgent: 'Agent Diallo',
    priority: 'low',
    documents: [
      { name: 'demande_attestation.pdf', type: 'PDF', size: '1.8 MB', uploadedAt: '2024-01-10T14:15:00' }
    ]
  },
  {
    id: '4',
    dossierNumber: 'DOSS-2024-004',
    studentName: 'Fatoumata Bamba',
    studentId: 'STU-004',
    studentINUE: 'INUE-2024-004',
    serviceType: 'visa',
    status: 'rejected',
    submissionDate: '2024-01-08T11:30:00',
    lastUpdate: '2024-01-09T16:45:00',
    priority: 'urgent',
    documents: [
      { name: 'passeport.pdf', type: 'PDF', size: '2.0 MB', uploadedAt: '2024-01-08T11:25:00' },
      { name: 'justificatif_sejour.pdf', type: 'PDF', size: '1.5 MB', uploadedAt: '2024-01-08T11:28:00' }
    ],
    notes: 'Dossier incomplet - manque la lettre de motivation'
  }
];

const serviceTypes = [
  { value: 'all', label: 'Tous les services' },
  { value: 'passeport', label: 'Passeport' },
  { value: 'carte_consulaire', label: 'Carte consulaire' },
  { value: 'attestation', label: 'Attestation' },
  { value: 'visa', label: 'Visa' },
  { value: 'autre', label: 'Autre' }
];

const statusOptions = [
  { value: 'all', label: 'Tous les statuts' },
  { value: 'pending', label: 'En attente' },
  { value: 'in_progress', label: 'En cours' },
  { value: 'approved', label: 'Approuvé' },
  { value: 'rejected', label: 'Rejeté' },
  { value: 'on_hold', label: 'En attente' }
];

const priorityOptions = [
  { value: 'all', label: 'Toutes les priorités' },
  { value: 'low', label: 'Basse' },
  { value: 'medium', label: 'Moyenne' },
  { value: 'high', label: 'Haute' },
  { value: 'urgent', label: 'Urgente' }
];

const assignedAgents = [
  { value: 'all', label: 'Tous les agents' },
  { value: 'Agent Konaté', label: 'Agent Konaté' },
  { value: 'Agent Diallo', label: 'Agent Diallo' },
  { value: 'Agent Traoré', label: 'Agent Traoré' }
];

// Composant RequestRow réutilisable
const RequestRow: React.FC<{ 
  request: Request; 
  onView: (request: Request) => void;
  onEdit: (request: Request) => void;
}> = ({ request, onView, onEdit }) => {
  const statusConfig = {
    pending: { color: 'warning', text: 'En attente', icon: Clock },
    in_progress: { color: 'info', text: 'En cours', icon: BarChart3 },
    approved: { color: 'success', text: 'Approuvé', icon: CheckCircle },
    rejected: { color: 'error', text: 'Rejeté', icon: XCircle },
    on_hold: { color: 'warning', text: 'En attente', icon: AlertCircle }
  };

  const priorityConfig = {
    low: { color: 'success', text: 'Basse' },
    medium: { color: 'info', text: 'Moyenne' },
    high: { color: 'warning', text: 'Haute' },
    urgent: { color: 'error', text: 'Urgente' }
  };

  const { color: statusColor, text: statusText, icon: StatusIcon } = statusConfig[request.status];
  const { color: priorityColor, text: priorityText } = priorityConfig[request.priority];

  return (
    <tr className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <div className="ml-4">
            <div className="text-sm font-medium text-gray-900 dark:text-white">
              {request.dossierNumber}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {new Date(request.submissionDate).toLocaleDateString()}
            </div>
          </div>
        </div>
      </td>
      
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-gray-900 dark:text-white">{request.studentName}</div>
        <div className="text-sm text-gray-500 dark:text-gray-400">{request.studentINUE}</div>
      </td>
      
      <td className="px-6 py-4 whitespace-nowrap">
        <Badge color="primary" variant="light" className="capitalize">
          {request.serviceType.replace('_', ' ')}
        </Badge>
      </td>
      
      <td className="px-6 py-4 whitespace-nowrap">
        <Badge color={statusColor} variant="light" startIcon={<StatusIcon className="w-4 h-4" />}>
          {statusText}
        </Badge>
      </td>
      
      <td className="px-6 py-4 whitespace-nowrap">
        <Badge color={priorityColor} variant="light">
          {priorityText}
        </Badge>
      </td>
      
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-gray-900 dark:text-white">
          {request.assignedAgent || 'Non assigné'}
        </div>
        {request.processingTime && (
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {request.processingTime} jours
          </div>
        )}
      </td>
      
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
        {new Date(request.lastUpdate).toLocaleDateString()}
      </td>
      
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        <div className="flex items-center justify-end space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onView(request)}
            title="Voir les détails"
          >
            <Eye className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(request)}
            title="Modifier"
          >
            <Edit className="w-4 h-4" />
          </Button>
        </div>
      </td>
    </tr>
  );
};

// Composant principal RequestsPage
const RequestsPage: React.FC = () => {
  const [requests, setRequests] = useState<Request[]>(mockRequests);
  const [filteredRequests, setFilteredRequests] = useState<Request[]>(mockRequests);
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    serviceType: 'all',
    status: 'all',
    priority: 'all',
    dateRange: { start: '', end: '' },
    assignedAgent: 'all',
    studentINUE: '',
    dossierNumber: ''
  });
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: 'submissionDate',
    direction: 'desc'
  });
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  // Filtrage des demandes
  useEffect(() => {
    let filtered = requests.filter(request => {
      const matchesSearch = filters.search === '' || 
        request.studentName.toLowerCase().includes(filters.search.toLowerCase()) ||
        request.studentINUE.toLowerCase().includes(filters.search.toLowerCase()) ||
        request.dossierNumber.toLowerCase().includes(filters.search.toLowerCase());

      const matchesService = filters.serviceType === 'all' || request.serviceType === filters.serviceType;
      const matchesStatus = filters.status === 'all' || request.status === filters.status;
      const matchesPriority = filters.priority === 'all' || request.priority === filters.priority;
      const matchesAgent = filters.assignedAgent === 'all' || request.assignedAgent === filters.assignedAgent;
      
      const matchesINUE = filters.studentINUE === '' || 
        request.studentINUE.toLowerCase().includes(filters.studentINUE.toLowerCase());
      
      const matchesDossier = filters.dossierNumber === '' || 
        request.dossierNumber.toLowerCase().includes(filters.dossierNumber.toLowerCase());

      const matchesDateRange = (filters.dateRange.start === '' || filters.dateRange.end === '' || 
        (new Date(request.submissionDate) >= new Date(filters.dateRange.start) &&
        (new Date(request.submissionDate) <= new Date(filters.dateRange.end))));

      return matchesSearch && matchesService && matchesStatus && matchesPriority && 
             matchesAgent && matchesINUE && matchesDossier && matchesDateRange;
    });

    // Tri
    filtered.sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];
      
      if (aValue! < bValue!) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue! > bValue!) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    setFilteredRequests(filtered);
  }, [requests, filters, sortConfig]);

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredRequests.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage);

  const handleSort = (key: keyof Request) => {
    setSortConfig({
      key,
      direction: sortConfig.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc'
    });
  };

  const handleFilterChange = (key: keyof FilterState, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const resetFilters = () => {
    setFilters({
      search: '',
      serviceType: 'all',
      status: 'all',
      priority: 'all',
      dateRange: { start: '', end: '' },
      assignedAgent: 'all',
      studentINUE: '',
      dossierNumber: ''
    });
  };

  const exportToCSV = () => {
    // Simuler l'export CSV
    const headers = ['Dossier', 'Étudiant', 'INUE', 'Service', 'Statut', 'Priorité', 'Agent', 'Date soumission'];
    const csvData = filteredRequests.map(req => [
      req.dossierNumber,
      req.studentName,
      req.studentINUE,
      req.serviceType,
      req.status,
      req.priority,
      req.assignedAgent || '',
      new Date(req.submissionDate).toLocaleDateString()
    ]);
    
    const csvContent = [headers, ...csvData].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `demandes_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const handleViewRequest = (request: Request) => {
    setSelectedRequest(request);
    navigate(`/service/demandes/${request.id}`);
  };

  const handleEditRequest = (request: Request) => {
    // Logique d'édition à implémenter
    console.log('Édition de la demande:', request);
  };

  const SortableHeader: React.FC<{ 
    columnKey: keyof Request; 
    children: React.ReactNode;
  }> = ({ columnKey, children }) => (
    <th 
      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
      onClick={() => handleSort(columnKey)}
    >
      <div className="flex items-center">
        {children}
        {sortConfig.key === columnKey && (
          sortConfig.direction === 'asc' ? 
            <ChevronUp className="w-4 h-4 ml-1" /> : 
            <ChevronDown className="w-4 h-4 ml-1" />
        )}
      </div>
    </th>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* En-tête */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Gestion des Demandes
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Consultez et gérez toutes les demandes des étudiants
          </p>
        </div>

        {/* Barre d'outils */}
        <Card className="p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
            <div className="flex-1 w-full lg:w-auto">
              <Input
                placeholder="Rechercher par nom, INUE ou n° dossier..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                startIcon={<Search className="w-4 h-4" />}
                className="w-full lg:w-96"
              />
            </div>
            
            <div className="flex gap-3 w-full lg:w-auto">
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                startIcon={<Filter className="w-4 h-4" />}
              >
                Filtres {showFilters ? <ChevronUp className="w-4 h-4 ml-1" /> : <ChevronDown className="w-4 h-4 ml-1" />}
              </Button>
              
              <Button
                variant="outline"
                onClick={exportToCSV}
                startIcon={<Download className="w-4 h-4" />}
              >
                Exporter
              </Button>
            </div>
          </div>

          {/* Filtres avancés */}
          {showFilters && (
            <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                <Select
                  label="Type de service"
                  defaultValue={filters.serviceType}
                  onChange={(value) => handleFilterChange('serviceType', value)}
                  options={serviceTypes}
                />
                
                <Select
                  label="Statut"
                  defaultValue={filters.status}
                  onChange={(value) => handleFilterChange('status', value)}
                  options={statusOptions}
                />
                
                <Select
                  label="Priorité"
                  defaultValue={filters.priority}
                  onChange={(value) => handleFilterChange('priority', value)}
                  options={priorityOptions}
                />
                
                <Select
                  label="Agent assigné"
                  defaultValue={filters.assignedAgent}
                  onChange={(value) => handleFilterChange('assignedAgent', value)}
                  options={assignedAgents}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Input
                  label="N° INUE spécifique"
                  placeholder="INUE-2024-001"
                  value={filters.studentINUE}
                  onChange={(e) => handleFilterChange('studentINUE', e.target.value)}
                  startIcon={<User className="w-4 h-4" />}
                />
                
                <Input
                  label="N° dossier spécifique"
                  placeholder="DOSS-2024-001"
                  value={filters.dossierNumber}
                  onChange={(value) => handleFilterChange('dossierNumber', value)}
                  startIcon={<Hash className="w-4 h-4" />}
                />
                
                <Input
                  label="Date de début"
                  type="date"
                  value={filters.dateRange.start}
                  onChange={(e) => handleFilterChange('dateRange', { ...filters.dateRange, start: e.target.value })}
                  startIcon={<Calendar className="w-4 h-4" />}
                />
                
                <Input
                  label="Date de fin"
                  type="date"
                  value={filters.dateRange.end}
                  onChange={(e) => handleFilterChange('dateRange', { ...filters.dateRange, end: e.target.value })}
                  startIcon={<Calendar className="w-4 h-4" />}
                />
              </div>
              
              <div className="flex justify-end mt-4">
                <Button variant="ghost" onClick={resetFilters}>
                  Réinitialiser les filtres
                </Button>
              </div>
            </div>
          )}
        </Card>

        {/* Statistiques rapides */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{filteredRequests.length}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Total demandes</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600">{filteredRequests.filter(r => r.status === 'pending').length}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">En attente</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{filteredRequests.filter(r => r.status === 'in_progress').length}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">En cours</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{filteredRequests.filter(r => r.status === 'approved').length}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Approuvées</div>
          </Card>
        </div>

        {/* Tableau des demandes */}
        <Card>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <SortableHeader columnKey="dossierNumber">
                    N° Dossier / Date
                  </SortableHeader>
                  <SortableHeader columnKey="studentName">
                    Étudiant / INUE
                  </SortableHeader>
                  <SortableHeader columnKey="serviceType">
                    Service
                  </SortableHeader>
                  <SortableHeader columnKey="status">
                    Statut
                  </SortableHeader>
                  <SortableHeader columnKey="priority">
                    Priorité
                  </SortableHeader>
                  <SortableHeader columnKey="assignedAgent">
                    Agent / Délai
                  </SortableHeader>
                  <SortableHeader columnKey="lastUpdate">
                    Dernière mise à jour
                  </SortableHeader>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {currentItems.length > 0 ? (
                  currentItems.map((request) => (
                    <RequestRow
                      key={request.id}
                      request={request}
                      onView={handleViewRequest}
                      onEdit={handleEditRequest}
                    />
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center">
                      <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                        Aucune demande trouvée
                      </h3>
                      <p className="text-gray-500 dark:text-gray-400">
                        Aucune demande ne correspond à vos critères de filtrage.
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {filteredRequests.length > 0 && (
            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                itemsPerPage={itemsPerPage}
                totalItems={filteredRequests.length}
              />
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default RequestsPage;