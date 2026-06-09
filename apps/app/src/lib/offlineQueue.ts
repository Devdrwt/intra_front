import axios from 'axios';

/**
 * File hors-ligne du pointage (terrain). Stockée en localStorage (simple, robuste,
 * survit au rechargement et fonctionne sans réseau). Rejouée à la reconnexion.
 */
const KEY = 'drwindesk.offline.pointages';
type Sens = 'ENTREE' | 'SORTIE';
interface QueuedPointage {
  sens: Sens;
  ts: number;
}

function read(): QueuedPointage[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '[]') as QueuedPointage[];
  } catch {
    return [];
  }
}
function write(q: QueuedPointage[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(q));
  } catch {
    /* quota / mode privé : on ignore */
  }
}

/** Erreur réseau (hors-ligne ou pas de réponse serveur) vs erreur applicative (4xx/5xx). */
export function isNetworkError(err: unknown): boolean {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return true;
  return axios.isAxiosError(err) && !err.response;
}

export function enqueuePointage(sens: Sens): void {
  const q = read();
  q.push({ sens, ts: Date.now() });
  write(q);
}

export function pendingPointagesCount(): number {
  return read().length;
}

let flushing = false;
/** Rejoue la file via `send`. S'arrête à la 1ʳᵉ erreur réseau (toujours hors-ligne). */
export async function flushPointages(send: (sens: Sens) => Promise<unknown>): Promise<void> {
  if (flushing) return;
  flushing = true;
  try {
    let q = read();
    while (q.length) {
      const item = q[0]!;
      try {
        await send(item.sens);
        q = read();
        q.shift();
        write(q);
      } catch (err) {
        if (isNetworkError(err)) break; // encore hors-ligne → on réessaiera
        // erreur applicative (ex. déjà pointé) → on retire l'élément pour ne pas bloquer la file
        q = read();
        q.shift();
        write(q);
      }
    }
  } finally {
    flushing = false;
  }
}

let listenerRegistered = false;
/** À appeler une fois : flush immédiat + flush automatique à chaque retour en ligne. */
export function startPointageAutoSync(send: (sens: Sens) => Promise<unknown>): void {
  void flushPointages(send);
  if (listenerRegistered || typeof window === 'undefined') return;
  listenerRegistered = true;
  window.addEventListener('online', () => void flushPointages(send));
}
