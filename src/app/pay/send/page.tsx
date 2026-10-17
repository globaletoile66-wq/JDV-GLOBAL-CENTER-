'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';
import { usePayWallets } from '@/hooks/usePayWallets';
import PayHeader from '@/components/pay/PayHeader';
import WalletPicker from '@/components/pay/WalletPicker';
import { money, newKey, payError, shortRef, type Quote } from '@/lib/pay/types';

type Ben = { id: string; name: string; email: string | null; phone: string | null };

export default function SendPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const sb = useMemo(() => createClient(), []);
  const { wallets, refresh } = usePayWallets();
  const [bens, setBens] = useState<Ben[]>([]);
  const [walletId, setWalletId] = useState('');
  const [benId, setBenId] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [member, setMember] = useState<boolean | null>(null);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [step, setStep] = useState<'form' | 'confirm' | 'done'>('form');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<{ ref: string; amount: number; fee: number; code: string; to: string } | null>(null);
  const attemptKey = useRef(newKey());

  useEffect(() => { if (!loading && !user) router.push('/auth/login?redirect=/pay/send'); }, [loading, user, router]);
  useEffect(() => { sb.from('pay_beneficiaries').select('id,name,email,phone').eq('is_active', true).order('name').then(({ data }) => setBens((data ?? []) as Ben[])); }, [sb]);
  useEffect(() => { if (wallets && !walletId) setWalletId((wallets.find((w) => w.currencies.code === 'XOF' && w.wallet_status === 'active') ?? wallets.find((w) => w.wallet_status === 'active'))?.id ?? ''); }, [wallets, walletId]);

  // Le bénéficiaire est-il un utilisateur JDV ?
  useEffect(() => {
    setMember(null); if (!benId) return;
    sb.rpc('pay_beneficiary_is_member', { p_beneficiary_id: benId }).then(({ data, error }) => setMember(error ? null : !!data));
  }, [benId, sb]);

  // Devis en direct (frais, total, solde, plafonds)
  const n = Number(amount.replace(',', '.'));
  useEffect(() => {
    setQuote(null);
    if (!walletId || !(n > 0)) return;
    const t = setTimeout(() => { sb.rpc('pay_quote_transfer', { p_wallet_id: walletId, p_amount: n }).then(({ data, error }) => setQuote(error ? null : (data as Quote))); }, 350);
    return () => clearTimeout(t);
  }, [walletId, n, sb]);

  const wallet = wallets?.find((w) => w.id === walletId);
  const ben = bens.find((b) => b.id === benId);
  const canContinue = !!wallet && !!ben && member === true && n > 0 && !!quote && quote.sufficient && quote.within_limits;

  async function submit() {
    if (!user || !wallet || !ben) return;
    setBusy(true);
    const { data, error } = await sb.from('transfers').insert({
      sender_user_id: user.id, sender_wallet_id: wallet.id, beneficiary_id: ben.id, transfer_type: 'national', send_amount: n,
      send_currency_id: wallet.currency_id, reference: shortRef('TRF'), idempotency_key: attemptKey.current, description: note || null,
    }).select('reference,transfer_status,fee_amount').single();
    setBusy(false);
    if (error) { toast.error(payError(error.message)); setStep('form'); return; }
    if (data.transfer_status !== 'completed') { toast.error('Le transfert n’a pas pu être exécuté immédiatement.'); setStep('form'); return; }
    setDone({ ref: data.reference, amount: n, fee: Number(data.fee_amount), code: wallet.currencies.code, to: ben.name });
    attemptKey.current = newKey(); setStep('done'); refresh();
  }

  if (step === 'done' && done) return (
    <main className="mx-auto max-w-xl px-4 py-6">
      <PayHeader title="Envoi effectué" active="/pay/send" />
      <div className="jdv-card p-6 text-center">
        <p className="text-4xl" aria-hidden>✅</p>
        <p className="mt-2 text-lg font-bold text-foreground">{money(done.amount, done.code)} envoyés à {done.to}</p>
        <p className="mt-1 text-sm text-muted-foreground">Frais : {money(done.fee, done.code)} · Référence {done.ref}</p>
        <div className="mt-5 flex justify-center gap-2"><Link href="/pay/history" className="btn-primary px-4 py-2">Voir l’historique</Link><button type="button" onClick={() => { setStep('form'); setAmount(''); setNote(''); setDone(null); }} className="btn-ghost px-4 py-2">Nouvel envoi</button></div>
      </div>
    </main>
  );

  return (
    <main className="mx-auto max-w-xl px-4 py-6">
      <PayHeader title="Envoyer de l’argent" active="/pay/send" />
      <div className="jdv-card space-y-4 p-5">
        {!wallets ? <p className="text-sm text-muted-foreground">Chargement…</p> : <WalletPicker wallets={wallets} value={walletId} onChange={setWalletId} label="Depuis le portefeuille" />}

        <label className="block text-sm"><span className="text-foreground">Destinataire</span>
          <select value={benId} onChange={(e) => setBenId(e.target.value)} className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-foreground">
            <option value="">Choisir un bénéficiaire…</option>
            {bens.map((b) => <option key={b.id} value={b.id}>{b.name}{b.email ? ` · ${b.email}` : b.phone ? ` · ${b.phone}` : ''}</option>)}
          </select>
        </label>
        {bens.length === 0 && <p className="text-xs text-muted-foreground">Aucun bénéficiaire. <Link href="/pay/beneficiaries" className="font-medium text-accent underline">Ajoutez-en un</Link> avec l’email ou le téléphone confirmé de la personne.</p>}
        {ben && member === false && <p role="alert" className="rounded-lg bg-warning/10 p-3 text-xs text-warning">Ce bénéficiaire n’a pas de compte JDV avec un email ou un téléphone confirmé. Les envois vers un destinataire sans compte JDV ne sont pas encore disponibles : invitez-le à s’inscrire, ou vérifiez ses coordonnées.</p>}

        <label className="block text-sm"><span className="text-foreground">Montant{wallet ? ` (${wallet.currencies.code})` : ''}</span>
          <input inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^\d.,]/g, ''))} placeholder="0" className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-lg text-foreground" />
        </label>
        <label className="block text-sm"><span className="text-foreground">Message (facultatif)</span>
          <input value={note} maxLength={140} onChange={(e) => setNote(e.target.value)} className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-foreground" />
        </label>

        {quote && (
          <dl className="space-y-1 rounded-lg bg-muted p-3 text-sm" aria-live="polite">
            <div className="flex justify-between"><dt>Montant</dt><dd>{money(quote.amount, quote.currency)}</dd></div>
            <div className="flex justify-between"><dt>Frais</dt><dd>{money(quote.fee, quote.currency)}</dd></div>
            <div className="flex justify-between border-t border-border pt-1 font-bold"><dt>Total débité</dt><dd>{money(quote.total, quote.currency)}</dd></div>
            {!quote.sufficient && <p className="pt-1 text-xs text-danger">Solde insuffisant (disponible : {money(quote.available, quote.currency)}).</p>}
            {!quote.within_limits && <p className="pt-1 text-xs text-danger">{payError(quote.limit_message)}</p>}
          </dl>
        )}

        {step === 'form' ? (
          <button type="button" disabled={!canContinue} onClick={() => setStep('confirm')} className="btn-primary w-full px-4 py-2.5 disabled:opacity-50">Continuer</button>
        ) : (
          <div className="rounded-lg border border-accent/40 p-3 text-sm">
            <p className="font-semibold text-foreground">Confirmer l’envoi de {quote && money(quote.amount, quote.currency)} à {ben?.name} ?</p>
            <p className="text-xs text-muted-foreground">Total débité : {quote && money(quote.total, quote.currency)}. Un envoi confirmé ne peut pas être annulé.</p>
            <div className="mt-3 flex gap-2"><button type="button" onClick={submit} disabled={busy} className="btn-primary flex-1 px-4 py-2 disabled:opacity-60">{busy ? 'Envoi…' : 'Confirmer et envoyer'}</button><button type="button" onClick={() => setStep('form')} disabled={busy} className="btn-ghost px-4 py-2">Modifier</button></div>
          </div>
        )}
      </div>
    </main>
  );
}
