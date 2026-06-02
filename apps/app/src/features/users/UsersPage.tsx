import { useState, type FormEvent } from 'react';
import { Plus, Power, ShieldCheck, Trash2, X } from 'lucide-react';
import { Badge, Button, Card, Input, Spinner, cn } from '@drwindesk/ui';
import type { BadgeProps } from '@drwindesk/ui';
import { apiErrorMessage } from '@/lib/api';
import { useDeleteUser, useInviteUser, useUpdateUser, useUsers } from './hooks';
import {
  ROLE_OPTIONS,
  STATUT_LABEL,
  userLabel,
  type InviteResult,
  type InviteUserInput,
  type UserStatus,
} from './types';

const STATUT_TONE: Record<UserStatus, NonNullable<BadgeProps['tone']>> = {
  ACTIVE: 'success',
  INVITED: 'warning',
  DISABLED: 'neutral',
};

function fmt(iso?: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? '—'
    : d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function UsersPage() {
  const { data: users, isLoading } = useUsers();
  const update = useUpdateUser();
  const remove = useDeleteUser();
  const [open, setOpen] = useState(false);

  const toggleStatus = (id: string, current: UserStatus) =>
    update.mutate({ id, input: { status: current === 'DISABLED' ? 'ACTIVE' : 'DISABLED' } });

  const onDelete = (id: string, label: string) => {
    if (confirm(`Supprimer le compte de ${label} ? Cette action est irréversible.`)) {
      remove.mutate(id);
    }
  };

  return (
    <div>
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink">Utilisateurs & accès</h1>
          <p className="text-ink-muted">Comptes du personnel, rôles et statut de connexion.</p>
        </div>
        <Button onClick={() => setOpen((v) => !v)}>
          {open ? <X size={18} /> : <Plus size={18} />}
          {open ? 'Fermer' : 'Inviter'}
        </Button>
      </header>

      {open && <InvitePanel onDone={() => setOpen(false)} />}

      <Card className="overflow-hidden p-0">
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Spinner />
          </div>
        ) : !users || users.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-16 text-center">
            <ShieldCheck className="text-ink-subtle" />
            <p className="text-ink-muted">Aucun utilisateur.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-surface-border bg-surface-muted text-left text-xs uppercase text-ink-subtle">
              <tr>
                <th className="px-5 py-3 font-medium">Utilisateur</th>
                <th className="px-5 py-3 font-medium">Rôles</th>
                <th className="px-5 py-3 font-medium">Statut</th>
                <th className="px-5 py-3 font-medium">Dernière connexion</th>
                <th className="px-5 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-surface-border last:border-0">
                  <td className="px-5 py-3">
                    <div className="font-medium text-ink">{userLabel(u)}</div>
                    <div className="text-xs text-ink-subtle">{u.email}</div>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex flex-wrap gap-1">
                      {u.roles.map((r) => (
                        <Badge key={r} tone="brand">
                          {ROLE_OPTIONS.find((o) => o.key === r)?.label ?? r}
                        </Badge>
                      ))}
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <Badge tone={STATUT_TONE[u.status]}>{STATUT_LABEL[u.status]}</Badge>
                  </td>
                  <td className="px-5 py-3 text-ink-muted">{fmt(u.lastLoginAt)}</td>
                  <td className="px-5 py-3">
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        disabled={update.isPending}
                        onClick={() => toggleStatus(u.id, u.status)}
                      >
                        <Power size={15} />
                        {u.status === 'DISABLED' ? 'Activer' : 'Désactiver'}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={remove.isPending}
                        onClick={() => onDelete(u.id, userLabel(u))}
                      >
                        <Trash2 size={15} />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}

function InvitePanel({ onDone }: { onDone: () => void }) {
  const invite = useInviteUser();
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [roleKeys, setRoleKeys] = useState<string[]>(['employee']);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<InviteResult | null>(null);

  const toggleRole = (key: string) =>
    setRoleKeys((rk) => (rk.includes(key) ? rk.filter((k) => k !== key) : [...rk, key]));

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (roleKeys.length === 0) return setError('Sélectionnez au moins un rôle.');
    try {
      const input: InviteUserInput = {
        email,
        firstName: firstName || undefined,
        lastName: lastName || undefined,
        roleKeys,
      };
      const res = await invite.mutateAsync(input);
      setResult(res);
      setEmail('');
      setFirstName('');
      setLastName('');
    } catch (err) {
      // Remonte le message backend (ex. domaine email non autorisé).
      setError(apiErrorMessage(err, 'Invitation impossible.'));
    }
  };

  if (result) {
    return (
      <Card className="mb-4 border-brand-200">
        <h3 className="text-base font-semibold text-ink">Invitation créée ✅</h3>
        {result.tempPassword ? (
          <>
            <p className="mt-1 text-sm text-ink-muted">
              Mot de passe temporaire à communiquer à {result.user.email} (à changer à la 1ʳᵉ
              connexion) :
            </p>
            <code className="mt-2 block rounded-lg bg-surface-muted px-3 py-2 font-mono text-sm text-ink">
              {result.tempPassword}
            </code>
          </>
        ) : (
          <p className="mt-1 text-sm text-ink-muted">
            Un lien d’invitation a été envoyé à <strong>{result.user.email}</strong> pour définir
            son mot de passe.
          </p>
        )}
        <div className="mt-4 flex gap-2">
          <Button variant="secondary" onClick={() => setResult(null)}>
            Inviter un autre
          </Button>
          <Button onClick={onDone}>Terminé</Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="mb-4">
      <form onSubmit={onSubmit} className="grid gap-4">
        <Input
          id="email"
          type="email"
          label="Email *"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="prenom.nom@drwintech.com"
          required
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            id="firstName"
            label="Prénom"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
          />
          <Input
            id="lastName"
            label="Nom"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
          />
        </div>
        <div>
          <span className="text-sm font-medium text-ink">Rôles *</span>
          <div className="mt-2 flex flex-wrap gap-2">
            {ROLE_OPTIONS.map((r) => (
              <button
                type="button"
                key={r.key}
                onClick={() => toggleRole(r.key)}
                className={cn(
                  'rounded-xl border px-3 py-1.5 text-sm transition-colors',
                  roleKeys.includes(r.key)
                    ? 'border-brand-500 bg-brand-50 text-brand-700'
                    : 'border-surface-border text-ink-muted hover:bg-surface-muted',
                )}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        {error && <p className="text-sm text-danger">{error}</p>}

        <div className="flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={onDone}>
            Annuler
          </Button>
          <Button type="submit" disabled={invite.isPending}>
            {invite.isPending ? 'Envoi…' : 'Inviter'}
          </Button>
        </div>
      </form>
    </Card>
  );
}
