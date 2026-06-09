# Contrat backend — **Moteur d'approbations & workflows** (transverse)

> Hand-off front → backend. **Pierre angulaire de la couche « moteurs »** (cf. roadmap
> socle → moteurs → modules). Objectif : un **moteur d'approbations réutilisable et agnostique**
> du métier. Une fois en place, **congés, notes de frais, demandes d'achat, validation de
> documents, escalade de tickets** ne sont plus que de la *configuration*, pas du code.
>
> **Principe** : aucun module métier ne réimplémente « une demande qui passe par un manager
> puis RH ». Il **déclare un circuit** (flow) et **délègue** la validation à ce moteur, puis
> **réagit** au verdict final.
>
> **Origine** : le module `workflows` de Task360 (`sys_ticket_back`) est un *moteur de règles*
> (trigger→conditions→actions), utile mais **insuffisant** : il ne gère pas la validation
> humaine multi-étapes. On garde son **évaluateur d'arbre de conditions** (réutilisé pour le
> routage conditionnel) et on reporte le moteur de règles en **V2 (Partie B)**.

---

## Deux briques, une priorité

- **Partie A — Moteur d'approbations (circuits de validation)** → **V1, priorité absolue.**
  Demandes humaines qui passent par 1..N étapes de validation (séquentiel).
- **Partie B — Moteur de règles d'automatisation** → **V2.** Effets de bord automatiques
  pilotés par événements (assignation auto, notif, changement de champ). C'est le design
  Task360, généralisé.

---

# ── PARTIE A — Moteur d'approbations (V1) ──

## Concepts

| Concept | Rôle |
|---|---|
| **ApprovalFlow** | *Modèle* de circuit, rattaché à un **type d'objet** (congé, frais, achat…). Versionné, activable. |
| **ApprovalStep** | Étape ordonnée d'un flow : *qui* valide (résolution dynamique), condition de déclenchement, délai/escalade. |
| **ApprovalRequest** | *Instance* en cours : un objet métier précis qui parcourt un flow. Polymorphe (`entityType` + `entityId`). |
| **ApprovalDecision** | Décision d'un validateur sur une étape (approuve / rejette / commente), horodatée → **journal**. |

## Modèle Prisma (V1)

```prisma
// Domaines validables — extensible. Le moteur ne connaît PAS le détail de l'objet,
// juste son type + un payload (snapshot) pour évaluer les conditions.
// ABSENCE couvre les 3 catégories de DemandeConge (PERMISSION | REPOS | CONGE) ;
// le routage par catégorie se fait par condition sur payload.categorie (cf. seed).
enum ApprovableType { ABSENCE EXPENSE PURCHASE DOCUMENT TICKET GENERIC }

// Comment résoudre le(s) validateur(s) d'une étape, au moment de l'exécution
enum ApproverType {
  USER            // un utilisateur précis (approverValue = userId)
  ROLE            // tout porteur d'un rôle (approverValue = roleKey)
  MANAGER         // le manager du demandeur (via Employe.managerId)
  DEPARTMENT_HEAD // le responsable du département du demandeur
  SERVICE_HEAD    // le responsable du service du demandeur
}

enum ApprovalStatus  { PENDING APPROVED REJECTED CANCELLED }
enum DecisionAction  { APPROVE REJECT COMMENT }   // DELEGATE → V2

model ApprovalFlow {
  id          String         @id @default(uuid()) @db.Uuid
  tenantId    String         @map("tenant_id") @db.Uuid
  name        String         @db.VarChar(200)
  description String?
  entityType  ApprovableType @map("entity_type")
  isActive    Boolean        @default(true) @map("is_active")
  // Si plusieurs flows actifs pour un même type, on prend le plus prioritaire dont la
  // condition d'entrée matche (ex. un flow "achat > 1M" et un flow "achat standard").
  priority    Int            @default(0)
  // Condition d'éligibilité du flow entier (arbre, cf. format plus bas). null = toujours.
  entryCondition Json?       @map("entry_condition")

  steps       ApprovalStep[]
  requests    ApprovalRequest[]
  createdAt   DateTime       @default(now()) @map("created_at")
  updatedAt   DateTime       @updatedAt @map("updated_at")

  @@index([tenantId, entityType, isActive])
  @@map("approval_flows")
}

model ApprovalStep {
  id            String       @id @default(uuid()) @db.Uuid
  tenantId      String       @map("tenant_id") @db.Uuid
  flowId        String       @map("flow_id") @db.Uuid
  order         Int          // 1, 2, 3… ordre d'exécution
  name          String       @db.VarChar(150)   // "Validation manager", "Visa RH"…
  approverType  ApproverType @map("approver_type")
  approverValue String?      @map("approver_value") // userId / roleKey selon approverType
  // Étape conditionnelle : si la condition échoue, l'étape est SAUTÉE (ex. montant < seuil).
  condition     Json?
  // Délai avant relance/escalade (heures). null = pas de délai. (Escalade auto = V2 ; V1 = notif de relance.)
  slaHours      Int?         @map("sla_hours")

  flow          ApprovalFlow @relation(fields: [flowId], references: [id], onDelete: Cascade)
  decisions     ApprovalDecision[]
  @@unique([flowId, order])
  @@index([tenantId, flowId])
  @@map("approval_steps")
}

model ApprovalRequest {
  id           String         @id @default(uuid()) @db.Uuid
  tenantId     String         @map("tenant_id") @db.Uuid
  flowId       String         @map("flow_id") @db.Uuid
  entityType   ApprovableType @map("entity_type")
  entityId     String         @map("entity_id") @db.Uuid  // l'objet métier (congé, frais…)
  requesterId  String         @map("requester_id") @db.Uuid
  status       ApprovalStatus @default(PENDING)
  currentOrder Int            @default(1) @map("current_order") // étape courante
  // Snapshot des champs métier nécessaires aux conditions (montant, jours, departementId…).
  // Le moteur n'a PAS à connaître le schéma de l'objet : il lit ce payload.
  payload      Json?
  label        String?        // libellé lisible pour l'inbox ("Congé 5j — J. Dupont")
  startedAt    DateTime       @default(now()) @map("started_at")
  completedAt  DateTime?      @map("completed_at")

  flow         ApprovalFlow      @relation(fields: [flowId], references: [id])
  decisions    ApprovalDecision[]
  @@index([tenantId, status])
  @@index([tenantId, entityType, entityId])
  @@index([tenantId, requesterId])
  @@map("approval_requests")
}

model ApprovalDecision {
  id          String         @id @default(uuid()) @db.Uuid
  tenantId    String         @map("tenant_id") @db.Uuid
  requestId   String         @map("request_id") @db.Uuid
  stepId      String         @map("step_id") @db.Uuid
  approverId  String         @map("approver_id") @db.Uuid // qui a décidé (résolu à l'exécution)
  action      DecisionAction
  comment     String?        @db.Text
  decidedAt   DateTime       @default(now()) @map("decided_at")

  request     ApprovalRequest @relation(fields: [requestId], references: [id], onDelete: Cascade)
  step        ApprovalStep    @relation(fields: [stepId], references: [id])
  @@index([tenantId, requestId])
  @@index([tenantId, approverId])
  @@map("approval_decisions")
}
```

> **À ne pas oublier** : ajouter les 4 modèles à **`TENANT_MODELS`** (tenant.extension.ts)
> + **policies RLS** + `tenantId` issu du **JWT** (cf. [[drwindesk-stack-decision]]).

---

## Dépendances à acter (résolution des validateurs)

Pour `MANAGER` / `DEPARTMENT_HEAD` / `SERVICE_HEAD`, le moteur a besoin de :
- **lien `User` ↔ `Employe`** (un champ `Employe.userId` ou `User.employeId`) — car `requesterId`
  est un *compte* (`User`) mais la hiérarchie vit sur la *fiche RH* (`Employe`). Distinction connue
  ([[drwindesk-stack-decision]] : `users` ≠ `employes`).
- **`Employe.managerId`** (fiche du responsable hiérarchique) — à ajouter au modèle RH si absent.
- **responsable** sur `Department`/`Service` du référentiel ([[drwindesk-referentiels]]) — un
  `headEmployeId?` optionnel.

> **V1 minimal sans ces dépendances** : ne livrer que `USER` et `ROLE` (toujours résolvables),
> et activer `MANAGER`/`*_HEAD` dès que les champs RH existent. **Marquer clairement dans le
> code quels ApproverType sont disponibles** pour ne pas créer de circuits cassés.

---

## Cycle de vie (logique du moteur)

```
start(entityType, entityId, requesterId, payload, label)
  → choisit le flow actif (entityType) le + prioritaire dont entryCondition matche
  → crée ApprovalRequest (status=PENDING, currentOrder = 1er step éligible)
  → résout les validateurs du step courant → notifie (module notifications EXISTANT)

decide(requestId, approverId, action, comment)
  → vérifie que approverId est bien un validateur résolu du step courant
  → enregistre ApprovalDecision (journal)
  → si REJECT  → request.status = REJECTED, completedAt = now → emit "approval.completed"
  → si APPROVE → avance au prochain step éligible (saute ceux dont condition échoue)
       → s'il reste un step : résout + notifie
       → sinon : status = APPROVED, completedAt = now → emit "approval.completed"

cancel(requestId)   → par le demandeur tant que PENDING → status = CANCELLED
cron (horaire)      → steps PENDING dépassant slaHours → notif de relance (escalade auto = V2)
```

### Découplage métier ⇄ moteur (le point clé)

Le moteur **ne modifie jamais** l'objet métier. À la fin, il **émet un événement**
`approval.completed { entityType, entityId, status, requestId }`. Chaque module source
**s'abonne** et applique le verdict :

```ts
// module presences (congés) — pseudo
@OnEvent('approval.completed')
async onApproval(e) {
  if (e.entityType !== 'ABSENCE') return;   // congé / permission / repos
  await this.congeService.setStatut(e.entityId, e.status === 'APPROVED' ? 'APPROUVE' : 'REFUSE');
}
```

→ Bus d'événements in-process (NestJS `EventEmitter2`), à promouvoir plus tard en vrai bus
(couche « événements + WhatsApp » de la roadmap). **Intégration congés = additive**, on ne
réécrit pas le module `presences` (règle co-dev : Edit chirurgical, [[drwindesk-stack-decision]]).

---

## Format des conditions (réutilisé de Task360)

Arbre booléen évalué sur le `payload` de la request (et le contexte demandeur) :

```jsonc
{
  "operator": "AND",                 // AND | OR
  "rules": [
    { "field": "amount",      "operator": "greater_than", "value": 1000000 },
    { "field": "departmentId","operator": "equals",       "value": "<uuid>" },
    { "operator": "OR", "rules": [ /* sous-arbre */ ] }
  ]
}
```
Opérateurs : `equals, not_equals, contains, greater_than, less_than, in, not_in`.
(Évaluateur `evaluateConditions` repris tel quel de `workflows.service.ts` Task360.)

---

## Endpoints (préfixe `/api/v1`)

### Côté demandeur / validateur (self-service)
| Méthode | Route | Permission | Rôle |
| ------- | ----- | ---------- | ---- |
| GET   | `/approvals/inbox`         | `approval:act`  | **Mes validations en attente** (toutes entités confondues) → `ApprovalTaskDto[]` |
| GET   | `/approvals/mine`          | `approval:read` | Mes demandes émises + leur avancement → `ApprovalRequestDto[]` |
| GET   | `/approvals/:id`           | `approval:read` | Détail + timeline des décisions → `ApprovalRequestDetailDto` |
| POST  | `/approvals/:id/decide`    | `approval:act`  | `{ action: 'APPROVE'|'REJECT'|'COMMENT', comment? }` → `ApprovalRequestDto` |
| POST  | `/approvals/:id/cancel`    | `approval:read` | (demandeur, si PENDING) → `ApprovalRequestDto` |

> `start()` **n'est pas un endpoint public** : c'est un **service interne** appelé par les
> modules métier (congés/frais/achats) à la soumission. Pas de création de request « à la main »
> par le front.

### Côté admin (configuration des circuits)
| Méthode | Route | Permission | Corps / réponse |
| ------- | ----- | ---------- | --------------- |
| GET    | `/approval-flows`        | `approval:manage` | `?entityType=` → `ApprovalFlowDto[]` |
| POST   | `/approval-flows`        | `approval:manage` | `CreateFlowDto` (avec `steps[]`) → `ApprovalFlowDto` |
| PATCH  | `/approval-flows/:id`    | `approval:manage` | partiel (+ remplacement des steps) |
| DELETE | `/approval-flows/:id`    | `approval:manage` | → 204 (refus 409 si des requests PENDING l'utilisent) |

---

## Formes de réponse (DTO)

```ts
type ApprovalStatus = 'PENDING'|'APPROVED'|'REJECTED'|'CANCELLED';
type ApprovableType = 'ABSENCE'|'EXPENSE'|'PURCHASE'|'DOCUMENT'|'TICKET'|'GENERIC';

interface ApprovalTaskDto {        // une ligne de l'inbox validateur
  requestId: string;
  entityType: ApprovableType;
  label: string;                   // "Congé 5j — J. Dupont"
  stepName: string;                // "Validation manager"
  requesterId: string;
  startedAt: string;
  slaDueAt?: string;               // si slaHours
}

interface ApprovalRequestDto {
  id: string; flowId: string;
  entityType: ApprovableType; entityId: string;
  requesterId: string; status: ApprovalStatus;
  currentOrder: number; label?: string;
  startedAt: string; completedAt?: string;
}

interface ApprovalRequestDetailDto extends ApprovalRequestDto {
  steps: { order: number; name: string; approverType: string; status: 'done'|'current'|'pending'|'skipped' }[];
  decisions: { stepName: string; approverId: string; action: string; comment?: string; decidedAt: string }[];
}

interface ApprovalFlowDto {
  id: string; name: string; description?: string;
  entityType: ApprovableType; isActive: boolean; priority: number;
  entryCondition?: object;
  steps: { order: number; name: string; approverType: string; approverValue?: string; condition?: object; slaHours?: number }[];
}
```

---

## RBAC

- **`approval:read`** — voir mes demandes / le détail (tout collaborateur).
- **`approval:act`** — agir sur l'inbox (valideurs : managers, RH, finance…).
- **`approval:manage`** — configurer les circuits (admin). L'admin a `*`.

> L'autorisation d'agir sur une étape ne vient **pas** que de la permission : le moteur
> vérifie en plus que l'utilisateur est bien **résolu comme validateur du step courant**
> (enforcement serveur, jamais le front).

---

## Seed conseillé (montre la réutilisation)

**Absences — un flow par catégorie**, sélectionné via `entryCondition` sur `payload.categorie`
(démontre le routage conditionnel ; cf. [[demandes-absence]]) :
- **Flow « Permission »** (`ABSENCE`, `entryCondition: categorie == PERMISSION`) : **1 étape** `MANAGER`.
  Absence courte → pas de visa RH.
- **Flow « Repos »** (`ABSENCE`, `categorie == REPOS`) : **1 étape** `MANAGER`.
- **Flow « Congé »** (`ABSENCE`, `categorie == CONGE`) : **2 étapes** `MANAGER` puis `ROLE=rh` (Visa RH).

Autres domaines :
- **Flow « Note de frais »** (`EXPENSE`) : step 1 `MANAGER`, step 2 `ROLE=finance`
  **avec condition** `amount > 100000` (en dessous, l'étape finance est sautée).
- **Flow « Demande d'achat »** (`PURCHASE`) : step 1 `MANAGER`, step 2 `ROLE=direction`
  avec `entryCondition` `amount > 1000000` sur un 2ᵉ flow plus prioritaire.

---

## Côté front (ce que je brancherai)

- `features/approvals` : service + hooks (`useApprovalInbox`, `useMyRequests`, `useDecide`,
  `useApprovalFlows`). Flag `VITE_MOCK_APPROVALS`.
- **« Mes validations »** (inbox unifiée, badge dans le header à côté de la cloche) — *le*
  marqueur « plateforme » : un manager voit congés + frais + achats à valider **au même endroit**.
- **Timeline de validation** réutilisable (composant `<ApprovalTimeline>`) affiché DANS chaque
  objet métier (fiche congé, note de frais…) → étapes done/current/pending/skipped.
- **Paramètres → Circuits de validation** (admin, `approval:manage`) : éditeur de flow
  (liste d'étapes, type de validateur, condition, délai).
- Intégration : les écrans congés/frais/achats appellent leur `POST` métier habituel ; c'est le
  **backend** qui amorce le circuit. Le front lit l'avancement via `/approvals/:id`.

---

# ── PARTIE B — Moteur de règles d'automatisation (V2) ──

Design **directement repris de Task360** (`Workflow`), généralisé aux événements DrwinDesk.

```prisma
enum AutomationStatus { ACTIVE INACTIVE DRAFT }

model AutomationRule {
  id            String           @id @default(uuid()) @db.Uuid
  tenantId      String           @map("tenant_id") @db.Uuid
  name          String           @db.VarChar(200)
  description   String?
  trigger       String           // "leave.submitted", "ticket.sla_warning", "presence.late"…
  status        AutomationStatus @default(DRAFT)
  conditions    Json?            // même arbre que Partie A
  actions       Json             // [{ type:'notify'|'assign'|'set_field'|'webhook', params:{} }]
  priority      Int              @default(0)
  stopOnMatch   Boolean          @default(true) @map("stop_on_match")
  executionCount Int             @default(0) @map("execution_count")
  lastExecutedAt DateTime?       @map("last_executed_at")
  createdAt     DateTime         @default(now()) @map("created_at")
  updatedAt     DateTime         @updatedAt @map("updated_at")
  @@index([tenantId, trigger, status])
  @@map("automation_rules")
}
```

Moteur : `executeRules(trigger, context)` → filtre les règles actives du trigger, évalue
`conditions` (même évaluateur), exécute `actions` via des **handlers** enregistrés
(`notify` → module notifications, `assign`, `set_field`, `webhook`). `stopOnMatch` arrête au
1ᵉʳ match. C'est le `executeWorkflows()` de Task360, avec de **vrais** handlers d'actions
(Task360 les laisse en `TODO: queued`). À ne lancer **qu'après** que la couche événements
(bus + WhatsApp) soit posée.

---

## Notes de portage (Task360 → DrwinDesk)

| Task360 | DrwinDesk | Raison |
|---------|-----------|--------|
| `Workflow` (règles seules) | **+ moteur d'approbations** (Partie A) | le vrai besoin métier (validation humaine) que Task360 n'a pas |
| Trigger centré tickets | `entityType` agnostique + triggers génériques | réutilisable congés/frais/achats/docs |
| Actions `TODO: queued` | handlers réels (V2) | Task360 ne les exécute pas |
| `organizationId` | `tenantId` (JWT) + RLS | sécurité multi-tenant |
| Évaluateur de conditions | **repris tel quel** | bonne base, rien à réinventer |
