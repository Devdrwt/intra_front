import { useState } from 'react';
import { Download, FileText, Library } from 'lucide-react';
import { Badge, Button, Card, EmptyState, Input, PageHeader, Select, SkeletonRows } from '@drwindesk/ui';
import { apiErrorMessage } from '@/lib/api';
import { humanSize } from '@/lib/download';
import { toast } from '@/lib/toast';
import { useDocs } from '@/features/documentation/hooks';
import { documentationService } from '@/features/documentation/service';
import { DOC_CATEGORIES, type DocItem } from '@/features/documentation/types';

/**
 * Bibliothèque — vue lecture des documents publiés de la base documentaire (/docs).
 * Réutilise le module Documentation (versions, ACL, statut gérés côté GED).
 */
const fmt = (iso: string) => new Date(iso).toLocaleDateString('fr-FR');

export function BibliothequePage() {
  const [search, setSearch] = useState('');
  const [cat, setCat] = useState('');
  const { data, isLoading } = useDocs(cat, search);
  const [dlId, setDlId] = useState<string | null>(null);

  const download = async (d: DocItem) => {
    setDlId(d.id);
    try {
      await documentationService.download(d.id, d.titre);
    } catch (e) {
      toast.error(apiErrorMessage(e, 'Téléchargement impossible.'));
    } finally {
      setDlId(null);
    }
  };

  const list = data ?? [];

  return (
    <div className="space-y-5">
      <PageHeader title="Bibliothèque" subtitle="Documents publiés de l'entreprise — politiques, modèles, procédures, livrables." />

      <Card className="flex flex-wrap items-end gap-3">
        <Input id="q" label="Recherche" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Titre, description…" className="min-w-[200px] flex-1" />
        <Select
          id="cat"
          label="Catégorie"
          value={cat}
          onChange={(e) => setCat(e.target.value)}
          options={[{ value: '', label: 'Toutes' }, ...DOC_CATEGORIES.map((c) => ({ value: c, label: c }))]}
        />
      </Card>

      <Card className="overflow-hidden p-0">
        {isLoading ? (
          <SkeletonRows rows={5} cols={3} />
        ) : list.length === 0 ? (
          <EmptyState icon={<Library size={20} />} title="Aucun document" description="Aucun document publié ne correspond à ces filtres." />
        ) : (
          <ul className="divide-y divide-surface-border">
            {list.map((d, i) => (
              <li key={d.id} className="flex items-center justify-between gap-3 px-5 py-3 animate-row" style={{ animationDelay: `${Math.min(i, 12) * 35}ms` }}>
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface-muted text-ink-muted"><FileText size={18} /></span>
                  <div className="min-w-0">
                    <div className="truncate font-medium text-ink">{d.titre}</div>
                    <div className="text-xs text-ink-subtle">
                      {d.taille > 0 ? `${humanSize(d.taille)} · ` : ''}{fmt(d.createdAt)}{d.version > 1 ? ` · v${d.version}` : ''}
                    </div>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Badge tone="neutral">{d.categorie}</Badge>
                  <Button size="sm" variant="ghost" onClick={() => void download(d)} loading={dlId === d.id} title="Télécharger">
                    <Download size={16} />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
