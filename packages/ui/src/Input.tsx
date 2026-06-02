import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react';
import { cn } from './cn';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  /** Élément décoratif à gauche (icône). */
  leading?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, label, error, hint, leading, id, ...props },
  ref,
) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-ink">
          {label}
        </label>
      )}
      <div className="relative">
        {leading && (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-subtle">
            {leading}
          </span>
        )}
        <input
          ref={ref}
          id={id}
          className={cn(
            'h-10 w-full rounded-xl border border-surface-border bg-surface px-3 text-sm text-ink shadow-sm',
            'placeholder:text-ink-subtle',
            'transition focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/15',
            leading && 'pl-9',
            error && 'border-danger focus:border-danger focus:ring-danger/15',
            className,
          )}
          {...props}
        />
      </div>
      {error ? (
        <span className="text-xs text-danger">{error}</span>
      ) : hint ? (
        <span className="text-xs text-ink-subtle">{hint}</span>
      ) : null}
    </div>
  );
});
