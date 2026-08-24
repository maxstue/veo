import { ScriptOnce } from '@tanstack/react-router';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

export type Theme = 'system' | 'light' | 'dark';

type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
};

type ThemeProviderState = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
};

const ThemeProviderContext = createContext<ThemeProviderState | undefined>(undefined);

function getThemeScript(storageKey: string, defaultTheme: Theme) {
  const key = JSON.stringify(storageKey);
  const fallback = JSON.stringify(defaultTheme);

  return `(function(){try{var t=localStorage.getItem(${key});if(t!=='light'&&t!=='dark'&&t!=='system'){t=${fallback}}var d=matchMedia('(prefers-color-scheme: dark)').matches;var r=t==='system'?(d?'dark':'light'):t;var e=document.documentElement;e.classList.remove('light','dark');e.classList.add(r);e.dataset.theme=t;e.style.colorScheme=r}catch(e){}})();`;
}

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  let resolved: 'light' | 'dark';

  if (theme === 'system') {
    resolved = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  } else {
    resolved = theme;
  }

  root.classList.remove('light', 'dark');
  root.classList.add(resolved);
  root.dataset.theme = theme;
  root.style.colorScheme = resolved;
}

function getInitialTheme(storageKey: string, defaultTheme: Theme) {
  if (typeof document === 'undefined') {
    return defaultTheme;
  }

  const appliedTheme = document.documentElement.dataset.theme;
  if (appliedTheme === 'light' || appliedTheme === 'dark' || appliedTheme === 'system') {
    return appliedTheme;
  }

  try {
    const stored = localStorage.getItem(storageKey);
    return stored === 'light' || stored === 'dark' || stored === 'system' ? stored : defaultTheme;
  } catch {
    return defaultTheme;
  }
}

export function ThemeProvider({ children, defaultTheme = 'system', storageKey = 'veo-theme' }: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(() => getInitialTheme(storageKey, defaultTheme));

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  useEffect(() => {
    if (theme !== 'system') {
      return;
    }

    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const update = () => applyTheme('system');
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, [theme]);

  const updateTheme = useCallback(
    (next: Theme) => {
      try {
        localStorage.setItem(storageKey, next);
      } catch {}
      setTheme(next);
    },
    [storageKey],
  );

  const contextValue = useMemo<ThemeProviderState>(() => ({ theme, setTheme: updateTheme }), [theme, updateTheme]);

  return (
    <ThemeProviderContext value={contextValue}>
      <ScriptOnce>{getThemeScript(storageKey, defaultTheme)}</ScriptOnce>
      {children}
    </ThemeProviderContext>
  );
}

export function useTheme() {
  const context = useContext(ThemeProviderContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
