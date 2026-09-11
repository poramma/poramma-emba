// src/components/communication/RecipientEstimateBadge.tsx

import React, { useState } from 'react';
import { Users, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { Badge } from '../ui/badge';
import { Card } from '../ui/card';
import { RecipientEstimate } from '../../types/communication';

interface RecipientEstimateBadgeProps {
  estimate: RecipientEstimate | null;
  isLoading?: boolean;
  onBreakdownClick?: () => void;
}

export const RecipientEstimateBadge: React.FC<RecipientEstimateBadgeProps> = ({
  estimate,
  isLoading = false,
  onBreakdownClick,
}) => {
  const [showBreakdown, setShowBreakdown] = useState(false);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 animate-pulse">
        <div className="w-5 h-5 bg-gray-200 dark:bg-gray-700 rounded"></div>
        <div className="h-5 w-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
      </div>
    );
  }

  if (!estimate) {
    return (
      <Badge color="gray" variant="light" startIcon={<Users className="w-3 h-3" />}>
        Estimation...
      </Badge>
    );
  }

  if (estimate.estimatedCount === 0) {
    return (
      <Badge color="warning" variant="light" startIcon={<AlertCircle className="w-3 h-3" />}>
        Aucun destinataire ne correspond à ces critères
      </Badge>
    );
  }

  return (
    <div className="relative">
      <div 
        className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
        onClick={() => {
          setShowBreakdown(!showBreakdown);
          if (onBreakdownClick) onBreakdownClick();
        }}
      >
        <Badge color="primary" variant="light" startIcon={<Users className="w-3 h-3" />}>
          ≈ {estimate.estimatedCount} destinataire{estimate.estimatedCount > 1 ? 's' : ''}
        </Badge>
        <button className="text-gray-400 hover:text-gray-600">
          {showBreakdown ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {showBreakdown && estimate.breakdown && (
        <Card className="absolute top-full left-0 mt-2 z-10 p-3 min-w-[200px] shadow-lg">
          <p className="text-xs font-medium text-gray-500 uppercase mb-2">Répartition</p>
          {estimate.breakdown.byCity && Object.entries(estimate.breakdown.byCity).length > 0 && (
            <div className="space-y-1">
              {Object.entries(estimate.breakdown.byCity).map(([city, count]) => (
                <div key={city} className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-300">{city}</span>
                  <span className="font-medium text-gray-900 dark:text-white">{count}</span>
                </div>
              ))}
            </div>
          )}
          {estimate.breakdown.byStatus && Object.entries(estimate.breakdown.byStatus).length > 0 && (
            <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
              {Object.entries(estimate.breakdown.byStatus).map(([status, count]) => (
                <div key={status} className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-300">{status}</span>
                  <span className="font-medium text-gray-900 dark:text-white">{count}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}
    </div>
  );
};

export default RecipientEstimateBadge;