# Contrat & spec — **Couche 4 : Expérience** (portail, espaces par rôle, mobile)

> Hand-off front → backend. **Couche 4** ([[drwindesk-roadmap]]). Nature différente des couches
> 1-3 : on **assemble** l'existant en **expériences par rôle**, on ne crée presque pas de modèles.
> Le seul ajout backend = quelques **endpoints d'agrégation** (un appel → un écran). Le reste est
> **front + UX**. Ce document fait donc à la fois **contrat (endpoints)** et **spec (maquettes +
> navigation)**.
>
> Révèle la cohérence des couches 2-3 : inbox unifiée ([[approbations]]), palette `Cmd+K`
> ([[recherche]]), cloche/WhatsApp ([[evenements-notifications]]), timelines ([[audit]]).

---

## Trois espaces, trois rôles

| Espace | Pour qui | Question à laquelle il répond |
|--------|----------|-------------------------------|
| **Portail collaborateur** | tous | « Qu'est-ce que je dois faire / suivre aujourd'hui ? » |
| **Espace manager** | encadrants | « Où en est mon équipe ? Qu'ai-je à valider ? » |
| **Cockpit direction** | direction/gestion | « Comment va l'entreprise (cash, activité, RH) ? » |

> Pas de nouveau module : chaque espace **agrège** des données déjà produites par les couches 2-3.

---

## A. Portail collaborateur — `GET /me/portail`

Un seul appel renvoie le tableau de bord perso (agrège les `me/*` existants).

```
┌── DrwinDesk ───────────────────────────────  🔍 Cmd+K   🔔 3   👤 ──┐
│  Bonjour Awa 👋                              [Pointer l'arrivée ▸]   │
├──────────────────────────────┬──────────────────────────────────────┤
│  ✅ MES TÂCHES (4)            │  📥 À VALIDER (2)                      │
│   • Relancer client X  🔴 auj.│   • Congé — J. Dupont (5j)            │
│   • Préparer rapport   🟠 J+2 │   • Note de frais — 45 000 F          │
│   → Voir le board Kanban      │   → Mes validations                   │
├──────────────────────────────┼──────────────────────────────────────┤
│  📋 MES DEMANDES              │  🎯 MES OBJECTIFS (T1)                 │
│   • Permission 12/06  ⏳      │   ████████░░ 78%  Satisfaction client │
│   • Formation Excel  ✅       │   ██████░░░░ 60%  Délai livraison     │
├──────────────────────────────┼──────────────────────────────────────┤
│  📅 À VENIR                   │  📄 RACCOURCIS                        │
│   • Formation OHADA  J-2      │   Mon bulletin · Mes docs · Mon profil│
└──────────────────────────────┴──────────────────────────────────────┘
```

Payload (composé, pas de nouvelles tables) :
```ts
interface MePortail {
  user: { prenom: string; pointageEnCours: boolean };
  taches:      { total: number; urgentes: TaskDto[] };               // [[projets-taches]]
  aValider:    { total: number; apercu: ApprovalTaskDto[] };          // [[approbations]] /approvals/inbox
  demandes:    { absences: DemandeConge[]; frais: NoteDeFrais[]; formations: DemandeFormation[] }; // statuts en cours
  objectifs:   ObjectifDto[];                                         // [[rh-evaluation]] /me/objectifs
  aVenir:      { type: string; libelle: string; date: string }[];     // formations, échéances
  notifications: { nonLues: number };                                 // [[evenements-notifications]]
  parcours?:   ParcoursDto;                                           // si onboarding en cours [[rh-onboarding]]
}
```
Permission : **`me:read`**. Tout est déjà scopé sur le token.

---

## B. Espace manager — `GET /manager/equipe`, `GET /manager/dashboard`

Réservé à qui a des subordonnés (résolu via `Employe.managerId`).

```
┌── Mon équipe (6) ──────────────────────────────────────────────────┐
│  PRÉSENCES AUJOURD'HUI        À VALIDER (3)         ALERTES          │
│  🟢 4 présents               • 2 congés            ⚠ 1 rapport      │
│  🟠 1 en retard              • 1 note de frais        manquant      │
│  🔴 1 absent                 → inbox unifiée       ⚠ SLA ticket    │
├────────────────────────────────────────────────────────────────────┤
│  MEMBRE          PRÉSENCE   OBJECTIFS   DEMANDES   DERNIER RAPPORT   │
│  J. Dupont       🟢 08:05   ███░ 72%    1 en cours   hier ✅        │
│  M. Koffi        🔴 absent  ██░░ 55%    —            J-3 ⚠         │
│  …                                                                  │
└────────────────────────────────────────────────────────────────────┘
```

- `/manager/equipe` → liste des subordonnés + indicateurs (présence du jour, taux OKR, demandes
  en cours, dernier rapport). Agrège présences + évaluation + rapports + demandes.
- `/manager/dashboard` → compteurs (à valider, alertes : retards, rapports manquants, SLA).
- Les validations passent par l'**inbox unifiée existante** (`/approvals/inbox`), pas un nouvel écran.
- Permission : **`manager:read`** (attribuée à qui a une équipe) **ou** dérivée dynamiquement
  (a des `managerId` pointant vers lui). **Filtre serveur** : un manager ne voit que **son**
  périmètre. À arbitrer : permission explicite vs résolution dynamique (je recommande dynamique +
  une perm `manager:read` pour l'accès à l'espace).

---

## C. Cockpit direction — `GET /direction/cockpit`

Compose les dashboards finance ([[finance-pilotage]]) + stats RH + activité.

```
┌── Cockpit direction ──────────────────  période: [Ce mois ▾] ───────┐
│  💰 TRÉSORERIE      📈 RÉSULTAT       👥 EFFECTIF      🎫 SUPPORT     │
│  12,4 M F          +2,1 M F          48 (+2)         12 tickets     │
│  3 comptes         prod−charges      2 départs prév. 1 SLA dépassé  │
├──────────────────────┬──────────────────────────────────────────────┤
│  CRÉANCES / DETTES    │  MASSE SALARIALE        OKR ENTREPRISE        │
│  À encaisser 4,2 M    │  8,7 M F /mois          ███████░░░ 71%        │
│  ⚠ en retard 1,1 M    │  +6% vs N-1             3 objectifs au vert   │
│  À payer    2,8 M     │                         1 à risque 🟠         │
├──────────────────────┴──────────────────────────────────────────────┤
│  BUDGETS  Marketing ███████░ 88%   IT ████░░ 45%   Form. ██░ 30% ⚠   │
└──────────────────────────────────────────────────────────────────────┘
```

- Réutilise `/finance/dashboard/{tresorerie,creances,dettes,resultat,masse-salariale,budgets}`
  + effectif RH + activité support/tickets + OKR entreprise.
- Permission : **`direction:read`** (direction/gestion). C'est l'écran « pilotage » de la vision.

---

## D. Mobile-first & canaux (contexte béninois)

- **PWA** : `manifest.json` + service worker. **Offline ciblé** : le **pointage** (file
  d'attente locale, rejoue à la reconnexion) — pas toute l'app. Installable (« Ajouter à
  l'écran d'accueil »).
- **Navigation adaptative** : barre de navigation **basse** sur mobile (Accueil · Tâches ·
  Demandes · ➕ · Plus), drawer latéral sur desktop.
- **WhatsApp** : canal déjà câblé ([[evenements-notifications]]) — validations, alertes, relances,
  bulletins. **Inbound (répondre OUI pour valider) = V2.**
- **Mobile Money** : **manuel en V1** (réf. de transaction saisie sur frais/factures/paie) ;
  API MTN/Moov/FedaPay = V2.

---

## E. Éléments transverses (déjà spécifiés, à assembler ici)
- **`Cmd+K`** : recherche globale + actions ([[recherche]]).
- **🔔 Cloche** : notifications in-app + lien WhatsApp ([[evenements-notifications]]).
- **`<ApprovalTimeline>`** dans chaque demande ([[approbations]]) ; **`<ActivityTimeline>`** dans
  chaque fiche ([[audit]]).
- **Thème** clair/sombre, **XOF** partout, **i18n** prêt (français V1).

---

## Endpoints (préfixe `/api/v1`)
| Méthode | Route | Permission | Rôle |
|---------|-------|-----------|------|
| GET | `/me/portail` | `me:read` | agrégat accueil collaborateur |
| GET | `/manager/equipe` | `manager:read` | mon équipe + indicateurs |
| GET | `/manager/dashboard` | `manager:read` | compteurs à valider / alertes |
| GET | `/direction/cockpit` (`?periode`) | `direction:read` | KPI consolidés |

> **Endpoints de composition** (lecture, agrégation des données existantes). **Aucune nouvelle
> table.** Penser au **cache court** (Redis, 30-60 s) côté backend vu qu'ils agrègent plusieurs
> sources, et à la **pagination/limite** des aperçus (top 3-5 par bloc).

---

## RBAC (3 perms additives)
- **`me:read`** (existe) — portail collaborateur.
- **`manager:read`** — accès espace manager ; **+ filtre serveur** sur le périmètre (subordonnés
  via `managerId`). Attribuée au rôle `manager`.
- **`direction:read`** — cockpit. Rôle `direction`/`gestionnaire`. (Réutilise `finance:read` pour
  les blocs finance.)

---

## Côté front (ce que je brancherai)
- **3 pages d'accueil par rôle**, routées selon les permissions : portail (défaut), manager,
  direction — accessibles via un sélecteur si l'utilisateur cumule les rôles.
- Composants tuiles réutilisables (`<KpiCard>`, `<TaskList>`, `<ApprovalInboxPreview>`,
  `<ObjectifProgress>`) alimentés par les agrégats.
- **PWA** : manifest + SW + file offline de pointage. Nav adaptative mobile/desktop.
- Flags : `VITE_MOCK_PORTAIL` / réutilise les flags des modules sous-jacents.

---

## Récap pour le co-dev backend
| # | Changement | Type |
|---|-----------|------|
| 1 | `GET /me/portail` (agrégat collaborateur) | additif (composition) |
| 2 | `GET /manager/equipe` + `/manager/dashboard` (filtre périmètre via `managerId`) | additif |
| 3 | `GET /direction/cockpit` (compose finance + RH + support) | additif |
| 4 | Perms `manager:read`, `direction:read` (+ rôles `manager`, `direction`) | RBAC |
| 5 | Cache court Redis sur les agrégats + limites d'aperçu | perf |
| 6 | (front) PWA manifest/SW + offline pointage + nav mobile | front |
| 7 | WhatsApp inbound, Mobile Money API, sélecteur multi-rôles | différé V2 |

> **Aucune dépendance bloquante nouvelle** : tout repose sur des endpoints déjà contractés. C'est
> la couche qui rend visible le travail des couches 2-3. Reste ensuite la **Couche 5 —
> Intelligence** (assistant IA, Q&A GED, doc intelligence, analytique prédictive).
