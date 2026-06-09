# Contrat backend — **Finance : Pilotage** (budgets & tableaux de bord)

> Hand-off front → backend. Module **5** (dernier) du domaine Finance ([[finance-core]]). C'est
> ce qui rend **les gestionnaires** (pas seulement le comptable) « à l'aise » : **budgets**,
> **budget vs réalisé**, **tableaux de bord** consolidés. Greenfield.
>
> **N'invente pas de données** : le « réalisé » et les KPI sont **agrégés** depuis les modules
> existants ([[finance-depenses]], [[finance-recettes]], [[finance-tresorerie]], [[finance-paie]]).
> **États financiers SYSCOHADA complets = V2** (dépend du grand livre matérialisé, [[finance-core]] V2).

---

## Partie 1 — Budgets

```prisma
enum AxeBudget { DEPARTEMENT SERVICE PROJET COMPTE GLOBAL }

model Budget {
  id         String   @id @default(uuid()) @db.Uuid
  tenantId   String   @map("tenant_id") @db.Uuid
  exerciceId String   @map("exercice_id") @db.Uuid   // [[finance-core]]
  nom        String
  axe        AxeBudget
  actif      Boolean  @default(true)
  lignes     LigneBudget[]
  createdAt  DateTime @default(now()) @map("created_at")
  updatedAt  DateTime @updatedAt @map("updated_at")
  @@index([tenantId, exerciceId])
  @@map("budgets")
}

model LigneBudget {
  id          String  @id @default(uuid()) @db.Uuid
  tenantId    String  @map("tenant_id") @db.Uuid
  budgetId    String  @map("budget_id") @db.Uuid
  // Cible de l'axe : code de compte SYSCOHADA, id de département/service/projet selon Budget.axe
  cible       String                              // ex. "601000" | "<departementId>" | "<projetId>"
  cibleLabel  String  @map("cible_label")          // libellé lisible figé
  montantPrevu Decimal @db.Decimal(15,2) @map("montant_prevu")
  periode     String?                             // null = annuel ; sinon "2026-01"… (mensuel)
  budget      Budget  @relation(fields: [budgetId], references: [id], onDelete: Cascade)
  @@index([tenantId, budgetId])
  @@map("lignes_budget")
}
```

> `TENANT_MODELS` + **RLS** + `tenantId` du JWT.

### Réalisé (dérivé, calculé à la volée)
Pour chaque `LigneBudget`, le **réalisé** = somme des montants des opérations de la période,
filtrées par l'axe :
- axe `COMPTE` → somme des lignes comptables sur ce `compteCode` ([[finance-depenses]]/recettes/paie) ;
- axe `DEPARTEMENT`/`SERVICE` → opérations rattachées (via l'employé/le demandeur) ;
- axe `PROJET` → opérations rattachées au projet (module `projects`).
→ `consommation = réalisé / montantPrevu` (0..1+), **alerte** si dépassement (événement
`budget.depasse` → notification, [[evenements-notifications]]).

---

## Partie 2 — Tableaux de bord

Endpoints d'**agrégation** (lecture seule), pensés pour le dashboard direction/gestionnaire :

| Route | Contenu (agrégé, période en `?from&to` ou `?exerciceId`) |
|-------|----------|
| `GET /finance/dashboard/tresorerie` | soldes par compte + total disponible + flux entrées/sorties ([[finance-tresorerie]]) |
| `GET /finance/dashboard/creances` | total à encaisser + en retard + ageing (J0-30/30-60/60+) ([[finance-recettes]]) |
| `GET /finance/dashboard/dettes` | total à payer fournisseurs + échéancier ([[finance-depenses]]) |
| `GET /finance/dashboard/resultat` | **résultat simplifié** = Σ produits (cl. 7) − Σ charges (cl. 6) sur la période |
| `GET /finance/dashboard/budgets` | par ligne : prévu / réalisé / consommation / statut |
| `GET /finance/dashboard/masse-salariale` | coût total paie (brut + charges patronales) par mois ([[finance-paie]]) |

```ts
interface KpiCreances { totalDu: number; enRetard: number; ageing: { j0_30:number; j30_60:number; j60p:number } }
interface ResultatSimplifie { produits: number; charges: number; resultat: number; devise: 'XOF' }
interface LigneBudgetSuivi { cibleLabel: string; prevu: number; realise: number; consommation: number; depasse: boolean }
```

---

## Endpoints (CRUD budgets — préfixe `/api/v1`)
| Méthode | Route | Permission |
|---------|-------|-----------|
| GET/POST/PATCH/DELETE | `/budgets` (`?exerciceId`) | `finance:read` / `finance:manage` |
| GET | `/budgets/:id/suivi` | `finance:read` → `LigneBudgetSuivi[]` (prévu/réalisé) |
| GET | `/finance/dashboard/*` | `finance:read` |

---

## RBAC
- **`finance:read`** — tableaux de bord + suivi budgétaire (comptable **et gestionnaires**).
  C'est **la** permission qui rend les gestionnaires autonomes sans toucher aux écritures.
- **`finance:manage`** — définir/éditer les budgets.
- Granularité possible : un manager ne voit que **son** département (filtre serveur sur l'axe) —
  à arbitrer selon le besoin (V1 : `finance:read` voit tout ; restriction par axe = option).

---

## Côté front (ce que je brancherai)
- `features/finance/pilotage` : page **Budgets** (définition par axe, lignes prévu, jauges de
  consommation), **Tableau de bord finance** (cartes KPI : trésorerie, créances, dettes, résultat,
  masse salariale ; graphes recharts). Flag `VITE_MOCK_FINANCE`.
- **Espace direction** : ce dashboard est le cœur du « pilotage » de la couche expérience
  ([[drwindesk-roadmap]]). Montants **XOF**.
- Alertes de dépassement budgétaire dans la cloche de notifications.

---

## Récap pour le co-dev backend
| # | Changement | Type |
|---|-----------|------|
| 1 | Modèles `Budget`, `LigneBudget` + TENANT_MODELS + RLS | additif |
| 2 | Calcul **réalisé** par axe (agrégation cross-module) + `/budgets/:id/suivi` | logique |
| 3 | Endpoints `/finance/dashboard/*` (trésorerie, créances, dettes, résultat, masse salariale) | additif |
| 4 | Événement `budget.depasse` → notification ([[evenements-notifications]]) | intégration |
| 5 | Restriction par axe (manager voit son périmètre) | option |
| 6 | **États financiers SYSCOHADA** (balance, grand livre, compte de résultat, bilan) | différé V2 |

> **Dépend de** tous les modules finance (source du « réalisé »). Les **états financiers
> réglementaires** complets arrivent avec le **grand livre matérialisé** ([[finance-core]] V2) —
> c'est le passage de l'ambition (A) à (B).
