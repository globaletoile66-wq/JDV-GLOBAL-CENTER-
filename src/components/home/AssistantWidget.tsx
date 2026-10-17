'use client';
import { useEffect, useRef, useState } from 'react';
import { getSupabase } from '../../lib/jdv/supabase';

type Msg = { role: 'user' | 'assistant'; content: string };
const SUGGESTIONS = ['Que peut faire JDV GLOBAL pour moi ?', 'Quelles branches sont disponibles ?', 'Comment fonctionne la tontine ?'];

/** Assistant IA flottant : répond aux questions sur JDV GLOBAL et oriente vers la bonne branche. */
export default function AssistantWidget({ loginHref = '/auth/login' }: { loginHref?: string }) {
  const sb = getSupabase();
  const [open, setOpen] = useState(false);
  const [logged, setLogged] = useState<boolean | null>(null);
  const [msgs, setMsgs] = useState<Msg[]>([{ role: 'assistant', content: 'Bonjour ! Je suis l’assistant JDV. Posez-moi vos questions sur la plateforme et ses branches.' }]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const end = useRef<HTMLDivElement>(null);

  useEffect(() => { if (open) sb.auth.getUser().then(({ data }) => setLogged(!!data.user)); }, [open, sb]);
  useEffect(() => { end.current?.scrollIntoView({ behavior: 'smooth' }); }, [msgs, open]);

  async function send(text: string) {
    const message = text.trim();
    if (!message || busy) return;
    const history = msgs.slice(1).slice(-8);
    setMsgs((m) => [...m, { role: 'user', content: message }]); setInput(''); setBusy(true);
    const { data, error } = await sb.functions.invoke('jdv-assistant', { body: { message, history } });
    setBusy(false);
    const answer = !error && data?.answer ? String(data.answer)
      : 'Je ne peux pas répondre pour le moment. Réessayez dans un instant.';
    setMsgs((m) => [...m, { role: 'assistant', content: answer }]);
  }

  return (
    <>
      <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-label={open ? 'Fermer l’assistant' : 'Ouvrir l’assistant IA'}
        className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full text-2xl shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--jdv-accent)]"
        style={{ background: 'var(--jdv-accent)', color: 'var(--jdv-on-accent)' }}>{open ? '×' : '💬'}</button>

      {open && (
        <section role="dialog" aria-label="Assistant IA JDV" className="fixed bottom-24 right-5 z-50 flex h-[28rem] w-[22rem] max-w-[calc(100vw-2.5rem)] flex-col rounded-2xl border border-[var(--jdv-border)] bg-white shadow-2xl">
          <header className="rounded-t-2xl px-4 py-3 font-semibold" style={{ background: 'var(--jdv-primary)', color: 'var(--jdv-on-primary)' }}>Assistant JDV</header>
          <div className="flex-1 space-y-2 overflow-y-auto p-3 text-sm" aria-live="polite">
            {msgs.map((m, i) => (
              <p key={i} className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-3 py-2 ${m.role === 'user' ? 'ml-auto' : ''}`}
                style={m.role === 'user' ? { background: 'var(--jdv-primary)', color: 'var(--jdv-on-primary)' } : { background: 'var(--jdv-primary-soft)' }}>{m.content}</p>
            ))}
            {busy && <p className="text-[var(--jdv-muted)]">L’assistant écrit…</p>}
            {msgs.length === 1 && logged !== false && (
              <div className="flex flex-wrap gap-2 pt-1">
                {SUGGESTIONS.map((s) => <button key={s} type="button" onClick={() => send(s)} className="rounded-full border border-[var(--jdv-border)] px-3 py-1 text-xs hover:bg-[var(--jdv-primary-soft)]">{s}</button>)}
              </div>
            )}
            <div ref={end} />
          </div>
          {logged === false ? (
            <p className="border-t border-[var(--jdv-border)] p-3 text-sm text-[var(--jdv-muted)]">Connectez-vous pour poser vos questions. <a href={loginHref} className="font-medium underline" style={{ color: 'var(--jdv-primary-text)' }}>Se connecter</a></p>
          ) : (
            <form onSubmit={(e) => { e.preventDefault(); send(input); }} className="flex gap-2 border-t border-[var(--jdv-border)] p-3">
              <label className="sr-only" htmlFor="jdv-assistant-input">Votre question</label>
              <input id="jdv-assistant-input" value={input} onChange={(e) => setInput(e.target.value)} maxLength={800} placeholder="Votre question…" className="min-w-0 flex-1 rounded-lg border border-[var(--jdv-border)] px-3 py-2 text-sm" />
              <button disabled={busy || !input.trim()} className="rounded-lg px-3 py-2 text-sm font-medium disabled:opacity-50" style={{ background: 'var(--jdv-primary)', color: 'var(--jdv-on-primary)' }}>Envoyer</button>
            </form>
          )}
        </section>
      )}
    </>
  );
}
