'use client';

import React, { useState } from 'react';
import { Menu, PanelLeftClose, PanelLeftOpen, Bell, Search, ChevronDown, Globe2 } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  onToggleSidebar: () => void;
  onOpenMobileSidebar: () => void;
  sidebarCollapsed: boolean;
}

export default function DashboardTopbar({ onToggleSidebar, onOpenMobileSidebar, sidebarCollapsed }: Props) {
  const [notifOpen, setNotifOpen] = useState(false);

  const handleNotifClick = () => {
    setNotifOpen(!notifOpen);
    toast.info('5 nouvelles notifications');
  };

  return (
    <header className="h-14 lg:h-16 border-b border-border bg-card/80 backdrop-blur-sm flex items-center px-4 lg:px-6 gap-4 flex-shrink-0 z-20">
      {/* Mobile menu */}
      <button
        onClick={onOpenMobileSidebar}
        className="lg:hidden btn-ghost p-2"
        aria-label="Ouvrir le menu"
      >
        <Menu size={20} />
      </button>

      {/* Desktop sidebar toggle */}
      <button
        onClick={onToggleSidebar}
        className="hidden lg:flex btn-ghost p-2"
        aria-label="Réduire la barre latérale"
      >
        {sidebarCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
      </button>

      {/* Search */}
      <div className="flex-1 max-w-md hidden sm:flex">
        <div className="relative w-full">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            placeholder="Rechercher dans JDV..."
            className="jdv-input pl-9 py-2 text-sm h-9 w-full"
          />
        </div>
      </div>

      <div className="flex-1" />

      {/* Right actions */}
      <div className="flex items-center gap-2">
        {/* Country/currency */}
        <button className="hidden md:flex btn-ghost items-center gap-1.5 text-xs font-medium">
          <Globe2 size={14} className="text-muted-foreground" />
          <span>🇧🇯 XOF</span>
        </button>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={handleNotifClick}
            className="btn-ghost p-2 relative"
            aria-label="Notifications"
          >
            <Bell size={18} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-accent border-2 border-card" />
          </button>
        </div>

        {/* User menu */}
        <button className="flex items-center gap-2 pl-2 btn-ghost rounded-xl">
          <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
            KM
          </div>
          <div className="hidden md:flex flex-col items-start leading-none">
            <span className="text-xs font-semibold text-foreground">Kofi Mensah</span>
            <span className="text-xs text-muted-foreground">Compte personnel</span>
          </div>
          <ChevronDown size={13} className="text-muted-foreground hidden md:block" />
        </button>
      </div>
    </header>
  );
}