// src/components/communication/wizard/CampagneWizard.tsx

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, ChevronRight, Save, X,
  CheckCircle, 
} from 'lucide-react';
import { Card } from '../../ui/card';
import { Button } from '../../ui/button';
import { CampagneContentStep } from './CampagneContentStep';
import { CampagneMediaStep } from './CampagneMediaStep';
import { CampagneTargetingStep } from './CampagneTargetingStep';
import { CampagneChannelsStep } from './CampagneChannelsStep';
import { useCommunication } from '../../../hooks/useCommunication';
import { useToast } from '../../../hooks/useToast';
import { CreateCampagnePayload, CampagneType, NotifChannel } from '../../../types/communication';

interface CampagneWizardProps {
  campagneId?: string;
  onClose?: () => void;
}

type Step = 'content' | 'media' | 'targeting' | 'channels';

const STEPS: { id: Step; label: string; description: string }[] = [
  { id: 'content', label: 'Contenu', description: 'Titre, type et message' },
  { id: 'media', label: 'Médias', description: 'Images et pièces jointes' },
  { id: 'targeting', label: 'Ciblage', description: 'Destinataires' },
  { id: 'channels', label: 'Canaux & envoi', description: 'Programmation' },
];

export const CampagneWizard: React.FC<CampagneWizardProps> = ({
  campagneId,
  onClose,
}) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const {
    selectedCampagne,
    createCampagne,
    saveDraft,
    sendCampagne,
    scheduleCampagne,
    recipientEstimate,
    isLoading,
    fetchCampagneById,
  } = useCommunication();

  const [currentStep, setCurrentStep] = useState<Step>('content');
  const [completedSteps, setCompletedSteps] = useState<Set<Step>>(new Set());
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [localCampagneId, setLocalCampagneId] = useState<string | undefined>(campagneId);
  const [localMediaPreviews, setLocalMediaPreviews] = useState<Record<string, string>>({});

  // Données du formulaire
  const [formData, setFormData] = useState<Partial<CreateCampagnePayload>>({
    title: '',
    content: '',
    type: CampagneType.INFO,
    targetFilters: {},
    channels: [NotifChannel.IN_APP],
    scheduledAt: undefined,
  });

  // Restaurer l'étape depuis l'URL si spécifiée
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const stepParam = params.get('step');
    if (stepParam && ['content', 'media', 'targeting', 'channels'].includes(stepParam)) {
      setCurrentStep(stepParam as Step);
    }
  }, []);

  // Charger les données si édition
  useEffect(() => {
    if (localCampagneId) {
      fetchCampagneById(localCampagneId);
    }
  }, [localCampagneId]);

  // Mettre à jour le formulaire quand la campagne est chargée
  useEffect(() => {
    if (selectedCampagne && localCampagneId) {
      setFormData({
        title: selectedCampagne.title,
        content: selectedCampagne.content,
        type: selectedCampagne.type,
        targetFilters: selectedCampagne.targetFilters || {},
        channels: [NotifChannel.IN_APP],
        scheduledAt: selectedCampagne.scheduledAt || undefined,
      });
      setHasChanges(false);
    }
  }, [selectedCampagne, localCampagneId]);

  // Auto-sauvegarde toutes les 30s (uniquement pour les modifications
  // ultérieures — la création initiale du brouillon est désormais gérée
  // par ensureDraftExists, appelé explicitement à la sortie de l'étape Contenu)
  useEffect(() => {
    if (!hasChanges) return;

    const interval = setInterval(() => {
      handleAutoSave();
    }, 30000);

    return () => clearInterval(interval);
  }, [formData, hasChanges]);

  const buildPayload = (): CreateCampagnePayload => ({
    title: formData.title || 'Brouillon',
    content: formData.content || '',
    type: formData.type || CampagneType.INFO,
    targetFilters: formData.targetFilters || {},
    channels: formData.channels || [NotifChannel.IN_APP],
    scheduledAt: formData.scheduledAt || undefined,
  });

  const handleAutoSave = async () => {
    if (!formData.title && !formData.content) return;

    setIsSaving(true);
    try {
      const result = await saveDraft(localCampagneId, buildPayload());
      setLastSaved(new Date());
      setHasChanges(false);

      if (!localCampagneId && result) {
        setLocalCampagneId(result.id);
        navigate(`/communication/campagnes/${result.id}/edit?step=${currentStep}`, { replace: true });
      }
    } catch (error) {
      console.error('Auto-save failed:', error);
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * CORRECTIF — Garantit qu'un brouillon existe côté store AVANT d'autoriser
   * l'accès à l'étape Médias. Sans cela, un upload déclenché sur une campagne
   * pas encore créée (localCampagneId === undefined) est accepté par le
   * store mais rattaché à aucune campagne réelle, et donc perdu silencieusement.
   *
   * Retourne l'id de la campagne (existante ou nouvellement créée), ou
   * undefined si la création a échoué — auquel cas la navigation vers
   * l'étape suivante doit être annulée.
   *
   * CORRECTIF — la toute première création passe de NewCampagnePage à
   * EditCampagnePage (deux composants de route différents), ce qui démonte
   * et remonte CampagneWizard : tout setCurrentStep() appelé APRÈS ce
   * navigate() sur l'ancienne instance est perdu (l'utilisateur devait
   * cliquer "Suivant" une seconde fois pour atteindre l'étape Médias).
   * `targetStep` permet à l'appelant d'indiquer directement l'étape visée
   * dans l'URL, pour que la nouvelle instance s'y initialise dès son
   * montage au lieu de rouvrir l'étape Contenu.
   */
  const ensureDraftExists = async (targetStep: Step = currentStep): Promise<string | undefined> => {
    if (localCampagneId) return localCampagneId;

    setIsSaving(true);
    try {
      const result = await saveDraft(undefined, buildPayload());
      setLocalCampagneId(result.id);
      setLastSaved(new Date());
      setHasChanges(false);
      navigate(`/communication/campagnes/${result.id}/edit?step=${targetStep}`, { replace: true });
      return result.id;
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de créer le brouillon de la campagne. Veuillez réessayer.',
        variant: 'error',
      });
      return undefined;
    } finally {
      setIsSaving(false);
    }
  };

  const handleStepChange = (step: Step) => {
    const stepIndex = STEPS.findIndex(s => s.id === step);
    const currentIndex = STEPS.findIndex(s => s.id === currentStep);

    if (stepIndex > currentIndex + 1) {
      toast({
        title: 'Étape non accessible',
        description: 'Veuillez compléter les étapes précédentes.',
        variant: 'warning',
      });
      return;
    }

    setCurrentStep(step);
  };

  const handleNext = async () => {
    const currentIndex = STEPS.findIndex(s => s.id === currentStep);
    if (currentIndex >= STEPS.length - 1) return;

    if (currentStep === 'content') {
      if (!formData.title?.trim() || !formData.content?.trim()) {
        toast({
          title: 'Contenu incomplet',
          description: 'Veuillez renseigner le titre et le contenu.',
          variant: 'warning',
        });
        return;
      }
      if (!formData.type) {
        toast({
          title: 'Type manquant',
          description: 'Veuillez sélectionner un type de campagne.',
          variant: 'warning',
        });
        return;
      }

      // CORRECTIF — on ne quitte l'étape Contenu qu'une fois le brouillon
      // effectivement créé, pour que l'étape Médias reçoive un campagneId valide
      const id = await ensureDraftExists('media');
      if (!id) return;
    }

    if (currentStep === 'targeting') {
      const hasFilters = Object.keys(formData.targetFilters || {}).some(
        key => {
          const value = formData.targetFilters?.[key as keyof typeof formData.targetFilters];
          return value && (!Array.isArray(value) || value.length > 0);
        }
      );

      if (!hasFilters) {
        toast({
          title: 'Ciblage requis',
          description: 'Veuillez définir au moins un critère de ciblage.',
          variant: 'warning',
        });
        return;
      }
    }

    setCompletedSteps(prev => new Set([...prev, currentStep]));
    setCurrentStep(STEPS[currentIndex + 1].id);
  };

  const handlePrevious = () => {
    const currentIndex = STEPS.findIndex(s => s.id === currentStep);
    if (currentIndex > 0) {
      setCurrentStep(STEPS[currentIndex - 1].id);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const result = await saveDraft(localCampagneId, buildPayload());
      setLastSaved(new Date());
      setHasChanges(false);

      if (!localCampagneId && result) {
        setLocalCampagneId(result.id);
      }

      toast({
        title: 'Brouillon enregistré',
        description: 'Votre campagne a été sauvegardée.',
        variant: 'success',
      });
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible d\'enregistrer le brouillon.',
        variant: 'error',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleQuit = () => {
    if (hasChanges) {
      if (!window.confirm('Des modifications non sauvegardées seront perdues. Quitter quand même ?')) {
        return;
      }
    }
    if (onClose) {
      onClose();
    } else {
      navigate('/communication/campagnes');
    }
  };

  const handleSubmit = async (sendNow: boolean, scheduledAt?: string) => {
    // Grâce à ensureDraftExists, localCampagneId est déjà défini à ce stade
    // dans l'immense majorité des cas — ce bloc reste un filet de sécurité
    // si jamais l'agent atteint cette étape par un autre chemin.
    const currentId = localCampagneId ?? (await ensureDraftExists());
    if (!currentId) return;

    if (sendNow) {
      await sendCampagne(currentId);
    } else if (scheduledAt) {
      await scheduleCampagne(currentId, scheduledAt);
    }
    navigate(`/communication/campagnes/${currentId}`);
  };

  const currentStepIndex = STEPS.findIndex(s => s.id === currentStep);

  const getStepStatus = (stepId: Step) => {
    if (completedSteps.has(stepId)) return 'completed';
    if (stepId === currentStep) return 'current';
    return 'pending';
  };

  const handleAttachmentsChange = async () => {
    if (localCampagneId) {
      await fetchCampagneById(localCampagneId);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {localCampagneId ? 'Modifier la campagne' : 'Nouvelle campagne'}
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            {localCampagneId ? 'Modifiez votre campagne existante' : 'Créez une nouvelle campagne de communication'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {lastSaved && (
            <span className="text-xs text-gray-400">
              Brouillon enregistré à {lastSaved.toLocaleTimeString()}
            </span>
          )}
          <Button variant="ghost" size="sm" onClick={handleSave} disabled={isSaving}>
            <Save className="w-4 h-4 mr-1" />
            {isSaving ? 'Sauvegarde...' : 'Sauvegarder'}
          </Button>
          <Button variant="ghost" size="sm" onClick={handleQuit}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Stepper */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          {STEPS.map((step, index) => {
            const status = getStepStatus(step.id);
            const isActive = step.id === currentStep;
            const isCompleted = status === 'completed';

            return (
              <React.Fragment key={step.id}>
                <button
                  className={`flex items-center gap-3 transition-colors ${
                    isActive ? 'text-brand-600 dark:text-brand-400' : 
                    isCompleted ? 'text-green-600 dark:text-green-400' :
                    'text-gray-400 hover:text-gray-600'
                  } ${index <= currentStepIndex ? 'cursor-pointer' : 'cursor-default'}`}
                  onClick={() => handleStepChange(step.id)}
                  disabled={index > currentStepIndex}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    isActive ? 'bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400' :
                    isCompleted ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' :
                    'bg-gray-100 dark:bg-gray-700 text-gray-400'
                  }`}>
                    {isCompleted ? <CheckCircle className="w-4 h-4" /> : index + 1}
                  </div>
                  <div className="hidden sm:block text-left">
                    <p className="text-sm font-medium">{step.label}</p>
                    <p className="text-xs text-gray-400">{step.description}</p>
                  </div>
                </button>
                {index < STEPS.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-2 ${
                    index < currentStepIndex ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-700'
                  }`} />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </Card>

      {/* Contenu des étapes */}
      <div className="min-h-[400px]">
        {currentStep === 'content' && (
          <CampagneContentStep
            value={{
              title: formData.title || '',
              content: formData.content || '',
              type: formData.type || CampagneType.INFO,
            }}
            onChange={(value) => {
              setFormData(prev => ({ ...prev, ...value }));
              setHasChanges(true);
            }}
          />
        )}

        {currentStep === 'media' && (
          localCampagneId ? (
            <CampagneMediaStep
              campagneId={localCampagneId}
              attachments={selectedCampagne?.attachments || []}
              coverImage={selectedCampagne?.coverImage || null}
              onAttachmentsChange={handleAttachmentsChange}
              onLocalPreviewsChange={setLocalMediaPreviews}
            />
          ) : (
            // Filet de sécurité — ne devrait plus jamais s'afficher grâce à
            // ensureDraftExists, mais évite un upload silencieusement perdu
            // si ce composant était atteint par un autre chemin de navigation
            <Card className="p-6 text-center text-sm text-gray-500">
              Enregistrement du brouillon en cours, veuillez patienter avant d'ajouter des médias...
            </Card>
          )
        )}

        {currentStep === 'targeting' && (
          <CampagneTargetingStep
            filters={formData.targetFilters || {}}
            onChange={(filters) => {
              setFormData(prev => ({ ...prev, targetFilters: filters }));
              setHasChanges(true);
            }}
            estimate={recipientEstimate}
            isEstimating={isLoading}
          />
        )}

        {currentStep === 'channels' && (
          <CampagneChannelsStep
            value={{
              channels: formData.channels || [NotifChannel.IN_APP],
              scheduledAt: formData.scheduledAt || null,
            }}
            onChange={(value) => {
              setFormData(prev => ({ ...prev, ...value }));
              setHasChanges(true);
            }}
            campagneId={localCampagneId}
            campagnePreview={{
              title: formData.title || '',
              content: formData.content || '',
              type: formData.type || CampagneType.INFO,
              coverImage: selectedCampagne?.coverImage || null,
              attachments: selectedCampagne?.attachments || [],
            }}
            localMediaPreviews={localMediaPreviews}
            onSubmit={handleSubmit}
            isSubmitting={isLoading}
          />
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between pt-6 border-t border-gray-200 dark:border-gray-700">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={currentStepIndex === 0}
        >
          <ChevronLeft className="w-4 h-4 mr-2" />
          Précédent
        </Button>

        <div className="flex items-center gap-2">
          {currentStepIndex === STEPS.length - 1 ? (
            <span className="text-sm text-gray-500">
              Cliquez sur "Envoyer" ou "Programmer" pour finaliser
            </span>
          ) : (
            <Button variant="primary" onClick={handleNext} disabled={isSaving}>
              {isSaving ? 'Enregistrement...' : 'Suivant'}
              {!isSaving && <ChevronRight className="w-4 h-4 ml-2" />}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CampagneWizard;