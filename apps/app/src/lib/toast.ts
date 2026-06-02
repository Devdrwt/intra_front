/**
 * Petit bus de toasts (popups), indépendant de React → émettable depuis n'importe où
 * (hooks react-query, services, composants). Le <Toaster/> s'y abonne et les affiche.
 */
export type ToastTone = 'success' | 'error' | 'info' | 'warning';

export interface ToastItem {
  id: number;
  tone: ToastTone;
  title: string;
  description?: string;
  duration: number;
}

export interface ToastInput {
  tone?: ToastTone;
  title: string;
  description?: string;
  duration?: number;
}

let seq = 0;
const listeners = new Set<(t: ToastItem) => void>();

export function subscribeToast(fn: (t: ToastItem) => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function emit(input: ToastInput): void {
  const item: ToastItem = {
    id: ++seq,
    tone: input.tone ?? 'info',
    title: input.title,
    description: input.description,
    duration: input.duration ?? 4000,
  };
  listeners.forEach((l) => l(item));
}

export const toast = {
  show: emit,
  success: (title: string, description?: string) => emit({ tone: 'success', title, description }),
  error: (title: string, description?: string) => emit({ tone: 'error', title, description }),
  info: (title: string, description?: string) => emit({ tone: 'info', title, description }),
  warning: (title: string, description?: string) => emit({ tone: 'warning', title, description }),
};
