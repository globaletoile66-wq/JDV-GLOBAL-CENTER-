import React from 'react';
import { Alert, Linking, Platform, SafeAreaView, ScrollView, StyleSheet, Text, Pressable, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';

const webSpaceUrl = process.env.EXPO_PUBLIC_JDV_WEB_URL;

const apps = [
  { name: 'WhatsApp', url: 'https://www.whatsapp.com/download', color: '#25D366' },
  { name: 'WhatsApp Business', url: 'https://www.whatsapp.com/business/', color: '#25D366' },
  { name: 'Facebook', url: 'https://www.facebook.com/', color: '#1877F2' },
  { name: 'Instagram', url: 'https://www.instagram.com/', color: '#E4405F' },
  { name: 'X', url: 'https://x.com/', color: '#111827' },
  { name: 'TikTok', url: 'https://www.tiktok.com/download', color: '#111827' },
  { name: 'YouTube', url: 'https://www.youtube.com/', color: '#FF0033' },
  { name: 'Telegram', url: 'https://telegram.org/apps', color: '#229ED9' },
  { name: 'LinkedIn', url: 'https://www.linkedin.com/', color: '#0A66C2' },
  { name: 'Snapchat', url: 'https://www.snapchat.com/download', color: '#FFFC00' },
  { name: 'Pinterest', url: 'https://www.pinterest.com/', color: '#BD081C' },
];

export default function App() {
  const openUrl = async (url: string) => {
    try {
      await Linking.openURL(url);
    } catch {
      if (Platform.OS !== 'web') Alert.alert('Lien indisponible', 'Impossible d’ouvrir ce lien sur cet appareil.');
    }
  };

  const openWebSpace = () => {
    if (!webSpaceUrl || webSpaceUrl.includes('YOUR_WEB_DOMAIN')) {
      Alert.alert('Configuration requise', 'L’adresse officielle de JDV Global Center doit être définie dans EXPO_PUBLIC_JDV_WEB_URL.');
      return;
    }
    void openUrl(webSpaceUrl);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.eyebrow}>JDV GLOBAL CENTER</Text>
          <Text style={styles.title}>JDV Social</Text>
          <Text style={styles.subtitle}>
            Votre espace social, accessible sur Android, iPhone et le Web.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Mon espace</Text>
          <Text style={styles.body}>
            Retrouvez les applications sociales utiles et accédez à leurs sites officiels.
            La connexion au compte JDV et la synchronisation des préférences seront ajoutées dans la prochaine étape.
          </Text>
          <Pressable accessibilityRole="button" style={styles.primaryButton} onPress={openWebSpace}>
            <Text style={styles.primaryButtonText}>Ouvrir mon espace Web</Text>
          </Pressable>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Applications sociales</Text>
          {apps.map((app) => (
            <Pressable
              key={app.name}
              accessibilityRole="link"
              onPress={() => void openUrl(app.url)}
              style={({ pressed }) => [styles.appRow, pressed && styles.pressed]}
            >
              <View style={[styles.appMark, { backgroundColor: app.color }]} />
              <Text style={styles.appName}>{app.name}</Text>
              <Text style={styles.openLabel}>Ouvrir ↗</Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.footer}>
          {Platform.OS === 'web' ? 'Version Web de la base mobile' : 'Application mobile en construction'}
          {' · '}JDV Social
        </Text>
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
  sectionTitle: { color: '#FFFFFF', fontSize: 20, fontWeight: '800', marginBottom: 10 },
  body: { color: '#C9D4E8', fontSize: 14, lineHeight: 22, marginBottom: 16 },
  primaryButton: { backgroundColor: '#F28C28', paddingVertical: 14, paddingHorizontal: 16, borderRadius: 12, alignItems: 'center' },
  primaryButtonText: { color: '#07152F', fontSize: 15, fontWeight: '800' },
  appRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0A1A35', padding: 14, borderRadius: 12, marginTop: 8 },
  appMark: { width: 12, height: 12, borderRadius: 6, marginRight: 12 },
  appName: { color: '#FFFFFF', fontSize: 15, fontWeight: '700', flex: 1 },
  openLabel: { color: '#F6B36E', fontSize: 13, fontWeight: '700' },
  pressed: { opacity: 0.72 },
  footer: { color: '#8799B6', fontSize: 12, textAlign: 'center', marginTop: 8 },
});
