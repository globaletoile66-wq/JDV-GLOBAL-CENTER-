'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Loader2, UserPlus, AlertCircle, Globe2, Phone, Mail, LockKeyhole } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import AppLogo from '@/components/ui/AppLogo';
import { createClient } from '@/lib/supabase/client';

type Country = { id: string; name: string; iso_code: string; flag_emoji: string | null; phone_code: string | null };

export default function RegisterPage() {
  const { signUp } = useAuth();
  const router = useRouter();
  const supabase = createClient();
  const [countries, setCountries] = useState<Country[]>([]);
  const [countryId, setCountryId] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    void supabase.from('countries').select('id,name,iso_code,flag_emoji,phone_code')
      .eq('is_active', true).order('name')
      .then(({ data, error: loadError }) => {
        if (!active) return;
        if (loadError) { setError('Impossible de charger la liste des pays. Réessayez dans un instant.'); return; }
        const items = (data ?? []) as Country[];
        setCountries(items);
        const benin = items.find((item) => item.iso_code?.toUpperCase() === 'BJ');
        if (benin) setCountryId(benin.id);
      });
    return () => { active = false; };
  }, [supabase]);

  const selectedCountry = countries.find((country) => country.id === countryId);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    if (!countryId) { setError('Choisissez votre pays de résidence ou d’activité.'); return; }
    if (!phone.trim()) { setError('Le numéro de téléphone est obligatoire.'); return; }
    setLoading(true);
    try {
      const result = await signUp(email.trim(), password, {
        phone: phone.trim(),
        country_id: countryId,
        country_iso_code: selectedCountry?.iso_code ?? null,
        country_name: selectedCountry?.name ?? null,
      });
      router.replace(result.session ? '/onboarding' : `/auth/verify-email?email=${encodeURIComponent(email.trim())}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Inscription impossible.');
    } finally {
      setLoading(false);
    }
  }

  return <main className="min-h-screen bg-background flex items-center justify-center px-4 py-10">
    <section className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-xl sm:p-8">
      <div className="flex items-center gap-3 mb-8"><AppLogo size={44}/><div><h1 className="font-extrabold text-xl">Créer un compte</h1><p className="text-xs text-muted-foreground">JDV GLOBAL CENTER · PROFIL LOCALISÉ</p></div></div>
      <p className="mb-6 text-sm leading-6 text-muted-foreground">Indiquez votre pays et vos coordonnées pour personnaliser les services, les recherches et les informations locales proposés par JDV.</p>
      {error && <div role="alert" className="mb-5 flex gap-2 rounded-xl border border-danger/25 bg-danger/10 p-3 text-sm text-danger"><AlertCircle size={17} className="shrink-0 mt-0.5"/>{error}</div>}
      <form onSubmit={submit} className="space-y-5">
        <div><label htmlFor="country" className="mb-1.5 block text-sm font-semibold"><Globe2 size={15} className="mr-2 inline"/>Pays de résidence ou d’activité *</label>
          <select id="country" required value={countryId} onChange={event=>setCountryId(event.target.value)} className="jdv-input w-full" disabled={!countries.length}>
            <option value="">{countries.length ? 'Sélectionnez votre pays' : 'Chargement des pays…'}</option>
            {countries.map(country=><option key={country.id} value={country.id}>{country.flag_emoji ? country.flag_emoji+' ' : ''}{country.name}{country.phone_code ? ' ('+country.phone_code+')' : ''}</option>)}
          </select>
          <p className="mt-1.5 text-xs text-muted-foreground">Ce choix servira de zone par défaut. Vous pourrez le modifier plus tard.</p>
        </div>
        <div><label htmlFor="phone" className="mb-1.5 block text-sm font-semibold"><Phone size={15} className="mr-2 inline"/>Numéro de téléphone *</label>
          <div className="flex gap-2"><span className="jdv-input flex min-w-20 items-center justify-center bg-muted/40 text-sm">{selectedCountry?.phone_code || '+…'}</span><input id="phone" type="tel" required autoComplete="tel" value={phone} onChange={event=>setPhone(event.target.value)} placeholder="Votre numéro" className="jdv-input min-w-0 flex-1"/></div>
        </div>
        <div><label htmlFor="email" className="mb-1.5 block text-sm font-semibold"><Mail size={15} className="mr-2 inline"/>Adresse e-mail *</label><input id="email" type="email" required autoComplete="email" value={email} onChange={event=>setEmail(event.target.value)} className="jdv-input w-full" placeholder="vous@exemple.com"/></div>
        <div><label htmlFor="password" className="mb-1.5 block text-sm font-semibold"><LockKeyhole size={15} className="mr-2 inline"/>Mot de passe *</label><input id="password" type="password" required minLength={8} autoComplete="new-password" value={password} onChange={event=>setPassword(event.target.value)} className="jdv-input w-full" placeholder="8 caractères minimum"/></div>
        <button disabled={loading || !countries.length} className="btn-primary w-full justify-center py-3">{loading?<Loader2 className="animate-spin" size={18}/>:<><UserPlus size={18}/>Créer mon compte</>}</button>
      </form>
      <p className="mt-6 text-center text-sm text-muted-foreground">Déjà inscrit ? <Link href="/auth/login" className="text-accent font-semibold">Se connecter</Link></p>
    </section>
  </main>;
}
