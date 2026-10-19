import OperationalModuleLanding, { type OperationalModuleConfig } from '@/components/jdv/OperationalModuleLanding';

const config: OperationalModuleConfig = {
  code: 'JDV LEGAL',
  title: 'Services juridiques',
  description: 'Point d’entrée pour l’orientation juridique, le suivi des demandes et la préparation des dossiers. Les documents privés et les échanges confidentiels doivent rester soumis aux contrôles d’accès appropriés.',
  scope: ['Référencement des demandes et suivi de leur statut.', 'Orientation vers les ressources juridiques et les professionnels habilités.', 'Préparation du futur espace de dossiers avec contrôle d’accès par propriétaire et rôle.', 'Traçabilité des actions sensibles et séparation entre contenu public et documents confidentiels.'],
  links: [
    { label: 'Créer ou gérer une activité', href: '/business/create', description: 'Accéder au parcours d’enregistrement professionnel existant.' },
    { label: 'Factures et documents commerciaux', href: '/business/invoices', description: 'Retrouver le flux commercial existant sans exposer de dossier juridique privé.' },
  ],
  caution: 'Aucun dépôt de document confidentiel n’est activé ici. Il faudra vérifier les politiques de stockage privé, les rôles et l’isolation des dossiers avant de mettre en service un coffre juridique.',
};
export default function LegalPage() { return <OperationalModuleLanding config={config} />; }
