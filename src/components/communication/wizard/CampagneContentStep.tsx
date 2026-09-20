// src/components/communication/wizard/CampagneContentStep.tsx

import React from 'react';
import { Info, AlertTriangle, Calendar, Clipboard, Bell } from 'lucide-react';
import { Card } from '../../ui/card';
import { Input } from '../../ui/input';
import { Badge } from '../../ui/badge';
import { RichTextEditor } from '../../ui/rich-text/RichTextEditor';
import { toEditorHtml } from '../../../lib/campaignHtml';
import '../../ui/rich-text/rich-content.css';
import { CampagneType } from '../../../types/communication';

interface CampagneContentStepProps {
  value: {
    title: string;
    content: string;
    type: CampagneType;
  };
  onChange: (value: Partial<{ title: string; content: string; type: CampagneType }>) => void;
}

const TYPE_CONFIG: Record<CampagneType, { icon: React.ReactNode; label: string; description: string; color: string }> = {
  [CampagneType.INFO]: {
    icon: <Info className="w-5 h-5" />,
    label: 'Information',
    description: 'Annonce générale pour informer la communauté',
    color: 'text-blue-600 dark:text-blue-400',
  },
  [CampagneType.ALERT]: {
    icon: <AlertTriangle className="w-5 h-5" />,
    label: 'Alerte',
    description: 'Communication urgente nécessitant une attention immédiate',
    color: 'text-red-600 dark:text-red-400',
  },
  [CampagneType.EVENT]: {
    icon: <Calendar className="w-5 h-5" />,
    label: 'Événement',
    description: 'Invitation à un événement ou une activité',
    color: 'text-green-600 dark:text-green-400',
  },
  [CampagneType.SURVEY]: {
    icon: <Clipboard className="w-5 h-5" />,
    label: 'Enquête',
    description: 'Recueil d\'opinions ou de retours d\'expérience',
    color: 'text-purple-600 dark:text-purple-400',
  },
  [CampagneType.REMINDER]: {
    icon: <Bell className="w-5 h-5" />,
    label: 'Rappel',
    description: 'Rappel d\'une échéance ou d\'une action à réaliser',
    color: 'text-orange-600 dark:text-orange-400',
  },
};

export const CampagneContentStep: React.FC<CampagneContentStepProps> = ({
  value,
  onChange,
}) => {
  const handleTitleChange = (title: string) => {
    if (title.length <= 120) {
      onChange({ title });
    }
  };

  return (
    <div className="space-y-6">
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Définissez le contenu principal de votre campagne. Le type conditionne l'affichage et la priorité.
      </p>

      {/* Type de campagne */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Type de campagne *
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {Object.entries(TYPE_CONFIG).map(([type, config]) => {
            const isSelected = value.type === type;
            return (
              <button
                key={type}
                type="button"
                className={`p-4 rounded-lg border-2 text-left transition-all ${
                  isSelected
                    ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-500'
                }`}
                onClick={() => onChange({ type: type as CampagneType })}
              >
                <div className="flex items-center gap-3">
                  <div className={`${config.color}`}>{config.icon}</div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{config.label}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{config.description}</p>
                  </div>
                  {isSelected && (
                    <Badge color="primary" variant="solid" size="xs" className="ml-auto">
                      Sélectionné
                    </Badge>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Titre */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Titre *
        </label>
        <div className="relative">
          <Input
            value={value.title}
            onChange={(e) => handleTitleChange(e.target.value)}
            placeholder="Titre de la campagne..."
            className="pr-20"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
            {value.title.length}/120
          </span>
        </div>
        <p className="text-xs text-gray-400 mt-1">
          Titre visible dans les notifications et le résumé
        </p>
      </div>

      {/* Contenu */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Contenu *
        </label>
        <RichTextEditor
          value={value.content}
          onChange={(content) => onChange({ content })}
          placeholder="Rédigez votre message… Utilisez la barre d'outils pour le mettre en forme, ou importez un document Word."
          titleIsEmpty={!value.title.trim()}
          onTitleFromDocument={(title) => onChange({ title: title.slice(0, 120) })}
        />
        <p className="text-xs text-gray-400 mt-1">
          La mise en forme (gras, listes, liens, tableaux…) s'affiche telle quelle pour la communauté.
        </p>
      </div>

      {/* Aperçu rapide */}
      {value.title && value.content && (
        <Card className="p-4 bg-gray-50 dark:bg-gray-800">
          <p className="text-xs font-medium text-gray-500 uppercase mb-2">Aperçu (tel que la communauté le verra)</p>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge color="primary" variant="light" size="sm">
                {TYPE_CONFIG[value.type]?.label || 'Info'}
              </Badge>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {value.title}
              </span>
            </div>
            <div
              className="rich-content max-h-64 overflow-y-auto text-gray-700 dark:text-gray-300"
              dangerouslySetInnerHTML={{ __html: toEditorHtml(value.content) }}
            />
          </div>
        </Card>
      )}
    </div>
  );
};

export default CampagneContentStep;
