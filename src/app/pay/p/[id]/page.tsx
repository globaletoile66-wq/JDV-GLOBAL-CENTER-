'use client';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';
import { usePayWallets } from '@/hooks/usePayWallets';
import WalletPicker from '@/components/pay/WalletPicker';
import { STATUS_LABEL, money, payError, type PayRequest, type Quote } from '@/lib/pay/types';

/** Page ouverte par le lien ou le QR code d'une demande de paiement. */
export default function PayRequestPage() {
  const id = String(useParams()?.id ?? '');
  const { user, loading } = useAuth();
  const router = useRouter();
  const sb = useMemo(() => createClient(), []);
  const { wallets, refresh } = usePayWallets();
  const [req, setReq] = useState<PayRequest | null | undefined>(undefined);
  const [walletId, setWalletId] = useState('');
  const [amount, setAmount] = useState('');
  const [quote, setQuote] = useState<Quote | null>(null);
  const [busy, setBusy] = useState(false);
  const [paid, setPaid] = useState<{ amount: number; fee: number; total: number; currency: string; reference: string } | null>(null);

  useEffect(() => { if (!loading && !user) router.push(`/auth/login?redirect=${encodeURIComponent(`/pay/p/${id}`)}`); }, [loading, user, router, id]);
  useEffect(() => { if (user) sb.rpc('pay_get_payment_request', { p_request_id: id }).then(({ data, error }) => setReq(error ? null : (data as PayRequest))); }, [user, id, sb]);

  const wallet = wallets?.find((w) => w.id === walletId);
  // portefeuille par défaut : celui de la devise demandée (sinon XOF, sinon le premier actif)
  useEffect(() => {
    if (!wallets || !req || walletId) return;
    const ok = wallets.filter((w) => w.wallet_status === 'active' && (!req.currency || w.currencies.code === req.currency));
    setWalletId((ok.find((w) => w.balance > 0) ?? ok[0])?.id ?? '');
  }, [wallets, req, walletId]);

  const amt = req?.amount ?? (amount ? Number(amount.replace(',', '.')) : 0);
  useEffect(() => {
    setQuote(null);
    if (!walletId || !(amt > 0)) return;
    const t = setTimeout(() => { sb.rpc('pay_quote_transfer', { p_wallet_id: walletId, p_amount: amt }).then(({ data, error }) => setQuote(error ? null : (data as Quote))); }, 300);
    return () => clearTimeout(t);
  }, [walletId, amt, sb]);

  async function pay() {
    if (!req || !wallet) return;
    setBusy(true);
    const { data, error } = await sb.rpc('pay_settle_payment_request', { p_request_id: req.id, p_wallet_id: wallet.id, p_amount: req.open_amount ? amt : null });
    setBusy(false);
    if (error) { toast.error(payError(error.message)); return; }
    setPaid(data as { amount: number; fee: number; total: number; currency: string; reference: string }); refresh();
  }

  if (loading || req === undefined) return <main className="mx-auto max-w-md px-4 py-10 text-sm text-muted-foreground">Chargement…</main>;
  if (req === null) return <main className="mx-auto max-w-md px-4 py-10"><div className="jdv-card p-6 text-center"><p className="font-semibold text-foreground">Demande de paiement introuvable.</p><Link href="/pay" className="mt-3 inline-block text-sm text-accent underline">Retour à JDV PAY</Link></div></main>;

  if (paid) return (
    <main className="mx-auto max-w-md px-4 py-10"><div className="jdv-card p-6 text-center">
      <p className="text-4xl" aria-hidden>✅</p>
      <p className="mt-2 text-lg font-bold text-foreground">Paiement effectué</p>
      <p className="mt-1 text-sm text-muted-foreground">{money(Number(paid.amount), paid.currency)} à {req.requester_name} · frais {money(Number(paid.fee), paid.currency)} · réf. {paid.reference}</p>
      <Link href="/pay/history" className="btn-primary mt-5 inline-block px-4 py-2">Voir l’historique</Link>
    </div></main>
  );

  const payable = req.status === 'pending' && !req.is_owner;
  return (
    <main className="mx-auto max-w-md px-4 py-10">
      <div className="jdv-card space-y-4 p-6">
        <div className="text-center">
          <p className="text-sm text-muted-foreground">Demande de paiement de</p>
          <p className="text-lg font-bold text-foreground">{req.requester_name}</p>
          {req.description && <p className="text-sm text-muted-foreground">{req.description}</p>}
          <p className="mt-3 text-3xl font-extrabold text-foreground">{req.amount ? money(Number(req.amount), req.currency ?? 'XOF') : 'Montant libre'}</p>
          <p className="text-xs text-muted-foreground">{req.reference}</p>
        </div>

        {req.is_owner && <p className="rounded-lg bg-muted p-3 text-sm text-foreground">C’est votre propre demande. Partagez ce lien ou le QR code avec la personne qui doit vous payer. <Link href="/pay/receive" className="font-medium text-accent underline">Mes demandes</Link></p>}
        {!req.is_owner && req.status !== 'pending' && <p role="alert" className="rounded-lg bg-muted p-3 text-sm text-foreground">{req.status === 'paid' ? 'Cette demande a déjà été payée.' : req.status === 'expired' ? 'Cette demande a expiré.' : `Cette demande n’est plus disponible (${(STATUS_LABEL[req.status] ?? req.status).toLowerCase()}).`}</p>}

        {payable && (
          <>
            {wallets && <WalletPicker wallets={wallets} value={walletId} onChange={setWalletId} onlyCode={req.currency} label="Payer avec" />}
            {req.open_amount && (
              <label className="block text-sm"><span className="text-foreground">Montant à payer</span>
                <input inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^\d.,]/g, ''))} className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-lg text-foreground" /></label>
            )}
            {quote && (
              <dl className="space-y-1 rounded-lg bg-muted p-3 text-sm" aria-live="polite">
                <div className="flex justify-between"><dt>Montant</dt><dd>{money(quote.amount, quote.currency)}</dd></div>
                <div className="flex justify-between"><dt>Frais</dt><dd>{money(quote.fee, quote.currency)}</dd></div>
                <div className="flex justify-between border-t border-border pt-1 font-bold"><dt>Total débité</dt><dd>{money(quote.total, quote.currency)}</dd></div>
                {!quote.sufficient && <p className="pt-1 text-xs text-danger">Solde insuffisant (disponible : {money(quote.available, quote.currency)}).</p>}
                {!quote.within_limits && <p className="pt-1 text-xs text-danger">{payError(quote.limit_message)}</p>}
              </dl>
            )}
            <button type="button" onClick={pay} disabled={busy || !quote || !quote.sufficient || !quote.within_limits} className="btn-primary w-full px-4 py-2.5 disabled:opacity-50">{busy ? 'Paiement…' : `Payer ${quote ? money(quote.total, quote.currency) : ''}`}</button>
            <p className="text-center text-xs text-muted-foreground">Vérifiez le nom du destinataire avant de payer. Un paiement confirmé ne peut pas être annulé.</p>
          </>
        )}
      </div>
    </main>
  );
}
