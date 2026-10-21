'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, RefreshCw, Search, Tractor, Sprout, Package, ClipboardList, Plus, CheckCircle2, AlertCircle, MapPin } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';
import { hasApplicationMembership } from '@/lib/apps/access';

type Farm = { id: string; name: string; farm_type: string; city: string | null; area_hectares: number | null; status: string };
type Crop = { id: string; farm_id: string; name: string; variety: string | null; season: string | null; planted_area_hectares: number | null; planting_date: string | null; expected_harvest_date: string | null; expected_yield: number | null; actual_yield: number | null; unit: string | null; status: string };
type Product = { id: string; farm_id: string | null; name: string; product_type: string; quantity: number; unit: string; unit_price: number | null; availability_status: string };
type ProductionRecord = { id: string; crop_id: string; record_date: string; activity_type: string; quantity: number | null; unit: string | null; cost_amount: number | null; notes: string | null };
type Tab = 'farms' | 'crops' | 'products' | 'production';

const field = 'w-full rounded-xl border border-white/10 bg-[#07142e] px-3.5 py-3 text-sm text-white outline-none focus:border-[#F28C28]';
const primary = 'inline-flex items-center justify-center gap-2 rounded-xl bg-[#F28C28] px-4 py-2.5 text-sm font-bold text-[#0B1B3D] disabled:opacity-50';
const secondary = 'inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50';

export default function AgriculturePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [hasMembership, setHasMembership] = useState(false);
  const [farms, setFarms] = useState<Farm[]>([]);
  const [crops, setCrops] = useState<Crop[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [records, setRecords] = useState<ProductionRecord[]>([]);
  const [tab, setTab] = useState<Tab>('farms');
  const [query, setQuery] = useState('');
  const [busy, setBusy] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [farmForm, setFarmForm] = useState({ name: '', farm_type: 'mixed', city: '', address: '', area_hectares: '' });
  const [cropForm, setCropForm] = useState({ farm_id: '', name: '', variety: '', season: '', planted_area_hectares: '', planting_date: '', expected_harvest_date: '', expected_yield: '', unit: 'kg' });
  const [productForm, setProductForm] = useState({ farm_id: '', name: '', product_type: 'crop', quantity: '0', unit: 'kg', unit_price: '' });
  const [recordForm, setRecordForm] = useState({ crop_id: '', record_date: new Date().toISOString().slice(0, 10), activity_type: 'observation', quantity: '', unit: 'kg', cost_amount: '', notes: '' });

  const load = useCallback(async () => {
    if (!user) { setHasMembership(false); setFarms([]); setCrops([]); setProducts([]); setRecords([]); setBusy(false); return; }
    setBusy(true); setError('');
    const allowed = await hasApplicationMembership(supabase, user.id, 'agriculture');
    if (!allowed) {
      setHasMembership(false); setFarms([]); setCrops([]); setProducts([]); setRecords([]); setBusy(false); return;
    }
    setHasMembership(true);
    const [farmResult, cropResult, productResult, recordResult] = await Promise.all([
      supabase.from('agri_farms').select('id,name,farm_type,city,area_hectares,status').order('created_at', { ascending: false }),
      supabase.from('agri_crops').select('id,farm_id,name,variety,season,planted_area_hectares,planting_date,expected_harvest_date,expected_yield,actual_yield,unit,status').order('created_at', { ascending: false }),
      supabase.from('agri_products').select('id,farm_id,name,product_type,quantity,unit,unit_price,availability_status').order('created_at', { ascending: false }),
      supabase.from('agri_production_records').select('id,crop_id,record_date,activity_type,quantity,unit,cost_amount,notes').order('record_date', { ascending: false }).limit(200),
    ]);
    const firstError = farmResult.error || cropResult.error || productResult.error || recordResult.error;
    if (firstError) setError(firstError.message);
    setFarms((farmResult.data || []) as Farm[]);
    setCrops((cropResult.data || []) as Crop[]);
    setProducts((productResult.data || []) as Product[]);
    setRecords((recordResult.data || []) as ProductionRecord[]);
    setBusy(false);
  }, [supabase, user]);

  useEffect(() => { if (!authLoading) void load(); }, [authLoading, load]);

  const farmName = (id: string | null) => farms.find((farm) => farm.id === id)?.name || 'Exploitation non visible';
  const cropName = (id: string) => crops.find((crop) => crop.id === id)?.name || 'Culture non visible';
  const currentRows = useMemo(() => {
    const rows = tab === 'farms' ? farms : tab === 'crops' ? crops : tab === 'products' ? products : records;
    return rows.filter((row) => JSON.stringify(row).toLowerCase().includes(query.toLowerCase()));
  }, [farms, crops, products, records, tab, query]);

  const saveFarm = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user || !await hasApplicationMembership(supabase, user.id, 'agriculture')) { router.push('/inscription/agriculture'); return; }
    if (!farmForm.name.trim()) return;
    setSaving(true); setError(''); setNotice('');
    const { error: saveError } = await supabase.from('agri_farms').insert({
      owner_user_id: user.id, name: farmForm.name.trim(), farm_type: farmForm.farm_type,
      city: farmForm.city.trim() || null, address: farmForm.address.trim() || null,
      area_hectares: farmForm.area_hectares ? Number(farmForm.area_hectares) : null, status: 'active',
    });
    if (saveError) setError(saveError.message);
    else { setNotice('Exploitation agricole enregistrée.'); setFarmForm({ name: '', farm_type: 'mixed', city: '', address: '', area_hectares: '' }); setFormOpen(false); await load(); }
    setSaving(false);
  };

  const saveCrop = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user || !await hasApplicationMembership(supabase, user.id, 'agriculture')) { router.push('/inscription/agriculture'); return; }
    if (!cropForm.farm_id || !cropForm.name.trim()) return;
    setSaving(true); setError(''); setNotice('');
    const { error: saveError } = await supabase.from('agri_crops').insert({
      farm_id: cropForm.farm_id, name: cropForm.name.trim(), variety: cropForm.variety.trim() || null,
      season: cropForm.season.trim() || null, planted_area_hectares: cropForm.planted_area_hectares ? Number(cropForm.planted_area_hectares) : null,
      planting_date: cropForm.planting_date || null, expected_harvest_date: cropForm.expected_harvest_date || null,
      expected_yield: cropForm.expected_yield ? Number(cropForm.expected_yield) : null, unit: cropForm.unit || null, status: 'planned',
    });
    if (saveError) setError(saveError.message);
    else { setNotice('Culture enregistrée.'); setCropForm({ farm_id: '', name: '', variety: '', season: '', planted_area_hectares: '', planting_date: '', expected_harvest_date: '', expected_yield: '', unit: 'kg' }); setFormOpen(false); await load(); }
    setSaving(false);
  };

  const saveProduct = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user || !await hasApplicationMembership(supabase, user.id, 'agriculture')) { router.push('/inscription/agriculture'); return; }
    if (!productForm.farm_id || !productForm.name.trim()) return;
    setSaving(true); setError(''); setNotice('');
    const { error: saveError } = await supabase.from('agri_products').insert({
      farm_id: productForm.farm_id, name: productForm.name.trim(), product_type: productForm.product_type,
      quantity: Number(productForm.quantity), unit: productForm.unit.trim(),
      unit_price: productForm.unit_price ? Number(productForm.unit_price) : null, availability_status: 'available',
    });
    if (saveError) setError(saveError.message);
    else { setNotice('Produit agricole ajouté au stock disponible.'); setProductForm({ farm_id: '', name: '', product_type: 'crop', quantity: '0', unit: 'kg', unit_price: '' }); setFormOpen(false); await load(); }
    setSaving(false);
  };

  const saveRecord = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user || !await hasApplicationMembership(supabase, user.id, 'agriculture')) { router.push('/inscription/agriculture'); return; }
    if (!recordForm.crop_id || !recordForm.activity_type.trim()) return;
    setSaving(true); setError(''); setNotice('');
    const { error: saveError } = await supabase.from('agri_production_records').insert({
      crop_id: recordForm.crop_id, record_date: recordForm.record_date, activity_type: recordForm.activity_type.trim(),
      quantity: recordForm.quantity ? Number(recordForm.quantity) : null, unit: recordForm.unit.trim() || null,
      cost_amount: recordForm.cost_amount ? Number(recordForm.cost_amount) : null, notes: recordForm.notes.trim() || null, recorded_by: user.id,
    });
    if (saveError) setError(saveError.message);
    else { setNotice('Activité de production enregistrée.'); setRecordForm({ crop_id: '', record_date: new Date().toISOString().slice(0, 10), activity_type: 'observation', quantity: '', unit: 'kg', cost_amount: '', notes: '' }); setFormOpen(false); await load(); }
    setSaving(false);
  };

  const openForm = () => { setError(''); setNotice(''); setFormOpen(!formOpen); };

  if (authLoading) return <main className="grid min-h-screen place-items-center bg-[#0B1B3D] text-white">Chargement de la session…</main>;

  return (
    <main className="min-h-screen bg-[#0B1B3D] p-4 text-white sm:p-8">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-wrap items-center justify-between gap-3"><Link href="/services" className="inline-flex items-center gap-2 text-sm text-white/60 hover:text-white"><ArrowLeft size={16}/> Tous les services</Link><div className="flex flex-wrap gap-2"><Link href="/agriculture/marche" className={primary}><Sprout size={16}/> Découvrir les produits</Link><button onClick={() => void load()} disabled={busy} className={secondary}><RefreshCw size={16} className={busy ? 'animate-spin' : ''}/> Actualiser</button><Link href="/dashboard" className={secondary}>Tableau de bord</Link></div></header>
        <section className="mt-7 overflow-hidden rounded-3xl border border-white/10 bg-white/[.05]">
          <div className="border-b border-white/10 bg-gradient-to-br from-[#163b2d] to-[#0B1B3D] p-6 sm:p-8"><div className="flex flex-col justify-between gap-5 md:flex-row md:items-end"><div><p className="text-xs font-bold uppercase tracking-[.25em] text-[#F28C28]">JDV GLOBAL CENTER · AGRICULTURE</p><h1 className="mt-3 flex items-center gap-3 text-3xl font-black sm:text-4xl"><Tractor className="text-[#F28C28]" size={34}/> JDV AGRICULTURE</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-white/60">Suivi des exploitations, cultures, productions et produits agricoles à partir des données réelles.</p></div><div className="grid grid-cols-2 gap-2 sm:grid-cols-4"><div className="rounded-2xl border border-white/10 bg-black/10 p-3"><div className="text-xs text-white/50">Exploitations</div><div className="text-2xl font-black">{farms.length}</div></div><div className="rounded-2xl border border-white/10 bg-black/10 p-3"><div className="text-xs text-white/50">Cultures</div><div className="text-2xl font-black">{crops.length}</div></div><div className="rounded-2xl border border-white/10 bg-black/10 p-3"><div className="text-xs text-white/50">Produits</div><div className="text-2xl font-black">{products.length}</div></div><div className="rounded-2xl border border-white/10 bg-black/10 p-3"><div className="text-xs text-white/50">Activités</div><div className="text-2xl font-black">{records.length}</div></div></div></div></div>
          <div className="p-5 sm:p-8">
            {(!user || !hasMembership) && <div className="mb-5 rounded-xl border border-[#F28C28]/30 bg-[#F28C28]/10 p-4 text-sm text-[#ffd4a5]">Tu peux découvrir JDV Agriculture, mais la gestion des exploitations, cultures et stocks nécessite une inscription propre à cette branche. <Link href="/inscription/agriculture" className="ml-1 font-bold underline">Créer ou activer mon compte Agriculture</Link></div>}}
            {error && <div role="alert" className="mb-5 flex items-start gap-2 rounded-xl border border-red-300/25 bg-red-300/10 p-4 text-sm text-red-100"><AlertCircle size={17} className="mt-0.5 shrink-0"/>{error}</div>}
            {notice && <div role="status" className="mb-5 flex items-start gap-2 rounded-xl border border-emerald-300/25 bg-emerald-300/10 p-4 text-sm text-emerald-100"><CheckCircle2 size={17} className="mt-0.5 shrink-0"/>{notice}</div>}
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"><div className="flex flex-wrap gap-2">
              <button onClick={() => {setTab('farms');setFormOpen(false)}} className={tab==='farms'?primary:secondary}><Tractor size={16}/> Exploitations</button>
              <button onClick={() => {setTab('crops');setFormOpen(false)}} className={tab==='crops'?primary:secondary}><Sprout size={16}/> Cultures</button>
              <button onClick={() => {setTab('products');setFormOpen(false)}} className={tab==='products'?primary:secondary}><Package size={16}/> Produits</button>
              <button onClick={() => {setTab('production');setFormOpen(false)}} className={tab==='production'?primary:secondary}><ClipboardList size={16}/> Journal de production</button>
            </div><label className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/10 px-4 py-3 lg:w-80"><Search size={17} className="text-white/40"/><input value={query} onChange={(e)=>setQuery(e.target.value)} placeholder="Rechercher…" className="w-full bg-transparent text-sm outline-none placeholder:text-white/30"/></label></div>
            <div className="mt-5 flex justify-end"><button onClick={openForm} disabled={!user || (tab!=='farms' && farms.length===0) || (tab==='production' && crops.length===0)} className={primary}><Plus size={16}/>{formOpen?'Fermer':'Ajouter '+(tab==='farms'?'une exploitation':tab==='crops'?'une culture':tab==='products'?'un produit':'une activité')}</button></div>
            {formOpen && <div className="mt-4 rounded-2xl border border-white/10 bg-black/10 p-5">
              {tab==='farms' && <form onSubmit={saveFarm} className="grid gap-3 sm:grid-cols-2"><input className={field} required maxLength={160} placeholder="Nom de l’exploitation" value={farmForm.name} onChange={(e)=>setFarmForm({...farmForm,name:e.target.value})}/><select className={field} value={farmForm.farm_type} onChange={(e)=>setFarmForm({...farmForm,farm_type:e.target.value})}><option value="mixed">Mixte</option><option value="crop">Cultures</option><option value="livestock">Élevage</option><option value="aquaculture">Aquaculture</option><option value="agroforestry">Agroforesterie</option></select><input className={field} placeholder="Ville" value={farmForm.city} onChange={(e)=>setFarmForm({...farmForm,city:e.target.value})}/><input className={field} placeholder="Adresse / localité" value={farmForm.address} onChange={(e)=>setFarmForm({...farmForm,address:e.target.value})}/><input className={field} type="number" min="0" step="0.01" placeholder="Superficie (hectares)" value={farmForm.area_hectares} onChange={(e)=>setFarmForm({...farmForm,area_hectares:e.target.value})}/><button disabled={saving} className={primary}>{saving?'Enregistrement…':'Enregistrer l’exploitation'}</button></form>}
              {tab==='crops' && <form onSubmit={saveCrop} className="grid gap-3 sm:grid-cols-2"><select className={field} required value={cropForm.farm_id} onChange={(e)=>setCropForm({...cropForm,farm_id:e.target.value})}><option value="">Choisir une exploitation</option>{farms.map((farm)=><option key={farm.id} value={farm.id}>{farm.name}</option>)}</select><input className={field} required maxLength={120} placeholder="Culture (ex. maïs, coton)" value={cropForm.name} onChange={(e)=>setCropForm({...cropForm,name:e.target.value})}/><input className={field} placeholder="Variété" value={cropForm.variety} onChange={(e)=>setCropForm({...cropForm,variety:e.target.value})}/><input className={field} placeholder="Saison / campagne" value={cropForm.season} onChange={(e)=>setCropForm({...cropForm,season:e.target.value})}/><input className={field} type="number" min="0" step="0.01" placeholder="Surface cultivée (ha)" value={cropForm.planted_area_hectares} onChange={(e)=>setCropForm({...cropForm,planted_area_hectares:e.target.value})}/><input className={field} type="date" aria-label="Date de plantation" value={cropForm.planting_date} onChange={(e)=>setCropForm({...cropForm,planting_date:e.target.value})}/><input className={field} type="date" aria-label="Récolte estimée" value={cropForm.expected_harvest_date} onChange={(e)=>setCropForm({...cropForm,expected_harvest_date:e.target.value})}/><div className="flex gap-2"><input className={field} type="number" min="0" step="0.01" placeholder="Rendement attendu" value={cropForm.expected_yield} onChange={(e)=>setCropForm({...cropForm,expected_yield:e.target.value})}/><input className={field} placeholder="Unité" value={cropForm.unit} onChange={(e)=>setCropForm({...cropForm,unit:e.target.value})}/></div><button disabled={saving} className={primary}>Enregistrer la culture</button></form>}
              {tab==='products' && <form onSubmit={saveProduct} className="grid gap-3 sm:grid-cols-2"><select className={field} required value={productForm.farm_id} onChange={(e)=>setProductForm({...productForm,farm_id:e.target.value})}><option value="">Choisir une exploitation</option>{farms.map((farm)=><option key={farm.id} value={farm.id}>{farm.name}</option>)}</select><input className={field} required maxLength={160} placeholder="Nom du produit" value={productForm.name} onChange={(e)=>setProductForm({...productForm,name:e.target.value})}/><select className={field} value={productForm.product_type} onChange={(e)=>setProductForm({...productForm,product_type:e.target.value})}><option value="crop">Récolte</option><option value="livestock">Élevage</option><option value="processed">Transformé</option><option value="input">Intrant agricole</option></select><input className={field} required type="number" min="0" step="0.01" placeholder="Quantité" value={productForm.quantity} onChange={(e)=>setProductForm({...productForm,quantity:e.target.value})}/><input className={field} required placeholder="Unité (kg, sac, tonne…)" value={productForm.unit} onChange={(e)=>setProductForm({...productForm,unit:e.target.value})}/><input className={field} type="number" min="0" step="0.01" placeholder="Prix unitaire facultatif" value={productForm.unit_price} onChange={(e)=>setProductForm({...productForm,unit_price:e.target.value})}/><button disabled={saving} className={primary}>Ajouter au stock</button></form>}
              {tab==='production' && <form onSubmit={saveRecord} className="grid gap-3 sm:grid-cols-2"><select className={field} required value={recordForm.crop_id} onChange={(e)=>setRecordForm({...recordForm,crop_id:e.target.value})}><option value="">Choisir une culture</option>{crops.map((crop)=><option key={crop.id} value={crop.id}>{crop.name} — {farmName(farms.find((farm)=>farm.id===crop.farm_id)?.id || null)}</option>)}</select><input className={field} type="date" required value={recordForm.record_date} onChange={(e)=>setRecordForm({...recordForm,record_date:e.target.value})}/><select className={field} value={recordForm.activity_type} onChange={(e)=>setRecordForm({...recordForm,activity_type:e.target.value})}><option value="observation">Observation</option><option value="planting">Semis / plantation</option><option value="irrigation">Irrigation</option><option value="fertilization">Fertilisation</option><option value="treatment">Traitement</option><option value="harvest">Récolte</option><option value="maintenance">Entretien</option></select><input className={field} type="number" min="0" step="0.01" placeholder="Quantité facultative" value={recordForm.quantity} onChange={(e)=>setRecordForm({...recordForm,quantity:e.target.value})}/><input className={field} placeholder="Unité" value={recordForm.unit} onChange={(e)=>setRecordForm({...recordForm,unit:e.target.value})}/><input className={field} type="number" min="0" step="0.01" placeholder="Coût (facultatif)" value={recordForm.cost_amount} onChange={(e)=>setRecordForm({...recordForm,cost_amount:e.target.value})}/><textarea className={field+' sm:col-span-2'} rows={3} placeholder="Notes de suivi" value={recordForm.notes} onChange={(e)=>setRecordForm({...recordForm,notes:e.target.value})}/><button disabled={saving} className={primary}>Enregistrer l’activité</button></form>}
            </div>}
            {busy ? <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{[1,2,3].map((i)=><div key={i} className="h-32 animate-pulse rounded-2xl border border-white/10 bg-white/[.03]"/>)}</div> : <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {currentRows.map((item: any) => <article key={item.id} className="rounded-2xl border border-white/10 bg-white/[.035] p-5">
                {tab==='farms' && <><div className="flex items-start justify-between gap-3"><div className="rounded-xl bg-emerald-300/10 p-3 text-emerald-200"><Tractor size={20}/></div><span className="rounded-full border border-white/10 px-2.5 py-1 text-xs">{item.status}</span></div><h2 className="mt-4 text-lg font-bold">{item.name}</h2><p className="mt-1 flex items-center gap-1.5 text-sm text-white/50"><MapPin size={14}/>{item.city || 'Localité non renseignée'}</p><p className="mt-3 text-sm text-white/60">{item.farm_type} · {item.area_hectares ?? '—'} ha</p></>}
                {tab==='crops' && <><div className="flex items-start justify-between"><Sprout className="text-emerald-200" size={22}/><span className="rounded-full border border-white/10 px-2.5 py-1 text-xs">{item.status}</span></div><h2 className="mt-4 text-lg font-bold">{item.name}</h2><p className="mt-1 text-sm text-white/50">{farmName(item.farm_id)} · {item.variety || 'Variété non renseignée'}</p><p className="mt-3 text-sm text-white/60">Surface : {item.planted_area_hectares ?? '—'} ha</p><p className="mt-1 text-sm text-white/60">Récolte attendue : {item.expected_harvest_date || 'Non définie'}</p><p className="mt-1 text-sm text-white/60">Rendement estimé : {item.expected_yield ?? '—'} {item.unit || ''}</p></>}
                {tab==='products' && <><div className="flex items-start justify-between"><Package className="text-[#F28C28]" size={22}/><span className="rounded-full border border-white/10 px-2.5 py-1 text-xs">{item.availability_status}</span></div><h2 className="mt-4 text-lg font-bold">{item.name}</h2><p className="mt-1 text-sm text-white/50">{farmName(item.farm_id)} · {item.product_type}</p><p className="mt-3 text-2xl font-black">{item.quantity} {item.unit}</p><p className="mt-1 text-sm text-white/60">Prix unitaire : {item.unit_price ?? 'Non défini'}</p></>}
                {tab==='production' && <><div className="flex items-start justify-between"><ClipboardList className="text-[#F28C28]" size={22}/><span className="text-xs text-white/45">{item.record_date}</span></div><h2 className="mt-4 text-lg font-bold">{item.activity_type}</h2><p className="mt-1 text-sm text-white/50">{cropName(item.crop_id)}</p><p className="mt-3 text-sm text-white/60">Quantité : {item.quantity ?? '—'} {item.unit || ''}</p><p className="mt-1 text-sm text-white/60">Coût : {item.cost_amount ?? '—'}</p>{item.notes && <p className="mt-3 text-sm text-white/45">{item.notes}</p>}</>}
              </article>)}
              {currentRows.length===0 && <div className="col-span-full rounded-2xl border border-dashed border-white/15 p-10 text-center"><Sprout className="mx-auto text-white/30" size={30}/><h2 className="mt-3 font-bold">Aucune donnée dans cette section</h2><p className="mt-1 text-sm text-white/45">Ajoute un premier enregistrement pour commencer le suivi agricole.</p></div>}
            </div>}
          </div>
        </section>
      </div>
    </main>
  );
}
