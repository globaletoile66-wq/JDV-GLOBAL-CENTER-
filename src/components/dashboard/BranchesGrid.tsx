'use client';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { comingSoonHref, routeFor } from '@/lib/dashboard/routes';
import { ago, type Branch } from '@/lib/dashboard/types';

type Filter = 'all' | 'favorites' | 'available';

export default function BranchesGrid({ branches, onChange }: { branches: Branch[]; onChange: () => void }) {
  const router = useRouter();
  const [filter, setFilter] = useState<Filter>('all');
  const list = useMemo(() => {
    const f = branches.filter((b) => filter === 'all' ? true : filter === 'favorites' ? b.is_favorite : !!routeFor(b.code) && b.has_access);
    return [...f].sort((a, b) => Number(b.is_favorite) - Number(a.is_favorite) || (b.last_used_at ?? '').localeCompare(a.last_used_at ?? ''));
  }, [branches, filter]);

  async function open(b: Branch) {
    const route = routeFor(b.code);
    if (route && b.has_access) { createClient().rpc('dashboard_touch_module', { p_module_code: b.code }); router.push(route); }
    else if (route && !b.has_access) router.push(`/abonnements#${b.code}`);
    else router.push(comingSoonHref(b.code, b.name));
  }
  async function fav(b: Branch, e: React.MouseEvent) { e.stopPropagation(); await createClient().rpc('dashboard_toggle_favorite', { p_module_code: b.code }); onChange(); }

  return (
    <section aria-labelledby="br-title" className="jdv-card p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="br-title" className="font-bold text-foreground">Mes branches</h2>
        <div role="tablist" aria-label="Filtrer les branches" className="flex gap-1 text-xs">
          {([['all', 'Toutes'], ['available', 'Disponibles'], ['favorites', 'Favoris']] as [Filter, string][]).map(([k, l]) => (
            <button key={k} role="tab" aria-selected={filter === k} onClick={() => setFilter(k)} className={`rounded-full px-3 py-1 ${filter === k ? 'bg-accent text-accent-foreground' : 'bg-muted text-foreground'}`}>{l}</button>
          ))}
        </div>
      </div>
      {list.length === 0 ? <p className="mt-4 text-sm text-muted-foreground">{filter === 'favorites' ? 'Ajoutez des favoris avec l’étoile pour les retrouver ici.' : 'Aucune branche.'}</p> : (
        <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {list.map((b) => {
            const route = routeFor(b.code);
            const label = !route ? 'Bientôt' : !b.has_access ? 'Abonnement requis' : 'Disponible';
            return (
              <li key={b.code} className="relative">
                <button type="button" onClick={() => open(b)} className={`flex h-full w-full flex-col gap-2 rounded-xl border border-border p-4 text-left transition-colors hover:border-accent/40 ${!route ? 'opacity-70' : ''}`}>
                  <span className="text-2xl" aria-hidden>{b.icon}</span>
                  <span className="text-sm font-semibold text-foreground">{b.name}</span>
                  <span className="text-xs text-muted-foreground">{b.description ?? ''}</span>
                  <span className="mt-auto flex items-center justify-between text-xs">
                    <span className={route && b.has_access ? 'text-success' : 'text-muted-foreground'}>{label}</span>
                    {b.last_used_at && <span className="text-muted-foreground">{ago(b.last_used_at)}</span>}
                  </span>
                </button>
                <button type="button" onClick={(e) => fav(b, e)} aria-pressed={b.is_favorite} aria-label={b.is_favorite ? `Retirer ${b.name} des favoris` : `Ajouter ${b.name} aux favoris`}
                  className="absolute right-2 top-2 text-lg leading-none" style={{ color: b.is_favorite ? 'var(--accent)' : 'var(--muted-foreground)' }}>{b.is_favorite ? '★' : '☆'}</button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
