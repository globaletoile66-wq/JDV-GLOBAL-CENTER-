'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { LayoutDashboard, User, Building2, Bell, Settings, LogOut, Search, Menu, X, ChevronDown, Grid3X3, Clock, HelpCircle, PanelLeftClose, PanelLeftOpen, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useJDV } from '@/contexts/JDVContext';
import { createClient } from '@/lib/supabase/client';
import AppLogo from '@/components/ui/AppLogo';
import { toast } from 'sonner';
import Icon from '@/components/ui/AppIcon';




interface Module {
  id: string;
  code: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  module_status: string;
  requires_subscription: boolean;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  notification_type: string;
  is_read: boolean;
  created_at: string;
}

interface Organization {
  id: string;
  name: string;
  logo_url: string | null;
  org_status: string;
}

const MODULE_STATUS_LABELS: Record<string, { label: string; color: string }> = {
  active: { label: 'Disponible', color: 'text-success bg-success/10 border-success/20' },
  development: { label: 'En développement', color: 'text-warning bg-warning/10 border-warning/20' },
  planned: { label: 'Bientôt disponible', color: 'text-info bg-info/10 border-info/20' },
  maintenance: { label: 'Maintenance', color: 'text-danger bg-danger/10 border-danger/20' },
  disabled: { label: 'Indisponible', color: 'text-muted-foreground bg-muted/20 border-border' },
};

const CATEGORY_LABELS: Record<string, string> = {
  finance: 'Finance',
  business: 'Business',
  real_estate: 'Immobilier',
  mobility: 'Mobilité',
  services: 'Services',
  education: 'Éducation',
  media: 'Médias',
  community: 'Communauté',
  ai: 'Intelligence Artificielle',
  core: 'Plateforme',
};

export default function DashboardPage() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [modules, setModules] = useState<Module[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { user, profile, signOut, loading: authLoading } = useAuth();
  const { activeOrganizationName, setActiveOrganization } = useJDV();
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login');
      return;
    }
    if (!authLoading && user && profile && !profile.onboarding_completed) {
      router.push('/onboarding');
      return;
    }
    if (user) loadDashboardData();
  }, [user, authLoading, profile]);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      const [modsResult, notifsResult, orgsResult] = await Promise.all([
        supabase.from('modules').select('*').neq('code', 'jdv_core').order('sort_order'),
        supabase.from('notifications').select('*').eq('user_id', user!.id).order('created_at', { ascending: false }).limit(5),
        supabase.from('organization_members')
          .select('organizations(id, name, logo_url, org_status)')
          .eq('user_id', user!.id)
          .eq('member_status', 'active'),
      ]);
      const mods = modsResult.data;
      const notifs = notifsResult.data;
      const orgs = orgsResult.data;
      setModules(mods || []);
      setNotifications(notifs || []);
      const unread = (notifs || []).filter((n: any) => !n.is_read).length;
      setUnreadCount(unread);
      const orgList = (orgs || []).map((m: any) => m.organizations).filter(Boolean);
      setOrganizations(orgList);
    } catch {
      // Silent fail — show empty states
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push('/');
    } catch {
      toast.error('Erreur lors de la déconnexion');
    }
  };

  const getInitials = () => {
    if (profile?.first_name && profile?.last_name) {
      return `${profile.first_name[0]}${profile.last_name[0]}`.toUpperCase();
    }
    return user?.email?.[0]?.toUpperCase() || 'U';
  };

  const getDisplayName = () => {
    if (profile?.full_name) return profile.full_name;
    if (profile?.first_name) return profile.first_name;
    return user?.email?.split('@')[0] || 'Utilisateur';
  };

  const filteredModules = modules.filter((m) =>
    !searchQuery || m.name.toLowerCase().includes(searchQuery.toLowerCase()) || m.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <AppLogo size={48} />
          <Loader2 size={24} className="animate-spin text-accent" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar */}
      <aside className={`hidden lg:flex flex-col bg-card border-r border-border sidebar-transition flex-shrink-0 ${sidebarCollapsed ? 'w-16' : 'w-64 xl:w-72'}`}>
        <SidebarContent
          collapsed={sidebarCollapsed}
          profile={profile}
          user={user}
          organizations={organizations}
          unreadCount={unreadCount}
          activeOrganizationName={activeOrganizationName}
          onSignOut={handleSignOut}
          getInitials={getInitials}
          getDisplayName={getDisplayName}
        />
      </aside>

      {/* Mobile sidebar */}
      <aside className={`fixed left-0 top-0 bottom-0 z-40 w-72 bg-card border-r border-border flex flex-col lg:hidden transition-transform duration-300 ease-in-out ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          <div className="flex items-center gap-2">
            <AppLogo size={28} />
            <span className="font-bold text-sm text-foreground">JDV Global Center</span>
          </div>
          <button onClick={() => setMobileSidebarOpen(false)} className="btn-ghost p-1.5"><X size={18} /></button>
        </div>
        <SidebarContent
          collapsed={false}
          profile={profile}
          user={user}
          organizations={organizations}
          unreadCount={unreadCount}
          activeOrganizationName={activeOrganizationName}
          onSignOut={handleSignOut}
          getInitials={getInitials}
          getDisplayName={getDisplayName}
        />
      </aside>

      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-30 bg-black/60 lg:hidden animate-fade-in" onClick={() => setMobileSidebarOpen(false)} />
      )}

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="h-14 lg:h-16 border-b border-border bg-card/80 backdrop-blur-sm flex items-center px-4 lg:px-6 gap-4 flex-shrink-0 z-20">
          <button onClick={() => setMobileSidebarOpen(true)} className="lg:hidden btn-ghost p-2" aria-label="Menu">
            <Menu size={20} />
          </button>
          <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)} className="hidden lg:flex btn-ghost p-2">
            {sidebarCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
          </button>

          <div className="flex-1 max-w-md hidden sm:flex">
            <div className="relative w-full">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="search"
                placeholder="Rechercher dans JDV..."
                className="jdv-input pl-9 py-2 text-sm h-9 w-full"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="flex-1" />

          <div className="flex items-center gap-2">
            {activeOrganizationName && (
              <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-accent/10 border border-accent/20">
                <Building2 size={13} className="text-accent" />
                <span className="text-xs font-semibold text-accent truncate max-w-32">{activeOrganizationName}</span>
              </div>
            )}

            <Link href="/notifications" className="btn-ghost p-2 relative" aria-label="Notifications">
              <Bell size={18} />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-accent text-white text-xs font-bold flex items-center justify-center" style={{ fontSize: '9px' }}>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Link>

            <div className="relative">
              <button
                onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                className="flex items-center gap-2 pl-2 btn-ghost rounded-xl"
              >
                <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                  {profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt="Avatar" className="w-full h-full rounded-full object-cover" />
                  ) : getInitials()}
                </div>
                <div className="hidden md:flex flex-col items-start leading-none">
                  <span className="text-xs font-semibold text-foreground">{getDisplayName()}</span>
                  <span className="text-xs text-muted-foreground">Compte personnel</span>
                </div>
                <ChevronDown size={13} className="text-muted-foreground hidden md:block" />
              </button>

              {profileMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-card-elevated rounded-xl border border-border shadow-xl animate-scale-in overflow-hidden z-50">
                  <div className="px-4 py-3 border-b border-border">
                    <p className="text-sm font-semibold text-foreground">{getDisplayName()}</p>
                    <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                  </div>
                  <div className="py-1">
                    <Link href="/profile" onClick={() => setProfileMenuOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors">
                      <User size={15} /> Mon profil
                    </Link>
                    <Link href="/organizations" onClick={() => setProfileMenuOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors">
                      <Building2 size={15} /> Mes organisations
                    </Link>
                    <Link href="/settings" onClick={() => setProfileMenuOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors">
                      <Settings size={15} /> Paramètres
                    </Link>
                  </div>
                  <div className="py-1 border-t border-border">
                    <button onClick={handleSignOut} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-danger hover:bg-danger/10 transition-colors">
                      <LogOut size={15} /> Déconnexion
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto scrollbar-thin p-6 lg:p-8">
          {/* Welcome */}
          <div className="mb-8">
            <h1 className="text-2xl lg:text-3xl font-extrabold text-foreground mb-1">
              Bonjour, {profile?.first_name || getDisplayName()} 👋
            </h1>
            <p className="text-muted-foreground">Bienvenue dans JDV GLOBAL CENTER. Tous vos services sont ici.</p>
          </div>

          {/* Organization context banner */}
          {activeOrganizationName && (
            <div className="mb-6 px-4 py-3 rounded-xl bg-accent/10 border border-accent/20 flex items-center gap-3">
              <Building2 size={16} className="text-accent flex-shrink-0" />
              <p className="text-sm font-medium text-foreground">
                Vous travaillez dans le contexte de : <span className="text-accent font-bold">{activeOrganizationName}</span>
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Services grid */}
            <div className="lg:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-foreground">Services JDV</h2>
                <Link href="/services" className="text-sm text-accent hover:text-accent-light font-medium transition-colors">
                  Voir tout →
                </Link>
              </div>

              {isLoading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="jdv-card h-32 animate-pulse bg-muted/20" />
                  ))}
                </div>
              ) : filteredModules.length === 0 ? (
                <div className="jdv-card text-center py-12">
                  <Grid3X3 size={32} className="text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground font-medium">Aucun service trouvé</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {filteredModules.slice(0, 9).map((mod) => {
                    const status = MODULE_STATUS_LABELS[mod.module_status] || MODULE_STATUS_LABELS.disabled;
                    const isAccessible = mod.module_status === 'active';
                    const moduleRoute = mod.code.replace('jdv_', '');
                    return (
                      <div
                        key={mod.id}
                        className={`jdv-card p-4 flex flex-col gap-3 cursor-pointer hover:border-accent/30 transition-colors ${!isAccessible ? 'opacity-70' : ''}`}
                        onClick={() => {
                          if (isAccessible) {
                            router.push(`/${moduleRoute}`);
                          } else {
                            router.push(`/coming-soon?service=${mod.code}&name=${encodeURIComponent(mod.name)}`);
                          }
                        }}
                      >
                        <div className="text-2xl">{mod.icon}</div>
                        <div className="flex-1">
                          <p className="font-bold text-sm text-foreground leading-tight">{mod.name}</p>
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{mod.description}</p>
                        </div>
                        <span className={`jdv-badge text-xs ${status.color}`}>{status.label}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Right panel */}
            <div className="flex flex-col gap-6">
              {/* Notifications */}
              <div className="jdv-card">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-foreground">Notifications</h3>
                  {unreadCount > 0 && (
                    <span className="jdv-badge bg-accent/10 text-accent border-accent/20">{unreadCount} non lues</span>
                  )}
                </div>
                {notifications.length === 0 ? (
                  <div className="text-center py-6">
                    <Bell size={24} className="text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Aucune notification</p>
                    <p className="text-xs text-muted-foreground mt-1">Commencez à utiliser les services JDV pour voir vos notifications ici.</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {notifications.map((n) => (
                      <div key={n.id} className={`px-3 py-2.5 rounded-lg border transition-colors ${n.is_read ? 'border-border bg-transparent' : 'border-accent/20 bg-accent/5'}`}>
                        <p className="text-xs font-semibold text-foreground">{n.title}</p>
                        {n.message && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p>}
                      </div>
                    ))}
                    <Link href="/notifications" className="text-xs text-accent hover:text-accent-light font-medium text-center mt-1 transition-colors">
                      Voir toutes les notifications →
                    </Link>
                  </div>
                )}
              </div>

              {/* Organizations */}
              <div className="jdv-card">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-foreground">Organisations</h3>
                  <Link href="/organizations" className="text-xs text-accent hover:text-accent-light font-medium">Gérer</Link>
                </div>
                {organizations.length === 0 ? (
                  <div className="text-center py-4">
                    <Building2 size={24} className="text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Aucune organisation</p>
                    <Link href="/organizations/create" className="text-xs text-accent hover:text-accent-light font-medium mt-2 inline-block">
                      + Créer une organisation
                    </Link>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {organizations.map((org) => (
                      <button
                        key={org.id}
                        onClick={() => setActiveOrganization(org.id, org.name)}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-border hover:border-accent/40 transition-colors text-left"
                      >
                        <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center text-accent font-bold text-xs flex-shrink-0">
                          {org.name[0]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-foreground truncate">{org.name}</p>
                          <p className="text-xs text-muted-foreground">{org.org_status === 'active' ? 'Active' : org.org_status}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Recent activity empty state */}
          <div className="mt-8 jdv-card">
            <h3 className="font-bold text-foreground mb-4">Activité récente</h3>
            <div className="text-center py-8">
              <Clock size={32} className="text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground font-medium">Aucune activité récente</p>
              <p className="text-sm text-muted-foreground mt-1">
                Commencez à utiliser les services JDV pour voir apparaître votre activité ici.
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

function SidebarContent({
  collapsed, profile, user, organizations, unreadCount, activeOrganizationName,
  onSignOut, getInitials, getDisplayName
}: any) {
  return (
    <div className="flex flex-col h-full overflow-hidden">
      {!collapsed && (
        <div className="px-4 pt-5 pb-4 border-b border-border flex items-center gap-3 flex-shrink-0">
          <AppLogo size={32} />
          <div className="flex flex-col leading-none min-w-0">
            <span className="font-extrabold text-sm tracking-tight text-foreground">JDV</span>
            <span className="text-muted-foreground tracking-widest uppercase font-medium" style={{ fontSize: '8px' }}>Global Center</span>
          </div>
        </div>
      )}
      {collapsed && (
        <div className="flex items-center justify-center py-5 border-b border-border flex-shrink-0">
          <AppLogo size={28} />
        </div>
      )}

      {!collapsed && (
        <div className="px-4 py-3 border-b border-border flex-shrink-0">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-muted/30">
            <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="Avatar" className="w-full h-full rounded-full object-cover" />
              ) : getInitials()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-foreground truncate">{getDisplayName()}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
            </div>
          </div>
        </div>
      )}

      <nav className="flex-1 overflow-y-auto scrollbar-thin px-3 py-4 flex flex-col gap-1">
        <NavLink href="/dashboard" icon={LayoutDashboard} label="Tableau de bord" collapsed={collapsed} active />
        <NavLink href="/services" icon={Grid3X3} label="Services" collapsed={collapsed} />
        <NavLink href="/notifications" icon={Bell} label="Notifications" collapsed={collapsed} badge={unreadCount} />
        <NavLink href="/profile" icon={User} label="Mon profil" collapsed={collapsed} />
        <NavLink href="/organizations" icon={Building2} label="Organisations" collapsed={collapsed} />
        <NavLink href="/settings" icon={Settings} label="Paramètres" collapsed={collapsed} />
        <NavLink href="/help" icon={HelpCircle} label="Aide" collapsed={collapsed} />
      </nav>

      <div className="px-3 py-4 border-t border-border flex-shrink-0">
        <button onClick={onSignOut} className={`nav-item w-full ${collapsed ? 'justify-center' : ''}`}>
          <LogOut size={17} className="text-danger flex-shrink-0" />
          {!collapsed && <span className="text-danger text-sm font-medium">Déconnexion</span>}
        </button>
      </div>
    </div>
  );
}

function NavLink({ href, icon: Icon, label, collapsed, active, badge }: any) {
  return (
    <Link href={href} title={collapsed ? label : undefined} className={`nav-item ${collapsed ? 'justify-center' : ''} ${active ? 'active' : ''}`}>
      <Icon size={17} className="flex-shrink-0" />
      {!collapsed && <span className="flex-1 text-sm truncate">{label}</span>}
      {!collapsed && badge > 0 && (
        <span className="ml-auto w-5 h-5 rounded-full bg-accent text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
          {badge > 9 ? '9+' : badge}
        </span>
      )}
    </Link>
  );
}
