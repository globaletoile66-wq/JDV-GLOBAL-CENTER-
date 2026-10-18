'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Bot, MessageSquare, Plus, RefreshCw, Send } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';

type Conversation = { id: string; title: string | null; status: string; created_at: string; updated_at: string; context: Record<string, unknown> | null };
type Message = { id: string; conversation_id: string; user_id: string; role: string; content: string; provider: string | null; model: string | null; token_input: number | null; token_output: number | null; created_at: string };

export default function AcademyTutorPage() {
  const { user, loading: authLoading } = useAuth();
  const supabase = useMemo(() => createClient(), []);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [title, setTitle] = useState('');
  const [courseTitle, setCourseTitle] = useState('');
  const [prompt, setPrompt] = useState('');
  const [busy, setBusy] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const loadConversations = useCallback(async () => {
    if (!user) { setConversations([]); setMessages([]); setSelectedId(''); setBusy(false); return; }
    setBusy(true); setError('');
    const { data, error: loadError } = await supabase.from('ai_conversations').select('id,title,status,created_at,updated_at,context').eq('user_id', user.id).order('updated_at', { ascending: false }).limit(100);
    if (loadError) setError(loadError.message);
    else {
      const items = ((data || []) as Conversation[]).filter((item) => item.context?.feature === 'academy_tutor');
      setConversations(items);
      setSelectedId((current) => current && items.some((item) => item.id === current) ? current : items[0]?.id || '');
    }
    setBusy(false);
  }, [supabase, user]);

  const loadMessages = useCallback(async (conversationId: string) => {
    if (!user || !conversationId) { setMessages([]); return; }
    const { data, error: loadError } = await supabase.from('ai_messages').select('id,conversation_id,user_id,role,content,provider,model,token_input,token_output,created_at').eq('conversation_id', conversationId).order('created_at', { ascending: true }).limit(200);
    if (loadError) setError((current) => current || loadError.message);
    else setMessages((data || []) as Message[]);
  }, [supabase, user]);

  useEffect(() => { if (!authLoading) void loadConversations(); }, [authLoading, loadConversations]);
  useEffect(() => { if (selectedId) void loadMessages(selectedId); else setMessages([]); }, [selectedId, loadMessages]);

  const createConversation = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user) return;
    setSaving(true); setError(''); setNotice('');
    const conversationTitle = title.trim() || (courseTitle.trim() ? 'Tutor · ' + courseTitle.trim() : 'Mon apprentissage');
    const { data, error: createError } = await supabase.rpc('ai_create_conversation', {
      p_title: conversationTitle,
      p_organization_id: null,
      p_context: { feature: 'academy_tutor', course_title: courseTitle.trim().slice(0, 200) },
    });
    if (createError || !data) setError(createError?.message || 'La conversation n’a pas pu être créée.');
    else {
      setTitle(''); setSelectedId(data as string);
      setNotice('Session de tutorat créée. Pose une question pour commencer.');
      await loadConversations();
      setSelectedId(data as string);
    }
    setSaving(false);
  };

  const sendMessage = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user || !selectedId || !prompt.trim()) return;
    setSaving(true); setError(''); setNotice('');
    const submittedPrompt = prompt.trim();
    setPrompt('');
    try {
      const response = await fetch('/api/academy/tutor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId: selectedId, prompt: submittedPrompt }),
      });
      const result = await response.json().catch(() => null) as { answer?: string; error?: string; code?: string; model?: string } | null;
      if (!response.ok || !result?.answer) {
        if (result?.code === 'AI_GATEWAY_NOT_ACTIVE') setPrompt(submittedPrompt);
        setError(result?.error || 'Le tuteur IA n’a pas pu répondre.');
        await loadMessages(selectedId);
      } else {
        await loadMessages(selectedId);
        setNotice('Réponse enregistrée dans ta session de tutorat.');
      }
    } catch {
      setError('Impossible de joindre le service de tutorat. Vérifie ta connexion et réessaie.');
    }
    setSaving(false);
  };

  if (authLoading) return <main className="grid min-h-screen place-items-center bg-[#0B1B3D] text-white">Chargement…</main>;

  return (
    <main className="min-h-screen bg-[#0B1B3D] px-4 py-6 text-white sm:px-8 sm:py-8">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-wrap items-center justify-between gap-3"><Link href="/academy" className="inline-flex items-center gap-2 text-sm text-white/60 hover:text-white"><ArrowLeft size={16}/> JDV Academy</Link><button type="button" onClick={() => void loadConversations()} disabled={busy} className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm disabled:opacity-50"><RefreshCw size={15} className={busy ? 'animate-spin' : ''}/> Actualiser</button></header>
        <section className="mt-7 rounded-3xl border border-white/10 bg-gradient-to-br from-[#122b57] to-[#0b1b3d] p-6 sm:p-8"><p className="text-xs font-bold uppercase tracking-[.25em] text-[#F28C28]">JDV ACADEMY · AI</p><h1 className="mt-3 flex items-center gap-3 text-3xl font-black sm:text-4xl"><Bot size={32} className="text-[#F28C28]"/> Tuteur pédagogique IA</h1><p className="mt-3 max-w-3xl text-sm leading-6 text-white/60">Pose des questions sur un cours, demande une explication étape par étape ou un exercice d’entraînement. Les échanges sont privés et conservés dans tes sessions. Le tuteur n’invente pas de notes et ne révèle pas les corrigés privés.</p>{error && <p role="alert" className="mt-5 rounded-xl border border-red-300/20 bg-red-300/10 p-3 text-sm text-red-100">{error}</p>}{notice && <p role="status" className="mt-5 rounded-xl border border-emerald-300/20 bg-emerald-300/10 p-3 text-sm text-emerald-100">{notice}</p>}</section>
        {!user ? <section className="mt-6 rounded-2xl border border-white/10 p-6 text-sm text-white/60">Connecte-toi pour ouvrir une session privée de tutorat. <Link href="/auth/login" className="underline">Se connecter</Link></section> : <div className="mt-6 grid gap-5 lg:grid-cols-[340px_1fr]">
          <aside className="rounded-2xl border border-white/10 bg-white/[.04] p-5">
            <h2 className="flex items-center gap-2 font-bold"><Plus size={18} className="text-[#F28C28]"/> Nouvelle session</h2>
            <form onSubmit={createConversation} className="mt-4 space-y-3"><input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={160} placeholder="Titre (facultatif)" className="w-full rounded-xl border border-white/10 bg-[#07142e] px-3 py-3 text-sm outline-none focus:border-[#F28C28]"/><input value={courseTitle} onChange={(e) => setCourseTitle(e.target.value)} maxLength={200} placeholder="Cours concerné (facultatif)" className="w-full rounded-xl border border-white/10 bg-[#07142e] px-3 py-3 text-sm outline-none focus:border-[#F28C28]"/><button disabled={saving} className="w-full rounded-xl bg-[#F28C28] px-4 py-3 text-sm font-bold text-[#0B1B3D] disabled:opacity-50">{saving ? 'Création…' : 'Créer une session'}</button></form>
            <h2 className="mt-7 flex items-center gap-2 font-bold"><MessageSquare size={17} className="text-[#F28C28]"/> Mes sessions</h2>
            <div className="mt-3 space-y-2">{conversations.map((conversation) => <button type="button" key={conversation.id} onClick={() => setSelectedId(conversation.id)} className={'w-full rounded-xl border p-3 text-left ' + (selectedId === conversation.id ? 'border-[#F28C28]/60 bg-[#F28C28]/10' : 'border-white/10 hover:bg-white/5')}><p className="truncate text-sm font-semibold">{conversation.title || 'Session sans titre'}</p><p className="mt-1 text-xs text-white/40">{new Date(conversation.updated_at).toLocaleDateString('fr-FR')}</p></button>)}{!busy && conversations.length === 0 && <p className="rounded-xl border border-dashed border-white/10 p-4 text-xs text-white/40">Aucune session. Crée-en une pour commencer.</p>}</div>
          </aside>
          <section className="flex min-h-[560px] flex-col rounded-2xl border border-white/10 bg-white/[.03]">
            <div className="border-b border-white/10 p-5"><h2 className="font-bold">{conversations.find((item) => item.id === selectedId)?.title || 'Conversation pédagogique'}</h2><p className="mt-1 text-xs text-white/40">Les réponses sont générées par un modèle configuré côté serveur.</p></div>
            <div className="flex-1 space-y-4 overflow-y-auto p-5">{messages.map((item) => <article key={item.id} className={'max-w-[90%] rounded-2xl p-4 ' + (item.role === 'user' ? 'ml-auto bg-[#F28C28]/15 text-white' : 'mr-auto border border-white/10 bg-[#07142e] text-white/90')}><p className="whitespace-pre-wrap text-sm leading-6">{item.content}</p><p className="mt-2 text-[10px] text-white/35">{item.role === 'user' ? 'Toi' : 'Tuteur IA'} · {new Date(item.created_at).toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'})}</p></article>)}{messages.length === 0 && <div className="grid h-full min-h-[280px] place-items-center text-center"><div><Bot size={36} className="mx-auto text-white/25"/><p className="mt-3 text-sm text-white/45">Choisis une session ou crée-en une, puis pose ta question.</p></div></div>}</div>
            <form onSubmit={sendMessage} className="border-t border-white/10 p-4 sm:p-5"><label className="mb-2 block text-xs text-white/50">Ta question</label><textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} maxLength={4000} rows={3} placeholder={selectedId ? 'Explique-moi…' : 'Crée une session avant de poser une question'} disabled={!selectedId || saving} className="w-full resize-y rounded-xl border border-white/10 bg-[#07142e] p-3 text-sm outline-none focus:border-[#F28C28] disabled:opacity-50"/><div className="mt-3 flex flex-wrap items-center justify-between gap-3"><p className="text-xs text-white/35">{prompt.length}/4000 caractères</p><button disabled={!selectedId || !prompt.trim() || saving} className="inline-flex items-center gap-2 rounded-xl bg-[#F28C28] px-4 py-2.5 text-sm font-bold text-[#0B1B3D] disabled:opacity-50"><Send size={15}/>{saving ? 'Envoi…' : 'Demander au tuteur'}</button></div></form>
          </section>
        </div>}
      </div>
    </main>
  );
}
