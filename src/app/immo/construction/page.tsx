'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Download, Home, Printer, Ruler, ShieldCheck, Sparkles, Save } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';

type Level = 'plain-pied' | 'R+1' | 'R+2';
type Room = { name: string; color: string; area: number };

const levels: Record<Level, number> = { 'plain-pied': 1, 'R+1': 2, 'R+2': 3 };
const field = 'w-full rounded-xl border border-border bg-background px-3 py-3 text-sm text-foreground outline-none focus:border-accent';

export default function ImmoConstructionPage() {
  const { user } = useAuth();
  const supabase = useMemo(() => createClient(), []);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [saveError, setSaveError] = useState('');
  const [savedBriefs, setSavedBriefs] = useState<Array<{id:string;title:string;brief_status:string;created_at:string}>>([]);
  const [parcelArea, setParcelArea] = useState('300');
  const [parcelWidth, setParcelWidth] = useState('12');
  const [parcelDepth, setParcelDepth] = useState('25');
  const [buildingType, setBuildingType] = useState('Maison familiale');
  const [levelsValue, setLevelsValue] = useState<Level>('R+1');
  const [bedrooms, setBedrooms] = useState('4');
  const [bathrooms, setBathrooms] = useState('3');
  const [livingRooms, setLivingRooms] = useState('1');
  const [kitchens, setKitchens] = useState('1');
  const [parking, setParking] = useState('1');
  const [style, setStyle] = useState('Contemporain');
  const [notes, setNotes] = useState('');
  const [generated, setGenerated] = useState(false);

  const rooms = useMemo<Room[]>(() => {
    const list: Room[] = [{ name: 'Séjour', color: '#dbeafe', area: 28 }, { name: 'Cuisine', color: '#fef3c7', area: 12 }];
    for (let i = 0; i < Math.min(8, Number(bedrooms) || 0); i++) list.push({ name: 'Chambre ' + (i + 1), color: '#dcfce7', area: 12 });
    for (let i = 0; i < Math.min(6, Number(bathrooms) || 0); i++) list.push({ name: 'Toilette ' + (i + 1), color: '#f3e8ff', area: 4 });
    if (Number(parking) > 0) list.push({ name: 'Parking', color: '#e5e7eb', area: 15 });
    return list;
  }, [bedrooms, bathrooms, parking]);

  const loadBriefs = useCallback(async () => {
    if (!user) return;
    const result = await supabase.from('immo_construction_briefs').select('id,title,brief_status,created_at').eq('user_id', user.id).order('created_at', { ascending: false }).limit(10);
    if (!result.error) setSavedBriefs((result.data ?? []) as Array<{id:string;title:string;brief_status:string;created_at:string}>);
  }, [supabase, user]);
  useEffect(() => { void loadBriefs(); }, [loadBriefs]);

  const saveBrief = async () => {
    if (!user) { setSaveError('Connectez-vous pour enregistrer durablement votre avant-projet.'); return; }
    setSaving(true); setSaveError(''); setSaveMessage('');
    const payload = {
      user_id: user.id,
      title: buildingType + ' · ' + levelsValue + ' · ' + safeParcelArea + ' m²',
      parcel_area: safeParcelArea,
      brief_status: 'draft',
      brief: {
        buildingType, levels: levelsValue, parcelArea: safeParcelArea, parcelWidth: safeWidth, parcelDepth: safeDepth,
        bedrooms: Number(bedrooms) || 0, bathrooms: Number(bathrooms) || 0, livingRooms: Number(livingRooms) || 0,
        kitchens: Number(kitchens) || 0, parking: Number(parking) || 0, style, notes,
        estimatedFootprint: footprint, estimatedFloorArea, roomCount,
        generatedAt: new Date().toISOString(),
        disclaimer: 'Esquisse conceptuelle uniquement; plans exécutifs et conformité à valider par des professionnels habilités.',
      },
    };
    const result = await supabase.from('immo_construction_briefs').insert(payload);
    if (result.error) setSaveError('Enregistrement impossible : ' + result.error.message);
    else { setSaveMessage('Avant-projet enregistré dans votre espace JDV Immo.'); await loadBriefs(); }
    setSaving(false);
  };

  const safeParcelArea = Math.max(0, Number(parcelArea) || 0);
  const safeWidth = Math.max(0, Number(parcelWidth) || 0);
  const safeDepth = Math.max(0, Number(parcelDepth) || 0);
  const footprint = Math.round(Math.min(safeParcelArea * 0.55, safeWidth * safeDepth * 0.55));
  const estimatedFloorArea = footprint * levels[levelsValue];
  const roomCount = (Number(bedrooms) || 0) + (Number(bathrooms) || 0) + (Number(livingRooms) || 0) + (Number(kitchens) || 0);
  const exportBrief = () => {
    const text = [
      'JDV IMMO — BRIEF DE CONCEPTION (AVANT-PROJET NON EXÉCUTIF)',
      'Type : ' + buildingType, 'Niveaux : ' + levelsValue, 'Parcelle : ' + safeParcelArea + ' m² (' + safeWidth + ' m × ' + safeDepth + ' m)',
      'Style : ' + style, 'Chambres : ' + bedrooms, 'Toilettes / salles d’eau : ' + bathrooms,
      'Séjours : ' + livingRooms, 'Cuisines : ' + kitchens, 'Places de parking : ' + parking,
      'Emprise indicative : ' + footprint + ' m²', 'Surface de plancher indicative : ' + estimatedFloorArea + ' m²',
      'Contraintes : ' + (notes || 'À préciser'),
      'Important : schéma conceptuel généré pour cadrage. Les plans exécutifs, la structure, les réseaux, l’implantation réglementaire et les autorisations doivent être validés par des professionnels habilités.'
    ].join('\n');
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'jdv-immo-brief-construction.txt'; a.click(); URL.revokeObjectURL(url);
  };

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-card/80">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-4">
          <Link href="/immo" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft size={16}/> Retour à JDV Immo</Link>
          <span className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1.5 text-xs font-semibold"><Ruler size={14}/> Studio de conception</span>
        </div>
      </header>
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-8 max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-[.2em] text-accent">JDV IMMO · CONSTRUCTION</p>
          <h1 className="mt-2 text-3xl font-black sm:text-4xl">Décrivez votre projet. Préparez votre avant-projet.</h1>
          <p className="mt-3 text-muted-foreground">Renseignez la parcelle, le nombre de niveaux et les pièces souhaitées. JDV prépare un brief structuré et une esquisse indicative pour lancer le travail avec un architecte ou un bureau d’études.</p>
        </div>
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(360px,.95fr)]">
          <section className="rounded-3xl border border-border bg-card p-5 sm:p-7">
            <h2 className="text-xl font-bold">Caractéristiques du projet</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-medium">Type de bâtiment<select className={field + ' mt-2'} value={buildingType} onChange={e=>{setBuildingType(e.target.value);setGenerated(false)}}><option>Maison familiale</option><option>Immeuble locatif</option><option>Villa</option><option>Duplex</option><option>Commerce avec logements</option><option>Bureau</option></select></label>
              <label className="text-sm font-medium">Niveaux<select className={field + ' mt-2'} value={levelsValue} onChange={e=>{setLevelsValue(e.target.value as Level);setGenerated(false)}}><option value="plain-pied">Plain-pied</option><option value="R+1">R+1</option><option value="R+2">R+2</option></select></label>
              <label className="text-sm font-medium">Surface de la parcelle (m²)<input className={field + ' mt-2'} type="number" min="1" max="100000" value={parcelArea} onChange={e=>setParcelArea(e.target.value)}/></label>
              <label className="text-sm font-medium">Style architectural<select className={field + ' mt-2'} value={style} onChange={e=>setStyle(e.target.value)}><option>Contemporain</option><option>Moderne tropical</option><option>Traditionnel revisité</option><option>Minimaliste</option><option>Bioclimatique</option></select></label>
              <label className="text-sm font-medium">Largeur de parcelle (m)<input className={field + ' mt-2'} type="number" min="1" value={parcelWidth} onChange={e=>setParcelWidth(e.target.value)}/></label>
              <label className="text-sm font-medium">Profondeur de parcelle (m)<input className={field + ' mt-2'} type="number" min="1" value={parcelDepth} onChange={e=>setParcelDepth(e.target.value)}/></label>
              <label className="text-sm font-medium">Chambres<input className={field + ' mt-2'} type="number" min="0" max="20" value={bedrooms} onChange={e=>setBedrooms(e.target.value)}/></label>
              <label className="text-sm font-medium">Toilettes / salles d’eau<input className={field + ' mt-2'} type="number" min="0" max="12" value={bathrooms} onChange={e=>setBathrooms(e.target.value)}/></label>
              <label className="text-sm font-medium">Séjours / salons<input className={field + ' mt-2'} type="number" min="0" max="6" value={livingRooms} onChange={e=>setLivingRooms(e.target.value)}/></label>
              <label className="text-sm font-medium">Cuisines<input className={field + ' mt-2'} type="number" min="0" max="6" value={kitchens} onChange={e=>setKitchens(e.target.value)}/></label>
              <label className="text-sm font-medium">Places de parking<input className={field + ' mt-2'} type="number" min="0" max="10" value={parking} onChange={e=>setParking(e.target.value)}/></label>
              <label className="text-sm font-medium sm:col-span-2">Contraintes et souhaits<textarea className={field + ' mt-2'} rows={3} maxLength={1500} value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Orientation, accès, cour, ventilation, personnes à mobilité réduite, budget indicatif…"/></label>
            </div>
            <div className="mt-6 flex flex-wrap gap-3"><button type="button" onClick={()=>setGenerated(true)} className="inline-flex items-center gap-2 rounded-xl bg-accent px-5 py-3 font-bold text-white"><Sparkles size={17}/> Générer l’esquisse indicative</button><button type="button" onClick={()=>void saveBrief()} disabled={saving||!user} className="inline-flex items-center gap-2 rounded-xl border border-accent/40 px-4 py-3 text-sm font-semibold disabled:opacity-50"><Save size={16}/> {saving?'Enregistrement…':'Enregistrer dans mon espace'}</button><button type="button" onClick={exportBrief} className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-3 text-sm font-semibold"><Download size={16}/> Exporter le brief</button><button type="button" onClick={()=>window.print()} className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-3 text-sm font-semibold"><Printer size={16}/> Imprimer</button></div>
          </section>
          <section className="space-y-5">
            <div className="rounded-3xl border border-border bg-card p-5 sm:p-7">
              <div className="flex items-start justify-between gap-3"><div><h2 className="text-xl font-bold">Aperçu de l’avant-projet</h2><p className="mt-1 text-sm text-muted-foreground">Schéma génératif de cadrage · non contractuel</p></div><Home className="text-accent" size={24}/></div>
              <div className="mt-5 rounded-2xl bg-slate-50 p-3 text-slate-900">
                <svg viewBox="0 0 420 300" role="img" aria-label="Esquisse conceptuelle du plan" className="h-auto w-full">
                  <rect x="8" y="8" width="404" height="284" rx="8" fill="#fff" stroke="#94a3b8" strokeDasharray="5 4"/>
                  <text x="20" y="27" fontSize="10" fill="#64748b">PARCELLE · {safeParcelArea} m²</text>
                  <rect x="42" y="42" width="336" height="220" fill="#f8fafc" stroke="#334155" strokeWidth="2"/>
                  {rooms.slice(0, 12).map((room, i) => {
                    const cols = 3; const rows = 4; const w = 336 / cols; const h = 220 / rows;
                    return <g key={room.name}><rect x={42 + (i % cols) * w} y={42 + Math.floor(i / cols) * h} width={w} height={h} fill={room.color} stroke="#64748b" strokeWidth="1.5"/><text x={42 + (i % cols) * w + w / 2} y={42 + Math.floor(i / cols) * h + h / 2} textAnchor="middle" dominantBaseline="middle" fontSize="10" fill="#0f172a">{room.name}</text></g>;
                  })}
                  <text x="210" y="280" textAnchor="middle" fontSize="10" fill="#64748b">Schéma de pièces — implantation à valider</text>
                </svg>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-muted/30 p-3"><p className="text-xs text-muted-foreground">Emprise indicative</p><p className="mt-1 text-xl font-bold">{footprint} m²</p></div>
                <div className="rounded-xl bg-muted/30 p-3"><p className="text-xs text-muted-foreground">Plancher total estimé</p><p className="mt-1 text-xl font-bold">{estimatedFloorArea} m²</p></div>
                <div className="rounded-xl bg-muted/30 p-3"><p className="text-xs text-muted-foreground">Niveaux</p><p className="mt-1 text-lg font-bold">{levelsValue}</p></div>
                <div className="rounded-xl bg-muted/30 p-3"><p className="text-xs text-muted-foreground">Pièces principales et annexes</p><p className="mt-1 text-lg font-bold">{roomCount}</p></div>
              </div>
              {generated && <div role="status" className="mt-4 rounded-xl border border-emerald-600/20 bg-emerald-600/10 p-3 text-sm"><strong>Esquisse préparée.</strong> Le brief est prêt à être transmis à un professionnel pour étude, ajustement et validation.</div>}
            </div>
            <div className="rounded-3xl border border-border bg-card p-5"><h3 className="font-bold">Volume 3D conceptuel</h3><p className="mt-1 text-sm text-muted-foreground">Représentation volumétrique simplifiée du nombre de niveaux, pas un modèle BIM ni un rendu photoréaliste.</p><svg viewBox="0 0 420 190" className="mt-3 h-auto w-full" role="img" aria-label="Volume 3D conceptuel du bâtiment"><polygon points="80,85 210,25 350,80 220,140" fill="#cbd5e1" stroke="#475569"/><polygon points="80,85 220,140 220,170 80,115" fill="#94a3b8" stroke="#475569"/><polygon points="220,140 350,80 350,110 220,170" fill="#64748b" stroke="#475569"/>{Array.from({length: levels[levelsValue]},(_,i)=><g key={i} transform={'translate(0,' + (-i*35) + ')'}><polygon points="95,78 210,25 335,75 220,128" fill="#dbeafe" stroke="#2563eb"/><polygon points="95,78 220,128 220,148 95,98" fill="#93c5fd" stroke="#2563eb"/><polygon points="220,128 335,75 335,95 220,148" fill="#60a5fa" stroke="#2563eb"/></g>)}<text x="210" y="185" textAnchor="middle" fontSize="11" fill="currentColor">{levelsValue} · Volume indicatif</text></svg></div>
          </section>
        </div>
        {(saveMessage||saveError)&&<div role={saveError?'alert':'status'} className={'mt-5 rounded-xl border p-3 text-sm '+(saveError?'border-red-500/30 text-red-600':'border-emerald-500/30 text-emerald-700')}>{saveError||saveMessage}</div>}
        {user&&<section className="mt-6 rounded-2xl border border-border bg-card p-5"><h2 className="font-bold">Mes avant-projets enregistrés</h2><div className="mt-3 grid gap-2 md:grid-cols-2">{savedBriefs.map(item=><article key={item.id} className="rounded-xl border border-border p-3"><p className="text-sm font-semibold">{item.title}</p><p className="mt-1 text-xs text-muted-foreground">{item.brief_status} · {new Date(item.created_at).toLocaleDateString('fr-FR')}</p></article>)}{!savedBriefs.length&&<p className="text-sm text-muted-foreground">Aucun avant-projet enregistré sur ce compte.</p>}</div></section>}
        <div className="mt-6 flex items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4 text-sm"><ShieldCheck size={20} className="mt-0.5 shrink-0 text-amber-600"/><p><strong>Limite professionnelle :</strong> cet outil produit une esquisse et un cahier de besoins. Il ne remplace pas les plans architecturaux exécutifs, les études de sol et de structure, les plans électriques/plomberie, ni les permis. La conformité doit être contrôlée par des professionnels habilités selon le pays et la commune.</p></div>
      </div>
    </main>
  );
}
