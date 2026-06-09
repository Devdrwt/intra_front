import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { USE_MOCKS } from '@/lib/config';
import { Download, FileText, FolderArchive, Library } from 'lucide-react';
import { Badge, Card, EmptyState, Input, Select, SkeletonRows } from '@drwindesk/ui';

/**
 * Bibliothèque centrale — vue transverse de TOUS les documents (GED + archives).
 * Réel : GET /documents/bibliotheque ?q&categorie. Mock sinon.
 */
interface DocItem {
  id: string;
  nom: string;
  categorie: string;
  source: string; // "RH", "Finance", "Projet"…
  taille: string;
  date: string;
  url?: string;
}

const delay = <T,>(value: T, ms = 150): Promise<T> => new Promise((r) => setTimeout(() => r(value), ms));

const MOCK: DocItem[] = [
  { id: 'd1', nom: 'Règlement intérieur 2026', categorie: 'Politiques', source: 'RH', taille: '320 Ko', date: '2026-01-10' },
  { id: 'd2', nom: 'Modèle de contrat CDI', categorie: 'Modèles', source: 'RH', taille: '180 Ko', date: '2025-11-02' },
  { id: 'd3', nom: 'Procédure achats', categorie: 'Procédures', source: 'Finance', taille: '95 Ko', date: '2026-03-15' },
  { id: 'd4', nom: 'Charte graphique', categorie: 'Marque', source: 'Studio', taille: '4,2 Mo', date: '2025-09-20' },
  { id: 'd5', nom: 'Cahier des charges — Refonte SI', categorie: 'Projets', source: 'Projet', taille: '1,1 Mo', date: '2026-05-01' },
];

function fetchDocs(): Promise<DocItem[]> {
  if (USE_MOCKS.documents) return delay(MOCK);
  return api.get<DocItem[]>('/documents/bibliotheque').then((r) => r.data);
}

export function BibliothequePage() {
  const { data, isLoading } = useQuery({ queryKey: ['bibliotheque'], queryFn: fetchDocs });
  const [search, setSearch] = useState('');
  const [categorie, setCategorie] = useState('');

  const categories = useMemo(() => [...new Set((data ?? []).map((d) => d.categorie))], [data]);
  const filtered = (data ?? []).filter(
    (d) =>
      (!categorie || d.categorie === categorie) &&
      (!search || `${d.nom} ${d.source}`.toLowerCase().includes(search.toLowerCase())),
  );

  return (
    <div className="space-y-5">
      <header>
        <h2 className="text-2xl font-bold tracking-tight text-ink">Bibliothèque</h2>
        <p className="text-ink-muted">Tous les documents de l'entreprise — politiques, modèles, procédures, livrables.</p>
      </header>

      <Card className="flex flex-wrap items-end gap-3">
        <Input id="q" label="Recherche" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Nom, service…" className="min-w-[200px] flex-1" />
        <Select id="cat" label="Catégorie" value={categorie} onChange={(e) => setCategorie(e.target.value)}
          options={[{ value: '', label: 'Toutes' }, ...categories.map((c) => ({ value: c, label: c }))]} />
      </Card>

      <Card className="overflow-hidden p-0">
        {isLoading ? (
          <SkeletonRows rows={5} cols={3} />
        ) : filtered.length === 0 ? (
          <EmptyState icon={<Library size={20} />} title="Aucun document" description="Aucun document ne correspond à ces filtres." />
        ) : (
          <ul className="divide-y divide-surface-border">
            {filtered.map((d) => (
              <li key={d.id} className="flex items-center justify-between gap-3 px-5 py-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface-muted text-ink-muted"><FileText size={18} /></span>
                  <div>
                    <div className="font-medium text-ink">{d.nom}</div>
                    <div className="text-xs text-ink-subtle">{d.source} · {d.taille} · {d.date}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge tone="neutral">{d.categorie}</Badge>
                  <a href={d.url ?? '#'} className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-subtle hover:bg-surface-muted hover:text-ink" title="Télécharger">
                    {d.url ? <Download size={16} /> : <FolderArchive size={16} className="opacity-40" />}
                  </a>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
