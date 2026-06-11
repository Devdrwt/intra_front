import type { ReactNode } from 'react';
import { cn } from './cn';

export interface PageHeaderProps {
  title: ReactNode;
  subtitle?: ReactNode;
  /** Boutons / actions alignés à droite. */
  actions?: ReactNode;
  /** Icône optionnelle dans une pastille à gauche du titre. */
  icon?: ReactNode;
  className?: string;
}

/** En-tête de page uniforme : titre, sous-titre, actions. */
export function PageHeader({ title, subtitle, actions, icon, className }: PageHeaderProps) {
  return (
    <header className={cn('flex flex-wrap items-start justify-between gap-3', className)}>
      <div className="flex min-w-0 items-start gap-3">
        {icon && (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-brand-soft text-brand-soft-fg">
            {icon}
          </div>
        )}
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight text-ink">{title}</h1>
          {subtitle && <p className="mt-0.5 text-ink-muted">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}
