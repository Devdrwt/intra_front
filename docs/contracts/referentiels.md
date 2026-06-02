# Contrat backend — Référentiels d'organisation (départements & services)

> Hand-off front → backend. Objectif : permettre à chaque organisation (tenant) de
> définir ses **départements** et **services**, au lieu des listes codées en dur côté front.
> Réservé aux administrateurs pour l'écriture ; lecture par tout utilisateur authentifié
> (les formulaires RH/Présences/Rapports en ont besoin).

## Portée (V1)

- **Départements** : liste de noms, par tenant.
- **Services** : liste de noms, par tenant, **rattachement optionnel** à un département.

> Hors périmètre V1 (restent des enums système) : `TypeContrat`, `TypeDocument`,
> `TypeConge` — on les rendra configurables plus tard si besoin.

## Modèle Prisma (proposition)

```prisma
model Department {
  id        String   @id @default(uuid()) @db.Uuid
  tenantId  String   @map("tenant_id") @db.Uuid
  name      String
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  services  Service[]
  @@unique([tenantId, name])
  @@index([tenantId])
  @@map("departments")
}

model Service {
  id           String      @id @default(uuid()) @db.Uuid
  tenantId     String      @map("tenant_id") @db.Uuid
  name         String
  departmentId String?     @map("department_id") @db.Uuid
  createdAt    DateTime    @default(now()) @map("created_at")
  updatedAt    DateTime    @updatedAt @map("updated_at")

  department   Department? @relation(fields: [departmentId], references: [id], onDelete: SetNull)
  @@unique([tenantId, name])
  @@index([tenantId])
  @@map("services")
}
```

> Penser à : ajouter `Department` + `Service` à `TENANT_MODELS` (tenant.extension.ts)
> et aux policies RLS (`prisma/sql/rls.sql`).

## Endpoints (préfixe `/api/v1`)

| Méthode | Route               | Permission         | Corps / réponse                              |
| ------- | ------------------- | ------------------ | -------------------------------------------- |
| GET     | `/departments`      | *authentifié*      | → `DepartmentDto[]`                          |
| POST    | `/departments`      | `settings:manage`  | `{ name }` → `DepartmentDto` (201)           |
| PATCH   | `/departments/:id`  | `settings:manage`  | `{ name }` → `DepartmentDto`                 |
| DELETE  | `/departments/:id`  | `settings:manage`  | → 204                                        |
| GET     | `/services`         | *authentifié*      | → `ServiceDto[]` (option `?departmentId=`)   |
| POST    | `/services`         | `settings:manage`  | `{ name, departmentId? }` → `ServiceDto`     |
| PATCH   | `/services/:id`     | `settings:manage`  | `{ name?, departmentId? }` → `ServiceDto`    |
| DELETE  | `/services/:id`     | `settings:manage`  | → 204                                        |

- **Lecture (GET)** : ouverte à tout utilisateur authentifié (les `<Select>` de
  création d'employé, filtres, etc. en dépendent). Pas de permission spéciale.
- **Écriture** : permission **`settings:manage`** (à ajouter au rôle `admin`, déjà `*`).
- **Unicité** : `name` unique par tenant → renvoyer **409** (ou message clair) si doublon.
- **Suppression** : si des employés référencent encore le département/service (champ
  texte `departement`/`service` sur `Employe`), au choix → autoriser (les fiches gardent
  la valeur texte) **ou** renvoyer 409 « encore utilisé ». Préciser le comportement.

## Formes de réponse (DTO)

```ts
interface DepartmentDto { id: string; name: string }
interface ServiceDto    { id: string; name: string; departmentId?: string }
```

## Seed conseillé (pour ne pas partir vide)

Départements : `Administration`, `Production`, `Commercial`, `Direction`.
Services (ex.) : `Ressources Humaines` (Administration), `Ingénierie` / `Design` (Production).

## Côté front (ce que je brancherai dès dispo)

- `features/settings` : service + hooks (`useDepartments`, `useServices`, CRUD).
- **Paramètres → Référentiels** (section admin, gated `settings:manage`) : gérer la liste.
- Remplacement de la constante codée en dur `DEPARTEMENTS` (apps/app `features/rh/mock.ts`)
  par la liste réelle, utilisée dans : création/édition employé, filtres RH, GED, congés,
  et la consolidation des rapports.
- Flag de bascule `VITE_MOCK_SETTINGS` (mock ⇄ réel), comme les autres modules.

## Note RBAC

Ajouter la permission `settings:manage` (et éventuellement `settings:read` si on veut
restreindre la lecture plus tard). L'admin l'a déjà via `*`.
