import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart3, CalendarCheck, ShieldCheck } from 'lucide-react';
import { Button, Callout, Input } from '@drwindesk/ui';
import { useAuth } from '@/auth/AuthContext';
import { apiErrorMessage } from '@/lib/api';
import { USE_MOCKS } from '@/lib/config';
import { ThemeToggle } from '@/theme/ThemeToggle';

const LOGIN_BG =
  import.meta.env.VITE_LOGIN_BG ||
  'https://images.pexels.com/photos/3184292/pexels-photo-3184292.jpeg?auto=compress&cs=tinysrgb&w=1600';

const FEATURES = [
  { icon: ShieldCheck, text: 'RH, contrats & présences centralisés' },
  { icon: CalendarCheck, text: 'Congés, pointage et rapports automatisés' },
  { icon: BarChart3, text: 'Tableaux de bord et alertes en temps réel' },
];

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
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Panneau visuel (image Pexels animée) */}
      <div className="relative hidden overflow-hidden bg-brand-900 lg:block">
        <div
          className="absolute inset-0 animate-ken-burns bg-cover bg-center"
          style={{ backgroundImage: `url("${LOGIN_BG}")` }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-brand-900/85 via-brand-800/75 to-ink/85" />
        {/* Blobs animés */}
        <div className="absolute -left-24 top-1/4 h-72 w-72 animate-blob rounded-full bg-brand-500/30 blur-3xl" />
        <div className="absolute -right-16 bottom-10 h-80 w-80 animate-blob rounded-full bg-brand-400/20 blur-3xl [animation-delay:4s]" />

        <div className="relative z-10 flex h-full flex-col justify-between p-12 text-white">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15 text-lg font-bold backdrop-blur">
              D
            </span>
            <span className="text-xl font-semibold tracking-tight">DrwinDesk</span>
          </div>

          <div className="max-w-md">
            <h2 className="text-3xl font-bold leading-tight tracking-tight">
              L’intranet qui réunit toute votre entreprise.
            </h2>
            <p className="mt-3 text-white/70">
              De la vision à l’exécution — centralisez ce qui était dispersé, automatisez ce qui
              était répétitif.
            </p>
            <ul className="mt-8 space-y-3">
              {FEATURES.map((f) => (
                <li key={f.text} className="flex items-center gap-3 text-sm text-white/90">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/15 backdrop-blur">
                    <f.icon size={16} />
                  </span>
                  {f.text}
                </li>
              ))}
            </ul>
          </div>

          <p className="text-xs text-white/50">
            © {new Date().getFullYear()} Drwintech SaaS Solutions
          </p>
        </div>
      </div>

      {/* Panneau formulaire */}
      <div className="relative flex items-center justify-center bg-surface-muted px-4 py-12">
        <div className="absolute right-4 top-4">
          <ThemeToggle />
        </div>

        <div className="w-full max-w-sm animate-slide-up">
          <div className="mb-8 text-center lg:hidden">
            <span className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-600 text-lg font-bold text-white shadow-elevated">
              D
            </span>
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-ink">Bon retour 👋</h1>
          <p className="mt-1 text-sm text-ink-muted">Connectez-vous à votre espace collaborateur.</p>

          <form onSubmit={onSubmit} className="mt-7 flex flex-col gap-4">
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
            <Button type="submit" loading={loading} size="lg" className="mt-1 w-full">
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
        </div>
      </div>
    </div>
  );
}
