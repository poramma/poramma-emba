// src/components/documents/DocumentSearch.tsx

import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, X, File, FileText, Image, 
  Clock, CheckCircle, XCircle, AlertTriangle
} from 'lucide-react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { useDocuments } from '../../hooks/useDocuments';
import { DocumentGED } from '../../types/document';
import { DocStatus } from '../../types/etudiant';
import { formatDateShort } from '../../lib/date';

interface DocumentSearchProps {
  onResultClick?: (doc: DocumentGED) => void;
  placeholder?: string;
  scope?: 'all' | 'archive';
  className?: string;
}

const MAX_RESULTS = 10;

export const DocumentSearch: React.FC<DocumentSearchProps> = ({
  onResultClick,
  placeholder = 'Rechercher un document...',
  scope = 'all',
  className = '',
}) => {
  const { searchDocuments, searchResults, isLoading } = useDocuments();
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  // Debounce la recherche
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 400);
    return () => clearTimeout(timer);
  }, [query]);

  // Exécute la recherche
  useEffect(() => {
    if (debouncedQuery.trim().length >= 2) {
      searchDocuments(debouncedQuery);
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  }, [debouncedQuery, searchDocuments]);

  // Fermer la recherche au clic extérieur
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getFileIcon = (mimeType: string) => {
    if (mimeType?.startsWith('image/')) return <Image className="w-4 h-4 text-blue-500" />;
    if (mimeType === 'application/pdf') return <FileText className="w-4 h-4 text-red-500" />;
    return <File className="w-4 h-4 text-gray-500" />;
  };

  const getStatusColor = (status: DocStatus) => {
    switch (status) {
      case DocStatus.ACCEPTED: return 'text-green-600';
      case DocStatus.REJECTED: return 'text-red-600';
      case DocStatus.IN_REVIEW: return 'text-blue-600';
      case DocStatus.EXPIRED: return 'text-orange-600';
      default: return 'text-gray-600';
    }
  };

  const highlightMatch = (text: string, query: string) => {
    if (!query.trim()) return text;
    const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
    return parts.map((part, i) => 
      part.toLowerCase() === query.toLowerCase() 
        ? <span key={i} className="bg-yellow-200 dark:bg-yellow-800 font-medium">{part}</span>
        : part
    );
  };

  const results = searchResults.slice(0, MAX_RESULTS);

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <Input
        placeholder={placeholder}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => {
          if (query.trim().length >= 2) setIsOpen(true);
        }}
        startIcon={<Search className="w-4 h-4" />}
        endIcon={
          query ? (
            <button 
              aria-label="Effacer"
              onClick={() => {
                setQuery('');
                setIsOpen(false);
              }} 
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          ) : undefined
        }
      />

      {/* Résultats */}
      {isOpen && (
        <Card className="absolute top-full left-0 right-0 mt-1 z-50 max-h-96 overflow-y-auto shadow-lg">
          {isLoading ? (
            <div className="p-4 text-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-brand-500 mx-auto"></div>
              <p className="text-sm text-gray-500 mt-2">Recherche en cours...</p>
            </div>
          ) : results.length === 0 && query.trim().length >= 2 ? (
            <div className="p-8 text-center">
              <Search className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500">Aucun document ne correspond à votre recherche</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {results.map((doc) => (
                <div
                  key={doc.id}
                  className="p-3 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
                  onClick={() => {
                    onResultClick?.(doc);
                    setIsOpen(false);
                    setQuery('');
                  }}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-1">
                      {getFileIcon(doc.file?.mimeType || '')}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {highlightMatch(doc.file?.originalName || 'Sans nom', query)}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 mt-1 text-xs">
                        <span className="text-gray-500">{doc.type}</span>
                        <span className="text-gray-300">•</span>
                        <span className={`${getStatusColor(doc.status)}`}>
                          {doc.status}
                        </span>
                        <span className="text-gray-300">•</span>
                        <span className="text-gray-400">{formatDateShort(doc.createdAt)}</span>
                        {doc.notes && (
                          <>
                            <span className="text-gray-300">•</span>
                            <span className="text-gray-400 truncate max-w-xs">
                              {highlightMatch(doc.notes, query)}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    <Badge color="gray" variant="light" size="xs">
                      {doc.category?.name || 'Non catégorisé'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}

          {results.length > 0 && (
            <div className="p-2 border-t border-gray-200 dark:border-gray-700 text-center">
              <span className="text-xs text-gray-400">
                {results.length} résultat{results.length > 1 ? 's' : ''}
                {searchResults.length > MAX_RESULTS && ` (${searchResults.length - MAX_RESULTS} autres)`}
              </span>
            </div>
          )}
        </Card>
      )}
    </div>
  );
};

export default DocumentSearch;