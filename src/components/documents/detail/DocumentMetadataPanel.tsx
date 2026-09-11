// src/components/documents/detail/DocumentMetadataPanel.tsx

import React, { useState } from 'react';
import { 
  User, Calendar, FileText, Tag, Info, 
  ChevronDown, ChevronUp, Copy, Check, Clock, AlertTriangle
} from 'lucide-react';
import { Card } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { DocumentGED } from '../../../types/document';
import { formatDateShort, formatFileSize } from '../../../lib/date';
import { DocStatus } from '../../../types/etudiant';

interface DocumentMetadataPanelProps {
  document: DocumentGED;
  onStudentClick?: (userId: string) => void;
}

export const DocumentMetadataPanel: React.FC<DocumentMetadataPanelProps> = ({
  document,
  onStudentClick,
}) => {
  const [showTechnical, setShowTechnical] = useState(false);
  const [copied, setCopied] = useState(false);

  const getExpiryStatus = () => {
    if (!document.expiryDate) return null;
    
    const now = new Date();
    const expiry = new Date(document.expiryDate);
    const diffDays = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return { label: 'Expiré', color: 'error', icon: <AlertTriangle className="w-4 h-4" /> };
    }
    if (diffDays <= 30) {
      return { label: `${diffDays} jours restants`, color: 'warning', icon: <Clock className="w-4 h-4" /> };
    }
    return { label: `${diffDays} jours restants`, color: 'success', icon: <Check className="w-4 h-4" /> };
  };

  const expiryStatus = getExpiryStatus();

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className="p-4">
      <div className="space-y-4">
        {/* Ligne principale */}
        <div className="flex flex-wrap items-start gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-gray-400" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                {document.file?.originalName || 'Document sans nom'}
              </h3>
              <Badge color={document.status === DocStatus.ACCEPTED ? 'success' : 'gray'} variant="light" size="sm">
                {document.status}
              </Badge>
            </div>
            <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <User className="w-4 h-4" />
                <button 
                  className="hover:text-brand-600 hover:underline"
                  onClick={() => onStudentClick?.(document.ownerUserId)}
                >
                  {document.ownerUserId}
                </button>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Tag className="w-4 h-4" />
                {document.type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
              </span>
              {document.category && (
                <>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Tag className="w-4 h-4" />
                    {document.category.name}
                  </span>
                </>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-sm">
            <div className="flex items-center gap-1 text-gray-500">
              <Calendar className="w-4 h-4" />
              <span>Soumis le {formatDateShort(document.createdAt)}</span>
            </div>
            
            {document.reviewedAt && (
              <div className="flex items-center gap-1 text-gray-500">
                <Clock className="w-4 h-4" />
                <span>Validé le {formatDateShort(document.reviewedAt)}</span>
              </div>
            )}

            {document.file && (
              <Badge color="gray" variant="light" size="xs">
                {formatFileSize(document.file.size)}
              </Badge>
            )}
          </div>
        </div>

        {/* Ligne d'expiration */}
        {expiryStatus && (
          <div className="flex items-center gap-2 p-2 rounded-lg bg-gray-50 dark:bg-gray-800">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Expiration:</span>
            <Badge color={expiryStatus.color as any} variant="light" startIcon={expiryStatus.icon}>
              {document.expiryDate ? formatDateShort(document.expiryDate) : 'N/A'} • {expiryStatus.label}
            </Badge>
          </div>
        )}

        {/* Section technique repliable */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
          <button
            className="flex items-center justify-between w-full text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            onClick={() => setShowTechnical(!showTechnical)}
          >
            <span className="flex items-center gap-2">
              <Info className="w-4 h-4" />
              Détails techniques
            </span>
            {showTechnical ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {showTechnical && (
            <div className="mt-3 space-y-2 text-sm bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
              <div className="flex justify-between">
                <span className="text-gray-500">ID du document</span>
                <span className="font-mono text-gray-700 dark:text-gray-300">{document.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Checksum</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-gray-700 dark:text-gray-300">
                    {document.file?.checksum?.slice(0, 16)}...
                  </span>
                  <button 
                    onClick={() => copyToClipboard(document.file?.checksum || '')}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">MIME Type</span>
                <span className="font-mono text-gray-700 dark:text-gray-300">{document.file?.mimeType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Version</span>
                <span className="font-mono text-gray-700 dark:text-gray-300">v{document.version}</span>
              </div>
              {document.reviewedBy && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Validé par</span>
                  <span className="font-mono text-gray-700 dark:text-gray-300">{document.reviewedBy}</span>
                </div>
              )}
              {document.notes && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Notes</span>
                  <span className="text-gray-700 dark:text-gray-300">{document.notes}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};

export default DocumentMetadataPanel;