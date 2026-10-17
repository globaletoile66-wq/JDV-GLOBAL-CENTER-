'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Eye, EyeOff, Loader2, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface RegisterFormData {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  confirm_password: string;
  country: string;
  language: string;
  terms: boolean;
}

const countries = [
  { id: 'bj', code: 'BJ', name: 'Bénin', flag: '🇧🇯', phone: '+229' },
  { id: 'sn', code: 'SN', name: 'Sénégal', flag: '🇸🇳', phone: '+221' },
  { id: 'ci', code: 'CI', name: 'Côte d\'Ivoire', flag: '🇨🇮', phone: '+225' },
  { id: 'ng', code: 'NG', name: 'Nigeria', flag: '🇳🇬', phone: '+234' },
  { id: 'gh', code: 'GH', name: 'Ghana', flag: '🇬🇭', phone: '+233' },
  { id: 'cm', code: 'CM', name: 'Cameroun', flag: '🇨🇲', phone: '+237' },
  { id: 'fr', code: 'FR', name: 'France', flag: '🇫🇷', phone: '+33' },
  { id: 'us', code: 'US', name: 'États-Unis', flag: '🇺🇸', phone: '+1' },
];

const languages = [
  { id: 'lang-fr', code: 'fr', name: 'Français' },
  { id: 'lang-en', code: 'en', name: 'English' },
  { id: 'lang-pt', code: 'pt', name: 'Português' },
  { id: 'lang-ar', code: 'ar', name: 'العربية' },
];

interface Props {
  onSwitchToLogin: () => void;
}

export default function RegisterForm({ onSwitchToLogin }: Props) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterFormData>({ defaultValues: { language: 'fr', country: 'bj' } });

  const password = watch('password');

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    // Backend integration point — replace with Supabase Auth signUp + profile creation trigger
    await new Promise((res) => setTimeout(res, 1800));
    setIsLoading(false);
    setSuccess(true);
    toast.success(`Compte créé ! Bienvenue ${data.first_name} sur JDV GLOBAL CENTER`);
    setTimeout(() => router.push('/user-dashboard'), 1500);
  };

  if (success) {
    return (
      <div className="flex flex-col items-center text-center gap-5 py-8 animate-scale-in">
        <div className="w-16 h-16 rounded-full bg-success/15 border border-success/30 flex items-center justify-center">
          <CheckCircle2 size={32} className="text-success" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-foreground mb-2">Compte créé avec succès !</h3>
          <p className="text-sm text-muted-foreground">
            Redirection vers votre tableau de bord JDV...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-foreground mb-1">Créer mon compte</h2>
        <p className="text-sm text-muted-foreground">
          Rejoignez l'écosystème JDV GLOBAL CENTER
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
        {/* Name row */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="reg-firstname" className="text-sm font-semibold text-foreground">
              Prénom <span className="text-danger">*</span>
            </label>
            <input
              id="reg-firstname"
              type="text"
              autoComplete="given-name"
              placeholder="Prénom"
              className="jdv-input"
              {...register('first_name', { required: 'Prénom requis', minLength: { value: 2, message: '2 caractères min.' } })}
            />
            {errors.first_name && (
              <p className="text-xs text-danger font-medium">{errors.first_name.message}</p>
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="reg-lastname" className="text-sm font-semibold text-foreground">
              Nom <span className="text-danger">*</span>
            </label>
            <input
              id="reg-lastname"
              type="text"
              autoComplete="family-name"
              placeholder="Nom de famille"
              className="jdv-input"
              {...register('last_name', { required: 'Nom requis', minLength: { value: 2, message: '2 caractères min.' } })}
            />
            {errors.last_name && (
              <p className="text-xs text-danger font-medium">{errors.last_name.message}</p>
            )}
          </div>
        </div>

        {/* Email */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="reg-email" className="text-sm font-semibold text-foreground">
            Adresse email <span className="text-danger">*</span>
          </label>
          <input
            id="reg-email"
            type="email"
            autoComplete="email"
            placeholder="votre@email.com"
            className="jdv-input"
            {...register('email', {
              required: 'Email requis',
              pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Email invalide' },
            })}
          />
          {errors.email && (
            <p className="text-xs text-danger font-medium">{errors.email.message}</p>
          )}
        </div>

        {/* Country */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="reg-country" className="text-sm font-semibold text-foreground">
            Pays de résidence <span className="text-danger">*</span>
          </label>
          <p className="text-xs text-muted-foreground -mt-0.5">
            Détermine la devise, la langue et les services disponibles
          </p>
          <select
            id="reg-country"
            className="jdv-input"
            {...register('country', { required: 'Pays requis' })}
          >
            {countries.map((c) => (
              <option key={c.id} value={c.id}>
                {c.flag} {c.name} ({c.phone})
              </option>
            ))}
          </select>
          {errors.country && (
            <p className="text-xs text-danger font-medium">{errors.country.message}</p>
          )}
        </div>

        {/* Language */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="reg-language" className="text-sm font-semibold text-foreground">
            Langue préférée
          </label>
          <select id="reg-language" className="jdv-input" {...register('language')}>
            {languages.map((l) => (
              <option key={l.id} value={l.code}>{l.name}</option>
            ))}
          </select>
        </div>

        {/* Password */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="reg-password" className="text-sm font-semibold text-foreground">
            Mot de passe <span className="text-danger">*</span>
          </label>
          <p className="text-xs text-muted-foreground -mt-0.5">
            Minimum 8 caractères, une majuscule, un chiffre
          </p>
          <div className="relative">
            <input
              id="reg-password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="Choisir un mot de passe"
              className="jdv-input pr-12"
              {...register('password', {
                required: 'Mot de passe requis',
                minLength: { value: 8, message: 'Minimum 8 caractères' },
                pattern: {
                  value: /^(?=.*[A-Z])(?=.*[0-9]).{8,}$/,
                  message: 'Doit contenir une majuscule et un chiffre',
                },
              })}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
              aria-label="Afficher le mot de passe"
            >
              {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          </div>
          {errors.password && (
            <p className="text-xs text-danger font-medium">{errors.password.message}</p>
          )}
        </div>

        {/* Confirm password */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="reg-confirm" className="text-sm font-semibold text-foreground">
            Confirmer le mot de passe <span className="text-danger">*</span>
          </label>
          <div className="relative">
            <input
              id="reg-confirm"
              type={showConfirm ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="Confirmer votre mot de passe"
              className="jdv-input pr-12"
              {...register('confirm_password', {
                required: 'Confirmation requise',
                validate: (v) => v === password || 'Les mots de passe ne correspondent pas',
              })}
            />
            <button
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
              aria-label="Afficher la confirmation"
            >
              {showConfirm ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          </div>
          {errors.confirm_password && (
            <p className="text-xs text-danger font-medium">{errors.confirm_password.message}</p>
          )}
        </div>

        {/* Terms */}
        <div className="flex items-start gap-2.5">
          <input
            id="reg-terms"
            type="checkbox"
            className="w-4 h-4 rounded border-border bg-input accent-accent cursor-pointer mt-0.5 flex-shrink-0"
            {...register('terms', { required: 'Vous devez accepter les conditions' })}
          />
          <label htmlFor="reg-terms" className="text-sm text-muted-foreground cursor-pointer select-none leading-snug">
            J'accepte les{' '}
            <a href="#" className="text-accent hover:text-accent-light font-medium transition-colors">
              Conditions d'utilisation
            </a>{' '}
            et la{' '}
            <a href="#" className="text-accent hover:text-accent-light font-medium transition-colors">
              Politique de confidentialité
            </a>{' '}
            de JDV GLOBAL CENTER
          </label>
        </div>
        {errors.terms && (
          <p className="text-xs text-danger font-medium -mt-2">{errors.terms.message}</p>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={isLoading}
          className="btn-primary w-full justify-center py-3.5 text-base mt-1 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
        >
          {isLoading ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            'Créer mon compte JDV'
          )}
        </button>
      </form>

      <p className="text-center text-sm text-muted-foreground mt-5">
        Déjà un compte ?{' '}
        <button
          type="button"
          onClick={onSwitchToLogin}
          className="text-accent hover:text-accent-light font-semibold transition-colors"
        >
          Se connecter
        </button>
      </p>
    </div>
  );
}