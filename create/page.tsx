'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Building2, Briefcase, Loader2, AlertCircle, ChevronRight, MapPin, Phone, Mail } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

interface BusinessCategory {
  id: string;
  name: string;
  slug: string;
}

interface BusinessFormData {
  name: string;
  trade_name: string;
  description: string;
  category_id: string;
  phone: string;
  email: string;
  website: string;
  address: string;
  city: string;
  region: string;
}

const STEPS = [
  { id: 1, label: 'Informations générales' },
  { id: 2, label: 'Identité & activité' },
  { id: 3, label: 'Localisation' },
  { id: 4, label: 'Coordonnées' },
  { id: 5, label: 'Confirmation' },
];

export default function CreateBusinessPage() {
  const [step, setStep] = useState(1);
  const [categories, setCategories] = useState<BusinessCategory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [organizations, setOrganizations] = useState<{ id: string; name: string }[]>([]);
  const [selectedOrgId, setSelectedOrgId] = useState('');
  const [form, setForm] = useState<BusinessFormData>({
    name: '', trade_name: '', description: '', category_id: '',
    phone: '', email: '', website: '', address: '', city: '', region: '',
  });

  const { user, profile } = useAuth();
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    if (!user) { router.push('/auth/login'); return; }
    loadData();
  }, [user]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [catRes, orgRes] = await Promise.all([
        supabase.from('business_categories').select('id, name, slug').eq('is_active', true).order('sort_order'),
        supabase.from('organization_members').select('organization_id, organizations(id, name)').eq('user_id', user!.id).eq('is_active', true),
      ]);
      setCategories(catRes.data || []);
      const orgs = (orgRes.data || []).map((m: any) => m.organizations).filter(Boolean);
      setOrganizations(orgs);
      if (orgs.length === 1) setSelectedOrgId(orgs[0].id);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (field: keyof BusinessFormData, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!user || !selectedOrgId) return;
    if (!form.name.trim()) { toast.error('Le nom de l\'entreprise est requis'); return; }

    setIsSaving(true);
    try {
      const { data, error } = await supabase
        .from('business_profiles')
        .insert({
          organization_id: selectedOrgId,
          owner_user_id: user.id,
          name: form.name.trim(),
          trade_name: form.trade_name.trim() || null,
          description: form.description.trim() || null,
          category_id: form.category_id || null,
          phone: form.phone.trim() || null,
          email: form.email.trim() || null,
          website: form.website.trim() || null,
          address: form.address.trim() || null,
          city: form.city.trim() || null,
          region: form.region.trim() || null,
          business_status: 'active',
        })
        .select()
        .single();

      if (error) throw error;

      // Add owner as OWNER member
      await supabase.from('business_members').insert({
        business_id: data.id,
        user_id: user.id,
        role: 'OWNER',
        is_active: true,
      });

      toast.success('Entreprise créée avec succès !');
      router.push('/business');
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Erreur lors de la création');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0D1F3C] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#F97316] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0D1F3C]">
      {/* Header */}
      <header className="border-b border-white/10 bg-[#0D1F3C]/95 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-2xl mx-auto px-4 h-16 flex items-center gap-4">
          <Link href="/business" className="text-white/60 hover:text-white transition-colors p-2 rounded-lg hover:bg-white/10">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-white font-bold text-base">Créer mon entreprise</h1>
            <p className="text-white/40 text-xs">JDV BUSINESS</p>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Steps indicator */}
        <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2">
          {STEPS.map((s, idx) => (
            <React.Fragment key={s.id}>
              <div className={`flex items-center gap-2 flex-shrink-0 ${step >= s.id ? 'opacity-100' : 'opacity-40'}`}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-colors ${step > s.id ? 'bg-success border-success text-white' : step === s.id ? 'bg-[#F97316] border-[#F97316] text-white' : 'bg-transparent border-white/30 text-white/60'}`}>
                  {step > s.id ? '✓' : s.id}
                </div>
                <span className={`text-xs hidden sm:inline ${step === s.id ? 'text-white font-medium' : 'text-white/50'}`}>{s.label}</span>
              </div>
              {idx < STEPS.length - 1 && <div className={`flex-1 h-px min-w-4 ${step > s.id ? 'bg-success/50' : 'bg-white/10'}`} />}
            </React.Fragment>
          ))}
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          {/* Step 1: General info */}
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-white font-bold text-lg mb-1">Informations générales</h2>
                <p className="text-white/50 text-sm">Donnez un nom à votre entreprise</p>
              </div>

              {organizations.length > 1 && (
                <div>
                  <label className="block text-white/70 text-sm mb-2">Organisation associée *</label>
                  <select
                    value={selectedOrgId}
                    onChange={e => setSelectedOrgId(e.target.value)}
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#F97316] transition-colors"
                  >
                    <option value="">Sélectionner une organisation</option>
                    {organizations.map(org => (
                      <option key={org.id} value={org.id}>{org.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {organizations.length === 0 && (
                <div className="p-4 rounded-xl bg-warning/10 border border-warning/20 flex items-start gap-3">
                  <AlertCircle size={16} className="text-warning flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-warning text-sm font-medium">Aucune organisation trouvée</p>
                    <p className="text-white/60 text-xs mt-1">Vous devez appartenir à une organisation pour créer une entreprise.</p>
                    <Link href="/organizations" className="text-[#F97316] text-xs hover:underline mt-1 inline-block">Créer une organisation →</Link>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-white/70 text-sm mb-2">Nom de l'entreprise *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => handleChange('name', e.target.value)}
                  placeholder="Ex: Mon Commerce SARL"
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/30 text-sm focus:outline-none focus:border-[#F97316] transition-colors"
                />
              </div>

              <div>
                <label className="block text-white/70 text-sm mb-2">Nom commercial (optionnel)</label>
                <input
                  type="text"
                  value={form.trade_name}
                  onChange={e => handleChange('trade_name', e.target.value)}
                  placeholder="Ex: MonCommerce"
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/30 text-sm focus:outline-none focus:border-[#F97316] transition-colors"
                />
              </div>
            </div>
          )}

          {/* Step 2: Identity & activity */}
          {step === 2 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-white font-bold text-lg mb-1">Identité & activité</h2>
                <p className="text-white/50 text-sm">Décrivez votre activité</p>
              </div>

              <div>
                <label className="block text-white/70 text-sm mb-2">Description</label>
                <textarea
                  value={form.description}
                  onChange={e => handleChange('description', e.target.value)}
                  placeholder="Décrivez votre activité, vos produits ou services..."
                  rows={4}
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/30 text-sm focus:outline-none focus:border-[#F97316] transition-colors resize-none"
                />
              </div>

              <div>
                <label className="block text-white/70 text-sm mb-2">Secteur d'activité</label>
                <select
                  value={form.category_id}
                  onChange={e => handleChange('category_id', e.target.value)}
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#F97316] transition-colors"
                >
                  <option value="">Sélectionner un secteur</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Step 3: Location */}
          {step === 3 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-white font-bold text-lg mb-1">Localisation</h2>
                <p className="text-white/50 text-sm">Où se trouve votre entreprise ?</p>
              </div>

              <div>
                <label className="block text-white/70 text-sm mb-2">Adresse</label>
                <input
                  type="text"
                  value={form.address}
                  onChange={e => handleChange('address', e.target.value)}
                  placeholder="Rue, quartier..."
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/30 text-sm focus:outline-none focus:border-[#F97316] transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-white/70 text-sm mb-2">Ville</label>
                  <input
                    type="text"
                    value={form.city}
                    onChange={e => handleChange('city', e.target.value)}
                    placeholder="Ex: Cotonou"
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/30 text-sm focus:outline-none focus:border-[#F97316] transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-white/70 text-sm mb-2">Région / Département</label>
                  <input
                    type="text"
                    value={form.region}
                    onChange={e => handleChange('region', e.target.value)}
                    placeholder="Ex: Littoral"
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/30 text-sm focus:outline-none focus:border-[#F97316] transition-colors"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Contact */}
          {step === 4 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-white font-bold text-lg mb-1">Coordonnées</h2>
                <p className="text-white/50 text-sm">Comment vous contacter ?</p>
              </div>

              <div>
                <label className="block text-white/70 text-sm mb-2">Téléphone</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={e => handleChange('phone', e.target.value)}
                  placeholder="+229 XX XX XX XX"
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/30 text-sm focus:outline-none focus:border-[#F97316] transition-colors"
                />
              </div>

              <div>
                <label className="block text-white/70 text-sm mb-2">Email professionnel</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={e => handleChange('email', e.target.value)}
                  placeholder="contact@monentreprise.com"
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/30 text-sm focus:outline-none focus:border-[#F97316] transition-colors"
                />
              </div>

              <div>
                <label className="block text-white/70 text-sm mb-2">Site web (optionnel)</label>
                <input
                  type="url"
                  value={form.website}
                  onChange={e => handleChange('website', e.target.value)}
                  placeholder="https://monentreprise.com"
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/30 text-sm focus:outline-none focus:border-[#F97316] transition-colors"
                />
              </div>
            </div>
          )}

          {/* Step 5: Confirmation */}
          {step === 5 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-white font-bold text-lg mb-1">Confirmation</h2>
                <p className="text-white/50 text-sm">Vérifiez les informations avant de créer</p>
              </div>

              <div className="space-y-3">
                {[
                  { label: 'Nom', value: form.name, icon: <Building2 size={14} /> },
                  { label: 'Nom commercial', value: form.trade_name || '—', icon: <Briefcase size={14} /> },
                  { label: 'Ville', value: form.city || '—', icon: <MapPin size={14} /> },
                  { label: 'Téléphone', value: form.phone || '—', icon: <Phone size={14} /> },
                  { label: 'Email', value: form.email || '—', icon: <Mail size={14} /> },
                ].map(item => (
                  <div key={item.label} className="flex items-center gap-3 p-3 rounded-xl bg-white/5">
                    <span className="text-white/40">{item.icon}</span>
                    <span className="text-white/50 text-sm w-28 flex-shrink-0">{item.label}</span>
                    <span className="text-white text-sm truncate">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Navigation buttons */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-white/10">
            <button
              onClick={() => step > 1 ? setStep(step - 1) : router.push('/business')}
              className="flex items-center gap-2 text-white/60 hover:text-white transition-colors text-sm px-4 py-2 rounded-xl hover:bg-white/10"
            >
              <ArrowLeft size={16} />
              {step === 1 ? 'Annuler' : 'Précédent'}
            </button>

            {step < STEPS.length ? (
              <button
                onClick={() => {
                  if (step === 1 && !form.name.trim()) { toast.error('Le nom est requis'); return; }
                  if (step === 1 && !selectedOrgId) { toast.error('Sélectionnez une organisation'); return; }
                  setStep(step + 1);
                }}
                disabled={organizations.length === 0}
                className="flex items-center gap-2 bg-[#F97316] hover:bg-[#F97316]/90 disabled:opacity-50 text-white font-semibold px-6 py-2.5 rounded-xl transition-colors text-sm"
              >
                Suivant <ChevronRight size={16} />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={isSaving}
                className="flex items-center gap-2 bg-[#F97316] hover:bg-[#F97316]/90 disabled:opacity-50 text-white font-semibold px-6 py-2.5 rounded-xl transition-colors text-sm"
              >
                {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Building2 size={16} />}
                {isSaving ? 'Création...' : 'Créer l\'entreprise'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
