# Contrat backend — **GED : Archivage & rétention** (+ stockage cloud branchable)

> Hand-off front → backend. Complète le pilier **Documentaire** ([[drwindesk-roadmap]], GED
> existante). Gère le **cycle de vie des documents** : actif → **archivé** (stockage froid) →
> **conservation légale** → **purge** à l'échéance. Conçu pour **brancher un cloud** comme
> destination d'archives (Scaleway/AWS/Azure/GCS), de façon **pluggable** : ajouter un cloud =
> configurer un `ArchiveStore`, pas réécrire le module.
>
> **Contexte OHADA/Bénin** : durées légales de conservation (pièces comptables **10 ans** — OHADA
> art. 24 ; contrats, bulletins de paie, etc.). L'archivage doit **prouver la non-altération**
> (scellement par hash) et **respecter la rétention** (pas de purge avant l'échéance ni sous
> rétention légale). Branché : GED/Documents existant, [[finance-core]] (clôture d'exercice →
> archiver les pièces), [[audit]] (traçabilité), [[evenements-notifications]] (échéances).

---

## Concepts
- **`PolitiqueArchivage`** : règle de rétention par type/catégorie de document (durée, action à
  l'échéance, déclencheur d'archivage). Réglable par tenant.
- **`ArchiveStore`** : **destination de stockage des archives** — c'est le « cloud » à brancher.
  Type `LOCAL | S3 | SCALEWAY | AWS_GLACIER | AZURE_BLOB | GCS`. Pluggable.
- **`ArchiveDocument`** : un document archivé — pointe vers le `Document` d'origine, sa copie dans
  l'`ArchiveStore`, son **hash de scellement**, sa **date de fin de rétention**, son statut.

## Modèle Prisma
```prisma
enum TypeArchiveStore { LOCAL S3 SCALEWAY AWS_GLACIER AZURE_BLOB GCS }
enum ActionEcheance   { PURGER CONSERVER }       // que faire quand la rétention expire
enum StatutArchive    { ARCHIVE SOUS_RETENTION_LEGALE A_PURGER PURGE RESTAURE }

model ArchiveStore {                 // « relier à un cloud » = créer/activer un store
  id        String   @id @default(uuid()) @db.Uuid
  tenantId  String   @map("tenant_id") @db.Uuid
  nom       String
  type      TypeArchiveStore @default(LOCAL)
  // Config provider (bucket, region, endpoint, classe de stockage…). Les SECRETS ne sont PAS
  // ici : référence vers un secret côté ops (env/secret manager). Voir garde-fous.
  config    Json?
  secretRef String?  @map("secret_ref")   // clé logique du secret (creds), résolue backend
  actif     Boolean  @default(true)
  parDefaut Boolean  @default(false) @map("par_defaut")
  createdAt DateTime @default(now()) @map("created_at")
  @@unique([tenantId, nom])
  @@map("archive_stores")
}

model PolitiqueArchivage {
  id                 String  @id @default(uuid()) @db.Uuid
  tenantId           String  @map("tenant_id") @db.Uuid
  nom                String
  typeDocument       String? @map("type_document")  // null = défaut tous types
  dureeConservationMois Int  @map("duree_conservation_mois") // ex. 120 = 10 ans
  actionEcheance     ActionEcheance @default(CONSERVER)
  // Quand démarrer le décompte : date du document, ou date de clôture d'exercice (compta)…
  declencheur        String  @default("DATE_DOCUMENT") @map("declencheur")
  archiveStoreId     String? @map("archive_store_id") @db.Uuid // destination ; null = défaut
  actif              Boolean @default(true)
  @@index([tenantId, typeDocument])
  @@map("politiques_archivage")
}

model ArchiveDocument {
  id            String   @id @default(uuid()) @db.Uuid
  tenantId      String   @map("tenant_id") @db.Uuid
  documentId    String   @map("document_id") @db.Uuid   // Document GED d'origine
  archiveStoreId String  @map("archive_store_id") @db.Uuid
  storageKey    String   @map("storage_key")            // clé dans le store cloud
  tailleKo      Int      @map("taille_ko")
  // Scellement d'intégrité : hash du contenu au moment de l'archivage (preuve de non-altération)
  hashSha256    String   @map("hash_sha256")
  statut        StatutArchive @default(ARCHIVE)
  archivedAt    DateTime @default(now()) @map("archived_at")
  retentionUntil DateTime? @map("retention_until")      // calculée depuis la politique
  retentionLegale Boolean @default(false) @map("retention_legale") // legal hold : bloque la purge
  purgedAt      DateTime? @map("purged_at")
  @@unique([tenantId, documentId])
  @@index([tenantId, statut, retentionUntil])
  @@map("archive_documents")
}
```
> `TENANT_MODELS` + **RLS** + `tenantId` du JWT.

---

## Stockage cloud branchable (le cœur de la demande)

Abstraction backend `ArchiveStorageProvider` — une interface, plusieurs implémentations ; le
`type` de l'`ArchiveStore` choisit laquelle :

```ts
interface ArchiveStorageProvider {
  put(store: ArchiveStore, key: string, data: Buffer): Promise<{ etag?: string }>;
  get(store: ArchiveStore, key: string): Promise<Buffer>;     // pour restauration
  delete(store: ArchiveStore, key: string): Promise<void>;    // purge
}
// LOCAL (disque/volume), S3/SCALEWAY (S3 API — déjà dans la stack), AWS_GLACIER (cold),
// AZURE_BLOB, GCS. Ajouter un cloud = une impl + un ArchiveStore configuré. Aucun autre changement.
```
- **V1** : `LOCAL` + **S3/Scaleway** (déjà prévus dans la stack, même API que le presign GED).
  → l'archivage marche tout de suite sans nouveau cloud.
- **Brancher un cloud plus tard** : créer un `ArchiveStore` (type + bucket + region + endpoint),
  référencer ses creds via `secretRef` (côté ops), l'activer → les nouvelles archives y vont.
- **Classes froides** (Glacier/Archive tier) = moins cher pour du long terme ; la restauration
  peut être différée (asynchrone) — le statut/restauration gère ce délai.

---

## Cycle de vie
```
Document GED (actif)
   │  archiver (manuel, ou cron selon PolitiqueArchivage)
   ▼
ArchiveDocument: calcule hash SHA-256 (scellement) → copie vers ArchiveStore (cloud)
   → statut ARCHIVE, retentionUntil = déclencheur + dureeConservationMois
   → (option) retirer/alléger la copie active de la GED
   │
   ├─ rétention légale posée → SOUS_RETENTION_LEGALE (purge IMPOSSIBLE tant que levée)
   │
   ▼  cron : retentionUntil dépassée
   ├─ actionEcheance=CONSERVER → reste archivé (notif « éligible à revue »)
   └─ actionEcheance=PURGER → A_PURGER → purge validée (admin) → PURGE (contenu supprimé,
        métadonnées + preuve conservées pour l'audit)

Restauration : RESTAURE → re-télécharge depuis le store → recrée un Document actif en GED.
```

---

## Intégrations
- **Finance** : à la **clôture d'exercice** ([[finance-core]]), proposer l'archivage en lot des
  pièces de l'exercice (factures, bulletins…), avec la politique « 10 ans » OHADA.
- **Audit** : `ged.archive.create/restore/purge` + `ged.retention.hold` → journal inviolable
  ([[audit]]) — qui a archivé/purgé quoi, quand. **Append-only**.
- **Notifications** : `archive.echeance` (rétention bientôt expirée), `archive.purge_proposee`
  → notif à l'archiviste/admin ([[evenements-notifications]]).
- **Recherche** : les archives restent trouvables ([[recherche]], `type=archive`, badge « archivé »)
  même si la copie active est allégée.

---

## Endpoints (préfixe `/api/v1`)
| Méthode | Route | Permission |
|---------|-------|-----------|
| GET/POST/PATCH/DELETE | `/archivage/stores` | `ged.archive:manage` (**brancher/retirer un cloud**) |
| POST | `/archivage/stores/:id/tester` | `ged.archive:manage` (vérifie l'accès au bucket) |
| GET/POST/PATCH | `/archivage/politiques` | `ged.archive:manage` |
| POST | `/documents/:id/archiver` | `ged.archive:manage` `{ archiveStoreId?, politiqueId? }` |
| GET  | `/archives` (`?statut&type&retentionLegale&from&to`) | `ged.archive:read` |
| GET  | `/archives/:id` | `ged.archive:read` (métadonnées + preuve d'intégrité) |
| POST | `/archives/:id/restaurer` | `ged.archive:manage` → recrée un Document GED |
| POST | `/archives/:id/retention-legale` | `ged.archive:manage` `{ active: boolean, motif? }` |
| POST | `/archives/:id/purger` | `ged.archive:manage` (refusé si rétention non échue / legal hold) |
| GET  | `/archives/:id/verifier-integrite` | `ged.archive:read` → recompare le hash |

> **Purge** = action sensible : double garde (rétention échue **et** pas de legal hold) +
> confirmation. La purge supprime le **contenu** mais **conserve** métadonnées + hash + journal
> (preuve qu'un document a existé et a été détruit réglementairement).

---

## RBAC
- **`ged.archive:read`** — consulter les archives, vérifier l'intégrité (archiviste, comptable, audit).
- **`ged.archive:manage`** — politiques, **connexion cloud (stores)**, archiver, restaurer,
  rétention légale, purger (très restreint — rôle archiviste/admin). Admin `*`.

---

## Garde-fous
1. **Intégrité** : hash SHA-256 au moment de l'archivage ; `verifier-integrite` recompare →
   preuve de non-altération (scellement). Optionnel V2 : horodatage qualifié / signature.
2. **Rétention** : purge **impossible** avant `retentionUntil` **ou** sous **rétention légale**
   (legal hold) — enforcement serveur.
3. **Secrets cloud** : jamais dans `config`/la base ; `secretRef` → secret côté ops (env/secret
   manager). Le front ne voit jamais les credentials du store.
4. **Tenant** : un `ArchiveStore`, une archive et leur contenu sont **strictement** par tenant
   (RLS + clés préfixées par tenant dans le bucket).
5. **Traçabilité** : tout (archivage, restauration, purge, legal hold) journalisé append-only.

---

## Côté front (ce que je brancherai)
- `features/ged/archivage` : **Stores** (Paramètres → « Connexion cloud d'archivage » : ajouter
  un S3/Scaleway/Glacier…, tester l'accès, définir le défaut) ; **Politiques de rétention** ;
  **Archives** (liste filtrable, statut, échéance, badge legal hold, vérifier intégrité,
  restaurer, purger). Flag `VITE_MOCK_ARCHIVAGE`.
- Action **« Archiver »** sur une fiche document (et en lot depuis la clôture d'exercice).
- Bandeau « document archivé — restaurer » dans la GED. Mention claire des échéances de rétention.

---

## Récap pour le co-dev backend
| # | Changement | Type |
|---|-----------|------|
| 1 | Modèles `ArchiveStore`, `PolitiqueArchivage`, `ArchiveDocument` + TENANT_MODELS + RLS | additif |
| 2 | Abstraction `ArchiveStorageProvider` (LOCAL + S3/Scaleway V1 ; Glacier/Azure/GCS pluggables) | infra |
| 3 | Archivage : hash de scellement + copie vers store + calcul `retentionUntil` | logique |
| 4 | Crons : auto-archivage par politique + détection d'échéance + proposition de purge | logique |
| 5 | Rétention légale (legal hold) bloquant la purge ; purge = contenu supprimé, preuve conservée | conformité |
| 6 | Restauration (re-création d'un Document GED depuis le store, gère le délai cold storage) | logique |
| 7 | Intégration clôture d'exercice ([[finance-core]]) + audit + notifications + recherche | intégration |
| 8 | `secretRef` pour les creds cloud (jamais en base) | sécurité |

> **Dépend de** la GED/Documents existante. « Relier à un cloud » = créer un `ArchiveStore` ;
> l'abstraction provider rend l'ajout d'un cloud purement additif. Complète le pilier documentaire.
