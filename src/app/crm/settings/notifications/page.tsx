'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, BellRing, Loader2, Save, Mail, MessageSquare, Smartphone } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

type Preferences = { email_enabled: boolean; sms_enabled: boolean; whatsapp_enabled: boolean; phone_e164: string };
const defaults: Preferences = { email_enabled: false, sms_enabled: false, whatsapp_enabled: false, phone_e164: '' };

export default function CrmNotificationSettingsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const supabase = createClient();
  const [prefs, setPrefs] = useState<Preferences>(defaults);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.from('crm_notification_preferences')
        .select('email_enabled,sms_enabled,whatsapp_enabled,phone_e164')
        .eq('user_id', user.id).maybeSingle();
      if (error) throw error;
      if (data) setPrefs({ ...defaults, ...data, phone_e164: data.phone_e164 || '' });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Impossible de charger les préférences.');
    } finally { setLoading(false); }
  }, [user, supabase]);

  useEffect(() => {
    if (!user) { router.push('/auth/login'); return; }
    void load();
  }, [user, load, router]);

  const save = async () => {
    if (!user) return;
    if ((prefs.sms_enabled || prefs.whatsapp_enabled) && !/^\+[1-9][0-9]{7,14}$/.test(prefs.phone_e164)) {
      toast.error('Saisis un numéro international au format +229XXXXXXXX.');
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase.from('crm_notification_preferences').upsert({
        user_id: user.id,
        email_enabled: prefs.email_enabled,
        sms_enabled: prefs.sms_enabled,
        whatsapp_enabled: prefs.whatsapp_enabled,
        phone_e164: prefs.phone_e164 || null,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });
      if (error) throw error;
      toast.success('Préférences enregistrées. Les envois attendent la configuration des fournisseurs.');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Enregistrement impossible.');
    } finally { setSaving(false); }
  };

  const test = async () => {
    setTesting(true);
    try {
      const { data, error } = await supabase.functions.invoke('jdv-crm-notification-dispatch', { body: {} });
      if (error) throw error;
      if (data?.missing_configuration?.length) {
        toast.error('Configuration manquante : ' + data.missing_configuration.join(', '));
      } else if (data?.failed) toast.error(`Envois échoués : ${data.failed}`);
      else toast.success(`Contrôle terminé : ${data?.sent ?? 0} notification(s) envoyée(s).`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Impossible de lancer le test.');
    } finally { setTesting(false); }
  };

  const Toggle = ({ label, description, checked, onChange, icon: Icon }: {
    label: string; description: string; checked: boolean; onChange: (v: boolean) => void; icon: React.ComponentType<{size?: number}>;
  }) => (
    <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-white/10 bg-white/5 p-4">
      <Icon size={20} />
      <span className="flex-1"><span className="block font-medium">{label}</span><span className="mt-1 block text-sm text-white/50">{description}</span></span>
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} className="mt-1 h-4 w-4 accent-orange-500" />
    </label>
  );

  return <div className="min-h-screen bg-[#0D1F3C] text-white">
    <header className="border-b border-white/10"><div className="mx-auto flex h-16 max-w-3xl items-center gap-3 px-4">
      <Link href="/crm" className="rounded-lg p-2 text-white/60 hover:bg-white/10" aria-label="Retour au CRM"><ArrowLeft size={18} /></Link>
      <BellRing className="text-[#F97316]" size={20} /><div><h1 className="font-bold">Notifications externes</h1><p className="text-xs text-white/45">E-mail, SMS et WhatsApp</p></div>
    </div></header>
    <main className="mx-auto max-w-3xl space-y-4 px-4 py-6">
      {loading ? <div className="flex justify-center py-16"><Loader2 className="animate-spin" /></div> : <>
        <div className="rounded-xl border border-amber-400/20 bg-amber-400/10 p-4 text-sm text-amber-100">
          Les clés d’expédition sont conservées côté serveur dans Supabase, jamais dans le navigateur. Les canaux restent inactifs tant que leurs clés et expéditeurs ne sont pas configurés.
        </div>
        <div className="space-y-3">
          <Toggle label="E-mail" description={`Recevoir les alertes sur ${user?.email || 'l’adresse du compte'} (Resend requis).`} checked={prefs.email_enabled} onChange={v => setPrefs(p => ({ ...p, email_enabled: v }))} icon={Mail} />
          <Toggle label="SMS" description="Recevoir les alertes sur votre numéro (Twilio SMS requis)." checked={prefs.sms_enabled} onChange={v => setPrefs(p => ({ ...p, sms_enabled: v }))} icon={Smartphone} />
          <Toggle label="WhatsApp" description="Recevoir les alertes WhatsApp (expéditeur WhatsApp Business/Twilio requis)." checked={prefs.whatsapp_enabled} onChange={v => setPrefs(p => ({ ...p, whatsapp_enabled: v }))} icon={MessageSquare} />
        </div>
        <label className="block space-y-2 text-sm"><span className="font-medium">Numéro international</span>
          <input value={prefs.phone_e164} onChange={e => setPrefs(p => ({ ...p, phone_e164: e.target.value.trim() }))} placeholder="+229XXXXXXXX" className="w-full rounded-xl border border-white/15 bg-white/5 px-3 py-3 text-white outline-none focus:border-[#F97316]" />
          <span className="block text-xs text-white/45">Utilisé uniquement pour les canaux SMS et WhatsApp que vous activez.</span>
        </label>
        <div className="flex flex-wrap gap-3">
          <button onClick={() => void save()} disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-[#F97316] px-4 py-3 font-semibold disabled:opacity-50">{saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Enregistrer mes choix</button>
          <button onClick={() => void test()} disabled={testing || loading} className="inline-flex items-center gap-2 rounded-xl border border-white/20 px-4 py-3 font-semibold disabled:opacity-50">{testing ? <Loader2 size={16} className="animate-spin" /> : <BellRing size={16} />} Tester les alertes actives</button>
        </div>
      </>}
    </main>
  </div>;
}
