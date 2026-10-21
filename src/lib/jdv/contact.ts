// Coordonnées officielles de contact JDV Global Center.
// Les canaux à `null` ne sont pas affichés sur la page.
export const CONTACT: {
  email: string | null; phone: string[] | null; whatsapp: string | null;
  address: string | null; hours: string | null; socials: { label: string; url: string }[];
} = {
  email: 'centre.global.jdv@gmail.com',
  phone: [
    '+229 01 66 03 82 21',
    '+229 01 95 32 59 87',
    '+229 01 40 16 46 27',
    '+229 01 51 56 58 78',
  ],
  whatsapp: null,
  address: 'Cotonou, Bénin',
  hours: null,
  socials: [],
};
