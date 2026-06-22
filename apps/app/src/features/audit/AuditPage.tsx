import { useState } from 'react';
import { Activity, ChevronLeft, ChevronRight, Search } from 'lucide-react';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Input,
  Select,
  SkeletonRows,
  Avatar,
  PageHeader,
} from '@drwindesk/ui';
import { useAuditLogs } from './hooks';
import { describeAudit } from './describe';
import { METHOD_OPTIONS, METHOD_TONE, type AuditFilters } from './types';

const fmtDateTime = (iso: string) =>
  new Date(iso).toLocaleString('fr-FR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });

/** Rend l'action plus lisible : "POST /api/v1/rh/employes" → "/rh/employes". */
function shortPath(path: string | null, action: string): string {
  const p = path ?? action;
  return p.replace(/^\w+\s+/, '').replace(/^\/api\/v1/, '') || '/';
}

const PAGE_SIZE = 20;

export function AuditPage() {
  const [page, setPage] = useState(1);
  const [q, setQ] = useState('');
  const [method, setMethod] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const filters: AuditFilters = {
    page,
    pageSize: PAGE_SIZE,
    q: q.trim() || undefined,
    method: method || undefined,
    from: from || undefined,
    to: to || undefined,
  };
  const { data, isLoading, isError } = useAuditLogs(filters);

  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  // Réinitialise à la page 1 quand un filtre change.
  const onFilter = (fn: () => void) => {
    fn();
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Activité"
        subtitle="Journal de toutes les actions effectuées sur la plateforme — qui, quoi, quand."
      />

      {/* Filtres */}
      <Card className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Input
            leading={<Search size={15} />}
            placeholder="Rechercher (action, chemin…)"
            value={q}
            onChange={(e) => onFilter(() => setQ(e.target.value))}
          />
          <Select
            options={METHOD_OPTIONS}
            value={method}
            onChange={(e) => onFilter(() => setMethod(e.target.value))}
          />
          <Input type="date" value={from} onChange={(e) => onFilter(() => setFrom(e.target.value))} />
          <Input type="date" value={to} onChange={(e) => onFilter(() => setTo(e.target.value))} />
        </div>
      </Card>

      {/* Liste */}
      <Card className="p-0">
        {isLoading ? (
          <div className="p-5">
            <SkeletonRows rows={6} />
          </div>
        ) : isError ? (
          <EmptyState
            icon={<Activity size={20} />}
            title="Journal indisponible"
            description="Impossible de charger l'activité pour le moment."
            className="py-12"
          />
        ) : items.length === 0 ? (
          <EmptyState
            icon={<Activity size={20} />}
            title="Aucune activité"
            description="Aucune action ne correspond à ces filtres."
            className="py-12"
          />
        ) : (
          <ul className="divide-y divide-surface-border">
            {items.map((log) => (
              <li key={log.id} className="flex items-center gap-3 px-5 py-3">
                <Avatar name={log.actorEmail ?? 'Système'} size="sm" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    {log.method && (
                      <Badge tone={METHOD_TONE[log.method] ?? 'neutral'}>{log.method}</Badge>
                    )}
                    <span className="truncate text-sm font-medium text-ink">
                      {describeAudit(log.method, log.path, log.action)}
                    </span>
                  </div>
                  <p className="truncate text-xs text-ink-subtle">
                    <span className="text-ink-muted">{log.actorEmail ?? 'Système'}</span>
                    {' · '}
                    <span className="font-mono">{shortPath(log.path, log.action)}</span>
                    {log.ip ? ` · ${log.ip}` : ''}
                    {log.statusCode ? ` · ${log.statusCode}` : ''}
                  </p>
                </div>
                <span className="shrink-0 text-xs text-ink-subtle">{fmtDateTime(log.createdAt)}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {/* Pagination */}
      {total > 0 && (
        <div className="flex items-center justify-between text-sm text-ink-muted">
          <span>
            {total} action{total > 1 ? 's' : ''} · page {page}/{totalPages}
          </span>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft size={16} /> Précédent
            </Button>
            <Button
              variant="secondary"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Suivant <ChevronRight size={16} />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
