import { ago, device, money, type ActivityItem } from '@/lib/dashboard/types';

const ICON: Record<string, string> = { transaction: '💳', login: '🔑', audit: '📝' };

export default function ActivityFeed({ items }: { items: ActivityItem[] }) {
  return (
    <section aria-labelledby="act-title" className="jdv-card p-5">
      <h2 id="act-title" className="font-bold text-foreground">Activité récente</h2>
      {items.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">Aucune activité pour le moment. Vos opérations, connexions et actions importantes apparaîtront ici.</p>
      ) : (
        <ul className="mt-4 divide-y divide-border">
          {items.map((a, i) => (
            <li key={i} className="flex items-start gap-3 py-3 text-sm">
              <span aria-hidden className="mt-0.5 text-lg">{ICON[a.kind] ?? '•'}</span>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-foreground">{a.title}{a.status && a.status !== 'completed' ? <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">{a.status === 'pending' ? 'en attente' : a.status}</span> : null}</p>
                <p className="truncate text-xs text-muted-foreground">{a.kind === 'login' ? device(a.detail?.split(' · ')[0]) + (a.detail?.includes(' · ') ? ' · ' + a.detail.split(' · ').slice(1).join(' · ') : '') : a.detail}</p>
                <p className="text-xs text-muted-foreground">{a.module ? `${a.module} · ` : ''}{ago(a.at)}</p>
              </div>
              {a.amount != null && <p className={`shrink-0 font-semibold ${a.direction === 'in' ? 'text-success' : 'text-foreground'}`}>{a.direction === 'in' ? '+' : '−'}{money(a.amount, a.currency)}</p>}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
