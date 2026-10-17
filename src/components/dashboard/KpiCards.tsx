import type { DashboardData } from '@/lib/dashboard/types';

export default function KpiCards({ kpis }: { kpis: DashboardData['kpis'] }) {
  const items = [
    { label: 'Branches accessibles', value: String(kpis.active_branches), hint: 'disponibles pour vous' },
    { label: 'Organisations', value: String(kpis.organizations), hint: kpis.organizations === 0 ? 'aucune pour le moment' : 'dont vous êtes membre' },
    { label: 'Notifications', value: String(kpis.unread_notifications), hint: kpis.unread_notifications === 0 ? 'tout est lu' : 'non lue(s)', alert: kpis.unread_notifications > 0 },
    { label: 'Profil complété', value: `${kpis.profile_completeness} %`, hint: kpis.profile_completeness === 100 ? 'complet' : 'à compléter', alert: kpis.profile_completeness < 100 },
  ];
  return (
    <ul className="grid grid-cols-2 gap-4 xl:grid-cols-4" aria-label="Indicateurs clés">
      {items.map((k) => (
        <li key={k.label} className="jdv-card p-4">
          <p className="text-2xl font-extrabold text-foreground">{k.value}</p>
          <p className="mt-1 text-sm font-medium text-foreground">{k.label}</p>
          <p className={`text-xs ${k.alert ? 'text-warning' : 'text-muted-foreground'}`}>{k.hint}</p>
        </li>
      ))}
    </ul>
  );
}
