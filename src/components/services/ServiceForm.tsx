// src/components/services/ServiceForm.tsx

import React, { useState, useEffect } from 'react';
import { 
  Save, X, AlertCircle, CheckCircle, 
  Calendar, Clock, DollarSign, FileText
} from 'lucide-react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select } from '../ui/select';
import {TextArea} from '../ui/textarea';
import { Badge } from '../ui/badge';
import { Modal } from '../ui/modal';
import { useServices } from '../../hooks/useServices';
import { Service, SubService, RequirementType } from '../../types/services';

interface ServiceFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  editData?: SubService | null;
  serviceId?: string;
}

export const ServiceForm: React.FC<ServiceFormProps> = ({
  isOpen,
  onClose,
  onSuccess,
  editData,
  serviceId,
}) => {
  const { services, createSubService, updateSubService, isLoading } = useServices();

  const [formData, setFormData] = useState({
    serviceId: serviceId || '',
    name: '',
    code: '',
    description: '',
    basePrice: '',
    currency: 'MAD',
    slaDays: '7',
    requiresInPerson: true,
    allowCustomRequest: false,
    active: true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (editData) {
      setFormData({
        serviceId: editData.serviceId,
        name: editData.name,
        code: editData.code,
        description: editData.description || '',
        basePrice: editData.basePrice?.toString() || '',
        currency: editData.currency || 'MAD',
        slaDays: editData.slaDays.toString(),
        requiresInPerson: editData.requiresInPerson,
        allowCustomRequest: editData.allowCustomRequest,
        active: editData.active,
      });
    } else if (serviceId) {
      setFormData(prev => ({ ...prev, serviceId }));
    }
  }, [editData, serviceId]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.serviceId) newErrors.serviceId = 'Veuillez sélectionner une catégorie';
    if (!formData.name.trim()) newErrors.name = 'Le nom est requis';
    if (!formData.code.trim()) newErrors.code = 'Le code est requis';
    if (formData.code.length < 3) newErrors.code = 'Le code doit faire au moins 3 caractères';
    if (formData.slaDays && (parseInt(formData.slaDays) < 1 || parseInt(formData.slaDays) > 365)) {
      newErrors.slaDays = 'Le SLA doit être entre 1 et 365 jours';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const data = {
        serviceId: formData.serviceId,
        name: formData.name.trim(),
        code: formData.code.trim().toUpperCase(),
        description: formData.description.trim() || null,
        basePrice: formData.basePrice ? parseFloat(formData.basePrice) : null,
        currency: formData.currency,
        slaDays: parseInt(formData.slaDays),
        requiresInPerson: formData.requiresInPerson,
        allowCustomRequest: formData.allowCustomRequest,
        active: formData.active,
      };

      if (editData) {
        await updateSubService(editData.id, data);
      } else {
        await createSubService(data);
      }

      if (onSuccess) onSuccess();
      onClose();
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const serviceOptions = services.map(s => ({
    value: s.id,
    label: `${s.name} (${s.code})`,
  }));

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editData ? 'Modifier le sous-service' : 'Nouveau sous-service'}
      size="lg"
    >
      <div className="space-y-6">
        {/* En-tête */}
        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-brand-500" />
            <div>
              <p className="font-medium text-gray-900 dark:text-white">
                {editData ? 'Modification' : 'Création'} d'un sous-service
              </p>
              <p className="text-sm text-gray-500">
                {editData 
                  ? `Modification de ${editData.name}`
                  : 'Ajoutez une nouvelle prestation consulaire'
                }
              </p>
            </div>
          </div>
        </div>

        {/* Formulaire */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Catégorie */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Catégorie *
            </label>
            <Select
              value={formData.serviceId}
              onChange={(value) => setFormData({ ...formData, serviceId: value })}
              options={[
                { value: '', label: 'Sélectionnez une catégorie' },
                ...serviceOptions,
              ]}
            />
            {errors.serviceId && (
              <p className="text-sm text-red-600 mt-1">{errors.serviceId}</p>
            )}
          </div>

          {/* Nom */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Nom *
            </label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Nom du sous-service"
              error={!!errors.name}
            />
            {errors.name && (
              <p className="text-sm text-red-600 mt-1">{errors.name}</p>
            )}
          </div>

          {/* Code */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Code *
            </label>
            <Input
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
              placeholder="Code (ex: RENO_CARTE_CONS)"
              error={!!errors.code}
              startIcon={<span className="text-gray-400 text-sm">🔑</span>}
            />
            {errors.code && (
              <p className="text-sm text-red-600 mt-1">{errors.code}</p>
            )}
          </div>

          {/* Description */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description
            </label>
            <TextArea
              value={formData.description}
              onChange={(value) => setFormData({ ...formData, description: value })}
              placeholder="Description du sous-service"
              rows={2}
            />
          </div>

          {/* Tarif */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Tarif
            </label>
            <div className="flex gap-2">
              <Input
                type="number"
                value={formData.basePrice}
                onChange={(e) => setFormData({ ...formData, basePrice: e.target.value })}
                placeholder="0 = gratuit"
                startIcon={<DollarSign className="w-4 h-4" />}
                className="flex-1"
              />
              <Select
                value={formData.currency}
                onChange={(value) => setFormData({ ...formData, currency: value })}
                options={[
                  { value: 'MAD', label: 'MAD' },
                  { value: 'EUR', label: 'EUR' },
                  { value: 'USD', label: 'USD' },
                ]}
                className="w-24"
              />
            </div>
          </div>

          {/* SLA */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              SLA (jours) *
            </label>
            <Input
              type="number"
              value={formData.slaDays}
              onChange={(e) => setFormData({ ...formData, slaDays: e.target.value })}
              placeholder="7"
              startIcon={<Clock className="w-4 h-4" />}
              error={!!errors.slaDays}
            />
            {errors.slaDays && (
              <p className="text-sm text-red-600 mt-1">{errors.slaDays}</p>
            )}
          </div>

          {/* Options */}
          <div className="md:col-span-2">
            <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                <input
                  type="checkbox"
                  checked={formData.requiresInPerson}
                  onChange={(e) => setFormData({ ...formData, requiresInPerson: e.target.checked })}
                  className="rounded text-brand-500"
                />
                Requiert une présence physique
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                <input
                  type="checkbox"
                  checked={formData.allowCustomRequest}
                  onChange={(e) => setFormData({ ...formData, allowCustomRequest: e.target.checked })}
                  className="rounded text-brand-500"
                />
                Permet des demandes personnalisées
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                <input
                  type="checkbox"
                  checked={formData.active}
                  onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                  className="rounded text-brand-500"
                />
                Actif (visible par les étudiants)
              </label>
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
            {isSubmitting ? 'Sauvegarde...' : editData ? 'Mettre à jour' : 'Créer'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ServiceForm;