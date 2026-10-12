'use client';

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Building2, Save } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';
import { getCurrentBusinessId } from '@/lib/business/current-business';

type BusinessSettings = {
  id: string;
  name: string;
  trade_name: string | null;
  tagline: string | null;
  description: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  address: string | null;
  city: string | null;
  region: string | null;
  postal_code: string | null;
};

type SettingsForm = Record<Exclude<keyof BusinessSettings, 'id' | 'description'>, string>;

const emptySettings: SettingsForm = {
  name: '', trade_name: '', tagline: '', phone: '',
  email: '', website: '', address: '', city: '', region: '', postal_code: '',
};

const fields: { key: keyof typeof emptySettings; label: string; type?: string; wide?: boolean }[] = [
  { key: 'name', label: 'Nom de l’entreprise' },
  { key: 'trade_name', label: 'Nom commercial' },
  { key: 'tagline', label: 'Slogan' },
  { key: 'phone', label: 'Téléphone', type: 'tel' },
  { key: 'email', label: 'E-mail', type: 'email' },
  { key: 'website', label: 'Site web', type: 'url' },
  { key: 'address', label: 'Adresse', wide: true },
  { key: 'city', label: 'Ville' },
  { key: 'region', label: 'Région / département' },
  { key: 'postal_code', label: 'Code postal' },
];

export default function Page() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const supabase = createClient();
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [form, setForm] = useState(emptySettings);
  const [description, setDescription] = useState('');
  const [busy, setBusy] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const loadSettings = useCallback(async () => {
    if (!user) return;
    setBusy(true);
    setError('');
    const id = await getCurrentBusinessId(supabase, user.id);
    if (!id) {
      setBusinessId(null);
      setError('Aucune entreprise associée à ce compte. Demandez à un administrateur de vérifier votre accès.');
      setBusy(false);
      return;
    }
    const { data, error: queryError } = await supabase
      .from('business_profiles')
      .select('id,name,trade_name,tagline,description,phone,email,website,address,city,region,postal_code')
      .eq('id', id)
      .maybeSingle();
    if (queryError) {
      setError('Impossible de charger les paramètres de l’entreprise. Réessayez plus tard.');
      setBusy(false);
      return;
    }
    if (!data) {
      setError('Les informations de cette entreprise sont introuvables ou votre accès est insuffisant.');
      setBusy(false);
      return;
    }
    setBusinessId(data.id);
    setForm({
      name: data.name ?? '',
      trade_name: data.trade_name ?? '',
      tagline: data.tagline ?? '',
      phone: data.phone ?? '',
      email: data.email ?? '',
      website: data.website ?? '',
      address: data.address ?? '',
      city: data.city ?? '',
      region: data.region ?? '',
      postal_code: data.postal_code ?? '',
    });
    setDescription(data.description ?? '');
    setBusy(false);
  }, [supabase, user]);

  useEffect(() => {
    if (!loading && !user) router.replace('/auth/login');
    if (!loading && user) void loadSettings();
  }, [loading, user, router, loadSettings]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!businessId || !user) return;
    if (!form.name.trim()) {
      setError('Le nom de l’entreprise est obligatoire.');
      return;
    }
    setSaving(true);
    setError('');
    setNotice('');
    const updates = {
      name: form.name.trim(),
      trade_name: form.trade_name.trim() || null,
      tagline: form.tagline.trim() || null,
      description: description.trim() || null,
      phone: form.phone.trim() || null,
      email: form.email.trim() || null,
      website: form.website.trim() || null,
      address: form.address.trim() || null,
      city: form.city.trim() || null,
      region: form.region.trim() || null,
      postal_code: form.postal_code.trim() || null,
      updated_at: new Date().toISOString(),
    };
    const { error: updateError } = await supabase
      .from('business_profiles')
      .update(updates)
      .eq('id', businessId);
    setSaving(false);
    if (updateError) {
      setError('Enregistrement impossible. Vérifiez vos droits d’accès puis réessayez.');
      return;
    }
    setNotice('Les paramètres de l’entreprise ont été enregistrés.');
  }

  if (loading || busy) {
    return <main className="min-h-screen bg-[#0D1F3C] flex items-center justify-center text-white">Chargement des paramètres…</main>;
  }

  return (
    <main className="min-h-screen bg-[#0D1F3C] text-white px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-4xl">
        <Link href="/business" className="mb-6 inline-flex items-center gap-2 text-sm text-white/60 hover:text-white">
          <ArrowLeft size={16} /> Retour au tableau de bord
        </Link>
        <div className="mb-6 flex items-center gap-3">
          <div className="rounded-xl bg-white/10 p-3"><Building2 className="text-[#F97316]" size={26} /></div>
          <div><h1 className="text-2xl font-bold">Paramètres de l’entreprise</h1><p className="mt-1 text-sm text-white/60">Mettez à jour les coordonnées visibles dans votre espace métier.</p></div>
        </div>

        {error && <div role="alert" className="mb-5 rounded-xl border border-red-400/30 bg-red-400/10 p-4 text-sm text-red-100">{error}</div>}
        {notice && <div role="status" className="mb-5 rounded-xl border border-emerald-400/30 bg-emerald-400/10 p-4 text-sm text-emerald-100">{notice}</div>}

        {businessId ? <form onSubmit={handleSubmit} className="rounded-2xl border border-white/10 bg-white/5 p-5 sm:p-7">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            {fields.map(({ key, label, type, wide }) => (
              <label key={key} className={wide ? 'sm:col-span-2 block' : 'block'}>
                <span className="mb-2 block text-sm text-white/75">{label}{key === 'name' ? ' *' : ''}</span>
                <input
                  type={type ?? 'text'}
                  required={key === 'name'}
                  value={form[key]}
                  onChange={(event) => { setForm((current) => ({ ...current, [key]: event.target.value })); setNotice(''); }}
                  className="w-full rounded-lg border border-white/15 bg-[#09172D] px-3 py-2.5 text-white outline-none transition focus:border-[#F97316]"
                />
              </label>
            ))}
            <label className="block sm:col-span-2">
              <span className="mb-2 block text-sm text-white/75">Description</span>
              <textarea value={description} onChange={(event) => { setDescription(event.target.value); setNotice(''); }} rows={4} className="w-full rounded-lg border border-white/15 bg-[#09172D] px-3 py-2.5 text-white outline-none transition focus:border-[#F97316]" />
            </label>
          </div>
          <div className="mt-7 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-5">
            <p className="text-xs text-white/45">Les modifications sont enregistrées dans le profil de l’entreprise existante.</p>
            <button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-lg bg-[#F97316] px-5 py-2.5 font-semibold text-white transition hover:bg-orange-500 disabled:cursor-not-allowed disabled:opacity-60">
              <Save size={16} /> {saving ? 'Enregistrement…' : 'Enregistrer'}
            </button>
          </div>
        </form> : <div className="rounded-xl border border-white/10 bg-white/5 p-6 text-sm text-white/60">Aucune fiche entreprise modifiable n’est associée à votre compte.</div>}
      </div>
    </main>
  );
}
