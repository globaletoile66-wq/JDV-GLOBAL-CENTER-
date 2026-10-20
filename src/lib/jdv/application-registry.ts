import type { LucideIcon } from 'lucide-react';
import {
  BarChart3, BriefcaseBusiness, Building2, Calculator, CalendarDays, ClipboardList,
  CreditCard, GraduationCap, HeartPulse, Home, Package, Plane, Scale, ShieldCheck,
  ShoppingBag, Sparkles, Store, Truck, UserRound, UserRoundCog, Users, Wrench,
} from 'lucide-react';

export type JDVModule = {
  id: string;
  name: string;
  description: string;
  href: `/${string}`;
  icon: LucideIcon;
  branchId?: string;
  protected: boolean;
};

/**
 * Référentiel d'accès aux modules JDV.
 * Les modules restent des applications métier distinctes : ce registre unifie
 * leur découverte et leurs métadonnées sans fusionner leurs données ni leurs routes.
 */
export const JDV_MODULES: JDVModule[] = [
  { id: 'pay', name: 'JDV PAY', description: 'Paiements, transferts et services financiers', href: '/pay', icon: CreditCard, branchId: 'jdv_pay', protected: false },
  { id: 'crm', name: 'JDV CRM', description: 'Gestion de la relation client', href: '/crm', icon: BarChart3, branchId: 'jdv_customer_service', protected: true },
  { id: 'business', name: 'JDV BUSINESS', description: 'Gestion commerciale et opérations', href: '/business', icon: Building2, protected: false },
  { id: 'marketplace', name: 'JDV MARKETPLACE', description: 'Commerce et vente en ligne', href: '/marketplace', icon: ShoppingBag, protected: false },
  { id: 'immo', name: 'JDV IMMO', description: 'Immobilier et gestion de biens', href: '/immo', icon: Home, branchId: 'jdv_immo', protected: false },
  { id: 'travel', name: 'JDV TRAVEL', description: 'Voyage, tourisme et réservation', href: '/travel', icon: Plane, branchId: 'jdv_travel', protected: false },
  { id: 'transport', name: 'JDV TRANSPORT', description: 'Transport et mobilité', href: '/transport', icon: Truck, protected: false },
  { id: 'transit', name: 'JDV TRANSIT', description: 'Transit, logistique et suivi', href: '/transit', icon: Truck, protected: false },
  { id: 'health', name: 'JDV HEALTH', description: 'Services de santé et rendez-vous', href: '/health', icon: HeartPulse, protected: true },
  { id: 'insurance', name: 'JDV INSURANCE', description: 'Assurance et gestion des demandes', href: '/insurance', icon: ShieldCheck, branchId: 'jdv_insurance', protected: false },
  { id: 'tontine', name: 'JDV TONTINE', description: 'Épargne collective et tontine', href: '/tontine', icon: CreditCard, branchId: 'jdv_tontine', protected: false },
  { id: 'agriculture', name: 'JDV AGRICULTURE', description: 'Agriculture et commercialisation', href: '/agriculture', icon: Home, protected: false },
  { id: 'energy', name: 'JDV ENERGY', description: 'Énergie et services', href: '/energy', icon: Sparkles, protected: false },
  { id: 'academy', name: 'JDV ACADEMY', description: 'Formation et apprentissage', href: '/academy', icon: GraduationCap, protected: true },
  { id: 'pub', name: 'JDV PUB', description: 'Publicité et campagnes', href: '/pub', icon: Sparkles, protected: false },
  { id: 'media', name: 'JDV MEDIA', description: 'Média et contenus', href: '/media', icon: Store, protected: false },
  { id: 'social', name: 'JDV SOCIAL', description: 'Réseau social JDV', href: '/social', icon: UserRound, protected: false },
  { id: 'ai', name: 'JDV AI', description: 'Assistant IA JDV', href: '/ai', icon: Sparkles, protected: false },
  { id: 'community', name: 'JDV COMMUNITY', description: 'Communautés et espaces collectifs', href: '/community', icon: Users, protected: false },
  { id: 'services', name: 'JDV SERVICES', description: 'Catalogue de services et prestations', href: '/service-marketplace', icon: Wrench, protected: false },
  { id: 'events', name: 'JDV EVENTS', description: 'Organisation et gestion d’événements', href: '/events', icon: CalendarDays, protected: false },
  { id: 'jobs', name: 'JDV JOBS', description: 'Offres d’emploi et recrutement', href: '/jobs', icon: BriefcaseBusiness, protected: false },
  { id: 'legal', name: 'JDV LEGAL', description: 'Ressources et services juridiques', href: '/legal', icon: Scale, branchId: 'jdv_legal', protected: false },
  { id: 'accounting', name: 'JDV ACCOUNTING', description: 'Comptabilité et clôtures financières', href: '/accounting', icon: Calculator, protected: false },
  { id: 'hr', name: 'JDV HR', description: 'Gestion des ressources humaines', href: '/hr', icon: UserRoundCog, protected: false },
  { id: 'procurement', name: 'JDV PROCUREMENT', description: 'Achats et validations fournisseurs', href: '/procurement', icon: ClipboardList, protected: false },
  { id: 'inventory', name: 'JDV INVENTORY', description: 'Stocks et traçabilité des articles', href: '/inventory', icon: Package, protected: false },
  { id: 'entertainment', name: 'JDV GLOBAL DIVERTISSEMENT', description: 'Contenus, événements et expériences culturelles', href: '/entertainment', icon: Sparkles, branchId: 'jdv_entertainment', protected: false },
  { id: 'admin', name: 'JDV ADMIN', description: 'Gouvernance, accès et configuration', href: '/admin', icon: ShieldCheck, branchId: 'jdv_admin', protected: false },
];

export const getJDVModuleById = (id: string) => JDV_MODULES.find((module) => module.id === id);
