import { useState } from 'react';
import { Paperclip } from 'lucide-react';
import { Button, Modal } from '@drwindesk/ui';
import { PiecesJointes } from './PiecesJointes';
import type { PieceEntityType } from './types';

interface Props {
  entityType: PieceEntityType;
  entityId: string;
  writePermission: string;
  /** Titre de la modale (ex. « Pièces jointes — Facture F-2026-001 »). */
  title?: string;
}

/**
 * Bouton « trombone » réutilisable : ouvre une modale listant/gérant les pièces
 * jointes d'une entité. La liste n'est chargée qu'à l'ouverture (pas de requête
 * par ligne de tableau).
 */
export function PiecesJointesButton({ entityType, entityId, writePermission, title }: Props) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button
        size="sm"
        variant="ghost"
        title="Pièces jointes"
        onClick={() => setOpen(true)}
      >
        <Paperclip size={15} />
      </Button>
      <Modal open={open} onClose={() => setOpen(false)} size="md" title={title ?? 'Pièces jointes'}>
        <PiecesJointes
          entityType={entityType}
          entityId={entityId}
          writePermission={writePermission}
          enabled={open}
        />
      </Modal>
    </>
  );
}
