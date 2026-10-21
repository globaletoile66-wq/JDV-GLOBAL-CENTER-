'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { branchName } from '@/lib/billing/branches';
import { money, periodLabel, periodPer, savingPercent, STATUS_LABEL, type MySub, type Plan } from '@/lib/billing/format';

type Props = {
  /** Code du module, ex. 'jdv_pub'. */
  moduleCode: string;
  /** Nom affiché ; par défaut déduit du code. */
  branchName?: string;
  /** Si l'abonnement est pris au nom d'une organisation (sinon : abonnement personnel). */
  organizationId?: string | null;
};

const dateFr = (d: string | null) => (d ? new Date(d).toLocaleDateString('fr-FR', { dateStyle: 'long' }) : '—');

export default function BranchSubscriptionSection({ moduleCode, branchName: name, organizationId = null }: Props) {
  const sb = useMemo(() => createClient(), []);
  const title = name ?? branchName(moduleCode);
  const [plans, setPlans] = useState<Plan[] | null>(null);
  const [subs, setSubs] = useState<MySub[]>([]);
  const [logged, setLogged] = useState<boolean | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const load = useCallback(async () => {
    const [p, u] = await Promise.all([sb.rpc('public_branch_plans', { p_module_code: moduleCode }), sb.auth.getUser()]);
    setPlans((p.data ?? []) as Plan[]);
    setLogged(!!u.data.user);
    if (u.data.user) {
      const { data } = await sb.rpc('billing_my_subscriptions');
      setSubs(((data ?? []) as MySub[]).filter((s) => s.module_code === moduleCode && (organizationId ? s.organization_id === organizationId : s.subject_type === 'user')));
    }
  }, [sb, moduleCode, organizationId]);
  useEffect(() => { load(); }, [load]);

  const current = subs.find((s) => ['trial', 'active', 'past_due', 'pending'].includes(s.status));
  const everSubscribed = subs.length > 0;

  async function run(key: string, fn: () => PromiseLike<{ error: { message: string } | null }>, okText: string) {
    setBusy(key); setMsg(null);
    const { error } = await fn();
    setBusy(null);
    if (error) {
      const m = error.message || '';
      setMsg({ ok: false, text: m.includes('TRIAL_ALREADY_USED') ? 'L’essai gratuit a déjà été utilisé pour cette branche.' : m.includes('ACCESS_DENIED') ? 'Seul un administrateur peut effectuer cette action.' : 'L’opération n’a pas pu aboutir. Réessayez dans un instant.' });
    } else { setMsg({ ok: true, text: okText }); await load(); }
  }

  const startTrial = (p: Plan) => run('trial-' + p.code, () => sb.rpc('billing_start_trial', { p_plan_code: p.code, p_organization_id: organizationId }), 'Votre essai gratuit a commencé.');
  const cancel = () => {
    if (!current) return;
    const reason = window.prompt('Souhaitez-vous nous dire pourquoi vous résiliez ? (facultatif)') ?? undefined;
    if (!window.confirm(current.status === 'trial' ? 'Résilier votre essai maintenant ?' : 'Arrêter le renouvellement ? Votre accès reste actif jusqu’à la date de fin.')) return;
    run('cancel', () => sb.rpc('billing_cancel_subscription', { p_subscription_id: current.subscription_id, p_reason: reason ?? null, p_immediate: false }), current.status === 'trial' ? 'Essai résilié.' : 'Renouvellement arrêté. Votre accès reste actif jusqu’à la fin de la période.');
  };
  const toggleRenew = () => current && run('renew', () => sb.rpc('billing_set_auto_renew', { p_subscription_id: current.subscription_id, p_value: !current.auto_renew }), current.auto_renew ? 'Rappels de renouvellement désactivés.' : 'Rappels de renouvellement activés.');

  async function checkout(p: Plan) {
    setBusy('pay-' + p.code); setMsg(null);
    const { data, error } = await sb.functions.invoke('jdv-billing-checkout', { body: { plan_code: p.code, organization_id: organizationId } });
    setBusy(null);
    if (error || !data?.payment_url) setMsg({ ok: false, text: 'Le paiement n’est pas disponible pour le moment.' });
    else window.location.href = String(data.payment_url);
  }

  if (plans === null) return <p className="text-sm">Chargement des tarifs…</p>;

  return (
    <section aria-labelledby={`abo-${moduleCode}`} className="rounded-2xl border border-[var(--jdv-border)] bg-white p-6">
      <h2 id={`abo-${moduleCode}`} className="text-xl font-bold" style={{ color: 'var(--jdv-primary-text)' }}>Abonnement {title}</h2>

      {current && (
        <div className="mt-4 rounded-xl border border-[var(--jdv-border)] bg-[var(--jdv-primary-soft)] p-4 text-sm">
          <p className="flex flex-wrap items-center gap-2">
            <strong>{current.plan_name}</strong>
            <span className="rounded-full px-2.5 py-0.5 text-xs font-medium" style={{ background: 'var(--jdv-primary)', color: 'var(--jdv-on-primary)' }}>{STATUS_LABEL[current.status] ?? current.status}</span>
          </p>
          <p className="mt-1 text-[var(--jdv-muted)]">
            {current.expires_at ? <>Valable jusqu’au <strong>{dateFr(current.expires_at)}</strong>{current.days_left != null ? ` (${current.days_left} jour${current.days_left > 1 ? 's' : ''} restant${current.days_left > 1 ? 's' : ''})` : ''}.</> : 'Sans date de fin.'}
            {current.cancelled_at && current.status !== 'cancelled' ? ' Renouvellement arrêté.' : ''}
          </p>
          {current.can_manage && (
            <div className="mt-3 flex flex-wrap gap-2">
              {current.status !== 'trial' && <button type="button" onClick={toggleRenew} disabled={!!busy} className="rounded-lg border border-[var(--jdv-border)] bg-white px-3 py-1.5 hover:bg-[var(--jdv-primary-soft)]">{current.auto_renew ? 'Désactiver les rappels de renouvellement' : 'Activer les rappels de renouvellement'}</button>}
              <button type="button" onClick={cancel} disabled={!!busy} className="rounded-lg border border-red-300 bg-white px-3 py-1.5 text-red-700 hover:bg-red-50">{current.status === 'trial' ? 'Résilier l’essai' : 'Arrêter le renouvellement'}</button>
            </div>
          )}
        </div>
      )}
      {!current && everSubscribed && <p className="mt-3 text-sm text-[var(--jdv-muted)]">Votre abonnement précédent est terminé. Choisissez une formule pour réactiver {title}.</p>}

      {plans.length === 0 ? (
        <p className="mt-4 text-sm text-[var(--jdv-muted)]">Les tarifs de {title} seront bientôt disponibles.</p>
      ) : (
        <ul className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {plans.map((p) => {
            const save = savingPercent(p, plans);
            const isCurrent = current?.plan_code === p.code;
            const canTrial = !!p.trial_days && p.trial_days > 0 && !everSubscribed && logged;
            return (
              <li key={p.code} className="flex flex-col rounded-2xl border bg-white p-5" style={{ borderColor: p.is_featured ? 'var(--jdv-accent)' : 'var(--jdv-border)', borderWidth: p.is_featured ? 2 : 1 }}>
                <h3 className="font-semibold">{p.name}</h3>
                <p className="mt-2 text-3xl font-bold" style={{ color: 'var(--jdv-primary-text)' }}>{money(Number(p.price), p.currency)}</p>
                <p className="text-sm text-[var(--jdv-muted)]">{periodPer(p.duration_days)}</p>
                {p.duration_days > 1 && <p className="mt-1 text-xs text-[var(--jdv-muted)]">soit {money(Math.round((Number(p.price) / p.duration_days) * 100) / 100, p.currency)} par jour</p>}
                {save && <p className="mt-2 inline-block self-start rounded-full px-2.5 py-0.5 text-xs font-medium" style={{ background: 'var(--jdv-accent-soft)' }}>Économisez {save} %</p>}
                {p.description && <p className="mt-2 text-sm text-[var(--jdv-muted)]">{p.description}</p>}
                <ul className="mt-3 space-y-1 text-sm">{(p.highlights ?? []).map((h) => <li key={h}>✓ {h}</li>)}</ul>
                <div className="mt-auto pt-4">
                  {logged === false ? (
                    <p className="text-xs text-[var(--jdv-muted)]">Connectez-vous pour vous abonner.</p>
                  ) : (
                    <div className="space-y-2">
                      {canTrial && <button type="button" onClick={() => startTrial(p)} disabled={!!busy} className="w-full rounded-lg border border-[var(--jdv-border)] px-3 py-2 text-sm font-medium hover:bg-[var(--jdv-primary-soft)]">Essai gratuit de {p.trial_days} jours</button>}
                      <button type="button" onClick={() => checkout(p)} disabled={!!busy || isCurrent} className="w-full rounded-lg px-3 py-2 text-sm font-medium disabled:opacity-60" style={{ background: 'var(--jdv-primary)', color: 'var(--jdv-on-primary)' }}>
                        {isCurrent ? 'Formule actuelle' : current ? 'Choisir (' + periodLabel(p.duration_days) + ')' : 'S’abonner'}
                      </button>
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
      <p className="mt-4 text-xs text-[var(--jdv-muted)]">Le paiement par Mobile Money ou carte est ponctuel : à la fin de la période, vous êtes prévenu et vous renouvelez en un clic. Aucun prélèvement automatique.</p>
      {msg && <p role="status" className={`mt-3 text-sm ${msg.ok ? 'text-green-700' : 'text-red-700'}`}>{msg.text}</p>}
    </section>
  );
}
