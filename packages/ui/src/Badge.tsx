import type { HTMLAttributes } from 'react';
import { cn } from './cn';

type Tone = 'neutral' | 'success' | 'warning' | 'danger' | 'brand';

const tones: Record<Tone, string> = {
  neutral: 'bg-surface-muted text-ink-muted ring-surface-border',
  success: 'bg-success-soft text-success-soft-fg ring-success/20',
  warning: 'bg-warning-soft text-warning-soft-fg ring-warning/20',
  danger: 'bg-danger-soft text-danger-soft-fg ring-danger/20',
  brand: 'bg-brand-soft text-brand-soft-fg ring-brand-500/20',
};

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: Tone;
  dot?: boolean;
}

export function Badge({ className, tone = 'neutral', dot, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset',
        tones[tone],
        className,
      )}
      {...props}
    >
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}
