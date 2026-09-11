#!/bin/bash

# Script de création de structure pour frontend-embassy (Version sécurisée)
# Auteur: Assistant IA
# Date: $(date +%Y-%m-%d)

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fonction pour afficher les messages
print_message() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCÈS]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERREUR]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[ATTENTION]${NC} $1"
}

print_skip() {
    echo -e "${YELLOW}[IGNORÉ]${NC} $1 - Fichier existant, préservé"
}

# Fonction pour créer un fichier UNIQUEMENT s'il n'existe pas
create_file_safe() {
    local file_path="$1"
    local content="${2:-}"
    
    if [ -f "$file_path" ]; then
        print_skip "$file_path"
        return 0
    fi
    
    mkdir -p "$(dirname "$file_path")"
    
    if [ -n "$content" ]; then
        echo -e "$content" > "$file_path"
    else
        touch "$file_path"
    fi
    
    print_success "Fichier créé : $file_path"
    return 0
}

# Fonction pour créer un dossier UNIQUEMENT s'il n'existe pas
create_directory_safe() {
    local dir_path="$1"
    
    if [ -d "$dir_path" ]; then
        print_skip "Dossier $dir_path"
        return 0
    fi
    
    mkdir -p "$dir_path"
    print_success "Dossier créé : $dir_path"
    return 0
}

# Définition du chemin du projet
PROJECT_PATH="B:/Poramma/frontend-embassy"

# Vérification si le chemin existe
if [ ! -d "$PROJECT_PATH" ]; then
    print_warning "Le chemin $PROJECT_PATH n'existe pas"
    print_message "Création du dossier principal..."
    mkdir -p "$PROJECT_PATH"
fi

cd "$PROJECT_PATH" || exit 1

print_message "Début de la création sécurisée de la structure pour $PROJECT_PATH"
print_message "⚠️  Les fichiers existants seront préservés"

# ========================
# PUBLIC DIRECTORY
# ========================
print_message "Création de la structure public/..."

# Dossiers public
create_directory_safe "public"
create_directory_safe "public/images"
create_directory_safe "public/images/logo"
create_directory_safe "public/images/error"
create_directory_safe "public/images/user"
create_directory_safe "public/images/other"
create_directory_safe "public/images/shape"

# Fichiers dans public (seulement s'ils n'existent pas)
create_file_safe "public/favicon.png"

# ========================
# SRC DIRECTORY - Racine
# ========================
print_message "Création de la structure src/..."

# Fichiers racine
create_file_safe "src/App.tsx" "import React from 'react';\nimport { BrowserRouter } from 'react-router-dom';\nimport { AppLayout } from './components/layout/AppLayout';\nimport { AppRoutes } from './routes';\n\nexport const App: React.FC = () => {\n  return (\n    <BrowserRouter>\n      <AppLayout>\n        <AppRoutes />\n      </AppLayout>\n    </BrowserRouter>\n  );\n};"

create_file_safe "src/main.tsx" "import React from 'react';\nimport ReactDOM from 'react-dom/client';\nimport { App } from './App';\nimport './index.css';\n\nReactDOM.createRoot(document.getElementById('root')!).render(\n  <React.StrictMode>\n    <App />\n  </React.StrictMode>\n);"

create_file_safe "src/index.css" "/* Global CSS + Tailwind + variables Mali */\n@tailwind base;\n@tailwind components;\n@tailwind utilities;\n\n/* Variables personnalisées */\n:root {\n  --primary-color: #00a651;\n  --secondary-color: #ffce00;\n  --text-primary: #1a1a1a;\n  --text-secondary: #4a4a4a;\n}"

create_file_safe "src/vite-env.d.ts" "/// <reference types=\"vite/client\" />"

create_file_safe "src/svg.d.ts" "declare module '*.svg' {\n  import React = require('react');\n  export const ReactComponent: React.FC<React.SVGProps<SVGSVGElement>>;\n  const src: string;\n  export default src;\n}"

# ========================
# SRC/TYPES
# ========================
print_message "Création de la structure src/types/..."

types_dir="src/types"
create_directory_safe "$types_dir"
create_file_safe "$types_dir/auth.ts" "// User, Role, Permission, Session\nexport interface User {\n  id: string;\n  email: string;\n  firstName: string;\n  lastName: string;\n  role: Role;\n  permissions: Permission[];\n}\n\nexport type Role = 'SUPER_ADMIN' | 'ADMIN' | 'AGENT' | 'GARDIEN' | 'ETUDIANT';\n\nexport type Permission = string;\n\nexport interface Session {\n  user: User;\n  token: string;\n  expiresAt: Date;\n}"
create_file_safe "$types_dir/demande.ts" "// Demande, StatutDemande, TypeDemande\nexport interface Demande {\n  id: string;\n  type: TypeDemande;\n  statut: StatutDemande;\n  dateCreation: Date;\n  dateModification: Date;\n  etudiantId: string;\n  documents: string[];\n  historique: HistoriqueEtape[];\n}\n\nexport type TypeDemande = 'PASSEPORT' | 'VISA' | 'CERTIFICAT' | 'ACTE' | 'AUTRE';\n\nexport type StatutDemande = 'EN_ATTENTE' | 'EN_TRAITEMENT' | 'VALIDEE' | 'REJETEE' | 'ESCALADEE';\n\nexport interface HistoriqueEtape {\n  id: string;\n  date: Date;\n  action: string;\n  utilisateur: string;\n  commentaire?: string;\n}"
create_file_safe "$types_dir/rendez-vous.ts" "// RendezVous, Creneau, Service, Urgence\nexport interface RendezVous {\n  id: string;\n  date: Date;\n  heure: string;\n  service: Service;\n  etudiantId: string;\n  agentId: string;\n  statut: 'PLANIFIE' | 'CONFIRME' | 'ANNULE' | 'REPORTE' | 'TERMINE';\n  urgence: boolean;\n  motif?: string;\n}\n\nexport interface Creneau {\n  id: string;\n  date: Date;\n  heureDebut: string;\n  heureFin: string;\n  serviceId: string;\n  agentId: string;\n  disponible: boolean;\n}\n\nexport interface Service {\n  id: string;\n  nom: string;\n  description: string;\n  duree: number;\n}\n\nexport type Urgence = 'NORMALE' | 'URGENTE' | 'TRES_URGENTE';"
create_file_safe "$types_dir/etudiant.ts" "// Etudiant, INUE, Document\nexport interface Etudiant {\n  id: string;\n  nom: string;\n  prenom: string;\n  email: string;\n  telephone: string;\n  inue: INUE;\n  documents: DocumentEtudiant[];\n  statut: 'ACTIF' | 'INACTIF' | 'EN_ATTENTE';\n}\n\nexport interface INUE {\n  numero: string;\n  qrCode: string;\n  dateEmission: Date;\n  dateExpiration: Date;\n  actif: boolean;\n}\n\nexport interface DocumentEtudiant {\n  id: string;\n  type: string;\n  nom: string;\n  url: string;\n  dateUpload: Date;\n  valide: boolean;\n}"
create_file_safe "$types_dir/document.ts" "// DocumentGED, Version, CategorieDoc\nexport interface DocumentGED {\n  id: string;\n  nom: string;\n  type: string;\n  categorie: CategorieDoc;\n  version: Version;\n  dateCreation: Date;\n  dateModification: Date;\n  auteur: string;\n  taille: number;\n  archive: boolean;\n}\n\nexport interface Version {\n  numero: number;\n  date: Date;\n  modifications: string;\n  auteur: string;\n}\n\nexport type CategorieDoc = 'ADMINISTRATIF' | 'JURIDIQUE' | 'FINANCIER' | 'PERSONNEL' | 'AUTRE';"
create_file_safe "$types_dir/communication.ts" "// Campagne, Message, Notification\nexport interface Campagne {\n  id: string;\n  titre: string;\n  message: Message;\n  type: 'EMAIL' | 'SMS' | 'PUSH';\n  cibles: string[];\n  dateEnvoi: Date;\n  stats?: StatistiquesCampagne;\n}\n\nexport interface Message {\n  sujet: string;\n  contenu: string;\n  piecesJointes?: string[];\n}\n\nexport interface Notification {\n  id: string;\n  titre: string;\n  message: string;\n  date: Date;\n  lu: boolean;\n  utilisateurId: string;\n}\n\nexport interface StatistiquesCampagne {\n  envoyes: number;\n  ouverts: number;\n  cliques: number;\n}"
create_file_safe "$types_dir/audit.ts" "// LogAction, TypeAction, NiveauRisque\nexport interface LogAction {\n  id: string;\n  action: TypeAction;\n  utilisateurId: string;\n  date: Date;\n  details: string;\n  ip: string;\n  niveauRisque: NiveauRisque;\n}\n\nexport type TypeAction = \n  | 'CONNEXION' | 'DECONNEXION' | 'CREATION' | 'MODIFICATION' \n  | 'SUPPRESSION' | 'VISUALISATION' | 'EXPORT' | 'IMPORT';\n\nexport type NiveauRisque = 'BAS' | 'MOYEN' | 'ELEVE' | 'CRITIQUE';"
create_file_safe "$types_dir/api.ts" "// Réponses API génériques\nexport interface ApiResponse<T = any> {\n  success: boolean;\n  data: T;\n  message?: string;\n  errors?: string[];\n}\n\nexport interface PaginatedResponse<T> extends ApiResponse<T[]> {\n  pagination: {\n    page: number;\n    limit: number;\n    total: number;\n    pages: number;\n  };\n}"

# ========================
# SRC/CONFIG
# ========================
print_message "Création de la structure src/config/..."

config_dir="src/config"
create_directory_safe "$config_dir"
create_file_safe "$config_dir/roles.ts" "// Définition des rôles RBAC\nexport const ROLES = {\n  SUPER_ADMIN: 'SUPER_ADMIN',\n  ADMIN: 'ADMIN',\n  AGENT: 'AGENT',\n  GARDIEN: 'GARDIEN',\n  ETUDIANT: 'ETUDIANT',\n} as const;\n\nexport type RoleType = typeof ROLES[keyof typeof ROLES];\n\nexport const ROLE_LABELS: Record<RoleType, string> = {\n  [ROLES.SUPER_ADMIN]: 'Super Administrateur',\n  [ROLES.ADMIN]: 'Administrateur',\n  [ROLES.AGENT]: 'Agent Consulaire',\n  [ROLES.GARDIEN]: 'Gardien',\n  [ROLES.ETUDIANT]: 'Étudiant',\n};"
create_file_safe "$config_dir/permissions.ts" "// Matrice des permissions\nexport const PERMISSIONS = {\n  // Demandes\n  DEMANDE_CREER: 'demande:creer',\n  DEMANDE_LIRE: 'demande:lire',\n  DEMANDE_MODIFIER: 'demande:modifier',\n  DEMANDE_SUPPRIMER: 'demande:supprimer',\n  DEMANDE_VALIDER: 'demande:valider',\n  DEMANDE_REJETER: 'demande:rejeter',\n  DEMANDE_ESCALADER: 'demande:escalader',\n  \n  // Rendez-vous\n  RDV_CREER: 'rdv:creer',\n  RDV_LIRE: 'rdv:lire',\n  RDV_MODIFIER: 'rdv:modifier',\n  RDV_SUPPRIMER: 'rdv:supprimer',\n  RDV_CONFIRMER: 'rdv:confirmer',\n  \n  // Étudiants\n  ETUDIANT_CREER: 'etudiant:creer',\n  ETUDIANT_LIRE: 'etudiant:lire',\n  ETUDIANT_MODIFIER: 'etudiant:modifier',\n  ETUDIANT_VALIDER: 'etudiant:valider',\n  \n  // Documents\n  DOCUMENT_UPLOAD: 'document:upload',\n  DOCUMENT_LIRE: 'document:lire',\n  DOCUMENT_MODIFIER: 'document:modifier',\n  DOCUMENT_SUPPRIMER: 'document:supprimer',\n  DOCUMENT_ARCHIVER: 'document:archiver',\n  \n  // Utilisateurs\n  UTILISATEUR_CREER: 'utilisateur:creer',\n  UTILISATEUR_LIRE: 'utilisateur:lire',\n  UTILISATEUR_MODIFIER: 'utilisateur:modifier',\n  UTILISATEUR_SUPPRIMER: 'utilisateur:supprimer',\n  UTILISATEUR_ROLE: 'utilisateur:role',\n  \n  // Audit\n  AUDIT_LIRE: 'audit:lire',\n  AUDIT_EXPORTER: 'audit:exporter',\n} as const;\n\nexport type PermissionType = typeof PERMISSIONS[keyof typeof PERMISSIONS];"
create_file_safe "$config_dir/services-consulaires.ts" "// Types de services, horaires, jours ouvrés\nexport const SERVICES_CONSULAIRES = [\n  { id: '1', nom: 'Passeport', description: 'Émission et renouvellement de passeport' },\n  { id: '2', nom: 'Visa', description: 'Demande de visa pour le Mali' },\n  { id: '3', nom: 'Certificat de nationalité', description: 'Certificat de nationalité malienne' },\n  { id: '4', nom: 'Acte d\'état civil', description: 'Actes de naissance, mariage, décès' },\n  { id: '5', nom: 'Légalisation', description: 'Légalisation de documents' },\n];\n\nexport const JOURS_OUVRES = ['LUNDI', 'MARDI', 'MERCREDI', 'JEUDI', 'VENDREDI'];\n\nexport const HORAIRES_DEFAUT = {\n  debut: '08:00',\n  fin: '17:00',\n  pause: {\n    debut: '12:00',\n    fin: '13:00',\n  },\n};\n\nexport const JOURS_FERIES = [\n  '01-01', // Nouvel An\n  '20-01', // Journée de l'Armée\n  '26-03', // Journée des Martyrs\n  '01-05', // Fête du Travail\n  '25-05', // Journée de l'Afrique\n  '22-09', // Indépendance du Mali\n];"
create_file_safe "$config_dir/navigation.ts" "// Items de sidebar par rôle\nimport { RoleType } from './roles';\n\nexport interface NavItem {\n  label: string;\n  icon: string;\n  path: string;\n  roles: RoleType[];\n  children?: NavItem[];\n}\n\nexport const NAVIGATION_ITEMS: NavItem[] = [\n  {\n    label: 'Tableau de bord',\n    icon: 'dashboard',\n    path: '/dashboard',\n    roles: ['SUPER_ADMIN', 'ADMIN', 'AGENT', 'GARDIEN'],\n  },\n  {\n    label: 'Demandes',\n    icon: 'file-text',\n    path: '/demandes',\n    roles: ['SUPER_ADMIN', 'ADMIN', 'AGENT'],\n  },\n  {\n    label: 'Rendez-vous',\n    icon: 'calendar',\n    path: '/rendez-vous',\n    roles: ['SUPER_ADMIN', 'ADMIN', 'AGENT', 'GARDIEN'],\n  },\n  {\n    label: 'Étudiants',\n    icon: 'users',\n    path: '/etudiants',\n    roles: ['SUPER_ADMIN', 'ADMIN', 'AGENT'],\n  },\n  {\n    label: 'Documents',\n    icon: 'folder',\n    path: '/documents',\n    roles: ['SUPER_ADMIN', 'ADMIN', 'AGENT'],\n  },\n  {\n    label: 'Communication',\n    icon: 'mail',\n    path: '/communication',\n    roles: ['SUPER_ADMIN', 'ADMIN'],\n  },\n  {\n    label: 'Audit',\n    icon: 'clipboard',\n    path: '/audit',\n    roles: ['SUPER_ADMIN', 'ADMIN'],\n  },\n  {\n    label: 'Services',\n    icon: 'briefcase',\n    path: '/services',\n    roles: ['SUPER_ADMIN', 'ADMIN'],\n  },\n  {\n    label: 'Utilisateurs',\n    icon: 'user-cog',\n    path: '/utilisateurs',\n    roles: ['SUPER_ADMIN', 'ADMIN'],\n  },\n  {\n    label: 'Statistiques',\n    icon: 'bar-chart',\n    path: '/stats',\n    roles: ['SUPER_ADMIN', 'ADMIN'],\n  },\n];"

# ========================
# SRC/LIB
# ========================
print_message "Création de la structure src/lib/..."

lib_dir="src/lib"
create_directory_safe "$lib_dir"
create_file_safe "$lib_dir/api.ts" "// Instance Axios + intercepteurs\nimport axios from 'axios';\n\nconst api = axios.create({\n  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',\n  timeout: 10000,\n});\n\n// Intercepteur pour le token\napi.interceptors.request.use((config) => {\n  const token = localStorage.getItem('token');\n  if (token) {\n    config.headers.Authorization = `Bearer ${token}`;\n  }\n  return config;\n});\n\n// Intercepteur pour les erreurs\napi.interceptors.response.use(\n  (response) => response,\n  (error) => {\n    if (error.response?.status === 401) {\n      // Redirection vers la page de login\n      window.location.href = '/login';\n    }\n    return Promise.reject(error);\n  }\n);\n\nexport default api;"
create_file_safe "$lib_dir/auth.ts" "// Fonctions auth (login, logout, refresh)\nimport api from './api';\n\nexport const login = async (email: string, password: string) => {\n  const response = await api.post('/auth/login', { email, password });\n  if (response.data.success) {\n    localStorage.setItem('token', response.data.data.token);\n    localStorage.setItem('user', JSON.stringify(response.data.data.user));\n  }\n  return response.data;\n};\n\nexport const logout = () => {\n  localStorage.removeItem('token');\n  localStorage.removeItem('user');\n  window.location.href = '/login';\n};\n\nexport const refreshToken = async () => {\n  const response = await api.post('/auth/refresh');\n  if (response.data.success) {\n    localStorage.setItem('token', response.data.data.token);\n  }\n  return response.data;\n};\n\nexport const getCurrentUser = () => {\n  const user = localStorage.getItem('user');\n  return user ? JSON.parse(user) : null;\n};"
create_file_safe "$lib_dir/rbac.ts" "// Fonctions de vérification des permissions\nimport { PermissionType } from '../config/permissions';\nimport { RoleType } from '../config/roles';\n\n// Matrice des permissions par rôle\nconst PERMISSION_MATRIX: Record<RoleType, PermissionType[]> = {\n  SUPER_ADMIN: ['*'],\n  ADMIN: ['demande:*', 'rdv:*', 'etudiant:*', 'document:*', 'utilisateur:*', 'audit:lire', 'audit:exporter'],\n  AGENT: ['demande:creer', 'demande:lire', 'demande:modifier', 'rdv:creer', 'rdv:lire', 'rdv:modifier', 'etudiant:lire', 'etudiant:modifier', 'document:upload', 'document:lire'],\n  GARDIEN: ['rdv:lire'],\n  ETUDIANT: ['demande:creer', 'rdv:creer', 'rdv:lire', 'document:lire', 'document:upload'],\n};\n\nexport const hasPermission = (userRole: RoleType, permission: PermissionType): boolean => {\n  const permissions = PERMISSION_MATRIX[userRole] || [];\n  if (permissions.includes('*')) return true;\n  return permissions.some(p => \n    p === permission || \n    (p.endsWith(':*') && permission.startsWith(p.replace(':*', ':')))\n  );\n};\n\nexport const hasAnyPermission = (userRole: RoleType, permissions: PermissionType[]): boolean => {\n  return permissions.some(p => hasPermission(userRole, p));\n};\n\nexport const hasAllPermissions = (userRole: RoleType, permissions: PermissionType[]): boolean => {\n  return permissions.every(p => hasPermission(userRole, p));\n};"
create_file_safe "$lib_dir/date.ts" "// Formatage dates, calculs jours fériés\nimport { format, parseISO, differenceInDays, isWeekend, isBefore, isAfter } from 'date-fns';\nimport { fr } from 'date-fns/locale';\n\nexport const formatDate = (date: string | Date, pattern: string = 'dd/MM/yyyy'): string => {\n  const d = typeof date === 'string' ? parseISO(date) : date;\n  return format(d, pattern, { locale: fr });\n};\n\nexport const formatDateTime = (date: string | Date): string => {\n  return formatDate(date, 'dd/MM/yyyy HH:mm');\n};\n\nexport const daysBetween = (start: Date, end: Date): number => {\n  return differenceInDays(end, start);\n};\n\nexport const isWorkingDay = (date: Date): boolean => {\n  if (isWeekend(date)) return false;\n  // Vérifier les jours fériés\n  const day = format(date, 'dd-MM');\n  const holidays = ['01-01', '20-01', '26-03', '01-05', '25-05', '22-09'];\n  return !holidays.includes(day);\n};\n\nexport const isDateValid = (date: Date): boolean => {\n  return !isNaN(date.getTime());\n};\n\nexport const getAge = (birthDate: Date): number => {\n  const today = new Date();\n  let age = today.getFullYear() - birthDate.getFullYear();\n  const m = today.getMonth() - birthDate.getMonth();\n  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {\n    age--;\n  }\n  return age;\n};"
create_file_safe "$lib_dir/export.ts" "// Export PDF, Excel, impression\nexport const exportPDF = async (content: HTMLElement, filename: string) => {\n  // Implémentation avec html2pdf.js\n  console.log('Export PDF:', filename);\n};\n\nexport const exportExcel = async (data: any[], filename: string) => {\n  // Implémentation avec xlsx\n  console.log('Export Excel:', filename);\n};\n\nexport const printDocument = (element: HTMLElement) => {\n  const printContents = element.innerHTML;\n  const originalContents = document.body.innerHTML;\n  document.body.innerHTML = printContents;\n  window.print();\n  document.body.innerHTML = originalContents;\n  window.location.reload();\n};\n\nexport const downloadFile = (blob: Blob, filename: string) => {\n  const url = URL.createObjectURL(blob);\n  const link = document.createElement('a');\n  link.href = url;\n  link.download = filename;\n  document.body.appendChild(link);\n  link.click();\n  document.body.removeChild(link);\n  URL.revokeObjectURL(url);\n};"
create_file_safe "$lib_dir/validators.ts" "// Validations de formulaires\nimport { isDateValid } from './date';\n\nexport const validateEmail = (email: string): boolean => {\n  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$/;\n  return emailRegex.test(email);\n};\n\nexport const validatePhone = (phone: string): boolean => {\n  const phoneRegex = /^(\\+223)?[0-9]{8}$/;\n  return phoneRegex.test(phone);\n};\n\nexport const validatePassword = (password: string): boolean => {\n  // Au moins 8 caractères, 1 majuscule, 1 minuscule, 1 chiffre, 1 caractère spécial\n  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$/;\n  return passwordRegex.test(password);\n};\n\nexport const validateDate = (date: Date): boolean => {\n  return isDateValid(date);\n};\n\nexport const validateRequired = (value: any): boolean => {\n  if (value === null || value === undefined) return false;\n  if (typeof value === 'string') return value.trim().length > 0;\n  if (Array.isArray(value)) return value.length > 0;\n  return true;\n};\n\nexport const validateFileType = (file: File, allowedTypes: string[]): boolean => {\n  return allowedTypes.includes(file.type);\n};\n\nexport const validateFileSize = (file: File, maxSize: number): boolean => {\n  return file.size <= maxSize;\n};"

# ========================
# SRC/STORE
# ========================
print_message "Création de la structure src/store/..."

store_dir="src/store"
create_directory_safe "$store_dir"
create_file_safe "$store_dir/authStore.ts" "// Auth + utilisateur courant + permissions\nimport { create } from 'zustand';\nimport { User } from '../types/auth';\n\ninterface AuthState {\n  user: User | null;\n  isAuthenticated: boolean;\n  isLoading: boolean;\n  login: (user: User) => void;\n  logout: () => void;\n  setLoading: (loading: boolean) => void;\n}\n\nexport const useAuthStore = create<AuthState>((set) => ({\n  user: null,\n  isAuthenticated: false,\n  isLoading: false,\n  login: (user) => set({ user, isAuthenticated: true }),\n  logout: () => set({ user: null, isAuthenticated: false }),\n  setLoading: (loading) => set({ isLoading: loading }),\n}));"
create_file_safe "$store_dir/uiStore.ts" "// État UI global (sidebar, modals, toasts)\nimport { create } from 'zustand';\n\ninterface UIState {\n  sidebarOpen: boolean;\n  theme: 'light' | 'dark';\n  toggleSidebar: () => void;\n  setTheme: (theme: 'light' | 'dark') => void;\n}\n\nexport const useUIStore = create<UIState>((set) => ({\n  sidebarOpen: true,\n  theme: 'light',\n  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),\n  setTheme: (theme) => set({ theme }),\n}));"
create_file_safe "$store_dir/demandeStore.ts" "// État des demandes en cours\nimport { create } from 'zustand';\nimport { Demande } from '../types/demande';\n\ninterface DemandeState {\n  demandes: Demande[];\n  selectedDemande: Demande | null;\n  loading: boolean;\n  setDemandes: (demandes: Demande[]) => void;\n  setSelectedDemande: (demande: Demande | null) => void;\n  addDemande: (demande: Demande) => void;\n  updateDemande: (id: string, demande: Partial<Demande>) => void;\n}\n\nexport const useDemandeStore = create<DemandeState>((set) => ({\n  demandes: [],\n  selectedDemande: null,\n  loading: false,\n  setDemandes: (demandes) => set({ demandes }),\n  setSelectedDemande: (demande) => set({ selectedDemande: demande }),\n  addDemande: (demande) => set((state) => ({ demandes: [...state.demandes, demande] })),\n  updateDemande: (id, demande) => set((state) => ({\n    demandes: state.demandes.map((d) =>\n      d.id === id ? { ...d, ...demande } : d\n    ),\n  })),\n}));"
create_file_safe "$store_dir/rendezVousStore.ts" "// État du calendrier rendez-vous\nimport { create } from 'zustand';\nimport { RendezVous } from '../types/rendez-vous';\n\ninterface RendezVousState {\n  rendezVous: RendezVous[];\n  selectedDate: Date;\n  loading: boolean;\n  setRendezVous: (rdvs: RendezVous[]) => void;\n  setSelectedDate: (date: Date) => void;\n  addRendezVous: (rdv: RendezVous) => void;\n  updateRendezVous: (id: string, rdv: Partial<RendezVous>) => void;\n}\n\nexport const useRendezVousStore = create<RendezVousState>((set) => ({\n  rendezVous: [],\n  selectedDate: new Date(),\n  loading: false,\n  setRendezVous: (rdvs) => set({ rendezVous: rdvs }),\n  setSelectedDate: (date) => set({ selectedDate: date }),\n  addRendezVous: (rdv) => set((state) => ({ rendezVous: [...state.rendezVous, rdv] })),\n  updateRendezVous: (id, rdv) => set((state) => ({\n    rendezVous: state.rendezVous.map((r) =>\n      r.id === id ? { ...r, ...rdv } : r\n    ),\n  })),\n}));"

# ========================
# SRC/HOOKS (suite)
# ========================
print_message "Création des hooks..."

hooks_dir="src/hooks"
create_directory_safe "$hooks_dir"
create_file_safe "$hooks_dir/useAuth.ts" "// Auth + redirection si non connecté\nimport { useEffect } from 'react';\nimport { useNavigate } from 'react-router-dom';\nimport { useAuthStore } from '../store/authStore';\n\nexport const useAuth = () => {\n  const { user, isAuthenticated, isLoading } = useAuthStore();\n  const navigate = useNavigate();\n\n  useEffect(() => {\n    if (!isLoading && !isAuthenticated) {\n      navigate('/login');\n    }\n  }, [isAuthenticated, isLoading, navigate]);\n\n  return { user, isAuthenticated, isLoading };\n};"
create_file_safe "$hooks_dir/usePermission.ts" "// Vérification permission RBAC\nimport { useAuthStore } from '../store/authStore';\nimport { hasPermission as checkPermission } from '../lib/rbac';\nimport { PermissionType } from '../config/permissions';\n\nexport const usePermission = () => {\n  const { user } = useAuthStore();\n\n  const hasPermission = (permission: PermissionType): boolean => {\n    if (!user) return false;\n    return checkPermission(user.role as any, permission);\n  };\n\n  const hasAnyPermission = (permissions: PermissionType[]): boolean => {\n    if (!user) return false;\n    return permissions.some(p => checkPermission(user.role as any, p));\n  };\n\n  const hasAllPermissions = (permissions: PermissionType[]): boolean => {\n    if (!user) return false;\n    return permissions.every(p => checkPermission(user.role as any, p));\n  };\n\n  return { hasPermission, hasAnyPermission, hasAllPermissions };\n};"
create_file_safe "$hooks_dir/useRendezVous.ts" "// CRUD + filtrage rendez-vous\nimport { useState, useCallback } from 'react';\nimport { useRendezVousStore } from '../store/rendezVousStore';\nimport api from '../lib/api';\n\nexport const useRendezVous = () => {\n  const { rendezVous, setRendezVous, addRendezVous, updateRendezVous } = useRendezVousStore();\n  const [loading, setLoading] = useState(false);\n\n  const fetchRendezVous = useCallback(async (filters?: any) => {\n    setLoading(true);\n    try {\n      const response = await api.get('/rendez-vous', { params: filters });\n      setRendezVous(response.data.data);\n    } catch (error) {\n      console.error('Error fetching rendez-vous:', error);\n    } finally {\n      setLoading(false);\n    }\n  }, [setRendezVous]);\n\n  const createRendezVous = useCallback(async (data: any) => {\n    setLoading(true);\n    try {\n      const response = await api.post('/rendez-vous', data);\n      addRendezVous(response.data.data);\n      return response.data;\n    } catch (error) {\n      console.error('Error creating rendez-vous:', error);\n      throw error;\n    } finally {\n      setLoading(false);\n    }\n  }, [addRendezVous]);\n\n  const updateRendezVousStatus = useCallback(async (id: string, status: string) => {\n    setLoading(true);\n    try {\n      const response = await api.patch(`/rendez-vous/${id}`, { statut: status });\n      updateRendezVous(id, response.data.data);\n      return response.data;\n    } catch (error) {\n      console.error('Error updating rendez-vous:', error);\n      throw error;\n    } finally {\n      setLoading(false);\n    }\n  }, [updateRendezVous]);\n\n  return {\n    rendezVous,\n    loading,\n    fetchRendezVous,\n    createRendezVous,\n    updateRendezVousStatus,\n  };\n};"
create_file_safe "$hooks_dir/useDemandes.ts" "// CRUD + workflow demandes\nimport { useState, useCallback } from 'react';\nimport { useDemandeStore } from '../store/demandeStore';\nimport api from '../lib/api';\n\nexport const useDemandes = () => {\n  const { demandes, setDemandes, addDemande, updateDemande } = useDemandeStore();\n  const [loading, setLoading] = useState(false);\n\n  const fetchDemandes = useCallback(async (filters?: any) => {\n    setLoading(true);\n    try {\n      const response = await api.get('/demandes', { params: filters });\n      setDemandes(response.data.data);\n    } catch (error) {\n      console.error('Error fetching demandes:', error);\n    } finally {\n      setLoading(false);\n    }\n  }, [setDemandes]);\n\n  const createDemande = useCallback(async (data: any) => {\n    setLoading(true);\n    try {\n      const response = await api.post('/demandes', data);\n      addDemande(response.data.data);\n      return response.data;\n    } catch (error) {\n      console.error('Error creating demande:', error);\n      throw error;\n    } finally {\n      setLoading(false);\n    }\n  }, [addDemande]);\n\n  const validateDemande = useCallback(async (id: string) => {\n    setLoading(true);\n    try {\n      const response = await api.patch(`/demandes/${id}/valider`);\n      updateDemande(id, { statut: 'VALIDEE' });\n      return response.data;\n    } catch (error) {\n      console.error('Error validating demande:', error);\n      throw error;\n    } finally {\n      setLoading(false);\n    }\n  }, [updateDemande]);\n\n  const rejectDemande = useCallback(async (id: string, motif: string) => {\n    setLoading(true);\n    try {\n      const response = await api.patch(`/demandes/${id}/rejeter`, { motif });\n      updateDemande(id, { statut: 'REJETEE' });\n      return response.data;\n    } catch (error) {\n      console.error('Error rejecting demande:', error);\n      throw error;\n    } finally {\n      setLoading(false);\n    }\n  }, [updateDemande]);\n\n  return {\n    demandes,\n    loading,\n    fetchDemandes,\n    createDemande,\n    validateDemande,\n    rejectDemande,\n  };\n};"
create_file_safe "$hooks_dir/useEtudiants.ts" "// Recherche, filtrage, validation\nimport { useState, useCallback } from 'react';\nimport api from '../lib/api';\n\nexport const useEtudiants = () => {\n  const [etudiants, setEtudiants] = useState([]);\n  const [loading, setLoading] = useState(false);\n\n  const fetchEtudiants = useCallback(async (filters?: any) => {\n    setLoading(true);\n    try {\n      const response = await api.get('/etudiants', { params: filters });\n      setEtudiants(response.data.data);\n    } catch (error) {\n      console.error('Error fetching etudiants:', error);\n    } finally {\n      setLoading(false);\n    }\n  }, []);\n\n  const validateEtudiant = useCallback(async (id: string) => {\n    setLoading(true);\n    try {\n      const response = await api.patch(`/etudiants/${id}/valider`);\n      return response.data;\n    } catch (error) {\n      console.error('Error validating etudiant:', error);\n      throw error;\n    } finally {\n      setLoading(false);\n    }\n  }, []);\n\n  return {\n    etudiants,\n    loading,\n    fetchEtudiants,\n    validateEtudiant,\n  };\n};"
create_file_safe "$hooks_dir/useDocuments.ts" "// GED : upload, versionning, archivage\nimport { useState, useCallback } from 'react';\nimport api from '../lib/api';\n\nexport const useDocuments = () => {\n  const [documents, setDocuments] = useState([]);\n  const [loading, setLoading] = useState(false);\n  const [uploadProgress, setUploadProgress] = useState(0);\n\n  const fetchDocuments = useCallback(async (filters?: any) => {\n    setLoading(true);\n    try {\n      const response = await api.get('/documents', { params: filters });\n      setDocuments(response.data.data);\n    } catch (error) {\n      console.error('Error fetching documents:', error);\n    } finally {\n      setLoading(false);\n    }\n  }, []);\n\n  const uploadDocument = useCallback(async (file: File, metadata: any) => {\n    setLoading(true);\n    setUploadProgress(0);\n    try {\n      const formData = new FormData();\n      formData.append('file', file);\n      Object.keys(metadata).forEach(key => {\n        formData.append(key, metadata[key]);\n      });\n\n      const response = await api.post('/documents', formData, {\n        onUploadProgress: (progressEvent) => {\n          if (progressEvent.total) {\n            const progress = (progressEvent.loaded / progressEvent.total) * 100;\n            setUploadProgress(progress);\n          }\n        },\n      });\n      return response.data;\n    } catch (error) {\n      console.error('Error uploading document:', error);\n      throw error;\n    } finally {\n      setLoading(false);\n      setUploadProgress(0);\n    }\n  }, []);\n\n  const archiveDocument = useCallback(async (id: string) => {\n    setLoading(true);\n    try {\n      const response = await api.patch(`/documents/${id}/archiver`);\n      return response.data;\n    } catch (error) {\n      console.error('Error archiving document:', error);\n      throw error;\n    } finally {\n      setLoading(false);\n    }\n  }, []);\n\n  return {\n    documents,\n    loading,\n    uploadProgress,\n    fetchDocuments,\n    uploadDocument,\n    archiveDocument,\n  };\n};"
create_file_safe "$hooks_dir/useAudit.ts" "// Logs et traçabilité\nimport { useState, useCallback } from 'react';\nimport api from '../lib/api';\n\nexport const useAudit = () => {\n  const [logs, setLogs] = useState([]);\n  const [loading, setLoading] = useState(false);\n\n  const fetchLogs = useCallback(async (filters?: any) => {\n    setLoading(true);\n    try {\n      const response = await api.get('/audit', { params: filters });\n      setLogs(response.data.data);\n    } catch (error) {\n      console.error('Error fetching logs:', error);\n    } finally {\n      setLoading(false);\n    }\n  }, []);\n\n  const exportLogs = useCallback(async (filters?: any) => {\n    setLoading(true);\n    try {\n      const response = await api.get('/audit/export', { \n        params: filters,\n        responseType: 'blob',\n      });\n      return response.data;\n    } catch (error) {\n      console.error('Error exporting logs:', error);\n      throw error;\n    } finally {\n      setLoading(false);\n    }\n  }, []);\n\n  return {\n    logs,\n    loading,\n    fetchLogs,\n    exportLogs,\n  };\n};"
create_file_safe "$hooks_dir/useExport.ts" "// Export PDF/Excel/impression\nimport { useState, useCallback } from 'react';\nimport { exportPDF, exportExcel, printDocument, downloadFile } from '../lib/export';\n\nexport const useExport = () => {\n  const [loading, setLoading] = useState(false);\n\n  const exportPDFHandler = useCallback(async (content: HTMLElement, filename: string) => {\n    setLoading(true);\n    try {\n      await exportPDF(content, filename);\n    } finally {\n      setLoading(false);\n    }\n  }, []);\n\n  const exportExcelHandler = useCallback(async (data: any[], filename: string) => {\n    setLoading(true);\n    try {\n      await exportExcel(data, filename);\n    } finally {\n      setLoading(false);\n    }\n  }, []);\n\n  const printHandler = useCallback((element: HTMLElement) => {\n    printDocument(element);\n  }, []);\n\n  const downloadHandler = useCallback((blob: Blob, filename: string) => {\n    downloadFile(blob, filename);\n  }, []);\n\n  return {\n    loading,\n    exportPDF: exportPDFHandler,\n    exportExcel: exportExcelHandler,\n    print: printHandler,\n    download: downloadHandler,\n  };\n};"
create_file_safe "$hooks_dir/useModal.ts" "// Gestion modales\nimport { useState, useCallback } from 'react';\n\nexport const useModal = (initialState: boolean = false) => {\n  const [isOpen, setIsOpen] = useState(initialState);\n\n  const open = useCallback(() => setIsOpen(true), []);\n  const close = useCallback(() => setIsOpen(false), []);\n  const toggle = useCallback(() => setIsOpen(prev => !prev), []);\n\n  return { isOpen, open, close, toggle };\n};"
create_file_safe "$hooks_dir/useToast.ts" "// Notifications\nimport { useState, useCallback } from 'react';\n\ntype ToastType = 'success' | 'error' | 'warning' | 'info';\n\ninterface Toast {\n  id: string;\n  type: ToastType;\n  message: string;\n  duration?: number;\n}\n\nexport const useToast = () => {\n  const [toasts, setToasts] = useState<Toast[]>([]);\n\n  const addToast = useCallback((type: ToastType, message: string, duration: number = 3000) => {\n    const id = Date.now().toString();\n    const toast: Toast = { id, type, message, duration };\n    \n    setToasts(prev => [...prev, toast]);\n\n    if (duration > 0) {\n      setTimeout(() => {\n        removeToast(id);\n      }, duration);\n    }\n  }, []);\n\n  const removeToast = useCallback((id: string) => {\n    setToasts(prev => prev.filter(toast => toast.id !== id));\n  }, []);\n\n  const success = useCallback((message: string, duration?: number) => {\n    addToast('success', message, duration);\n  }, [addToast]);\n\n  const error = useCallback((message: string, duration?: number) => {\n    addToast('error', message, duration);\n  }, [addToast]);\n\n  const warning = useCallback((message: string, duration?: number) => {\n    addToast('warning', message, duration);\n  }, [addToast]);\n\n  const info = useCallback((message: string, duration?: number) => {\n    addToast('info', message, duration);\n  }, [addToast]);\n\n  return {\n    toasts,\n    addToast,\n    removeToast,\n    success,\n    error,\n    warning,\n    info,\n  };\n};"

# ========================
# SRC/COMPONENTS (suite - version sécurisée)
# ========================
print_message "Création des composants UI (uniquement si manquants)..."

components_ui_dir="src/components/ui"
create_directory_safe "$components_ui_dir"

ui_components=(
  "Button"
  "Input"
  "Select"
  "DatePicker"
  "TimePicker"
  "Checkbox"
  "Radio"
  "Textarea"
  "Badge"
  "Card"
  "Modal"
  "Drawer"
  "Tabs"
  "Accordion"
  "Table"
  "Pagination"
  "SearchBar"
  "FilterBar"
  "SortHeader"
  "Avatar"
  "Skeleton"
  "Spinner"
  "EmptyState"
  "ConfirmDialog"
  "Toast"
  "Tooltip"
  "QRCode"
)

for comp in "${ui_components[@]}"; do
  create_file_safe "$components_ui_dir/$comp/index.tsx" "import React from 'react';\n\ninterface ${comp}Props {\n  // Ajoutez vos props ici\n}\n\nexport const ${comp}: React.FC<${comp}Props> = (props) => {\n  return (\n    <div className=\"${comp,,}\">\n      {/* Implémentation du composant ${comp} */}\n    </div>\n  );\n};\n\nexport default ${comp};"
done

# Pour les autres composants, nous créons uniquement les dossiers et un fichier index si nécessaire
print_message "Création des autres composants (dossiers uniquement si manquants)"

components_dirs=(
  "dashboard"
  "demandes"
  "rendez-vous"
  "etudiants"
  "documents"
  "communication"
  "audit"
  "services"
  "utilisateurs"
  "paiements"
  "stats"
)

for dir in "${components_dirs[@]}"; do
  create_directory_safe "src/components/$dir"
  create_file_safe "src/components/$dir/index.ts" "// Export des composants du dossier $dir\nexport * from './';\n"
done

# ========================
# SRC/PAGES (suite - version sécurisée)
# ========================
print_message "Création des pages (uniquement si manquantes)"

pages_dir="src/pages"
create_directory_safe "$pages_dir"

# Pages d'authentification
create_directory_safe "$pages_dir/auth"
create_file_safe "$pages_dir/auth/LoginPage.tsx" "import React from 'react';\nimport { LoginForm } from '../../components/auth/LoginForm';\n\nexport const LoginPage: React.FC = () => {\n  return (\n    <div className=\"min-h-screen flex items-center justify-center bg-gray-50\">\n      <div className=\"bg-white p-8 rounded-lg shadow-md w-96\">\n        <h1 className=\"text-2xl font-bold text-center mb-6\">\n          Ambassade du Mali\n        </h1>\n        <LoginForm />\n      </div>\n    </div>\n  );\n};"
create_file_safe "$pages_dir/auth/ResetPasswordPage.tsx" "import React from 'react';\nimport { PasswordReset } from '../../components/auth/PasswordReset';\n\nexport const ResetPasswordPage: React.FC = () => {\n  return (\n    <div className=\"min-h-screen flex items-center justify-center bg-gray-50\">\n      <div className=\"bg-white p-8 rounded-lg shadow-md w-96\">\n        <h1 className=\"text-2xl font-bold text-center mb-6\">\n          Réinitialiser le mot de passe\n        </h1>\n        <PasswordReset />\n      </div>\n    </div>\n  );\n};"

# Tableau de bord
create_directory_safe "$pages_dir/dashboard"
create_file_safe "$pages_dir/dashboard/DashboardPage.tsx" "import React from 'react';\n\nexport const DashboardPage: React.FC = () => {\n  return (\n    <div>\n      <h1 className=\"text-2xl font-bold mb-6\">Tableau de bord</h1>\n      <div className=\"grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6\">\n        {/* Statistiques */}\n      </div>\n    </div>\n  );\n};"

# Demandes
create_directory_safe "$pages_dir/demandes"
create_file_safe "$pages_dir/demandes/DemandesListPage.tsx" "import React from 'react';\n\nexport const DemandesListPage: React.FC = () => {\n  return (\n    <div>\n      <h1 className=\"text-2xl font-bold mb-6\">Liste des demandes</h1>\n      {/* Liste des demandes */}\n    </div>\n  );\n};"
create_file_safe "$pages_dir/demandes/DemandeDetailPage.tsx" "import React from 'react';\nimport { useParams } from 'react-router-dom';\n\nexport const DemandeDetailPage: React.FC = () => {\n  const { id } = useParams<{ id: string }>();\n  \n  return (\n    <div>\n      <h1 className=\"text-2xl font-bold mb-6\">Détail de la demande</h1>\n      <p>ID: {id}</p>\n    </div>\n  );\n};"
create_file_safe "$pages_dir/demandes/DemandeTraitementPage.tsx" "import React from 'react';\n\nexport const DemandeTraitementPage: React.FC = () => {\n  return (\n    <div>\n      <h1 className=\"text-2xl font-bold mb-6\">Traitement des demandes</h1>\n    </div>\n  );\n};"

# Rendez-vous
create_directory_safe "$pages_dir/rendez-vous"
create_file_safe "$pages_dir/rendez-vous/CalendrierPage.tsx" "import React from 'react';\n\nexport const CalendrierPage: React.FC = () => {\n  return (\n    <div>\n      <h1 className=\"text-2xl font-bold mb-6\">Calendrier des rendez-vous</h1>\n    </div>\n  );\n};"
create_file_safe "$pages_dir/rendez-vous/UrgencePage.tsx" "import React from 'react';\n\nexport const UrgencePage: React.FC = () => {\n  return (\n    <div>\n      <h1 className=\"text-2xl font-bold mb-6\">Prise de rendez-vous d'urgence</h1>\n    </div>\n  );\n};"
create_file_safe "$pages_dir/rendez-vous/DisponibilitesPage.tsx" "import React from 'react';\n\nexport const DisponibilitesPage: React.FC = () => {\n  return (\n    <div>\n      <h1 className=\"text-2xl font-bold mb-6\">Gestion des disponibilités</h1>\n    </div>\n  );\n};"

# Étudiants
create_directory_safe "$pages_dir/etudiants"
create_file_safe "$pages_dir/etudiants/EtudiantsListPage.tsx" "import React from 'react';\n\nexport const EtudiantsListPage: React.FC = () => {\n  return (\n    <div>\n      <h1 className=\"text-2xl font-bold mb-6\">Liste des étudiants</h1>\n    </div>\n  );\n};"
create_file_safe "$pages_dir/etudiants/EtudiantDetailPage.tsx" "import React from 'react';\nimport { useParams } from 'react-router-dom';\n\nexport const EtudiantDetailPage: React.FC = () => {\n  const { id } = useParams<{ id: string }>();\n  \n  return (\n    <div>\n      <h1 className=\"text-2xl font-bold mb-6\">Détail de l'étudiant</h1>\n      <p>ID: {id}</p>\n    </div>\n  );\n};"
create_file_safe "$pages_dir/etudiants/ValidationPage.tsx" "import React from 'react';\n\nexport const ValidationPage: React.FC = () => {\n  return (\n    <div>\n      <h1 className=\"text-2xl font-bold mb-6\">Validation des étudiants</h1>\n    </div>\n  );\n};"

# Documents
create_directory_safe "$pages_dir/documents"
create_file_safe "$pages_dir/documents/DocumentsPage.tsx" "import React from 'react';\n\nexport const DocumentsPage: React.FC = () => {\n  return (\n    <div>\n      <h1 className=\"text-2xl font-bold mb-6\">Gestion des documents</h1>\n    </div>\n  );\n};"
create_file_safe "$pages_dir/documents/ArchivesPage.tsx" "import React from 'react';\n\nexport const ArchivesPage: React.FC = () => {\n  return (\n    <div>\n      <h1 className=\"text-2xl font-bold mb-6\">Archives</h1>\n    </div>\n  );\n};"

# Communication
create_directory_safe "$pages_dir/communication"
create_file_safe "$pages_dir/communication/CampagnesPage.tsx" "import React from 'react';\n\nexport const CampagnesPage: React.FC = () => {\n  return (\n    <div>\n      <h1 className=\"text-2xl font-bold mb-6\">Campagnes de communication</h1>\n    </div>\n  );\n};"
create_file_safe "$pages_dir/communication/NouvelleCampagnePage.tsx" "import React from 'react';\n\nexport const NouvelleCampagnePage: React.FC = () => {\n  return (\n    <div>\n      <h1 className=\"text-2xl font-bold mb-6\">Nouvelle campagne</h1>\n    </div>\n  );\n};"

# Audit
create_directory_safe "$pages_dir/audit"
create_file_safe "$pages_dir/audit/JournalPage.tsx" "import React from 'react';\n\nexport const JournalPage: React.FC = () => {\n  return (\n    <div>\n      <h1 className=\"text-2xl font-bold mb-6\">Journal d'audit</h1>\n    </div>\n  );\n};"

# Services
create_directory_safe "$pages_dir/services"
create_file_safe "$pages_dir/services/ServicesPage.tsx" "import React from 'react';\n\nexport const ServicesPage: React.FC = () => {\n  return (\n    <div>\n      <h1 className=\"text-2xl font-bold mb-6\">Gestion des services</h1>\n    </div>\n  );\n};"
create_file_safe "$pages_dir/services/HorairesPage.tsx" "import React from 'react';\n\nexport const HorairesPage: React.FC = () => {\n  return (\n    <div>\n      <h1 className=\"text-2xl font-bold mb-6\">Gestion des horaires</h1>\n    </div>\n  );\n};"

# Utilisateurs
create_directory_safe "$pages_dir/utilisateurs"
create_file_safe "$pages_dir/utilisateurs/AgentsPage.tsx" "import React from 'react';\n\nexport const AgentsPage: React.FC = () => {\n  return (\n    <div>\n      <h1 className=\"text-2xl font-bold mb-6\">Gestion des agents</h1>\n    </div>\n  );\n};"
create_file_safe "$pages_dir/utilisateurs/RolesPermissionsPage.tsx" "import React from 'react';\n\nexport const RolesPermissionsPage: React.FC = () => {\n  return (\n    <div>\n      <h1 className=\"text-2xl font-bold mb-6\">Rôles et permissions</h1>\n    </div>\n  );\n};"

# Statistiques
create_directory_safe "$pages_dir/stats"
create_file_safe "$pages_dir/stats/RapportsPage.tsx" "import React from 'react';\n\nexport const RapportsPage: React.FC = () => {\n  return (\n    <div>\n      <h1 className=\"text-2xl font-bold mb-6\">Rapports et statistiques</h1>\n    </div>\n  );\n};"

# Profil
create_directory_safe "$pages_dir/profil"
create_file_safe "$pages_dir/profil/MonProfilPage.tsx" "import React from 'react';\n\nexport const MonProfilPage: React.FC = () => {\n  return (\n    <div>\n      <h1 className=\"text-2xl font-bold mb-6\">Mon profil</h1>\n    </div>\n  );\n};"

# Pages d'erreur
create_directory_safe "$pages_dir/erreurs"
create_file_safe "$pages_dir/erreurs/UnauthorizedPage.tsx" "import React from 'react';\nimport { Link } from 'react-router-dom';\n\nexport const UnauthorizedPage: React.FC = () => {\n  return (\n    <div className=\"min-h-screen flex items-center justify-center\">\n      <div className=\"text-center\">\n        <h1 className=\"text-6xl font-bold text-red-600\">403</h1>\n        <h2 className=\"text-2xl font-semibold mt-4\">Accès interdit</h2>\n        <p className=\"text-gray-600 mt-2\">Vous n'avez pas les permissions nécessaires.</p>\n        <Link to=\"/dashboard\" className=\"mt-4 inline-block bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700\">\n          Retour au tableau de bord\n        </Link>\n      </div>\n    </div>\n  );\n};"
create_file_safe "$pages_dir/erreurs/NotFoundPage.tsx" "import React from 'react';\nimport { Link } from 'react-router-dom';\n\nexport const NotFoundPage: React.FC = () => {\n  return (\n    <div className=\"min-h-screen flex items-center justify-center\">\n      <div className=\"text-center\">\n        <h1 className=\"text-6xl font-bold text-gray-600\">404</h1>\n        <h2 className=\"text-2xl font-semibold mt-4\">Page non trouvée</h2>\n        <p className=\"text-gray-600 mt-2\">La page que vous recherchez n'existe pas.</p>\n        <Link to=\"/dashboard\" className=\"mt-4 inline-block bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700\">\n          Retour au tableau de bord\n        </Link>\n      </div>\n    </div>\n  );\n};"

# ========================
# SRC/ROUTES
# ========================
print_message "Création de la structure src/routes/..."

routes_dir="src/routes"
create_directory_safe "$routes_dir"
create_file_safe "$routes_dir/index.tsx" "import React from 'react';\nimport { Routes, Route, Navigate } from 'react-router-dom';\nimport { routeDefinitions } from './route-definitions';\nimport { RouteGuard } from './route-guards';\n\nexport const AppRoutes: React.FC = () => {\n  return (\n    <Routes>\n      {routeDefinitions.map((route) => (\n        <Route\n          key={route.path}\n          path={route.path}\n          element={\n            <RouteGuard requiredRoles={route.roles}>\n              {route.element}\n            </RouteGuard>\n          }\n        />\n      ))}\n      <Route path=\"/\" element={<Navigate to=\"/dashboard\" replace />} />\n      <Route path=\"*\" element={<Navigate to=\"/404\" replace />} />\n    </Routes>\n  );\n};"
create_file_safe "$routes_dir/route-guards.tsx" "import React from 'react';\nimport { Navigate } from 'react-router-dom';\nimport { useAuthStore } from '../store/authStore';\nimport { RoleType } from '../config/roles';\n\ninterface RouteGuardProps {\n  children: React.ReactNode;\n  requiredRoles?: RoleType[];\n}\n\nexport const RouteGuard: React.FC<RouteGuardProps> = ({ children, requiredRoles }) => {\n  const { user, isAuthenticated } = useAuthStore();\n\n  if (!isAuthenticated) {\n    return <Navigate to=\"/login\" replace />;\n  }\n\n  if (requiredRoles && user && !requiredRoles.includes(user.role as RoleType)) {\n    return <Navigate to=\"/403\" replace />;\n  }\n\n  return <>{children}</>;\n};"
create_file_safe "$routes_dir/route-definitions.ts" "import React from 'react';\nimport { RoleType } from '../config/roles';\n\n// Import des pages (lazy loading)\nconst DashboardPage = React.lazy(() => import('../pages/dashboard/DashboardPage'));\nconst DemandesListPage = React.lazy(() => import('../pages/demandes/DemandesListPage'));\nconst DemandeDetailPage = React.lazy(() => import('../pages/demandes/DemandeDetailPage'));\nconst DemandeTraitementPage = React.lazy(() => import('../pages/demandes/DemandeTraitementPage'));\nconst CalendrierPage = React.lazy(() => import('../pages/rendez-vous/CalendrierPage'));\nconst UrgencePage = React.lazy(() => import('../pages/rendez-vous/UrgencePage'));\nconst DisponibilitesPage = React.lazy(() => import('../pages/rendez-vous/DisponibilitesPage'));\nconst EtudiantsListPage = React.lazy(() => import('../pages/etudiants/EtudiantsListPage'));\nconst EtudiantDetailPage = React.lazy(() => import('../pages/etudiants/EtudiantDetailPage'));\nconst ValidationPage = React.lazy(() => import('../pages/etudiants/ValidationPage'));\nconst DocumentsPage = React.lazy(() => import('../pages/documents/DocumentsPage'));\nconst ArchivesPage = React.lazy(() => import('../pages/documents/ArchivesPage'));\nconst CampagnesPage = React.lazy(() => import('../pages/communication/CampagnesPage'));\nconst NouvelleCampagnePage = React.lazy(() => import('../pages/communication/NouvelleCampagnePage'));\nconst JournalPage = React.lazy(() => import('../pages/audit/JournalPage'));\nconst ServicesPage = React.lazy(() => import('../pages/services/ServicesPage'));\nconst HorairesPage = React.lazy(() => import('../pages/services/HorairesPage'));\nconst AgentsPage = React.lazy(() => import('../pages/utilisateurs/AgentsPage'));\nconst RolesPermissionsPage = React.lazy(() => import('../pages/utilisateurs/RolesPermissionsPage'));\nconst RapportsPage = React.lazy(() => import('../pages/stats/RapportsPage'));\nconst MonProfilPage = React.lazy(() => import('../pages/profil/MonProfilPage'));\nconst UnauthorizedPage = React.lazy(() => import('../pages/erreurs/UnauthorizedPage'));\nconst NotFoundPage = React.lazy(() => import('../pages/erreurs/NotFoundPage'));\n\ninterface RouteDefinition {\n  path: string;\n  element: React.ReactNode;\n  roles?: RoleType[];\n  label?: string;\n}\n\nexport const routeDefinitions: RouteDefinition[] = [\n  // Dashboard\n  { path: '/dashboard', element: <DashboardPage />, roles: ['SUPER_ADMIN', 'ADMIN', 'AGENT', 'GARDIEN'], label: 'Tableau de bord' },\n  \n  // Demandes\n  { path: '/demandes', element: <DemandesListPage />, roles: ['SUPER_ADMIN', 'ADMIN', 'AGENT'], label: 'Demandes' },\n  { path: '/demandes/:id', element: <DemandeDetailPage />, roles: ['SUPER_ADMIN', 'ADMIN', 'AGENT'] },\n  { path: '/demandes/:id/traitement', element: <DemandeTraitementPage />, roles: ['SUPER_ADMIN', 'ADMIN', 'AGENT'] },\n  \n  // Rendez-vous\n  { path: '/rendez-vous', element: <CalendrierPage />, roles: ['SUPER_ADMIN', 'ADMIN', 'AGENT', 'GARDIEN'], label: 'Rendez-vous' },\n  { path: '/rendez-vous/urgence', element: <UrgencePage />, roles: ['SUPER_ADMIN', 'ADMIN', 'AGENT'] },\n  { path: '/rendez-vous/disponibilites', element: <DisponibilitesPage />, roles: ['SUPER_ADMIN', 'ADMIN'] },\n  \n  // Étudiants\n  { path: '/etudiants', element: <EtudiantsListPage />, roles: ['SUPER_ADMIN', 'ADMIN', 'AGENT'], label: 'Étudiants' },\n  { path: '/etudiants/:id', element: <EtudiantDetailPage />, roles: ['SUPER_ADMIN', 'ADMIN', 'AGENT'] },\n  { path: '/etudiants/validation', element: <ValidationPage />, roles: ['SUPER_ADMIN', 'ADMIN', 'AGENT'] },\n  \n  // Documents\n  { path: '/documents', element: <DocumentsPage />, roles: ['SUPER_ADMIN', 'ADMIN', 'AGENT'], label: 'Documents' },\n  { path: '/documents/archives', element: <ArchivesPage />, roles: ['SUPER_ADMIN', 'ADMIN'] },\n  \n  // Communication\n  { path: '/communication', element: <CampagnesPage />, roles: ['SUPER_ADMIN', 'ADMIN'], label: 'Communication' },\n  { path: '/communication/nouvelle', element: <NouvelleCampagnePage />, roles: ['SUPER_ADMIN', 'ADMIN'] },\n  \n  // Audit\n  { path: '/audit', element: <JournalPage />, roles: ['SUPER_ADMIN', 'ADMIN'], label: 'Audit' },\n  \n  // Services\n  { path: '/services', element: <ServicesPage />, roles: ['SUPER_ADMIN', 'ADMIN'], label: 'Services' },\n  { path: '/services/horaires', element: <HorairesPage />, roles: ['SUPER_ADMIN', 'ADMIN'] },\n  \n  // Utilisateurs\n  { path: '/utilisateurs', element: <AgentsPage />, roles: ['SUPER_ADMIN', 'ADMIN'], label: 'Utilisateurs' },\n  { path: '/utilisateurs/roles', element: <RolesPermissionsPage />, roles: ['SUPER_ADMIN'] },\n  \n  // Statistiques\n  { path: '/stats', element: <RapportsPage />, roles: ['SUPER_ADMIN', 'ADMIN'], label: 'Statistiques' },\n  \n  // Profil\n  { path: '/profil', element: <MonProfilPage />, roles: ['SUPER_ADMIN', 'ADMIN', 'AGENT', 'GARDIEN', 'ETUDIANT'], label: 'Mon profil' },\n  \n  // Pages d'erreur\n  { path: '/403', element: <UnauthorizedPage /> },\n  { path: '/404', element: <NotFoundPage /> },\n];"

# ========================
# SRC/CONTEXT
# ========================
print_message "Création de la structure src/context/..."

context_dir="src/context"
create_directory_safe "$context_dir"
create_file_safe "$context_dir/ThemeContext.tsx" "import React, { createContext, useContext, useState, ReactNode } from 'react';\n\ntype Theme = 'light' | 'dark';\n\ninterface ThemeContextType {\n  theme: Theme;\n  toggleTheme: () => void;\n}\n\nconst ThemeContext = createContext<ThemeContextType | undefined>(undefined);\n\nexport const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {\n  const [theme, setTheme] = useState<Theme>('light');\n\n  const toggleTheme = () => {\n    setTheme(prev => prev === 'light' ? 'dark' : 'light');\n  };\n\n  return (\n    <ThemeContext.Provider value={{ theme, toggleTheme }}>\n      {children}\n    </ThemeContext.Provider>\n  );\n};\n\nexport const useTheme = () => {\n  const context = useContext(ThemeContext);\n  if (!context) {\n    throw new Error('useTheme must be used within a ThemeProvider');\n  }\n  return context;\n};"
create_file_safe "$context_dir/SidebarContext.tsx" "import React, { createContext, useContext, useState, ReactNode } from 'react';\n\ninterface SidebarContextType {\n  isOpen: boolean;\n  toggle: () => void;\n  close: () => void;\n  open: () => void;\n}\n\nconst SidebarContext = createContext<SidebarContextType | undefined>(undefined);\n\nexport const SidebarProvider: React.FC<{ children: ReactNode }> = ({ children }) => {\n  const [isOpen, setIsOpen] = useState(true);\n\n  const toggle = () => setIsOpen(prev => !prev);\n  const close = () => setIsOpen(false);\n  const open = () => setIsOpen(true);\n\n  return (\n    <SidebarContext.Provider value={{ isOpen, toggle, close, open }}>\n      {children}\n    </SidebarContext.Provider>\n  );\n};\n\nexport const useSidebar = () => {\n  const context = useContext(SidebarContext);\n  if (!context) {\n    throw new Error('useSidebar must be used within a SidebarProvider');\n  }\n  return context;\n};"

# ========================
# SRC/ICONS
# ========================
print_message "Création de la structure src/icons/..."

icons_dir="src/icons"
create_directory_safe "$icons_dir"
create_file_safe "$icons_dir/index.ts" "// Export des icônes SVG\nexport const Icon = {\n  dashboard: '',\n  'file-text': '',\n  calendar: '',\n  users: '',\n  folder: '',\n  mail: '',\n  clipboard: '',\n  briefcase: '',\n  'user-cog': '',\n  'bar-chart': '',\n};"

# ========================
# FICHIERS DE CONFIGURATION
# ========================
print_message "Création des fichiers de configuration (uniquement si manquants)..."

create_file_safe "tailwind.config.js" "/** @type {import('tailwindcss').Config} */\nexport default {\n  content: [\n    './index.html',\n    './src/**/*.{js,ts,jsx,tsx}',\n  ],\n  theme: {\n    extend: {\n      colors: {\n        primary: '#00a651',\n        secondary: '#ffce00',\n      },\n    },\n  },\n  plugins: [],\n};"

create_file_safe "package.json" "{\n  \"name\": \"frontend-embassy\",\n  \"private\": true,\n  \"version\": \"1.0.0\",\n  \"type\": \"module\",\n  \"scripts\": {\n    \"dev\": \"vite\",\n    \"build\": \"tsc && vite build\",\n    \"preview\": \"vite preview\",\n    \"lint\": \"eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0\"\n  },\n  \"dependencies\": {\n    \"axios\": \"^1.6.0\",\n    \"date-fns\": \"^3.0.0\",\n    \"react\": \"^18.2.0\",\n    \"react-dom\": \"^18.2.0\",\n    \"react-router-dom\": \"^6.20.0\",\n    \"zustand\": \"^4.4.7\"\n  },\n  \"devDependencies\": {\n    \"@types/react\": \"^18.2.43\",\n    \"@types/react-dom\": \"^18.2.17\",\n    \"@typescript-eslint/eslint-plugin\": \"^6.14.0\",\n    \"@typescript-eslint/parser\": \"^6.14.0\",\n    \"@vitejs/plugin-react\": \"^4.2.1\",\n    \"autoprefixer\": \"^10.4.16\",\n    \"eslint\": \"^8.55.0\",\n    \"eslint-plugin-react-hooks\": \"^4.6.0\",\n    \"eslint-plugin-react-refresh\": \"^0.4.5\",\n    \"postcss\": \"^8.4.32\",\n    \"tailwindcss\": \"^3.3.6\",\n    \"typescript\": \"^5.2.2\",\n    \"vite\": \"^5.0.8\"\n  }\n}"

create_file_safe "tsconfig.json" "{\n  \"compilerOptions\": {\n    \"target\": \"ES2020\",\n    \"useDefineForClassFields\": true,\n    \"lib\": [\"ES2020\", \"DOM\", \"DOM.Iterable\"],\n    \"module\": \"ESNext\",\n    \"skipLibCheck\": true,\n    \"moduleResolution\": \"bundler\",\n    \"allowImportingTsExtensions\": true,\n    \"resolveJsonModule\": true,\n    \"isolatedModules\": true,\n    \"noEmit\": true,\n    \"jsx\": \"react-jsx\",\n    \"strict\": true,\n    \"noUnusedLocals\": true,\n    \"noUnusedParameters\": true,\n    \"noFallthroughCasesInSwitch\": true,\n    \"baseUrl\": \".\",\n    \"paths\": {\n      \"@/*\": [\"./src/*\"]\n    }\n  },\n  \"include\": [\"src\"],\n  \"references\": [{ \"path\": \"./tsconfig.node.json\" }]\n}"

create_file_safe "tsconfig.node.json" "{\n  \"compilerOptions\": {\n    \"composite\": true,\n    \"skipLibCheck\": true,\n    \"module\": \"ESNext\",\n    \"moduleResolution\": \"bundler\",\n    \"allowSyntheticDefaultImports\": true\n  },\n  \"include\": [\"vite.config.ts\"]\n}"

create_file_safe "vite.config.ts" "import { defineConfig } from 'vite';\nimport react from '@vitejs/plugin-react';\nimport path from 'path';\n\nexport default defineConfig({\n  plugins: [react()],\n  resolve: {\n    alias: {\n      '@': path.resolve(__dirname, './src'),\n    },\n  },\n  server: {\n    port: 5173,\n  },\n});"

create_file_safe "index.html" "<!doctype html>\n<html lang=\"fr\">\n  <head>\n    <meta charset=\"UTF-8\" />\n    <link rel=\"icon\" type=\"image/svg+xml\" href=\"/favicon.png\" />\n    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\" />\n    <title>Ambassade du Mali - Plateforme Consulaire</title>\n  </head>\n  <body>\n    <div id=\"root\"></div>\n    <script type=\"module\" src=\"/src/main.tsx\"></script>\n  </body>\n</html>"

create_file_safe ".gitignore" "# Logs\nlogs\n*.log\nnpm-debug.log*\nyarn-debug.log*\nyarn-error.log*\npnpm-debug.log*\nlerna-debug.log*\n\nnode_modules\ndist\ndist-ssr\n*.local\n\n# Editor directories and files\n.vscode/*\n!.vscode/extensions.json\n.idea\n.DS_Store\n*.suo\n*.ntvs*\n*.njsproj\n*.sln\n*.sw?"

create_file_safe ".env.example" "# API Configuration\nVITE_API_URL=http://localhost:3000\n\n# Feature Flags\nVITE_ENABLE_MFA=true\nVITE_ENABLE_AUDIT=true\n\n# App Configuration\nVITE_APP_NAME=Ambassade du Mali\nVITE_APP_VERSION=1.0.0"

create_file_safe "README.md" "# Frontend Embassy - Plateforme Consulaire du Mali\n\n## Description\nPlateforme de gestion des services consulaires de l'Ambassade du Mali.\n\n## Technologies\n- React 18\n- TypeScript\n- Tailwind CSS\n- Vite\n- Zustand (State Management)\n- React Router v6\n- Axios\n- date-fns\n\n## Installation\n\n\\`\\`\\`bash\n# Installation des dépendances\nnpm install\n\n# Démarrage en développement\nnpm run dev\n\n# Build de production\nnpm run build\n\n# Prévisualisation du build\nnpm run preview\n\\`\\`\\`\n\n## Structure du projet\n\n\\`\\`\\`\nsrc/\n├── components/     # Composants réutilisables\n├── config/         # Configuration de l'application\n├── hooks/          # Custom hooks\n├── lib/            # Utilitaires et helpers\n├── pages/          # Pages de l'application\n├── routes/         # Configuration des routes\n├── store/          # Stores Zustand\n├── types/          # Types TypeScript\n└── context/        # Contextes React\n\\`\\`\\`\n\n## Fonctionnalités\n\n- Authentification et autorisation (RBAC)\n- Gestion des demandes consulaires\n- Calendrier des rendez-vous\n- Gestion des étudiants\n- Gestion électronique des documents\n- Communication institutionnelle\n- Journal d'audit\n- Statistiques et rapports\n\n## Licence\n\n© 2024 Ambassade du Mali - Tous droits réservés"

print_success "✅ Structure du projet créée avec succès (fichiers existants préservés) !"
print_message "📁 Emplacement: $PROJECT_PATH"
print_message "📝 N'oubliez pas d'installer les dépendances avec 'npm install'"
print_message "⚠️  Les fichiers qui existaient déjà n'ont pas été modifiés"

exit 0