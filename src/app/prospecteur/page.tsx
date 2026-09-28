'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { BriefcaseBusiness, LogOut, Loader2, Users } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';

export default function ProspecteurDashboard() {
  const { user, loading, isSuperAdmin, signOut } = useAuth();
  const router = useRouter();
  const [allowed, setAllowed] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    if (loading) return;
    if (!user) { router.replace('/auth/login'); return; }
    if (isSuperAdmin) { router.replace('/hidden-concepteur-gate/dashboard'); return; }
    (async () => {
      const { data } = await supabase.from('prospecteurs').select('id')
        .eq('user_id', user.id).eq('status', 'active').limit(1).maybeSingle();
      if (!data) { router.replace('/business'); return; }
      setAllowed(true);
    })();
  }, [loading, user, isSuperAdmin, router]);

  if (loading || !allowed) return <main className="min-h-screen bg-[#0D1F3C] text-white grid place-items-center"><Loader2 className="animate-spin"/></main>;

  return <main className="min-h-screen bg-[#0D1F3C] text-white">
    <header className="border-b border-white/10 bg-[#0D1F3C]/90 sticky top-0 z-40"><div className="mx-auto max-w-6xl h-16 px-4 flex items-center justify-between">
      <div><h1 className="font-extrabold">Espace Prospecteur</h1><p className="text-xs text-white/50">{user?.email}</p></div>
      <button onClick={async()=>{await signOut();router.replace('/')}} className="rounded-xl border border-white/10 px-3 py-2 text-sm"><LogOut size={15} className="inline mr-2"/>Déconnexion</button>
    </div></header>
    <section className="mx-auto max-w-6xl px-4 py-8">
      <h2 className="text-2xl font-extrabold">Mon activité commerciale</h2>
      <p className="mt-2 text-white/60">Votre espace est indépendant de celui du SUPER ADMIN et des autres prospecteurs.</p>
      <Link href="/prospecteur/portefeuille-clients" className="mt-7 inline-flex items-center gap-3 rounded-2xl bg-[#F97316] px-5 py-4 font-extrabold">
        <BriefcaseBusiness size={21}/>Mon portefeuille clients<Users size={18}/>
      </Link>
    </section>
  </main>;
}
