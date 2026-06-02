import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Callout, Card, Input } from '@drwindesk/ui';
import { useAuth } from '@/auth/AuthContext';
import { apiErrorMessage } from '@/lib/api';
import { USE_MOCKS } from '@/lib/config';
import { ThemeToggle } from '@/theme/ThemeToggle';

export function LoginPage() {
  const { login, loading } = useAuth();
  const navigate = useNavigate();
  const [tenantSlug, setTenantSlug] = useState('drwintech');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await login(tenantSlug, email, password);
      navigate('/', { replace: true });
    } catch (err) {
      setError(apiErrorMessage(err, 'Identifiants invalides ou service indisponible.'));
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-surface-muted px-4">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center text-center">
          <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-600 text-lg font-bold text-white shadow-elevated">
            D
          </span>
          <h1 className="text-xl font-semibold tracking-tight text-ink">
            Drwin<span className="text-brand-600">Desk</span>
          </h1>
          <p className="mt-1 text-sm text-ink-muted">Connectez-vous à votre espace</p>
        </div>

        <Card className="animate-slide-up">
          <form onSubmit={onSubmit} className="flex flex-col gap-4">
            <Input
              id="tenantSlug"
              label="Organisation"
              value={tenantSlug}
              onChange={(e) => setTenantSlug(e.target.value)}
              placeholder="drwintech"
              autoComplete="organization"
              required
            />
            <Input
              id="email"
              type="email"
              label="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="vous@drwintech.com"
              autoComplete="username"
              required
            />
            <Input
              id="password"
              type="password"
              label="Mot de passe"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
            {error && <Callout tone="danger">{error}</Callout>}
            <Button type="submit" loading={loading} className="mt-1 w-full">
              Se connecter
            </Button>
          </form>

          {USE_MOCKS.auth && (
            <div className="mt-4 border-t border-surface-border pt-4">
              <Button
                type="button"
                variant="secondary"
                className="w-full"
                disabled={loading}
                onClick={async () => {
                  setError(null);
                  try {
                    await login('drwintech', 'admin@drwintech.com', 'demo');
                    navigate('/', { replace: true });
                  } catch {
                    setError('Connexion démo impossible.');
                  }
                }}
              >
                Connexion démo (sans backend)
              </Button>
            </div>
          )}
        </Card>

        <p className="mt-6 text-center text-xs text-ink-subtle">
          © {new Date().getFullYear()} Drwintech SaaS Solutions
        </p>
      </div>
    </div>
  );
}
