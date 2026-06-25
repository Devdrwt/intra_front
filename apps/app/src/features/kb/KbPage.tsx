import { useMemo, useState } from 'react';
import { BookOpen, Pencil, Plus, Search, Tag, Trash2 } from 'lucide-react';
import { Badge, Button, Card, EmptyState, Input, Modal, PageHeader, Select, SkeletonRows, Textarea } from '@drwindesk/ui';
import { hasPermission, useAuth } from '@/auth/AuthContext';
import { Stagger, StaggerItem } from '@/components/motion';
import { useCreateKb, useKbArticles, useRemoveKb, useUpdateKb } from './hooks';
import type { KbArticle, KbInput } from './service';

export function KbPage() {
  const { user } = useAuth();
  const canManage = hasPermission(user, 'support:manage');
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('');
  const { data, isLoading } = useKbArticles(q, cat);
  const remove = useRemoveKb();
  const [reading, setReading] = useState<KbArticle | null>(null);
  const [editing, setEditing] = useState<KbArticle | null>(null);
  const [creating, setCreating] = useState(false);

  const categories = useMemo(
    () => [...new Set((data ?? []).map((a) => a.categorie).filter(Boolean) as string[])].sort(),
    [data],
  );
  const list = data ?? [];

  return (
    <div className="space-y-5">
      <PageHeader
        title="Base de connaissances"
        subtitle="Articles d'aide, procédures et réponses aux questions fréquentes."
        actions={canManage ? <Button onClick={() => setCreating(true)}><Plus size={16} /> Nouvel article</Button> : undefined}
      />

      <Card className="flex flex-wrap items-center gap-3">
        <div className="min-w-[220px] flex-1">
          <Input leading={<Search size={16} />} placeholder="Rechercher (titre, contenu, tag)…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <Select label="" placeholder="Toutes catégories" value={cat} onChange={(e) => setCat(e.target.value)} options={categories.map((c) => ({ value: c, label: c }))} />
      </Card>

      {isLoading ? (
        <Card className="p-0"><SkeletonRows rows={4} cols={2} /></Card>
      ) : list.length === 0 ? (
        <Card className="p-0"><EmptyState icon={<BookOpen size={20} />} title="Aucun article" description="La base de connaissances est vide pour cette recherche." /></Card>
      ) : (
        <Stagger className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((a) => (
            <StaggerItem key={a.id} className="h-full">
              <Card className="flex h-full flex-col gap-2">
                <button onClick={() => setReading(a)} className="text-left">
                  <div className="flex items-center gap-2">
                    {a.categorie && <Badge tone="neutral">{a.categorie}</Badge>}
                    {!a.publie && <Badge tone="warning">Brouillon</Badge>}
                  </div>
                  <h3 className="mt-1 font-semibold text-ink hover:text-brand-600">{a.titre}</h3>
                  <p className="mt-1 line-clamp-3 text-sm text-ink-muted">{a.contenu}</p>
                </button>
                <div className="mt-auto flex items-end justify-between gap-2 pt-2">
                  <div className="flex flex-wrap gap-1">
                    {a.tags.map((t) => (
                      <span key={t} className="inline-flex items-center gap-0.5 rounded-md bg-surface-muted px-1.5 py-0.5 text-[10px] text-ink-muted"><Tag size={9} /> {t}</span>
                    ))}
                  </div>
                  {canManage && (
                    <div className="flex shrink-0 gap-1">
                      <Button size="sm" variant="ghost" onClick={() => setEditing(a)} className="text-ink-subtle hover:text-brand-600"><Pencil size={14} /></Button>
                      <Button size="sm" variant="ghost" onClick={() => remove.mutate(a.id)} disabled={remove.isPending} className="text-ink-subtle hover:text-danger"><Trash2 size={14} /></Button>
                    </div>
                  )}
                </div>
              </Card>
            </StaggerItem>
          ))}
        </Stagger>
      )}

      <Modal open={!!reading} onClose={() => setReading(null)} size="lg" title={reading?.titre}>
        {reading && (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              {reading.categorie && <Badge tone="neutral">{reading.categorie}</Badge>}
              {reading.tags.map((t) => <Badge key={t} tone="neutral"><Tag size={11} /> {t}</Badge>)}
            </div>
            <div className="whitespace-pre-wrap text-[15px] leading-relaxed text-ink-muted">{reading.contenu}</div>
          </div>
        )}
      </Modal>

      {creating && <KbEditor onClose={() => setCreating(false)} />}
      {editing && <KbEditor article={editing} onClose={() => setEditing(null)} />}
    </div>
  );
}

function KbEditor({ article, onClose }: { article?: KbArticle; onClose: () => void }) {
  const create = useCreateKb();
  const update = useUpdateKb();
  const [form, setForm] = useState<KbInput>({
    titre: article?.titre ?? '',
    contenu: article?.contenu ?? '',
    categorie: article?.categorie ?? '',
    publie: article?.publie ?? true,
  });
  const [tags, setTags] = useState<string[]>(article?.tags ?? []);
  const [tagInput, setTagInput] = useState('');
  const pending = create.isPending || update.isPending;

  const set = <K extends keyof KbInput>(k: K, v: KbInput[K]) => setForm((f) => ({ ...f, [k]: v }));
  const addTag = () => {
    const v = tagInput.trim();
    if (v && !tags.includes(v)) setTags((l) => [...l, v]);
    setTagInput('');
  };
  const submit = () => {
    if (form.titre.trim().length < 2 || form.contenu.trim().length < 1) return;
    const input: KbInput = { ...form, categorie: form.categorie?.trim() || undefined, tags };
    if (article) update.mutate({ id: article.id, input }, { onSuccess: onClose });
    else create.mutate(input, { onSuccess: onClose });
  };

  return (
    <Modal open onClose={onClose} size="lg" title={article ? "Modifier l'article" : 'Nouvel article'} footer={
      <>
        <Button variant="secondary" onClick={onClose}>Annuler</Button>
        <Button onClick={submit} loading={pending} disabled={form.titre.trim().length < 2}>{article ? 'Enregistrer' : 'Publier'}</Button>
      </>
    }>
      <div className="space-y-4">
        <Input label="Titre *" value={form.titre} onChange={(e) => set('titre', e.target.value)} />
        <Input label="Catégorie" value={form.categorie ?? ''} onChange={(e) => set('categorie', e.target.value)} placeholder="Procédures, FAQ, IT…" />
        <Textarea label="Contenu *" rows={10} value={form.contenu} onChange={(e) => set('contenu', e.target.value)} />
        <div>
          <label className="mb-1 block text-sm font-medium text-ink-muted">Tags</label>
          <div className="flex flex-wrap gap-1.5">
            {tags.map((t) => (
              <button key={t} type="button" onClick={() => setTags((x) => x.filter((y) => y !== t))} className="inline-flex items-center gap-1 rounded-md bg-surface-muted px-2 py-1 text-xs text-ink-muted hover:text-danger"><Tag size={11} /> {t} ✕</button>
            ))}
          </div>
          <div className="mt-2 flex gap-2">
            <Input value={tagInput} onChange={(e) => setTagInput(e.target.value)} placeholder="Ajouter un tag…" onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }} className="flex-1" />
            <Button type="button" variant="secondary" onClick={addTag}>Ajouter</Button>
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm text-ink">
          <input type="checkbox" className="accent-brand-600" checked={form.publie ?? true} onChange={(e) => set('publie', e.target.checked)} />
          Publié (visible par tous)
        </label>
      </div>
    </Modal>
  );
}
