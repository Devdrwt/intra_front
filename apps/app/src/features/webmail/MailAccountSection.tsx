import { useState, type FormEvent } from 'react';
import { Mail, Plug, Plus, Unplug } from 'lucide-react';
import { Badge, Button, Callout, Card, CardDescription, CardTitle, Input } from '@drwindesk/ui';
import { apiErrorMessage } from '@/lib/api';
import { useAddMailAccount, useMailAccounts, useRemoveMailAccount } from './hooks';
import type { SaveAccountInput } from './types';

const EMPTY: SaveAccountInput = {
  label: '',
  email: '',
  password: '',
  imapHost: 'imap.hostinger.com',
  imapPort: 993,
  smtpHost: 'smtp.hostinger.com',
  smtpPort: 465,
};

export function MailAccountSection() {
  const { data: accounts } = useMailAccounts();
  const add = useAddMailAccount();
  const remove = useRemoveMailAccount();

  const [showForm, setShowForm] = useState(false);
  const [advanced, setAdvanced] = useState(false);
  const [form, setForm] = useState<SaveAccountInput>(EMPTY);
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof SaveAccountInput>(k: K, v: SaveAccountInput[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await add.mutateAsync(form);
      setForm(EMPTY);
      setShowForm(false);
    } catch (err) {
      setError(apiErrorMessage(err, 'Connexion impossible.'));
    }
  };

  const list = accounts ?? [];

  return (
    <Card>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Mail size={18} className="text-ink-subtle" />
          <CardTitle>Messagerie email</CardTitle>
        </div>
        {list.length > 0 && <Badge tone="success" dot>{list.length} boîte{list.length > 1 ? 's' : ''}</Badge>}
      </div>
      <CardDescription>
        Connectez une ou plusieurs boîtes (Gmail, Outlook, Hostinger…) pour les lire et envoyer depuis l'intranet.
      </CardDescription>

      {list.length > 0 && (
        <ul className="mt-4 space-y-2">
          {list.map((a) => (
            <li key={a.id} className="flex items-center justify-between gap-3 rounded-xl border border-surface-border px-3 py-2">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-ink">{a.label}</p>
                <p className="truncate text-xs text-ink-subtle">
                  {a.email} · IMAP {a.imapHost}:{a.imapPort} · SMTP {a.smtpHost}:{a.smtpPort}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => remove.mutate(a.id)}
                disabled={remove.isPending}
                className="shrink-0 text-danger hover:bg-danger-soft"
              >
                <Unplug size={15} /> Déconnecter
              </Button>
            </li>
          ))}
        </ul>
      )}

      {!showForm ? (
        <div className="mt-4">
          <Button variant="secondary" size="sm" onClick={() => setShowForm(true)}>
            <Plus size={15} /> Ajouter une boîte
          </Button>
        </div>
      ) : (
        <form onSubmit={onSubmit} noValidate className="mt-4 space-y-4">
          <Callout tone="info">
            Votre mot de passe est <strong>chiffré</strong> avant stockage et ne sert qu'à relever votre
            boîte. La connexion est testée avant enregistrement.
          </Callout>
          <Input
            label="Nom de la boîte"
            value={form.label}
            onChange={(e) => set('label', e.target.value)}
            placeholder="Perso, Support, Compta…"
          />
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
            <Button type="button" variant="secondary" onClick={() => { setShowForm(false); setError(null); }}>
              Annuler
            </Button>
            <Button type="submit" loading={add.isPending}>
              <Plug size={16} /> Tester &amp; connecter
            </Button>
          </div>
        </form>
      )}
    </Card>
  );
}
