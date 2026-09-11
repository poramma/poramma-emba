// src/components/communication/wizard/CampagneContentStep.tsx

import React, { useState, useRef } from 'react';
import { 
  Info, AlertTriangle, Calendar, Clipboard, Bell,
  Bold, Italic, Link, List, ListOrdered, Heading
} from 'lucide-react';
import { Card } from '../../ui/card';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { TextArea } from '../../ui/textarea';
import { Badge } from '../../ui/badge';
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
  const [wordCount, setWordCount] = useState(0);
  // Référence vers le <textarea> natif — nécessaire pour lire/manipuler
  // la sélection de texte lors des actions de la toolbar.
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleContentChange = (content: string) => {
    const words = content.trim().split(/\s+/).filter(Boolean);
    setWordCount(words.length);
    onChange({ content });
  };

  const handleTitleChange = (title: string) => {
    if (title.length <= 120) {
      onChange({ title });
    }
  };

  /**
   * Entoure le texte sélectionné avec une syntaxe Markdown (ex: **avant/après**
   * pour le gras). S'il n'y a pas de sélection, insère un texte indicatif
   * pré-rempli à la place du curseur, sélectionné pour être remplacé
   * immédiatement par la frappe suivante.
   */
  const applyWrap = (marker: string, placeholder: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const current = value.content;
    const hasSelection = start !== end;
    const selected = hasSelection ? current.slice(start, end) : placeholder;

    const newContent = current.slice(0, start) + marker + selected + marker + current.slice(end);
    handleContentChange(newContent);

    requestAnimationFrame(() => {
      textarea.focus();
      const selStart = start + marker.length;
      const selEnd = selStart + selected.length;
      textarea.setSelectionRange(selStart, selEnd);
    });
  };

  /**
   * Applique un préfixe à chaque ligne de la sélection courante (étendue
   * automatiquement aux limites de ligne complètes). Utilisé pour les listes
   * à puces, les listes numérotées et les titres.
   */
  const applyLinePrefix = (getPrefix: (lineIndex: number) => string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const current = value.content;

    const lineStart = current.lastIndexOf('\n', start - 1) + 1;
    const lineEndIndex = current.indexOf('\n', end);
    const lineEnd = lineEndIndex === -1 ? current.length : lineEndIndex;

    const before = current.slice(0, lineStart);
    const selectedBlock = current.slice(lineStart, lineEnd);
    const after = current.slice(lineEnd);

    const lines = selectedBlock.length ? selectedBlock.split('\n') : [''];
    const prefixedLines = lines.map((line, i) => `${getPrefix(i)}${line}`);
    const newBlock = prefixedLines.join('\n');

    const newContent = before + newBlock + after;
    handleContentChange(newContent);

    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(lineStart, lineStart + newBlock.length);
    });
  };

  const handleLink = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const url = window.prompt('Adresse du lien (https://...)');
    if (!url) return; // agent a annulé la saisie

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const current = value.content;
    const label = current.slice(start, end) || 'texte du lien';

    const inserted = `[${label}](${url})`;
    const newContent = current.slice(0, start) + inserted + current.slice(end);
    handleContentChange(newContent);

    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(start, start + inserted.length);
    });
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
        <div className="border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
          {/* Toolbar — chaque bouton agit directement sur la sélection du textarea */}
          <div className="flex items-center gap-1 p-2 bg-gray-50 dark:bg-gray-800 border-b border-gray-300 dark:border-gray-600">
            <Button
              type="button"
              size="xs"
              variant="ghost"
              title="Gras"
              onClick={() => applyWrap('**', 'texte en gras')}
            >
              <Bold className="w-4 h-4" />
            </Button>
            <Button
              type="button"
              size="xs"
              variant="ghost"
              title="Italique"
              onClick={() => applyWrap('*', 'texte en italique')}
            >
              <Italic className="w-4 h-4" />
            </Button>
            <Button
              type="button"
              size="xs"
              variant="ghost"
              title="Lien"
              onClick={handleLink}
            >
              <Link className="w-4 h-4" />
            </Button>
            <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />
            <Button
              type="button"
              size="xs"
              variant="ghost"
              title="Liste à puces"
              onClick={() => applyLinePrefix(() => '- ')}
            >
              <List className="w-4 h-4" />
            </Button>
            <Button
              type="button"
              size="xs"
              variant="ghost"
              title="Liste numérotée"
              onClick={() => applyLinePrefix((i) => `${i + 1}. `)}
            >
              <ListOrdered className="w-4 h-4" />
            </Button>
            <Button
              type="button"
              size="xs"
              variant="ghost"
              title="Titre"
              onClick={() => applyLinePrefix(() => '## ')}
            >
              <Heading className="w-4 h-4" />
            </Button>
          </div>
          <TextArea
            ref={textareaRef}
            value={value.content}
            onChange={(value) => handleContentChange(value)}
            placeholder="Rédigez votre message..."
            rows={8}
            className="border-0 rounded-none resize-y font-mono text-sm"
          />
        </div>
        <div className="flex items-center justify-between mt-1">
          <span className="text-xs text-gray-400">
            {wordCount} mot{wordCount > 1 ? 's' : ''}
          </span>
          <span className="text-xs text-gray-400">
            Les annonces concises sont mieux lues
          </span>
        </div>
        <p className="text-xs text-gray-400 mt-1">
          Formatage Markdown : **gras**, *italique*, [lien](url), listes et titres — l'aperçu ci-dessous et la page détail affichent la mise en forme.
        </p>
      </div>

      {/* Aperçu rapide */}
      {value.title && value.content && (
        <Card className="p-4 bg-gray-50 dark:bg-gray-800">
          <p className="text-xs font-medium text-gray-500 uppercase mb-2">Aperçu</p>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge color="primary" variant="light" size="sm">
                {TYPE_CONFIG[value.type]?.label || 'Info'}
              </Badge>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {value.title}
              </span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-3">
              {value.content}
            </p>
          </div>
        </Card>
      )}
    </div>
  );
};

export default CampagneContentStep;