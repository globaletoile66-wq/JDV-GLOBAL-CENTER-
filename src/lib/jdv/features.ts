import type { PoleStatus } from './poles';
// Fonctionnalités du projet, avec leur état réel. Mettez à jour `status` au fur et à mesure.
export const FEATURES: { icon: string; title: string; text: string; status: PoleStatus }[] = [
  { icon: '📇', title: 'Gestion commerciale (JDV CRM)', text: 'Prospects, visites, relances, ventes, clients, stock, fournisseurs, commissions et rapports dans un seul espace.', status: 'live' },
  { icon: '👥', title: 'Équipes et accès par rôle', text: 'Administrateurs, prospecteurs, entrepôts : chacun voit uniquement ce qui le concerne.', status: 'live' },
  { icon: '🔒', title: 'Données cloisonnées et tracées', text: 'Chaque utilisateur et chaque organisation n’accèdent qu’à leurs propres données ; les actions sensibles laissent une trace.', status: 'live' },
  { icon: '💳', title: 'Portefeuille multi-devises', text: 'Un portefeuille par devise (10 devises configurées), transferts entre utilisateurs, suivi de l’historique.', status: 'building' },
  { icon: '🤝', title: 'Tontines', text: 'Groupes d’épargne avec cotisations, tours de versement et suivi transparent pour tous les membres.', status: 'building' },
  { icon: '🤖', title: 'Assistant IA', text: 'Posez vos questions et soyez orienté vers la bonne branche.', status: 'building' },
  { icon: '🛒', title: 'Marketplace', text: 'Boutiques, annonces, commandes, livraisons et avis.', status: 'planned' },
  { icon: '🌍', title: 'Multi-pays, multi-devises, multilingue', text: '15 pays, 10 devises et 5 langues déjà configurés pour s’adapter à votre région.', status: 'live' },
];
