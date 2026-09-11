// src/components/documents/students/DocumentCompletionBar.tsx

import React, { useMemo } from 'react';
import { 
  CheckCircle, XCircle, Clock, AlertCircle,
  FileText, ChevronDown, ChevronUp
} from 'lucide-react';
import { Card } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { DocumentGED, Requirement } from '../../../types';
import { DocStatus } from '../../../types/etudiant';

interface DocumentCompletionBarProps {
  requirements: Requirement[];
  documents: DocumentGED[];
}

export const DocumentCompletionBar: React.FC<DocumentCompletionBarProps> = ({
  requirements,
  documents,
}) => {
  const [expanded, setExpanded] = React.useState(false);

  const stats = useMemo(() => {
    const total = requirements.length;
    let provided = 0;
    let accepted = 0;
    let rejected = 0;
    let pending = 0;

    requirements.forEach(req => {
      const doc = documents.find(d => 
        d.type === req.type || d.category?.name === req.label
      );
      
      if (doc) {
        provided++;
        if (doc.status === DocStatus.ACCEPTED) {
          accepted++;
        } else if (doc.status === DocStatus.REJECTED) {
          rejected++;
        } else {
          pending++;
        }
      }
    });

    const completionRate = total > 0 ? Math.round((accepted / total) * 100) : 0;
    
    let status: 'success' | 'warning' | 'error' = 'error';
    if (completionRate >= 80) status = 'success';
    else if (completionRate >= 40) status = 'warning';

    return {
      total,
      provided,
      accepted,
      rejected,
      pending,
      missing: total - provided,
      completionRate,
      status,
    };
  }, [requirements, documents]);

  const getStatusColor = () => {
    switch (stats.status) {
      case 'success': return 'bg-green-500';
      case 'warning': return 'bg-orange-500';
      default: return 'bg-red-500';
    }
  };

  if (stats.total === 0) {
    return null;
  }

  return (
    <Card className="p-4">
      <div 
        className="flex flex-wrap items-center justify-between gap-3 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-gray-400" />
            <span className="font-medium text-gray-700 dark:text-gray-300">
              Documents requis
            </span>
            <Badge color="gray" variant="light">
              {stats.accepted}/{stats.total}
            </Badge>
          </div>

          <div className="flex items-center gap-2">
            {stats.missing > 0 && (
              <Badge color="error" variant="light" size="xs">
                <AlertCircle className="w-3 h-3 mr-1" />
                {stats.missing} manquant{stats.missing > 1 ? 's' : ''}
              </Badge>
            )}
            {stats.rejected > 0 && (
              <Badge color="error" variant="light" size="xs">
                <XCircle className="w-3 h-3 mr-1" />
                {stats.rejected} rejeté{stats.rejected > 1 ? 's' : ''}
              </Badge>
            )}
            {stats.pending > 0 && (
              <Badge color="warning" variant="light" size="xs">
                <Clock className="w-3 h-3 mr-1" />
                {stats.pending} en cours
              </Badge>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
              {stats.completionRate}%
            </span>
            <div className="w-32 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all ${getStatusColor()}`}
                style={{ width: `${stats.completionRate}%` }}
              />
            </div>
          </div>
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </div>

      {expanded && (
        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 space-y-2">
          {requirements.map((req, index) => {
            const doc = documents.find(d => 
              d.type === req.type || d.category?.name === req.label
            );
            const status = doc?.status;
            const isProvided = !!doc;

            return (
              <div key={index} className="flex items-center justify-between p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600 dark:text-gray-300">
                    {req.label}
                  </span>
                  {req.required && (
                    <Badge color="gray" variant="light" size="xs">
                      Obligatoire
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {isProvided ? (
                    status === DocStatus.ACCEPTED ? (
                      <Badge color="success" variant="light" size="xs">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Fourni
                      </Badge>
                    ) : status === DocStatus.REJECTED ? (
                      <Badge color="error" variant="light" size="xs">
                        <XCircle className="w-3 h-3 mr-1" />
                        Rejeté
                      </Badge>
                    ) : (
                      <Badge color="warning" variant="light" size="xs">
                        <Clock className="w-3 h-3 mr-1" />
                        En cours
                      </Badge>
                    )
                  ) : (
                    <Badge color="gray" variant="light" size="xs">
                      <AlertCircle className="w-3 h-3 mr-1" />
                      Manquant
                    </Badge>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
};

export default DocumentCompletionBar;