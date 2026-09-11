// src/components/profile/AgentProfileHeader.tsx

import React, { useState, useRef } from 'react';
import { 
  Camera, Calendar, Clock,
  CheckCircle, XCircle, AlertTriangle,
  Upload
} from 'lucide-react';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Modal } from '../../components/ui/modal';
import { AgentProfileData } from '../../types';
import { formatDateShort } from '../../lib/date';

interface AgentProfileHeaderProps {
  agentData?: AgentProfileData;
  onAvatarChange?: (file: File) => Promise<void>;
  isLoading?: boolean;
}

const DEPARTMENT_LABELS: Record<string, string> = {
  CONSULAR: 'Service des Affaires Consulaires',
  ADMINISTRATIVE: 'Service Administratif',
  FINANCIAL: 'Service Financier',
  COMMUNICATION: 'Service de la Communication',
  SECURITY: 'Service de la Sécurité',
  STUDIES: 'Service des Études',
};

export const AgentProfileHeader: React.FC<AgentProfileHeaderProps> = ({
  agentData,
  onAvatarChange,
  isLoading = false,
}) => {
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (isLoading || !agentData) {
    return (
      <Card className="p-6 animate-pulse">
        <div className="flex items-center gap-6">
          <div className="w-24 h-24 rounded-full bg-gray-200 dark:bg-gray-700"></div>
          <div className="space-y-3 flex-1">
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/5"></div>
          </div>
        </div>
      </Card>
    );
  }

  const { agent, profile} = agentData || {};
  const fullName = `${profile!.firstName} ${profile!.lastName}`;
  const departmentLabel = DEPARTMENT_LABELS[agent!.department] || agent!.department;
  const hiredDate = new Date(agent!.hiredAt);
  const yearsInService = Math.floor((Date.now() - hiredDate.getTime()) / (1000 * 60 * 60 * 24 * 365));



  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setIsAvatarModalOpen(true);
    }
  };

  const handleAvatarUpload = async () => {
    if (selectedFile && onAvatarChange) {
      await onAvatarChange(selectedFile);
      setIsAvatarModalOpen(false);
      setSelectedFile(null);
      setPreviewUrl(null);
    }
  };

  return (
    <>
      <Card className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-6">
          {/* Avatar */}
          <div className="relative group">
            <div className="w-24 h-24 rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center text-3xl font-semibold text-brand-700 dark:text-brand-300 overflow-hidden">
              {profile!.firstName.charAt(0)}{profile!.lastName.charAt(0)}
            </div>
            <button
              className="absolute bottom-0 right-0 p-1.5 bg-brand-500 hover:bg-brand-600 rounded-full text-white transition-colors shadow-md"
              onClick={() => fileInputRef.current?.click()}
              aria-label="Changer la photo de profil"
            >
              <Camera className="w-4 h-4" />
            </button>
            <input
              aria-label="Charger une image"
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png"
              className="hidden"
              onChange={handleFileSelect}
            />
          </div>

          {/* Informations */}
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                {fullName}
              </h2>
              {agent!.active ? (
                <Badge color="success" variant="light" startIcon={<CheckCircle className="w-3 h-3" />}>
                  Compte actif
                </Badge>
              ) : (
                <Badge color="error" variant="light" startIcon={<XCircle className="w-3 h-3" />}>
                  Compte désactivé
                </Badge>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
              <span className="text-sm text-gray-600 dark:text-gray-300">
                {agent!.roleTitle || 'Agent consulaire'}
              </span>
              <span className="text-sm text-gray-400">•</span>
              <span className="text-sm text-gray-600 dark:text-gray-300">
                {departmentLabel}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-sm text-gray-500 dark:text-gray-400">
              <span className="font-mono text-xs">
                Matricule: {agent!.matricule}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                En poste depuis {formatDateShort(agent!.hiredAt)}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {yearsInService} année{yearsInService > 1 ? 's' : ''} d'ancienneté
              </span>
            </div>

            {!agent!.active && (
              <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400" />
                <span className="text-sm text-red-700 dark:text-red-300">
                  Ce compte est désactivé. Veuillez contacter l'administrateur.
                </span>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Modal de recadrage de l'avatar */}
      <Modal
        isOpen={isAvatarModalOpen}
        onClose={() => {
          setIsAvatarModalOpen(false);
          setSelectedFile(null);
          setPreviewUrl(null);
        }}
        title="Modifier la photo de profil"
        size="md"
      >
        <div className="space-y-4">
          <div className="flex justify-center">
            {previewUrl && (
              <div className="w-48 h-48 rounded-full overflow-hidden border-2 border-gray-200 dark:border-gray-600">
                <img src={previewUrl} alt="Aperçu" className="w-full h-full object-cover" />
              </div>
            )}
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
            Image carrée recommandée (format JPG ou PNG)
          </p>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button variant="ghost" onClick={() => setIsAvatarModalOpen(false)}>
              Annuler
            </Button>
            <Button variant="primary" onClick={handleAvatarUpload}>
              <Upload className="w-4 h-4 mr-2" />
              Téléverser
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default AgentProfileHeader;