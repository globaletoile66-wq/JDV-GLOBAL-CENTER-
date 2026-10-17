'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';

import { Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface LoginFormData {
  email: string;
  password: string;
  remember: boolean;
}

// Demo credentials for testing
const DEMO_CREDENTIALS = [
  { role: 'Utilisateur', email: 'kofi.mensah@jdvglobal.com', password: 'JDV@Demo2026' },
  { role: 'Admin Organisation', email: 'amina.diallo@jdvbusiness.com', password: 'JDV@Admin2026' },
];

interface Props {
  onSwitchToRegister: () => void;
}

export default function LoginForm({ onSwitchToRegister }: Props) {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
    setError,
  } = useForm<LoginFormData>({ defaultValues: { remember: false } });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    // Backend integration point — replace with Supabase Auth signInWithPassword
    await new Promise((res) => setTimeout(res, 1400));

    const valid = DEMO_CREDENTIALS.some(
      (c) => c.email === data.email && c.password === data.password
    );

    if (!valid) {
      setIsLoading(false);
      setError('root', {
        message: 'Identifiants invalides — utilisez les comptes de démonstration ci-dessous pour vous connecter.',
      });
      return;
    }

    toast.success('Connexion réussie — Bienvenue sur JDV GLOBAL CENTER');
    setIsLoading(false);
    router.push('/user-dashboard');
  };

  const fillCredentials = (email: string, password: string) => {
    setValue('email', email);
    setValue('password', password);
  };

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-foreground mb-1">Bon retour</h2>
        <p className="text-sm text-muted-foreground">
          Connectez-vous à votre espace JDV GLOBAL CENTER
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5" noValidate>
        {/* Root error */}
        {errors.root && (
          <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-danger/10 border border-danger/25 animate-slide-up">
            <AlertCircle size={16} className="text-danger flex-shrink-0 mt-0.5" />
            <p className="text-sm text-danger font-medium leading-snug">{errors.root.message}</p>
          </div>
        )}

        {/* Email */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="login-email" className="text-sm font-semibold text-foreground">
            Adresse email <span className="text-danger">*</span>
          </label>
          <input
            id="login-email"
            type="email"
            autoComplete="email"
            placeholder="votre@email.com"
            className="jdv-input"
            {...register('email', {
              required: 'L\'adresse email est requise',
              pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Format d\'email invalide' },
            })}
          />
          {errors.email && (
            <p className="text-xs text-danger font-medium mt-0.5">{errors.email.message}</p>
          )}
        </div>

        {/* Password */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label htmlFor="login-password" className="text-sm font-semibold text-foreground">
              Mot de passe <span className="text-danger">*</span>
            </label>
            <a href="#" className="text-xs text-accent hover:text-accent-light transition-colors font-medium">
              Mot de passe oublié ?
            </a>
          </div>
          <div className="relative">
            <input
              id="login-password"
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
              aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
            >
              {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          </div>
          {errors.password && (
            <p className="text-xs text-danger font-medium mt-0.5">{errors.password.message}</p>
          )}
        </div>

        {/* Remember */}
        <div className="flex items-center gap-2.5">
          <input
            id="login-remember"
            type="checkbox"
            className="w-4 h-4 rounded border-border bg-input accent-accent cursor-pointer"
            {...register('remember')}
          />
          <label htmlFor="login-remember" className="text-sm text-muted-foreground cursor-pointer select-none">
            Se souvenir de moi
          </label>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isLoading}
          className="btn-primary w-full justify-center py-3.5 text-base disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
          style={{ minWidth: '100%' }}
        >
          {isLoading ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            'Se connecter'
          )}
        </button>
      </form>

      {/* Demo credentials */}
      <div className="mt-6 p-4 rounded-xl bg-muted/30 border border-border">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Comptes de démonstration
        </p>
        <div className="flex flex-col gap-2">
          {DEMO_CREDENTIALS.map((cred) => (
            <div key={`cred-${cred.role}`} className="flex items-center justify-between gap-3 py-1.5">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-foreground">{cred.role}</p>
                <p className="text-xs text-muted-foreground truncate">{cred.email}</p>
              </div>
              <button
                type="button"
                onClick={() => fillCredentials(cred.email, cred.password)}
                className="px-3 py-1.5 rounded-lg bg-accent/10 border border-accent/20 text-accent text-xs font-semibold hover:bg-accent/20 transition-colors flex-shrink-0"
              >
                Utiliser
              </button>
            </div>
          ))}
        </div>
      </div>

      <p className="text-center text-sm text-muted-foreground mt-6">
        Pas encore de compte ?{' '}
        <button
          type="button"
          onClick={onSwitchToRegister}
          className="text-accent hover:text-accent-light font-semibold transition-colors"
        >
          Créer un compte
        </button>
      </p>
    </div>
  );
}