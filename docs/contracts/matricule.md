# Contrat backend — Retrait du matricule de l'UI (optionnel + auto-généré)

> Hand-off front → backend. Le champ **matricule** a été retiré de l'interface
> (formulaires, listes, fiche, GED). Côté backend il reste aujourd'hui **obligatoire et
> unique** (`@@unique([tenantId, matricule])`), donc le front l'**auto-génère** en attendant
> ce changement. Objectif : ne plus l'imposer à l'utilisateur.

## État actuel (backend)

```prisma
model Employe {
  // …
  matricule String
  @@unique([tenantId, matricule])
}
```
```ts
// dto/employe.dto.ts — CreateEmployeDto
@IsString() @IsNotEmpty() @MaxLength(50)
matricule!: string;
```

## Option A — Optionnel + auto-généré (RECOMMANDÉ)

On **garde** un identifiant lisible et unique (utile pour la paie / les exports RH),
mais l'utilisateur ne le saisit plus : le serveur le génère si absent.

**1. DTO** — rendre optionnel :
```ts
@IsOptional() @IsString() @MaxLength(50)
matricule?: string;
```

**2. Service `create()`** — générer si non fourni, par tenant, avec garde d'unicité :
```ts
async create(dto: CreateEmployeDto): Promise<EmployeDto> {
  const matricule = dto.matricule?.trim() || (await this.nextMatricule());
  // … create avec { ...dto, matricule }
}

/** Génère le prochain matricule séquentiel du tenant (EMP-0001…), avec repli anti-collision. */
private async nextMatricule(): Promise<string> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const count = await this.prisma.db.employe.count();      // tenant courant (extension)
    const candidate = `EMP-${String(count + 1 + attempt).padStart(4, '0')}`;
    const exists = await this.prisma.db.employe.findFirst({
      where: { matricule: candidate }, select: { id: true },
    });
    if (!exists) return candidate;
  }
  return `EMP-${Date.now().toString(36).toUpperCase()}`; // repli garanti unique
}
```
> Le `@@unique([tenantId, matricule])` est conservé. En cas de course (P2002), réessayer.

**Migration** : aucune (la colonne reste). Les employés existants gardent leur matricule.

## Option B — Suppression complète du modèle

Si vous voulez vraiment retirer la colonne :
1. Migration Prisma : retirer `matricule` + le `@@unique([tenantId, matricule])` du modèle `Employe`.
2. Retirer `matricule` de `CreateEmployeDto`, `UpdateEmployeDto`, `EmployeDto` (`employe.entity.ts`) et du `seed.ts`.
3. ⚠️ On perd l'identifiant métier stable ; il ne reste que l'`id` (UUID). Vérifier qu'aucun
   export / rapprochement paie n'en dépend.

## Recommandation

**Option A.** On conserve un identifiant unique exploitable (RH/paie) tout en le rendant
invisible et automatique pour l'utilisateur — c'est le meilleur compromis.

## Côté front (ce que je ferai dès le backend changé)

- Option A : **arrêter d'auto-générer** côté front (retirer la ligne
  `matricule: form.matricule || MAT-…` dans `EmployeFormPage`) → on n'envoie plus rien,
  le backend s'en charge.
- Option B : retirer le champ `matricule` du type `Employe` front et de tout payload.

Dans les deux cas, plus aucune trace du matricule dans l'UI (déjà fait).
