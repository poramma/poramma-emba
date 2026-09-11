// src/components/profile/SignatureCard.tsx

import React, { useState, useRef } from 'react';
import { 
  PenSquare, Upload, X, FileText, AlertCircle,
  CheckCircle, Trash2, Eye
} from 'lucide-react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Modal } from '../ui/modal';
import { useToast } from '../../hooks/useToast';

interface SignatureCardProps {
  signatureUrl: string | null;
  onUpload: (file: File) => Promise<void>;
  onRemove: () => Promise<void>;
  isLoading?: boolean;
}

export const SignatureCard: React.FC<SignatureCardProps> = ({
  signatureUrl,
  onUpload,
  onRemove,
  isLoading = false,
}) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isUploading, setIsUploading] = useState(false);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Vérifier le type de fichier
    if (!['image/png', 'image/jpeg', 'image/jpg'].includes(file.type)) {
      toast({
        title: 'Format non supporté',
        description: 'Veuillez utiliser une image PNG ou JPG.',
        variant: 'error',
      });
      return;
    }

    // Vérifier la taille (max 2Mo)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: 'Fichier trop volumineux',
        description: 'La signature doit faire moins de 2 Mo.',
        variant: 'error',
      });
      return;
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    try {
      await onUpload(selectedFile);
      toast({
        title: 'Signature mise à jour',
        description: 'Votre signature a été téléversée avec succès.',
        variant: 'success',
      });
      setSelectedFile(null);
      setPreviewUrl(null);
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de téléverser la signature.',
        variant: 'error',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = async () => {
    setIsUploading(true);
    try {
      await onRemove();
      toast({
        title: 'Signature supprimée',
        description: 'Votre signature a été supprimée avec succès.',
        variant: 'info',
      });
      setShowRemoveConfirm(false);
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de supprimer la signature.',
        variant: 'error',
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
            Signature
          </h4>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Cette signature est utilisée sur les attestations et documents officiels que vous générez
          </p>
        </div>
        <PenSquare className="w-6 h-6 text-gray-400" />
      </div>

      {/* Aperçu de la signature */}
      <div className="mb-6 p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
        <p className="text-xs font-medium text-gray-500 uppercase mb-3">Aperçu de la signature</p>
        {signatureUrl ? (
          <div className="relative">
            <img 
              src={signatureUrl} 
              alt="Signature" 
              className="max-h-20 object-contain"
            />
            <Badge color="success" variant="light" className="absolute -top-2 -right-2">
              <CheckCircle className="w-3 h-3 mr-1" />
              Active
            </Badge>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-6 text-gray-400">
            <PenSquare className="w-12 h-12 mb-2 opacity-50" />
            <p className="text-sm">Aucune signature configurée</p>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="space-y-4">
        {/* Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Téléverser une nouvelle signature
          </label>
          <div className="flex items-center gap-3">
            <input
              aria-label="Chargement de fichier de signature"
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/jpg"
              className="hidden"
              onChange={handleFileSelect}
            />
            <Button 
              variant="outline" 
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              <Upload className="w-4 h-4 mr-2" />
              Choisir un fichier
            </Button>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              PNG ou JPG (max 2 Mo)
            </span>
          </div>

          {selectedFile && (
            <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {selectedFile.name}
                </span>
                <span className="text-xs text-gray-400">
                  {(selectedFile.size / 1024).toFixed(0)} Ko
                </span>
              </div>
              <div className="flex gap-2">
                {previewUrl && (
                  <Button size="xs" variant="ghost" onClick={() => window.open(previewUrl, '_blank')}>
                    <Eye className="w-3 h-3" />
                  </Button>
                )}
                <Button 
                  size="xs" 
                  variant="ghost" 
                  onClick={() => {
                    setSelectedFile(null);
                    setPreviewUrl(null);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            </div>
          )}

          {selectedFile && (
            <div className="mt-2 flex justify-end">
              <Button 
                variant="primary" 
                onClick={handleUpload} 
                disabled={isUploading}
                size="sm"
              >
                {isUploading ? 'Téléversement...' : 'Téléverser la signature'}
              </Button>
            </div>
          )}
        </div>

        {/* Suppression */}
        {signatureUrl && (
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button 
              variant="error" 
              onClick={() => setShowRemoveConfirm(true)}
              disabled={isUploading}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Supprimer la signature
            </Button>
            <p className="text-xs text-gray-400 mt-1">
              Cette action remplacera votre signature sur tous les futurs documents générés.
              Les documents déjà émis ne sont pas affectés.
            </p>
          </div>
        )}
      </div>

      {/* Modal de confirmation de suppression */}
      <Modal
        isOpen={showRemoveConfirm}
        onClose={() => setShowRemoveConfirm(false)}
        title="Supprimer la signature"
        size="sm"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-700">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-800 dark:text-red-300">
                Supprimer définitivement votre signature ?
              </p>
              <p className="text-sm text-red-700 dark:text-red-400">
                Cette action est irréversible. Vous devrez téléverser une nouvelle signature pour générer des documents officiels.
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button variant="ghost" onClick={() => setShowRemoveConfirm(false)}>
              Annuler
            </Button>
            <Button variant="error" onClick={handleRemove} disabled={isUploading}>
              {isUploading ? 'Suppression...' : 'Supprimer la signature'}
            </Button>
          </div>
        </div>
      </Modal>
    </Card>
  );
};

export default SignatureCard;