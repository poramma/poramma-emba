// src/components/utilisateurs/AgentForm.tsx

import React, { useState, useEffect } from 'react';
import { 
  Save, User, Mail, Phone, Shield, 
  Building, Briefcase
} from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select } from '../ui/select';
import { Modal } from '../ui/modal';
import { useAgents } from '../../hooks/useAgents';
import { useRoles } from '../../hooks/useRoles';
import { usePermission } from '../../hooks/usePermission';
import { Agent, AgentDepartment, RoleName, UserStatus } from '../../types/auth';

interface AgentFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  editData?: Agent | null;
}

const DEPARTMENT_OPTIONS = [
  { value: AgentDepartment.CONSULAR, label: 'Consulaire' },
  { value: AgentDepartment.ADMINISTRATIVE, label: 'Administratif' },
  { value: AgentDepartment.FINANCIAL, label: 'Financier' },
  { value: AgentDepartment.COMMUNICATION, label: 'Communication' },
  { value: AgentDepartment.SECURITY, label: 'Sécurité' },
  { value: AgentDepartment.STUDIES, label: 'Études' },
];

const ROLE_OPTIONS = [
  { value: RoleName.AMBASSADOR, label: 'Ambassadeur' },
  { value: RoleName.ADMIN, label: 'Administrateur' },
  { value: RoleName.SENIOR_AGENT, label: 'Senior Agent' },
  { value: RoleName.AGENT, label: 'Agent' },
  { value: RoleName.RECEPTIONIST, label: 'Accueil' },
  { value: RoleName.AUDITOR, label: 'Auditeur' },
];

export const AgentForm: React.FC<AgentFormProps> = ({
  isOpen,
  onClose,
  onSuccess,
  editData,
}) => {
  const { createAgent, updateAgent, isLoading } = useAgents();
  const { roles, fetchRoles } = useRoles();
  const { can } = usePermission();

  const [formData, setFormData] = useState({
    // Utilisateur
    email: '',
    phone: '',
    firstName: '',
    lastName: '',
    // Agent
    matricule: '',
    roleTitle: '',
    department: AgentDepartment.CONSULAR,
    officeNumber: '',
    // Rôle
    roleId: '',
    // Options
    active: true,
    status: UserStatus.VERIFIED
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [password, setPassword] = useState('');

  useEffect(() => {
    fetchRoles();
  }, []);

  useEffect(() => {
    if (editData) {
      setFormData({
        email: editData.user.email,
        phone: editData.user.phone || '',
        firstName: editData.user.profile.firstName,
        lastName: editData.user.profile.lastName,
        matricule: editData.matricule,
        roleTitle: editData.roleTitle || '',
        department: editData.department,
        officeNumber: editData.officeNumber || '',
        roleId: editData.user.activeRole?.id || '',
        active: editData.active,
        status: editData.user.status,
      });
    } else {
      setFormData({
        email: '',
        phone: '',
        firstName: '',
        lastName: '',
        matricule: '',
        roleTitle: '',
        department: AgentDepartment.CONSULAR,
        officeNumber: '',
        roleId: '',
        active: true,
        status: UserStatus.VERIFIED,
      });
      setPassword('');
    }
  }, [editData, isOpen]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.email.trim()) newErrors.email = 'L\'email est requis';
    if (!formData.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      newErrors.email = 'Email invalide';
    }
    if (!formData.firstName.trim()) newErrors.firstName = 'Le prénom est requis';
    if (!formData.lastName.trim()) newErrors.lastName = 'Le nom est requis';
    if (!formData.matricule.trim()) newErrors.matricule = 'Le matricule est requis';
    if (!editData && !password) newErrors.password = 'Le mot de passe est requis pour la création';
    if (password && password.length < 8) {
      newErrors.password = 'Le mot de passe doit faire au moins 8 caractères';
    }
    if (!formData.roleId) newErrors.roleId = 'Veuillez sélectionner un rôle';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const data = {
        email: formData.email.trim(),
        phone: formData.phone.trim() || null,
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        matricule: formData.matricule.trim().toUpperCase(),
        roleTitle: formData.roleTitle.trim() || null,
        department: formData.department,
        officeNumber: formData.officeNumber.trim() || null,
        roleId: formData.roleId,
        active: formData.active,
        ...(password && { password }),
      };

      if (editData) {
        // TODO: Appel API
        // await api.patch(`/agents/${editData.id}`, data);
        await updateAgent(editData.id, data);
      } else {
        // TODO: Appel API
        // await api.post('/agents', data);
        await createAgent(data);
      }

      if (onSuccess) onSuccess();
      onClose();
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedRole = roles.find((r: any) => r.id === formData.roleId);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editData ? 'Modifier l\'agent' : 'Nouvel agent'}
      size="lg"
    >
      <div className="space-y-6">
        {/* En-tête */}
        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="flex items-center gap-3">
            <User className="w-5 h-5 text-brand-500" />
            <div>
              <p className="font-medium text-gray-900 dark:text-white">
                {editData ? 'Modification' : 'Création'} d'un agent
              </p>
              <p className="text-sm text-gray-500">
                {editData 
                  ? `Modification de ${editData.user.profile.firstName} ${editData.user.profile.lastName}`
                  : 'Ajoutez un nouvel agent à l\'ambassade'
                }
              </p>
            </div>
          </div>
        </div>

        {/* Formulaire */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Email */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email *
            </label>
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="agent@ambassade-mali.ma"
              startIcon={<Mail className="w-4 h-4" />}
              error={!!errors.email}
            />
            {errors.email && (
              <p className="text-sm text-red-600 mt-1">{errors.email}</p>
            )}
          </div>

          {/* Mot de passe (création uniquement) */}
          {!editData && (
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Mot de passe *
              </label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mot de passe sécurisé"
                startIcon={<Shield className="w-4 h-4" />}
                error={!!errors.password}
              />
              {errors.password && (
                <p className="text-sm text-red-600 mt-1">{errors.password}</p>
              )}
              <p className="text-xs text-gray-400 mt-1">
                Minimum 8 caractères, dont une majuscule, une minuscule, un chiffre et un caractère spécial
              </p>
            </div>
          )}

          {/* Prénom */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Prénom *
            </label>
            <Input
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              placeholder="Prénom"
              error={!!errors.firstName}
            />
            {errors.firstName && (
              <p className="text-sm text-red-600 mt-1">{errors.firstName}</p>
            )}
          </div>

          {/* Nom */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Nom *
            </label>
            <Input
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              placeholder="Nom"
              error={!!errors.lastName}
            />
            {errors.lastName && (
              <p className="text-sm text-red-600 mt-1">{errors.lastName}</p>
            )}
          </div>

          {/* Téléphone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Téléphone
            </label>
            <Input
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="+212 6 00 00 00 00"
              startIcon={<Phone className="w-4 h-4" />}
            />
          </div>

          {/* Matricule */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Matricule *
            </label>
            <Input
              value={formData.matricule}
              onChange={(e) => setFormData({ ...formData, matricule: e.target.value.toUpperCase() })}
              placeholder="AGT-XXX-XX"
              startIcon={<Briefcase className="w-4 h-4" />}
              error={!!errors.matricule}
            />
            {errors.matricule && (
              <p className="text-sm text-red-600 mt-1">{errors.matricule}</p>
            )}
          </div>

          {/* Département */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Département *
            </label>
            <Select
              value={formData.department}
              onChange={(value) => setFormData({ ...formData, department: value as AgentDepartment })}
              options={DEPARTMENT_OPTIONS}
              startIcon={<Building className="w-4 h-4" />}
            />
          </div>

          {/* Titre du poste */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Titre du poste
            </label>
            <Input
              value={formData.roleTitle}
              onChange={(e) => setFormData({ ...formData, roleTitle: e.target.value })}
              placeholder="Agent consulaire"
            />
          </div>

          {/* Bureau */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Numéro de bureau
            </label>
            <Input
              value={formData.officeNumber}
              onChange={(e) => setFormData({ ...formData, officeNumber: e.target.value })}
              placeholder="B-201"
            />
          </div>

          {/* Rôle */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Rôle *
            </label>
            <Select
              value={formData.roleId}
              onChange={(value) => setFormData({ ...formData, roleId: value })}
              options={[
                { value: '', label: 'Sélectionnez un rôle' },
                ...roles.map((r : any) => ({ value: r.id, label: r.name })),
              ]}
              startIcon={<Shield className="w-4 h-4" />}
              error={!!errors.roleId}
            />
            {errors.roleId && (
              <p className="text-sm text-red-600 mt-1">{errors.roleId}</p>
            )}
            {selectedRole && (
              <p className="text-xs text-gray-400 mt-1">
                Niveau {selectedRole.level} - {selectedRole.description}
              </p>
            )}
          </div>
        </div>

        {/* Options */}
        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
            <input
              type="checkbox"
              checked={formData.active}
              onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
              className="rounded text-brand-500"
            />
            Actif (peut se connecter et travailler)
          </label>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button variant="ghost" onClick={onClose}>
            Annuler
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={isSubmitting || isLoading}
            startIcon={<Save className="w-4 h-4" />}
          >
            {isSubmitting ? 'Sauvegarde...' : editData ? 'Mettre à jour' : 'Créer l\'agent'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default AgentForm;