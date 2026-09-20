'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Construction } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

export default function Page(){
 const {user,loading}=useAuth(); const router=useRouter();
 useEffect(()=>{if(!loading&&!user)router.replace('/auth/login');},[loading,user,router]);
 if(loading||!user)return <main className="min-h-screen bg-[#0D1F3C] flex items-center justify-center text-white">Chargement…</main>;
 return <main className="min-h-screen bg-[#0D1F3C] text-white px-4 py-10"><div className="max-w-3xl mx-auto">
  <Link href="/business" className="inline-flex items-center gap-2 text-white/60 hover:text-white text-sm mb-8"><ArrowLeft size={16}/>Retour au tableau de bord</Link>
  <section className="rounded-2xl border border-white/10 bg-white/5 p-8"><Construction className="text-[#F97316] mb-4" size={32}/><h1 className="text-2xl font-bold">Nouvelle vente</h1><p className="mt-3 text-white/60 leading-relaxed">Enregistrez une vente réelle avec les contrôles métier du backend.</p><p className="mt-6 text-sm text-white/40">Cette interface est reliée à l'authentification réelle JDV et sera branchée aux données métier existantes sans données de démonstration.</p></section>
 </div></main>;
}