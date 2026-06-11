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
} from 'lucide-react';
import { Button, Card, EmptyState, Input, Modal, Skeleton, Textarea, cn } from '@drwindesk/ui';
import { apiErrorMessage } from '@/lib/api';
import { triggerDownload, humanSize } from '@/lib/download';
import { toast } from '@/lib/toast';
import { useInbox, useMailAccount, useMailMessage, useSendMail } from './hooks';
import { webmailService } from './service';
import type { SendInput } from './types';

const fmt = (iso: string | null) =>
  iso
    ? new Date(iso).toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
    : '';

export function MailPage() {
  const { data: account, isLoading: loadingAccount } = useMailAccount();
  const configured = account?.configured;
  const { data: inbox, isLoading, isError, refetch, isFetching } = useInbox(Boolean(configured));
  const [uid, setUid] = useState<number | null>(null);
  const [mobileRead, setMobileRead] = useState(false);
  const [compose, setCompose] = useState<Partial<SendInput> | null>(null);

  if (loadingAccount) {
    return <Skeleton className="h-64 w-full rounded-2xl" />;
  }

  if (!configured) {
    return (
      <div className="space-y-4">
        <header>
          <h2 className="text-2xl font-bold tracking-tight text-ink">Mail</h2>
        </header>
        <Card className="p-0">
          <EmptyState
            icon={<Mail size={22} />}
            title="Messagerie non configurée"
            description="Connectez votre boîte email pour lire et envoyer vos mails ici."
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

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-ink">Mail</h2>
          <p className="text-ink-muted">{account?.email}</p>
        </div>
        <Button onClick={() => setCompose({})}>
          <PenSquare size={16} /> Écrire
        </Button>
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
          {uid == null ? (
            <EmptyState icon={<Mail size={20} />} title="Sélectionnez un message" className="m-auto" />
          ) : (
            <Reader uid={uid} onBack={() => setMobileRead(false)} onReply={(to, subject) => setCompose({ to, subject })} />
          )}
        </section>
      </Card>

      {compose && <Compose initial={compose} onClose={() => setCompose(null)} />}
    </div>
  );
}

function Reader({
  uid,
  onBack,
  onReply,
}: {
  uid: number;
  onBack: () => void;
  onReply: (to: string, subject: string) => void;
}) {
  const { data: msg, isLoading } = useMailMessage(uid);
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
      const blob = await webmailService.downloadAttachment(uid, index);
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

function Compose({ initial, onClose }: { initial: Partial<SendInput>; onClose: () => void }) {
  const send = useSendMail();
  const [to, setTo] = useState(initial.to ?? '');
  const [subject, setSubject] = useState(initial.subject ?? '');
  const [body, setBody] = useState('');
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setError(null);
    if (!to.trim()) return setError('Destinataire requis.');
    try {
      await send.mutateAsync({ to: to.trim(), subject: subject.trim(), body });
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
        <Textarea label="Message" rows={10} value={body} onChange={(e) => setBody(e.target.value)} />
        {error && <p className="text-sm text-danger">{error}</p>}
      </div>
    </Modal>
  );
}
