import { Laptop, LogOut, Moon, ShieldCheck, Sun, type LucideIcon } from 'lucide-react';
import { Avatar, Badge, Button, Callout, Card, CardDescription, CardTitle, cn } from '@drwindesk/ui';
import { displayName, useAuth } from '@/auth/AuthContext';
import { ORG_NAME } from '@/lib/config';
import { useTheme } from '@/theme/ThemeProvider';

const THEMES: { value: 'light' | 'dark' | 'system'; label: string; icon: LucideIcon }[] = [
  { value: 'light', label: 'Clair', icon: Sun },
  { value: 'dark', label: 'Sombre', icon: Moon },
  { value: 'system', label: 'Système', icon: Laptop },
];

const ROLE_LABEL: Record<string, string> = { admin: 'Administrateur', employee: 'Collaborateur' };

export function SettingsPage() {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const name = user ? displayName(user) : 'Collaborateur';

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header>
        <h2 className="text-2xl font-bold tracking-tight text-ink">Paramètres</h2>
        <p className="text-ink-muted">Votre profil, vos préférences et la sécurité de votre compte.</p>
      </header>

      {/* Profil */}
      <Card>
        <CardTitle>Profil</CardTitle>
        <div className="mt-4 flex items-center gap-4">
          <Avatar name={name} size="lg" />
          <div className="min-w-0">
            <p className="text-lg font-semibold text-ink">{name}</p>
            <p className="text-sm text-ink-muted">{user?.email}</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {(user?.roles ?? []).map((r) => (
                <Badge key={r} tone="brand">
                  {ROLE_LABEL[r] ?? r}
                </Badge>
              ))}
            </div>
          </div>
        </div>
        <dl className="mt-5 grid gap-4 border-t border-surface-border pt-5 sm:grid-cols-2">
          <div>
            <dt className="text-xs uppercase tracking-wide text-ink-subtle">Organisation</dt>
            <dd className="mt-0.5 text-sm text-ink">{ORG_NAME}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-ink-subtle">Email</dt>
            <dd className="mt-0.5 text-sm text-ink">{user?.email}</dd>
          </div>
        </dl>
        <p className="mt-4 text-xs text-ink-subtle">
          Pour modifier votre nom ou votre email, contactez un administrateur.
        </p>
      </Card>

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

      {/* Sécurité */}
      <Card>
        <CardTitle>Sécurité</CardTitle>
        <CardDescription>Gestion de l’accès à votre compte.</CardDescription>
        <Callout tone="info" icon={<ShieldCheck size={18} />} className="mt-4">
          Votre connexion est sécurisée (cookies httpOnly + protection CSRF). Le mot de passe se
          définit via le lien d’invitation reçu par email.
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
