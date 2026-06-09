# Contrat & spec — **Couche 5 : Assistant IA** (génération de documents, rapports, Q&A)

> Hand-off front → backend. **Couche 5** ([[drwindesk-roadmap]]) — la dernière. Un assistant qui
> **produit**, pas seulement qui répond : génère un **contrat type à partir d'un exemplaire/canvas
> existant**, rédige le **rapport mensuel**, extrait des données de documents, et répond en langage
> naturel sur la GED. Utile **à tous les services**.
>
> **Stack IA** : SDK **`@anthropic-ai/sdk`** (le projet est full-TypeScript). Modèle par défaut
> **`claude-opus-4-8`** (Opus 4.8). Branché sur GED/Documents, [[finance-core]], RH, [[audit]],
> [[recherche]]. Module backend `ai`.

---

## Capacités (ce que l'assistant sait faire)

| # | Capacité | Exemple concret | Pour qui |
|---|----------|-----------------|----------|
| 1 | **Génération depuis modèle/canvas** | Contrat de travail à partir d'un exemplaire + fiche employé | RH, juridique, direction |
| 2 | **Création de modèle depuis un exemplaire** | Importer un contrat existant → en faire un gabarit réutilisable | RH/admin |
| 3 | **Génération de rapports** | Rapport mensuel d'activité (consolide les rapports journaliers), synthèse financière | Tous les managers |
| 4 | **Extraction (doc intelligence)** | Lire une facture fournisseur PDF → pré-remplir les lignes ([[finance-depenses]]) | Comptable |
| 5 | **Q&A / assistant conversationnel** | « Quel est le solde de congés de X ? », « Résume ce contrat » | Tous |
| 6 | **Rédaction transverse** | Attestations, lettres, fiches de poste, annonces internes, e-mails | Tous |

> **Principe** : l'assistant **assemble le contexte autorisé** (données scopées par les
> permissions de l'utilisateur), **génère un brouillon**, et **un humain valide**. Jamais de
> document final auto-publié — surtout pour les contrats (enjeu juridique).

---

## Modèle Prisma
```prisma
enum TypeModeleDoc { CONTRAT ATTESTATION LETTRE RAPPORT FICHE_POSTE AUTRE }
enum StatutGeneration { BROUILLON VALIDE REJETE }

model ModeleDocument {           // gabarit/canvas réutilisable
  id            String   @id @default(uuid()) @db.Uuid
  tenantId      String   @map("tenant_id") @db.Uuid
  nom           String
  type          TypeModeleDoc
  // Le canvas : texte avec variables {{employe.nom}}, {{salaire}}, {{date_debut}}…
  contenuModele String   @db.Text @map("contenu_modele")
  // Consignes de rédaction passées au modèle (ton, clauses obligatoires, droit applicable…)
  instructionsIa String? @db.Text @map("instructions_ia")
  // Variables attendues + leur source (entité/champ) — pour l'auto-remplissage
  variables     Json?
  sourceExemplaireKey String? @map("source_exemplaire_key") // S3 de l'exemplaire importé
  actif         Boolean  @default(true)
  createdAt     DateTime @default(now()) @map("created_at")
  updatedAt     DateTime @updatedAt @map("updated_at")
  @@index([tenantId, type])
  @@map("modeles_document")
}

model GenerationDocument {       // un document généré (traçable)
  id           String   @id @default(uuid()) @db.Uuid
  tenantId     String   @map("tenant_id") @db.Uuid
  modeleId     String?  @map("modele_id") @db.Uuid
  type         TypeModeleDoc
  // Objet métier source (employé, facture…) — pour le contexte
  entityType   String?  @map("entity_type")
  entityId     String?  @map("entity_id") @db.Uuid
  contenuGenere String  @db.Text @map("contenu_genere")
  statut       StatutGeneration @default(BROUILLON)
  modelIa      String   @map("model_ia")     // "claude-opus-4-8"
  tokensIn     Int?     @map("tokens_in")
  tokensOut    Int?     @map("tokens_out")
  documentId   String?  @map("document_id") @db.Uuid // Document GED après validation
  createdById  String?  @map("created_by_id") @db.Uuid
  createdAt    DateTime @default(now()) @map("created_at")
  @@index([tenantId, type, statut])
  @@map("generations_document")
}
```
> `TENANT_MODELS` + **RLS** + `tenantId` du JWT. (Conversations/messages assistant : modèles
> `ConversationIa`/`MessageIa` optionnels si on veut l'historique — sinon stateless.)

---

## Implémentation IA (réglages Claude — à respecter)

> Source : skill `claude-api`. Le projet étant TypeScript, SDK `@anthropic-ai/sdk`.

- **Modèle par défaut `claude-opus-4-8`** (le plus capable ; enjeux juridiques/financiers).
- **Adaptive thinking** pour tout ce qui est complexe : `thinking: { type: "adaptive" }`
  (⚠️ `budget_tokens`, `temperature`, `top_p` → **400 sur Opus 4.8**, ne pas les envoyer).
- **Streaming** pour les sorties longues (contrat, rapport) : `client.messages.stream(...)` +
  `max_tokens` généreux (~64000) → rendu progressif côté front (réutilise le canal SSE existant).
- **Structured outputs** pour l'extraction (capacité 4) : `output_config: { format: { type:
  "json_schema", schema } }` → JSON garanti (lignes de facture, champs d'un document).
- **Prompt caching** : le **canvas + les instructions** (préfixe stable) sont marqués
  `cache_control: { type: "ephemeral" }` ; les variables (volatiles) viennent **après** →
  une génération en série (10 contrats du même modèle) ne paie le modèle qu'une fois.

### Choix du modèle par tâche (recommandation ; le défaut reste Opus 4.8)
| Tâche | Modèle conseillé | Pourquoi |
|-------|------------------|----------|
| Contrat / rapport / rédaction à enjeu | `claude-opus-4-8` | qualité, raisonnement, enjeu juridique |
| Assistant conversationnel / résumé | `claude-sonnet-4-6` | bon équilibre vitesse/coût |
| Extraction / classification en volume | `claude-haiku-4-5` | rapide et économique |

---

## Génération depuis un exemplaire (la demande clé)

Flux « j'ai un contrat existant, fais-en un gabarit puis génère les suivants » :
```
1. POST /ai/modeles/depuis-exemplaire { fichierKey | texte }
   → Claude analyse l'exemplaire → propose { contenuModele (avec {{variables}}),
     variables[], instructionsIa } → l'admin relit/ajuste → ModeleDocument enregistré.
2. POST /ai/generer { modeleId, entityType:'EMPLOYE', entityId }
   → le backend résout les variables depuis la fiche (scopé permissions),
     assemble le prompt (canvas caché + variables), streame le brouillon,
     enregistre une GenerationDocument (BROUILLON).
3. Humain relit → POST /ai/generations/:id/valider → PDF + classement en GED (Document),
     lien vers l'employé. Événement ai.document.valide ([[evenements-notifications]] / [[audit]]).
```

---

## Rapport mensuel (capacité 3)

```
POST /ai/rapports/generer { type:'mensuel', periode:'2026-05', scope:{departementId?} }
→ le backend AGRÈGE les données réelles (rapports journaliers [[espace-collaborateur]],
  présences, finance [[finance-pilotage]], support…) — scopées permissions —
→ Claude rédige une SYNTHÈSE narrative structurée (faits saillants, chiffres, alertes)
→ GenerationDocument (type RAPPORT, BROUILLON) → validation → GED.
```
> L'IA **ne invente pas les chiffres** : ils viennent des agrégats backend ; l'IA **rédige**
> autour. (Anti-hallucination : on fournit les données, on demande une mise en forme/analyse.)

---

## Q&A sur la GED (capacité 5)
- **V1** : on récupère les documents pertinents via [[recherche]] (mots-clés, scopé permissions)
  → on les passe à Claude en **documents avec citations** (`citations: { enabled: true }`) →
  réponse sourcée (« d'après le contrat X… »).
- **V2** : recherche **sémantique** (embeddings / vecteurs) en capitalisant `ged-intelligent`
  (Elasticsearch existant) ou `pgvector` → meilleur rappel sur de gros corpus.

---

## Garde-fous (non négociables)
1. **Brouillon + validation humaine** : toute génération est un `BROUILLON`. Rien n'est publié/
   signé automatiquement. Les contrats portent une mention « projet — à vérifier ».
2. **Isolation tenant** : le contexte envoyé à Claude est **strictement RLS-scopé**. Jamais de
   données d'un autre tenant dans un prompt. Les données d'un employé ne partent que si
   l'utilisateur a la permission de les voir.
3. **Confidentialité** : paie/données sensibles uniquement si l'utilisateur a la perm
   ([[finance-paie]] est `me`-only pour le salarié). L'assistant respecte le RBAC du demandeur.
4. **Prompt injection** : les documents importés (exemplaires, factures) sont **non fiables** →
   traités comme **données**, jamais comme instructions. Consignes système robustes.
5. **Traçabilité** : chaque appel IA → `ai.document.generate` / `ai.assistant.query` dans le
   [[audit]] (modèle, tokens, coût). On sait qui a généré quoi.
6. **Coût** : prompt caching + tiering de modèle + **quota par tenant** (garde-fou anti-emballement).
7. **Secret** : `ANTHROPIC_API_KEY` côté backend uniquement (jamais exposée au front).

---

## Endpoints (préfixe `/api/v1`)
| Méthode | Route | Permission |
|---------|-------|-----------|
| GET/POST/PATCH/DELETE | `/ai/modeles` | `ai:manage` |
| POST | `/ai/modeles/depuis-exemplaire` | `ai:manage` → propose un `ModeleDocument` |
| POST | `/ai/generer` (stream) | `ai:use` `{modeleId, entityType?, entityId?, variables?}` |
| POST | `/ai/rapports/generer` (stream) | `ai:use` |
| POST | `/ai/extraire` | `ai:use` `{fichierKey|documentId, schema}` → JSON structuré |
| POST | `/ai/assistant` (stream) | `ai:use` `{message, conversationId?, contexte?}` |
| GET  | `/ai/generations` (`?type&statut&mine`) | `ai:use` |
| POST | `/ai/generations/:id/valider` · `/rejeter` | `ai:use` → classe en GED |

---

## RBAC
- **`ai:use`** — utiliser l'assistant, générer, extraire (large, mais **l'accès aux données
  reste gouverné par les permissions métier** du demandeur — l'IA n'élargit aucun droit).
- **`ai:manage`** — gérer les modèles/canvas (RH/admin).
- Admin `*`. La génération de contrats peut être restreinte à un rôle dédié si besoin.

---

## Côté front (ce que je brancherai)
- `features/assistant` : **panneau assistant** (chat streaming, accessible via `Cmd+K` →
  « Demander à l'assistant »), **galerie de modèles**, écran **« Générer un document »**
  (choisir modèle + cible → aperçu streamé → éditer → valider), **import d'exemplaire**.
  Flag `VITE_MOCK_AI`.
- Bouton **« Générer avec l'IA »** contextuel dans les fiches : contrat depuis une fiche RH,
  attestation, relance depuis une facture, rapport mensuel depuis le dashboard.
- Brouillons IA listés avec badge « à valider » ; rendu Markdown + export PDF à la validation.
- Le streaming réutilise le pattern SSE ; mention systématique « contenu généré, à vérifier ».

---

## Récap pour le co-dev backend
| # | Changement | Type |
|---|-----------|------|
| 1 | Module `ai` (NestJS) + `@anthropic-ai/sdk`, `ANTHROPIC_API_KEY` env | infra |
| 2 | Modèles `ModeleDocument`, `GenerationDocument` + TENANT_MODELS + RLS | additif |
| 3 | Génération streamée (Opus 4.8, adaptive thinking, prompt caching du canvas) | IA |
| 4 | `depuis-exemplaire` (analyse → gabarit), `extraire` (structured outputs), `rapports/generer` (agrégats→narratif) | IA |
| 5 | Q&A GED via [[recherche]] + citations (V1) ; sémantique/`ged-intelligent` (V2) | IA |
| 6 | Garde-fous : brouillon+validation, isolation tenant, RBAC du demandeur, audit, quota | sécurité |
| 7 | Validation → PDF + classement GED (`Document`) + événement | intégration |
| 8 | Tiering modèle (Opus/Sonnet/Haiku selon tâche) ; conversations persistées (option) | optimisation |

> **Dépend de** GED/Documents (classement), [[recherche]] (Q&A), [[audit]] (traçabilité),
> [[finance-core]]/RH (contexte). **Dernière couche** : avec elle, la vision socle→moteurs→
> modules→expérience→intelligence est complète.
