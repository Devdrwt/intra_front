# Contrat backend — **Recherche globale** (+ palette `Cmd+K`)

> Hand-off front → backend. Dernière pierre de la **couche moteurs** ([[drwindesk-roadmap]]).
> Objectif : une **barre unique** qui cherche **à travers tous les modules** (employés, tickets,
> documents, demandes, utilisateurs, articles KB…), **permission-aware**, branchée sur le
> **`CommandPalette` existant**. Synergie : l'index est alimenté par le **bus d'événements**
> ([[evenements-notifications]]) → **3ᵉ consommateur du bus** (notifier / journaliser / **indexer**).
>
> **Choix d'infra (important)** : Meilisearch **n'est pas déployé**. Plutôt qu'opérer un service
> de plus depuis le Bénin (coût ops), **V1 = index unifié en PostgreSQL** (table `SearchDocument`
> + full-text/trigram), **zéro nouvelle infra**. **V2 = Meilisearch** (même source) si le volume
> / la tolérance aux fautes le justifient. L'abstraction `SearchService` cache le moteur → swap
> sans toucher aux modules.

---

## Existant (à conserver / faire évoluer)

- **`CommandPalette`** (`apps/app/src/components/CommandPalette.tsx`) : `Cmd+K`, sections
  **« Aller à »** (modules, gated par permission) + **« Actions »**. **Filtrage client d'une
  liste statique** — aucune donnée métier. → On **ajoute** une section « Résultats » live.
- Filtres **locaux** par module (RH `?search=`, etc.) : **restent** (recherche fine intra-module).
- **Pas** de module `search` backend, **pas** de Meilisearch.

---

## Architecture cible

```
 Modules ─emit─► BUS ([[evenements-notifications]])
                  └─► IndexSubscriber  @OnEvent('*.created'|'*.updated'|'*.deleted')
                          │  upsert / delete
                          ▼
                   SearchDocument (PG, dénormalisé, tenant-scopé)   ──V2──► Meilisearch
                          ▲
        GET /search?q=… ──┘  (SearchService : filtre tenant + permissions + ownership)
```

Un module **n'indexe pas lui-même** : il **émet** ses événements (déjà prévu), un **abonné**
maintient l'index. Même bus, même vocabulaire `domaine.objet.verbe`.

---

## Partie 1 — Index unifié `SearchDocument` (V1, PostgreSQL)

```prisma
model SearchDocument {
  id          String   @id @default(uuid()) @db.Uuid
  tenantId    String   @map("tenant_id") @db.Uuid
  type        String   // 'employe' | 'ticket' | 'document' | 'absence' | 'user' | 'kb_article'…
  entityId    String   @map("entity_id") @db.Uuid   // l'id réel dans son module
  title       String                                 // "Jean Dupont", "TKT-2026-0001 — VPN HS"
  subtitle    String?                                // "Développeur · IT", "Priorité haute"
  body        String?  @db.Text                      // texte cherchable additionnel
  url         String                                 // route front "/rh/<id>", "/support/<id>"
  // Permission requise pour VOIR ce doc (null = tout authentifié). Filtre les résultats.
  permission  String?  @map("permission")
  // Restriction propriétaire (ex. ticket visible par son demandeur même sans support:read)
  ownerId     String?  @map("owner_id") @db.Uuid
  keywords    String?                                // tags / synonymes concaténés
  updatedAt   DateTime @updatedAt @map("updated_at")

  @@unique([tenantId, type, entityId])
  @@index([tenantId, type])
  @@map("search_documents")
  // + index full-text PG (raw SQL) : to_tsvector('french', title||' '||coalesce(subtitle,'')||' '||coalesce(body,''))
  //   et/ou pg_trgm sur title pour la tolérance partielle. (migration SQL dédiée, comme rls.sql)
}
```

> **À ne pas oublier** : `SearchDocument` dans **`TENANT_MODELS`** + **RLS** + `tenantId` du JWT.
> L'index GIN full-text/trigram se pose en SQL brut (cf. pattern `prisma/sql/rls.sql`).

### Alimentation (IndexSubscriber)
- `@OnEvent('**')` filtre les événements indexables (catalogue : quels `type` sont cherchables).
- `created`/`updated` → `upsert` du `SearchDocument` (le subscriber sait, par `type`, comment
  construire `title/subtitle/url/permission/ownerId` depuis le payload).
- `deleted` → `delete` du doc.
- **Backfill initial** : commande/seed `search:reindex` qui balaie les tables existantes et
  (re)construit l'index (idempotent). À lancer une fois + après changement de mapping.

---

## Partie 2 — Endpoint `GET /search`

```
GET /search?q=<texte>&types=ticket,employe&limit=8   (authentifié)
→ {
    query: string,
    groups: [
      { type: 'employe', label: 'Employés', items: SearchHit[] },
      { type: 'ticket',  label: 'Tickets',  items: SearchHit[] },
    ]
  }
```
- `q` court-circuité si < 2 caractères (→ `groups: []`).
- `types` optionnel (filtre). `limit` par type (défaut 5–8).
- Tri : pertinence full-text, puis `updatedAt` desc.

```ts
interface SearchHit {
  type: string; entityId: string;
  title: string; subtitle?: string; url: string;
}
interface SearchGroup { type: string; label: string; items: SearchHit[] }
interface SearchResponse { query: string; groups: SearchGroup[] }
```

---

## Partie 3 — Filtrage permissions (non négociable, côté serveur)

Un résultat n'est renvoyé que si l'utilisateur a le **droit de voir l'objet** :
```
WHERE tenantId = <jwt>                      -- RLS
  AND (permission IS NULL                    -- public authentifié
       OR <user a la permission>             -- ex. 'support:read', 'rh.employe:read'
       OR ownerId = <userId>)                -- propriétaire (ses propres tickets/demandes)
  AND <match full-text sur q>
```
- Le `permission`/`ownerId` est **figé dans le `SearchDocument`** au moment de l'indexation
  (dénormalisé) → filtrage rapide, pas de jointure cross-module à la volée.
- **Jamais** de filtrage côté front : le backend ne renvoie que l'autorisé.
- Le mapping `type → permission` doit rester **cohérent** avec les permissions de lecture des
  modules (`employe → rh.employe:read`, `ticket → support:read`, `document → document:read`…).

---

## Partie 4 — `CommandPalette` (front) : section « Résultats » live

- Garder **« Aller à »** + **« Actions »** (client, instantané).
- Ajouter **« Résultats »** : sur saisie (≥ 2 car., **debounce ~200 ms**), appel
  `GET /search?q=` → groupes cliquables qui **naviguent vers `hit.url`**.
- États : chargement (spinner discret), vide (« Aucun résultat »), erreur (silencieuse → on
  garde nav/actions). Navigation clavier déjà en place (↑/↓/Entrée) → l'étendre aux résultats.
- `features/search` : `searchService.query(q, types?)` + hook `useGlobalSearch(q)`
  (react-query, `keepPreviousData`). Flag `VITE_MOCK_SEARCH`.
- Aucune autre page : la recherche **vit dans la palette** (et, plus tard, une barre dans le header).

---

## Partie 5 — V2 : bascule Meilisearch (si justifié)

- Même **source** (`SearchDocument`) → l'`IndexSubscriber` écrit *aussi* dans Meili ; `SearchService`
  lit Meili au lieu de PG. Gains : tolérance aux fautes, ranking, surlignage, instantané à l'échelle.
- Déclencheur de bascule : volume élevé / besoin de typo-tolérance ressenti. **Pas avant.**
- Reindex `search:reindex` réutilisé pour peupler Meili. Env `MEILI_HOST`/`MEILI_KEY`.

---

## RBAC

- `GET /search` : **tout utilisateur authentifié** (le filtrage par `permission`/`ownerId` se
  fait dans les résultats, pas sur l'accès à l'endpoint).
- Reindex (`search:reindex`) : **admin** / commande backend, pas exposé en UI publique
  (ou `settings:manage` si bouton « réindexer »).

---

## Récap des changements (pour le co-dev backend)

| # | Changement | Type |
|---|-----------|------|
| 1 | Modèle `SearchDocument` + TENANT_MODELS + RLS + index full-text/trigram (SQL) | additif schema |
| 2 | `IndexSubscriber` (`@OnEvent`) upsert/delete depuis le bus ([[evenements-notifications]]) | additif |
| 3 | Mapping `type → {title,subtitle,url,permission,ownerId}` par entité indexable | additif |
| 4 | `SearchService` + `GET /search` (groupé, permission/owner-filtré) | additif |
| 5 | Commande `search:reindex` (backfill idempotent) | additif |
| 6 | Front : section « Résultats » live dans `CommandPalette` + `features/search` | front |
| 7 | (V2) bascule Meilisearch — même source, swap dans `SearchService` | différé |

> **Dépend du bus d'événements** ([[evenements-notifications]]) pour l'alimentation temps réel.
> Tant qu'il n'est pas là : (1)(4)(5) marchent déjà (index peuplé par `reindex` + upsert direct
> dans les services), (2) se branche quand le bus est posé.
