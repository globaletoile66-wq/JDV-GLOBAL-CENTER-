'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Send, Download, History, Users } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';
import { usePayWallets } from '@/hooks/usePayWallets';
import PayHeader from '@/components/pay/PayHeader';
import { IN_TYPES, STATUS_LABEL, TYPE_LABEL, money, type PayTx } from '@/lib/pay/types';

export default function PayHome() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { wallets } = usePayWallets();
  const [txs, setTxs] = useState<PayTx[] | null>(null);
  const [all, setAll] = useState(false);

  useEffect(() => { if (!loading && !user) router.push('/auth/login?redirect=/pay'); }, [loading, user, router]);
  useEffect(() => {
    if (!user) return;
    createClient().from('wallet_transactions')
      .select('id,transaction_type,amount,fee_amount,transaction_status,description,reference,created_at,balance_after,currencies:currency_id(code)')
      .order('created_at', { ascending: false }).limit(6).then(({ data }) => setTxs((data ?? []) as unknown as PayTx[]));
  }, [user]);

  const shown = (wallets ?? []).filter((w) => all || w.balance > 0 || w.currencies.code === 'XOF');
  const actions = [['/pay/send', 'Envoyer', Send], ['/pay/receive', 'Recevoir', Download], ['/pay/history', 'Historique', History], ['/pay/beneficiaries', 'Bénéficiaires', Users]] as const;

  return (
    <main className="mx-auto max-w-3xl px-4 py-6">
      <PayHeader title="JDV PAY" active="/pay" back="/dashboard" />
      <section aria-labelledby="w-title" className="jdv-card p-5">
        <h2 id="w-title" className="font-bold text-foreground">Mes portefeuilles</h2>
        {wallets === null ? <p className="mt-3 text-sm text-muted-foreground">Chargement…</p> : (
          <ul className="mt-3 grid gap-3 sm:grid-cols-2">
            {shown.map((w) => (
              <li key={w.id} className="rounded-xl border border-border p-4">
                <p className="text-xs text-muted-foreground">{w.currencies.code}</p>
                <p className="mt-1 text-2xl font-extrabold text-foreground">{money(w.balance, w.currencies.code)}</p>
                {w.available_balance !== w.balance && <p className="text-xs text-muted-foreground">Disponible : {money(w.available_balance, w.currencies.code)}</p>}
              </li>
            ))}
          </ul>
        )}
        {wallets && wallets.length > shown.length && <button type="button" onClick={() => setAll(true)} className="mt-3 text-xs font-medium text-accent hover:underline">Voir les {wallets.length} devises</button>}
        <p className="mt-4 rounded-lg bg-muted p-3 text-xs text-muted-foreground">La recharge par Mobile Money ou carte sera disponible prochainement. En attendant, vous pouvez recevoir de l’argent d’un autre utilisateur JDV.</p>
      </section>

      <ul className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4" aria-label="Actions rapides">
        {actions.map(([href, label, Icon]) => (
          <li key={href}><Link href={href} className="jdv-card flex flex-col items-center gap-2 p-4 text-center text-sm font-medium text-foreground hover:border-accent/40"><Icon size={20} className="text-accent" />{label}</Link></li>
        ))}
      </ul>

      <section aria-labelledby="r-title" className="jdv-card mt-6 p-5">
        <div className="flex items-center justify-between"><h2 id="r-title" className="font-bold text-foreground">Dernières opérations</h2><Link href="/pay/history" className="text-xs font-medium text-accent hover:underline">Tout voir</Link></div>
        {txs === null ? <p className="mt-3 text-sm text-muted-foreground">Chargement…</p> : txs.length === 0 ? <p className="mt-3 text-sm text-muted-foreground">Aucune opération pour le moment.</p> : (
          <ul className="mt-3 divide-y divide-border">
            {txs.map((t) => {
              const inn = IN_TYPES.includes(t.transaction_type);
              return (
                <li key={t.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                  <div><p className="font-medium text-foreground">{TYPE_LABEL[t.transaction_type] ?? 'Opération'}{t.transaction_status !== 'completed' ? <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">{STATUS_LABEL[t.transaction_status] ?? t.transaction_status}</span> : null}</p>
                    <p className="text-xs text-muted-foreground">{t.description ?? t.reference} · {new Date(t.created_at).toLocaleDateString('fr-FR')}</p></div>
                  <p className={`font-semibold ${inn ? 'text-success' : 'text-foreground'}`}>{inn ? '+' : '−'}{money(Number(t.amount), t.currencies.code)}</p>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </main>
  );
}
