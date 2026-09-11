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

// Données mockées pour les étudiants
const MOCK_STUDENTS = [
  {
    id: 'usr-stu-001',
    inue: 'ML-STU-000237',
    firstName: 'Moussa',
    lastName: 'DIARRA',
    email: 'moussa.diarra@etudiant.ma',
    phone: '+212 6 12 34 56 78',
    university: 'Université Mohammed V de Rabat',
    faculty: 'Sciences économiques',
    studyLevel: 'Master 2',
    status: 'VERIFIED',
  },
  {
    id: 'usr-stu-002',
    inue: 'ML-STU-000456',
    firstName: 'Fatoumata',
    lastName: 'TOURÉ',
    email: 'fatoumata.toure@etudiant.ma',
    phone: '+212 6 98 76 54 32',
    university: 'Université Hassan II de Casablanca',
    faculty: 'Droit',
    studyLevel: 'Licence 3',
    status: 'VERIFIED',
  },
  {
    id: 'usr-stu-003',
    inue: 'ML-STU-000789',
    firstName: 'Amadou',
    lastName: 'KONÉ',
    email: 'amadou.kone@etudiant.ma',
    phone: '+212 6 55 44 33 22',
    university: 'Université Cadi Ayyad de Marrakech',
    faculty: 'Médecine',
    studyLevel: 'Doctorat',
    status: 'PENDING',
  },
  {
    id: 'usr-stu-004',
    inue: 'ML-STU-000321',
    firstName: 'Aïssata',
    lastName: 'KEITA',
    email: 'aissata.keita@etudiant.ma',
    phone: '+212 6 77 88 99 00',
    university: 'Université Ibn Tofail de Kénitra',
    faculty: 'Sciences',
    studyLevel: 'Licence 1',
    status: 'VERIFIED',
  },
];

type TabType = 'list' | 'dossier' | 'upload';

export const StudentDocumentsPage: React.FC = () => {
  const { studentId } = useParams<{ studentId?: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { 
    documents, 
    fetchDocuments, 
    isLoading,
    downloadDocument,
    fetchCategories,
  } = useDocuments();
  const { can } = usePermission();

  const [activeTab, setActiveTab] = useState<TabType>(studentId ? 'dossier' : 'list');
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
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

  // Si un studentId est passé dans l'URL, charger ses documents
  useEffect(() => {
    if (studentId) {
      const student = MOCK_STUDENTS.find(s => s.id === studentId);
      if (student) {
        setSelectedStudent(student);
        setActiveTab('dossier');
        fetchDocuments({ ownerUserId: studentId });
      }
    }
  }, [studentId]);

  const filteredStudents = MOCK_STUDENTS.filter(student => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    const fullName = `${student.firstName} ${student.lastName}`.toLowerCase();
    return fullName.includes(query) || 
           student.inue.toLowerCase().includes(query) ||
           student.email.toLowerCase().includes(query);
  });

  const handleSelectStudent = (student: any) => {
    setSelectedStudent(student);
    setActiveTab('dossier');
    setShowStudentSelector(false);
    fetchDocuments({ ownerUserId: student.id });
    navigate(`/documents/students/${student.id}`, { replace: true });
  };

  const handleBackToList = () => {
    setSelectedStudent(null);
    setActiveTab('list');
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

  // Documents de l'étudiant sélectionné
  const studentDocs = selectedStudent 
    ? documents.filter(d => d.ownerUserId === selectedStudent.id)
    : documents;

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
                    ? `${selectedStudent.firstName} ${selectedStudent.lastName} - ${selectedStudent.inue}`
                    : `${documents.length} document${documents.length > 1 ? 's' : ''} au total`
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
              {canUpload && (
                <Button variant="primary" onClick={() => setShowUpload(!showUpload)}>
                  <Upload className="w-4 h-4 mr-2" />
                  {showUpload ? 'Masquer' : 'Téléverser'}
                </Button>
              )}
            </div>
          </div>

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
                {filteredStudents.map((student) => (
                  <div
                    key={student.id}
                    className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg cursor-pointer transition-colors"
                    onClick={() => handleSelectStudent(student)}
                  >
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {student.firstName} {student.lastName}
                      </p>
                      <p className="text-sm text-gray-500">{student.inue}</p>
                      <p className="text-xs text-gray-400">{student.university}</p>
                    </div>
                    <Badge color={student.status === 'VERIFIED' ? 'success' : 'warning'} variant="light">
                      {student.status}
                    </Badge>
                  </div>
                ))}
                {filteredStudents.length === 0 && (
                  <div className="text-center py-4 text-gray-500">
                    Aucun étudiant trouvé
                  </div>
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
              studentINUE={selectedStudent.inue}
              university={selectedStudent.university}
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
              />
            </>
          )}
        </div>
      </div>
    </PermissionGuard>
  );
};

export default StudentDocumentsPage;

