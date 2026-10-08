// src/components/documents/DocumentUpload.tsx

import React, { useState, useRef } from 'react';
import { 
  Upload, X, File, Calendar,Plus,
} from 'lucide-react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select } from '../ui/select';
import { TextArea } from '../ui/textarea';
import { Progress } from '../ui/progress';
import { useDocuments } from '../../hooks/useDocuments';
import { useToast } from '../../hooks/useToast';
import { DocumentType, DocumentUploadPayload } from '../../types';
import { documentTypeLabels } from '../../config/document-labels';

interface DocumentUploadProps {
  ownerUserId: string;
  allowedTypes?: DocumentType[];
  onUploadSuccess?: (doc: any) => void;
  onUploadError?: (error: string) => void;
  onClose?: () => void;
}

const DOCUMENT_TYPES = Object.values(DocumentType).map((value) => ({
  value,
  label: documentTypeLabels[value],
}));

const TYPES_WITH_EXPIRY = [
  DocumentType.PASSPORT,
  DocumentType.CONSULAR_CARD,
  DocumentType.STUDENT_CARD,
  DocumentType.ID_CARD,
];

const ACCEPTED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 Mo

export const DocumentUpload: React.FC<DocumentUploadProps> = ({
  ownerUserId,
  allowedTypes,
  onUploadSuccess,
  onUploadError,
  onClose,
}) => {
  const { uploadDocument, isLoading, uploadProgress } = useDocuments();
  const { toast } = useToast();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState<DocumentType | ''>('');
  const [expiryDate, setExpiryDate] = useState('');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isDragging, setIsDragging] = useState(false);

  const filteredTypes = allowedTypes 
    ? DOCUMENT_TYPES.filter(t => allowedTypes.includes(t.value as DocumentType))
    : DOCUMENT_TYPES;

  const showExpiryField = documentType && TYPES_WITH_EXPIRY.includes(documentType as DocumentType);

  const validateFile = (file: File): boolean => {
    const newErrors: Record<string, string> = {};

    if (!ACCEPTED_MIME_TYPES.includes(file.type)) {
      newErrors.file = 'Format non supporté. Utilisez PDF, JPG ou PNG.';
    }

    if (file.size > MAX_FILE_SIZE) {
      newErrors.file = 'Le fichier est trop volumineux. Maximum 10 Mo.';
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

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!selectedFile) newErrors.file = 'Veuillez sélectionner un fichier';
    if (!documentType) newErrors.documentType = 'Veuillez sélectionner un type de document';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleUpload = async () => {
    if (!validateForm()) return;

    try {
      const payload: DocumentUploadPayload = {
        file: selectedFile!,
        type: documentType as DocumentType,
        ownerUserId,
        expiryDate: expiryDate || undefined,
        notes: notes || undefined,
      };

      const result = await uploadDocument(payload);
      
      toast({
        title: 'Document téléversé',
        description: `${selectedFile?.name} a été téléversé avec succès.`,
        variant: 'success',
      });

      onUploadSuccess?.(result);
      
      // Reset form
      setSelectedFile(null);
      setDocumentType('');
      setExpiryDate('');
      setNotes('');
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

  return (
    <Card className="p-6">
      <div className="space-y-6">
        {/* En-tête */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Téléverser un document
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Formats acceptés: PDF, JPG, PNG • Max 10 Mo
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
          className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            isDragging 
              ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20' 
              : 'border-gray-300 dark:border-gray-600'
          } ${errors.file ? 'border-red-500 dark:border-red-500' : ''}`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept={ACCEPTED_MIME_TYPES.join(',')}
            onChange={(e) => {
              const file = (e.target as HTMLInputElement).files?.[0];
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Type de document *
            </label>
            <Select
              value={documentType}
              onChange={(value) => setDocumentType(value as DocumentType)}
              options={[
                { value: '', label: 'Sélectionnez un type' },
                ...filteredTypes,
              ]}
              error={!!errors.documentType}
            />
            {errors.documentType && (
              <p className="text-sm text-red-600 mt-1">{errors.documentType}</p>
            )}
          </div>

          {showExpiryField && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Date d'expiration
              </label>
              <Input
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                startIcon={<Calendar className="w-4 h-4" />}
              />
              <p className="text-xs text-gray-400 mt-1">
                Optionnelle mais recommandée pour les documents d'identité
              </p>
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Notes (optionnel)
          </label>
          <TextArea
            value={notes}
            onChange={(value) => setNotes(value)}
            placeholder="Ajoutez une note sur ce document..."
            rows={2}
          />
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
            disabled={isLoading || !selectedFile || !documentType}
          >
            {isLoading ? 'Téléversement...' : 'Téléverser'}
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default DocumentUpload;