import React from 'react';
import { LogIn, CreditCard, UserCog, Building2, ShieldAlert, FileCheck, Eye } from 'lucide-react';

const auditEntries = [
  {
    id: 'audit-001',
    icon: LogIn,
    action: 'Connexion réussie',
    module: 'JDV CORE',
    detail: 'Chrome · Android · Cotonou, BJ',
    timestamp: '18 sept. 2026 · 17:16',
    type: 'success',
    color: '#10B981',
  },
  {
    id: 'audit-002',
    icon: CreditCard,
    action: 'Virement reçu',
    module: 'JDV PAY',
    detail: '15 000 XOF · Réf. PAY-2026-09180034',
    timestamp: '18 sept. 2026 · 13:42',
    type: 'transaction',
    color: '#F97316',
  },
  {
    id: 'audit-003',
    icon: UserCog,
    action: 'Profil mis à jour',
    module: 'JDV CORE',
    detail: 'Champ téléphone modifié',
    timestamp: '17 sept. 2026 · 09:18',
    type: 'info',
    color: '#3B82F6',
  },
  {
    id: 'audit-004',
    icon: Building2,
    action: 'Invitation organisation reçue',
    module: 'JDV CORE',
    detail: 'TechBénin SARL · En attente d\'acceptation',
    timestamp: '17 sept. 2026 · 08:55',
    type: 'info',
    color: '#8B5CF6',
  },
  {
    id: 'audit-005',
    icon: ShieldAlert,
    action: 'Connexion depuis nouvel appareil',
    module: 'Sécurité',
    detail: 'Firefox · Windows · Lomé, TG',
    timestamp: '16 sept. 2026 · 22:03',
    type: 'warning',
    color: '#F59E0B',
  },
  {
    id: 'audit-006',
    icon: FileCheck,
    action: 'Compte vérifié',
    module: 'JDV CORE',
    detail: 'Vérification email confirmée',
    timestamp: '15 sept. 2026 · 14:30',
    type: 'success',
    color: '#10B981',
  },
  {
    id: 'audit-007',
    icon: Eye,
    action: 'Module JDV PAY activé',
    module: 'JDV PAY',
    detail: 'Accès accordé · Plan Gratuit',
    timestamp: '15 sept. 2026 · 14:28',
    type: 'success',
    color: '#10B981',
  },
];

const typeStyles: Record<string, string> = {
  success: 'text-success',
  warning: 'text-warning',
  transaction: 'text-accent',
  info: 'text-info',
  error: 'text-danger',
};

export default function ActivityLog() {
  return (
    <div className="jdv-card !p-0 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <div>
          <h2 className="text-base font-bold text-foreground">Journal d'activité</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Dernières opérations tracées sur votre compte
          </p>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-success/10 border border-success/20">
          <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
          <span className="text-xs text-success font-semibold">En direct</span>
        </div>
      </div>

      {/* Table header */}
      <div className="hidden sm:grid grid-cols-12 gap-4 px-5 py-2.5 border-b border-border bg-muted/20">
        <div className="col-span-4 section-label">Action</div>
        <div className="col-span-2 section-label">Module</div>
        <div className="col-span-4 section-label">Détail</div>
        <div className="col-span-2 section-label">Date</div>
      </div>

      {/* Entries */}
      <div className="divide-y divide-border">
        {auditEntries.map((entry) => (
          <div
            key={entry.id}
            className="flex sm:grid sm:grid-cols-12 sm:gap-4 items-start sm:items-center px-5 py-3.5 hover:bg-muted/10 transition-colors duration-100 gap-3"
          >
            {/* Action */}
            <div className="sm:col-span-4 flex items-center gap-2.5 min-w-0">
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: `${entry.color}15`, border: `1px solid ${entry.color}25` }}
              >
                <entry.icon size={13} style={{ color: entry.color }} />
              </div>
              <span className={`text-xs font-semibold truncate ${typeStyles[entry.type]}`}>
                {entry.action}
              </span>
            </div>

            {/* Module */}
            <div className="sm:col-span-2 hidden sm:block">
              <span className="text-xs font-medium text-muted-foreground bg-muted/40 px-2 py-0.5 rounded-md">
                {entry.module}
              </span>
            </div>

            {/* Detail */}
            <div className="sm:col-span-4 flex-1 min-w-0 hidden sm:block">
              <span className="text-xs text-muted-foreground truncate block">{entry.detail}</span>
            </div>

            {/* Timestamp */}
            <div className="sm:col-span-2 hidden sm:block">
              <span className="text-xs text-muted-foreground/70 font-mono whitespace-nowrap">
                {entry.timestamp}
              </span>
            </div>

            {/* Mobile: stacked */}
            <div className="sm:hidden flex-1 min-w-0">
              <p className="text-xs text-muted-foreground truncate">{entry.detail}</p>
              <p className="text-xs text-muted-foreground/60 mt-0.5">{entry.timestamp}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-border flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          Affichage des 7 dernières actions
        </span>
        <button className="text-xs text-accent hover:text-accent-light font-semibold transition-colors">
          Voir l'historique complet
        </button>
      </div>
    </div>
  );
}