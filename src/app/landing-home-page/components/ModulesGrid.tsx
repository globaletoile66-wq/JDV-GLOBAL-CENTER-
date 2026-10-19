import React from 'react';
import Link from 'next/link';
import {
  CreditCard, Building2, ShoppingBag, Home, Plane,
  Truck, Ship, Heart, Shield, Leaf, Zap, GraduationCap,
  PiggyBank, Megaphone, Tv, Users, Bot, BarChart3, Wrench, CalendarDays,
  BriefcaseBusiness, Scale, Calculator, UserRoundCog, ClipboardList, Package
} from 'lucide-react';

const modules = [
  {
    id: 'mod-pay',
    code: 'jdv_pay',
    name: 'JDV PAY',
    description: 'Paiements, transferts et portefeuille numérique international',
    icon: CreditCard,
    status: 'active',
    color: '#10B981',
    accent: 'rgba(16, 185, 129, 0.1)',
    border: 'rgba(16, 185, 129, 0.25)',
  },
  {
    id: 'mod-crm',
    code: 'jdv_crm',
    name: 'JDV CRM',
    description: 'Gestion de la relation client pour entreprises et commerces',
    icon: BarChart3,
    status: 'active',
    color: '#3B82F6',
    accent: 'rgba(59, 130, 246, 0.1)',
    border: 'rgba(59, 130, 246, 0.25)',
  },
  {
    id: 'mod-business',
    code: 'jdv_business',
    name: 'JDV BUSINESS',
    description: 'Outils de gestion, facturation et comptabilité pour PME',
    icon: Building2,
    status: 'active',
    color: '#8B5CF6',
    accent: 'rgba(139, 92, 246, 0.1)',
    border: 'rgba(139, 92, 246, 0.25)',
  },
  {
    id: 'mod-marketplace',
    code: 'jdv_marketplace',
    name: 'JDV MARKETPLACE',
    description: 'Place de marché pour achat et vente de produits et services',
    icon: ShoppingBag,
    status: 'active',
    color: '#F97316',
    accent: 'rgba(249, 115, 22, 0.1)',
    border: 'rgba(249, 115, 22, 0.25)',
  },
  {
    id: 'mod-immo',
    code: 'jdv_immo',
    name: 'JDV IMMO',
    description: 'Immobilier : achat, vente, location et gestion de biens',
    icon: Home,
    status: 'active',
    color: '#06B6D4',
    accent: 'rgba(6, 182, 212, 0.1)',
    border: 'rgba(6, 182, 212, 0.25)',
  },
  {
    id: 'mod-travel',
    code: 'jdv_travel',
    name: 'JDV TRAVEL',
    description: 'Réservation de voyages, hôtels et services touristiques',
    icon: Plane,
    status: 'active',
    color: '#F59E0B',
    accent: 'rgba(245, 158, 11, 0.1)',
    border: 'rgba(245, 158, 11, 0.25)',
  },
  {
    id: 'mod-transport',
    code: 'jdv_transport',
    name: 'JDV TRANSPORT',
    description: 'Logistique, livraison et transport de marchandises',
    icon: Truck,
    status: 'planned',
    color: '#EC4899',
    accent: 'rgba(236, 72, 153, 0.1)',
    border: 'rgba(236, 72, 153, 0.25)',
  },
  {
    id: 'mod-transit',
    code: 'jdv_transit',
    name: 'JDV TRANSIT',
    description: 'Dédouanement, transit et import/export international',
    icon: Ship,
    status: 'planned',
    color: '#14B8A6',
    accent: 'rgba(20, 184, 166, 0.1)',
    border: 'rgba(20, 184, 166, 0.25)',
  },
  {
    id: 'mod-health',
    code: 'jdv_health',
    name: 'JDV SANTÉ',
    description: 'Services de santé, télémédecine et gestion médicale',
    icon: Heart,
    status: 'planned',
    color: '#EF4444',
    accent: 'rgba(239, 68, 68, 0.1)',
    border: 'rgba(239, 68, 68, 0.25)',
  },
  {
    id: 'mod-insurance',
    code: 'jdv_insurance',
    name: 'JDV ASSURANCE',
    description: 'Produits d\'assurance vie, santé, auto et habitation',
    icon: Shield,
    status: 'planned',
    color: '#6366F1',
    accent: 'rgba(99, 102, 241, 0.1)',
    border: 'rgba(99, 102, 241, 0.25)',
  },
  {
    id: 'mod-agri',
    code: 'jdv_agriculture',
    name: 'JDV AGRICULTURE',
    description: 'Solutions numériques pour le secteur agricole africain',
    icon: Leaf,
    status: 'planned',
    color: '#22C55E',
    accent: 'rgba(34, 197, 94, 0.1)',
    border: 'rgba(34, 197, 94, 0.25)',
  },
  {
    id: 'mod-energy',
    code: 'jdv_energy',
    name: 'JDV ENERGY',
    description: 'Énergie solaire, renouvelable et gestion de consommation',
    icon: Zap,
    status: 'development',
    color: '#EAB308',
    accent: 'rgba(234, 179, 8, 0.1)',
    border: 'rgba(234, 179, 8, 0.25)',
  },
  {
    id: 'mod-academy',
    code: 'jdv_academy',
    name: 'JDV ACADEMY',
    description: 'Formation en ligne, certifications et développement professionnel',
    icon: GraduationCap,
    status: 'development',
    color: '#A78BFA',
    accent: 'rgba(167, 139, 250, 0.1)',
    border: 'rgba(167, 139, 250, 0.25)',
  },
  {
    id: 'mod-tontine',
    code: 'jdv_tontine',
    name: 'JDV TONTINE',
    description: 'Épargne collective numérique et finance solidaire',
    icon: PiggyBank,
    status: 'development',
    color: '#FB923C',
    accent: 'rgba(251, 146, 60, 0.1)',
    border: 'rgba(251, 146, 60, 0.25)',
  },
  {
    id: 'mod-pub',
    code: 'jdv_pub',
    name: 'JDV PUB',
    description: 'Publicité numérique et marketing ciblé en Afrique',
    icon: Megaphone,
    status: 'planned',
    color: '#F43F5E',
    accent: 'rgba(244, 63, 94, 0.1)',
    border: 'rgba(244, 63, 94, 0.25)',
  },
  {
    id: 'mod-media',
    code: 'jdv_media',
    name: 'JDV MEDIA',
    description: 'Contenus médias, streaming et information africaine',
    icon: Tv,
    status: 'planned',
    color: '#0EA5E9',
    accent: 'rgba(14, 165, 233, 0.1)',
    border: 'rgba(14, 165, 233, 0.25)',
  },
  {
    id: 'mod-social',
    code: 'jdv_social',
    name: 'JDV SOCIAL',
    description: 'Réseau social professionnel et communautaire JDV',
    icon: Users,
    status: 'planned',
    color: '#7C3AED',
    accent: 'rgba(124, 58, 237, 0.1)',
    border: 'rgba(124, 58, 237, 0.25)',
  },
  {
    id: 'mod-ai',
    code: 'jdv_ai',
    name: 'JDV IA',
    description: 'Intelligence artificielle, automatisation et assistance JDV',
    icon: Bot,
    status: 'development',
    color: '#06B6D4',
    accent: 'rgba(6, 182, 212, 0.1)',
    border: 'rgba(6, 182, 212, 0.25)',
  },
  {
    id: 'mod-community',
    code: 'jdv_community',
    name: 'JDV COMMUNITY',
    description: 'Espaces communautaires et animation des communautés JDV',
    icon: Users,
    status: 'planned',
    color: '#7C3AED',
    accent: 'rgba(124, 58, 237, 0.1)',
    border: 'rgba(124, 58, 237, 0.25)',
  },
  {
    id: 'mod-services',
    code: 'jdv_services',
    name: 'JDV SERVICES',
    description: 'Catalogue de services et demandes de prestations',
    icon: Wrench,
    status: 'planned',
    color: '#0F766E',
    accent: 'rgba(15, 118, 110, 0.1)',
    border: 'rgba(15, 118, 110, 0.25)',
  },
  {
    id: 'mod-events',
    code: 'jdv_events',
    name: 'JDV EVENTS',
    description: 'Organisation et gestion d’événements',
    icon: CalendarDays,
    status: 'planned',
    color: '#DB2777',
    accent: 'rgba(219, 39, 119, 0.1)',
    border: 'rgba(219, 39, 119, 0.25)',
  },
  {
    id: 'mod-jobs',
    code: 'jdv_jobs',
    name: 'JDV JOBS',
    description: 'Offres d’emploi, candidatures et recrutement',
    icon: BriefcaseBusiness,
    status: 'planned',
    color: '#1D4ED8',
    accent: 'rgba(29, 78, 216, 0.1)',
    border: 'rgba(29, 78, 216, 0.25)',
  },
  {
    id: 'mod-legal',
    code: 'jdv_legal',
    name: 'JDV LEGAL',
    description: 'Services et ressources juridiques',
    icon: Scale,
    status: 'planned',
    color: '#92400E',
    accent: 'rgba(146, 64, 14, 0.1)',
    border: 'rgba(146, 64, 14, 0.25)',
  },
  {
    id: 'mod-accounting',
    code: 'jdv_accounting',
    name: 'JDV ACCOUNTING',
    description: 'Comptabilité, écritures et clôtures financières',
    icon: Calculator,
    status: 'planned',
    color: '#047857',
    accent: 'rgba(4, 120, 87, 0.1)',
    border: 'rgba(4, 120, 87, 0.25)',
  },
  {
    id: 'mod-hr',
    code: 'jdv_hr',
    name: 'JDV HR',
    description: 'Gestion des ressources humaines',
    icon: UserRoundCog,
    status: 'planned',
    color: '#6D28D9',
    accent: 'rgba(109, 40, 217, 0.1)',
    border: 'rgba(109, 40, 217, 0.25)',
  },
  {
    id: 'mod-procurement',
    code: 'jdv_procurement',
    name: 'JDV PROCUREMENT',
    description: 'Achats, demandes et validations fournisseurs',
    icon: ClipboardList,
    status: 'planned',
    color: '#B45309',
    accent: 'rgba(180, 83, 9, 0.1)',
    border: 'rgba(180, 83, 9, 0.25)',
  },
  {
    id: 'mod-inventory',
    code: 'jdv_inventory',
    name: 'JDV INVENTORY',
    description: 'Stocks, mouvements et traçabilité des articles',
    icon: Package,
    status: 'planned',
    color: '#0369A1',
    accent: 'rgba(3, 105, 161, 0.1)',
    border: 'rgba(3, 105, 161, 0.25)',
  },
]; 

const moduleRoutes: Record<string, string> = {
  jdv_pay: '/pay',
  jdv_crm: '/crm',
  jdv_business: '/business',
  jdv_marketplace: '/marketplace',
  jdv_immo: '/immo',
  jdv_travel: '/travel',
  jdv_transport: '/transport',
  jdv_transit: '/transit',
  jdv_health: '/health',
  jdv_insurance: '/insurance',
  jdv_agriculture: '/agriculture',
  jdv_energy: '/energy',
  jdv_academy: '/academy',
  jdv_tontine: '/tontine',
  jdv_pub: '/pub',
  jdv_media: '/media',
  jdv_social: '/social',
  jdv_ai: '/ai',
  jdv_community: '/community',
  jdv_inventory: '/inventory',
  jdv_services: '/service-marketplace',
  jdv_events: '/events',
  jdv_jobs: '/jobs',
  jdv_legal: '/legal',
  jdv_accounting: '/accounting',
  jdv_hr: '/hr',
  jdv_procurement: '/procurement',
};

const statusLabels: Record<string, string> = {
  active: 'Actif',
  development: 'En développement',
  planned: 'Prévu',
  maintenance: 'Maintenance',
  disabled: 'Désactivé',
};

const statusClasses: Record<string, string> = {
  active: 'badge-active',
  development: 'badge-development',
  planned: 'badge-planned',
  maintenance: 'badge-maintenance',
  disabled: 'badge-disabled',
};

export default function ModulesGrid() {
  return (
    <section id="services" className="py-24 lg:py-32 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="blob-primary absolute w-[500px] h-[500px] top-1/2 left-0 -translate-y-1/2 opacity-20" />
      </div>

      <div className="relative z-10 max-w-screen-2xl mx-auto px-6 lg:px-8 xl:px-10 2xl:px-16">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/30 border border-primary-light/30 text-secondary-foreground text-xs font-semibold tracking-widest uppercase mb-6">
            Services JDV
          </div>
          <h2 className="text-hero-lg text-foreground mb-4 max-w-3xl mx-auto">
            Un écosystème complet,{' '}
            <span className="text-transparent bg-clip-text" style={{ backgroundImage: 'linear-gradient(135deg, var(--accent) 0%, var(--accent-light) 100%)' }}>
              pensé pour vous
            </span>
          </h2>
          <p className="text-muted-foreground text-base lg:text-lg max-w-2xl mx-auto leading-relaxed">
            Chaque service JDV est conçu pour fonctionner ensemble, vous offrant
            une expérience unifiée à travers tous vos besoins numériques.
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6 gap-4">
          {modules.map((mod) => (
            <Link
              key={mod.id}
              href={moduleRoutes[mod.code] ?? `/coming-soon?name=${encodeURIComponent(mod.name)}`}
              aria-label={`Ouvrir ${mod.name}`}
              className="jdv-card group cursor-pointer relative overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              style={{
                background: mod.accent,
                borderColor: mod.border,
                textDecoration: 'none',
              }}
            >
              {/* Shine overlay */}
              <div className="absolute inset-0 bg-card-shine opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

              <div className="relative z-10">
                <div className="flex items-start justify-between mb-4">
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: `${mod.color}20`, border: `1px solid ${mod.color}30` }}
                  >
                    <mod.icon size={20} style={{ color: mod.color }} />
                  </div>
                  <span className={`jdv-badge ${statusClasses[mod.status]}`}>
                    {statusLabels[mod.status]}
                  </span>
                </div>

                <h3 className="font-bold text-sm text-foreground mb-1.5 tracking-tight">
                  {mod.name}
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                  {mod.description}
                </p>
              </div>
            </Link>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center mt-12">
          <p className="text-muted-foreground text-sm mb-4">
            Accédez à tous les services avec un seul compte JDV
          </p>
          <a href="/sign-up-login-screen" className="btn-primary inline-flex">
            Créer mon compte
          </a>
        </div>
      </div>
    </section>
  );
}