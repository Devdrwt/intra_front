# Contrat backend — **Finance : Recettes** (devis, facturation client, encaissements)

> Hand-off front → backend. Module **2** du domaine Finance ([[finance-core]]). Couvre **l'argent
> qui entre** : **devis → facture client → encaissement → relances**. Greenfield.
>
> **Branché sur les moteurs** : journalisation [[audit]], notifications/WhatsApp
> [[evenements-notifications]] (relances créances), recherche [[recherche]]. **Comptabilisation**
> via `toAccountingLines()` ([[finance-core]], journal **VE**). **Mobile Money = manuel** (réf.
> d'encaissement saisie). Tiers **CLIENT** depuis [[finance-core]].
>
> Symétrique de [[finance-depenses]] : ici on émet, là-bas on reçoit. **Pas de moteur
> d'approbations** par défaut (émettre une facture n'est pas une demande à valider — un seuil de
> validation devis→facture reste possible en option).

---

## Cycle de vie
```
Devis (option):   BROUILLON ─envoyer→ ENVOYE ─accepter→ ACCEPTE ─convertir→ (Facture)
                                              └─refuser→ REFUSE
Facture client:   BROUILLON ─émettre→ EMISE ─encaissement(s)→ PARTIELLEMENT_PAYEE → PAYEE
                                            └─annuler→ ANNULEE   (avoir = V2)
```
- **Émission** d'une facture (`EMISE`) → écriture comptable (journal **VE**) + événement
  `finance.facture.emise`.
- **Encaissement** (total/partiel) → met à jour `montantPaye` + statut, crée un **mouvement de
  trésorerie** ([[finance-tresorerie]]) avec `paiementRef` (n° MoMo / virement, manuel V1).
- **Relances** : cron quotidien → factures `EMISE`/`PARTIELLEMENT_PAYEE` dont `dateEcheance < now`
  → événement `finance.facture.en_retard` → notification + **WhatsApp** au client
  ([[evenements-notifications]]) et/ou au comptable.

---

## Modèle Prisma
```prisma
enum StatutDevis        { BROUILLON ENVOYE ACCEPTE REFUSE CONVERTI }
enum StatutFactureClient{ BROUILLON EMISE PARTIELLEMENT_PAYEE PAYEE ANNULEE }

model Devis {
  id          String      @id @default(uuid()) @db.Uuid
  tenantId    String      @map("tenant_id") @db.Uuid
  reference   String      // "DV-2026-0001"
  clientId    String      @map("client_id") @db.Uuid    // Tiers (CLIENT)
  objet       String
  statut      StatutDevis @default(BROUILLON)
  dateDevis   DateTime    @default(now()) @db.Date @map("date_devis")
  validiteJours Int       @default(30) @map("validite_jours")
  montantHt   Decimal     @default(0) @db.Decimal(15,2) @map("montant_ht")
  montantTva  Decimal     @default(0) @db.Decimal(15,2) @map("montant_tva")
  montantTtc  Decimal     @default(0) @db.Decimal(15,2) @map("montant_ttc")
  factureId   String?     @map("facture_id") @db.Uuid   // si converti
  lignes      LigneDevis[]
  createdAt   DateTime    @default(now()) @map("created_at")
  updatedAt   DateTime    @updatedAt @map("updated_at")
  @@unique([tenantId, reference])
  @@index([tenantId, clientId, statut])
  @@map("devis")
}

model FactureClient {
  id           String   @id @default(uuid()) @db.Uuid
  tenantId     String   @map("tenant_id") @db.Uuid
  reference    String   // "FC-2026-0001" (= n° de facture légal, séquentiel sans trou)
  clientId     String   @map("client_id") @db.Uuid
  devisId      String?  @map("devis_id") @db.Uuid
  objet        String
  statut       StatutFactureClient @default(BROUILLON)
  dateFacture  DateTime @default(now()) @db.Date @map("date_facture")
  dateEcheance DateTime? @db.Date @map("date_echeance")
  montantHt    Decimal  @default(0) @db.Decimal(15,2) @map("montant_ht")
  montantTva   Decimal  @default(0) @db.Decimal(15,2) @map("montant_tva")
  montantTtc   Decimal  @default(0) @db.Decimal(15,2) @map("montant_ttc")
  montantPaye  Decimal  @default(0) @db.Decimal(15,2) @map("montant_paye")
  lignes       LigneFactureClient[]
  encaissements Encaissement[]
  createdAt    DateTime @default(now()) @map("created_at")
  updatedAt    DateTime @updatedAt @map("updated_at")
  @@unique([tenantId, reference])
  @@index([tenantId, clientId, statut])
  @@index([tenantId, dateEcheance])     // échéancier clients / relances
  @@map("factures_client")
}

model LigneFactureClient {
  id          String  @id @default(uuid()) @db.Uuid
  tenantId    String  @map("tenant_id") @db.Uuid
  factureId   String  @map("facture_id") @db.Uuid
  designation String
  quantite    Decimal @db.Decimal(15,2)
  prixUnitaire Decimal @db.Decimal(15,2) @map("prix_unitaire")
  compteCode  String  @map("compte_code")   // produit SYSCOHADA (701x ventes…)
  taxeCode    String? @map("taxe_code")
  montantHt   Decimal @db.Decimal(15,2) @map("montant_ht")
  montantTva  Decimal @default(0) @db.Decimal(15,2) @map("montant_tva")
  montantTtc  Decimal @db.Decimal(15,2) @map("montant_ttc")
  facture     FactureClient @relation(fields: [factureId], references: [id], onDelete: Cascade)
  @@index([tenantId, factureId])
  @@map("lignes_facture_client")
}
// LigneDevis : même forme, omise pour la concision.

model Encaissement {
  id          String   @id @default(uuid()) @db.Uuid
  tenantId    String   @map("tenant_id") @db.Uuid
  factureId   String   @map("facture_id") @db.Uuid
  date        DateTime @default(now()) @db.Date
  montant     Decimal  @db.Decimal(15,2)
  mode        String   // ESPECES | VIREMENT | MOBILE_MONEY | CHEQUE
  paiementRef String?  @map("paiement_ref")   // n° MoMo / virement (manuel V1)
  facture     FactureClient @relation(fields: [factureId], references: [id], onDelete: Cascade)
  @@index([tenantId, factureId])
  @@map("encaissements")
}
```

> **À ne pas oublier** : modèles dans **`TENANT_MODELS`** + **RLS** + `tenantId` du JWT.

---

## Numérotation des factures (réglementaire)
La **`reference` d'une `FactureClient` = numéro de facture légal** : **séquentiel, sans trou,
chronologique par exercice** (`FC-2026-0001`, `0002`…). Attribuée **à l'émission** (`EMISE`),
pas en brouillon. Un brouillon supprimé ne consomme pas de numéro. (Contrainte OHADA/fiscale.)

---

## Comptabilisation (`toAccountingLines`, journal VE)
**Facture client 118 000 XOF TTC (TVA 18 %)** :
| journal | compte | tiers | débit | crédit |
|--------|--------|-------|------:|------:|
| VE | 411100 (client) | CL-0001 | 118 000 | |
| VE | 701000 (vente) | | | 100 000 |
| VE | 443100 (TVA collectée) | | | 18 000 |

**Encaissement** → [[finance-tresorerie]] : débit trésorerie / crédit 411 (client).

---

## Relances créances (synergie WhatsApp)
- Cron quotidien : factures non soldées dont `dateEcheance` dépassée → `finance.facture.en_retard`
  (`payload:{factureRef, clientId, montantDu, joursRetard}`).
- Le catalogue d'événements ([[evenements-notifications]]) route → **WhatsApp** au client
  (template approuvé « relance_facture ») + notification in-app au comptable.
- Paliers configurables (J+1, J+7, J+15). **Opt-in client** respecté.

---

## Endpoints (préfixe `/api/v1`)
| Méthode | Route | Permission |
|---------|-------|-----------|
| GET/POST/PATCH/DELETE | `/devis` (`?statut&clientId`) | `finance:read` / `finance:write` |
| POST | `/devis/:id/envoyer` · `/devis/:id/convertir` | `finance:write` |
| GET/POST/PATCH | `/factures-client` (`?statut&clientId&echeance`) | `finance:read` / `finance:write` |
| POST | `/factures-client/:id/emettre` | `finance:write` → attribue le n° légal + écriture VE |
| POST | `/factures-client/:id/encaissements` | `finance:write` `{montant, mode, paiementRef, date?}` |
| POST | `/factures-client/:id/relancer` | `finance:write` (relance manuelle ponctuelle) |
| GET  | `/factures-client/:id/pdf` | `finance:read` (facture PDF — V2 si lourd) |
| GET  | `/factures-client/:id/activity` | `finance:read` ([[audit]]) |

---

## RBAC
- `finance:read` / `finance:write` ([[finance-core]]). Émettre/encaisser = `finance:write` (comptable).
- Option (différée) : seuil de validation devis→facture via [[approbations]] (`entityType` à ajouter)
  si une remise importante doit être approuvée. **Hors V1.**

---

## Côté front (ce que je brancherai)
- `features/finance/recettes` : Devis (liste, formulaire multi-lignes, envoyer/convertir),
  Factures client (liste + **échéancier** + statut paiement, formulaire, émettre, **saisie
  d'encaissement**, relancer), badge « créances en retard ». Flag `VITE_MOCK_FINANCE`.
- Montants **XOF** (FCFA, 0 décimale). Tiers client via le référentiel [[finance-core]].
- Dashboard comptable : « à encaisser », « en retard », CA encaissé du mois.
- `<ActivityTimeline>` ([[audit]]) sur chaque facture.

---

## Récap pour le co-dev backend
| # | Changement | Type |
|---|-----------|------|
| 1 | Modèles `Devis/LigneDevis/FactureClient/LigneFactureClient/Encaissement` + TENANT_MODELS + RLS | additif |
| 2 | Numérotation facture **séquentielle sans trou** par exercice, attribuée à l'émission | réglementaire |
| 3 | `toAccountingLines()` (journal VE) ([[finance-core]]) | comptabilité |
| 4 | Encaissement → mouvement [[finance-tresorerie]] (réf. MoMo manuelle) | intégration |
| 5 | Cron relances + événement `finance.facture.en_retard` → WhatsApp ([[evenements-notifications]]) | intégration |
| 6 | PDF facture, avoirs, validation devis→facture, MoMo API | différé V2 |

> **Dépend de** [[finance-core]] (comptes/journaux/taxes/tiers/export) et [[evenements-notifications]]
> (relances). L'encaissement réel s'achève avec [[finance-tresorerie]].
