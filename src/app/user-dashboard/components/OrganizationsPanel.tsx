'use client';

import React from 'react';
import { Building2, ChevronRight, Plus, Crown, Users } from 'lucide-react';
import { toast } from 'sonner';

const organizations = [
  {
    id: 'org-001',
    name: 'Kofi Mensah Consulting',
    role: 'Propriétaire',
    roleType: 'owner' as const,
    members: 3,
    status: 'active',
    country: '🇧🇯',
    initial: 'KM',
    color: '#F97316',
  },
  {
    id: 'org-002',
    name: 'TechBénin SARL',
    role: 'Membre invité',
    roleType: 'member' as const,
    members: 12,
    status: 'pending',
    country: '🇧🇯',
    initial: 'TB',
    color: '#3B82F6',
  },
];

const statusConfig: Record<string, { label: string; className: string }> = {
  active: { label: 'Actif', className: 'badge-active' },
  pending: { label: 'En attente', className: 'badge-maintenance' },
  suspended: { label: 'Suspendu', className: 'badge-disabled' },
};

export default function OrganizationsPanel() {
  const handleCreateOrg = () => {
    toast.info('Création d\'organisation — fonctionnalité en préparation');
  };

  return (
    <div className="jdv-card !p-0 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Building2 size={16} className="text-accent" />
          <h2 className="text-sm font-bold text-foreground">Organisations</h2>
          <span className="jdv-badge badge-active">{organizations.length}</span>
        </div>
        <button
          onClick={handleCreateOrg}
          className="flex items-center gap-1 text-xs text-accent hover:text-accent-light font-semibold transition-colors"
        >
          <Plus size={13} />
          Nouvelle
        </button>
      </div>

      {/* List */}
      <div className="divide-y divide-border">
        {organizations.map((org) => {
          const cfg = statusConfig[org.status];
          return (
            <div
              key={org.id}
              className="flex items-center gap-3 px-5 py-4 hover:bg-muted/20 cursor-pointer transition-colors duration-150 group"
            >
              {/* Avatar */}
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                style={{ background: `linear-gradient(135deg, ${org.color} 0%, ${org.color}99 100%)` }}
              >
                {org.initial}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm font-semibold text-foreground truncate">{org.name}</p>
                  <span className="text-sm flex-shrink-0">{org.country}</span>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="flex items-center gap-1">
                    {org.roleType === 'owner'
                      ? <Crown size={11} className="text-accent" />
                      : <Users size={11} className="text-muted-foreground" />
                    }
                    <span className="text-xs text-muted-foreground font-medium">{org.role}</span>
                  </div>
                  <span className={`jdv-badge ${cfg.className}`}>{cfg.label}</span>
                </div>
                <div className="flex items-center gap-1 mt-1">
                  <Users size={11} className="text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">
                    {org.members} membre{org.members > 1 ? 's' : ''}
                  </span>
                </div>
              </div>

              <ChevronRight
                size={15}
                className="text-muted-foreground group-hover:text-foreground transition-colors flex-shrink-0"
              />
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-border">
        <button className="text-xs text-accent hover:text-accent-light font-semibold transition-colors w-full text-center">
          Gérer mes organisations
        </button>
      </div>
    </div>
  );
}