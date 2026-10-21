'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Check, Eye, Monitor, Smartphone, Tablet, MousePointer2, Save, RotateCcw, ExternalLink } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

type DesignRule = { selector: string; styles: Record<string, string>; text?: string };
type Config = { designEditor?: { rulesByPath?: Record<string, DesignRule[]> }; [key: string]: unknown };
type Selected = { selector: string; tag: string; text: string; styles: Record<string, string> };

const editableStyles = [
  { key: 'color', label: 'Couleur du texte', type: 'color', fallback: '#172033' },
  { key: 'background-color', label: 'Couleur de fond', type: 'color', fallback: '#ffffff' },
  { key: 'font-size', label: 'Taille du texte', type: 'size', fallback: '16px' },
  { key: 'font-weight', label: 'Graisse du texte', type: 'weight', fallback: '600' },
  { key: 'padding', label: 'Espacement intérieur', type: 'size', fallback: '16px' },
  { key: 'margin', label: 'Espacement extérieur', type: 'size', fallback: '0px' },
  { key: 'border-radius', label: 'Arrondi', type: 'size', fallback: '12px' },
  { key: 'border', label: 'Bordure', type: 'text', fallback: '1px solid #d1d5db' },
  { key: 'box-shadow', label: 'Ombre', type: 'text', fallback: '0 4px 18px rgba(15,23,42,.12)' },
  { key: 'width', label: 'Largeur', type: 'size', fallback: 'auto' },
  { key: 'min-height', label: 'Hauteur minimale', type: 'size', fallback: 'auto' },
  { key: 'position', label: 'Position CSS', type: 'text', fallback: 'static' },
  { key: 'text-align', label: 'Alignement du texte', type: 'align', fallback: 'left' },
  { key: 'opacity', label: 'Transparence (0–1)', type: 'size', fallback: '1' },
  { key: 'transform', label: 'Transformation CSS', type: 'text', fallback: 'none' },
];

function buildSelector(element: Element): string {
  const parts: string[] = [];
  let node: Element | null = element;
  while (node && node !== node.ownerDocument.body && parts.length < 6) {
    let part = node.tagName.toLowerCase();
    if (node.id && /^[a-zA-Z][\w:-]*$/.test(node.id)) {
      part += '#' + node.id;
      parts.unshift(part);
      break;
    }
    const parent: Element | null = node.parentElement;
    if (parent) {
      const same = Array.from(parent.children).filter(child => child.tagName === node!.tagName);
      if (same.length > 1) part += `:nth-of-type(${same.indexOf(node) + 1})`;
    }
    parts.unshift(part);
    node = parent;
  }
  return 'body > ' + parts.join(' > ');
}

export default function StudioVisualEditorPage() {
  const { user } = useAuth();
  const supabase = useMemo(() => createClient(), []);
  const frameRef = useRef<HTMLIFrameElement>(null);
  const [path, setPath] = useState('/');
  const [viewport, setViewport] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [selected, setSelected] = useState<Selected | null>(null);
  const [textDraft, setTextDraft] = useState('');
  const [rules, setRules] = useState<DesignRule[]>([]);
  const [notice, setNotice] = useState('Choisissez une page, puis cliquez sur un élément dans l’aperçu pour le personnaliser.');
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const rulesRef = useRef<DesignRule[]>(rules);
  useEffect(() => { rulesRef.current = rules; }, [rules]);

  const previewWidth = viewport === 'mobile' ? '390px' : viewport === 'tablet' ? '820px' : '100%';

  const refreshRules = useCallback(async (targetPath: string) => {
    try {
      const { data, error } = await supabase.from('jdv_studio_settings').select('config').eq('scope_key', 'global').maybeSingle();
      if (error) throw error;
      const config = (data?.config ?? {}) as Config;
      setRules(config.designEditor?.rulesByPath?.[targetPath] ?? []);
    } catch (error) {
      setNotice('Lecture des réglages impossible : ' + (error instanceof Error ? error.message : 'vérifiez la table jdv_studio_settings et ses droits.'));
    }
  }, [supabase]);

  useEffect(() => { void refreshRules(path); }, [path, refreshRules]);

  const injectSelectionMode = useCallback(() => {
    const frame = frameRef.current;
    const doc = frame?.contentDocument;
    if (!doc) return;
    const win = frame?.contentWindow;
    if (!win) return;
    if (doc.documentElement.dataset.jdvEditorListeners === 'true') return;
    doc.documentElement.dataset.jdvEditorListeners = 'true';
    const old = doc.getElementById('jdv-editor-selection-style');
    old?.remove();
    const selectionStyle = doc.createElement('style');
    selectionStyle.id = 'jdv-editor-selection-style';
    selectionStyle.textContent = '[data-jdv-editor-hover] { outline: 2px dashed #7c3aed !important; outline-offset: 2px !important; cursor: crosshair !important; } [data-jdv-editor-selected] { outline: 3px solid #7c3aed !important; outline-offset: 2px !important; }';
    doc.head.appendChild(selectionStyle);
    doc.addEventListener('pointerover', (event) => {
      const target = event.target;
      if (target && (target as Node).nodeType === 1) (target as Element).setAttribute('data-jdv-editor-hover', 'true');
    }, true);
    doc.addEventListener('pointerout', (event) => {
      const target = event.target;
      if (target && (target as Node).nodeType === 1) (target as Element).removeAttribute('data-jdv-editor-hover');
    }, true);
    doc.addEventListener('click', (event) => {
      const target = event.target;
      if (!target || (target as Node).nodeType !== 1) return;
      const element = (target as Element).closest('body *');
      if (!element || element.closest('[data-jdv-editor-chrome]')) return;
      event.preventDefault();
      event.stopPropagation();
      doc.querySelectorAll('[data-jdv-editor-selected]').forEach(el => el.removeAttribute('data-jdv-editor-selected'));
      element.setAttribute('data-jdv-editor-selected', 'true');
      const selector = buildSelector(element);
      const computed = win.getComputedStyle(element);
      const saved = rulesRef.current.find(rule => rule.selector === selector)?.styles ?? {};
      setSelected({
        selector,
        tag: element.tagName.toLowerCase(),
        text: saved.text ?? (element.textContent ?? '').trim().replace(/\s+/g, ' ').slice(0, 90),
        styles: {
          color: saved.color ?? computed.color,
          'background-color': saved['background-color'] ?? computed.backgroundColor,
          'font-size': saved['font-size'] ?? computed.fontSize,
          'font-weight': saved['font-weight'] ?? computed.fontWeight,
          padding: saved.padding ?? computed.padding,
          margin: saved.margin ?? computed.margin,
          'border-radius': saved['border-radius'] ?? computed.borderRadius,
          border: saved.border ?? computed.border,
          'box-shadow': saved['box-shadow'] ?? computed.boxShadow,
          width: saved.width ?? computed.width,
          'text-align': saved['text-align'] ?? computed.textAlign,
          'min-height': saved['min-height'] ?? computed.minHeight,
          position: saved.position ?? computed.position,
          opacity: saved.opacity ?? computed.opacity,
          transform: saved.transform ?? computed.transform,
        },
      });
      setTextDraft(saved.text ?? ((element.children.length === 0 ? element.textContent : '') ?? '').trim().slice(0, 500));
      setNotice('Élément sélectionné. Ajustez les propriétés à droite, puis enregistrez.');
    }, true);
  }, []);

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;
    const onLoad = () => {
      setLoaded(true);
      injectSelectionMode();
      const doc = frame.contentDocument;
      if (!doc) return;
      for (const rule of rulesRef.current) {
        let element: Element | null = null;
        try { element = doc.querySelector(rule.selector); } catch { element = null; }
        if (!element) continue;
        for (const [key, value] of Object.entries(rule.styles)) (element as HTMLElement).style.setProperty(key, value);
        if (typeof rule.text === 'string' && element.children.length === 0) element.textContent = rule.text;
      }
    };
    frame.addEventListener('load', onLoad);
    return () => frame.removeEventListener('load', onLoad);
  }, [injectSelectionMode]);

  const changeStyle = (key: string, value: string) => {
    if (!selected) return;
    const next = { ...selected, styles: { ...selected.styles, [key]: value } };
    setSelected(next);
    const doc = frameRef.current?.contentDocument;
    const element = doc?.querySelector('[data-jdv-editor-selected]');
    if (element) (element as HTMLElement).style.setProperty(key, value);
    setRules(current => {
      const found = current.find(rule => rule.selector === next.selector);
      if (found) return current.map(rule => rule.selector === next.selector ? { ...rule, styles: { ...rule.styles, [key]: value } } : rule);
      return [...current, { selector: next.selector, styles: { [key]: value } }];
    });
  };

  const changeText = (value: string) => {
    setTextDraft(value);
    if (!selected) return;
    const doc = frameRef.current?.contentDocument;
    const element = doc?.querySelector('[data-jdv-editor-selected]') as HTMLElement | null;
    if (!element) return;
    if (element.children.length > 0) {
      setNotice('Pour protéger la structure de la page, le texte est éditable directement uniquement sur les éléments sans sous-éléments. Les styles restent modifiables.');
      return;
    }
    element.textContent = value;
    setSelected(current => current ? { ...current, text: value } : current);
    setRules(current => {
      const found = current.find(rule => rule.selector === selected.selector);
      if (found) return current.map(rule => rule.selector === selected.selector ? { ...rule, text: value } : rule);
      return [...current, { selector: selected.selector, styles: {}, text: value }];
    });
  };

  const save = async () => {
    if (!user) { setNotice('Connectez-vous avec un compte autorisé à gérer le Studio avant de publier.'); return; }
    setBusy(true);
    try {
      const { data, error: readError } = await supabase.from('jdv_studio_settings').select('config').eq('scope_key', 'global').maybeSingle();
      if (readError) throw readError;
      const existing = (data?.config ?? {}) as Config;
      const previous = existing.designEditor?.rulesByPath ?? {};
      const config = {
        ...existing,
        designEditor: {
          ...(existing.designEditor ?? {}),
          rulesByPath: { ...previous, [path]: rules },
          updatedAt: new Date().toISOString(),
          updatedBy: user.id,
        },
      };
      const { error } = await supabase.from('jdv_studio_settings').upsert({
        scope_key: 'global', config, updated_by: user.id,
      }, { onConflict: 'scope_key' });
      if (error) throw error;
      setNotice('Design sauvegardé. Les règles sont enregistrées pour cette page ; rechargez la page concernée pour vérifier le rendu publié.');
    } catch (error) {
      setNotice('Sauvegarde impossible : ' + (error instanceof Error ? error.message : 'vérifiez les droits Super Admin et la configuration Supabase.'));
    } finally {
      setBusy(false);
    }
  };

  const clearSelected = () => {
    if (!selected) return;
    const doc = frameRef.current?.contentDocument;
    const element = doc?.querySelector('[data-jdv-editor-selected]') as HTMLElement | null;
    if (element) {
      for (const property of editableStyles) element.style.removeProperty(property.key);
      element.removeAttribute('data-jdv-editor-selected');
    }
    setRules(current => current.filter(rule => rule.selector !== selected.selector));
    setSelected(null);
    setNotice('Style personnalisé retiré de la sélection. Enregistrez pour confirmer la suppression.');
  };

  const navigatePreview = () => {
    const normalized = path.startsWith('/') ? path : '/' + path;
    setPath(normalized);
    setSelected(null);
    setLoaded(false);
    if (frameRef.current) frameRef.current.src = normalized;
  };

  return <main className="min-h-screen bg-background text-foreground">
    <header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur">
      <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-3 px-4 py-3">
        <Link href="/hidden-concepteur-gate/dashboard/studio" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft size={16}/> Retour au Studio</Link>
        <div><p className="text-xs font-bold uppercase tracking-[.18em] text-accent">JDV GLOBAL CENTER · STUDIO VISUEL</p><h1 className="text-xl font-black sm:text-2xl">Mon éditeur d’interface</h1></div>
        <button type="button" onClick={save} disabled={busy} className="inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2.5 font-bold text-white disabled:opacity-50"><Save size={16}/>{busy ? 'Enregistrement…' : 'Enregistrer le design'}</button>
      </div>
    </header>
    <div className="mx-auto max-w-[1600px] px-4 py-5">
      {notice && <p role="status" className="mb-4 rounded-xl border border-border bg-card p-3 text-sm">{notice}</p>}
      <div className="mb-4 flex flex-wrap items-end gap-3 rounded-2xl border border-border bg-card p-3">
        <label className="min-w-[220px] flex-1 text-sm font-semibold">Page à personnaliser
          <input value={path} onChange={e => setPath(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') navigatePreview(); }} placeholder="/immo" className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2.5 font-normal"/>
        </label>
        <button type="button" onClick={navigatePreview} className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-bold"><Eye size={16}/> Charger l’aperçu</button>
        <div className="flex gap-1 rounded-xl border border-border p-1">
          <button title="Ordinateur" onClick={() => setViewport('desktop')} className={'rounded-lg p-2 '+(viewport==='desktop'?'bg-accent text-white':'')}><Monitor size={18}/></button>
          <button title="Tablette" onClick={() => setViewport('tablet')} className={'rounded-lg p-2 '+(viewport==='tablet'?'bg-accent text-white':'')}><Tablet size={18}/></button>
          <button title="Téléphone" onClick={() => setViewport('mobile')} className={'rounded-lg p-2 '+(viewport==='mobile'?'bg-accent text-white':'')}><Smartphone size={18}/></button>
        </div>
        <a href={path} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl border border-border px-3 py-2.5 text-sm"><ExternalLink size={15}/> Ouvrir la page</a>
      </div>
      <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
        <section className="min-w-0 overflow-hidden rounded-2xl border border-border bg-muted/40">
          <div className="flex items-center justify-between border-b border-border bg-card px-4 py-2 text-xs text-muted-foreground"><span><MousePointer2 size={14} className="mr-1 inline"/> Cliquez sur un élément pour le sélectionner</span><span>{loaded ? 'Aperçu chargé' : 'Chargement de la page…'}</span></div>
          <div className="overflow-auto p-2 sm:p-4">
            <div className="mx-auto overflow-hidden rounded-xl border border-border bg-white shadow-lg" style={{ width: previewWidth, maxWidth: '100%', minHeight: '70vh' }}>
              <iframe ref={frameRef} title="Aperçu interactif de JDV Global Center" src={path} onLoad={() => { setLoaded(true); injectSelectionMode(); }} className="block min-h-[70vh] w-full border-0" style={{ width: '100%' }}/>
            </div>
          </div>
        </section>
        <aside className="h-fit rounded-2xl border border-border bg-card p-4 xl:sticky xl:top-24">
          <div className="mb-4 flex items-center justify-between"><div><h2 className="font-bold">Propriétés</h2><p className="text-xs text-muted-foreground">{selected ? '<' + selected.tag + '> · ' + (selected.text || 'sans texte') : 'Aucun élément sélectionné'}</p></div><MousePointer2 size={18} className="text-accent"/></div>
          {!selected ? <div className="rounded-xl border border-dashed border-border p-5 text-sm text-muted-foreground">Cliquez sur un titre, un bouton, une carte ou une section dans l’aperçu pour commencer à la personnaliser.</div> : <div className="space-y-3">
            <label className="block text-xs font-semibold text-muted-foreground">Texte du contenu
              <textarea value={textDraft} onChange={e => changeText(e.target.value)} rows={3} className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground" placeholder={selected.text || 'Texte de l’élément'}/>
              <span className="mt-1 block font-normal">Pour préserver les cartes et boutons composés de plusieurs éléments, le texte direct est modifiable lorsque l’élément sélectionné n’a pas d’enfant.</span>
            </label>
            {editableStyles.map(property => <label key={property.key} className="block text-xs font-semibold text-muted-foreground">{property.label}
              {property.type === 'color' ? <div className="mt-1 flex items-center gap-2"><input type="color" value={/^#[0-9a-fA-F]{6}$/.test(selected.styles[property.key]) ? selected.styles[property.key] : property.fallback} onChange={e => changeStyle(property.key, e.target.value)} className="h-9 w-12 rounded border-0 bg-transparent"/><input value={selected.styles[property.key]} onChange={e => changeStyle(property.key, e.target.value)} className="min-w-0 flex-1 rounded-lg border border-border bg-background px-2 py-2 text-xs text-foreground"/></div>
              : property.type === 'weight' ? <select value={selected.styles[property.key]} onChange={e => changeStyle(property.key,e.target.value)} className="mt-1 w-full rounded-lg border border-border bg-background px-2 py-2 text-sm text-foreground"><option value="400">Normal</option><option value="500">Moyen</option><option value="600">Semi-gras</option><option value="700">Gras</option><option value="800">Très gras</option><option value="900">Noir</option></select>
              : property.type === 'align' ? <select value={selected.styles[property.key]} onChange={e => changeStyle(property.key,e.target.value)} className="mt-1 w-full rounded-lg border border-border bg-background px-2 py-2 text-sm text-foreground"><option value="left">Gauche</option><option value="center">Centré</option><option value="right">Droite</option><option value="justify">Justifié</option></select>
              : <input value={selected.styles[property.key]} onChange={e => changeStyle(property.key,e.target.value)} className="mt-1 w-full rounded-lg border border-border bg-background px-2 py-2 text-sm text-foreground" placeholder={property.fallback}/>}
            </label>)}
            <button type="button" onClick={clearSelected} className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-border px-3 py-2.5 text-sm font-semibold"><RotateCcw size={15}/> Retirer le style personnalisé</button>
          </div>}
          <div className="mt-5 border-t border-border pt-4"><p className="mb-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">À savoir</p><ul className="space-y-2 text-xs text-muted-foreground"><li>• Les changements de cette première version portent sur les styles, pas sur les données métier.</li><li>• Les styles sont enregistrés par chemin de page.</li><li>• Prévisualisez sur mobile avant de publier.</li></ul></div>
        </aside>
      </div>
    </div>
  </main>;
}
