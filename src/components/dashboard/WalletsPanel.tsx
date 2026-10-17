'use client';
import { useState } from 'react';
import Link from 'next/link';
import { money, type Wallet } from '@/lib/dashboard/types';

export default function WalletsPanel({ wallets, primary }: { wallets: Wallet[]; primary: string | null }) {
  const [all, setAll] = useState(false);
  const funded = wallets.filter((w) => w.balance > 0);
  const main = wallets.find((w) => w.currency === primary) ?? wallets[0];
  const shown = all ? wallets : [main, ...funded.filter((w) => w.id !== main?.id)].filter(Boolean) as Wallet[];

  return (
    <section aria-labelledby="wallets-title" className="jdv-card p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 id="wallets-title" className="font-bold text-foreground">Mes portefeuilles</h2>
        <Link href="/pay" className="text-xs font-medium text-accent hover:underline">Ouvrir JDV PAY</Link>
      </div>
      {wallets.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">Vos portefeuilles seront créés automatiquement.</p>
      ) : (
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {shown.map((w) => (
            <li key={w.id} className="rounded-xl border border-border p-4">
              <p className="text-xs text-muted-foreground">{w.currency}{w.status !== 'active' ? ` · ${w.status}` : ''}</p>
              <p className="mt-1 text-xl font-extrabold text-foreground">{money(w.balance, w.currency)}</p>
              {w.available !== w.balance && <p className="text-xs text-muted-foreground">Disponible : {money(w.available, w.currency)}</p>}
            </li>
          ))}
        </ul>
      )}
      {wallets.length > shown.length && (
        <button type="button" onClick={() => setAll(true)} className="mt-3 text-xs font-medium text-accent hover:underline">Voir les {wallets.length} devises</button>
      )}
      {all && wallets.length > 2 && <button type="button" onClick={() => setAll(false)} className="mt-3 ml-3 text-xs text-muted-foreground hover:underline">Réduire</button>}
    </section>
  );
}
