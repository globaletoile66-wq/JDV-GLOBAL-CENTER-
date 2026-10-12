'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';
import { getCurrentBusinessId } from '@/lib/business/current-business';

type Expense = { id: string; expense_date: string; description: string; amount: number | string; expense_status: string };

const statusLabel = (status: string | null | undefined) => {
  const labels: Record<string, string> = { pending: 'En attente', approved: 'Approuvée', rejected: 'Rejetée', paid: 'Payée' };
  return status ? labels[status.toLowerCase()] ?? status : 'Non défini';
};

export default function Page() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const supabase = createClient();
  const [rows, setRows] = useState<Expense[]>([]);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    const load = async () => {
      if (loading) return;
      if (!user) { router.replace('/auth/login'); setBusy(false); return; }
      setBusy(true); setError('');
      try {
        const businessId = await getCurrentBusinessId(supabase, user.id);
        if (!businessId) throw new Error('Aucune entreprise associée à votre compte.');
        const { data, error: queryError } = await supabase.from('business_expenses')
          .select('id,expense_date,description,amount,expense_status')
          .eq('business_id', businessId).order('expense_date', { ascending: false }).limit(100);
        if (queryError) throw queryError;
        if (active) setRows((data ?? []) as Expense[]);
      } catch {
        if (active) { setRows([]); setError('Impossible de charger les dépenses. Vérifiez vos droits d’accès puis réessayez.'); }
      } finally { if (active) setBusy(false); }
    };
    void load();
    return () => { active = false; };
  }, [user, loading, router, supabase]);

  if (loading || busy) return <main className="min-h-screen bg-[#0D1F3C] text-white grid place-items-center">Chargement des dépenses…</main>;

  return <main className="min-h-screen bg-[#0D1F3C] text-white p-4 sm:p-6">
    <div className="mx-auto max-w-6xl">
      <Link href="/business" className="mb-6 inline-flex items-center gap-2 text-sm text-white/60 hover:text-white"><ArrowLeft size={16} /> Retour au tableau de bord</Link>
      <h1 className="text-2xl font-bold">Dépenses</h1>
      <p className="mt-2 text-sm text-white/60">Les 100 dernières dépenses de votre entreprise.</p>
      {error && <p role="alert" className="mt-5 rounded-xl border border-red-400/30 bg-red-400/10 p-4 text-sm text-red-100">{error}</p>}
      <div className="mt-6 overflow-x-auto rounded-xl border border-white/10">
        <table className="w-full text-left text-sm">
          <thead className="bg-white/5 text-white/70"><tr><th className="p-3 font-medium">Date</th><th className="p-3 font-medium">Description</th><th className="p-3 font-medium">Montant</th><th className="p-3 font-medium">Statut</th></tr></thead>
          <tbody>{rows.map((expense) => <tr key={expense.id} className="border-t border-white/10">
            <td className="p-3">{expense.expense_date ? new Date(expense.expense_date).toLocaleDateString('fr-FR') : '—'}</td>
            <td className="p-3">{expense.description || '—'}</td>
            <td className="p-3">{new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 2 }).format(Number(expense.amount))}</td>
            <td className="p-3">{statusLabel(expense.expense_status)}</td>
          </tr>)}</tbody>
        </table>
        {!error && rows.length === 0 && <p className="p-8 text-center text-white/50">Aucune dépense enregistrée.</p>}
      </div>
    </div>
  </main>;
}
