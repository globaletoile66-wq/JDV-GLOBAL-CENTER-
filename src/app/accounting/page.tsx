import OperationalModuleLanding, { type OperationalModuleConfig } from '@/components/jdv/OperationalModuleLanding';

const config: OperationalModuleConfig = {
  code: 'JDV ACCOUNTING',
  title: 'Comptabilité et pilotage financier',
  description: 'Espace de préparation au suivi des pièces comptables, rapprochements et clôtures. Les montants présentés dans cet écran ne sont pas des soldes comptables calculés : les sources et règles de rapprochement doivent être validées avant publication de chiffres.',
  scope: ['Préparer les pièces justificatives et leur classement.', 'Organiser les périodes, contrôles et tâches de clôture.', 'Rapprocher les ventes et factures des mouvements financiers confirmés.', 'Conserver JDV PAY comme source des paiements et du ledger, sans créer de comptabilité parallèle.'],
  links: [
    { label: 'Factures commerciales', href: '/business/invoices', description: 'Accéder aux factures enregistrées dans le flux commercial.' },
    { label: 'JDV PAY', href: '/pay', description: 'Consulter le module financier existant; un paiement n’est considéré encaissé qu’après confirmation vérifiée.' },
    { label: 'Rapports commerciaux', href: '/business/reports', description: 'Consulter les rapports déjà disponibles dans l’espace Business.' },
  ],
  caution: 'Aucun journal, solde, rapprochement ou clôture n’est écrit par cette page. Les écritures doivent être reliées à des sources vérifiées et protégées par organisation.',
};
export default function AccountingPage() { return <OperationalModuleLanding config={config} />; }
