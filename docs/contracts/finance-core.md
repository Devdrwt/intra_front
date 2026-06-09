# Contrat backend — **Cœur financier** (Tiers, plan comptable SYSCOHADA, export)

> Hand-off front → backend. **Clé de voûte de la couche 3 — domaine Finance & Gestion.**
> C'est la fondation qui rend chaque opération (frais, achat, facture, trésorerie, paie)
> **exportable en comptabilité OHADA/SYSCOHADA** sans (encore) construire un grand livre complet.
>
> **Ambition retenue (user)** : **(A) opérationnel + export SYSCOHADA en V1**, **écritures auto
> (grand livre) en V2**. Mobile Money **manuel d'abord, API plus tard**. Tous les modules finance
> sont visés ([[drwindesk-roadmap]]).
>
> **Principe** : aucun module finance ne réinvente « comment ça se comptabilise ». Il **tague**
> ses documents avec un compte/journal/taxe et expose `toAccountingLines()` ; un
> **`FinanceExportService` central** produit l'export. Les modules réutilisent aussi les moteurs
> couche 2 : approbations ([[approbations]]), journal ([[audit]]), notifications/WhatsApp
> ([[evenements-notifications]]), recherche ([[recherche]]).

---

## Contexte ouest-africain (les invariants à respecter)

- **Devise** : **XOF (Franc CFA)** — franc entier (pas de centimes en usage courant), mais on
  stocke en `Decimal(15,2)` pour la robustesse. Champ `devise` par défaut `XOF`.
- **Norme** : **SYSCOHADA révisé** (plan comptable OHADA). Classes 1→8, comptes à 6+ chiffres.
- **Tiers** : **IFU** (Identifiant Fiscal Unique, Bénin) + **RCCM** (registre commerce) sur les tiers.
- **TVA** : **18 %** (taux normal Bénin), + exonéré + **retenues** (AIB, etc.).
- **Social/fiscal paie** (pour le module Paie) : **CNSS**, **ITS** — cf. contrat paie dédié.
- **Acquis** : `Employe.userId` existe (lien compte↔fiche RH) ; il manque `managerId` (pour le
  moteur d'approbations) — à ajouter quand on câble les circuits finance.

---

## Séquencement du domaine Finance (vue d'ensemble)

| Ordre | Contrat | Rôle |
|------|---------|------|
| **0** | **`finance-core` (ce doc)** | Référentiels + convention de comptabilisation + export |
| 1 | `finance-depenses` | Notes de frais + Achats/Fournisseurs (→ moteur approbations) |
| 2 | `finance-recettes` | Facturation client + encaissements + relances WhatsApp |
| 3 | `finance-tresorerie` | Caisse / banque / Mobile Money, soldes, rapprochement |
| 4 | `finance-paie` | Éléments variables, bulletins, CNSS/ITS, virement MoMo |
| 5 | `finance-pilotage` | Budgets, tableaux de bord, (V2) états financiers SYSCOHADA |

> Chaque module opérationnel **dépend de ce cœur** (comptes, journaux, taxes, tiers, export).

---

## Modèle Prisma — référentiels (V1)

```prisma
enum TiersType { CLIENT FOURNISSEUR LES_DEUX }
enum ClasseCompte { C1 C2 C3 C4 C5 C6 C7 C8 } // SYSCOHADA : 1 fin. 2 immo 3 stocks 4 tiers 5 trésor 6 charges 7 produits 8 résultats
enum TypeJournal { ACHAT VENTE BANQUE CAISSE OD PAIE }

model Tiers {
  id          String     @id @default(uuid()) @db.Uuid
  tenantId    String     @map("tenant_id") @db.Uuid
  type        TiersType
  code        String     // "CL-0001" / "FO-0001" auto (cf. [[matricule]])
  nom         String
  ifu         String?    // Identifiant Fiscal Unique
  rccm        String?
  email       String?
  telephone   String?    // numéro MoMo possible
  adresse     String?
  // Compte de tiers SYSCOHADA par défaut (411x clients / 401x fournisseurs)
  compteCode  String?    @map("compte_code")
  actif       Boolean    @default(true)
  createdAt   DateTime   @default(now()) @map("created_at")
  updatedAt   DateTime   @updatedAt @map("updated_at")
  @@unique([tenantId, code])
  @@index([tenantId, type])
  @@map("tiers")
}

model CompteComptable {           // Plan comptable SYSCOHADA (seedé, éditable)
  id        String       @id @default(uuid()) @db.Uuid
  tenantId  String       @map("tenant_id") @db.Uuid
  code      String       // "401100", "411000", "521000", "601000", "445100"…
  libelle   String
  classe    ClasseCompte
  actif     Boolean      @default(true)
  @@unique([tenantId, code])
  @@index([tenantId, classe])
  @@map("comptes_comptables")
}

model JournalComptable {          // Seedé : AC/VE/BQ/CA/OD/PA
  id        String      @id @default(uuid()) @db.Uuid
  tenantId  String      @map("tenant_id") @db.Uuid
  code      String      // "AC","VE","BQ","CA","OD","PA"
  libelle   String
  type      TypeJournal
  // Compte de contrepartie par défaut (ex. journal BANQUE → 521000)
  compteContrepartie String? @map("compte_contrepartie")
  @@unique([tenantId, code])
  @@map("journaux_comptables")
}

model Taxe {
  id         String  @id @default(uuid()) @db.Uuid
  tenantId   String  @map("tenant_id") @db.Uuid
  code       String  // "TVA18","EXO","AIB"
  libelle    String
  taux       Decimal @db.Decimal(5,2)   // 18.00, 0.00…
  compteCode String? @map("compte_code") // 443/445 TVA
  actif      Boolean @default(true)
  @@unique([tenantId, code])
  @@map("taxes")
}

model ExerciceComptable {
  id        String   @id @default(uuid()) @db.Uuid
  tenantId  String   @map("tenant_id") @db.Uuid
  annee     Int      // 2026
  debut     DateTime @db.Date
  fin       DateTime @db.Date
  cloture   Boolean  @default(false)  // exercice clôturé = lecture seule
  @@unique([tenantId, annee])
  @@map("exercices_comptables")
}
```

> **À ne pas oublier** : les 5 modèles dans **`TENANT_MODELS`** + **RLS** + `tenantId` du JWT.

---

## La convention de comptabilisation (le vrai apport)

Plutôt qu'un grand livre dès le V1, **chaque document opérationnel porte ses tags comptables** et
sait produire des **lignes d'écriture équilibrées** :

```ts
// Implémenté par NoteDeFrais, FactureClient, FactureFournisseur, MouvementTresorerie, BulletinPaie…
interface Comptabilisable {
  toAccountingLines(ctx): LigneExport[];   // débit = crédit (équilibré)
}
interface LigneExport {
  date: string;            // ISO
  journalCode: string;     // "AC","VE","BQ"…
  compteCode: string;      // compte SYSCOHADA
  tiersCode?: string;      // si compte de tiers (401/411)
  libelle: string;
  debit: number;           // XOF
  credit: number;          // XOF
  pieceRef: string;        // n° de la pièce source (facture, frais…)
  taxeCode?: string;
}
```

Exemple — **facture fournisseur 118 000 XOF TTC (TVA 18 %)** → 3 lignes :
| journal | compte | tiers | débit | crédit |
|--------|--------|-------|------:|------:|
| AC | 601000 (achat) | | 100 000 | |
| AC | 445100 (TVA déductible) | | 18 000 | |
| AC | 401100 (fournisseur) | FO-0001 | | 118 000 |

→ Le **`FinanceExportService`** agrège ces lignes sur une période et produit l'export. Aucun
module ne parle « débit/crédit » au comptable directement : il remplit un document métier simple,
la convention fait le reste.

---

## Export comptable (le livrable « comptable à l'aise »)

```
GET /finance/export?from=2026-01-01&to=2026-03-31&format=csv|fec|syscohada
    [&journal=AC]   (permission finance:export)
→ fichier (text/csv) : colonnes Journal, Date, Compte, Tiers, Libellé, Débit, Crédit, Pièce, TVA
```
- **`csv`** : tableur générique (le cabinet importe). **`fec`** : Fichier des Écritures Comptables
  (format ligne réglementaire). **`syscohada`** : gabarit attendu par les logiciels OHADA (Sage,
  etc.) — colonnes/ordre à confirmer avec le comptable cible.
- Scope par **exercice** / dates. Un exercice **clôturé** est figé.
- C'est ce qui permet à (A) : le comptable garde son outil légal, DrwinDesk lui fournit des
  écritures propres, déjà ventilées et équilibrées.

---

## Endpoints (préfixe `/api/v1`)

| Méthode | Route | Permission | Réponse |
|---------|-------|-----------|---------|
| GET/POST/PATCH/DELETE | `/tiers` | `finance:read` / `finance:manage` | CRUD clients/fournisseurs (`?type=`) |
| GET/POST/PATCH | `/comptes-comptables` | `finance:read` / `finance:manage` | plan comptable (seedé, éditable) |
| GET/POST/PATCH | `/journaux-comptables` | `finance:read` / `finance:manage` | journaux |
| GET/POST/PATCH | `/taxes` | `finance:read` / `finance:manage` | taxes |
| GET/POST/PATCH | `/exercices` | `finance:read` / `finance:manage` | exercices (clôture = `finance:manage`) |
| GET | `/finance/export` | `finance:export` | export CSV/FEC/SYSCOHADA |

---

## RBAC

- **`finance:read`** — consulter référentiels, documents, tableaux de bord (comptable, gestionnaires).
- **`finance:write`** — créer/éditer les documents opérationnels (frais, factures, mouvements).
- **`finance:manage`** — référentiels (plan comptable, journaux, taxes), clôture d'exercice.
- **`finance:export`** — produire les exports comptables (comptable / direction).
- L'admin a `*`. Rôle suggéré **`comptable`** = `finance:read|write|export` (+ `approval:act` pour
  valider frais/achats côté finance). Rôle **`gestionnaire`** = `finance:read` + budgets.

---

## Seed conseillé (Bénin / SYSCOHADA)

- **Plan comptable** : importer un **plan SYSCOHADA de base** (comptes usuels des classes 4/5/6/7 :
  401, 411, 445, 521, 571 caisse, 601, 602, 622, 641, 661, 701…). Source = gabarit OHANGE/OHADA.
- **Journaux** : AC (Achats), VE (Ventes), BQ (Banque), CA (Caisse), OD (Opérations diverses),
  PA (Paie).
- **Taxes** : `TVA18` (18 %, compte 443/445), `EXO` (0 %), `AIB` (retenue).
- **Exercice** : année courante ouverte.
- **Tiers** : quelques clients/fournisseurs démo.

---

## Côté front (ce que je brancherai)

- `features/finance` (parent) + sous-features par module. Flag `VITE_MOCK_FINANCE`.
- **Paramètres → Comptabilité** (admin/`finance:manage`) : plan comptable, journaux, taxes, exercices.
- **Tiers** : page clients/fournisseurs (liste, fiche, solde) — référentiel partagé par recettes/dépenses.
- **Export** : bouton « Exporter pour la comptabilité » (sélecteur période + format) → téléchargement.
- Tous les montants formatés **XOF** (séparateur milliers, « FCFA »), zéro décimale à l'affichage.
- Recherche : Tiers indexés ([[recherche]], `type=tiers`).

---

## ── V2 (différé) ──

- **Grand livre embarqué** : matérialiser les `LigneExport` dans `MouvementComptable` / `LigneEcriture`
  (écritures officielles, numérotées par journal/exercice) → **balance**, **grand livre**, **compte
  de résultat / bilan SYSCOHADA** générés dans DrwinDesk. C'est le pont (A)→(B).
- **Lettrage** (rapprochement facture↔paiement), **à-nouveaux** d'exercice, **multi-devises**.
- **Lecture auto de factures** (doc intelligence, capitalise `ged-intelligent`) → pré-remplit les
  factures fournisseurs.

---

## Récap pour le co-dev backend

| # | Changement | Type |
|---|-----------|------|
| 1 | Modèles `Tiers/CompteComptable/JournalComptable/Taxe/ExerciceComptable` + TENANT_MODELS + RLS | additif |
| 2 | Seed plan SYSCOHADA + journaux + taxes Bénin + exercice courant | additif |
| 3 | Interface `Comptabilisable.toAccountingLines()` + `FinanceExportService` | additif |
| 4 | `GET /finance/export` (csv/fec/syscohada) | additif |
| 5 | Convention monétaire `Decimal(15,2)` + `devise='XOF'` partout | convention |
| 6 | `Employe.managerId` (pour circuits d'approbation finance) | additif RH |
| 7 | (V2) Grand livre matérialisé + états financiers | différé |

> **Format SYSCOHADA d'export à confirmer** avec un comptable cible (colonnes/ordre exacts du
> logiciel qu'il utilise). C'est le seul point qui demande une validation métier externe.
