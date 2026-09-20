'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import AppLogo from '@/components/ui/AppLogo';
import { Loader2, ShieldCheck, AlertCircle } from 'lucide-react';

export default function ConcepteurLoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) throw signInError;

      const { data: allowed, error: checkError } = await supabase.rpc('is_super_admin');
      if (checkError) throw checkError;

      if (allowed !== true) {
        await supabase.auth.signOut();
        throw new Error('Compte non autorisé pour le portail concepteur.');
      }

      router.replace('/hidden-concepteur-gate/dashboard');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Connexion impossible.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-background flex items-center justify-center px-4 py-10">
      <section className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl">
        <div className="flex items-center gap-3 mb-8">
          <AppLogo size={44} />
          <div>
            <h1 className="font-extrabold text-foreground">Portail concepteur</h1>
            <p className="text-xs text-muted-foreground">JDV GLOBAL CENTER</p>
          </div>
        </div>

        {error && (
          <div className="mb-5 flex gap-3 rounded-xl border border-danger/25 bg-danger/10 p-3 text-sm text-danger">
            <AlertCircle size={17} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-5">
          <div>
            <label htmlFor="concepteur-email" className="mb-1.5 block text-sm font-semibold">Email</label>
            <input id="concepteur-email" type="email" required autoComplete="username" value={email}
              onChange={(e) => setEmail(e.target.value)} className="jdv-input w-full" />
          </div>
          <div>
            <label htmlFor="concepteur-password" className="mb-1.5 block text-sm font-semibold">Mot de passe</label>
            <input id="concepteur-password" type="password" required autoComplete="current-password" value={password}
              onChange={(e) => setPassword(e.target.value)} className="jdv-input w-full" />
          </div>
          <button type="submit" disabled={loading}
            className="btn-primary w-full justify-center py-3 disabled:opacity-60">
            {loading ? <Loader2 size={18} className="animate-spin" /> : <><ShieldCheck size={18} /> Accéder au portail</>}
          </button>
        </form>
      </section>
    </main>
  );
}
