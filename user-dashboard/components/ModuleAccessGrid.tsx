'use client';

import React, { useState } from 'react';
import {
  CreditCard, BarChart3, ShoppingBag, Home, Plane, Truck, Heart,
  GraduationCap, PiggyBank, Bot, Zap, Building2, Lock
} from 'lucide-react';
import { toast } from 'sonner';

const userModules = [
  { id: 'um-pay', name: 'JDV PAY', icon: CreditCard, status: 'active', color: '#10B981', description: 'Paiements & transferts' },
  { id: 'um-crm', name: 'JDV CRM', icon: BarChart3, status: 'active', color: '#3B82F6', description: 'Gestion clients' },
  { id: 'um-business', name: 'JDV BUSINESS', icon: Building2, status: 'active', color: '#8B5CF6', description: 'Gestion entreprise' },
  { id: 'um-marketplace', name: 'MARKETPLACE', icon: ShoppingBag, status: 'development', color: '#F97316', description: 'Achat & vente' },
  { id: 'um-immo', name: 'JDV IMMO', icon: Home, status: 'planned', color: '#06B6D4', description: 'Immobilier' },
  { id: 'um-travel', name: 'JDV TRAVEL', icon: Plane, status: 'planned', color: '#F59E0B', description: 'Voyages' },
  { id: 'um-transport', name: 'TRANSPORT', icon: Truck, status: 'planned', color: '#EC4899', description: 'Logistique' },
  { id: 'um-health', name: 'JDV SANTÉ', icon: Heart, status: 'planned', color: '#EF4444', description: 'Santé & médecine' },
  { id: 'um-energy', name: 'JDV ENERGY', icon: Zap, status: 'development', color: '#EAB308', description: 'Énergie solaire' },
  { id: 'um-academy', name: 'JDV ACADEMY', icon: GraduationCap, status: 'development', color: '#A78BFA', description: 'Formation en ligne' },
  { id: 'um-tontine', name: 'JDV TONTINE', icon: PiggyBank, status: 'development', color: '#FB923C', description: 'Épargne collective' },
  { id: 'um-ai', name: 'JDV IA', icon: Bot, status: 'development', color: '#06B6D4', description: 'Intelligence artificielle' },
];

const statusConfig: Record<string, { label: string; className: string; accessible: boolean }> = {
  active: { label: 'Actif', className: 'badge-active', accessible: true },
  development: { label: 'Bientôt', className: 'badge-development', accessible: false },
  planned: { label: 'Prévu', className: 'badge-planned', accessible: false },
  maintenance: { label: 'Maintenance', className: 'badge-maintenance', accessible: false },
};

export default function ModuleAccessGrid() {
  const [filter, setFilter] = useState<'all' | 'active' | 'upcoming'>('all');

  const filtered = userModules.filter((m) => {
    if (filter === 'active') return m.status === 'active';
    if (filter === 'upcoming') return m.status !== 'active';
    return true;
  });

  const handleModuleClick = (mod: typeof userModules[0]) => {
    if (mod.status === 'active') {
      toast.success(`Ouverture de ${mod.name}...`);
    } else {
      toast.info(`${mod.name} sera disponible prochainement`);
    }
  };

  return (
    <div className="jdv-card !p-0 overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 border-b border-border">
        <div>
          <h2 className="text-base font-bold text-foreground">Mes services JDV</h2>
          <p className="text-xs text-muted-foreground mt-0.5">3 modules actifs · 9 à venir</p>
        </div>
        <div className="flex items-center gap-1 p-1 rounded-xl bg-muted/30 border border-border">
          {(['all', 'active', 'upcoming'] as const).map((f) => (
            <button
              key={`filter-${f}`}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 ${
                filter === f
                  ? 'bg-accent text-white' :'text-muted-foreground hover:text-foreground'
              }`}
            >
              {f === 'all' ? 'Tous' : f === 'active' ? 'Actifs' : 'À venir'}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="p-5">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-4 gap-3">
          {filtered.map((mod) => {
            const cfg = statusConfig[mod.status];
            return (
              <button
                key={mod.id}
                onClick={() => handleModuleClick(mod)}
                className={`relative flex flex-col items-start p-4 rounded-xl border transition-all duration-200 text-left group ${
                  cfg.accessible
                    ? 'hover:border-accent/40 hover:translate-y-[-2px] cursor-pointer'
                    : 'opacity-60 cursor-default'
                }`}
                style={{
                  background: `${mod.color}08`,
                  borderColor: `${mod.color}20`,
                }}
              >
                {!cfg.accessible && (
                  <div className="absolute top-2 right-2">
                    <Lock size={11} className="text-muted-foreground" />
                  </div>
                )}
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center mb-3"
                  style={{ background: `${mod.color}20`, border: `1px solid ${mod.color}30` }}
                >
                  <mod.icon size={18} style={{ color: mod.color }} />
                </div>
                <p className="text-xs font-bold text-foreground leading-tight mb-1">{mod.name}</p>
                <p className="text-xs text-muted-foreground leading-tight mb-2">{mod.description}</p>
                <span className={`jdv-badge ${cfg.className}`}>{cfg.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}