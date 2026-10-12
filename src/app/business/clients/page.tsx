'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Users, Plus, RefreshCw } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';
import { getCurrentBusinessId } from '@/lib/business/current-business';

type ClientRow = { id: string; company_name: string | null; first_name: string | null; last_name: string | null; email: string | null; phone: string | null; is_active: boolean; created_at: string };

export default function BusinessClientsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const supabase = createClient();
  const [rows, setRows] = useState<ClientRow[]>([]);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    async function load() {
      if (loading) return;
      if (!user) { router.replace('/auth/login'); return; }
      setBusy(true); setError('');
      try {
        const businessId = await getCurrentBusinessId(supabase, user.id);
        if (!businessId) throw new Error('Aucune entreprise associée à votre compte.');
        const { data, error: queryError } = await supabase.from('business_clients').select('id,company_name,first_name,last_name,email,phone,is_active,created_at').eq('business_id', businessId).order('created_at', { ascending: false }).limit(100);
        if (queryError) throw queryError;
        if (active) setRows((data || []) as ClientRow[]);
      } catch (e) { if (active) setError(e instanceof Error ? e.message : 'Impossible de charger les clients.'); }
      finally { if (active) setBusy(false); }
    }
    void load();
    return () => { active = false; };
  }, [user, loading, router, supabase]);

  if (loading || busy) return <main className="min-h-screen bg-[#0D1F3C] text-white grid place-items-center">Chargement des clients…</main>;
  return <main className="min-h-screen bg-[#0D1F3C] text-white p-6"><div className="max-w-6xl mx-auto">
    <Link href="/business" className="inline-flex items-center gap-2 text-white/60 hover:text-white mb-6"><ArrowLeft size={16}/>Retour au tableau de bord</Link>
    <div className="flex flex-wrap items-center justify-between gap-4"><div><h1 className="text-2xl font-bold">Clients</h1><p className="text-sm text-white/55 mt-1">{rows.length} client(s) affiché(s), maximum 100</p></div><Link href="/business/clients/new" className="inline-flex items-center gap-2 rounded-xl bg-[#F97316] px-4 py-2.5 font-semibold"><Plus size={17}/>Nouveau client</Link></div>
    {error && <div role="alert" className="mt-5 rounded-xl border border-red-400/30 bg-red-400/10 p-4 text-red-100">{error}<button onClick={()=>router.refresh()} className="ml-3 underline">Réessayer</button></div>}
    <div className="mt-6 overflow-auto rounded-xl border border-white/10"><table className="w-full text-sm text-left"><thead className="bg-white/5 text-white/65"><tr><th className="p-3">Client</th><th className="p-3">E-mail</th><th className="p-3">Téléphone</th><th className="p-3">Statut</th></tr></thead><tbody>
      {rows.map(r=><tr key={r.id} className="border-t border-white/10"><td className="p-3"><div className="font-medium">{r.company_name || [r.first_name,r.last_name].filter(Boolean).join(' ') || 'Client sans nom'}</div>{r.company_name && (r.first_name || r.last_name) && <div className="text-xs text-white/50">{[r.first_name,r.last_name].filter(Boolean).join(' ')}</div>}</td><td className="p-3">{r.email || '—'}</td><td className="p-3">{r.phone || '—'}</td><td className="p-3"><span className={r.is_active?'text-emerald-300':'text-white/45'}>{r.is_active?'Actif':'Inactif'}</span></td></tr>)}
    </tbody></table>{!error && rows.length===0 && <div className="p-10 text-center text-white/55"><Users size={28} className="mx-auto mb-3 opacity-60"/><p>Aucun client pour le moment.</p><Link className="inline-block mt-3 text-orange-300 hover:underline" href="/business/clients/new">Ajouter votre premier client</Link></div>}</div>
  </div></main>;
}
