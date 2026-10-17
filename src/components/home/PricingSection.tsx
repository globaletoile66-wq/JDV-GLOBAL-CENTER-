'use client';
import { useEffect, useState } from 'react';
import { getSupabase } from '../../lib/jdv/supabase';
import { branchName } from '../../lib/jdv/branches';
import { money, periodPer, savingPercent, type Plan } from '../../lib/jdv/pricingFormat';

/** Tarifs par branche : lus en direct dans la base. Une branche apparaît dès que ses formules sont publiées (active = true). */
export default function PricingSection({ signupHref = '/abonnements' }: { signupHref?: string }) {
  const [plans, setPlans] = useState<Plan[] | null>(null);
  useEffect(() => { getSupabase().rpc('public_branch_plans').then(({ data }) => setPlans((data ?? []) as Plan[])); }, []);

  const groups = (plans ?? []).reduce<Record<string, Plan[]>>((acc, p) => { (acc[p.module_code] ||= []).push(p); return acc; }, {});
  const codes = Object.keys(groups);

  return (
    <section id="tarifs" aria-labelledby="tarifs-title" className="mx-auto max-w-6xl px-5 py-16">
      <h2 id="tarifs-title" className="text-center text-3xl font-bold" style={{ color: 'var(--jdv-primary-text)' }}>Tarifs</h2>
      <p className="mx-auto mt-3 max-w-2xl text-center text-[var(--jdv-muted)]">Chaque branche a ses propres formules : vous ne payez que ce dont vous avez besoin.</p>

      {plans !== null && codes.length === 0 && (
        <p className="mt-10 text-center text-[var(--jdv-muted)]">Les tarifs de chaque branche seront publiés ici dès l’ouverture de la branche.</p>
      )}

      {codes.map((code) => {
        const list = groups[code];
        return (
          <div key={code} className="mt-12">
            <h3 className="text-xl font-semibold">{branchName(code)}</h3>
            <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {list.map((p) => {
                const save = savingPercent(p, list);
                return (
                  <li key={p.code} className="flex flex-col rounded-2xl border bg-white p-5" style={{ borderColor: p.is_featured ? 'var(--jdv-accent)' : 'var(--jdv-border)', borderWidth: p.is_featured ? 2 : 1 }}>
                    <h4 className="font-semibold">{p.name}</h4>
                    <p className="mt-2 text-3xl font-bold" style={{ color: 'var(--jdv-primary-text)' }}>{money(Number(p.price), p.currency)}</p>
                    <p className="text-sm text-[var(--jdv-muted)]">{periodPer(p.duration_days)}</p>
                    {save && <p className="mt-2 inline-block self-start rounded-full px-2.5 py-0.5 text-xs font-medium" style={{ background: 'var(--jdv-accent-soft)' }}>Économisez {save} %</p>}
                    {p.trial_days ? <p className="mt-2 text-xs text-[var(--jdv-muted)]">Essai gratuit de {p.trial_days} jours</p> : null}
                    <a href={`${signupHref}#${code}`} className="mt-4 block rounded-lg px-4 py-2 text-center text-sm font-medium" style={{ background: 'var(--jdv-primary)', color: 'var(--jdv-on-primary)' }}>Voir la formule</a>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </section>
  );
}
