'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import BranchSubscriptionSection from '@/components/billing/BranchSubscriptionSection';

/** Page centrale : une section d'abonnement par branche qui a des tarifs publiés. */
export default function AbonnementsPage() {
  const [modules, setModules] = useState<string[] | null>(null);
  useEffect(() => {
    createClient().rpc('public_branch_plans').then(({ data }) => {
      const codes = Array.from(new Set(((data ?? []) as { module_code: string }[]).map((p) => p.module_code)));
      setModules(codes);
    });
  }, []);
  return (
    <main className="jdv-home min-h-screen px-5 py-10">
      <div className="mx-auto max-w-6xl space-y-8">
        <h1 className="text-3xl font-bold" style={{ color: 'var(--jdv-primary-text)' }}>Abonnements</h1>
        <p className="text-[var(--jdv-muted)]">Chaque branche JDV a ses propres formules. Abonnez-vous uniquement à ce dont vous avez besoin.</p>
        {modules === null ? <p>Chargement…</p> : modules.length === 0 ? <p>Aucune formule n’est publiée pour le moment.</p> : modules.map((m) => <BranchSubscriptionSection key={m} moduleCode={m} />)}
      </div>
    </main>
  );
}
