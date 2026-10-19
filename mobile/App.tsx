import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Linking, Platform, SafeAreaView, ScrollView, StyleSheet, Text, Pressable, TextInput, View } from 'react-native';
import type { Session } from '@supabase/supabase-js';
import { StatusBar } from 'expo-status-bar';
import { supabase, supabaseConfigured } from './lib/supabase';

type SocialApp = { key: string; name: string; url: string; color: string };
type Preference = { app_key: string; is_added?: boolean; is_visible: boolean; sort_order: number; category: string; notifications_enabled: boolean };
type SocialProfile = { user_id: string; username: string; display_name: string | null; bio?: string | null };
type SocialPost = { id: string; author_user_id: string; body: string | null; media_url: string | null; visibility: string; status: string; created_at: string };
type SocialReaction = { id: string; post_id: string; user_id: string; reaction_type: string };
type SocialGroup = { id: string; name: string; description: string | null; visibility: 'public' | 'private'; created_by: string; created_at: string };
type SocialMembership = { group_id: string; user_id: string; role: string; status: string };
type SocialEvent = { id: string; title: string; description: string | null; starts_at: string; location: string | null; visibility: string; group_id: string | null };
type SocialRegistration = { event_id: string; user_id: string; status: string };
type SocialComment = { id: string; post_id: string; user_id: string; body: string; status: string; created_at: string };

const webSpaceUrl = process.env.EXPO_PUBLIC_JDV_WEB_URL;
const apps: SocialApp[] = [
  { key: 'whatsapp', name: 'WhatsApp', url: 'https://www.whatsapp.com/download', color: '#25D366' },
  { key: 'whatsapp_business', name: 'WhatsApp Business', url: 'https://www.whatsapp.com/business/', color: '#25D366' },
  { key: 'facebook', name: 'Facebook', url: 'https://www.facebook.com/', color: '#1877F2' },
  { key: 'instagram', name: 'Instagram', url: 'https://www.instagram.com/', color: '#E4405F' },
  { key: 'x', name: 'X', url: 'https://x.com/', color: '#111827' },
  { key: 'tiktok', name: 'TikTok', url: 'https://www.tiktok.com/download', color: '#111827' },
  { key: 'youtube', name: 'YouTube', url: 'https://www.youtube.com/', color: '#FF0033' },
  { key: 'telegram', name: 'Telegram', url: 'https://telegram.org/apps', color: '#229ED9' },
  { key: 'linkedin', name: 'LinkedIn', url: 'https://www.linkedin.com/', color: '#0A66C2' },
  { key: 'snapchat', name: 'Snapchat', url: 'https://www.snapchat.com/download', color: '#FFFC00' },
  { key: 'pinterest', name: 'Pinterest', url: 'https://www.pinterest.com/', color: '#BD081C' },
];

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [preferences, setPreferences] = useState<Record<string, Preference>>({});
  const [preferencesBusy, setPreferencesBusy] = useState(false);
  const [preferenceSaving, setPreferenceSaving] = useState('');
  const [socialProfile, setSocialProfile] = useState<SocialProfile | null>(null);
  const [profileUsername, setProfileUsername] = useState('');
  const [postBody, setPostBody] = useState('');
  const [socialPosts, setSocialPosts] = useState<SocialPost[]>([]);
  const [socialAuthors, setSocialAuthors] = useState<Record<string, SocialProfile>>({});
  const [myReactions, setMyReactions] = useState<Record<string, string>>({});
  const [commentsByPost, setCommentsByPost] = useState<Record<string, SocialComment[]>>({});
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const [commentBusy, setCommentBusy] = useState('');
  const [reactionBusy, setReactionBusy] = useState('');
  const [socialGroups, setSocialGroups] = useState<SocialGroup[]>([]);
  const [groupMemberships, setGroupMemberships] = useState<SocialMembership[]>([]);
  const [socialEvents, setSocialEvents] = useState<SocialEvent[]>([]);
  const [eventRegistrations, setEventRegistrations] = useState<SocialRegistration[]>([]);
  const [communityBusy, setCommunityBusy] = useState(false);
  const [communityAction, setCommunityAction] = useState('');
  const [feedBusy, setFeedBusy] = useState(false);
  const [postBusy, setPostBusy] = useState(false);

  useEffect(() => {
    if (!supabaseConfigured) {
      setAuthReady(true);
      return;
    }
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setAuthReady(true);
    }).catch(() => setAuthReady(true));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });
    return () => subscription.unsubscribe();
  }, []);

  const loadPreferences = useCallback(async () => {
    if (!session?.user.id) {
      setPreferences({});
      return;
    }
    setPreferencesBusy(true);
    try {
      const { data, error } = await supabase
        .from('social_app_preferences')
        .select('app_key,is_added,is_visible,sort_order,category,notifications_enabled')
        .eq('user_id', session.user.id)
        .eq('is_added', true);
      if (error) {
        setMessage('Connexion active, mais les préférences ne peuvent pas être chargées. Vérifiez les droits RLS et la connexion réseau.');
      } else {
        const next: Record<string, Preference> = {};
        for (const item of (data ?? []) as Preference[]) next[item.app_key] = item;
        setPreferences(next);
        setMessage('');
      }
    } catch {
      setMessage('Impossible de joindre Supabase pour charger les préférences. Réessayez.');
    } finally {
      setPreferencesBusy(false);
    }
  }, [session?.user.id]);

  useEffect(() => { void loadPreferences(); }, [loadPreferences]);

  const loadSocialFeed = useCallback(async () => {
    if (!session?.user.id) {
      setSocialProfile(null); setSocialPosts([]); setSocialAuthors({}); setMyReactions({}); setCommentsByPost({}); setSocialGroups([]); setGroupMemberships([]); setSocialEvents([]); setEventRegistrations([]);
      return;
    }
    setFeedBusy(true);
    try {
      const [profileResult, postsResult] = await Promise.all([
        supabase.from('social_profiles').select('user_id,username,display_name,bio').eq('user_id', session.user.id).maybeSingle(),
        supabase.from('social_posts').select('id,author_user_id,body,media_url,visibility,status,created_at').eq('status', 'published').or(`visibility.eq.public,author_user_id.eq.${session.user.id}`).order('created_at', { ascending: false }).limit(30),
      ]);
      if (profileResult.error) setMessage('Profil social indisponible : ' + profileResult.error.message);
      else {
        const item = (profileResult.data ?? null) as SocialProfile | null;
        setSocialProfile(item);
        if (item) setProfileUsername(item.username);
        else if (!profileUsername) setProfileUsername((session.user.email?.split('@')[0] || 'membre').toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 20) + '_' + session.user.id.slice(0, 4));
      }
      if (postsResult.error) setMessage('Fil JDV Social indisponible : ' + postsResult.error.message);
      else {
        const rows = (postsResult.data ?? []) as SocialPost[];
        setSocialPosts(rows);
        const ids = Array.from(new Set([session.user.id, ...rows.map((item) => item.author_user_id)]));
        if (ids.length) {
          const [authorResult, reactionResult, commentsResult] = await Promise.all([
            supabase.from('social_profiles').select('user_id,username,display_name,bio').in('user_id', ids),
            rows.length ? supabase.from('social_reactions').select('id,post_id,user_id,reaction_type').eq('user_id', session.user.id).eq('reaction_type', 'like').in('post_id', rows.map((item) => item.id)) : Promise.resolve({ data: [], error: null }),
            rows.length ? supabase.from('social_comments').select('id,post_id,user_id,body,status,created_at').in('post_id', rows.map((item) => item.id)).eq('status', 'published').order('created_at', { ascending: true }).limit(200) : Promise.resolve({ data: [], error: null }),
          ]);
          if (authorResult.error) setMessage((current) => current || 'Les noms des auteurs ne peuvent pas être chargés.');
          else {
            const lookup: Record<string, SocialProfile> = {};
            for (const item of (authorResult.data ?? []) as SocialProfile[]) lookup[item.user_id] = item;
            setSocialAuthors(lookup);
          }
          if (reactionResult.error) setMessage((current) => current || 'Vos réactions ne peuvent pas être chargées.');
          else {
            const lookup: Record<string, string> = {};
            for (const item of (reactionResult.data ?? []) as SocialReaction[]) lookup[item.post_id] = item.id;
            setMyReactions(lookup);
          }
          if (commentsResult.error) setMessage((current) => current || 'Les commentaires ne peuvent pas être chargés.');
          else {
            const lookup: Record<string, SocialComment[]> = {};
            for (const item of (commentsResult.data ?? []) as SocialComment[]) lookup[item.post_id] = [...(lookup[item.post_id] ?? []), item];
            setCommentsByPost(lookup);
          }
        } else { setSocialAuthors({}); setMyReactions({}); }
      }
    } catch {
      setMessage('Erreur réseau lors du chargement du fil JDV Social.');
    } finally {
      setFeedBusy(false);
    }
  }, [session?.user.id, session?.user.email, profileUsername]);

  useEffect(() => { void loadSocialFeed(); }, [loadSocialFeed]);

  const createSocialProfile = async () => {
    if (!session) return;
    const username = profileUsername.trim().toLowerCase();
    if (!/^[a-z0-9_]{3,30}$/.test(username)) {
      setMessage('Le nom d’utilisateur doit contenir 3 à 30 caractères : lettres, chiffres ou _.');
      return;
    }
    setBusy(true); setMessage('');
    try {
      const { data, error } = await supabase.from('social_profiles')
        .insert({ user_id: session.user.id, username, profile_status: 'active' })
        .select('user_id,username,display_name,bio').single();
      if (error) setMessage(error.message);
      else {
        setSocialProfile(data as SocialProfile);
        setSocialAuthors((current) => ({ ...current, [session.user.id]: data as SocialProfile }));
        setMessage('Votre profil JDV Social est créé.');
      }
    } catch {
      setMessage('Erreur réseau : impossible de créer le profil social.');
    } finally {
      setBusy(false);
    }
  };

  const publishSocialPost = async () => {
    if (!session || !socialProfile) {
      setMessage('Créez votre profil JDV Social avant de publier.');
      return;
    }
    const body = postBody.trim();
    if (!body) { setMessage('Écrivez un message avant de publier.'); return; }
    setPostBusy(true); setMessage('');
    try {
      const { data, error } = await supabase.from('social_posts')
        .insert({ author_user_id: session.user.id, body, visibility: 'public', status: 'published' })
        .select('id,author_user_id,body,media_url,visibility,status,created_at').single();
      if (error) setMessage(error.message);
      else {
        setSocialPosts((current) => [data as SocialPost, ...current]);
        setPostBody('');
        setMessage('Publication ajoutée au fil JDV Social.');
      }
    } catch {
      setMessage('Erreur réseau : la publication n’a pas pu être envoyée.');
    } finally {
      setPostBusy(false);
    }
  };

  const loadCommunity = useCallback(async () => {
    if (!session?.user.id) {
      setSocialGroups([]); setGroupMemberships([]); setSocialEvents([]); setEventRegistrations([]);
      return;
    }
    setCommunityBusy(true);
    try {
      const [groupsResult, membershipsResult, eventsResult, registrationsResult] = await Promise.all([
        supabase.from('social_groups').select('id,name,description,visibility,created_by,created_at').eq('status', 'active').order('created_at', { ascending: false }).limit(50),
        supabase.from('social_group_memberships').select('group_id,user_id,role,status').eq('user_id', session.user.id),
        supabase.from('social_events').select('id,title,description,starts_at,location,visibility,group_id').eq('status', 'published').order('starts_at', { ascending: true }).limit(50),
        supabase.from('social_event_registrations').select('event_id,user_id,status').eq('user_id', session.user.id),
      ]);
      if (groupsResult.error) setMessage((current) => current || 'Les groupes ne peuvent pas être chargés.');
      else setSocialGroups((groupsResult.data ?? []) as SocialGroup[]);
      if (membershipsResult.error) setMessage((current) => current || 'Vos adhésions ne peuvent pas être chargées.');
      else setGroupMemberships((membershipsResult.data ?? []) as SocialMembership[]);
      if (eventsResult.error) setMessage((current) => current || 'Les événements ne peuvent pas être chargés.');
      else setSocialEvents((eventsResult.data ?? []) as SocialEvent[]);
      if (registrationsResult.error) setMessage((current) => current || 'Vos inscriptions ne peuvent pas être chargées.');
      else setEventRegistrations((registrationsResult.data ?? []) as SocialRegistration[]);
    } catch {
      setMessage('Erreur réseau lors du chargement des groupes et événements.');
    } finally {
      setCommunityBusy(false);
    }
  }, [session?.user.id]);

  useEffect(() => { void loadCommunity(); }, [loadCommunity]);

  const joinSocialGroup = async (group: SocialGroup) => {
    if (!session || communityAction) return;
    const existing = groupMemberships.find((item) => item.group_id === group.id);
    const status = group.visibility === 'public' ? 'active' : 'pending';
    setCommunityAction(group.id); setMessage('');
    try {
      const { error } = await supabase.from('social_group_memberships').upsert({
        group_id: group.id, user_id: session.user.id, role: 'member', status,
      }, { onConflict: 'group_id,user_id' });
      if (error) setMessage(error.message);
      else {
        setGroupMemberships((current) => [...current.filter((item) => item.group_id !== group.id), { group_id: group.id, user_id: session.user.id, role: existing?.role ?? 'member', status }]);
        setMessage(status === 'active' ? 'Vous avez rejoint le groupe.' : 'Demande d’adhésion envoyée.');
      }
    } catch {
      setMessage('Erreur réseau : impossible de rejoindre ce groupe.');
    } finally {
      setCommunityAction('');
    }
  };

  const registerSocialEvent = async (item: SocialEvent) => {
    if (!session || communityAction) return;
    const current = eventRegistrations.find((row) => row.event_id === item.id);
    const status = current?.status === 'registered' ? 'cancelled' : 'registered';
    setCommunityAction(item.id); setMessage('');
    try {
      const { error } = await supabase.from('social_event_registrations').upsert({
        event_id: item.id, user_id: session.user.id, status,
      }, { onConflict: 'event_id,user_id' });
      if (error) setMessage(error.message);
      else {
        setEventRegistrations((rows) => [...rows.filter((row) => row.event_id !== item.id), { event_id: item.id, user_id: session.user.id, status }]);
        setMessage(status === 'registered' ? 'Inscription à l’événement confirmée.' : 'Inscription annulée.');
      }
    } catch {
      setMessage('Erreur réseau : impossible de modifier votre inscription.');
    } finally {
      setCommunityAction('');
    }
  };

  const addSocialComment = async (post: SocialPost) => {
    if (!session || commentBusy) return;
    const body = (commentDrafts[post.id] ?? '').trim();
    if (!body) { setMessage('Écrivez un commentaire avant de l’envoyer.'); return; }
    setCommentBusy(post.id); setMessage('');
    try {
      const { data, error } = await supabase.from('social_comments')
        .insert({ post_id: post.id, user_id: session.user.id, body, status: 'published' })
        .select('id,post_id,user_id,body,status,created_at').single();
      if (error) setMessage(error.message);
      else {
        const item = data as SocialComment;
        setCommentsByPost((current) => ({ ...current, [post.id]: [...(current[post.id] ?? []), item] }));
        setCommentDrafts((current) => ({ ...current, [post.id]: '' }));
      }
    } catch {
      setMessage('Erreur réseau : le commentaire n’a pas pu être envoyé.');
    } finally {
      setCommentBusy('');
    }
  };

  const togglePostLike = async (post: SocialPost) => {
    if (!session || reactionBusy) return;
    const existingId = myReactions[post.id];
    setReactionBusy(post.id); setMessage('');
    try {
      if (existingId) {
        const { error } = await supabase.from('social_reactions').delete().eq('id', existingId).eq('user_id', session.user.id);
        if (error) setMessage(error.message);
        else setMyReactions((current) => { const next = { ...current }; delete next[post.id]; return next; });
      } else {
        const { data, error } = await supabase.from('social_reactions')
          .insert({ post_id: post.id, user_id: session.user.id, reaction_type: 'like' })
          .select('id,post_id,user_id,reaction_type').single();
        if (error) setMessage(error.message);
        else setMyReactions((current) => ({ ...current, [post.id]: (data as SocialReaction).id }));
      }
    } catch {
      setMessage('Erreur réseau : votre réaction n’a pas pu être enregistrée.');
    } finally {
      setReactionBusy('');
    }
  };

  const authenticate = async (mode: 'signin' | 'signup') => {
    if (!supabaseConfigured) {
      setMessage('Configuration manquante : renseignez EXPO_PUBLIC_SUPABASE_URL et une clé publishable dans le fichier .env.');
      return;
    }
    if (!email.trim() || !password) {
      setMessage('Saisissez votre adresse e-mail et votre mot de passe.');
      return;
    }
    if (mode === 'signup' && password.length < 8) {
      setMessage('Le mot de passe doit contenir au moins 8 caractères.');
      return;
    }
    setBusy(true);
    setMessage('');
    try {
      const result = mode === 'signin'
        ? await supabase.auth.signInWithPassword({ email: email.trim(), password })
        : await supabase.auth.signUp({ email: email.trim(), password });
      if (result.error) setMessage(result.error.message);
      else if (mode === 'signup' && !result.data.session) setMessage('Compte créé. Vérifiez votre e-mail pour confirmer l’inscription avant de vous connecter.');
      else setMessage(mode === 'signup' ? 'Compte créé et connecté.' : 'Connexion réussie.');
    } catch {
      setMessage('La connexion a échoué. Vérifiez votre réseau puis réessayez.');
    } finally {
      setBusy(false);
    }
  };

  const signOut = async () => {
    setBusy(true);
    setMessage('');
    try {
      const { error } = await supabase.auth.signOut();
      if (error) setMessage(error.message);
      else setMessage('Vous êtes déconnecté.');
    } catch {
      setMessage('La déconnexion a échoué. Vérifiez votre connexion puis réessayez.');
    } finally {
      setBusy(false);
    }
  };

  const toggleVisibility = async (app: SocialApp) => {
    if (!session || preferenceSaving) return;
    const current = preferences[app.key];
    const next: Preference = {
      app_key: app.key,
      is_added: true,
      is_visible: current ? !current.is_visible : false,
      sort_order: current?.sort_order ?? apps.findIndex((item) => item.key === app.key),
      category: current?.category ?? 'Réseaux sociaux',
      notifications_enabled: current?.notifications_enabled ?? true,
    };
    setPreferenceSaving(app.key);
    setMessage('');
    setPreferences((previous) => ({ ...previous, [app.key]: next }));
    try {
      const { error } = await supabase.from('social_app_preferences').upsert({
        user_id: session.user.id,
        ...next,
      }, { onConflict: 'user_id,app_key' });
      if (error) {
        setPreferences((previous) => {
          const restored = { ...previous };
          if (current) restored[app.key] = current;
          else delete restored[app.key];
          return restored;
        });
        setMessage('Impossible d’enregistrer cette préférence. Vérifiez la connexion et les politiques RLS.');
      } else {
        setMessage('Préférence enregistrée et synchronisée avec Supabase.');
      }
    } catch {
      setPreferences((previous) => {
        const restored = { ...previous };
        if (current) restored[app.key] = current;
        else delete restored[app.key];
        return restored;
      });
      setMessage('Erreur réseau : la préférence n’a pas pu être enregistrée.');
    } finally {
      setPreferenceSaving('');
    }
  };

  const toggleNotifications = async (app: SocialApp) => {
    if (!session || preferenceSaving) return;
    const current = preferences[app.key];
    const next: Preference = { app_key: app.key, is_added: true, is_visible: current?.is_visible ?? true, sort_order: current?.sort_order ?? apps.findIndex((item) => item.key === app.key), category: current?.category ?? 'Réseaux sociaux', notifications_enabled: current ? !current.notifications_enabled : false };
    setPreferenceSaving(app.key); setMessage(''); setPreferences((previous) => ({ ...previous, [app.key]: next }));
    try {
      const { error } = await supabase.from('social_app_preferences').upsert({ user_id: session.user.id, ...next }, { onConflict: 'user_id,app_key' });
      if (error) {
        setPreferences((previous) => { const restored = { ...previous }; if (current) restored[app.key] = current; else delete restored[app.key]; return restored; });
        setMessage('Impossible d’enregistrer les alertes de cette application. Vérifiez la connexion et les politiques RLS.');
      } else setMessage('Préférences d’alertes synchronisées avec Supabase.');
    } catch {
      setPreferences((previous) => { const restored = { ...previous }; if (current) restored[app.key] = current; else delete restored[app.key]; return restored; });
      setMessage('Erreur réseau : les alertes n’ont pas pu être enregistrées.');
    } finally { setPreferenceSaving(''); }
  };

  const openUrl = async (url: string) => {
    try { await Linking.openURL(url); }
    catch { if (Platform.OS !== 'web') Alert.alert('Lien indisponible', 'Impossible d’ouvrir ce lien sur cet appareil.'); }
  };

  const openWebSpace = () => {
    if (!webSpaceUrl || webSpaceUrl.includes('YOUR_WEB_DOMAIN')) {
      setMessage('L’adresse officielle Web doit être définie dans EXPO_PUBLIC_JDV_WEB_URL.');
      return;
    }
    void openUrl(webSpaceUrl);
  };

  if (!authReady) {
    return <SafeAreaView style={styles.safe}><ActivityIndicator color="#F28C28" size="large" /></SafeAreaView>;
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.eyebrow}>JDV GLOBAL CENTER</Text>
          <Text style={styles.title}>JDV Social</Text>
          <Text style={styles.subtitle}>Votre espace social sur Android, iPhone et le Web.</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Mon compte JDV</Text>
          {!supabaseConfigured ? (
            <Text style={styles.body}>Supabase n’est pas encore configuré dans l’environnement local. Ajoutez les variables du fichier .env.example dans votre fichier .env pour activer l’authentification.</Text>
          ) : session ? (
            <>
              <Text style={styles.body}>Connecté en tant que {session.user.email ?? 'utilisateur JDV'}.</Text>
              <Pressable accessibilityRole="button" style={styles.secondaryButton} onPress={() => void signOut()}>
                <Text style={styles.secondaryButtonText}>Se déconnecter</Text>
              </Pressable>
            </>
          ) : (
            <>
              <TextInput accessibilityLabel="Adresse e-mail" autoCapitalize="none" autoComplete="email" keyboardType="email-address" placeholder="Adresse e-mail" placeholderTextColor="#8799B6" value={email} onChangeText={setEmail} style={styles.input} />
              <TextInput accessibilityLabel="Mot de passe" autoCapitalize="none" autoComplete="password" placeholder="Mot de passe (8 caractères minimum)" placeholderTextColor="#8799B6" secureTextEntry value={password} onChangeText={setPassword} style={styles.input} />
              <Pressable accessibilityRole="button" disabled={busy} style={styles.primaryButton} onPress={() => void authenticate('signin')}>
                <Text style={styles.primaryButtonText}>{busy ? 'Patientez…' : 'Se connecter'}</Text>
              </Pressable>
              <Pressable accessibilityRole="button" disabled={busy} style={styles.secondaryButton} onPress={() => void authenticate('signup')}>
                <Text style={styles.secondaryButtonText}>Créer un compte</Text>
              </Pressable>
            </>
          )}
          {!!message && <Text accessibilityRole="alert" style={styles.message}>{message}</Text>}
          <Pressable accessibilityRole="button" style={styles.primaryButton} onPress={openWebSpace}>
            <Text style={styles.primaryButtonText}>Ouvrir mon espace Web</Text>
          </Pressable>
        </View>

        {session && <View style={styles.section}>
          <Text style={styles.sectionTitle}>Mon profil JDV Social</Text>
          {socialProfile ? <Text style={styles.body}>Profil actif : @{socialProfile.username}{socialProfile.display_name ? ' · ' + socialProfile.display_name : ''}</Text> : <>
            <Text style={styles.body}>Créez votre identifiant communautaire pour publier dans le fil commun avec la version Web.</Text>
            <TextInput accessibilityLabel="Nom d’utilisateur JDV Social" autoCapitalize="none" autoCorrect={false} placeholder="nom_utilisateur" placeholderTextColor="#8799B6" value={profileUsername} onChangeText={setProfileUsername} maxLength={30} style={styles.input} />
            <Pressable accessibilityRole="button" disabled={busy} style={styles.primaryButton} onPress={() => void createSocialProfile()}><Text style={styles.primaryButtonText}>{busy ? 'Création…' : 'Créer mon profil social'}</Text></Pressable>
          </>}
          <Text style={[styles.sectionTitle, { marginTop: 18 }]}>Publier un message</Text>
          <TextInput accessibilityLabel="Texte de la publication" multiline textAlignVertical="top" placeholder="Que souhaitez-vous partager ?" placeholderTextColor="#8799B6" value={postBody} onChangeText={setPostBody} maxLength={5000} style={[styles.input, { minHeight: 90 }]} />
          <Pressable accessibilityRole="button" disabled={postBusy || !socialProfile} style={styles.primaryButton} onPress={() => void publishSocialPost()}><Text style={styles.primaryButtonText}>{postBusy ? 'Publication…' : 'Publier dans JDV Social'}</Text></Pressable>
          <View style={styles.sectionHeading}><Text style={[styles.sectionTitle, { marginTop: 18 }]}>Fil communautaire</Text><Pressable accessibilityRole="button" onPress={() => void loadSocialFeed()} disabled={feedBusy}><Text style={styles.openLabel}>{feedBusy ? 'Actualisation…' : 'Actualiser'}</Text></Pressable></View>
          {feedBusy && <ActivityIndicator color="#F28C28" />}
          {!feedBusy && socialPosts.length === 0 && <Text style={styles.body}>Aucune publication visible pour le moment.</Text>}
          {socialPosts.map((post) => <View key={post.id} style={styles.postCard}>
            <Text style={styles.postAuthor}>{socialAuthors[post.author_user_id]?.display_name || '@' + (socialAuthors[post.author_user_id]?.username || 'membre')}</Text>
            <Text style={styles.postDate}>{new Date(post.created_at).toLocaleString()}</Text>
            {!!post.body && <Text style={styles.postBody}>{post.body}</Text>}
            {!!post.media_url && <Pressable accessibilityRole="link" onPress={() => void openUrl(post.media_url!)}><Text style={styles.openLabel}>Ouvrir le média ↗</Text></Pressable>}
            <Pressable accessibilityRole="button" disabled={reactionBusy === post.id} onPress={() => void togglePostLike(post)} style={styles.likeButton}>
              <Text style={styles.visibilityText}>{reactionBusy === post.id ? 'Enregistrement…' : myReactions[post.id] ? '♥ J’aime' : '♡ J’aime'}</Text>
            </Pressable>
            {(commentsByPost[post.id] ?? []).map((comment) => <View key={comment.id} style={styles.commentCard}>
              <Text style={styles.postAuthor}>{socialAuthors[comment.user_id]?.display_name || '@' + (socialAuthors[comment.user_id]?.username || 'membre')}</Text>
              <Text style={styles.postBody}>{comment.body}</Text>
            </View>)}
            <TextInput accessibilityLabel="Écrire un commentaire" placeholder="Écrire un commentaire…" placeholderTextColor="#8799B6" value={commentDrafts[post.id] ?? ''} onChangeText={(value) => setCommentDrafts((current) => ({ ...current, [post.id]: value }))} maxLength={2000} style={styles.input} />
            <Pressable accessibilityRole="button" disabled={commentBusy === post.id} onPress={() => void addSocialComment(post)} style={styles.likeButton}><Text style={styles.visibilityText}>{commentBusy === post.id ? 'Envoi…' : 'Commenter'}</Text></Pressable>
          </View>)}
        </View>}
        {session && <View style={styles.section}>
          <View style={styles.sectionHeading}><Text style={styles.sectionTitle}>Groupes JDV Social</Text><Pressable accessibilityRole="button" disabled={communityBusy} onPress={() => void loadCommunity()}><Text style={styles.openLabel}>{communityBusy ? 'Actualisation…' : 'Actualiser'}</Text></Pressable></View>
          {socialGroups.length === 0 && !communityBusy && <Text style={styles.body}>Aucun groupe disponible actuellement.</Text>}
          {socialGroups.map((group) => {
            const membership = groupMemberships.find((item) => item.group_id === group.id);
            const active = membership?.status === 'active';
            const pending = membership?.status === 'pending';
            return <View key={group.id} style={styles.postCard}>
              <Text style={styles.postAuthor}>{group.name}</Text>
              {!!group.description && <Text style={styles.postBody}>{group.description}</Text>}
              <Text style={styles.postDate}>{group.visibility === 'public' ? 'Groupe public' : 'Groupe privé'}</Text>
              {!active && <Pressable accessibilityRole="button" disabled={Boolean(communityAction) || pending} onPress={() => void joinSocialGroup(group)} style={styles.likeButton}><Text style={styles.visibilityText}>{communityAction === group.id ? 'Enregistrement…' : pending ? 'Demande envoyée' : group.visibility === 'public' ? 'Rejoindre' : 'Demander l’accès'}</Text></Pressable>}
              {active && <Text style={styles.openLabel}>Membre ✓</Text>}
            </View>;
          })}
          <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Événements JDV Social</Text>
          {socialEvents.length === 0 && !communityBusy && <Text style={styles.body}>Aucun événement publié actuellement.</Text>}
          {socialEvents.map((item) => {
            const registration = eventRegistrations.find((row) => row.event_id === item.id);
            const registered = registration?.status === 'registered';
            return <View key={item.id} style={styles.postCard}>
              <Text style={styles.postAuthor}>{item.title}</Text>
              <Text style={styles.postDate}>{new Date(item.starts_at).toLocaleString()}{item.location ? ' · ' + item.location : ''}</Text>
              {!!item.description && <Text style={styles.postBody}>{item.description}</Text>}
              <Pressable accessibilityRole="button" disabled={Boolean(communityAction)} onPress={() => void registerSocialEvent(item)} style={styles.likeButton}><Text style={styles.visibilityText}>{communityAction === item.id ? 'Enregistrement…' : registered ? 'Annuler mon inscription' : 'Participer'}</Text></Pressable>
            </View>;
          })}
        </View>}
        <View style={styles.section}>
          <View style={styles.sectionHeading}>
            <Text style={styles.sectionTitle}>Applications sociales</Text>
            {session && <Pressable onPress={() => void loadPreferences()}><Text style={styles.openLabel}>Actualiser</Text></Pressable>}
          </View>
          <Text style={styles.body}>
            {session ? 'Vos préférences de visibilité sont enregistrées sur votre compte JDV.' : 'Connectez-vous pour synchroniser vos préférences entre le Web et le mobile.'}
          </Text>
          {preferencesBusy && <ActivityIndicator color="#F28C28" />}
          {apps.map((app) => {
            const visible = preferences[app.key]?.is_visible ?? true;
            return (
              <View key={app.key} style={[styles.appRow, !visible && styles.appHidden]}>
                <View style={[styles.appMark, { backgroundColor: app.color }]} />
                <Text style={styles.appName}>{app.name}</Text>
                {session && <Pressable accessibilityRole="button" disabled={Boolean(preferenceSaving)} onPress={() => void toggleVisibility(app)} style={styles.visibilityButton}>
                  <Text style={styles.visibilityText}>{preferenceSaving === app.key ? 'Enregistrement…' : visible ? 'Masquer' : 'Afficher'}</Text>
                </Pressable>}
                {session && <Pressable accessibilityRole="button" disabled={Boolean(preferenceSaving)} onPress={() => void toggleNotifications(app)} style={styles.visibilityButton}><Text style={styles.visibilityText}>{preferenceSaving === app.key ? 'Enregistrement…' : (preferences[app.key]?.notifications_enabled ?? true) ? 'Alertes : oui' : 'Alertes : non'}</Text></Pressable>}
                <Pressable accessibilityRole="link" onPress={() => void openUrl(app.url)}><Text style={styles.openLabel}>Ouvrir ↗</Text></Pressable>
              </View>
            );
          })}
        </View>
        <Text style={styles.footer}>{Platform.OS === 'web' ? 'Version Web de la base mobile' : 'Application mobile Android / iOS'} · JDV Social</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#07152F' },
  content: { width: '100%', maxWidth: 720, alignSelf: 'center', padding: 22, paddingBottom: 40 },
  header: { paddingTop: 28, paddingBottom: 28 },
  eyebrow: { color: '#F28C28', fontSize: 12, fontWeight: '800', letterSpacing: 2 },
  title: { color: '#FFFFFF', fontSize: 38, fontWeight: '800', marginTop: 10 },
  subtitle: { color: '#C9D4E8', fontSize: 16, lineHeight: 24, marginTop: 10 },
  section: { backgroundColor: '#102343', borderColor: '#243B5F', borderWidth: 1, borderRadius: 20, padding: 18, marginBottom: 18 },
  sectionHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { color: '#FFFFFF', fontSize: 20, fontWeight: '800', marginBottom: 10 },
  body: { color: '#C9D4E8', fontSize: 14, lineHeight: 22, marginBottom: 16 },
  input: { color: '#FFFFFF', backgroundColor: '#0A1A35', borderColor: '#31496D', borderWidth: 1, borderRadius: 12, padding: 13, marginBottom: 10 },
  primaryButton: { backgroundColor: '#F28C28', paddingVertical: 14, paddingHorizontal: 16, borderRadius: 12, alignItems: 'center', marginTop: 8 },
  primaryButtonText: { color: '#07152F', fontSize: 15, fontWeight: '800' },
  secondaryButton: { backgroundColor: '#1A3152', paddingVertical: 13, paddingHorizontal: 16, borderRadius: 12, alignItems: 'center', marginTop: 8 },
  secondaryButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  message: { color: '#F6B36E', fontSize: 13, lineHeight: 19, marginTop: 12, marginBottom: 4 },
  appRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0A1A35', padding: 14, borderRadius: 12, marginTop: 8 },
  postCard: { backgroundColor: '#0A1A35', borderColor: '#243B5F', borderWidth: 1, borderRadius: 14, padding: 14, marginTop: 10 },
  postAuthor: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
  postDate: { color: '#8799B6', fontSize: 11, marginTop: 4 },
  postBody: { color: '#C9D4E8', fontSize: 14, lineHeight: 22, marginTop: 10 },
  likeButton: { alignSelf: 'flex-start', marginTop: 10, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 8, backgroundColor: '#102343' },
  commentCard: { backgroundColor: '#102343', borderRadius: 8, padding: 10, marginTop: 8 },
  appHidden: { opacity: 0.65 },
  appMark: { width: 12, height: 12, borderRadius: 6, marginRight: 12 },
  appName: { color: '#FFFFFF', fontSize: 14, fontWeight: '700', flex: 1 },
  visibilityButton: { paddingHorizontal: 8, paddingVertical: 6, marginRight: 8 },
  visibilityText: { color: '#F6B36E', fontSize: 12, fontWeight: '700' },
  openLabel: { color: '#F6B36E', fontSize: 12, fontWeight: '700' },
  footer: { color: '#8799B6', fontSize: 12, textAlign: 'center', marginTop: 8 },
});
