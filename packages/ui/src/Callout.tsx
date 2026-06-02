import type { ReactNode } from 'react';
import { cn } from './cn';

type Tone = 'info' | 'success' | 'warning' | 'danger';

const tones: Record<Tone, string> = {
  info: 'bg-brand-soft text-brand-soft-fg ring-brand-500/20',
  success: 'bg-success-soft text-success-soft-fg ring-success/20',
  warning: 'bg-warning-soft text-warning-soft-fg ring-warning/20',
  danger: 'bg-danger-soft text-danger-soft-fg ring-danger/20',
};

export interface CalloutProps {
  tone?: Tone;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
}

/** Bandeau d'information / alerte, thémé clair & sombre. */
export function Callout({ tone = 'info', icon, children, className }: CalloutProps) {
  return (
    <div
      className={cn(
        'flex items-start gap-2.5 rounded-xl px-4 py-3 text-sm ring-1 ring-inset',
        tones[tone],
        className,
      )}
    >
      {icon && <span className="mt-0.5 shrink-0">{icon}</span>}
      <div className="min-w-0">{children}</div>
    </div>
  );
}
