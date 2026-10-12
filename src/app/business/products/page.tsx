'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Package, Plus } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';
import { getCurrentBusinessId } from '@/lib/business/current-business';

type ProductRow = { id: string; name: string; code: string | null; price: number | string; stock_quantity: number | string; is_active: boolean; is_service: boolean };

export default function BusinessProductsPage() {
  const { user, loading } = useAuth(); const router = useRouter(); const supabase = createClient();
  const [rows, setRows] = useState<ProductRow[]>([]); const [busy, setBusy] = useState(true); const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    async function load() {
      if (loading) return;
      if (!user) { router.replace('/auth/login'); return; }
      setBusy(true); setError('');
      try {
        const businessId = await getCurrentBusinessId(supabase, user.id);
        if (!businessId) throw new Error('Aucune entreprise associée à votre compte.');
        const { data, error: queryError } = await supabase.from('business_products').select('id,name,code,price,stock_quantity,is_active,is_service').eq('business_id', businessId).order('created_at', { ascending: false }).limit(100);
        if (queryError) throw queryError;
        if (active) setRows((data || []) as ProductRow[]);
      } catch (e) { if (active) setError(e instanceof Error ? e.message : 'Impossible de charger le catalogue.'); }
      finally { if (active) setBusy(false); }
    }
    void load(); return () => { active = false; };
  }, [user, loading, router, supabase]);
  if (loading || busy) return <main className="min-h-screen bg-[#0D1F3C] text-white grid place-items-center">Chargement du catalogue…</main>;
  const money = (v: number | string) => Number(v).toLocaleString('fr-FR', { maximumFractionDigits: 2 });
  return <main className="min-h-screen bg-[#0D1F3C] text-white p-6"><div className="max-w-6xl mx-auto">
    <Link href="/business" className="inline-flex items-center gap-2 text-white/60 hover:text-white mb-6"><ArrowLeft size={16}/>Retour au tableau de bord</Link>
    <div className="flex flex-wrap items-center justify-between gap-4"><div><h1 className="text-2xl font-bold">Produits et services</h1><p className="mt-1 text-sm text-white/55">{rows.length} élément(s) affiché(s), maximum 100</p></div><Link href="/business/products/new" className="inline-flex items-center gap-2 rounded-xl bg-[#F97316] px-4 py-2.5 font-semibold"><Plus size={17}/>Nouveau produit</Link></div>
    {error && <p role="alert" className="mt-5 rounded-xl border border-red-400/30 bg-red-400/10 p-4 text-red-100">{error}</p>}
    <div className="mt-6 overflow-auto rounded-xl border border-white/10"><table className="w-full text-sm text-left"><thead className="bg-white/5 text-white/65"><tr><th className="p-3">Nom</th><th className="p-3">Référence</th><th className="p-3">Type</th><th className="p-3">Prix</th><th className="p-3">Stock</th><th className="p-3">Statut</th></tr></thead><tbody>
      {rows.map(r=><tr key={r.id} className="border-t border-white/10"><td className="p-3 font-medium">{r.name}</td><td className="p-3">{r.code || '—'}</td><td className="p-3">{r.is_service?'Service':'Produit'}</td><td className="p-3 tabular-nums">{money(r.price)}</td><td className="p-3 tabular-nums">{money(r.stock_quantity)}</td><td className="p-3"><span className={r.is_active?'text-emerald-300':'text-white/45'}>{r.is_active?'Actif':'Inactif'}</span></td></tr>)}
    </tbody></table>{!error && rows.length===0 && <div className="p-10 text-center text-white/55"><Package size={28} className="mx-auto mb-3 opacity-60"/><p>Votre catalogue est vide.</p><Link className="inline-block mt-3 text-orange-300 hover:underline" href="/business/products/new">Ajouter un produit ou un service</Link></div>}</div>
  </div></main>;
}
