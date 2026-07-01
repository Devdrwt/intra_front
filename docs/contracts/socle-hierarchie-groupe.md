# Contrat & spec — **Socle hiérarchique Groupe / Région (international multi-filiales)**

> Hand-off de conception (à relire avant tout code). **Lot 1** de la cible « Digital Workplace
> multi-pays » (réf. *Cahier des charges & Plan de chantier*, modèle « boîte de sucre »). On
> **étend** l'architecture multi-tenant existante d'une dimension hiérarchique **au-dessus** de la
> filiale, sans réécrire le filet d'isolation déjà éprouvé.
>
> **Décision d'architecture validée : Option A — étanchéité filiale préservée + chemin de
> consolidation dédié.** La RLS stricte `tenant_id = app_current_tenant()` (~90 tables) **n'est pas
> modifiée**. Les vues Groupe/Région sont des **lectures consolidées** qui rejouent l'existant
> filiale par filiale. Voir [[drwindesk-roadmap]] [[experience]] [[drwindesk-security-audit]].
>
> **Hors périmètre de CE contrat** (lots séparés) : MFA, i18n multi-langue, géoloc/anomalies de
> connexion, audit immuable (hash-chain), moteur de conversion multi-devises. Ce contrat pose
> **uniquement** le socle organisationnel + les rôles de portée + la consolidation en lecture.

---

## 1. Le modèle « boîte de sucre » mappé sur l'existant

```
        🏢 GROUPE (Group)            ← NOUVEAU (table globale, comme Tenant)
              │
        🌍 RÉGION (Region)            ← NOUVEAU (rattachée au Groupe)
              │
        🏬 FILIALE = Tenant           ← EXISTANT (1 filiale = 1 tenant, inchangé)
              │
        🗂 DÉPARTEMENT / Service       ← EXISTANT (Department / Service par tenant)
```

| Niveau | Implémentation | Statut |
|--------|----------------|--------|
| **Groupe** | `Group` (table **globale**, hors RLS tenant, gérée au niveau applicatif comme `Tenant`) | ❌ nouveau |
| **Région** | `Region` (rattachée à `Group`) | ❌ nouveau |
| **Filiale** | `Tenant` (+ `groupId`/`regionId`) — **isolation RLS inchangée** | 🟡 2 colonnes additives |
| **Département** | `Department` / `Service` (déjà par tenant) | ✅ existant |

**Invariant préservé** : aucune donnée métier ne porte de nouvelle dimension ; elle reste isolée
par `tenant_id`. Groupe et Région ne servent qu'à **regrouper des tenants** et à **autoriser des
lectures consolidées**.

---

## 2. Modèle de données (additif)

```prisma
// Racine globale (comme Tenant : PAS dans TENANT_MODELS, PAS de RLS tenant).
model Group {
  id           String   @id @default(uuid()) @db.Uuid
  slug         String   @unique
  name         String
  baseCurrency String   @default("XOF") @map("base_currency") // devise de consolidation
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  regions      Region[]
  tenants      Tenant[]
  @@map("groups")
}

model Region {
  id        String   @id @default(uuid()) @db.Uuid
  groupId   String   @map("group_id") @db.Uuid
  code      String   // ex: "AFRIQUE_OUEST", "EUROPE", "AMERIQUES"
  name      String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  group     Group    @relation(fields: [groupId], references: [id], onDelete: Cascade)
  tenants   Tenant[]
  @@unique([groupId, code])
  @@map("regions")
}

// Tenant (filiale) — additifs nullable (rétro-compatible : l'existant reste valide).
model Tenant {
  // … champs existants …
  groupId   String? @map("group_id")  @db.Uuid
  regionId  String? @map("region_id") @db.Uuid
  countryCode String? @map("country_code") // ISO "BJ", "FR" (fuseaux/devise/jours fériés)
  defaultLocale String @default("fr") @map("default_locale") // prépare l'i18n (lot dédié)
  featureFlags Json   @default("{}") @map("feature_flags")    // modules activés par filiale
  group     Group?  @relation(fields: [groupId],  references: [id], onDelete: SetNull)
  region    Region? @relation(fields: [regionId], references: [id], onDelete: SetNull)
}

// Portée d'un utilisateur au-dessus de sa filiale (défaut = sa filiale uniquement).
// Additif sur User — un Admin Groupe garde une filiale « domicile » mais lit le Groupe.
model User {
  // … champs existants (tenantId reste la filiale domicile) …
  scopeLevel ScopeLevel @default(SUBSIDIARY) @map("scope_level")
  scopeRefId String?    @map("scope_ref_id") @db.Uuid // regionId si REGION, groupId si GROUP
}

enum ScopeLevel { SUBSIDIARY  REGION  GROUP  @@map("scope_level") }
```

- `Group`/`Region` = **tables globales** → **ni dans `TENANT_MODELS`, ni RLS tenant** (comme
  `Tenant` aujourd'hui). `assertTenantModelParity()` n'est pas impacté (aucun `tenantId`).
- `Tenant.groupId/regionId` **nullable** → migration sans rupture ; backfill ensuite (§5).

---

## 3. Claims JWT (additifs)

```ts
interface JwtPayload {
  sub: string; tid: string; email: string; roles: string[]; perms: string[]; // existant
  scope: 'SUBSIDIARY' | 'REGION' | 'GROUP'; // NOUVEAU — portée
  gid?: string;  // groupId (résolu depuis Tenant.groupId) — NOUVEAU
  rid?: string;  // regionId — NOUVEAU
  sref?: string; // scopeRefId (région/groupe ciblé pour REGION/GROUP) — NOUVEAU
}
```

`AuthenticatedUser` et `RequestStore` (AsyncLocalStorage) reçoivent les mêmes champs. **`tid`
reste obligatoire** (filiale domicile) → l'isolation par défaut ne change pas : un utilisateur
`SUBSIDIARY` est strictement enfermé dans son tenant, exactement comme aujourd'hui.

---

## 4. Consolidation Groupe/Région — le cœur d'Option A

Un utilisateur Groupe/Région **ne lit jamais en cross-tenant direct**. Un `ConsolidationService`
**rejoue chaque lecture filiale par filiale**, chacune dans le contexte RLS de SA filiale, puis
**agrège** :

```ts
// Pseudo-code — chaque itération reste sous RLS du tenant courant (zéro fuite).
async function consolidate<T>(tenantIds: string[], read: () => Promise<T>): Promise<T[]> {
  const out: T[] = [];
  for (const tid of tenantIds) {
    await RequestContext.run({ tenantId: tid }, async () => { out.push(await read()); });
  }
  return out; // l'appelant agrège (somme, conversion devise, etc.)
}
```

- `tenantIds` = filiales visibles = `tenants where groupId = gid` (scope GROUP) ou
  `where regionId = sref` (scope REGION). Résolution **serveur**, jamais depuis le front.
- **Lecture seule** : aucune écriture cross-filiale. Le Groupe « lit, ne modifie pas » (contrat du
  cahier des charges).
- ✅ Conséquence sécurité : l'invariant RLS (~90 tables) **reste intact et non modifié**. La
  consolidation ne peut pas, par construction, lire une donnée hors d'un contexte tenant valide.
- Conversion devise : chaque filiale renvoie sa devise (`TenantSettings.currency`) ; l'agrégat
  convertit vers `Group.baseCurrency`. **Le moteur de taux est un lot séparé** ; en V1 du socle,
  on expose les montants **par devise** + total **uniquement si devise unique** (sinon « N/D —
  conversion à venir »).

---

## 5. Migration & backfill (additif, sans rupture)

1. `prisma migrate` : crée `groups`, `regions`, colonnes `Tenant.*`, `User.scope*`. **Aucune RLS
   nouvelle** (Group/Region globales ; cf. note rls.sql sur `tenants`).
2. Seed idempotent : créer `Group "drwintech-group"` + `Region "AFRIQUE_OUEST"` ; rattacher le
   tenant `drwintech` existant (`groupId`, `regionId`, `countryCode="BJ"`).
3. Tous les users existants restent `scopeLevel=SUBSIDIARY` → comportement **identique** à
   aujourd'hui. On promeut ensuite manuellement l'Admin Groupe.
4. Mettre à jour `prisma/sql/rls.sql` **uniquement** par une note : `groups`/`regions` = tables
   globales sans RLS (comme `tenants`). Rien d'autre à toucher.

---

## 6. Rôles (les 6 niveaux du cahier des charges)

| Rôle cahier des charges | Clé / portée | Statut |
|---|---|---|
| Employé | `employee` · SUBSIDIARY | ✅ existant |
| Manager | `manager` · SUBSIDIARY (filtre `managerId`) | ✅ existant |
| RH locale | `rh` · SUBSIDIARY | ✅ existant |
| **Directeur pays** | `admin` (`*`, scopé tenant par RLS) | ✅ existant (= admin filiale) |
| **Admin Groupe** | `admin_groupe` · GROUP · `org:manage` + `group:read` | ❌ nouveau |
| **Super Admin Sécurité** | `secu_admin` · `security:read`/`audit:read`, **aucune donnée métier** | ❌ nouveau |
| (coordination régionale) | `coord_region` · REGION · `region:read` | ❌ nouveau (optionnel) |

**Permissions additives** : `org:manage` (créer/configurer filiales/régions), `group:read`,
`region:read`, `security:read`. Le Super Admin Sécurité **n'a pas** de permission métier : il voit
l'audit + la console sécurité, **jamais** les RH/finances (garde-fou explicite du cahier).

---

## 7. Endpoints (préfixe `/api/v1`)

| Méthode | Route | Permission | Rôle / objet |
|---|---|---|---|
| POST | `/groups`, `/regions` | `org:manage` | Admin Groupe — structurer l'organisation |
| POST | `/tenants` | `org:manage` | créer une filiale (pays, devise, langue, fuseau) |
| PATCH | `/tenants/:id` | `org:manage` | config filiale + **feature flags** |
| GET | `/org/tree` | `group:read`/`region:read` | arbre Groupe→Région→Filiale→Dept |
| GET | `/group/cockpit` (`?periode`) | `group:read` | KPI **consolidés** (effectifs, activité…) |
| GET | `/group/effectifs` | `group:read` | RH consolidé (par filiale + total) |
| GET | `/region/:id/cockpit` | `region:read` | idem, périmètre région |

> Lecture/agrégation seulement (cf. §4). **Cache court Redis** (30-60 s) recommandé. Réutilise les
> agrégats `/direction/cockpit` ([[experience]]) en les **bouclant par filiale**.

---

## 8. Plan de tests (invariants de sécurité — non négociables)

1. Un user `SUBSIDIARY` (filiale BJ) **ne voit jamais** une donnée d'une autre filiale (test RLS
   inchangé, doit rester vert).
2. Un user `GROUP` (`group:read`) obtient le **consolidé en lecture**, mais **toute écriture**
   ciblant une autre filiale est **refusée** (pas de chemin d'écriture cross-tenant).
3. `secu_admin` lit l'audit mais reçoit **403/0 ligne** sur tout endpoint métier (RH, finance…).
4. `consolidate()` exécuté sans `gid/sref` valides → **fail-closed** (aucune itération).
5. `assertTenantModelParity()` reste vert (Group/Region sans `tenantId`).

---

## 9. Récap pour le co-dev backend

| # | Changement | Type |
|---|-----------|------|
| 1 | Modèles `Group`, `Region` (globaux, hors RLS) | additif |
| 2 | `Tenant.groupId/regionId/countryCode/defaultLocale/featureFlags` (nullable) | additif |
| 3 | `User.scopeLevel/scopeRefId` (+ enum `ScopeLevel`) | additif |
| 4 | Claims JWT `scope/gid/rid/sref` + `RequestStore` + `AuthenticatedUser` | additif |
| 5 | `ConsolidationService` (boucle par filiale sous RLS) + endpoints `/group`,`/region`,`/org` | additif |
| 6 | Rôles `admin_groupe`, `coord_region`, `secu_admin` + perms `org:manage/group:read/region:read/security:read` | RBAC/seed |
| 7 | Migration + backfill (Groupe/Région par défaut, tenant drwintech rattaché) | migration |
| 8 | Tests d'invariants (§8) | tests |

> **Aucune modification de la RLS existante. Aucune dépendance bloquante.** Le socle est purement
> additif : tant qu'aucun user n'est promu `GROUP/REGION`, le comportement est identique à
> aujourd'hui. Lots suivants : **MFA** (durcissement), **i18n** (fr+en), **géoloc/anomalies**,
> **audit hash-chain**, **conversion multi-devises**, puis **features cross-filiale** (annonces
> Groupe/Région, projets inter-filiales, recherche fédérée).
</content>
