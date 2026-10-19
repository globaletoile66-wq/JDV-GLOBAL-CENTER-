'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, MessageCircle, RefreshCw, Send, UserRound } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';

type Conversation = { id: string; user_a_id: string; user_b_id: string; created_at: string; updated_at: string };
type DirectMessage = { id: string; conversation_id: string; sender_user_id: string; body: string; created_at: string; read_at: string | null };
type SocialProfile = { user_id: string; username: string; display_name: string | null; avatar_url?: string | null };

const fieldClass = 'w-full rounded-xl border border-white/10 bg-[#09152f] px-3 py-3 text-sm text-white outline-none focus:border-[#F28C28]';
const buttonClass = 'inline-flex items-center justify-center gap-2 rounded-xl bg-[#F28C28] px-4 py-3 text-sm font-bold text-[#0B1B3D] disabled:cursor-not-allowed disabled:opacity-50';

export default function SocialMessagesPage() {
  const { user, loading } = useAuth();
  const supabase = useMemo(() => createClient(), []);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [profiles, setProfiles] = useState<Record<string, SocialProfile>>({});
  const [selectedId, setSelectedId] = useState('');
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [recipientUsername, setRecipientUsername] = useState('');
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const loadConversations = useCallback(async () => {
    if (!user) { setConversations([]); setProfiles({}); setSelectedId(''); setMessages([]); return; }
    setBusy(true); setError('');
    const { data, error: loadError } = await supabase.from('social_conversations')
      .select('id,user_a_id,user_b_id,created_at,updated_at')
      .or(`user_a_id.eq.${user.id},user_b_id.eq.${user.id}`)
      .order('updated_at', { ascending: false });
    if (loadError) {
      setError('Impossible de charger les conversations. Vérifiez que la migration JDV Social Messages est appliquée. ' + loadError.message);
      setBusy(false); return;
    }
    const rows = (data ?? []) as Conversation[];
    setConversations(rows);
    if (rows.length) {
      const otherIds = Array.from(new Set(rows.map((row) => row.user_a_id === user.id ? row.user_b_id : row.user_a_id)));
      const { data: profileRows, error: profileError } = await supabase.from('social_profiles')
        .select('user_id,username,display_name,avatar_url').in('user_id', otherIds);
      if (profileError) setError((current) => current || profileError.message);
      else {
        const lookup: Record<string, SocialProfile> = {};
        for (const item of (profileRows ?? []) as SocialProfile[]) lookup[item.user_id] = item;
        setProfiles(lookup);
      }
      setSelectedId((current) => rows.some((row) => row.id === current) ? current : rows[0].id);
    } else { setProfiles({}); setSelectedId(''); setMessages([]); }
    setBusy(false);
  }, [supabase, user]);

  const loadMessages = useCallback(async (conversationId: string) => {
    if (!user || !conversationId) { setMessages([]); return; }
    const { data, error: loadError } = await supabase.from('social_messages')
      .select('id,conversation_id,sender_user_id,body,created_at,read_at')
      .eq('conversation_id', conversationId).order('created_at', { ascending: true }).limit(500);
    if (loadError) { setError(loadError.message); return; }
    const rows = (data ?? []) as DirectMessage[];
    setMessages(rows);
    const unread = rows.filter((row) => row.sender_user_id !== user.id && !row.read_at).map((row) => row.id);
    if (unread.length) {
      const readAt = new Date().toISOString();
      const { error: readError } = await supabase.from('social_messages').update({ read_at: readAt }).in('id', unread);
      if (!readError) setMessages((current) => current.map((row) => unread.includes(row.id) ? { ...row, read_at: readAt } : row));
    }
  }, [supabase, user]);

  useEffect(() => { if (!loading) void loadConversations(); }, [loading, loadConversations]);
  useEffect(() => { if (selectedId) void loadMessages(selectedId); }, [selectedId, loadMessages]);

  const startConversation = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user) return;
    const username = recipientUsername.trim().replace(/^@/, '').toLowerCase();
    if (!/^[a-z0-9_]{3,30}$/.test(username)) { setError('Saisissez un nom d’utilisateur valide (3 à 30 lettres, chiffres ou _).'); return; }
    setError(''); setNotice(''); setBusy(true);
    const { data: profile, error: profileError } = await supabase.from('social_profiles')
      .select('user_id,username,display_name,avatar_url').eq('username', username).eq('profile_status', 'active').maybeSingle();
    if (profileError || !profile) {
      setError(profileError?.message || 'Aucun profil actif trouvé pour ce nom d’utilisateur.');
      setBusy(false); return;
    }
    if (profile.user_id === user.id) { setError('Vous ne pouvez pas ouvrir une conversation avec vous-même.'); setBusy(false); return; }
    const userA = user.id < profile.user_id ? user.id : profile.user_id;
    const userB = user.id < profile.user_id ? profile.user_id : user.id;
    let conversation: Conversation | null = null;
    const { data: inserted, error: insertError } = await supabase.from('social_conversations')
      .insert({ user_a_id: userA, user_b_id: userB }).select('id,user_a_id,user_b_id,created_at,updated_at').maybeSingle();
    if (!insertError && inserted) conversation = inserted as Conversation;
    else if (insertError?.code === '23505') {
      const { data: existing, error: existingError } = await supabase.from('social_conversations')
        .select('id,user_a_id,user_b_id,created_at,updated_at').eq('user_a_id', userA).eq('user_b_id', userB).maybeSingle();
      if (existingError) setError(existingError.message);
      else conversation = (existing ?? null) as Conversation | null;
    } else setError(insertError?.message || 'La conversation ne peut pas être créée.');
    setBusy(false);
    if (conversation) {
      setRecipientUsername('');
      setProfiles((current) => ({ ...current, [profile.user_id]: profile as SocialProfile }));
      setConversations((current) => [conversation!, ...current.filter((item) => item.id !== conversation!.id)]);
      setSelectedId(conversation.id);
      setNotice('Conversation ouverte. Vous pouvez envoyer votre premier message.');
    }
  };

  const sendMessage = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user || !selectedId) return;
    const body = draft.trim();
    if (!body || body.length > 5000) { setError('Le message doit contenir entre 1 et 5 000 caractères.'); return; }
    setSending(true); setError(''); setNotice('');
    const { data, error: sendError } = await supabase.from('social_messages')
      .insert({ conversation_id: selectedId, sender_user_id: user.id, body })
      .select('id,conversation_id,sender_user_id,body,created_at,read_at').single();
    if (sendError) setError(sendError.message);
    else {\n      setMessages((current) => [...current, data as DirectMessage]); setDraft('');\n      const { error: timestampError } = await supabase.from('social_conversations').update({ updated_at: new Date().toISOString() }).eq('id', selectedId);\n      if (!timestampError) void loadConversations();\n    }
    setSending(false);
  };

  const selected = conversations.find((item) => item.id === selectedId) || null;
  const otherUserId = selected && user ? (selected.user_a_id === user.id ? selected.user_b_id : selected.user_a_id) : '';
  const otherProfile = otherUserId ? profiles[otherUserId] : null;

  if (loading) return <main className="grid min-h-screen place-items-center bg-[#0B1B3D] text-white">Chargement…</main>;

  return <main className="min-h-screen bg-[#0B1B3D] p-4 text-white sm:p-8"><div className="mx-auto max-w-6xl">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <Link href="/social" className="inline-flex items-center gap-2 text-sm text-white/60 hover:text-white"><ArrowLeft size={16}/> Retour au fil JDV Social</Link>
      <button type="button" onClick={() => { void loadConversations(); if (selectedId) void loadMessages(selectedId); }} disabled={busy} className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-sm disabled:opacity-50"><RefreshCw size={15}/> Actualiser</button>
    </div>
    <section className="mt-6 rounded-3xl border border-white/10 bg-white/[.06] p-5 sm:p-7">
      <p className="text-xs font-bold uppercase tracking-[.25em] text-[#F28C28]">JDV GLOBAL CENTER</p>
      <h1 className="mt-2 flex items-center gap-3 text-3xl font-black"><MessageCircle className="text-[#F28C28]"/> Messages privés</h1>
      <p className="mt-2 text-sm text-white/60">Conversations privées entre membres JDV Social. Seuls les deux participants peuvent lire les messages.</p>
      {error && <p role="alert" className="mt-5 rounded-xl border border-red-300/20 bg-red-400/10 p-3 text-sm text-red-200">{error}</p>}
      {notice && <p role="status" className="mt-5 rounded-xl border border-[#F28C28]/30 bg-[#F28C28]/10 p-3 text-sm text-[#F28C28]">{notice}</p>}
      {!user ? <div className="mt-6 rounded-2xl border border-white/10 p-5"><p className="text-sm text-white/60">Connectez-vous pour envoyer et recevoir des messages privés.</p><Link href="/auth/login" className={buttonClass + ' mt-4'}>Se connecter</Link></div> : <>
        <form onSubmit={startConversation} className="mt-6 flex flex-col gap-3 sm:flex-row">
          <input aria-label="Nom d’utilisateur du destinataire" className={fieldClass} value={recipientUsername} onChange={(event) => setRecipientUsername(event.target.value)} placeholder="Nom d’utilisateur du destinataire (ex. @amina)" maxLength={31} required />
          <button className={buttonClass} disabled={busy}><UserRound size={16}/> Nouvelle conversation</button>
        </form>
        <div className="mt-6 grid min-h-[480px] overflow-hidden rounded-2xl border border-white/10 md:grid-cols-[280px_1fr]">
          <aside className="border-b border-white/10 bg-[#09152f]/60 md:border-b-0 md:border-r">
            <h2 className="border-b border-white/10 px-4 py-3 text-sm font-bold">Conversations ({conversations.length})</h2>
            {conversations.length === 0 ? <p className="p-4 text-sm text-white/45">Aucune conversation. Démarrez un échange avec le nom d’utilisateur d’un membre.</p> : conversations.map((conversation) => {
              const otherId = conversation.user_a_id === user.id ? conversation.user_b_id : conversation.user_a_id;
              const profile = profiles[otherId];
              return <button key={conversation.id} type="button" onClick={() => setSelectedId(conversation.id)} className={'w-full border-b border-white/5 px-4 py-3 text-left hover:bg-white/5 ' + (selectedId === conversation.id ? 'bg-[#F28C28]/10' : '')}>
                <span className="block truncate text-sm font-semibold">{profile?.display_name || (profile?.username ? '@' + profile.username : 'Membre JDV')}</span>
                <span className="mt-1 block truncate text-xs text-white/40">{profile?.username ? '@' + profile.username : 'Conversation privée'}</span>
              </button>;
            })}
          </aside>
          <section className="flex min-w-0 flex-col">
            <header className="border-b border-white/10 px-4 py-3"><h2 className="font-bold">{otherProfile?.display_name || (otherProfile?.username ? '@' + otherProfile.username : 'Sélectionnez une conversation')}</h2>{otherProfile?.username && <p className="text-xs text-white/40">@{otherProfile.username}</p>}</header>
            <div className="flex-1 space-y-3 overflow-y-auto p-4">
              {!selected ? <p className="text-sm text-white/40">Choisissez une conversation ou démarrez-en une nouvelle.</p> : messages.length === 0 ? <p className="text-sm text-white/40">Pas encore de message. Écrivez le premier.</p> : messages.map((message) => <div key={message.id} className={'flex ' + (message.sender_user_id === user.id ? 'justify-end' : 'justify-start')}>
                <div className={'max-w-[85%] rounded-2xl px-4 py-3 text-sm ' + (message.sender_user_id === user.id ? 'bg-[#F28C28] text-[#0B1B3D]' : 'bg-white/10 text-white')}>
                  <p className="whitespace-pre-wrap break-words">{message.body}</p><p className={'mt-2 text-[10px] ' + (message.sender_user_id === user.id ? 'text-[#0B1B3D]/60' : 'text-white/40')}>{new Date(message.created_at).toLocaleString('fr-FR')}</p>
                </div>
              </div>)}
            </div>
            <form onSubmit={sendMessage} className="flex gap-2 border-t border-white/10 p-3">
              <textarea aria-label="Votre message" className={fieldClass + ' min-h-12 resize-y'} value={draft} onChange={(event) => setDraft(event.target.value)} placeholder={selected ? 'Écrire un message…' : 'Sélectionnez une conversation'} maxLength={5000} rows={2} disabled={!selected || sending}/>
              <button aria-label="Envoyer le message" className={buttonClass} disabled={!selected || sending || !draft.trim()}><Send size={16}/><span className="hidden sm:inline">{sending ? 'Envoi…' : 'Envoyer'}</span></button>
            </form>
          </section>
        </div>
      </>}
    </section>
  </div></main>;
}
