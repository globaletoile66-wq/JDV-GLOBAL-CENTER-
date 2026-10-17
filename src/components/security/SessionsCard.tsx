'use client';
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

type Sess = { id: string; created_at: string; last_seen_at: string; user_agent: string | null; ip: string | null; is_current: boolean };

/** Description lisible d'un user-agent, sans bibliothèque. */
function describe(ua: string | null): string {
  if (!ua) return 'Appareil inconnu';
  const browser = /Edg\//.test(ua) ? 'Edge' : /OPR\//.test(ua) ? 'Opera' : /Chrome\//.test(ua) ? 'Chrome' : /Firefox\//.test(ua) ? 'Firefox' : /Safari\//.test(ua) ? 'Safari' : 'Navigateur';
  const os = /Android/.test(ua) ? 'Android' : /iPhone|iPad/.test(ua) ? 'iOS' : /Windows/.test(ua) ? 'Windows' : /Mac OS/.test(ua) ? 'macOS' : /Linux/.test(ua) ? 'Linux' : '';
  return os ? `${browser} sur ${os}` : browser;
}
const fmt = (d: string) => new Date(d).toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' });

export default function SessionsCard() {
  const sb = createClient();
  const router = useRouter();
  const [list, setList] = useState<Sess[] | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const load = useCallback(async () => {
    const { data, error } = await sb.rpc('account_list_sessions');
    if (error) setMsg({ ok: false, text: 'Impossible de charger vos sessions.' }); else setList((data ?? []) as Sess[]);
  }, [sb]);
  useEffect(() => { load(); }, [load]);

  async function revoke(id: string) {
    const { error } = await sb.rpc('account_revoke_session', { p_session_id: id });
    setMsg(error ? { ok: false, text: 'La session n’a pas pu être fermée.' } : { ok: true, text: 'Appareil déconnecté.' }); load();
  }
  async function revokeOthers() {
    if (!window.confirm('Déconnecter tous les autres appareils ?')) return;
    const { error } = await sb.auth.signOut({ scope: 'others' });
    setMsg(error ? { ok: false, text: 'Opération impossible pour le moment.' } : { ok: true, text: 'Tous les autres appareils sont déconnectés.' }); load();
  }
  async function signOutEverywhere() {
    if (!window.confirm('Vous déconnecter de tous vos appareils, y compris celui-ci ?')) return;
    await sb.auth.signOut({ scope: 'global' }); router.replace('/auth/login');
  }

  return (
    <section aria-labelledby="sess-title" className="rounded-2xl border border-[var(--jdv-border)] bg-white p-6">
      <h2 id="sess-title" className="text-lg font-semibold">Appareils connectés</h2>
      <p className="mt-1 text-sm text-[var(--jdv-muted)]">Si un appareil ne vous est pas familier, déconnectez-le et changez votre mot de passe. Un appareil déconnecté peut rester actif quelques minutes, jusqu’à l’expiration de son accès.</p>
      {list === null ? <p className="mt-4 text-sm">Chargement…</p> : (
        <ul className="mt-4 divide-y divide-[var(--jdv-border)]">
          {list.map((s) => (
            <li key={s.id} className="flex items-center justify-between gap-3 py-3 text-sm">
              <div>
                <p className="font-medium">{describe(s.user_agent)} {s.is_current && <span className="ml-1 rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-800">cet appareil</span>}</p>
                <p className="text-[var(--jdv-muted)]">Dernière activité : {fmt(s.last_seen_at)}{s.ip ? ` · ${s.ip}` : ''}</p>
              </div>
              {!s.is_current && <button type="button" onClick={() => revoke(s.id)} className="rounded-lg border border-[var(--jdv-border)] px-3 py-1.5 hover:bg-[var(--jdv-primary-soft)]">Déconnecter</button>}
            </li>
          ))}
          {list.length === 0 && <li className="py-3 text-sm">Aucune session active.</li>}
        </ul>
      )}
      <div className="mt-4 flex flex-wrap gap-2">
        {list && list.length > 1 && <button type="button" onClick={revokeOthers} className="rounded-lg border border-[var(--jdv-border)] px-3 py-2 text-sm hover:bg-[var(--jdv-primary-soft)]">Déconnecter les autres appareils</button>}
        <button type="button" onClick={signOutEverywhere} className="rounded-lg border border-red-300 px-3 py-2 text-sm text-red-700 hover:bg-red-50">Me déconnecter partout</button>
      </div>
      {msg && <p role="status" className={`mt-3 text-sm ${msg.ok ? 'text-green-700' : 'text-red-700'}`}>{msg.text}</p>}
    </section>
  );
}
