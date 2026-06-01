import { Card, CardTitle, CardDescription, Badge } from '@drwindesk/ui';
import { displayName, useAuth } from '@/auth/AuthContext';

const stats = [
  { label: 'Collaborateurs actifs', value: '—', tone: 'brand' as const },
  { label: 'Contrats à échéance (30j)', value: '—', tone: 'warning' as const },
  { label: 'Rapports du jour remis', value: '—', tone: 'success' as const },
  { label: 'Demandes de congés en attente', value: '—', tone: 'neutral' as const },
];

export function DashboardPage() {
  const { user } = useAuth();
  return (
    <div>
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-ink">
          Bonjour {user ? displayName(user).split(' ')[0] : ''} 👋
        </h1>
        <p className="text-ink-muted">Voici l’état de votre espace aujourd’hui.</p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <Badge tone={s.tone}>{s.label}</Badge>
            <p className="mt-3 text-3xl font-bold text-ink">{s.value}</p>
          </Card>
        ))}
      </div>

      <Card className="mt-6">
        <CardTitle>Prochaines étapes</CardTitle>
        <CardDescription>
          Données fictives. Brancher chaque carte sur l’API NestJS (endpoints par module) puis
          dérouler les modules un à un.
        </CardDescription>
      </Card>
    </div>
  );
}
