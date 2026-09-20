'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, LogOut, RefreshCw, Layers3 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

type ModuleRow={code:string;name:string;description:string|null;module_status:string;version:string|null;requires_subscription:boolean;sort_order:number};

export default function ConcepteurDashboard(){
 const {user,isSuperAdmin,loading:authLoading,signOut}=useAuth(); const router=useRouter(); const supabase=createClient();
 const [modules,setModules]=useState<ModuleRow[]>([]); const [loading,setLoading]=useState(true);
 async function load(){setLoading(true); const {data}=await supabase.from('modules').select('code,name,description,module_status,version,requires_subscription,sort_order').order('sort_order'); setModules((data||[]) as ModuleRow[]); setLoading(false);}
 useEffect(()=>{if(!authLoading&&!user){router.replace('/hidden-concepteur-gate/login');return;} if(!authLoading&&!isSuperAdmin){router.replace('/dashboard');return;} if(!authLoading&&isSuperAdmin)void load();},[authLoading,user,isSuperAdmin,router]);
 if(authLoading||!user||!isSuperAdmin)return <main className="min-h-screen bg-background flex items-center justify-center"><RefreshCw className="animate-spin text-accent"/></main>;
 return <main className="min-h-screen bg-background text-foreground">
  <header className="border-b border-border bg-card/80 backdrop-blur sticky top-0 z-40"><div className="mx-auto max-w-7xl h-16 px-4 flex items-center justify-between">
   <div className="flex items-center gap-3"><div className="h-9 w-9 rounded-xl bg-accent/10 text-accent flex items-center justify-center"><ShieldCheck size={20}/></div><div><h1 className="font-extrabold">Portail concepteur</h1><p className="text-xs text-muted-foreground">{user.email}</p></div></div>
   <button onClick={async()=>{await signOut();router.replace('/')}} className="btn-secondary"><LogOut size={16}/>Déconnexion</button>
  </div></header>
  <section className="mx-auto max-w-7xl px-4 py-8"><div className="mb-8"><h2 className="text-2xl font-extrabold">JDV GLOBAL CENTER</h2><p className="text-muted-foreground mt-1">Centre de contrôle des modules et services.</p></div>
   <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{loading?<div className="col-span-full flex justify-center py-16"><RefreshCw className="animate-spin text-accent"/></div>:modules.map(m=><article key={m.code} className="rounded-2xl border border-border bg-card p-5"><div className="flex items-center justify-between"><div className="h-10 w-10 rounded-xl bg-accent/10 text-accent flex items-center justify-center"><Layers3 size={19}/></div><span className="text-xs rounded-full border border-border px-2 py-1">{m.module_status}</span></div><h3 className="mt-4 font-bold">{m.name}</h3><p className="mt-1 text-xs text-muted-foreground">{m.code}</p><p className="mt-3 text-sm text-muted-foreground min-h-10">{m.description||'Module JDV'}</p><div className="mt-4 text-xs text-muted-foreground">Version {m.version||'—'} · {m.requires_subscription?'Abonnement':'Sans abonnement'}</div></article>)}</div>
  </section>
 </main>;
}