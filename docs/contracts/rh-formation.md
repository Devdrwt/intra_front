# Contrat backend — **RH : Formation** (catalogue, sessions, demandes, compétences)

> Hand-off front → backend. Couche 3 (SIRH). Greenfield. Gère le **développement des
> compétences** : catalogue de formations, sessions planifiées, **demandes de formation
> (→ validation + budget)**, inscriptions/présence, et **compétences acquises** (référentiel
> partagé avec l'[[rh-evaluation]]). Bâti sur `Employe` (RH).
>
> **Branché moteurs** : [[approbations]] (demande → validation manager/RH, condition de budget),
> [[finance-pilotage]] / [[finance-depenses]] (coût & budget formation), événements
> [[evenements-notifications]] (rappels session), [[audit]], [[recherche]].

---

## Concepts
- **`Competence`** : référentiel partagé (code, libellé, catégorie). Lien avec les critères
  d'évaluation ([[rh-evaluation]] `CritereEvaluation.competenceCode`) → boucle « évaluer un écart
  → former → ré-évaluer ».
- **`Formation`** : une entrée de catalogue (interne/externe), compétences visées, coût, durée.
- **`SessionFormation`** : une occurrence planifiée (dates, lieu, formateur, capacité).
- **`DemandeFormation`** : un employé (ou son manager) demande une formation → **circuit
  d'approbation** (budget).
- **`Inscription`** : participation d'un employé à une session (présence, satisfaction,
  compétences validées).

## Modèle Prisma
```prisma
enum TypeFormation     { INTERNE EXTERNE EN_LIGNE }
enum StatutSession     { PLANIFIEE OUVERTE COMPLETE TERMINEE ANNULEE }
enum StatutDemandeForm { BROUILLON SOUMISE APPROUVEE REJETEE INSCRITE }
enum StatutInscription { INSCRIT PRESENT ABSENT ANNULE }

model Competence {
  id        String @id @default(uuid()) @db.Uuid
  tenantId  String @map("tenant_id") @db.Uuid
  code      String // "COMPTA_OHADA", "EXCEL_AV", "MANAGEMENT"
  libelle   String
  categorie String?
  @@unique([tenantId, code])
  @@map("competences")
}

model Formation {
  id            String   @id @default(uuid()) @db.Uuid
  tenantId      String   @map("tenant_id") @db.Uuid
  titre         String
  description   String?  @db.Text
  type          TypeFormation @default(EXTERNE)
  organisme     String?
  competencesVisees String[] @default([]) @map("competences_visees") // codes Competence
  coutEstime    Decimal? @db.Decimal(15,2) @map("cout_estime")
  dureeHeures   Int?     @map("duree_heures")
  actif         Boolean  @default(true)
  sessions      SessionFormation[]
  createdAt     DateTime @default(now()) @map("created_at")
  @@index([tenantId, actif])
  @@map("formations")
}

model SessionFormation {
  id          String   @id @default(uuid()) @db.Uuid
  tenantId    String   @map("tenant_id") @db.Uuid
  formationId String   @map("formation_id") @db.Uuid
  dateDebut   DateTime @db.Date @map("date_debut")
  dateFin     DateTime @db.Date @map("date_fin")
  lieu        String?
  formateur   String?
  capacite    Int?
  statut      StatutSession @default(PLANIFIEE)
  formation   Formation @relation(fields: [formationId], references: [id], onDelete: Cascade)
  inscriptions Inscription[]
  @@index([tenantId, formationId, statut])
  @@map("sessions_formation")
}

model DemandeFormation {
  id           String   @id @default(uuid()) @db.Uuid
  tenantId     String   @map("tenant_id") @db.Uuid
  reference    String   // "DF-2026-0001"
  employeId    String   @map("employe_id") @db.Uuid
  formationId  String?  @map("formation_id") @db.Uuid   // ou formation libre (texte) si hors catalogue
  formationLibre String? @map("formation_libre")
  motif        String?
  coutEstime   Decimal? @db.Decimal(15,2) @map("cout_estime")
  statut       StatutDemandeForm @default(BROUILLON)
  approvalRequestId String? @map("approval_request_id") @db.Uuid
  createdAt    DateTime @default(now()) @map("created_at")
  updatedAt    DateTime @updatedAt @map("updated_at")
  @@unique([tenantId, reference])
  @@index([tenantId, employeId, statut])
  @@map("demandes_formation")
}

model Inscription {
  id          String   @id @default(uuid()) @db.Uuid
  tenantId    String   @map("tenant_id") @db.Uuid
  sessionId   String   @map("session_id") @db.Uuid
  employeId   String   @map("employe_id") @db.Uuid
  demandeId   String?  @map("demande_id") @db.Uuid
  statut      StatutInscription @default(INSCRIT)
  satisfaction Int?    // 1..5 (post-formation)
  competencesValidees String[] @default([]) @map("competences_validees") // codes acquis
  session     SessionFormation @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  @@unique([tenantId, sessionId, employeId])
  @@index([tenantId, employeId])
  @@map("inscriptions")
}
```
> `TENANT_MODELS` + **RLS** + `tenantId` du JWT.

---

## Cycle de vie
```
DemandeFormation: BROUILLON ─soumettre→ SOUMISE ─(moteur FORMATION)→ APPROUVEE ─inscrire→ INSCRITE
                                              └─→ REJETEE
Session:          PLANIFIEE → OUVERTE → COMPLETE → TERMINEE
Inscription:      INSCRIT → PRESENT/ABSENT (émargement) → compétences validées
```
- **Demande** → `approvals.start('FORMATION', demandeId, payload:{ cout, departementId })`.
  Seed circuit : step 1 `MANAGER`, step 2 `ROLE=rh` **si** `cout > seuil` (cf. [[approbations]]).
- **Approuvée** → inscription à une `SessionFormation`.
- **Après la session** : émargement (PRESENT/ABSENT), satisfaction, **compétences validées** →
  alimentent le profil de l'employé et l'[[rh-evaluation]] (l'écart de compétence est comblé).

## Intégrations
- **Finance** : `coutEstime` → suivi du **budget formation** (axe dédié [[finance-pilotage]]) ;
  une formation externe payante peut générer une **facture fournisseur** ([[finance-depenses]]).
- **Boucle compétences** : évaluation détecte un écart → `planDeveloppement` propose une formation
  → après formation, compétence validée → ré-évaluation. C'est le cœur du « développement RH ».
- **Événements** : `formation.session.rappel` (J-2), `formation.demande.approuvee` → notif/WhatsApp.

---

## Endpoints (préfixe `/api/v1`)
| Méthode | Route | Permission |
|---------|-------|-----------|
| GET/POST/PATCH | `/competences` | `rh.formation:read` / `rh.formation:manage` |
| GET/POST/PATCH/DELETE | `/formations` (catalogue) | `rh.formation:read` / `rh.formation:manage` |
| GET/POST/PATCH | `/sessions-formation` (`?formationId&statut`) | `rh.formation:read` / `rh.formation:manage` |
| GET/POST | `/demandes-formation` (`?statut&mine`) | `rh.formation:read` / `rh.formation:write` |
| POST | `/demandes-formation/:id/soumettre` | `rh.formation:write` → circuit `FORMATION` |
| POST | `/sessions-formation/:id/inscriptions` | `rh.formation:write` `{employeId, demandeId?}` |
| PATCH | `/inscriptions/:id` | `rh.formation:write` (émargement, satisfaction, compétences) |
| GET | `/me/formations` | `me:read` (mes demandes + mes formations suivies) |

---

## RBAC
- **`rh.formation:read`** — catalogue/sessions (tous peuvent parcourir le catalogue). 
  **`rh.formation:write`** — demander/inscrire/émarger. **`rh.formation:manage`** — catalogue,
  sessions, compétences (RH). Validation = `approval:act`. `me:read` = mes formations. Admin `*`.

## Côté front
- `features/rh/formation` : Catalogue (cartes formations, compétences visées), Sessions
  (planning, inscriptions, émargement), Demandes (formulaire → soumettre, `<ApprovalTimeline>`),
  Compétences (référentiel). « Mes formations » + « Demander une formation » côté collaborateur
  (bouton proposé depuis le plan de développement de l'[[rh-evaluation]]). Flag `VITE_MOCK_FORMATION`.
- Montants **XOF**. Coûts reliés au budget formation ([[finance-pilotage]]).

## Récap co-dev
| # | Changement | Type |
|---|-----------|------|
| 1 | Modèles `Competence/Formation/SessionFormation/DemandeFormation/Inscription` + TENANT_MODELS + RLS | additif |
| 2 | Demande → `approvals.start('FORMATION')` ; `approval.completed` → statut ; seed circuit | intégration moteur |
| 3 | Compétences = référentiel partagé avec [[rh-evaluation]] (boucle évaluer→former→ré-évaluer) | intégration |
| 4 | Coût → budget formation [[finance-pilotage]] / facture fournisseur [[finance-depenses]] | intégration finance |
| 5 | Émargement + satisfaction + compétences validées ; événements rappels | additif |
| 6 | Réf auto `DF-AAAA-NNNN` | convention |

> **Dépend de** [[approbations]] (demandes) et du référentiel `Competence` (partagé évaluation).
> Boucle vertueuse SIRH : évaluation ↔ formation via les compétences.
