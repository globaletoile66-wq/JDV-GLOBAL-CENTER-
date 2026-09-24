import React from 'react';
import { LayoutGrid, Building2, Bell, UserCheck, TrendingUp, TrendingDown } from 'lucide-react';

const kpiCards = [
  {
    id: 'kpi-modules',
    label: 'Modules actifs',
    value: '3',
    sub: 'sur 18 disponibles',
    icon: LayoutGrid,
    trend: '+1 ce mois',
    trendUp: true,
    color: '#F97316',
    bg: 'rgba(249, 115, 22, 0.08)',
    border: 'rgba(249, 115, 22, 0.2)',
  },
  {
    id: 'kpi-orgs',
    label: 'Organisations',
    value: '2',
    sub: 'dont 1 en attente',
    icon: Building2,
    trend: 'Invitation reçue',
    trendUp: null,
    color: '#3B82F6',
    bg: 'rgba(59, 130, 246, 0.08)',
    border: 'rgba(59, 130, 246, 0.2)',
  },
  {
    id: 'kpi-notifs',
    label: 'Notifications',
    value: '5',
    sub: 'non lues',
    icon: Bell,
    trend: '2 urgentes',
    trendUp: false,
    color: '#EF4444',
    bg: 'rgba(239, 68, 68, 0.08)',
    border: 'rgba(239, 68, 68, 0.25)',
    alert: true,
  },
  {
    id: 'kpi-profile',
    label: 'Profil complété',
    value: '72%',
    sub: '3 champs manquants',
    icon: UserCheck,
    trend: '+12% depuis inscription',
    trendUp: true,
    color: '#10B981',
    bg: 'rgba(16, 185, 129, 0.08)',
    border: 'rgba(16, 185, 129, 0.2)',
  },
];

export default function KPICards() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 2xl:grid-cols-4 gap-4">
      {kpiCards?.map((card) => (
        <div
          key={card?.id}
          className="rounded-2xl p-5 transition-all duration-200 hover:translate-y-[-2px] cursor-pointer"
          style={{
            background: card?.bg,
            border: `1px solid ${card?.border}`,
          }}
        >
          <div className="flex items-start justify-between mb-4">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: `${card?.color}20`, border: `1px solid ${card?.color}30` }}
            >
              <card.icon size={18} style={{ color: card?.color }} />
            </div>
            {card?.trendUp !== null && (
              card?.trendUp
                ? <TrendingUp size={14} className="text-success" />
                : <TrendingDown size={14} className="text-danger" />
            )}
          </div>

          <div className="font-tabular text-3xl font-extrabold text-foreground mb-0.5">
            {card?.value}
          </div>
          <div className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
            {card?.label}
          </div>
          <div className="text-xs text-muted-foreground">{card?.sub}</div>
          <div
            className="mt-3 text-xs font-medium"
            style={{ color: card?.alert ? '#EF4444' : card?.trendUp ? '#10B981' : card?.color }}
          >
            {card?.trend}
          </div>
        </div>
      ))}
    </div>
  );
}