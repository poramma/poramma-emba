// src/components/etudiants/EnrollStudentModal.tsx

import React, { useState } from 'react';
import { Modal } from '../ui/modal';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { api } from '../../lib/api';
import { useToast } from '../../hooks/useToast';

interface EnrollStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const EMPTY_FORM = {
  email: '',
  firstName: '',
  lastName: '',
  phone: '',
  university: '',
  faculty: '',
  studyLevel: '',
};

/**
 * Enrôlement sur place — identité déjà vérifiée en personne par l'agent, pas
 * de passage par l'OTP. Appelle identity-api directement (POST
 * /users/students/enroll), pas ambassade-api : la création du compte
 * identity (users/user_profiles/student_profiles) reste la responsabilité
 * d'identity-api, jamais dupliquée ailleurs.
 */
export const EnrollStudentModal: React.FC<EnrollStudentModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = () => {
    const next: Record<string, string> = {};
    if (!formData.email.trim()) next.email = 'Email requis';
    if (!formData.firstName.trim()) next.firstName = 'Prénom requis';
    if (!formData.lastName.trim()) next.lastName = 'Nom requis';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setIsSubmitting(true);
    try {
      await api.post('/users/students/enroll', {
        email: formData.email,
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone || undefined,
        university: formData.university || undefined,
        faculty: formData.faculty || undefined,
        studyLevel: formData.studyLevel || undefined,
      });
      toast({ title: 'Étudiant enrôlé', description: 'Un email avec ses identifiants lui a été envoyé.', variant: 'success' });
      setFormData(EMPTY_FORM);
      onSuccess();
      onClose();
    } catch (err: any) {
      toast({
        title: 'Erreur',
        description: err?.response?.data?.error ?? 'Impossible d\'enrôler cet étudiant.',
        variant: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Enrôler un étudiant" size="md">
      <div className="space-y-4">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Pour un étudiant présent physiquement à l'ambassade, sans inscription préalable en ligne. Un compte est créé immédiatement.
        </p>

        <Input
          label="Email *"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          error={!!errors.email}
          helperText={errors.email}
        />
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Prénom *"
            value={formData.firstName}
            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
            error={!!errors.firstName}
            helperText={errors.firstName}
          />
          <Input
            label="Nom *"
            value={formData.lastName}
            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
            error={!!errors.lastName}
            helperText={errors.lastName}
          />
        </div>
        <Input
          label="Téléphone"
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
        />

        <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
          <p className="text-xs font-medium text-gray-500 uppercase mb-3">Profil académique (optionnel)</p>
          <div className="space-y-3">
            <Input
              label="Université"
              value={formData.university}
              onChange={(e) => setFormData({ ...formData, university: e.target.value })}
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Faculté"
                value={formData.faculty}
                onChange={(e) => setFormData({ ...formData, faculty: e.target.value })}
              />
              <Input
                label="Niveau d'étude"
                value={formData.studyLevel}
                onChange={(e) => setFormData({ ...formData, studyLevel: e.target.value })}
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="ghost" onClick={onClose}>Annuler</Button>
          <Button variant="primary" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Enrôlement...' : 'Enrôler'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default EnrollStudentModal;
