'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { Loader2, ChevronRight, ChevronLeft, CheckCircle2, User, Globe, Languages, DollarSign, Briefcase } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';
import AppLogo from '@/components/ui/AppLogo';

const STEPS = [
  { id: 1, title: 'Identité', icon: User, description: 'Votre nom et photo' },
  { id: 2, title: 'Pays', icon: Globe, description: 'Votre pays de résidence' },
  { id: 3, title: 'Langue', icon: Languages, description: 'Votre langue préférée' },
  { id: 4, title: 'Devise', icon: DollarSign, description: 'Votre devise préférée' },
  { id: 5, title: 'Utilisation', icon: Briefcase, description: 'Comment utiliser JDV' },
];

const USAGE_TYPES = [
  { id: 'personal', label: 'Personnel', description: 'Usage personnel et familial', icon: '👤' },
  { id: 'business', label: 'Entreprise', description: 'Gestion d\'entreprise', icon: '🏢' },
  { id: 'commerce', label: 'Commerce', description: 'Activité commerciale', icon: '🛒' },
  { id: 'services', label: 'Services', description: 'Prestation de services', icon: '⚙️' },
  { id: 'professional', label: 'Professionnel', description: 'Usage professionnel', icon: '💼' },
  { id: 'other', label: 'Autre', description: 'Autre utilisation', icon: '✨' },
];

interface OnboardingData {
  first_name: string;
  last_name: string;
  country_id: string;
  language_id: string;
  currency_id: string;
  usage_type: string;
}

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [countries, setCountries] = useState<any[]>([]);
  const [languages, setLanguages] = useState<any[]>([]);
  const [currencies, setCurrencies] = useState<any[]>([]);
  const [selectedUsage, setSelectedUsage] = useState('');
  const { user, profile, updateProfile, refreshProfile } = useAuth();
  const router = useRouter();
  const supabase = createClient();

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<OnboardingData>({
    defaultValues: {
      first_name: profile?.first_name || '',
      last_name: profile?.last_name || '',
    }
  });

  useEffect(() => {
    if (!user) {
      router.push('/auth/login');
      return;
    }
    if (profile?.onboarding_completed) {
      router.push('/dashboard');
      return;
    }
    loadReferenceData();
  }, [user, profile]);

  useEffect(() => {
    if (profile) {
      setValue('first_name', profile.first_name || '');
      setValue('last_name', profile.last_name || '');
    }
  }, [profile, setValue]);

  const loadReferenceData = async () => {
    setIsLoading(true);
    try {
      const [countriesResult, languagesResult, currenciesResult] = await Promise.all([
        supabase.from('countries').select('id, name, flag_emoji, iso_code').eq('is_active', true).order('name'),
        supabase.from('languages').select('id, name, native_name, code').eq('is_active', true).order('name'),
        supabase.from('currencies').select('id, name, code, symbol').eq('is_active', true).order('code'),
      ]);
      setCountries(countriesResult.data || []);
      setLanguages(languagesResult.data || []);
      setCurrencies(currenciesResult.data || []);
    } catch {
      // Use empty arrays if load fails
    } finally {
      setIsLoading(false);
    }
  };

  const handleNext = () => {
    if (step < 5) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const onSubmit = async (data: OnboardingData) => {
    if (!user) return;
    setIsSaving(true);
    try {
      await updateProfile({
        first_name: data.first_name,
        last_name: data.last_name,
        full_name: `${data.first_name} ${data.last_name}`,
        country_id: data.country_id || null,
        preferred_language_id: data.language_id || null,
        preferred_currency_id: data.currency_id || null,
        usage_type: selectedUsage || data.usage_type,
        onboarding_completed: true,
      });
      await refreshProfile();
      toast.success('Profil configuré ! Bienvenue sur JDV GLOBAL CENTER 🎉');
      router.push('/dashboard');
    } catch (err: any) {
      toast.error(err?.message || 'Erreur lors de la sauvegarde');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <AppLogo size={48} />
          <Loader2 size={24} className="animate-spin text-accent" />
          <p className="text-muted-foreground text-sm">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <AppLogo size={32} />
          <div className="flex flex-col leading-none">
            <span className="font-extrabold text-sm text-foreground">JDV</span>
            <span className="text-xs text-muted-foreground tracking-widest uppercase" style={{ fontSize: '8px' }}>Global Center</span>
          </div>
        </div>
        <span className="text-sm text-muted-foreground">Configuration du profil</span>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="max-w-2xl w-full">
          {/* Step indicators */}
          <div className="flex items-center justify-center gap-2 mb-10">
            {STEPS.map((s, i) => (
              <React.Fragment key={s.id}>
                <div className={`flex items-center gap-2 ${step === s.id ? 'opacity-100' : step > s.id ? 'opacity-70' : 'opacity-30'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-200 ${
                    step > s.id ? 'bg-success text-white' : step === s.id ? 'bg-accent text-white' : 'bg-muted text-muted-foreground'
                  }`}>
                    {step > s.id ? <CheckCircle2 size={16} /> : s.id}
                  </div>
                  <span className="hidden sm:block text-xs font-medium text-muted-foreground">{s.title}</span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`flex-1 h-0.5 max-w-8 transition-all duration-200 ${step > s.id ? 'bg-success' : 'bg-muted'}`} />
                )}
              </React.Fragment>
            ))}
          </div>

          {/* Step content */}
          <div className="jdv-card p-8 animate-fade-in">
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-3">
                {React.createElement(STEPS[step - 1].icon, { size: 24, className: 'text-accent' })}
                <h2 className="text-2xl font-bold text-foreground">{STEPS[step - 1].title}</h2>
              </div>
              <p className="text-muted-foreground">{STEPS[step - 1].description}</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)}>
              {/* Step 1: Identity */}
              {step === 1 && (
                <div className="flex flex-col gap-5">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-semibold text-foreground">Prénom <span className="text-danger">*</span></label>
                      <input type="text" placeholder="Votre prénom" className="jdv-input"
                        {...register('first_name', { required: 'Prénom requis' })} />
                      {errors.first_name && <p className="text-xs text-danger">{errors.first_name.message}</p>}
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-semibold text-foreground">Nom <span className="text-danger">*</span></label>
                      <input type="text" placeholder="Votre nom" className="jdv-input"
                        {...register('last_name', { required: 'Nom requis' })} />
                      {errors.last_name && <p className="text-xs text-danger">{errors.last_name.message}</p>}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Ces informations seront affichées sur votre profil JDV.
                  </p>
                </div>
              )}

              {/* Step 2: Country */}
              {step === 2 && (
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-semibold text-foreground">Pays de résidence</label>
                    <p className="text-xs text-muted-foreground">Détermine les services et la devise disponibles dans votre région.</p>
                    <select className="jdv-input" {...register('country_id')}>
                      <option value="">Sélectionner votre pays</option>
                      {countries.map((c) => (
                        <option key={c.id} value={c.id}>{c.flag_emoji} {c.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Step 3: Language */}
              {step === 3 && (
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-semibold text-foreground">Langue préférée</label>
                    <p className="text-xs text-muted-foreground">L'interface JDV sera affichée dans cette langue.</p>
                    <div className="grid grid-cols-2 gap-3 mt-2">
                      {languages.map((l) => {
                        const selected = watch('language_id') === l.id;
                        return (
                          <button
                            key={l.id}
                            type="button"
                            onClick={() => setValue('language_id', l.id)}
                            className={`p-4 rounded-xl border text-left transition-all duration-150 ${
                              selected ? 'border-accent bg-accent/10 text-foreground' : 'border-border bg-card hover:border-accent/40 text-muted-foreground'
                            }`}
                          >
                            <p className="font-semibold text-sm">{l.native_name}</p>
                            <p className="text-xs opacity-70">{l.name}</p>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 4: Currency */}
              {step === 4 && (
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-semibold text-foreground">Devise préférée</label>
                    <p className="text-xs text-muted-foreground">Utilisée pour l'affichage des montants dans l'interface.</p>
                    <select className="jdv-input mt-2" {...register('currency_id')}>
                      <option value="">Sélectionner une devise</option>
                      {currencies.map((c) => (
                        <option key={c.id} value={c.id}>{c.code} — {c.symbol} — {c.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Step 5: Usage */}
              {step === 5 && (
                <div className="flex flex-col gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-4">
                      Cette information nous aide à personnaliser votre expérience. Elle ne détermine pas vos autorisations.
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {USAGE_TYPES.map((u) => (
                        <button
                          key={u.id}
                          type="button"
                          onClick={() => setSelectedUsage(u.id)}
                          className={`p-4 rounded-xl border text-left transition-all duration-150 ${
                            selectedUsage === u.id ? 'border-accent bg-accent/10' : 'border-border bg-card hover:border-accent/40'
                          }`}
                        >
                          <div className="text-2xl mb-2">{u.icon}</div>
                          <p className="font-semibold text-sm text-foreground">{u.label}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{u.description}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation */}
              <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
                <button
                  type="button"
                  onClick={handleBack}
                  disabled={step === 1}
                  className="btn-secondary disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronLeft size={16} />
                  Précédent
                </button>

                {step < 5 ? (
                  <button type="button" onClick={handleNext} className="btn-primary">
                    Suivant
                    <ChevronRight size={16} />
                  </button>
                ) : (
                  <button type="submit" disabled={isSaving} className="btn-primary disabled:opacity-60 disabled:cursor-not-allowed">
                    {isSaving ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                    {isSaving ? 'Sauvegarde...' : 'Terminer la configuration'}
                  </button>
                )}
              </div>
            </form>
          </div>

          <p className="text-center text-xs text-muted-foreground mt-6">
            Étape {step} sur {STEPS.length} — Vous pouvez modifier ces informations plus tard dans votre profil.
          </p>
        </div>
      </div>
    </div>
  );
}
