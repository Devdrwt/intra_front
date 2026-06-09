# Contrat backend — **Projets : Tâches & Kanban**

> Hand-off front → backend. Couche 3 (modules métier). **Additif** : le module **Projects existe
> déjà** (back `projects` : `Project`/`ProjectMembre`/`ProjectDocument`, échéances ; front
> `features/projects`) **mais n'a ni tâches ni Kanban**. Ce contrat ajoute la **gestion de tâches
> avec tableau Kanban**, dérivée du module `tasks` de **Task360** (`sys_ticket_back`, re-coulé
> Prisma/PG).
>
> **Branché sur les moteurs** : journal [[audit]], notifications/WhatsApp
> [[evenements-notifications]] (assignation, échéance), recherche [[recherche]] (`type=task`).
> Lien finance : une tâche/un projet peut porter l'**axe budgétaire PROJET** ([[finance-pilotage]]).
>
> ⚠️ **Ne pas réécrire** `Project` : on s'y rattache (FK optionnelle) et on **dérive** la
> progression du projet depuis ses tâches.

---

## Périmètre
- **Tâches** rattachées à un projet **ou autonomes** (todo perso) → « Mes tâches » pour tous.
- **Kanban** par statut (colonnes), **drag & drop** (réordonnancement + changement de statut).
- **Sous-tâches** (hiérarchie 1 niveau), **assignation**, **priorité**, **échéance**, **estimation**.
- V2 : commentaires de tâche, suivi du temps réel, dépendances, colonnes personnalisables, sprints.

## Modèle Prisma
```prisma
enum TaskStatus   { BACKLOG TODO IN_PROGRESS IN_REVIEW DONE CANCELLED }
enum TaskPriority { URGENT HIGH MEDIUM LOW }

model Task {
  id           String   @id @default(uuid()) @db.Uuid
  tenantId     String   @map("tenant_id") @db.Uuid
  reference    String   // "TSK-2026-0001" (auto, cf. [[matricule]])
  projetId     String?  @map("projet_id") @db.Uuid    // null = tâche autonome
  parentTaskId String?  @map("parent_task_id") @db.Uuid // sous-tâche
  titre        String
  description  String?  @db.Text
  statut       TaskStatus   @default(TODO)
  priorite     TaskPriority @default(MEDIUM)
  assigneeId   String?  @map("assignee_id") @db.Uuid   // User
  createdById  String?  @map("created_by_id") @db.Uuid
  dateEcheance DateTime? @db.Date @map("date_echeance")
  estimationMinutes Int? @map("estimation_minutes")
  progression  Int      @default(0)   // 0..100
  // Ordre dans la colonne Kanban (au sein d'un même statut). Pas plus est nécessaire en V1.
  position     Int      @default(0)
  labels       String[] @default([])
  sousTaches   Task[]   @relation("SousTaches")
  parent       Task?    @relation("SousTaches", fields: [parentTaskId], references: [id], onDelete: Cascade)
  createdAt    DateTime @default(now()) @map("created_at")
  updatedAt    DateTime @updatedAt @map("updated_at")
  @@unique([tenantId, reference])
  @@index([tenantId, projetId, statut])
  @@index([tenantId, assigneeId, statut])
  @@map("tasks")
}
```
> `TENANT_MODELS` + **RLS** + `tenantId` du JWT. (Réutilise `Project` existant pour la FK `projetId`.)

---

## Kanban — déplacement (le geste central)
```
PATCH /tasks/:id/move  { statut, position }   (finance n/a ; permission tasks:write)
```
- Change la **colonne** (`statut`) et la **place** (`position`) en une opération.
- Le backend **renumérote** les `position` de la colonne cible (et source) pour garder un ordre
  dense (0,1,2…). Réordonnancement intra-colonne = même endpoint (statut inchangé).
- `DONE`/`CANCELLED` → pose `progression=100`/fige. Émet `task.status_changed`.

## Progression du projet (dérivée)
`Project.progression` (champ existant) = **moyenne pondérée** des tâches du projet (`DONE`=100,
sinon `progression`). Recalculée à chaque move/édition de tâche. → la barre de progression projet
devient **réelle**, plus une saisie manuelle.

---

## Intégrations moteurs
- **Assignation** → événement `task.assigned` → notification à l'assigné ([[evenements-notifications]]).
- **Échéance** : le **scheduler existant** du module projects (`projects.scheduler.ts`) balaie aussi
  les tâches `dateEcheance` proche/dépassée → `task.due_soon` / `task.overdue` → notif (+ WhatsApp
  si configuré).
- **Audit** : `@Audit({action:'projects.task.*', resource:'tasks'})` → timeline par tâche/projet.
- **Recherche** : `IndexSubscriber` indexe les tâches (`type=task`, permission `tasks:read`,
  `ownerId=assigneeId`) → trouvables dans la palette `Cmd+K` ([[recherche]]).

---

## Endpoints (préfixe `/api/v1`)
| Méthode | Route | Permission |
|---------|-------|-----------|
| GET | `/tasks` (`?projetId&statut&assigneeId&mine&priorite&q`) | `tasks:read` |
| GET | `/me/tasks` | `tasks:read` → **mes tâches assignées** (tous projets) |
| GET | `/projects/:id/board` | `tasks:read` → tâches groupées par statut (colonnes Kanban) |
| POST | `/tasks` | `tasks:write` (`projetId?`, `parentTaskId?`) |
| PATCH | `/tasks/:id` | `tasks:write` |
| PATCH | `/tasks/:id/move` | `tasks:write` `{statut, position}` |
| DELETE | `/tasks/:id` | `tasks:write` (cascade sous-tâches) |
| GET | `/tasks/:id/activity` | `tasks:read` ([[audit]]) |

```ts
interface TaskDto {
  id: string; reference: string; projetId?: string; parentTaskId?: string;
  titre: string; description?: string;
  statut: 'BACKLOG'|'TODO'|'IN_PROGRESS'|'IN_REVIEW'|'DONE'|'CANCELLED';
  priorite: 'URGENT'|'HIGH'|'MEDIUM'|'LOW';
  assigneeId?: string; dateEcheance?: string; estimationMinutes?: number;
  progression: number; position: number; labels: string[];
  createdAt: string; updatedAt: string;
}
interface BoardColumn { statut: string; label: string; tasks: TaskDto[] }
```

---

## RBAC
- **`tasks:read`** / **`tasks:write`** — à créer (l'admin a `*`). Largement ouverts (les tâches
  sont du quotidien collaboratif). Un membre de projet voit/édite les tâches de **ses** projets ;
  « Mes tâches » est self-service.
- Option : restreindre l'édition à l'assigné + responsable de projet (enforcement serveur).

---

## Côté front (ce que je brancherai)
- `features/projects` (existant) enrichi : onglet **Kanban** sur `ProjectDetailPage` (colonnes par
  statut, **drag & drop** via `@dnd-kit` — comme Task360), création/édition de tâche (drawer),
  sous-tâches, badges priorité/échéance/assigné.
- **Page « Mes tâches »** (nouvelle, `/mes-taches`) : board personnel transverse — **gros gain
  UX** pour tout le monde, pas que les chefs de projet. Entrée dans le portail self-service
  ([[drwindesk-roadmap]] couche expérience) + action « Nouvelle tâche » dans `CommandPalette`.
- Progression projet **dérivée** affichée (plus de saisie manuelle).
- Flag `VITE_MOCK_PROJECTS` (existant).

---

## Récap pour le co-dev backend
| # | Changement | Type |
|---|-----------|------|
| 1 | Modèle `Task` (+ sous-tâches, position Kanban) + TENANT_MODELS + RLS | additif |
| 2 | `PATCH /tasks/:id/move` (statut + position, renumérotation dense) | logique Kanban |
| 3 | `Project.progression` **dérivée** des tâches | logique |
| 4 | Événements `task.assigned/due_soon/overdue` (scheduler projects réutilisé) | intégration |
| 5 | `@Audit` + indexation recherche (`type=task`) | intégration |
| 6 | Réf auto `TSK-AAAA-NNNN` | convention |
| 7 | Commentaires tâche, suivi temps réel, dépendances, colonnes custom, sprints | différé V2 |

> **Étend** le module `projects` existant (FK `projetId`). Dérivé du module `tasks` de Task360.
> Aucune dépendance bloquante : livrable dès que `tasks:read/write` sont ajoutées au RBAC.
