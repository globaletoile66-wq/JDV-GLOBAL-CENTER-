import Link from 'next/link';
import type { SubscriptionItem } from '@/lib/dashboard/types';

const LABEL: Record<string, string> = { trial: 'Essai', active: 'Actif', past_due: 'En retard', expired: 'Expiré', cancelled: 'Résilié' };

export default function SubscriptionsPanel({ items }: { items: SubscriptionItem[] }) {
  return (
    <section aria-labelledby="subs-title" className="jdv-card p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 id="subs-title" className="font-bold text-foreground">Mes abonnements</h2>
        <Link href="/abonnements" className="text-xs font-medium text-accent hover:underline">Gérer</Link>
      </div>
      {items.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">Aucun abonnement. Découvrez les formules de chaque branche.</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {items.map((s) => {
            const soon = s.is_effectively_active && s.days_left != null && s.days_left <= 7;
            return (
              <li key={s.subscription_id} className="flex items-center justify-between gap-3 rounded-lg border border-border p-3 text-sm">
                <div className="min-w-0">
                  <p className="truncate font-medium text-foreground">{s.module_code.replace('jdv_', 'JDV ').toUpperCase()} · {s.plan_name}</p>
                  <p className={`text-xs ${soon || !s.is_effectively_active ? 'text-warning' : 'text-muted-foreground'}`}>
                    {s.organization_name ? `${s.organization_name} · ` : ''}
                    {s.is_effectively_active ? (s.days_left != null ? `${s.days_left} jour${s.days_left > 1 ? 's' : ''} restant${s.days_left > 1 ? 's' : ''}` : 'Sans fin') : 'Accès interrompu'}
                  </p>
                </div>
                <span className="shrink-0 rounded-full bg-muted px-2.5 py-0.5 text-xs text-foreground">{LABEL[s.status] ?? s.status}</span>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
