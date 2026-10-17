export type PayWallet = { id: string; balance: number; available_balance: number; wallet_status: string; currency_id: string; currencies: { code: string; symbol: string | null; decimal_places: number } };
export type PayTx = { id: string; transaction_type: string; amount: number; fee_amount: number; transaction_status: string; description: string | null; reference: string | null; created_at: string; balance_after: number; currencies: { code: string } };
export type PayRequest = { id: string; reference: string; amount: number | null; open_amount: boolean; currency: string | null; description: string | null; requester_name: string; status: string; expires_at: string | null; is_owner: boolean };
export type Quote = { currency: string; amount: number; fee: number; total: number; balance: number; available: number; sufficient: boolean; within_limits: boolean; limit_message: string | null };

export const IN_TYPES = ['deposit', 'transfer_in', 'refund', 'cashback'];
export const TYPE_LABEL: Record<string, string> = {
  deposit: 'Recharge', transfer_in: 'Transfert reçu', transfer_out: 'Transfert envoyé', payment: 'Paiement', withdrawal: 'Retrait',
  refund: 'Remboursement', cashback: 'Cashback', fee: 'Frais', adjustment: 'Ajustement',
};
export const STATUS_LABEL: Record<string, string> = { completed: 'Terminé', pending: 'En attente', failed: 'Échoué', cancelled: 'Annulé', paid: 'Payée', expired: 'Expirée' };

export function money(n: number, code: string): string {
  try { return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: code, maximumFractionDigits: code === 'XOF' || code === 'XAF' ? 0 : 2 }).format(n); }
  catch { return `${Math.round(n * 100) / 100} ${code}`; }
}

/** Messages d'erreur de la base, traduits pour l'utilisateur. */
export function payError(message: string | undefined | null): string {
  const m = message ?? '';
  const table: [string, string][] = [
    ['Solde insuffisant', 'Solde insuffisant pour ce montant, frais inclus.'],
    ['SELF_PAYMENT', 'Vous ne pouvez pas payer votre propre demande.'],
    ['vous envoyer de l', 'Vous ne pouvez pas vous envoyer de l’argent à vous-même.'],
    ['REQUEST_EXPIRED', 'Cette demande de paiement a expiré.'],
    ['REQUEST_NOT_PAYABLE', 'Cette demande n’est plus payable (déjà payée ou annulée).'],
    ['REQUEST_NOT_FOUND', 'Demande de paiement introuvable.'],
    ['CURRENCY_MISMATCH', 'Choisissez un portefeuille dans la devise demandée.'],
    ['WALLET_NOT_FOUND', 'Portefeuille introuvable.'],
    ['AMOUNT_REQUIRED', 'Indiquez le montant à payer.'],
    ['AMOUNT_MISMATCH', 'Le montant ne correspond pas à la demande.'],
    ['Plafond journalier', 'Plafond journalier dépassé.'],
    ['Plafond mensuel', 'Plafond mensuel dépassé.'],
    ['Montant supérieur au maximum', 'Montant supérieur au maximum autorisé pour votre niveau de vérification.'],
    ['Montant inférieur au minimum', 'Montant inférieur au minimum autorisé.'],
    ['Bénéficiaire non autorisé', 'Bénéficiaire non autorisé.'],
    ['non actif', 'Un des portefeuilles n’est pas actif.'],
    ['supérieur à zéro', 'Le montant doit être supérieur à zéro.'],
    ['duplicate key', 'Cette opération a déjà été enregistrée.'],
  ];
  for (const [k, v] of table) if (m.includes(k)) return v;
  return 'L’opération n’a pas pu aboutir. Réessayez dans un instant.';
}

export const newKey = () => (typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : String(Date.now()) + Math.random().toString(16).slice(2));
export const shortRef = (p: string) => `${p}-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
