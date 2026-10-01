// src/pages/documents/StudentDocumentsPage.tsx

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  Upload, Search, ArrowLeft, X, Users
} from 'lucide-react';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { PermissionGuard } from '../../components/auth/PermissionGuard';
import { DocumentList } from '../../components/documents/DocumentList';
import { DocumentUpload } from '../../components/documents/DocumentUpload';
import DocumentQueueFilters from '../../components/documents/queue/DocumentQueueFilters';
import { StudentDocumentDossier } from '../../components/documents/students/StudentDocumentDossier';
import { useDocuments } from '../../hooks/useDocuments';
import { usePermission } from '../../hooks/usePermission';
import { useToast } from '../../hooks/useToast';
import { PermissionCode } from '../../types/auth';
import { DocStatus, DocumentFilters, DocumentType } from '../../types';
import { api } from '../../lib/api';
import { useDebouncedSearch } from '../../hooks/useDebouncedSearch';

/** Étudiant tel qu'affiché dans le sélecteur — issu de la base (GET /etudiants), jamais de données de démonstration. */
interface StudentOption {
  id: string; // = userId
  inue: string | null;
  firstName: string;
  lastName: string;
  email: string;
  university: string | null;
  status: string;
}

const STUDENT_STATUS: Record<string, { label: string; color: "success" | "warning" | "error" | "gray" }> = {
  VALIDATED: { label: "Validé", color: "success" },
  PENDING: { label: "En attente", color: "warning" },
  REJECTED: { label: "Rejeté", color: "error" },
  SUSPENDED: { label: "Suspendu", color: "gray" },
};

function toOption(e: any): StudentOption {
  return {
    id: e.id ?? e.userId,
    inue: e.inue ?? null,
    firstName: e.firstName ?? "",
    lastName: e.lastName ?? "",
    email: e.email ?? "",
    university: e.profile?.university ?? null,
    status: e.status ?? "PENDING",
  };
}

export const StudentDocumentsPage: React.FC = () => {
  const { studentId } = useParams<{ studentId?: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const {
    documents,
    documentsMeta,
    documentsPage,
    setDocumentsPage,
    fetchDocuments,
    isLoading,
    downloadDocument,
    fetchCategories,
  } = useDocuments();
  const { can } = usePermission();

  const [selectedStudent, setSelectedStudent] = useState<StudentOption | null>(null);
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [studentsError, setStudentsError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<DocumentFilters>({});
  const [showUpload, setShowUpload] = useState(false);
  const [showStudentSelector, setShowStudentSelector] = useState(false);

  const canUpload = can(PermissionCode.DOCUMENT_UPLOAD);

  // Charger les documents et catégories
  useEffect(() => {
    fetchDocuments(filters);
    fetchCategories();
  }, []);

  // Étudiants réels : liste initiale à l'ouverture du sélecteur, puis recherche en temps réel (nom, email, INUE).
  const loadStudents = async (query: string) => {
    setLoadingStudents(true);
    setStudentsError(null);
    try {
      const { data } = await api.get("/etudiants", { params: { search: query || undefined, limit: 20, sortBy: "registeredAt", sortOrder: "desc" } });
      setStudents((data.data ?? []).map(toOption));
    } catch (err) {
      setStudents([]);
      setStudentsError(err instanceof Error && err.message ? err.message : "Impossible de charger les étudiants.");
    } finally {
      setLoadingStudents(false);
    }
  };

  useDebouncedSearch(searchQuery, (q) => {
    if (showStudentSelector) loadStudents(q);
  });

  useEffect(() => {
    if (showStudentSelector) loadStudents(searchQuery.trim());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showStudentSelector]);

  // Un studentId dans l'URL : on charge cet étudiant depuis la base, puis ses documents.
  useEffect(() => {
    if (!studentId) return;
    let cancelled = false;
    api
      .get(`/etudiants/${studentId}`)
      .then(({ data }) => {
        if (cancelled) return;
        setSelectedStudent(toOption(data.data));
        fetchDocuments({ ownerUserId: studentId });
      })
      .catch(() => {
        if (!cancelled) toast({ title: "Étudiant introuvable", description: "Ce dossier n'existe plus ou vous n'y avez pas accès.", variant: "error" });
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentId]);

  const handleSelectStudent = (student: StudentOption) => {
    setSelectedStudent(student);
    setShowStudentSelector(false);
    fetchDocuments({ ownerUserId: student.id });
    navigate(`/documents/students/${student.id}`, { replace: true });
  };

  const handleBackToList = () => {
    setSelectedStudent(null);
    navigate('/documents/students', { replace: true });
    fetchDocuments(filters);
  };

  const handleDocumentClick = (doc: any) => {
    navigate(`/documents/${doc.id}`);
  };

  const handleDownload = async (doc: any) => {
    if (doc.fileId) {
      await downloadDocument(doc.fileId);
    }
  };

  const handleUploadSuccess = () => {
    setShowUpload(false);
    if (selectedStudent) {
      fetchDocuments({ ownerUserId: selectedStudent.id });
    } else {
      fetchDocuments(filters);
    }
    toast({
      title: 'Document téléversé',
      description: 'Le document a été ajouté avec succès.',
      variant: 'success',
    });
  };

  const handleFilterChange = (newFilters: DocumentFilters) => {
    setFilters(newFilters);
    fetchDocuments(newFilters);
  };

    const handleTypeChange = (type: DocumentType | undefined) => {
    handleFilterChange({ ...filters, type });
  };

  const handleStatusChange = (status: DocStatus | undefined) => {
    handleFilterChange({ ...filters, status });
  };

  const handleDateRangeChange = (dateFrom?: string, dateTo?: string) => {
    handleFilterChange({ ...filters, dateFrom, dateTo });
  };

  const handleResetFilters = () => {
    const resetFilters: DocumentFilters = {};
    setFilters(resetFilters);
    fetchDocuments(resetFilters);
  };

  // Statistiques des documents étudiants
  const getStudentStats = () => {
    const total = documents.length;
    const accepted = documents.filter(d => d.status === DocStatus.ACCEPTED).length;
    const rejected = documents.filter(d => d.status === DocStatus.REJECTED).length;
    const pending = documents.filter(d => d.status === DocStatus.IN_REVIEW || d.status === DocStatus.UPLOADED).length;
    return { total, accepted, rejected, pending };
  };

  const stats = getStudentStats();

  return (
    <PermissionGuard 
      minRoleLevel={4} 
      permission={PermissionCode.DOCUMENT_READ}
      title="Documents étudiants"
    >
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* En-tête */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              {selectedStudent ? (
                <Button variant="ghost" onClick={handleBackToList}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Retour
                </Button>
              ) : (
                <Button variant="ghost" onClick={() => navigate('/documents')}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Retour
                </Button>
              )}
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  {selectedStudent ? 'Dossier étudiant' : 'Documents étudiants'}
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  {selectedStudent
                    ? `${selectedStudent.firstName} ${selectedStudent.lastName} - ${selectedStudent.inue ?? 'INUE non attribué'}`
                    : (() => { const total = documentsMeta?.total ?? documents.length; return `${total} document${total > 1 ? 's' : ''} au total`; })()
                  }
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {!selectedStudent && (
                <Button variant="outline" onClick={() => setShowStudentSelector(!showStudentSelector)}>
                  <Users className="w-4 h-4 mr-2" />
                  Sélectionner un étudiant
                </Button>
              )}
              {/* Un document doit toujours être rattaché à un étudiant —
                  impossible de téléverser tant qu'aucun n'est sélectionné. */}
              {canUpload && selectedStudent && (
                <Button variant="primary" onClick={() => setShowUpload(!showUpload)}>
                  <Upload className="w-4 h-4 mr-2" />
                  {showUpload ? 'Masquer' : 'Téléverser'}
                </Button>
              )}
            </div>
          </div>

          {!selectedStudent && canUpload && (
            <Card className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Sélectionnez un étudiant pour pouvoir téléverser un document en son nom.
              </p>
            </Card>
          )}

          {/* Sélecteur d'étudiant */}
          {showStudentSelector && !selectedStudent && (
            <Card className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium text-gray-700 dark:text-gray-300">
                  Sélectionner un étudiant
                </h3>
                <Button variant="ghost" size="sm" onClick={() => setShowStudentSelector(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <Input
                placeholder="Rechercher par nom, INUE ou email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                startIcon={<Search className="w-4 h-4" />}
                className="mb-4"
              />
              <div className="max-h-60 overflow-y-auto space-y-2">
                {loadingStudents && <div className="text-center py-4 text-gray-500">Recherche…</div>}
                {studentsError && <div className="text-center py-4 text-red-600">{studentsError}</div>}
                {!loadingStudents &&
                  students.map((student) => {
                    const st = STUDENT_STATUS[student.status] ?? { label: student.status, color: "gray" as const };
                    return (
                      <div
                        key={student.id}
                        className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg cursor-pointer transition-colors"
                        onClick={() => handleSelectStudent(student)}
                      >
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {student.firstName} {student.lastName}
                          </p>
                          <p className="text-sm text-gray-500">{student.inue ?? "INUE non attribué"}</p>
                          <p className="text-xs text-gray-400">{[student.email, student.university].filter(Boolean).join(" · ")}</p>
                        </div>
                        <Badge color={st.color} variant="light">
                          {st.label}
                        </Badge>
                      </div>
                    );
                  })}
                {!loadingStudents && !studentsError && students.length === 0 && (
                  <div className="text-center py-4 text-gray-500">Aucun étudiant trouvé</div>
                )}
              </div>
            </Card>
          )}

          {/* Upload panel */}
          {showUpload && (
            <DocumentUpload
              ownerUserId={selectedStudent?.id || ''}
              onUploadSuccess={handleUploadSuccess}
              onUploadError={(error) => {
                toast({
                  title: 'Erreur',
                  description: error,
                  variant: 'error',
                });
              }}
              onClose={() => setShowUpload(false)}
            />
          )}

          {/* Vue dossier étudiant */}
          {selectedStudent && (
            <StudentDocumentDossier
              studentId={selectedStudent.id}
              studentName={`${selectedStudent.firstName} ${selectedStudent.lastName}`}
              studentINUE={selectedStudent.inue ?? 'INUE non attribué'}
              university={selectedStudent.university ?? ''}
              onDocumentClick={handleDocumentClick}
            />
          )}

          {/* Vue liste générale */}
          {!selectedStudent && (
            <>
              {/* Statistiques */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="p-3 text-center">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</div>
                  <div className="text-xs text-gray-500">Total documents</div>
                </Card>
                <Card className="p-3 text-center">
                  <div className="text-2xl font-bold text-green-600">{stats.accepted}</div>
                  <div className="text-xs text-gray-500">Validés</div>
                </Card>
                <Card className="p-3 text-center">
                  <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
                  <div className="text-xs text-gray-500">En attente</div>
                </Card>
                <Card className="p-3 text-center">
                  <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
                  <div className="text-xs text-gray-500">Rejetés</div>
                </Card>
              </div>

                <DocumentQueueFilters
                filters={filters}
                onTypeChange={handleTypeChange}
                onStatusChange={handleStatusChange}
                onDateRangeChange={handleDateRangeChange}
                onReset={handleResetFilters}
              />

              {/* Liste des documents */}
              <DocumentList
                documents={documents}
                isLoading={isLoading}
                onRowClick={handleDocumentClick}
                onDownload={handleDownload}
                showOwnerColumn={true}
                emptyMessage="Aucun document étudiant trouvé"
                serverPagination={{ page: documentsPage, meta: documentsMeta, onPageChange: setDocumentsPage }}
              />
            </>
          )}
        </div>
      </div>
    </PermissionGuard>
  );
};

export default StudentDocumentsPage;

