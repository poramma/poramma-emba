// src/components/documents/admin/DocumentCategoryManager.tsx

import React, { useState } from 'react';
import { 
  Plus, Edit, Trash2,
  FileText, CheckCircle, XCircle, AlertCircle, Search
} from 'lucide-react';
import { Card } from '../../ui/card';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Select } from '../../ui/select';
import { TextArea } from '../../ui/textarea';
import { Badge } from '../../ui/badge';
import { Modal } from '../../ui/modal';
import { Table, TableHeader, TableRow, TableBody, TableCell } from '../../ui/table';
import { DocumentCategory } from '../../../types';
import { DocumentType } from '../../../types/etudiant';
import { useDocuments } from '../../../hooks/useDocuments';
import { usePermission } from '../../../hooks/usePermission';
import { useToast } from '../../../hooks/useToast';
import { PermissionCode } from '../../../types/auth';

const DOCUMENT_TYPES = Object.entries(DocumentType).map(([key, value]) => ({
  value,
  label: key.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase()),
}));

interface DocumentCategoryManagerProps {
  categories: DocumentCategory[];
  onUpdate?: () => void;
}

export const DocumentCategoryManager: React.FC<DocumentCategoryManagerProps> = ({
  categories,
  onUpdate,
}) => {
  const { toast } = useToast();
  const { can } = usePermission();
  const canManage = can(PermissionCode.SERVICE_ADMIN);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<DocumentCategory | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    allowedTypes: [] as DocumentType[],
    requiresValidation: true,
    maxVersions: 5,
    retentionDays: 365,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const filteredCategories = categories.filter(cat => 
    cat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cat.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAdd = () => {
    setEditingCategory(null);
    setFormData({
      name: '',
      code: '',
      description: '',
      allowedTypes: [],
      requiresValidation: true,
      maxVersions: 5,
      retentionDays: 365,
    });
    setErrors({});
    setIsModalOpen(true);
  };

  const handleEdit = (category: DocumentCategory) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      code: category.code,
      description: category.description || '',
      allowedTypes: category.allowedTypes,
      requiresValidation: category.requiresValidation,
      maxVersions: category.maxVersions,
      retentionDays: category.retentionDays || 365,
    });
    setErrors({});
    setIsModalOpen(true);
  };

  const handleDelete = async (category: DocumentCategory) => {
    if (!window.confirm(`Supprimer la catégorie "${category.name}" ?`)) return;
    
    // Vérifier si des documents sont rattachés
    // TODO: Appel API pour vérifier le nombre de documents
    const docCount = 0; // Mock
    
    if (docCount > 0) {
      toast({
        title: 'Suppression impossible',
        description: `${docCount} document(s) sont rattachés à cette catégorie.`,
        variant: 'error',
      });
      return;
    }

    setIsLoading(true);
    try {
      // TODO: Appel API
      // await api.delete(`/document-categories/${category.id}`);
      toast({
        title: 'Catégorie supprimée',
        description: `La catégorie "${category.name}" a été supprimée.`,
        variant: 'success',
      });
      onUpdate?.();
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de supprimer la catégorie.',
        variant: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) newErrors.name = 'Le nom est requis';
    if (!formData.code.trim()) newErrors.code = 'Le code est requis';
    if (formData.code.length < 2) newErrors.code = 'Le code doit faire au moins 2 caractères';
    if (formData.allowedTypes.length === 0) newErrors.allowedTypes = 'Au moins un type de document';
    if (formData.maxVersions < 1) newErrors.maxVersions = 'Minimum 1 version';
    if (formData.retentionDays < 0) newErrors.retentionDays = 'La durée doit être positive';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const payload = {
        ...formData,
        code: formData.code.toUpperCase(),
        description: formData.description || null,
        retentionDays: formData.retentionDays || null,
      };

      // TODO: Appel API
      // if (editingCategory) {
      //   await api.patch(`/document-categories/${editingCategory.id}`, payload);
      // } else {
      //   await api.post('/document-categories', payload);
      // }

      toast({
        title: editingCategory ? 'Catégorie mise à jour' : 'Catégorie créée',
        description: `${formData.name} ${editingCategory ? 'a été mise à jour' : 'a été créée'}.`,
        variant: 'success',
      });

      setIsModalOpen(false);
      onUpdate?.();
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de sauvegarder la catégorie.',
        variant: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* En-tête */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Catégories de documents
          </h3>
          <p className="text-sm text-gray-500">
            {categories.length} catégorie{categories.length > 1 ? 's' : ''}
          </p>
        </div>
        {canManage && (
          <Button variant="primary" onClick={handleAdd}>
            <Plus className="w-4 h-4 mr-2" />
            Nouvelle catégorie
          </Button>
        )}
      </div>

      {/* Recherche */}
      <Input
        placeholder="Rechercher une catégorie..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        startIcon={<Search className="w-4 h-4" />}
        className="max-w-md"
      />

      {/* Tableau */}
      <Card>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableCell isHeader>Nom</TableCell>
                <TableCell isHeader>Code</TableCell>
                <TableCell isHeader>Types autorisés</TableCell>
                <TableCell isHeader>Validation</TableCell>
                <TableCell isHeader>Versions max</TableCell>
                <TableCell isHeader>Rétention</TableCell>
                <TableCell isHeader align="right">Actions</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCategories.map((category) => (
                <TableRow key={category.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {category.name}
                      </p>
                      {category.description && (
                        <p className="text-sm text-gray-500 truncate max-w-xs">
                          {category.description}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge color="gray" variant="light">
                      {category.code}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {category.allowedTypes.slice(0, 3).map((type) => (
                        <Badge key={type} color="gray" variant="light" size="xs">
                          {type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
                        </Badge>
                      ))}
                      {category.allowedTypes.length > 3 && (
                        <Badge color="gray" variant="light" size="xs">
                          +{category.allowedTypes.length - 3}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {category.requiresValidation ? (
                      <Badge color="success" variant="light" startIcon={<CheckCircle className="w-3 h-3" />}>
                        Oui
                      </Badge>
                    ) : (
                      <Badge color="gray" variant="light" startIcon={<XCircle className="w-3 h-3" />}>
                        Non
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    {category.maxVersions}
                  </TableCell>
                  <TableCell>
                    {category.retentionDays ? `${category.retentionDays} jours` : 'Illimité'}
                  </TableCell>
                  <TableCell className="text-right">
                    {canManage && (
                      <div className="flex justify-end gap-1">
                        <Button size="xs" variant="ghost" onClick={() => handleEdit(category)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button size="xs" variant="ghost" onClick={() => handleDelete(category)}>
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {filteredCategories.length === 0 && (
          <div className="p-8 text-center">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Aucune catégorie trouvée
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              {searchQuery ? 'Aucune catégorie ne correspond à votre recherche.' : 'Commencez par créer une catégorie.'}
            </p>
          </div>
        )}
      </Card>

      {/* Modal de formulaire */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCategory ? 'Modifier la catégorie' : 'Nouvelle catégorie'}
        size="lg"
      >
        <div className="space-y-6">
          {/* Nom */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Nom *
            </label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: Passeport"
              error={!!errors.name}
            />
            {errors.name && <p className="text-sm text-red-600 mt-1">{errors.name}</p>}
          </div>

          {/* Code */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Code *
            </label>
            <Input
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
              placeholder="Ex: PASSPORT"
              disabled={!!editingCategory}
              error={!!errors.code}
            />
            {errors.code && <p className="text-sm text-red-600 mt-1">{errors.code}</p>}
            <p className="text-xs text-gray-400 mt-1">
              Code unique, non modifiable après création.
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
              placeholder="Description de la catégorie..."
              rows={2}
            />
          </div>

          {/* Types autorisés */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Types de documents autorisés *
            </label>
            <Select
              multiple
              value={formData.allowedTypes}
              onChange={(value) => {
                const values = Array.from(value, option => option as DocumentType);
                setFormData({ ...formData, allowedTypes: values });
              }}
              options={DOCUMENT_TYPES}
              error={!!errors.allowedTypes}
            />
            {errors.allowedTypes && <p className="text-sm text-red-600 mt-1">{errors.allowedTypes}</p>}
          </div>

          {/* Options */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                <input
                  type="checkbox"
                  checked={formData.requiresValidation}
                  onChange={(e) => setFormData({ ...formData, requiresValidation: e.target.checked })}
                  className="rounded text-brand-500"
                />
                Validation requise
              </label>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Versions max *
              </label>
              <Input
                type="number"
                value={formData.maxVersions}
                onChange={(e) => setFormData({ ...formData, maxVersions: parseInt(e.target.value) || 1 })}
                minLength={1}
                maxLength={20}
                error={!!errors.maxVersions}
              />
              {errors.maxVersions && <p className="text-sm text-red-600 mt-1">{errors.maxVersions}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Rétention (jours)
              </label>
              <Input
                type="number"
                value={formData.retentionDays}
                onChange={(e) => setFormData({ ...formData, retentionDays: parseInt(e.target.value) || 0 })}
                minLength={0}
                placeholder="Illimité"
                error={!!errors.retentionDays}
              />
              {errors.retentionDays && <p className="text-sm text-red-600 mt-1">{errors.retentionDays}</p>}
              <p className="text-xs text-gray-400 mt-1">0 ou vide = illimité</p>
            </div>
          </div>

          {editingCategory && (
            <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <p className="text-sm text-yellow-700 dark:text-yellow-300">
                <AlertCircle className="w-4 h-4 inline mr-1" />
                La modification du nombre maximum de versions n'affecte pas les documents existants.
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button variant="ghost" onClick={() => setIsModalOpen(false)}>
              Annuler
            </Button>
            <Button variant="primary" onClick={handleSubmit} disabled={isLoading}>
              {isLoading ? 'Sauvegarde...' : editingCategory ? 'Mettre à jour' : 'Créer'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default DocumentCategoryManager;