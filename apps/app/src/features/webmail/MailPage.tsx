import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  Download,
  Mail,
  Paperclip,
  PenSquare,
  RefreshCw,
  Send,
  Settings as SettingsIcon,
  X,
} from 'lucide-react';
import { Button, Card, EmptyState, Input, Modal, Skeleton, Textarea, cn } from '@drwindesk/ui';
import { apiErrorMessage } from '@/lib/api';
import { triggerDownload, humanSize } from '@/lib/download';
import { toast } from '@/lib/toast';
import { useInbox, useMailAccounts, useMailMessage, useSendMail } from './hooks';
import { webmailService } from './service';
import type { SendInput } from './types';

const fmt = (iso: string | null) =>
  iso
    ? new Date(iso).toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
    : '';

export function MailPage() {
  const { data: accounts, isLoading: loadingAccounts } = useMailAccounts();
  const [picked, setPicked] = useState<string | null>(null);
  const accountId = picked ?? accounts?.[0]?.id ?? null;
  const account = accounts?.find((a) => a.id === accountId);

  const { data: inbox, isLoading, isError, refetch, isFetching } = useInbox(accountId);
  const [uid, setUid] = useState<number | null>(null);
  const [mobileRead, setMobileRead] = useState(false);
  const [compose, setCompose] = useState<Partial<SendInput> | null>(null);

  if (loadingAccounts) {
    return <Skeleton className="h-64 w-full rounded-2xl" />;
  }

  if (!accounts || accounts.length === 0) {
    return (
      <div className="space-y-4">
        <header>
          <h2 className="text-2xl font-bold tracking-tight text-ink">Mail</h2>
        </header>
        <Card className="p-0">
          <EmptyState
            icon={<Mail size={22} />}
            title="Aucune boîte connectée"
            description="Connectez une ou plusieurs boîtes email pour les lire et envoyer vos mails ici."
            action={
              <Link to="/parametres">
                <Button size="sm">
                  <SettingsIcon size={16} /> Configurer dans Paramètres
                </Button>
              </Link>
            }
            className="py-14"
          />
        </Card>
      </div>
    );
  }

  const list = inbox ?? [];
  const selectAccount = (id: string) => {
    setPicked(id);
    setUid(null);
    setMobileRead(false);
  };

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-2xl font-bold tracking-tight text-ink">Mail</h2>
          <p className="truncate text-ink-muted">{account?.email}</p>
        </div>
        <div className="flex items-center gap-2">
          {accounts.length > 1 && (
            <div className="flex rounded-xl bg-surface-muted p-1">
              {accounts.map((a) => (
                <button
                  key={a.id}
                  onClick={() => selectAccount(a.id)}
                  title={a.email}
                  className={cn(
                    'max-w-[12rem] truncate rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
                    a.id === accountId ? 'bg-surface text-ink shadow-soft' : 'text-ink-muted hover:text-ink',
                  )}
                >
                  {a.label}
                </button>
              ))}
            </div>
          )}
          <Button onClick={() => setCompose({})}>
            <PenSquare size={16} /> Écrire
          </Button>
        </div>
      </header>

      <Card className="flex h-[68vh] overflow-hidden p-0">
        {/* Liste */}
        <aside className={cn('w-full flex-col border-r border-surface-border sm:w-96 lg:flex', mobileRead ? 'hidden' : 'flex')}>
          <div className="flex items-center justify-between border-b border-surface-border px-4 py-3">
            <span className="font-semibold text-ink">Boîte de réception</span>
            <button onClick={() => refetch()} className="text-ink-muted hover:text-ink" title="Actualiser">
              <RefreshCw size={16} className={isFetching ? 'animate-spin' : ''} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="space-y-2 p-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full rounded-xl" />
                ))}
              </div>
            ) : isError ? (
              <p className="p-5 text-center text-sm text-danger">
                Impossible de relever la boîte. Vérifiez votre configuration.
              </p>
            ) : list.length === 0 ? (
              <p className="p-5 text-center text-sm text-ink-subtle">Aucun message.</p>
            ) : (
              list.map((m) => (
                <button
                  key={m.uid}
                  onClick={() => {
                    setUid(m.uid);
                    setMobileRead(true);
                  }}
                  className={cn(
                    'flex w-full flex-col gap-0.5 border-b border-surface-border px-4 py-3 text-left hover:bg-surface-muted',
                    uid === m.uid && 'bg-brand-soft/50',
                    !m.seen && 'bg-brand-soft/20',
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className={cn('truncate text-sm text-ink', !m.seen && 'font-semibold')}>
                      {m.from?.name || m.from?.address || 'Inconnu'}
                    </span>
                    <span className="shrink-0 text-[11px] text-ink-subtle">{fmt(m.date)}</span>
                  </div>
                  <span className={cn('truncate text-sm text-ink-muted', !m.seen && 'font-medium text-ink')}>
                    {m.subject}
                  </span>
                </button>
              ))
            )}
          </div>
        </aside>

        {/* Lecture */}
        <section className={cn('flex-1 flex-col', mobileRead ? 'flex' : 'hidden lg:flex')}>
          {uid == null || !accountId ? (
            <EmptyState icon={<Mail size={20} />} title="Sélectionnez un message" className="m-auto" />
          ) : (
            <Reader
              accountId={accountId}
              uid={uid}
              onBack={() => setMobileRead(false)}
              onReply={(to, subject) => setCompose({ to, subject })}
            />
          )}
        </section>
      </Card>

      {compose && accountId && (
        <Compose accountId={accountId} initial={compose} onClose={() => setCompose(null)} />
      )}
    </div>
  );
}

function Reader({
  accountId,
  uid,
  onBack,
  onReply,
}: {
  accountId: string;
  uid: number;
  onBack: () => void;
  onReply: (to: string, subject: string) => void;
}) {
  const { data: msg, isLoading } = useMailMessage(accountId, uid);
  const [dl, setDl] = useState<number | null>(null);

  if (isLoading || !msg) {
    return (
      <div className="space-y-3 p-5">
        <Skeleton className="h-6 w-2/3" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  const download = async (index: number, filename: string) => {
    setDl(index);
    try {
      const blob = await webmailService.downloadAttachment(accountId, uid, index);
      triggerDownload(blob, filename);
    } catch {
      toast.error('Téléchargement impossible.');
    } finally {
      setDl(null);
    }
  };

  return (
    <>
      <div className="flex items-start gap-2 border-b border-surface-border p-4">
        <button onClick={onBack} className="mt-1 text-ink-muted hover:text-ink lg:hidden">
          <ArrowLeft size={18} />
        </button>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-lg font-semibold text-ink">{msg.subject}</h3>
          <p className="truncate text-sm text-ink-muted">De : {msg.from}</p>
          <p className="truncate text-xs text-ink-subtle">
            À : {msg.to} · {fmt(msg.date)}
          </p>
        </div>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => onReply(msg.from ?? '', `Re: ${msg.subject}`)}
        >
          Répondre
        </Button>
      </div>

      {msg.attachments.length > 0 && (
        <div className="flex flex-wrap gap-2 border-b border-surface-border p-3">
          {msg.attachments.map((a) => (
            <button
              key={a.index}
              onClick={() => void download(a.index, a.filename)}
              disabled={dl === a.index}
              className="inline-flex items-center gap-1.5 rounded-lg bg-surface-muted px-2.5 py-1.5 text-xs font-medium text-ink hover:text-brand-600"
            >
              <Paperclip size={13} /> {a.filename}
              <span className="text-ink-subtle">· {humanSize(a.size)}</span>
              <Download size={13} />
            </button>
          ))}
        </div>
      )}

      <div className="flex-1 overflow-auto bg-white">
        {msg.html ? (
          <iframe sandbox="" srcDoc={msg.html} title="message" className="h-full w-full border-0" />
        ) : (
          <pre className="whitespace-pre-wrap p-5 font-sans text-sm text-ink">{msg.text}</pre>
        )}
      </div>
    </>
  );
}

function Compose({
  accountId,
  initial,
  onClose,
}: {
  accountId: string;
  initial: Partial<SendInput>;
  onClose: () => void;
}) {
  const send = useSendMail(accountId);
  const [to, setTo] = useState(initial.to ?? '');
  const [subject, setSubject] = useState(initial.subject ?? '');
  const [body, setBody] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);

  const addFiles = (list: FileList | null) => {
    if (!list) return;
    setFiles((prev) => [...prev, ...Array.from(list)]);
  };
  const removeFile = (i: number) => setFiles((prev) => prev.filter((_, idx) => idx !== i));

  const submit = async () => {
    setError(null);
    if (!to.trim()) return setError('Destinataire requis.');
    if (files.reduce((s, f) => s + f.size, 0) > 15 * 1024 * 1024) {
      return setError('Pièces jointes trop volumineuses (15 Mo max au total).');
    }
    try {
      await send.mutateAsync({ input: { to: to.trim(), subject: subject.trim(), body }, files });
      onClose();
    } catch (err) {
      setError(apiErrorMessage(err, 'Envoi impossible.'));
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      size="lg"
      title="Nouveau message"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Annuler
          </Button>
          <Button onClick={() => void submit()} loading={send.isPending}>
            <Send size={16} /> Envoyer
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <Input label="À *" value={to} onChange={(e) => setTo(e.target.value)} placeholder="destinataire@exemple.com" />
        <Input label="Objet" value={subject} onChange={(e) => setSubject(e.target.value)} />
        <Textarea label="Message" rows={8} value={body} onChange={(e) => setBody(e.target.value)} />

        {files.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {files.map((f, i) => (
              <span key={i} className="inline-flex items-center gap-1.5 rounded-lg bg-surface-muted px-2.5 py-1.5 text-xs text-ink">
                <Paperclip size={13} className="text-ink-subtle" />
                <span className="max-w-[14rem] truncate">{f.name}</span>
                <span className="text-ink-subtle">· {humanSize(f.size)}</span>
                <button type="button" onClick={() => removeFile(i)} className="text-ink-subtle hover:text-danger">
                  <X size={13} />
                </button>
              </span>
            ))}
          </div>
        )}

        <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-surface-border px-3 py-1.5 text-sm font-medium text-ink-muted transition hover:text-ink">
          <Paperclip size={15} /> Joindre des fichiers
          <input type="file" multiple className="hidden" onChange={(e) => { addFiles(e.target.files); e.target.value = ''; }} />
        </label>

        {error && <p className="text-sm text-danger">{error}</p>}
      </div>
    </Modal>
  );
}
