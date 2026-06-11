import { useState, type FormEvent } from 'react';
import { Plus, Power, ShieldCheck, SlidersHorizontal, Trash2, X } from 'lucide-react';
import { Avatar, Badge, Button, Callout, Card, EmptyState, Input, Modal, SkeletonRows, cn } from '@drwindesk/ui';
import type { BadgeProps } from '@drwindesk/ui';
import { apiErrorMessage } from '@/lib/api';
import { useDeleteUser, useInviteUser, useSetUserAccess, useUpdateUser, useUsers } from './hooks';
import {
  MODULE_GRANTS,
  ROLE_OPTIONS,
  STATUT_LABEL,
  userLabel,
  type InviteResult,
  type InviteUserInput,
  type User,
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
  const [accessUser, setAccessUser] = useState<User | null>(null);

  const toggleStatus = (id: string, current: UserStatus) =>
    update.mutate({ id, input: { status: current === 'DISABLED' ? 'ACTIVE' : 'DISABLED' } });

  const onDelete = (id: string, label: string) => {
    if (confirm(`Supprimer le compte de ${label} ? Cette action est irréversible.`)) {
      remove.mutate(id);
    }
  };

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-ink">Utilisateurs & accès</h2>
          <p className="text-ink-muted">Comptes du personnel, rôles et statut de connexion.</p>
        </div>
        <Button onClick={() => setOpen((v) => !v)} variant={open ? 'secondary' : 'primary'}>
          {open ? <X size={18} /> : <Plus size={18} />}
          {open ? 'Fermer' : 'Inviter'}
        </Button>
      </header>

      {open && <InvitePanel onDone={() => setOpen(false)} />}

      <Card className="overflow-hidden p-0">
        {isLoading ? (
          <SkeletonRows rows={5} cols={4} />
        ) : !users || users.length === 0 ? (
          <EmptyState
            icon={<ShieldCheck size={20} />}
            title="Aucun utilisateur"
            description="Invitez les membres de votre organisation à rejoindre DrwinDesk."
            action={
              <Button size="sm" onClick={() => setOpen(true)}>
                <Plus size={16} /> Inviter un membre
              </Button>
            }
          />
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-surface-border bg-surface-muted text-left text-xs uppercase tracking-wide text-ink-subtle">
              <tr>
                <th className="px-5 py-2.5 font-medium">Utilisateur</th>
                <th className="hidden px-5 py-2.5 font-medium sm:table-cell">Rôles</th>
                <th className="px-5 py-2.5 font-medium">Statut</th>
                <th className="hidden px-5 py-2.5 font-medium lg:table-cell">Dernière connexion</th>
                <th className="px-5 py-2.5 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-surface-border last:border-0">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar name={userLabel(u)} size="md" />
                      <div className="min-w-0">
                        <div className="truncate font-medium text-ink">{userLabel(u)}</div>
                        <div className="truncate text-xs text-ink-subtle">{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="hidden px-5 py-3 sm:table-cell">
                    <div className="flex flex-wrap gap-1">
                      {u.roles.map((r) => (
                        <Badge key={r} tone="brand">
                          {ROLE_OPTIONS.find((o) => o.key === r)?.label ?? r}
                        </Badge>
                      ))}
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <Badge tone={STATUT_TONE[u.status]} dot>
                      {STATUT_LABEL[u.status]}
                    </Badge>
                  </td>
                  <td className="hidden px-5 py-3 text-ink-muted lg:table-cell">
                    {fmt(u.lastLoginAt)}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="secondary" onClick={() => setAccessUser(u)}>
                        <SlidersHorizontal size={15} /> Accès
                      </Button>
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

      {accessUser && <AccessModal user={accessUser} onClose={() => setAccessUser(null)} />}
    </div>
  );
}

function AccessModal({ user, onClose }: { user: User; onClose: () => void }) {
  const setAccess = useSetUserAccess();
  const [granted, setGranted] = useState<string[]>(user.extraPermissions ?? []);
  const isAdmin = user.roles.includes('admin');

  const toggle = (perm: string) =>
    setGranted((g) => (g.includes(perm) ? g.filter((p) => p !== perm) : [...g, perm]));

  const save = async () => {
    await setAccess.mutateAsync({ id: user.id, permissions: granted });
    onClose();
  };

  return (
    <Modal
      open
      onClose={onClose}
      size="md"
      title="Accès aux modules"
      description={userLabel(user)}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Annuler
          </Button>
          <Button onClick={() => void save()} loading={setAccess.isPending} disabled={isAdmin}>
            Enregistrer
          </Button>
        </>
      }
    >
      {isAdmin ? (
        <Callout tone="info">
          Cet utilisateur est <strong>administrateur</strong> : il a déjà accès à tout.
        </Callout>
      ) : (
        <p className="text-sm text-ink-muted">
          Activez les modules d’administration auxquels {userLabel(user)} doit accéder, en plus de
          son rôle.
        </p>
      )}

      <div className="mt-4 space-y-1.5">
        {MODULE_GRANTS.map((m) => {
          const on = granted.includes(m.permission);
          return (
            <button
              key={m.permission}
              type="button"
              disabled={isAdmin}
              onClick={() => toggle(m.permission)}
              className={cn(
                'flex w-full items-center justify-between rounded-xl border px-3 py-2.5 text-sm font-medium transition-colors disabled:opacity-50',
                on
                  ? 'border-brand-500 bg-brand-soft text-brand-soft-fg'
                  : 'border-surface-border text-ink-muted hover:bg-surface-muted hover:text-ink',
              )}
            >
              {m.label}
              <span
                className={cn(
                  'flex h-5 w-9 items-center rounded-full p-0.5 transition-colors',
                  on ? 'justify-end bg-brand-600' : 'justify-start bg-surface-border',
                )}
              >
                <span className="h-4 w-4 rounded-full bg-white" />
              </span>
            </button>
          );
        })}
      </div>
    </Modal>
  );
}

function InvitePanel({ onDone }: { onDone: () => void }) {
  const invite = useInviteUser();
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [roleKeys, setRoleKeys] = useState<string[]>(['employee']);
  const [emailError, setEmailError] = useState<string | undefined>();
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<InviteResult | null>(null);

  const toggleRole = (key: string) =>
    setRoleKeys((rk) => (rk.includes(key) ? rk.filter((k) => k !== key) : [...rk, key]));

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    const value = email.trim();
    if (!value) return setEmailError('L’email est requis.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return setEmailError('Adresse email invalide.');
    setEmailError(undefined);
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
      <form onSubmit={onSubmit} className="grid gap-4" noValidate>
        <Input
          id="email"
          type="email"
          label="Email *"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (emailError) setEmailError(undefined);
          }}
          placeholder="prenom.nom@drwintech.com"
          error={emailError}
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

        {error && <Callout tone="danger">{error}</Callout>}

        <div className="flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={onDone}>
            Annuler
          </Button>
          <Button type="submit" loading={invite.isPending}>
            Inviter
          </Button>
        </div>
      </form>
    </Card>
  );
}
