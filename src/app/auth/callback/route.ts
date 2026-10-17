// REMPLACE src/app/auth/callback/route.ts. Même logique, avec un chemin de retour sécurisé :
// un paramètre `next` comme « @site-pirate.com » ne peut plus rediriger l'utilisateur hors de votre site.
import { createClient } from '@/lib/supabase/server';
import { safeRedirect } from '@/lib/auth/mfa';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = safeRedirect(searchParams.get('next'), '/dashboard');

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}${next}`);
  }
  return NextResponse.redirect(`${origin}/auth/login?error=auth_callback_error`);
}
