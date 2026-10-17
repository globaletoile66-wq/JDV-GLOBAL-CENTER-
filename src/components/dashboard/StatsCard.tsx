import { money, type Stats } from '@/lib/dashboard/types';

/** Graphique à barres des 30 derniers jours, en SVG (aucune bibliothèque). */
export default function StatsCard({ stats }: { stats: Stats }) {
  const pts = stats.series ?? [];
  const max = Math.max(1, ...pts.flatMap((p) => [p.inflow, p.outflow]));
  const W = 600, H = 120, bw = W / (pts.length || 1);
  const empty = stats.tx_count_30d === 0;
  return (
    <section aria-labelledby="stats-title" className="jdv-card p-5">
      <h2 id="stats-title" className="font-bold text-foreground">Mouvements des 30 derniers jours</h2>
      <dl className="mt-3 grid grid-cols-3 gap-3 text-sm">
        <div><dt className="text-xs text-muted-foreground">Entrées</dt><dd className="font-semibold text-success">{money(stats.inflow_30d, stats.currency)}</dd></div>
        <div><dt className="text-xs text-muted-foreground">Sorties</dt><dd className="font-semibold text-foreground">{money(stats.outflow_30d, stats.currency)}</dd></div>
        <div><dt className="text-xs text-muted-foreground">Opérations</dt><dd className="font-semibold text-foreground">{stats.tx_count_30d}</dd></div>
      </dl>
      {empty ? (
        <p className="mt-6 text-sm text-muted-foreground">Aucune opération terminée sur la période. Vos mouvements apparaîtront ici dès votre première opération.</p>
      ) : (
        <>
          <svg viewBox={`0 0 ${W} ${H}`} className="mt-4 h-32 w-full" role="img" aria-label={`Entrées et sorties par jour sur 30 jours, en ${stats.currency}`}>
            {pts.map((p, i) => {
              const hi = (p.inflow / max) * (H - 6), ho = (p.outflow / max) * (H - 6);
              const x = i * bw + bw * 0.12, w = bw * 0.38;
              return (
                <g key={p.day}>
                  <title>{`${new Date(p.day).toLocaleDateString('fr-FR')} : +${money(p.inflow, stats.currency)} / −${money(p.outflow, stats.currency)}`}</title>
                  <rect x={x} y={H - hi} width={w} height={hi} rx={1.5} fill="var(--success)" />
                  <rect x={x + w + 1} y={H - ho} width={w} height={ho} rx={1.5} fill="var(--accent)" />
                </g>
              );
            })}
          </svg>
          <p className="mt-1 flex gap-4 text-xs text-muted-foreground"><span><span className="text-success">■</span> entrées</span><span><span className="text-accent">■</span> sorties</span></p>
        </>
      )}
    </section>
  );
}
