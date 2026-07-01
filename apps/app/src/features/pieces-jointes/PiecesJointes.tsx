import { useRef, useState } from 'react';
import { Download, Loader2, Paperclip, Trash2, Upload } from 'lucide-react';
import { Button, EmptyState, Spinner } from '@drwindesk/ui';
import { hasPermission, useAuth } from '@/auth/AuthContext';
import { humanSize } from '@/lib/download';
import { piecesJointesService } from './service';
import { usePiecesJointes, useRemovePiece, useUploadPiece } from './hooks';
import type { PieceEntityType } from './types';

interface Props {
  entityType: PieceEntityType;
  entityId: string;
  /** Permission d'écriture requise pour ajouter/supprimer (ex. 'finance:write'). */
  writePermission: string;
  /** Ne charge la liste que si actif (ex. modale ouverte). */
  enabled?: boolean;
}

const fmtDate = (iso: string) => new Date(iso).toLocaleDateString('fr-FR');

export function PiecesJointes({ entityType, entityId, writePermission, enabled = true }: Props) {
  const { user } = useAuth();
  const canWrite = hasPermission(user, writePermission);
  const { data, isLoading } = usePiecesJointes(entityType, entityId, enabled);
  const upload = useUploadPiece(entityType, entityId);
  const remove = useRemovePiece(entityType, entityId);

  const inputRef = useRef<HTMLInputElement>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const onPick = (file: File | undefined) => {
    if (!file) return;
    upload.mutate({ file });
    if (inputRef.current) inputRef.current.value = '';
  };

  const onDownload = async (id: string, name: string) => {
    setDownloadingId(id);
    try {
      await piecesJointesService.download(id, name);
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="space-y-4">
      {canWrite && (
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="file"
            className="hidden"
            onChange={(e) => onPick(e.target.files?.[0])}
          />
          <Button
            size="sm"
            variant="secondary"
            onClick={() => inputRef.current?.click()}
            disabled={upload.isPending}
            className="flex items-center gap-2"
          >
            {upload.isPending ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />}
            Ajouter un fichier
          </Button>
          <span className="text-xs text-ink-subtle">PDF, image ou Office — 10 Mo max.</span>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-6">
          <Spinner />
        </div>
      ) : !data?.length ? (
        <EmptyState
          icon={<Paperclip size={28} />}
          title="Aucune pièce jointe"
          description={canWrite ? 'Ajoutez une preuve ou un justificatif.' : undefined}
        />
      ) : (
        <ul className="divide-y divide-surface-border rounded-lg border border-surface-border">
          {data.map((p) => (
            <li key={p.id} className="flex items-center gap-3 px-3 py-2.5">
              <Paperclip size={16} className="shrink-0 text-ink-subtle" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-ink">{p.label || p.filename}</p>
                <p className="text-xs text-ink-subtle">
                  {humanSize(p.size)} · {fmtDate(p.createdAt)}
                </p>
              </div>
              <Button
                size="sm"
                variant="ghost"
                title="Télécharger"
                onClick={() => onDownload(p.id, p.filename)}
                disabled={downloadingId === p.id}
              >
                {downloadingId === p.id ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : (
                  <Download size={15} />
                )}
              </Button>
              {canWrite && (
                <Button
                  size="sm"
                  variant="ghost"
                  title="Supprimer"
                  className="text-ink-subtle hover:text-danger"
                  onClick={() => remove.mutate(p.id)}
                  disabled={remove.isPending}
                >
                  <Trash2 size={15} />
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
