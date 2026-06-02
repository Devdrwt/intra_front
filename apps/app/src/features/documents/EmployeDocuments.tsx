import { useState, type FormEvent } from 'react';
import { FileText, Plus, Trash2, X } from 'lucide-react';
import { Badge, Button, Input, Select, Spinner } from '@drwindesk/ui';
import { apiErrorMessage } from '@/lib/api';
import { UPLOADS_ENABLED } from '@/lib/config';
import { uploadViaPresign } from '@/lib/upload';
import { useAddDocument, useDocumentsEmploye, useRemoveDocument } from './hooks';
import {
  TYPE_DOCUMENT_LABEL,
  TYPE_DOCUMENT_OPTIONS,
  type DocumentInput,
  type TypeDocument,
} from './types';

function formatDate(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? iso
    : d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function EmployeDocuments({ employeId }: { employeId: string }) {
  const { data: docs, isLoading } = useDocumentsEmploye(employeId);
  const add = useAddDocument(employeId);
  const remove = useRemoveDocument(employeId);

  const [open, setOpen] = useState(false);
  const [nom, setNom] = useState('');
  const [type, setType] = useState<TypeDocument>('CONTRAT');
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setNom('');
    setType('CONTRAT');
    setFile(null);
    setError(null);
    setOpen(false);
  };

  const onAdd = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      let storageKey: string | undefined;
      let tailleKo = 0;
      let nomFinal = nom.trim();

      if (UPLOADS_ENABLED && file) {
        // 1) presign + PUT direct du binaire vers S3, 2) on garde la storageKey.
        storageKey = await uploadViaPresign(`/employes/${employeId}/documents/presign`, file);
        tailleKo = Math.max(1, Math.round(file.size / 1024));
        if (!nomFinal) nomFinal = file.name;
      }

      const input: DocumentInput = { employeId, nom: nomFinal, type, tailleKo, storageKey };
      await add.mutateAsync(input);
      reset();
    } catch (err) {
      // Message backend si axios ; sinon message d'erreur d'upload (PUT S3).
      setError(apiErrorMessage(err, err instanceof Error ? err.message : 'Échec de l’enregistrement.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <p className="text-sm text-ink-muted">
          Contrats, bulletins, attestations… rattachés à ce collaborateur (GED).
        </p>
        <Button size="sm" variant="secondary" onClick={() => setOpen((v) => !v)}>
          {open ? <X size={16} /> : <Plus size={16} />}
          {open ? 'Annuler' : 'Ajouter'}
        </Button>
      </div>

      {open && (
        <form
          onSubmit={onAdd}
          className="mt-3 flex flex-col gap-3 rounded-xl border border-surface-border bg-surface-muted p-3"
        >
          {UPLOADS_ENABLED && (
            <input
              type="file"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="text-sm text-ink-muted file:mr-3 file:rounded-lg file:border-0 file:bg-brand-50 file:px-3 file:py-2 file:text-sm file:font-medium file:text-brand-700"
            />
          )}
          <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto]">
            <Input
              placeholder={
                UPLOADS_ENABLED ? 'Nom (optionnel, repris du fichier)' : 'Nom du document (ex. Contrat CDI.pdf)'
              }
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              required={!UPLOADS_ENABLED}
            />
            <Select
              options={TYPE_DOCUMENT_OPTIONS}
              value={type}
              onChange={(e) => setType(e.target.value as TypeDocument)}
            />
            <Button type="submit" disabled={busy || (UPLOADS_ENABLED ? !file && !nom.trim() : !nom.trim())}>
              {busy ? 'Envoi…' : 'Enregistrer'}
            </Button>
          </div>
          {error && <p className="text-sm text-danger">{error}</p>}
        </form>
      )}

      <div className="mt-4">
        {isLoading ? (
          <div className="flex justify-center py-6">
            <Spinner />
          </div>
        ) : !docs || docs.length === 0 ? (
          <p className="py-6 text-center text-sm text-ink-subtle">Aucun document.</p>
        ) : (
          <ul className="divide-y divide-surface-border">
            {docs.map((d) => (
              <li key={d.id} className="flex items-center gap-3 py-3">
                <FileText size={18} className="shrink-0 text-ink-subtle" />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-ink">{d.nom}</div>
                  <div className="text-xs text-ink-subtle">
                    Ajouté le {formatDate(d.dateAjout)}
                    {d.tailleKo > 0 && ` · ${d.tailleKo} Ko`}
                  </div>
                </div>
                <Badge tone="neutral">{TYPE_DOCUMENT_LABEL[d.type]}</Badge>
                <button
                  onClick={() => remove.mutate(d.id)}
                  className="rounded-lg p-1.5 text-ink-subtle hover:bg-surface-muted hover:text-danger"
                  aria-label="Supprimer"
                >
                  <Trash2 size={16} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
