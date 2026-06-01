import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, Input } from '@drwindesk/ui';
import { useAuth } from '@/auth/AuthContext';
import { USE_MOCKS } from '@/lib/config';

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
    } catch {
      setError('Identifiants invalides ou service indisponible.');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-muted px-4">
      <Card className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <div className="text-xl font-semibold text-ink">
            Drwin<span className="text-brand-600">Desk</span>
          </div>
          <p className="mt-1 text-sm text-ink-muted">Espace collaborateur</p>
        </div>

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
            error={error ?? undefined}
          />
          <Button type="submit" disabled={loading} className="mt-2">
            {loading ? 'Connexion…' : 'Se connecter'}
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
    </div>
  );
}
