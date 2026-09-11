// src/components/documents/ExportButton.tsx

/**
 * Bouton d'export CSV/PDF réutilisé sur Archives et le Journal d'audit.
 * S'appuie sur lib/export.ts déjà prévu dans votre architecture — je
 * suppose les signatures exportToCsv(data, filename) / exportToPdf(data, filename).
 */

import React, { useState } from 'react';
import { Download, FileSpreadsheet, FileText, ChevronDown } from 'lucide-react';
import { Button } from '../ui/button';
import { exportToCSV, exportToPdf } from '../../lib/export';

interface ExportButtonProps {
  data: Record<string, unknown>[];
  filename: string;
  disabled?: boolean;
  formats?: Array<'csv' | 'pdf'>;
}

export const ExportButton: React.FC<ExportButtonProps> = ({
  data,
  filename,
  disabled = false,
  formats = ['csv', 'pdf'],
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleExport = (format: 'csv' | 'pdf') => {
    if (format === 'csv') {
      exportToCSV(data, filename);
    } else {
      exportToPdf(data, filename);
    }
    setIsOpen(false);
  };

  if (formats.length === 1) {
    const format = formats[0];
    return (
      <Button
        variant="outline"
        disabled={disabled || data.length === 0}
        onClick={() => handleExport(format)}
        startIcon={<Download className="w-4 h-4" />}
      >
        Exporter en {format.toUpperCase()}
      </Button>
    );
  }

  return (
    <div className="relative">
      <Button
        variant="outline"
        disabled={disabled || data.length === 0}
        onClick={() => setIsOpen((v) => !v)}
        startIcon={<Download className="w-4 h-4" />}
        endIcon={<ChevronDown className="w-4 h-4" />}
      >
        Exporter
      </Button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-2 w-44 bg-white dark:bg-gray-900 rounded-lg shadow-theme-lg border border-gray-100 dark:border-gray-800 z-20 py-1">
            {formats.includes('csv') && (
              <button
                type="button"
                onClick={() => handleExport('csv')}
                className="w-full flex items-center gap-2 px-3 py-2 text-theme-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                <FileSpreadsheet className="w-4 h-4" /> CSV
              </button>
            )}
            {formats.includes('pdf') && (
              <button
                type="button"
                onClick={() => handleExport('pdf')}
                className="w-full flex items-center gap-2 px-3 py-2 text-theme-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                <FileText className="w-4 h-4" /> PDF
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default ExportButton;