'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import AppLogo from '@/components/ui/AppLogo';
import {
  LayoutDashboard, User, Building2, CreditCard, ShoppingBag,
  Home, Plane, Truck, Heart, GraduationCap, PiggyBank,
  Bot, Bell, Settings, LogOut, ChevronDown, ChevronRight,
  Shield, Globe2, BarChart3, Zap, X
} from 'lucide-react';

interface NavItem {
  id: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  href: string;
  badge?: number;
  active?: boolean;
  children?: NavItem[];
}

const navSections = [
  {
    id: 'section-main',
    label: 'Principal',
    items: [
      { id: 'nav-dashboard', icon: LayoutDashboard, label: 'Tableau de bord', href: '/user-dashboard', active: true },
      { id: 'nav-profile', icon: User, label: 'Mon profil', href: '#' },
      { id: 'nav-orgs', icon: Building2, label: 'Organisations', href: '#', badge: 2 },
      { id: 'nav-notifs', icon: Bell, label: 'Notifications', href: '#', badge: 5 },
    ],
  },
  {
    id: 'section-services',
    label: 'Services JDV',
    items: [
      { id: 'nav-pay', icon: CreditCard, label: 'JDV PAY', href: '/pay' },
      { id: 'nav-crm', icon: BarChart3, label: 'JDV CRM', href: '#' },
      { id: 'nav-marketplace', icon: ShoppingBag, label: 'Marketplace', href: '/marketplace' },
      { id: 'nav-immo', icon: Home, label: 'JDV IMMO', href: '#' },
      { id: 'nav-travel', icon: Plane, label: 'JDV TRAVEL', href: '#' },
      { id: 'nav-transport', icon: Truck, label: 'Transport', href: '#' },
      { id: 'nav-health', icon: Heart, label: 'JDV SANTÉ', href: '#' },
      { id: 'nav-energy', icon: Zap, label: 'JDV ENERGY', href: '#' },
      { id: 'nav-academy', icon: GraduationCap, label: 'JDV ACADEMY', href: '#' },
      { id: 'nav-tontine', icon: PiggyBank, label: 'JDV TONTINE', href: '#' },
      { id: 'nav-ai', icon: Bot, label: 'JDV IA', href: '#' },
    ],
  },
  {
    id: 'section-account',
    label: 'Compte',
    items: [
      { id: 'nav-settings', icon: Settings, label: 'Paramètres', href: '#' },
      { id: 'nav-security', icon: Shield, label: 'Sécurité', href: '#' },
      { id: 'nav-countries', icon: Globe2, label: 'Pays & Devises', href: '#' },
    ],
  },
];

interface Props {
  collapsed: boolean;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

export default function DashboardSidebar({ collapsed, mobileOpen, onMobileClose }: Props) {
  const [servicesExpanded, setServicesExpanded] = useState(true);

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={`hidden lg:flex flex-col bg-card border-r border-border sidebar-transition flex-shrink-0 ${
          collapsed ? 'w-16' : 'w-64 xl:w-72'
        }`}
      >
        <SidebarContent collapsed={collapsed} servicesExpanded={servicesExpanded} onToggleServices={() => setServicesExpanded(!servicesExpanded)} />
      </aside>

      {/* Mobile sidebar */}
      <aside
        className={`fixed left-0 top-0 bottom-0 z-40 w-72 bg-card border-r border-border flex flex-col lg:hidden transition-transform duration-300 ease-in-out ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          <div className="flex items-center gap-2">
            <AppLogo size={28} />
            <span className="font-bold text-sm text-foreground">JDV Global Center</span>
          </div>
          <button onClick={onMobileClose} className="btn-ghost p-1.5">
            <X size={18} />
          </button>
        </div>
        <SidebarContent collapsed={false} servicesExpanded={servicesExpanded} onToggleServices={() => setServicesExpanded(!servicesExpanded)} />
      </aside>
    </>
  );
}

function SidebarContent({
  collapsed,
  servicesExpanded,
  onToggleServices,
}: {
  collapsed: boolean;
  servicesExpanded: boolean;
  onToggleServices: () => void;
}) {
  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Logo */}
      {!collapsed && (
        <div className="px-4 pt-5 pb-4 border-b border-border flex items-center gap-3 flex-shrink-0">
          <AppLogo size={32} />
          <div className="flex flex-col leading-none min-w-0">
            <span className="font-extrabold text-sm tracking-tight text-foreground">JDV</span>
            <span className="text-muted-foreground tracking-widest uppercase font-medium" style={{ fontSize: '8px' }}>
              Global Center
            </span>
          </div>
        </div>
      )}
      {collapsed && (
        <div className="flex items-center justify-center py-5 border-b border-border flex-shrink-0">
          <AppLogo size={28} />
        </div>
      )}

      {/* User badge */}
      {!collapsed && (
        <div className="px-4 py-3 border-b border-border flex-shrink-0">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-muted/30">
            <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
              KM
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-foreground truncate">Kofi Mensah</p>
              <p className="text-xs text-muted-foreground truncate">kofi.mensah@jdvglobal.com</p>
            </div>
            <ChevronDown size={13} className="text-muted-foreground flex-shrink-0" />
          </div>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto scrollbar-thin px-3 py-4 flex flex-col gap-5">
        {navSections.map((section) => (
          <div key={section.id}>
            {!collapsed && (
              <p className="section-label mb-2 px-2">
                {section.label}
              </p>
            )}

            {section.id === 'section-services' && !collapsed ? (
              <div>
                <button
                  onClick={onToggleServices}
                  className="nav-item w-full justify-between"
                >
                  <span className="flex items-center gap-3 text-sm font-medium">
                    <LayoutDashboard size={17} />
                    Services JDV
                  </span>
                  {servicesExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </button>
                {servicesExpanded && (
                  <div className="mt-1 ml-2 pl-3 border-l border-border flex flex-col gap-0.5">
                    {section.items.map((item) => (
                      <NavItemRow key={item.id} item={item} collapsed={false} />
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col gap-0.5">
                {section.items.map((item) => (
                  <NavItemRow key={item.id} item={item} collapsed={collapsed} />
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>

      {/* Logout */}
      <div className="px-3 py-4 border-t border-border flex-shrink-0">
        <Link href="/" className={`nav-item ${collapsed ? 'justify-center' : ''}`}>
          <LogOut size={17} className="text-danger flex-shrink-0" />
          {!collapsed && <span className="text-danger text-sm font-medium">Déconnexion</span>}
        </Link>
      </div>
    </div>
  );
}

function NavItemRow({
  item,
  collapsed,
}: {
  item: { id: string; icon: React.ComponentType<{ size?: number; className?: string }>; label: string; href: string; badge?: number; active?: boolean };
  collapsed: boolean;
}) {
  return (
    <a
      href={item.href}
      title={collapsed ? item.label : undefined}
      className={`nav-item ${collapsed ? 'justify-center' : ''} ${item.active ? 'active' : ''}`}
    >
      <item.icon size={17} className="flex-shrink-0" />
      {!collapsed && (
        <span className="flex-1 text-sm truncate">{item.label}</span>
      )}
      {!collapsed && item.badge && item.badge > 0 ? (
        <span className="ml-auto w-5 h-5 rounded-full bg-accent text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
          {item.badge}
        </span>
      ) : null}
    </a>
  );
}