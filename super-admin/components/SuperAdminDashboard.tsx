'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Users, Building2, Grid3X3, Shield, LogOut, ChevronRight, BarChart3 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import AppLogo from '@/components/ui/AppLogo';
import { toast } from 'sonner';

interface Stats {
  usersCount: number;
  orgsCount: number;
  modulesCount: number;
}

interface Props {
  stats: Stats;
  recentUsers: any[];
  recentOrgs: any[];
  adminUser: any;
}

const STATUS_COLORS: Record<string, string> = {
  active: 'text-success bg-success/10',
  pending: 'text-warning bg-warning/10',
  suspended: 'text-danger bg-danger/10',
  restricted: 'text-warning bg-warning/10',
};

export default function SuperAdminDashboard({ stats, recentUsers, recentOrgs, adminUser }: Props) {
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'organizations' | 'modules'>('overview');
  const { signOut } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push('/');
    } catch {
      toast.error('Erreur lors de la déconnexion');
    }
  };

  const navItems = [
    { id: 'overview', label: 'Vue globale', icon: BarChart3 },
    { id: 'users', label: 'Utilisateurs', icon: Users },
    { id: 'organizations', label: 'Organisations', icon: Building2 },
    { id: 'modules', label: 'Modules', icon: Grid3X3 },
  ];

  return (
    <div className="min-h-screen bg-background flex">
      {/* Admin Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-card border-r border-border flex-shrink-0">
        <div className="px-4 pt-5 pb-4 border-b border-border">
          <div className="flex items-center gap-3">
            <AppLogo size={32} />
            <div className="flex flex-col leading-none">
              <span className="font-extrabold text-sm text-foreground">JDV</span>
              <span className="text-xs text-danger font-bold tracking-wider uppercase">SUPER ADMIN</span>
            </div>
          </div>
        </div>

        <div className="px-4 py-3 border-b border-border">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-danger/10 border border-danger/20">
            <Shield size={14} className="text-danger flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-xs font-bold text-danger">Portail Administrateur</p>
              <p className="text-xs text-muted-foreground truncate">{adminUser?.email}</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              className={`nav-item w-full text-left ${activeTab === item.id ? 'active' : ''}`}
            >
              <item.icon size={17} className="flex-shrink-0" />
              <span className="text-sm">{item.label}</span>
            </button>
          ))}
          <div className="mt-4 pt-4 border-t border-border">
            <Link href="/dashboard" className="nav-item">
              <ChevronRight size={17} className="flex-shrink-0" />
              <span className="text-sm">Espace utilisateur</span>
            </Link>
          </div>
        </nav>

        <div className="px-3 py-4 border-t border-border">
          <button onClick={handleSignOut} className="nav-item w-full">
            <LogOut size={17} className="text-danger flex-shrink-0" />
            <span className="text-danger text-sm font-medium">Déconnexion</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-16 border-b border-border bg-card/80 backdrop-blur-sm flex items-center px-6 gap-4 flex-shrink-0">
          <div className="flex items-center gap-2">
            <Shield size={18} className="text-danger" />
            <h1 className="font-bold text-foreground">
              {navItems.find((n) => n.id === activeTab)?.label || 'Administration'}
            </h1>
          </div>
          <div className="flex-1" />
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-danger/10 border border-danger/20">
            <div className="w-2 h-2 rounded-full bg-danger animate-pulse" />
            <span className="text-xs font-bold text-danger">MODE ADMIN</span>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto scrollbar-thin p-6 lg:p-8">
          {activeTab === 'overview' && (
            <OverviewTab stats={stats} recentUsers={recentUsers} recentOrgs={recentOrgs} />
          )}
          {activeTab === 'users' && <UsersTab users={recentUsers} />}
          {activeTab === 'organizations' && <OrgsTab orgs={recentOrgs} />}
          {activeTab === 'modules' && <ModulesTab />}
        </main>
      </div>
    </div>
  );
}

function OverviewTab({ stats, recentUsers, recentOrgs }: { stats: Stats; recentUsers: any[]; recentOrgs: any[] }) {
  const kpis = [
    { label: 'Utilisateurs', value: stats.usersCount, icon: Users, color: 'text-info' },
    { label: 'Organisations', value: stats.orgsCount, icon: Building2, color: 'text-success' },
    { label: 'Modules', value: stats.modulesCount, icon: Grid3X3, color: 'text-accent' },
  ];

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h2 className="text-2xl font-extrabold text-foreground mb-6">Vue globale de la plateforme</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {kpis.map((kpi) => (
            <div key={kpi.label} className="jdv-card">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-muted-foreground">{kpi.label}</span>
                <kpi.icon size={20} className={kpi.color} />
              </div>
              <p className="text-3xl font-extrabold text-foreground">{kpi.value}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="jdv-card">
          <h3 className="font-bold text-foreground mb-4">Utilisateurs récents</h3>
          {recentUsers.length === 0 ? (
            <div className="text-center py-6">
              <Users size={24} className="text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Aucun utilisateur</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {recentUsers.slice(0, 5).map((u) => (
                <div key={u.id} className="flex items-center gap-3 py-2 border-b border-border last:border-0">
                  <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-accent font-bold text-xs flex-shrink-0">
                    {u.full_name?.[0] || u.email?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-foreground truncate">{u.full_name || u.email}</p>
                    <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                  </div>
                  <span className={`jdv-badge text-xs ${STATUS_COLORS[u.account_status] || 'text-muted-foreground bg-muted/20'}`}>
                    {u.account_status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="jdv-card">
          <h3 className="font-bold text-foreground mb-4">Organisations récentes</h3>
          {recentOrgs.length === 0 ? (
            <div className="text-center py-6">
              <Building2 size={24} className="text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Aucune organisation</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {recentOrgs.slice(0, 5).map((o) => (
                <div key={o.id} className="flex items-center gap-3 py-2 border-b border-border last:border-0">
                  <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center text-foreground font-bold text-xs flex-shrink-0">
                    {o.name?.[0] || 'O'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-foreground truncate">{o.name}</p>
                  </div>
                  <span className={`jdv-badge text-xs ${STATUS_COLORS[o.org_status] || 'text-muted-foreground bg-muted/20'}`}>
                    {o.org_status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function UsersTab({ users }: { users: any[] }) {
  return (
    <div>
      <h2 className="text-2xl font-extrabold text-foreground mb-6">Gestion des utilisateurs</h2>
      {users.length === 0 ? (
        <div className="jdv-card text-center py-12">
          <Users size={48} className="text-muted-foreground mx-auto mb-4" />
          <p className="text-lg font-bold text-foreground mb-2">0 utilisateur</p>
          <p className="text-muted-foreground">Aucun utilisateur inscrit sur la plateforme.</p>
        </div>
      ) : (
        <div className="jdv-card overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Utilisateur</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Email</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Statut</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Inscrit le</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b border-border last:border-0 hover:bg-muted/10 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-accent font-bold text-xs flex-shrink-0">
                          {u.full_name?.[0] || u.email?.[0]?.toUpperCase() || 'U'}
                        </div>
                        <span className="text-sm font-medium text-foreground">{u.full_name || '—'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">{u.email}</td>
                    <td className="px-6 py-4">
                      <span className={`jdv-badge text-xs ${STATUS_COLORS[u.account_status] || 'text-muted-foreground bg-muted/20'}`}>
                        {u.account_status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {new Date(u.created_at).toLocaleDateString('fr-FR')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function OrgsTab({ orgs }: { orgs: any[] }) {
  return (
    <div>
      <h2 className="text-2xl font-extrabold text-foreground mb-6">Gestion des organisations</h2>
      {orgs.length === 0 ? (
        <div className="jdv-card text-center py-12">
          <Building2 size={48} className="text-muted-foreground mx-auto mb-4" />
          <p className="text-lg font-bold text-foreground mb-2">0 organisation</p>
          <p className="text-muted-foreground">Aucune organisation créée sur la plateforme.</p>
        </div>
      ) : (
        <div className="jdv-card overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Organisation</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Statut</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Créée le</th>
                </tr>
              </thead>
              <tbody>
                {orgs.map((o) => (
                  <tr key={o.id} className="border-b border-border last:border-0 hover:bg-muted/10 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center text-foreground font-bold text-xs flex-shrink-0">
                          {o.name?.[0] || 'O'}
                        </div>
                        <span className="text-sm font-medium text-foreground">{o.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`jdv-badge text-xs ${STATUS_COLORS[o.org_status] || 'text-muted-foreground bg-muted/20'}`}>
                        {o.org_status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {new Date(o.created_at).toLocaleDateString('fr-FR')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function ModulesTab() {
  return (
    <div>
      <h2 className="text-2xl font-extrabold text-foreground mb-6">Gestion des modules</h2>
      <div className="jdv-card text-center py-12">
        <Grid3X3 size={48} className="text-muted-foreground mx-auto mb-4" />
        <p className="text-lg font-bold text-foreground mb-2">Gestion des modules</p>
        <p className="text-muted-foreground">La gestion avancée des modules sera disponible dans une prochaine version.</p>
        <Link href="/services" className="btn-secondary mt-6 inline-flex">
          Voir le catalogue des services
        </Link>
      </div>
    </div>
  );
}
