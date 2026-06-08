import { useRef, useState } from 'react';
import { Building2, ImagePlus, Trash2 } from 'lucide-react';
import { Button, Card, CardDescription, CardTitle } from '@drwindesk/ui';
import { apiErrorMessage } from '@/lib/api';
import { toast } from '@/lib/toast';
import { orgLogoUrl } from '@/lib/branding';
import { useOrgSettings, useRemoveLogo, useUploadLogo } from './org';

export function OrgLogoCard() {
  const { data: org } = useOrgSettings();
  const upload = useUploadLogo();
  const remove = useRemoveLogo();
  const fileRef = useRef<HTMLInputElement>(null);
  const [version, setVersion] = useState(0);

  const hasLogo = Boolean(org?.hasLogo);

  const onPick = async (file: File | null) => {
    if (!file) return;
    try {
      await upload.mutateAsync(file);
      setVersion(Date.now()); // casse le cache de l'<img>
    } catch (e) {
      toast.error(apiErrorMessage(e, 'Téléversement impossible.'));
    } finally {
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  return (
    <Card>
      <CardTitle>Logo de l’organisation</CardTitle>
      <CardDescription>
        Affiché dans le menu latéral. PNG, JPEG, WebP, GIF ou SVG (≤ 2 Mo).
      </CardDescription>
      <div className="mt-4 flex items-center gap-4">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-surface-border bg-surface-muted">
          {hasLogo ? (
            <img src={orgLogoUrl(version || undefined)} alt="Logo" className="h-full w-full object-contain" />
          ) : (
            <Building2 size={24} className="text-ink-subtle" />
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => fileRef.current?.click()}
            loading={upload.isPending}
          >
            <ImagePlus size={15} /> {hasLogo ? 'Changer le logo' : 'Ajouter un logo'}
          </Button>
          {hasLogo && (
            <Button variant="ghost" size="sm" onClick={() => remove.mutate()} disabled={remove.isPending}>
              <Trash2 size={15} /> Retirer
            </Button>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
            className="hidden"
            onChange={(e) => void onPick(e.target.files?.[0] ?? null)}
          />
        </div>
      </div>
    </Card>
  );
}
