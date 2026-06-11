import { forwardRef, useState, type InputHTMLAttributes, type ReactNode } from 'react';
import { cn } from './cn';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  /** Élément décoratif à gauche (icône). */
  leading?: ReactNode;
}

const EyeIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);
const EyeOffIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9.9 4.2A10.9 10.9 0 0 1 12 4c6.5 0 10 7 10 7a13.2 13.2 0 0 1-2.2 2.9M6.6 6.6A13.3 13.3 0 0 0 2 12s3.5 7 10 7a10.9 10.9 0 0 0 3.4-.5M9.5 9.5a3 3 0 0 0 4.2 4.2" />
    <path d="m2 2 20 20" />
  </svg>
);

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, label, error, hint, leading, id, type, ...props },
  ref,
) {
  const [reveal, setReveal] = useState(false);
  const isPassword = type === 'password';
  const effectiveType = isPassword && reveal ? 'text' : type;

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
          type={effectiveType}
          className={cn(
            'h-10 w-full rounded-xl border border-surface-border bg-surface px-3 text-sm text-ink shadow-sm',
            'placeholder:text-ink-subtle',
            'transition focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/15',
            leading && 'pl-9',
            isPassword && 'pr-10',
            error && 'border-danger focus:border-danger focus:ring-danger/15',
            className,
          )}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setReveal((v) => !v)}
            aria-label={reveal ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
            title={reveal ? 'Masquer' : 'Afficher'}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-subtle transition-colors hover:text-ink"
          >
            {reveal ? <EyeOffIcon /> : <EyeIcon />}
          </button>
        )}
      </div>
      {error ? (
        <span className="text-xs text-danger">{error}</span>
      ) : hint ? (
        <span className="text-xs text-ink-subtle">{hint}</span>
      ) : null}
    </div>
  );
});
