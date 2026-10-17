'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Copy, Share2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';
import { usePayWallets } from '@/hooks/usePayWallets';
import PayHeader from '@/components/pay/PayHeader';
import WalletPicker from '@/components/pay/WalletPicker';
import QrBox from '@/components/pay/QrBox';
import { STATUS_LABEL, money, payError } from '@/lib/pay/types';

type Req = { id: string; reference: string; amount: number | null; description: string | null; request_status: string; expires_at: string | null; created_at: string; currencies: { code: string } | null };
const DURATIONS: [string, number][] = [['24 heures', 1], ['7 jours', 7], ['30 jours', 30]];

export default function ReceivePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const sb = useMemo(() => createClient(), []);
  const { wallets, refresh: refreshWallets } = usePayWallets();
  const [walletId, setWalletId] = useState('');
  const [amount, setAmount] = useState('');
  const [desc, setDesc] = useState('');
  const [days, setDays] = useState(1);
  const [busy, setBusy] = useState(false);
  const [list, setList] = useState<Req[]>([]);
  const [shown, setShown] = useState<Req | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => { if (!loading && !user) router.push('/auth/login?redirect=/pay/receive'); }, [loading, user, router]);
  useEffect(() => { if (wallets && !walletId) setWalletId((wallets.find((w) => w.currencies.code === 'XOF' && w.wallet_status === 'active') ?? wallets.find((w) => w.wallet_status === 'active'))?.id ?? ''); }, [wallets, walletId]);

  const load = useCallback(async () => {
    const { data } = await sb.from('payment_requests').select('id,reference,amount,description,request_status,expires_at,created_at,currencies:currency_id(code)').order('created_at', { ascending: false }).limit(12);
    setList((data ?? []) as unknown as Req[]);
  }, [sb]);
  useEffect(() => { if (user) load(); }, [user, load]);

  // Suivi en direct de la demande affichée : passe à « Payée » dès le paiement
  useEffect(() => {
    if (!shown || shown.request_status !== 'pending') return;
    const t = setInterval(async () => {
      const { data } = await sb.from('payment_requests').select('request_status').eq('id', shown.id).maybeSingle();
      if (data && data.request_status !== 'pending') { setShown({ ...shown, request_status: data.request_status }); load(); refreshWallets(); if (data.request_status === 'paid') toast.success('Paiement reçu !'); }
    }, 6000);
    return () => clearInterval(t);
  }, [shown, sb, load, refreshWallets]);

  const wallet = wallets?.find((w) => w.id === walletId);
  const n = amount ? Number(amount.replace(',', '.')) : null;
  const link = shown && typeof window !== 'undefined' ? `${window.location.origin}/pay/p/${shown.id}` : '';

  async function create() {
    if (!user || !wallet) return;
    if (amount && !(n && n > 0)) { toast.error('Montant invalide.'); return; }
    setBusy(true);
    const { data, error } = await sb.from('payment_requests').insert({
      requester_user_id: user.id, requester_wallet_id: wallet.id, amount: n, currency_id: wallet.currency_id,
      description: desc || null, expires_at: new Date(Date.now() + days * 86400000).toISOString(),
    }).select('id,reference,amount,description,request_status,expires_at,created_at').single();
    setBusy(false);
    if (error || !data) { toast.error(payError(error?.message)); return; }
    setShown({ ...(data as Req), currencies: { code: wallet.currencies.code } }); setAmount(''); setDesc(''); load();
  }
  async function cancel(id: string) {
    const { error } = await sb.from('payment_requests').update({ request_status: 'cancelled' }).eq('id', id);
    if (error) toast.error('Annulation impossible.'); else { toast.success('Demande annulée.'); if (shown?.id === id) setShown(null); load(); }
  }
  async function copy() { await navigator.clipboard.writeText(link); setCopied(true); setTimeout(() => setCopied(false), 2000); }
  async function share() { if (navigator.share) { try { await navigator.share({ title: 'Demande de paiement JDV PAY', text: shown?.description ?? 'Payez-moi avec JDV PAY', url: link }); } catch { /* annulé */ } } else copy(); }
  const eff = (r: Req) => (r.request_status === 'pending' && r.expires_at && new Date(r.expires_at) <= new Date() ? 'expired' : r.request_status);

  return (
    <main className="mx-auto max-w-3xl px-4 py-6">
      <PayHeader title="Recevoir un paiement" active="/pay/receive" />

      {shown ? (
        <section aria-labelledby="share-title" className="jdv-card p-6 text-center">
          <h2 id="share-title" className="font-bold text-foreground">{shown.request_status === 'paid' ? 'Demande payée ✅' : shown.request_status === 'pending' ? 'Partagez ce lien ou ce QR code' : `Demande ${STATUS_LABEL[shown.request_status]?.toLowerCase() ?? shown.request_status}`}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{shown.amount ? money(Number(shown.amount), shown.currencies?.code ?? 'XOF') : 'Montant libre'}{shown.description ? ` · ${shown.description}` : ''} · {shown.reference}</p>
          {shown.request_status === 'pending' && (
            <>
              <div className="mt-4"><QrBox value={link} /></div>
              <p className="mx-auto mt-3 max-w-md break-all text-xs text-muted-foreground">{link}</p>
              <div className="mt-3 flex justify-center gap-2">
                <button type="button" onClick={copy} className="btn-ghost flex items-center gap-2 px-4 py-2">{copied ? <Check size={14} /> : <Copy size={14} />}{copied ? 'Copié' : 'Copier le lien'}</button>
                <button type="button" onClick={share} className="btn-primary flex items-center gap-2 px-4 py-2"><Share2 size={14} />Partager</button>
              </div>
              <p className="mt-3 text-xs text-muted-foreground" aria-live="polite">En attente du paiement… cette page se met à jour toute seule.</p>
            </>
          )}
          <button type="button" onClick={() => setShown(null)} className="mt-4 text-sm text-accent underline">Créer une autre demande</button>
        </section>
      ) : (
        <section aria-labelledby="new-title" className="jdv-card space-y-4 p-5">
          <h2 id="new-title" className="font-bold text-foreground">Nouvelle demande</h2>
          {wallets && <WalletPicker wallets={wallets} value={walletId} onChange={setWalletId} label="Recevoir dans le portefeuille" />}
          <label className="block text-sm"><span className="text-foreground">Montant{wallet ? ` (${wallet.currencies.code})` : ''} <span className="text-muted-foreground">: laissez vide pour un montant libre</span></span>
            <input inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^\d.,]/g, ''))} className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-lg text-foreground" />
          </label>
          <label className="block text-sm"><span className="text-foreground">Description (facultatif)</span>
            <input value={desc} maxLength={140} onChange={(e) => setDesc(e.target.value)} placeholder="Ex. Commande n° 12" className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-foreground" />
          </label>
          <label className="block text-sm"><span className="text-foreground">Valable</span>
            <select value={days} onChange={(e) => setDays(Number(e.target.value))} className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-foreground">{DURATIONS.map(([l, d]) => <option key={d} value={d}>{l}</option>)}</select>
          </label>
          <p className="text-xs text-muted-foreground">Les frais de transfert sont payés par la personne qui vous règle.</p>
          <button type="button" onClick={create} disabled={busy || !wallet} className="btn-primary w-full px-4 py-2.5 disabled:opacity-60">{busy ? 'Création…' : 'Créer le lien et le QR code'}</button>
        </section>
      )}

      <section aria-labelledby="my-title" className="jdv-card mt-6 p-5">
        <h2 id="my-title" className="font-bold text-foreground">Mes demandes</h2>
        {list.length === 0 ? <p className="mt-3 text-sm text-muted-foreground">Aucune demande pour le moment.</p> : (
          <ul className="mt-3 divide-y divide-border">
            {list.map((r) => { const s = eff(r); return (
              <li key={r.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                <div className="min-w-0"><p className="truncate font-medium text-foreground">{r.amount ? money(Number(r.amount), r.currencies?.code ?? 'XOF') : 'Montant libre'}{r.description ? ` · ${r.description}` : ''}</p>
                  <p className="text-xs text-muted-foreground">{r.reference} · {new Date(r.created_at).toLocaleDateString('fr-FR')}</p></div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className={`rounded-full px-2.5 py-0.5 text-xs ${s === 'paid' ? 'bg-success/15 text-success' : 'bg-muted text-muted-foreground'}`}>{STATUS_LABEL[s] ?? s}</span>
                  {s === 'pending' && <><button type="button" onClick={() => setShown(r)} className="text-xs font-medium text-accent hover:underline">QR</button><button type="button" onClick={() => cancel(r.id)} className="text-xs text-danger hover:underline">Annuler</button></>}
                </div>
              </li>); })}
          </ul>
        )}
      </section>
    </main>
  );
}
