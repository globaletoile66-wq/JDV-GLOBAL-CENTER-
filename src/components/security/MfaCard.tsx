'use client';
import { useCallback, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

type Factor = { id: string; friendly_name?: string | null; status: string };
type Enrolling = { factorId: string; qr: string; secret: string };

export default function MfaCard() {
  const sb = createClient();
  const [factors, setFactors] = useState<Factor[]>([]);
  const [enrolling, setEnrolling] = useState<Enrolling | null>(null);
  const [code, setCode] = useState('');
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const { data } = await sb.auth.mfa.listFactors();
    setFactors((data?.totp ?? []) as Factor[]);
  }, [sb]);
  useEffect(() => { load(); }, [load]);

  const verified = factors.find((f) => f.status === 'verified');

  async function start() {
    setBusy(true); setMsg(null);
    // Nettoie une activation abandonnée avant d'en démarrer une nouvelle.
    for (const f of factors.filter((x) => x.status !== 'verified')) await sb.auth.mfa.unenroll({ factorId: f.id });
    const { data, error } = await sb.auth.mfa.enroll({ factorType: 'totp', friendlyName: `JDV ${new Date().toISOString().slice(0, 10)}` });
    setBusy(false);
    if (error || !data) return setMsg({ ok: false, text: 'La double authentification n’est pas disponible pour le moment.' });
    setEnrolling({ factorId: data.id, qr: data.totp.qr_code, secret: data.totp.secret });
  }

  async function confirm(e: React.FormEvent) {
    e.preventDefault();
    if (!enrolling || !/^\d{6}$/.test(code)) return setMsg({ ok: false, text: 'Entrez le code à 6 chiffres.' });
    setBusy(true); setMsg(null);
    const { data: ch } = await sb.auth.mfa.challenge({ factorId: enrolling.factorId });
    const { error } = ch ? await sb.auth.mfa.verify({ factorId: enrolling.factorId, challengeId: ch.id, code }) : { error: new Error('x') };
    setBusy(false);
    if (error) return setMsg({ ok: false, text: 'Code incorrect. Vérifiez l’heure de votre téléphone et réessayez.' });
    setEnrolling(null); setCode(''); setMsg({ ok: true, text: 'Double authentification activée.' }); load();
  }

  async function disable() {
    if (!verified || !window.confirm('Désactiver la double authentification ? Votre compte sera moins protégé.')) return;
    setBusy(true);
    const { error } = await sb.auth.mfa.unenroll({ factorId: verified.id });
    setBusy(false);
    setMsg(error ? { ok: false, text: 'Confirmez d’abord votre code pour désactiver.' } : { ok: true, text: 'Double authentification désactivée.' });
    load();
  }

  return (
    <section aria-labelledby="mfa-title" className="rounded-2xl border border-[var(--jdv-border)] bg-white p-6">
      <h2 id="mfa-title" className="text-lg font-semibold">Double authentification (2FA)</h2>
      <p className="mt-1 text-sm text-[var(--jdv-muted)]">Ajoute un code temporaire à votre mot de passe, depuis une application comme Google Authenticator ou Authy.</p>

      {verified && !enrolling && (
        <div className="mt-4 flex items-center justify-between gap-3">
          <p className="text-sm"><span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">Activée</span></p>
          <button type="button" onClick={disable} disabled={busy} className="rounded-lg border border-[var(--jdv-border)] px-3 py-2 text-sm hover:bg-[var(--jdv-primary-soft)]">Désactiver</button>
        </div>
      )}
      {!verified && !enrolling && (
        <button type="button" onClick={start} disabled={busy} className="mt-4 rounded-lg px-4 py-2 font-medium disabled:opacity-60" style={{ background: 'var(--jdv-primary)', color: 'var(--jdv-on-primary)' }}>Activer la 2FA</button>
      )}
      {enrolling && (
        <form onSubmit={confirm} className="mt-4 space-y-3">
          <p className="text-sm">1. Scannez ce QR code avec votre application.</p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={enrolling.qr} alt="QR code à scanner" className="h-44 w-44 rounded-lg border border-[var(--jdv-border)]" />
          <p className="text-sm">Ou saisissez cette clé : <code className="break-all rounded bg-[var(--jdv-primary-soft)] px-1.5 py-0.5">{enrolling.secret}</code></p>
          <label className="block text-sm">2. Entrez le code à 6 chiffres affiché
            <input inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} className="mt-1 w-40 rounded-lg border border-[var(--jdv-border)] px-3 py-2 tracking-widest" />
          </label>
          <div className="flex gap-2">
            <button disabled={busy} className="rounded-lg px-4 py-2 font-medium disabled:opacity-60" style={{ background: 'var(--jdv-primary)', color: 'var(--jdv-on-primary)' }}>Confirmer</button>
            <button type="button" onClick={() => { sb.auth.mfa.unenroll({ factorId: enrolling.factorId }); setEnrolling(null); }} className="rounded-lg border border-[var(--jdv-border)] px-4 py-2">Annuler</button>
          </div>
        </form>
      )}
      {msg && <p role="status" className={`mt-3 text-sm ${msg.ok ? 'text-green-700' : 'text-red-700'}`}>{msg.text}</p>}
    </section>
  );
}
