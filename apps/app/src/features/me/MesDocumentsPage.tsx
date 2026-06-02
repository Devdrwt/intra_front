import { Download, FileText, FolderArchive } from 'lucide-react';
import { Badge, Card, CardTitle, EmptyState, Skeleton } from '@drwindesk/ui';
import { TYPE_DOCUMENT_LABEL } from '@/features/documents/types';
import { useMyDocuments } from './hooks';
import { MeNotLinked } from './MeNotLinked';

const fmt = (iso: string) => new Date(iso).toLocaleDateString('fr-FR');

export function MesDocumentsPage() {
  const { data: documents, isLoading, error } = useMyDocuments();

  if (error) return <MeNotLinked />;

  const list = documents ?? [];

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-2xl font-bold tracking-tight text-ink">Mes documents</h2>
        <p className="text-ink-muted">Bulletins, contrats et attestations qui vous sont rattachés.</p>
      </header>

      <Card className="p-0">
        <div className="p-5 pb-0">
          <CardTitle>Documents</CardTitle>
        </div>
        {isLoading ? (
          <div className="space-y-3 p-5">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-5 w-full" />
            ))}
          </div>
        ) : list.length === 0 ? (
          <EmptyState
            icon={<FolderArchive size={20} />}
            title="Aucun document"
            description="Les documents partagés par les RH apparaîtront ici."
            className="py-10"
          />
        ) : (
          <ul className="mt-3 divide-y divide-surface-border">
            {list.map((d) => (
              <li key={d.id} className="flex items-center gap-3 px-5 py-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface-muted text-ink-muted">
                  <FileText size={16} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-ink">{d.nom}</p>
                  <p className="text-xs text-ink-subtle">
                    {fmt(d.dateAjout)}
                    {d.tailleKo > 0 && ` · ${d.tailleKo} Ko`}
                  </p>
                </div>
                <Badge tone="neutral">{TYPE_DOCUMENT_LABEL[d.type]}</Badge>
                {d.url && (
                  <a
                    href={d.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-ink-muted transition-colors hover:bg-surface-muted hover:text-brand-600"
                    title="Télécharger"
                  >
                    <Download size={16} />
                  </a>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
