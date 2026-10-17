'use client';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { DEFAULT_THEME, loadTheme, saveTheme, themeToCssVars, type JdvTheme } from '../../lib/theme/palettes';

type Ctx = { theme: JdvTheme; setTheme: (t: JdvTheme) => void; reset: () => void };
const ThemeCtx = createContext<Ctx | null>(null);

function apply(t: JdvTheme) {
  const root = document.documentElement;
  Object.entries(themeToCssVars(t)).forEach(([k, v]) => root.style.setProperty(k, v));
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<JdvTheme>(DEFAULT_THEME);

  useEffect(() => { const t = loadTheme(); setThemeState(t); apply(t); }, []);

  const setTheme = useCallback((t: JdvTheme) => { setThemeState(t); apply(t); saveTheme(t); }, []);
  const reset = useCallback(() => setTheme(DEFAULT_THEME), [setTheme]);
  const value = useMemo(() => ({ theme, setTheme, reset }), [theme, setTheme, reset]);
  return <ThemeCtx.Provider value={value}>{children}</ThemeCtx.Provider>;
}

export function useJdvTheme(): Ctx {
  const c = useContext(ThemeCtx);
  if (!c) throw new Error('useJdvTheme doit être utilisé dans <ThemeProvider>');
  return c;
}
