// src/components/etudiants/EnrollStudentModal.tsx

import React, { useState } from 'react';
import { Modal } from '../ui/modal';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { api } from '../../lib/api';
import { useToast } from '../../hooks/useToast';
import { formatPhoneInput, phoneError } from '../../lib/phone';
import { emailError } from '../../lib/email';

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
 *
 * Le compte créé est UNVERIFIED avec un mot de passe par défaut : l'étudiant
 * devra le remplacer et confirmer son email dès sa première connexion (voir
 * identity-api's users.service.ts enrollStudent). On affiche ce mot de passe
 * ici pour que l'agent puisse aussi le communiquer de vive voix — il est par
 * ailleurs envoyé par email.
 */
export const EnrollStudentModal: React.FC<EnrollStudentModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  // Champs déjà quittés une fois (blur) : au-delà, l'email/le téléphone se
  // revalident à chaque frappe — pas la peine d'attendre la soumission pour
  // signaler une adresse ou un numéro mal formé.
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [enrolled, setEnrolled] = useState<{ email: string; temporaryPassword: string } | null>(null);

  const fieldError = (name: 'email' | 'phone', value: string): string | null =>
    name === 'email' ? emailError(value, true) : phoneError(value, false);

  const handleBlur = (name: 'email' | 'phone') => {
    setTouched((t) => ({ ...t, [name]: true }));
    setErrors((e) => ({ ...e, [name]: fieldError(name, formData[name]) ?? '' }));
  };

  const validate = () => {
    const next: Record<string, string> = {};
    const emailMsg = emailError(formData.email, true);
    if (emailMsg) next.email = emailMsg;
    if (!formData.firstName.trim()) next.firstName = 'Prénom requis';
    if (!formData.lastName.trim()) next.lastName = 'Nom requis';
    const phoneMsg = phoneError(formData.phone, false); // facultatif à l'enrôlement
    if (phoneMsg) next.phone = phoneMsg;
    setErrors(next);
    setTouched((t) => ({ ...t, email: true, phone: true }));
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setIsSubmitting(true);
    try {
      const { data } = await api.post('/users/students/enroll', {
        email: formData.email,
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone || undefined,
        university: formData.university || undefined,
        faculty: formData.faculty || undefined,
        studyLevel: formData.studyLevel || undefined,
      });
      // On reste sur la modale pour afficher le mot de passe par défaut (déjà
      // envoyé par email, mais l'agent peut aussi le communiquer sur place) ;
      // onSuccess() rafraîchit déjà la liste en arrière-plan.
      setEnrolled({ email: data.data.email, temporaryPassword: data.data.temporaryPassword });
      setFormData(EMPTY_FORM);
      onSuccess();
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

  const handleClose = () => {
    setEnrolled(null);
    setFormData(EMPTY_FORM);
    setErrors({});
    onClose();
  };

  if (enrolled) {
    return (
      <Modal isOpen={isOpen} onClose={handleClose} title="Étudiant enrôlé" size="md">
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Le compte de <strong>{enrolled.email}</strong> est créé. Communiquez ce mot de passe à l'étudiant — il lui a
            aussi été envoyé par email, avec un code de confirmation. Les deux lui seront redemandés à sa première connexion.
          </p>
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-center dark:border-gray-700 dark:bg-gray-800">
            <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">Mot de passe par défaut</p>
            <p className="text-2xl font-bold tracking-wider text-gray-900 dark:text-white">{enrolled.temporaryPassword}</p>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="primary" onClick={handleClose}>Terminé</Button>
          </div>
        </div>
      </Modal>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Enrôler un étudiant" size="md">
      <div className="space-y-4">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Pour un étudiant présent physiquement à l'ambassade, sans inscription préalable en ligne. Un compte est créé immédiatement,
          avec un mot de passe par défaut ; l'étudiant devra le changer et confirmer son email à sa première connexion.
        </p>

        <Input
          label="Email *"
          type="email"
          value={formData.email}
          onChange={(e) => {
            const email = e.target.value;
            setFormData({ ...formData, email });
            if (touched.email) setErrors((err) => ({ ...err, email: emailError(email, true) ?? '' }));
          }}
          onBlur={() => handleBlur('email')}
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
          type="tel"
          placeholder="+212 6 12 34 56 78"
          value={formData.phone}
          onChange={(e) => {
            const phone = formatPhoneInput(e.target.value);
            setFormData({ ...formData, phone });
            if (touched.phone) setErrors((err) => ({ ...err, phone: phoneError(phone, false) ?? '' }));
          }}
          onBlur={() => handleBlur('phone')}
          error={!!errors.phone}
          helperText={errors.phone}
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
          <Button variant="ghost" onClick={handleClose}>Annuler</Button>
          <Button variant="primary" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Enrôlement...' : 'Enrôler'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default EnrollStudentModal;
