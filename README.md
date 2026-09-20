# Poramma — Portail Agents (frontend-embassy)

Portail d'administration et de traitement consulaire à destination des agents de l'ambassade (Ambassadeur, Admin, Agent Senior, Agent, Accueil, Auditeur). Ce dépôt est le **frontend** (React + Vite) ; ce document décrit tout ce qui est nécessaire pour le brancher à un **backend réel**.

> Frontend « miroir » côté usagers : `frontend-community` (portail étudiant/citoyen qui soumet les `Demande`, consulte ses documents, prend rendez-vous, etc.). Les deux frontends consomment la même API backend.

## ⚠️ État actuel : backend simulé (mock)

**Aucun appel réseau réel n'est effectué aujourd'hui.** Tous les stores Zustand (`src/store/*.ts`) simulent le comportement du backend en mémoire (délais artificiels via `setTimeout`, données statiques). Chaque action de store contient déjà :

- un bloc de commentaire décrivant le contrat backend attendu (méthode, route, body, réponse) ;
- le **code d'intégration réel, commenté**, prêt à être décommenté dès que l'endpoint existe côté serveur (recherchez `── BACKEND INTEGRATION ──` dans `src/store/`).

Exemple (`src/store/demandeStore.ts`) :

```ts
// ── BACKEND INTEGRATION ──
// const { data } = await api.get('/demandes', { params: { ...get().filters, ...filters } });
```

L'intégration consiste donc, pour chaque store, à **remplacer la simulation par l'appel `api.*` commenté**, sans changer la forme des données retournées aux composants (les types de `src/types/` font foi).

## Stack technique

- **React 19** + **TypeScript** + **Vite 6**
- **Zustand** (state management, avec persistance `localStorage` pour l'auth)
- **Axios** pour les appels HTTP (instance centralisée)
- **React Router v7**, **Tailwind CSS v4**
- Basé sur le template **TailAdmin React** (voir `package.json` → `"name": "tailadmin-react"`)
- `zod` disponible pour la validation de formulaires/payloads

## Prérequis

- Node.js ≥ 18
- npm (le repo utilise `package-lock.json`)

## Installation & démarrage

```bash
npm install
cp .env.example .env      # puis ajuster VITE_API_URL
npm run dev                # démarre Vite sur http://localhost:5173
```

Scripts disponibles (`package.json`) :

| Script | Effet |
|---|---|
| `npm run dev` | Serveur de dev Vite (port 5173, `strictPort: true`) |
| `npm run build` | Vérification TypeScript (`tsc -b`) puis build de production |
| `npm run preview` | Sert le build de production localement |
| `npm run lint` | ESLint |

Le serveur de dev (`vite.config.ts`) écoute sur toutes les interfaces (`host: true`), a CORS activé et autorise les sous-domaines `*.ngrok-free.app` — utile pour exposer le front à un backend testé à distance ou pour démo mobile.

## Variables d'environnement

Fichier `.env.example` à copier en `.env` :

| Variable | Défaut | Lue dans le code ? | Rôle |
|---|---|---|---|
| `VITE_API_URL` | `http://localhost:3000` | ✅ `src/lib/api.ts` | Base URL de l'API. **Le code ajoute son propre fallback `/api`** : si la variable n'est pas définie, `baseURL = 'http://localhost:3000/api'`. Si vous la définissez, pensez à inclure le préfixe `/api` vous-même (ex: `https://api.mondomaine.tld/api`). |
| `VITE_MOCK_MODE` | *(absente de `.env.example`)* | ✅ `src/lib/rbac.ts` (`isMockMode()`) | Si `'true'` **ou** si `VITE_API_URL` est vide → mode mock. À ajouter explicitement à `.env` (`VITE_MOCK_MODE=false`) une fois le backend branché. |
| `VITE_ENABLE_MFA` | `true` | ⛔ pas encore lue dans `src/` | Réservée pour activer/désactiver le flux MFA (`authStore.verifyMFA`) une fois l'intégration réelle faite. |
| `VITE_ENABLE_AUDIT` | `true` | ⛔ pas encore lue dans `src/` | Réservée pour activer/désactiver les écrans d'audit. |
| `VITE_APP_NAME` | `Ambassade du Mali` | ⛔ pas encore lue dans `src/` | Réservée (nom affiché dans l'UI). |
| `VITE_APP_VERSION` | `1.0.0` | ⛔ pas encore lue dans `src/` | Réservée. |

## Couche HTTP (`src/lib/api.ts`)

Instance Axios unique, importée partout via `import { api } from '../lib/api'` :

- **Base URL** : `import.meta.env.VITE_API_URL` (fallback `http://localhost:3000/api`)
- **Timeout** : 30 000 ms
- **Headers par défaut** : `Content-Type: application/json`, `Accept: application/json`

**Intercepteur de requête :**
- Ajoute `Authorization: Bearer {token}` — le token est lu dans `localStorage.getItem('poramma_access_token')`.
  ⚠️ En dev (`import.meta.env.DEV`), un `mock-jwt-token-{timestamp}` est envoyé s'il n'y a pas de vrai token — **à retirer/adapter lors du branchement réel** pour ne pas envoyer de faux Bearer token à une vraie API.
- Ajoute `X-Session-Id` si présent dans `localStorage.getItem('poramma_session_id')` (traçabilité/audit).
- Log console de chaque requête en dev.

**Intercepteur de réponse :**

| Statut HTTP | Comportement front |
|---|---|
| `401` | Tente un refresh via `localStorage.getItem('poramma_refresh_token')`, rejoue la requête originale une seule fois (`_retry`). Le refresh réel (`POST /api/auth/refresh`) est **commenté** — actuellement mocké. Si le refresh échoue → `useAuthStore.logout()` + redirection `/login?reason=session_expired`. |
| `403` | Redirection vers `/unauthorized`. |
| `422` | Rejette une `ApiValidationError` avec `error.response.data.details` (map `{champ: string[]}`). |
| `429` | Rejette une `ApiRateLimitError`. |
| `500/502/503/504` | Rejette une `ApiServerError`. |
| Pas de `error.response` | Rejette une `ApiNetworkError` (offline/timeout). |

Le backend doit donc retourner les erreurs de validation sous la forme :
```json
{ "code": "VALIDATION_ERROR", "message": "...", "details": { "email": ["Email invalide"] }, "timestamp": "..." }
```

**Helpers exposés :**
- `uploadFile(file, onProgress?)` → `POST /upload` en `multipart/form-data`, retourne `{ fileId, url }` (via `response.data.data`).
- `exportDocument(endpoint, params, filename)` → `GET {endpoint}` avec `responseType: 'blob'`, déclenche un téléchargement navigateur.

## Authentification & sécurité

### Flux JWT attendu

| Action | Endpoint backend attendu | Store |
|---|---|---|
| Connexion | `POST /api/auth/login` — body `{ email, password, mfaCode? }` → réponse `{ token, refreshToken, user: Utilisateur }` | `authStore.login` |
| Déconnexion | `POST /api/auth/logout` (header `Authorization`) | `authStore.logout` |
| Refresh token | `POST /api/auth/refresh` — body `{ refreshToken }` → `{ token, user }` | `authStore.refreshSession` + intercepteur 401 |
| Vérification MFA | `POST /api/auth/mfa/verify` — body `{ code }` → `{ valid: boolean }` | `authStore.verifyMFA` |
| Changement de rôle actif | `POST /api/auth/switch-role` — body `{ roleId }`, puis `GET /api/auth/me` | `authStore.switchRole` |
| Utilisateur courant | `GET /api/auth/me` | — |
| Rôles disponibles | `GET /api/auth/roles` | — |
| Permissions de l'utilisateur courant | `GET /api/auth/permissions` | — |

### Stockage côté client

- `localStorage['poramma_access_token']` — access token JWT
- `localStorage['poramma_refresh_token']` — refresh token
- `localStorage['poramma_session_id']` — ID de session pour l'audit (envoyé en header `X-Session-Id`)
- `localStorage['poramma-auth-storage']` — état Zustand persisté (`{ user, isAuthenticated, mfaVerified }`) via `zustand/middleware persist`

**Actuellement, `authStore.login` est entièrement mocké** : le mot de passe accepté est en dur (`Poramma2026!`) et le profil retourné dépend de mots-clés dans l'email (`admin`, `ambassador`/`ambassadeur`, `reception`/`accueil`, sinon agent standard). À remplacer par le vrai appel `POST /api/auth/login` (voir commentaires dans `src/store/authStore.ts`).

### RBAC (contrôle d'accès par rôle)

Hiérarchie à 6 niveaux (1 = accès total, 6 = lecture seule), définie dans `src/config/roles.ts` (`ROLES_CONFIG`) et `src/types/auth.ts` (`RoleName`) :

| Niveau | Rôle | Résumé |
|---|---|---|
| 1 | `AMBASSADOR` | Carte blanche — toutes permissions, quoi qu'il arrive |
| 2 | `ADMIN` | Config système, gestion services/agents/rôles, audit, stats |
| 3 | `SENIOR_AGENT` | Validation/rejet des demandes, supervision (max 12 rdv/jour) |
| 4 | `AGENT` | Traitement standard des demandes (max 8 rdv/jour) |
| 5 | `RECEPTIONIST` | RDV d'urgence (`rdv:create-urgence`), impression planning (`rdv:print-daily`) |
| 6 | `AUDITOR` | Lecture seule + export d'audit/stats |

Permissions granulaires au format `{ressource}:{action}` (enum `PermissionCode`, matrice complète dans `src/config/permissions.ts` avec un `minRoleLevel` par permission). Le backend doit implémenter la même matrice côté serveur (ne jamais faire confiance au RBAC frontend seul).

`src/lib/rbac.ts` fournit `buildRbacHeaders(userId, roleName, permissions)` qui génère :
```
X-User-Id: ...
X-User-Role: ...
X-User-Permissions: demande:read,demande:validate,...
```
Ces headers ne sont **pas encore branchés dans l'intercepteur Axios** — à ajouter si le backend souhaite s'appuyer dessus en plus du JWT (le JWT décodé côté serveur reste la source de vérité recommandée).

## Contrat d'API attendu (par domaine)

Toutes les routes ci-dessous sont relatives à `VITE_API_URL` (ex: `/demandes` → `{VITE_API_URL}/demandes`). Elles sont extraites des appels `api.*` déjà écrits (commentés) dans les stores — donc **exactement** ce que le frontend appellera une fois débranché du mock.

#### Auth — `src/store/authStore.ts`
`POST /auth/login` · `POST /auth/logout` · `POST /auth/refresh` · `POST /auth/switch-role` · `GET /auth/me`

#### Agents (personnel consulaire) — `src/store/agentsStore.ts`
`GET /agents` · `GET /agents/:id` · `POST /agents` · `PATCH /agents/:id` · `DELETE /agents/:id` · `PATCH /agents/:id` (toggle `active`)

#### Profil agent connecté — `src/store/agentProfileStore.ts`
`GET /profile` · `PATCH /profile` · `PATCH /profile/preferences` · `POST /profile/password` · `POST /profile/signature` (multipart) · `DELETE /profile/signature` · `PUT /profile/availabilities` · `GET /profile/activities?offset=&limit=`

#### Rôles & permissions — `src/store/rolesStore.ts`
`GET /roles` · `GET /roles/:id` · `POST /roles` · `PATCH /roles/:id` · `DELETE /roles/:id` · `GET /permissions` · `POST /roles/:roleId/permissions` · `DELETE /roles/:roleId/permissions/:permissionCode` · `POST /users/:userId/roles` · `DELETE /users/:userId/roles/:roleId`

#### Services consulaires — `src/store/serviceStore.ts`
`GET /services` · `POST /sub-services` · `PATCH /sub-services/:id` · `POST /sub-services/:id/schedules` · `PATCH /schedules/:id` · `DELETE /schedules/:id` · `POST /sub-services/:id/exceptions` · `DELETE /exceptions/:id` · `POST /sub-services/:id/requirements` · `PATCH /requirements/:id` · `DELETE /requirements/:id`

#### Demandes (workflow consulaire) — `src/store/demandeStore.ts`
`GET /demandes` (paginé + filtres) · `GET /demandes/:id` · `POST /demandes` · `PATCH /demandes/:id/status` · `POST /demandes/:id/assign` · `POST /demandes/:id/comments` · `GET /demandes/:id/history` · `GET /demandes/:id/comments` · `GET /demandes/:id/requirements` · `PATCH /demandes/requirements/:requirementId` · `GET /demandes/stats` *(optionnel)*

Workflow de statut (`AppStatus`) : `DRAFT → SUBMITTED → IN_REVIEW → (ADDITIONAL_INFO_REQUIRED | UNDER_VERIFICATION) → (APPROVED | REJECTED) → COMPLETED`, plus `CANCELLED` et `ARCHIVED`. `Priority` : `LOW | NORMAL | HIGH | URGENT`.

#### Rendez-vous — `src/store/rendezVousStore.ts`
`GET /agenda-slots?date=&subServiceId=&agentId=` · `GET /agenda-slots/:slotId` · `GET /rendez-vous?date=&agentId=` · `POST /rendez-vous` · `POST /rendez-vous/urgence` (perm. `rdv:create-urgence`) · `PATCH /rendez-vous/:id/status` (couvre check-in/complete via `status`) · `POST /rendez-vous/:id/cancel` · `POST /rendez-vous/print-daily` (perm. `rdv:print-daily`) · `GET /rendez-vous/print-history?date=` · `POST /rendez-vous/print/:id/reprint`

`RDVType` : `STANDARD | URGENCE | PRIORITAIRE | SUIVI`. `RDVStatus` : `PENDING | CONFIRMED | CHECKED_IN | IN_PROGRESS | COMPLETED | MISSED | CANCELLED_BY_USER | CANCELLED_BY_AGENT | NO_SHOW`. Les créneaux (`AgendaSlot`) sont générés côté backend à partir de `ServiceSchedule` + `AgentAvailability`.

#### Documents / GED — `src/store/documentStore.ts`
`GET /documents` (paginé + filtres) · `GET /documents/:id` · `POST /documents/upload` (multipart) · `PATCH /documents/:id/validate` · `GET /documents/:id/versions` · `GET /documents/download/:fileId` (→ URL présignée type S3/MinIO) · `PATCH /documents/:id/archive` · `GET /documents/search?q=` · `GET /document-categories` · `GET /documents/stats` · `GET /documents/audit?documentId=` · `GET /internal-documents` · `POST /internal-documents` (multipart) · `GET /generated-documents?studentUserId=` · `POST /generated-documents` · `PATCH /generated-documents/:id/revoke`

#### Étudiants — `src/store/etudiantStore.ts`
`GET /etudiants` (paginé + filtres) · `GET /etudiants/:id` · `PATCH /etudiants/:id/validate` · `PATCH /documents/:documentId/validate` · `GET /etudiants/:etudiantId/documents` · `GET /etudiants/stats` *(optionnel)*

#### Communication — `src/store/communicationStore.ts`
`GET /communication/campagnes` · `GET /communication/campagnes/:id` · `POST /communication/campagnes` · `PATCH /communication/campagnes/:id` · `POST /communication/campagnes/:id/send` · `PATCH /communication/campagnes/:id/schedule` · `PATCH /communication/campagnes/:id/cancel` · `POST /communication/campagnes/:id/duplicate` · `GET /communication/campagnes/:id/deliveries` · `POST /communication/campagnes/:id/resend-failed` · `POST /communication/campagnes/:id/attachments` (multipart) · `DELETE /communication/campagnes/:id/attachments/:attachmentId` · `PATCH /communication/campagnes/:id/attachments/reorder` · `POST /communication/campagnes/estimate` · `GET /notifications` · `PATCH /notifications/:id/read` · `PATCH /notifications/read-all`

Pas de WebSocket/SSE dans le code actuel : les notifications et messages sont en polling/fetch classique. À prévoir côté backend si du temps réel est souhaité pour la messagerie (`Message`, `Thread`) ou les notifications.

#### Audit — `src/store/auditStore.ts`
`GET /audit/logs` (paginé + filtres) · `GET /audit/logs/:id` · `POST /audit/export` (`responseType: blob`, formats à définir) · `GET /audit/stats`

#### Générique — `src/lib/api.ts`
`POST /upload` (upload générique avec progression) · `GET /export/:type` (export PDF/Excel générique, blob)

## Format des réponses attendu

Défini dans `src/types/api.ts` — le backend doit envelopper ses réponses ainsi :

```ts
interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string | null;
  meta?: PaginationMeta;
}

interface PaginationMeta {
  page: number; limit: number; total: number; totalPages: number;
  hasNext: boolean; hasPrev: boolean;
}

interface ApiError {
  code: string;
  message: string;
  details: Record<string, string[]> | null; // erreurs de validation par champ
  timestamp: string;
}
```

Paramètres de requête standard pour les listes paginées (`PaginatedParams`) :
```ts
{ page?, limit?, sortBy?, sortOrder?: 'asc' | 'desc', search?, filters?: Record<string, unknown> }
```

## Modèles de données

Toutes les entités métier sont typées dans `src/types/` (source de vérité pour la forme des payloads/réponses) :

| Fichier | Entités principales |
|---|---|
| `types/auth.ts` | `Utilisateur`, `UserProfile`, `Role`, `Permission`, `UserRole`, `Agent`, `AgentServiceAssignment`, `AgentAvailability`, `AgentException` |
| `types/demande.ts` | `Demande`, `DemandeRequirement`, `DemandeDocument`, `DemandeHistory`, `DemandeComment` |
| `types/rendez-vous.ts` | `AgendaSlot`, `RendezVous`, `RendezVousNote`, `DailySchedulePrint` |
| `types/services.ts` | `Service`, `SubService`, `ServiceSchedule`, `ServiceException`, `Requirement` |
| `types/document.ts` | `DocumentGED`, `StoredFile`, `DocumentVersion`, `DocumentCategory`, `InternalDocument`, `GeneratedDocument`, `DocumentAuditLog`, `DocumentStats` |
| `types/etudiant.ts` | `Etudiant`, `EtudiantProfile`, `Bourse`, `EtudiantDocument` |
| `types/communication.ts` | `Campagne`, `CampagneDelivery`, `CampagneAttachment`, `Notif`, `Message`, `Thread`, `ThreadParticipant` |
| `types/audit.ts` | `AuditLog`, `AuditSeverity` |
| `types/profile.ts` | `AgentProfileData`, `AgentPreferences`, `ActivityLogEntry` |
| `types/api.ts` | `ApiResponse`, `ApiError`, `PaginationMeta`, `PaginatedParams` |

Tous les enums (`AppStatus`, `RDVStatus`, `PermissionCode`, etc.) sont réexportés depuis `src/types/index.ts` — les valeurs string de ces enums **sont les valeurs exactes attendues** en provenance/à destination du backend.

## Checklist d'intégration backend

1. Implémenter les endpoints listés ci-dessus avec l'enveloppe `ApiResponse<T>` et les codes d'erreur (`401/403/422/429/5xx`) attendus par l'intercepteur Axios.
2. Définir `VITE_API_URL` (avec le préfixe `/api` inclus) et `VITE_MOCK_MODE=false` dans `.env`.
3. Dans `src/lib/api.ts`, retirer le `mockToken` de dev dans l'intercepteur de requête et implémenter le vrai `POST /auth/refresh` dans l'intercepteur 401 (code déjà écrit en commentaire).
4. Dans chaque store (`src/store/*.ts`), décommenter les appels `await api.*` marqués `── BACKEND INTEGRATION ──` et retirer la logique de simulation (mock data + `setTimeout`) autour.
5. Vérifier que chaque enum (`RoleName`, `PermissionCode`, `AppStatus`, `RDVStatus`, `RDVType`, `DocStatus`, etc.) correspond exactement aux valeurs renvoyées par le backend.
6. Faire correspondre le RBAC serveur à `src/config/roles.ts` / `src/config/permissions.ts` (source de vérité fonctionnelle actuelle, à répliquer côté API — ne jamais se fier uniquement au frontend pour l'autorisation).
7. Pour les uploads (`documents`, `internal-documents`, `communication attachments`, `profile/signature`), prévoir un stockage objet (S3/MinIO) — le contrat prévoit des URLs présignées pour le téléchargement (`GET /documents/download/:fileId`).

## Structure du projet (aperçu)

```
src/
  components/   composants UI par domaine (demandes, rendez-vous, documents, etudiants, paiements, ...)
  config/       matrices RBAC (roles.ts, permissions.ts), navigation, libellés de documents
  context/      contextes React transverses
  hooks/        hooks partagés
  layout/       shell applicatif (sidebar, header, ...)
  lib/          api.ts (Axios), rbac.ts (helpers RBAC)
  pages/        pages routées, un dossier par domaine métier
  routes/       définition des routes + guards (RBAC par route)
  store/        stores Zustand = couche "service" (à brancher au backend)
  types/        contrats de données (source de vérité)
```

## Notes diverses

- `chat.html` à la racine est un fragment de template statique (Alpine.js) hérité de TailAdmin — il n'est **pas** intégré à l'application React buildée via Vite (`index.html` est le point d'entrée réel). Ne pas s'y fier pour la messagerie réelle, voir plutôt `src/pages/Chat` et `types/communication.ts` (`Message`, `Thread`).
- `create_missing_components.sh` / `create_structure_safe.sh` sont des scripts d'échafaudage de développement, sans lien avec le backend.

## Licence

Voir [LICENSE.md](LICENSE.md).
