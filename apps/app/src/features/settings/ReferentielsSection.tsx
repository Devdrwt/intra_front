import { useState, type FormEvent } from 'react';
import { Building2, Layers, Plus, X } from 'lucide-react';
import { Badge, Button, Card, CardDescription, CardTitle, Input, Select, Skeleton } from '@drwindesk/ui';
import {
  useCreateDepartment,
  useCreateService,
  useDeleteDepartment,
  useDeleteService,
  useDepartments,
  useServices,
} from './hooks';

export function ReferentielsSection() {
  return (
    <div className="space-y-6">
      <DepartmentsCard />
      <ServicesCard />
    </div>
  );
}

function DepartmentsCard() {
  const { data: departments, isLoading } = useDepartments();
  const create = useCreateDepartment();
  const remove = useDeleteDepartment();
  const [name, setName] = useState('');

  const onAdd = (e: FormEvent) => {
    e.preventDefault();
    const v = name.trim();
    if (!v) return;
    create.mutate({ name: v });
    setName('');
  };

  return (
    <Card>
      <div className="flex items-center gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-soft text-brand-soft-fg">
          <Building2 size={18} />
        </span>
        <div>
          <CardTitle>Départements</CardTitle>
          <CardDescription>Les unités principales de votre organisation.</CardDescription>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-8 w-28 rounded-full" />)
        ) : departments && departments.length > 0 ? (
          departments.map((d) => (
            <span
              key={d.id}
              className="inline-flex items-center gap-1.5 rounded-full bg-surface-muted py-1 pl-3 pr-1.5 text-sm text-ink"
            >
              {d.name}
              <button
                onClick={() => remove.mutate(d.id)}
                className="flex h-5 w-5 items-center justify-center rounded-full text-ink-subtle hover:bg-surface-border hover:text-danger"
                aria-label={`Supprimer ${d.name}`}
              >
                <X size={13} />
              </button>
            </span>
          ))
        ) : (
          <p className="text-sm text-ink-subtle">Aucun département.</p>
        )}
      </div>

      <form onSubmit={onAdd} className="mt-4 flex gap-2">
        <Input
          placeholder="Nouveau département (ex. Logistique)"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <Button type="submit" disabled={create.isPending || !name.trim()}>
          <Plus size={16} /> Ajouter
        </Button>
      </form>
    </Card>
  );
}

function ServicesCard() {
  const { data: services, isLoading } = useServices();
  const { data: departments } = useDepartments();
  const create = useCreateService();
  const remove = useDeleteService();
  const [name, setName] = useState('');
  const [departmentId, setDepartmentId] = useState('');

  const deptName = (id?: string) => departments?.find((d) => d.id === id)?.name;

  const onAdd = (e: FormEvent) => {
    e.preventDefault();
    const v = name.trim();
    if (!v) return;
    create.mutate({ name: v, departmentId: departmentId || undefined });
    setName('');
    setDepartmentId('');
  };

  return (
    <Card>
      <div className="flex items-center gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-success-soft text-success-soft-fg">
          <Layers size={18} />
        </span>
        <div>
          <CardTitle>Services</CardTitle>
          <CardDescription>Les équipes, rattachées (optionnellement) à un département.</CardDescription>
        </div>
      </div>

      <div className="mt-4 space-y-1.5">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-10 w-full rounded-xl" />)
        ) : services && services.length > 0 ? (
          services.map((s) => (
            <div
              key={s.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-surface-border px-3 py-2"
            >
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-ink">{s.name}</span>
                {deptName(s.departmentId) && <Badge tone="neutral">{deptName(s.departmentId)}</Badge>}
              </div>
              <button
                onClick={() => remove.mutate(s.id)}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-ink-subtle hover:bg-surface-muted hover:text-danger"
                aria-label={`Supprimer ${s.name}`}
              >
                <X size={15} />
              </button>
            </div>
          ))
        ) : (
          <p className="text-sm text-ink-subtle">Aucun service.</p>
        )}
      </div>

      <form onSubmit={onAdd} className="mt-4 grid gap-2 sm:grid-cols-[1fr_auto_auto]">
        <Input
          placeholder="Nouveau service (ex. Comptabilité)"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <Select
          options={(departments ?? []).map((d) => ({ value: d.id, label: d.name }))}
          placeholder="Département (optionnel)"
          value={departmentId}
          onChange={(e) => setDepartmentId(e.target.value)}
        />
        <Button type="submit" disabled={create.isPending || !name.trim()}>
          <Plus size={16} /> Ajouter
        </Button>
      </form>
    </Card>
  );
}
