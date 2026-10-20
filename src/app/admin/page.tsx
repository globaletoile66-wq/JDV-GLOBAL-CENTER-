import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowLeft, ArrowRight, Settings2, ShieldCheck } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';

export default async function AdminPage() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (!user || authError) {
    redirect('/auth/login?redirect=/admin');
  }

  // Never rely on a client-side flag for access to administrative tools.
  const { data: superAdmin, error: roleError } = await supabase
    .from('super_admins')
    .select('id')
    .eq('user_id', user.id)
    .eq('admin_status', 'active')
    .maybeSingle();

  if (!superAdmin || roleError) {
    redirect('/access-required?reason=super_admin_required');
  }

  return (
    <main className="min-h-screen bg-[#080F2B] text-slate-100">
      <header className="border-b border-white/10">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-5 sm:px-6">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-slate-300 hover:text-white"><ArrowLeft size={16} /> JDV Global Center</Link>
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/5 px-3 py-2 text-xs text-emerald-100"><ShieldCheck size={14} /> Accès contrôlé côté serveur</span>
        </div>
      </header>
      <section className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
        <p className="text-xs font-bold uppercase tracking-[.2em] text-amber-300">JDV Admin</p>
        <h1 className="mt-4 text-4xl font-black tracking-tight sm:text-5xl">Administration de la plateforme</h1>
        <p className="mt-5 max-w-2xl text-base leading-7 text-slate-400">Ce point d’entrée est réservé aux administrateurs globaux autorisés. Les contrôles métier détaillés restent dans les écrans de gestion existants ; aucun droit n’est accordé par cette page.</p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <Link href="/super-admin" className="group rounded-2xl border border-white/10 bg-white/[.04] p-6 hover:border-amber-300/30">
            <Settings2 size={22} className="text-amber-200" />
            <h2 className="mt-4 text-lg font-extrabold">Centre de contrôle global</h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">Ouvrir le tableau de bord d’administration existant.</p>
            <span className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-amber-200">Ouvrir <ArrowRight size={15} className="transition group-hover:translate-x-1" /></span>
          </Link>
          <Link href="/parametres/branches" className="group rounded-2xl border border-white/10 bg-white/[.04] p-6 hover:border-amber-300/30">
            <Settings2 size={22} className="text-amber-200" />
            <h2 className="mt-4 text-lg font-extrabold">Préférences des branches</h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">Consulter les préférences d’interface configurables par branche.</p>
            <span className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-amber-200">Consulter <ArrowRight size={15} className="transition group-hover:translate-x-1" /></span>
          </Link>
        </div>
      </section>
    </main>
  );
}
