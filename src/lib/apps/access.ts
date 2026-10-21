import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Client-side convenience guard for branch actions. Sensitive data must still
 * be protected by database RLS/server authorization; this is not a substitute
 * for those policies.
 */
export async function hasApplicationMembership(
  supabase: SupabaseClient,
  userId: string,
  appKey: string,
): Promise<boolean> {
  try {
    try {
      const { data: isSuperAdmin, error: adminError } = await supabase.rpc('is_super_admin');
      if (!adminError && isSuperAdmin === true) return true;
    } catch {
      // Continue with the user's own membership check if admin lookup is unavailable.
    }
    const { data, error } = await supabase
      .from('app_memberships')
      .select('id,status')
      .eq('user_id', userId)
      .eq('app_key', appKey)
      .maybeSingle();

    return !error && data?.status === 'active';
  } catch {
    return false;
  }
}
