'use client';
import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

function VerifyEmail() {
  const email = useSearchParams()?.get('email') ?? '';
  const [cooldown, setCooldown] = useState(0);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => { if (cooldown <= 0) return; const t = setTimeout(() => setCooldown(cooldown - 1), 1000); return () => clearTimeout(t); }, [cooldown]);

  async function resend() {
    if (!email || cooldown > 0) return;
    setBusy(true); setMsg(null);
    const { error } = await createClient().auth.resend({
      type: 'signup', email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=/onboarding` },
    });
    setBusy(false);
    if (error) setMsg({ ok: false, text: /rate|seconds|too many/i.test(error.message) ? 'Patientez un instant avant de redemander un email.' : 'L’email n’a pas pu être renvoyé. Réessayez plus tard.' });
    else { setMsg({ ok: true, text: 'Un nouvel email vient d’être envoyé.' }); setCooldown(60); }
  }

  return (
    <main className="jdv-home flex min-h-screen items-center justify-center px-5">
      <div className="w-full max-w-md rounded-2xl border border-[var(--jdv-border)] bg-white p-8 text-center">
        <div className="text-5xl" aria-hidden>✉️</div>
        <h1 className="mt-3 text-2xl font-bold" style={{ color: 'var(--jdv-primary-text)' }}>Vérifiez votre email</h1>
        <p className="mt-3 text-sm text-[var(--jdv-muted)]">
          {email ? <>Nous avons envoyé un lien de confirmation à <strong>{email}</strong>.</> : 'Nous avons envoyé un lien de confirmation à votre adresse email.'} Cliquez dessus pour activer votre compte. Pensez à vérifier vos courriers indésirables.
        </p>
        {email && (
          <button type="button" onClick={resend} disabled={busy || cooldown > 0} className="mt-6 w-full rounded-lg px-4 py-2 font-medium disabled:opacity-60" style={{ background: 'var(--jdv-primary)', color: 'var(--jdv-on-primary)' }}>
            {cooldown > 0 ? `Renvoyer l’email (${cooldown} s)` : busy ? 'Envoi…' : 'Renvoyer l’email'}
          </button>
        )}
        {msg && <p role="status" className={`mt-3 text-sm ${msg.ok ? 'text-green-700' : 'text-red-700'}`}>{msg.text}</p>}
        <p className="mt-6 text-sm"><Link href="/auth/login" className="underline" style={{ color: 'var(--jdv-primary-text)' }}>Retour à la connexion</Link></p>
      </div>
    </main>
  );
}
export default function Page() { return <Suspense><VerifyEmail /></Suspense>; }
