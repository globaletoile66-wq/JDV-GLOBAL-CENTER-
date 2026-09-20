'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { Eye, EyeOff, Loader2, AlertCircle, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import AppLogo from '@/components/ui/AppLogo';

interface LoginFormData {
  email: string;
  password: string;
}

export default function LoginPageContent() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const { signIn } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams?.get('redirect') || '/dashboard';

  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>();

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setAuthError(null);
    try {
      await signIn(data.email, data.password);
      toast.success('Connexion réussie — Bienvenue sur JDV GLOBAL CENTER');
      router.push(redirectTo);
    } catch (err: any) {
      const msg = err?.message || 'Erreur de connexion';
      if (msg.includes('Invalid login credentials')) {
        setAuthError('Email ou mot de passe incorrect.');
      } else if (msg.includes('Email not confirmed')) {
        setAuthError('Veuillez confirmer votre adresse email avant de vous connecter.');
      } else if (msg.includes('Too many requests')) {
        setAuthError('Trop de tentatives. Veuillez patienter quelques minutes.');
      } else {
        setAuthError(msg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Brand panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-jdv-gradient relative overflow-hidden flex-col justify-between p-12">
        <div className="absolute inset-0 bg-jdv-hero" />
        <div className="absolute top-1/3 left-1/4 w-96 h-96 blob-primary opacity-60" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 blob-accent opacity-40" />
        <div className="relative z-10">
          <Link href="/" className="flex items-center gap-3 group">
            <AppLogo size={44} />
            <div className="flex flex-col leading-none">
              <span className="font-extrabold text-xl tracking-tight text-white">JDV</span>
              <span className="text-xs font-medium text-white/60 tracking-widest uppercase">Global Center</span>
            </div>
          </Link>
        </div>
        <div className="relative z-10">
          <h1 className="text-4xl font-extrabold text-white mb-4 leading-tight">
            Votre écosystème<br />
            <span className="text-accent">numérique</span> international
          </h1>
          <p className="text-white/70 text-lg leading-relaxed">
            Un seul compte pour accéder à tous les services JDV — paiements, CRM, immobilier, formation et bien plus.
          </p>
        </div>
        <div className="relative z-10 flex items-center gap-4">
          <div className="flex -space-x-2">
            {['🇧🇯', '🇸🇳', '🇨🇮', '🇳🇬', '🇫🇷'].map((flag, i) => (
              <div key={i} className="w-8 h-8 rounded-full bg-card border-2 border-border flex items-center justify-center text-sm">{flag}</div>
            ))}
          </div>
          <p className="text-white/60 text-sm">Disponible dans 15+ pays</p>
        </div>
      </div>

      {/* Form panel */}
      <div className="flex-1 flex flex-col justify-center px-6 py-12 lg:px-16 xl:px-24">
        <div className="max-w-md w-full mx-auto">
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <AppLogo size={36} />
            <div className="flex flex-col leading-none">
              <span className="font-extrabold text-base text-foreground">JDV</span>
              <span className="text-xs text-muted-foreground tracking-widest uppercase">Global Center</span>
            </div>
          </div>

          <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8">
            <ArrowLeft size={15} />
            Retour à l&apos;accueil
          </Link>

          <div className="mb-8">
            <h2 className="text-3xl font-extrabold text-foreground mb-2">Bon retour</h2>
            <p className="text-muted-foreground">Connectez-vous à votre espace JDV GLOBAL CENTER</p>
          </div>

          {authError && (
            <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-danger/10 border border-danger/25 mb-6 animate-slide-up">
              <AlertCircle size={16} className="text-danger flex-shrink-0 mt-0.5" />
              <p className="text-sm text-danger font-medium leading-snug">{authError}</p>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5" noValidate>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="email" className="text-sm font-semibold text-foreground">
                Adresse email <span className="text-danger">*</span>
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="votre@email.com"
                className="jdv-input"
                {...register('email', {
                  required: 'L\'adresse email est requise',
                  pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Format d\'email invalide' },
                })}
              />
              {errors.email && <p className="text-xs text-danger font-medium">{errors.email.message}</p>}
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="text-sm font-semibold text-foreground">
                  Mot de passe <span className="text-danger">*</span>
                </label>
                <Link href="/auth/forgot-password" className="text-xs text-accent hover:text-accent-light transition-colors font-medium">
                  Mot de passe oublié ?
                </Link>
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="Votre mot de passe"
                  className="jdv-input pr-12"
                  {...register('password', { required: 'Le mot de passe est requis' })}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                  aria-label={showPassword ? 'Masquer' : 'Afficher'}
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-danger font-medium">{errors.password.message}</p>}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full justify-center py-3.5 text-base disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none mt-2"
            >
              {isLoading ? <Loader2 size={18} className="animate-spin" /> : 'Se connecter'}
            </button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-8">
            Pas encore de compte ?{' '}
            <Link href="/auth/register" className="text-accent hover:text-accent-light font-semibold transition-colors">
              Créer un compte
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
