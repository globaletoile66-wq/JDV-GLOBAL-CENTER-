export type SharedServiceArea = {
  id: 'identity' | 'authorization' | 'notifications' | 'documents' | 'payments';
  name: string;
  purpose: string;
  currentEvidence: string;
  integrationRule: string;
  status: 'shared-foundation' | 'audit-required' | 'domain-owned';
};

/**
 * Carte d'architecture, pas une promesse d'implémentation.
 * Les statuts décrivent ce qui est vérifié dans le code commun et ce qui reste
 * à auditer avant d'en faire un service transversal.
 */
export const JDV_SHARED_SERVICE_AREAS: SharedServiceArea[] = [
  {
    id: 'identity',
    name: 'Identité et session',
    purpose: 'Connexion, session et profil de base',
    currentEvidence: 'AuthContext et clients Supabase SSR navigateur/serveur existent.',
    integrationRule: 'Réutiliser le contexte d’identité; garder les profils métier et les données propres à chaque domaine.',
    status: 'shared-foundation',
  },
  {
    id: 'authorization',
    name: 'Autorisations',
    purpose: 'Contrôler l’accès à chaque opération et ressource',
    currentEvidence: 'Le contexte vérifie is_super_admin et la route /admin fait un contrôle serveur supplémentaire.',
    integrationRule: 'Les contrôles serveur et les politiques RLS restent obligatoires; un lien ou un rôle côté client ne suffit jamais.',
    status: 'audit-required',
  },
  {
    id: 'notifications',
    name: 'Notifications',
    purpose: 'Rappels et événements destinés aux utilisateurs',
    currentEvidence: 'Les préférences de branches actuelles sont locales à l’appareil et ne prouvent pas l’existence d’un service partagé.',
    integrationRule: 'Définir un contrat commun après inventaire des tables, canaux, préférences et règles de consentement.',
    status: 'audit-required',
  },
  {
    id: 'documents',
    name: 'Documents et fichiers',
    purpose: 'Stockage, partage, aperçu et génération de documents',
    currentEvidence: 'Aucun contrat transversal unique n’a été validé dans ce lot.',
    integrationRule: 'Garder des droits par propriétaire/dossier, stockage privé par défaut et liens temporaires lorsque nécessaire.',
    status: 'audit-required',
  },
  {
    id: 'payments',
    name: 'Paiements',
    purpose: 'Orchestration de paiement, confirmation, reçus et rapprochement',
    currentEvidence: 'Supabase contient des domaines financiers et des tables de transactions; le flux commun de paiement n’a pas été validé ici.',
    integrationRule: 'Ne pas fusionner les soldes ou écritures métier; passer par un contrat d’orchestration idempotent et auditable.',
    status: 'domain-owned',
  },
];

export const getJDVSharedServiceArea = (id: SharedServiceArea['id']) =>
  JDV_SHARED_SERVICE_AREAS.find((area) => area.id === id);
