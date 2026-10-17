'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2, Plus, Search, Edit2, Trash2, User, Phone, Mail, X, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';
import AppLogo from '@/components/ui/AppLogo';
import { toast } from 'sonner';

interface Beneficiary {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  beneficiary_type: string;
  is_active: boolean;
  notes: string | null;
  countries: { name: string; flag_emoji: string; iso_code: string } | null;
}

interface Country {
  id: string;
  name: string;
  flag_emoji: string;
  iso_code: string;
}

const TYPE_LABELS: Record<string, string> = {
  individual: 'Particulier',
  business: 'Entreprise',
  mobile_money: 'Mobile Money',
  bank_account: 'Compte bancaire',
};

export default function BeneficiariesPage() {
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState({
    name: '', phone: '', email: '', country_id: '',
    account_reference: '', beneficiary_type: 'individual', notes: '',
  });
  const { user } = useAuth();
  const router = useRouter();
  const supabase = createClient();

  const loadData = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const [benefRes, countriesRes] = await Promise.all([
        supabase.from('pay_beneficiaries')
          .select('*, countries(name, flag_emoji, iso_code)')
          .eq('owner_user_id', user.id)
          .eq('is_active', true)
          .order('name'),
        supabase.from('countries').select('id, name, flag_emoji, iso_code').eq('is_active', true).order('name'),
      ]);
      setBeneficiaries(benefRes.data || []);
      setCountries(countriesRes.data || []);
    } catch {
      // Silent fail
    } finally {
      setIsLoading(false);
    }
  }, [user, supabase]);

  useEffect(() => {
    if (!user) { router.push('/auth/login?redirect=/pay/beneficiaries'); return; }
    loadData();
  }, [user, loadData, router]);

  const resetForm = () => {
    setForm({ name: '', phone: '', email: '', country_id: '', account_reference: '', beneficiary_type: 'individual', notes: '' });
    setEditingId(null);
  };

  const handleEdit = (b: Beneficiary) => {
    setForm({
      name: b.name,
      phone: b.phone || '',
      email: b.email || '',
      country_id: '',
      account_reference: '',
      beneficiary_type: b.beneficiary_type,
      notes: b.notes || '',
    });
    setEditingId(b.id);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!user || !form.name.trim()) { toast.error('Le nom est requis'); return; }
    setIsSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        phone: form.phone.trim() || null,
        email: form.email.trim() || null,
        country_id: form.country_id || null,
        account_reference: form.account_reference.trim() || null,
        beneficiary_type: form.beneficiary_type,
        notes: form.notes.trim() || null,
      };

      if (editingId) {
        const { error } = await supabase.from('pay_beneficiaries').update(payload).eq('id', editingId).eq('owner_user_id', user.id);
        if (error) throw error;
        toast.success('Bénéficiaire mis à jour');
      } else {
        const { error } = await supabase.from('pay_beneficiaries').insert({ ...payload, owner_user_id: user.id });
        if (error) throw error;
        toast.success('Bénéficiaire ajouté');
      }

      setShowForm(false);
      resetForm();
      loadData();
    } catch (err: any) {
      toast.error(err?.message || 'Erreur lors de la sauvegarde');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!user) return;
    try {
      const { error } = await supabase.from('pay_beneficiaries').update({ is_active: false }).eq('id', id).eq('owner_user_id', user.id);
      if (error) throw error;
      toast.success('Bénéficiaire supprimé');
      loadData();
    } catch (err: any) {
      toast.error(err?.message || 'Erreur lors de la suppression');
    }
  };

  const filtered = beneficiaries.filter(b =>
    !searchQuery ||
    b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.phone?.includes(searchQuery) ||
    b.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      <header className="h-14 border-b border-border bg-card/80 backdrop-blur-sm flex items-center px-4 gap-3 sticky top-0 z-20">
        <Link href="/pay" className="btn-ghost p-2"><ArrowLeft size={18} /></Link>
        <AppLogo size={24} />
        <div className="flex-1">
          <p className="text-xs text-muted-foreground">JDV PAY</p>
          <p className="text-sm font-semibold text-foreground">Bénéficiaires</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="btn-primary text-sm px-3 py-1.5 flex items-center gap-1.5"
        >
          <Plus size={14} /> Ajouter
        </button>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">
        {/* Search */}
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            placeholder="Rechercher un bénéficiaire..."
            className="jdv-input pl-9 w-full"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Add/Edit form */}
        {showForm && (
          <div className="jdv-card p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">
                {editingId ? 'Modifier le bénéficiaire' : 'Nouveau bénéficiaire'}
              </h3>
              <button onClick={() => { setShowForm(false); resetForm(); }} className="btn-ghost p-1.5">
                <X size={16} />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Nom *</label>
                <input type="text" className="jdv-input w-full" placeholder="Nom complet" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Type</label>
                <select className="jdv-input w-full" value={form.beneficiary_type} onChange={e => setForm(f => ({ ...f, beneficiary_type: e.target.value }))}>
                  {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Téléphone</label>
                <input type="tel" className="jdv-input w-full" placeholder="+229..." value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Email</label>
                <input type="email" className="jdv-input w-full" placeholder="email@exemple.com" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Pays</label>
                <select className="jdv-input w-full" value={form.country_id} onChange={e => setForm(f => ({ ...f, country_id: e.target.value }))}>
                  <option value="">Sélectionner un pays</option>
                  {countries.map(c => <option key={c.id} value={c.id}>{c.flag_emoji} {c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Référence de compte</label>
                <input type="text" className="jdv-input w-full" placeholder="IBAN, numéro de compte..." value={form.account_reference} onChange={e => setForm(f => ({ ...f, account_reference: e.target.value }))} />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Notes</label>
              <input type="text" className="jdv-input w-full" placeholder="Notes optionnelles..." value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
            </div>

            <div className="flex gap-3">
              <button onClick={() => { setShowForm(false); resetForm(); }} className="btn-secondary flex-1">Annuler</button>
              <button onClick={handleSave} disabled={isSaving || !form.name.trim()} className="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-50">
                {isSaving ? <><Loader2 size={14} className="animate-spin" /> Sauvegarde...</> : <><CheckCircle2 size={14} /> Sauvegarder</>}
              </button>
            </div>
          </div>
        )}

        {/* List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={24} className="animate-spin text-accent" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="jdv-card p-8 text-center">
            <User size={40} className="mx-auto text-muted-foreground mb-4" />
            <p className="text-sm font-medium text-foreground mb-1">Aucun bénéficiaire</p>
            <p className="text-xs text-muted-foreground mb-4">
              {searchQuery ? 'Aucun résultat pour cette recherche.' : 'Ajoutez des bénéficiaires pour effectuer des transferts rapidement.'}
            </p>
            {!searchQuery && (
              <button onClick={() => { resetForm(); setShowForm(true); }} className="btn-primary text-sm px-4 py-2 inline-flex items-center gap-2">
                <Plus size={14} /> Ajouter un bénéficiaire
              </button>
            )}
          </div>
        ) : (
          <div className="jdv-card divide-y divide-border">
            {filtered.map((b) => (
              <div key={b.id} className="flex items-center gap-4 px-4 py-4">
                <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center text-accent font-bold text-sm flex-shrink-0">
                  {b.name[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-foreground">{b.name}</p>
                    <span className="text-xs px-1.5 py-0.5 rounded bg-muted/20 text-muted-foreground border border-border">
                      {TYPE_LABELS[b.beneficiary_type] || b.beneficiary_type}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-0.5">
                    {b.phone && <span className="text-xs text-muted-foreground flex items-center gap-1"><Phone size={10} />{b.phone}</span>}
                    {b.email && <span className="text-xs text-muted-foreground flex items-center gap-1"><Mail size={10} />{b.email}</span>}
                    {b.countries && <span className="text-xs text-muted-foreground">{b.countries.flag_emoji} {b.countries.name}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <Link
                    href={`/pay/send?beneficiary=${b.id}`}
                    className="btn-primary text-xs px-2.5 py-1.5"
                  >
                    Envoyer
                  </Link>
                  <button onClick={() => handleEdit(b)} className="btn-ghost p-1.5">
                    <Edit2 size={14} />
                  </button>
                  <button onClick={() => handleDelete(b.id)} className="btn-ghost p-1.5 text-danger hover:bg-danger/10">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
