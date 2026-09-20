// src/components/documents/internal/InternalDocumentUpload.tsx

import React, { useState, useRef } from 'react';
import { 
  Upload, X, File, Lock, Building, Plus, AlertCircle, 
} from 'lucide-react';
import { Card } from '../../ui/card';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Select } from '../../ui/select';
import { Badge } from '../../ui/badge';
import { Progress } from '../../ui/progress';
import { InternalDocumentUploadPayload, ConfidentialityLevel } from '../../../types/document';
import { AgentDepartment } from '../../../types/auth';
import { useDocuments } from '../../../hooks/useDocuments';
import { useToast } from '../../../hooks/useToast';
import { confidentialityLabels, departmentLabels } from '../../../config/document-labels';

interface InternalDocumentUploadProps {
  onUploadSuccess?: (doc: any) => void;
  onUploadError?: (error: string) => void;
  onClose?: () => void;
}

const CONFIDENTIALITY_OPTIONS = Object.values(ConfidentialityLevel).map((value) => ({
  value,
  label: confidentialityLabels[value],
}));

const DEPARTMENT_OPTIONS = Object.values(AgentDepartment).map((value) => ({
  value,
  label: departmentLabels[value],
}));

const ACCEPTED_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'image/jpeg',
  'image/png',
];

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 Mo

export const InternalDocumentUpload: React.FC<InternalDocumentUploadProps> = ({
  onUploadSuccess,
  onUploadError,
  onClose,
}) => {
  const { uploadInternalDocument, isLoading, uploadProgress } = useDocuments();
  const { toast } = useToast();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [department, setDepartment] = useState<AgentDepartment | ''>('');
  const [confidentiality, setConfidentiality] = useState<ConfidentialityLevel>(ConfidentialityLevel.INTERNAL);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isDragging, setIsDragging] = useState(false);

  const validateFile = (file: File): boolean => {
    const newErrors: Record<string, string> = {};

    if (!ACCEPTED_MIME_TYPES.includes(file.type)) {
      newErrors.file = 'Format non supporté. Utilisez PDF, Word, Excel, JPG ou PNG.';
    }

    if (file.size > MAX_FILE_SIZE) {
      newErrors.file = 'Le fichier est trop volumineux. Maximum 20 Mo.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFileSelect = (file: File) => {
    if (validateFile(file)) {
      setSelectedFile(file);
      setErrors({});
    } else {
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!selectedFile) newErrors.file = 'Veuillez sélectionner un fichier';
    if (!title.trim()) newErrors.title = 'Le titre est requis';
    if (!department) newErrors.department = 'Le service émetteur est requis';
    if (confidentiality === ConfidentialityLevel.RESTRICTED && tags.length === 0) {
      newErrors.tags = 'Les documents restreints doivent avoir au moins un tag';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleUpload = async () => {
    if (!validateForm()) return;

    try {
      const payload: InternalDocumentUploadPayload = {
        file: selectedFile!,
        title: title.trim(),
        department: department as AgentDepartment,
        confidentiality,
        tags,
      };

      const result = await uploadInternalDocument(payload);
      
      toast({
        title: 'Document interne téléversé',
        description: `${selectedFile?.name} a été téléversé avec succès.`,
        variant: 'success',
      });

      onUploadSuccess?.(result);
      
      // Reset form
      setSelectedFile(null);
      setTitle('');
      setDepartment('');
      setConfidentiality(ConfidentialityLevel.INTERNAL);
      setTags([]);
      if (fileInputRef.current) fileInputRef.current.value = '';
      
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur lors du téléversement';
      toast({
        title: 'Erreur',
        description: message,
        variant: 'error',
      });
      onUploadError?.(message);
    }
  };

  const isConfidential = confidentiality === ConfidentialityLevel.CONFIDENTIAL;
  const isRestricted = confidentiality === ConfidentialityLevel.RESTRICTED;

  return (
    <Card className="p-6">
      <div className="space-y-6">
        {/* En-tête */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Téléverser un document interne
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Documents administratifs de l'ambassade
            </p>
          </div>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>

        {/* Zone de dépôt */}
        <div
          className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
            isDragging 
              ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20' 
              : 'border-gray-300 dark:border-gray-600'
          } ${errors.file ? 'border-red-500' : ''}`}
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
        >
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept={ACCEPTED_MIME_TYPES.join(',')}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileSelect(file);
            }}
          />

          {selectedFile ? (
            <div className="flex items-center justify-center gap-4">
              <File className="w-10 h-10 text-brand-500" />
              <div className="text-left">
                <p className="font-medium text-gray-900 dark:text-white">
                  {selectedFile.name}
                </p>
                <p className="text-sm text-gray-500">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} Mo
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedFile(null);
                  if (fileInputRef.current) fileInputRef.current.value = '';
                }}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <>
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-300">
                Glissez-déposez votre fichier ici, ou
              </p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => fileInputRef.current?.click()}
              >
                <Plus className="w-4 h-4 mr-2" />
                Parcourir
              </Button>
            </>
          )}
          {errors.file && (
            <p className="text-sm text-red-600 mt-2">{errors.file}</p>
          )}
        </div>

        {/* Formulaire */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Titre *
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Titre du document"
              error={!!errors.title}
            />
            {errors.title && <p className="text-sm text-red-600 mt-1">{errors.title}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Service émetteur *
              </label>
              <Select
                value={department}
                onChange={(value) => setDepartment(value as AgentDepartment)}
                options={[
                  { value: '', label: 'Sélectionnez un service' },
                  ...DEPARTMENT_OPTIONS,
                ]}
                startIcon={<Building className="w-4 h-4" />}
                error={!!errors.department}
              />
              {errors.department && <p className="text-sm text-red-600 mt-1">{errors.department}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Niveau de confidentialité *
              </label>
              <Select
                value={confidentiality}
                onChange={(value) => setConfidentiality(value as ConfidentialityLevel)}
                options={CONFIDENTIALITY_OPTIONS}
                startIcon={<Lock className="w-4 h-4" />}
              />
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Tags
            </label>
            <div className="flex gap-2">
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                placeholder="Ajouter un tag..."
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                className="flex-1"
              />
              <Button variant="outline" size="sm" onClick={handleAddTag}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            {errors.tags && <p className="text-sm text-red-600 mt-1">{errors.tags}</p>}
            
            <div className="flex flex-wrap gap-1 mt-2">
              {tags.map((tag) => (
                <Badge key={tag} color="primary" variant="light" className="cursor-pointer" onClick={() => handleRemoveTag(tag)}>
                  {tag}
                  <X className="w-3 h-3 ml-1" />
                </Badge>
              ))}
            </div>
          </div>

          {/* Avertissements */}
          {isConfidential && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg">
              <div className="flex items-start gap-2 text-sm text-red-700 dark:text-red-300">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <p>
                  Document confidentiel. Réservé à l'Ambassadeur et aux Administrateurs.
                </p>
              </div>
            </div>
          )}

          {isRestricted && (
            <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg">
              <div className="flex items-start gap-2 text-sm text-yellow-700 dark:text-yellow-300">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <p>
                  Document restreint. Des destinataires doivent être sélectionnés.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Barre de progression */}
        {isLoading && (
          <div className="space-y-2">
            <Progress value={uploadProgress} className="h-2" />
            <p className="text-sm text-gray-500 text-right">
              {uploadProgress}%
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button variant="ghost" onClick={onClose}>
            Annuler
          </Button>
          <Button
            variant="primary"
            onClick={handleUpload}
            disabled={isLoading || !selectedFile || !title || !department}
          >
            {isLoading ? 'Téléversement...' : 'Téléverser'}
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default InternalDocumentUpload;