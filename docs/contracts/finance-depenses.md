# Contrat backend — **Finance : Dépenses** (notes de frais + achats/fournisseurs)

> Hand-off front → backend. Module **1** du domaine Finance ([[finance-core]]). Couvre **l'argent
> qui sort** : (A) **notes de frais** des collaborateurs, (B) **achats → fournisseurs**
> (demande → bon de commande → facture fournisseur). Greenfield.
>
> **Branché sur les moteurs** : validation via [[approbations]] (`entityType` `EXPENSE` et
> `PURCHASE`, déjà prévus), journalisation [[audit]], notifications/WhatsApp
> [[evenements-notifications]], recherche [[recherche]]. **Comptabilisation** via la convention
> `toAccountingLines()` de [[finance-core]] (compte/journal/taxe → lignes équilibrées → export).
> **Mobile Money = manuel** (réf. de paiement saisie), API plus tard.

---

# ── A. Notes de frais ──

## Cycle de vie
```
BROUILLON ─soumettre→ SOUMISE ─(moteur EXPENSE)→ APPROUVEE ─rembourser→ REMBOURSEE
                                      └─→ REJETEE
```
- Soumission → `approvals.start('EXPENSE', noteId, requesterId, payload:{ montant, departementId })`.
- Verdict (`approval.completed`) → `APPROUVEE` / `REJETEE`.
- Remboursement (action `finance:write`) → saisie `modePaiement` + `paiementRef` (n° MoMo,
  réf. virement) → `REMBOURSEE` → crée un **mouvement de trésorerie** ([[finance-tresorerie]]).

## Modèle Prisma
```prisma
enum StatutNoteFrais { BROUILLON SOUMISE APPROUVEE REJETEE REMBOURSEE }
enum ModePaiement   { ESPECES VIREMENT MOBILE_MONEY CHEQUE }

model NoteDeFrais {
  id           String          @id @default(uuid()) @db.Uuid
  tenantId     String          @map("tenant_id") @db.Uuid
  reference    String          // "NF-2026-0001" (auto, cf. [[matricule]])
  employeId    String          @map("employe_id") @db.Uuid   // le demandeur
  titre        String
  statut       StatutNoteFrais @default(BROUILLON)
  devise       String          @default("XOF")
  montantHt    Decimal         @default(0) @db.Decimal(15,2) @map("montant_ht")
  montantTva   Decimal         @default(0) @db.Decimal(15,2) @map("montant_tva")
  montantTtc   Decimal         @default(0) @db.Decimal(15,2) @map("montant_ttc")
  modePaiement ModePaiement?   @map("mode_paiement")
  paiementRef  String?         @map("paiement_ref")     // n° MoMo / virement (manuel V1)
  payeLe       DateTime?       @map("paye_le")
  approvalRequestId String?    @map("approval_request_id") @db.Uuid
  lignes       LigneNoteFrais[]
  createdAt    DateTime        @default(now()) @map("created_at")
  updatedAt    DateTime        @updatedAt @map("updated_at")
  @@unique([tenantId, reference])
  @@index([tenantId, employeId, statut])
  @@map("notes_de_frais")
}

model LigneNoteFrais {
  id              String   @id @default(uuid()) @db.Uuid
  tenantId        String   @map("tenant_id") @db.Uuid
  noteId          String   @map("note_id") @db.Uuid
  libelle         String
  dateDepense     DateTime @db.Date @map("date_depense")
  compteCode      String   @map("compte_code")   // charge SYSCOHADA (625x déplacement, 6181…)
  taxeCode        String?  @map("taxe_code")      // ex. TVA18
  montantHt       Decimal  @db.Decimal(15,2) @map("montant_ht")
  montantTva      Decimal  @default(0) @db.Decimal(15,2) @map("montant_tva")
  montantTtc      Decimal  @db.Decimal(15,2) @map("montant_ttc")
  justificatifKey String?  @map("justificatif_key") // S3 presign (flag OFF, cf. [[finance-core]]/upload)
  note            NoteDeFrais @relation(fields: [noteId], references: [id], onDelete: Cascade)
  @@index([tenantId, noteId])
  @@map("lignes_note_de_frais")
}
```

## Comptabilisation (`toAccountingLines`)
Journal **OD** (ou **CA/BQ** au remboursement). Par ligne : **débit** compte de charge + **débit**
445 (TVA déductible) ; **crédit** compte personnel (frais à rembourser, classe 4) au global.
Au remboursement : **débit** compte personnel / **crédit** trésorerie. (Détail des comptes
paramétrable ; l'essentiel = lignes équilibrées exportables [[finance-core]].)

---

# ── B. Achats → Fournisseurs ──

## Cycle de vie
```
Demande d'achat:  BROUILLON ─soumettre→ SOUMISE ─(moteur PURCHASE)→ APPROUVEE ─commander→ COMMANDEE
Bon de commande:  EMIS ─réception→ RECU (ou RECU_PARTIEL) ─facturer→ (Facture fournisseur)
Facture fourn.:   A_PAYER ─paiement→ PARTIELLEMENT_PAYEE → PAYEE
```
- Demande approuvée → génère un **Bon de commande** vers le `Tiers` fournisseur.
- Réception : statut du BC (V1 = flag `RECU`/`RECU_PARTIEL`, **pas de gestion de stock** — V2).
- Facture fournisseur (dette, journal **AC**) → payée via [[finance-tresorerie]] (réf. MoMo manuelle).

## Modèle Prisma
```prisma
enum StatutDemandeAchat   { BROUILLON SOUMISE APPROUVEE REJETEE COMMANDEE }
enum StatutBonCommande    { EMIS RECU_PARTIEL RECU ANNULE }
enum StatutFactureFourn   { A_PAYER PARTIELLEMENT_PAYEE PAYEE }

model DemandeAchat {
  id           String   @id @default(uuid()) @db.Uuid
  tenantId     String   @map("tenant_id") @db.Uuid
  reference    String   // "DA-2026-0001"
  demandeurId  String   @map("demandeur_id") @db.Uuid
  objet        String
  justification String?
  statut       StatutDemandeAchat @default(BROUILLON)
  montantEstime Decimal @default(0) @db.Decimal(15,2) @map("montant_estime")
  fournisseurId String? @map("fournisseur_id") @db.Uuid   // Tiers (optionnel à ce stade)
  approvalRequestId String? @map("approval_request_id") @db.Uuid
  lignes       LigneDemandeAchat[]
  createdAt    DateTime @default(now()) @map("created_at")
  updatedAt    DateTime @updatedAt @map("updated_at")
  @@unique([tenantId, reference])
  @@index([tenantId, statut])
  @@map("demandes_achat")
}

model LigneDemandeAchat {
  id          String  @id @default(uuid()) @db.Uuid
  tenantId    String  @map("tenant_id") @db.Uuid
  demandeId   String  @map("demande_id") @db.Uuid
  designation String
  quantite    Decimal @db.Decimal(15,2)
  prixUnitaire Decimal @db.Decimal(15,2) @map("prix_unitaire")
  montant     Decimal @db.Decimal(15,2)
  compteCode  String? @map("compte_code")
  demande     DemandeAchat @relation(fields: [demandeId], references: [id], onDelete: Cascade)
  @@index([tenantId, demandeId])
  @@map("lignes_demande_achat")
}

model BonCommande {
  id            String   @id @default(uuid()) @db.Uuid
  tenantId      String   @map("tenant_id") @db.Uuid
  reference     String   // "BC-2026-0001"
  demandeAchatId String? @map("demande_achat_id") @db.Uuid
  fournisseurId String   @map("fournisseur_id") @db.Uuid
  statut        StatutBonCommande @default(EMIS)
  montantHt     Decimal  @db.Decimal(15,2) @map("montant_ht")
  montantTva    Decimal  @default(0) @db.Decimal(15,2) @map("montant_tva")
  montantTtc    Decimal  @db.Decimal(15,2) @map("montant_ttc")
  dateEmission  DateTime @default(now()) @db.Date @map("date_emission")
  dateReceptionPrevue DateTime? @db.Date @map("date_reception_prevue")
  createdAt     DateTime @default(now()) @map("created_at")
  @@unique([tenantId, reference])
  @@index([tenantId, fournisseurId, statut])
  @@map("bons_commande")
}

model FactureFournisseur {
  id            String   @id @default(uuid()) @db.Uuid
  tenantId      String   @map("tenant_id") @db.Uuid
  reference     String   // interne "FF-2026-0001"
  numeroFournisseur String? @map("numero_fournisseur") // n° de la facture côté fournisseur
  fournisseurId String   @map("fournisseur_id") @db.Uuid
  bonCommandeId String?  @map("bon_commande_id") @db.Uuid
  dateFacture   DateTime @db.Date @map("date_facture")
  dateEcheance  DateTime? @db.Date @map("date_echeance")
  montantHt     Decimal  @db.Decimal(15,2) @map("montant_ht")
  montantTva    Decimal  @default(0) @db.Decimal(15,2) @map("montant_tva")
  montantTtc    Decimal  @db.Decimal(15,2) @map("montant_ttc")
  montantPaye   Decimal  @default(0) @db.Decimal(15,2) @map("montant_paye")
  statut        StatutFactureFourn @default(A_PAYER)
  createdAt     DateTime @default(now()) @map("created_at")
  updatedAt     DateTime @updatedAt @map("updated_at")
  @@unique([tenantId, reference])
  @@index([tenantId, fournisseurId, statut])
  @@index([tenantId, dateEcheance])  // échéancier fournisseurs
  @@map("factures_fournisseur")
}
```
*(lignes de facture fournisseur : même forme que `LigneDemandeAchat` + `compteCode`/`taxeCode` ;
omises ici pour la concision — à modéliser comme `LigneFactureFournisseur`.)*

## Comptabilisation
- **Facture fournisseur** → journal **AC** : débit charge(s) 6xx + débit 445 (TVA déductible) /
  crédit 401 (fournisseur, `tiersCode`). Cf. exemple [[finance-core]].
- **Paiement** → [[finance-tresorerie]] : débit 401 / crédit trésorerie (réf. MoMo manuelle).
- Demande d'achat / BC = **documents de gestion**, pas d'écriture comptable (engagement seulement).

---

## Seed — circuits d'approbation (dans [[approbations]])
- **`EXPENSE`** : step 1 `MANAGER`, step 2 `ROLE=comptable` **si** `payload.montant > 100000`.
- **`PURCHASE`** : step 1 `MANAGER`, step 2 `ROLE=direction` **si** `payload.montant > 1000000`.

---

## Endpoints (préfixe `/api/v1`)

### Notes de frais
| Méthode | Route | Permission |
|---------|-------|-----------|
| GET/POST/PATCH/DELETE | `/notes-frais` (`?statut&mine`) | `finance:read` / `finance:write` (DELETE si BROUILLON) |
| POST | `/notes-frais/:id/soumettre` | `finance:write` (demandeur) → amorce le circuit |
| POST | `/notes-frais/:id/rembourser` | `finance:write` `{modePaiement, paiementRef, payeLe?}` |
| GET  | `/notes-frais/:id/activity` | `finance:read` (timeline [[audit]]) |

### Achats / fournisseurs
| Méthode | Route | Permission |
|---------|-------|-----------|
| GET/POST/PATCH/DELETE | `/demandes-achat` | `finance:read` / `finance:write` |
| POST | `/demandes-achat/:id/soumettre` | `finance:write` → circuit `PURCHASE` |
| POST | `/demandes-achat/:id/commander` | `finance:write` (si APPROUVEE) → crée `BonCommande` |
| GET/POST/PATCH | `/bons-commande` | `finance:read` / `finance:write` |
| POST | `/bons-commande/:id/receptionner` | `finance:write` `{ partiel? }` |
| GET/POST/PATCH | `/factures-fournisseur` (`?statut&echeance`) | `finance:read` / `finance:write` |

> Validation manager/finance via **l'inbox unifiée** ([[approbations]] `/approvals/inbox`),
> pas de bouton « approuver » ad hoc ici.

---

## RBAC
- `finance:read` / `finance:write` (cf. [[finance-core]]). Validation = `approval:act`
  (manager + rôle `comptable`/`direction` selon le step).
- Un collaborateur lambda crée **ses** notes de frais (`finance:write` minimal ou perm dédiée
  `frais:write` à arbitrer) et ne voit que les siennes (`mine`, enforcement serveur).

---

## Côté front (ce que je brancherai)
- `features/finance/depenses` : Notes de frais (liste `mine`/admin, formulaire multi-lignes avec
  compte+TVA+justificatif, bouton soumettre, action rembourser), Achats (demande multi-lignes,
  suivi BC, factures fournisseurs + **échéancier**). Flag `VITE_MOCK_FINANCE`.
- **`<ApprovalTimeline>`** ([[approbations]]) dans chaque note/demande.
- Montants **XOF** (FCFA, 0 décimale). Justificatifs : presign flag OFF ([[finance-core]]).
- Dashboard comptable : « à rembourser », « à payer » (échéancier fournisseurs), « à valider ».

---

## Récap pour le co-dev backend
| # | Changement | Type |
|---|-----------|------|
| 1 | Modèles frais (`NoteDeFrais`,`LigneNoteFrais`) + achats (`DemandeAchat`,`Ligne…`,`BonCommande`,`FactureFournisseur`,`Ligne…`) + TENANT_MODELS + RLS | additif |
| 2 | Soumission → `approvals.start('EXPENSE'/'PURCHASE')` ; `approval.completed` → statut | intégration moteur |
| 3 | `toAccountingLines()` sur NoteDeFrais & FactureFournisseur ([[finance-core]]) | comptabilité |
| 4 | Remboursement / paiement → mouvement [[finance-tresorerie]] (réf. MoMo manuelle) | intégration |
| 5 | Réfs auto NF/DA/BC/FF-AAAA-NNNN | convention |
| 6 | Réception/stock détaillé, presign justificatifs, MoMo API | différé V2 |

> **Dépend de** [[finance-core]] (comptes/journaux/taxes/tiers) **et** [[approbations]] (circuits
> EXPENSE/PURCHASE). Le remboursement/paiement réel s'achève avec [[finance-tresorerie]].
