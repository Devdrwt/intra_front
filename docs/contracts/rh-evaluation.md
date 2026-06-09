# Contrat backend — **RH : Évaluation & Objectifs (OKR)**

> Hand-off front → backend. Couche 3 (SIRH). Greenfield. Deux briques liées : **(A) Objectifs /
> OKR** (objectifs + résultats clés mesurables) et **(B) Campagnes d'évaluation** (auto-évaluation
> + évaluation manager + entretien). Bâti sur le module **RH** existant (`Employe`, qui a `userId`,
> `managerId` à ajouter cf. [[finance-core]]).
>
> **Branché moteurs** : événements [[evenements-notifications]] (rappels campagne/échéance OKR),
> self-service [[espace-collaborateur]] (mes objectifs, mon auto-évaluation), journal [[audit]],
> recherche [[recherche]]. **Compétences partagées** avec [[rh-formation]] (une formation comble
> un écart de compétence détecté en évaluation).

---

# ── A. Objectifs / OKR ──

## Modèle Prisma
```prisma
enum NiveauObjectif { INDIVIDUEL EQUIPE ENTREPRISE }
enum StatutObjectif { BROUILLON ACTIF ATTEINT PARTIEL ABANDONNE }

model Objectif {
  id          String   @id @default(uuid()) @db.Uuid
  tenantId    String   @map("tenant_id") @db.Uuid
  niveau      NiveauObjectif @default(INDIVIDUEL)
  employeId   String?  @map("employe_id") @db.Uuid   // null si EQUIPE/ENTREPRISE
  departement String?  // si niveau EQUIPE
  periode     String   // "2026-T1", "2026" — trimestre/année
  titre       String
  description String?  @db.Text
  poids       Int      @default(1)        // pondération dans la note OKR
  progression Int      @default(0)        // 0..100, dérivée des résultats clés
  statut      StatutObjectif @default(ACTIF)
  parentId    String?  @map("parent_id") @db.Uuid   // alignement (OKR entreprise ← équipe ← individu)
  resultatsCles ResultatCle[]
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")
  @@index([tenantId, employeId, periode])
  @@map("objectifs")
}

model ResultatCle {
  id           String  @id @default(uuid()) @db.Uuid
  tenantId     String  @map("tenant_id") @db.Uuid
  objectifId   String  @map("objectif_id") @db.Uuid
  libelle      String
  valeurCible  Decimal @db.Decimal(15,2) @map("valeur_cible")
  valeurActuelle Decimal @default(0) @db.Decimal(15,2) @map("valeur_actuelle")
  valeurInitiale Decimal @default(0) @db.Decimal(15,2) @map("valeur_initiale")
  unite        String? // "%", "FCFA", "clients"…
  objectif     Objectif @relation(fields: [objectifId], references: [id], onDelete: Cascade)
  @@index([tenantId, objectifId])
  @@map("resultats_cles")
}
```
- **Progression objectif** = moyenne des progressions des résultats clés
  (`(actuelle−initiale)/(cible−initiale)`, bornée 0..100).
- **Alignement** : `parentId` relie OKR individuel → équipe → entreprise (cascade de sens).

---

# ── B. Campagnes d'évaluation ──

## Cycle de vie
```
Campagne: PLANIFIEE ─lancer→ EN_COURS ─clôturer→ CLOTUREE
Évaluation (par employé): A_FAIRE ─auto-éval→ AUTO_FAITE ─éval manager→ EVALUEE
                          ─entretien/validation→ VALIDEE
```

## Modèle Prisma
```prisma
enum TypeCampagne   { ANNUELLE SEMESTRIELLE PROBATOIRE PONCTUELLE }
enum StatutCampagne { PLANIFIEE EN_COURS CLOTUREE }
enum StatutEvaluation { A_FAIRE AUTO_FAITE EVALUEE VALIDEE }

model CritereEvaluation {     // grille (référentiel, seedé/éditable)
  id        String @id @default(uuid()) @db.Uuid
  tenantId  String @map("tenant_id") @db.Uuid
  libelle   String            // "Qualité du travail", "Esprit d'équipe", compétence métier…
  categorie String?           // "Savoir-être", "Compétences techniques"…
  competenceCode String?      @map("competence_code") // lien [[rh-formation]] (référentiel compétences)
  actif     Boolean @default(true)
  ordre     Int     @default(0)
  @@map("criteres_evaluation")
}

model CampagneEvaluation {
  id        String   @id @default(uuid()) @db.Uuid
  tenantId  String   @map("tenant_id") @db.Uuid
  nom       String
  type      TypeCampagne
  statut    StatutCampagne @default(PLANIFIEE)
  periode   String   // "2026"
  dateDebut DateTime @db.Date @map("date_debut")
  dateFin   DateTime @db.Date @map("date_fin")
  evaluations Evaluation[]
  createdAt DateTime @default(now()) @map("created_at")
  @@map("campagnes_evaluation")
}

model Evaluation {
  id          String   @id @default(uuid()) @db.Uuid
  tenantId    String   @map("tenant_id") @db.Uuid
  campagneId  String   @map("campagne_id") @db.Uuid
  employeId   String   @map("employe_id") @db.Uuid
  evaluateurId String  @map("evaluateur_id") @db.Uuid   // manager (résolu via Employe.managerId)
  statut      StatutEvaluation @default(A_FAIRE)
  noteGlobale Decimal? @db.Decimal(4,2)   // ex. /5 ou /20, calculée des lignes
  commentaireEmploye String? @db.Text     // ressenti auto-éval
  commentaireManager String? @db.Text
  planDeveloppement  String? @db.Text     // → peut générer des demandes de formation [[rh-formation]]
  lignes      LigneEvaluation[]
  campagne    CampagneEvaluation @relation(fields: [campagneId], references: [id], onDelete: Cascade)
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")
  @@unique([tenantId, campagneId, employeId])
  @@index([tenantId, evaluateurId, statut])
  @@map("evaluations")
}

model LigneEvaluation {
  id           String  @id @default(uuid()) @db.Uuid
  tenantId     String  @map("tenant_id") @db.Uuid
  evaluationId String  @map("evaluation_id") @db.Uuid
  critereId    String  @map("critere_id") @db.Uuid
  noteAuto     Decimal? @db.Decimal(4,2) @map("note_auto")     // posée par l'employé
  noteManager  Decimal? @db.Decimal(4,2) @map("note_manager")  // posée par le manager
  commentaire  String?
  evaluation   Evaluation @relation(fields: [evaluationId], references: [id], onDelete: Cascade)
  @@index([tenantId, evaluationId])
  @@map("lignes_evaluation")
}
```
> `TENANT_MODELS` + **RLS** + `tenantId` du JWT sur tous les modèles.

---

## Validation & confidentialité
- **Validation finale** : l'évaluation passe par le moteur ([[approbations]], `entityType` à
  ajouter `EVALUATION`) si l'organisation veut un visa RH ; sinon flux de statut simple. La
  signature/acquittement de l'employé est tracée ([[audit]]).
- **Confidentialité** : une évaluation n'est visible que par **l'employé concerné, son manager,
  et RH** (enforcement serveur). Les notes d'autrui ne fuient jamais.

## Intégrations
- **Événements** : `eval.campagne.lancee` (→ notif à tous), `eval.auto.rappel`,
  `objectif.echeance` → [[evenements-notifications]] (in-app/WhatsApp).
- **Lien formation** : un `planDeveloppement` ou un critère faible (compétence) peut **proposer
  une formation** ([[rh-formation]]) — bouton « créer une demande de formation ».
- **Lien pilotage** : taux d'atteinte des OKR par équipe → dashboard direction.

---

---

# ── C. Performance & recommandation (basée sur le travail réel) ──

> Le cœur de l'évaluation : noter la **performance** d'un collaborateur à partir de ses
> **activités, rapports et missions réels** (pas une grille abstraite), et produire une
> **recommandation**. Agrège des données déjà dans la plateforme.

## Indicateurs agrégés (sources)
| Indicateur | Source |
|-----------|--------|
| **Taux de rapports** (soumis / attendus) | module `rapports` ([[espace-collaborateur]]) |
| **Missions/tâches** (terminées / total) | module `tasks` ([[projets-taches]]) |
| **Activité / présence** (taux présence, ponctualité) | module `presences` |
| **Atteinte des OKR** | Partie A ci-dessus |
| **Score global** | pondération des 4 (configurable) → 0..100 |

## Modèle Prisma (additif)
```prisma
enum TypeRecommandation { RECONDUCTION PROMOTION FORMATION AVERTISSEMENT AUTRE }

model SynthesePerformance {
  id            String   @id @default(uuid()) @db.Uuid
  tenantId      String   @map("tenant_id") @db.Uuid
  employeId     String   @map("employe_id") @db.Uuid
  periode       String   // "2026-T1"
  // Indicateurs figés au moment de la synthèse (snapshot)
  tauxRapports  Int?     @map("taux_rapports")     // %
  tachesTerminees Int?   @map("taches_terminees")
  tachesTotal   Int?     @map("taches_total")
  tauxPresence  Int?     @map("taux_presence")     // %
  tauxOkr       Int?     @map("taux_okr")          // %
  scoreGlobal   Int?     @map("score_global")      // 0..100
  // Recommandation (saisie manager OU générée IA, toujours validée par un humain)
  recommandation     String?            @db.Text
  typeRecommandation TypeRecommandation? @map("type_recommandation")
  evaluationId  String?  @map("evaluation_id") @db.Uuid  // rattachable à une Evaluation de campagne
  createdAt     DateTime @default(now()) @map("created_at")
  updatedAt     DateTime @updatedAt @map("updated_at")
  @@unique([tenantId, employeId, periode])
  @@index([tenantId, employeId])
  @@map("syntheses_performance")
}
```

## Logique
- `GET /performance?periode=` → calcule/retourne, par employé, les indicateurs agrégés
  (lecture des modules sources, scopée permissions) + la `recommandation` si déjà saisie.
- **Recommandation IA** : `POST /performance/:employeId/recommandation/generer` → l'[[assistant-ia]]
  rédige une recommandation **à partir des indicateurs** (les chiffres viennent du backend,
  l'IA rédige autour — anti-hallucination) → **brouillon**, validé/édité par le manager.
- `PUT /performance/:employeId/recommandation` → enregistre la recommandation finale (+ type).
- **Confidentialité** : visible employé concerné / manager / RH uniquement.

## Endpoints additifs (performance)
| Méthode | Route | Permission |
|---------|-------|-----------|
| GET | `/performance` (`?periode&employeId`) | `rh.eval:read` |
| POST | `/performance/:employeId/recommandation/generer` | `rh.eval:write` (IA, brouillon) |
| PUT | `/performance/:employeId/recommandation` | `rh.eval:write` |
| GET | `/me/performance` | `me:read` (la mienne) |

---

## Endpoints (préfixe `/api/v1`)
| Méthode | Route | Permission |
|---------|-------|-----------|
| GET/POST/PATCH/DELETE | `/objectifs` (`?employeId&periode&niveau`) | `rh.eval:read` / `rh.eval:write` |
| PATCH | `/resultats-cles/:id` | `rh.eval:write` (maj `valeurActuelle`) |
| GET | `/me/objectifs` | `me:read` (les miens) |
| GET/POST/PATCH | `/criteres-evaluation` | `rh.eval:read` / `rh.eval:manage` |
| GET/POST/PATCH | `/campagnes-evaluation` | `rh.eval:read` / `rh.eval:manage` |
| POST | `/campagnes-evaluation/:id/lancer` | `rh.eval:manage` → génère 1 `Evaluation`/employé |
| GET | `/evaluations` (`?campagneId&statut&mine`) | `rh.eval:read` |
| GET | `/me/evaluations` · `PATCH /evaluations/:id/auto` | `me:read` / `me:write` (auto-éval) |
| PATCH | `/evaluations/:id/evaluer` · `/valider` | `rh.eval:write` (manager) / `rh.eval:manage` |

---

## RBAC
- **`rh.eval:read`** — consulter (RH, manager pour son équipe). **`rh.eval:write`** — évaluer (manager).
  **`rh.eval:manage`** — grilles, campagnes (RH). **`me:read/write`** — mes objectifs + mon
  auto-évaluation. L'admin a `*`.

## Côté front
- `features/rh/evaluation` : OKR (cartes objectifs + barres de résultats clés, alignement),
  Campagnes (RH : créer/lancer/suivre), Évaluation (auto-éval employé, grille manager côte à côte
  auto/manager, entretien, plan de développement). « Mes objectifs » + « Mon évaluation » dans
  l'espace collaborateur. Flag `VITE_MOCK_EVAL`.

## Récap co-dev
| # | Changement | Type |
|---|-----------|------|
| 1 | Modèles OKR (`Objectif`,`ResultatCle`) + évaluation (`Critere`,`Campagne`,`Evaluation`,`Ligne`) + TENANT_MODELS + RLS | additif |
| 2 | Génération des évaluations au lancement de campagne (1/employé, manager = `Employe.managerId`) | logique |
| 3 | Progression OKR + note globale dérivées | logique |
| 4 | Événements rappels/échéances + confidentialité stricte | intégration |
| 5 | Lien compétences ↔ [[rh-formation]] ; `entityType EVALUATION` ([[approbations]]) optionnel | intégration |
