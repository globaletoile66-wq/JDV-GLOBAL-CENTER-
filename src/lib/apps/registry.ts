export interface JDVApplication {
  key: string;
  name: string;
  homePath: string;
  description: string;
}

/**
 * Canonical application keys used by registration, memberships and settings.
 * A shared JDV identity never implies membership in every application.
 */
export const JDV_APPLICATIONS: JDVApplication[] = [
  { key: 'global_center', name: 'JDV Global Center', homePath: '/user-dashboard', description: 'Gérer votre identité et votre espace central JDV.' },
  { key: 'marketplace', name: 'JDV Marketplace', homePath: '/marketplace', description: 'Acheter, vendre et gérer une boutique.' },
  { key: 'agriculture', name: 'JDV Agriculture', homePath: '/agriculture', description: 'Découvrir les produits et services agricoles.' },
  { key: 'immo', name: 'JDV Immo', homePath: '/immo', description: 'Explorer les biens et services immobiliers.' },
  { key: 'health', name: 'JDV Santé', homePath: '/health', description: 'Trouver des professionnels et services de santé.' },
  { key: 'academy', name: 'JDV Academy', homePath: '/academy', description: 'Découvrir les formations et parcours.' },
  { key: 'social', name: 'JDV Social', homePath: '/social', description: 'Découvrir les communautés et contenus.' },
  { key: 'media', name: 'JDV Media', homePath: '/media', description: 'Découvrir les contenus et productions.' },
  { key: 'pub', name: 'JDV Pub', homePath: '/pub', description: 'Créer et gérer des campagnes publicitaires.' },
  { key: 'pay', name: 'JDV Pay', homePath: '/pay', description: 'Accéder aux services de paiement autorisés.' },
  { key: 'tontine', name: 'JDV Tontine', homePath: '/tontine', description: 'Découvrir les tontines et leurs règles.' },
  { key: 'travel', name: 'JDV Travel', homePath: '/travel', description: 'Explorer les offres et services de voyage.' },
  { key: 'transport', name: 'JDV Transport', homePath: '/transport', description: 'Découvrir les offres de transport.' },
  { key: 'insurance', name: 'JDV Assurance', homePath: '/insurance', description: 'Gérer les services et contrats d’assurance.' },
  { key: 'legal', name: 'JDV Légal', homePath: '/legal', description: 'Découvrir les services juridiques, consultations et documents.' },
  { key: 'energy', name: 'JDV Énergie', homePath: '/energy', description: 'Découvrir les offres énergétiques.' },
  { key: 'ai', name: 'JDV AI', homePath: '/ai', description: 'Découvrir les outils d’assistance et de productivité.' },
  { key: 'business', name: 'JDV Business', homePath: '/business', description: 'Gérer les activités professionnelles.' },
  { key: 'transit', name: 'JDV Transit', homePath: '/transit', description: 'Accéder aux services de transit.' },
  { key: 'services', name: 'JDV Services', homePath: '/services', description: 'Explorer les services proposés.' },
  { key: 'procurement', name: 'JDV Procurement', homePath: '/procurement', description: 'Gérer les demandes et achats professionnels.' },
  { key: 'accounting', name: 'JDV Comptabilité', homePath: '/accounting', description: 'Accéder aux outils de gestion comptable.' },
  { key: 'inventory', name: 'JDV Stock', homePath: '/inventory', description: 'Gérer les stocks et inventaires.' },
  { key: 'hr', name: 'JDV RH', homePath: '/hr', description: 'Accéder aux outils de ressources humaines.' },
  { key: 'jobs', name: 'JDV Emploi', homePath: '/jobs', description: 'Découvrir les offres et services emploi.' },
  { key: 'entertainment', name: 'JDV Divertissement', homePath: '/entertainment', description: 'Explorer les contenus de divertissement.' },
];

export function getJDVApplication(key: string | undefined) {
  return JDV_APPLICATIONS.find((app) => app.key === key) ?? null;
}

export function getJDVApplicationHome(key: string | undefined) {
  return getJDVApplication(key)?.homePath ?? '/';
}
