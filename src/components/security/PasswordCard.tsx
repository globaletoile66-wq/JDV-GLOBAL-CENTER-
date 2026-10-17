'use client';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function PasswordCard() {
  const [pwd, setPwd] = useState(''); const [pwd2, setPwd2] = useState('');
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null); const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setMsg(null);
    if (pwd.length < 10) return setMsg({ ok: false, text: 'Le mot de passe doit contenir au moins 10 caractères.' });
    if (!/[a-z]/.test(pwd) || !/[A-Z]/.test(pwd) || !/\d/.test(pwd)) return setMsg({ ok: false, text: 'Utilisez au moins une minuscule, une majuscule et un chiffre.' });
    if (pwd !== pwd2) return setMsg({ ok: false, text: 'Les deux mots de passe ne sont pas identiques.' });
    setBusy(true);
    const { error } = await createClient().auth.updateUser({ password: pwd });
    setBusy(false);
    if (error) setMsg({ ok: false, text: /same|different/i.test(error.message) ? 'Le nouveau mot de passe doit être différent de l’ancien.' : /reauth|recent/i.test(error.message) ? 'Reconnectez-vous pour changer votre mot de passe.' : 'Le mot de passe n’a pas pu être changé.' });
    else { setMsg({ ok: true, text: 'Mot de passe modifié.' }); setPwd(''); setPwd2(''); }
  }
  const input = 'mt-1 w-full rounded-lg border border-[var(--jdv-border)] px-3 py-2';
  return (
    <section aria-labelledby="pwd-title" className="rounded-2xl border border-[var(--jdv-border)] bg-white p-6">
      <h2 id="pwd-title" className="text-lg font-semibold">Mot de passe</h2>
      <form onSubmit={submit} className="mt-3 space-y-3">
        <label className="block text-sm">Nouveau mot de passe<input type="password" autoComplete="new-password" value={pwd} onChange={(e) => setPwd(e.target.value)} className={input} /></label>
        <label className="block text-sm">Confirmer<input type="password" autoComplete="new-password" value={pwd2} onChange={(e) => setPwd2(e.target.value)} className={input} /></label>
        <button disabled={busy} className="rounded-lg px-4 py-2 font-medium disabled:opacity-60" style={{ background: 'var(--jdv-primary)', color: 'var(--jdv-on-primary)' }}>{busy ? 'Enregistrement…' : 'Changer le mot de passe'}</button>
        {msg && <p role="status" className={`text-sm ${msg.ok ? 'text-green-700' : 'text-red-700'}`}>{msg.text}</p>}
      </form>
    </section>
  );
}
