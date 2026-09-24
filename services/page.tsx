'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, Star, StarOff, ArrowLeft, Grid3X3 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import AppLogo from '@/components/ui/AppLogo';
import { toast } from 'sonner';

interface Module {
  id: string;
  code: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  module_status: string;
  requires_subscription: boolean;
  sort_order: number;
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  active: { label: 'Disponible', color: 'text-success bg-success/10 border-success/20' },
  development: { label: 'En développement', color: 'text-warning bg-warning/10 border-warning/20' },
  planned: { label: 'Bientôt disponible', color: 'text-info bg-info/10 border-info/20' },
  maintenance: { label: 'Maintenance', color: 'text-danger bg-danger/10 border-danger/20' },
  disabled: { label: 'Indisponible', color: 'text-muted-foreground bg-muted/20 border-border' },
};

const CATEGORIES: Record<string, string> = {
  all: 'Tous',
  finance: 'Finance',
  business: 'Business',
  real_estate: 'Immobilier',
  mobility: 'Mobilité',
  services: 'Services',
  education: 'Éducation',
  media: 'Médias',
  community: 'Communauté',
  ai: 'IA',
};

export default function ServicesPage() {
  const [modules, setModules] = useState<Module[]>([]);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [activeStatus, setActiveStatus] = useState('all');
  const { user } = useAuth();
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    loadModules();
    if (user) loadFavorites();
  }, [user]);

  const loadModules = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('modules')
        .select('*')
        .neq('code', 'jdv_core')
        .order('sort_order');
      if (!error) setModules(data || []);
    } catch {
      // Silent fail
    } finally {
      setIsLoading(false);
    }
  };

  const loadFavorites = async () => {
    if (!user) return;
    try {
      const { data } = await supabase
        .from('user_favorites')
        .select('module_id')
        .eq('user_id', user.id);
      setFavorites(new Set((data || []).map((f: any) => f.module_id)));
    } catch {}
  };

  const toggleFavorite = async (moduleId: string) => {
    if (!user) {
      router.push('/auth/login');
      return;
    }
    const isFav = favorites.has(moduleId);
    try {
      if (isFav) {
        await supabase.from('user_favorites').delete().eq('user_id', user.id).eq('module_id', moduleId);
        setFavorites((prev) => { const n = new Set(prev); n.delete(moduleId); return n; });
      } else {
        await supabase.from('user_favorites').insert({ user_id: user.id, module_id: moduleId });
        setFavorites((prev) => new Set([...prev, moduleId]));
      }
    } catch {
      toast.error('Erreur lors de la mise à jour des favoris');
    }
  };

  const handleModuleClick = (mod: Module) => {
    if (mod.module_status === 'active') {
      router.push(`/${mod.code.replace('jdv_', '')}`);
    } else if (mod.module_status === 'maintenance') {
      router.push(`/maintenance?service=${mod.code}&name=${encodeURIComponent(mod.name)}`);
    } else {
      router.push(`/coming-soon?service=${mod.code}&name=${encodeURIComponent(mod.name)}`);
    }
  };

  const filtered = modules.filter((m) => {
    const matchSearch = !searchQuery || m.name.toLowerCase().includes(searchQuery.toLowerCase()) || m.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchCategory = activeCategory === 'all' || m.category === activeCategory;
    const matchStatus = activeStatus === 'all' || m.module_status === activeStatus;
    return matchSearch && matchCategory && matchStatus;
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center gap-4">
          <Link href="/dashboard" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft size={15} />
            <span className="hidden sm:block">Dashboard</span>
          </Link>
          <div className="flex items-center gap-2 flex-1">
            <AppLogo size={28} />
            <span className="font-bold text-sm text-foreground hidden sm:block">JDV GLOBAL CENTER</span>
            <span className="text-muted-foreground hidden sm:block">›</span>
            <span className="font-semibold text-sm text-foreground">Services</span>
          </div>
          {user && (
            <Link href="/dashboard" className="btn-ghost text-sm">
              Mon espace
            </Link>
          )}
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Title */}
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-foreground mb-2">Catalogue des services JDV</h1>
          <p className="text-muted-foreground">Découvrez tous les services de l'écosystème JDV GLOBAL CENTER</p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1 max-w-md">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              placeholder="Rechercher un service..."
              className="jdv-input pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <select
            className="jdv-input max-w-48"
            value={activeStatus}
            onChange={(e) => setActiveStatus(e.target.value)}
          >
            <option value="all">Tous les statuts</option>
            <option value="active">Disponible</option>
            <option value="development">En développement</option>
            <option value="planned">Bientôt disponible</option>
            <option value="maintenance">Maintenance</option>
          </select>
        </div>

        {/* Category tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-8 scrollbar-thin">
          {Object.entries(CATEGORIES).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setActiveCategory(key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-150 flex-shrink-0 ${
                activeCategory === key
                  ? 'bg-accent text-white' :'bg-card border border-border text-muted-foreground hover:text-foreground hover:border-accent/40'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Modules grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="jdv-card h-48 animate-pulse bg-muted/20" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <Grid3X3 size={48} className="text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-bold text-foreground mb-2">Aucun service trouvé</h3>
            <p className="text-muted-foreground">Modifiez vos filtres pour voir plus de services.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filtered.map((mod) => {
              const status = STATUS_CONFIG[mod.module_status] || STATUS_CONFIG.disabled;
              const isFav = favorites.has(mod.id);
              const isAccessible = mod.module_status === 'active';
              return (
                <div key={mod.id} className="jdv-card flex flex-col gap-4 relative group">
                  {/* Favorite button */}
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleFavorite(mod.id); }}
                    className="absolute top-4 right-4 btn-ghost p-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label={isFav ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                  >
                    {isFav ? <Star size={15} className="text-accent fill-accent" /> : <StarOff size={15} className="text-muted-foreground" />}
                  </button>

                  <div className="text-3xl">{mod.icon}</div>
                  <div className="flex-1">
                    <h3 className="font-bold text-foreground mb-1">{mod.name}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-3">{mod.description}</p>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className={`jdv-badge text-xs border ${status.color}`}>{status.label}</span>
                    <button
                      onClick={() => handleModuleClick(mod)}
                      className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-all duration-150 ${
                        isAccessible
                          ? 'bg-accent text-white hover:bg-accent-dark' :'bg-muted/30 text-muted-foreground hover:bg-muted/50'
                      }`}
                    >
                      {isAccessible ? 'Ouvrir →' : 'Voir →'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
