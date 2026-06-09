# DrwinDesk — Architecture cible (vision figée)

> Vision consolidée de la plateforme : **intranet/ERP/SIRH** multi-tenant pour Drwintech, puis
> SaaS pour PME béninoises. Document de référence qui relie **socle → moteurs → modules** et
> indexe les contrats backend (`docs/contracts/`). Mantra : *simplicité radicale, mobile-first,
> utilisateurs non techniques, contexte ouest-africain (XOF, Mobile Money, WhatsApp, SYSCOHADA)*.

## Principe directeur

> **« Socle + moteurs + modules »** — ce qui rend la plateforme avancée n'est pas le nombre de
> modules, mais quelques **moteurs transverses** que chaque module réutilise. Règle d'or :
> **chaque nouveau module consomme un moteur existant, il ne le réinvente pas.**

```
┌─────────────────────────────────────────────────────────────────────────┐
│ COUCHE 5 — INTELLIGENCE ▣ assistant IA · génération docs/rapports · Q&A   │
│                           GED · extraction factures · (Claude Opus 4.8)   │
├─────────────────────────────────────────────────────────────────────────┤
│ COUCHE 4 — EXPÉRIENCE ▣   portail self-service · espace manager/direction │
│                           PWA mobile-first · WhatsApp · Mobile Money      │
├─────────────────────────────────────────────────────────────────────────┤
│ COUCHE 3 — MODULES MÉTIER                                                 │
│   SIRH        : RH ✓ · Présences/Congés ✓ · Reporting ✓ · Recrutement ✓   │
│                 Paie ▣ · Éval/OKR ▣ · Onboarding/Offboarding ▣ · Formation ▣│
│   Opérations  : Support/Helpdesk ▣ · Projets ✓+Tâches/Kanban ▣            │
│   Finance     : Core ▣ Dépenses ▣ Recettes ▣ Trésorerie ▣ Paie ▣ Pilotage ▣│
│   Documentaire: GED ✓ · Archivage/rétention + cloud ▣ · (signature · KB)  │
│   Relation    : Messagerie ✓ · Site web/candidat ✓                        │
├─────────────────────────────────────────────────────────────────────────┤
│ COUCHE 2 — MOTEURS (transverses)                                          │
│   Approbations ▣  ·  Bus d'événements + Notifications/WhatsApp ▣           │
│   Journal d'audit ▣  ·  Recherche globale + Cmd+K ▣                        │
├─────────────────────────────────────────────────────────────────────────┤
│ COUCHE 1 — SOCLE                                                          │
│   Multi-tenant (tenantId JWT + RLS) ✓ · RBAC ✓ · Auth/MFA ✓               │
│   Référentiels (départements/services) ✓ · GED ✓                          │
└─────────────────────────────────────────────────────────────────────────┘
        ✓ existant/livré   ▣ contrat rédigé (à implémenter)   () envisagé
```

## Le flux qui unifie tout

Un **seul vocabulaire d'événements** `domaine.objet.verbe`, **trois consommateurs** :

```
   Modules métier ──emit──►  BUS D'ÉVÉNEMENTS
                                  │
        ┌─────────────────────────┼──────────────────────┐
        ▼                         ▼                       ▼
   NOTIFICATIONS              JOURNAL D'AUDIT          RECHERCHE
 (in-app/WhatsApp/email/SMS)  (timeline par objet)    (index unifié)

   MOTEUR D'APPROBATIONS ──► inbox unifiée « Mes validations »
     (congés, frais, achats… émettent ici, audit + notif suivent)
```

## Stack (rappel)

Full-TypeScript. **Back** NestJS + PostgreSQL 16 + Prisma + Redis/BullMQ (+ Meilisearch en V2) ;
multi-tenant `tenantId` dans le JWT + RLS ; `/api/v1`. **Front** monorepo : Next.js (public/
candidat) + SPA Vite (app interne) + design system Tailwind partagé. Mobile : PWA → Expo V2.
Détails : voir mémoire `drwindesk-stack-decision`.

---

## Index des contrats (`docs/contracts/`)

### Socle
| Contrat | Objet | Statut |
|---------|-------|--------|
| `referentiels.md` | Départements & services | ✅ implémenté |
| `espace-collaborateur.md` | Endpoints `me/*`, rôles | ✅ implémenté |
| `matricule.md` | Réfs auto-générées | ✅ implémenté |

### Couche 2 — Moteurs
| Contrat | Objet | Statut |
|---------|-------|--------|
| `approbations.md` | Moteur d'approbations agnostique (+ règles auto V2) | ▣ contrat |
| `demandes-absence.md` | Permissions/repos/congés branchés au moteur | ▣ contrat |
| `audit.md` | Journal d'activité unifié (actions lisibles, timeline) | ▣ contrat (socle existant enrichi) |
| `evenements-notifications.md` | Bus pub/sub + canaux WhatsApp/email/SMS + préférences | ▣ contrat (infra existante complétée) |
| `recherche.md` | Recherche globale + `Cmd+K` (PG V1, Meili V2) | ▣ contrat |
| `support.md` | Helpdesk : tickets + SLA + KB (dérivé Task360) | ▣ contrat |

### Couche 3 — Finance & Gestion
| Contrat | Objet | Statut |
|---------|-------|--------|
| `finance-core.md` | Tiers, plan SYSCOHADA, comptabilisation, export | ▣ contrat |
| `finance-depenses.md` | Notes de frais + achats/fournisseurs | ▣ contrat |
| `finance-recettes.md` | Devis, facturation client, encaissements, relances | ▣ contrat |
| `finance-tresorerie.md` | Caisse/banque/Mobile Money, soldes, rapprochement | ▣ contrat |
| `finance-paie.md` | Bulletins, CNSS/ITS, déclarations | ▣ contrat |
| `finance-pilotage.md` | Budgets, tableaux de bord (états financiers V2) | ▣ contrat |

### Couche 3 — SIRH (extensions)
| Contrat | Objet | Statut |
|---------|-------|--------|
| `rh-evaluation.md` | Évaluation & Objectifs/OKR (campagnes, grilles) | ▣ contrat |
| `rh-onboarding.md` | Onboarding/Offboarding (parcours, réutilise Tâches) | ▣ contrat |
| `rh-formation.md` | Formation (catalogue, sessions, compétences) | ▣ contrat |

### Couche 3 — Opérations
| Contrat | Objet | Statut |
|---------|-------|--------|
| `projets-taches.md` | Tâches & Kanban (étend Projects, dérivé Task360) | ▣ contrat |

### Couche 4 — Expérience
| Contrat | Objet | Statut |
|---------|-------|--------|
| `experience.md` | Portail/manager/cockpit (endpoints d'agrégation) + PWA/mobile | ▣ contrat+spec |

### Couche 3 — Documentaire
| Contrat | Objet | Statut |
|---------|-------|--------|
| `ged-archivage.md` | Archivage GED : rétention légale (OHADA), scellement, stockage cloud branchable | ▣ contrat |

### Couche 5 — Intelligence
| Contrat | Objet | Statut |
|---------|-------|--------|
| `assistant-ia.md` | Assistant IA : génération docs/canvas, rapports, extraction, Q&A GED (Claude Opus 4.8) | ▣ contrat+spec |

---

## Conventions transverses (valables pour tout contrat)

1. **Multi-tenant** : `tenantId` du JWT, jamais d'un header ; modèle ajouté à `TENANT_MODELS` +
   policy RLS. Aucune fuite cross-tenant.
2. **Argent** : `Decimal(15,2)`, `devise='XOF'`, affichage FCFA 0 décimale.
3. **Réfs lisibles** : `XXX-AAAA-NNNN` auto-générées backend (cf. `matricule.md`).
4. **Comptabilisation** : tout document financier expose `toAccountingLines()` → export
   SYSCOHADA (`finance-core.md`). Personne ne saisit de débit/crédit.
5. **Validation humaine** : toujours via le moteur d'approbations + inbox unifiée, jamais de
   bouton « approuver » ad hoc par module.
6. **Notifier/journaliser/indexer** : par **émission d'événement**, pas d'appel direct par module.
7. **Permissions** : enforcement **serveur** (jamais le front) ; lecture self-service limitée au
   propriétaire (`mine`/`me`).
8. **Co-dev backend** : édition **additive et chirurgicale** des fichiers partagés (`schema.prisma`,
   `seed.ts`, `rls.sql`, `tenant.extension.ts`, `app.module.ts`) — jamais de réécriture.
9. **Front** : pattern `service = USE_MOCKS.<mod> ? mock : http`, flag `VITE_MOCK_<MOD>`, hooks
   react-query.

## Validations métier externes en attente

- **Format SYSCOHADA** exact de l'export comptable (logiciel du comptable cible) — `finance-core.md`.
- **Taux & barèmes** CNSS / ITS / VPS (expert-paie béninois) — `finance-paie.md`.
- **Templates WhatsApp** approuvés (Meta) — `evenements-notifications.md`.

## Séquencement d'implémentation conseillé

1. **Moteurs d'abord** (couche 2), dans l'ordre : bus d'événements → approbations + audit (ils en
   dépendent) → recherche. Sans le bus, approbations/audit/recherche ne se branchent pas.
2. **Premiers consommateurs** : demandes d'absence (valide le moteur d'approbations de bout en bout),
   support.
3. **Finance** : core → dépenses → recettes → trésorerie (convergence) → paie → pilotage.
4. **Projets/Tâches** : indépendant, livrable à tout moment.
5. **Couches 4–5** (expérience consolidée, IA) une fois les modules alimentés.

> Cap : **peu de briques, mais structurantes.** On industrialise les moteurs, les modules
> deviennent de la configuration.
