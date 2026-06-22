import { useRef, useState } from 'react';
import { ArrowLeft, Film, ImageIcon, Images, Plus, Trash2, Upload } from 'lucide-react';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Input,
  Modal,
  PageHeader,
  Select,
  Skeleton,
  Textarea,
} from '@drwindesk/ui';
import { hasPermission, useAuth } from '@/auth/AuthContext';
import { apiErrorMessage } from '@/lib/api';
import { toast } from '@/lib/toast';
import { Stagger, StaggerItem } from '@/components/motion';
import {
  useAddItem,
  useCollections,
  useCreateCollection,
  useItems,
  useRemoveCollection,
  useRemoveItem,
} from './hooks';
import { mediaFileUrl, type MediaItem } from './types';

export function MediathequePage() {
  const { user } = useAuth();
  const canManage = hasPermission(user, 'media:manage');
  const canContribute = hasPermission(user, 'media:contribute') || canManage;
  const [openId, setOpenId] = useState<string | null>(null);

  if (openId) {
    return (
      <CollectionView
        collectionId={openId}
        canManage={canManage}
        canContribute={canContribute}
        onBack={() => setOpenId(null)}
        onDeleted={() => setOpenId(null)}
      />
    );
  }
  return <CollectionsList canManage={canManage} onOpen={setOpenId} />;
}

// ---------------------------------------------------------------- Liste galeries
function CollectionsList({ canManage, onOpen }: { canManage: boolean; onOpen: (id: string) => void }) {
  const { data, isLoading } = useCollections();
  const [showNew, setShowNew] = useState(false);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Médiathèque"
        subtitle="Galeries photos & vidéos, et visuels d’identité de l’entreprise."
        actions={
          canManage ? (
            <Button onClick={() => setShowNew(true)}>
              <Plus size={16} /> Nouvelle galerie
            </Button>
          ) : undefined
        }
      />

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-44 rounded-2xl" />
          ))}
        </div>
      ) : !data || data.length === 0 ? (
        <Card className="p-0">
          <EmptyState
            icon={<Images size={20} />}
            title="Aucune galerie"
            description={canManage ? 'Créez une première galerie pour stocker vos médias.' : 'Aucune galerie partagée pour le moment.'}
          />
        </Card>
      ) : (
        <Stagger className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((c) => (
            <StaggerItem key={c.id} className="h-full">
              <button onClick={() => onOpen(c.id)} className="h-full w-full text-left">
                <Card interactive className="h-full overflow-hidden p-0">
                  <div className="flex aspect-[16/10] items-center justify-center bg-surface-muted">
                    {c.coverItemId ? (
                      <img src={mediaFileUrl(c.coverItemId, true)} alt={c.nom} className="h-full w-full object-cover" loading="lazy" />
                    ) : (
                      <Images size={32} className="text-ink-subtle" />
                    )}
                  </div>
                  <div className="p-4">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="truncate font-semibold text-ink">{c.nom}</h3>
                      {c.type === 'IDENTITE' && <Badge tone="brand">Identité</Badge>}
                    </div>
                    {c.description && <p className="mt-0.5 line-clamp-1 text-sm text-ink-subtle">{c.description}</p>}
                    <p className="mt-1 text-xs text-ink-subtle">
                      {c.itemsCount} média{c.itemsCount > 1 ? 's' : ''}
                    </p>
                  </div>
                </Card>
              </button>
            </StaggerItem>
          ))}
        </Stagger>
      )}

      {showNew && <NewCollectionModal onClose={() => setShowNew(false)} />}
    </div>
  );
}

function NewCollectionModal({ onClose }: { onClose: () => void }) {
  const create = useCreateCollection();
  const [nom, setNom] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<'GALERIE' | 'IDENTITE'>('GALERIE');

  const submit = async () => {
    if (nom.trim().length < 2) return;
    await create.mutateAsync({ nom: nom.trim(), description: description.trim() || undefined, type });
    onClose();
  };

  return (
    <Modal
      open
      onClose={onClose}
      size="md"
      title="Nouvelle galerie"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Annuler
          </Button>
          <Button onClick={() => void submit()} loading={create.isPending} disabled={nom.trim().length < 2}>
            Créer
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Input label="Nom *" value={nom} onChange={(e) => setNom(e.target.value)} placeholder="Événement, campagne, logos…" />
        <Textarea label="Description" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
        <Select
          label="Type"
          options={[
            { value: 'GALERIE', label: 'Galerie (photos / vidéos)' },
            { value: 'IDENTITE', label: 'Identité (visuels de marque)' },
          ]}
          value={type}
          onChange={(e) => setType(e.target.value as 'GALERIE' | 'IDENTITE')}
        />
      </div>
    </Modal>
  );
}

// ------------------------------------------------------------- Vue d'une galerie
function CollectionView({
  collectionId,
  canManage,
  canContribute,
  onBack,
  onDeleted,
}: {
  collectionId: string;
  canManage: boolean;
  canContribute: boolean;
  onBack: () => void;
  onDeleted: () => void;
}) {
  const { data: collections } = useCollections();
  const collection = collections?.find((c) => c.id === collectionId);
  const { data: items, isLoading } = useItems(collectionId);
  const addItem = useAddItem(collectionId);
  const removeItem = useRemoveItem(collectionId);
  const removeCollection = useRemoveCollection();
  const fileRef = useRef<HTMLInputElement>(null);
  const [lightbox, setLightbox] = useState<MediaItem | null>(null);
  const [uploading, setUploading] = useState(false);

  const onPick = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        await addItem.mutateAsync(file);
      }
      toast.success('Médias ajoutés');
    } catch (e) {
      toast.error(apiErrorMessage(e, 'Téléversement impossible.'));
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const deleteGallery = async () => {
    await removeCollection.mutateAsync(collectionId);
    onDeleted();
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title={
          <span className="flex items-center gap-2">
            <button onClick={onBack} className="rounded-lg p-1 text-ink-muted hover:bg-surface-muted hover:text-ink" aria-label="Retour">
              <ArrowLeft size={20} />
            </button>
            {collection?.nom ?? 'Galerie'}
          </span>
        }
        subtitle={collection?.description ?? undefined}
        actions={
          <>
            {canContribute && (
              <>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*,video/*"
                  multiple
                  className="hidden"
                  onChange={(e) => void onPick(e.target.files)}
                />
                <Button onClick={() => fileRef.current?.click()} loading={uploading}>
                  <Upload size={16} /> Ajouter
                </Button>
              </>
            )}
            {canManage && (
              <Button variant="ghost" onClick={() => void deleteGallery()} disabled={removeCollection.isPending} className="text-danger hover:bg-danger-soft">
                <Trash2 size={16} /> Supprimer la galerie
              </Button>
            )}
          </>
        }
      />

      {isLoading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square rounded-xl" />
          ))}
        </div>
      ) : !items || items.length === 0 ? (
        <Card className="p-0">
          <EmptyState
            icon={<ImageIcon size={20} />}
            title="Galerie vide"
            description={canContribute ? 'Ajoutez des photos ou des vidéos.' : 'Aucun média pour le moment.'}
          />
        </Card>
      ) : (
        <Stagger className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {items.map((it) => (
            <StaggerItem key={it.id}>
              <div className="group relative aspect-square overflow-hidden rounded-xl border border-surface-border bg-surface-muted">
                <button onClick={() => setLightbox(it)} className="h-full w-full">
                  {it.type === 'IMAGE' ? (
                    <img src={mediaFileUrl(it.id, true)} alt={it.nom} className="h-full w-full object-cover transition-transform group-hover:scale-105" loading="lazy" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <Film size={28} className="text-ink-subtle" />
                      <span className="absolute bottom-1 left-1 rounded bg-ink/70 px-1.5 py-0.5 text-[10px] font-medium text-white">Vidéo</span>
                    </div>
                  )}
                </button>
                {canManage && (
                  <button
                    onClick={() => removeItem.mutate(it.id)}
                    className="absolute right-1.5 top-1.5 hidden rounded-lg bg-ink/60 p-1.5 text-white hover:bg-danger group-hover:block"
                    aria-label="Supprimer"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </StaggerItem>
          ))}
        </Stagger>
      )}

      <Modal open={!!lightbox} onClose={() => setLightbox(null)} size="xl" title={lightbox?.nom}>
        {lightbox &&
          (lightbox.type === 'IMAGE' ? (
            <img src={mediaFileUrl(lightbox.id)} alt={lightbox.nom} className="mx-auto max-h-[70vh] w-auto rounded-lg" />
          ) : (
            <video src={mediaFileUrl(lightbox.id)} controls className="mx-auto max-h-[70vh] w-full rounded-lg" />
          ))}
      </Modal>
    </div>
  );
}
