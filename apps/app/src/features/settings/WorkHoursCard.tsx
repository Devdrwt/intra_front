import { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';
import { Button, Card, CardDescription, CardTitle, Input } from '@drwindesk/ui';
import { useOrgSettings, useUpdateHoraires, type WorkHours } from './org';

const DEFAULTS: WorkHours = { debut: '08:30', pauseDebut: '12:30', reprise: '14:00', fin: '18:00' };

export function WorkHoursCard() {
  const { data: org } = useOrgSettings();
  const update = useUpdateHoraires();
  const [h, setH] = useState<WorkHours>(DEFAULTS);

  useEffect(() => {
    if (org?.horaires) setH(org.horaires);
  }, [org]);

  const set = (k: keyof WorkHours, v: string) => setH((p) => ({ ...p, [k]: v }));

  return (
    <Card>
      <div className="flex items-center gap-2">
        <Clock size={18} className="text-ink-subtle" />
        <CardTitle>Horaires de travail</CardTitle>
      </div>
      <CardDescription>
        Servent aux rappels automatiques de pointage (arrivée / départ non pointés).
      </CardDescription>
      <div className="mt-4 grid gap-4 sm:grid-cols-4">
        <Input type="time" label="Début" value={h.debut} onChange={(e) => set('debut', e.target.value)} />
        <Input type="time" label="Début pause" value={h.pauseDebut} onChange={(e) => set('pauseDebut', e.target.value)} />
        <Input type="time" label="Reprise" value={h.reprise} onChange={(e) => set('reprise', e.target.value)} />
        <Input type="time" label="Fin" value={h.fin} onChange={(e) => set('fin', e.target.value)} />
      </div>
      <div className="mt-4 flex justify-end">
        <Button onClick={() => update.mutate(h)} loading={update.isPending}>
          Enregistrer
        </Button>
      </div>
    </Card>
  );
}
