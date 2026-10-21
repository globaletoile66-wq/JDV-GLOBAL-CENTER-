'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Loader2, UserPlus, AlertCircle, Globe2, Phone } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';
import AppLogo from '@/components/ui/AppLogo';

type Country = {
  id: string;
  iso_code: string;
  name: string;
  flag_emoji: string | null;
  phone_code: string | null;
};

export default function RegisterPage() {
  const { signUp } = useAuth();
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [countries, setCountries] = useState<Country[]>([]);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [countryId, setCountryId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [countriesLoading, setCountriesLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function loadCountries() {
      const { data, error: countryError } = await supabase
        .from('countries')
        .select('id,iso_code,name,flag_emoji,phone_code')
        .eq('is_active', true)
        .order('name');
      if (!active) return;
      if (countryError) {
        setError('Impossible de charger les pays. Réessayez dans quelques instants.');
      } else {
        const rows = (data ?? []) as Country[];
        setCountries(rows);
        const benin = rows.find((country) => country.iso_code === 'BJ');
        if (benin) setCountryId(benin.id);
        else if (rows[0]) setCountryId(rows[0].id);
      }
      setCountriesLoading(false);
    }
    void loadCountries();
    return () => { active = false; };
  }, [supabase]);

  const selectedCountry = countries.find((country) => country.id === countryId);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!countryId || !selectedCountry) {
      setError('Sélectionnez votre pays de résidence.');
      return;
    }
    if (!phone.trim()) {
      setError('Renseignez votre numéro de téléphone.');
      return;
    }
    setLoading(true);
    try {
      const normalizedPhone = `${selectedCountry.phone_code ?? ''} ${phone.trim()}`.trim();
      const result = await signUp(email.trim(), password, {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        full_name: `${firstName.trim()} ${lastName.trim()}`.trim(),
        phone: normalizedPhone,
        country_id: countryId,
        country_code: selectedCountry.iso_code,
        country_name: selectedCountry.name,
      });
      router.replace(result.session ? '/dashboard' : `/auth/verify-email?email=${encodeURIComponent(email.trim())}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Inscription impossible.');
    } finally {
      setLoading(false);
    }
  }

  return <main className="min-h-screen bg-background flex items-center justify-center px-4 py-10">
    <section className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-xl">
      <div className="flex items-center gap-3 mb-8">
        <AppLogo size={44}/>
        <div><h1 className="font-extrabold">Créer un compte</h1><p className="text-xs text-muted-foreground">JDV GLOBAL CENTER</p></div>
      </div>
      <p className="mb-6 text-sm text-muted-foreground">Votre pays de référence nous permet de vous proposer des services et des recherches adaptés à votre zone.</p>
      {error && <div role="alert" className="mb-5 flex gap-2 rounded-xl border border-danger/25 bg-danger/10 p-3 text-sm text-danger"><AlertCircle size={17}/>{error}</div>}
      <form onSubmit={submit} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div><label htmlFor="firstName" className="mb-1.5 block text-sm font-semibold">Prénom</label><input id="firstName" required autoComplete="given-name" value={firstName} onChange={e => setFirstName(e.target.value)} className="jdv-input w-full"/></div>
          <div><label htmlFor="lastName" className="mb-1.5 block text-sm font-semibold">Nom</label><input id="lastName" required autoComplete="family-name" value={lastName} onChange={e => setLastName(e.target.value)} className="jdv-input w-full"/></div>
        </div>
        <div>
          <label htmlFor="country" className="mb-1.5 flex items-center gap-2 text-sm font-semibold"><Globe2 size={16}/>Pays de résidence</label>
          <select id="country" required value={countryId} onChange={e => setCountryId(e.target.value)} disabled={countriesLoading || countries.length === 0} className="jdv-input w-full">
            <option value="">{countriesLoading ? 'Chargement des pays…' : 'Sélectionner votre pays'}</option>
            {countries.map(country => <option key={country.id} value={country.id}>{country.flag_emoji ? `${country.flag_emoji} ` : ''}{country.name}{country.phone_code ? ` (${country.phone_code})` : ''}</option>)}
          </select>
          <p className="mt-1 text-xs text-muted-foreground">Ce choix pourra être modifié dans votre profil.</p>
        </div>
        <div>
          <label htmlFor="phone" className="mb-1.5 flex items-center gap-2 text-sm font-semibold"><Phone size={16}/>Numéro de téléphone</label>
          <div className="flex gap-2">
            <div className="flex min-w-[88px] items-center justify-center rounded-xl border border-border bg-muted px-3 text-sm font-semibold">{selectedCountry?.phone_code ?? '+…'}</div>
            <input id="phone" type="tel" required autoComplete="tel-national" inputMode="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="Votre numéro" className="jdv-input w-full"/>
          </div>
        </div>
        <div><label htmlFor="email" className="mb-1.5 block text-sm font-semibold">Adresse e-mail</label><input id="email" type="email" required autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} className="jdv-input w-full"/></div>
        <div><label htmlFor="password" className="mb-1.5 block text-sm font-semibold">Mot de passe</label><input id="password" type="password" required minLength={8} autoComplete="new-password" value={password} onChange={e => setPassword(e.target.value)} className="jdv-input w-full"/><p className="mt-1 text-xs text-muted-foreground">8 caractères minimum.</p></div>
        <button type="submit" disabled={loading || countriesLoading || countries.length === 0} className="btn-primary w-full justify-center py-3">{loading ? <Loader2 className="animate-spin" size={18}/> : <><UserPlus size={18}/>Créer mon compte</>}</button>
      </form>
      <p className="mt-6 text-center text-sm text-muted-foreground">Déjà inscrit ? <Link href="/auth/login" className="text-accent font-semibold">Se connecter</Link></p>
    </section>
  </main>;
}
