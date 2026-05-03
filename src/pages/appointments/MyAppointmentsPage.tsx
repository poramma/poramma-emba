import React, { useState } from 'react';
import {
  Calendar, Clock, User, MapPin, Phone, Mail, CheckCircle,
  XCircle, Clock as WaitIcon, Search, Filter, MoreVertical,
  Edit, Trash2, MessageSquare, PhoneCall, Video, MapPin as LocationIcon
} from 'lucide-react';
import Button from '../../components/ui/button/Button';
import Badge from '../../components/ui/badge/Badge';
import Card from '../../components/ui/card/Card';
import Input from '../../components/form/input/InputField';
import Select from '../../components/form/Select';
import {Modal} from '../../components/ui/modal';
import TextArea from '../../components/form/input/TextArea';

// Types et interfaces
interface Appointment {
  id: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  studentPhone: string;
  serviceType: 'passeport' | 'carte_consulaire' | 'attestation' | 'visa' | 'autre';
  appointmentType: 'physique' | 'telephone' | 'video';
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show';
  requestedDate: string;
  requestedTime: string;
  duration: number;
  location?: string;
  meetingLink?: string;
  notes?: string;
  createdAt: string;
}

interface FilterState {
  search: string;
  status: string;
  serviceType: string;
  appointmentType: string;
  dateRange: {
    start: string;
    end: string;
  };
}

// Données mockées
const mockAppointments: Appointment[] = [
  {
    id: '1',
    studentId: 'STU-001',
    studentName: 'Moussa Diarra',
    studentEmail: 'moussa.diarra@email.com',
    studentPhone: '+212 6 12 34 56 78',
    serviceType: 'passeport',
    appointmentType: 'physique',
    status: 'pending',
    requestedDate: '2024-01-20',
    requestedTime: '10:00',
    duration: 30,
    location: 'Bureau 102 - Ambassade du Mali',
    notes: 'Renouvellement de passeport urgent',
    createdAt: '2024-01-15T14:30:00'
  },
  {
    id: '2',
    studentId: 'STU-002',
    studentName: 'Aïcha Traoré',
    studentEmail: 'aicha.traore@email.com',
    studentPhone: '+212 6 98 76 54 32',
    serviceType: 'carte_consulaire',
    appointmentType: 'telephone',
    status: 'confirmed',
    requestedDate: '2024-01-18',
    requestedTime: '14:30',
    duration: 20,
    notes: 'Discussion préalable nécessaire',
    createdAt: '2024-01-14T09:15:00'
  },
  {
    id: '3',
    studentId: 'STU-003',
    studentName: 'Amadou Keita',
    studentEmail: 'amadou.keita@email.com',
    studentPhone: '+212 6 55 44 33 22',
    serviceType: 'attestation',
    appointmentType: 'video',
    status: 'completed',
    requestedDate: '2024-01-16',
    requestedTime: '11:00',
    duration: 25,
    meetingLink: 'https://meet.ambassade.ml/amadou-keita',
    createdAt: '2024-01-12T16:45:00'
  },
  {
    id: '4',
    studentId: 'STU-004',
    studentName: 'Fatoumata Bamba',
    studentEmail: 'fatoumata.bamba@email.com',
    studentPhone: '+212 6 77 88 99 00',
    serviceType: 'visa',
    appointmentType: 'physique',
    status: 'cancelled',
    requestedDate: '2024-01-17',
    requestedTime: '15:30',
    duration: 45,
    location: 'Bureau 201 - Ambassade du Mali',
    notes: 'Annulé par l\'étudiant',
    createdAt: '2024-01-13T11:20:00'
  }
];

// Composant AppointmentCard
const AppointmentCard: React.FC<{ 
  appointment: Appointment;
  onAction: (appointment: Appointment, action: string) => void;
}> = ({ appointment, onAction }) => {
  const statusConfig = {
    pending: { color: 'warning', text: 'En attente', icon: Clock },
    confirmed: { color: 'success', text: 'Confirmé', icon: CheckCircle },
    cancelled: { color: 'error', text: 'Annulé', icon: XCircle },
    completed: { color: 'primary', text: 'Terminé', icon: CheckCircle },
    no_show: { color: 'error', text: 'Absent', icon: XCircle }
  };

  const typeConfig = {
    physique: { color: 'blue', text: 'Présentiel', icon: MapPin },
    telephone: { color: 'green', text: 'Téléphone', icon: Phone },
    video: { color: 'purple', text: 'Vidéo', icon: Video }
  };

  const { color: statusColor, text: statusText, icon: StatusIcon } = statusConfig[appointment.status];
  const { color: typeColor, text: typeText, icon: TypeIcon } = typeConfig[appointment.appointmentType];

  return (
    <Card className="p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <Badge color={statusColor} variant="light" startIcon={<StatusIcon className="w-4 h-4" />}>
              {statusText}
            </Badge>
            <Badge color={typeColor} variant="outline" startIcon={<TypeIcon className="w-4 h-4" />}>
              {typeText}
            </Badge>
          </div>
          
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            {appointment.studentName}
          </h3>
          
          <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-3">
            <span className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {new Date(appointment.requestedDate).toLocaleDateString()}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {appointment.requestedTime} ({appointment.duration} min)
            </span>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onAction(appointment, 'view')}
            title="Voir les détails"
          >
            <MoreVertical className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Service</p>
          <p className="text-sm font-medium text-gray-900 dark:text-white capitalize">
            {appointment.serviceType.replace('_', ' ')}
          </p>
        </div>
        
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Contact</p>
          <div className="flex items-center gap-2">
            <Phone className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-900 dark:text-white">{appointment.studentPhone}</span>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <Mail className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-900 dark:text-white truncate">{appointment.studentEmail}</span>
          </div>
        </div>
      </div>

      {appointment.location && (
        <div className="mb-4">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Lieu</p>
          <div className="flex items-center gap-2">
            <LocationIcon className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-900 dark:text-white">{appointment.location}</span>
          </div>
        </div>
      )}

      {appointment.notes && (
        <div className="mb-4">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Notes</p>
          <p className="text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800 p-2 rounded">
            {appointment.notes}
          </p>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {appointment.status === 'pending' && (
          <>
            <Button
              size="sm"
              variant="success"
              onClick={() => onAction(appointment, 'confirm')}
            >
              <CheckCircle className="w-4 h-4 mr-1" />
              Confirmer
            </Button>
            <Button
              size="sm"
              variant="error"
              onClick={() => onAction(appointment, 'cancel')}
            >
              <XCircle className="w-4 h-4 mr-1" />
              Refuser
            </Button>
          </>
        )}
        
        {appointment.status === 'confirmed' && (
          <>
            <Button
              size="sm"
              variant="primary"
              onClick={() => onAction(appointment, 'complete')}
            >
              <CheckCircle className="w-4 h-4 mr-1" />
              Marquer terminé
            </Button>
            <Button
              size="sm"
              variant="warning"
              onClick={() => onAction(appointment, 'no_show')}
            >
              <XCircle className="w-4 h-4 mr-1" />
              Absent
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onAction(appointment, 'reschedule')}
            >
              <Edit className="w-4 h-4 mr-1" />
              Reprogrammer
            </Button>
          </>
        )}
        
        {(appointment.status === 'completed' || appointment.status === 'cancelled' || appointment.status === 'no_show') && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => onAction(appointment, 'view_history')}
          >
            <MessageSquare className="w-4 h-4 mr-1" />
            Voir historique
          </Button>
        )}
      </div>
    </Card>
  );
};

// Composant principal MyAppointmentsPage
const MyAppointmentsPage: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>(mockAppointments);
  const [filteredAppointments, setFilteredAppointments] = useState<Appointment[]>(mockAppointments);
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    status: 'all',
    serviceType: 'all',
    appointmentType: 'all',
    dateRange: { start: '', end: '' }
  });
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [currentAction, setCurrentAction] = useState<string>('');
  const [actionReason, setActionReason] = useState('');

  // Filtrage des rendez-vous
  React.useEffect(() => {
    const filtered = appointments.filter(appointment => {
      const matchesSearch = filters.search === '' || 
        appointment.studentName.toLowerCase().includes(filters.search.toLowerCase()) ||
        appointment.studentEmail.toLowerCase().includes(filters.search.toLowerCase());

      const matchesStatus = filters.status === 'all' || appointment.status === filters.status;
      const matchesService = filters.serviceType === 'all' || appointment.serviceType === filters.serviceType;
      const matchesType = filters.appointmentType === 'all' || appointment.appointmentType === filters.appointmentType;

      const matchesDateRange = filters.dateRange.start === '' || filters.dateRange.end === '' || 
        (new Date(appointment.requestedDate) >= new Date(filters.dateRange.start) &&
        new Date(appointment.requestedDate) <= new Date(filters.dateRange.end));

      return matchesSearch && matchesStatus && matchesService && matchesType && matchesDateRange;
    });

    setFilteredAppointments(filtered);
  }, [appointments, filters]);

  const handleAppointmentAction = (appointment: Appointment, action: string) => {
    setSelectedAppointment(appointment);
    setCurrentAction(action);
    setActionReason('');
    
    if (['cancel', 'reschedule', 'no_show'].includes(action)) {
      setIsActionModalOpen(true);
    } else {
      performAction(action);
    }
  };

  const performAction = (reason?: string) => {
    if (!selectedAppointment) return;

    let newStatus = selectedAppointment.status;
    let updatedAppointment = { ...selectedAppointment };

    switch (currentAction) {
      case 'confirm':
        newStatus = 'confirmed';
        break;
      case 'cancel':
        newStatus = 'cancelled';
        updatedAppointment.notes = reason ? `Annulé: ${reason}` : 'Annulé par l\'agent';
        break;
      case 'complete':
        newStatus = 'completed';
        break;
      case 'no_show':
        newStatus = 'no_show';
        updatedAppointment.notes = reason ? `Absent: ${reason}` : 'Étudiant absent';
        break;
      case 'reschedule':
        // Logique de reprogrammation à implémenter
        console.log('Reprogrammation du rendez-vous', selectedAppointment);
        break;
    }

    updatedAppointment.status = newStatus;

    setAppointments(prev => prev.map(a => 
      a.id === selectedAppointment.id ? updatedAppointment : a
    ));

    setIsActionModalOpen(false);
    setSelectedAppointment(null);
    setCurrentAction('');
    setActionReason('');
  };

  const getActionModalConfig = () => {
    switch (currentAction) {
      case 'cancel':
        return {
          title: 'Annuler le rendez-vous',
          description: 'Veuillez indiquer la raison de l\'annulation',
          placeholder: 'Raison de l\'annulation...',
          buttonText: 'Confirmer l\'annulation',
          buttonVariant: 'error' as const
        };
      case 'reschedule':
        return {
          title: 'Reprogrammer le rendez-vous',
          description: 'Veuillez indiquer les nouvelles disponibilités',
          placeholder: 'Nouvelles propositions...',
          buttonText: 'Proposer de nouvelles dates',
          buttonVariant: 'primary' as const
        };
      case 'no_show':
        return {
          title: 'Marquer comme absent',
          description: 'L\'étudiant ne s\'est pas présenté au rendez-vous',
          placeholder: 'Notes supplémentaires...',
          buttonText: 'Confirmer l\'absence',
          buttonVariant: 'error' as const
        };
      default:
        return {
          title: '',
          description: '',
          placeholder: '',
          buttonText: '',
          buttonVariant: 'primary' as const
        };
    }
  };

  const modalConfig = getActionModalConfig();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-6xl mx-auto">
        {/* En-tête */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Mes Rendez-vous
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Gestion des demandes de rendez-vous des étudiants
          </p>
        </div>

        {/* Barre d'outils */}
        <Card className="p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
            <div className="flex-1 w-full lg:w-auto">
              <Input
                placeholder="Rechercher par nom, email..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="w-full lg:w-96"
              />
            </div>
            
            <div className="flex gap-3 w-full lg:w-auto">
              <Select
                defaultValue={filters.status}
                onChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
                options={[
                  { value: 'all', label: 'Tous les statuts' },
                  { value: 'pending', label: 'En attente' },
                  { value: 'confirmed', label: 'Confirmés' },
                  { value: 'cancelled', label: 'Annulés' },
                  { value: 'completed', label: 'Terminés' },
                  { value: 'no_show', label: 'Absents' }
                ]}
                className="w-full lg:w-48"
              />
              
              <Select
                defaultValue={filters.serviceType}
                onChange={(value) => setFilters(prev => ({ ...prev, serviceType: value }))}
                options={[
                  { value: 'all', label: 'Tous les services' },
                  { value: 'passeport', label: 'Passeport' },
                  { value: 'carte_consulaire', label: 'Carte consulaire' },
                  { value: 'attestation', label: 'Attestation' },
                  { value: 'visa', label: 'Visa' },
                  { value: 'autre', label: 'Autre' }
                ]}
                className="w-full lg:w-48"
              />
            </div>
          </div>

          {/* Filtres avancés */}
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <Select
              defaultValue={filters.appointmentType}
              onChange={(value) => setFilters(prev => ({ ...prev, appointmentType: value }))}
              options={[
                { value: 'all', label: 'Tous les types' },
                { value: 'physique', label: 'Présentiel' },
                { value: 'telephone', label: 'Téléphone' },
                { value: 'video', label: 'Vidéo' }
              ]}
            />
            
            <Input
              type="date"
              placeholder="Date de début"
              value={filters.dateRange.start}
              onChange={(e) => setFilters(prev => ({ 
                ...prev, 
                dateRange: { ...prev.dateRange, start: e.target.value } 
              }))}
            />
            
            <Input
              type="date"
              placeholder="Date de fin"
              value={filters.dateRange.end}
              onChange={(e) => setFilters(prev => ({ 
                ...prev, 
                dateRange: { ...prev.dateRange, end: e.target.value } 
              }))}
            />
          </div>
        </Card>

        {/* Statistiques */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{appointments.length}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Total</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600">{appointments.filter(a => a.status === 'pending').length}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">En attente</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{appointments.filter(a => a.status === 'confirmed').length}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Confirmés</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-red-600">{appointments.filter(a => a.status === 'cancelled').length}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Annulés</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{appointments.filter(a => a.status === 'completed').length}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Terminés</div>
          </Card>
        </div>

        {/* Liste des rendez-vous */}
        <div className="grid grid-cols-1 gap-4">
          {filteredAppointments.length > 0 ? (
            filteredAppointments.map(appointment => (
              <AppointmentCard
                key={appointment.id}
                appointment={appointment}
                onAction={handleAppointmentAction}
              />
            ))
          ) : (
            <Card className="p-8 text-center">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Aucun rendez-vous trouvé
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                Aucun rendez-vous ne correspond à vos critères de filtrage.
              </p>
            </Card>
          )}
        </div>
      </div>

      {/* Modal d'action */}
      <Modal
        isOpen={isActionModalOpen}
        onClose={() => setIsActionModalOpen(false)}
        title={modalConfig.title}
      >
        <div className="p-4 space-y-4">
          {selectedAppointment && (
            <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Rendez-vous avec <strong>{selectedAppointment.studentName}</strong>
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Le {new Date(selectedAppointment.requestedDate).toLocaleDateString()} à {selectedAppointment.requestedTime}
              </p>
            </div>
          )}

          <p className="text-sm text-gray-600 dark:text-gray-400">
            {modalConfig.description}
          </p>

          <TextArea
            placeholder={modalConfig.placeholder}
            value={actionReason}
            onChange={(value) => setActionReason(value)}
            rows={3}
          />

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setIsActionModalOpen(false)}>
              Annuler
            </Button>
            <Button
              variant={modalConfig.buttonVariant}
              onClick={() => performAction(actionReason)}
            >
              {modalConfig.buttonText}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default MyAppointmentsPage;