'use client';
import Link from 'next/link';
import {useCallback,useEffect,useMemo,useState} from 'react';
import {ArrowLeft,RefreshCw,Send} from 'lucide-react';
import {useAuth} from '@/contexts/AuthContext';
import {createClient} from '@/lib/supabase/client';
type Item={id:string;title:string;channel_id:string;content_type:string;status:string;created_at:string};
type Review={content_id:string;decision:string};
type Rights={content_id:string;review_status:string};
type Channel={id:string;name:string};
export default function MediaPublishPage(){
 const {user,loading}=useAuth();const db=useMemo(()=>createClient(),[]);
 const [items,setItems]=useState<Item[]>([]);const [reviews,setReviews]=useState<Review[]>([]);const [rights,setRights]=useState<Rights[]>([]);const [channels,setChannels]=useState<Channel[]>([]);
 const [busy,setBusy]=useState(true);const [saving,setSaving]=useState('');const [error,setError]=useState('');const [notice,setNotice]=useState('');
 const load=useCallback(async()=>{setBusy(true);setError('');if(!user){setItems([]);setBusy(false);return}
 const [a,b,c,d]=await Promise.all([
 db.from('media_contents').select('id,title,channel_id,content_type,status,created_at').in('status',['draft','scheduled']).order('created_at',{ascending:true}).limit(200),
 db.from('media_editorial_reviews').select('content_id,decision').eq('decision','approved').limit(500),
 db.from('media_content_rights').select('content_id,review_status').eq('review_status','verified').limit(500),
 db.from('media_channels').select('id,name').limit(200)]);
 if(a.error)setError(a.error.message);else setItems((a.data??[]) as Item[]);if(!b.error)setReviews((b.data??[]) as Review[]);if(!c.error)setRights((c.data??[]) as Rights[]);if(!d.error)setChannels((d.data??[]) as Channel[]);setBusy(false)},[db,user]);
 useEffect(()=>{if(!loading)void load()},[loading,load]);
 async function publish(item:Item){setSaving(item.id);setError('');setNotice('');const {error:e}=await db.from('media_contents').update({status:'published',published_at:new Date().toISOString()}).eq('id',item.id);if(e)setError(e.message);else{setNotice('Action transmise. La base vérifie également les rôles, l’approbation éditoriale et les droits.');await load()}setSaving('')}
 return <main className="min-h-screen bg-[#0B1B3D] px-5 py-6 text-white sm:px-8"><div className="mx-auto max-w-6xl">
 <header className="flex items-center justify-between"><Link href="/media/editorial" className="inline-flex items-center gap-2 text-sm text-white/60"><ArrowLeft size={16}/> Revue éditoriale</Link><button onClick={()=>void load()} className="inline-flex items-center gap-2 rounded-xl border border-white/15 px-3 py-2 text-sm"><RefreshCw size={15}/> Actualiser</button></header>
 <section className="mt-7 rounded-3xl border border-white/10 bg-white/[.05] p-6"><p className="text-xs font-bold uppercase tracking-[.2em] text-[#F28C28]">JDV MEDIA · DIFFUSION</p><h1 className="mt-2 text-3xl font-black">File de publication</h1><p className="mt-3 text-sm leading-6 text-white/60">La publication exige un responsable autorisé, un avis éditorial approuvé et des droits vérifiés. Les contrôles sont aussi appliqués côté base.</p></section>
 {error&&<p role="alert" className="mt-4 rounded-xl border border-red-300/20 bg-red-400/10 p-4 text-sm text-red-200">{error}</p>}{notice&&<p role="status" className="mt-4 rounded-xl border border-[#F28C28]/20 p-4 text-sm text-[#F28C28]">{notice}</p>}
 <section className="mt-5 space-y-4">{busy?<p className="py-10 text-center text-sm text-white/50">Chargement…</p>:items.length===0?<p className="rounded-2xl border border-dashed border-white/15 p-8 text-center text-sm text-white/50">Aucun contenu en attente de publication.</p>:items.map(item=>{const approved=reviews.some(r=>r.content_id===item.id);const cleared=rights.some(r=>r.content_id===item.id);const ready=approved&&cleared;return <article key={item.id} className="rounded-2xl border border-white/10 bg-white/[.04] p-5"><p className="text-xs text-[#F28C28]">{channels.find(c=>c.id===item.channel_id)?.name??'Chaîne'} · {item.content_type}</p><h2 className="mt-2 text-lg font-bold">{item.title}</h2><div className="mt-3 flex flex-wrap gap-4 text-sm"><span className={approved?'text-emerald-200':'text-white/45'}>{approved?'✓':'○'} Avis éditorial approuvé</span><span className={cleared?'text-emerald-200':'text-white/45'}>{cleared?'✓':'○'} Droits vérifiés</span></div><button disabled={!ready||saving===item.id} onClick={()=>void publish(item)} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#F28C28] px-4 py-2.5 text-sm font-bold text-[#0B1B3D] disabled:opacity-40"><Send size={15}/>{saving===item.id?'Publication…':'Publier maintenant'}</button></article>})}</section>
 </div></main>
}