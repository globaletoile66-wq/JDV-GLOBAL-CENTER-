export type Plan = {
  code: string; module_code: string; name: string; description: string | null; price: number; currency: string;
  duration_days: number; trial_days: number | null; is_featured: boolean; sort_order: number;
  highlights: string[] | null; limits: { resource: string; limit: number | null; unlimited: boolean }[] | null;
};
export type MySub = {
  subscription_id: string; subject_type: 'user' | 'organization'; organization_id: string | null; organization_name: string | null;
  module_code: string; plan_code: string; plan_name: string; status: string; started_at: string | null; expires_at: string | null;
  days_left: number | null; auto_renew: boolean; is_effectively_active: boolean; cancelled_at: string | null; can_manage: boolean;
};

const PERIODS: Record<number, { per: string; label: string }> = {
  1: { per: 'par jour', label: '1 jour' }, 7: { per: 'par semaine', label: '1 semaine' }, 30: { per: 'par mois', label: '1 mois' },
  90: { per: 'par trimestre', label: '3 mois' }, 180: { per: 'pour 6 mois', label: '6 mois' }, 365: { per: 'par an', label: '1 an' },
};
export const periodPer = (d: number) => PERIODS[d]?.per ?? `pour ${d} jours`;
export const periodLabel = (d: number) => PERIODS[d]?.label ?? `${d} jours`;

export function money(n: number, cur: string): string {
  try { return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: cur, maximumFractionDigits: Number.isInteger(n) ? 0 : 2 }).format(n); }
  catch { return `${n} ${cur}`; }
}

/** Économie réelle d'une formule par rapport à la formule la plus courte de la même branche, calculée sur le prix par jour. */
export function savingPercent(plan: Plan, all: Plan[]): number | null {
  const shortest = [...all].filter((p) => p.currency === plan.currency).sort((a, b) => a.duration_days - b.duration_days)[0];
  if (!shortest || shortest.code === plan.code) return null;
  const base = shortest.price / shortest.duration_days;
  const mine = plan.price / plan.duration_days;
  const pct = Math.round((1 - mine / base) * 100);
  return pct >= 5 ? pct : null;
}

export const STATUS_LABEL: Record<string, string> = {
  trial: 'Essai gratuit', active: 'Actif', past_due: 'Paiement en retard', expired: 'Expiré', cancelled: 'Résilié', pending: 'En attente',
};

export type Invoice = {
  id: string; invoice_number: string; module_code: string; plan_code: string; plan_name: string;
  period_start: string | null; period_end: string | null; currency: string; subtotal: number; tax_rate: number; tax_amount: number; total: number;
  amount_xof: number | null; status: string; issued_at: string;
  buyer: { type?: string; name?: string; email?: string; address?: string };
  seller: { legal_name?: string; trade_name?: string; address?: string; city?: string; country?: string; tax_id?: string; email?: string; phone?: string; tax_label?: string; footer?: string } | null;
  lines: { description: string; quantity: number; unit_price: number; amount: number }[];
};
