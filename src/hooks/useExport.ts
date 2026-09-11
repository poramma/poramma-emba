// Export PDF/Excel/impression
import { useState, useCallback } from 'react';
import { exportPDF, exportExcel, printDocument, downloadFile } from '../lib/export';

export const useExport = () => {
  const [loading, setLoading] = useState(false);

  const exportPDFHandler = useCallback(async (content: HTMLElement, filename: string) => {
    setLoading(true);
    try {
      await exportPDF(content, filename);
    } finally {
      setLoading(false);
    }
  }, []);

  const exportExcelHandler = useCallback(async (data: any[], filename: string) => {
    setLoading(true);
    try {
      await exportExcel(data, filename);
    } finally {
      setLoading(false);
    }
  }, []);

  const printHandler = useCallback((element: HTMLElement) => {
    printDocument(element);
  }, []);

  const downloadHandler = useCallback((blob: Blob, filename: string) => {
    downloadFile(blob, filename);
  }, []);

  return {
    loading,
    exportPDF: exportPDFHandler,
    exportExcel: exportExcelHandler,
    print: printHandler,
    download: downloadHandler,
  };
};
