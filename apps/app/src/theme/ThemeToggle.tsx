import { Moon, Sun } from 'lucide-react';
import { useTheme } from './ThemeProvider';

/** Bascule clair/sombre. */
export function ThemeToggle() {
  const { resolved, toggle } = useTheme();
  const dark = resolved === 'dark';
  return (
    <button
      onClick={toggle}
      aria-label={dark ? 'Passer en clair' : 'Passer en sombre'}
      title={dark ? 'Mode clair' : 'Mode sombre'}
      className="flex h-9 w-9 items-center justify-center rounded-xl text-ink-muted transition-colors hover:bg-surface-muted hover:text-ink"
    >
      {dark ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}
