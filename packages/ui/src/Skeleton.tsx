import type { HTMLAttributes } from 'react';
import { cn } from './cn';

/** Placeholder animé pour les états de chargement. */
export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('animate-pulse rounded-md bg-surface-muted', className)}
      {...props}
    />
  );
}

/** Lignes de squelette pour une table (n lignes). */
export function SkeletonRows({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="divide-y divide-surface-border">
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex items-center gap-4 px-5 py-3.5">
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton
              key={c}
              className={cn('h-4', c === 0 ? 'w-40' : 'flex-1 max-w-[8rem]')}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
