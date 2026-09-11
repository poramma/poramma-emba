// src/components/profile/PersonalInfoCard.tsx

import React, { useState } from 'react';
import { 
  Mail, Phone, 
  ShieldCheck, AlertCircle, Edit, Save, X
} from 'lucide-react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select } from '../ui/select';
import { Badge } from '../ui/badge';
import { Utilisateur, UserProfile, UserStatus } from '../../types/auth';
import { useToast } from '../../hooks/useToast';

interface PersonalInfoCardProps {
  profile?: UserProfile;
  user?: Utilisateur;
  onSave?: (data: Partial<UserProfile>) => Promise<void>;
  isLoading?: boolean;
}

const NATIONALITIES = [
  'Malienne',
  'Marocaine',
  'Autre',
];

export const PersonalInfoCard: React.FC<PersonalInfoCardProps> = ({
  profile,
  user,
  onSave,
  isLoading = false,
}) => {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<UserProfile>>(profile || {});
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!profile || !user) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </Card>
    );
  }

  const isVerified = user.status === UserStatus.VERIFIED;

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.firstName?.trim()) newErrors.firstName = 'Le prénom est requis';
    if (!formData.lastName?.trim()) newErrors.lastName = 'Le nom est requis';
    if (formData.dateOfBirth) {
      const birthDate = new Date(formData.dateOfBirth);
      const age = Math.floor((Date.now() - birthDate.getTime()) / (1000 * 60 * 60 * 24 * 365));
      if (age < 18) newErrors.dateOfBirth = 'Vous devez être majeur';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    
    try {
      await onSave?.(formData);
      setIsEditing(false);
      toast({
        title: 'Informations mises à jour',
        description: 'Vos informations personnelles ont été enregistrées.',
        variant: 'success',
      });
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de mettre à jour les informations.',
        variant: 'error',
      });
    }
  };

  const handleCancel = () => {
    setFormData(profile);
    setErrors({});
    setIsEditing(false);
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Informations personnelles
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Ces informations sont utilisées à des fins administratives officielles
          </p>
        </div>
        {!isEditing ? (
          <Button variant="outline" onClick={() => setIsEditing(true)}>
            <Edit className="w-4 h-4 mr-2" />
            Modifier
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button variant="ghost" onClick={handleCancel}>
              <X className="w-4 h-4 mr-2" />
              Annuler
            </Button>
            <Button variant="primary" onClick={handleSave} disabled={isLoading}>
              <Save className="w-4 h-4 mr-2" />
              {isLoading ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </div>
        )}
      </div>

      {/* Statut de vérification */}
      <div className="mb-6 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isVerified ? (
            <ShieldCheck className="w-5 h-5 text-green-600" />
          ) : (
            <AlertCircle className="w-5 h-5 text-orange-600" />
          )}
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {isVerified ? 'Compte vérifié' : 'Compte non vérifié'}
          </span>
        </div>
        {!isVerified && (
          <Button variant="outline" size="sm">
            <ShieldCheck className="w-4 h-4 mr-2" />
            Renvoyer la vérification
          </Button>
        )}
      </div>

      {/* Formulaire */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Prénom *
          </label>
          <Input
            value={formData.firstName || ''}
            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
            disabled={!isEditing}
            error={!!errors.firstName}
          />
          {errors.firstName && <p className="text-sm text-red-600 mt-1">{errors.firstName}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Nom *
          </label>
          <Input
            value={formData.lastName || ''}
            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
            disabled={!isEditing}
            error={!!errors.lastName}
          />
          {errors.lastName && <p className="text-sm text-red-600 mt-1">{errors.lastName}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Date de naissance
          </label>
          <Input
            type="date"
            value={formData.dateOfBirth || ''}
            onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
            disabled={!isEditing}
            error={!!errors.dateOfBirth}
          />
          {errors.dateOfBirth && <p className="text-sm text-red-600 mt-1">{errors.dateOfBirth}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Nationalité
          </label>
          <Select
            value={formData.nationality || ''}
            onChange={(value) => setFormData({ ...formData, nationality: value })}
            options={[
              { value: '', label: 'Sélectionnez' },
              ...NATIONALITIES.map(n => ({ value: n, label: n })),
            ]}
            disabled={!isEditing}
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Adresse
          </label>
          <Input
            value={formData.address || ''}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            placeholder="Adresse complète"
            disabled={!isEditing}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Ville
          </label>
          <Input
            value={formData.city || ''}
            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
            disabled={!isEditing}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Pays
          </label>
          <Input
            value={formData.country || ''}
            onChange={(e) => setFormData({ ...formData, country: e.target.value })}
            disabled={!isEditing}
          />
        </div>
      </div>

      {/* Contacts (lecture seule) */}
      <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <Mail className="w-5 h-5 text-gray-400" />
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Email</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">{user.email}</p>
              <Badge color={user.emailVerified ? 'success' : 'warning'} variant="light" size="xs" className="mt-1">
                {user.emailVerified ? 'Vérifié' : 'Non vérifié'}
              </Badge>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <Phone className="w-5 h-5 text-gray-400" />
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Téléphone</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">{user.phone || 'Non renseigné'}</p>
              {user.phone && (
                <Badge color={user.phoneVerified ? 'success' : 'warning'} variant="light" size="xs" className="mt-1">
                  {user.phoneVerified ? 'Vérifié' : 'Non vérifié'}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default PersonalInfoCard;