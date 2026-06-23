import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ImagePlus, Megaphone, MessageSquare, Pencil, Pin, Plus, ThumbsUp, Trash2 } from 'lucide-react';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Input,
  Modal,
  PageHeader,
  Skeleton,
  Textarea,
} from '@drwindesk/ui';
import { hasPermission, useAuth } from '@/auth/AuthContext';
import { Select, cn } from '@drwindesk/ui';
import { Stagger, StaggerItem } from '@/components/motion';
import { useAnnonces, useCreateAnnonce, useRemoveAnnonce, useUpdateAnnonce } from './hooks';
import { CATEGORIE_META, annonceCoverUrl, type Annonce, type AnnonceCategorie } from './types';

const fmt = (iso: string) =>
  new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

export function ActualitesPage() {
  const { user } = useAuth();
  const canManage = hasPermission(user, 'news:manage');
  const { data, isLoading } = useAnnonces();
  const remove = useRemoveAnnonce();
  const [showNew, setShowNew] = useState(false);
  const [editing, setEditing] = useState<Annonce | null>(null);
  const [filter, setFilter] = useState<AnnonceCategorie | 'ALL'>('ALL');
  const list = (data ?? []).filter((a) => filter === 'ALL' || a.categorie === filter);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Actualités"
        subtitle="La communication interne de l’entreprise."
        actions={
          canManage ? (
            <Button onClick={() => setShowNew(true)}>
              <Plus size={16} /> Publier
            </Button>
          ) : undefined
        }
      />

      <div className="flex flex-wrap gap-1 rounded-xl bg-surface-muted p-1">
        {(['ALL', 'ACTUALITE', 'RH', 'EVENEMENT'] as const).map((c) => (
          <button
            key={c}
            onClick={() => setFilter(c)}
            className={cn(
              'rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
              filter === c ? 'bg-surface text-ink shadow-soft' : 'text-ink-muted hover:text-ink',
            )}
          >
            {c === 'ALL' ? 'Tout' : CATEGORIE_META[c].label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-2xl" />
          ))}
        </div>
      ) : list.length === 0 ? (
        <Card className="p-0">
          <EmptyState
            icon={<Megaphone size={20} />}
            title="Aucune actualité"
            description={canManage ? 'Publiez la première annonce de l’entreprise.' : 'Rien à afficher pour le moment.'}
          />
        </Card>
      ) : (
        <Stagger className="space-y-4">
          {list.map((a) => (
            <StaggerItem key={a.id}>
              <Card className="overflow-hidden p-0">
                {a.hasCover && (
                  <img src={annonceCoverUrl(a.id)} alt={a.titre} className="max-h-72 w-full object-cover" loading="lazy" />
                )}
                <div className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        {!a.viewedByMe && <span className="h-2 w-2 shrink-0 rounded-full bg-brand-500" title="Non lu" />}
                        <Badge tone={CATEGORIE_META[a.categorie].tone}>
                          {CATEGORIE_META[a.categorie].label}
                        </Badge>
                        {a.epingle && (
                          <Badge tone="neutral">
                            <Pin size={12} /> Épinglé
                          </Badge>
                        )}
                        {a.statut === 'BROUILLON' && <Badge tone="warning">Brouillon</Badge>}
                        {a.statut === 'PROGRAMMEE' && <Badge tone="warning">Programmée</Badge>}
                        <span className="text-xs text-ink-subtle">
                          {fmt(a.createdAt)}
                          {a.authorNom ? ` · par ${a.authorNom}` : ''}
                        </span>
                      </div>
                      <Link to={`/actualites/${a.id}`} className="mt-1 block text-lg font-semibold text-ink hover:text-brand-600">
                        {a.titre}
                      </Link>
                    </div>
                    {canManage && (
                      <div className="flex shrink-0 gap-1">
                        <Button size="sm" variant="ghost" onClick={() => setEditing(a)} className="text-ink-subtle hover:text-brand-600">
                          <Pencil size={15} />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => remove.mutate(a.id)}
                          disabled={remove.isPending}
                          className="text-ink-subtle hover:text-danger"
                        >
                          <Trash2 size={15} />
                        </Button>
                      </div>
                    )}
                  </div>
                  <p className="mt-2 line-clamp-4 whitespace-pre-wrap text-sm leading-relaxed text-ink-muted">{a.contenu}</p>
                  <div className="mt-2 flex items-center gap-4">
                    <Link to={`/actualites/${a.id}`} className="text-sm font-medium text-brand-600 hover:underline">
                      Lire la suite →
                    </Link>
                    <span className="flex items-center gap-3 text-xs text-ink-subtle">
                      {a.likeCount + a.clapCount > 0 && <span className="inline-flex items-center gap-1"><ThumbsUp size={12} /> {a.likeCount + a.clapCount}</span>}
                      {a.commentCount > 0 && <span className="inline-flex items-center gap-1"><MessageSquare size={12} /> {a.commentCount}</span>}
                    </span>
                  </div>
                </div>
              </Card>
            </StaggerItem>
          ))}
        </Stagger>
      )}

      {showNew && <NewAnnonceModal onClose={() => setShowNew(false)} />}
      {editing && <EditAnnonceModal annonce={editing} onClose={() => setEditing(null)} />}
    </div>
  );
}

function EditAnnonceModal({ annonce, onClose }: { annonce: Annonce; onClose: () => void }) {
  const update = useUpdateAnnonce();
  const [titre, setTitre] = useState(annonce.titre);
  const [contenu, setContenu] = useState(annonce.contenu);
  const [categorie, setCategorie] = useState<AnnonceCategorie>(annonce.categorie);
  const [epingle, setEpingle] = useState(annonce.epingle);

  const submit = async () => {
    if (titre.trim().length < 2 || contenu.trim().length < 1) return;
    await update.mutateAsync({
      id: annonce.id,
      patch: { titre: titre.trim(), contenu: contenu.trim(), categorie, epingle },
    });
    onClose();
  };

  return (
    <Modal
      open
      onClose={onClose}
      size="lg"
      title="Modifier l'actualité"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Annuler</Button>
          <Button onClick={() => void submit()} loading={update.isPending} disabled={titre.trim().length < 2}>
            Enregistrer
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Input label="Titre *" value={titre} onChange={(e) => setTitre(e.target.value)} />
        <Select
          label="Catégorie"
          options={[
            { value: 'ACTUALITE', label: 'Actualité' },
            { value: 'RH', label: 'Annonce RH' },
            { value: 'EVENEMENT', label: 'Événement' },
          ]}
          value={categorie}
          onChange={(e) => setCategorie(e.target.value as AnnonceCategorie)}
        />
        <Textarea label="Contenu *" rows={6} value={contenu} onChange={(e) => setContenu(e.target.value)} />
        <label className="flex items-center gap-2 text-sm text-ink">
          <input type="checkbox" className="accent-brand-600" checked={epingle} onChange={(e) => setEpingle(e.target.checked)} />
          Épingler en tête
        </label>
        <p className="text-xs text-ink-subtle">L'image de couverture ne se modifie pas ici (re-publier pour la changer).</p>
      </div>
    </Modal>
  );
}

function NewAnnonceModal({ onClose }: { onClose: () => void }) {
  const create = useCreateAnnonce();
  const [titre, setTitre] = useState('');
  const [contenu, setContenu] = useState('');
  const [categorie, setCategorie] = useState<AnnonceCategorie>('ACTUALITE');
  const [epingle, setEpingle] = useState(false);
  const [cover, setCover] = useState<File | null>(null);
  const [statut, setStatut] = useState<'PUBLIEE' | 'PROGRAMMEE' | 'BROUILLON'>('PUBLIEE');
  const [publishedAt, setPublishedAt] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const submit = async () => {
    if (titre.trim().length < 2 || contenu.trim().length < 1) return;
    if (statut === 'PROGRAMMEE' && !publishedAt) return;
    await create.mutateAsync({
      titre: titre.trim(),
      contenu: contenu.trim(),
      categorie,
      epingle,
      statut,
      publishedAt: statut === 'PROGRAMMEE' ? new Date(publishedAt).toISOString() : undefined,
      cover: cover ?? undefined,
    });
    onClose();
  };

  return (
    <Modal
      open
      onClose={onClose}
      size="lg"
      title="Nouvelle actualité"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Annuler
          </Button>
          <Button onClick={() => void submit()} loading={create.isPending} disabled={titre.trim().length < 2}>
            Publier
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Input label="Titre *" value={titre} onChange={(e) => setTitre(e.target.value)} placeholder="Ex. Réunion générale du personnel" />
        <Select
          label="Catégorie"
          options={[
            { value: 'ACTUALITE', label: 'Actualité' },
            { value: 'RH', label: 'Annonce RH' },
            { value: 'EVENEMENT', label: 'Événement' },
          ]}
          value={categorie}
          onChange={(e) => setCategorie(e.target.value as AnnonceCategorie)}
        />
        <Textarea label="Contenu *" rows={6} value={contenu} onChange={(e) => setContenu(e.target.value)} />
        <div className="grid gap-3 sm:grid-cols-2">
          <Select
            label="Publication"
            options={[
              { value: 'PUBLIEE', label: 'Publier maintenant' },
              { value: 'PROGRAMMEE', label: 'Programmer' },
              { value: 'BROUILLON', label: 'Brouillon' },
            ]}
            value={statut}
            onChange={(e) => setStatut(e.target.value as 'PUBLIEE' | 'PROGRAMMEE' | 'BROUILLON')}
          />
          {statut === 'PROGRAMMEE' && (
            <Input type="datetime-local" label="Le" value={publishedAt} onChange={(e) => setPublishedAt(e.target.value)} />
          )}
        </div>
        <div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => setCover(e.target.files?.[0] ?? null)} />
          <Button variant="secondary" onClick={() => fileRef.current?.click()}>
            <ImagePlus size={16} /> {cover ? cover.name : 'Image de couverture'}
          </Button>
        </div>
        <label className="flex items-center gap-2 text-sm text-ink">
          <input type="checkbox" className="accent-brand-600" checked={epingle} onChange={(e) => setEpingle(e.target.checked)} />
          Épingler en tête
        </label>
      </div>
    </Modal>
  );
}

export type { Annonce };
