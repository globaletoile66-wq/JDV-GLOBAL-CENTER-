'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { branchName } from '@/lib/billing/branches';
import { money, type Invoice } from '@/lib/billing/format';

const d = (x: string | null) => (x ? new Date(x).toLocaleDateString('fr-FR', { dateStyle: 'long' }) : '');

export default function InvoicePage() {
  const id = String(useParams()?.id ?? '');
  const [inv, setInv] = useState<Invoice | null | undefined>(undefined);
  useEffect(() => { createClient().from('billing_invoices').select('*').eq('id', id).maybeSingle().then(({ data }) => setInv((data as Invoice | null) ?? null)); }, [id]);

  if (inv === undefined) return <main className="p-10">Chargement…</main>;
  if (inv === null) return <main className="p-10">Facture introuvable. <Link href="/abonnements/factures" className="underline">Retour</Link></main>;
  const s = inv.seller;

  return (
    <main className="min-h-screen bg-[var(--jdv-primary-soft)] px-4 py-8 print:bg-white print:p-0">
      <style>{`@media print { .no-print { display: none !important; } @page { margin: 14mm; } }`}</style>
      <div className="no-print mx-auto mb-4 flex max-w-3xl items-center justify-between">
        <Link href="/abonnements/factures" className="text-sm underline">← Mes factures</Link>
        <button type="button" onClick={() => window.print()} className="rounded-lg px-4 py-2 text-sm font-medium" style={{ background: 'var(--jdv-primary)', color: 'var(--jdv-on-primary)' }}>Imprimer / enregistrer en PDF</button>
      </div>

      <article className="mx-auto max-w-3xl rounded-2xl border border-[var(--jdv-border)] bg-white p-8 print:rounded-none print:border-0 print:p-0" aria-label={`Facture ${inv.invoice_number}`}>
        <header className="flex flex-wrap items-start justify-between gap-6">
          <div>
            <p className="text-2xl font-bold" style={{ color: 'var(--jdv-primary-text)' }}>{s?.trade_name || s?.legal_name || 'JDV GLOBAL CENTER'}</p>
            {s ? (
              <address className="mt-1 text-sm not-italic text-[var(--jdv-muted)]">
                {s.legal_name && s.trade_name ? <>{s.legal_name}<br /></> : null}
                {[s.address, s.city, s.country].filter(Boolean).join(', ')}{s.address || s.city || s.country ? <br /> : null}
                {s.tax_id ? <>N° d’identification : {s.tax_id}<br /></> : null}
                {[s.email, s.phone].filter(Boolean).join(' · ')}
              </address>
            ) : <p className="no-print mt-2 rounded bg-amber-50 p-2 text-xs text-amber-900">Informations du vendeur non renseignées : elles apparaîtront après leur saisie par l’administrateur.</p>}
          </div>
          <div className="text-right">
            <p className="text-xl font-bold">FACTURE</p>
            <p className="text-sm">N° {inv.invoice_number}</p>
            <p className="text-sm text-[var(--jdv-muted)]">Émise le {d(inv.issued_at)}</p>
            <p className="mt-1 inline-block rounded-full bg-green-100 px-3 py-0.5 text-xs font-medium text-green-800">Payée</p>
          </div>
        </header>

        <section className="mt-8 text-sm">
          <h2 className="font-semibold">Facturé à</h2>
          <p>{inv.buyer?.name}</p>
          {inv.buyer?.address && <p className="text-[var(--jdv-muted)]">{inv.buyer.address}</p>}
          {inv.buyer?.email && <p className="text-[var(--jdv-muted)]">{inv.buyer.email}</p>}
        </section>

        <table className="mt-8 w-full text-left text-sm">
          <thead><tr className="border-b border-[var(--jdv-border)]"><th className="py-2">Description</th><th className="py-2 text-right">Qté</th><th className="py-2 text-right">Prix unitaire</th><th className="py-2 text-right">Montant</th></tr></thead>
          <tbody>
            {inv.lines.map((l, k) => (
              <tr key={k} className="border-b border-[var(--jdv-border)]">
                <td className="py-3">{l.description}{inv.period_start && inv.period_end ? <span className="block text-xs text-[var(--jdv-muted)]">Période : du {d(inv.period_start)} au {d(inv.period_end)}</span> : null}</td>
                <td className="py-3 text-right">{l.quantity}</td>
                <td className="py-3 text-right">{money(Number(l.unit_price), inv.currency)}</td>
                <td className="py-3 text-right">{money(Number(l.amount), inv.currency)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <dl className="ml-auto mt-4 w-full max-w-xs space-y-1 text-sm">
          <div className="flex justify-between"><dt>Sous-total</dt><dd>{money(Number(inv.subtotal), inv.currency)}</dd></div>
          {Number(inv.tax_rate) > 0 && <div className="flex justify-between"><dt>{s?.tax_label || `Taxe ${Number(inv.tax_rate)} %`}</dt><dd>{money(Number(inv.tax_amount), inv.currency)}</dd></div>}
          <div className="flex justify-between border-t border-[var(--jdv-border)] pt-2 text-base font-bold"><dt>Total</dt><dd>{money(Number(inv.total), inv.currency)}</dd></div>
        </dl>
        {inv.amount_xof ? <p className="mt-3 text-right text-xs text-[var(--jdv-muted)]">Montant débité : {money(Number(inv.amount_xof), 'XOF')}</p> : null}
        <p className="mt-8 text-xs text-[var(--jdv-muted)]">Abonnement {branchName(inv.module_code)} · {inv.plan_name}</p>
        {s?.footer && <p className="mt-2 text-xs text-[var(--jdv-muted)]">{s.footer}</p>}
      </article>
    </main>
  );
}
