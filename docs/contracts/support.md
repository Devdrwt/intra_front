# Contrat backend — Module **Support interne** (tickets / helpdesk)

> Hand-off front → backend. Objectif : doter DrwinDesk d'un **helpdesk interne** —
> les collaborateurs ouvrent des **tickets** (incident IT, demande RH, moyens généraux…),
> un agent les prend en charge, avec **SLA** (délais de réponse/résolution) et
> **base de connaissances** en self-service.
>
> **Origine** : modèle métier extrait de `Task360 Pro` (`sys_ticket_back`, NestJS+TypeORM+MySQL),
> **re-coulé** ici aux conventions DrwinDesk (Prisma + PostgreSQL, `tenantId` dans le JWT,
> RLS, permissions `support:*`). Ce n'est PAS une reprise de code : seul le **design** est repris.
>
> ⚠️ **Ne pas confondre** avec « Mes demandes » (congés/présences, module `presences`).
> Ici = tickets de support transverses. Nom de module : **`support`**.

---

## Périmètre

### V1 (cœur helpdesk) — à livrer d'abord
- **Tickets** : création, statuts, priorités, types, assignation, escalade, commentaires.
- **Commentaires** : publics (visibles du demandeur) / internes (agents) / système (auto).
- **Pièces jointes** : via le **pattern presign S3 déjà acté** (flag OFF tant que le backend
  n'a pas l'infra presign — cf. [[upload-s3]] / mémoire stack). Métadonnées seules sinon.
- **SLA** : politiques par priorité + minuteurs réponse/résolution + **cron de vérification**
  des dépassements (warning / breached) → branché sur le module **`notifications` EXISTANT**.

### V2 (différé, marqué pour plus tard)
- **Base de connaissances** (`KbArticle`) — articles self-service, vues, « utile / pas utile ».
- **Workflows / automatisation** — règles déclenchées (assignation auto, escalade auto…).
- **Satisfaction (CSAT)**, **champs personnalisés**, **email-to-ticket**, **équipes/files**.

> Tout ce qui suit après la ligne « ── V2 ──» est documenté pour mémoire mais **hors V1**.

---

## Modèle Prisma (V1)

```prisma
enum TicketStatus {
  NEW          // nouveau, non pris en charge
  ASSIGNED     // assigné à un agent
  IN_PROGRESS  // en cours de traitement
  ON_HOLD      // en attente (du demandeur / d'un tiers)
  ESCALATED    // escaladé
  RESOLVED     // résolu (attend confirmation/fermeture)
  CLOSED       // clos
}

enum TicketPriority { CRITICAL HIGH NORMAL LOW }

enum TicketType {
  INCIDENT   // quelque chose est cassé
  REQUEST    // demande de service / d'accès
  CHANGE     // demande de changement
  QUESTION   // question / information
}

enum TicketCommentType { PUBLIC INTERNAL SYSTEM }

model Ticket {
  id           String         @id @default(uuid()) @db.Uuid
  tenantId     String         @map("tenant_id") @db.Uuid
  // Réf. lisible auto-générée par tenant : "TKT-2026-0001" (cf. [[matricule]] pour le pattern séquence)
  reference    String         @map("reference")
  title        String         @db.VarChar(255)
  description  String         @db.Text
  status       TicketStatus   @default(NEW)
  priority     TicketPriority @default(NORMAL)
  type         TicketType     @default(INCIDENT)
  category     String?        // libre, ou rattaché à un Service du référentiel (cf. [[drwindesk-referentiels]])
  tags         String[]       @default([])

  // Demandeur (collaborateur qui ouvre le ticket) — User = compte qui se connecte
  reporterId   String?        @map("reporter_id") @db.Uuid
  // Agent assigné
  assigneeId   String?        @map("assignee_id") @db.Uuid

  // SLA
  slaPolicyId            String?   @map("sla_policy_id") @db.Uuid
  slaResponseDueAt       DateTime? @map("sla_response_due_at")
  slaResolutionDueAt     DateTime? @map("sla_resolution_due_at")
  slaResponseBreached    Boolean   @default(false) @map("sla_response_breached")
  slaResolutionBreached  Boolean   @default(false) @map("sla_resolution_breached")

  // Dates clés
  firstResponseAt DateTime? @map("first_response_at")
  resolvedAt      DateTime? @map("resolved_at")
  closedAt        DateTime? @map("closed_at")
  dueDate         DateTime? @map("due_date")

  comments    TicketComment[]
  attachments TicketAttachment[]
  slaPolicy   SlaPolicy?      @relation(fields: [slaPolicyId], references: [id], onDelete: SetNull)

  createdAt   DateTime        @default(now()) @map("created_at")
  updatedAt   DateTime        @updatedAt @map("updated_at")

  @@unique([tenantId, reference])
  @@index([tenantId, status])
  @@index([tenantId, priority])
  @@index([tenantId, assigneeId])
  @@map("tickets")
}

model TicketComment {
  id        String            @id @default(uuid()) @db.Uuid
  tenantId  String            @map("tenant_id") @db.Uuid
  ticketId  String            @map("ticket_id") @db.Uuid
  authorId  String?           @map("author_id") @db.Uuid
  content   String            @db.Text
  type      TicketCommentType @default(PUBLIC)
  createdAt DateTime          @default(now()) @map("created_at")
  updatedAt DateTime          @updatedAt @map("updated_at")

  ticket    Ticket            @relation(fields: [ticketId], references: [id], onDelete: Cascade)
  @@index([tenantId, ticketId])
  @@map("ticket_comments")
}

model TicketAttachment {
  id           String   @id @default(uuid()) @db.Uuid
  tenantId     String   @map("tenant_id") @db.Uuid
  ticketId     String   @map("ticket_id") @db.Uuid
  uploadedById String?  @map("uploaded_by_id") @db.Uuid
  originalName String   @map("original_name")
  mimeType     String   @map("mime_type")
  sizeKo       Int      @map("size_ko")
  storageKey   String?  @map("storage_key")  // rempli quand presign S3 actif ; sinon null
  url          String?
  createdAt    DateTime @default(now()) @map("created_at")

  ticket       Ticket   @relation(fields: [ticketId], references: [id], onDelete: Cascade)
  @@index([tenantId, ticketId])
  @@map("ticket_attachments")
}

model SlaPolicy {
  id                    String         @id @default(uuid()) @db.Uuid
  tenantId              String         @map("tenant_id") @db.Uuid
  name                  String         @db.VarChar(150)
  description           String?
  // V1 : ciblage par priorité (1 politique par priorité). targetValue = TicketPriority en string.
  targetPriority        TicketPriority @map("target_priority")
  responseTimeMinutes   Int            @map("response_time_minutes")
  resolutionTimeMinutes Int            @map("resolution_time_minutes")
  isActive              Boolean        @default(true) @map("is_active")

  tickets               Ticket[]
  createdAt             DateTime       @default(now()) @map("created_at")
  updatedAt             DateTime       @updatedAt @map("updated_at")

  @@unique([tenantId, targetPriority])
  @@index([tenantId])
  @@map("sla_policies")
}
```

> **À ne pas oublier** (mêmes points que les autres modules) :
> - ajouter `Ticket`, `TicketComment`, `TicketAttachment`, `SlaPolicy` à **`TENANT_MODELS`**
>   (`src/common/prisma/tenant.extension.ts`) → `tenantId` injecté par l'extension, **jamais** passé en data ;
> - ajouter les **policies RLS** correspondantes (`prisma/sql/rls.sql`) ;
> - `tenantId` vient **du JWT**, jamais d'un header (cf. décision sécurité, [[drwindesk-stack-decision]]).

---

## Génération de la `reference`

Auto-générée côté backend (le front ne l'envoie jamais), format **`TKT-<année>-<séquence padée>`**
remise à zéro par an et par tenant (ex. `TKT-2026-0001`). Même esprit que le matricule
auto-généré ([[matricule]]). Unicité garantie par `@@unique([tenantId, reference])`.

---

## Logique SLA (reprise de Task360, à porter en Prisma)

1. **À la création / au changement de priorité** : `applySlaPolicy(ticket)` cherche la
   `SlaPolicy` active dont `targetPriority == ticket.priority`, puis pose
   `slaResponseDueAt = createdAt + responseTimeMinutes` et
   `slaResolutionDueAt = createdAt + resolutionTimeMinutes`.
2. **Premier message agent** (commentaire `PUBLIC` d'un agent, ou passage `IN_PROGRESS`) →
   `firstResponseAt`. Si avant `slaResponseDueAt`, la cible de réponse est tenue.
3. **Cron toutes les 5 min** (`@nestjs/schedule`, déjà dispo) `checkSlaBreaches()` :
   - tickets ouverts dont `slaResolutionDueAt < now` et `!slaResolutionBreached`
     → `slaResolutionBreached = true` + **notification** à l'assigné ;
   - tickets dont `slaResolutionDueAt ∈ [now, now+30min]` → **notification « warning »**.
   - « ouverts » = statuts `NEW, ASSIGNED, IN_PROGRESS, ON_HOLD, ESCALATED`.

> **Intégration notifications** : utiliser le **module `notifications`/`espaces` EXISTANT**
> (cf. [[drwindesk-stack-decision]], `NotificationBell` côté front). Ajouter des
> `kind` : `TICKET_ASSIGNED`, `TICKET_COMMENTED`, `TICKET_SLA_WARNING`, `TICKET_SLA_BREACHED`,
> `TICKET_RESOLVED`. `severity` : WARNING pour warning, CRITICAL pour breach. **Ne pas créer
> un second système de notifications.**

---

## Endpoints (préfixe `/api/v1`)

### Tickets
| Méthode | Route | Permission | Corps / réponse |
| ------- | ----- | ---------- | --------------- |
| GET    | `/tickets`               | `support:read`  | filtres `?status&priority&type&assigneeId&mine=true&search&page` → `Paginated<TicketDto>` |
| GET    | `/tickets/stats`         | `support:read`  | → compteurs par statut/priorité (pour dashboard) |
| GET    | `/tickets/:id`           | `support:read`  | → `TicketDetailDto` (avec commentaires + pièces jointes) |
| POST   | `/tickets`               | `support:write` | `CreateTicketDto` → `TicketDto` (201) — `reporterId` = user courant |
| PATCH  | `/tickets/:id`           | `support:write` | `UpdateTicketDto` (title/description/status/priority/type/category/tags) |
| PATCH  | `/tickets/:id/assign`    | `support:write` | `{ assigneeId }` → statut auto `ASSIGNED` si `NEW` |
| PATCH  | `/tickets/:id/escalate`  | `support:write` | `{ reason? }` → statut `ESCALATED` + notif |
| DELETE | `/tickets/:id`           | `support:manage`| → 204 |

### Commentaires
| Méthode | Route | Permission | Corps / réponse |
| ------- | ----- | ---------- | --------------- |
| GET  | `/tickets/:id/comments`  | `support:read`  | → `TicketCommentDto[]` (le demandeur ne voit pas les `INTERNAL`) |
| POST | `/tickets/:id/comments`  | `support:write` | `{ content, type? }` → `TicketCommentDto` (201) ; 1ʳᵉ réponse agent ⇒ `firstResponseAt` |

### Pièces jointes (presign S3 — flag OFF tant que backend pas prêt, cf. [[upload-s3]])
| Méthode | Route | Permission | Corps / réponse |
| ------- | ----- | ---------- | --------------- |
| GET  | `/tickets/:id/attachments`         | `support:read`  | → `TicketAttachmentDto[]` |
| POST | `/tickets/:id/attachments/presign` | `support:write` | `{ filename, contentType, size }` → `{ uploadUrl, storageKey }` |
| POST | `/tickets/:id/attachments`         | `support:write` | `{ originalName, mimeType, sizeKo, storageKey? }` → `TicketAttachmentDto` |

### Politiques SLA (admin)
| Méthode | Route | Permission | Corps / réponse |
| ------- | ----- | ---------- | --------------- |
| GET    | `/sla-policies`     | `support:read`   | → `SlaPolicyDto[]` |
| POST   | `/sla-policies`     | `support:manage` | `CreateSlaPolicyDto` → `SlaPolicyDto` (201) |
| PATCH  | `/sla-policies/:id` | `support:manage` | partiel → `SlaPolicyDto` |
| DELETE | `/sla-policies/:id` | `support:manage` | → 204 |

---

## Formes de réponse (DTO)

```ts
type TicketStatus   = 'NEW'|'ASSIGNED'|'IN_PROGRESS'|'ON_HOLD'|'ESCALATED'|'RESOLVED'|'CLOSED';
type TicketPriority = 'CRITICAL'|'HIGH'|'NORMAL'|'LOW';
type TicketType     = 'INCIDENT'|'REQUEST'|'CHANGE'|'QUESTION';

interface TicketDto {
  id: string;
  reference: string;             // "TKT-2026-0001"
  title: string;
  status: TicketStatus;
  priority: TicketPriority;
  type: TicketType;
  category?: string;
  tags: string[];
  reporterId?: string;
  assigneeId?: string;
  slaResponseDueAt?: string;     // ISO
  slaResolutionDueAt?: string;
  slaResponseBreached: boolean;
  slaResolutionBreached: boolean;
  firstResponseAt?: string;
  resolvedAt?: string;
  closedAt?: string;
  createdAt: string;
  updatedAt: string;
}

interface TicketDetailDto extends TicketDto {
  description: string;
  comments: TicketCommentDto[];
  attachments: TicketAttachmentDto[];
}

interface TicketCommentDto {
  id: string; ticketId: string; authorId?: string;
  content: string; type: 'PUBLIC'|'INTERNAL'|'SYSTEM';
  createdAt: string;
}

interface TicketAttachmentDto {
  id: string; ticketId: string;
  originalName: string; mimeType: string; sizeKo: number;
  url?: string; createdAt: string;
}

interface SlaPolicyDto {
  id: string; name: string; description?: string;
  targetPriority: TicketPriority;
  responseTimeMinutes: number; resolutionTimeMinutes: number;
  isActive: boolean;
}

interface CreateTicketDto {            // reporterId & reference jamais envoyés (backend)
  title: string; description: string;
  priority?: TicketPriority; type?: TicketType;
  category?: string; tags?: string[];
}
```

---

## RBAC

Ajouter 3 permissions (l'admin les a déjà via `*`) :
- **`support:read`** — voir tickets, commentaires publics, KB. À donner largement (agents + demandeurs lisent leurs tickets).
- **`support:write`** — créer/éditer/commenter/assigner/escalader. Rôle **agent de support**.
- **`support:manage`** — configurer SLA, supprimer, (V2 : workflows). Rôle **admin support**.

> **Visibilité demandeur** : un user sans `support:write` ne voit que **ses** tickets
> (`reporterId == userId`) et **pas** les commentaires `INTERNAL`. Le filtrage est backend
> (ne pas se fier au front). `?mine=true` est un raccourci ; l'enforcement reste serveur.

---

## Seed conseillé

- **3 politiques SLA** par défaut (en minutes) :
  | priorité | réponse | résolution |
  |----------|---------|-----------|
  | CRITICAL | 30      | 240 (4 h) |
  | HIGH     | 120     | 480 (8 h) |
  | NORMAL   | 240     | 1440 (24 h) |
  | LOW      | 480     | 2880 (48 h) |
- **2-3 tickets démo** (1 ouvert assigné, 1 en attente, 1 résolu) sur le tenant `drwintech`.

---

## Côté front (ce que je brancherai dès dispo)

- `features/support` : service (`USE_MOCKS.support ? mock : http`) + hooks react-query
  (`useTickets`, `useTicket`, `useCreateTicket`, `useAddComment`, `useAssign`, `useEscalate`,
  `useSlaPolicies`). Flag `VITE_MOCK_SUPPORT` (mock par défaut tant que back absent).
- **Nav « Support »** → routes :
  - `/support` : liste filtrable (statut/priorité/type/assigné/recherche) + badges SLA
    (vert / orange « bientôt » / rouge « dépassé ») ;
  - `/support/nouveau` : formulaire création (titre, description, type, priorité, catégorie, pièces jointes flaggées) ;
  - `/support/:id` : détail + fil de commentaires (public/interne selon perm) + actions
    assigner/escalader/changer statut ;
  - `/support/sla` (admin, gated `support:manage`) : CRUD politiques SLA.
- **Dashboard** : tuile « Mes tickets » + compteurs (`/tickets/stats`).
- **Cloche de notifications** : déjà en place — afficher les nouveaux `kind` ticket
  (cf. [[drwindesk-stack-decision]] `NotificationBell`).
- Pièces jointes : `uploadViaPresign` existant, **flag `VITE_UPLOADS_ENABLED` OFF** jusqu'à
  ce que `/attachments/presign` existe (même contrat que CV/Documents).

---

## ── V2 (différé — documenté pour mémoire) ──

### Base de connaissances (`KbArticle`)
```prisma
enum ArticleStatus { DRAFT PENDING_REVIEW PUBLISHED ARCHIVED }

model KbArticle {
  id            String        @id @default(uuid()) @db.Uuid
  tenantId      String        @map("tenant_id") @db.Uuid
  title         String        @db.VarChar(255)
  slug          String        // unique par tenant
  content       String        @db.Text
  excerpt       String?       @db.VarChar(500)
  status        ArticleStatus @default(DRAFT)
  category      String?
  tags          String[]      @default([])
  authorId      String?       @map("author_id") @db.Uuid
  viewCount     Int           @default(0) @map("view_count")
  helpfulCount  Int           @default(0) @map("helpful_count")
  notHelpfulCount Int         @default(0) @map("not_helpful_count")
  isPublic      Boolean       @default(true) @map("is_public")
  publishedAt   DateTime?     @map("published_at")
  createdAt     DateTime      @default(now()) @map("created_at")
  updatedAt     DateTime      @updatedAt @map("updated_at")
  @@unique([tenantId, slug])
  @@map("kb_articles")
}
```
Endpoints : `/kb-articles` (CRUD `support:manage` en écriture, lecture `support:read`),
`/kb-articles/:slug` (public si `isPublic`), `POST /kb-articles/:id/feedback {helpful:boolean}`.

### Workflows (automatisation)
Modèle `Workflow { trigger, conditions(json), actions(json), status, priority, stopOnMatch }`.
Triggers : `TICKET_CREATED|TICKET_UPDATED|TICKET_STATUS_CHANGED|TICKET_ASSIGNED|TICKET_COMMENT_ADDED|SLA_WARNING|SLA_BREACH`.
Actions : `assign`, `set_priority`, `add_tag`, `notify`, `change_status`. Moteur d'évaluation
des règles déclenché par des events applicatifs. **Lourd — à ne lancer que si le helpdesk V1 est adopté.**

### Autres (non modélisés ici)
CSAT (`satisfactionRating/Comment`), champs personnalisés (`customFields json`),
email-to-ticket (`sourceEmail*`), équipes/files d'attente (`Team`), heures ouvrées dans le SLA
(`businessHoursOnly` + calendrier jours fériés du tenant).

---

## Notes de portage (Task360 → DrwinDesk)

| Task360 | DrwinDesk | Raison |
|---------|-----------|--------|
| TypeORM `@Entity` + MySQL | Prisma + PostgreSQL | conventions du repo |
| `organizationId` + header `x-tenant-id` | `tenantId` (JWT) + extension Prisma + RLS | sécurité multi-tenant ([[drwindesk-stack-decision]]) |
| Module `notifications` propre | module `notifications`/`espaces` **existant** | ne pas dupliquer |
| `ticketNumber` libre | `reference` auto `TKT-AAAA-NNNN` | cohérence [[matricule]] |
| `Team` (files d'attente) | **différé V2** | DrwinDesk n'a pas la notion d'équipe |
| Enums `lowercase` | enums Prisma `UPPER_CASE` | convention DrwinDesk |
