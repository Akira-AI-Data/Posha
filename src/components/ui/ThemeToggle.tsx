'use client';

import { Monitor, Moon, Sun } from 'lucide-react';
import { useUIStore } from '@/stores/uiStore';

export function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const theme = useUIStore((s) => s.theme);
  const setTheme = useUIStore((s) => s.setTheme);

  if (compact) {
    return (
      <button
        type="button"
        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card/95 text-foreground shadow-sm backdrop-blur transition-all hover:bg-muted/70"
      >
        {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
      </button>
    );
  }

  return (
    <div className="inline-flex items-center gap-1 rounded-full border border-border bg-card/90 p-1 shadow-sm backdrop-blur">
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted/70 text-muted-foreground">
        <Monitor className="w-3.5 h-3.5" />
      </div>
      <button
        type="button"
        onClick={() => setTheme('light')}
        aria-pressed={theme === 'light'}
        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-all ${
          theme === 'light'
            ? 'bg-primary text-primary-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground hover:bg-muted/70'
        }`}
      >
        <Sun className="w-3.5 h-3.5" />
        Light
      </button>
      <button
        type="button"
        onClick={() => setTheme('dark')}
        aria-pressed={theme === 'dark'}
        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-all ${
          theme === 'dark'
            ? 'bg-foreground text-background shadow-sm'
            : 'text-muted-foreground hover:text-foreground hover:bg-muted/70'
        }`}
      >
        <Moon className="w-3.5 h-3.5" />
        Dark
      </button>
    </div>
  );
}
