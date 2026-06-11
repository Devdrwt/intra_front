import type { HTMLAttributes } from 'react';
import { cn } from './cn';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** Effet de survol (élévation) — utile pour les cartes cliquables. */
  interactive?: boolean;
}

export function Card({ className, interactive, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-surface-border bg-surface p-5 shadow-card',
        interactive &&
          'cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-elevated active:translate-y-0 active:shadow-card',
        className,
      )}
      {...props}
    />
  );
}

export function CardTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn('text-base font-semibold text-ink', className)} {...props} />;
}

export function CardDescription({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn('mt-1 text-sm text-ink-muted', className)} {...props} />;
}
