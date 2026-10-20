'use client';

import { useEffect, useMemo, useState, type ChangeEvent } from 'react';
import Link from 'next/link';
import { ArrowLeft, Check, Film, Globe2, ImagePlus, Palette, RotateCcw, ShieldCheck, SlidersHorizontal, Type, PanelsTopLeft, Shapes } from 'lucide-react';
import { PRESETS, DEFAULT_THEME, type JdvTheme, isHex } from '@/lib/theme/palettes';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';
import { useJdvTheme } from '@/components/theme/ThemeProvider';
import { useJDV } from '@/contexts/JDVContext';
import { translate } from '@/lib/i18n';

const languages = [{code:'fr',name:'Français'},{code:'en',name:'English'},{code:'pt',name:'Português'},{code:'es',name:'Español'},{code:'ar',name:'العربية'}];
const fonts = [
  { label: 'Inter / système (moderne)', value: 'Inter, ui-sans-serif, system-ui, sans-serif' },
  { label: 'Arial', value: 'Arial, Helvetica, sans-serif' },
  { label: 'Georgia (éditoriale)', value: 'Georgia, "Times New Roman", serif' },
  { label: 'Verdana (lisible)', value: 'Verdana, Geneva, sans-serif' },
  { label: 'Trebuchet', value: '"Trebuchet MS", sans-serif' },
  { label: 'Monospace (technique)', value: 'ui-monospace, SFMono-Regular, Menlo, monospace' },
];
type DesignPrefs = { font: string; radius: string; density: string; cardStyle: string; showMedia: boolean; showHighlights: boolean; showAnimations: boolean; imageUrl: string; videoUrl: string; imageData: string; videoData: string };
const defaultDesign: DesignPrefs = { font: fonts[0].value, radius: '16px', density: 'comfortable', cardStyle: 'soft', showMedia: true, showHighlights: true, showAnimations: true, imageUrl: '', videoUrl: '', imageData: '', videoData: '' };
const inputClass = 'mt-2 w-full rounded-xl border border-border bg-background px-3 py-3 text-sm text-foreground';

function applyDesign(prefs: DesignPrefs) {
  const root = document.documentElement;
  root.style.setProperty('--font-sans', prefs.font);
  root.style.setProperty('--radius', prefs.radius);
  root.style.setProperty('--jdv-radius', prefs.radius);
  root.dataset.jdvShape = 'custom';
  root.dataset.jdvDensity = prefs.density;
  root.dataset.jdvCardStyle = prefs.cardStyle;
  root.dataset.jdvHighlights = String(prefs.showHighlights);
  root.dataset.jdvAnimations = String(prefs.showAnimations);
}

export default function ConcepteurStudioPage() {
  const {theme,setTheme,reset}=useJdvTheme();
  const {user}=useAuth();
  const supabase=useMemo(()=>createClient(),[]);
  const {activeLanguage,setActiveLanguage}=useJDV();
  const [draft,setDraft]=useState<JdvTheme>(theme);
  const [design,setDesign]=useState<DesignPrefs>(defaultDesign);
  const [saved,setSaved]=useState(false);
  const [notice,setNotice]=useState('');
  const [mediaUploading,setMediaUploading]=useState(false);
  useEffect(()=>setDraft(theme),[theme]);
  useEffect(()=>{
    try {
      const raw=localStorage.getItem('jdv-design-v1');
      if(raw){const next={...defaultDesign,...JSON.parse(raw)} as DesignPrefs;setDesign(next);applyDesign(next);}
    } catch {/* Paramètres locaux facultatifs. */}
    const loadGlobal=async()=>{
      try{
        const {data,error}=await supabase.from('jdv_studio_settings').select('config').eq('scope_key','global').maybeSingle();
        const config=data?.config as {theme?:JdvTheme;design?:Partial<DesignPrefs>}|null;
        if(!error&&config){
          if(config.theme&&isHex(config.theme.primary)&&isHex(config.theme.accent)){setDraft(config.theme);setTheme(config.theme);}
          if(config.design){const next={...defaultDesign,...config.design} as DesignPrefs;setDesign(next);applyDesign(next);try{localStorage.setItem('jdv-design-v1',JSON.stringify(next));}catch{}}
        }
      }catch{/* Le Studio reste utilisable localement si le stockage global n'est pas déployé. */}
    };
    void loadGlobal();
  },[supabase,setTheme]);
  const updateDesign=(patch:Partial<DesignPrefs>)=>{setDesign(current=>({...current,...patch}));setSaved(false);};
  const apply=async()=>{
    setTheme(draft);
    try { localStorage.setItem('jdv-design-v1',JSON.stringify(design)); } catch { setNotice('Le thème est appliqué, mais certains médias sont trop volumineux pour être conservés sur cet appareil.'); }
    applyDesign(design);setSaved(true);setNotice('Identité visuelle appliquée sur cet appareil.');
    if(user){
      const globalDesign={...design,imageData:'',videoData:''};
      const {error}=await supabase.from('jdv_studio_settings').upsert({scope_key:'global',config:{theme:draft,design:globalDesign},updated_by:user.id},{onConflict:'scope_key'});
      if(error)setNotice('Réglages locaux appliqués. Publication globale non effectuée : '+error.message);
      else setNotice('Réglages appliqués et publiés globalement pour les interfaces JDV.');
    }else{
      setNotice('Réglages locaux appliqués. Connectez-vous en Super Admin pour publier les réglages à toute la plateforme.');
    }
  };
  const resetAll=async()=>{
    reset();setDraft(DEFAULT_THEME);setDesign(defaultDesign);
    try{localStorage.removeItem('jdv-design-v1');}catch{}
    applyDesign(defaultDesign);setSaved(false);setNotice('Réglages locaux du Studio réinitialisés.');
    if(user){
      const {error}=await supabase.from('jdv_studio_settings').upsert({scope_key:'global',config:{theme:DEFAULT_THEME,design:defaultDesign},updated_by:user.id},{onConflict:'scope_key'});
      if(error)setNotice('Réglages locaux réinitialisés ; la réinitialisation globale a échoué : '+error.message);
      else setNotice('Réglages globaux et locaux réinitialisés.');
    }
  };
  const change=(key:'primary'|'accent',value:string)=>{if(isHex(value)){setDraft(current=>({...current,[key]:value}));setSaved(false);}};
  const handleMedia=async(kind:'imageData'|'videoData',event:ChangeEvent<HTMLInputElement>)=>{
    const file=event.target.files?.[0];if(!file)return;
    const expected=kind==='imageData'?'image/':'video/';
    if(!file.type.startsWith(expected)){setNotice(kind==='imageData'?'Choisissez un fichier image.':'Choisissez un fichier vidéo.');return;}
    if(file.size>10*1024*1024){setNotice('Fichier trop volumineux : limite du Studio 10 Mo.');return;}
    setMediaUploading(true);setNotice('Téléversement du média…');
    try{
      const safeName=file.name.replace(/[^a-zA-Z0-9._-]/g,'-');
      const storagePath='global/'+kind.replace('Data','')+'-'+Date.now()+'-'+safeName;
      const uploaded=await supabase.storage.from('jdv-studio-media').upload(storagePath,file,{upsert:true,contentType:file.type});
      if(!uploaded.error&&uploaded.data){
        const publicUrl=supabase.storage.from('jdv-studio-media').getPublicUrl(uploaded.data.path).data.publicUrl;
        updateDesign(kind==='imageData'?{imageUrl:publicUrl,imageData:''}:{videoUrl:publicUrl,videoData:''});
        setSaved(false);setNotice('Média téléversé. Cliquez sur « Appliquer » pour publier sa référence dans le Studio global.');
      }else if(file.size<=1_200_000){
        const reader=new FileReader();
        reader.onload=()=>{const value=String(reader.result||'');updateDesign(kind==='imageData'?{imageData:value,imageUrl:''}:{videoData:value,videoUrl:''});setSaved(false);setNotice('Aperçu local chargé. Le stockage global est indisponible ; ce fichier ne sera pas partagé entre appareils.');};
        reader.onerror=()=>setNotice('Impossible de lire ce fichier.');
        reader.readAsDataURL(file);
      }else{
        setNotice('Téléversement impossible : '+(uploaded.error?.message||'stockage non configuré')+'. Appliquez la migration Studio puis réessayez.');
      }
    }catch(e){setNotice('Téléversement non disponible : '+(e instanceof Error?e.message:'erreur inconnue'));}
    finally{setMediaUploading(false);}
  };
  return <main className="min-h-screen bg-background text-foreground">
    <header className="border-b border-border bg-card/80"><div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-4"><Link href="/hidden-concepteur-gate/dashboard" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft size={16}/> Portail concepteur</Link><span className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1.5 text-xs font-semibold"><ShieldCheck size={14}/> Studio global</span></div></header>
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end"><div className="max-w-3xl"><p className="text-xs font-bold uppercase tracking-[.2em] text-accent">JDV GLOBAL CENTER · DESIGN SYSTEM</p><h1 className="mt-2 text-3xl font-black sm:text-4xl">{translate(activeLanguage,'studioTitle')}</h1><p className="mt-3 text-muted-foreground">Réglez les couleurs, les formes, la police, la densité et les médias. Prévisualisez puis appliquez les préférences visuelles de cet appareil.</p></div><div className="flex flex-wrap gap-2"><button type="button" onClick={apply} className="inline-flex items-center gap-2 rounded-xl bg-accent px-5 py-3 font-bold text-white"><Check size={16}/> Appliquer les réglages</button><button type="button" onClick={resetAll} className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-3 text-sm font-semibold"><RotateCcw size={15}/> Réinitialiser</button></div></div>
      {notice&&<p role="status" className="mt-4 rounded-xl border border-accent/30 bg-accent/5 p-3 text-sm">{notice}</p>}
      <div className="mt-7 grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(340px,.8fr)]">
        <div className="space-y-6">
          <section className="rounded-3xl border border-border bg-card p-5 sm:p-7"><div className="flex items-center gap-3"><Palette className="text-accent" size={23}/><h2 className="text-xl font-bold">Thèmes et couleurs</h2></div><div className="mt-5 grid gap-3 sm:grid-cols-2">{PRESETS.map(p=><button type="button" key={p.id} onClick={()=>{setDraft(p.theme);setSaved(false)}} className={'flex items-center gap-3 rounded-2xl border p-3 text-left transition '+(draft.primary===p.theme.primary&&draft.accent===p.theme.accent?'border-accent ring-2 ring-accent/20':'border-border hover:border-accent/50')}><span className="flex -space-x-1"><span className="h-8 w-8 rounded-full border-2 border-card" style={{backgroundColor:p.theme.primary}}/><span className="h-8 w-8 rounded-full border-2 border-card" style={{backgroundColor:p.theme.accent}}/></span><span className="min-w-0 flex-1"><span className="block text-sm font-bold">{p.name}</span><span className="block text-xs text-muted-foreground">{p.theme.primary} · {p.theme.accent}</span></span></button>)}</div>
            <div className="mt-5 grid gap-4 sm:grid-cols-2"><label className="rounded-xl border border-border p-3 text-sm font-semibold">Couleur principale<div className="mt-3 flex items-center gap-3"><input aria-label="Choisir la couleur principale" type="color" value={draft.primary} onChange={e=>change('primary',e.target.value)} className="h-11 w-14 cursor-pointer rounded border-0 bg-transparent"/><code className="text-xs">{draft.primary}</code></div></label><label className="rounded-xl border border-border p-3 text-sm font-semibold">Couleur d’accent<div className="mt-3 flex items-center gap-3"><input aria-label="Choisir la couleur d’accent" type="color" value={draft.accent} onChange={e=>change('accent',e.target.value)} className="h-11 w-14 cursor-pointer rounded border-0 bg-transparent"/><code className="text-xs">{draft.accent}</code></div></label></div>
          </section>
          <section className="rounded-3xl border border-border bg-card p-5 sm:p-7"><div className="flex items-center gap-3"><Shapes className="text-accent" size={22}/><h2 className="text-xl font-bold">Formes et typographie</h2></div><div className="mt-5 grid gap-4 sm:grid-cols-2"><label className="text-sm font-semibold">Police d’écriture<select className={inputClass} value={design.font} onChange={e=>updateDesign({font:e.target.value})}>{fonts.map(f=><option key={f.value} value={f.value}>{f.label}</option>)}</select></label><label className="text-sm font-semibold">Arrondi des composants<select className={inputClass} value={design.radius} onChange={e=>updateDesign({radius:e.target.value})}><option value="4px">Carré / technique</option><option value="10px">Discret</option><option value="16px">Arrondi moderne</option><option value="24px">Très arrondi</option><option value="999px">Pilule</option></select></label><label className="text-sm font-semibold">Densité de l’interface<select className={inputClass} value={design.density} onChange={e=>updateDesign({density:e.target.value})}><option value="compact">Compacte</option><option value="comfortable">Confortable</option><option value="spacious">Aérée</option></select></label><label className="text-sm font-semibold">Style des cartes<select className={inputClass} value={design.cardStyle} onChange={e=>updateDesign({cardStyle:e.target.value})}><option value="flat">Plat / minimaliste</option><option value="soft">Doux / classique</option><option value="outlined">Contours marqués</option></select></label></div><div className="mt-5 space-y-3 text-sm"><label className="flex items-center gap-3"><input type="checkbox" checked={design.showHighlights} onChange={e=>updateDesign({showHighlights:e.target.checked})}/> Afficher les accents et éléments mis en évidence</label><label className="flex items-center gap-3"><input type="checkbox" checked={design.showAnimations} onChange={e=>updateDesign({showAnimations:e.target.checked})}/> Autoriser les animations de l’interface</label><label className="flex items-center gap-3"><input type="checkbox" checked={design.showMedia} onChange={e=>updateDesign({showMedia:e.target.checked})}/> Afficher le bloc média personnalisé</label></div></section>
          <section className="rounded-3xl border border-border bg-card p-5 sm:p-7"><div className="flex items-center gap-3"><ImagePlus className="text-accent" size={22}/><h2 className="text-xl font-bold">Images et vidéos</h2></div><p className="mt-2 text-sm text-muted-foreground">Ajoutez un visuel à l’aperçu avec une URL ou un fichier léger. Les fichiers de marque sont téléversés vers le stockage sécurisé JDV et ne sont accessibles en écriture qu’aux Super Admins ; l’URL publiée est ensuite partagée sur les interfaces.</p><div className="mt-5 grid gap-4 md:grid-cols-2"><div className="rounded-2xl border border-border p-4"><label className="text-sm font-semibold">Image par URL<input className={inputClass} type="url" placeholder="https://…" value={design.imageUrl} onChange={e=>updateDesign({imageUrl:e.target.value,imageData:''})}/></label><label className="mt-4 block text-sm font-semibold">Ou choisir un fichier<input className="mt-2 block w-full text-sm" type="file" accept="image/*" onChange={e=>void handleMedia('imageData',e)} disabled={mediaUploading}/></label>{(design.imageData||design.imageUrl)&&<img src={design.imageData||design.imageUrl} alt="Aperçu du média personnalisé" className="mt-4 max-h-48 w-full rounded-xl object-cover"/>}</div><div className="rounded-2xl border border-border p-4"><label className="text-sm font-semibold">Vidéo par URL<input className={inputClass} type="url" placeholder="https://…" value={design.videoUrl} onChange={e=>updateDesign({videoUrl:e.target.value,videoData:''})}/></label><label className="mt-4 block text-sm font-semibold">Ou choisir un fichier vidéo<input className="mt-2 block w-full text-sm" type="file" accept="video/*" onChange={e=>void handleMedia('videoData',e)} disabled={mediaUploading}/></label>{(design.videoData||design.videoUrl)&&<video src={design.videoData||design.videoUrl} controls className="mt-4 max-h-48 w-full rounded-xl bg-black"/>}</div></div></section>
        </div>
        <div className="space-y-6">
          <section className="rounded-3xl border border-border bg-card p-5 sm:p-7"><div className="flex items-center gap-3"><PanelsTopLeft className="text-accent" size={22}/><h2 className="text-xl font-bold">Aperçu en direct</h2></div><div className="mt-5 overflow-hidden border border-border bg-background" style={{borderRadius:design.radius,fontFamily:design.font}}><div className="flex items-center justify-between gap-2 p-4" style={{backgroundColor:draft.primary,color:'#fff'}}><span className="font-extrabold">JDV GLOBAL CENTER</span><span className="px-3 py-1 text-xs font-bold" style={{backgroundColor:draft.accent,color:'#fff',borderRadius:design.radius}}>Studio</span></div><div className="p-4" style={{padding:design.density==='compact'?'12px':design.density==='spacious'?'28px':'20px'}}><p className="text-lg font-bold">Votre interface personnalisée</p><p className="mt-1 text-sm text-muted-foreground">Aperçu de la police, des formes, des couleurs et de la densité.</p><button type="button" className="mt-4 px-4 py-2 text-sm font-bold text-white" style={{backgroundColor:draft.accent,borderRadius:design.radius}}>Bouton exemple</button>{design.showHighlights&&<p className="mt-4 rounded-xl border p-3 text-sm" style={{borderColor:draft.accent,color:draft.primary,borderRadius:design.radius}}>Élément mis en évidence</p>}{design.showMedia&&(design.imageData||design.imageUrl)&&<img src={design.imageData||design.imageUrl} alt="Visuel de démonstration" className="mt-4 max-h-40 w-full object-cover" style={{borderRadius:design.radius}}/>}{design.showMedia&&(design.videoData||design.videoUrl)&&<video src={design.videoData||design.videoUrl} controls className="mt-4 max-h-40 w-full bg-black" style={{borderRadius:design.radius}}/>}</div></div><div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground"><Type size={16}/> Police choisie : {fonts.find(f=>f.value===design.font)?.label||'Personnalisée'}</div></section>
          <section className="rounded-3xl border border-border bg-card p-5 sm:p-7"><div className="flex items-center gap-3"><Globe2 className="text-accent" size={22}/><h2 className="text-xl font-bold">Langue de l’interface</h2></div><label className="mt-5 block text-sm font-semibold">Langue préférée<select value={activeLanguage} onChange={e=>setActiveLanguage(e.target.value)} className={inputClass}>{languages.map(l=><option key={l.code} value={l.code}>{l.name}</option>)}</select></label><p className="mt-3 text-xs leading-5 text-muted-foreground">La préférence est mémorisée sur cet appareil et la direction RTL est activée pour l’arabe. Seuls les textes déjà internationalisés sont traduits ; chaque module doit encore intégrer ses propres clés.</p></section>
          <section className="rounded-3xl border border-border bg-card p-5 sm:p-7"><div className="flex items-center gap-3"><SlidersHorizontal size={22} className="text-accent"/><h2 className="text-xl font-bold">Administration et modules</h2></div><div className="mt-4 grid gap-2"><Link href="/hidden-concepteur-gate/dashboard/controle-plateforme" className="rounded-xl border border-border p-3 text-sm font-semibold hover:border-accent">Contrôle global de la plateforme →</Link><Link href="/super-admin" className="rounded-xl border border-border p-3 text-sm font-semibold hover:border-accent">Administration principale →</Link><Link href="/immo/construction" className="rounded-xl border border-border p-3 text-sm font-semibold hover:border-accent">Studio construction JDV Immo →</Link><Link href="/immo/partenaires" className="rounded-xl border border-border p-3 text-sm font-semibold hover:border-accent">Partenaires, mandats et commissions →</Link></div></section>
        </div>
      </div>
      <div className="mt-6 flex flex-wrap items-center gap-3"><button type="button" onClick={apply} className="inline-flex items-center gap-2 rounded-xl bg-accent px-5 py-3 font-bold text-white"><Check size={16}/> Appliquer et enregistrer</button>{saved&&<span role="status" className="text-sm font-semibold text-emerald-600">Réglages appliqués.</span>}</div>
      <p className="mt-5 text-xs leading-5 text-muted-foreground">Les réglages de Studio sont persistés dans le navigateur de cet appareil. La synchronisation serveur, le partage des médias et le déploiement global nécessitent le raccordement des tables et du stockage sécurisé ; cette page ne prétend pas encore publier des fichiers dans Supabase.</p>
    </div>
  </main>;
}
