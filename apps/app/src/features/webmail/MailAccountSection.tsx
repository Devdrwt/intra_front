import { useState, type FormEvent } from 'react';
import { Mail, Plug, Unplug } from 'lucide-react';
import { Badge, Button, Callout, Card, CardDescription, CardTitle, Input } from '@drwindesk/ui';
import { apiErrorMessage } from '@/lib/api';
import { useMailAccount, useRemoveMailAccount, useSaveMailAccount } from './hooks';
import type { SaveAccountInput } from './types';

export function MailAccountSection() {
  const { data: account } = useMailAccount();
  const save = useSaveMailAccount();
  const remove = useRemoveMailAccount();

  const [open, setOpen] = useState(false);
  const [advanced, setAdvanced] = useState(false);
  const [form, setForm] = useState<SaveAccountInput>({
    email: '',
    password: '',
    imapHost: 'imap.hostinger.com',
    imapPort: 993,
    smtpHost: 'smtp.hostinger.com',
    smtpPort: 465,
  });
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof SaveAccountInput>(k: K, v: SaveAccountInput[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await save.mutateAsync(form);
      setForm((f) => ({ ...f, password: '' }));
      setOpen(false);
    } catch (err) {
      setError(apiErrorMessage(err, 'Connexion impossible.'));
    }
  };

  const configured = account?.configured;

  return (
    <Card>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Mail size={18} className="text-ink-subtle" />
          <CardTitle>Messagerie email</CardTitle>
        </div>
        {configured && <Badge tone="success" dot>Connectée</Badge>}
      </div>
      <CardDescription>
        Connectez votre boîte Hostinger pour lire et envoyer vos mails depuis l'intranet.
      </CardDescription>

      {configured && !open ? (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div className="text-sm">
            <p className="font-medium text-ink">{account?.email}</p>
            <p className="text-xs text-ink-subtle">
              IMAP {account?.imapHost}:{account?.imapPort} · SMTP {account?.smtpHost}:{account?.smtpPort}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={() => setOpen(true)}>
              <Plug size={15} /> Reconfigurer
            </Button>
            <Button variant="ghost" size="sm" onClick={() => remove.mutate()} disabled={remove.isPending}>
              <Unplug size={15} /> Déconnecter
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={onSubmit} noValidate className="mt-4 space-y-4">
          <Callout tone="info">
            Votre mot de passe est <strong>chiffré</strong> avant stockage et ne sert qu'à relever
            votre boîte. La connexion est testée avant enregistrement.
          </Callout>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              type="email"
              label="Adresse email *"
              value={form.email}
              onChange={(e) => set('email', e.target.value)}
              placeholder="prenom@drwintech.com"
              required
            />
            <Input
              type="password"
              label="Mot de passe email *"
              value={form.password}
              onChange={(e) => set('password', e.target.value)}
              autoComplete="off"
              required
            />
          </div>

          <button
            type="button"
            onClick={() => setAdvanced((v) => !v)}
            className="text-xs font-medium text-brand-600 hover:underline"
          >
            {advanced ? 'Masquer' : 'Réglages avancés (serveurs)'}
          </button>
          {advanced && (
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Serveur IMAP" value={form.imapHost} onChange={(e) => set('imapHost', e.target.value)} />
              <Input type="number" label="Port IMAP" value={form.imapPort} onChange={(e) => set('imapPort', Number(e.target.value))} />
              <Input label="Serveur SMTP" value={form.smtpHost} onChange={(e) => set('smtpHost', e.target.value)} />
              <Input type="number" label="Port SMTP" value={form.smtpPort} onChange={(e) => set('smtpPort', Number(e.target.value))} />
            </div>
          )}

          {error && <Callout tone="danger">{error}</Callout>}
          <div className="flex justify-end gap-3">
            {configured && (
              <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
                Annuler
              </Button>
            )}
            <Button type="submit" loading={save.isPending}>
              <Plug size={16} /> Tester &amp; connecter
            </Button>
          </div>
        </form>
      )}
    </Card>
  );
}
