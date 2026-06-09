# Contrat backend — **Demandes d'absence** (permissions / repos / congés)

> Hand-off front → backend. **Additif** : la base existe déjà (back `me/conges`, module
> `presences` admin, front `features/presences` + `features/me`). Ce contrat **complète** deux
> manques pour une vraie gestion : **(1)** les spécificités **permission** (absence courte en
> heures), **(2)** le branchement sur le **moteur d'approbations** ([[approbations]]) en
> remplacement du `statut` plat actuel.
>
> ⚠️ **Ne rien réécrire** : `DemandeConge` (3 catégories `PERMISSION | REPOS | CONGE`),
> `GET/POST/DELETE /me/conges`, la vue admin `presences` (colonne + filtre catégorie, commit
> `8f7d582`) **existent et restent**. On ajoute des champs et on délègue la validation.

---

## Rappel de l'existant (à conserver)

- Entité `DemandeConge { id, employeId, categorie, type, dateDebut, dateFin, motif?, statut, demandeLe }`.
- `CategorieDemande = PERMISSION | REPOS | CONGE` ; `StatutConge = EN_ATTENTE | APPROUVE | REFUSE`.
- Self-service : `GET /me/conges`, `POST /me/conges {categorie,type?,dateDebut,dateFin,motif?}`,
  `DELETE /me/conges/:id` (annule si `EN_ATTENTE`).
- Admin/RH (`presences`) : liste filtrable par **catégorie** + **statut**.

---

## (1) Spécificités **permission** — champs additifs

Une **permission** est une absence **courte** (souvent une fraction de journée : rendez-vous
médical, démarche administrative, événement familial). Le modèle actuel ne raisonne qu'en
**jours** (`dateDebut`/`dateFin`). On ajoute des champs **optionnels** (rétro-compatibles) :

```prisma
model DemandeConge {           // ⚠️ additif — ne pas recréer le modèle
  // … champs existants …
  // Permission/repos en demi-journée ou en heures : optionnels, ignorés pour les congés.
  heureDebut   String?   @map("heure_debut")  // "HH:mm", si absence intra-journée
  heureFin     String?   @map("heure_fin")    // "HH:mm"
  // Calcul de durée : jours pour CONGE ; heures pour PERMISSION si heureDebut/Fin fournis.
}
```

Règles :
- **PERMISSION** : `dateDebut == dateFin` autorisé + `heureDebut/heureFin` → durée en heures.
  Si `heureDebut/Fin` absents, c'est une permission « journée ».
- **CONGE** : comportement actuel inchangé (jours calendaires, `heure*` ignorés).
- **REPOS** : comme permission (journée ou heures).
- Validation : `heureFin > heureDebut` si fournis ; sinon 422.

> **Type métier par catégorie** : `type` (`TypeConge = ANNUEL|MALADIE|SANS_SOLDE|EXCEPTIONNEL`)
> n'a de sens que pour `CONGE`. Pour `PERMISSION`/`REPOS`, `type` est optionnel/ignoré
> (le front l'envoie déjà conditionnellement). Garder ce comportement.

---

## (2) Branchement au **moteur d'approbations** (le vrai apport)

Aujourd'hui `statut` est posé « à la main » (RH bascule EN_ATTENTE→APPROUVE/REFUSE). On le
remplace par un **circuit piloté** ([[approbations]]), **sans changer l'API self-service**.

### À la soumission (`POST /me/conges`)
Le backend, après avoir créé la `DemandeConge` (toujours `statut = EN_ATTENTE`), **amorce le
circuit** :
```ts
await approvals.start({
  entityType: 'ABSENCE',
  entityId: demande.id,
  requesterId: currentUserId,
  label: `${CATEGORIE_LABEL[demande.categorie]} — ${employe.prenom} ${employe.nom}`,
  payload: {
    categorie: demande.categorie,        // PERMISSION | REPOS | CONGE → sélectionne le flow
    departementId: employe.departementId,
    jours: nbJours(demande.dateDebut, demande.dateFin),
    heures: dureeHeures(demande),        // si permission intra-journée
  },
});
```
Le moteur choisit le flow `ABSENCE` dont `entryCondition` matche la catégorie (cf. seed
[[approbations]]) : **PERMISSION → 1 étape (manager)**, **CONGE → 2 étapes (manager + RH)**.

### Au verdict (`approval.completed`)
Le module `presences`/`me` **s'abonne** et reflète le résultat sur la demande :
```ts
@OnEvent('approval.completed')
async onAbsence(e) {
  if (e.entityType !== 'ABSENCE') return;
  await this.setStatut(e.entityId, e.status === 'APPROVED' ? 'APPROUVE' : 'REFUSE');
}
```
→ `StatutConge` reste l'**état lisible** côté collaborateur ; l'**avancement détaillé**
(étapes, qui a validé) vit dans l'`ApprovalRequest` et s'affiche via `<ApprovalTimeline>`.

### Annulation
`DELETE /me/conges/:id` (déjà existant, si `EN_ATTENTE`) doit aussi **annuler la request**
(`approvals.cancel(requestId)`). Lien : retrouver la request par `(entityType=ABSENCE, entityId)`.

---

## Validation côté manager/RH — via l'**inbox unifiée**

**On supprime l'idée d'un bouton « approuver » ad hoc** dans la vue `presences`. La validation
passe par **« Mes validations »** (`GET /approvals/inbox`, `POST /approvals/:id/decide`,
cf. [[approbations]]) — le manager y voit permissions + congés + (plus tard) frais/achats au
même endroit. La vue admin `presences` **reste** en **consultation/reporting** (liste filtrable,
statistiques d'absences), pas en moteur de décision.

> Migration douce : tant que le moteur n'est pas livré, garder le basculement manuel actuel
> derrière le flag. Une fois `approbations` en place, `POST /me/conges` amorce le circuit et la
> bascule manuelle est retirée.

---

## RBAC

- Self-service : `me:read` / `me:write` (inchangé).
- Décision : `approval:act` (manager/RH) — cf. [[approbations]]. **Plus** de permission
  `presences:manage` requise pour valider (c'est le moteur qui autorise selon le step courant).
- Consultation admin des absences : permission de lecture existante du module `presences`.

---

## Seed

Les **3 flows d'absence** sont seedés par le moteur ([[approbations]]) :
Permission (1 étape manager), Repos (1 étape manager), Congé (2 étapes manager + RH).
Aucun seed supplémentaire ici.

---

## Côté front (ce que je brancherai)

- `features/presences` / `features/me` : **inchangés** pour la création (le formulaire envoie
  déjà `categorie`). Ajout des champs **`heureDebut`/`heureFin`** au `CongeFormPage` **quand
  `categorie == PERMISSION` ou `REPOS`** (sélecteur d'heures ; masqué pour `CONGE`).
- Affichage durée : « 3 j » pour un congé, « 2 h (14:00–16:00) » pour une permission.
- **`<ApprovalTimeline>`** (composant du moteur) intégré dans le détail d'une demande →
  étapes done/current/pending.
- La validation se fait dans **« Mes validations »** (feature `approvals`), pas dans présences.
- Flags : `VITE_MOCK_PRESENCES` (existant) + `VITE_MOCK_APPROVALS` (moteur).

---

## Récap des changements (pour le co-dev backend)

| # | Changement | Type |
|---|-----------|------|
| 1 | `DemandeConge.heureDebut/heureFin` (optionnels) | additif schema |
| 2 | `POST /me/conges` amorce `approvals.start('ABSENCE', …)` | additif service |
| 3 | Abonnement `approval.completed` → `setStatut` | additif service |
| 4 | `DELETE /me/conges/:id` annule aussi la request | additif service |
| 5 | Validation déplacée vers l'inbox du moteur ; `presences` admin = lecture | comportement |
| 6 | Durée en heures pour permission (`heureFin>heureDebut` sinon 422) | validation |

> Dépend de [[approbations]] (moteur). Tant qu'il n'est pas livré : seuls (1) et (6) peuvent
> partir ; le reste attend le moteur (garder la bascule manuelle derrière le flag).
