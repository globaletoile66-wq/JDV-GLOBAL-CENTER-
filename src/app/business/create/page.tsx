'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Building2, Loader2, Globe2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';

type Country = { id: string; name: string; iso_code: string; flag_emoji: string | null; phone_code: string | null; default_currency_id: string | null };
type Currency = { id: string; code: string; name: string; symbol: string };

export default function CreateBusinessPage() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();
  const supabase = createClient();
  const [busy, setBusy] = useState(false);
  const [countries, setCountries] = useState<Country[]>([]);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [countryId, setCountryId] = useState('');
  const [form, setForm] = useState({ name: '', trade_name: '', phone: '', email: '', city: '', address: '', description: '' });

  useEffect(() => {
    let active = true;
    void Promise.all([
      supabase.from('countries').select('id,name,iso_code,flag_emoji,phone_code,default_currency_id').eq('is_active', true).order('name'),
      supabase.from('currencies').select('id,code,name,symbol').eq('is_active', true).order('code'),
    ]).then(([countryResult, currencyResult]) => {
      if (!active) return;
      if (countryResult.error) toast.error('Impossible de charger les pays disponibles.');
      if (currencyResult.error) toast.error('Impossible de charger les devises disponibles.');
      const items = (countryResult.data ?? []) as Country[];
      setCountries(items);
      setCurrencies((currencyResult.data ?? []) as Currency[]);
      const preferred = profile?.country_id && items.some(country => country.id === profile.country_id)
        ? profile.country_id
        : items.find(country => country.iso_code?.toUpperCase() === 'BJ')?.id ?? '';
      setCountryId(current => current || preferred);
      setForm(current => ({ ...current, phone: current.phone || profile?.phone || '', email: current.email || user?.email || '' }));
    });
    return () => { active = false; };
  }, [supabase, profile?.country_id, profile?.phone, user?.email]);

  const selectedCountry = countries.find(country => country.id === countryId);
  const selectedCurrency = currencies.find(currency => currency.id === selectedCountry?.default_currency_id);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user) { router.replace('/auth/login?redirect=/business/create'); return; }
    if (!form.name.trim()) return toast.error('Le nom de l’entreprise est obligatoire.');
    if (!countryId) return toast.error('Choisissez le pays de l’entreprise.');
    setBusy(true);
    try {
      const { error } = await supabase.rpc('business_register_company', {
        p_name: form.name,
        p_trade_name: form.trade_name || null,
        p_country_id: countryId,
        p_currency_id: selectedCountry?.default_currency_id || null,
        p_phone: form.phone || null,
        p_email: form.email || null,
        p_city: form.city || null,
        p_address: form.address || null,
        p_description: form.description || null,
      });
      if (error) throw error;
      toast.success('Entreprise enregistrée en brouillon. Complétez sa fiche avant publication.');
      router.push('/business');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Impossible d’enregistrer l’entreprise.');
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <main className="min-h-screen bg-[#0D1F3C] flex items-center justify-center text-white">Chargement…</main>;
  if (!user) return <main className="min-h-screen bg-[#0D1F3C] text-white p-6"><div className="mx-auto max-w-xl pt-20"><Link href="/auth/login?redirect=/business/create" className="btn-primary">Se connecter pour continuer</Link></div></main>;

  return <main className="min-h-screen bg-[#0D1F3C] text-white px-4 py-10">
    <div className="mx-auto max-w-3xl"><Link href="/" className="mb-8 inline-flex items-center gap-2 text-white/60 hover:text-white"><ArrowLeft size={16}/>Accueil JDV</Link>
      <section className="rounded-3xl border border-white/10 bg-white/5 p-6 sm:p-8">
        <div className="mb-7 flex items-center gap-4"><div className="rounded-2xl bg-[#F97316]/10 p-3 text-[#F97316]"><Building2/></div><div><h1 className="text-2xl font-extrabold">Enregistrer mon entreprise</h1><p className="text-sm text-white/60">Le pays et la devise servent à adapter les services à votre marché.</p></div></div>
        <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-medium sm:col-span-2"><Globe2 size={15} className="mr-2 inline"/>Pays de l’entreprise *
            <select required value={countryId} onChange={event=>setCountryId(event.target.value)} className="jdv-input mt-1 w-full bg-[#0D1F3C]" disabled={!countries.length}>
              <option value="">Sélectionnez le pays</option>{countries.map(country=><option key={country.id} value={country.id}>{country.flag_emoji ? country.flag_emoji+' ' : ''}{country.name}</option>)}
            </select>
            {selectedCurrency && <span className="mt-1 block text-xs text-white/50">Devise par défaut : {selectedCurrency.name} ({selectedCurrency.code} {selectedCurrency.symbol})</span>}
          </label>
          {([['name','Nom de l’entreprise *'],['trade_name','Nom commercial'],['phone','Téléphone professionnel'],['email','Email professionnel'],['city','Ville'],['address','Adresse']] as const).map(([key,label])=><label key={key} className="text-sm font-medium">{label}<input type={key==='email'?'email':key==='phone'?'tel':'text'} value={form[key]} onChange={event=>setForm({...form,[key]:event.target.value})} className="jdv-input mt-1 w-full" required={key==='name'} autoComplete={key==='email'?'email':key==='phone'?'tel':undefined}/></label>)}
          <label className="sm:col-span-2 text-sm font-medium">Présentation<textarea value={form.description} onChange={event=>setForm({...form,description:event.target.value})} className="jdv-input mt-1 min-h-28 w-full"/></label>
          <div className="sm:col-span-2 flex flex-wrap justify-end gap-3 pt-3"><Link href="/business" className="btn-secondary">Annuler</Link><button disabled={busy || !countries.length} className="btn-primary">{busy?<Loader2 className="animate-spin"/>:'Créer mon espace'}<ArrowRight size={16}/></button></div>
        </form>
      </section>
    </div>
  </main>;
}
