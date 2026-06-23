import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Eye, Hand, Pin, Send, ThumbsUp, Trash2 } from 'lucide-react';
import { Badge, Button, Card, Input, Skeleton, cn } from '@drwindesk/ui';
import { hasPermission, useAuth } from '@/auth/AuthContext';
import { useAddComment, useAnnonceComments, useAnnonces, useMarkRead, useRemoveComment, useToggleReaction } from './hooks';
import { CATEGORIE_META, annonceCoverUrl, type Annonce, type ReactionType } from './types';

const fmt = (iso: string) =>
  new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
const fmtDT = (iso: string) =>
  new Date(iso).toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });

export function ActualiteDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const canManage = hasPermission(user, 'news:manage');
  const { data, isLoading } = useAnnonces();
  const a = (data ?? []).find((x) => x.id === id);

  const markRead = useMarkRead();
  const marked = useRef(false);
  useEffect(() => {
    if (a && !marked.current) {
      marked.current = true;
      markRead.mutate(a.id);
    }
  }, [a, markRead]);

  if (isLoading) return <Skeleton className="h-96 w-full rounded-2xl" />;

  if (!a) {
    return (
      <Card className="p-8 text-center">
        <p className="text-ink-muted">Actualité introuvable.</p>
        <Link to="/actualites">
          <Button variant="secondary" className="mt-4">
            <ArrowLeft size={16} /> Retour aux actualités
          </Button>
        </Link>
      </Card>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <Link to="/actualites" className="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink">
        <ArrowLeft size={16} /> Toutes les actualités
      </Link>
      <Card className="overflow-hidden p-0">
        {a.hasCover && <img src={annonceCoverUrl(a.id)} alt={a.titre} className="max-h-96 w-full object-cover" />}
        <div className="p-6">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={CATEGORIE_META[a.categorie].tone}>{CATEGORIE_META[a.categorie].label}</Badge>
            {a.epingle && (
              <Badge tone="neutral">
                <Pin size={12} /> Épinglé
              </Badge>
            )}
            <span className="text-xs text-ink-subtle">
              {fmt(a.createdAt)}
              {a.authorNom ? ` · par ${a.authorNom}` : ''}
            </span>
            {canManage && (
              <span className="inline-flex items-center gap-1 text-xs text-ink-subtle">
                <Eye size={12} /> vu par {a.readCount}
              </span>
            )}
          </div>
          <h1 className="mt-2 text-2xl font-bold text-ink">{a.titre}</h1>
          <div className="mt-4 whitespace-pre-wrap text-[15px] leading-relaxed text-ink-muted">{a.contenu}</div>

          <Reactions annonce={a} />
        </div>
      </Card>

      <Comments annonceId={a.id} />
    </div>
  );
}

function Reactions({ annonce }: { annonce: Annonce }) {
  const toggle = useToggleReaction();
  const react = (type: ReactionType) => toggle.mutate({ id: annonce.id, type });
  const on = (type: ReactionType) => annonce.myReactions.includes(type);

  const Btn = ({ type, icon, count }: { type: ReactionType; icon: ReactNode; count: number }) => (
    <button
      onClick={() => react(type)}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition',
        on(type) ? 'border-brand-400 bg-brand-soft text-brand-soft-fg' : 'border-surface-border text-ink-muted hover:text-ink',
      )}
    >
      {icon} {count > 0 && count}
    </button>
  );

  return (
    <div className="mt-5 flex items-center gap-2 border-t border-surface-border pt-4">
      <Btn type="LIKE" icon={<ThumbsUp size={15} />} count={annonce.likeCount} />
      <Btn type="CLAP" icon={<Hand size={15} />} count={annonce.clapCount} />
    </div>
  );
}

function Comments({ annonceId }: { annonceId: string }) {
  const { user } = useAuth();
  const canManage = hasPermission(user, 'news:manage');
  const { data: comments } = useAnnonceComments(annonceId);
  const add = useAddComment(annonceId);
  const remove = useRemoveComment(annonceId);
  const [body, setBody] = useState('');

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!body.trim()) return;
    add.mutate(body.trim(), { onSuccess: () => setBody('') });
  };

  const list = comments ?? [];

  return (
    <Card>
      <h2 className="text-sm font-semibold text-ink">Commentaires {list.length > 0 && <span className="text-ink-subtle">· {list.length}</span>}</h2>
      <ul className="mt-3 space-y-3">
        {list.map((c) => (
          <li key={c.id} className="group rounded-xl bg-surface-muted px-3 py-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-medium text-ink">{c.authorNom ?? 'Utilisateur'}</span>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-ink-subtle">{fmtDT(c.createdAt)}</span>
                {(canManage || c.authorId === user?.userId) && (
                  <button onClick={() => remove.mutate(c.id)} className="text-ink-subtle opacity-0 transition group-hover:opacity-100 hover:text-danger">
                    <Trash2 size={12} />
                  </button>
                )}
              </div>
            </div>
            <p className="mt-0.5 whitespace-pre-wrap text-sm text-ink-muted">{c.contenu}</p>
          </li>
        ))}
        {list.length === 0 && <li className="text-sm text-ink-subtle">Soyez le premier à commenter.</li>}
      </ul>
      <form onSubmit={onSubmit} className="mt-3 flex gap-2">
        <Input id="cmt" value={body} onChange={(e) => setBody(e.target.value)} placeholder="Écrire un commentaire…" className="flex-1" />
        <Button type="submit" loading={add.isPending}><Send size={15} /></Button>
      </form>
    </Card>
  );
}
