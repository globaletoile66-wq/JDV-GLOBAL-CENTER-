// À appeler depuis src/middleware.ts (voir docs/INTEGRATION-AUTH.md).
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import type { SupabaseClient } from '@supabase/supabase-js';

/** Si le compte a une 2FA vérifiée mais que la session n'a pas validé le code : redirige vers /auth/mfa. */
export async function mfaRedirect(supabase: SupabaseClient, request: NextRequest): Promise<NextResponse | null> {
  const { data } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (data && data.nextLevel === 'aal2' && data.currentLevel !== 'aal2') {
    const url = request.nextUrl.clone();
    url.pathname = '/auth/mfa';
    url.search = '';
    url.searchParams.set('redirect', request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }
  return null;
}
