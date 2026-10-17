import Link from 'next/link';
import type { OrganizationItem } from '@/lib/dashboard/types';

export default function OrganizationsPanel({ items, activeId, onSelect }: { items: OrganizationItem[]; activeId?: string | null; onSelect?: (id: string, name: string) => void }) {
  return (
    <section aria-labelledby="orgs-title" className="jdv-card p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 id="orgs-title" className="font-bold text-foreground">Mes organisations</h2>
        <Link href="/organizations" className="text-xs font-medium text-accent hover:underline">Gérer</Link>
      </div>
      {items.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">Vous n’appartenez à aucune organisation. <Link href="/organizations/create" className="font-medium text-accent hover:underline">Créer une organisation</Link></p>
      ) : (
        <ul className="mt-3 space-y-2">
          {items.map((o) => (
            <li key={o.id}>
              <button type="button" onClick={() => onSelect?.(o.id, o.name)} aria-pressed={activeId === o.id}
                className={`flex w-full items-center gap-3 rounded-lg border p-2.5 text-left transition-colors hover:border-accent/40 ${activeId === o.id ? 'border-accent/50 bg-accent/5' : 'border-border'}`}>
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent/20 text-xs font-bold text-accent">{o.name[0]}</span>
                <span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold text-foreground">{o.name}</span><span className="block text-xs text-muted-foreground">{o.role ?? 'membre'}{activeId === o.id ? ' · active' : ''}</span></span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
