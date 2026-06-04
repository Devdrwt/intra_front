import { useState, type FormEvent } from 'react';
import { Check, FileText, Pencil, Plus, Trash2, X } from 'lucide-react';
import { Badge, Button, EmptyState, Input, Select, Skeleton } from '@drwindesk/ui';
import { apiErrorMessage } from '@/lib/api';
import { UPLOADS_ENABLED } from '@/lib/config';
import { uploadViaPresign } from '@/lib/upload';
import {
  useAddDocument,
  useDocumentsEmploye,
  useRemoveDocument,
  useUpdateDocument,
} from './hooks';
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
  const update = useUpdateDocument(employeId);

  const [editId, setEditId] = useState<string | null>(null);
  const [editNom, setEditNom] = useState('');
  const [editType, setEditType] = useState<TypeDocument>('CONTRAT');
  const startEdit = (id: string, nom: string, type: TypeDocument) => {
    setEditId(id);
    setEditNom(nom);
    setEditType(type);
  };
  const saveEdit = () => {
    if (!editId || !editNom.trim()) return;
    update.mutate(
      { id: editId, input: { nom: editNom.trim(), type: editType } },
      { onSuccess: () => setEditId(null) },
    );
  };

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
          <div className="space-y-3 py-2">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-9 w-9 rounded-lg" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-3 w-1/4" />
                </div>
              </div>
            ))}
          </div>
        ) : !docs || docs.length === 0 ? (
          <EmptyState
            icon={<FileText size={18} />}
            title="Aucun document"
            description="Aucun contrat ou pièce n’est encore rattaché."
            className="py-8"
          />
        ) : (
          <ul className="divide-y divide-surface-border">
            {docs.map((d) =>
              editId === d.id ? (
                <li key={d.id} className="flex flex-wrap items-center gap-2 py-3">
                  <Input
                    className="min-w-0 flex-1"
                    value={editNom}
                    onChange={(e) => setEditNom(e.target.value)}
                  />
                  <Select
                    options={TYPE_DOCUMENT_OPTIONS}
                    value={editType}
                    onChange={(e) => setEditType(e.target.value as TypeDocument)}
                  />
                  <button
                    onClick={saveEdit}
                    disabled={update.isPending || !editNom.trim()}
                    className="rounded-lg p-1.5 text-ink-subtle hover:bg-surface-muted hover:text-success"
                    aria-label="Enregistrer"
                  >
                    <Check size={16} />
                  </button>
                  <button
                    onClick={() => setEditId(null)}
                    className="rounded-lg p-1.5 text-ink-subtle hover:bg-surface-muted"
                    aria-label="Annuler"
                  >
                    <X size={16} />
                  </button>
                </li>
              ) : (
                <li key={d.id} className="flex items-center gap-3 py-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface-muted text-ink-subtle">
                    <FileText size={16} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-ink">{d.nom}</div>
                    <div className="text-xs text-ink-subtle">
                      Ajouté le {formatDate(d.dateAjout)}
                      {d.tailleKo > 0 && ` · ${d.tailleKo} Ko`}
                    </div>
                  </div>
                  <Badge tone="neutral">{TYPE_DOCUMENT_LABEL[d.type]}</Badge>
                  <button
                    onClick={() => startEdit(d.id, d.nom, d.type)}
                    className="rounded-lg p-1.5 text-ink-subtle hover:bg-surface-muted hover:text-brand-600"
                    aria-label="Modifier"
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    onClick={() => remove.mutate(d.id)}
                    className="rounded-lg p-1.5 text-ink-subtle hover:bg-surface-muted hover:text-danger"
                    aria-label="Supprimer"
                  >
                    <Trash2 size={16} />
                  </button>
                </li>
              ),
            )}
          </ul>
        )}
      </div>
    </div>
  );
}
