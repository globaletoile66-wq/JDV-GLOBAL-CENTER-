// Pages réellement construites pour chaque branche. Une branche absente de cette liste mène à « Bientôt disponible »,
// même si son état en base est « active » : à mettre à jour au fil des livraisons.
export const BUILT_ROUTES: Record<string, string> = {
  jdv_crm: '/crm',
  jdv_pay: '/pay',
  jdv_business: '/business',
  jdv_marketplace: '/marketplace',
};
export const routeFor = (code: string): string | null => BUILT_ROUTES[code] ?? null;
export const comingSoonHref = (code: string, name: string) => `/coming-soon?service=${code}&name=${encodeURIComponent(name)}`;
