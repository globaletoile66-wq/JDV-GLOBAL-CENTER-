'use client';
import { useEffect, useRef, useState } from 'react';
import { PRESETS } from '../../lib/theme/palettes';
import { useJdvTheme } from './ThemeProvider';

/** Bouton « Couleurs » + palette : thèmes prêts à l'emploi ou couleurs libres. */
export default function ThemePalette() {
  const { theme, setTheme, reset } = useJdvTheme();
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    const onClick = (e: MouseEvent) => { if (box.current && !box.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('keydown', onKey); document.addEventListener('mousedown', onClick);
    return () => { document.removeEventListener('keydown', onKey); document.removeEventListener('mousedown', onClick); };
  }, [open]);

  return (
    <div ref={box} className="relative">
      <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-haspopup="dialog"
        className="inline-flex items-center gap-2 rounded-full border border-[var(--jdv-border)] bg-white px-3 py-2 text-sm font-medium text-[var(--jdv-primary-text)] hover:bg-[var(--jdv-primary-soft)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--jdv-accent)]">
        <span aria-hidden className="h-4 w-4 rounded-full border border-black/10" style={{ background: `linear-gradient(135deg, ${theme.primary} 50%, ${theme.accent} 50%)` }} />
        Couleurs
      </button>

      {open && (
        <div role="dialog" aria-label="Personnaliser les couleurs"
          className="absolute right-0 z-50 mt-2 w-72 rounded-2xl border border-[var(--jdv-border)] bg-white p-4 shadow-xl">
          <p className="mb-2 text-sm font-semibold text-[var(--jdv-fg)]">Thèmes</p>
          <div className="grid grid-cols-3 gap-2">
            {PRESETS.map((p) => (
              <button key={p.id} type="button" onClick={() => setTheme(p.theme)} aria-label={`Thème ${p.name}`}
                className="rounded-xl border border-[var(--jdv-border)] p-2 text-xs text-[var(--jdv-fg)] hover:bg-[var(--jdv-primary-soft)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--jdv-accent)]">
                <span className="mb-1 block h-6 rounded-md" style={{ background: `linear-gradient(135deg, ${p.theme.primary} 55%, ${p.theme.accent} 55%)` }} />
                {p.name}
              </button>
            ))}
          </div>

          <p className="mb-2 mt-4 text-sm font-semibold text-[var(--jdv-fg)]">Vos couleurs</p>
          <div className="flex gap-3">
            <label className="flex flex-1 flex-col gap-1 text-xs text-[var(--jdv-muted)]">Principale
              <input type="color" value={theme.primary} onChange={(e) => setTheme({ ...theme, primary: e.target.value })} className="h-9 w-full cursor-pointer rounded-md border border-[var(--jdv-border)]" />
            </label>
            <label className="flex flex-1 flex-col gap-1 text-xs text-[var(--jdv-muted)]">Accent
              <input type="color" value={theme.accent} onChange={(e) => setTheme({ ...theme, accent: e.target.value })} className="h-9 w-full cursor-pointer rounded-md border border-[var(--jdv-border)]" />
            </label>
          </div>
          <button type="button" onClick={reset} className="mt-4 w-full rounded-lg border border-[var(--jdv-border)] px-3 py-2 text-sm text-[var(--jdv-fg)] hover:bg-[var(--jdv-primary-soft)]">Revenir aux couleurs JDV</button>
          <p className="mt-2 text-xs text-[var(--jdv-muted)]">Votre choix est conservé sur cet appareil.</p>
        </div>
      )}
    </div>
  );
}
