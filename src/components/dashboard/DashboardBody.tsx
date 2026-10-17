'use client';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useDashboard } from '@/hooks/useDashboard';
import KpiCards from './KpiCards';
import ChecklistCard from './ChecklistCard';
import WalletsPanel from './WalletsPanel';
import StatsCard from './StatsCard';
import ActivityFeed from './ActivityFeed';
import NotificationsPanel from './NotificationsPanel';
import SubscriptionsPanel from './SubscriptionsPanel';
import OrganizationsPanel from './OrganizationsPanel';
import BranchesGrid from './BranchesGrid';

type Props = { activeOrganizationId?: string | null; onSelectOrganization?: (id: string, name: string) => void };

/** Corps du tableau de bord : toutes les données viennent d'un seul appel (dashboard_overview), propre à l'utilisateur connecté. */
export default function DashboardBody({ activeOrganizationId, onSelectOrganization }: Props) {
  const router = useRouter();
  const { data, error, loading, refresh } = useDashboard();
  useEffect(() => { if (error === 'AUTH') router.push('/auth/login'); }, [error, router]);

  if (loading) return <div className="jdv-card p-8 text-sm text-muted-foreground" aria-busy="true">Chargement de votre tableau de bord…</div>;
  if (error && error !== 'AUTH') return <div role="alert" className="jdv-card p-8 text-sm text-danger">{error} <button type="button" onClick={refresh} className="ml-2 underline">Réessayer</button></div>;
  if (!data) return null;

  return (
    <div className="flex flex-col gap-6">
      <KpiCards kpis={data.kpis} />
      <ChecklistCard items={data.checklist} />
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="flex flex-col gap-6 xl:col-span-2">
          <WalletsPanel wallets={data.wallets} primary={data.stats.currency} />
          <StatsCard stats={data.stats} />
          <BranchesGrid branches={data.branches} onChange={refresh} />
          <ActivityFeed items={data.activity} />
        </div>
        <div className="flex flex-col gap-6">
          <NotificationsPanel unread={data.notifications.unread} items={data.notifications.items} onChange={refresh} />
          <SubscriptionsPanel items={data.subscriptions} />
          <OrganizationsPanel items={data.organizations} activeId={activeOrganizationId} onSelect={onSelectOrganization} />
        </div>
      </div>
    </div>
  );
}
