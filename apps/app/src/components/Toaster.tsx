import { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, Info, X, XCircle, type LucideIcon } from 'lucide-react';
import { cn } from '@drwindesk/ui';
import { subscribeToast, type ToastItem, type ToastTone } from '@/lib/toast';

const ICON: Record<ToastTone, LucideIcon> = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
  warning: AlertTriangle,
};

const ACCENT: Record<ToastTone, string> = {
  success: 'text-success',
  error: 'text-danger',
  info: 'text-brand-600',
  warning: 'text-warning',
};

export function Toaster() {
  const [items, setItems] = useState<ToastItem[]>([]);

  useEffect(() => {
    return subscribeToast((t) => {
      setItems((prev) => [...prev, t].slice(-4));
      window.setTimeout(() => {
        setItems((prev) => prev.filter((i) => i.id !== t.id));
      }, t.duration);
    });
  }, []);

  const dismiss = (id: number) => setItems((prev) => prev.filter((i) => i.id !== id));

  if (items.length === 0) return null;

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[60] flex w-[calc(100vw-2rem)] max-w-sm flex-col gap-2.5">
      {items.map((t) => {
        const Icon = ICON[t.tone];
        return (
          <div
            key={t.id}
            className="pointer-events-auto flex animate-slide-up items-start gap-3 rounded-2xl border border-surface-border bg-surface-elevated p-3.5 shadow-pop"
          >
            <Icon size={20} className={cn('mt-0.5 shrink-0', ACCENT[t.tone])} />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-ink">{t.title}</p>
              {t.description && <p className="mt-0.5 text-sm text-ink-muted">{t.description}</p>}
            </div>
            <button
              onClick={() => dismiss(t.id)}
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-ink-subtle hover:bg-surface-muted hover:text-ink"
              aria-label="Fermer"
            >
              <X size={15} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
