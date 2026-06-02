import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Button, Callout, Card, Input } from '@drwindesk/ui';
import { authService } from '@/features/auth/service';
import { apiErrorMessage } from '@/lib/api';

/**
 * Page publique de définition du mot de passe (lien d'invitation reçu par email).
 * Le lien est de la forme `<FRONT_APP_URL>/set-password?token=…`.
 * Appelle `POST /auth/set-password { token, password }` puis renvoie au login.
 */
export function SetPasswordPage() {
  const [params] = useSearchParams();
  const token = params.get('token') ?? '';
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 8) return setError('Le mot de passe doit faire au moins 8 caractères.');
    if (password !== confirm) return setError('Les deux mots de passe ne correspondent pas.');
    setLoading(true);
    try {
      await authService.setPassword(token, password);
      setDone(true);
      setTimeout(() => navigate('/login', { replace: true }), 1800);
    } catch (err) {
      setError(apiErrorMessage(err, 'Lien invalide ou expiré.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-muted px-4">
      <Card className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <div className="text-xl font-semibold text-ink">
            Drwin<span className="text-brand-600">Desk</span>
          </div>
          <p className="mt-1 text-sm text-ink-muted">Définir votre mot de passe</p>
        </div>

        {!token ? (
          <div className="text-center">
            <p className="text-sm text-danger">Lien d’invitation invalide (token manquant).</p>
            <Link to="/login" className="mt-4 inline-block text-sm text-brand-600 hover:underline">
              Aller à la connexion
            </Link>
          </div>
        ) : done ? (
          <div className="text-center">
            <p className="text-sm text-ink">Mot de passe défini ✅</p>
            <p className="mt-1 text-sm text-ink-muted">Redirection vers la connexion…</p>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="flex flex-col gap-4">
            <Input
              id="password"
              type="password"
              label="Nouveau mot de passe"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              placeholder="Au moins 8 caractères"
              required
            />
            <Input
              id="confirm"
              type="password"
              label="Confirmer le mot de passe"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              autoComplete="new-password"
              required
            />
            {error && <Callout tone="danger">{error}</Callout>}
            <Button type="submit" disabled={loading} className="mt-2">
              {loading ? 'Validation…' : 'Définir le mot de passe'}
            </Button>
          </form>
        )}
      </Card>
    </div>
  );
}
