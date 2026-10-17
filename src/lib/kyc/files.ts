export type DocType = 'id_front' | 'id_back' | 'selfie' | 'proof_of_address';
export const DOC_LABEL: Record<DocType, { title: string; hint: string; required: boolean; imageOnly?: boolean }> = {
  id_front: { title: 'Pièce d’identité (recto)', hint: 'Carte nationale d’identité, passeport ou permis de conduire. Photo nette, sans reflet, les 4 coins visibles.', required: true },
  id_back: { title: 'Pièce d’identité (verso)', hint: 'Si votre pièce a un verso.', required: false },
  selfie: { title: 'Selfie avec votre pièce', hint: 'Votre visage et la pièce d’identité visibles ensemble.', required: true, imageOnly: true },
  proof_of_address: { title: 'Justificatif de domicile', hint: 'Facture ou attestation de moins de 3 mois. Facultatif : utile pour le niveau le plus élevé.', required: false },
};
export const LEVEL_LABEL: Record<string, string> = { unverified: 'Non vérifié', basic: 'Basique', verified: 'Vérifié', enhanced: 'Renforcé' };
export const STATUS_TEXT: Record<string, string> = {
  none: 'Non commencée', pending: 'À compléter', under_review: 'En cours d’examen', approved: 'Vérifiée', rejected: 'Refusée', expired: 'Expirée',
};

export const MAX_BYTES = 5 * 1024 * 1024;
const MIME_EXT: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'application/pdf': 'pdf' };

/** Retourne un message d'erreur, ou null si le fichier est acceptable. La base et le stockage refont les mêmes contrôles. */
export function validateKycFile(file: { type: string; size: number }, type: DocType): string | null {
  if (!MIME_EXT[file.type]) return 'Format non accepté. Utilisez une photo (JPG, PNG, WebP) ou un PDF.';
  if (DOC_LABEL[type].imageOnly && file.type === 'application/pdf') return 'Pour le selfie, utilisez une photo et non un PDF.';
  if (file.size <= 0) return 'Le fichier est vide.';
  if (file.size > MAX_BYTES) return 'Fichier trop lourd (5 Mo maximum).';
  return null;
}

/** Nom de fichier sûr : respecte le motif exigé par la base (lettres, chiffres, point, tiret, tiret bas). */
export function kycPath(userId: string, type: DocType, mime: string, now = Date.now()): string {
  return `${userId}/${type}-${now}.${MIME_EXT[mime] ?? 'bin'}`;
}

export function kycError(message: string | undefined | null): string {
  const m = message ?? '';
  const t: [string, string][] = [
    ['KYC_UNDER_REVIEW', 'Votre dossier est en cours d’examen : vous ne pouvez plus le modifier.'],
    ['KYC_ALREADY_APPROVED', 'Votre identité est déjà vérifiée.'],
    ['KYC_INCOMPLETE', 'Ajoutez d’abord la pièce d’identité (recto) et le selfie.'],
    ['KYC_FILE_NOT_FOUND', 'Le fichier n’a pas été reçu. Réessayez.'],
    ['KYC_TOO_MANY_UPLOADS', 'Trop de documents envoyés aujourd’hui. Réessayez demain.'],
    ['KYC_INVALID', 'Document non valide.'],
    ['Payload too large', 'Fichier trop lourd (5 Mo maximum).'],
    ['mime type', 'Format non accepté. Utilisez JPG, PNG, WebP ou PDF.'],
    ['new row violates row-level security', 'Envoi refusé : trop de fichiers ou accès non autorisé.'],
    ['ACCESS_DENIED', 'Accès réservé aux administrateurs.'],
    ['REJECTION_REASON_REQUIRED', 'Indiquez le motif du refus.'],
    ['KYC_NOT_UNDER_REVIEW', 'Ce dossier n’est plus en cours d’examen.'],
  ];
  for (const [k, v] of t) if (m.includes(k)) return v;
  return 'L’opération n’a pas pu aboutir. Réessayez dans un instant.';
}
