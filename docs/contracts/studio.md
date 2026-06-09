# Contrat backend — **Studio** (production média : podcasts, vidéos, enregistrements)

> Hand-off front → backend. Couche 3. Greenfield. Gère l'**espace studio** de Drwintech :
> planning de **réservations**, suivi des **productions** (podcasts, vidéos, enregistrements) de
> l'idée à la publication, et **équipement**.
>
> **Branché** : [[projets-taches]] (une production = des tâches), GED (livrables médias),
> [[evenements-notifications]] (rappels de séance), [[recherche]], lien finance possible (coût
> d'une production / facturation client si prestation).

---

## Concepts
- **`Production`** : un projet média (épisode de podcast, vidéo, captation) avec son statut
  éditorial (idée → tournage → montage → publié).
- **`ReservationStudio`** : un créneau de réservation du studio (date, plage horaire, par qui,
  pour quelle production).
- **`Equipement`** : matériel du studio (micro, caméra…) — disponibilité.

## Modèle Prisma
```prisma
enum TypeProduction   { PODCAST VIDEO ENREGISTREMENT LIVE AUTRE }
enum StatutProduction { IDEE PLANIFIE TOURNAGE MONTAGE PUBLIE ANNULE }

model Production {
  id          String           @id @default(uuid()) @db.Uuid
  tenantId    String           @map("tenant_id") @db.Uuid
  reference   String           // "PROD-2026-0001"
  titre       String
  type        TypeProduction   @default(PODCAST)
  statut      StatutProduction @default(IDEE)
  responsableId String?        @map("responsable_id") @db.Uuid
  projetId    String?          @map("projet_id") @db.Uuid   // si rattaché à un projet client
  datePublicationPrevue DateTime? @db.Date @map("date_publication_prevue")
  livrableUrl String?          @map("livrable_url")          // lien média publié
  createdAt   DateTime         @default(now()) @map("created_at")
  updatedAt   DateTime         @updatedAt @map("updated_at")
  reservations ReservationStudio[]
  @@unique([tenantId, reference])
  @@index([tenantId, statut])
  @@map("productions")
}

model ReservationStudio {
  id           String     @id @default(uuid()) @db.Uuid
  tenantId     String     @map("tenant_id") @db.Uuid
  productionId String?    @map("production_id") @db.Uuid
  reservePar   String?    @map("reserve_par") @db.Uuid
  date         DateTime   @db.Date
  heureDebut   String     @map("heure_debut")  // "HH:mm"
  heureFin     String     @map("heure_fin")
  objet        String?
  production   Production? @relation(fields: [productionId], references: [id], onDelete: SetNull)
  @@index([tenantId, date])
  @@map("reservations_studio")
}

model EquipementStudio {
  id        String  @id @default(uuid()) @db.Uuid
  tenantId  String  @map("tenant_id") @db.Uuid
  nom       String
  categorie String? // micro, caméra, éclairage…
  disponible Boolean @default(true)
  @@map("equipements_studio")
}
```
> `TENANT_MODELS` + **RLS** + `tenantId` du JWT.

## Intégrations
- **Conflits de réservation** : refuser (409) deux réservations qui se chevauchent sur le studio
  (même date + plages horaires sécantes).
- **Production ↔ tâches** : une `Production` peut générer des `Task` ([[projets-taches]])
  (script, tournage, montage…). 
- **Rappels** : cron → `studio.seance.rappel` (J-1) → notif aux participants.
- **Coût/facturation** : si la production est une prestation client, lien `projetId` → rentabilité
  projet (cf. finance) et facturation ([[finance-recettes]]).

## Endpoints (préfixe `/api/v1`)
| Méthode | Route | Permission |
|---------|-------|-----------|
| GET/POST/PATCH/DELETE | `/productions` (`?statut&type`) | `studio:read` / `studio:write` |
| GET/POST/DELETE | `/reservations-studio` (`?date&from&to`) | `studio:read` / `studio:write` |
| GET/POST/PATCH | `/equipements-studio` | `studio:read` / `studio:manage` |

## RBAC
- **`studio:read`** / **`studio:write`** / **`studio:manage`** (à créer ; admin a `*`).

## Côté front (livré)
- `features/studio` : **Productions** (cartes par statut éditorial idée→publié, type, lien
  livrable), **Planning / Réservations** (liste des créneaux à venir + réserver). Flag
  `VITE_MOCK_STUDIO`.

## Récap co-dev
| # | Changement | Type |
|---|-----------|------|
| 1 | Modèles `Production/ReservationStudio/EquipementStudio` + TENANT_MODELS + RLS | additif |
| 2 | Garde anti-chevauchement de réservation (409) | logique |
| 3 | Production → tâches ([[projets-taches]]) ; rappels séance ([[evenements-notifications]]) | intégration |
| 4 | Lien projet/facturation pour prestations client | intégration |
| 5 | Réfs auto `PROD-AAAA-NNNN` | convention |
