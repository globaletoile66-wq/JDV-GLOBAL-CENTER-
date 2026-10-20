'use client';

import { useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Download, DoorOpen, Eye, Move, Plus, Save, Trash2, PanelsTopLeft, Ruler, Printer } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';
import House3DViewer from '../construction/House3DViewer';

type Room = { id: number; name: string; x: number; y: number; w: number; h: number; color: string };
type Opening = { id: number; kind: 'Porte' | 'Fenêtre'; roomId: number; wall: 'nord' | 'sud' | 'est' | 'ouest'; offset: number; width: number };
const colors = ['#dbeafe', '#fef3c7', '#dcfce7', '#f3e8ff', '#fee2e2', '#cffafe', '#e5e7eb'];
const inputClass = 'mt-1 w-full rounded-xl border border-white/15 bg-[#09152f] px-3 py-2.5 text-sm text-white outline-none focus:border-[#F28C28]';
const initialRooms: Room[] = [
  { id: 1, name: 'Séjour', x: 0.3, y: 0.3, w: 5.0, h: 4.0, color: colors[0] },
  { id: 2, name: 'Cuisine', x: 5.5, y: 0.3, w: 3.0, h: 3.0, color: colors[1] },
  { id: 3, name: 'Chambre 1', x: 0.3, y: 4.5, w: 3.5, h: 3.2, color: colors[2] },
  { id: 4, name: 'Chambre 2', x: 4.0, y: 4.5, w: 3.5, h: 3.2, color: colors[3] },
  { id: 5, name: 'Salle d’eau', x: 7.7, y: 3.5, w: 2.0, h: 2.0, color: colors[4] },
];

export default function ImmoConceptionPage() {
  const { user } = useAuth();
  const supabase = useMemo(() => createClient(), []);
  const svgRef = useRef<SVGSVGElement>(null);
  const [parcelWidth, setParcelWidth] = useState(12);
  const [parcelDepth, setParcelDepth] = useState(18);
  const [rooms, setRooms] = useState<Room[]>(initialRooms);
  const [selectedId, setSelectedId] = useState(1);
  const [openings, setOpenings] = useState<Opening[]>([
    { id: 1, kind: 'Porte', roomId: 1, wall: 'sud', offset: 2.5, width: 1.0 },
    { id: 2, kind: 'Fenêtre', roomId: 1, wall: 'nord', offset: 2.2, width: 1.4 },
    { id: 3, kind: 'Fenêtre', roomId: 2, wall: 'est', offset: 1.5, width: 1.2 },
    { id: 4, kind: 'Fenêtre', roomId: 3, wall: 'ouest', offset: 1.5, width: 1.2 },
  ]);
  const [description, setDescription] = useState('');
  const [constraints, setConstraints] = useState('Prévoir une bonne ventilation naturelle, une circulation fluide et de la lumière dans les pièces de vie.');
  const [levels, setLevels] = useState(1);
  const [view, setView] = useState<'plan' | 'exterieur' | '3d'>('plan');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [drag, setDrag] = useState<{ id: number; dx: number; dy: number } | null>(null);
  const scale = Math.min(700 / Math.max(6, parcelWidth), 410 / Math.max(8, parcelDepth));
  const marginX = (800 - parcelWidth * scale) / 2;
  const marginY = (500 - parcelDepth * scale) / 2;
  const selected = rooms.find((room) => room.id === selectedId) || rooms[0];
  const footprint = rooms.reduce((sum, room) => sum + room.w * room.h, 0);
  const floorArea = footprint * levels;

  const updateRoom = (id: number, patch: Partial<Room>) => setRooms((current) => current.map((room) => room.id === id ? { ...room, ...patch } : room));
  const pointFromEvent = (event: React.PointerEvent<SVGSVGElement>) => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return { x: ((event.clientX - rect.left) / rect.width * 800 - marginX) / scale, y: ((event.clientY - rect.top) / rect.height * 500 - marginY) / scale };
  };
  const addRoom = () => {
    const id = Math.max(0, ...rooms.map((room) => room.id)) + 1;
    const next = { id, name: 'Nouvelle pièce', x: 0.5, y: 0.5, w: 3, h: 3, color: colors[rooms.length % colors.length] };
    setRooms((current) => [...current, next]);
    setSelectedId(id);
    setView('plan');
  };
  const addOpening = (kind: Opening['kind']) => setOpenings((current) => [...current, { id: Math.max(0, ...current.map((item) => item.id)) + 1, kind, roomId: selectedId || rooms[0]?.id || 1, wall: 'sud', offset: 1, width: kind === 'Porte' ? 1 : 1.2 }]);
  const exportPlan = () => {
    const project = { format: 'JDV-IMMO-CONCEPT-v1', createdAt: new Date().toISOString(), parcel: { width: parcelWidth, depth: parcelDepth, area: parcelWidth * parcelDepth }, levels, rooms, openings, description, constraints, disclaimer: 'Avant-projet conceptuel, non destiné directement à l’exécution. Faire valider par architecte et ingénieur habilités.' };
    const blob = new Blob([JSON.stringify(project, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a'); anchor.href = url; anchor.download = 'jdv-immo-plan-conceptuel.json'; anchor.click(); URL.revokeObjectURL(url);
  };
  const savePlan = async () => {
    if (!user) { setError('Connectez-vous pour enregistrer ce projet dans votre espace.'); return; }
    setSaving(true); setError(''); setMessage('');
    const brief = { editorVersion: 1, buildingType: 'Projet architectural personnalisé', levels, parcelWidth, parcelDepth, parcelArea: parcelWidth * parcelDepth, rooms, openings, description, constraints, estimatedFootprint: footprint, estimatedFloorArea: floorArea, disclaimer: 'Plan conceptuel. Dimensions, conformité, structure et réseaux à vérifier par des professionnels habilités.' };
    const result = await supabase.from('immo_construction_briefs').insert({ user_id: user.id, title: 'Conception personnalisée · ' + parcelWidth + ' × ' + parcelDepth + ' m', parcel_area: parcelWidth * parcelDepth, brief_status: 'draft', brief });
    if (result.error) setError('Enregistrement impossible : ' + result.error.message);
    else setMessage('Votre avant-projet a été enregistré dans votre espace JDV Immo.');
    setSaving(false);
  };

  return (
    <main className="min-h-screen bg-[#0B1B3D] p-4 text-white sm:p-7">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <Link href="/immo/construction" className="inline-flex items-center gap-2 text-sm text-white/60 hover:text-white"><ArrowLeft size={16}/> Retour au studio de construction</Link>
          <span className="rounded-full border border-[#F28C28]/40 px-3 py-1.5 text-xs font-bold text-[#F28C28]">JDV IMMO · STUDIO PREMIUM</span>
          <Link href="/immo/conception/amenagement" className="rounded-xl bg-[#F28C28] px-4 py-2 text-sm font-bold text-[#0B1B3D]">Terrain, jardin, piscine et parking</Link>
        </header>
        <section className="mt-6 rounded-3xl border border-white/10 bg-white/[.05] p-5 sm:p-7">
          <p className="text-xs font-bold uppercase tracking-[.22em] text-[#F28C28]">Conception architecturale personnalisée</p>
          <h1 className="mt-2 text-3xl font-black sm:text-4xl">Dessinez votre maison, pièce par pièce.</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-white/65">Décrivez précisément vos attentes, ajustez les dimensions et déplacez les pièces sur le plan. Positionnez portes et fenêtres, explorez la maquette 3D et exportez le cahier de conception. Les mesures ci-dessous sont vos paramètres de conception, pas une certification technique.</p>
          <div className="mt-5 flex flex-wrap gap-2">
            {([{ value: 'plan', label: 'Plan 2D' }, { value: 'exterieur', label: 'Vue extérieure' }, { value: '3d', label: 'Maquette 3D' }] as const).map((item) => <button key={item.value} onClick={() => setView(item.value)} className={'rounded-xl px-4 py-2.5 text-sm font-bold ' + (view === item.value ? 'bg-[#F28C28] text-[#0B1B3D]' : 'border border-white/15 text-white/70')}><Eye size={15} className="mr-2 inline"/>{item.label}</button>)}
            <button onClick={exportPlan} className="ml-auto inline-flex items-center gap-2 rounded-xl border border-white/15 px-4 py-2.5 text-sm font-semibold"><Download size={15}/> Exporter le plan</button>
            <button onClick={() => window.print()} className="inline-flex items-center gap-2 rounded-xl border border-white/15 px-4 py-2.5 text-sm font-semibold print:hidden"><Printer size={15}/> Imprimer</button>
          </div>
        </section>

        <div className="mt-5 grid gap-5 xl:grid-cols-[340px_minmax(0,1fr)]">
          <aside className="space-y-5">
            <section className="rounded-2xl border border-white/10 bg-white/[.04] p-5">
              <h2 className="font-bold">1. Parcelle et bâtiment</h2>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <label className="text-xs text-white/65">Largeur (m)<input type="number" min="6" max="60" step="0.5" value={parcelWidth} onChange={(e) => setParcelWidth(Math.max(6, Number(e.target.value) || 6))} className={inputClass}/></label>
                <label className="text-xs text-white/65">Profondeur (m)<input type="number" min="8" max="80" step="0.5" value={parcelDepth} onChange={(e) => setParcelDepth(Math.max(8, Number(e.target.value) || 8))} className={inputClass}/></label>
                <label className="col-span-2 text-xs text-white/65">Nombre de niveaux<select value={levels} onChange={(e) => setLevels(Number(e.target.value))} className={inputClass}><option value={1}>Plain-pied</option><option value={2}>R+1</option><option value={3}>R+2</option></select></label>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2 text-sm"><div className="rounded-xl bg-white/[.05] p-3"><p className="text-xs text-white/45">Terrain</p><p className="mt-1 font-bold">{(parcelWidth * parcelDepth).toFixed(1)} m²</p></div><div className="rounded-xl bg-white/[.05] p-3"><p className="text-xs text-white/45">Surface pièces*</p><p className="mt-1 font-bold">{floorArea.toFixed(1)} m²</p></div></div>
              <p className="mt-2 text-[11px] leading-4 text-white/40">* Somme des surfaces des pièces dessinées, multipliée par le nombre de niveaux; ne représente pas une surface réglementaire.</p>
            </section>
            <section className="rounded-2xl border border-white/10 bg-white/[.04] p-5">
              <h2 className="font-bold">2. Pièces et mesures</h2>
              <div className="mt-3 space-y-2">{rooms.map((room) => <button key={room.id} onClick={() => setSelectedId(room.id)} className={'flex w-full items-center justify-between gap-2 rounded-xl border p-3 text-left text-sm ' + (selectedId === room.id ? 'border-[#F28C28]/70 bg-[#F28C28]/10' : 'border-white/10')}><span className="flex items-center gap-2"><span className="h-3 w-3 rounded-sm" style={{ background: room.color }}/>{room.name}</span><span className="text-xs text-white/45">{(room.w * room.h).toFixed(1)} m²</span></button>)}</div>
              <button onClick={addRoom} className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-white/20 px-3 py-2.5 text-sm"><Plus size={15}/> Ajouter une pièce</button>
              {selected && <div className="mt-4 border-t border-white/10 pt-4">
                <label className="text-xs text-white/65">Nom de la pièce<input value={selected.name} onChange={(e) => updateRoom(selected.id, { name: e.target.value })} className={inputClass}/></label>
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <label className="text-xs text-white/65">Largeur (m)<input type="number" min="1" max="20" step="0.1" value={selected.w} onChange={(e) => updateRoom(selected.id, { w: Math.max(1, Math.min(20, Number(e.target.value) || 1)) })} className={inputClass}/></label>
                  <label className="text-xs text-white/65">Longueur (m)<input type="number" min="1" max="30" step="0.1" value={selected.h} onChange={(e) => updateRoom(selected.id, { h: Math.max(1, Math.min(30, Number(e.target.value) || 1)) })} className={inputClass}/></label>
                  <label className="text-xs text-white/65">Position X (m)<input type="number" step="0.1" value={selected.x} onChange={(e) => updateRoom(selected.id, { x: Math.max(0, Math.min(parcelWidth - selected.w, Number(e.target.value) || 0)) })} className={inputClass}/></label>
                  <label className="text-xs text-white/65">Position Y (m)<input type="number" step="0.1" value={selected.y} onChange={(e) => updateRoom(selected.id, { y: Math.max(0, Math.min(parcelDepth - selected.h, Number(e.target.value) || 0)) })} className={inputClass}/></label>
                </div>
                <button onClick={() => { setRooms((current) => current.filter((room) => room.id !== selected.id)); setSelectedId(rooms.find((room) => room.id !== selected.id)?.id || 0); }} className="mt-3 inline-flex items-center gap-2 rounded-lg border border-red-300/20 px-3 py-2 text-xs text-red-200"><Trash2 size={14}/> Supprimer la pièce</button>
              </div>}
            </section>
            <section className="rounded-2xl border border-white/10 bg-white/[.04] p-5">
              <h2 className="font-bold">3. Portes et fenêtres</h2>
              <div className="mt-3 flex gap-2"><button onClick={() => addOpening('Porte')} className="flex-1 rounded-xl border border-white/15 px-3 py-2 text-xs font-semibold"><DoorOpen size={14} className="mr-1 inline"/> Ajouter porte</button><button onClick={() => addOpening('Fenêtre')} className="flex-1 rounded-xl border border-white/15 px-3 py-2 text-xs font-semibold"><PanelsTopLeft size={14} className="mr-1 inline"/> Ajouter fenêtre</button></div>
              <div className="mt-3 space-y-3">{openings.map((opening) => <div key={opening.id} className="rounded-xl border border-white/10 p-3"><div className="flex items-center justify-between"><span className="text-sm font-semibold">{opening.kind} #{opening.id}</span><button aria-label="Supprimer ouverture" onClick={() => setOpenings((current) => current.filter((item) => item.id !== opening.id))} className="text-white/40 hover:text-red-300"><Trash2 size={14}/></button></div><div className="mt-2 grid grid-cols-2 gap-2"><label className="text-[11px] text-white/55">Pièce<select value={opening.roomId} onChange={(e) => setOpenings((current) => current.map((item) => item.id === opening.id ? { ...item, roomId: Number(e.target.value) } : item))} className={inputClass}>{rooms.map((room) => <option key={room.id} value={room.id}>{room.name}</option>)}</select></label><label className="text-[11px] text-white/55">Mur<select value={opening.wall} onChange={(e) => setOpenings((current) => current.map((item) => item.id === opening.id ? { ...item, wall: e.target.value as Opening['wall'] } : item))} className={inputClass}><option value="nord">Nord</option><option value="sud">Sud</option><option value="est">Est</option><option value="ouest">Ouest</option></select></label><label className="text-[11px] text-white/55">Largeur (m)<input type="number" min="0.5" max="4" step="0.1" value={opening.width} onChange={(e) => setOpenings((current) => current.map((item) => item.id === opening.id ? { ...item, width: Math.max(0.5, Math.min(4, Number(e.target.value) || 0.5)) } : item))} className={inputClass}/></label></div><label className="mt-2 block text-[11px] text-white/55">Repère le long du mur (m)<input type="number" min="0" max={Math.max(0, (rooms.find((room) => room.id === opening.roomId)?.[opening.wall === 'nord' || opening.wall === 'sud' ? 'w' : 'h'] || 1))} step="0.1" value={opening.offset} onChange={(e) => setOpenings((current) => current.map((item) => item.id === opening.id ? { ...item, offset: Math.max(0, Number(e.target.value) || 0) } : item))} className={inputClass}/></label></div>)}</div>
            </section>
          </aside>

          <section className="min-w-0 space-y-5">
            {view === 'plan' && <div className="rounded-2xl border border-white/10 bg-white/[.04] p-4 sm:p-5"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-lg font-bold">Plan interactif coté</h2><p className="mt-1 text-xs text-white/45">Sélectionnez une pièce, puis glissez-la dans la parcelle. Les positions sont exprimées en mètres.</p></div><span className="inline-flex items-center gap-2 rounded-full bg-white/[.07] px-3 py-1.5 text-xs"><Move size={13}/> Déplacement par glisser</span></div>
              <div className="mt-4 overflow-hidden rounded-xl bg-[#f8fafc]"><svg ref={svgRef} viewBox="0 0 800 500" className="h-auto w-full touch-none" onPointerMove={(event) => { if (!drag) return; const point = pointFromEvent(event); const room = rooms.find((item) => item.id === drag.id); if (room) updateRoom(room.id, { x: Math.max(0, Math.min(parcelWidth - room.w, point.x - drag.dx)), y: Math.max(0, Math.min(parcelDepth - room.h, point.y - drag.dy)) }); }} onPointerUp={() => setDrag(null)} onPointerCancel={() => setDrag(null)} role="img" aria-label="Plan interactif de la parcelle et des pièces">
                <defs><pattern id="grid" width={scale} height={scale} patternUnits="userSpaceOnUse"><path d={'M ' + scale + ' 0 L 0 0 0 ' + scale} fill="none" stroke="#e2e8f0" strokeWidth="1"/></pattern></defs>
                <rect width="800" height="500" fill="#f8fafc"/><rect x={marginX} y={marginY} width={parcelWidth * scale} height={parcelDepth * scale} fill="url(#grid)" stroke="#0f172a" strokeWidth="3"/>
                <text x={marginX + parcelWidth * scale / 2} y={Math.max(18, marginY - 10)} textAnchor="middle" fontSize="13" fill="#334155">{parcelWidth.toFixed(1)} m · largeur de parcelle</text>
                <text x={Math.min(790, marginX + parcelWidth * scale + 12)} y={marginY + parcelDepth * scale / 2} transform={'rotate(90 ' + Math.min(790, marginX + parcelWidth * scale + 12) + ' ' + (marginY + parcelDepth * scale / 2) + ')'} textAnchor="middle" fontSize="13" fill="#334155">{parcelDepth.toFixed(1)} m · profondeur</text>
                {rooms.map((room) => <g key={room.id} onPointerDown={(event) => { event.stopPropagation(); const point = pointFromEvent(event as unknown as React.PointerEvent<SVGSVGElement>); setSelectedId(room.id); setDrag({ id: room.id, dx: point.x - room.x, dy: point.y - room.y }); (event.currentTarget as SVGGElement).setPointerCapture?.(event.pointerId); }} style={{ cursor: 'grab' }}><rect x={marginX + room.x * scale} y={marginY + room.y * scale} width={room.w * scale} height={room.h * scale} fill={room.color} stroke={selectedId === room.id ? '#F28C28' : '#334155'} strokeWidth={selectedId === room.id ? 3 : 1.6}/><text x={marginX + (room.x + room.w / 2) * scale} y={marginY + (room.y + room.h / 2) * scale - 5} textAnchor="middle" fontSize="12" fill="#0f172a" pointerEvents="none">{room.name.slice(0, 22)}</text><text x={marginX + (room.x + room.w / 2) * scale} y={marginY + (room.y + room.h / 2) * scale + 12} textAnchor="middle" fontSize="11" fill="#334155" pointerEvents="none">{room.w.toFixed(1)} × {room.h.toFixed(1)} m</text></g>)}
                {openings.map((opening) => { const room = rooms.find((item) => item.id === opening.roomId); if (!room) return null; const pos = opening.wall === 'nord' ? { x: marginX + (room.x + Math.min(room.w, opening.offset)) * scale, y: marginY + room.y * scale } : opening.wall === 'sud' ? { x: marginX + (room.x + Math.min(room.w, opening.offset)) * scale, y: marginY + (room.y + room.h) * scale } : opening.wall === 'est' ? { x: marginX + (room.x + room.w) * scale, y: marginY + (room.y + Math.min(room.h, opening.offset)) * scale } : { x: marginX + room.x * scale, y: marginY + (room.y + Math.min(room.h, opening.offset)) * scale }; const horizontal = opening.wall === 'nord' || opening.wall === 'sud'; return <g key={opening.id}><line x1={pos.x - (horizontal ? opening.width * scale / 2 : 0)} y1={pos.y - (horizontal ? 0 : opening.width * scale / 2)} x2={pos.x + (horizontal ? opening.width * scale / 2 : 0)} y2={pos.y + (horizontal ? 0 : opening.width * scale / 2)} stroke={opening.kind === 'Porte' ? '#ea580c' : '#0284c7'} strokeWidth="7"/><text x={pos.x + 4} y={pos.y - 5} fontSize="10" fill={opening.kind === 'Porte' ? '#c2410c' : '#0369a1'}>{opening.kind} {opening.id}</text></g>; })}
                <text x={marginX + 8} y={marginY + parcelDepth * scale - 8} fontSize="11" fill="#64748b">Portes et fenêtres repérées sur les murs de la pièce sélectionnée; position mesurée depuis l’origine du mur.</text>
              </svg></div>
              <p className="mt-3 text-xs leading-5 text-white/45">Les pièces peuvent être déplacées librement. Les repères de portes et fenêtres sont rattachés à une pièce et à l’un de ses murs. Ce prototype ne résout pas encore automatiquement les collisions entre pièces ni la continuité des murs; contrôlez les chevauchements avant export.</p>
            </div>}
            {view === 'exterieur' && <div className="rounded-2xl border border-white/10 bg-white/[.04] p-5"><h2 className="text-lg font-bold">Vue extérieure indicative</h2><p className="mt-1 text-sm text-white/45">Volume simplifié; les ouvertures sont à placer précisément dans le plan détaillé.</p><svg viewBox="0 0 800 390" className="mt-4 w-full rounded-xl bg-slate-50"><rect x="0" y="0" width="800" height="390" fill="#f1f5f9"/><path d="M 100 290 L 400 95 L 700 290" fill="#475569" stroke="#334155" strokeWidth="4"/><rect x="145" y="205" width="510" height="160" fill="#f1e7d5" stroke="#334155" strokeWidth="4"/>{Array.from({length: levels}, (_, i) => <g key={i}><rect x={205} y={235 + i * 0} width="70" height="70" fill="#93c5fd" stroke="#334155" strokeWidth="3"/><rect x={520} y={235 + i * 0} width="70" height="70" fill="#93c5fd" stroke="#334155" strokeWidth="3"/></g>)}<rect x="365" y="275" width="70" height="90" fill="#8b5e3c" stroke="#334155" strokeWidth="3"/><line x1="35" y1="365" x2="765" y2="365" stroke="#94a3b8" strokeWidth="3"/><text x="400" y="385" textAnchor="middle" fontSize="12" fill="#334155">Élévation conceptuelle · {levels} niveau(x) · à détailler par un architecte</text></svg></div>}
            {view === '3d' && <div className="rounded-2xl border border-white/10 bg-white/[.04] p-5"><h2 className="text-lg font-bold">Maquette 3D exploratoire</h2><p className="mb-3 mt-1 text-sm text-white/45">La maquette volumétrique actuelle aide à explorer le volume; elle ne reflète pas encore automatiquement chaque déplacement du plan 2D.</p><House3DViewer levels={levels} facadeColor="#f1e7d5" roofColor="#475569" showFurniture rooms={rooms} openings={openings} parcelWidth={parcelWidth} parcelDepth={parcelDepth} showRoof={false} parking={1}/></div>}
            <section className="rounded-2xl border border-white/10 bg-white/[.04] p-5">
              <h2 className="font-bold">4. Cahier des charges du concepteur</h2>
              <label className="mt-4 block text-sm font-semibold">Décrivez exactement votre projet<textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} maxLength={6000} placeholder="Ex. entrée au sud, séjour ouvert sur terrasse, suite parentale séparée, escalier près du hall, grandes baies vitrées côté jardin…" className={inputClass}/></label>
              <label className="mt-4 block text-sm font-semibold">Contraintes et préférences techniques<textarea value={constraints} onChange={(e) => setConstraints(e.target.value)} rows={4} maxLength={6000} placeholder="Orientation, circulation, accessibilité, ventilation, lumière, intimité, terrasse, couloirs, budget indicatif…" className={inputClass}/></label>
              <div className="mt-4 grid gap-3 sm:grid-cols-3"><div className="rounded-xl border border-white/10 p-3"><p className="text-xs text-white/45">Pièces définies</p><p className="mt-1 text-xl font-black">{rooms.length}</p></div><div className="rounded-xl border border-white/10 p-3"><p className="text-xs text-white/45">Ouvertures définies</p><p className="mt-1 text-xl font-black">{openings.length}</p></div><div className="rounded-xl border border-white/10 p-3"><p className="text-xs text-white/45">Niveaux</p><p className="mt-1 text-xl font-black">{levels}</p></div></div>
              <div className="mt-5 flex flex-wrap gap-3"><button onClick={() => void savePlan()} disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-[#F28C28] px-4 py-3 font-bold text-[#0B1B3D] disabled:opacity-50"><Save size={16}/>{saving ? 'Enregistrement…' : 'Enregistrer mon avant-projet'}</button><button onClick={exportPlan} className="inline-flex items-center gap-2 rounded-xl border border-white/15 px-4 py-3 text-sm font-semibold"><Download size={16}/> Exporter les données</button></div>
              {error && <p role="alert" className="mt-4 rounded-xl border border-red-300/20 bg-red-400/10 p-3 text-sm text-red-200">{error}</p>}{message && <p role="status" className="mt-4 rounded-xl border border-emerald-300/20 bg-emerald-400/10 p-3 text-sm text-emerald-100">{message}</p>}
            </section>
            <div className="rounded-2xl border border-amber-300/20 bg-amber-300/[.06] p-4 text-xs leading-5 text-amber-100/75"><Ruler size={15} className="mr-2 inline"/>Important : cet outil constitue un éditeur d’avant-projet. Avant de construire, un architecte et un ingénieur structure doivent valider les plans cotés, fondations, charges, réseaux, ventilation, conformité locale et autorisations. Les mesures et ouvertures ne sont pas encore synchronisées dans une maquette BIM/CAD certifiée.</div>
          </section>
        </div>
      </div>
    </main>
  );
}
