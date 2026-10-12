'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';
import { getCurrentBusinessId } from '@/lib/business/current-business';

type ReportData = { sales: number; revenue: number; clients: number; products: number };
const emptyReport: ReportData = { sales: 0, revenue: 0, clients: 0, products: 0 };

export default function BusinessReportsPage() {
  const { user, loading } = useAuth(); const router = useRouter(); const supabase = createClient();
  const [data, setData] = useState<ReportData>(emptyReport); const [busy, setBusy] = useState(true); const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    async function loadReports() {
      if (loading) return;
      if (!user) { router.replace('/auth/login'); return; }
      setBusy(true); setError('');
      try {
        const businessId = await getCurrentBusinessId(supabase, user.id);
        if (!businessId) { if (active) setData(emptyReport); return; }
        const [salesResult, clientsResult, productsResult] = await Promise.all([
          supabase.from('business_sales').select('total_amount,sale_status').eq('business_id', businessId),
          supabase.from('business_clients').select('id', { count: 'exact', head: true }).eq('business_id', businessId).eq('is_active', true),
          supabase.from('business_products').select('id', { count: 'exact', head: true }).eq('business_id', businessId).eq('is_active', true),
        ]);
        if (salesResult.error) throw salesResult.error;
        if (clientsResult.error) throw clientsResult.error;
        if (productsResult.error) throw productsResult.error;
        const sales = salesResult.data || [];
        if (active) setData({
          sales: sales.length,
          revenue: sales.filter((s: { sale_status: string | null }) => s.sale_status === 'paid').reduce((total: number, sale: { total_amount: number | string | null }) => total + Number(sale.total_amount || 0), 0),
          clients: clientsResult.count || 0,
          products: productsResult.count || 0,
        });
      } catch (e) { if (active) setError(e instanceof Error ? e.message : 'Impossible de charger les rapports.'); }
      finally { if (active) setBusy(false); }
    }
    void loadReports(); return () => { active = false; };
  }, [loading, user, router, supabase]);
  if (loading || busy) return <main className="grid min-h-screen place-items-center bg-[#0D1F3C] text-white">Chargement des rapports…</main>;
  const cards: Array<[keyof ReportData, string]> = [['sales', 'Ventes enregistrées'], ['revenue', 'Chiffre d’affaires encaissé'], ['clients', 'Clients actifs'], ['products', 'Produits actifs']];
  return <main className="min-h-screen bg-[#0D1F3C] p-6 text-white"><div className="mx-auto max-w-6xl">
    <Link href="/business" className="mb-6 inline-flex items-center gap-2 text-white/60 transition hover:text-white"><ArrowLeft size={16}/>Retour au tableau de bord</Link>
    <h1 className="text-2xl font-bold">Rapports JDV BUSINESS</h1>
    <p className="mt-2 text-sm text-white/55">Le chiffre d’affaires encaissé inclut uniquement les ventes au statut « payé ».</p>
    {error && <div role="alert" className="mt-5 rounded-xl border border-red-400/30 bg-red-400/10 p-4 text-red-100">{error}<button onClick={()=>router.refresh()} className="ml-3 inline-flex items-center gap-1 underline"><RefreshCw size={14}/>Réessayer</button></div>}
    <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{cards.map(([key,label])=><div key={key} className="rounded-xl border border-white/10 bg-white/5 p-5"><p className="text-white/50">{label}</p><p className="mt-2 text-2xl font-bold tabular-nums">{data[key].toLocaleString('fr-FR')}</p></div>)}</div>
  </div></main>;
}