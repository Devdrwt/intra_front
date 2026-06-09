# Contrat backend — **Finance : Paie & déclarations** (CNSS / ITS)

> Hand-off front → backend. Module **4** du domaine Finance ([[finance-core]]). Le plus **dense
> et réglementé** : éléments variables → **bulletins de paie** → **déclarations sociales/fiscales
> (CNSS, ITS, VPS)** → **virement des salaires** (Mobile Money manuel V1). Greenfield.
>
> **⚠️ Taux & barèmes à FAIRE VALIDER par un comptable/expert-paie béninois** avant production
> (comme le format SYSCOHADA). Ce contrat fixe la **structure** ; les **valeurs** (taux CNSS,
> barème ITS, plafonds) sont **paramétrables** (table `RubriquePaie`), pas codées en dur.
>
> Branché : comptabilisation journal **PA** ([[finance-core]]), virement → [[finance-tresorerie]],
> bulletin diffusé via [[evenements-notifications]] (in-app/WhatsApp), [[audit]].

---

## Champs additifs sur `Employe` (RH)
```prisma
// additif au modèle Employe existant (a déjà userId ; ajouter aussi managerId cf. [[finance-core]])
  salaireBase    Decimal? @db.Decimal(15,2) @map("salaire_base")
  numeroCnss     String?  @map("numero_cnss")
  moyenPaiement  String?  @map("moyen_paiement")    // VIREMENT | MOBILE_MONEY | ESPECES
  ribOuMomo      String?  @map("rib_ou_momo")        // IBAN ou n° MoMo E.164
  situationFamille String? @map("situation_famille") // pour parts/abattements ITS
  nbEnfants      Int?     @map("nb_enfants")
```

---

## Concepts
- **`RubriquePaie`** (référentiel paramétrable, seedé) : un élément de bulletin — gain, retenue
  ou cotisation. Porte sa **base de calcul**, son **taux/montant**, son **compte SYSCOHADA**, et
  ses drapeaux *imposable/cotisable*. C'est ici que vivent CNSS/ITS/VPS (modifiables sans
  redéploiement).
- **`PeriodePaie`** : un cycle (mois/année) ; on y génère les bulletins, on valide, on paie.
- **`BulletinPaie`** + **`LigneBulletin`** : le bulletin d'un employé sur une période.
- **Déclarations** : agrégats CNSS / ITS / VPS par période (export pour les organismes).

## Modèle Prisma
```prisma
enum TypeRubrique   { GAIN RETENUE_SALARIALE COTISATION_PATRONALE }
enum BaseCalcul     { FIXE POURCENTAGE_BRUT POURCENTAGE_BASE POURCENTAGE_PLAFONNE BAREME }
enum StatutPeriode  { BROUILLON VALIDEE PAYEE CLOTUREE }
enum StatutBulletin { BROUILLON VALIDE PAYE }

model RubriquePaie {
  id          String   @id @default(uuid()) @db.Uuid
  tenantId    String   @map("tenant_id") @db.Uuid
  code        String   // "SAL_BASE","PRIME_ANC","CNSS_SAL","ITS","CNSS_PAT","VPS"
  libelle     String
  type        TypeRubrique
  base        BaseCalcul
  taux        Decimal? @db.Decimal(7,4)        // ex. 3.6000 (%) — null si FIXE/BAREME
  montantFixe Decimal? @db.Decimal(15,2) @map("montant_fixe")
  plafond     Decimal? @db.Decimal(15,2)       // base plafonnée (CNSS)
  compteCode  String   @map("compte_code")     // 661 charges, 431 CNSS, 447 État…
  imposable   Boolean  @default(true)          // entre dans l'assiette ITS
  cotisable   Boolean  @default(true)          // entre dans l'assiette CNSS
  ordre       Int      @default(0)
  actif       Boolean  @default(true)
  @@unique([tenantId, code])
  @@map("rubriques_paie")
}

model PeriodePaie {
  id        String   @id @default(uuid()) @db.Uuid
  tenantId  String   @map("tenant_id") @db.Uuid
  annee     Int
  mois      Int      // 1..12
  statut    StatutPeriode @default(BROUILLON)
  bulletins BulletinPaie[]
  createdAt DateTime @default(now()) @map("created_at")
  @@unique([tenantId, annee, mois])
  @@map("periodes_paie")
}

model BulletinPaie {
  id            String   @id @default(uuid()) @db.Uuid
  tenantId      String   @map("tenant_id") @db.Uuid
  periodeId     String   @map("periode_id") @db.Uuid
  employeId     String   @map("employe_id") @db.Uuid
  salaireBrut   Decimal  @default(0) @db.Decimal(15,2) @map("salaire_brut")
  totalRetenues Decimal  @default(0) @db.Decimal(15,2) @map("total_retenues") // salariales (CNSS sal + ITS)
  netAPayer     Decimal  @default(0) @db.Decimal(15,2) @map("net_a_payer")
  chargesPatronales Decimal @default(0) @db.Decimal(15,2) @map("charges_patronales")
  statut        StatutBulletin @default(BROUILLON)
  paiementRef   String?  @map("paiement_ref")   // n° virement / MoMo (manuel V1)
  payeLe        DateTime? @map("paye_le")
  lignes        LigneBulletin[]
  periode       PeriodePaie @relation(fields: [periodeId], references: [id], onDelete: Cascade)
  @@unique([tenantId, periodeId, employeId])
  @@index([tenantId, employeId])
  @@map("bulletins_paie")
}

model LigneBulletin {
  id          String   @id @default(uuid()) @db.Uuid
  tenantId    String   @map("tenant_id") @db.Uuid
  bulletinId  String   @map("bulletin_id") @db.Uuid
  rubriqueCode String  @map("rubrique_code")
  libelle     String
  type        TypeRubrique
  base        Decimal  @db.Decimal(15,2)
  taux        Decimal? @db.Decimal(7,4)
  montant     Decimal  @db.Decimal(15,2)
  bulletin    BulletinPaie @relation(fields: [bulletinId], references: [id], onDelete: Cascade)
  @@index([tenantId, bulletinId])
  @@map("lignes_bulletin")
}
```

> **À ne pas oublier** : `TENANT_MODELS` + **RLS** + `tenantId` du JWT (sur tous les modèles paie).

---

## Calcul d'un bulletin (moteur paramétrable)
1. **Brut** = somme des rubriques `GAIN` (salaire base employé + primes/éléments variables saisis).
2. **Assiette CNSS** = somme des gains `cotisable`, plafonnée si `plafond` ; **CNSS salariale** =
   assiette × taux (rubrique `CNSS_SAL`).
3. **Assiette ITS** = brut imposable − cotisations sociales salariales − abattements (parts) ;
   **ITS** = barème progressif (rubrique `ITS`, `base=BAREME` → tranches paramétrables).
4. **Net à payer** = brut − retenues salariales (CNSS_SAL + ITS).
5. **Charges patronales** = rubriques `COTISATION_PATRONALE` (CNSS patronale, VPS…) — coût
   employeur, hors net.

> Le **barème ITS** et les **taux CNSS/VPS** sont des **données** (rubriques + table de tranches),
> pas du code. Un changement de loi = mise à jour des rubriques, pas un redéploiement.

---

## Cycle de vie
```
PeriodePaie: BROUILLON ─générer bulletins→ (bulletins BROUILLON) ─valider→ VALIDEE
             ─payer→ PAYEE ─clôturer→ CLOTUREE (figée)
```
- **Générer** : crée un `BulletinPaie` par employé actif (à partir de `salaireBase` + variables).
- **Valider** : fige les montants, écriture comptable (journal **PA**), événement
  `paie.bulletin.valide` → bulletin disponible au collaborateur (in-app/WhatsApp).
- **Payer** : par bulletin ou en lot → `paiementRef` (MoMo manuel) → **mouvement de trésorerie
  SORTIE** ([[finance-tresorerie]], `sourceType=PAIE`).

---

## Comptabilisation (journal PA)
- **Débit 661** (charges de personnel — brut) ;
- **Crédit 431** (CNSS — part salariale + patronale) ; **Crédit 447** (État, ITS/VPS) ;
- **Crédit 421** (personnel, rémunérations dues — net à payer).
- Au **paiement** : **Débit 421** / **Crédit 521/571** ([[finance-tresorerie]]).

---

## Déclarations (agrégats par période)
| Route | Contenu |
|-------|---------|
| `GET /paie/periodes/:id/declaration-cnss` | total assiettes + cotisations sal.+pat. par employé (n° CNSS) |
| `GET /paie/periodes/:id/declaration-its` | total ITS retenu par employé |
| `GET /paie/periodes/:id/export?format=csv` | journal de paie complet (→ comptabilité, [[finance-core]]) |

> Formats officiels CNSS/DGI **à confirmer** (comme SYSCOHADA). V1 = agrégats + CSV ; gabarits
> réglementaires précis = itération avec un expert-paie.

---

## Endpoints (préfixe `/api/v1`)
| Méthode | Route | Permission |
|---------|-------|-----------|
| GET/POST/PATCH | `/rubriques-paie` | `finance:read` / `finance:manage` |
| GET/POST | `/paie/periodes` (`?annee`) | `finance:read` / `finance:write` |
| POST | `/paie/periodes/:id/generer` | `finance:write` → crée les bulletins |
| POST | `/paie/periodes/:id/valider` · `/cloturer` | `finance:manage` |
| GET | `/paie/periodes/:id/bulletins` | `finance:read` |
| POST | `/paie/bulletins/:id/payer` | `finance:write` `{ paiementRef, compteTresorerieId }` |
| GET | `/me/bulletins` · `/me/bulletins/:id/pdf` | `me:read` (le collaborateur voit **les siens**) |

---

## RBAC
- **`finance:manage`** — rubriques (taux/barèmes), valider/clôturer une période (sensible).
- **`finance:write`** — générer, saisir variables, payer.
- **`finance:read`** — consulter (paie = **données sensibles** : restreindre fortement, pas
  d'accès `gestionnaire` lambda).
- **`me:read`** — chaque employé accède **uniquement à ses bulletins** (self-service, enforcement
  serveur). La paie d'autrui n'est **jamais** exposée.

---

## Côté front (ce que je brancherai)
- `features/finance/paie` (admin paie, gated fort) : Rubriques (Paramètres), Périodes (générer/
  valider/payer en lot), bulletins (liste par période, détail, PDF), déclarations CNSS/ITS,
  export journal de paie. Flag `VITE_MOCK_FINANCE`.
- **Espace collaborateur** : « Mes bulletins » (`features/me`) — consultation + PDF des siens.
- Champs paie ajoutés à la **fiche RH** (`features/rh`) : salaire de base, n° CNSS, moyen de
  paiement (MoMo/RIB). Montants **XOF**.

---

## Récap pour le co-dev backend
| # | Changement | Type |
|---|-----------|------|
| 1 | Champs paie additifs sur `Employe` | additif RH |
| 2 | Modèles `RubriquePaie/PeriodePaie/BulletinPaie/LigneBulletin` + TENANT_MODELS + RLS | additif |
| 3 | Moteur de calcul **paramétrable** (CNSS plafonné, ITS barème, patronales) | logique |
| 4 | Seed rubriques Bénin (**taux/barème à valider expert-paie**) | données |
| 5 | Comptabilisation journal PA + paiement → [[finance-tresorerie]] | comptabilité |
| 6 | Déclarations CNSS/ITS (agrégats + CSV) ; gabarits officiels = itération | additif |
| 7 | Bulletin PDF, `/me/bulletins`, événement `paie.bulletin.valide` (WhatsApp) | additif |
| 8 | Congés payés/soldes, STC (solde tout compte), 13ᵉ mois, MoMo API | différé V2 |

> **Sensibilité** : la paie est le module le plus confidentiel — RLS + RBAC stricts, accès `me`
> limité au propriétaire. **Valeurs réglementaires à confirmer** avant toute mise en production.
