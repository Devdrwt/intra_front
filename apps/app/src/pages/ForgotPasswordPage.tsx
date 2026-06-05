import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { MailCheck } from 'lucide-react';
import { Button, Callout, Card, Input } from '@drwindesk/ui';
import { authService } from '@/features/auth/service';
import { apiErrorMessage } from '@/lib/api';

/**
 * Page publique « mot de passe oublié ».
 * Appelle `POST /auth/forgot-password { tenantSlug, email }`. La réponse est
 * toujours générique (anti-énumération) : on affiche le même message de succès
 * que le compte existe ou non.
 */
export function ForgotPasswordPage() {
  const [tenantSlug, setTenantSlug] = useState('drwintech');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await authService.forgotPassword(tenantSlug.trim(), email.trim());
      setSent(true);
    } catch (err) {
      setError(apiErrorMessage(err, 'Service indisponible. Réessayez plus tard.'));
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
          <p className="mt-1 text-sm text-ink-muted">Réinitialiser votre mot de passe</p>
        </div>

        {sent ? (
          <div className="text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-success-soft text-success-soft-fg">
              <MailCheck size={22} />
            </div>
            <p className="text-sm text-ink">
              Si un compte est associé à cette adresse, un email contenant un lien de
              réinitialisation vient d’être envoyé.
            </p>
            <p className="mt-2 text-xs text-ink-subtle">Le lien est valable 1 heure.</p>
            <Link to="/login" className="mt-5 inline-block text-sm text-brand-600 hover:underline">
              Retour à la connexion
            </Link>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="flex flex-col gap-4">
            <p className="text-sm text-ink-muted">
              Saisissez votre organisation et votre email : nous vous enverrons un lien pour
              définir un nouveau mot de passe.
            </p>
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
            {error && <Callout tone="danger">{error}</Callout>}
            <Button type="submit" disabled={loading} className="mt-1">
              {loading ? 'Envoi…' : 'Envoyer le lien'}
            </Button>
            <Link
              to="/login"
              className="text-center text-sm text-ink-muted hover:text-brand-600 hover:underline"
            >
              Retour à la connexion
            </Link>
          </form>
        )}
      </Card>
    </div>
  );
}
