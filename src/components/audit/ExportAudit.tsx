// src/components/audit/ExportAudit.tsx

import React, { useState, useRef, useEffect } from 'react';
import { Download, FileText, FileJson } from 'lucide-react';
import { Button } from '../ui/button';

interface ExportAuditProps {
  onExportCSV: () => Promise<void>;
  onExportJSON: () => Promise<void>;
  disabled?: boolean;
}

export const ExportAudit: React.FC<ExportAuditProps> = ({ onExportCSV, onExportJSON, disabled }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleExport = async (fn: () => Promise<void>) => {
    setIsExporting(true);
    setIsOpen(false);
    try {
      await fn();
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="relative" ref={ref}>
      <Button variant="outline" size="sm" onClick={() => setIsOpen(!isOpen)} disabled={disabled || isExporting}>
        <Download className="w-4 h-4 mr-1" />
        {isExporting ? 'Export en cours...' : 'Exporter'}
      </Button>

      {isOpen && (
        <div className="absolute right-0 mt-1 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
          <button
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
            onClick={() => handleExport(onExportCSV)}
          >
            <FileText className="w-4 h-4" />
            Export CSV
          </button>
          <button
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
            onClick={() => handleExport(onExportJSON)}
          >
            <FileJson className="w-4 h-4" />
            Export JSON
          </button>
        </div>
      )}
    </div>
  );
};

export default ExportAudit;
