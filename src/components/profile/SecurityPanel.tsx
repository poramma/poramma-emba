// src/components/profile/SecurityPanel.tsx

import React, { useState } from 'react';
import { 
  Shield, Laptop, 
  Eye, EyeOff, RefreshCw, Trash2
} from 'lucide-react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Utilisateur } from '../../types/auth';
import { useToast } from '../../hooks/useToast';
import { formatDateTime } from '../../lib/date';

interface SecurityPanelProps {
  user?: Utilisateur;
  onPasswordChange?: (data: { currentPassword: string; newPassword: string }) => Promise<void>;
  isLoading?: boolean;
}

// Sessions actives mockées
const MOCK_SESSIONS = [
  {
    id: 'sess-001',
    device: 'Chrome sur Windows 11',
    ip: '196.12.45.10',
    location: 'Rabat, Maroc',
    lastActive: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    isCurrent: true,
  },
  {
    id: 'sess-002',
    device: 'Firefox sur macOS',
    ip: '196.12.45.20',
    location: 'Rabat, Maroc',
    lastActive: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    isCurrent: false,
  },
  {
    id: 'sess-003',
    device: 'Safari sur iPhone',
    ip: '196.12.45.30',
    location: 'Casablanca, Maroc',
    lastActive: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    isCurrent: false,
  },
];

export const SecurityPanel: React.FC<SecurityPanelProps> = ({
  user,
  onPasswordChange,
  isLoading = false,
}) => {
  const { toast } = useToast();
  
  // État du formulaire de mot de passe
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState<'weak' | 'medium' | 'strong' | null>(null);
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({});
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // État MFA
  const [isMFAEnabled, setIsMFAEnabled] = useState(user?.mfaEnabled || false);
  const [showMFASetup, setShowMFASetup] = useState(false);
  const [mfaCode, setMfaCode] = useState('');

  // État sessions
  const [sessions] = useState(MOCK_SESSIONS);
  const [revokingSession, setRevokingSession] = useState<string | null>(null);

  const evaluatePasswordStrength = (password: string) => {
    let score = 0;
    if (password.length >= 12) score++;
    if (password.length >= 16) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    if (score >= 5) return 'strong';
    if (score >= 3) return 'medium';
    return 'weak';
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData({ ...passwordData, [name]: value });
    setPasswordErrors({});

    if (name === 'newPassword') {
      setPasswordStrength(evaluatePasswordStrength(value));
    }
  };

  const validatePasswordForm = () => {
    const errors: Record<string, string> = {};
    
    if (!passwordData.currentPassword) {
      errors.currentPassword = 'Veuillez saisir votre mot de passe actuel';
    }
    if (passwordData.newPassword.length < 12) {
      errors.newPassword = 'Le mot de passe doit comporter au moins 12 caractères';
    }
    if (!/[A-Z]/.test(passwordData.newPassword)) {
      errors.newPassword = 'Le mot de passe doit contenir au moins une majuscule';
    }
    if (!/[0-9]/.test(passwordData.newPassword)) {
      errors.newPassword = 'Le mot de passe doit contenir au moins un chiffre';
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      errors.confirmPassword = 'Les mots de passe ne correspondent pas';
    }
    
    setPasswordErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChangePassword = async () => {
    if (!validatePasswordForm()) return;

    setIsChangingPassword(true);
    try {
      await onPasswordChange?.({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      
      toast({
        title: 'Mot de passe modifié',
        description: 'Votre mot de passe a été mis à jour avec succès.',
        variant: 'success',
      });
      
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      setPasswordStrength(null);
      
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de modifier le mot de passe.',
        variant: 'error',
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleToggleMFA = async () => {
    if (isMFAEnabled) {
      // Désactiver MFA
      if (!window.confirm('Désactiver l\'authentification à deux facteurs ?')) return;
      setIsMFAEnabled(false);
      toast({
        title: 'MFA désactivée',
        description: 'L\'authentification à deux facteurs a été désactivée.',
        variant: 'info',
      });
    } else {
      // Activer MFA
      setShowMFASetup(true);
    }
  };

  const handleVerifyMFA = () => {
    if (mfaCode.length === 6) {
      setIsMFAEnabled(true);
      setShowMFASetup(false);
      setMfaCode('');
      toast({
        title: 'MFA activée',
        description: 'L\'authentification à deux facteurs a été activée avec succès.',
        variant: 'success',
      });
    }
  };

  const handleRevokeSession = async (sessionId: string) => {
    setRevokingSession(sessionId);
    try {
      // TODO: Appel API pour révoquer la session
      await new Promise(r => setTimeout(r, 500));
      toast({
        title: 'Session révoquée',
        description: 'La session a été révoquée avec succès.',
        variant: 'success',
      });
    } finally {
      setRevokingSession(null);
    }
  };

  const getPasswordStrengthLabel = (strength: string | null) => {
    switch (strength) {
      case 'strong': return { label: 'Fort', color: 'success' };
      case 'medium': return { label: 'Moyen', color: 'warning' };
      case 'weak': return { label: 'Faible', color: 'error' };
      default: return null;
    }
  };

  const strengthInfo = getPasswordStrengthLabel(passwordStrength);

  return (
    <div className="space-y-6">
      {/* Section Mot de passe */}
      <Card className="p-6">
        <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Mot de passe
        </h4>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Modifiez votre mot de passe. Nous vous recommandons d'utiliser un mot de passe fort.
        </p>

        <div className="space-y-4 max-w-md">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Mot de passe actuel *
            </label>
            <div className="relative">
              <Input
                type={showCurrentPassword ? 'text' : 'password'}
                name="currentPassword"
                value={passwordData.currentPassword}
                onChange={(e) => {
                  setPasswordData({ ...passwordData, currentPassword: e.target.value });
                  setPasswordErrors({ ...passwordErrors, currentPassword: '' });
                  handleChangePassword();
                }}
                placeholder="Saisissez votre mot de passe actuel"
                error={!!passwordErrors.currentPassword}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
              >
                {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {passwordErrors.currentPassword && (
              <p className="text-sm text-red-600 mt-1">{passwordErrors.currentPassword}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Nouveau mot de passe *
            </label>
            <div className="relative">
              <Input
                type={showNewPassword ? 'text' : 'password'}
                name="newPassword"
                value={passwordData.newPassword}
                onChange={(e) => {
                  setPasswordData({ ...passwordData, newPassword: e.target.value });
                  setPasswordErrors({ ...passwordErrors, newPassword: '' });
                  handleChangePassword();
                }}
                placeholder="Saisissez votre nouveau mot de passe"
                error={!!passwordErrors.newPassword}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                onClick={() => setShowNewPassword(!showNewPassword)}
              >
                {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {passwordErrors.newPassword && (
              <p className="text-sm text-red-600 mt-1">{passwordErrors.newPassword}</p>
            )}
            {passwordStrength && (
              <div className="mt-2">
                <div className="flex items-center gap-2">
                  <div className="h-1 flex-1 bg-gray-200 dark:bg-gray-700 rounded overflow-hidden">
                    <div 
                      className={`h-full transition-all ${
                        passwordStrength === 'strong' ? 'w-full bg-green-500' :
                        passwordStrength === 'medium' ? 'w-1/2 bg-yellow-500' :
                        'w-1/4 bg-red-500'
                      }`}
                    />
                  </div>
                  <span className={`text-xs font-medium ${
                    passwordStrength === 'strong' ? 'text-green-600' :
                    passwordStrength === 'medium' ? 'text-yellow-600' :
                    'text-red-600'
                  }`}>
                    {strengthInfo?.label}
                  </span>
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  Minimum 12 caractères, une majuscule et un chiffre
                </p>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Confirmer le nouveau mot de passe *
            </label>
            <Input
              type="password"
              name="confirmPassword"
              value={passwordData.confirmPassword}
              onChange={(e) => {
                setPasswordData({ ...passwordData, confirmPassword: e.target.value });
                setPasswordErrors({ ...passwordErrors, confirmPassword: '' });
                handleChangePassword();
              }}
              placeholder="Confirmez votre nouveau mot de passe"
              error={!!passwordErrors.confirmPassword}
            />
            {passwordErrors.confirmPassword && (
              <p className="text-sm text-red-600 mt-1">{passwordErrors.confirmPassword}</p>
            )}
          </div>

          <div className="flex justify-end pt-2">
            <Button 
              variant="primary" 
              onClick={handleChangePassword}
              disabled={isChangingPassword || !passwordData.currentPassword || !passwordData.newPassword}
            >
              {isChangingPassword ? 'Modification...' : 'Modifier le mot de passe'}
            </Button>
          </div>
        </div>
      </Card>

      {/* Section Authentification Multi-Facteurs */}
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
              Authentification à deux facteurs
            </h4>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Renforcez la sécurité de votre compte avec une vérification en deux étapes
            </p>
          </div>
          <Badge color={isMFAEnabled ? 'success' : 'gray'} variant="solid">
            {isMFAEnabled ? 'Activé' : 'Désactivé'}
          </Badge>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${isMFAEnabled ? 'bg-green-100 dark:bg-green-900/30' : 'bg-gray-100 dark:bg-gray-700'}`}>
              <Shield className={`w-5 h-5 ${isMFAEnabled ? 'text-green-600' : 'text-gray-400'}`} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {isMFAEnabled ? 'Protection active' : 'Protection désactivée'}
              </p>
              <p className="text-xs text-gray-500">
                {isMFAEnabled 
                  ? 'Votre compte est protégé par une vérification en deux étapes'
                  : 'Activez la vérification en deux étapes pour renforcer la sécurité'
                }
              </p>
            </div>
          </div>
          <Button 
            variant={isMFAEnabled ? 'outline' : 'primary'} 
            onClick={handleToggleMFA}
          >
            {isMFAEnabled ? 'Désactiver' : 'Activer'}
          </Button>
        </div>

        {showMFASetup && (
          <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg">
            <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
              Entrez le code de vérification envoyé à votre adresse email.
            </p>
            <div className="flex gap-3">
              <Input
                type="text"
                placeholder="Code à 6 chiffres"
                value={mfaCode}
                onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="w-40"
              />
              <Button variant="primary" onClick={handleVerifyMFA} disabled={mfaCode.length !== 6}>
                Vérifier
              </Button>
              <Button variant="ghost" onClick={() => setShowMFASetup(false)}>
                Annuler
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Section Sessions actives */}
      <Card className="p-6">
        <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Sessions actives
        </h4>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Gérez les appareils connectés à votre compte
        </p>

        <div className="space-y-3">
          {sessions.map((session) => (
            <div key={session.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-gray-200 dark:bg-gray-700 rounded-lg">
                  <Laptop className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {session.device}
                    {session.isCurrent && (
                      <Badge color="success" variant="light" size="xs" className="ml-2">
                        Session actuelle
                      </Badge>
                    )}
                  </p>
                  <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-500">
                    <span>{session.ip}</span>
                    <span>•</span>
                    <span>{session.location}</span>
                    <span>•</span>
                    <span>Dernière activité: {formatDateTime(session.lastActive)}</span>
                  </div>
                </div>
              </div>
              {!session.isCurrent && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleRevokeSession(session.id)}
                  disabled={revokingSession === session.id}
                  className="text-red-500 hover:text-red-700"
                >
                  {revokingSession === session.id ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-red-500"></div>
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                </Button>
              )}
            </div>
          ))}
        </div>

        <div className="mt-4 flex justify-end">
          <Button variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Déconnecter tous les autres appareils
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default SecurityPanel;