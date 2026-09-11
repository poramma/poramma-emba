// src/components/services/RequirementForm.tsx

import React, { useState, useEffect } from 'react';
import { Save, FileText } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select } from '../ui/select';
import { TextArea } from '../ui/textarea';
import { Modal } from '../ui/modal';
import { useServices } from '../../hooks/useServices';
import { Requirement, RequirementType } from '../../types/services';

interface RequirementFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  subServiceId: string;
  editData?: Requirement | null;
}

const REQUIREMENT_TYPES = [
  { value: 'DOCUMENT', label: 'Document' },
  { value: 'PHOTO', label: 'Photo' },
  { value: 'FIELD', label: 'Champ' },
  { value: 'FEE', label: 'Frais' },
  { value: 'SIGNATURE', label: 'Signature' },
];

export const RequirementForm: React.FC<RequirementFormProps> = ({
  isOpen,
  onClose,
  onSuccess,
  subServiceId,
  editData,
}) => {
  const { addRequirement, updateRequirement, isLoading } = useServices();

  const [formData, setFormData] = useState({
    type: 'DOCUMENT' as RequirementType,
    label: '',
    key: '',
    description: '',
    required: true,
    order: 1,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (editData) {
      setFormData({
        type: editData.type,
        label: editData.label,
        key: editData.key,
        description: editData.description || '',
        required: editData.required,
        order: editData.order,
      });
    } else {
      setFormData({
        type: RequirementType.DOCUMENT,
        label: '',
        key: '',
        description: '',
        required: true,
        order: 1,
      });
    }
  }, [editData, isOpen]);

  const generateKey = (label: string) => {
    return label
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '');
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.label.trim()) newErrors.label = 'Le nom du document est requis';
    if (!formData.key.trim()) {
      newErrors.key = 'La clé est requise';
    } else if (formData.key.length < 3) {
      newErrors.key = 'La clé doit faire au moins 3 caractères';
    }
    if (formData.order < 0) newErrors.order = 'L\'ordre doit être un nombre positif';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const data = {
        ...formData,
        description: formData.description.trim() || null,
      };

      if (editData) {
        // TODO: Appel API
        // await api.patch(`/requirements/${editData.id}`, data);
        await updateRequirement(editData.id, data);
      } else {
        await addRequirement(subServiceId, data);
      }

      if (onSuccess) onSuccess();
      onClose();
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editData ? 'Modifier le document requis' : 'Ajouter un document requis'}
      size="md"
    >
      <div className="space-y-6">
        {/* En-tête */}
        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-brand-500" />
            <div>
              <p className="font-medium text-gray-900 dark:text-white">
                {editData ? 'Modification' : 'Nouveau'} document requis
              </p>
              <p className="text-sm text-gray-500">
                {editData 
                  ? `Modification de ${editData.label}`
                  : 'Ajoutez un document ou prérequis pour ce service'
                }
              </p>
            </div>
          </div>
        </div>

        {/* Formulaire */}
        <div className="space-y-4">
          {/* Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Type *
            </label>
            <Select
              value={formData.type}
              onChange={(value) => setFormData({ ...formData, type: value as RequirementType })}
              options={REQUIREMENT_TYPES}
            />
          </div>

          {/* Libellé */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Nom du document *
            </label>
            <Input
              value={formData.label}
              onChange={(e) => {
                const value = e.target.value;
                setFormData({ 
                  ...formData, 
                  label: value,
                  key: editData ? formData.key : generateKey(value)
                });
              }}
              placeholder="Ex: Acte de naissance"
              error={!!errors.label}
            />
            {errors.label && (
              <p className="text-sm text-red-600 mt-1">{errors.label}</p>
            )}
          </div>

          {/* Clé */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Clé technique *
            </label>
            <Input
              value={formData.key}
              onChange={(e) => setFormData({ ...formData, key: e.target.value })}
              placeholder="Ex: acte_naissance"
              error={!!errors.key}
              disabled={!editData}
              startIcon={<span className="text-gray-400 text-sm">🔑</span>}
            />
            {errors.key && (
              <p className="text-sm text-red-600 mt-1">{errors.key}</p>
            )}
            <p className="text-xs text-gray-400 mt-1">
              Identifiant unique utilisé dans le code (lettres minuscules, underscores)
            </p>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description
            </label>
            <TextArea
              value={formData.description}
              onChange={(value) => setFormData({ ...formData, description: value })}
              placeholder="Description du document requis..."
              rows={2}
            />
          </div>

          {/* Ordre et Obligatoire */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Ordre d'affichage
              </label>
              <Input
                type="number"
                value={formData.order}
                onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                minLength={0}
                error={!!errors.order}
              />
              {errors.order && (
                <p className="text-sm text-red-600 mt-1">{errors.order}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Statut
              </label>
              <div className="pt-2">
                <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                  <input
                    type="checkbox"
                    checked={formData.required}
                    onChange={(e) => setFormData({ ...formData, required: e.target.checked })}
                    className="rounded text-brand-500"
                  />
                  Obligatoire
                </label>
              </div>
            </div>
          </div>
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
            {isSubmitting ? 'Sauvegarde...' : editData ? 'Mettre à jour' : 'Ajouter'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default RequirementForm;