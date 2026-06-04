import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { Download, MessagesSquare, Paperclip, Send, Trash2, X } from 'lucide-react';
import { Avatar, Button, Card, EmptyState, Skeleton, cn } from '@drwindesk/ui';
import { hasPermission, useAuth } from '@/auth/AuthContext';
import { apiErrorMessage } from '@/lib/api';
import { triggerDownload, humanSize } from '@/lib/download';
import { toast } from '@/lib/toast';
import { useDeleteMessage, useMessages, usePostMessage } from './hooks';
import { discussionService } from './service';
import type { Message } from './types';

function time(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const sameDay = d.toDateString() === today.toDateString();
  return sameDay
    ? d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    : d.toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export function DiscussionPage() {
  const { user } = useAuth();
  const canModerate = hasPermission(user, 'discussion:moderate');
  const { data: messages, isLoading } = useMessages();
  const post = usePostMessage();
  const del = useDeleteMessage();

  const [body, setBody] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const list = messages ?? [];

  // Auto-scroll en bas quand la liste change.
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight });
  }, [list.length]);

  const send = async () => {
    if ((!body.trim() && !file) || post.isPending || uploading) return;
    let attach = {};
    if (file) {
      setUploading(true);
      try {
        const ref = await discussionService.uploadAttachment(file);
        attach = { attachmentKey: ref.key, attachmentName: ref.name, attachmentSize: ref.size, attachmentType: ref.type };
      } catch (err) {
        setUploading(false);
        toast.error(apiErrorMessage(err, 'Téléversement impossible.'));
        return;
      }
      setUploading(false);
    }
    try {
      await post.mutateAsync({ body: body.trim(), ...attach });
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
      const blob = await discussionService.downloadAttachment(m.id);
      triggerDownload(blob, m.attachment.name);
    } catch {
      toast.error('Téléchargement impossible.');
    }
  };

  return (
    <div className="space-y-4">
      <header>
        <h2 className="text-2xl font-bold tracking-tight text-ink">Discussion</h2>
        <p className="text-ink-muted">Le fil de l'entreprise — visible par tout le personnel.</p>
      </header>

      <Card className="flex flex-col overflow-hidden p-0">
        <div ref={scrollRef} className="min-h-[320px] flex-1 space-y-4 overflow-y-auto p-5 [max-height:62vh]">
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex gap-2.5">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <Skeleton className="h-12 w-2/3 rounded-2xl" />
                </div>
              ))}
            </div>
          ) : list.length === 0 ? (
            <EmptyState
              icon={<MessagesSquare size={22} />}
              title="Aucun message"
              description="Lancez la discussion : dites bonjour à toute l'équipe 👋"
              className="py-12"
            />
          ) : (
            list.map((m) => {
              const isOwn = m.author.id === user?.userId;
              const canDelete = isOwn || canModerate;
              return (
                <div key={m.id} className={cn('flex gap-2.5', isOwn && 'flex-row-reverse')}>
                  <Avatar name={m.author.name} size="sm" />
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
                    <div
                      className={cn(
                        'rounded-2xl px-3.5 py-2 text-sm',
                        isOwn ? 'bg-brand-600 text-white' : 'bg-surface-muted text-ink',
                      )}
                    >
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

        {/* Composer */}
        <div className="border-t border-surface-border p-3">
          {file && (
            <div className="mb-2 flex items-center gap-2 rounded-lg bg-surface-muted px-3 py-1.5 text-sm">
              <Paperclip size={14} className="text-ink-subtle" />
              <span className="min-w-0 flex-1 truncate text-ink">{file.name}</span>
              <span className="text-xs text-ink-subtle">{humanSize(file.size)}</span>
              <button
                type="button"
                onClick={() => {
                  setFile(null);
                  if (fileRef.current) fileRef.current.value = '';
                }}
                className="text-ink-subtle hover:text-danger"
              >
                <X size={15} />
              </button>
            </div>
          )}
          <div className="flex items-end gap-2">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              title="Joindre un fichier"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-ink-muted hover:bg-surface-muted hover:text-ink"
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
              placeholder="Écrire un message… (Entrée pour envoyer, Maj+Entrée pour un saut de ligne)"
              className="max-h-32 min-h-[2.5rem] flex-1 resize-none rounded-xl border border-surface-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-brand-400"
            />
            <Button onClick={() => void send()} loading={post.isPending || uploading} disabled={!body.trim() && !file}>
              <Send size={16} />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
