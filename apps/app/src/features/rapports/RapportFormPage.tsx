import { useRef, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Paperclip, Save, Send, X } from 'lucide-react';
import { Button, Callout, Card, Input, Select, Spinner, Textarea } from '@drwindesk/ui';
import { apiErrorMessage } from '@/lib/api';
import { humanSize } from '@/lib/download';
import { useEmployes } from '@/features/rh/hooks';
import { fullName } from '@/features/rh/helpers';
import { useUpsertRapport } from './hooks';
import { rapportsService } from './service';
import type { StatutRapport } from './types';

const today = () => new Date().toISOString().slice(0, 10);

interface Errors {
  employeId?: string;
  date?: string;
  contenu?: string;
}

export function RapportFormPage() {
  const navigate = useNavigate();
  const { data: employes, isLoading } = useEmployes({});
  const upsert = useUpsertRapport();

  const [employeId, setEmployeId] = useState('');
  const [date, setDate] = useState(today());
  const [contenu, setContenu] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const submit = async (statut: StatutRapport) => {
    const errs: Errors = {};
    if (!employeId) errs.employeId = 'Sélectionnez un collaborateur.';
    if (!date) errs.date = 'Le jour est requis.';
    if (!contenu.trim()) errs.contenu = 'Le rapport ne peut pas être vide.';
    setErrors(errs);
    if (Object.values(errs).some(Boolean)) {
      setError('Veuillez corriger les champs signalés.');
      return;
    }
    setError(null);

    let attach = {};
    if (file) {
      setUploading(true);
      try {
        const ref = await rapportsService.uploadAttachment(file);
        attach = {
          attachmentKey: ref.key,
          attachmentName: ref.name,
          attachmentSize: ref.size,
          attachmentType: ref.type,
        };
      } catch (err) {
        setUploading(false);
        setError(apiErrorMessage(err, 'Échec du téléversement du fichier.'));
        return;
      }
      setUploading(false);
    }

    try {
      await upsert.mutateAsync({ employeId, date, contenu: contenu.trim(), statut, ...attach });
      navigate('/rapports');
    } catch (err) {
      setError(apiErrorMessage(err, 'Enregistrement impossible.'));
    }
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    void submit('SOUMIS');
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <Link
        to="/rapports"
        className="inline-flex items-center gap-1 text-sm text-brand-600 hover:underline"
      >
        <ArrowLeft size={16} /> Retour
      </Link>
      <h1 className="mb-6 mt-3 text-2xl font-bold tracking-tight text-ink">
        Saisir un rapport journalier
      </h1>

      <form onSubmit={onSubmit} noValidate>
        <Card className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Select
              label="Collaborateur *"
              placeholder="Sélectionner…"
              options={(employes ?? []).map((e) => ({ value: e.id, label: fullName(e) }))}
              value={employeId}
              onChange={(e) => {
                setEmployeId(e.target.value);
                setErrors((p) => ({ ...p, employeId: undefined }));
              }}
              error={errors.employeId}
            />
            <Input
              type="date"
              label="Jour *"
              value={date}
              onChange={(e) => {
                setDate(e.target.value);
                setErrors((p) => ({ ...p, date: undefined }));
              }}
              error={errors.date}
            />
          </div>
          <Textarea
            label="Contenu du rapport *"
            rows={8}
            value={contenu}
            onChange={(e) => {
              setContenu(e.target.value);
              setErrors((p) => ({ ...p, contenu: undefined }));
            }}
            placeholder="Activités réalisées, points de blocage, prochaines étapes…"
            error={errors.contenu}
          />

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

          {error && <Callout tone="danger">{error}</Callout>}

          <div className="flex flex-wrap justify-end gap-3">
            <Button
              type="button"
              variant="secondary"
              disabled={upsert.isPending || uploading}
              onClick={() => void submit('BROUILLON')}
            >
              <Save size={16} /> Enregistrer le brouillon
            </Button>
            <Button type="submit" loading={upsert.isPending || uploading}>
              <Send size={16} /> {uploading ? 'Téléversement…' : 'Soumettre'}
            </Button>
          </div>
        </Card>
      </form>
    </div>
  );
}
