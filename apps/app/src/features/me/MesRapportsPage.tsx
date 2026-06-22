import { useRef, useState, type FormEvent } from 'react';
import { Download, FileBarChart, FileText, Paperclip, PenLine, Save, Send, Trash2, X } from 'lucide-react';
import { Badge, Button, Callout, Card, CardTitle, EmptyState, Input, PageHeader, Skeleton, Textarea, cn } from '@drwindesk/ui';
import { apiErrorMessage } from '@/lib/api';
import { triggerDownload, humanSize } from '@/lib/download';
import { toast } from '@/lib/toast';
import { Stagger, StaggerItem } from '@/components/motion';
import { STATUT_RAPPORT_LABEL, type Rapport, type StatutRapport } from '@/features/rapports/types';

const STATUT_GRAD: Record<StatutRapport, string> = {
  SOUMIS: 'from-emerald-400 to-teal-600',
  BROUILLON: 'from-amber-400 to-orange-500',
};
import { useDeleteMyRapport, useMyRapports, useUpsertMyRapport } from './hooks';
import { meService } from './service';
import { MeNotLinked } from './MeNotLinked';

const today = () => new Date().toISOString().slice(0, 10);
const fmt = (iso: string) =>
  new Date(iso).toLocaleDateString('fr-FR', { weekday: 'short', day: '2-digit', month: 'short' });

export function MesRapportsPage() {
  const { data: rapports, isLoading, error } = useMyRapports();
  const upsert = useUpsertMyRapport();
  const del = useDeleteMyRapport();

  const [date, setDate] = useState(today());
  const [contenu, setContenu] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  if (error) return <MeNotLinked />;

  const submit = async (statut: StatutRapport) => {
    if (!contenu.trim()) {
      setFieldError('Le rapport ne peut pas être vide.');
      setFormError('Veuillez corriger les champs signalés.');
      return;
    }
    setFieldError(null);
    setFormError(null);

    let attach = {};
    if (file) {
      setUploading(true);
      try {
        const ref = await meService.uploadAttachment(file);
        attach = {
          attachmentKey: ref.key,
          attachmentName: ref.name,
          attachmentSize: ref.size,
          attachmentType: ref.type,
        };
      } catch (err) {
        setUploading(false);
        setFormError(apiErrorMessage(err, 'Échec du téléversement du fichier.'));
        return;
      }
      setUploading(false);
    }

    try {
      await upsert.mutateAsync({ date, contenu: contenu.trim(), statut, ...attach });
      if (statut === 'SOUMIS') {
        setContenu('');
        setFile(null);
        if (fileRef.current) fileRef.current.value = '';
      }
    } catch (err) {
      setFormError(apiErrorMessage(err, 'Enregistrement impossible.'));
    }
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    void submit('SOUMIS');
  };

  /** Recharge un rapport (brouillon ou soumis) dans le formulaire pour le compléter/soumettre. */
  const openRapport = (r: Rapport) => {
    setDate(r.date);
    setContenu(r.contenu);
    setFile(null);
    if (fileRef.current) fileRef.current.value = '';
    setFieldError(null);
    setFormError(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    toast.success(
      r.statut === 'BROUILLON'
        ? 'Brouillon chargé — complétez puis cliquez « Soumettre ».'
        : 'Rapport chargé.',
    );
  };

  const download = async (r: Rapport) => {
    if (!r.attachment) return;
    setDownloading(r.id);
    try {
      const blob = await meService.downloadRapportAttachment(r.id);
      triggerDownload(blob, r.attachment.name);
    } catch {
      toast.error('Téléchargement impossible.');
    } finally {
      setDownloading(null);
    }
  };

  const list = rapports ?? [];
  const busy = upsert.isPending || uploading;

  return (
    <div className="space-y-6">
      <PageHeader title="Mes rapports" subtitle="Rédigez et envoyez votre rapport journalier." />

      <Card>
        <CardTitle>Rapport du jour</CardTitle>
        <form onSubmit={onSubmit} noValidate className="mt-4 space-y-4">
          <Input
            type="date"
            label="Jour"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="sm:max-w-xs"
          />
          <Textarea
            label="Contenu *"
            rows={7}
            value={contenu}
            onChange={(e) => {
              setContenu(e.target.value);
              setFieldError(null);
            }}
            placeholder="Activités réalisées, points de blocage, prochaines étapes…"
            error={fieldError ?? undefined}
          />
          {contenu.trim() && (
            <p className="-mt-2 text-right text-xs text-ink-subtle">
              {contenu.trim().split(/\s+/).length} mots · {contenu.length} caractères
            </p>
          )}

          {/* Pièce jointe */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink">Pièce jointe (optionnel)</label>
            {file ? (
              <div className="flex items-center gap-3 rounded-xl border border-surface-border bg-surface-muted px-3 py-2">
                <Paperclip size={16} className="text-ink-subtle" />
                <span className="min-w-0 flex-1 truncate text-sm text-ink">{file.name}</span>
                <span className="text-xs text-ink-subtle">{humanSize(file.size)}</span>
                <button
                  type="button"
                  onClick={() => {
                    setFile(null);
                    if (fileRef.current) fileRef.current.value = '';
                  }}
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-ink-muted hover:bg-surface hover:text-danger"
                  aria-label="Retirer le fichier"
                >
                  <X size={15} />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="flex w-full items-center gap-2 rounded-xl border border-dashed border-surface-border px-3 py-2.5 text-sm text-ink-muted transition-colors hover:border-brand-300 hover:text-ink"
              >
                <Paperclip size={16} /> Joindre un fichier (PDF, image, Office — max 10 Mo)
              </button>
            )}
            <input
              ref={fileRef}
              type="file"
              className="hidden"
              accept=".pdf,.png,.jpg,.jpeg,.gif,.webp,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </div>

          {formError && <Callout tone="danger">{formError}</Callout>}
          <div className="flex flex-wrap justify-end gap-3">
            <Button type="button" variant="secondary" disabled={busy} onClick={() => void submit('BROUILLON')}>
              <Save size={16} /> Brouillon
            </Button>
            <Button type="submit" loading={busy}>
              <Send size={16} /> {uploading ? 'Téléversement…' : 'Soumettre'}
            </Button>
          </div>
        </form>
      </Card>

      <Card className="p-0">
        <div className="p-5 pb-0">
          <CardTitle>Historique</CardTitle>
        </div>
        {isLoading ? (
          <div className="space-y-3 p-5">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-5 w-full" />
            ))}
          </div>
        ) : list.length === 0 ? (
          <EmptyState
            icon={<FileBarChart size={20} />}
            title="Aucun rapport"
            description="Vos rapports apparaîtront ici."
            className="py-10"
          />
        ) : (
          <Stagger className="mt-3 divide-y divide-surface-border">
            {list.map((r) => (
              <StaggerItem key={r.id} className="flex gap-3 px-5 py-3">
                <span className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br text-white', STATUT_GRAD[r.statut])}>
                  <FileText size={16} />
                </span>
                <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium capitalize text-ink">{fmt(r.date)}</span>
                  <div className="flex items-center gap-2">
                    <Badge tone={r.statut === 'SOUMIS' ? 'success' : 'warning'} dot>
                      {STATUT_RAPPORT_LABEL[r.statut]}
                    </Badge>
                    <Button size="sm" variant="secondary" onClick={() => openRapport(r)}>
                      <PenLine size={14} /> {r.statut === 'BROUILLON' ? 'Reprendre' : 'Ouvrir'}
                    </Button>
                    <button
                      type="button"
                      onClick={() => del.mutate(r.id)}
                      disabled={del.isPending}
                      title="Supprimer ce rapport"
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-subtle transition-colors hover:bg-surface-muted hover:text-danger"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
                <p className="mt-1 line-clamp-2 text-sm text-ink-muted">{r.contenu}</p>
                {r.attachment && (
                  <button
                    type="button"
                    onClick={() => void download(r)}
                    disabled={downloading === r.id}
                    className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-surface-muted px-2.5 py-1 text-xs font-medium text-ink-muted transition-colors hover:text-brand-600"
                  >
                    <Download size={13} />
                    {r.attachment.name}
                    <span className="text-ink-subtle">· {humanSize(r.attachment.size)}</span>
                  </button>
                )}
                </div>
              </StaggerItem>
            ))}
          </Stagger>
        )}
      </Card>
    </div>
  );
}
