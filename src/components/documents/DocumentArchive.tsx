// src/components/documents/DocumentArchive.tsx

/**
 * Composant conteneur — assemble DocumentSearch + DocumentList + ExportButton
 * pour la page /documents/archive. Gère lui-même la pagination locale et le
 * bascule recherche/liste par défaut.
 */

import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDocuments } from '../../hooks/useDocuments';
import { DocumentSearch } from './DocumentSearch';
import { DocumentList } from './DocumentList';
import { ExportButton } from './ExportButton';
import { documentTypeLabels } from '../../config/document-labels';
import { DocStatus } from '../../types';
import { formatDateShort } from '../../lib/date';

const PAGE_SIZE = 20;

export const DocumentArchive: React.FC = () => {
  const navigate = useNavigate();
  const { documents, searchResults, isLoading, error, fetchDocuments, searchDocuments, clearSearch } =
    useDocuments();

  const [page, setPage] = useState(1);
  const [isSearchActive, setIsSearchActive] = useState(false);

  useEffect(() => {
    fetchDocuments({ status: DocStatus.EXPIRED });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const displayedDocuments = isSearchActive ? searchResults : documents;

  const paginated = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return displayedDocuments.slice(start, start + PAGE_SIZE);
  }, [displayedDocuments, page]);

  const totalPages = Math.max(1, Math.ceil(displayedDocuments.length / PAGE_SIZE));

  const handleSearch = (query: string) => {
    setIsSearchActive(true);
    setPage(1);
    searchDocuments(query);
  };

  const handleClearSearch = () => {
    setIsSearchActive(false);
    setPage(1);
    clearSearch();
    fetchDocuments({ status: DocStatus.EXPIRED });
  };

  const exportData = displayedDocuments.map((doc) => ({
    Type: documentTypeLabels[doc.type] ?? doc.type,
    Propriétaire: doc.ownerUserId,
    Statut: doc.status,
    'Soumis le': formatDateShort(doc.createdAt),
    'Expiré le': doc.expiryDate ? formatDateShort(doc.expiryDate) : '',
  }));

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <DocumentSearch
          onSearch={handleSearch}
          onClear={handleClearSearch}
          isLoading={isLoading}
          placeholder="Rechercher dans les archives..."
        />
        <ExportButton data={exportData} filename="documents-archives" />
      </div>

      <DocumentList
        documents={paginated}
        isLoading={isLoading}
        emptyTitle="Aucun document archivé"
        emptyDescription={
          isSearchActive
            ? 'Aucun résultat ne correspond à cette recherche dans les archives.'
            : 'Les documents expirés ou archivés apparaîtront ici.'
        }
        onRowClick={(id) => navigate(`/documents/${id}`)}
        pagination={{ page, totalPages, onPageChange: setPage }}
      />

      {error && <p className="text-theme-sm text-error-600">{error}</p>}
    </div>
  );
};

export default DocumentArchive;