'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Globe2, Palette, SlidersHorizontal, X } from 'lucide-react';
import { useJDV } from '@/contexts/JDVContext';
import { useJdvTheme } from '@/components/theme/ThemeProvider';
import { PRESETS } from '@/lib/theme/palettes';

const languages = [
  { code: 'fr', name: 'Français' },
  { code: 'en', name: 'English' },
  { code: 'pt', name: 'Português' },
  { code: 'es', name: 'Español' },
  { code: 'ar', name: 'العربية' },
];

type DesignPrefs = { font: string; radius: string; density: string; cardStyle: string };
const defaultDesign: DesignPrefs = { font: 'Inter, ui-sans-serif, system-ui, sans-serif', radius: '16px', density: 'comfortable', cardStyle: 'soft' };

export default function StudioQuickControls() {
  const [open, setOpen] = useState(false);
  const { activeLanguage, setActiveLanguage } = useJDV();
  const { theme, setTheme } = useJdvTheme();

  useEffect(() => {
    try {
      const raw = localStorage.getItem('jdv-design-v1');
      const prefs = raw ? { ...defaultDesign, ...JSON.parse(raw) } as DesignPrefs : defaultDesign;
      const root = document.documentElement;
      root.style.setProperty('--font-sans', prefs.font);
      root.style.setProperty('--radius', prefs.radius);
      root.style.setProperty('--jdv-radius', prefs.radius);
      root.dataset.jdvShape = 'custom';
      root.dataset.jdvDensity = prefs.density;
      root.dataset.jdvCardStyle = prefs.cardStyle;
    } catch { /* Les préférences restent facultatives si le stockage est indisponible. */ }
  }, []);

  return (
    <div className="fixed bottom-4 right-4 z-[100] print:hidden">
      {open && <section aria-label="Réglages rapides" className="mb-3 w-[min(92vw,360px)] rounded-2xl border border-border bg-card p-4 text-card-foreground shadow-2xl">
        <div className="mb-4 flex items-center justify-between gap-3"><div><p className="text-sm font-extrabold">Réglages JDV</p><p className="text-xs text-muted-foreground">Langue et thème accessibles partout</p></div><button type="button" aria-label="Fermer les réglages" onClick={() => setOpen(false)} className="rounded-lg border border-border p-2"><X size={16}/></button></div>
        <label className="mb-3 block text-xs font-bold uppercase tracking-wide text-muted-foreground"><span className="mb-1 flex items-center gap-2"><Globe2 size={14}/> Langue de l’interface</span>
          <select value={activeLanguage} onChange={e => setActiveLanguage(e.target.value)} className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm font-normal">{languages.map(l => <option key={l.code} value={l.code}>{l.name}</option>)}</select>
        </label>
        <label className="block text-xs font-bold uppercase tracking-wide text-muted-foreground"><span className="mb-1 flex items-center gap-2"><Palette size={14}/> Thème de couleurs</span>
          <select value={PRESETS.find(p => p.theme.primary === theme.primary && p.theme.accent === theme.accent)?.id ?? 'custom'} onChange={e => { const preset = PRESETS.find(p => p.id === e.target.value); if (preset) setTheme(preset.theme); }} className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm font-normal">
            {PRESETS.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}<option value="custom">Couleurs personnalisées (Studio)</option>
          </select>
        </label>
        <Link href="/hidden-concepteur-gate/dashboard/studio" className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-accent px-4 py-3 text-sm font-bold text-white"><SlidersHorizontal size={16}/> Ouvrir le Studio complet</Link>
      </section>}
      <button type="button" aria-expanded={open} onClick={() => setOpen(v => !v)} className="flex items-center gap-2 rounded-full border border-white/20 bg-slate-950 px-4 py-3 text-sm font-bold text-white shadow-xl transition hover:scale-[1.02]">
        <Palette size={17}/><span>Thème & langue</span>
      </button>
    </div>
  );
}
