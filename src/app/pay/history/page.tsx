'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Download } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';
import PayHeader from '@/components/pay/PayHeader';
import { IN_TYPES, STATUS_LABEL, TYPE_LABEL, money, type PayTx } from '@/lib/pay/types';
import { txToCsv } from '@/lib/pay/csv';

const PAGE = 20;
type Dir = 'all' | 'in' | 'out';

export default function HistoryPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const sb = useMemo(() => createClient(), []);
  const [rows, setRows] = useState<PayTx[]>([]);
  const [dir, setDir] = useState<Dir>('all');
  const [period, setPeriod] = useState(30);
  const [more, setMore] = useState(false);
  const [busy, setBusy] = useState(true);

  useEffect(() => { if (!loading && !user) router.push('/auth/login?redirect=/pay/history'); }, [loading, user, router]);

  const query = useCallback((from: number, to: number) => {
    let q = sb.from('wallet_transactions').select('id,transaction_type,amount,fee_amount,transaction_status,description,reference,created_at,balance_after,currencies:currency_id(code)').order('created_at', { ascending: false }).range(from, to);
    if (dir === 'in') q = q.in('transaction_type', IN_TYPES); else if (dir === 'out') q = q.not('transaction_type', 'in', `(${IN_TYPES.join(',')})`);
    if (period > 0) q = q.gte('created_at', new Date(Date.now() - period * 86400000).toISOString());
    return q;
  }, [sb, dir, period]);

  useEffect(() => {
    if (!user) return;
    setBusy(true);
    query(0, PAGE - 1).then(({ data }) => { const d = (data ?? []) as unknown as PayTx[]; setRows(d); setMore(d.length === PAGE); setBusy(false); });
  }, [user, query]);

  async function loadMore() {
    const { data } = await query(rows.length, rows.length + PAGE - 1);
    const d = (data ?? []) as unknown as PayTx[]; setRows([...rows, ...d]); setMore(d.length === PAGE);
  }
  async function exportCsv() {
    const all: PayTx[] = []; let from = 0;
    for (let i = 0; i < 50; i++) { const { data } = await query(from, from + 199); const d = (data ?? []) as unknown as PayTx[]; all.push(...d); if (d.length < 200) break; from += 200; }
    const url = URL.createObjectURL(new Blob([txToCsv(all)], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a'); a.href = url; a.download = `jdv-pay-historique-${new Date().toISOString().slice(0, 10)}.csv`; a.click(); URL.revokeObjectURL(url);
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-6">
      <PayHeader title="Historique" active="/pay/history" />
      <div className="jdv-card p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div role="tablist" aria-label="Sens" className="flex gap-1 text-xs">
            {([['all', 'Tout'], ['in', 'Entrées'], ['out', 'Sorties']] as [Dir, string][]).map(([k, l]) => <button key={k} role="tab" aria-selected={dir === k} onClick={() => setDir(k)} className={`rounded-full px-3 py-1 ${dir === k ? 'bg-accent text-accent-foreground' : 'bg-muted text-foreground'}`}>{l}</button>)}
          </div>
          <div className="flex items-center gap-2">
            <label className="sr-only" htmlFor="period">Période</label>
            <select id="period" value={period} onChange={(e) => setPeriod(Number(e.target.value))} className="rounded-lg border border-border bg-card px-2 py-1 text-xs text-foreground"><option value={7}>7 jours</option><option value={30}>30 jours</option><option value={90}>90 jours</option><option value={0}>Tout</option></select>
            <button type="button" onClick={exportCsv} className="btn-ghost flex items-center gap-1 px-3 py-1 text-xs"><Download size={13} />CSV</button>
          </div>
        </div>
        {busy ? <p className="mt-4 text-sm text-muted-foreground">Chargement…</p> : rows.length === 0 ? <p className="mt-4 text-sm text-muted-foreground">Aucune opération sur cette période.</p> : (
          <ul className="mt-3 divide-y divide-border">
            {rows.map((t) => { const inn = IN_TYPES.includes(t.transaction_type); return (
              <li key={t.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                <div className="min-w-0"><p className="font-medium text-foreground">{TYPE_LABEL[t.transaction_type] ?? 'Opération'}{t.transaction_status !== 'completed' && <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">{STATUS_LABEL[t.transaction_status] ?? t.transaction_status}</span>}</p>
                  <p className="truncate text-xs text-muted-foreground">{t.description ?? t.reference} · {new Date(t.created_at).toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' })}</p></div>
                <div className="shrink-0 text-right"><p className={`font-semibold ${inn ? 'text-success' : 'text-foreground'}`}>{inn ? '+' : '−'}{money(Number(t.amount), t.currencies.code)}</p>
                  {Number(t.fee_amount) > 0 && <p className="text-xs text-muted-foreground">frais {money(Number(t.fee_amount), t.currencies.code)}</p>}</div>
              </li>); })}
          </ul>
        )}
        {more && !busy && <button type="button" onClick={loadMore} className="mt-3 w-full rounded-lg border border-border py-2 text-sm text-foreground hover:bg-muted">Voir plus</button>}
      </div>
    </main>
  );
}
