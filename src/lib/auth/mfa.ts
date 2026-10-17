import type { SupabaseClient } from '@supabase/supabase-js';

/** Vrai si l'utilisateur a un second facteur vérifié mais n'a pas encore validé son code pour CETTE session. */
export async function needsMfaChallenge(supabase: SupabaseClient): Promise<boolean> {
  const { data, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (error || !data) return false;
  return data.nextLevel === 'aal2' && data.currentLevel !== 'aal2';
}

/** Chemin de redirection sûr : uniquement un chemin interne (évite les redirections vers un site externe). */
export function safeRedirect(value: string | null | undefined, fallback = '/dashboard'): string {
  if (!value || !value.startsWith('/') || value.startsWith('//') || value.includes('\\')) return fallback;
  return value;
}
