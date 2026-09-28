'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, BriefcaseBusiness, Loader2, Plus, Users } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';

type Mode = 'prospecteur' | 'super_admin';

type Props = { mode: Mode };

export default function ClientPortfolioPage({ mode }: Props) {
  const { user, isSuperAdmin, loading: authLoading } = useAuth();
  const supabase = createClient();
  const [portfolio, setPortfolio] = useState<any>(null);
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [form, setForm] = useState({
    first_name: '', last_name: '', phone: '', whatsapp: '', email: '',
    address: '', city: '', country: 'Bénin', notes: ''
  });

  async function load() {
    if (!user) return;
    setLoading(true);
    setMessage('');

    if (mode === 'super_admin' && !isSuperAdmin) {
      setMessage('Accès réservé au portefeuille personnel du SUPER ADMIN.');
      setLoading(false);
      return;
    }

    let organizationId: string | null = null;
    if (mode === 'super_admin') {
      const { data } = await supabase.from('organizations')
        .select('id').eq('owner_user_id', user.id).limit(1).maybeSingle();
      organizationId = data?.id ?? null;
    } else {
      const { data } = await supabase.from('prospecteurs')
        .select('id,organization_id').eq('user_id', user.id).eq('status', 'active').limit(1).maybeSingle();
      organizationId = data?.organization_id ?? null;
    }

    if (!organizationId) {
      setMessage(mode === 'prospecteur'
        ? 'Aucun profil prospecteur actif n’est associé à ce compte.'
        : 'Le portefeuille commercial SUPER ADMIN n’est pas configuré.');
      setLoading(false);
      return;
    }

    const { data: p } = await supabase.from('client_portfolios')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('owner_user_id', user.id)
      .eq('owner_type', mode)
      .maybeSingle();

    let current = p;
    if (!current) {
      const { data: created, error } = await supabase.from('client_portfolios').insert({
        organization_id: organizationId,
        owner_user_id: user.id,
        owner_type: mode,
        name: mode === 'super_admin' ? 'Portefeuille commercial personnel' : 'Mon portefeuille clients'
      }).select('*').single();
      if (error) {
        setMessage(error.message);
        setLoading(false);
        return;
      }
      current = created;
    }

    setPortfolio(current);
    const { data: rows, error } = await supabase.from('clients')
      .select('*').eq('portfolio_id', current.id).order('created_at', { ascending: false }).limit(100);
    if (error) setMessage(error.message);
    setClients(rows || []);
    setLoading(false);
  }

  useEffect(() => {
    if (!authLoading && user) void load();
  }, [authLoading, user, isSuperAdmin]);

  async function createClientRecord(e: FormEvent) {
    e.preventDefault();
    if (!user || !portfolio) return;
    setSaving(true);
    setMessage('');

    const { data: prospecteur } = mode === 'prospecteur'
      ? await supabase.from('prospecteurs').select('id').eq('user_id', user.id).eq('status', 'active').limit(1).maybeSingle()
      : { data: null };

    const code = `JDV-CLI-${new Date().toISOString().slice(0,10).replaceAll('-', '')}-${crypto.randomUUID().slice(0,8).toUpperCase()}`;
    const { error } = await supabase.from('clients').insert({
      organization_id: portfolio.organization_id,
      portfolio_id: portfolio.id,
      prospecteur_id: prospecteur?.id ?? null,
      code,
      first_name: form.first_name.trim(),
      last_name: form.last_name.trim() || null,
      phone: form.phone.trim() || null,
      whatsapp: form.whatsapp.trim() || null,
      email: form.email.trim() || null,
      address: form.address.trim() || null,
      city: form.city.trim() || null,
      country: form.country.trim() || 'Bénin',
      status: 'active',
      temperature: 'cold',
      notes: form.notes.trim() || null
    });

    if (error) {
      setMessage(error.message);
      setSaving(false);
      return;
    }

    setForm({ first_name:'', last_name:'', phone:'', whatsapp:'', email:'', address:'', city:'', country:'Bénin', notes:'' });
    setSaving(false);
    await load();
    setMessage('Portefeuille client créé avec succès.');
  }

  if (authLoading || loading) {
    return <main className="min-h-screen bg-[#0D1F3C] text-white grid place-items-center"><Loader2 className="animate-spin"/></main>;
  }

  return (
    <main className="min-h-screen bg-[#0D1F3C] text-white px-4 py-8">
      <div className="mx-auto max-w-6xl">
        <Link href={mode === 'super_admin' ? '/hidden-concepteur-gate/dashboard' : '/business'} className="inline-flex items-center gap-2 text-white/60 hover:text-white text-sm">
          <ArrowLeft size={16}/>Retour
        </Link>

        <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <BriefcaseBusiness className="text-[#F97316]" />
              <h1 className="text-2xl font-extrabold">Mon portefeuille clients</h1>
            </div>
            <p className="mt-2 text-white/60">
              {mode === 'super_admin'
                ? 'Espace commercial personnel du SUPER ADMIN. Les portefeuilles des prospecteurs sont séparés.'
                : 'Votre portefeuille commercial personnel de prospecteur.'}
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm">
            <Users size={16} className="inline mr-2 text-[#F97316]"/>{clients.length} client(s)
          </div>
        </div>

        {message && <div className="mt-5 rounded-xl border border-[#F97316]/30 bg-[#F97316]/10 p-3 text-sm">{message}</div>}

        <section className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="font-bold text-lg flex items-center gap-2"><Plus size={18} className="text-[#F97316]"/>Créer un portefeuille client</h2>
          <form onSubmit={createClientRecord} className="mt-5 grid gap-4 sm:grid-cols-2">
            {[
              ['first_name','Prénom *'],['last_name','Nom'],['phone','Téléphone'],['whatsapp','WhatsApp'],
              ['email','Email'],['address','Adresse'],['city','Ville'],['country','Pays']
            ].map(([key,label]) => (
              <label key={key} className="text-sm">
                <span className="mb-1.5 block text-white/60">{label}</span>
                <input required={key==='first_name'} value={(form as any)[key]}
                  onChange={e=>setForm(v=>({...v,[key]:e.target.value}))}
                  className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2.5 outline-none focus:border-[#F97316]/60"/>
              </label>
            ))}
            <label className="sm:col-span-2 text-sm">
              <span className="mb-1.5 block text-white/60">Notes</span>
              <textarea value={form.notes} onChange={e=>setForm(v=>({...v,notes:e.target.value}))}
                className="min-h-24 w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2.5 outline-none focus:border-[#F97316]/60"/>
            </label>
            <button disabled={saving} className="sm:col-span-2 rounded-xl bg-[#F97316] px-5 py-3 font-bold disabled:opacity-60">
              {saving ? 'Création…' : 'Créer le portefeuille client'}
            </button>
          </form>
        </section>

        <section className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="font-bold text-lg">Mes clients</h2>
          <div className="mt-4 overflow-auto">
            <table className="w-full min-w-[700px] text-sm">
              <thead><tr className="border-b border-white/10 text-left text-white/50">
                <th className="p-3">Code</th><th className="p-3">Client</th><th className="p-3">Téléphone</th><th className="p-3">Ville</th><th className="p-3">Statut</th>
              </tr></thead>
              <tbody>{clients.map(c=><tr key={c.id} className="border-b border-white/10">
                <td className="p-3">{c.code}</td><td className="p-3">{c.first_name} {c.last_name||''}</td>
                <td className="p-3">{c.phone||'—'}</td><td className="p-3">{c.city||'—'}</td><td className="p-3">{c.status}</td>
              </tr>)}</tbody>
            </table>
            {clients.length===0 && <p className="py-8 text-center text-white/50">Aucun client dans votre portefeuille.</p>}
          </div>
        </section>
      </div>
    </main>
  );
}
