import OperationalModuleLanding, { type OperationalModuleConfig } from '@/components/jdv/OperationalModuleLanding';

const config: OperationalModuleConfig = {
  code: 'JDV PROCUREMENT',
  title: 'Achats et fournisseurs',
  description: 'Point d’entrée pour structurer les demandes d’achat, la sélection des fournisseurs et les validations. Les commandes et engagements ne doivent être enregistrés qu’après définition des droits et du circuit d’approbation de chaque organisation.',
  scope: ['Préparer les demandes d’achat et leur justification.', 'Organiser les fournisseurs, comparatifs et validations par étape.', 'Relier les réceptions aux références de stock existantes.', 'Conserver une piste d’audit et éviter les engagements non autorisés.'],
  links: [
    { label: 'Catalogue de services', href: '/service-marketplace', description: 'Découvrir les prestations publiées par les prestataires.' },
    { label: 'JDV Marketplace', href: '/marketplace', description: 'Consulter le catalogue commercial existant.' },
    { label: 'JDV INVENTORY', href: '/inventory', description: 'Vérifier les quantités et seuils en lecture seule.' },
    { label: 'Produits et articles', href: '/business/products', description: 'Accéder au catalogue produits de l’espace Business.' },
  ],
  caution: 'Cette page ne crée ni commande ni dette fournisseur. Avant l’activation des écritures, les approbations, la séparation des organisations et les liens avec les stocks doivent être testés.',
};
export default function ProcurementPage() { return <OperationalModuleLanding config={config} />; }
