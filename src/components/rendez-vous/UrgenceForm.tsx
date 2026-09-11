// src/components/rendez-vous/UrgenceForm.tsx

import React, { useState } from 'react';
import { AlertCircle, User, Shield, FileText, Clock, Send, Search, X } from 'lucide-react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select } from '../ui/select';
import { TextArea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { Modal } from '../ui/modal';
import { useRendezVous } from '../../hooks/useRendezVous';
import { useAuth } from '../../hooks/useAuth';
import { usePermission } from '../../hooks/usePermission';
import { SUB_SERVICES } from '../../config/services-consulaires';
import { Etudiant } from '../../types/etudiant';

interface UrgenceFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (rdvId: string) => void;
}

export const UrgenceForm: React.FC<UrgenceFormProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { user } = useAuth();
  const { createUrgence, isLoading } = useRendezVous();
  const { canCreateUrgence } = usePermission();

  const [formData, setFormData] = useState({
    userId: '',
    subServiceId: '',
    agentId: '',
    motif: '',
    urgenceJustification: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [etudiant, setEtudiant] = useState<Etudiant | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  // Modal de recherche d'étudiant
  const [showStudentSearchModal, setShowStudentSearchModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Etudiant[]>([]);
  const [isSearchingStudents, setIsSearchingStudents] = useState(false);

  // Vérifier la permission
  if (!canCreateUrgence()) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Accès refusé">
        <div className="p-6 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Permission insuffisante
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Vous n'avez pas les droits pour créer un rendez-vous d'urgence.
          </p>
          <Button className="mt-4" variant="primary" onClick={onClose}>
            Fermer
          </Button>
        </div>
      </Modal>
    );
  }

  const handleStudentSearch = async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearchingStudents(true);
    try {
      // TODO: Appel à l'API de la plateforme étudiante
      setTimeout(() => {
        const mockStudents: Etudiant[] = [
          {
            id: 'usr-stu-001',
            inue: 'ML-STU-000123',
            email: 'amadou.kante@etudiant.ma',
            phone: '+212 6 12 34 56 78',
            firstName: 'Amadou',
            lastName: 'KANTÉ',
            status: 'VERIFIED' as any,
            profile: {
              id: 'prof-001',
              userId: 'usr-stu-001',
              university: 'Université Mohammed V de Rabat',
              faculty: 'Sciences',
              studyLevel: 'Master 1',
              studentCardNumber: 'STU-2024-001',
              enrollmentYear: 2023,
              createdAt: '',
              updatedAt: '',
            },
            bourse: null,
            documents: [],
            demandes: [],
            createdAt: '',
            updatedAt: '',
          },
          {
            id: 'usr-stu-002',
            inue: 'ML-STU-000456',
            email: 'fatoumata.toure@etudiant.ma',
            phone: '+212 6 98 76 54 32',
            firstName: 'Fatoumata',
            lastName: 'TOURÉ',
            status: 'VERIFIED' as any,
            profile: {
              id: 'prof-002',
              userId: 'usr-stu-002',
              university: 'Université Hassan II de Casablanca',
              faculty: 'Droit',
              studyLevel: 'Licence 3',
              studentCardNumber: 'STU-2024-002',
              enrollmentYear: 2024,
              createdAt: '',
              updatedAt: '',
            },
            bourse: null,
            documents: [],
            demandes: [],
            createdAt: '',
            updatedAt: '',
          },
          {
            id: 'usr-stu-003',
            inue: 'ML-STU-000789',
            email: 'ibrahima.diallo@etudiant.ma',
            phone: '+212 6 55 44 33 22',
            firstName: 'Ibrahima',
            lastName: 'DIALLO',
            status: 'VERIFIED' as any,
            profile: {
              id: 'prof-003',
              userId: 'usr-stu-003',
              university: 'Université Cadi Ayyad de Marrakech',
              faculty: 'Médecine',
              studyLevel: 'Doctorat',
              studentCardNumber: 'STU-2024-003',
              enrollmentYear: 2022,
              createdAt: '',
              updatedAt: '',
            },
            bourse: null,
            documents: [],
            demandes: [],
            createdAt: '',
            updatedAt: '',
          },
        ];

        const filtered = mockStudents.filter(
          (student) =>
            student.firstName.toLowerCase().includes(query.toLowerCase()) ||
            student.lastName.toLowerCase().includes(query.toLowerCase()) ||
            student.inue!.toLowerCase().includes(query.toLowerCase()) ||
            student.email.toLowerCase().includes(query.toLowerCase())
        );
        setSearchResults(filtered);
        setIsSearchingStudents(false);
      }, 500);
    } catch (error) {
      console.error('Erreur de recherche:', error);
      setIsSearchingStudents(false);
    }
  };

  const handleSelectStudent = (student: Etudiant) => {
    setEtudiant(student);
    setFormData({ ...formData, userId: student.id });
    setShowStudentSearchModal(false);
    setSearchQuery('');
    setSearchResults([]);
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.userId) newErrors.userId = 'Veuillez sélectionner un étudiant';
    if (!formData.subServiceId) newErrors.subServiceId = 'Veuillez sélectionner un service';
    if (!formData.agentId) newErrors.agentId = 'Veuillez sélectionner un agent';
    if (!formData.motif) newErrors.motif = 'Veuillez indiquer le motif';
    if (!formData.urgenceJustification) {
      newErrors.urgenceJustification = 'Veuillez justifier l\'urgence';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      const rdv = await createUrgence({
        userId: formData.userId,
        subServiceId: formData.subServiceId,
        agentId: formData.agentId,
        motif: formData.motif,
        urgenceJustification: formData.urgenceJustification,
      });
      
      if (onSuccess) onSuccess(rdv.id);
      onClose();
    } catch (error) {
      console.error('Erreur de création d\'urgence:', error);
    }
  };

  return (
    <>
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Rendez-vous d'urgence"
      size="lg"
      footer={
      <>
        <Button variant="ghost" onClick={onClose}>
          Annuler
        </Button>
        <Button
          variant="error"
          onClick={handleSubmit}
          disabled={isLoading}
          startIcon={<AlertCircle className="w-4 h-4" />}
        >
          {isLoading ? 'Création...' : 'Créer l\'urgence'}
        </Button>
      </>
      }
    >
      <div className="space-y-6">
        {/* En-tête d'urgence */}
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-red-800 dark:text-red-300">
                Création d'un rendez-vous d'urgence
              </h3>
              <p className="text-sm text-red-700 dark:text-red-400">
                Cette fonction est réservée aux situations nécessitant une prise en charge immédiate.
                L'étudiant sera reçu sans créneau préalable.
              </p>
            </div>
          </div>
        </div>

        {/* Recherche étudiant */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Étudiant *
          </label>
          <div className="flex gap-2">
            <Input
              placeholder="Rechercher par nom, INUE ou email..."
              onChange={(e) => {
                if (e.target.value.length > 2) {
                  setIsSearching(true);
                  handleStudentSearch(e.target.value);
                }
              }}
              startIcon={<Search className="w-4 h-4" />}
              className="flex-1"
            />
            <Button
              variant="outline"
              onClick={() => setShowStudentSearchModal(true)}
            >
              <User className="w-4 h-4 mr-1" />
              Parcourir
            </Button>
          </div>
          {errors.userId && (
            <p className="text-sm text-red-600 mt-1">{errors.userId}</p>
          )}
          
          {etudiant && (
            <Card className="mt-3 p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-gray-900 dark:text-white">
                      {etudiant.firstName} {etudiant.lastName}
                    </p>
                    <Badge color="success" variant="light">Vérifié</Badge>
                  </div>
                  <p className="text-sm text-gray-500">{etudiant.inue}</p>
                  <p className="text-sm text-gray-500">{etudiant.email}</p>
                  {etudiant.profile.university && (
                    <p className="text-sm text-gray-500">
                      {etudiant.profile.university} • {etudiant.profile.studyLevel}
                    </p>
                  )}
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setEtudiant(null);
                    setFormData({ ...formData, userId: '' });
                  }}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </Card>
          )}
        </div>

        {/* Sélection service */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Service *
          </label>
          <Select
            value={formData.subServiceId}
            onChange={(value) => setFormData({ ...formData, subServiceId: value })}
            options={[
              { value: '', label: 'Sélectionnez un service' },
              ...SUB_SERVICES.map(s => ({ value: s.id, label: s.name }))
            ]}
          />
          {errors.subServiceId && (
            <p className="text-sm text-red-600 mt-1">{errors.subServiceId}</p>
          )}
        </div>

        {/* Sélection agent */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Agent assigné *
          </label>
          <Select
            value={formData.agentId}
            onChange={(value) => setFormData({ ...formData, agentId: value })}
            options={[
              { value: '', label: 'Sélectionnez un agent' },
              { value: 'agent-002-fatima', label: 'Fatima COULIBALY' },
              { value: 'agent-003-amadou', label: 'Amadou DIALLO' },
            ]}
          />
          {errors.agentId && (
            <p className="text-sm text-red-600 mt-1">{errors.agentId}</p>
          )}
        </div>

        {/* Motif */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Motif du rendez-vous *
          </label>
          <Input
            placeholder="Raison du rendez-vous..."
            value={formData.motif}
            onChange={(e) => setFormData({ ...formData, motif: e.target.value })}
          />
          {errors.motif && (
            <p className="text-sm text-red-600 mt-1">{errors.motif}</p>
          )}
        </div>

        {/* Justification d'urgence */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Justification de l'urgence *
          </label>
          <TextArea
            placeholder="Expliquez pourquoi ce rendez-vous doit être traité en urgence..."
            value={formData.urgenceJustification}
            onChange={(value) => setFormData({ ...formData, urgenceJustification: value })}
            rows={4}
          />
          {errors.urgenceJustification && (
            <p className="text-sm text-red-600 mt-1">{errors.urgenceJustification}</p>
          )}
          <p className="text-xs text-gray-400 mt-1">
            Cette justification sera visible par l'agent et conservée pour traçabilité.
          </p>
        </div>

        {/* Disclaimer */}
        <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-700">
          <div className="flex items-start gap-2 text-sm text-yellow-800 dark:text-yellow-200">
            <Clock className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <p>
              Le rendez-vous d'urgence sera créé sans créneau horaire. 
              L'étudiant sera reçu en priorité selon la disponibilité de l'agent.
            </p>
          </div>
        </div>
      </div>
    </Modal>

    {/* Modal de recherche d'étudiant */}
    <Modal
      isOpen={showStudentSearchModal}
      onClose={() => {
        setShowStudentSearchModal(false);
        setSearchQuery('');
        setSearchResults([]);
      }}
      title="Rechercher un étudiant"
      size="md"
    >
      <div className="space-y-4">
        <Input
          placeholder="Rechercher par nom, INUE ou email..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            handleStudentSearch(e.target.value);
          }}  
        />
        
        {isSearchingStudents ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500 mx-auto"></div>
            <p className="text-gray-500 mt-2">Recherche en cours...</p>
          </div>
        ) : searchResults.length > 0 ? (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {searchResults.map((student) => (
              <Card
                key={student.id}
                className="p-3 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-900 dark:text-white">
                        {student.firstName} {student.lastName}
                      </p>
                      <Badge color="success" variant="light">Vérifié</Badge>
                    </div>
                    <p className="text-sm text-gray-500">{student.inue}</p>
                    <p className="text-sm text-gray-500">{student.email}</p>
                    {student.profile.university && (
                      <p className="text-sm text-gray-500">
                        {student.profile.university} • {student.profile.studyLevel}
                      </p>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={(e) => {
                      e?.stopPropagation();
                      handleSelectStudent(student);
                    }}
                  >
                    Sélectionner
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        ) : searchQuery.length > 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">Aucun étudiant trouvé</p>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500">
              Entrez au moins 2 caractères pour rechercher
            </p>
          </div>
        )}
      </div>
    </Modal>
  </>
  );
};

export default UrgenceForm;