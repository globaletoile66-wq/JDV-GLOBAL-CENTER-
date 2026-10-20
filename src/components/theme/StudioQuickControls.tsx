'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Globe2, Palette, SlidersHorizontal, X } from 'lucide-react';
import { useJDV } from '@/contexts/JDVContext';
import { useJdvTheme } from '@/components/theme/ThemeProvider';
import { PRESETS, isHex, type JdvTheme } from '@/lib/theme/palettes';
import { createClient } from '@/lib/supabase/client';

const languages = [
  { code: 'fr', name: 'Français' },
  { code: 'en', name: 'English' },
  { code: 'pt', name: 'Português' },
  { code: 'es', name: 'Español' },
  { code: 'ar', name: 'العربية' },
];

type DesignPrefs = { font: string; radius: string; density: string; cardStyle: string; showHighlights: boolean; showAnimations: boolean; showMedia?: boolean; imageUrl?: string; videoUrl?: string };
const defaultDesign: DesignPrefs = { font: 'Inter, ui-sans-serif, system-ui, sans-serif', radius: '16px', density: 'comfortable', cardStyle: 'soft', showHighlights: true, showAnimations: true, showMedia: true };

export default function StudioQuickControls() {
  const [open, setOpen] = useState(false);
  const [appearance, setAppearance] = useState('light');
  const [mediaOpen, setMediaOpen] = useState(false);
  const [media, setMedia] = useState<{showMedia:boolean;imageUrl:string;videoUrl:string}>({showMedia:false,imageUrl:'',videoUrl:''});
  const { activeLanguage, setActiveLanguage } = useJDV();
  const { theme, setTheme } = useJdvTheme();
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('jdv-appearance-v1');
      const mode = saved && ['light','dark','system','blue','contrast'].includes(saved) ? saved : 'light';
      setAppearance(mode);
      document.documentElement.dataset.jdvMode = mode;
    } catch { document.documentElement.dataset.jdvMode = 'light'; }
    const applyDesign = (prefs: DesignPrefs) => {
      const root = document.documentElement;
      root.style.setProperty('--font-sans', prefs.font);
      root.style.setProperty('--radius', prefs.radius);
      root.style.setProperty('--jdv-radius', prefs.radius);
      root.dataset.jdvShape = 'custom';
      root.dataset.jdvDensity = prefs.density;
      root.dataset.jdvCardStyle = prefs.cardStyle;
      root.dataset.jdvHighlights = String(prefs.showHighlights);
      root.dataset.jdvAnimations = String(prefs.showAnimations);
    };
    const load = async () => {
      let prefs = defaultDesign;
      try {
        const raw = localStorage.getItem('jdv-design-v1');
        if (raw) prefs = { ...defaultDesign, ...JSON.parse(raw) } as DesignPrefs;
      } catch { /* Le stockage local peut être indisponible. */ }
      applyDesign(prefs);
      try {
        const { data, error } = await supabase.from('jdv_studio_settings').select('config').eq('scope_key', 'global').maybeSingle();
        const config = data?.config as { theme?: JdvTheme; design?: Partial<DesignPrefs> } | null;
        if (!error && config) {
          if (config.theme && isHex(config.theme.primary) && isHex(config.theme.accent)) setTheme(config.theme);
          if (config.design) {
            prefs = { ...prefs, ...config.design };
            setMedia({showMedia:config.design.showMedia ?? true,imageUrl:config.design.imageUrl ?? '',videoUrl:config.design.videoUrl ?? ''});
            applyDesign(prefs);
            try { localStorage.setItem('jdv-design-v1', JSON.stringify(prefs)); } catch { /* Réglage actif en mémoire. */ }
          }
        }
      } catch { /* Le Studio local fonctionne même si la table globale n'est pas encore déployée. */ }
    };
    void load();
  }, [supabase, setTheme]);

  return (
    <>
    {media.showMedia&&(media.imageUrl||media.videoUrl)&&<div className="fixed bottom-4 left-4 z-[99] print:hidden"><button type="button" onClick={()=>setMediaOpen(v=>!v)} className="rounded-full border border-border bg-card px-4 py-3 text-sm font-bold text-card-foreground shadow-xl">Médias JDV</button>{mediaOpen&&<section className="mb-3 mt-2 w-[min(92vw,360px)] rounded-2xl border border-border bg-card p-3 text-card-foreground shadow-2xl">{media.imageUrl&&<img src={media.imageUrl} alt="Média de marque JDV" className="max-h-48 w-full rounded-xl object-cover"/>}{media.videoUrl&&<video src={media.videoUrl} controls className="mt-3 max-h-48 w-full rounded-xl bg-black"/>}<button type="button" onClick={()=>setMediaOpen(false)} className="mt-3 w-full rounded-lg border border-border px-3 py-2 text-sm">Fermer</button></section>}</div>}
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
        <label className="mt-3 block text-xs font-bold uppercase tracking-wide text-muted-foreground"><span className="mb-1 block">Apparence de la plateforme</span>
          <select value={appearance} onChange={e => { const mode=e.target.value; setAppearance(mode); document.documentElement.dataset.jdvMode=mode; try { localStorage.setItem('jdv-appearance-v1',mode); } catch { /* Préférence active pour la session. */ } }} className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm font-normal">
            <option value="light">Clair / blanc</option><option value="dark">Sombre</option><option value="system">Selon le système</option><option value="blue">Bleu professionnel</option><option value="contrast">Contraste élevé</option>
          </select>
        </label>
        <Link href="/admin" className="mt-3 flex items-center justify-center gap-2 rounded-xl border border-border px-4 py-3 text-sm font-bold">Ouvrir l’administration</Link>
        <Link href="/hidden-concepteur-gate/dashboard/studio" className="mt-2 flex items-center justify-center gap-2 rounded-xl bg-accent px-4 py-3 text-sm font-bold text-white"><SlidersHorizontal size={16}/> Ouvrir le Studio complet</Link>
      </section>}
      <button type="button" aria-expanded={open} onClick={() => setOpen(v => !v)} className="flex items-center gap-2 rounded-full border border-white/20 bg-slate-950 px-4 py-3 text-sm font-bold text-white shadow-xl transition hover:scale-[1.02]">
        <Palette size={17}/><span>Thème & langue</span>
      </button>
    </div>
    </>
  );
}
