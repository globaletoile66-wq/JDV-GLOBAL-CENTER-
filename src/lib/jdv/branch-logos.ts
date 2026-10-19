/**
 * Identité visuelle des branches JDV Global Center.
 *
 * Les chemins ci-dessous sont les destinations canoniques des fichiers originaux
 * fournis le 19 octobre 2026. Les fichiers binaires doivent être présents dans
 * public/assets/branches/ pour que les images s'affichent.
 *
 * Les logos JDV Academy et JDV Santé sont volontairement différés.
 */
export type JdvBranchLogo = {
  id: string;
  label: string;
  src: string;
  alt: string;
  href?: string;
};

const asset = (filename: string) => `/assets/branches/${filename}`;

export const JDV_BRANCH_LOGOS: JdvBranchLogo[] = [
  { id: 'jdv_insurance', label: 'JDV Global Assurance', src: asset('jdv-global-assurance.png'), alt: 'Logo JDV Global Assurance', href: '/insurance' },
  { id: 'jdv_legal', label: 'JDV Légal', src: asset('jdv-legal.png'), alt: 'Logo JDV Légal — consultation, conseil et litige', href: '/legal' },
  { id: 'jdv_admin', label: 'JDV Admin', src: asset('jdv-admin.png'), alt: 'Logo JDV Admin', href: '/admin' },
  { id: 'jdv_customer_service', label: 'JDV Gestion Clientèle', src: asset('jdv-gestion-clientele.png'), alt: 'Logo JDV Gestion Clientèle', href: '/crm' },
  { id: 'jdv_tontine', label: 'JDV Tontine', src: asset('jdv-tontine.png'), alt: 'Logo JDV Tontine', href: '/tontine' },
  { id: 'jdv_entertainment', label: 'JDV Global Divertissement', src: asset('jdv-global-divertissement.png'), alt: 'Logo JDV Global Divertissement', href: '/entertainment' },
  { id: 'jdv_travel', label: 'JDV Voyage', src: asset('jdv-voyage.png'), alt: 'Logo JDV Voyage', href: '/travel' },
  { id: 'jdv_immo', label: 'JDV Immo', src: asset('jdv-immo.png'), alt: 'Logo JDV Immo', href: '/immo' },
  { id: 'jdv_pay', label: 'JDV Pay', src: asset('jdv-pay.png'), alt: 'Logo JDV Pay', href: '/pay' },
];

export const getJdvBranchLogo = (id: string) =>
  JDV_BRANCH_LOGOS.find((logo) => logo.id === id);
