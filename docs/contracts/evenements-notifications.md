# Contrat backend — **Bus d'événements & notifications multi-canal**

> Hand-off front → backend. **Additif**. La couche de *livraison* existe déjà (BullMQ + Redis,
> module `alerts` → `AlertsProcessor` → `ChannelsDispatcher` routant par sévérité,
> in-app `Notification`, `NotificationBell` front). **Manque** : (1) un **bus pub/sub** pour
> que approbations/audit/notifications s'abonnent au **même** flux d'événements ; (2) les
> **canaux réels** (WhatsApp/email/SMS sont des `TODO`) ; (3) **coordonnées, consentement &
> préférences** par utilisateur. Maillon « couche événements » de la roadmap ([[drwindesk-roadmap]]).
>
> ⚠️ **Ne rien casser** : `AlertsService.enqueue()`, le processor, le dispatcher, le modèle
> `Notification` **restent**. On ajoute un bus au-dessus et on remplit les stubs.

---

## Existant (à conserver)

- **File** BullMQ `ALERTS_QUEUE` : `AlertsService.enqueue(job)` (3 tentatives, backoff expo) →
  `AlertsProcessor` → pose une `Notification` in-app **+** `ChannelsDispatcher.dispatch()`.
- **`ChannelsDispatcher`** : routage **réel** par sévérité — `INFO: []`, `WARNING:[email,whatsapp]`,
  `CRITICAL:[email,whatsapp,sms]` (in-app toujours). Envois = **logs TODO** (Resend / WhatsApp / SMS).
- **`Notification`** `{tenantId,userId,kind,severity,title,body?,data?,readAt}` + `NotificationBell`.
- **Contact** : `User.telephone` et `Employe.telephone` (string libre). **`MailService` SMTP**
  (nodemailer) existe dans `common/mail` (≠ du TODO Resend → **doublon à trancher**, cf. Partie 3).

---

## Architecture cible (ce qu'on ajoute)

```
 Modules métier ─emit─►  BUS D'ÉVÉNEMENTS (EventEmitter2, in-process)
 (RH, présences,             │   un seul vocabulaire : domaine.objet.verbe
  support, approbations…)     │
              ┌───────────────┼────────────────────┐
              ▼               ▼                    ▼
     NotificationsSubscriber  AuditSubscriber   AutomationSubscriber (V2)
              │               └─► AuditService.record()  [[audit]]
              ▼
     AlertsService.enqueue()  (file BullMQ — EXISTANT)
              ▼
     AlertsProcessor → Notification in-app + ChannelsDispatcher
                                          │
                          ┌───────────────┼───────────┐
                          ▼               ▼           ▼
                      Email(Resend/SMTP) WhatsApp    SMS
```

**Idée directrice** : un module **émet un événement** (il ne décide pas *qui* est notifié ni
*comment*). Des **abonnés transverses** décident : notifier, journaliser ([[audit]]),
automatiser (V2). Le **même vocabulaire** `domaine.objet.verbe` sert aux 3 — il est déjà la
convention d'`action` de l'[[audit]].

---

## Partie 1 — Le bus d'événements (cœur du manque)

- Ajouter **`@nestjs/event-emitter`** + `EventEmitterModule.forRoot({ wildcard: true })`.
- Enveloppe typée (pour pouvoir, plus tard, remplacer EventEmitter2 par un vrai broker
  Redis/streams sans toucher aux modules) :

```ts
interface DomainEvent<T = any> {
  name: string;          // "approval.completed", "support.ticket.sla_breached"
  tenantId: string;      // toujours présent (multi-tenant)
  actorId?: string|null; // null = système (cron, automatisation)
  payload: T;            // données métier (ids, libellés, montants…)
  occurredAt: string;    // ISO
}

@Injectable()
class EventBus {
  publish(e: DomainEvent): void;             // = emitter.emit(e.name, e)
}
// abonnés : @OnEvent('approval.*'), @OnEvent('support.ticket.*'), @OnEvent('**') (audit)
```

- **Migration douce** : on n'arrache pas les `alerts.enqueue()` existants. Les **nouveaux**
  flux (approbations, audit, SLA) passent par le bus ; le `NotificationsSubscriber` appelle
  `enqueue()` au besoin. On rebranche l'existant progressivement.
- **Dépendance levée** : le contrat [[approbations]] (`@OnEvent('approval.completed')`) et
  l'[[audit]] (`AuditService.record` sur événements) **ne fonctionnent qu'une fois ce bus posé**.

---

## Partie 2 — Catalogue d'événements & mapping notification

Source unique de vérité « quel événement → quelle sévérité → quels canaux → quel message ».
Rend le comportement **configurable**, pas codé en dur dans chaque module.

| Événement | Sévérité | Destinataire(s) | Canaux (via sévérité) |
|-----------|----------|-----------------|-----------------------|
| `approval.requested`        | INFO     | validateur(s) du step | in-app |
| `approval.completed`        | INFO     | demandeur             | in-app |
| `absence.approved` / `.refused` | INFO | demandeur             | in-app |
| `support.ticket.assigned`   | INFO     | assigné               | in-app |
| `support.ticket.sla_warning`| WARNING  | assigné               | in-app + email + whatsapp |
| `support.ticket.sla_breached`| CRITICAL| assigné + manager     | in-app + email + whatsapp + sms |
| `users.invited`             | INFO     | invité                | email |
| `rapport.missing`           | WARNING  | collaborateur         | in-app + whatsapp |

> Le **catalogue** (table de config ou constante) mappe `event.name → { severity, channels?,
> titleTemplate, bodyTemplate, audience }`. `audience` = règle de résolution des destinataires
> (ex. `payload.assigneeId`, `role:rh`, `manager_of:payload.requesterId`). Réutilise la
> résolution de validateurs du moteur d'approbations.

---

## Partie 3 — Canaux réels (remplir les `TODO`)

### WhatsApp Cloud API (Meta) — le canal différenciant (contexte béninois)
- Env : `WHATSAPP_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_API_VERSION`.
- **Hors fenêtre 24 h** → obligatoire d'utiliser des **templates approuvés (HSM)**. Définir
  quelques templates : `notification_generique`, `alerte_critique`, `validation_demande`.
- Numéros au format **E.164** (cf. Partie 4). Respecter l'**opt-in** (consentement).
- Implémentation dans `ChannelsDispatcher.sendVia('whatsapp', …)` (POST `/{phoneNumberId}/messages`).
- **Inbound / webhook** (répondre « OUI » pour valider une demande) → **V2**.

### Email — trancher le doublon
Deux pistes coexistent : `MailService` SMTP (nodemailer, **déjà fonctionnel**) vs le TODO Resend.
**Recommandation** : brancher `ChannelsDispatcher.sendVia('email')` sur le **`MailService`
existant** (un provider de moins à opérer) ; garder Resend en option via env si délivrabilité
insuffisante. **Décision backend à acter** — ne pas laisser les deux à moitié branchés.

### SMS
Agrégateur ou API opérateur (MTN/Moov). **V2** (coûteux) — garder le stub, n'activer que pour
`CRITICAL` quand un fournisseur est choisi.

---

## Partie 4 — Coordonnées, consentement & préférences

Pour envoyer sur WhatsApp/SMS, il faut un **numéro fiable + un consentement + le respect des
préférences**. `telephone` brut ne suffit pas.

```prisma
model NotificationPreference {
  id        String  @id @default(uuid()) @db.Uuid
  tenantId  String  @map("tenant_id") @db.Uuid
  userId    String  @map("user_id") @db.Uuid
  channel   String  // 'inapp' | 'email' | 'whatsapp' | 'sms'
  kind      String? // null = préférence globale du canal ; sinon par type d'événement
  enabled   Boolean @default(true)
  @@unique([tenantId, userId, channel, kind])
  @@map("notification_preferences")
}
```
+ sur `User` (additif) :
```prisma
  phoneE164      String?   @map("phone_e164")     // normalisé +229… (dérivé de telephone)
  whatsappOptIn  Boolean   @default(false) @map("whatsapp_opt_in")
  whatsappOptInAt DateTime? @map("whatsapp_opt_in_at")
```

Règles dispatcher : un canal externe n'est utilisé que si
`pref(enabled) ET (canal≠whatsapp OU whatsappOptIn) ET phoneE164 présent`. **L'in-app est
toujours posé** (jamais désactivable — c'est la trace). Normalisation E.164 (indicatif Bénin
`+229` par défaut) à la saisie du téléphone.

---

## Partie 5 — Fiabilité & observabilité

- **Idempotence** : clé de dédup `(event.name, recipientId, channel, payload.entityId)` →
  ne pas renvoyer deux fois la même alerte (jobId BullMQ dérivé de cette clé).
- **Retry/DLQ** : BullMQ gère déjà 3 tentatives + backoff ; ajouter un **dead-letter**
  (échec définitif → log + `AuditService.record('notification.failed')`).
- **Trace des envois** : chaque envoi externe réussi/échoué → `AuditService.record()`
  ([[audit]]) → on sait *qui a reçu quoi, sur quel canal, quand*. Synergie bus ↔ audit.

---

## Endpoints (préfixe `/api/v1`)

Notifications in-app : **inchangées** (`GET /notifications`, `unread-count`, `PATCH /:id/read`,
`read-all` — cf. [[drwindesk-stack-decision]]). Ajouts :

| Méthode | Route | Permission | Corps / réponse |
|---------|-------|-----------|-----------------|
| GET   | `/me/notification-preferences` | `me:read`  | → `NotificationPreferenceDto[]` (mes prefs, défauts inclus) |
| PUT   | `/me/notification-preferences` | `me:write` | `{ channel, kind?, enabled }[]` → upsert |
| POST  | `/me/whatsapp/opt-in`          | `me:write` | `{ phone }` → normalise E.164, `whatsappOptIn=true` |
| POST  | `/me/whatsapp/opt-out`         | `me:write` | → `whatsappOptIn=false` |

---

## DTO

```ts
type Channel = 'inapp'|'email'|'whatsapp'|'sms';
interface NotificationPreferenceDto { channel: Channel; kind: string|null; enabled: boolean }
```

---

## RBAC

- Préférences/opt-in : `me:read` / `me:write` (self-service, inchangé).
- Catalogue d'événements (mapping) : configuration **admin** si exposé en UI → `settings:manage`
  (sinon constante backend en V1).
- Émettre un événement n'est **pas** une permission utilisateur : c'est interne au backend.

---

## Côté front (ce que je brancherai)

- **Profil → Mes notifications** : matrice canaux × (global / par type), toggles ; bloc
  **WhatsApp** (numéro + opt-in/opt-out, mention consentement). Feature `features/me` (existant).
- `NotificationBell` **inchangé** (déjà branché sur in-app + sondage).
- Aucune autre UI : le bus est invisible côté front (c'est de l'infra backend). Le front ne fait
  que **régler ses préférences** et **lire ses notifications**.
- Flag `VITE_MOCK_ESPACES` (existant) couvre les notifications ; prefs derrière le même flag.

---

## Récap des changements (pour le co-dev backend)

| # | Changement | Type |
|---|-----------|------|
| 1 | `@nestjs/event-emitter` + `EventBus` + `DomainEvent` typé | additif infra |
| 2 | `NotificationsSubscriber` + `AuditSubscriber` (`@OnEvent`) ; débloque [[approbations]] & [[audit]] | additif |
| 3 | Catalogue événement→sévérité→canaux→template→audience | additif |
| 4 | Implémenter WhatsApp Cloud API dans `ChannelsDispatcher` (templates + E.164 + opt-in) | remplit TODO |
| 5 | Brancher email sur `MailService` SMTP (ou Resend) — **trancher le doublon** | décision |
| 6 | `NotificationPreference` + `User.phoneE164/whatsappOptIn(+At)` | additif schema |
| 7 | Endpoints `/me/notification-preferences`, `/me/whatsapp/opt-in|out` | additif |
| 8 | Idempotence (clé dédup), DLQ, trace des envois via audit | fiabilité |
| 9 | SMS + webhook WhatsApp entrant | différé V2 |

> **Ordre conseillé** : (1)(2) d'abord — ça débloque approbations + audit. Puis (3)(4)(6)(7)
> pour WhatsApp réel + préférences. (5) en parallèle. (8) en durcissement. (9) plus tard.
