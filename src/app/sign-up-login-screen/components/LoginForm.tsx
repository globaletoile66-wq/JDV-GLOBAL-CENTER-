'use client';

import React, { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';

import { Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';
import { getJDVApplication } from '@/lib/apps/registry';

interface LoginFormData {
  email: string;
  password: string;
  remember: boolean;
}


interface Props {
  onSwitchToRegister: () => void;
  /** When set, login is valid only for users enrolled in this application. */
  appKey?: string;
  redirectTo?: string;
}

export default function LoginForm({ onSwitchToRegister, appKey, redirectTo }: Props) {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { signIn, signOut } = useAuth();
  const supabase = useMemo(() => createClient(), []);
  const application = getJDVApplication(appKey);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<LoginFormData>({ defaultValues: { remember: false } });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      await signIn(data.email, data.password);

      if (appKey) {
        const { data: isSuperAdmin, error: adminError } = await supabase.rpc('is_super_admin');
        if (adminError || isSuperAdmin !== true) {
        const { data: membership, error: membershipError } = await supabase
          .from('app_memberships')
          .select('id,status')
          .eq('user_id', (await supabase.auth.getUser()).data.user?.id ?? '')
          .eq('app_key', appKey)
          .maybeSingle();

        if (membershipError) {
          await signOut();
          setError('root', { message: 'La vérification des droits de cette application est indisponible. Réessayez plus tard ; aucun accès n’a été accordé.' });
          return;
        }
        if (!membership || membership.status !== 'active') {
          toast.info('Votre compte JDV existe déjà. Activez maintenant votre espace pour cette application.');
          router.replace(`/inscription/${appKey}${redirectTo ? `?redirect=${encodeURIComponent(redirectTo)}` : ''}`);
          return;
        }
        }
      }

      toast.success('Connexion réussie.');
      router.push(redirectTo ?? (!appKey || appKey === 'global_center' ? '/user-dashboard' : `/applications/${appKey}/subscription`));
    } catch {
      setError('root', {
        message: 'Connexion impossible. Vérifiez votre adresse email, votre mot de passe et votre inscription à cette application, puis réessayez.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-foreground mb-1">Bon retour</h2>
        <p className="text-sm text-muted-foreground">
          Connectez-vous à votre espace {application?.name ?? 'JDV Global Center'}
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