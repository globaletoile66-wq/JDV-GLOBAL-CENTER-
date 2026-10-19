'use client';

import Link from 'next/link';
import { ArrowLeft, Bell, CalendarDays, MessageCircle, ShieldCheck, Users } from 'lucide-react';

export default function SocialMessagesPage() {
  return <main className="min-h-screen bg-[#0B1B3D] p-5 text-white sm:p-8"><div className="mx-auto max-w-4xl">
    <Link href="/social" className="inline-flex items-center gap-2 text-sm text-white/60 hover:text-white"><ArrowLeft size={16}/> Retour au fil JDV Social</Link>
    <section className="mt-7 rounded-3xl border border-white/10 bg-white/[.06] p-6 sm:p-9"><div className="rounded-2xl bg-[#F28C28]/10 p-3 text-[#F28C28] w-fit"><MessageCircle size={28}/></div><p className="mt-5 text-xs font-bold uppercase tracking-[.25em] text-[#F28C28]">JDV GLOBAL CENTER</p><h1 className="mt-2 text-3xl font-black">Messagerie communautaire</h1><div className="mt-5 rounded-2xl border border-white/10 bg-[#09152f]/50 p-5"><p className="flex items-center gap-2 font-semibold"><ShieldCheck size={18} className="text-[#F28C28]"/> Intégration CORE requise</p><p className="mt-3 text-sm leading-6 text-white/65">La messagerie directe n’est pas activée dans cette première tranche. L’audit a retrouvé des conversations propres à la marketplace et des conversations IA, mais pas de service de messagerie directe générique confirmé pour CORE. Pour protéger les données et éviter les doublons, JDV Social ne détournera pas les conversations marketplace et ne créera pas de deuxième moteur de messagerie sans valider l’architecture centrale.</p><p className="mt-3 text-sm leading-6 text-white/65">Cette page est le point d’entrée réservé à la future messagerie sociale. Les conversations et envois ne sont pas encore disponibles ici.</p></div>
    <div className="mt-6 flex flex-wrap gap-2"><Link href="/social/groups" className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-3 text-sm"><Users size={15}/> Groupes</Link><Link href="/social/events" className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-3 text-sm"><CalendarDays size={15}/> Événements</Link><Link href="/social/notifications" className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-3 text-sm"><Bell size={15}/> Notifications</Link></div>
    </section>
  </div></main>;
}
