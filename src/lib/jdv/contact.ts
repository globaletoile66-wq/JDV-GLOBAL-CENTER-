// MOYENS DE CONTACT : renseignez vos coordonnées réelles. Un canal à `null` n'est pas affiché sur la page.
export const CONTACT: {
  email: string | null; phone: string | null; whatsapp: string | null;
  address: string | null; hours: string | null; socials: { label: string; url: string }[];
} = {
  email: null,       // ex. 'contact@votre-domaine.com'
  phone: null,       // ex. '+229 00 00 00 00'
  whatsapp: null,    // numéro au format international sans espaces, ex. '22900000000'
  address: null,     // ex. 'Porto-Novo, Bénin'
  hours: null,       // ex. 'Lundi au vendredi, 8 h à 18 h'
  socials: [],       // ex. [{ label: 'Facebook', url: 'https://facebook.com/...' }]
};
