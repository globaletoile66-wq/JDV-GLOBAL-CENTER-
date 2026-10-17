'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

type S = { legal_name: string; trade_name: string; address: string; city: string; country: string; tax_id: string; email: string; phone: string; tax_rate: number; tax_label: string; footer: string };
const EMPTY: S = { legal_name: '', trade_name: '', address: '', city: '', country: '', tax_id: '', email: '', phone: '', tax_rate: 0, tax_label: '', footer: '' };

/** Identité du vendeur et taxe appliquées aux factures. Réservé aux super admins (la base refuse tout autre accès). */
export default function FacturationSettings() {
  const sb = createClient();
  const [s, setS] = useState<S>(EMPTY);
  const [ready, setReady] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    sb.from('billing_settings').select('*').eq('id', 1).maybeSingle().then(({ data }) => {
      if (data) setS({ ...EMPTY, ...Object.fromEntries(Object.entries(data).map(([k, v]) => [k, v ?? ''])) } as S);
      setReady(true);
    });
  }, [sb]);

  const set = (k: keyof S) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setS({ ...s, [k]: k === 'tax_rate' ? Number(e.target.value) : e.target.value });

  async function save(e: React.FormEvent) {
    e.preventDefault(); setMsg(null);
    const payload = Object.fromEntries(Object.entries(s).map(([k, v]) => [k, v === '' ? null : v]));
    const { error } = await sb.from('billing_settings').update({ ...payload, updated_at: new Date().toISOString() }).eq('id', 1);
    setMsg(error ? { ok: false, text: 'Enregistrement impossible (réservé aux super administrateurs).' } : { ok: true, text: 'Paramètres enregistrés. Ils s’appliquent aux prochaines factures.' });
  }
  async function backfill() {
    const { data, error } = await sb.rpc('billing_backfill_invoice_seller');
    setMsg(error ? { ok: false, text: error.message.includes('SELLER_NOT_CONFIGURED') ? 'Renseignez d’abord le nom légal.' : 'Opération impossible.' } : { ok: true, text: `${data} facture(s) déjà émise(s) complétée(s) avec ces informations.` });
  }
  if (!ready) return <main className="p-10">Chargement…</main>;
  const input = 'mt-1 w-full rounded-lg border border-[var(--jdv-border)] px-3 py-2';
  return (
    <main className="jdv-home min-h-screen px-5 py-10">
      <form onSubmit={save} className="mx-auto max-w-2xl space-y-4 rounded-2xl border border-[var(--jdv-border)] bg-white p-6">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--jdv-primary-text)' }}>Paramètres de facturation</h1>
        <p className="text-sm text-[var(--jdv-muted)]">Ces informations figurent sur chaque facture. Une facture émise ne peut plus être modifiée : vérifiez-les avant le premier paiement. Vérifiez auprès d’un comptable les mentions obligatoires et le régime de taxe applicables dans votre pays.</p>
        <label className="block text-sm">Nom légal de l’entreprise<input value={s.legal_name} onChange={set('legal_name')} className={input} required /></label>
        <label className="block text-sm">Nom commercial<input value={s.trade_name} onChange={set('trade_name')} className={input} /></label>
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="block text-sm sm:col-span-3">Adresse<input value={s.address} onChange={set('address')} className={input} /></label>
          <label className="block text-sm">Ville<input value={s.city} onChange={set('city')} className={input} /></label>
          <label className="block text-sm">Pays<input value={s.country} onChange={set('country')} className={input} /></label>
          <label className="block text-sm">N° d’identification fiscale<input value={s.tax_id} onChange={set('tax_id')} className={input} /></label>
          <label className="block text-sm">Email<input type="email" value={s.email} onChange={set('email')} className={input} /></label>
          <label className="block text-sm">Téléphone<input value={s.phone} onChange={set('phone')} className={input} /></label>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-sm">Taux de taxe inclus dans les prix (%)<input type="number" step="0.01" min={0} max={99.99} value={s.tax_rate} onChange={set('tax_rate')} className={input} /></label>
          <label className="block text-sm">Libellé de la taxe<input value={s.tax_label} onChange={set('tax_label')} className={input} placeholder="ex. TVA 18 %" /></label>
        </div>
        <label className="block text-sm">Mention de bas de facture<textarea value={s.footer} onChange={set('footer')} rows={3} className={input} /></label>
        <div className="flex flex-wrap gap-2">
          <button className="rounded-lg px-4 py-2 font-medium" style={{ background: 'var(--jdv-primary)', color: 'var(--jdv-on-primary)' }}>Enregistrer</button>
          <button type="button" onClick={backfill} className="rounded-lg border border-[var(--jdv-border)] px-4 py-2">Compléter les factures déjà émises</button>
        </div>
        {msg && <p role="status" className={`text-sm ${msg.ok ? 'text-green-700' : 'text-red-700'}`}>{msg.text}</p>}
      </form>
    </main>
  );
}
