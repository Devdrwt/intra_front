'use client';

import { useEffect, useState } from 'react';
import { cn } from './cn';

const SIZES = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-9 w-9 text-xs',
  lg: 'h-12 w-12 text-sm',
} as const;

// Palette de teintes déterministes (douce, lisible en clair & sombre).
const PALETTES = [
  'bg-brand-soft text-brand-soft-fg',
  'bg-success-soft text-success-soft-fg',
  'bg-warning-soft text-warning-soft-fg',
  'bg-danger-soft text-danger-soft-fg',
];

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

export interface AvatarProps {
  name: string;
  /** URL d'une image de profil ; en cas d'erreur de chargement → repli sur les initiales. */
  src?: string | null;
  size?: keyof typeof SIZES;
  className?: string;
}

/** Avatar : image de profil si fournie, sinon initiales (teinte déterministe). */
export function Avatar({ name, src, size = 'md', className }: AvatarProps) {
  const [errored, setErrored] = useState(false);
  useEffect(() => setErrored(false), [src]);

  if (src && !errored) {
    return (
      <img
        src={src}
        alt={name}
        onError={() => setErrored(true)}
        className={cn('inline-block shrink-0 rounded-full object-cover', SIZES[size], className)}
      />
    );
  }

  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
  const palette = PALETTES[hash(name) % PALETTES.length];
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full font-semibold',
        SIZES[size],
        palette,
        className,
      )}
    >
      {initials || '?'}
    </span>
  );
}
