'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function AuthCallbackPage() {
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    let active = true;

    (async () => {
      const code = new URLSearchParams(window.location.search).get('code');
      if (code) {
        await supabase.auth.exchangeCodeForSession(code);
      }

      const { data } = await supabase.auth.getSession();
      if (!active) return;
      router.replace(data.session ? '/dashboard' : '/auth/login');
    })();

    return () => { active = false; };
  }, [router, supabase]);

  return (
    <main className="min-h-screen bg-background flex items-center justify-center text-muted-foreground">
      Finalisation de la connexion…
    </main>
  );
}