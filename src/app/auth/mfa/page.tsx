'use client';
import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { safeRedirect } from '@/lib/auth/mfa';

function MfaChallenge() {
  const router = useRouter();
  const redirect = safeRedirect(useSearchParams()?.get('redirect'));
  const [factorId, setFactorId] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const sb = createClient();
    sb.auth.mfa.listFactors().then(({ data }) => {
      const f = data?.totp?.find((x) => x.status === 'verified');
      if (f) setFactorId(f.id); else router.replace(redirect);
    });
  }, [router, redirect]);

  async function verify(e: React.FormEvent) {
    e.preventDefault();
    if (!factorId || !/^\d{6}$/.test(code)) { setErr('Entrez le code à 6 chiffres.'); return; }
    setBusy(true); setErr(null);
    const sb = createClient();
    const { data: ch, error: e1 } = await sb.auth.mfa.challenge({ factorId });
    if (e1 || !ch) { setBusy(false); setErr('Impossible de démarrer la vérification. Réessayez.'); return; }
    const { error: e2 } = await sb.auth.mfa.verify({ factorId, challengeId: ch.id, code });
    setBusy(false);
    if (e2) { setErr('Code incorrect ou expiré.'); setCode(''); return; }
    router.replace(redirect); router.refresh();
  }

  async function cancel() { await createClient().auth.signOut(); router.replace('/auth/login'); }

  return (
    <main className="jdv-home flex min-h-screen items-center justify-center px-5">
      <form onSubmit={verify} className="w-full max-w-md rounded-2xl border border-[var(--jdv-border)] bg-white p-8">
        <div className="text-center text-5xl" aria-hidden>🔐</div>
        <h1 className="mt-3 text-center text-2xl font-bold" style={{ color: 'var(--jdv-primary-text)' }}>Vérification en deux étapes</h1>
        <p className="mt-2 text-center text-sm text-[var(--jdv-muted)]">Ouvrez votre application d’authentification et saisissez le code à 6 chiffres.</p>
        <label className="mt-6 block text-sm" htmlFor="otp">Code
          <input id="otp" inputMode="numeric" autoComplete="one-time-code" pattern="\d{6}" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
            className="mt-1 w-full rounded-lg border border-[var(--jdv-border)] px-3 py-3 text-center text-2xl tracking-[0.5em]" autoFocus />
        </label>
        {err && <p role="alert" className="mt-3 text-sm text-red-700">{err}</p>}
        <button disabled={busy || !factorId} className="mt-5 w-full rounded-lg px-4 py-2 font-medium disabled:opacity-60" style={{ background: 'var(--jdv-primary)', color: 'var(--jdv-on-primary)' }}>{busy ? 'Vérification…' : 'Valider'}</button>
        <button type="button" onClick={cancel} className="mt-3 w-full text-sm underline text-[var(--jdv-muted)]">Annuler et me déconnecter</button>
      </form>
    </main>
  );
}
export default function Page() { return <Suspense><MfaChallenge /></Suspense>; }
