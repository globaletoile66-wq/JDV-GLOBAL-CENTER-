// Thème personnalisable JDV GLOBAL : l'utilisateur choisit sa couleur principale et sa couleur d'accent.
// Fond blanc par défaut. Les textes restent lisibles quel que soit le choix (contraste calculé automatiquement).
export type JdvTheme = { primary: string; accent: string };

export const DEFAULT_THEME: JdvTheme = { primary: '#003366', accent: '#FF6B35' };

export const PRESETS: { id: string; name: string; theme: JdvTheme }[] = [
  { id: 'jdv', name: 'Bleu JDV', theme: DEFAULT_THEME },
  { id: 'foret', name: 'Forêt', theme: { primary: '#14532D', accent: '#F59E0B' } },
  { id: 'royal', name: 'Violet royal', theme: { primary: '#4C1D95', accent: '#EC4899' } },
  { id: 'rubis', name: 'Rubis', theme: { primary: '#9F1239', accent: '#0EA5E9' } },
  { id: 'ocean', name: 'Océan', theme: { primary: '#0E7490', accent: '#F97316' } },
  { id: 'graphite', name: 'Graphite', theme: { primary: '#1F2937', accent: '#10B981' } },
];

const HEX = /^#[0-9a-fA-F]{6}$/;
export const isHex = (v: unknown): v is string => typeof v === 'string' && HEX.test(v);

const toRgb = (hex: string): [number, number, number] => [
  parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16),
];
const toHex = (r: number, g: number, b: number) =>
  '#' + [r, g, b].map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');

function luminance(hex: string): number {
  const [r, g, b] = toRgb(hex).map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
export function contrast(a: string, b: string): number {
  const [l1, l2] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
}
/** Couleur de texte lisible posée sur `hex`. */
export const readableOn = (hex: string) =>
  ['#FFFFFF', '#111827', '#000000'].reduce((best, c) => (contrast(hex, c) > contrast(hex, best) ? c : best));
/** Mélange `hex` avec du blanc (t = part de couleur conservée, 0 à 1). */
export function tint(hex: string, t: number): string {
  const [r, g, b] = toRgb(hex);
  return toHex(255 - (255 - r) * t, 255 - (255 - g) * t, 255 - (255 - b) * t);
}
/** Assombrit `hex` jusqu'à un contraste d'au moins 4,5 contre le blanc (pour du texte sur fond blanc). */
export function textSafe(hex: string): string {
  let c = hex;
  for (let i = 0; i < 20 && contrast(c, '#FFFFFF') < 4.5; i++) {
    const [r, g, b] = toRgb(c);
    c = toHex(r * 0.9, g * 0.9, b * 0.9);
  }
  return c;
}

export function themeToCssVars(t: JdvTheme): Record<string, string> {
  return {
    '--jdv-bg': '#FFFFFF',
    '--jdv-fg': '#0F172A',
    '--jdv-muted': '#475569',
    '--jdv-primary': t.primary,
    '--jdv-on-primary': readableOn(t.primary),
    '--jdv-primary-text': textSafe(t.primary),
    '--jdv-primary-soft': tint(t.primary, 0.08),
    '--jdv-border': tint(t.primary, 0.22),
    '--jdv-accent': t.accent,
    '--jdv-on-accent': readableOn(t.accent),
    '--jdv-accent-soft': tint(t.accent, 0.12),
    // Connecter le thème configurable aux variables utilisées par les classes Tailwind globales.
    '--primary': t.primary,
    '--primary-foreground': readableOn(t.primary),
    '--accent': t.accent,
    '--accent-foreground': readableOn(t.accent),
    '--ring': t.accent,
    '--border': tint(t.primary, 0.22),
  };
}

const KEY = 'jdv-theme-v1';
export function loadTheme(): JdvTheme {
  try {
    const raw = typeof window !== 'undefined' ? window.localStorage.getItem(KEY) : null;
    if (!raw) return DEFAULT_THEME;
    const p = JSON.parse(raw);
    return isHex(p?.primary) && isHex(p?.accent) ? { primary: p.primary, accent: p.accent } : DEFAULT_THEME;
  } catch { return DEFAULT_THEME; }
}
export function saveTheme(t: JdvTheme) {
  try { window.localStorage.setItem(KEY, JSON.stringify(t)); } catch { /* stockage indisponible : le thème reste valable pour la session */ }
}
