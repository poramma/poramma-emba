// ============================================
// IMPORTS
// ============================================

// AUTH
import {
    Utilisateur,
    Agent,
    Permission,
    PermissionCode,
    RoleName,
    Role,
    UserProfile,
    UserStatus,
    UserType,
    UserRole,
    ExceptionType,
    AgentDepartment,
    AgentServiceAssignment,
    AgentAvailability,
    AgentException
} from './auth';


// PROFILE
import {
    AgentProfileData,
    ActivityLogEntry,
    AgentPreferences
} from './profile';

// RENDEZ-VOUS
import {
    AgendaSlot,
    RDVType,
    RDVStatus,
    RendezVous,
    RendezVousNote,
    DailySchedulePrint,
    PrintFormat,
    PrintStatus,
    DailyScheduleContent
} from './rendez-vous';

// SERVICES
import {
    Service,
    SubService,
    ServiceSchedule,
    ServiceException,
    ServiceExceptionType,
    Requirement,
    RequirementType
} from './services';

// DEMANDE
import {
    Demande,
    Priority,
    DemandeRequirement,
    AssignationPayload,
    TraitementPayload,
    DemandeFilters,
    DemandeComment,
    DemandeDocument,
    RequirementStatus,
    AppStatus
} from './demande';

// COMMUNICATION
import {
    Campagne,
    Message,
    Notif,
    CampagneFilters,
    CampagneStats,
    CampagneDelivery,
    CreateCampagnePayload,
    Thread,
    ThreadParticipant,
    ThreadStatus,
    NotifType,
    NotifChannel,
    NotifStatus
} from './communication';

// ETUDIANT
import {
    Etudiant,
    EtudiantProfile,
    Bourse,
    EtudiantStatus,
    DocumentType,
    DocStatus,
    EtudiantFilters,
    InueAssignment,
    EtudiantsEstimate,
} from './etudiant';

// AUDIT
import {
    AuditSeverity,
    AuditLog
} from './audit';

// DOCUMENT
import {
    DocumentGED,
    StoredFile,
    DocumentFilters,
    DocumentVersion,
    DocumentCategory,
    DocumentUploadPayload,
    DocumentValidationPayload,
    DocumentAuditLog,
    DocumentAuditAction,
    DocumentStats,
    InternalDocument,
    InternalDocumentUploadPayload,
    InternalDocumentFilters,
    ConfidentialityLevel,
    GeneratedDocument,
    GeneratedDocumentPayload,
    GeneratedDocumentType,
} from './document';

// ============================================
// EXPORTS - VALEURS (ENUMS, CONSTANTES, etc.)
// ============================================

export {
    // Auth
    PermissionCode,
    RoleName,
    UserStatus,
    UserType,
    ExceptionType,
    AgentDepartment,
    // Demande
    AppStatus,
    Priority,
    RequirementStatus,
    // Rendez-vous
    RDVType,
    RDVStatus,
    PrintFormat,
    PrintStatus,
    // Services
    ServiceExceptionType,
    RequirementType,
    // Audit
    AuditSeverity,
    // Communication
    ThreadStatus,
    NotifType,
    NotifChannel,
    NotifStatus,

    // Etudiant
    EtudiantStatus,

    //Document
    DocumentType,
    DocStatus,
    GeneratedDocumentType,
    ConfidentialityLevel,
    DocumentAuditAction,
};

// ============================================
// EXPORTS - TYPES (INTERFACES, TYPE ALIAS, etc.)
// ============================================

export type {
    // Auth
    Utilisateur,
    Agent,
    Permission,
    Role,
    UserProfile,
    UserRole,
    AgentServiceAssignment,
    AgentAvailability,
    AgentException,

    // Profile
    AgentProfileData,
    ActivityLogEntry,
    AgentPreferences,

    // Demande
    Demande,
    DemandeComment,
    DemandeDocument,
    DemandeRequirement,
    DemandeFilters,
    AssignationPayload,
    TraitementPayload,
    // Rendez-vous
    AgendaSlot,
    RendezVous,
    RendezVousNote,
    DailySchedulePrint,
    DailyScheduleContent,
    // Services
    Service,
    SubService,
    ServiceSchedule,
    ServiceException,
    Requirement,
    // Communication
    Campagne,
    Message,
    Notif,
    CampagneFilters,
    CampagneStats,
    CampagneDelivery,
    CreateCampagnePayload,
    Thread,
    ThreadParticipant,
    // Etudiant
    Etudiant,
    EtudiantProfile,
    Bourse,
    EtudiantFilters,
    InueAssignment,
    EtudiantsEstimate,
    // Audit
    AuditLog,
    // Document
    DocumentGED,
    StoredFile,
    DocumentFilters,
    DocumentVersion,
    DocumentCategory,
    DocumentUploadPayload,
    DocumentValidationPayload,
    DocumentAuditLog,
    InternalDocument,
    InternalDocumentUploadPayload,
    InternalDocumentFilters,
    GeneratedDocument,
    GeneratedDocumentPayload,
    DocumentStats,
};