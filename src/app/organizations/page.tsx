'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Building2, Loader2, CheckCircle2, Users } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useJDV } from '@/contexts/JDVContext';
import AppLogo from '@/components/ui/AppLogo';
import { toast } from 'sonner';

interface CreateOrgData {
  name: string;
  country_id: string;
  org_type: string;
}

export default function OrganizationsPage() {
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [countries, setCountries] = useState<any[]>([]);
  const { user } = useAuth();
  const { setActiveOrganization } = useJDV();
  const router = useRouter();
  const supabase = createClient();

  const { register, handleSubmit, reset, formState: { errors } } = useForm<CreateOrgData>();

  useEffect(() => {
    if (user) { loadOrganizations(); loadCountries(); }
  }, [user]);

  const loadOrganizations = async () => {
    setIsLoading(true);
    try {
      const { data } = await supabase
        .from('organization_members')
        .select(`
          member_status,
          roles(name, code),
          organizations(id, name, logo_url, org_status, org_type, created_at)
        `)
        .eq('user_id', user!.id)
        .eq('member_status', 'active');
      setOrganizations((data || []).map((m: any) => ({ ...m.organizations, role: m.roles?.name, role_code: m.roles?.code })));
    } catch {}
    finally { setIsLoading(false); }
  };

  const loadCountries = async () => {
    const { data } = await supabase.from('countries').select('id, name, flag_emoji').eq('is_active', true).order('name');
    setCountries(data || []);
  };

  const onCreateOrg = async (data: CreateOrgData) => {
    if (!user) return;
    setIsCreating(true);
    try {
      // Create organization
      const { data: org, error: orgError } = await supabase
        .from('organizations')
        .insert({
          name: data.name,
          country_id: data.country_id || null,
          org_type: data.org_type,
          owner_id: user.id,
          org_status: 'active',
        })
        .select()
        .single();

      if (orgError) throw orgError;

      // Get owner role
      const { data: ownerRole } = await supabase.from('roles').select('id').eq('code', 'owner').single();

      // Add creator as owner member
      await supabase.from('organization_members').insert({
        organization_id: org.id,
        user_id: user.id,
        role_id: ownerRole?.id || null,
        member_status: 'active',
      });

      toast.success(`Organisation "${data.name}" créée avec succès`);
      reset();
      setShowCreate(false);
      loadOrganizations();
    } catch (err: any) {
      toast.error(err?.message || 'Erreur lors de la création');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-4">
          <Link href="/dashboard" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft size={15} />Dashboard
          </Link>
          <div className="flex items-center gap-2 flex-1">
            <AppLogo size={28} />
            <span className="font-semibold text-sm text-foreground">Organisations</span>
          </div>
          <button onClick={() => setShowCreate(!showCreate)} className="btn-primary text-sm px-4 py-2">
            <Plus size={15} />Créer
          </button>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-extrabold text-foreground mb-6">Mes organisations</h1>

        {/* Create form */}
        {showCreate && (
          <div className="jdv-card mb-8 animate-slide-up">
            <h2 className="font-bold text-foreground mb-5">Créer une organisation</h2>
            <form onSubmit={handleSubmit(onCreateOrg)} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-foreground">Nom de l'organisation <span className="text-danger">*</span></label>
                <input type="text" placeholder="Nom de votre organisation" className="jdv-input"
                  {...register('name', { required: 'Nom requis', minLength: { value: 2, message: '2 caractères min.' } })} />
                {errors.name && <p className="text-xs text-danger">{errors.name.message}</p>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-foreground">Pays</label>
                  <select className="jdv-input" {...register('country_id')}>
                    <option value="">Sélectionner un pays</option>
                    {countries.map((c) => <option key={c.id} value={c.id}>{c.flag_emoji} {c.name}</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-foreground">Type</label>
                  <select className="jdv-input" {...register('org_type')}>
                    <option value="company">Entreprise</option>
                    <option value="association">Association</option>
                    <option value="commerce">Commerce</option>
                    <option value="agency">Agence</option>
                    <option value="institution">Institution</option>
                    <option value="other">Autre</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={isCreating} className="btn-primary disabled:opacity-60">
                  {isCreating ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                  {isCreating ? 'Création...' : 'Créer l\'organisation'}
                </button>
                <button type="button" onClick={() => setShowCreate(false)} className="btn-secondary">Annuler</button>
              </div>
            </form>
          </div>
        )}

        {/* Organizations list */}
        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 size={24} className="animate-spin text-accent" /></div>
        ) : organizations.length === 0 ? (
          <div className="jdv-card text-center py-16">
            <Building2 size={48} className="text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-bold text-foreground mb-2">Aucune organisation</h3>
            <p className="text-muted-foreground mb-6">Vous n'appartenez à aucune organisation. Créez-en une ou attendez une invitation.</p>
            <button onClick={() => setShowCreate(true)} className="btn-primary">
              <Plus size={16} />Créer une organisation
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {organizations.map((org) => (
              <div key={org.id} className="jdv-card flex flex-col gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center text-accent font-bold text-lg flex-shrink-0">
                    {org.logo_url ? <img src={org.logo_url} alt={org.name} className="w-full h-full rounded-xl object-cover" /> : org.name?.[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-foreground truncate">{org.name}</h3>
                    <p className="text-xs text-muted-foreground">{org.org_type} · {org.role || 'Membre'}</p>
                  </div>
                  <span className={`jdv-badge text-xs ${org.org_status === 'active' ? 'text-success bg-success/10' : 'text-warning bg-warning/10'}`}>
                    {org.org_status === 'active' ? 'Active' : org.org_status}
                  </span>
                </div>
                <div className="flex gap-2 pt-2 border-t border-border">
                  <button
                    onClick={() => { setActiveOrganization(org.id, org.name); router.push('/dashboard'); }}
                    className="btn-primary text-xs px-3 py-1.5 flex-1 justify-center"
                  >
                    Activer
                  </button>
                  <Link href={`/organizations/${org.id}/members`} className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1.5">
                    <Users size={13} />Membres
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
