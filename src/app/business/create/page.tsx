'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Building2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';

export default function CreateBusinessPage(){
 const {user,loading}=useAuth(); const router=useRouter(); const [busy,setBusy]=useState(false);
 const [form,setForm]=useState({name:'',trade_name:'',phone:'',email:user?.email||'',city:'',address:'',description:''});
 const submit=async(e:React.FormEvent)=>{e.preventDefault(); if(!user){router.replace('/auth/login?redirect=/business/create');return;} if(!form.name.trim())return toast.error('Le nom de l’entreprise est obligatoire.'); setBusy(true);
  try{const supabase=createClient(); const {data,error}=await supabase.rpc('business_register_company',{p_name:form.name,p_trade_name:form.trade_name||null,p_phone:form.phone||null,p_email:form.email||null,p_city:form.city||null,p_address:form.address||null,p_description:form.description||null}); if(error)throw error; toast.success('Entreprise enregistrée.'); router.push('/business');}catch(err:any){toast.error(err?.message||'Impossible d’enregistrer l’entreprise.');}finally{setBusy(false);}
 };
 if(loading)return <main className="min-h-screen bg-[#0D1F3C] flex items-center justify-center text-white">Chargement…</main>;
 if(!user)return <main className="min-h-screen bg-[#0D1F3C] text-white p-6"><div className="mx-auto max-w-xl pt-20"><Link href="/auth/login?redirect=/business/create" className="btn-primary">Se connecter pour continuer</Link></div></main>;
 return <main className="min-h-screen bg-[#0D1F3C] text-white px-4 py-10"><div className="mx-auto max-w-3xl"><Link href="/" className="mb-8 inline-flex items-center gap-2 text-white/60 hover:text-white"><ArrowLeft size={16}/>Accueil JDV</Link><section className="rounded-3xl border border-white/10 bg-white/5 p-6 sm:p-8"><div className="mb-7 flex items-center gap-4"><div className="rounded-2xl bg-[#F97316]/10 p-3 text-[#F97316]"><Building2/></div><div><h1 className="text-2xl font-extrabold">Enregistrer mon entreprise</h1><p className="text-sm text-white/50">Créez votre espace professionnel avec vos informations réelles.</p></div></div><form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">{[['name','Nom de l’entreprise *'],['trade_name','Nom commercial'],['phone','Téléphone'],['email','Email professionnel'],['city','Ville'],['address','Adresse']].map(([k,l])=><label key={k} className="text-sm font-medium">{l}<input value={(form as any)[k]} onChange={e=>setForm({...form,[k]:e.target.value})} className="jdv-input mt-1" required={k==='name'}/></label>)}<label className="sm:col-span-2 text-sm font-medium">Présentation<textarea value={form.description} onChange={e=>setForm({...form,description:e.target.value})} className="jdv-input mt-1 min-h-28"/></label><div className="sm:col-span-2 flex flex-wrap justify-end gap-3 pt-3"><Link href="/business" className="btn-secondary">Annuler</Link><button disabled={busy} className="btn-primary">{busy?<Loader2 className="animate-spin"/>:'Créer mon espace'}<ArrowRight size={16}/></button></div></form></section></div></main>;
}
