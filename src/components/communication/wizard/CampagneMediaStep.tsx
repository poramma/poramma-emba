// src/components/communication/wizard/CampagneMediaStep.tsx

import React from 'react';
import { Image as ImageIcon, Video, File, Info } from 'lucide-react';
import { Card } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { CampagneMediaUploader } from '../CampagneMediaUploader';
import { CampagneAttachment, MAX_BANNER_ITEMS } from '../../../types/communication';
import { StoredFile } from '../../../types/document';
import { useCommunication } from '../../../hooks/useCommunication';

interface CampagneMediaStepProps {
  campagneId: string;
  attachments: CampagneAttachment[];
  coverImage: StoredFile | null;
  onAttachmentsChange: () => void;
  onLocalPreviewsChange?: (previews: Record<string, string>) => void;
}

export const CampagneMediaStep: React.FC<CampagneMediaStepProps> = ({
  campagneId,
  attachments,
  coverImage,
  onAttachmentsChange,
  onLocalPreviewsChange,
}) => {
  const {
    uploadCampagneMedia,
    removeCampagneAttachment,
    reorderCampagneAttachments,
    updateCampagneAttachment,
    setCoverImage,
    attachmentUploadProgress,
    isLoading,
  } = useCommunication();

  const handleUpload = async (payload: any) => {
    await uploadCampagneMedia(campagneId, payload);
    onAttachmentsChange();
  };

  const handleRemove = async (attachmentId: string) => {
    await removeCampagneAttachment(campagneId, attachmentId);
    onAttachmentsChange();
  };

  const handleReorder = async (orderedIds: string[]) => {
    await reorderCampagneAttachments(campagneId, orderedIds);
    onAttachmentsChange();
  };

  const handleToggleBanner = async (attachmentId: string, isBanner: boolean) => {
    await updateCampagneAttachment(campagneId, attachmentId, { isBanner });
    onAttachmentsChange();
  };

  const bannerCount = attachments.filter((a) => a.isBanner).length;

  const handleSetCover = (attachmentId: string) => {
    setCoverImage(campagneId, attachmentId);
    onAttachmentsChange();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
        <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-blue-800 dark:text-blue-300">
            Ajoutez des visuels pour renforcer l'impact de votre annonce
          </p>
          <p className="text-sm text-blue-700 dark:text-blue-400">
            Les images et vidéos améliorent l'engagement. Les documents peuvent être joints en complément.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <CampagneMediaUploader
            campagneId={campagneId}
            attachments={attachments}
            coverImage={coverImage}
            onUpload={handleUpload}
            onSetCover={handleSetCover}
            onRemove={handleRemove}
            onReorder={handleReorder}
            onToggleBanner={handleToggleBanner}
            uploadProgress={attachmentUploadProgress}
            isLoading={isLoading}
            onLocalPreviewsChange={onLocalPreviewsChange}
          />
        </div>

        <div className="space-y-3">
          <Card className="p-4">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Formats acceptés
            </p>
            <div className="space-y-2 text-sm text-gray-500 dark:text-gray-400">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-blue-500" />
                <span>Images: JPG, PNG, WEBP (max 8 Mo)</span>
              </div>
              <div className="flex items-center gap-2">
                <Video className="w-4 h-4 text-purple-500" />
                <span>Vidéos: MP4, WEBM (max 100 Mo)</span>
              </div>
              <div className="flex items-center gap-2">
                <File className="w-4 h-4 text-red-500" />
                <span>Documents: PDF (max 15 Mo)</span>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Bannière (carrousel)</p>
              <Badge color={bannerCount > 0 ? 'success' : 'gray'} variant="light">
                {bannerCount}/{MAX_BANNER_ITEMS}
              </Badge>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Les images et vidéos marquées « Bannière » défilent en carrousel sous le titre de l'annonce, avant le texte. Les autres médias restent affichés sous le contenu.
            </p>
          </Card>

          <Card className="p-4">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Bonnes pratiques
            </p>
            <ul className="text-sm text-gray-500 dark:text-gray-400 space-y-1 list-disc list-inside">
              <li>Une image de couverture améliore la visibilité</li>
              <li>Limitez le nombre de pièces jointes</li>
              <li>Les vidéos courtes sont plus engageantes</li>
              <li>Les PDF sont à privilégier pour les documents officiels</li>
            </ul>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Pièces jointes</span>
              <Badge color="primary" variant="light">
                {attachments.length}/10
              </Badge>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Cette étape est optionnelle
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CampagneMediaStep;