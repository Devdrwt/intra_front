import { useState } from 'react';
import { Download } from 'lucide-react';
import { Badge, Button, Card, CardTitle, Input, PageHeader, Select } from '@drwindesk/ui';
import { USE_MOCKS } from '@/lib/config';
import { toast } from '@/lib/toast';
import { exportUrl } from './service';
import { useComptes, useJournaux, useTaxes } from './hooks';
import type { ExportFormat } from './types';

export function ComptabilitePage() {
  const { data: comptes } = useComptes();
  const { data: journaux } = useJournaux();
  const { data: taxes } = useTaxes();

  const [from, setFrom] = useState('2026-01-01');
  const [to, setTo] = useState('2026-12-31');
  const [format, setFormat] = useState<ExportFormat>('csv');

  const onExport = () => {
    if (USE_MOCKS.finance) {
      toast.success(`Export ${format.toUpperCase()} (${from} → ${to}) — disponible une fois le backend branché.`);
      return;
    }
    window.open(exportUrl(from, to, format), '_blank');
  };

  return (
    <div className="space-y-5">
      <PageHeader title="Comptabilité" subtitle="Plan comptable SYSCOHADA, journaux, taxes et export pour le cabinet." />

      <Card>
        <CardTitle>Exporter pour la comptabilité</CardTitle>
        <div className="mt-4 flex flex-wrap items-end gap-3">
          <Input id="from" type="date" label="Du" value={from} onChange={(e) => setFrom(e.target.value)} />
          <Input id="to" type="date" label="Au" value={to} onChange={(e) => setTo(e.target.value)} />
          <Select
            id="fmt"
            label="Format"
            value={format}
            onChange={(e) => setFormat(e.target.value as ExportFormat)}
            options={[
              { value: 'csv', label: 'CSV (tableur)' },
              { value: 'fec', label: 'FEC' },
              { value: 'syscohada', label: 'SYSCOHADA' },
            ]}
          />
          <Button onClick={onExport}>
            <Download size={16} /> Exporter
          </Button>
        </div>
      </Card>

      <div className="grid gap-5 lg:grid-cols-3">
        <RefCard title="Plan comptable" items={(comptes ?? []).map((c) => ({ left: c.code, right: c.libelle, tag: `cl. ${c.classe}` }))} />
        <RefCard title="Journaux" items={(journaux ?? []).map((j) => ({ left: j.code, right: j.libelle }))} />
        <RefCard
          title="Taxes"
          items={(taxes ?? []).map((t) => ({ left: t.code, right: t.libelle, tag: `${t.taux} %` }))}
        />
      </div>
    </div>
  );
}

function RefCard({ title, items }: { title: string; items: { left: string; right: string; tag?: string }[] }) {
  return (
    <Card className="p-0">
      <div className="p-5 pb-2">
        <CardTitle>{title}</CardTitle>
      </div>
      <ul className="divide-y divide-surface-border">
        {items.map((it, i) => (
          <li key={i} className="flex items-center justify-between gap-2 px-5 py-2.5 text-sm">
            <span className="font-mono text-xs text-ink-muted">{it.left}</span>
            <span className="flex-1 truncate text-ink">{it.right}</span>
            {it.tag && <Badge tone="neutral">{it.tag}</Badge>}
          </li>
        ))}
        {items.length === 0 && <li className="px-5 py-4 text-sm text-ink-subtle">—</li>}
      </ul>
    </Card>
  );
}
