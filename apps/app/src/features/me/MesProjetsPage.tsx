import { useState } from 'react';
import { Download, ExternalLink, FolderKanban, Paperclip, Users } from 'lucide-react';
import { Badge, Button, Card, EmptyState, Modal, Skeleton, cn } from '@drwindesk/ui';
import { triggerDownload, humanSize } from '@/lib/download';
import { toast } from '@/lib/toast';
import {
  STATUT_PROJET_LABEL,
  STATUT_PROJET_TONE,
  type Project,
  type ProjectPerson,
} from '@/features/projects/types';
import { useMyProjects } from './hooks';
import { meService } from './service';
import { MeNotLinked } from './MeNotLinked';

const fmt = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString('fr-FR') : '—');
const personName = (p: ProjectPerson) => `${p.prenom} ${p.nom}`.trim();

export function MesProjetsPage() {
  const { data: projects, isLoading, error } = useMyProjects();
  const [active, setActive] = useState<Project | null>(null);

  if (error) return <MeNotLinked />;
  const list = projects ?? [];

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-2xl font-bold tracking-tight text-ink">Mes projets</h2>
        <p className="text-ink-muted">Les projets sur lesquels vous êtes responsable ou membre.</p>
      </header>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-40 w-full rounded-2xl" />
          ))}
        </div>
      ) : list.length === 0 ? (
        <Card className="p-0">
          <EmptyState
            icon={<FolderKanban size={22} />}
            title="Aucun projet"
            description="Vous n’êtes encore affecté à aucun projet. Un responsable peut vous ajouter."
            className="py-14"
          />
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((p) => (
            <button key={p.id} onClick={() => setActive(p)} className="text-left">
              <Card className="h-full transition-colors hover:border-brand-300">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-ink">{p.nom}</h3>
                  <Badge tone={STATUT_PROJET_TONE[p.statut]} dot>
                    {STATUT_PROJET_LABEL[p.statut]}
                  </Badge>
                </div>
                {p.client && <p className="text-xs text-ink-subtle">{p.client}</p>}
                {p.description && (
                  <p className="mt-2 line-clamp-2 text-sm text-ink-muted">{p.description}</p>
                )}
                <div className="mt-3">
                  <div className="h-1.5 w-full rounded-full bg-surface-muted">
                    <div
                      className="h-1.5 rounded-full bg-brand-600"
                      style={{ width: `${Math.min(100, Math.max(0, p.progression))}%` }}
                    />
                  </div>
                  <p className="mt-1 text-xs text-ink-subtle">
                    {p.progression}% · échéance {fmt(p.dateFin)}
                  </p>
                </div>
              </Card>
            </button>
          ))}
        </div>
      )}

      {active && <ProjectDetail project={active} onClose={() => setActive(null)} />}
    </div>
  );
}

function ProjectDetail({ project, onClose }: { project: Project; onClose: () => void }) {
  const [dlId, setDlId] = useState<string | null>(null);

  const download = async (docId: string, filename: string) => {
    setDlId(docId);
    try {
      const blob = await meService.downloadProjectDoc(project.id, docId);
      triggerDownload(blob, filename);
    } catch {
      toast.error('Téléchargement impossible.');
    } finally {
      setDlId(null);
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      size="lg"
      title={
        <span className="flex items-center gap-2">
          {project.nom}
          <Badge tone={STATUT_PROJET_TONE[project.statut]} dot>
            {STATUT_PROJET_LABEL[project.statut]}
          </Badge>
        </span>
      }
      description={project.client ?? undefined}
    >
        <div className="space-y-5">
          {project.description && (
            <p className="whitespace-pre-wrap text-sm text-ink">{project.description}</p>
          )}

          <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
            <Info label="Début" value={fmt(project.dateDebut)} />
            <Info label="Échéance" value={fmt(project.dateFin)} />
            <Info label="Avancement" value={`${project.progression}%`} />
            <Info label="Responsable" value={project.responsable ? personName(project.responsable) : '—'} />
          </div>

          {project.membres.length > 0 && (
            <div>
              <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-ink-subtle">
                <Users size={13} /> Équipe
              </p>
              <div className="flex flex-wrap gap-1.5">
                {project.membres.map((m) => (
                  <Badge key={m.id} tone="neutral">
                    {personName(m)}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {project.livrableUrl && (
            <a
              href={project.livrableUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl border border-surface-border px-3 py-2 text-sm font-medium text-brand-600 hover:bg-brand-soft"
            >
              <ExternalLink size={15} /> Voir le livrable
            </a>
          )}

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-subtle">
              Documents
            </p>
            {project.documents.length === 0 ? (
              <p className="text-sm text-ink-subtle">Aucun document.</p>
            ) : (
              <ul className="divide-y divide-surface-border rounded-xl border border-surface-border">
                {project.documents.map((d) => (
                  <li key={d.id} className="flex items-center justify-between gap-3 px-3 py-2.5">
                    <span className="flex min-w-0 items-center gap-2 text-sm text-ink">
                      <Paperclip size={14} className="shrink-0 text-ink-subtle" />
                      <span className="truncate">{d.nom}</span>
                      {d.size ? (
                        <span className="shrink-0 text-xs text-ink-subtle">· {humanSize(d.size)}</span>
                      ) : null}
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={dlId === d.id}
                      onClick={() => void download(d.id, d.nom)}
                    >
                      <Download size={15} />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
    </Modal>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className={cn('min-w-0')}>
      <p className="text-xs uppercase tracking-wide text-ink-subtle">{label}</p>
      <p className="truncate font-medium text-ink">{value}</p>
    </div>
  );
}
