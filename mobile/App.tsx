import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Linking, Platform, SafeAreaView, ScrollView, StyleSheet, Text, Pressable, TextInput, View } from 'react-native';
import type { Session } from '@supabase/supabase-js';
import { StatusBar } from 'expo-status-bar';
import { supabase, supabaseConfigured } from './lib/supabase';

type SocialApp = { key: string; name: string; url: string; color: string };
type Preference = { app_key: string; is_added?: boolean; is_visible: boolean; sort_order: number; category: string; notifications_enabled: boolean };

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
                {session && <Pressable accessibilityRole="button" disabled={Boolean(preferenceSaving)} onPress={() => void toggleNotifications(app)} style={styles.visibilityButton}><Text style={styles.visibilityText}>{preferenceSaving === app.key ? 'Enregistrement…' : preferences[app.key]?.notifications_enabled ? 'Alertes : oui' : 'Alertes : non'}</Text></Pressable>}
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
  appHidden: { opacity: 0.65 },
  appMark: { width: 12, height: 12, borderRadius: 6, marginRight: 12 },
  appName: { color: '#FFFFFF', fontSize: 14, fontWeight: '700', flex: 1 },
  visibilityButton: { paddingHorizontal: 8, paddingVertical: 6, marginRight: 8 },
  visibilityText: { color: '#F6B36E', fontSize: 12, fontWeight: '700' },
  openLabel: { color: '#F6B36E', fontSize: 12, fontWeight: '700' },
  footer: { color: '#8799B6', fontSize: 12, textAlign: 'center', marginTop: 8 },
});
