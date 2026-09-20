// ============================================================
// src/hooks/useEtudiants.ts
// ============================================================

import { useEtudiantStore } from '../store/etudiantStore';

export function useEtudiants() {
  const {
    etudiants,
    selectedEtudiant,
    documents,
    auditLogs,
    isLoading,
    error,
    meta,
    filters,
    stats,
    fetchEtudiants,
    fetchEtudiantById,
    searchEtudiants,
    fetchDocuments,
    fetchAudit,
    validateEtudiant,
    rejectEtudiant,
    suspendEtudiant,
    assignInue,
    estimateEtudiants,
    setFilters,
    resetFilters,
    setSelectedEtudiant,
  } = useEtudiantStore();

  return {
    etudiants,
    selectedEtudiant,
    documents,
    auditLogs,
    isLoading,
    error,
    meta,
    filters,
    stats,
    fetchEtudiants,
    fetchEtudiantById,
    searchEtudiants,
    fetchDocuments,
    fetchAudit,
    validateEtudiant,
    rejectEtudiant,
    suspendEtudiant,
    assignInue,
    estimateEtudiants,
    setFilters,
    resetFilters,
    setSelectedEtudiant,
  };
}
