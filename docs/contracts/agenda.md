# Contrat backend — **Agenda du collaborateur** (perso + agrégation + iCal)

> Hand-off front → backend. Couche 3 / Expérience. Greenfield. Chaque collaborateur a un
> **agenda** : ses propres événements **+** la **superposition automatique** de tout ce qui est
> déjà daté dans la plateforme (congés, formations, studio, échéances…). Interop : **flux iCal
> en lecture** (abonnement Google/Outlook/téléphone).
>
> **Branché** : self-service [[espace-collaborateur]] (`me:*`), agrégation lecture des modules
> (présences, [[rh-formation]], studio, [[projets-taches]], [[appels-offres]]…),
> rappels via [[evenements-notifications]] (in-app + WhatsApp), [[recherche]].

---

## Périmètre V1
- **Mes événements** : créer/éditer/supprimer (rendez-vous, réunion, rappel, créneau bloqué).
- **Agrégation** (lecture seule) : congés/permissions approuvés, sessions de formation inscrites,
  réservations studio, échéances de tâches, dates limites d'appels d'offres, date de paie…
- **Flux iCal** en lecture (sens unique).
> V2 : agenda **de service** partagé + vue manager « disponibilités équipe » ; synchro 2-sens.

## Modèle Prisma
```prisma
enum TypeEvenement  { RENDEZ_VOUS REUNION RAPPEL CRENEAU AUTRE }
enum Recurrence     { AUCUNE QUOTIDIEN HEBDO MENSUEL }

model EvenementAgenda {
  id            String   @id @default(uuid()) @db.Uuid
  tenantId      String   @map("tenant_id") @db.Uuid
  ownerId       String   @map("owner_id") @db.Uuid    // User propriétaire
  titre         String
  description   String?  @db.Text
  debut         DateTime
  fin           DateTime
  journeeEntiere Boolean @default(false) @map("journee_entiere")
  lieu          String?
  type          TypeEvenement @default(RENDEZ_VOUS)
  recurrence    Recurrence    @default(AUCUNE)
  rappelMinutes Int?     @map("rappel_minutes")       // ex. 15 → rappel 15 min avant
  createdAt     DateTime @default(now()) @map("created_at")
  updatedAt     DateTime @updatedAt @map("updated_at")
  @@index([tenantId, ownerId, debut])
  @@map("evenements_agenda")
}

// Jeton secret par utilisateur pour le flux iCal (les apps calendrier n'envoient pas de cookie).
model AgendaToken {
  id        String  @id @default(uuid()) @db.Uuid
  tenantId  String  @map("tenant_id") @db.Uuid
  userId    String  @unique @map("user_id") @db.Uuid
  token     String  @unique            // aléatoire, révocable
  createdAt DateTime @default(now()) @map("created_at")
  @@map("agenda_tokens")
}
```
> `EvenementAgenda` + `AgendaToken` dans **`TENANT_MODELS`** + **RLS** + `tenantId` du JWT.

---

## Agrégation (le cœur)
`GET /agenda?from&to` renvoie une liste **unifiée** d'items, scopée sur l'utilisateur courant :
- ses `EvenementAgenda` (éditables) ;
- des items **dérivés** (lecture seule) construits depuis les autres modules, chacun avec une
  **source** + une **couleur** + un **lien** vers l'objet.

```ts
type AgendaSource = 'PERSO' | 'CONGE' | 'FORMATION' | 'STUDIO' | 'TACHE' | 'AO' | 'PAIE';
interface AgendaItem {
  id: string;
  source: AgendaSource;
  titre: string;
  debut: string;            // ISO
  fin: string;              // ISO
  journeeEntiere: boolean;
  lieu?: string;
  url?: string;             // route front de l'objet source
  editable: boolean;        // true seulement pour PERSO
}
```
| Source | Origine |
|--------|---------|
| CONGE | congés/permissions approuvés (présences) sur la période |
| FORMATION | sessions où l'employé est inscrit ([[rh-formation]]) |
| STUDIO | réservations studio de l'utilisateur |
| TACHE | tâches assignées avec `dateEcheance` ([[projets-taches]]) → item « journée entière » |
| AO | dates limites d'appels d'offres (si rôle secrétariat, [[appels-offres]]) |
| PAIE | date de paie de la période ([[finance-paie]]) |

> Le backend **n'invente pas** d'événements : il **projette** des données existantes. L'utilisateur
> ne voit que ce qu'il a le droit de voir (scoping serveur).

---

## Flux iCal (lecture seule)
- `GET /me/agenda/ical-url` (auth cookie) → `{ url }` : l'URL d'abonnement contenant le **token**
  secret de l'utilisateur (créé à la volée s'il n'existe pas). Bouton « révoquer/régénérer ».
- `GET /agenda/ical?token=<token>` → **`text/calendar`** (VCALENDAR) : l'agenda de l'utilisateur
  (perso + agrégé) sur ~±90 jours. **Authentifié par le token**, pas par le cookie (route
  `@Public()` mais inutile sans token valide). Lecture seule.

---

## Rappels
- Cron (5 min) : événements perso à venir dont `rappelMinutes` est défini et atteint →
  événement `agenda.rappel` → notification in-app + WhatsApp ([[evenements-notifications]]).

## Endpoints (préfixe `/api/v1`)
| Méthode | Route | Permission |
|---------|-------|-----------|
| GET | `/agenda` (`?from&to`) | `me:read` → `AgendaItem[]` (perso + agrégé) |
| POST | `/agenda/evenements` | `me:write` |
| PATCH/DELETE | `/agenda/evenements/:id` | `me:write` (si propriétaire) |
| GET | `/me/agenda/ical-url` | `me:read` → `{ url }` |
| POST | `/me/agenda/ical-url/regenerer` | `me:write` → révoque + recrée le token |
| GET | `/agenda/ical?token=` | `@Public()` (auth par token) → text/calendar |

## RBAC
- **`me:read` / `me:write`** (self-service). L'agrégation est scopée sur l'utilisateur et ses
  permissions de lecture par module. Pas de nouvelle permission en V1.

## Côté front (livré)
- `features/agenda` : **AgendaPage** (vue **mois** + liste du jour sélectionné, navigation
  mois précédent/suivant, création d'événement), items **agrégés colorés** par source + légende,
  bouton « S'abonner (iCal) » qui copie l'URL. Flag `VITE_MOCK_AGENDA`.
- Entrée **« Mon agenda »** (Mon espace) + tuile sur l'**accueil rapide** mobile.

## Récap co-dev
| # | Changement | Type |
|---|-----------|------|
| 1 | Modèles `EvenementAgenda` + `AgendaToken` + TENANT_MODELS + RLS | additif |
| 2 | `GET /agenda` : CRUD perso + **projection** des modules (congés/formation/studio/tâches/AO/paie) | logique |
| 3 | Flux iCal token-authentifié (`text/calendar`) | additif |
| 4 | Rappels `agenda.rappel` (cron → [[evenements-notifications]]) | intégration |
| 5 | (V2) agenda de service + dispo équipe + synchro 2-sens | différé |
