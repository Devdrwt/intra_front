import { Link } from 'react-router-dom';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Badge, Card, CardTitle } from '@drwindesk/ui';
import { useApprovalInbox } from '@/features/approvals/hooks';
import { usePointagesDuJour } from '@/features/presences/hooks';
import { useEmployes } from '@/features/rh/hooks';

/** Alertes opérationnelles pour managers/RH : validations en retard, pointages manquants. */
export function OpsAlertsCard() {
  const { data: inbox } = useApprovalInbox();
  const { data: pointages } = usePointagesDuJour();
  const { data: employes } = useEmployes({});

  const now = Date.now();
  const slaLate = (inbox ?? []).filter((t) => t.slaDueAt && new Date(t.slaDueAt).getTime() < now).length;
  const present = (pointages ?? []).filter((p) => p.heureEntree).length;
  const nonPointes = Math.max(0, (employes?.length ?? 0) - present);

  const alerts = [
    { label: 'Validations en retard (SLA)', n: slaLate, tone: 'danger' as const, to: '/mes-validations' },
    { label: 'Pas encore pointés', n: nonPointes, tone: 'warning' as const, to: '/presences' },
  ].filter((a) => a.n > 0);

  return (
    <Card>
      <CardTitle>Alertes opérationnelles</CardTitle>
      {alerts.length === 0 ? (
        <p className="mt-3 flex items-center gap-2 text-sm text-ink-muted">
          <CheckCircle2 size={16} className="text-success" /> Tout est sous contrôle.
        </p>
      ) : (
        <ul className="mt-3 space-y-1.5">
          {alerts.map((a) => (
            <li key={a.label}>
              <Link
                to={a.to}
                className="flex items-center justify-between gap-2 rounded-lg px-2 py-2 transition-colors hover:bg-surface-muted"
              >
                <span className="flex min-w-0 items-center gap-2 text-sm text-ink">
                  <AlertTriangle size={15} className={a.tone === 'danger' ? 'text-danger' : 'text-warning'} />
                  <span className="truncate">{a.label}</span>
                </span>
                <Badge tone={a.tone} dot>{a.n}</Badge>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
