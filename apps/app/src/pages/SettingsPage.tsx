import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Camera, KeyRound, Laptop, LogOut, Moon, ShieldCheck, SlidersHorizontal, Sun, Trash2, type LucideIcon } from 'lucide-react';
import {
  Avatar,
  Badge,
  Button,
  Callout,
  Card,
  CardDescription,
  CardTitle,
  Input,
  cn,
} from '@drwindesk/ui';
import { displayName, hasPermission, useAuth } from '@/auth/AuthContext';
import { apiErrorMessage } from '@/lib/api';
import { ORG_NAME } from '@/lib/config';
import { useTheme } from '@/theme/ThemeProvider';
import { ReferentielsSection } from '@/features/settings/ReferentielsSection';
import { OrgLogoCard } from '@/features/settings/OrgLogoCard';
import { WorkHoursCard } from '@/features/settings/WorkHoursCard';
import { MailAccountSection } from '@/features/webmail/MailAccountSection';
import { MobileAppCard } from '@/features/settings/MobileAppCard';
import { avatarUrl } from '@/lib/avatar';
import { toast } from '@/lib/toast';
import {
  useChangePassword,
  useMyProfile,
  useRemoveAvatar,
  useUpdateProfile,
  useUploadAvatar,
} from '@/features/me/hooks';

const THEMES: { value: 'light' | 'dark' | 'system'; label: string; icon: LucideIcon }[] = [
  { value: 'light', label: 'Clair', icon: Sun },
  { value: 'dark', label: 'Sombre', icon: Moon },
  { value: 'system', label: 'Système', icon: Laptop },
];

const ROLE_LABEL: Record<string, string> = { admin: 'Administrateur', employee: 'Collaborateur' };

export function SettingsPage() {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const canManageOrg = hasPermission(user, 'settings:manage');

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header>
        <h2 className="text-2xl font-bold tracking-tight text-ink">Paramètres</h2>
        <p className="text-ink-muted">Votre profil, vos préférences et la sécurité de votre compte.</p>
      </header>

      <ProfileCard />

      {/* Apparence */}
      <Card>
        <CardTitle>Apparence</CardTitle>
        <CardDescription>Choisissez le thème de l’interface.</CardDescription>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {THEMES.map((t) => {
            const active = theme === t.value;
            return (
              <button
                key={t.value}
                onClick={() => setTheme(t.value)}
                className={cn(
                  'flex items-center gap-3 rounded-xl border px-4 py-3 text-sm font-medium transition-colors',
                  active
                    ? 'border-brand-500 bg-brand-soft text-brand-soft-fg'
                    : 'border-surface-border text-ink-muted hover:bg-surface-muted hover:text-ink',
                )}
              >
                <t.icon size={18} />
                {t.label}
                {active && <span className="ml-auto h-2 w-2 rounded-full bg-brand-600" />}
              </button>
            );
          })}
        </div>
      </Card>

      {canManageOrg && (
        <section className="space-y-4">
          <div className="flex items-center gap-2 pt-2">
            <SlidersHorizontal size={18} className="text-ink-subtle" />
            <h3 className="text-sm font-semibold uppercase tracking-wide text-ink-subtle">Organisation</h3>
          </div>
          <OrgLogoCard />
          <WorkHoursCard />
          <Callout tone="info">
            Définissez les départements et services de votre organisation. Ils alimentent les
            formulaires RH, les présences et la consolidation des rapports.
          </Callout>
          <ReferentielsSection />
        </section>
      )}

      <MailAccountSection />

      <MobileAppCard />

      <PasswordCard />

      {/* Sécurité */}
      <Card>
        <CardTitle>Session</CardTitle>
        <Callout tone="info" icon={<ShieldCheck size={18} />} className="mt-4">
          Votre connexion est sécurisée (cookies httpOnly + protection CSRF).
        </Callout>
        <div className="mt-4">
          <Button variant="secondary" onClick={logout}>
            <LogOut size={16} /> Se déconnecter
          </Button>
        </div>
      </Card>

      <p className="text-center text-xs text-ink-subtle">DrwinDesk — {ORG_NAME}</p>
    </div>
  );
}

function ProfileCard() {
  const { user } = useAuth();
  const { data: profile } = useMyProfile();
  const update = useUpdateProfile();
  const upAvatar = useUploadAvatar();
  const rmAvatar = useRemoveAvatar();
  const fileRef = useRef<HTMLInputElement>(null);
  const [avatarV, setAvatarV] = useState(0);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [telephone, setTelephone] = useState('');
  const [error, setError] = useState<string | null>(null);

  const onPickAvatar = async (file: File | null) => {
    if (!file) return;
    try {
      await upAvatar.mutateAsync(file);
      setAvatarV(Date.now()); // casse le cache de l'<img>
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Téléversement impossible.'));
    } finally {
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  useEffect(() => {
    if (profile) {
      setFirstName(profile.firstName ?? '');
      setLastName(profile.lastName ?? '');
      setTelephone(profile.telephone ?? '');
    }
  }, [profile]);

  const name =
    [firstName, lastName].filter(Boolean).join(' ').trim() ||
    (user ? displayName(user) : 'Collaborateur');

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await update.mutateAsync({ firstName, lastName, telephone });
    } catch (err) {
      setError(apiErrorMessage(err, 'Mise à jour impossible.'));
    }
  };

  return (
    <Card>
      <CardTitle>Profil</CardTitle>
      <div className="mt-4 flex items-center gap-4">
        <div className="group relative">
          <Avatar
            name={name}
            src={user ? avatarUrl(user.userId, profile?.hasAvatar ?? false, avatarV || undefined) : undefined}
            size="lg"
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={upAvatar.isPending}
            className="absolute inset-0 flex items-center justify-center rounded-full bg-ink/50 text-white opacity-0 transition-opacity hover:opacity-100"
            title="Changer la photo"
          >
            <Camera size={18} />
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            className="hidden"
            onChange={(e) => void onPickAvatar(e.target.files?.[0] ?? null)}
          />
        </div>
        <div className="min-w-0">
          <p className="text-lg font-semibold text-ink">{name}</p>
          <p className="text-sm text-ink-muted">{profile?.email ?? user?.email}</p>
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            {(user?.roles ?? []).map((r) => (
              <Badge key={r} tone="brand">
                {ROLE_LABEL[r] ?? r}
              </Badge>
            ))}
            {profile?.hasAvatar && (
              <button
                type="button"
                onClick={() => rmAvatar.mutate()}
                className="inline-flex items-center gap-1 text-xs text-ink-subtle hover:text-danger"
              >
                <Trash2 size={12} /> Retirer la photo
              </button>
            )}
          </div>
        </div>
      </div>

      <form onSubmit={onSubmit} noValidate className="mt-5 space-y-4 border-t border-surface-border pt-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Prénom" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
          <Input label="Nom" value={lastName} onChange={(e) => setLastName(e.target.value)} />
          <Input
            label="Téléphone"
            value={telephone}
            onChange={(e) => setTelephone(e.target.value)}
            hint={profile && !profile.poste ? undefined : 'Reporté sur votre fiche RH'}
          />
          <Input label="Email" value={profile?.email ?? user?.email ?? ''} disabled hint="Géré par l’administrateur" />
        </div>
        {error && <Callout tone="danger">{error}</Callout>}
        <div className="flex justify-end">
          <Button type="submit" loading={update.isPending}>
            Enregistrer
          </Button>
        </div>
      </form>
    </Card>
  );
}

function PasswordCard() {
  const change = useChangePassword();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (next.length < 8) return setError('Le nouveau mot de passe doit faire au moins 8 caractères.');
    if (next !== confirm) return setError('Les deux mots de passe ne correspondent pas.');
    try {
      await change.mutateAsync({ currentPassword: current, newPassword: next });
      setCurrent('');
      setNext('');
      setConfirm('');
    } catch (err) {
      setError(apiErrorMessage(err, 'Changement impossible.'));
    }
  };

  return (
    <Card>
      <CardTitle>Mot de passe</CardTitle>
      <CardDescription>Modifiez le mot de passe de votre compte.</CardDescription>
      <form onSubmit={onSubmit} noValidate className="mt-4 space-y-4">
        <Input
          type="password"
          label="Mot de passe actuel"
          value={current}
          onChange={(e) => setCurrent(e.target.value)}
          autoComplete="current-password"
          required
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            type="password"
            label="Nouveau mot de passe"
            value={next}
            onChange={(e) => setNext(e.target.value)}
            autoComplete="new-password"
            placeholder="Au moins 8 caractères"
            required
          />
          <Input
            type="password"
            label="Confirmer"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            autoComplete="new-password"
            required
          />
        </div>
        {error && <Callout tone="danger">{error}</Callout>}
        <div className="flex justify-end">
          <Button type="submit" loading={change.isPending} disabled={!current || !next || !confirm}>
            <KeyRound size={16} /> Changer le mot de passe
          </Button>
        </div>
      </form>
    </Card>
  );
}
