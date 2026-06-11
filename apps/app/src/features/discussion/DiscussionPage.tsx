import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Building2,
  Download,
  MessagesSquare,
  Paperclip,
  Plus,
  Search,
  Send,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import { Avatar, Button, Card, EmptyState, Input, Modal, Skeleton, cn } from '@drwindesk/ui';
import { hasPermission, useAuth } from '@/auth/AuthContext';
import { apiErrorMessage } from '@/lib/api';
import { avatarUrl } from '@/lib/avatar';
import { triggerDownload, humanSize } from '@/lib/download';
import { toast } from '@/lib/toast';
import {
  useContacts,
  useConversations,
  useCreateDirect,
  useCreateGroup,
  useDeleteMessage,
  useMessages,
  usePostMessage,
} from './hooks';
import { discussionService } from './service';
import type { ConversationSummary, Message } from './types';

const time = (iso: string) => {
  const d = new Date(iso);
  return d.toDateString() === new Date().toDateString()
    ? d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    : d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
};

function ConvAvatar({ conv, size = 'md' }: { conv: ConversationSummary; size?: 'sm' | 'md' }) {
  const cls = size === 'sm' ? 'h-9 w-9' : 'h-10 w-10';
  if (conv.type === 'DIRECT')
    return (
      <Avatar
        name={conv.title}
        src={conv.avatar ? avatarUrl(conv.avatar.userId, conv.avatar.hasAvatar) : undefined}
        size={size}
      />
    );
  const Icon = conv.type === 'COMPANY' ? Building2 : Users;
  return (
    <span className={cn('flex shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand-soft-fg', cls)}>
      <Icon size={18} />
    </span>
  );
}

export function DiscussionPage() {
  const qc = useQueryClient();
  const { data: conversations, isLoading } = useConversations();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mobileConv, setMobileConv] = useState(false);
  const [showNew, setShowNew] = useState(false);

  const list = conversations ?? [];
  const active = useMemo(
    () => list.find((c) => c.id === selectedId) ?? list[0] ?? null,
    [list, selectedId],
  );

  useEffect(() => {
    const first = list[0];
    if (!selectedId && first) setSelectedId(first.id);
  }, [list, selectedId]);

  const select = (id: string) => {
    setSelectedId(id);
    setMobileConv(true);
    // Marquage lu immédiat côté UI (le serveur le fait via getMessages).
    const conv = list.find((c) => c.id === id);
    if (conv && conv.unread > 0) {
      qc.setQueryData<ConversationSummary[]>(['discussion', 'convs'], (old) =>
        old?.map((c) => (c.id === id ? { ...c, unread: 0 } : c)),
      );
      qc.setQueryData<number>(['discussion', 'unread'], (old) =>
        Math.max(0, (old ?? 0) - conv.unread),
      );
    }
  };

  return (
    <div className="space-y-4">
      <header>
        <h2 className="text-2xl font-bold tracking-tight text-ink">Messages</h2>
        <p className="text-ink-muted">Canal de l'entreprise et conversations privées.</p>
      </header>

      <Card className="flex h-[68vh] overflow-hidden p-0">
        {/* Liste des conversations */}
        <aside
          className={cn(
            'w-full flex-col border-r border-surface-border sm:w-80 lg:flex',
            mobileConv ? 'hidden' : 'flex',
          )}
        >
          <div className="flex items-center justify-between border-b border-surface-border px-4 py-3">
            <span className="font-semibold text-ink">Conversations</span>
            <button
              onClick={() => setShowNew(true)}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white hover:bg-brand-700"
              title="Nouvelle conversation"
            >
              <Plus size={16} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="space-y-2 p-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full rounded-xl" />
                ))}
              </div>
            ) : (
              list.map((c) => (
                <button
                  key={c.id}
                  onClick={() => select(c.id)}
                  className={cn(
                    'flex w-full items-center gap-3 border-b border-surface-border px-4 py-3 text-left transition-colors hover:bg-surface-muted',
                    active?.id === c.id && 'bg-brand-soft/50',
                  )}
                >
                  <ConvAvatar conv={c} size="sm" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className={cn('truncate text-sm text-ink', c.unread > 0 ? 'font-bold' : 'font-medium')}>
                        {c.title}
                      </span>
                      <div className="flex shrink-0 items-center gap-1.5">
                        {c.lastMessage && (
                          <span className="text-[11px] text-ink-subtle">{time(c.lastMessage.createdAt)}</span>
                        )}
                        {c.unread > 0 && (
                          <span className="inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-brand-600 px-1.5 text-[11px] font-semibold text-white">
                            {c.unread > 99 ? '99+' : c.unread}
                          </span>
                        )}
                      </div>
                    </div>
                    <p className={cn('truncate text-xs', c.unread > 0 ? 'font-medium text-ink' : 'text-ink-subtle')}>
                      {c.lastMessage ? `${c.lastMessage.authorName}: ${c.lastMessage.body}` : 'Aucun message'}
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>
        </aside>

        {/* Conversation active */}
        <section className={cn('flex-1 flex-col', mobileConv ? 'flex' : 'hidden lg:flex')}>
          {active ? (
            <ConversationView
              conv={active}
              onBack={() => setMobileConv(false)}
            />
          ) : (
            <EmptyState
              icon={<MessagesSquare size={22} />}
              title="Aucune conversation"
              description="Démarrez une discussion avec le bouton +."
              className="m-auto"
            />
          )}
        </section>
      </Card>

      {showNew && (
        <NewConversationModal
          onClose={() => setShowNew(false)}
          onCreated={(id) => {
            setShowNew(false);
            select(id);
          }}
        />
      )}
    </div>
  );
}

function ConversationView({ conv, onBack }: { conv: ConversationSummary; onBack: () => void }) {
  const { user } = useAuth();
  const canModerate = hasPermission(user, 'discussion:moderate');
  const { data: messages, isLoading } = useMessages(conv.id);
  const postMsg = usePostMessage(conv.id);
  const del = useDeleteMessage(conv.id);

  const [body, setBody] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const items = messages ?? [];
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight });
  }, [items.length, conv.id]);

  const send = async () => {
    if ((!body.trim() && !file) || postMsg.isPending || uploading) return;
    let attach = {};
    if (file) {
      setUploading(true);
      try {
        const ref = await discussionService.uploadAttachment(conv.id, file);
        attach = { attachmentKey: ref.key, attachmentName: ref.name, attachmentSize: ref.size, attachmentType: ref.type };
      } catch (err) {
        setUploading(false);
        toast.error(apiErrorMessage(err, 'Téléversement impossible.'));
        return;
      }
      setUploading(false);
    }
    try {
      await postMsg.mutateAsync({ body: body.trim(), ...attach });
      setBody('');
      setFile(null);
      if (fileRef.current) fileRef.current.value = '';
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Envoi impossible.'));
    }
  };

  const onKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void send();
    }
  };

  const download = async (m: Message) => {
    if (!m.attachment) return;
    try {
      const blob = await discussionService.downloadAttachment(conv.id, m.id);
      triggerDownload(blob, m.attachment.name);
    } catch {
      toast.error('Téléchargement impossible.');
    }
  };

  return (
    <>
      <div className="flex items-center gap-2 border-b border-surface-border px-4 py-3">
        <button onClick={onBack} className="text-ink-muted hover:text-ink lg:hidden" aria-label="Retour">
          <ArrowLeft size={18} />
        </button>
        <ConvAvatar conv={conv} size="sm" />
        <div className="min-w-0">
          <p className="truncate font-semibold text-ink">{conv.title}</p>
          {conv.type !== 'DIRECT' && (
            <p className="text-xs text-ink-subtle">
              {conv.type === 'COMPANY' ? 'Tout le personnel' : `${conv.participantsCount} membres`}
            </p>
          )}
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto p-4">
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-2/3 rounded-2xl" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <p className="py-8 text-center text-sm text-ink-subtle">Aucun message. Lancez la conversation 👋</p>
        ) : (
          items.map((m) => {
            const isOwn = m.author.id === user?.userId;
            const canDelete = isOwn || canModerate;
            return (
              <div key={m.id} className={cn('flex gap-2.5', isOwn && 'flex-row-reverse')}>
                <Avatar name={m.author.name} src={avatarUrl(m.author.id, m.author.hasAvatar)} size="sm" />
                <div className={cn('group max-w-[78%]', isOwn && 'flex flex-col items-end')}>
                  <div className="mb-0.5 flex items-center gap-2 text-xs text-ink-subtle">
                    <span className="font-medium text-ink">{isOwn ? 'Vous' : m.author.name}</span>
                    <span>{time(m.createdAt)}</span>
                    {canDelete && (
                      <button
                        type="button"
                        onClick={() => del.mutate(m.id)}
                        className="opacity-0 transition-opacity hover:text-danger group-hover:opacity-100"
                        title="Supprimer"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                  <div className={cn('rounded-2xl px-3.5 py-2 text-sm', isOwn ? 'bg-brand-600 text-white' : 'bg-surface-muted text-ink')}>
                    {m.body && <p className="whitespace-pre-wrap break-words">{m.body}</p>}
                    {m.attachment && (
                      <button
                        type="button"
                        onClick={() => void download(m)}
                        className={cn(
                          'mt-1.5 inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium',
                          isOwn ? 'bg-white/15 hover:bg-white/25' : 'bg-surface hover:text-brand-600',
                        )}
                      >
                        <Download size={13} /> {m.attachment.name}
                        <span className="opacity-70">· {humanSize(m.attachment.size)}</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="border-t border-surface-border p-3">
        {file && (
          <div className="mb-2 flex items-center gap-2 rounded-lg bg-surface-muted px-3 py-1.5 text-sm">
            <Paperclip size={14} className="text-ink-subtle" />
            <span className="min-w-0 flex-1 truncate text-ink">{file.name}</span>
            <button onClick={() => { setFile(null); if (fileRef.current) fileRef.current.value = ''; }} className="text-ink-subtle hover:text-danger">
              <X size={15} />
            </button>
          </div>
        )}
        <div className="flex items-end gap-2">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-ink-muted hover:bg-surface-muted hover:text-ink"
            title="Joindre un fichier"
          >
            <Paperclip size={18} />
          </button>
          <input
            ref={fileRef}
            type="file"
            className="hidden"
            accept=".pdf,.png,.jpg,.jpeg,.gif,.webp,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            onKeyDown={onKey}
            rows={1}
            placeholder="Écrire un message…"
            className="max-h-32 min-h-[2.5rem] flex-1 resize-none rounded-xl border border-surface-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-brand-400"
          />
          <Button onClick={() => void send()} loading={postMsg.isPending || uploading} disabled={!body.trim() && !file}>
            <Send size={16} />
          </Button>
        </div>
      </div>
    </>
  );
}

function NewConversationModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (id: string) => void;
}) {
  const { data: contacts } = useContacts();
  const createDirect = useCreateDirect();
  const createGroup = useCreateGroup();
  const [tab, setTab] = useState<'direct' | 'group'>('direct');
  const [q, setQ] = useState('');
  const [groupName, setGroupName] = useState('');
  const [selected, setSelected] = useState<string[]>([]);

  const filtered = (contacts ?? []).filter((c) => c.name.toLowerCase().includes(q.trim().toLowerCase()));

  const startDirect = async (userId: string) => {
    const conv = await createDirect.mutateAsync(userId);
    onCreated(conv.id);
  };
  const submitGroup = async () => {
    if (!groupName.trim() || selected.length === 0) return;
    const conv = await createGroup.mutateAsync({ name: groupName.trim(), userIds: selected });
    onCreated(conv.id);
  };

  return (
    <Modal
      open
      onClose={onClose}
      size="md"
      title="Nouvelle conversation"
      footer={
        tab === 'group' ? (
          <Button
            onClick={() => void submitGroup()}
            loading={createGroup.isPending}
            disabled={!groupName.trim() || selected.length === 0}
            className="w-full"
          >
            Créer le groupe ({selected.length})
          </Button>
        ) : undefined
      }
    >
      <div className="space-y-3">
        <div className="flex gap-1 rounded-xl bg-surface-muted p-1">
          {(['direct', 'group'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                'flex-1 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
                tab === t ? 'bg-surface text-ink shadow-soft' : 'text-ink-muted hover:text-ink',
              )}
            >
              {t === 'direct' ? 'Message privé' : 'Nouveau groupe'}
            </button>
          ))}
        </div>

        {tab === 'group' && (
          <Input placeholder="Nom du groupe" value={groupName} onChange={(e) => setGroupName(e.target.value)} />
        )}

        <Input leading={<Search size={15} />} placeholder="Rechercher un collègue…" value={q} onChange={(e) => setQ(e.target.value)} />

        <div className="-mx-1 max-h-[44vh] overflow-y-auto">
          {filtered.length === 0 ? (
            <p className="py-6 text-center text-sm text-ink-subtle">Aucun collègue.</p>
          ) : (
            filtered.map((c) =>
              tab === 'direct' ? (
                <button
                  key={c.id}
                  onClick={() => void startDirect(c.id)}
                  disabled={createDirect.isPending}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm hover:bg-surface-muted"
                >
                  <Avatar name={c.name} src={avatarUrl(c.id, c.hasAvatar)} size="sm" />
                  <span className="text-ink">{c.name}</span>
                </button>
              ) : (
                <label key={c.id} className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2 text-sm hover:bg-surface-muted">
                  <input
                    type="checkbox"
                    className="accent-brand-600"
                    checked={selected.includes(c.id)}
                    onChange={() =>
                      setSelected((s) => (s.includes(c.id) ? s.filter((x) => x !== c.id) : [...s, c.id]))
                    }
                  />
                  <Avatar name={c.name} src={avatarUrl(c.id, c.hasAvatar)} size="sm" />
                  <span className="text-ink">{c.name}</span>
                </label>
              ),
            )
          )}
        </div>
      </div>
    </Modal>
  );
}
