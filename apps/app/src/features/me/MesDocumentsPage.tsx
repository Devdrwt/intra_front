import { useState } from 'react';
import { Download, FileText, FolderArchive } from 'lucide-react';
import { Badge, Card, EmptyState, PageHeader, Skeleton, cn } from '@drwindesk/ui';
import { TYPE_DOCUMENT_LABEL, type TypeDocument } from '@/features/documents/types';
import { Stagger, StaggerItem } from '@/components/motion';
import { useMyDocuments } from './hooks';
import { MeNotLinked } from './MeNotLinked';

const fmt = (iso: string) => new Date(iso).toLocaleDateString('fr-FR');

const TYPE_GRAD: Record<TypeDocument, string> = {
  CONTRAT: 'from-indigo-400 to-violet-600',
  BULLETIN: 'from-emerald-400 to-teal-600',
  ATTESTATION: 'from-amber-400 to-orange-500',
  NDA: 'from-rose-400 to-pink-600',
  AUTRE: 'from-slate-400 to-slate-600',
};

export function MesDocumentsPage() {
  const { data: documents, isLoading, error } = useMyDocuments();
  const [type, setType] = useState<TypeDocument | 'ALL'>('ALL');

  if (error) return <MeNotLinked />;

  const list = documents ?? [];
  const presentTypes = [...new Set(list.map((d) => d.type))];
  const filtered = list.filter((d) => type === 'ALL' || d.type === type);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Mes documents"
        subtitle="Bulletins, contrats et attestations qui vous sont rattachés."
      />

      {presentTypes.length > 1 && (
        <div className="flex flex-wrap gap-1 rounded-xl bg-surface-muted p-1">
          {(['ALL', ...presentTypes] as (TypeDocument | 'ALL')[]).map((t) => (
            <button
              key={t}
              onClick={() => setType(t)}
              className={cn(
                'rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
                type === t ? 'bg-surface text-ink shadow-soft' : 'text-ink-muted hover:text-ink',
              )}
            >
              {t === 'ALL' ? 'Tout' : TYPE_DOCUMENT_LABEL[t]}
            </button>
          ))}
        </div>
      )}

      <Card className="p-0">
        {isLoading ? (
          <div className="space-y-3 p-5">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-5 w-full" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<FolderArchive size={20} />}
            title="Aucun document"
            description="Les documents partagés par les RH apparaîtront ici."
            className="py-10"
          />
        ) : (
          <Stagger className="divide-y divide-surface-border">
            {filtered.map((d) => (
              <StaggerItem key={d.id} className="flex items-center gap-3 px-5 py-3">
                <span className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br text-white', TYPE_GRAD[d.type])}>
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
              </StaggerItem>
            ))}
          </Stagger>
        )}
      </Card>
    </div>
  );
}
