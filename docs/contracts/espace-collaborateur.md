# Contrat backend — Espace collaborateur (self-service) & rôles

> Objectif : séparer l'**espace collaborateur** (chacun voit/agit sur SES données) de
> l'**espace administration** (gestion org-wide). Le front est déjà structuré en deux
> espaces avec gardes de permission ; il manque deux choses côté backend :
> **(1)** le lien `User ↔ Employe`, **(2)** un jeu d'endpoints « self » `/me/...`.
>
> Statut front : nav par rôle + gardes en place (`apps/app/src/routes/RequirePermission.tsx`,
> `apps/app/src/config/modules.ts`). Les écrans « Mon espace » non encore branchés affichent
> un placeholder (`SelfServicePlaceholder`) en attendant ces endpoints.

---

## 1. Modèle de rôles (RBAC)

Trois rôles, du plus large au plus restreint. Les **permissions** sont la source de
vérité (le front gate la nav dessus) ; les rôles ne sont qu'un regroupement.

| Rôle           | Code           | Permissions (proposées)                                                                 | Voit dans le front |
|----------------|----------------|------------------------------------------------------------------------------------------|--------------------|
| Admin          | `admin`        | `*`                                                                                       | Mon espace + Administration (tout) |
| RH / Manager   | `rh_manager`   | `rh.employe:read`, `rh.employe:write`, `presence:manage`, `rapport:manage`, `document:read`, `document:write`, `recrutement:read`, `recrutement:write` | Mon espace + Administration (sauf Utilisateurs & Paramètres) |
| Collaborateur  | `employee`     | `me:read`, `me:write` (self uniquement) — voir §3                                         | Mon espace seulement |

Permissions utilisées par les **gardes de nav** du front (doivent matcher le RBAC backend) :

| Module front (Administration) | `requires`         |
|-------------------------------|--------------------|
| RH & Personnel / Documents GED| `rh.employe:read`  |
| Présences & Congés            | `presence:manage`  |
| Rapports (consolidation)      | `rapport:manage`   |
| Recrutement                   | `recrutement:read` |
| Utilisateurs & accès          | `user:read`        |
| Paramètres                    | `settings:manage`  |

> ⚠️ `rh_manager` **ne doit pas** recevoir `user:read` ni `settings:manage`
> (Utilisateurs & Paramètres restent réservés à l'admin).
>
> ⚠️ Le rôle `employee` ne doit recevoir **aucune** de ces permissions de gestion :
> il ne voit alors que « Mon espace » côté front, et n'a accès qu'aux endpoints `/me/...`.

---

## 2. Lien `User ↔ Employe`

Aujourd'hui un `User` (compte de connexion) et un `Employe` (fiche RH) ne sont pas reliés.
Pour scoper le self-service, il faut savoir **quel employé est l'utilisateur connecté**.

### 2.1 Donnée

- Ajouter `Employe.userId` (nullable, unique) **ou** `User.employeId` (nullable, unique).
- Le lien se crée :
  - à l'**invitation** d'un collaborateur (« Inviter ce collaborateur » depuis sa fiche), ou
  - au **premier login** par rapprochement sur l'email (`User.email === Employe.email`, même tenant).

### 2.2 Exposition dans `/auth/me`

Ajouter `employeId` (et quelques champs d'affichage) au profil renvoyé :

```jsonc
// GET /auth/me  (inchangé + employee)
{
  "userId": "usr_123",
  "tenantId": "ten_abc",
  "email": "jean.dupont@drwintech.com",
  "roles": ["employee"],
  "permissions": ["me:read", "me:write"],
  "employee": {                 // null si le compte n'est rattaché à aucune fiche
    "employeId": "emp_456",
    "matricule": "MAT-XXXX",
    "prenom": "Jean",
    "nom": "Dupont",
    "poste": "Développeur",
    "departement": "Technique"
  }
}
```

> Le front lit `employee` pour personnaliser l'en-tête « Mon espace » et savoir s'il faut
> afficher un message « votre compte n'est rattaché à aucune fiche RH — contactez les RH ».

---

## 3. Endpoints « self » (`/me/...`)

Tous ces endpoints **dérivent l'employé du token** (jamais d'`employeId` en paramètre).
Permission requise : `me:read` (lecture) / `me:write` (écriture). Retournent **404/409**
si le compte n'est rattaché à aucune fiche. Préfixe : `/api/v1`.

### 3.1 Pointage — « Mon pointage »

```
GET  /me/pointages?from=YYYY-MM-DD&to=YYYY-MM-DD   -> Pointage[]   (les miens)
POST /me/pointages   { type: "ARRIVEE" | "DEPART" }  -> Pointage    (horodaté serveur)
```

### 3.2 Congés — « Mes congés »

```
GET  /me/conges                 -> DemandeConge[]   (les miennes, tous statuts)
POST /me/conges  { type, dateDebut, dateFin, motif? }  -> DemandeConge  (statut EN_ATTENTE)
DELETE /me/conges/:id           -> 204              (annule une demande encore EN_ATTENTE)
```

### 3.3 Rapports — « Mes rapports »

```
GET  /me/rapports?from&to       -> Rapport[]        (les miens)
POST /me/rapports  { date, contenu, statut }  -> Rapport
PUT  /me/rapports/:id  { contenu, statut }     -> Rapport   (si m'appartient & BROUILLON)
```

### 3.4 Documents — « Mes documents »

```
GET  /me/documents              -> Document[]       (ceux qui me sont rattachés : bulletins, contrat, attestations)
GET  /me/documents/:id/download -> binaire          (uniquement les miens)
```

### 3.5 Profil — « Mon profil » (optionnel, v2)

```
GET  /me/profil                 -> infos employé (lecture)
PUT  /me/profil  { telephone?, ... }  -> champs non sensibles éditables par le collaborateur
```

---

## 4. Règles de sécurité (rappel)

1. **Scoping serveur obligatoire** : `/me/...` ignore tout `employeId`/`userId` du body ou
   de la query — l'identité vient du JWT. Un collaborateur ne doit jamais lire les données
   d'un autre, même en forgeant la requête.
2. Les endpoints de **gestion** existants (`/rh/employes`, `/presences`, `/rapports`,
   `/documents`, `/recrutement`, `/users`) doivent **vérifier la permission** correspondante
   (cf. tableau §1) — pas seulement l'authentification. Le front gate déjà la nav, mais le
   backend reste l'autorité (un `employee` ne doit pas pouvoir les appeler en direct).
3. `presence:manage` / `rapport:manage` couvrent l'**approbation** (valider/refuser un congé,
   consolider les rapports d'équipe), réservée à `rh_manager` / `admin`.

---

## 5. Ordre de livraison suggéré

1. `User.employeId` + exposition `employee` dans `/auth/me` + rattachement à l'invitation.
2. Rôle `rh_manager` + permissions, et restriction de `employee` aux seules `me:*`.
3. Endpoints `/me/conges` et `/me/rapports` (les plus utiles au quotidien).
4. `/me/pointages`, puis `/me/documents`.

Dès qu'un bloc est livré, le front remplace le `SelfServicePlaceholder` correspondant par
l'écran branché (hooks react-query sur `/me/...`).

---

_Voir aussi : `docs/contracts/referentiels.md` (départements/services), `docs/contracts/matricule.md`._
