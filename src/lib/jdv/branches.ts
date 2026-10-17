// Nom affichable de chaque branche (code du module => nom).
export const BRANCH_NAMES: Record<string, string> = {
  jdv_pay: 'JDV PAY', jdv_crm: 'JDV CRM', jdv_business: 'JDV BUSINESS', jdv_marketplace: 'JDV MARKET', jdv_pub: 'JDV PUB',
  jdv_immo: 'JDV IMMO', jdv_travel: 'JDV TRAVEL', jdv_transport: 'JDV TRANSPORT', jdv_transit: 'JDV TRANSIT', jdv_health: 'JDV HEALTH',
  jdv_agriculture: 'JDV AGRI', jdv_academy: 'JDV ACADEMY', jdv_energy: 'JDV ENERGY', jdv_ai: 'JDV AI', jdv_media: 'JDV MEDIA',
  jdv_social: 'JDV SOCIAL', jdv_insurance: 'JDV INSURANCE', jdv_tontine: 'JDV TONTINE', jdv_core: 'JDV CORE',
};
export const branchName = (code: string) => BRANCH_NAMES[code] ?? code.replace(/^jdv_/, 'JDV ').toUpperCase();
