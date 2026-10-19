import OperationalModuleLanding, { type OperationalModuleConfig } from '@/components/jdv/OperationalModuleLanding';

const config: OperationalModuleConfig = {
  code: 'JDV HR',
  title: 'Ressources humaines',
  description: 'Espace de préparation à la gestion des collaborateurs, des équipes et des processus RH. Les informations personnelles et contractuelles ne doivent pas être confondues avec les candidatures publiques de JDV JOBS.',
  scope: ['Préparer les profils collaborateurs et l’affectation aux équipes.', 'Séparer les dossiers RH confidentiels des offres et candidatures publiques.', 'Prévoir des permissions par organisation et par fonction.', 'Tracer les changements sensibles et limiter l’accès aux données personnelles.'],
  links: [
    { label: 'JDV JOBS', href: '/jobs', description: 'Consulter les offres et le parcours de candidature public.' },
    { label: 'Équipe Business', href: '/business/team', description: 'Accéder à la gestion d’équipe existante, sans exposer de dossiers RH privés.' },
    { label: 'Espace entreprise', href: '/dashboard', description: 'Retrouver les outils disponibles pour le compte connecté.' },
  ],
  caution: 'Aucun dossier RH, contrat, salaire ni document personnel n’est lu ou écrit ici. Leur activation exige un schéma dédié et des tests d’isolation des données par organisation.',
};
export default function HrPage() { return <OperationalModuleLanding config={config} />; }
