# Contrat backend — **Inventaire & Immobilisations** (matériel de l'entreprise)

> Hand-off front → backend. Couche 3 (domaine **Finance & Gestion**, pour le **comptable**).
> Greenfield. Recense **tout le patrimoine** de l'entreprise : immobilisations (matériel
> informatique, mobilier, véhicules, équipement studio…) et consommables, avec **valeur**,
> **localisation**, **affectation**, **état**, et base d'**amortissement** (SYSCOHADA classe 2).
>
> **Branché** : [[finance-core]] (compte SYSCOHADA classe 2, devise XOF), GED (factures/garanties),
> RH (affectation à un employé/service), [[audit]], [[recherche]]. Alimente le **bilan**
> (immobilisations) et les dotations aux amortissements.

---

## Concepts
- **`Bien`** : un élément du patrimoine — immobilisation (durable, amortissable) ou
  consommable/petit matériel (suivi en quantité).
- **`CategorieBien`** : référentiel (Informatique, Mobilier, Véhicule, Équipement studio, Outillage…).
- **Affectation** : à qui / quel service / quel lieu le bien est attribué.
- **Amortissement** (light V1) : durée + valeur nette dérivée (linéaire).

## Modèle Prisma
```prisma
enum TypeBien  { IMMOBILISATION CONSOMMABLE }
enum EtatBien  { NEUF BON USAGE HORS_SERVICE REFORME }

model CategorieBien {
  id        String @id @default(uuid()) @db.Uuid
  tenantId  String @map("tenant_id") @db.Uuid
  nom       String  // "Informatique", "Mobilier", "Véhicule"…
  compteCode String? @map("compte_code") // SYSCOHADA classe 2 (ex. 2441 matériel informatique)
  @@unique([tenantId, nom])
  @@map("categories_bien")
}

model Bien {
  id              String   @id @default(uuid()) @db.Uuid
  tenantId        String   @map("tenant_id") @db.Uuid
  reference       String   // code interne "INV-2026-0001" (étiquette/QR)
  nom             String
  type            TypeBien @default(IMMOBILISATION)
  categorieId     String?  @map("categorie_id") @db.Uuid
  etat            EtatBien @default(BON)
  quantite        Int      @default(1)
  // Valeur & amortissement (devise XOF, cf. [[finance-core]])
  valeurAcquisition Decimal? @db.Decimal(15,2) @map("valeur_acquisition")
  dateAcquisition   DateTime? @db.Date @map("date_acquisition")
  dureeAmortissementMois Int? @map("duree_amortissement_mois")
  // Localisation & affectation
  localisation    String?  // "Siège — Bureau 2"
  affecteAEmployeId String? @map("affecte_a_employe_id") @db.Uuid
  affecteAService String?  @map("affecte_a_service")
  // Traçabilité
  numeroSerie     String?  @map("numero_serie")
  factureDocumentId String? @map("facture_document_id") @db.Uuid // GED (facture/garantie)
  fournisseurId   String?  @map("fournisseur_id") @db.Uuid       // Tiers [[finance-core]]
  createdAt       DateTime @default(now()) @map("created_at")
  updatedAt       DateTime @updatedAt @map("updated_at")
  @@unique([tenantId, reference])
  @@index([tenantId, categorieId])
  @@index([tenantId, etat])
  @@map("biens")
}
```
> `TENANT_MODELS` + **RLS** + `tenantId` du JWT.

## Calculs (dérivés)
- **Valeur nette comptable (VNC)** ≈ `valeurAcquisition × (1 − mois_écoulés / dureeAmortissementMois)`,
  bornée à 0 (amortissement linéaire). Affichée, pas stockée.
- **Totaux** : valeur d'acquisition et VNC par catégorie / global → vue patrimoine du comptable.
- **Dotation annuelle** (V2) : `valeurAcquisition / (dureeAmortissementMois/12)` → écriture
  comptable d'amortissement (journal OD, [[finance-core]]).

## Intégrations
- **Acquisition** : un bien peut naître d'une **facture fournisseur** ([[finance-depenses]]) →
  pré-remplit valeur/fournisseur/facture.
- **Affectation RH** : lien employé/service (qui détient quoi) — utile à l'**offboarding**
  (récupérer le matériel, [[rh-onboarding]]).
- **Réforme/cession** : `HORS_SERVICE`/`REFORME` → sortie d'inventaire (V2 : plus/moins-value).
- **Recherche** : biens indexés ([[recherche]], `type=bien`).

## Endpoints (préfixe `/api/v1`)
| Méthode | Route | Permission |
|---------|-------|-----------|
| GET/POST/PATCH/DELETE | `/biens` (`?categorieId&etat&type&search&affecteA`) | `finance:read` / `finance:write` |
| GET | `/biens/stats` | `finance:read` → totaux valeur/VNC par catégorie |
| GET/POST/PATCH | `/categories-bien` | `finance:read` / `finance:manage` |
| GET | `/biens/export?format=csv` | `finance:export` (inventaire pour la compta) |

## RBAC
- **`finance:read`** (consulter l'inventaire), **`finance:write`** (saisir/modifier biens),
  **`finance:manage`** (catégories, comptes). Cf. [[finance-core]]. Rôle **comptable**.
  Option : permission dédiée `inventaire:*` si on veut ouvrir la saisie aux gestionnaires sans
  donner les autres droits finance.

## Côté front (livré)
- `features/inventaire` : **InventairePage** (liste filtrable par catégorie/état, recherche,
  création, badges d'état, valeur/VNC), **tuiles de totaux** (valeur du patrimoine par catégorie).
  Montants **XOF**. Flag `VITE_MOCK_INVENTAIRE`.

## Récap co-dev
| # | Changement | Type |
|---|-----------|------|
| 1 | Modèles `CategorieBien/Bien` + TENANT_MODELS + RLS | additif |
| 2 | Calcul VNC + `/biens/stats` (totaux par catégorie) | logique |
| 3 | Liens facture fournisseur ([[finance-depenses]]) + affectation RH (offboarding) | intégration |
| 4 | Réfs auto `INV-AAAA-NNNN` (étiquette/QR) | convention |
| 5 | (V2) Dotations aux amortissements → écritures OD ; cession/réforme | différé |
