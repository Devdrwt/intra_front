# Contrat backend — **Finance : Trésorerie** (caisse, banque, Mobile Money)

> Hand-off front → backend. Module **3** du domaine Finance ([[finance-core]]). **Point de
> convergence** : remboursements de frais, paiements fournisseurs et encaissements clients
> déversent tous leurs **mouvements** ici. Donne au comptable le **solde temps réel** par compte
> et le **rapprochement**. Greenfield.
>
> **Mobile Money = compte de trésorerie comme un autre**, alimenté **manuellement** en V1 (réf.
> de transaction saisie) ; API MTN/Moov/FedaPay en V2. Comptabilisation journaux **BQ/CA**
> ([[finance-core]]). Recherche [[recherche]], journal [[audit]].

---

## Concepts
- **`CompteTresorerie`** : un coffre (caisse), un compte bancaire, ou un **wallet Mobile Money**.
  Chacun mappé à un compte SYSCOHADA (571 caisse, 521 banque, 55x MoMo). Solde temps réel.
- **`MouvementTresorerie`** : une entrée ou sortie d'argent. Créé par les autres modules (frais,
  factures) **ou** saisi manuellement. Porte sa **source** (traçabilité) et sa **réf. de paiement**.
- **Rapprochement** : marquer un mouvement comme « pointé » sur le relevé. V1 = manuel ;
  import de relevé bancaire = V2.

---

## Modèle Prisma
```prisma
enum TypeCompteTresorerie { CAISSE BANQUE MOBILE_MONEY }
enum SensMouvement        { ENTREE SORTIE }
enum SourceMouvement      { MANUEL NOTE_FRAIS FACTURE_FOURNISSEUR FACTURE_CLIENT PAIE VIREMENT_INTERNE }

model CompteTresorerie {
  id           String   @id @default(uuid()) @db.Uuid
  tenantId     String   @map("tenant_id") @db.Uuid
  type         TypeCompteTresorerie
  nom          String   // "Caisse principale", "Ecobank ...1234", "MoMo MTN Pro"
  compteCode   String   @map("compte_code")    // SYSCOHADA (571/521/55x)
  numero       String?  // IBAN / n° compte / n° MoMo (E.164)
  devise       String   @default("XOF")
  soldeInitial Decimal  @default(0) @db.Decimal(15,2) @map("solde_initial")
  actif        Boolean  @default(true)
  mouvements   MouvementTresorerie[]
  createdAt    DateTime @default(now()) @map("created_at")
  updatedAt    DateTime @updatedAt @map("updated_at")
  @@unique([tenantId, nom])
  @@index([tenantId, type])
  @@map("comptes_tresorerie")
}

model MouvementTresorerie {
  id            String   @id @default(uuid()) @db.Uuid
  tenantId      String   @map("tenant_id") @db.Uuid
  compteId      String   @map("compte_id") @db.Uuid
  date          DateTime @default(now()) @db.Date
  sens          SensMouvement
  montant       Decimal  @db.Decimal(15,2)   // toujours positif ; le sens donne le signe
  libelle       String
  mode          String   // ESPECES | VIREMENT | MOBILE_MONEY | CHEQUE
  paiementRef   String?  @map("paiement_ref")  // n° transaction MoMo / virement (manuel V1)
  // Traçabilité : d'où vient ce mouvement (vers la note de frais / facture concernée)
  sourceType    SourceMouvement @default(MANUEL) @map("source_type")
  sourceId      String?  @map("source_id") @db.Uuid
  // Contrepartie comptable (ex. 401 fournisseur, 411 client, 421 personnel)
  compteContrepartie String? @map("compte_contrepartie")
  // Rapprochement
  rapproche     Boolean  @default(false)
  rapprocheLe   DateTime? @map("rapproche_le")
  releveRef     String?  @map("releve_ref")
  compte        CompteTresorerie @relation(fields: [compteId], references: [id], onDelete: Cascade)
  createdAt     DateTime @default(now()) @map("created_at")
  @@index([tenantId, compteId, date])
  @@index([tenantId, sourceType, sourceId])
  @@index([tenantId, compteId, rapproche])
  @@map("mouvements_tresorerie")
}
```

> **À ne pas oublier** : `TENANT_MODELS` + **RLS** + `tenantId` du JWT.

---

## Solde (dérivé, jamais stocké en dur)
```
solde(compte) = soldeInitial + Σ(ENTREE.montant) − Σ(SORTIE.montant)
```
Exposé en lecture (`GET /comptes-tresorerie` renvoie `solde` calculé). Option perf : vue
matérialisée / agrégat caché plus tard ; pas nécessaire au volume PME.

---

## Création des mouvements depuis les autres modules
| Origine | Mouvement | sourceType |
|--------|-----------|-----------|
| Remboursement note de frais ([[finance-depenses]]) | SORTIE | NOTE_FRAIS |
| Paiement facture fournisseur ([[finance-depenses]]) | SORTIE | FACTURE_FOURNISSEUR |
| Encaissement facture client ([[finance-recettes]]) | ENTREE | FACTURE_CLIENT |
| Virement salaire ([[finance-paie]]) | SORTIE | PAIE |
| Transfert caisse↔banque↔MoMo | SORTIE + ENTREE (paire) | VIREMENT_INTERNE |
| Opération directe (frais de banque, dépôt…) | ENTREE/SORTIE | MANUEL |

> Le module source **ne pose pas l'écriture trésorerie lui-même** : il appelle
> `tresorerie.enregistrer({compteId, sens, montant, source, paiementRef})`. Idempotence par
> `(sourceType, sourceId)` → pas de double mouvement si action rejouée.

---

## Comptabilisation (`toAccountingLines`, journaux BQ/CA)
Chaque mouvement **complète** la double écriture amorcée par la facture/le frais :
- Encaissement client : **débit 521/571** (trésorerie) / **crédit 411** (`compteContrepartie`).
- Paiement fournisseur : **débit 401** / **crédit 521/571**.
- Mouvement MANUEL : compte de contrepartie saisi (ex. 627 frais bancaires).

---

## Rapprochement (V1 manuel)
- `POST /mouvements-tresorerie/:id/rapprocher { releveRef? }` → `rapproche=true`.
- Vue « non rapprochés » par compte → le comptable pointe ligne à ligne vs son relevé.
- **V2** : import relevé bancaire (CSV/OFX) + rapprochement assisté (matching montant/date).

---

## Endpoints (préfixe `/api/v1`)
| Méthode | Route | Permission |
|---------|-------|-----------|
| GET/POST/PATCH | `/comptes-tresorerie` | `finance:read` / `finance:manage` (création de compte) |
| GET | `/comptes-tresorerie/:id/solde` | `finance:read` → `{ solde, devise }` |
| GET/POST | `/mouvements-tresorerie` (`?compteId&from&to&rapproche&sourceType`) | `finance:read` / `finance:write` |
| POST | `/mouvements-tresorerie/transfert` | `finance:write` `{from, to, montant, date?}` (paire ENTREE/SORTIE) |
| POST | `/mouvements-tresorerie/:id/rapprocher` | `finance:write` |
| GET | `/tresorerie/dashboard` | `finance:read` → soldes par compte + flux du mois |

---

## RBAC
- `finance:read` (consulter soldes/mouvements), `finance:write` (saisir mouvements/transferts/
  rapprochement), `finance:manage` (créer/désactiver un compte de trésorerie). Cf. [[finance-core]].

---

## Côté front (ce que je brancherai)
- `features/finance/tresorerie` : liste des comptes avec **solde temps réel** (caisse/banque/MoMo
  avec icône par type), détail = relevé des mouvements (filtrable, badge rapproché), saisie de
  mouvement manuel, **transfert** entre comptes, action « rapprocher ». Flag `VITE_MOCK_FINANCE`.
- **Dashboard trésorerie** : total disponible, par compte, entrées/sorties du mois (graphe).
- Montants **XOF** (FCFA). Les mouvements issus des frais/factures sont **cliquables** vers leur
  source.
- C'est l'écran « cash » que le comptable regarde tous les matins.

---

## Récap pour le co-dev backend
| # | Changement | Type |
|---|-----------|------|
| 1 | Modèles `CompteTresorerie`, `MouvementTresorerie` + TENANT_MODELS + RLS | additif |
| 2 | `tresorerie.enregistrer()` appelé par frais/recettes/paie, **idempotent** `(sourceType,sourceId)` | intégration |
| 3 | Solde dérivé + `/tresorerie/dashboard` | additif |
| 4 | `toAccountingLines()` (journaux BQ/CA) ([[finance-core]]) | comptabilité |
| 5 | Rapprochement manuel (`rapprocher`) | additif |
| 6 | Import relevé + rapprochement assisté, MoMo API (solde/transactions auto) | différé V2 |

> **Convergence** de [[finance-depenses]] (sorties) et [[finance-recettes]] (entrées). Sans ce
> module, remboursements/paiements/encaissements restent « théoriques » (réf. saisie mais pas de
> solde consolidé).
