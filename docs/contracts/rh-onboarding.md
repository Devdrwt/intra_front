# Contrat backend — **RH : Onboarding / Offboarding** (parcours d'intégration & départ)

> Hand-off front → backend. Couche 3 (SIRH). Greenfield. Orchestration des **parcours d'arrivée
> et de départ** d'un collaborateur : une **checklist d'étapes** assignées aux bons acteurs (RH,
> IT, manager, l'employé lui-même), déclenchée automatiquement, suivie jusqu'à complétion.
>
> **Réutilise le module Tâches** ([[projets-taches]]) : chaque étape de parcours **matérialise une
> tâche** assignée à son responsable → elle apparaît dans **« Mes tâches »**, pas besoin d'un
> second système de to-do. Branché : événements [[evenements-notifications]] (rappels),
> [[approbations]] (validation de départ / clearance), [[audit]]. Bâti sur `Employe` (RH).

---

## Principe
> On ne réinvente pas une « liste de choses à faire » : un **parcours** est un modèle d'étapes ;
> à l'instanciation, chaque étape **crée une `Task`** ([[projets-taches]]) assignée au responsable
> résolu. Le parcours suit l'avancement (étapes faites / total) ; les acteurs travaillent dans
> leur inbox de tâches habituelle.

## Modèle Prisma
```prisma
enum TypeParcours    { ONBOARDING OFFBOARDING }
enum ResponsableType { RH IT MANAGER EMPLOYE FINANCE }
enum StatutParcours  { EN_COURS TERMINE ANNULE }

model ParcoursModele {        // template éditable (référentiel)
  id        String   @id @default(uuid()) @db.Uuid
  tenantId  String   @map("tenant_id") @db.Uuid
  type      TypeParcours
  nom       String   // "Intégration CDI", "Départ standard"
  actif     Boolean  @default(true)
  etapes    EtapeModele[]
  @@map("parcours_modeles")
}

model EtapeModele {
  id              String @id @default(uuid()) @db.Uuid
  tenantId        String @map("tenant_id") @db.Uuid
  modeleId        String @map("modele_id") @db.Uuid
  ordre           Int
  titre           String  // "Créer le compte email", "Remettre le matériel", "Signer le contrat"
  description     String?
  responsableType ResponsableType
  delaiJours      Int    @default(0) @map("delai_jours") // échéance = date de réf + delai
  modele          ParcoursModele @relation(fields: [modeleId], references: [id], onDelete: Cascade)
  @@index([tenantId, modeleId])
  @@map("etapes_modele")
}

model Parcours {              // instance pour un employé
  id          String   @id @default(uuid()) @db.Uuid
  tenantId    String   @map("tenant_id") @db.Uuid
  type        TypeParcours
  modeleId    String?  @map("modele_id") @db.Uuid
  employeId   String   @map("employe_id") @db.Uuid
  statut      StatutParcours @default(EN_COURS)
  dateReference DateTime @db.Date @map("date_reference") // embauche (onboarding) / dernier jour (offboarding)
  etapes      EtapeParcours[]
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")
  @@index([tenantId, employeId, type])
  @@map("parcours")
}

model EtapeParcours {
  id            String   @id @default(uuid()) @db.Uuid
  tenantId      String   @map("tenant_id") @db.Uuid
  parcoursId    String   @map("parcours_id") @db.Uuid
  titre         String
  responsableId String?  @map("responsable_id") @db.Uuid // User résolu depuis responsableType
  echeance      DateTime? @db.Date
  faite         Boolean  @default(false)
  faiteLe       DateTime? @map("faite_le")
  taskId        String?  @map("task_id") @db.Uuid        // Task créée ([[projets-taches]])
  parcours      Parcours @relation(fields: [parcoursId], references: [id], onDelete: Cascade)
  @@index([tenantId, parcoursId])
  @@map("etapes_parcours")
}
```
> `TENANT_MODELS` + **RLS** + `tenantId` du JWT.

---

## Cycle de vie
```
ONBOARDING : créé à l'embauche (manuel ou auto sur event rh.employe.create)
             → instancie le modèle → 1 Task par étape (assignée au responsable) → échéances posées
OFFBOARDING: créé au départ → étapes (récupérer matériel, clôturer accès, solde tout compte…)
             → peut exiger une VALIDATION ([[approbations]], entityType OFFBOARDING) : clôture
               RH/IT/finance avant de marquer TERMINE
Avancement : EtapeParcours.faite ⇄ Task DONE (synchronisé). Parcours TERMINE quand toutes faites.
```

## Résolution des responsables
- `RH`/`FINANCE`/`IT` → utilisateurs porteurs du rôle correspondant (réutilise la résolution de
  validateurs du moteur [[approbations]] — `ROLE`).
- `MANAGER` → `Employe.managerId` du concerné.
- `EMPLOYE` → l'employé lui-même (ex. « compléter son dossier », « rendre le badge »).

## Intégrations
- **Tâches** : chaque `EtapeParcours` ↔ une `Task` ([[projets-taches]]) → visible dans « Mes
  tâches » ; cocher la tâche complète l'étape (et inversement).
- **Événements** : `parcours.demarre`, `parcours.etape.en_retard` → notif/WhatsApp aux
  responsables ([[evenements-notifications]]).
- **Offboarding** : la clôture des accès peut émettre des événements vers les `users`
  (désactivation du compte) — additif, à coordonner.
- **Audit** : timeline complète arrivée/départ ([[audit]]) — utile pour la conformité.

---

## Endpoints (préfixe `/api/v1`)
| Méthode | Route | Permission |
|---------|-------|-----------|
| GET/POST/PATCH | `/parcours-modeles` (`?type`) | `rh.onboarding:read` / `rh.onboarding:manage` |
| GET/POST | `/parcours` (`?type&employeId&statut`) | `rh.onboarding:read` / `rh.onboarding:write` |
| POST | `/parcours/:id/instancier` | `rh.onboarding:write` (depuis un modèle → crée étapes + tâches) |
| PATCH | `/etapes-parcours/:id` | `rh.onboarding:write` (cocher faite, réassigner) |
| POST | `/parcours/:id/cloturer` | `rh.onboarding:manage` (offboarding : via validation) |
| GET | `/me/parcours` | `me:read` (l'employé voit son intégration/départ) |

---

## RBAC
- **`rh.onboarding:read/write/manage`** (RH). Les responsables d'étapes agissent via leurs
  **tâches** (`tasks:write`) — pas besoin de permission onboarding pour eux. L'employé voit son
  propre parcours (`me:read`). Admin `*`.

## Côté front
- `features/rh/onboarding` : Modèles de parcours (RH : éditeur d'étapes), Parcours en cours
  (suivi par employé, barre d'avancement, étapes faites/en retard), instanciation à l'embauche.
  « Mon intégration » / « Mon départ » côté collaborateur. Flag `VITE_MOCK_ONBOARDING`.
- Les étapes apparaissent **aussi** dans « Mes tâches » ([[projets-taches]]) des responsables.

## Récap co-dev
| # | Changement | Type |
|---|-----------|------|
| 1 | Modèles `ParcoursModele/EtapeModele/Parcours/EtapeParcours` + TENANT_MODELS + RLS | additif |
| 2 | Instanciation modèle → étapes + **création de `Task`** ([[projets-taches]]) + résolution responsables | logique |
| 3 | Synchro `EtapeParcours.faite` ⇄ `Task DONE` | intégration |
| 4 | Offboarding → validation ([[approbations]] `OFFBOARDING`) + désactivation accès `users` | intégration |
| 5 | Événements rappels + audit conformité | intégration |
| 6 | Déclenchement auto onboarding sur `rh.employe.create` | option |

> **Dépend de** [[projets-taches]] (tâches) et idéalement [[approbations]] (clôture départ).
> Réutilise au maximum l'existant : c'est de l'orchestration, pas un nouveau silo.
