'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowLeft, Users, Plus, Search, Loader2, Phone, Flame, Thermometer, Snowflake, X,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

interface Prospect {
  id: string;
  first_name: string;
  last_name: string | null;
  phone: string | null;
  email: string | null;
  desired_article: string | null;
  estimated_amount: number | null;
  temperature: 'hot' | 'warm' | 'cold';
  status: string;
  next_follow_up_at: string | null;
}

interface ProspectForm {
  first_name: string;
  last_name: string;
  phone: string;
  email: string;
  desired_article: string;
  estimated_amount: string;
  temperature: 'hot' | 'warm' | 'cold';
}

const TEMP_CONFIG: Record<string, { icon: typeof Flame; color: string; label: string }> = {
  hot: { icon: Flame, color: 'text-red-400 bg-red-400/10 border-red-400/20', label: 'Chaud' },
  warm: { icon: Thermometer, color: 'text-orange-400 bg-orange-400/10 border-orange-400/20', label: 'Tiède' },
  cold: { icon: Snowflake, color: 'text-blue-400 bg-blue-400/10 border-blue-400/20', label: 'Froid' },
};

const STATUS_LABELS: Record<string, string> = {
  new: 'Nouveau', contacted: 'Contacté', qualified: 'Qualifié',
  converted: 'Converti', lost: 'Perdu', archived: 'Archivé',
};

const EMPTY_FORM: ProspectForm = {
  first_name: '', last_name: '', phone: '', email: '', desired_article: '',
  estimated_amount: '', temperature: 'warm',
};

export default function CrmProspectsPage() {
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [prospecteurId, setProspecteurId] = useState<string | null>(null);
  const [portfolioId, setPortfolioId] = useState<string | null>(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [tempFilter, setTempFilter] = useState<string>('all');
  const [showForm, setShowForm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState<ProspectForm>(EMPTY_FORM);

  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const resolveContext = useCallback(async () => {
    if (!user) return false;

    // Ne pas appeler private.is_super_admin() via RPC : le schéma private n'est pas exposé par PostgREST.
    // La table super_admins possède une policy SELECT limitée à auth.uid().
    const { data: superAdminRow, error: superAdminError } = await supabase
      .from('super_admins')
      .select('user_id')
      .eq('user_id', user.id)
      .eq('actif', true)
      .maybeSingle();
    if (superAdminError) throw superAdminError;

    if (superAdminRow?.user_id === user.id) {
      setIsSuperAdmin(true);
      const { data: portfolio, error } = await supabase
        .from('client_portfolios')
        .select('id, organization_id')
        .eq('owner_user_id', user.id)
        .eq('owner_type', 'super_admin')
        .eq('status', 'active')
        .maybeSingle();
      if (error) throw error;
      if (!portfolio) throw new Error('Votre portefeuille personnel SUPER ADMIN est introuvable.');
      setOrganizationId(portfolio.organization_id);
      setPortfolioId(portfolio.id);
      return true;
    }

    const { data: prospecteur, error: prospecteurError } = await supabase
      .from('prospecteurs')
      .select('id, organization_id')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .maybeSingle();
    if (prospecteurError) throw prospecteurError;

    if (prospecteur) {
      setProspecteurId(prospecteur.id);
      setOrganizationId(prospecteur.organization_id);

      const { data: portfolio, error: portfolioError } = await supabase
        .from('client_portfolios')
        .select('id')
        .eq('owner_user_id', user.id)
        .eq('owner_type', 'prospecteur')
        .eq('organization_id', prospecteur.organization_id)
        .eq('status', 'active')
        .maybeSingle();
      if (portfolioError) throw portfolioError;

      if (portfolio) {
        setPortfolioId(portfolio.id);
      } else {
        const { data: createdPortfolio, error: createError } = await supabase
          .from('client_portfolios')
          .insert({
            organization_id: prospecteur.organization_id,
            owner_user_id: user.id,
            owner_type: 'prospecteur',
            name: 'Mon portefeuille clients',
            status: 'active',
          })
          .select('id')
          .single();
        if (createError) throw createError;
        setPortfolioId(createdPortfolio.id);
      }
      return true;
    }

    const { data: membership, error: membershipError } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .limit(1)
      .maybeSingle();
    if (membershipError) throw membershipError;
    if (!membership) return false;

    setOrganizationId(membership.organization_id);
    return true;
  }, [user, supabase]);

  const load = useCallback(async () => {
    if (!user) return;
    try {
      const contextReady = organizationId || portfolioId ? true : await resolveContext();
      if (!contextReady) {
        setIsLoading(false);
        return;
      }

      let query = supabase
        .from('prospects')
        .select('id, first_name, last_name, phone, email, desired_article, estimated_amount, temperature, status, next_follow_up_at')
        .order('created_at', { ascending: false });

      if (portfolioId) {
        query = query.eq('portfolio_id', portfolioId);
      } else if (organizationId) {
        query = query.eq('organization_id', organizationId).eq('prospecteur_id', prospecteurId);
      }

      const { data, error } = await query;
      if (error) throw error;
      setProspects((data || []) as Prospect[]);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Impossible de charger les prospects.');
    } finally {
      setIsLoading(false);
    }
  }, [user, organizationId, portfolioId, prospecteurId, resolveContext, supabase]);

  useEffect(() => {
    if (!user) { router.push('/auth/login'); return; }
    const urlFilter = searchParams.get('filter');
    if (urlFilter === 'hot' || urlFilter === 'warm' || urlFilter === 'cold') setTempFilter(urlFilter);
    load();
  }, [user, load, router, searchParams]);

  const handleSave = async () => {
    if (!user) return;
    if (!form.first_name.trim()) { toast.error('Le prénom est requis'); return; }
    if (!organizationId) { toast.error('Organisation introuvable pour ce compte.'); return; }

    setIsSaving(true);
    try {
      const payload: Record<string, unknown> = {
        organization_id: organizationId,
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim() || null,
        phone: form.phone.trim() || null,
        email: form.email.trim() || null,
        desired_article: form.desired_article.trim() || null,
        estimated_amount: form.estimated_amount ? Number(form.estimated_amount) : null,
        temperature: form.temperature,
        status: 'new',
      };

      if (prospecteurId) payload.prospecteur_id = prospecteurId;
      if (portfolioId) payload.portfolio_id = portfolioId;

      const { error } = await supabase.from('prospects').insert(payload);
      if (error) throw error;

      toast.success('Prospect enregistré avec succès.');
      setShowForm(false);
      setForm(EMPTY_FORM);
      await load();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur lors de la création du prospect.';
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  const filtered = useMemo(() => prospects.filter((p) => {
    if (tempFilter !== 'all' && p.temperature !== tempFilter) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return `${p.first_name} ${p.last_name || ''}`.toLowerCase().includes(q) ||
      (p.phone || '').includes(q) || (p.email || '').toLowerCase().includes(q);
  }), [prospects, search, tempFilter]);

  if (isLoading) {
    return <div className="min-h-screen bg-[#0D1F3C] flex items-center justify-center"><Loader2 className="w-8 h-8 text-[#F97316] animate-spin" /></div>;
  }

  return (
    <div className="min-h-screen bg-[#0D1F3C]">
      <header className="border-b border-white/10 bg-[#0D1F3C]/95 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/crm" className="text-white/60 hover:text-white transition-colors p-2 rounded-lg hover:bg-white/10"><ArrowLeft size={18} /></Link>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#F97316] flex items-center justify-center"><Users size={14} className="text-white" /></div>
              <div>
                <h1 className="text-white font-bold text-base leading-none">Prospects</h1>
                <p className="text-white/40 text-xs">JDV CRM · {filtered.length} prospect{filtered.length !== 1 ? 's' : ''}</p>
              </div>
            </div>
          </div>
          <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-[#F97316] hover:bg-[#F97316]/90 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors">
            <Plus size={16} /> Nouveau
          </button>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher un prospect..."
              className="w-full bg-white/10 border border-white/20 rounded-xl pl-9 pr-4 py-2.5 text-white placeholder-white/30 text-sm focus:outline-none focus:border-[#F97316]" />
          </div>
          <div className="flex gap-2">
            {(['all', 'hot', 'warm', 'cold'] as const).map((t) => (
              <button key={t} onClick={() => setTempFilter(t)}
                className={`px-3 py-2 rounded-xl text-xs font-medium border transition-colors ${tempFilter === t ? 'bg-[#F97316] border-[#F97316] text-white' : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'}`}>
                {t === 'all' ? 'Tous' : TEMP_CONFIG[t].label}
              </button>
            ))}
          </div>
        </div>

        {showForm && (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white font-semibold">Nouveau prospect</h2>
              <button onClick={() => setShowForm(false)} className="text-white/40 hover:text-white"><X size={18} /></button>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <input placeholder="Prénom *" value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                className="bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-white placeholder-white/30 text-sm focus:outline-none focus:border-[#F97316]" />
              <input placeholder="Nom" value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                className="bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-white placeholder-white/30 text-sm focus:outline-none focus:border-[#F97316]" />
              <input placeholder="Téléphone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-white placeholder-white/30 text-sm focus:outline-none focus:border-[#F97316]" />
              <input placeholder="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-white placeholder-white/30 text-sm focus:outline-none focus:border-[#F97316]" />
              <input placeholder="Produit / article souhaité" value={form.desired_article} onChange={(e) => setForm({ ...form, desired_article: e.target.value })}
                className="bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-white placeholder-white/30 text-sm focus:outline-none focus:border-[#F97316]" />
              <input placeholder="Montant estimé" type="number" min="0" value={form.estimated_amount} onChange={(e) => setForm({ ...form, estimated_amount: e.target.value })}
                className="bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-white placeholder-white/30 text-sm focus:outline-none focus:border-[#F97316]" />
              <select value={form.temperature} onChange={(e) => setForm({ ...form, temperature: e.target.value as ProspectForm['temperature'] })}
                className="bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#F97316] sm:col-span-2">
                <option value="hot" className="bg-[#0D1F3C]">🔥 Chaud</option>
                <option value="warm" className="bg-[#0D1F3C]">🌡️ Tiède</option>
                <option value="cold" className="bg-[#0D1F3C]">❄️ Froid</option>
              </select>
            </div>
            <button type="button" onClick={handleSave} disabled={isSaving || !organizationId}
              className="mt-4 w-full bg-[#F97316] hover:bg-[#F97316]/90 disabled:opacity-50 text-white font-medium py-2.5 rounded-xl flex items-center justify-center gap-2">
              {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />} Enregistrer le prospect
            </button>
          </div>
        )}

        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <Users className="w-10 h-10 text-white/20 mx-auto mb-3" />
            <p className="text-white/40 text-sm">Aucun prospect pour le moment.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((p) => {
              const temp = TEMP_CONFIG[p.temperature] || TEMP_CONFIG.cold;
              const TempIcon = temp.icon;
              return (
                <Link key={p.id} href={`/crm/prospects/${p.id}`}
                  className="flex items-center justify-between gap-3 bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center border ${temp.color} shrink-0`}>
                      <TempIcon size={16} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-white font-medium text-sm truncate">{p.first_name} {p.last_name || ''}</p>
                      <p className="text-white/40 text-xs truncate flex items-center gap-1">
                        {p.phone && <><Phone size={11} /> {p.phone}</>}
                        {p.desired_article && <span className="ml-1">· {p.desired_article}</span>}
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    {p.estimated_amount != null && <p className="text-white text-sm font-semibold">{Number(p.estimated_amount).toLocaleString('fr-FR')}</p>}
                    <p className="text-white/40 text-xs">{STATUS_LABELS[p.status] || p.status}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
