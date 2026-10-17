'use client';
import { money, type PayWallet } from '@/lib/pay/types';

/** Choix du portefeuille (devise). `onlyCode` restreint à une devise imposée. */
export default function WalletPicker({ wallets, value, onChange, onlyCode, label = 'Portefeuille' }: { wallets: PayWallet[]; value: string; onChange: (id: string) => void; onlyCode?: string | null; label?: string }) {
  const list = wallets.filter((w) => w.wallet_status === 'active' && (!onlyCode || w.currencies.code === onlyCode));
  return (
    <label className="block text-sm">
      <span className="text-foreground">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-foreground">
        {list.map((w) => <option key={w.id} value={w.id}>{w.currencies.code} · solde {money(w.available_balance, w.currencies.code)}</option>)}
      </select>
    </label>
  );
}
