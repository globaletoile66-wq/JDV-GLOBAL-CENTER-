'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { branchName } from '@/lib/billing/branches';
import { money, type Invoice } from '@/lib/billing/format';

export default function FacturesPage() {
  const [list, setList] = useState<Invoice[] | null>(null);
  useEffect(() => {
    createClient().from('billing_invoices').select('id,invoice_number,module_code,plan_name,currency,total,issued_at,period_end,status').order('issued_at', { ascending: false }).limit(100)
      .then(({ data }) => setList((data ?? []) as unknown as Invoice[]));
  }, []);
  return (
    <main className="jdv-home min-h-screen px-5 py-10">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-3xl font-bold" style={{ color: 'var(--jdv-primary-text)' }}>Mes factures</h1>
        <p className="mt-1 text-sm text-[var(--jdv-muted)]">Historique de vos paiements d’abonnement. <Link href="/abonnements" className="underline">Retour aux abonnements</Link></p>
        {list === null ? <p className="mt-6">Chargement…</p> : list.length === 0 ? <p className="mt-6 text-[var(--jdv-muted)]">Aucune facture pour le moment.</p> : (
          <div className="mt-6 overflow-x-auto rounded-2xl border border-[var(--jdv-border)] bg-white">
            <table className="w-full text-left text-sm">
              <thead className="bg-[var(--jdv-primary-soft)]"><tr><th className="p-3">Numéro</th><th className="p-3">Date</th><th className="p-3">Branche</th><th className="p-3">Formule</th><th className="p-3 text-right">Total</th><th className="p-3"><span className="sr-only">Ouvrir</span></th></tr></thead>
              <tbody>
                {list.map((i) => (
                  <tr key={i.id} className="border-t border-[var(--jdv-border)]">
                    <td className="p-3 font-medium">{i.invoice_number}</td>
                    <td className="p-3">{new Date(i.issued_at).toLocaleDateString('fr-FR')}</td>
                    <td className="p-3">{branchName(i.module_code)}</td>
                    <td className="p-3">{i.plan_name}</td>
                    <td className="p-3 text-right">{money(Number(i.total), i.currency)}</td>
                    <td className="p-3 text-right"><Link href={`/abonnements/factures/${i.id}`} className="underline" style={{ color: 'var(--jdv-primary-text)' }}>Ouvrir</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
