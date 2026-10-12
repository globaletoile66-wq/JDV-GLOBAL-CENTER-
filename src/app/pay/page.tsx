'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, RefreshCw, Search } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';

interface Wallet {
  id: string;
  user_id: string;
  wallets?: string | null;
  available_balance?: number | string | null;
  balance?: number | string | null;
  description?: string | null;
  created_at?: string | null;
}

export default function PayPage() {
  const { user, loading } = useAuth();
  const [rows, setRows] = useState<Wallet[]>([]);
  const [query, setQuery] = useState('');
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState('');
  const requestId = useRef(0);
  const supabase = createClient();

  const load = useCallback(async () => {
    const currentRequestId = ++requestId.current;
    if (!user) {
      setRows([]);
      setError('');
      setBusy(false);
      return;
    }

    setBusy(true);
    setError('');
    try {
      // Scope the request to the signed-in user as defense in depth.
      // Database RLS remains the authoritative access-control boundary.
      const { data, error: queryError } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', user.id)
        .limit(100);

      if (queryError) throw queryError;
      if (currentRequestId === requestId.current) setRows((data ?? []) as Wallet[]);
    } catch (cause) {
      if (currentRequestId === requestId.current) {
        setRows([]);
        setError(cause instanceof Error ? cause.message : 'Impossible de charger les portefeuilles.');
      }
    } finally {
      if (currentRequestId === requestId.current) setBusy(false);
    }
  }, [supabase, user]);

  useEffect(() => {
    if (!loading) void load();
    return () => { requestId.current += 1; };
  }, [loading, load]);

  const filtered = rows.filter((row) =>
    JSON.stringify(row).toLowerCase().includes(query.toLowerCase())
  );

  return (
    <main className="min-h-screen bg-[#0B1B3D] p-5 text-white sm:p-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex justify-between">
          <Link href="/" className="inline-flex gap-2 text-white/60 hover:text-white">
            <ArrowLeft size={16} />Accueil
          </Link>
          <button onClick={() => void load()} disabled={busy || loading} className="inline-flex gap-2 rounded-xl border border-white/10 px-4 py-2 disabled:opacity-50">
            <RefreshCw size={16} className={busy ? 'animate-spin' : ''} />Actualiser
          </button>
        </div>

        <section className="mt-7 rounded-3xl border border-white/10 bg-white/[.06] p-6">
          <div className="flex flex-col gap-5 md:flex-row md:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[.25em] text-[#F28C28]">JDV GLOBAL CENTER</p>
              <h1 className="mt-2 text-3xl font-black">JDV PAY</h1>
              <p className="mt-2 text-white/60">Portefeuille, demandes de paiement et services financiers</p>
            </div>
            <div className="rounded-2xl border border-white/10 px-5 py-3">
              <div className="text-xs text-white/40">Portefeuilles</div>
              <div className="text-2xl font-bold">{rows.length}</div>
            </div>
          </div>

          <div className="mt-7 flex items-center gap-3 rounded-2xl border border-white/10 px-4 py-3">
            <Search size={17} className="text-white/40" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Rechercher dans mes portefeuilles…" className="w-full bg-transparent outline-none placeholder:text-white/30" />
          </div>

          {error ? (
            <div role="alert" className="mt-5 rounded-2xl border border-red-400/30 bg-red-400/10 p-4 text-red-200">{error}</div>
          ) : busy ? (
            <p role="status" className="mt-5 text-white/60">Chargement des portefeuilles…</p>
          ) : (
            <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filtered.map((row) => (
                <article key={row.id} className="rounded-2xl border border-white/10 bg-white/[.04] p-5">
                  <div className="flex justify-between gap-3">
                    <h2 className="truncate font-bold">{String(row.wallets ?? 'Portefeuille')}</h2>
                    <span className="rounded-full bg-[#F28C28]/10 px-2.5 py-1 text-xs text-[#F28C28]">{String(row.available_balance ?? '—')}</span>
                  </div>
                  <p className="mt-2 text-sm text-white/55">{String(row.balance ?? '')}</p>
                  <p className="mt-4 line-clamp-3 text-sm text-white/60">{String(row.description ?? '')}</p>
                  <div className="mt-4 border-t border-white/10 pt-3 text-[11px] text-white/30">
                    {row.created_at ? new Date(row.created_at).toLocaleString('fr-FR') : row.id}
                  </div>
                </article>
              ))}
              {filtered.length === 0 && (
                <div className="col-span-full rounded-2xl border border-dashed border-white/15 p-10 text-center text-white/45">
                  Aucun portefeuille trouvé.
                </div>
              )}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
