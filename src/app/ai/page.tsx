'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Bot, MessageSquare, Plus, RefreshCw, Search, Send } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';

type Conversation = { id: string; title: string | null; status: string; created_at: string; updated_at: string };
type Message = { id: string; conversation_id: string; user_id: string; role: string; content: string; provider: string | null; model: string | null; token_input: number | null; token_output: number | null; created_at: string };

export default function AIPage() {
  const { user, loading } = useAuth();
  const supabase = useMemo(() => createClient(), []);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [query, setQuery] = useState('');
  const [title, setTitle] = useState('');
  const [busy, setBusy] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [prompt, setPrompt] = useState('');
  const [sending, setSending] = useState(false);
  const [providerStatus, setProviderStatus] = useState<{ checked: boolean; configured: boolean; model: string | null } | null>(null);

  const loadConversations = useCallback(async () => {
    if (!user) { setConversations([]); setMessages([]); setSelectedId(''); setBusy(false); return; }
    setBusy(true); setError('');
    const { data, error: loadError } = await supabase.from('ai_conversations').select('id,title,status,created_at,updated_at').order('updated_at', { ascending: false }).limit(100);
    if (loadError) setError(loadError.message);
    else {
      const items = (data ?? []) as Conversation[];
      setConversations(items);
      setSelectedId((current) => current && items.some((item) => item.id === current) ? current : items[0]?.id || '');
    }
    setBusy(false);
  }, [supabase, user]);

  const loadMessages = useCallback(async (conversationId: string) => {
    if (!user || !conversationId) { setMessages([]); return; }
    const { data, error: loadError } = await supabase.from('ai_messages').select('id,conversation_id,user_id,role,content,provider,model,token_input,token_output,created_at').eq('conversation_id', conversationId).order('created_at', { ascending: true }).limit(200);
    if (loadError) setError((current) => current || loadError.message);
    else setMessages((data ?? []) as Message[]);
  }, [supabase, user]);

  useEffect(() => { if (!loading) void loadConversations(); }, [loading, loadConversations]);
  useEffect(() => {
    let active = true;
    fetch('/api/ai/chat', { cache: 'no-store' })
      .then(async (response) => { if (!response.ok) throw new Error('Configuration indisponible'); return response.json(); })
      .then((data: { configured?: boolean; model?: string | null }) => { if (active) setProviderStatus({ checked: true, configured: Boolean(data.configured), model: data.model || null }); })
      .catch(() => { if (active) setProviderStatus({ checked: true, configured: false, model: null }); });
    return () => { active = false; };
  }, []);
  useEffect(() => { if (selectedId) void loadMessages(selectedId); else setMessages([]); }, [selectedId, loadMessages]);

  const createConversation = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user) return;
    setSaving(true); setError(''); setMessage('');
    const { data, error: createError } = await supabase.from('ai_conversations').insert({
      user_id: user.id, title: title.trim() || 'Nouvelle conversation', context: {}, status: 'open',
    }).select('id,title,status,created_at,updated_at').single();
    if (createError) setError(createError.message);
    else {
      const created = data as Conversation;
      setConversations((current) => [created, ...current]);
      setSelectedId(created.id);
      setTitle('');
      setMessage('Conversation créée. Tu peux maintenant envoyer un message à JDV AI.');
    }
    setSaving(false);
  };

  const sendPrompt = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const text = prompt.trim();
    if (!user || !selectedId || !text || sending) return;
    setSending(true); setError(''); setMessage('');
    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId: selectedId, prompt: text }),
      });
      const result = await response.json() as { answer?: string; error?: string; code?: string };
      if (!response.ok) throw new Error(result.error || 'Le message n’a pas pu être envoyé.');
      setPrompt('');
      await loadMessages(selectedId);
      await loadConversations();
      setMessage('Réponse reçue de JDV AI.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur inattendue est survenue.');
    } finally {
      setSending(false);
    }
  };

  const filtered = conversations.filter((item) => [item.title, item.status].join(' ').toLowerCase().includes(query.toLowerCase()));
  if (loading) return <main className="grid min-h-screen place-items-center bg-[#0B1B3D] text-white">Chargement…</main>;

  return (
    <main className="min-h-screen bg-[#0B1B3D] p-5 text-white sm:p-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex items-center justify-between gap-3"><Link href="/" className="inline-flex items-center gap-2 text-sm text-white/60 hover:text-white"><ArrowLeft size={16} /> Accueil</Link><button onClick={() => void loadConversations()} disabled={busy} className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2 text-sm disabled:opacity-50"><RefreshCw size={15} className={busy ? 'animate-spin' : ''} /> Actualiser</button></div>
        <section className="mt-7 rounded-3xl border border-white/10 bg-white/[.06] p-6 sm:p-8">
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center"><div><p className="text-xs font-bold uppercase tracking-[.25em] text-[#F28C28]">JDV GLOBAL CENTER</p><h1 className="mt-2 text-3xl font-black sm:text-4xl">JDV AI</h1><p className="mt-2 max-w-2xl text-sm text-white/60">Un assistant intelligent pour apprendre, créer, analyser et entreprendre. Les messages sont traités côté serveur et enregistrés dans ton historique privé.</p></div><div className="flex flex-wrap gap-3"><div className="rounded-2xl border border-white/10 px-5 py-4"><div className="text-xs text-white/40">Mes conversations</div><div className="mt-1 text-2xl font-bold">{conversations.length}</div></div><div className="rounded-2xl border border-white/10 px-5 py-4"><div className="text-xs text-white/40">Fournisseur IA</div><div className={'mt-1 font-bold ' + (providerStatus?.configured ? 'text-emerald-300' : 'text-amber-200')}>{!providerStatus ? 'Vérification…' : providerStatus.configured ? 'Configuré' : 'À configurer'}</div>{providerStatus?.configured && providerStatus.model && <div className="mt-1 text-xs text-white/40">{providerStatus.model}</div>}</div></div></div>
          {error && <div role="alert" className="mt-5 rounded-xl border border-red-300/20 bg-red-400/10 p-3 text-sm text-red-200">{error}</div>}
          {message && <div role="status" className="mt-5 rounded-xl border border-[#F28C28]/30 bg-[#F28C28]/10 p-4 text-sm text-[#F28C28]">{message}</div>}
          {!user ? <p className="mt-7 rounded-2xl border border-white/10 p-6 text-sm text-white/60">Connectez-vous pour consulter vos conversations privées.</p> : <div className="mt-7 grid gap-6 lg:grid-cols-[.75fr_1.25fr]">
            <section className="rounded-2xl border border-white/10 bg-[#09152f]/50 p-5"><div className="flex items-center gap-2"><Plus size={20} className="text-[#F28C28]" /><h2 className="text-lg font-bold">Nouvelle conversation</h2></div><form onSubmit={createConversation} className="mt-4 space-y-3"><input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200} placeholder="Titre de la conversation" className="w-full rounded-xl border border-white/10 bg-[#09152f] px-3 py-3 text-sm outline-none focus:border-[#F28C28]" /><button disabled={saving} className="w-full rounded-xl bg-[#F28C28] px-4 py-3 font-bold text-[#0B1B3D] disabled:opacity-50">{saving ? 'Création…' : 'Créer la conversation'}</button></form>
              <div className="mt-6 flex items-center gap-3 rounded-xl border border-white/10 px-3 py-2.5"><Search size={16} className="text-white/40" /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Rechercher…" className="w-full bg-transparent text-sm outline-none placeholder:text-white/30" /></div>
              <div className="mt-4 space-y-2">{filtered.map((item) => <button key={item.id} type="button" onClick={() => setSelectedId(item.id)} className={'w-full rounded-xl border p-4 text-left ' + (selectedId === item.id ? 'border-[#F28C28]/60 bg-[#F28C28]/10' : 'border-white/10 hover:bg-white/[.04]')}><div className="font-semibold">{item.title || 'Conversation sans titre'}</div><div className="mt-2 flex justify-between gap-2 text-xs text-white/40"><span>{item.status}</span><span>{new Date(item.updated_at).toLocaleDateString('fr-FR')}</span></div></button>)}
                {!busy && filtered.length === 0 && <p className="rounded-xl border border-dashed border-white/15 p-6 text-center text-sm text-white/40">Aucune conversation.</p>}
              </div>
            </section>
            <section className="rounded-2xl border border-white/10 bg-[#09152f]/50 p-5"><div className="flex items-center gap-2"><Bot size={20} className="text-[#F28C28]" /><h2 className="text-lg font-bold">{conversations.find((item) => item.id === selectedId)?.title || 'Historique de conversation'}</h2></div>
              {!selectedId ? <p className="mt-4 text-sm text-white/45">Créez ou sélectionnez une conversation.</p> : <><div className="mt-4 space-y-3">{messages.map((item) => <article key={item.id} className="rounded-xl border border-white/10 p-4"><div className="flex flex-wrap items-center justify-between gap-2"><span className="rounded-full bg-white/10 px-2.5 py-1 text-xs">{item.role}</span><span className="text-xs text-white/35">{new Date(item.created_at).toLocaleString('fr-FR')}</span></div><p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-white/75">{item.content}</p>{(item.provider || item.model) && <p className="mt-3 text-xs text-white/35">{[item.provider, item.model].filter(Boolean).join(' · ')}{item.token_input != null || item.token_output != null ? ' · Tokens : ' + (item.token_input || 0) + ' entrée / ' + (item.token_output || 0) + ' sortie' : ''}</p>}</article>)}
                {messages.length === 0 && <div className="rounded-xl border border-dashed border-white/15 p-8 text-center"><MessageSquare size={24} className="mx-auto text-white/30" /><p className="mt-3 text-sm text-white/50">Aucun message dans cette conversation.</p></div>}
              </div>
              <form onSubmit={sendPrompt} className="mt-5 space-y-3">
                <label htmlFor="jdv-ai-prompt" className="block text-sm font-semibold text-white/75">Ton message</label>
                <textarea id="jdv-ai-prompt" value={prompt} onChange={(e) => setPrompt(e.target.value)} maxLength={4000} rows={4} disabled={sending} placeholder="Pose une question, demande une analyse ou prépare un document…" className="w-full resize-y rounded-xl border border-white/10 bg-[#0B1B3D] px-4 py-3 text-sm leading-6 outline-none focus:border-[#F28C28] disabled:opacity-60" />
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-xs text-white/40">4 000 caractères maximum · 10 demandes/minute · Ne saisis pas de secrets.</p>
                  <button type="submit" disabled={sending || !prompt.trim() || !selectedId} className="inline-flex items-center gap-2 rounded-xl bg-[#F28C28] px-5 py-3 font-bold text-[#0B1B3D] disabled:cursor-not-allowed disabled:opacity-50"><Send size={16} />{sending ? 'JDV AI répond…' : 'Envoyer'}</button>
                </div>
              </form>
              <div className="mt-4 rounded-xl border border-white/10 bg-white/[.03] p-3 text-xs leading-5 text-white/45">Les réponses dépendent de la configuration du fournisseur IA côté serveur. En cas d’absence de clé ou de quota, l’application affichera une erreur explicite sans inventer de réponse.</div></>}
            </section>
          </div>}
        </section>
      </div>
    </main>
  );
}
