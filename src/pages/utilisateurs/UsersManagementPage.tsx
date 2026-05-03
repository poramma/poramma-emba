import React, { useState, useEffect } from 'react';
import {
  Search, Filter, User, Shield, CheckCircle, XCircle, Clock,
  Edit, Lock, Unlock, Download, MoreVertical, Mail, Phone, Hash,
  Calendar, AlertCircle, Eye, History, BadgeCheck, BadgeX,
  ChevronDown, ChevronUp, UserCheck, UserX, Package,
  Info, FileText, GraduationCap, Briefcase, 
  UserPlus,
  Pencil
} from 'lucide-react';
import Button from '../../components/ui/button/Button';
import Input from '../../components/form/input/InputField';
import Select from '../../components/form/Select';
import Badge from '../../components/ui/badge/Badge';
import Card from '../../components/ui/card/Card';
import Pagination from '../../components/common/Pagination';
import { Modal } from '../../components/ui/modal';
import TextArea from '../../components/form/input/TextArea';


// Types et interfaces
interface User {
  id: string;
  inue: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  status: 'pending' | 'verified' | 'suspended' | 'rejected';
  userType: 'student' | 'agent' | 'admin' | 'worker';
  registrationDate: string;
  lastLogin?: string;
  documents?: {
    name: string;
    status: 'pending' | 'approved' | 'rejected';
    uploadedAt: string;
  }[];
  university?: string;
  studyLevel?: string;
  assignedRequests?: number;
  lastActivity?: string;
}

interface ActionHistory {
  id: string;
  userId: string;
  action: 'registration' | 'verification' | 'suspension' | 'reactivation' | 'inue_assignment' | 'profile_update';
  actor: string;
  timestamp: string;
  details?: string;
  previousStatus?: string;
  newStatus?: string;
}

interface FilterState {
  search: string;
  status: string;
  userType: string;
  registrationDate: {
    start: string;
    end: string;
  };
  hasINUE: string;
}

interface SortConfig {
  key: keyof User;
  direction: 'asc' | 'desc';
}

// Données mockées
const mockUsers: User[] = [
  {
    id: '1',
    inue: 'INUE-2024-001',
    email: 'moussa.diarra@email.com',
    firstName: 'Moussa',
    lastName: 'Diarra',
    phone: '+212 6 12 34 56 78',
    status: 'verified',
    userType: 'student',
    registrationDate: '2024-01-10T08:30:00',
    lastLogin: '2024-01-15T14:22:00',
    university: 'Université Mohammed V de Rabat',
    studyLevel: 'Master',
    documents: [
      { name: 'carte_identite.pdf', status: 'approved', uploadedAt: '2024-01-10T08:25:00' },
      { name: 'certificat_scolarite.pdf', status: 'approved', uploadedAt: '2024-01-10T08:28:00' }
    ],
    lastActivity: '2024-01-15T14:22:00'
  },
  {
    id: '2',
    inue: '',
    email: 'aicha.traore@email.com',
    firstName: 'Aïcha',
    lastName: 'Traoré',
    phone: '+212 6 98 76 54 32',
    status: 'pending',
    userType: 'student',
    registrationDate: '2024-01-14T11:20:00',
    university: 'Université Hassan II de Casablanca',
    studyLevel: 'Licence',
    documents: [
      { name: 'passeport.pdf', status: 'pending', uploadedAt: '2024-01-14T11:15:00' },
      { name: 'attestation_inscription.pdf', status: 'pending', uploadedAt: '2024-01-14T11:18:00' }
    ]
  },
  {
    id: '3',
    inue: 'INUE-2024-003',
    email: 'amadou.keita@email.com',
    firstName: 'Amadou',
    lastName: 'Keita',
    phone: '+212 6 55 44 33 22',
    status: 'suspended',
    userType: 'student',
    registrationDate: '2024-01-05T09:15:00',
    lastLogin: '2024-01-12T16:45:00',
    university: 'Université Cadi Ayyad de Marrakech',
    studyLevel: 'Doctorat',
    documents: [
      { name: 'cni.pdf', status: 'approved', uploadedAt: '2024-01-05T09:10:00' },
      { name: 'photo_identite.jpg', status: 'approved', uploadedAt: '2024-01-05T09:12:00' }
    ],
    lastActivity: '2024-01-12T16:45:00'
  },
  {
    id: '4',
    inue: 'AGENT-001',
    email: 'agent.konate@ambassade.ml',
    firstName: 'Mamadou',
    lastName: 'Konaté',
    phone: '+212 5 22 00 00 01',
    status: 'verified',
    userType: 'agent',
    registrationDate: '2024-01-02T10:00:00',
    lastLogin: '2024-01-15T16:30:00',
    assignedRequests: 12,
    lastActivity: '2024-01-15T16:30:00'
  }
];

const mockActionHistory: ActionHistory[] = [
  {
    id: '1',
    userId: '2',
    action: 'registration',
    actor: 'Système',
    timestamp: '2024-01-14T11:20:00',
    details: 'Inscription initiale'
  },
  {
    id: '2',
    userId: '1',
    action: 'inue_assignment',
    actor: 'Agent Konaté',
    timestamp: '2024-01-11T10:30:00',
    details: 'Attribution INUE-2024-001'
  },
  {
    id: '3',
    userId: '3',
    action: 'suspension',
    actor: 'Superviseur Diallo',
    timestamp: '2024-01-13T14:15:00',
    details: 'Suspension pour documents frauduleux',
    previousStatus: 'verified',
    newStatus: 'suspended'
  }
];

// Composants réutilisables
const UserStatusBadge: React.FC<{ status: User['status'] }> = ({ status }) => {
  const config = {
    pending: { color: 'warning', text: 'En attente', icon: Clock },
    verified: { color: 'success', text: 'Vérifié', icon: CheckCircle },
    suspended: { color: 'error', text: 'Suspendu', icon: Lock },
    rejected: { color: 'error', text: 'Rejeté', icon: XCircle }
  };

  const { color, text, icon: Icon } = config[status];

  return (
    <Badge color={color} variant="light" startIcon={<Icon className="w-4 h-4" />}>
      {text}
    </Badge>
  );
};

const UserTypeBadge: React.FC<{ type: User['userType'] }> = ({ type }) => {
  const config = {
    student: { color: 'primary', text: 'Étudiant', icon: User },
    agent: { color: 'info', text: 'Agent', icon: Shield },
    admin: { color: 'dark', text: 'Admin', icon: Shield },
    worker: { color: 'success', text: 'Travailleur', icon: Briefcase }
  };

  const { color, text, icon: Icon } = config[type];

  return (
    <Badge color={color} variant="light" startIcon={<Icon className="w-4 h-4" />}>
      {text}
    </Badge>
  );
};

const UserRow: React.FC<{ 
  user: User; 
  onView: (user: User) => void;
  onEdit: (user: User) => void;
  onVerify: (user: User) => void;
  onSuspend: (user: User) => void;
}> = ({ user, onView, onEdit, onVerify, onSuspend }) => {
  return (
    <tr className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <div className="ml-4">
            <div className="text-sm font-medium text-gray-900 dark:text-white">
              {user.firstName} {user.lastName}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {user.email}
            </div>
          </div>
        </div>
      </td>
      
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-gray-900 dark:text-white">
          {user.inue || 'Non attribué'}
        </div>
        {user.phone && (
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {user.phone}
          </div>
        )}
      </td>
      
      <td className="px-6 py-4 whitespace-nowrap">
        <UserTypeBadge type={user.userType} />
      </td>
      
      <td className="px-6 py-4 whitespace-nowrap">
        <UserStatusBadge status={user.status} />
      </td>
      
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
        {new Date(user.registrationDate).toLocaleDateString()}
      </td>
      
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        <div className="flex items-center justify-end space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onView(user)}
            title="Voir les détails"
          >
            <Eye className="w-4 h-4" />
          </Button>
          
          {user.status === 'pending' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onVerify(user)}
              title="Vérifier l'utilisateur"
              className="text-green-600 hover:text-green-800"
            >
              <CheckCircle className="w-4 h-4" />
            </Button>
          )}
          
          {user.status === 'verified' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onSuspend(user)}
              title="Suspendre le compte"
              className="text-red-600 hover:text-red-800"
            >
              <Lock className="w-4 h-4" />
            </Button>
          )}
          
          {user.status === 'suspended' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onVerify(user)}
              title="Réactiver le compte"
              className="text-green-600 hover:text-green-800"
            >
              <Unlock className="w-4 h-4" />
            </Button>
          )}
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(user)}
            title="Modifier"
          >
            <Edit className="w-4 h-4" />
          </Button>
        </div>
      </td>
    </tr>
  );
};

// Composant principal UsersManagementPage
const UsersManagementPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>(mockUsers);
  const [filteredUsers, setFilteredUsers] = useState<User[]>(mockUsers);
  const [actionHistory, setActionHistory] = useState<ActionHistory[]>(mockActionHistory);
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    status: 'all',
    userType: 'all',
    registrationDate: { start: '', end: '' },
    hasINUE: 'all'
  });
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: 'registrationDate',
    direction: 'desc'
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [currentAction, setCurrentAction] = useState<'verify' | 'suspend' | 'reactivate' | null>(null);
  const [actionReason, setActionReason] = useState('');

  // Filtrage des utilisateurs
  useEffect(() => {
    let filtered = users.filter(user => {
      const matchesSearch = filters.search === '' || 
        user.firstName.toLowerCase().includes(filters.search.toLowerCase()) ||
        user.lastName.toLowerCase().includes(filters.search.toLowerCase()) ||
        user.email.toLowerCase().includes(filters.search.toLowerCase()) ||
        user.inue.toLowerCase().includes(filters.search.toLowerCase());

      const matchesStatus = filters.status === 'all' || user.status === filters.status;
      const matchesType = filters.userType === 'all' || user.userType === filters.userType;
      
      const matchesINUE = filters.hasINUE === 'all' || 
        (filters.hasINUE === 'yes' && user.inue) ||
        (filters.hasINUE === 'no' && !user.inue);

      const matchesDateRange = filters.registrationDate.start === '' || filters.registrationDate.end === '' || 
        (new Date(user.registrationDate) >= new Date(filters.registrationDate.start) &&
        (new Date(user.registrationDate) <= new Date(filters.registrationDate.end)));

      return matchesSearch && matchesStatus && matchesType && matchesINUE && matchesDateRange;
    });

    // Tri
    filtered.sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];
      
      if (aValue! < bValue!) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue! > bValue!) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    setFilteredUsers(filtered);
  }, [users, filters, sortConfig]);

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredUsers.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);

  const handleSort = (key: keyof User) => {
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
      status: 'all',
      userType: 'all',
      registrationDate: { start: '', end: '' },
      hasINUE: 'all'
    });
  };

  const handleUserAction = (user: User, action: 'verify' | 'suspend' | 'reactivate') => {
    setSelectedUser(user);
    setCurrentAction(action);
    setActionReason('');
    setIsActionModalOpen(true);
  };

  const confirmUserAction = () => {
    if (!selectedUser || !currentAction) return;

    let newStatus: User['status'] = selectedUser.status;
    let actionType: ActionHistory['action'] = 'verification';
    let details = '';

    switch (currentAction) {
      case 'verify':
        newStatus = 'verified';
        actionType = 'verification';
        details = `Utilisateur vérifié${actionReason ? `: ${actionReason}` : ''}`;
        // Générer un INUE si c'est un étudiant
        if (selectedUser.userType === 'student' && !selectedUser.inue) {
          selectedUser.inue = `INUE-2024-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
        }
        break;
      case 'suspend':
        newStatus = 'suspended';
        actionType = 'suspension';
        details = `Compte suspendu: ${actionReason}`;
        break;
      case 'reactivate':
        newStatus = 'verified';
        actionType = 'reactivation';
        details = `Compte réactivé${actionReason ? `: ${actionReason}` : ''}`;
        break;
    }

    setUsers(prev => prev.map(u => 
      u.id === selectedUser.id ? { ...u, status: newStatus, inue: selectedUser.inue } : u
    ));

    setActionHistory(prev => [...prev, {
      id: `action-${Date.now()}`,
      userId: selectedUser.id,
      action: actionType,
      actor: 'Superviseur Admin',
      timestamp: new Date().toISOString(),
      details,
      previousStatus: selectedUser.status,
      newStatus
    }]);

    setIsActionModalOpen(false);
    setSelectedUser(null);
    setCurrentAction(null);
    setActionReason('');
  };

  const getUserHistory = (userId: string) => {
    return actionHistory.filter(action => action.userId === userId);
  };

  const SortableHeader: React.FC<{ 
    columnKey: keyof User; 
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
            Gestion des Utilisateurs
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Administration complète des comptes étudiants et agents
          </p>
        </div>

        {/* Barre d'outils */}
        <Card className="p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
            <div className="flex-1 w-full lg:w-auto">
              <Input
                placeholder="Rechercher par nom, email ou INUE..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
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
                  label="Type d'utilisateur"
                  defaultValue={filters.userType}
                  onChange={(value) => handleFilterChange('userType', value)}
                  options={[
                    { value: 'all', label: 'Tous les types' },
                    { value: 'student', label: 'Étudiants' },
                    { value: 'agent', label: 'Agents' },
                    { value: 'admin', label: 'Administrateurs' }
                  ]}
                />
                
                <Select
                  label="Statut"
                  defaultValue={filters.status}
                  onChange={(value) => handleFilterChange('status', value)}
                  options={[
                    { value: 'all', label: 'Tous les statuts' },
                    { value: 'pending', label: 'En attente' },
                    { value: 'verified', label: 'Vérifiés' },
                    { value: 'suspended', label: 'Suspendus' },
                    { value: 'rejected', label: 'Rejetés' }
                  ]}
                />
                
                <Select
                  label="Attribution INUE"
                  defaultValue={filters.hasINUE}
                  onChange={(value) => handleFilterChange('hasINUE', value)}
                  options={[
                    { value: 'all', label: 'Tous' },
                    { value: 'yes', label: 'Avec INUE' },
                    { value: 'no', label: 'Sans INUE' }
                  ]}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Date d'inscription début"
                  type="date"
                  value={filters.registrationDate.start}
                  onChange={(e) => handleFilterChange('registrationDate', { ...filters.registrationDate, start: e.target.value })}
                  startIcon={<Calendar className="w-4 h-4" />}
                />
                
                <Input
                  label="Date d'inscription fin"
                  type="date"
                  value={filters.registrationDate.end}
                  onChange={(e) => handleFilterChange('registrationDate', { ...filters.registrationDate, end: e.target.value })}
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
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{filteredUsers.length}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Total utilisateurs</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600">{filteredUsers.filter(u => u.status === 'pending').length}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">En attente</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{filteredUsers.filter(u => u.status === 'verified').length}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Vérifiés</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-red-600">{filteredUsers.filter(u => u.status === 'suspended').length}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Suspendus</div>
          </Card>
        </div>

        {/* Tableau des utilisateurs */}
        <Card>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <SortableHeader columnKey="lastName">
                    Utilisateur
                  </SortableHeader>
                  <SortableHeader columnKey="inue">
                    INUE / Contact
                  </SortableHeader>
                  <SortableHeader columnKey="userType">
                    Type
                  </SortableHeader>
                  <SortableHeader columnKey="status">
                    Statut
                  </SortableHeader>
                  <SortableHeader columnKey="registrationDate">
                    Date d'inscription
                  </SortableHeader>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {currentItems.length > 0 ? (
                  currentItems.map((user) => (
                    <UserRow
                      key={user.id}
                      user={user}
                      onView={(user) => {
                        setSelectedUser(user);
                        setIsViewModalOpen(true);
                      }}
                      onEdit={(user) => {
                        // Logique d'édition à implémenter
                        console.log('Édition de:', user);
                      }}
                      onVerify={(user) => handleUserAction(user, user.status === 'suspended' ? 'reactivate' : 'verify')}
                      onSuspend={(user) => handleUserAction(user, 'suspend')}
                    />
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center">
                      <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                        Aucun utilisateur trouvé
                      </h3>
                      <p className="text-gray-500 dark:text-gray-400">
                        Aucun utilisateur ne correspond à vos critères de filtrage.
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {filteredUsers.length > 0 && (
            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                itemsPerPage={itemsPerPage}
                totalItems={filteredUsers.length}
              />
            </div>
          )}
        </Card>
      </div>

      {/* Modal de visualisation des détails utilisateur */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        size="lg"
        title="Détails de l'utilisateur"
      >
        {selectedUser && (
          <div className=" p-5 space-y-6 max-h-[70vh] overflow-y-auto pr-2">
            {/* En-tête avec statut */}
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-900/50 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center">
                  <User className="w-6 h-6 text-brand-600 dark:text-brand-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {selectedUser.firstName} {selectedUser.lastName}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {selectedUser.userType === 'student' ? 'Étudiant' : 
                    selectedUser.userType === 'worker' ? 'Travailleur' : 'Autre'}
                  </p>
                </div>
              </div>
              <Badge 
                color={selectedUser.status === 'verified' ? 'success' : 
                      selectedUser.status === 'pending' ? 'warning' : 'error'} 
                variant="solid"
              >
                {selectedUser.status === 'verified' ? 'Vérifié' : 
                selectedUser.status === 'pending' ? 'En attente' : 'Non vérifié'}
              </Badge>
            </div>

            {/* Informations personnelles */}
            <div className="space-y-3">
              <h4 className="text-md font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <User className="w-4 h-4 text-brand-500" />
                Informations personnelles
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Nom complet
                  </label>
                  <p className="mt-1 text-sm font-medium text-gray-900 dark:text-white">
                    {selectedUser.firstName} {selectedUser.lastName}
                  </p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Email
                  </label>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white break-all">
                    {selectedUser.email}
                  </p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Téléphone
                  </label>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white">
                    {selectedUser.phone || 'Non renseigné'}
                  </p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    INUE
                  </label>
                  <p className="mt-1 text-sm font-mono text-gray-900 dark:text-white">
                    {selectedUser.inue || 'Non attribué'}
                  </p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Date d'inscription
                  </label>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white">
                    {selectedUser.lastActivity}
                  </p>
                </div>
              </div>
            </div>

            {/* Informations spécifiques selon le type */}
            {selectedUser.userType === 'student' && (
              <div className="space-y-3">
                <h4 className="text-md font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-brand-500" />
                  Informations académiques
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Université
                    </label>
                    <p className="mt-1 text-sm text-gray-900 dark:text-white">
                      {selectedUser.university || 'Non renseigné'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Niveau d'étude
                    </label>
                    <p className="mt-1 text-sm text-gray-900 dark:text-white">
                      {selectedUser.studyLevel || 'Non renseigné'}
                    </p>
                  </div>
                  
                </div>
              </div>
            )}

      

            {/* Documents */}
            {selectedUser.documents && selectedUser.documents.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-md font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <FileText className="w-4 h-4 text-brand-500" />
                  Documents ({selectedUser.documents.length})
                </h4>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {selectedUser.documents.map((doc, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                      <div className="flex items-center gap-3">
                        <FileText className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-900 dark:text-white">{doc.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge 
                          color={doc.status === 'approved' ? 'success' : 
                                doc.status === 'rejected' ? 'error' : 'warning'} 
                          variant="light"
                        >
                          {doc.status === 'approved' ? 'Approuvé' : 
                          doc.status === 'rejected' ? 'Rejeté' : 'En attente'}
                        </Badge>
                        
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Historique des actions */}
            <div className="space-y-3">
              <h4 className="text-md font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <History className="w-4 h-4 text-brand-500" />
                Historique des actions
              </h4>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {getUserHistory(selectedUser.id).length > 0 ? (
                  getUserHistory(selectedUser.id).map((action, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                      <div className="flex-shrink-0">
                        {action.action === 'registration' && <UserPlus className="w-4 h-4 text-green-500" />}
                        {action.action === 'verification' && <UserCheck className="w-4 h-4 text-blue-500" />}
                        {action.action === 'suspension' && <AlertCircle className="w-4 h-4 text-yellow-500" />}
                        {action.action === 'reactivation' && <UserCheck className="w-4 h-4 text-blue-500" />}
                        {action.action === 'inue_assignment' && <Package className="w-4 h-4 text-purple-500" />}
                        {action.action === 'profile_update' && <Pencil className="w-4 h-4 text-gray-500" />}
                        {!action.action && <History className="w-4 h-4 text-gray-400" />}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-900 dark:text-white">
                          <span className="font-medium">{action.actor}</span> - {action.details}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(action.timestamp).toLocaleString('fr-FR')}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                    Aucune action enregistrée
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal d'action sur l'utilisateur (Vérification/Suspension/Réactivation) */}
      <Modal
        isOpen={isActionModalOpen}
        onClose={() => setIsActionModalOpen(false)}
        size="md"
      >
        <div className="p-5 space-y-5">
          {/* En-tête avec icône */}
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
              currentAction === 'verify' ? 'bg-green-100 dark:bg-green-900/30' :
              currentAction === 'suspend' ? 'bg-red-100 dark:bg-red-900/30' :
              'bg-blue-100 dark:bg-blue-900/30'
            }`}>
              {currentAction === 'verify' && <UserCheck className="w-6 h-6 text-green-600 dark:text-green-400" />}
              {currentAction === 'suspend' && <UserX className="w-6 h-6 text-red-600 dark:text-red-400" />}
              {currentAction === 'reactivate' && <UserCheck className="w-6 h-6 text-blue-600 dark:text-blue-400" />}
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {currentAction === 'verify' ? "Vérifier l'utilisateur" :
                currentAction === 'suspend' ? "Suspendre le compte" :
                "Réactiver le compte"}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {currentAction === 'verify' ? "Validation du profil utilisateur" :
                currentAction === 'suspend' ? "Suspension temporaire du compte" :
                "Réactivation du compte utilisateur"}
              </p>
            </div>
          </div>

          {/* Informations utilisateur */}
          {selectedUser && (
            <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center">
                  <User className="w-5 h-5 text-brand-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {selectedUser.firstName} {selectedUser.lastName}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {selectedUser.email}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Messages d'information contextuels */}
          {currentAction === 'verify' && selectedUser?.userType === 'student' && !selectedUser.inue && (
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5" />
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Un identifiant INUE (Identifiant Numérique Unique Étudiant) sera automatiquement attribué à cet étudiant lors de la vérification.
                </p>
              </div>
            </div>
          )}

          {currentAction === 'suspend' && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 mt-0.5" />
                <p className="text-sm text-red-700 dark:text-red-300">
                  L'utilisateur ne pourra plus accéder à ses services consulaires tant que le compte est suspendu.
                </p>
              </div>
            </div>
          )}

          {currentAction === 'reactivate' && (
            <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400 mt-0.5" />
                <p className="text-sm text-green-700 dark:text-green-300">
                  L'utilisateur pourra à nouveau accéder à tous ses services consulaires.
                </p>
              </div>
            </div>
          )}

          {/* Champ de raison pour suspension/réactivation */}
          {(currentAction === 'suspend' || currentAction === 'reactivate') && (
            <div>
              <label className="text-gray-700 dark:text-gray-300 mb-2 block">
                {currentAction === 'suspend' ? 'Raison de la suspension' : 'Raison de la réactivation'}
                <span className="text-red-500 ml-1">*</span>
              </label>
              <TextArea
                placeholder={
                  currentAction === 'suspend' 
                    ? "Expliquez la raison de la suspension (ex: non-respect des conditions, documents falsifiés...)" 
                    : "Expliquez la raison de la réactivation"
                }
                value={actionReason}
                onChange={(value) => setActionReason(value)}
                rows={4}
                className="resize-none"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Cette raison sera enregistrée dans l'historique de l'utilisateur.
              </p>
              {actionReason && actionReason.length < 10 && (
                <p className="text-xs text-orange-600 dark:text-orange-400 flex items-center gap-1 mt-1">
                  <AlertCircle className="w-3 h-3" />
                  Veuillez fournir une raison plus détaillée (minimum 10 caractères)
                </p>
              )}
            </div>
          )}

          {/* Boutons d'action */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button 
              variant="outline" 
              onClick={() => {
                setIsActionModalOpen(false);
                setActionReason('');
              }}
            >
              Annuler
            </Button>
            <Button
              variant={
                currentAction === 'verify' ? 'success' :
                currentAction === 'suspend' ? 'error' : 'success'
              }
              onClick={confirmUserAction}
              disabled={
                (currentAction === 'suspend' && (!actionReason.trim() || actionReason.length < 10)) ||
                (currentAction === 'reactivate' && (!actionReason.trim() || actionReason.length < 10))
              }
              className={
                currentAction === 'verify' ? 'bg-green-600 hover:bg-green-700' :
                currentAction === 'suspend' ? 'bg-red-600 hover:bg-red-700' :
                'bg-blue-600 hover:bg-blue-700'
              }
            >
              {currentAction === 'verify' ? (
                <>
                  <UserCheck className="w-4 h-4 mr-2" />
                  Confirmer la vérification
                </>
              ) : currentAction === 'suspend' ? (
                <>
                  <UserX className="w-4 h-4 mr-2" />
                  Confirmer la suspension
                </>
              ) : (
                <>
                  <UserCheck className="w-4 h-4 mr-2" />
                  Confirmer la réactivation
                </>
              )}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default UsersManagementPage;