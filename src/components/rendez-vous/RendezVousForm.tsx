import React, { useState } from 'react';
import { useDebouncedSearch } from '../../hooks/useDebouncedSearch';
import { AlertCircle, Search, User, X } from 'lucide-react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select } from '../ui/select';
import { Badge } from '../ui/badge';
import { Modal } from '../ui/modal';
import { useRendezVous } from '../../hooks/useRendezVous';
import { useAuth } from '../../hooks/useAuth';
import { useServices } from '../../hooks/useServices';
import { useEtudiants } from '../../hooks/useEtudiants';
import { Etudiant } from '../../types/etudiant';
import { CreneauPicker } from './CreneauPicker';
import { formatDateShort } from '../../lib/date';

interface RendezVousFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (rdvId: string) => void;
  initialData?: {
    userId?: string;
    subServiceId?: string;
    agentId?: string;
    date?: string;
  };
}

export const RendezVousForm: React.FC<RendezVousFormProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialData,
}) => {
  const { user } = useAuth();
  const { createRendezVous, isLoading } = useRendezVous();
  const { subServices } = useServices();
  const { searchEtudiants } = useEtudiants();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [formData, setFormData] = useState({
    userId: initialData?.userId || '',
    subServiceId: initialData?.subServiceId || '',
    slotId: '',
    motif: '',
    date: initialData?.date || new Date().toISOString().split('T')[0],
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [etudiant, setEtudiant] = useState<Etudiant | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchResults, setSearchResults] = useState<Etudiant[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  // Recherche en temps réel : lancée peu après la dernière frappe (et non à chaque touche).
  useDebouncedSearch(searchQuery, (q) => handleStudentSearch(q));
  const [showStudentSearchModal, setShowStudentSearchModal] = useState(false);
  const [isSearchingStudents, setIsSearchingStudents] = useState(false);

  const handleStudentSearch = async (query: string) => {
    if (!query || query.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearchingStudents(true);
    try {
      const results = await searchEtudiants(query);
      setSearchResults(results);
    } catch (error) {
      console.error('Erreur de recherche:', error);
    } finally {
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

  const validateStep1 = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.userId) newErrors.userId = 'Veuillez sélectionner un étudiant';
    if (!formData.subServiceId) newErrors.subServiceId = 'Veuillez sélectionner un service';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.slotId) newErrors.slotId = 'Veuillez sélectionner un créneau';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (step === 1 && validateStep1()) {
      setStep(2);
    } else if (step === 2 && validateStep2()) {
      setStep(3);
    }
  };

  const handlePrevious = () => {
    if (step > 1) setStep(step - 1 as 1 | 2);
  };

  const handleSubmit = async () => {
    try {
      const rdv = await createRendezVous({
        userId: formData.userId,
        subServiceId: formData.subServiceId,
        slotId: formData.slotId,
        motif: formData.motif || undefined,
      });
      
      if (onSuccess) onSuccess(rdv.id);
      onClose();
    } catch (error) {
      console.error('Erreur de création:', error);
    }
  };

  const selectedSubService = subServices.find(s => s.id === formData.subServiceId);

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Nouveau rendez-vous"
        size="lg"
      >
        <div className="space-y-6">
          {/* Étape 1: Sélection étudiant, service, agent */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                <Badge color="primary" variant="solid">Étape 1/3</Badge>
                <span>Identifiez le rendez-vous</span>
              </div>

              {/* Recherche étudiant */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Étudiant *
                </label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Cliquez pour rechercher un étudiant (nom, INUE, email)..."
                    value={etudiant ? `${etudiant.firstName ?? ""} ${etudiant.lastName ?? ""}`.trim() : ""}
                    readOnly
                    onFocus={() => setShowStudentSearchModal(true)}
                    startIcon={<Search className="w-4 h-4" />}
                    className="flex-1"
                  />
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowStudentSearchModal(true);
                      setSearchQuery('');
                      setSearchResults([]);
                    }}
                  >
                    <User className="w-4 h-4 mr-1" />
                    Parcourir
                  </Button>
                </div>
                {errors.userId && (
                  <p className="text-sm text-red-600 mt-1">{errors.userId}</p>
                )}
                
                {etudiant && (
                  <Card className="mt-3 p-3 bg-gray-50 dark:bg-gray-800">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {etudiant.firstName} {etudiant.lastName}
                        </p>
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
                        onClick={() => setEtudiant(null)}
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
                  onChange={(value) => {
                    setFormData({ ...formData, subServiceId: value });
                    // Réinitialiser le créneau si le service change
                    setFormData(prev => ({ ...prev, slotId: '' }));
                  }}
                  options={[
                    { value: '', label: 'Sélectionnez un service' },
                    ...subServices.map(s => ({ value: s.id, label: s.name }))
                  ]}
                />
                {errors.subServiceId && (
                  <p className="text-sm text-red-600 mt-1">{errors.subServiceId}</p>
                )}
                {selectedSubService && (
                  <div className="mt-2 text-sm text-gray-500">
                    <p>Durée: {selectedSubService.schedules?.[0]?.slotDurationMinutes || 30} min</p>
                    <p>Délai: {selectedSubService.slaDays} jours ouvrés</p>
                  </div>
                )}
              </div>

              {/* Motif (optionnel) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Motif (optionnel)
                </label>
                <Input
                  placeholder="Raison du rendez-vous..."
                  value={formData.motif}
                  onChange={(e) => setFormData({ ...formData, motif: e.target.value })}
                />
              </div>
            </div>
          )}

          {/* Étape 2: Sélection créneau */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                <Badge color="primary" variant="solid">Étape 2/3</Badge>
                <span>Choisissez un créneau disponible</span>
              </div>

              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-gray-500">Étudiant:</span>
                    <span className="ml-2 font-medium text-gray-900 dark:text-white">
                    {etudiant?.firstName} {etudiant?.lastName}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Service:</span>
                  <span className="ml-2 font-medium text-gray-900 dark:text-white">
                    {selectedSubService?.name}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Date:</span>
                  <span className="ml-2 font-medium text-gray-900 dark:text-white">
                    {formatDateShort(formData.date)}
                  </span>
                </div>
              </div>
            </div>

            <CreneauPicker
              date={formData.date}
              subServiceId={formData.subServiceId}
              onSlotSelect={(slotId) => setFormData({ ...formData, slotId })}
              selectedSlotId={formData.slotId}
            />
            {errors.slotId && (
              <p className="text-sm text-red-600">{errors.slotId}</p>
            )}
          </div>
          )}

          {/* Étape 3: Confirmation */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                <Badge color="primary" variant="solid">Étape 3/3</Badge>
                <span>Confirmez les informations</span>
              </div>

              <Card className="p-4 bg-gray-50 dark:bg-gray-800">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Étudiant:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {etudiant?.firstName} {etudiant?.lastName}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">INUE:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                    {etudiant?.inue}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Service:</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {selectedSubService?.name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Date:</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {formatDateShort(formData.date)}
                  </span>
                </div>
                {formData.motif && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Motif:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {formData.motif}
                    </span>
                  </div>
                )}
              </div>
            </Card>

            <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <div className="flex items-start gap-2 text-sm text-yellow-800 dark:text-yellow-200">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <p>
                  Une notification sera envoyée à l'étudiant pour confirmer le rendez-vous.
                  L'étudiant pourra annuler jusqu'à 24h avant le rendez-vous.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
          <div>
            {step > 1 && (
              <Button variant="outline" onClick={handlePrevious}>
                Précédent
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={onClose}>
              Annuler
            </Button>
            {step < 3 ? (
              <Button
                variant="primary"
                onClick={handleNext}
                disabled={isLoading}
              >
                Suivant
              </Button>
            ) : (
              <Button
                variant="primary"
                onClick={handleSubmit}
                disabled={isLoading}
              >
                {isLoading ? 'Création...' : 'Créer le rendez-vous'}
              </Button>
            )}
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
          onChange={(e) => setSearchQuery(e.target.value)}
          startIcon={<Search className="w-4 h-4" />}
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
                className="p-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                onClick={() => handleSelectStudent(student)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-900 dark:text-white">
                        {student.firstName} {student.lastName}
                      </p>
                      <Badge color="success" variant="light" size="xs">
                        {student.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-500">{student.inue}</p>
                    <p className="text-sm text-gray-500">{student.email}</p>
                    {student.profile.university && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
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
          <div className="text-center py-8 text-gray-500">
            <Search className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>Aucun résultat pour "{searchQuery}"</p>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-400">
            <Search className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>Entrez au moins 2 caractères pour rechercher</p>
          </div>
        )}
      </div>
    </Modal>
  </>
  );
};

export default RendezVousForm;
