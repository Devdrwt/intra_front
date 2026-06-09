# Contrat backend — **Appels d'offres** (veille AAO → DAO → soumission → suivi)

> Hand-off front → backend. Couche 3. Greenfield. **Opéré par le secrétariat.** Gère le cycle de
> réponse aux marchés : **veille des avis (AAO)** → constitution du **dossier (DAO)** →
> **soumission** (notre réponse + montant proposé) → **suivi du résultat**. Métier propre à
> Drwintech (entreprise de services répondant à des appels d'offres).
>
> ⚠️ **SPF n'est PAS un sous-élément de ce module.** C'est une **plateforme d'entreprise
> distincte** dont DrwinDesk **tirera des données à l'avenir** (intégration / connecteur — couche
> Intégrations, cf. note en bas). Hors périmètre du présent contrat.
>
> **Branché** : [[approbations]] (validation de la soumission avant dépôt), GED/Documents
> (pièces du DAO), [[evenements-notifications]] (échéances de dépôt), [[audit]], [[recherche]],
> et lien **projet** (un AAO gagné devient un projet, cf. [[projets-taches]]).

---

## Concepts
- **`AvisAppelOffres` (AAO)** : un avis repéré (veille) — objet, bailleur/client, dates clés,
  montant estimé, décision « on y va / on passe ».
- **`Soumission`** : notre réponse à un AAO retenu — regroupe le **dossier (DAO)** (pièces),
  la **proposition financière (SPF)** (montant proposé), le statut de dépôt et le **résultat**.
- **Pièces du dossier** : documents (administratifs, techniques, financiers) — via la GED.

## Cycle de vie
```
AAO:        REPERE ─décision→ A_SOUMETTRE (on y va) | ECARTE (on passe)
Soumission: EN_PREPARATION ─compléter DAO + SPF→ (validation [[approbations]] SOUMISSION)
            ─déposer→ DEPOSEE ─résultat→ GAGNEE | PERDUE | INFRUCTUEUSE
            GAGNEE ─convertir→ Projet ([[projets-taches]])
```

## Modèle Prisma
```prisma
enum StatutAao        { REPERE A_SOUMETTRE ECARTE }
enum StatutSoumission { EN_PREPARATION DEPOSEE GAGNEE PERDUE INFRUCTUEUSE }
enum TypePieceDao     { ADMINISTRATIVE TECHNIQUE FINANCIERE }

model AvisAppelOffres {
  id            String     @id @default(uuid()) @db.Uuid
  tenantId      String     @map("tenant_id") @db.Uuid
  reference     String     // "AAO-2026-0001"
  objet         String
  bailleur      String?    // client / bailleur émetteur
  source        String?    // d'où vient l'avis (site, journal…)
  datePublication DateTime? @db.Date @map("date_publication")
  dateLimite    DateTime?  @db.Date @map("date_limite")  // échéance de dépôt
  montantEstime Decimal?   @db.Decimal(15,2) @map("montant_estime")
  statut        StatutAao  @default(REPERE)
  soumission    Soumission?
  createdAt     DateTime   @default(now()) @map("created_at")
  updatedAt     DateTime   @updatedAt @map("updated_at")
  @@unique([tenantId, reference])
  @@index([tenantId, statut, dateLimite])
  @@map("avis_appel_offres")
}

model Soumission {
  id            String           @id @default(uuid()) @db.Uuid
  tenantId      String           @map("tenant_id") @db.Uuid
  aaoId         String           @unique @map("aao_id") @db.Uuid
  statut        StatutSoumission @default(EN_PREPARATION)
  // Notre proposition financière (montant proposé dans la soumission)
  montantPropose Decimal?        @db.Decimal(15,2) @map("montant_propose")
  dateDepot     DateTime?        @db.Date @map("date_depot")
  resultatLe    DateTime?        @db.Date @map("resultat_le")
  motifResultat String?          @map("motif_resultat")
  approvalRequestId String?      @map("approval_request_id") @db.Uuid
  projetId      String?          @map("projet_id") @db.Uuid  // si GAGNEE → projet créé
  pieces        PieceDao[]
  aao           AvisAppelOffres  @relation(fields: [aaoId], references: [id], onDelete: Cascade)
  createdAt     DateTime         @default(now()) @map("created_at")
  updatedAt     DateTime         @updatedAt @map("updated_at")
  @@index([tenantId, statut])
  @@map("soumissions")
}

model PieceDao {
  id           String      @id @default(uuid()) @db.Uuid
  tenantId     String      @map("tenant_id") @db.Uuid
  soumissionId String      @map("soumission_id") @db.Uuid
  type         TypePieceDao
  nom          String
  documentId   String?     @map("document_id") @db.Uuid  // GED
  fournie      Boolean     @default(false)
  soumission   Soumission  @relation(fields: [soumissionId], references: [id], onDelete: Cascade)
  @@index([tenantId, soumissionId])
  @@map("pieces_dao")
}
```
> `TENANT_MODELS` + **RLS** + `tenantId` du JWT.

## Intégrations
- **Validation** : avant `DEPOSEE`, la soumission passe par [[approbations]] (`entityType
  SOUMISSION`) — visa direction sur le montant proposé.
- **Échéances** : cron → `aao.echeance_depot` (J-3, J-1) si `dateLimite` proche → notif/WhatsApp.
- **Conversion** : `GAGNEE` → bouton « Créer le projet » → `Project` ([[projets-taches]],
  `projetId` renseigné) ; le montant proposé devient le budget/recette prévue du projet.
- **Pièces DAO** : rattachées à la GED (réutilise Documents) — checklist administrative/technique/financière.

## Endpoints (préfixe `/api/v1`)
| Méthode | Route | Permission |
|---------|-------|-----------|
| GET/POST/PATCH/DELETE | `/aao` (`?statut`) | `commercial:read` / `commercial:write` |
| PATCH | `/aao/:id/decision` `{ statut: A_SOUMETTRE|ECARTE }` | `commercial:write` |
| GET/POST/PATCH | `/soumissions` (`?statut`) | `commercial:read` / `commercial:write` |
| POST | `/soumissions/:id/soumettre` | `commercial:write` → circuit validation puis dépôt |
| POST | `/soumissions/:id/resultat` `{ statut, motif? }` | `commercial:write` |
| POST | `/soumissions/:id/convertir-projet` | `commercial:manage` → crée le projet |
| GET/POST/PATCH | `/soumissions/:id/pieces` | `commercial:write` |

## RBAC
- **`commercial:read`** / **`commercial:write`** / **`commercial:manage`** (à créer ; admin a `*`).
  **Opéré par le secrétariat** → rôle **`secretariat`** porteur de ces permissions.

---

## Note — SPF (plateforme externe, intégration future)
**SPF** est une **plateforme d'entreprise distincte** (hors DrwinDesk). À terme, DrwinDesk en
**ingérera des données** via un **connecteur** (couche Intégrations) — ex. import périodique ou
API — pour enrichir le suivi des affaires. **Rien à modéliser ici** ; à traiter, le moment venu,
comme une **source de données externe** (mapping vers `AvisAppelOffres`/`Soumission` ou un module
dédié selon ce que SPF expose). À cadrer quand on saura ce que SPF fournit.

## Côté front (livré)
- `features/appels-offres` : **Veille** (liste AAO + décision on-y-va/on-passe, échéances),
  **Soumissions** (préparation : checklist DAO + montant SPF, soumettre, résultat), conversion
  en projet. Flag `VITE_MOCK_COMMERCIAL`. Badges d'échéance (J-3/dépassé).

## Récap co-dev
| # | Changement | Type |
|---|-----------|------|
| 1 | Modèles `AvisAppelOffres/Soumission/PieceDao` + TENANT_MODELS + RLS | additif |
| 2 | Validation soumission ([[approbations]] `SOUMISSION`) + échéances ([[evenements-notifications]]) | intégration |
| 3 | Conversion `GAGNEE` → `Project` ([[projets-taches]]) | intégration |
| 4 | Pièces DAO rattachées GED | intégration |
| 5 | Réfs auto `AAO-AAAA-NNNN` | convention |
