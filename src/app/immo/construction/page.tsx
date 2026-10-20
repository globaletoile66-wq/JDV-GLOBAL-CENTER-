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
  const [simulationMode, setSimulationMode] = useState<'exterieur' | 'interieur' | 'plan' | 'facade'>('exterieur');
  const [simulationAngle, setSimulationAngle] = useState(0);
  const [facadeColor, setFacadeColor] = useState('#f1e7d5');
  const [roofColor, setRoofColor] = useState('#475569');
  const [showFurniture, setShowFurniture] = useState(true);

  const rooms = useMemo<Room[]>(() => {
    const list: Room[] = [{ name: 'Séjour', color: '#dbeafe', area: 28 }, { name: 'Cuisine', color: '#fef3c7', area: 12 }];
    for (let i = 0; i < Math.min(8, Number(bedrooms) || 0); i++) list.push({ name: 'Chambre ' + (i + 1), color: '#dcfce7', area: 12 });
    for (let i = 0; i < Math.min(6, Number(bathrooms) || 0); i++) list.push({ name: 'Toilette ' + (i + 1), color: '#f3e8ff', area: 4 });
    if (Number(parking) > 0) list.push({ name: 'Parking', color: '#e5e7eb', area: 15 });
    return list;
  }, [bedrooms, bathrooms, parking]);

  const architecturalRooms = useMemo(() => {
    const requested: Room[] = [
      { name: 'Séjour', color: '#dbeafe', area: 28 },
      { name: 'Cuisine', color: '#fef3c7', area: 12 },
      ...Array.from({ length: Math.min(12, Math.max(0, Number(bedrooms) || 0)) }, (_, i) => ({ name: 'Chambre ' + (i + 1), color: '#dcfce7', area: i === 0 ? 14 : 12 })),
      ...Array.from({ length: Math.min(8, Math.max(0, Number(bathrooms) || 0)) }, (_, i) => ({ name: 'Salle d’eau ' + (i + 1), color: '#f3e8ff', area: 4 })),
      ...Array.from({ length: Math.max(0, Math.min(4, (Number(livingRooms) || 0) - 1)) }, (_, i) => ({ name: 'Salon ' + (i + 2), color: '#dbeafe', area: 16 })),
      ...Array.from({ length: Math.max(0, Math.min(4, (Number(kitchens) || 0) - 1)) }, (_, i) => ({ name: 'Cuisine ' + (i + 2), color: '#fef3c7', area: 8 })),
    ];
    return requested.slice(0, 18);
  }, [bedrooms, bathrooms, livingRooms, kitchens]);

  const planRoomRects = useMemo(() => {
    const x = 58, y = 48, width = 324, rowHeight = 34;
    const rects: Array<Room & { x:number; y:number; width:number; height:number }> = [];
    const roomsToDraw = architecturalRooms;
    if (!roomsToDraw.length) return rects;
    rects.push({ ...roomsToDraw[0], x, y, width, height: rowHeight });
    if (roomsToDraw[1]) rects.push({ ...roomsToDraw[1], x: x + width / 2, y: y + rowHeight, width: width / 2, height: rowHeight });
    if (roomsToDraw[2]) rects.push({ ...roomsToDraw[2], x, y: y + rowHeight, width: width / 2, height: rowHeight });
    roomsToDraw.slice(3).forEach((room, index) => {
      const row = 2 + Math.floor(index / 2);
      const col = index % 2;
      rects.push({ ...room, x: x + col * (width / 2), y: y + row * rowHeight, width: width / 2, height: rowHeight });
    });
    return rects;
  }, [architecturalRooms]);

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

  const submitBrief = async (id:string) => {
    if (!user) return;
    setSaveError(''); setSaveMessage('');
    const result = await supabase.rpc('submit_immo_construction_brief', { p_brief_id: id });
    if (result.error) setSaveError('Soumission impossible : ' + result.error.message);
    else { setSaveMessage('Avant-projet transmis pour revue par un concepteur.'); await loadBriefs(); }
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
      'Simulation : vue ' + simulationMode + ' ; couleur façade ' + facadeColor + ' ; couleur toiture ' + roofColor + ' ; angle indicatif ' + simulationAngle + '° ; mobilier illustratif ' + (showFurniture ? 'activé' : 'désactivé'),
      'Pièces demandées : ' + architecturalRooms.map(room => room.name + ' (~' + room.area + ' m²)').join(', '),
      'Hypothèses : emprise plafonnée à 55 % de la parcelle pour prévisualisation ; surface de plancher calculée par multiplication simple de l’emprise par le nombre de niveaux.',
      'Important : document de cadrage conceptuel. Les dessins ne sont pas des plans cotés d’exécution. Les plans architecturaux exécutifs, la structure, les réseaux, l’implantation réglementaire, les études de sol et les autorisations doivent être validés par des professionnels habilités.'
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
          <p className="mt-3 text-muted-foreground">Décrivez les pièces et les dimensions souhaitées. JDV génère un plan d’agencement préliminaire et un schéma de fondation de principe, que vous pourrez enregistrer et transmettre à un architecte et à un ingénieur structure.</p>
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
              <div className="flex items-start justify-between gap-3"><div><h2 className="text-xl font-bold">Aperçu de l’avant-projet</h2><p className="mt-1 text-sm text-muted-foreground">Plan de pièces et schéma de fondation générés à partir de vos choix · préliminaires</p></div><Home className="text-accent" size={24}/></div>
              <div className="mt-5 rounded-2xl bg-slate-50 p-3 text-slate-900">
                <svg viewBox="0 0 440 450" role="img" aria-label="Plan architectural conceptuel avec pièces, murs et dimensions indicatives" className="h-auto w-full">
                  <rect x="8" y="8" width="424" height="434" rx="8" fill="#fff" stroke="#94a3b8" strokeDasharray="5 4"/>
                  <text x="20" y="27" fontSize="10" fill="#64748b">PLAN RDC · PARCELLE {safeWidth} × {safeDepth} m</text>
                  <line x1="58" y1="38" x2="382" y2="38" stroke="#334155" strokeWidth="1"/>
                  <line x1="58" y1="34" x2="58" y2="42" stroke="#334155"/><line x1="382" y1="34" x2="382" y2="42" stroke="#334155"/>
                  <text x="220" y="34" fontSize="10" textAnchor="middle" fill="#334155">{Math.max(1, safeWidth * 0.7).toFixed(1)} m · largeur bâtie indicative</text>
                  <rect x="58" y="48" width="324" height={Math.min(360, Math.max(136, planRoomRects.reduce((max, r) => Math.max(max, r.y + r.height - 48), 0)))} fill="#fff" stroke="#0f172a" strokeWidth="5"/>
                  {planRoomRects.map((room, i) => <g key={room.name + i}>
                    <rect x={room.x} y={room.y} width={room.width} height={room.height} fill={room.color} stroke="#334155" strokeWidth="1.7"/>
                    <text x={room.x + room.width/2} y={room.y + room.height/2 - 4} textAnchor="middle" dominantBaseline="middle" fontSize={room.width < 100 ? 7 : 9} fill="#0f172a">{room.name}</text>
                    <text x={room.x + room.width/2} y={room.y + room.height/2 + 9} textAnchor="middle" dominantBaseline="middle" fontSize="8" fill="#475569">≈ {room.area} m²</text>
                    {i % 2 === 0 && <line x1={room.x + room.width * .35} y1={room.y} x2={room.x + room.width * .62} y2={room.y} stroke="#fff" strokeWidth="4"/>}
                  </g>)}
                  <path d="M 205 308 L 235 308" stroke="#0f172a" strokeWidth="3"/><path d="M 205 308 A 30 30 0 0 1 235 278" fill="none" stroke="#64748b" strokeWidth="1"/>
                  <text x="220" y="328" textAnchor="middle" fontSize="10" fill="#64748b">Entrée indicative · distribution à ajuster</text>
                  <text x="220" y="342" textAnchor="middle" fontSize="9" fill="#b45309">Schéma de conception — non coté pour exécution</text>
                </svg>
              </div>
              <div className="mt-4 rounded-2xl border border-border p-4">
                <div className="flex flex-wrap items-start justify-between gap-2"><div><h3 className="font-bold">Plan de fondation — schéma de principe</h3><p className="mt-1 text-xs text-muted-foreground">Trame indicative des axes et appuis, non dimensionnée pour construire.</p></div><span className="rounded-full bg-amber-500/10 px-2 py-1 text-xs font-semibold text-amber-700">À valider par ingénieur</span></div>
                <div className="mt-3 rounded-xl bg-white p-2">
                  <svg viewBox="0 0 440 290" role="img" aria-label="Schéma conceptuel de fondation avec semelles, axes et longrines" className="h-auto w-full">
                    <rect x="10" y="10" width="420" height="270" fill="#fff" stroke="#cbd5e1"/>
                    <text x="22" y="28" fontSize="10" fill="#475569">FONDATIONS · TRAME DE PRINCIPE</text>
                    <rect x="66" y="48" width="308" height="194" fill="#f8fafc" stroke="#b45309" strokeWidth="4"/>
                    {[0,1,2,3].map(i=><line key={'v'+i} x1={66+i*102.7} y1="48" x2={66+i*102.7} y2="242" stroke="#c08457" strokeWidth="2.5" strokeDasharray="6 3"/>)}
                    {[0,1,2].map(i=><line key={'h'+i} x1="66" y1={48+i*97} x2="374" y2={48+i*97} stroke="#c08457" strokeWidth="2.5" strokeDasharray="6 3"/>)}
                    {[0,1,2,3].flatMap(col=>[0,1,2].map(row=><g key={col+'-'+row}><rect x={57+col*102.7} y={39+row*97} width="18" height="18" fill="#fde68a" stroke="#92400e" strokeWidth="1.5"/><rect x={61+col*102.7} y={43+row*97} width="10" height="10" fill="#fef3c7" stroke="#92400e" strokeWidth="1"/></g>))}
                    {[0,1,2,3].map(i=><text key={'axis'+i} x={66+i*102.7} y="39" textAnchor="middle" fontSize="9" fill="#334155">{String.fromCharCode(65+i)}</text>)}
                    {[0,1,2].map(i=><text key={'row'+i} x="52" y={52+i*97} textAnchor="end" fontSize="9" fill="#334155">{i+1}</text>)}
                    <text x="220" y="260" textAnchor="middle" fontSize="10" fill="#475569">Carrés : appuis/semelles indicatifs · pointillés : axes</text>
                    <text x="220" y="273" textAnchor="middle" fontSize="9" fill="#b45309">Aucune section ni profondeur structurelle n’est calculée</text>
                  </svg>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-muted/30 p-3"><p className="text-xs text-muted-foreground">Emprise indicative</p><p className="mt-1 text-xl font-bold">{footprint} m²</p></div>
                <div className="rounded-xl bg-muted/30 p-3"><p className="text-xs text-muted-foreground">Plancher total estimé</p><p className="mt-1 text-xl font-bold">{estimatedFloorArea} m²</p></div>
                <div className="rounded-xl bg-muted/30 p-3"><p className="text-xs text-muted-foreground">Niveaux</p><p className="mt-1 text-lg font-bold">{levelsValue}</p></div>
                <div className="rounded-xl bg-muted/30 p-3"><p className="text-xs text-muted-foreground">Pièces principales et annexes</p><p className="mt-1 text-lg font-bold">{roomCount}</p></div>
              </div>
              {generated && <div role="status" className="mt-4 rounded-xl border border-emerald-600/20 bg-emerald-600/10 p-3 text-sm"><strong>Esquisse préparée.</strong> Le brief est prêt à être transmis à un professionnel pour étude, ajustement et validation.</div>}
            </div>
            <div className="rounded-3xl border border-border bg-card p-5 sm:p-7">
              <div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="text-xl font-bold">Simulateur de maison</h3><p className="mt-1 text-sm text-muted-foreground">Explorez une maquette volumétrique liée au nombre de niveaux et aux pièces saisies.</p></div><span className="rounded-full bg-sky-500/10 px-3 py-1 text-xs font-semibold text-sky-700">Prototype interactif</span></div>
              <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Mode de simulation">
                <button type="button" onClick={()=>setSimulationMode('exterieur')} aria-pressed={simulationMode==='exterieur'} className={'rounded-xl px-3 py-2 text-sm font-semibold '+(simulationMode==='exterieur'?'bg-accent text-white':'border border-border')}>Vue extérieure</button>
                <button type="button" onClick={()=>setSimulationMode('interieur')} aria-pressed={simulationMode==='interieur'} className={'rounded-xl px-3 py-2 text-sm font-semibold '+(simulationMode==='interieur'?'bg-accent text-white':'border border-border')}>Vue intérieure</button>
                <button type="button" onClick={()=>setSimulationMode('plan')} aria-pressed={simulationMode==='plan'} className={'rounded-xl px-3 py-2 text-sm font-semibold '+(simulationMode==='plan'?'bg-accent text-white':'border border-border')}>Plan du niveau</button>
                <button type="button" onClick={()=>setSimulationMode('facade')} aria-pressed={simulationMode==='facade'} className={'rounded-xl px-3 py-2 text-sm font-semibold '+(simulationMode==='facade'?'bg-accent text-white':'border border-border')}>Façade avant</button>
              </div>
              <div className="mt-4 overflow-hidden rounded-2xl border border-border bg-slate-100 p-2 text-slate-900 sm:p-4">
                {simulationMode==='exterieur'&&<svg viewBox="0 0 440 270" role="img" aria-label="Maquette 3D conceptuelle de la maison, vue extérieure" className="h-auto w-full">
                  <g transform={'rotate('+simulationAngle+' 220 135)'}>
                    <polygon points="54,100 211,30 386,95 229,166" fill={roofColor} stroke="#334155" strokeWidth="2"/>
                    <polygon points="54,100 229,166 229,244 54,178" fill={facadeColor} stroke="#475569" strokeWidth="2"/>
                    <polygon points="229,166 386,95 386,173 229,244" fill="#d6d3d1" stroke="#475569" strokeWidth="2"/>
                    {Array.from({length:levels[levelsValue]},(_,i)=><g key={i} transform={'translate(0,'+(-i*34)+')'}>
                      <rect x="84" y="117" width="36" height="29" fill="#93c5fd" stroke="#334155" strokeWidth="2"/>
                      <rect x="151" y="143" width="36" height="29" fill="#93c5fd" stroke="#334155" strokeWidth="2"/>
                      <rect x="263" y="154" width="34" height="29" fill="#93c5fd" stroke="#334155" strokeWidth="2"/>
                      <rect x="319" y="130" width="34" height="29" fill="#93c5fd" stroke="#334155" strokeWidth="2"/>
                    </g>)}
                    <rect x="195" y="180" width="24" height="64" fill="#8b5e3c" stroke="#475569" strokeWidth="2"/>
                    <polygon points="48,101 211,25 394,93 386,103 211,37 57,108" fill={roofColor} stroke="#334155" strokeWidth="2"/>
                  </g>
                  <text x="220" y="262" textAnchor="middle" fontSize="11" fill="#334155">{buildingType} · {levelsValue} · style {style}</text>
                </svg>}
                {simulationMode==='interieur'&&<svg viewBox="0 0 440 270" role="img" aria-label="Vue intérieure schématique avec pièces" className="h-auto w-full">
                  <rect x="35" y="28" width="370" height="210" fill="#fff" stroke="#334155" strokeWidth="5"/>
                  {planRoomRects.slice(0,10).map((room,i)=>{const cols=3;const w=370/cols;const h=210/Math.max(2,Math.ceil(Math.min(10,planRoomRects.length)/cols));const x=35+(i%cols)*w;const y=28+Math.floor(i/cols)*h;return <g key={room.name+i}><rect x={x} y={y} width={w} height={h} fill={room.color} stroke="#475569" strokeWidth="2"/><text x={x+w/2} y={y+h/2} textAnchor="middle" dominantBaseline="middle" fontSize="10" fill="#0f172a">{room.name}</text>{showFurniture&&i===0&&<><rect x={x+w*.25} y={y+h*.3} width={w*.5} height={h*.35} rx="4" fill="#64748b"/><circle cx={x+w*.5} cy={y+h*.72} r="5" fill="#a16207"/></>}</g>})}
                  <text x="220" y="257" textAnchor="middle" fontSize="11" fill="#334155">Distribution intérieure schématique · mobilier illustratif</text>
                </svg>}
                {simulationMode==='facade'&&<svg viewBox="0 0 440 270" role="img" aria-label="Élévation de façade avant conceptuelle" className="h-auto w-full">
                  <rect x="18" y="18" width="404" height="234" fill="#f8fafc" stroke="#cbd5e1"/>
                  <line x1="28" y1="226" x2="412" y2="226" stroke="#64748b" strokeWidth="2"/>
                  <rect x="75" y={226-(levels[levelsValue]*62)} width="290" height={levels[levelsValue]*62} fill={facadeColor} stroke="#334155" strokeWidth="2"/>
                  <polygon points={`58,${226-(levels[levelsValue]*62)} 220,${190-(levels[levelsValue]*62)} 382,${226-(levels[levelsValue]*62)}`} fill={roofColor} stroke="#334155" strokeWidth="2"/>
                  {Array.from({length:levels[levelsValue]},(_,i)=><g key={i}>
                    <rect x="105" y={239-(i+1)*62} width="46" height="34" fill="#bfdbfe" stroke="#334155" strokeWidth="2"/>
                    <line x1="128" y1={239-(i+1)*62} x2="128" y2={273-(i+1)*62} stroke="#64748b"/>
                    <rect x="288" y={239-(i+1)*62} width="46" height="34" fill="#bfdbfe" stroke="#334155" strokeWidth="2"/>
                    <line x1="311" y1={239-(i+1)*62} x2="311" y2={273-(i+1)*62} stroke="#64748b"/>
                  </g>)}
                  <rect x="193" y="178" width="54" height="48" fill="#8b5e3c" stroke="#334155" strokeWidth="2"/>
                  <circle cx="235" cy="203" r="2.5" fill="#fef3c7"/>
                  <text x="220" y="244" textAnchor="middle" fontSize="10" fill="#334155">{buildingType} · façade conceptuelle</text>
                  <text x="220" y="260" textAnchor="middle" fontSize="10" fill="#64748b">Ouvertures illustratives · proportions non exécutives</text>
                </svg>}
                {simulationMode==='plan'&&<svg viewBox="0 0 440 270" role="img" aria-label="Plan de niveau schématique de la maison" className="h-auto w-full">
                  <rect x="35" y="25" width="370" height="215" fill="#fff" stroke="#0f172a" strokeWidth="6"/>
                  {planRoomRects.slice(0,12).map((room,i)=>{const cols=3;const w=370/cols;const rows=Math.max(2,Math.ceil(Math.min(12,planRoomRects.length)/cols));const h=215/rows;const x=35+(i%cols)*w;const y=25+Math.floor(i/cols)*h;return <g key={room.name+i}><rect x={x} y={y} width={w} height={h} fill={room.color} stroke="#334155" strokeWidth="2"/><text x={x+w/2} y={y+h/2-4} textAnchor="middle" fontSize="10" fill="#0f172a">{room.name}</text><text x={x+w/2} y={y+h/2+10} textAnchor="middle" fontSize="9" fill="#475569">≈ {room.area} m²</text></g>})}
                  <text x="220" y="258" textAnchor="middle" fontSize="11" fill="#334155">RDC conceptuel · répartition à valider</text>
                </svg>}
              </div>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <label className="text-sm font-medium">Couleur de façade<select className={field+' mt-2'} value={facadeColor} onChange={e=>setFacadeColor(e.target.value)}><option value="#f1e7d5">Sable clair</option><option value="#ffffff">Blanc</option><option value="#d6d3d1">Gris pierre</option><option value="#d9ead3">Vert doux</option><option value="#e7c7a5">Terre cuite claire</option></select></label>
                <label className="text-sm font-medium">Couleur de toiture<select className={field+' mt-2'} value={roofColor} onChange={e=>setRoofColor(e.target.value)}><option value="#475569">Ardoise</option><option value="#7f1d1d">Rouge tuile</option><option value="#166534">Vert profond</option><option value="#1f2937">Anthracite</option></select></label>
                {simulationMode==='exterieur'&&<label className="text-sm font-medium sm:col-span-2">Angle de vue<input className="mt-2 w-full accent-current" type="range" min="-18" max="18" step="1" value={simulationAngle} onChange={e=>setSimulationAngle(Number(e.target.value))}/><span className="text-xs text-muted-foreground">Rotation de maquette : {simulationAngle}°</span></label>}
                {simulationMode==='interieur'&&<label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={showFurniture} onChange={e=>setShowFurniture(e.target.checked)}/> Afficher le mobilier illustratif</label>}
              </div>
              <div className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/5 p-3 text-xs text-muted-foreground">Prototype de visualisation 2D/axonometrique : vues extérieure, intérieure, plan et façade, avec options visuelles exportées dans le brief. Ce n’est pas encore une scène 3D librement navigable, un modèle BIM, un rendu photoréaliste ni une validation des dimensions ou de la structure.</div>
            </div>
          </section>
        </div>
        {(saveMessage||saveError)&&<div role={saveError?'alert':'status'} className={'mt-5 rounded-xl border p-3 text-sm '+(saveError?'border-red-500/30 text-red-600':'border-emerald-500/30 text-emerald-700')}>{saveError||saveMessage}</div>}
        {user&&<section className="mt-6 rounded-2xl border border-border bg-card p-5"><h2 className="font-bold">Mes avant-projets enregistrés</h2><div className="mt-3 grid gap-2 md:grid-cols-2">{savedBriefs.map(item=><article key={item.id} className="rounded-xl border border-border p-3"><p className="text-sm font-semibold">{item.title}</p><p className="mt-1 text-xs text-muted-foreground">{item.brief_status} · {new Date(item.created_at).toLocaleDateString('fr-FR')}</p>{item.brief_status==='draft'&&<button type="button" onClick={()=>void submitBrief(item.id)} className="mt-3 rounded-lg border border-accent/40 px-3 py-2 text-xs font-bold">Soumettre au concepteur</button>}</article>)}{!savedBriefs.length&&<p className="text-sm text-muted-foreground">Aucun avant-projet enregistré sur ce compte.</p>}</div></section>}
        <div className="mt-6 flex items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4 text-sm"><ShieldCheck size={20} className="mt-0.5 shrink-0 text-amber-600"/><p><strong>Limite professionnelle :</strong> cet outil produit une esquisse et un cahier de besoins. Il ne remplace pas les plans architecturaux exécutifs, les études de sol et de structure, les plans électriques/plomberie, ni les permis. La conformité doit être contrôlée par des professionnels habilités selon le pays et la commune.</p></div>
      </div>
    </main>
  );
}
