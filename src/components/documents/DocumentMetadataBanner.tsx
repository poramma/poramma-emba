// src/components/documents/DocumentMetadataBanner.tsx

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Copy, AlertTriangle, Clock3 } from 'lucide-react';
import { Card } from '../ui/card';
import { DocumentGED } from '../../types';
import { documentTypeLabels } from '../../config/document-labels';
import { formatDateShort } from '../../lib/date';

interface DocumentMetadataBannerProps {
  document: DocumentGED;
  isExpired: boolean;
  isExpiringSoon: boolean;
}

export const DocumentMetadataBanner: React.FC<DocumentMetadataBannerProps> = ({
  document,
  isExpired,
  isExpiringSoon,
}) => {
  const navigate = useNavigate();

  const handleCopyChecksum = () => {
    navigator.clipboard.writeText(document.file.checksum);
  };

  return (
    <Card className="p-5 flex flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-theme-xl font-semibold text-gray-900 dark:text-white">
            {documentTypeLabels[document.type] ?? document.type}
          </h2>
          <button
            type="button"
            onClick={() => navigate(`/documents/students/${document.ownerUserId}`)}
            className="text-theme-sm text-[var(--brand-700)] hover:underline mt-1"
          >
            Propriétaire : {document.ownerUserId}
          </button>
        </div>

        {(isExpired || isExpiringSoon) && (
          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-theme-xs font-medium ${
              isExpired
                ? 'bg-error-50 text-error-700 dark:bg-error-900/20'
                : 'bg-warning-50 text-warning-700 dark:bg-warning-900/20'
            }`}
          >
            {isExpired ? <AlertTriangle className="w-4 h-4" /> : <Clock3 className="w-4 h-4" />}
            {isExpired ? 'Document expiré' : 'Expire bientôt'}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-theme-sm">
        <div>
          <p className="text-gray-400 text-theme-xs mb-1">Soumis le</p>
          <p className="text-gray-700 dark:text-gray-300">
            {formatDateShort(document.createdAt)}
          </p>
        </div>
        <div>
          <p className="text-gray-400 text-theme-xs mb-1">Expire le</p>
          <p className="text-gray-700 dark:text-gray-300">
            {document.expiryDate ? formatDateShort(document.expiryDate) : '—'}
          </p>
        </div>
        <div>
          <p className="text-gray-400 text-theme-xs mb-1">Version</p>
          <p className="text-gray-700 dark:text-gray-300">v{document.version}</p>
        </div>
        <div>
          <p className="text-gray-400 text-theme-xs mb-1">Checksum</p>
          <button
            type="button"
            onClick={handleCopyChecksum}
            className="flex items-center gap-1 text-gray-700 dark:text-gray-300 hover:text-[var(--brand-700)]"
          >
            <span className="truncate max-w-[100px]">{document.file.checksum}</span>
            <Copy className="w-3.5 h-3.5 shrink-0" />
          </button>
        </div>
      </div>

      {document.reviewNote && (
        <div className="pt-3 border-t border-gray-100 dark:border-gray-800">
          <p className="text-theme-xs text-gray-400 mb-1">Note du dernier examen</p>
          <p className="text-theme-sm text-gray-700 dark:text-gray-300">{document.reviewNote}</p>
        </div>
      )}
    </Card>
  );
};

export default DocumentMetadataBanner;