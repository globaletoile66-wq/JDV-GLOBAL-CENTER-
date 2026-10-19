'use client';
import Link from 'next/link';
import {useCallback,useEffect,useMemo,useState} from 'react';
import {ArrowLeft,RefreshCw} from 'lucide-react';
import {useAuth} from '@/contexts/AuthContext';
import {createClient} from '@/lib/supabase/client';
type Metric={content_id:string;views:number;likes:number;shares:number;comments:number;measured_at:string};
type Content={id:string;title:string;content_type:string;status:string;metrics:Metric[]};
export default function MediaAnalyticsPage(){
 const {user,loading}=useAuth();const db=useMemo(()=>createClient(),[]);
 const [rows,setRows]=useState<Content[]>([]);const [error,setError]=useState('');const [busy,setBusy]=useState(true);
 const load=useCallback(async()=>{setBusy(true);setError('');if(!user){setRows([]);setBusy(false);return}
 const {data:contents,error:e}=await db.from('media_contents').select('id,title,content_type,status').eq('author_user_id',user.id).limit(200);
 if(e){setError(e.message);setBusy(false);return}
 const list=contents??[];if(list.length){const {data:m,error:me}=await db.from('media_content_metrics').select('content_id,views,likes,shares,comments,measured_at').in('content_id',list.map(x=>x.id)).limit(1000);if(me)setError('Les métriques ne sont pas accessibles : '+me.message);const metrics=(m??[]) as Metric[];setRows(list.map(c=>({...c,metrics:metrics.filter(x=>x.content_id===c.id)})))}else setRows([]);
 setBusy(false)},[db,user]);
 useEffect(()=>{if(!loading)void load()},[loading,load]);
 const totals=rows.reduce((a,c)=>{for(const m of c.metrics){a.views+=Number(m.views||0);a.likes+=Number(m.likes||0);a.shares+=Number(m.shares||0);a.comments+=Number(m.comments||0)}return a},{views:0,likes:0,shares:0,comments:0});
 return <main className="min-h-screen bg-[#0B1B3D] p-6 text-white"><div className="mx-auto max-w-5xl"><header className="flex items-center justify-between"><Link href="/media" className="inline-flex items-center gap-2 text-sm text-white/60"><ArrowLeft size={16}/> Espace média</Link><button onClick={()=>void load()} disabled={busy} className="inline-flex items-center gap-2 rounded-xl border border-white/15 px-3 py-2 text-sm"><RefreshCw size={15}/> Actualiser</button></header><h1 className="mt-6 text-3xl font-black">JDV Media · Analytics</h1><p className="mt-2 text-sm text-white/55">Métriques réellement enregistrées pour vos contenus. Aucun chiffre n’est simulé.</p>{error&&<p role="alert" className="mt-4 rounded-xl border border-amber-300/20 p-4 text-sm">{error}</p>}<section className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">{[['Vues',totals.views],['J’aime',totals.likes],['Partages',totals.shares],['Commentaires',totals.comments]].map(([k,v])=><article key={String(k)} className="rounded-xl border border-white/10 p-4"><p className="text-xs text-white/45">{k}</p><p className="mt-2 text-2xl font-bold">{Number(v).toLocaleString('fr-FR')}</p></article>)}</section><section className="mt-6 space-y-3">{busy?<p>Chargement…</p>:rows.length===0?<p className="rounded-xl border border-dashed border-white/15 p-5 text-sm text-white/50">Aucun contenu ou aucune métrique disponible.</p>:rows.map(c=>{const t=c.metrics.reduce((a,m)=>({views:a.views+Number(m.views||0),likes:a.likes+Number(m.likes||0),shares:a.shares+Number(m.shares||0),comments:a.comments+Number(m.comments||0)}),{views:0,likes:0,shares:0,comments:0});return <article key={c.id} className="rounded-xl border border-white/10 p-4"><h2 className="font-semibold">{c.title}</h2><p className="mt-1 text-xs text-white/45">{c.content_type} · {c.status}</p><p className="mt-3 text-sm text-[#F28C28]">{t.views} vues · {t.likes} j’aime · {t.shares} partages · {t.comments} commentaires</p></article>})}</section></div></main>
}