// src/components/profile/PreferencesPanel.tsx

import React, { useState } from 'react';
import { 
  Sun, Moon, Monitor, Bell, 
  Mail, CheckCircle
} from 'lucide-react';
import { Card } from '../ui/card';
import { AgentPreferences } from '../../types/profile';

interface PreferencesPanelProps {
  preferences?: AgentPreferences;
  onChange: (preferences: Partial<AgentPreferences>) => Promise<void>;
  isLoading?: boolean;
}

const THEMES = [
  { id: 'light', label: 'Clair', icon: Sun },
  { id: 'dark', label: 'Sombre', icon: Moon },
  { id: 'system', label: 'Système', icon: Monitor },
];

const LANGUAGES = [
  { id: 'fr', label: 'Français', flag: '🇫🇷' },
  { id: 'bm', label: 'Bambara', flag: '🇲🇱' },
];

export const PreferencesPanel: React.FC<PreferencesPanelProps> = ({
  preferences,
  onChange,
  isLoading = false,
}) => {
  const [localPrefs, setLocalPrefs] = useState<AgentPreferences | undefined>(preferences);
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [saveStatus, setSaveStatus] = useState<Record<string, 'success' | 'error' | null>>({});

  const defaultPrefs: AgentPreferences = {
    theme: 'system',
    language: 'fr',
    notificationsEmail: true,
    notificationsInApp: true,
    notificationTypes: {
      demandeAssigned: true,
      documentPending: true,
      rendezVousReminder: true,
    },
  };

  const currentPrefs = localPrefs || defaultPrefs;

  const handleChange = async <K extends keyof AgentPreferences>(
    key: K,
    value: AgentPreferences[K]
  ) => {
    const updated = { ...currentPrefs, [key]: value };
    setLocalPrefs(updated);
    setSaving({ ...saving, [key]: true });
    setSaveStatus({ ...saveStatus, [key]: null });

    try {
      await onChange({ [key]: value });
      setSaveStatus({ ...saveStatus, [key]: 'success' });
      setTimeout(() => {
        setSaveStatus(prev => ({ ...prev, [key]: null }));
      }, 2000);
    } catch (error) {
      setSaveStatus({ ...saveStatus, [key]: 'error' });
    } finally {
      setSaving({ ...saving, [key]: false });
    }
  };

  const handleNotificationTypeChange = (type: keyof typeof currentPrefs.notificationTypes) => {
    const updatedTypes = {
      ...currentPrefs.notificationTypes,
      [type]: !currentPrefs.notificationTypes[type],
    };
    handleChange('notificationTypes', updatedTypes);
  };

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="space-y-8">
        {/* Thème */}
        <div>
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Thème
          </h4>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Choisissez l'apparence de l'application
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {THEMES.map((theme) => {
              const Icon = theme.icon;
              const isActive = currentPrefs.theme === theme.id;
              
              return (
                <button
                  key={theme.id}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    isActive 
                      ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20' 
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-500'
                  }`}
                  onClick={() => handleChange('theme', theme.id as any)}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-5 h-5 ${isActive ? 'text-brand-500' : 'text-gray-400'}`} />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {theme.label}
                    </span>
                    {isActive && (
                      <CheckCircle className="w-4 h-4 text-brand-500 ml-auto" />
                    )}
                  </div>
                  <div className="mt-2 h-8 rounded bg-gray-100 dark:bg-gray-700 overflow-hidden flex">
                    <div className="w-1/3 bg-white dark:bg-gray-800"></div>
                    <div className="w-1/3 bg-gray-200 dark:bg-gray-600"></div>
                    <div className="w-1/3 bg-gray-300 dark:bg-gray-500"></div>
                  </div>
                </button>
              );
            })}
          </div>
          {saveStatus.theme === 'success' && (
            <div className="mt-2 text-sm text-green-600 flex items-center gap-1">
              <CheckCircle className="w-4 h-4" />
              Thème enregistré
            </div>
          )}
        </div>

        {/* Langue */}
        <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Langue
          </h4>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Choisissez votre langue préférée
          </p>
          <div className="flex flex-wrap gap-3">
            {LANGUAGES.map((lang) => {
              const isActive = currentPrefs.language === lang.id;
              
              return (
                <button
                  key={lang.id}
                  className={`px-4 py-2 rounded-lg border-2 transition-all flex items-center gap-2 ${
                    isActive 
                      ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20' 
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-500'
                  }`}
                  onClick={() => handleChange('language', lang.id as any)}
                >
                  <span className="text-lg">{lang.flag}</span>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {lang.label}
                  </span>
                  {isActive && (
                    <CheckCircle className="w-4 h-4 text-brand-500" />
                  )}
                </button>
              );
            })}
          </div>
          {saveStatus.language === 'success' && (
            <div className="mt-2 text-sm text-green-600 flex items-center gap-1">
              <CheckCircle className="w-4 h-4" />
              Langue enregistrée
            </div>
          )}
        </div>

        {/* Notifications */}
        <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Notifications
          </h4>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Gérez vos préférences de notification
          </p>

          {/* Canaux */}
          <div className="space-y-3 mb-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Notifications par email
                  </p>
                  <p className="text-xs text-gray-500">Reçu sur votre adresse email</p>
                </div>
              </div>
              <button
                aria-label="Notifications par mail"
                onClick={() => handleChange('notificationsEmail', !currentPrefs.notificationsEmail)}
                className={`w-10 h-6 rounded-full transition-colors ${
                  currentPrefs.notificationsEmail ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'
                }`}
              >
                <div className={`w-4 h-4 rounded-full bg-white transition-transform ${
                  currentPrefs.notificationsEmail ? 'translate-x-5' : 'translate-x-1'
                }`} />
              </button>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="flex items-center gap-3">
                <Bell className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Notifications dans l'application
                  </p>
                  <p className="text-xs text-gray-500">Affichées dans l'interface</p>
                </div>
              </div>
              <button
                aria-label="Notification dans l'application"
                onClick={() => handleChange('notificationsInApp', !currentPrefs.notificationsInApp)}
                className={`w-10 h-6 rounded-full transition-colors ${
                  currentPrefs.notificationsInApp ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'
                }`}
              >
                <div className={`w-4 h-4 rounded-full bg-white transition-transform ${
                  currentPrefs.notificationsInApp ? 'translate-x-5' : 'translate-x-1'
                }`} />
              </button>
            </div>
          </div>

          {/* Types de notifications */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
              Types d'alertes
            </p>
            {Object.entries(currentPrefs.notificationTypes).map(([key, value]) => {
              const labels: Record<string, string> = {
                demandeAssigned: 'Nouvelle demande assignée',
                documentPending: 'Document en attente > 48h',
                rendezVousReminder: 'Rappel de rendez-vous',
              };
              
              return (
                <div key={key} className="flex items-center justify-between p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors">
                  <span className="text-sm text-gray-600 dark:text-gray-300">
                    {labels[key] || key}
                  </span>
                  <button
                    aria-label="Activer/désactiver cette notification"
                    onClick={() => handleNotificationTypeChange(key as keyof typeof currentPrefs.notificationTypes)}
                    disabled={!currentPrefs.notificationsInApp && !currentPrefs.notificationsEmail}
                    className={`w-8 h-5 rounded-full transition-colors ${
                      value ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'
                    } ${!currentPrefs.notificationsInApp && !currentPrefs.notificationsEmail ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <div className={`w-3 h-3 rounded-full bg-white transition-transform ${
                      value ? 'translate-x-4' : 'translate-x-1'
                    }`} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Card>
  );
};

export default PreferencesPanel;