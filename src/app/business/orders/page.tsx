'use client';
import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ShoppingBag } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';
import { getCurrentBusinessId } from '@/lib/business/current-business';

type Order = { id: string; order_number?: string | null; total_amount?: number | string | null; order_status?: string | null; created_at?: string | null };
const statusLabel = (value: string | null | undefined) => {
  const labels: Record<string, string> = { pending: 'En attente', confirmed: 'Confirmée', processing: 'En cours', shipped: 'Expédiée', delivered: 'Livrée', cancelled: 'Annulée', completed: 'Terminée', paid: 'Payée' };
  return value ? labels[value.toLowerCase()] ?? value : 'Non défini';
};
export default function Page() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const supabase = createClient();
  const [rows, setRows] = useState<Order[]>([]);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState('');
  const loadOrders = useCallback(async () => {
    if (!user) return;
    setBusy(true); setError('');
    const id = await getCurrentBusinessId(supabase, user.id);
    if (!id) { setRows([]); setError('Aucune entreprise associée à ce compte.'); setBusy(false); return; }
    const { data, error: queryError } = await supabase.from('business_orders').select('id,order_number,total_amount,order_status,created_at').eq('business_id', id).order('created_at', { ascending: false }).limit(100);
    if (queryError) { setRows([]); setError('Impossible de charger les commandes. Vérifiez vos droits d’accès puis réessayez.'); }
    else setRows((data ?? []) as Order[]);
    setBusy(false);
  }, [supabase, user]);
  useEffect(() => {
    if (!loading && !user) router.replace('/auth/login');
    if (!loading && user) void loadOrders();
  }, [loading, user, router, loadOrders]);
  if (loading || busy) return <main className="min-h-screen bg-[#0D1F3C] text-white grid place-items-center">Chargement des commandes…</main>;
  return <main className="min-h-screen bg-[#0D1F3C] text-white p-4 sm:p-6"><div className="mx-auto max-w-6xl">
    <Link href="/business" className="mb-6 inline-flex items-center gap-2 text-sm text-white/60 hover:text-white"><ArrowLeft size={16}/> Retour au tableau de bord</Link>
    <div className="mb-6 flex items-center gap-3"><ShoppingBag size={28} className="text-[#F97316]"/><div><h1 className="text-2xl font-bold">Commandes</h1><p className="mt-1 text-sm text-white/60">Les 100 dernières commandes de votre entreprise.</p></div></div>
    {error && <p role="alert" className="mb-5 rounded-xl border border-red-400/30 bg-red-400/10 p-4 text-sm text-red-100">{error}</p>}
    <div className="overflow-x-auto rounded-xl border border-white/10"><table className="w-full text-left text-sm"><thead className="bg-white/5 text-white/70"><tr><th className="p-3 font-medium">N° commande</th><th className="p-3 font-medium">Montant total</th><th className="p-3 font-medium">Statut</th><th className="p-3 font-medium">Créée le</th></tr></thead><tbody>
    {rows.map((row) => <tr key={row.id} className="border-t border-white/10"><td className="p-3">{row.order_number || '—'}</td><td className="p-3">{row.total_amount == null ? '—' : new Intl.NumberFormat('fr-FR', { style: 'decimal', maximumFractionDigits: 2 }).format(Number(row.total_amount))}</td><td className="p-3">{statusLabel(row.order_status)}</td><td className="p-3 text-white/65">{row.created_at ? new Date(row.created_at).toLocaleDateString('fr-FR') : '—'}</td></tr>)}
    </tbody></table>{rows.length === 0 && !error && <p className="p-8 text-center text-white/50">Aucune commande enregistrée.</p>}</div>
  </div></main>;
}
