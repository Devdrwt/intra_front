# Contrat backend — **Journal d'activité unifié** (audit)

> Hand-off front → backend. **Additif** : le socle existe (`AuditLog`, `AuditInterceptor`
> global, `GET /audit-logs`, front `features/audit`). Ce contrat le fait passer d'un **log
> HTTP brut** à un **journal d'activité métier exploitable** : actions lisibles, **timeline
> par objet**, et **événements métier** (approbations, SLA…) qui n'arrivent pas par une requête
> HTTP. Brique « socle manquant » de la roadmap ([[drwindesk-roadmap]]).
>
> ⚠️ **Ne rien casser** : l'interceptor best-effort, le modèle et l'endpoint **restent**.
> On enrichit ce qui est déjà écrit et on ajoute un canal métier + des lectures.

---

## Existant (à conserver)

- **Modèle** `AuditLog { id, tenantId, actorId, action, resource?, resourceId?, method?, path?, ip?, statusCode?, metadata?, createdAt }` — append-only, tenant-scopé (RLS).
- **`AuditInterceptor`** (global, `app.module.ts`) : journalise chaque requête **mutante réussie**
  (`POST/PUT/PATCH/DELETE`) en best-effort. **MAIS** ne remplit que `action="METHOD path"`,
  `method`, `path`, `ip`, `statusCode`, `actorId`. Les colonnes **`resource`, `resourceId`,
  `metadata` restent vides** → c'est le principal manque.
- **`GET /audit-logs`** (`audit:read`, admin) : filtres `q, actorId, method, from, to`, paginé.
- **Front** `features/audit/AuditPage` : page admin « Activité ».

---

## Le problème en une ligne

> On sait *qu'*une requête a eu lieu (`PATCH /api/v1/employes/123 → 200`), pas *ce qui s'est
> passé métier* (« Awa a modifié la fiche de J. Dupont »), et on ne peut pas lister
> **l'historique d'un objet** ni voir les **événements sans HTTP** (approbation, breach SLA).

---

## Partie 1 — Enrichir le rédacteur (actions lisibles + resource/resourceId)

Décorateur léger sur les routes, lu par l'interceptor existant. **Sans décorateur, le
comportement actuel (fallback `"METHOD path"`) est conservé.**

```ts
// @Audit({ action: 'rh.employe.update', resource: 'employes' })
export const Audit = (meta: { action: string; resource: string }) =>
  SetMetadata('audit', meta);
```

Dans `AuditInterceptor.record()` :
- lire `Reflector.get('audit', handler)` ;
- si présent → `action = meta.action`, `resource = meta.resource`,
  `resourceId = req.params.id ?? <id du body/réponse>` ;
- sinon → fallback actuel.

**Convention d'`action`** : `domaine.objet.verbe` →
`rh.employe.create|update|delete`, `support.ticket.assign|escalate`,
`presences.pointage.create`, `settings.department.update`, `auth.login`, `users.invite`.

> Pas besoin de tout décorer d'un coup : on annote en priorité les mutations « métier »
> (RH, présences, support, approbations, users, settings). Le reste garde le fallback.

---

## Partie 2 — Canal métier (événements sans HTTP) : `AuditService.record()`

Beaucoup d'actions importantes **ne sont pas** des requêtes HTTP mutantes : une **approbation**
franchie ([[approbations]]), un **SLA breaché** par cron ([[support-module]]), un envoi auto.
On expose une API interne pour les journaliser :

```ts
// AuditService (module audit) — appelé par le code applicatif / les abonnés d'événements
record(input: {
  action: string;            // "approval.decided", "support.ticket.sla_breached"
  resource?: string;         // "approval_requests", "tickets"
  resourceId?: string;
  actorId?: string;          // null = système (cron, automatisation)
  metadata?: Record<string, any>; // { decision:'APPROVE', stepName:'Visa RH' }
}, tenantId: string): Promise<void>;   // best-effort, ne jette jamais
```

**Convergence avec le bus d'événements** ([[drwindesk-roadmap]], couche événements) : le moteur
d'approbations émet `approval.completed`/`approval.decided` → un abonnement appelle
`AuditService.record(...)`. Idem SLA, automatisations. **Le journal devient le miroir du bus.**

---

## Partie 3 — Timeline par objet (le gain « moderne »)

Une fois `resource`/`resourceId` remplis, on peut afficher **l'historique d'UN objet** dans sa
propre fiche (ticket, employé, demande d'absence…).

### Endpoint additif
```
GET /audit-logs?resource=employes&resourceId=<id>&page&pageSize  -> AuditPage
```
- Ajout des filtres **`resource`, `resourceId`, `action`** (préfixe, ex. `action=approval.`) au
  `AuditQueryDto` existant.

### Modèle de permission (important)
La page admin `/audit-logs` reste **`audit:read`** (vue globale). Mais la **timeline d'un objet**
doit être visible par qui a déjà le droit de **voir l'objet** :
- soit **réutiliser la permission de lecture du domaine** (ex. timeline d'un ticket → `support:read`),
- soit un endpoint dédié monté côté module (`GET /tickets/:id/activity` qui délègue à l'audit).

> **Décision à acter backend** : je recommande l'**endpoint dédié par domaine**
> (`GET /<resource>/:id/activity`) → l'autorisation suit naturellement la permission du module,
> et on n'expose pas le journal global à un non-admin. À défaut, garder `/audit-logs` admin-only
> et n'afficher la timeline qu'aux admins en V1.

---

## Partie 4 — Lecture & conformité

- **Filtres additifs** sur `/audit-logs` : `resource`, `resourceId`, `action` (préfixe).
  (`q, actorId, method, from, to` déjà là.)
- **Export CSV** (conformité) : `GET /audit-logs/export?<mêmes filtres>` → `text/csv`
  (`audit:read`). Utile pour la direction / contrôle.
- **Append-only** : aucun `PATCH`/`DELETE` sur `audit_logs` (déjà le cas — **le garder**,
  ne jamais exposer de mutation).
- **Rétention** : prévoir une purge configurable (ex. cron mensuel, > 365 j) — paramétrable
  plus tard via les Paramètres org. À documenter, pas bloquant V1.

---

## Formes de réponse (DTO — inchangées + enrichies)

```ts
interface AuditLogItem {
  id: string;
  actorId: string | null;
  actorEmail: string | null;   // résolu (déjà fait)
  actorName?: string | null;   // ➕ prénom nom si dispo (lisibilité)
  action: string;              // "rh.employe.update" (enrichi) ou "PATCH /…" (fallback)
  resource: string | null;     // ➕ désormais rempli
  resourceId: string | null;   // ➕ désormais rempli
  method: string | null;
  path: string | null;
  ip: string | null;
  statusCode: number | null;
  metadata?: Record<string, any> | null; // ➕ contexte métier
  createdAt: string;
}
interface AuditPage { items: AuditLogItem[]; total: number; page: number; pageSize: number }
```

---

## RBAC

- **`audit:read`** — journal global `/audit-logs` + export (admin/direction).
- **Timeline par objet** — permission **de lecture du domaine** concerné (cf. Partie 3),
  pas `audit:read`. (Sinon admin-only en V1.)
- Aucune permission d'écriture : le journal n'est jamais muté via l'API.

---

## Côté front (ce que je brancherai)

- `features/audit` (existant) : enrichir `AuditPage` — colonnes **Action lisible**, **Objet**
  (`resource #resourceId` cliquable vers la fiche), **Acteur** (nom), filtres `resource`/`action`,
  bouton **Export CSV**.
- **`<ActivityTimeline resource=… resourceId=… />`** : composant réutilisable (liste verticale
  horodatée, icône par verbe) **intégré dans les fiches** : ticket, employé, demande d'absence,
  demande d'approbation. C'est lui qui rend la plateforme « vivante » au niveau de chaque objet.
- Source : `GET /<resource>/:id/activity` (recommandé) ou `/audit-logs?resource&resourceId`.
- Flag `VITE_MOCK_AUDIT` (existant).

---

## Récap des changements (pour le co-dev backend)

| # | Changement | Type |
|---|-----------|------|
| 1 | Décorateur `@Audit({action,resource})` + lecture dans l'interceptor (resource/resourceId/action lisible) | additif |
| 2 | Annoter les mutations métier prioritaires (RH, présences, support, approbations, users, settings) | additif |
| 3 | `AuditService.record()` pour événements sans HTTP (approbations, SLA, automatisations) | additif |
| 4 | Filtres `resource`, `resourceId`, `action` (préfixe) sur `/audit-logs` | additif |
| 5 | `GET /<resource>/:id/activity` (timeline scoping par permission domaine) **ou** admin-only V1 | additif |
| 6 | `GET /audit-logs/export` CSV | additif |
| 7 | `actorName`, `metadata` dans `AuditLogItem` | additif |
| 8 | (plus tard) purge de rétention configurable | différé |

> Synergie : une fois (3) en place, **le moteur d'approbations et le SLA support écrivent
> automatiquement** leurs événements clés dans le journal → cohérence socle/moteurs.
