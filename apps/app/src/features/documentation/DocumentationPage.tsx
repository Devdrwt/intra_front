import { useEffect, useRef, useState } from 'react';
import { Download, Eye, FileText, FolderOpen, History, Lock, RotateCcw, Search, Trash2, Upload } from 'lucide-react';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Input,
  Modal,
  PageHeader,
  Select,
  Skeleton,
  Textarea,
  cn,
} from '@drwindesk/ui';
import { hasPermission, useAuth } from '@/auth/AuthContext';
import { humanSize } from '@/lib/download';
import { apiErrorMessage } from '@/lib/api';
import { toast } from '@/lib/toast';
import { Stagger, StaggerItem } from '@/components/motion';
import {
  useAddVersion,
  useCreateDoc,
  useDocAccess,
  useDocVersions,
  useDocs,
  useRemoveDoc,
  useRestoreVersion,
  useSetDocAccess,
  useSetDocStatut,
} from './hooks';
import { useUsers } from '@/features/users/hooks';
import { userLabel } from '@/features/users/types';
import { documentationService } from './service';
import { DOC_CATEGORIES, DOC_STATUT_META, isPreviewable, type DocItem, type DocStatut } from './types';

const fmt = (iso: string) => new Date(iso).toLocaleDateString('fr-FR');

export function DocumentationPage() {
  const { user } = useAuth();
  const canManage = hasPermission(user, 'doc:manage');
  const [cat, setCat] = useState('');
  const [q, setQ] = useState('');
  const { data, isLoading } = useDocs(cat, q);
  const remove = useRemoveDoc();
  const setStatut = useSetDocStatut();
  const [showNew, setShowNew] = useState(false);
  const [dlId, setDlId] = useState<string | null>(null);
  const [historyDoc, setHistoryDoc] = useState<DocItem | null>(null);
  const [previewDoc, setPreviewDoc] = useState<DocItem | null>(null);
  const [accessDoc, setAccessDoc] = useState<DocItem | null>(null);

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

  return (
    <div className="space-y-5">
      <PageHeader
        title="Base documentaire"
        subtitle="Procédures, manuels, contrats et documents de référence de l’entreprise."
        actions={
          canManage ? (
            <Button onClick={() => setShowNew(true)}>
              <Upload size={16} /> Déposer
            </Button>
          ) : undefined
        }
      />

      <Card className="flex flex-wrap items-center gap-3">
        <div className="min-w-[220px] flex-1">
          <Input leading={<Search size={16} />} placeholder="Rechercher un document…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <div className="flex flex-wrap gap-1 rounded-xl bg-surface-muted p-1">
          {['', ...DOC_CATEGORIES].map((c) => (
            <button
              key={c || 'all'}
              onClick={() => setCat(c)}
              className={cn(
                'rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
                cat === c ? 'bg-surface text-ink shadow-soft' : 'text-ink-muted hover:text-ink',
              )}
            >
              {c || 'Tout'}
            </button>
          ))}
        </div>
      </Card>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-xl" />
          ))}
        </div>
      ) : !data || data.length === 0 ? (
        <Card className="p-0">
          <EmptyState
            icon={<FolderOpen size={20} />}
            title="Aucun document"
            description={canManage ? 'Déposez un premier document de référence.' : 'Aucun document pour cette recherche.'}
          />
        </Card>
      ) : (
        <Stagger className="space-y-2">
          {data.map((d) => (
            <StaggerItem key={d.id}>
              <Card className="flex items-center gap-4 py-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand-soft-fg">
                  <FileText size={20} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate font-medium text-ink">{d.titre}</p>
                    <Badge tone="neutral">{d.categorie}</Badge>
                    {d.version > 1 && <Badge tone="brand">v{d.version}</Badge>}
                    {d.restricted && <Lock size={13} className="text-amber-500" />}
                    {canManage && d.statut !== 'PUBLIE' && (
                      <Badge tone={DOC_STATUT_META[d.statut].tone}>{DOC_STATUT_META[d.statut].label}</Badge>
                    )}
                  </div>
                  {d.description && <p className="truncate text-sm text-ink-subtle">{d.description}</p>}
                  <p className="text-xs text-ink-subtle">
                    {fmt(d.createdAt)}
                    {d.taille > 0 && ` · ${humanSize(d.taille)}`}
                  </p>
                </div>
                {canManage && (
                  <div className="w-32 shrink-0">
                    <Select
                      options={[
                        { value: 'BROUILLON', label: 'Brouillon' },
                        { value: 'EN_REVUE', label: 'En revue' },
                        { value: 'PUBLIE', label: 'Publier' },
                      ]}
                      value={d.statut}
                      onChange={(e) => setStatut.mutate({ id: d.id, statut: e.target.value as DocStatut })}
                    />
                  </div>
                )}
                {isPreviewable(d.mimeType) && (
                  <Button size="sm" variant="ghost" onClick={() => setPreviewDoc(d)} title="Aperçu">
                    <Eye size={15} />
                  </Button>
                )}
                <Button size="sm" variant="ghost" onClick={() => setHistoryDoc(d)} title="Historique des versions">
                  <History size={15} />
                </Button>
                <Button variant="secondary" size="sm" onClick={() => void download(d)} loading={dlId === d.id}>
                  <Download size={15} /> Télécharger
                </Button>
                {canManage && (
                  <Button size="sm" variant="ghost" onClick={() => setAccessDoc(d)} title="Accès">
                    <Lock size={15} />
                  </Button>
                )}
                {canManage && (
                  <Button size="sm" variant="ghost" onClick={() => remove.mutate(d.id)} disabled={remove.isPending} className="text-ink-subtle hover:text-danger">
                    <Trash2 size={15} />
                  </Button>
                )}
              </Card>
            </StaggerItem>
          ))}
        </Stagger>
      )}

      {showNew && <NewDocModal onClose={() => setShowNew(false)} />}
      {historyDoc && (
        <VersionsModal doc={historyDoc} canManage={canManage} onClose={() => setHistoryDoc(null)} />
      )}

      {accessDoc && <DocAccessModal doc={accessDoc} onClose={() => setAccessDoc(null)} />}

      <Modal open={!!previewDoc} onClose={() => setPreviewDoc(null)} size="xl" title={previewDoc?.titre}>
        {previewDoc && <DocPreviewBody doc={previewDoc} />}
      </Modal>
    </div>
  );
}

/**
 * Aperçu d'un document : le fichier est récupéré via l'API authentifiée puis
 * affiché en URL `blob:` (same-origin). Cela évite que le navigateur bloque
 * l'embarquement cross-origin (« Ce contenu a été bloqué ») dû aux en-têtes de
 * sécurité (X-Frame-Options / CSP frame-ancestors / CORP) posés sur l'API.
 */
function DocPreviewBody({ doc }: { doc: DocItem }) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let objectUrl: string | null = null;
    let active = true;
    setError(false);
    setBlobUrl(null);
    documentationService
      .previewBlob(doc.id)
      .then((blob) => {
        if (!active) return;
        objectUrl = URL.createObjectURL(blob);
        setBlobUrl(objectUrl);
      })
      .catch(() => active && setError(true));
    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [doc.id]);

  if (error) {
    return (
      <div className="flex h-[72vh] items-center justify-center text-sm text-ink-subtle">
        Impossible de charger le fichier.
      </div>
    );
  }
  if (!blobUrl) {
    return <Skeleton className="h-[72vh] w-full rounded-lg" />;
  }
  if (doc.mimeType.startsWith('image/')) {
    return <img src={blobUrl} alt={doc.titre} className="mx-auto max-h-[72vh] w-auto rounded-lg" />;
  }
  return (
    <iframe
      src={blobUrl}
      title={doc.titre}
      className="h-[72vh] w-full rounded-lg border border-surface-border"
    />
  );
}

function VersionsModal({ doc, canManage, onClose }: { doc: DocItem; canManage: boolean; onClose: () => void }) {
  const { data: versions, isLoading } = useDocVersions(doc.id);
  const addVersion = useAddVersion(doc.id);
  const restore = useRestoreVersion(doc.id);
  const fileRef = useRef<HTMLInputElement>(null);
  const [note, setNote] = useState('');
  const [dlId, setDlId] = useState<string | null>(null);

  const onPick = async (file: File | null) => {
    if (!file) return;
    try {
      await addVersion.mutateAsync({ file, note: note.trim() || undefined });
      setNote('');
    } catch (e) {
      toast.error(apiErrorMessage(e, 'Dépôt impossible.'));
    } finally {
      if (fileRef.current) fileRef.current.value = '';
    }
  };
  const dl = async (versionId: string) => {
    setDlId(versionId);
    try {
      await documentationService.downloadVersion(versionId, doc.titre);
    } catch (e) {
      toast.error(apiErrorMessage(e, 'Téléchargement impossible.'));
    } finally {
      setDlId(null);
    }
  };

  return (
    <Modal open onClose={onClose} size="md" title={`Historique — ${doc.titre}`}>
      {canManage && (
        <div className="mb-4 space-y-2 rounded-xl border border-surface-border p-3">
          <Input placeholder="Note de version (optionnel)" value={note} onChange={(e) => setNote(e.target.value)} />
          <input ref={fileRef} type="file" className="hidden" onChange={(e) => void onPick(e.target.files?.[0] ?? null)} />
          <Button variant="secondary" size="sm" onClick={() => fileRef.current?.click()} loading={addVersion.isPending}>
            <Upload size={15} /> Déposer une nouvelle version
          </Button>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-10 rounded-lg" />
          ))}
        </div>
      ) : (
        <ul className="divide-y divide-surface-border">
          {(versions ?? []).map((v) => (
            <li key={v.id} className="flex items-center gap-3 py-2.5">
              <Badge tone={v.version === doc.version ? 'brand' : 'neutral'}>v{v.version}</Badge>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-ink-subtle">
                  {new Date(v.createdAt).toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  {v.taille > 0 && ` · ${humanSize(v.taille)}`}
                  {v.version === doc.version && ' · actuelle'}
                </p>
                {v.note && <p className="truncate text-sm text-ink-muted">{v.note}</p>}
              </div>
              {canManage && v.version !== doc.version && (
                <Button size="sm" variant="ghost" onClick={() => restore.mutate(v.id)} loading={restore.isPending} title="Restaurer cette version">
                  <RotateCcw size={15} />
                </Button>
              )}
              <Button size="sm" variant="ghost" onClick={() => void dl(v.id)} loading={dlId === v.id}>
                <Download size={15} />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </Modal>
  );
}

function NewDocModal({ onClose }: { onClose: () => void }) {
  const create = useCreateDoc();
  const [titre, setTitre] = useState('');
  const [description, setDescription] = useState('');
  const [categorie, setCategorie] = useState<string>('Procédures');
  const [file, setFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const submit = async () => {
    if (titre.trim().length < 2 || !file) return;
    await create.mutateAsync({ titre: titre.trim(), description: description.trim() || undefined, categorie, file });
    onClose();
  };

  return (
    <Modal
      open
      onClose={onClose}
      size="md"
      title="Déposer un document"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Annuler
          </Button>
          <Button onClick={() => void submit()} loading={create.isPending} disabled={titre.trim().length < 2 || !file}>
            Déposer
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Input label="Titre *" value={titre} onChange={(e) => setTitre(e.target.value)} placeholder="Ex. Procédure de demande d’achat" />
        <Select
          label="Catégorie"
          options={DOC_CATEGORIES.map((c) => ({ value: c, label: c }))}
          value={categorie}
          onChange={(e) => setCategorie(e.target.value)}
        />
        <Textarea label="Description" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
        <div>
          <input ref={fileRef} type="file" className="hidden" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          <Button variant="secondary" onClick={() => fileRef.current?.click()}>
            <Upload size={16} /> {file ? file.name : 'Choisir un fichier'}
          </Button>
          <p className="mt-1 text-xs text-ink-subtle">PDF, Word, Excel, PowerPoint, image — 10 Mo max.</p>
        </div>
        <p className="text-xs text-ink-subtle">
          Le document est créé en <strong>brouillon</strong> — passez-le en « Publier » pour le rendre visible de tous.
        </p>
      </div>
    </Modal>
  );
}

function DocAccessModal({ doc, onClose }: { doc: DocItem; onClose: () => void }) {
  const { data: users } = useUsers();
  const { data: access, isLoading } = useDocAccess(doc.id);
  const save = useSetDocAccess(doc.id);
  const [restricted, setRestricted] = useState(doc.restricted);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [init, setInit] = useState(false);

  if (!init && access) {
    setSelected(new Set(access));
    setInit(true);
  }
  const toggle = (uid: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(uid) ? next.delete(uid) : next.add(uid);
      return next;
    });
  const submit = async () => {
    await save.mutateAsync({ userIds: [...selected], restricted });
    onClose();
  };

  return (
    <Modal
      open
      onClose={onClose}
      size="md"
      title="Accès au document"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Annuler</Button>
          <Button onClick={() => void submit()} loading={save.isPending}>Enregistrer</Button>
        </>
      }
    >
      <div className="space-y-4">
        <label className="flex items-center gap-2 text-sm text-ink">
          <input type="checkbox" className="accent-brand-600" checked={restricted} onChange={(e) => setRestricted(e.target.checked)} />
          Restreindre l'accès à certains utilisateurs
        </label>
        {restricted ? (
          isLoading ? (
            <Skeleton className="h-40 w-full rounded-lg" />
          ) : (
            <div className="max-h-64 space-y-1 overflow-y-auto rounded-xl border border-surface-border p-2">
              {(users ?? []).map((u) => (
                <label key={u.id} className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-surface-muted">
                  <input type="checkbox" className="accent-brand-600" checked={selected.has(u.id)} onChange={() => toggle(u.id)} />
                  {userLabel(u)}
                </label>
              ))}
            </div>
          )
        ) : (
          <p className="text-sm text-ink-subtle">Le document suit la visibilité normale (publié = visible par tous).</p>
        )}
      </div>
    </Modal>
  );
}
