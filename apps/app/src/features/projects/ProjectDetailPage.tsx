import { useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  CalendarClock,
  Download,
  ExternalLink,
  FileText,
  Paperclip,
  Pencil,
  Trash2,
} from 'lucide-react';
import { Avatar, Badge, Button, Card, CardTitle, Spinner } from '@drwindesk/ui';
import { hasPermission, useAuth } from '@/auth/AuthContext';
import { apiErrorMessage } from '@/lib/api';
import { triggerDownload, humanSize } from '@/lib/download';
import { toast } from '@/lib/toast';
import {
  useDeleteProject,
  useProject,
  useRemoveProjectDocument,
  useUploadProjectDocument,
} from './hooks';
import { projectsService } from './service';
import {
  STATUT_PROJET_LABEL,
  STATUT_PROJET_TONE,
  echeanceInfo,
  type ProjectDocument,
} from './types';

const fmt = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString('fr-FR') : '—');

export function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const canManage = hasPermission(user, 'project:manage');

  const { data: p, isLoading } = useProject(id);
  const del = useDeleteProject();
  const upload = useUploadProjectDocument(id ?? '');
  const removeDoc = useRemoveProjectDocument(id ?? '');
  const fileRef = useRef<HTMLInputElement>(null);
  const [dl, setDl] = useState<string | null>(null);

  if (isLoading || !p) {
    return (
      <div className="flex justify-center py-16">
        <Spinner />
      </div>
    );
  }

  const ech = echeanceInfo(p.dateFin, p.statut);

  const onPickFile = async (file: File | null) => {
    if (!file) return;
    try {
      await upload.mutateAsync(file);
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Téléversement impossible.'));
    } finally {
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const download = async (doc: ProjectDocument) => {
    setDl(doc.id);
    try {
      const blob = await projectsService.downloadDocument(p.id, doc.id);
      triggerDownload(blob, doc.nom);
    } catch {
      toast.error('Téléchargement impossible.');
    } finally {
      setDl(null);
    }
  };

  const remove = () => {
    if (window.confirm(`Supprimer le projet « ${p.nom} » et ses fichiers ?`)) {
      del.mutate(p.id, { onSuccess: () => navigate('/projets') });
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Link to="/projets" className="inline-flex items-center gap-1 text-sm text-brand-600 hover:underline">
        <ArrowLeft size={16} /> Tous les projets
      </Link>

      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-2xl font-bold tracking-tight text-ink">{p.nom}</h2>
            <Badge tone={STATUT_PROJET_TONE[p.statut]} dot>
              {STATUT_PROJET_LABEL[p.statut]}
            </Badge>
          </div>
          {p.client && <p className="mt-1 text-sm text-ink-muted">Client : {p.client}</p>}
        </div>
        {canManage && (
          <div className="flex gap-2">
            <Link to={`/projets/${p.id}/editer`}>
              <Button variant="secondary" size="sm">
                <Pencil size={15} /> Modifier
              </Button>
            </Link>
            <Button variant="ghost" size="sm" onClick={remove} disabled={del.isPending}>
              <Trash2 size={15} /> Supprimer
            </Button>
          </div>
        )}
      </header>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {p.description && (
            <Card>
              <CardTitle>Description</CardTitle>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-ink">{p.description}</p>
            </Card>
          )}

          {/* Livrable */}
          {p.statut === 'LIVRE' && p.livrableUrl && (
            <Card className="flex items-center justify-between gap-4 border-success/30 bg-success-soft/40">
              <div>
                <p className="font-medium text-ink">Projet livré 🎉</p>
                <p className="text-xs text-ink-subtle">Le livrable est disponible.</p>
              </div>
              <a href={p.livrableUrl} target="_blank" rel="noreferrer">
                <Button size="sm">
                  <ExternalLink size={15} /> Voir le livrable
                </Button>
              </a>
            </Card>
          )}

          {/* Documents */}
          <Card className="p-0">
            <div className="flex items-center justify-between p-5 pb-0">
              <CardTitle>Documents</CardTitle>
              {canManage && (
                <Button size="sm" variant="secondary" disabled={upload.isPending} onClick={() => fileRef.current?.click()}>
                  <Paperclip size={15} /> {upload.isPending ? 'Envoi…' : 'Joindre'}
                </Button>
              )}
              <input
                ref={fileRef}
                type="file"
                className="hidden"
                accept=".pdf,.png,.jpg,.jpeg,.gif,.webp,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv"
                onChange={(e) => void onPickFile(e.target.files?.[0] ?? null)}
              />
            </div>
            {p.documents.length === 0 ? (
              <p className="px-5 py-6 text-center text-sm text-ink-subtle">Aucun document joint.</p>
            ) : (
              <ul className="mt-3 divide-y divide-surface-border">
                {p.documents.map((d) => (
                  <li key={d.id} className="flex items-center gap-3 px-5 py-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface-muted text-ink-subtle">
                      <FileText size={16} />
                    </span>
                    <button
                      type="button"
                      onClick={() => void download(d)}
                      disabled={dl === d.id}
                      className="min-w-0 flex-1 truncate text-left text-sm font-medium text-ink hover:text-brand-600"
                    >
                      {d.nom}
                      {d.size ? <span className="text-xs text-ink-subtle"> · {humanSize(d.size)}</span> : null}
                    </button>
                    <button
                      type="button"
                      onClick={() => void download(d)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-subtle hover:bg-surface-muted hover:text-brand-600"
                      aria-label="Télécharger"
                    >
                      <Download size={15} />
                    </button>
                    {canManage && (
                      <button
                        type="button"
                        onClick={() => removeDoc.mutate(d.id)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-subtle hover:bg-surface-muted hover:text-danger"
                        aria-label="Supprimer"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        {/* Colonne latérale : infos + équipe */}
        <div className="space-y-6">
          <Card className="space-y-4">
            <div>
              <div className="mb-1 flex items-center justify-between text-xs text-ink-subtle">
                <span>Avancement</span>
                <span className="tabular-nums">{p.progression}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-surface-muted">
                <div className="h-full rounded-full bg-brand-600" style={{ width: `${p.progression}%` }} />
              </div>
            </div>
            <Meta label="Début" value={fmt(p.dateDebut)} />
            <Meta
              label="Échéance"
              value={
                <span className="inline-flex items-center gap-2">
                  {fmt(p.dateFin)}
                  {ech && (
                    <Badge tone={ech.tone === 'danger' ? 'danger' : ech.tone === 'warning' ? 'warning' : 'neutral'}>
                      <CalendarClock size={11} className="mr-1" /> {ech.label}
                    </Badge>
                  )}
                </span>
              }
            />
            <Meta
              label="Responsable"
              value={
                p.responsable ? (
                  <span className="inline-flex items-center gap-2">
                    <Avatar name={`${p.responsable.prenom} ${p.responsable.nom}`} size="sm" />
                    {p.responsable.prenom} {p.responsable.nom}
                  </span>
                ) : (
                  '—'
                )
              }
            />
          </Card>

          <Card>
            <CardTitle>Équipe ({p.membres.length})</CardTitle>
            {p.membres.length === 0 ? (
              <p className="mt-2 text-sm text-ink-subtle">Aucun membre assigné.</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {p.membres.map((m) => (
                  <li key={m.id} className="flex items-center gap-2.5 text-sm">
                    <Avatar name={`${m.prenom} ${m.nom}`} size="sm" />
                    <span className="text-ink">
                      {m.prenom} {m.nom}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

function Meta({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 text-sm">
      <span className="text-ink-subtle">{label}</span>
      <span className="text-right font-medium text-ink">{value}</span>
    </div>
  );
}
