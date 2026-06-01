import { cn } from './cn';

export function Spinner({ className }: { className?: string }) {
  return (
    <span
      role="status"
      aria-label="Chargement"
      className={cn(
        'inline-block h-5 w-5 animate-spin rounded-full border-2 border-brand-200 border-t-brand-600',
        className,
      )}
    />
  );
}
