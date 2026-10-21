'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';
import { useT } from '@/hooks/useT';

type Msg = { role: 'user' | 'assistant'; content: string };

/**
 * Assistant flottant branché sur le chat IA existant (/api/ai/chat, même historique privé que /ai).
 * Il n’apparaît que si le fournisseur IA est configuré côté serveur ; les visiteurs non connectés sont invités à se connecter.
 */
export default function AssistantWidget() {
  const { user, loading } = useAuth();
  const { t } = useT();
  const supabase = useMemo(() => createClient(), []);
  const [available, setAvailable] = useState(false);
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [conversationId, setConversationId] = useState('');
  const end = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;
    fetch('/api/ai/chat', { cache: 'no-store' })
      .then((response) => (response.ok ? response.json() : null))
      .then((data: { configured?: boolean } | null) => { if (active) setAvailable(Boolean(data?.configured)); })
      .catch(() => { if (active) setAvailable(false); });
    return () => { active = false; };
  }, []);

  useEffect(() => { end.current?.scrollIntoView({ behavior: 'smooth' }); }, [msgs, open]);

  async function ensureConversation(): Promise<string | null> {
    if (conversationId) return conversationId;
    if (!user) return null;
    const { data, error } = await supabase
      .from('ai_conversations')
      .insert({ user_id: user.id, title: 'Assistant accueil', context: {}, status: 'open' })
      .select('id')
      .single();
    if (error || !data) return null;
    const id = (data as { id: string }).id;
    setConversationId(id);
    return id;
  }

  async function send(text: string) {
    const prompt = text.trim();
    if (!prompt || busy || !user) return;
    setMsgs((current) => [...current, { role: 'user', content: prompt }]);
    setInput('');
    setBusy(true);
    let answer = t('assistant.error');
    try {
      const id = await ensureConversation();
      if (id) {
        const response = await fetch('/api/ai/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ conversationId: id, prompt }),
        });
        const result = (await response.json()) as { answer?: string };
        if (response.ok && result.answer) answer = String(result.answer);
      }
    } catch {
      /* message d’erreur générique conservé */
    }
    setBusy(false);
    setMsgs((current) => [...current, { role: 'assistant', content: answer }]);
  }

  if (!available) return null;

  const suggestions = [t('assistant.s1'), t('assistant.s2'), t('assistant.s3')];

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-label={open ? t('assistant.close') : t('assistant.open')}
        className="fixed bottom-5 end-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-accent text-2xl text-black shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        {open ? '×' : '💬'}
      </button>

      {open && (
        <section role="dialog" aria-label={t('assistant.title')} className="fixed bottom-24 end-5 z-50 flex h-[28rem] w-[22rem] max-w-[calc(100vw-2.5rem)] flex-col rounded-2xl border border-border bg-card shadow-2xl">
          <header className="flex items-center justify-between rounded-t-2xl bg-accent px-4 py-3 font-semibold text-black">
            <span>{t('assistant.title')}</span>
            {user && <Link href="/ai" className="text-xs font-medium underline">{t('assistant.full')}</Link>}
          </header>
          <div className="flex-1 space-y-2 overflow-y-auto p-3 text-sm" aria-live="polite">
            <p className="max-w-[85%] whitespace-pre-wrap rounded-2xl bg-background px-3 py-2">{t('assistant.greeting')}</p>
            {msgs.map((message, index) => (
              <p key={index} className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-3 py-2 ${message.role === 'user' ? 'ms-auto bg-accent text-black' : 'bg-background'}`}>{message.content}</p>
            ))}
            {busy && <p className="text-muted-foreground">{t('assistant.typing')}</p>}
            {user && msgs.length === 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {suggestions.map((suggestion) => (
                  <button key={suggestion} type="button" onClick={() => send(suggestion)} className="rounded-full border border-border px-3 py-1 text-xs hover:bg-background">{suggestion}</button>
                ))}
              </div>
            )}
            <div ref={end} />
          </div>
          {!loading && !user ? (
            <p className="border-t border-border p-3 text-sm text-muted-foreground">
              {t('assistant.loginPrompt')}{' '}
              <Link href="/auth/login" className="font-medium text-accent underline">{t('assistant.login')}</Link>
            </p>
          ) : (
            <form onSubmit={(event) => { event.preventDefault(); void send(input); }} className="flex gap-2 border-t border-border p-3">
              <label className="sr-only" htmlFor="jdv-assistant-input">{t('assistant.placeholder')}</label>
              <input id="jdv-assistant-input" value={input} onChange={(event) => setInput(event.target.value)} maxLength={800} placeholder={t('assistant.placeholder')} className="min-w-0 flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm" />
              <button disabled={busy || !input.trim()} className="rounded-lg bg-accent px-3 py-2 text-sm font-medium text-black disabled:opacity-50">{t('assistant.send')}</button>
            </form>
          )}
        </section>
      )}
    </>
  );
}
