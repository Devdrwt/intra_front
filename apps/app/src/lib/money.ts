/** Formatage monétaire XOF (Franc CFA) — entier, séparateur de milliers, suffixe « F ». */
export function fcfa(montant: number | string | undefined | null): string {
  const n = typeof montant === 'string' ? Number(montant) : montant;
  if (n == null || Number.isNaN(n)) return '—';
  return `${Math.round(n).toLocaleString('fr-FR')} F`;
}

/** Idem mais en milliers compacts pour les tableaux de bord (ex. « 12,4 M F »). */
export function fcfaCompact(montant: number | undefined | null): string {
  const n = montant;
  if (n == null || Number.isNaN(n)) return '—';
  const abs = Math.abs(n);
  if (abs >= 1_000_000) return `${(n / 1_000_000).toLocaleString('fr-FR', { maximumFractionDigits: 1 })} M F`;
  if (abs >= 1_000) return `${(n / 1_000).toLocaleString('fr-FR', { maximumFractionDigits: 0 })} k F`;
  return `${Math.round(n).toLocaleString('fr-FR')} F`;
}
