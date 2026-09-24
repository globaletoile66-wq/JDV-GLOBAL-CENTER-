'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Camera, Loader2, CheckCircle2, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import AppLogo from '@/components/ui/AppLogo';
import { toast } from 'sonner';

interface ProfileFormData {
  first_name: string;
  last_name: string;
  phone: string;
  timezone: string;
}

interface PasswordFormData {
  current_password: string;
  new_password: string;
  confirm_password: string;
}

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState<'info' | 'security' | 'privacy'>('info');
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [countries, setCountries] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user, profile, updateProfile, refreshProfile, signOut, loading } = useAuth();
  const router = useRouter();
  const supabase = createClient();

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ProfileFormData>();
  const { register: regPw, handleSubmit: handlePwSubmit, watch: watchPw, reset: resetPw, formState: { errors: pwErrors } } = useForm<PasswordFormData>();
  const newPassword = watchPw('new_password', '');

  useEffect(() => {
    if (!loading && !user) router.push('/auth/login');
    if (profile) {
      reset({
        first_name: profile.first_name || '',
        last_name: profile.last_name || '',
        phone: profile.phone || '',
        timezone: profile.timezone || 'UTC',
      });
    }
    loadCountries();
  }, [user, profile, loading]);

  const loadCountries = async () => {
    const { data } = await supabase.from('countries').select('id, name, flag_emoji').eq('is_active', true).order('name');
    setCountries(data || []);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast.error('Format non supporté. Utilisez JPG, PNG ou WebP.');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image trop grande. Maximum 2 Mo.');
      return;
    }

    setIsUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `${user.id}/avatar.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, file, { upsert: true, cacheControl: '3600' });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path);
      await updateProfile({ avatar_url: publicUrl });
      toast.success('Photo de profil mise à jour');
    } catch (err: any) {
      toast.error(err?.message || 'Erreur lors du téléchargement');
    } finally {
      setIsUploading(false);
    }
  };

  const onSaveProfile = async (data: ProfileFormData) => {
    setIsSaving(true);
    try {
      await updateProfile({
        first_name: data.first_name,
        last_name: data.last_name,
        full_name: `${data.first_name} ${data.last_name}`,
        phone: data.phone || null,
        timezone: data.timezone,
      });
      toast.success('Profil mis à jour avec succès');
    } catch (err: any) {
      toast.error(err?.message || 'Erreur lors de la sauvegarde');
    } finally {
      setIsSaving(false);
    }
  };

  const onChangePassword = async (data: PasswordFormData) => {
    setIsSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: data.new_password });
      if (error) throw error;
      toast.success('Mot de passe mis à jour');
      resetPw();
    } catch (err: any) {
      toast.error(err?.message || 'Erreur lors du changement de mot de passe');
    } finally {
      setIsSaving(false);
    }
  };

  const getInitials = () => {
    if (profile?.first_name && profile?.last_name) return `${profile.first_name[0]}${profile.last_name[0]}`.toUpperCase();
    return user?.email?.[0]?.toUpperCase() || 'U';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 size={24} className="animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-4">
          <Link href="/dashboard" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft size={15} />
            Dashboard
          </Link>
          <div className="flex items-center gap-2 flex-1">
            <AppLogo size={28} />
            <span className="font-bold text-sm text-foreground hidden sm:block">JDV GLOBAL CENTER</span>
            <span className="text-muted-foreground hidden sm:block">›</span>
            <span className="font-semibold text-sm text-foreground">Mon profil</span>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Profile header */}
        <div className="jdv-card mb-8 flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <div className="relative flex-shrink-0">
            <div className="w-20 h-20 rounded-full bg-accent flex items-center justify-center text-white font-bold text-2xl overflow-hidden">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
              ) : getInitials()}
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-accent border-2 border-background flex items-center justify-center hover:bg-accent-dark transition-colors"
              aria-label="Changer la photo"
            >
              {isUploading ? <Loader2 size={12} className="animate-spin text-white" /> : <Camera size={12} className="text-white" />}
            </button>
            <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleAvatarUpload} />
          </div>
          <div className="text-center sm:text-left">
            <h1 className="text-xl font-bold text-foreground">{profile?.full_name || user?.email}</h1>
            <p className="text-muted-foreground text-sm">{user?.email}</p>
            <div className="flex items-center gap-2 mt-2 justify-center sm:justify-start">
              <span className={`jdv-badge text-xs ${profile?.account_status === 'active' ? 'text-success bg-success/10' : 'text-warning bg-warning/10'}`}>
                {profile?.account_status || 'active'}
              </span>
              {profile?.onboarding_completed && (
                <span className="jdv-badge text-xs text-info bg-info/10">Profil configuré</span>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-card rounded-xl p-1 border border-border">
          {[
            { id: 'info', label: 'Informations' },
            { id: 'security', label: 'Sécurité' },
            { id: 'privacy', label: 'Confidentialité' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all duration-150 ${
                activeTab === tab.id ? 'bg-accent text-white' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Info tab */}
        {activeTab === 'info' && (
          <form onSubmit={handleSubmit(onSaveProfile)} className="jdv-card flex flex-col gap-5">
            <h2 className="font-bold text-foreground text-lg">Informations personnelles</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-foreground">Prénom</label>
                <input type="text" className="jdv-input" {...register('first_name', { required: 'Requis' })} />
                {errors.first_name && <p className="text-xs text-danger">{errors.first_name.message}</p>}
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-foreground">Nom</label>
                <input type="text" className="jdv-input" {...register('last_name', { required: 'Requis' })} />
                {errors.last_name && <p className="text-xs text-danger">{errors.last_name.message}</p>}
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-foreground">Email</label>
              <input type="email" className="jdv-input opacity-60 cursor-not-allowed" value={user?.email || ''} disabled />
              <p className="text-xs text-muted-foreground">L'email ne peut pas être modifié ici.</p>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-foreground">Téléphone</label>
              <input type="tel" placeholder="+229 XX XX XX XX" className="jdv-input" {...register('phone')} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-foreground">Fuseau horaire</label>
              <select className="jdv-input" {...register('timezone')}>
                <option value="UTC">UTC</option>
                <option value="Africa/Porto-Novo">Africa/Porto-Novo (GMT+1)</option>
                <option value="Africa/Lagos">Africa/Lagos (GMT+1)</option>
                <option value="Africa/Abidjan">Africa/Abidjan (GMT+0)</option>
                <option value="Europe/Paris">Europe/Paris (GMT+1/+2)</option>
                <option value="America/New_York">America/New_York (GMT-5/-4)</option>
              </select>
            </div>
            <button type="submit" disabled={isSaving} className="btn-primary self-start disabled:opacity-60 disabled:cursor-not-allowed">
              {isSaving ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
              {isSaving ? 'Sauvegarde...' : 'Enregistrer les modifications'}
            </button>
          </form>
        )}

        {/* Security tab */}
        {activeTab === 'security' && (
          <div className="flex flex-col gap-6">
            <form onSubmit={handlePwSubmit(onChangePassword)} className="jdv-card flex flex-col gap-5">
              <h2 className="font-bold text-foreground text-lg">Changer le mot de passe</h2>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-foreground">Nouveau mot de passe</label>
                <div className="relative">
                  <input
                    type={showNewPw ? 'text' : 'password'}
                    placeholder="Minimum 8 caractères"
                    className="jdv-input pr-12"
                    {...regPw('new_password', {
                      required: 'Requis',
                      minLength: { value: 8, message: 'Minimum 8 caractères' },
                      pattern: { value: /^(?=.*[A-Z])(?=.*[0-9]).{8,}$/, message: 'Doit contenir une majuscule et un chiffre' },
                    })}
                  />
                  <button type="button" onClick={() => setShowNewPw(!showNewPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1">
                    {showNewPw ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
                {pwErrors.new_password && <p className="text-xs text-danger">{pwErrors.new_password.message}</p>}
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-foreground">Confirmer le nouveau mot de passe</label>
                <input
                  type="password"
                  placeholder="Confirmer"
                  className="jdv-input"
                  {...regPw('confirm_password', {
                    required: 'Requis',
                    validate: (v) => v === newPassword || 'Les mots de passe ne correspondent pas',
                  })}
                />
                {pwErrors.confirm_password && <p className="text-xs text-danger">{pwErrors.confirm_password.message}</p>}
              </div>
              <button type="submit" disabled={isSaving} className="btn-primary self-start disabled:opacity-60">
                {isSaving ? <Loader2 size={16} className="animate-spin" /> : null}
                Mettre à jour le mot de passe
              </button>
            </form>
          </div>
        )}

        {/* Privacy tab */}
        {activeTab === 'privacy' && (
          <div className="jdv-card flex flex-col gap-6">
            <h2 className="font-bold text-foreground text-lg">Confidentialité et données</h2>
            <div className="flex flex-col gap-4">
              <div className="px-4 py-4 rounded-xl border border-border bg-muted/10">
                <h3 className="font-semibold text-foreground mb-1">Vos données personnelles</h3>
                <p className="text-sm text-muted-foreground">
                  JDV GLOBAL CENTER collecte uniquement les données nécessaires au fonctionnement de la plateforme. Vos données ne sont jamais vendues à des tiers.
                </p>
              </div>
              <div className="px-4 py-4 rounded-xl border border-danger/20 bg-danger/5">
                <h3 className="font-semibold text-danger mb-1 flex items-center gap-2">
                  <AlertCircle size={16} />
                  Suppression du compte
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  La suppression de votre compte est irréversible. Toutes vos données seront supprimées conformément à nos règles de conservation légale.
                </p>
                <button
                  onClick={() => toast.error('Fonctionnalité disponible prochainement. Contactez le support pour supprimer votre compte.')}
                  className="px-4 py-2 rounded-lg border border-danger/30 text-danger text-sm font-medium hover:bg-danger/10 transition-colors"
                >
                  Demander la suppression du compte
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
