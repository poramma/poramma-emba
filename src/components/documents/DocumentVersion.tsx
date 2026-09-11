// src/components/documents/DocumentVersion.tsx

import React, { useState } from 'react';
import { 
  GitBranch, Clock, User, Eye, Download, 
  CheckCircle, XCircle
} from 'lucide-react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { DocumentVersion as DocVersion } from '../../types/document';
import { formatDateShort } from '../../lib/date';

interface DocumentVersionProps {
  documentId: string;
  versions: DocVersion[];
  currentVersion: number;
  onVersionSelect?: (version: DocVersion) => void;
  onCompare?: (versionA: DocVersion, versionB: DocVersion) => void;
}

export const DocumentVersion: React.FC<DocumentVersionProps> = ({
  documentId,
  versions,
  currentVersion,
  onVersionSelect,
  onCompare,
}) => {
  const [selectedVersions, setSelectedVersions] = useState<DocVersion[]>([]);
  const [isCompareMode, setIsCompareMode] = useState(false);

  const sortedVersions = [...versions].sort((a, b) => b.version - a.version);

  const toggleVersionSelection = (version: DocVersion) => {
    if (selectedVersions.find(v => v.id === version.id)) {
      setSelectedVersions(prev => prev.filter(v => v.id !== version.id));
    } else if (selectedVersions.length < 2) {
      setSelectedVersions(prev => [...prev, version]);
    }
  };

  const handleCompare = () => {
    if (selectedVersions.length === 2) {
      setIsCompareMode(true);
      onCompare?.(selectedVersions[0], selectedVersions[1]);
    }
  };

  const handleCloseCompare = () => {
    setIsCompareMode(false);
    setSelectedVersions([]);
  };

  if (versions.length === 0) {
    return (
      <Card className="p-6 text-center">
        <GitBranch className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          Aucune version antérieure
        </h4>
        <p className="text-gray-500 dark:text-gray-400">
          Ce document n'a pas encore été modifié.
        </p>
      </Card>
    );
  }

  if (isCompareMode && selectedVersions.length === 2) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-medium text-gray-900 dark:text-white">
            Comparaison des versions
          </h4>
          <Button variant="ghost" size="sm" onClick={handleCloseCompare}>
            <XCircle className="w-4 h-4 mr-1" />
            Fermer la comparaison
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Card className="p-4">
            <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Version {selectedVersions[0].version}
            </div>
            {/* DocumentViewer simplifié ici */}
            <div className="h-48 bg-gray-100 dark:bg-gray-700 rounded flex items-center justify-center">
              <p className="text-gray-500">Aperçu v{selectedVersions[0].version}</p>
            </div>
          </Card>
          <Card className="p-4">
            <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Version {selectedVersions[1].version}
            </div>
            <div className="h-48 bg-gray-100 dark:bg-gray-700 rounded flex items-center justify-center">
              <p className="text-gray-500">Aperçu v{selectedVersions[1].version}</p>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <GitBranch className="w-5 h-5 text-gray-400" />
          <h4 className="font-medium text-gray-900 dark:text-white">
            Historique des versions
          </h4>
          <Badge color="gray" variant="light">
            {versions.length} versions
          </Badge>
        </div>
        <div className="flex gap-2">
          {selectedVersions.length === 2 && (
            <Button size="sm" variant="primary" onClick={handleCompare}>
              <Eye className="w-4 h-4 mr-1" />
              Comparer
            </Button>
          )}
        </div>
      </div>

      {/* Timeline des versions */}
      <div className="space-y-2">
        {sortedVersions.map((version, index) => {
          const isCurrent = version.version === currentVersion;
          const isSelected = selectedVersions.some(v => v.id === version.id);

          return (
            <Card
              key={version.id}
              className={`p-4 transition-all cursor-pointer hover:shadow-md ${
                isCurrent ? 'ring-2 ring-brand-500' : ''
              } ${isSelected ? 'ring-2 ring-blue-400' : ''}`}
              onClick={() => {
                if (onVersionSelect) onVersionSelect(version);
                if (!isCurrent && !isCompareMode) {
                  toggleVersionSelection(version);
                }
              }}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-sm font-medium text-gray-600 dark:text-gray-300">
                    v{version.version}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900 dark:text-white">
                        Version {version.version}
                      </span>
                      {isCurrent && (
                        <Badge color="success" variant="solid" size="xs">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Actuelle
                        </Badge>
                      )}
                      {isSelected && (
                        <Badge color="primary" variant="light" size="xs">
                          Sélectionnée
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {version.createdBy}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDateShort(version.createdAt)}
                      </span>
                    </div>
                    {version.changeNote && (
                      <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                        {version.changeNote}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex gap-1">
                  <Button size="xs" variant="ghost">
                    <Eye className="w-3 h-3" />
                  </Button>
                  <Button size="xs" variant="ghost">
                    <Download className="w-3 h-3" />
                  </Button>
                </div>
              </div>

              {/* Indicateur de sélection pour comparaison */}
              {!isCurrent && !isCompareMode && (
                <div className="mt-2 text-xs text-gray-400">
                  {selectedVersions.length === 0 && 'Cliquez pour sélectionner cette version'}
                  {selectedVersions.length === 1 && 'Cliquez pour sélectionner la deuxième version'}
                  {selectedVersions.length === 2 && 'Sélectionnez une version pour la comparer'}
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default DocumentVersion;