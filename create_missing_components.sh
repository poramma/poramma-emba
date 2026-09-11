#!/bin/bash

# Script de création des fichiers manquants dans src/components/
# Version: Crée uniquement les fichiers qui n'existent pas, sans contenu

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

print_skip() {
    echo -e "${YELLOW}[IGNORÉ]${NC} $1 - Fichier existant, préservé"
}

# Fonction pour créer un fichier vide UNIQUEMENT s'il n'existe pas
create_empty_file() {
    local file_path="$1"
    
    if [ -f "$file_path" ]; then
        print_skip "$file_path"
        return 0
    fi
    
    mkdir -p "$(dirname "$file_path")"
    touch "$file_path"
    print_success "Fichier créé : $file_path"
    return 0
}

# Définition du chemin du projet
PROJECT_PATH="B:/Poramma/frontend-embassy"

# Vérification si le chemin existe
if [ ! -d "$PROJECT_PATH" ]; then
    echo -e "${RED}[ERREUR]${NC} Le chemin $PROJECT_PATH n'existe pas"
    exit 1
fi

cd "$PROJECT_PATH" || exit 1

print_message "Création des fichiers manquants dans src/components/..."
print_message "⚠️  Les fichiers existants seront préservés"

# ========================
# COMPOSANTS AUTH
# ========================
print_message "Création des composants auth/..."

create_empty_file "src/components/auth/LoginForm.tsx"
create_empty_file "src/components/auth/MFAVerification.tsx"
create_empty_file "src/components/auth/PasswordReset.tsx"

# ========================
# COMPOSANTS DASHBOARD
# ========================
print_message "Création des composants dashboard/..."

create_empty_file "src/components/dashboard/StatsCards.tsx"
create_empty_file "src/components/dashboard/DemandesChart.tsx"
create_empty_file "src/components/dashboard/RendezVousChart.tsx"
create_empty_file "src/components/dashboard/ActiviteRecente.tsx"
create_empty_file "src/components/dashboard/AlertesUrgentes.tsx"
create_empty_file "src/components/dashboard/TauxSatisfaction.tsx"

# ========================
# COMPOSANTS DEMANDES
# ========================
print_message "Création des composants demandes/..."

create_empty_file "src/components/demandes/DemandeList.tsx"
create_empty_file "src/components/demandes/DemandeFilters.tsx"
create_empty_file "src/components/demandes/DemandeDetail.tsx"
create_empty_file "src/components/demandes/DemandeWorkflow.tsx"
create_empty_file "src/components/demandes/DemandeActions.tsx"
create_empty_file "src/components/demandes/DocumentViewer.tsx"
create_empty_file "src/components/demandes/DemandeTimeline.tsx"

# ========================
# COMPOSANTS RENDEZ-VOUS
# ========================
print_message "Création des composants rendez-vous/..."

create_empty_file "src/components/rendez-vous/CalendrierJour.tsx"
create_empty_file "src/components/rendez-vous/CalendrierSemaine.tsx"
create_empty_file "src/components/rendez-vous/CalendrierMois.tsx"
create_empty_file "src/components/rendez-vous/CreneauPicker.tsx"
create_empty_file "src/components/rendez-vous/RendezVousCard.tsx"
create_empty_file "src/components/rendez-vous/RendezVousForm.tsx"
create_empty_file "src/components/rendez-vous/UrgenceForm.tsx"
create_empty_file "src/components/rendez-vous/PrintRdvJour.tsx"
create_empty_file "src/components/rendez-vous/DisponibiliteForm.tsx"

# ========================
# COMPOSANTS ETUDIANTS
# ========================
print_message "Création des composants etudiants/..."

create_empty_file "src/components/etudiants/EtudiantList.tsx"
create_empty_file "src/components/etudiants/EtudiantFilters.tsx"
create_empty_file "src/components/etudiants/EtudiantDetail.tsx"
create_empty_file "src/components/etudiants/EtudiantValidation.tsx"
create_empty_file "src/components/etudiants/INUECard.tsx"
create_empty_file "src/components/etudiants/EtudiantDocuments.tsx"

# ========================
# COMPOSANTS DOCUMENTS
# ========================
print_message "Création des composants documents/..."

create_empty_file "src/components/documents/DocumentUpload.tsx"
create_empty_file "src/components/documents/DocumentList.tsx"
create_empty_file "src/components/documents/DocumentViewer.tsx"
create_empty_file "src/components/documents/DocumentVersion.tsx"
create_empty_file "src/components/documents/DocumentSearch.tsx"
create_empty_file "src/components/documents/DocumentArchive.tsx"

# ========================
# COMPOSANTS COMMUNICATION
# ========================
print_message "Création des composants communication/..."

create_empty_file "src/components/communication/CampagneForm.tsx"
create_empty_file "src/components/communication/CampagneList.tsx"
create_empty_file "src/components/communication/MessageCible.tsx"
create_empty_file "src/components/communication/StatsCampagne.tsx"

# ========================
# COMPOSANTS AUDIT
# ========================
print_message "Création des composants audit/..."

create_empty_file "src/components/audit/LogTable.tsx"
create_empty_file "src/components/audit/LogFilters.tsx"
create_empty_file "src/components/audit/LogDetail.tsx"
create_empty_file "src/components/audit/ExportAudit.tsx"

# ========================
# COMPOSANTS SERVICES
# ========================
print_message "Création des composants services/..."

create_empty_file "src/components/services/ServiceList.tsx"
create_empty_file "src/components/services/ServiceForm.tsx"
create_empty_file "src/components/services/HoraireForm.tsx"
create_empty_file "src/components/services/AgentAffectation.tsx"
create_empty_file "src/components/services/ServiceStats.tsx"

# ========================
# COMPOSANTS UTILISATEURS
# ========================
print_message "Création des composants utilisateurs/..."

create_empty_file "src/components/utilisateurs/AgentList.tsx"
create_empty_file "src/components/utilisateurs/AgentForm.tsx"
create_empty_file "src/components/utilisateurs/RoleSelector.tsx"
create_empty_file "src/components/utilisateurs/PermissionMatrix.tsx"

# ========================
# COMPOSANTS PAIEMENTS
# ========================
print_message "Création des composants paiements/..."

create_empty_file "src/components/paiements/PaiementList.tsx"
create_empty_file "src/components/paiements/PaiementForm.tsx"
create_empty_file "src/components/paiements/PaiementStats.tsx"

# ========================
# COMPOSANTS STATS
# ========================
print_message "Création des composants stats/..."

create_empty_file "src/components/stats/RapportPeriodique.tsx"
create_empty_file "src/components/stats/ExportRapport.tsx"
create_empty_file "src/components/stats/KPIsGlobaux.tsx"

# ========================
# RÉCAPITULATIF
# ========================
print_message ""
print_message "✅ Création terminée !"
print_message "📁 Emplacement: $PROJECT_PATH/src/components/"
print_message ""
print_message "📊 Résumé des fichiers créés :"
echo "   - auth/                : 3 fichiers"
echo "   - dashboard/           : 6 fichiers"
echo "   - demandes/            : 7 fichiers"
echo "   - rendez-vous/         : 9 fichiers"
echo "   - etudiants/           : 6 fichiers"
echo "   - documents/           : 6 fichiers"
echo "   - communication/       : 4 fichiers"
echo "   - audit/               : 4 fichiers"
echo "   - services/            : 5 fichiers"
echo "   - utilisateurs/        : 4 fichiers"
echo "   - paiements/           : 3 fichiers"
echo "   - stats/               : 3 fichiers"
echo "   -------------------------------"
echo "   TOTAL                  : 60 fichiers"

exit 0