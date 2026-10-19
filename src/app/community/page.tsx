'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Compass, RefreshCw, ShieldCheck, Users, CalendarDays, MessageCircle, Globe2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

type CommunityGroup = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  visibility: 'public' | 'private';
  created_at: string;
};

export default function CommunityPage() {
  const { user, loading: authLoading } = useAuth();
  const supabase = useMemo(() => createClient(), []);
  const [groups, setGroups] = useState<CommunityGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadGroups = useCallback(async () => {
    setLoading(true);
    setError('');
    const { data, error: queryError } = await supabase
      .from('social_groups')
      .select('id,name,slug,description,visibility,created_at')
      .eq('status', 'active')
      .eq('visibility', 'public')
      .order('created_at', { ascending: false })
      .limit(6);
    if (queryError) {
      setError('La liste des communautés est temporairement indisponible. Vous pouvez toujours ouvrir l’espace des groupes.');
      setGroups([]);
    } else {
      setGroups((data ?? []) as CommunityGroup[]);
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => { if (!authLoading) void loadGroups(); }, [authLoading, loadGroups]);

  return (
    <main className="min-h-screen bg-[#0B1B3D] text-white">
      <header className="border-b border-white/10">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-white/65 hover:text-white"><ArrowLeft size={16}/> JDV GLOBAL CENTER</Link>
          <div className="flex gap-2">
            <Link href="/social" className="rounded-xl border border-white/15 px-4 py-2 text-sm hover:border-[#F28C28]/60">JDV Social</Link>
            <Link href={user ? '/social/groups' : '/auth/login'} className="rounded-xl bg-[#F28C28] px-4 py-2 text-sm font-bold text-[#0B1B3D]">{user ? 'Gérer les groupes' : 'Se connecter'}</Link>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-5 py-12 sm:py-16">
        <div className="grid gap-10 lg:grid-cols-[1.15fr_.85fr] lg:items-center">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-[#F28C28]/30 bg-[#F28C28]/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[.18em] text-[#F28C28]"><Globe2 size={14}/> JDV Community</p>
            <h1 className="mt-5 max-w-3xl text-4xl font-black leading-tight sm:text-6xl">Les communautés qui font avancer l’Afrique.</h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-white/65">Rejoignez des espaces de partage autour de l’entrepreneuriat, de la formation, des initiatives locales et des projets panafricains. Les groupes structurés utilisent les services d’identité et de modération communs de JDV.</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href={user ? '/social/groups' : '/auth/login'} className="inline-flex items-center gap-2 rounded-xl bg-[#F28C28] px-5 py-3 font-bold text-[#0B1B3D]">Découvrir les communautés <ArrowRight size={17}/></Link>
              <Link href="/social/events" className="inline-flex items-center gap-2 rounded-xl border border-white/15 px-5 py-3 font-semibold hover:border-[#F28C28]/60"><CalendarDays size={17}/> Événements communautaires</Link>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              { icon: Users, title: 'Groupes structurés', text: 'Espaces publics et privés avec rôles et adhésions.' },
              { icon: MessageCircle, title: 'Échanges collectifs', text: 'Discussions et annonces dans les espaces adaptés.' },
              { icon: ShieldCheck, title: 'Modération', text: 'Accès et actions soumis aux permissions du groupe.' },
              { icon: Compass, title: 'Découverte', text: 'Trouvez les communautés pertinentes pour vos projets.' },
            ].map(({ icon: Icon, title, text }) => <article key={title} className="rounded-2xl border border-white/10 bg-white/[.045] p-5"><Icon size={22} className="text-[#F28C28]"/><h2 className="mt-4 font-bold">{title}</h2><p className="mt-2 text-sm leading-6 text-white/55">{text}</p></article>)}
          </div>
        </div>

        <section className="mt-14 border-t border-white/10 pt-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div><p className="text-xs font-bold uppercase tracking-[.2em] text-[#F28C28]">À découvrir</p><h2 className="mt-2 text-2xl font-extrabold">Communautés publiques</h2><p className="mt-2 text-sm text-white/55">Les groupes affichés proviennent de la base JDV existante.</p></div>
            <button type="button" onClick={() => void loadGroups()} disabled={loading} className="inline-flex items-center gap-2 rounded-xl border border-white/15 px-4 py-2 text-sm disabled:opacity-50"><RefreshCw size={15} className={loading ? 'animate-spin' : ''}/> Actualiser</button>
          </div>
          {error && <p role="status" className="mt-5 rounded-xl border border-amber-300/20 bg-amber-300/10 p-4 text-sm text-amber-100">{error}</p>}
          {loading ? <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{[1,2,3].map((item) => <div key={item} className="h-40 animate-pulse rounded-2xl border border-white/10 bg-white/5"/>)}</div> :
            groups.length ? <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{groups.map((group) => <article key={group.id} className="rounded-2xl border border-white/10 bg-white/[.04] p-5"><div className="flex items-start justify-between gap-3"><h3 className="text-lg font-bold">{group.name}</h3><span className="rounded-full bg-emerald-400/10 px-2.5 py-1 text-xs text-emerald-200">Public</span></div><p className="mt-3 min-h-12 text-sm leading-6 text-white/60">{group.description || 'Un espace communautaire JDV pour partager et collaborer.'}</p><Link href={user ? '/social/groups' : '/auth/login'} className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[#F28C28]">Voir le groupe <ArrowRight size={15}/></Link></article>)}</div> :
            <div className="mt-6 rounded-2xl border border-dashed border-white/15 p-8 text-center"><Users size={30} className="mx-auto text-white/35"/><p className="mt-3 font-semibold">Les communautés se construisent ici.</p><p className="mt-2 text-sm text-white/50">Aucun groupe public n’est disponible à afficher pour le moment.</p><Link href={user ? '/social/groups' : '/auth/login'} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#F28C28] px-4 py-2.5 font-bold text-[#0B1B3D]">{user ? 'Créer une communauté' : 'Se connecter'} <ArrowRight size={16}/></Link></div>}
        </section>
        <p className="mt-10 text-xs leading-5 text-white/35">Les adhésions, rôles et règles de confidentialité restent contrôlés par les permissions du service. Cette page ne présente pas de groupes privés ni de données de membres.</p>
      </section>
    </main>
  );
}
