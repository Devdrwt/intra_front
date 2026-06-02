import { forwardRef, type TextareaHTMLAttributes } from 'react';
import { cn } from './cn';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { className, label, error, id, rows = 5, ...props },
  ref,
) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-ink">
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        id={id}
        rows={rows}
        className={cn(
          'w-full rounded-xl border border-surface-border bg-surface px-3 py-2 text-sm text-ink shadow-sm',
          'placeholder:text-ink-subtle',
          'transition focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/15',
          error && 'border-danger focus:border-danger focus:ring-danger/15',
          className,
        )}
        {...props}
      />
      {error && <span className="text-xs text-danger">{error}</span>}
    </div>
  );
});
