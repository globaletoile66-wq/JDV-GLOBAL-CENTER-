import { IN_TYPES, STATUS_LABEL, TYPE_LABEL, type PayTx } from './types';

const cell = (v: string | number): string => {
  const s = String(v);
  return /[";\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
const num = (n: number) => String(Math.round(n * 1e6) / 1e6).replace('.', ',');   // virgule décimale : s'ouvre directement dans Excel en français

/** Export de l'historique : séparateur « ; », virgule décimale, BOM UTF-8. */
export function txToCsv(rows: PayTx[]): string {
  const head = ['Date', 'Type', 'Sens', 'Montant', 'Frais', 'Devise', 'Statut', 'Description', 'Référence'];
  const lines = rows.map((t) => [
    new Date(t.created_at).toISOString().replace('T', ' ').slice(0, 19), TYPE_LABEL[t.transaction_type] ?? t.transaction_type,
    IN_TYPES.includes(t.transaction_type) ? 'Entrée' : 'Sortie', num(Number(t.amount)), num(Number(t.fee_amount ?? 0)), t.currencies.code,
    STATUS_LABEL[t.transaction_status] ?? t.transaction_status, t.description ?? '', t.reference ?? '',
  ].map(cell).join(';'));
  return '\uFEFF' + [head.join(';'), ...lines].join('\r\n');
}
