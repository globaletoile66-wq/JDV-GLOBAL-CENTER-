'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Receipt, Plus } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';
import { getCurrentBusinessId } from '@/lib/business/current-business';

type SaleRow = { id: string; sale_number: string; total_amount: number | string; sale_status: string; sale_date: string; client_id: string | null };
const saleStatusLabel = (status: string) => {
  const labels: Record<string, string> = { pending: 'En attente', confirmed: 'Confirmée', paid: 'Payée', partially_paid: 'Partiellement payée', cancelled: 'Annulée', refunded: 'Remboursée' };
  return labels[status] ?? status;
};
export default function BusinessSalesPage() {
  const { user, loading } = useAuth(); const router = useRouter(); const supabase = createClient();
  const [rows, setRows] = useState<SaleRow[]>([]); const [clientNames, setClientNames] = useState<Record<string, string>>({}); const [busy, setBusy] = useState(true); const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    async function load() {
      if (loading) return;
      if (!user) { router.replace('/auth/login'); return; }
      setBusy(true); setError('');
      try {
        const businessId = await getCurrentBusinessId(supabase, user.id);
        if (!businessId) throw new Error('Aucune entreprise associée à votre compte.');
        const { data, error: queryError } = await supabase.from('business_sales').select('id,sale_number,total_amount,sale_status,sale_date,client_id').eq('business_id', businessId).order('created_at', { ascending: false }).limit(100);
        if (queryError) throw queryError;
        const { data: clientRows } = await supabase.from('business_clients').select('id,company_name,first_name,last_name').eq('business_id', businessId).limit(1000);
        if (active) {
          setRows((data || []) as SaleRow[]);
          setClientNames(Object.fromEntries((clientRows || []).map((client: { id: string; company_name: string | null; first_name: string | null; last_name: string | null }) => [client.id, client.company_name || [client.first_name, client.last_name].filter(Boolean).join(' ') || client.id])));
        }
      } catch (e) { if (active) setError(e instanceof Error ? e.message : 'Impossible de charger les ventes.'); }
      finally { if (active) setBusy(false); }
    }
    void load(); return () => { active = false; };
  }, [user, loading, router, supabase]);
  if (loading || busy) return <main className="min-h-screen bg-[#0D1F3C] text-white grid place-items-center">Chargement des ventes…</main>;
  const money = (v: number | string) => Number(v).toLocaleString('fr-FR', { maximumFractionDigits: 2 });
  return <main className="min-h-screen bg-[#0D1F3C] text-white p-6"><div className="max-w-6xl mx-auto">
    <Link href="/business" className="inline-flex items-center gap-2 text-white/60 hover:text-white mb-6"><ArrowLeft size={16}/>Retour au tableau de bord</Link>
    <div className="flex flex-wrap items-center justify-between gap-4"><div><h1 className="text-2xl font-bold">Ventes</h1><p className="mt-1 text-sm text-white/55">{rows.length} vente(s) affichée(s), maximum 100</p></div><Link href="/business/sales/new" className="inline-flex items-center gap-2 rounded-xl bg-[#F97316] px-4 py-2.5 font-semibold"><Plus size={17}/>Nouvelle vente</Link></div>
    {error && <p role="alert" className="mt-5 rounded-xl border border-red-400/30 bg-red-400/10 p-4 text-red-100">{error}</p>}
    <div className="mt-6 overflow-auto rounded-xl border border-white/10"><table className="w-full text-sm text-left"><thead className="bg-white/5 text-white/65"><tr><th className="p-3">N° de vente</th><th className="p-3">Date</th><th className="p-3">Client</th><th className="p-3">Montant total</th><th className="p-3">Statut</th></tr></thead><tbody>
      {rows.map(r=><tr key={r.id} className="border-t border-white/10"><td className="p-3 font-medium">{r.sale_number}</td><td className="p-3">{r.sale_date ? new Date(r.sale_date).toLocaleDateString('fr-FR') : '—'}</td><td className="p-3">{r.client_id ? (clientNames[r.client_id] || 'Client associé') : 'Vente sans client'}</td><td className="p-3 tabular-nums">{money(r.total_amount)}</td><td className="p-3">{saleStatusLabel(r.sale_status)}</td></tr>)}
    </tbody></table>{!error && rows.length===0 && <div className="p-10 text-center text-white/55"><Receipt size={28} className="mx-auto mb-3 opacity-60"/><p>Aucune vente enregistrée.</p><Link className="inline-block mt-3 text-orange-300 hover:underline" href="/business/sales/new">Enregistrer une première vente</Link></div>}</div>
  </div></main>;
}
