import { useEffect, useRef } from 'react';
import { useUnreadCount as useDiscussionUnread } from '@/features/discussion/hooks';
import { useUnreadCount as useNotifUnread } from '@/features/espaces/hooks';
import { playPing } from '@/lib/sound';

function usePingOnIncrease(count: number | undefined) {
  const prev = useRef<number | null>(null);
  useEffect(() => {
    if (count === undefined) return;
    // On ignore la 1re valeur (chargement) pour ne pas sonner à l'ouverture.
    if (prev.current !== null && count > prev.current) playPing();
    prev.current = count;
  }, [count]);
}

/** Joue un son quand les messages / notifications non lus augmentent (réception). */
export function useNotificationSound(): void {
  const { data: messages } = useDiscussionUnread();
  const { data: notifs } = useNotifUnread();
  usePingOnIncrease(messages);
  usePingOnIncrease(notifs?.count);
}
